# ТЗ: Backend сервиса автоматических конспектов уроков

Версия 1.0, 19.09.2026. Документ предназначен для ИИ-исполнителя (кодового агента). Только backend. Frontend не создавать и не изменять: он делается отдельно и опирается на контракты из разделов 10 и 11.

---

## 0. Правила работы для исполнителя

1. Реализуй только то, что описано в этом ТЗ. Frontend, платежи, регистрацию пользователей, мобильные клиенты не трогай.
2. Модели и SDK меняются каждые недели. Перед написанием кода сверь ID моделей, цены, параметры API и версии SDK с официальной документацией (ссылки в разделе 20). Если данные расходятся с ТЗ, используй актуальные и запиши решение в `docs/DECISIONS.md` (что было, что стало, почему).
3. Любое неясное место решай разумным значением по умолчанию и записывай в `docs/DECISIONS.md`. Не останавливайся с вопросами, если решение не критично.
4. Работай по этапам из раздела 18. После каждого этапа проект должен запускаться (`docker compose up`) и проходить тесты этапа.
5. Все внешние вызовы (ASR, LLM, VLM, S3) обёрнуты в адаптеры с единым интерфейсом, таймаутами, ретраями и метриками. Замена провайдера не должна затрагивать бизнес-логику.
6. Не использовать генеративные модели изображений для стрелок и подписей на кадрах. Аннотации рисуются кодом по координатам (раздел 9).
7. Не отправлять в ИИ видео целиком. Резка аудио и кадров делается детерминированным кодом, ИИ получает только отобранные кусочки.
8. Запрещено логировать содержимое уроков (транскрипт, кадры, ответы учеников) на уровне INFO. Только идентификаторы и метрики.

---

## 1. Цель продукта

Преподаватель подключает прямой эфир (или загружает запись). К концу урока у учеников на сайте уже готов подробный конспект: текстовые блоки по ходу урока, ключевые кадры (слайды, доска) с пронумерованными пометками, глоссарий, краткие итоги. После урока автоматически создаётся тест по материалу, а преподаватель получает отчёт об успеваемости группы.

Backend отвечает за: приём и обработку медиа, распознавание речи, отбор кадров, генерацию конспекта, тест, проверку ответов, отчёт, и доставку всего этого фронтенду в реальном времени.

Языки уроков: русский (основной), казахский, английский. Язык задаётся на уровне урока.

---

## 2. Границы (Scope)

Входит:
- Live-эфир через LiveKit (WebRTC из браузера, RTMP из OBS) и загрузка записи (MP4/MKV/WebM/MP3/WAV).
- Стриминговое и пакетное распознавание речи.
- Детекция смены слайда/доски, выбор кадров, OCR/описание кадров, координаты аннотаций.
- Рендер аннотированных кадров на сервере.
- Генерация блоков конспекта в ходе урока и финальный проход.
- Тест (черновик, правка преподавателем, публикация), приём ответов, проверка, отчёт.
- REST API, SSE-поток событий, JWT-авторизация (токены выдаёт внешний сервис).
- Очереди, идемпотентность, наблюдаемость, docker-compose, тесты.

Не входит: frontend, регистрация и управление пользователями, оплата, TTS, генерация картинок нейросетями, PDF-экспорт (опционально после MVP), мобильные приложения.

---

## 2.1. Допущения

- Аутентификацию выполняет внешний сервис. Backend валидирует JWT (RS256 через JWKS URL или HS256 по секрету, настраивается) и читает из него `sub`, `role` (`teacher` | `student` | `admin`), `org_id`.
- Один преподаватель ведёт один эфир в один момент времени. Одновременно идут до 10 уроков на один узел 4 vCPU / 8 GB (значение-цель, подтвердить нагрузочным тестом).
- Экран преподавателя (screen share) публикуется отдельным видеотреком. Если его нет, используется камера, и обрезка области доски задаётся настройкой урока (`roi`).

---

## 3. Итоговый выбор технологий

| Задача | Решение | Причина |
|---|---|---|
| Язык, фреймворк | Python 3.12, FastAPI, Pydantic v2, uvicorn | Async, все ИИ-SDK в Python |
| Медиасервер | LiveKit (self-host или Cloud), `livekit` Python SDK (rtc + api) | WebRTC и RTMP Ingress, серверный бот получает сырые аудио- и видеокадры, Egress для записи |
| Стриминговый ASR (live) | Soniox (real-time WebSocket) | Заявлены русский и казахский, около $0.12/ч, диаризация и тайм-коды включены |
| Пакетный ASR (записи) | Soniox async (около $0.10/ч) | Один провайдер, тот же формат результата |
| Резервный ASR | Whisper Large v3 Turbo на Groq (чанки по 15-30 с) | Дёшево (около $0.67 за 1000 мин), быстро, не зависит от Soniox |
| Анализ кадров (VLM) | `gemini-3.5-flash-lite` | Дёшево и быстро, поддерживает координаты объектов и JSON-схему |
| Конспект, тест, отчёт (LLM) | `gemini-3.6-flash` | Сильное качество за малые деньги, контекст 1M |
| Резервные модели | Настраиваемая цепочка (см. 4.3) | Отказоустойчивость |
| Очереди и pub/sub | Redis 7 (Streams + consumer groups) | Просто, быстро, достаточно для задачи |
| БД | PostgreSQL 16, SQLAlchemy 2 (async), asyncpg, Alembic | Транзакции, JSONB |
| Файлы | S3-совместимое (MinIO локально, Cloudflare R2 или S3 в проде), boto3/aioboto3 | Кадры, записи, куски аудио |
| Обработка кадров | OpenCV (headless), Pillow, imagehash | Детектор смены, рендер аннотаций |
| Нарезка медиа | ffmpeg | Записи, извлечение аудио и кадров |
| VAD | Silero VAD (только для резервного пакетного ASR) | Нарезка речи по паузам |
| SSE | `sse-starlette` | Стабильный SSE с heartbeat |
| Наблюдаемость | structlog (JSON), Prometheus metrics, OpenTelemetry (опционально) | Диагностика и SLO |
| Тесты | pytest, pytest-asyncio, testcontainers, respx | Изолированные и интеграционные |
| Запуск | Docker Compose (dev и первая версия прода) | Быстрый старт |

Версии библиотек: брать последние стабильные на момент реализации и фиксировать в `uv.lock` или `poetry.lock`.

---

## 4. Модели и провайдеры: детали

### 4.1. Актуальные данные (сентябрь 2026, проверить перед кодом)

| Модель / сервис | ID | Цена (вход / выход за 1M токенов) | Заметки |
|---|---|---|---|
| Gemini 3.6 Flash | `gemini-3.6-flash` | $0.75 / $3.75 до 31.12.2026, с 01.01.2027 $1.50 / $7.50 | Контекст 1 048 576, макс. вывод 65 536. Цены вынести в конфиг |
| Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | $0.30 / $2.50 | Мультимодальный вход (текст, изображение, аудио, видео, PDF), по умолчанию почти без размышлений |
| Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite` | $0.25 / $1.50 | Запасной дешёвый вариант |
| Soniox real-time | нет ID, WebSocket API | около $0.12 / час | Русский и казахский заявлены как поддерживаемые. Цифры WER на сайте Soniox маркетинговые, доверять только собственной проверке (раздел 17.3) |
| Soniox async | REST API | около $0.10 / час | Для загруженных записей |
| Whisper Large v3 Turbo (Groq) | по документации Groq | около $0.67 за 1000 мин | Резервный ASR |

Пакетный режим Gemini (Batch/Flex) даёт скидку 50%, но это асинхронно и для live не подходит. Использовать только для отчётов и повторной генерации.

### 4.2. Важные особенности Gemini 3.x API (иначе получишь HTTP 400)

- Параметры `temperature`, `top_p`, `top_k` объявлены устаревшими: не передавать.
- Вместо `thinking_budget` использовать `thinking_level` (minimal / low / medium / high). Для кадров: `minimal`. Для блоков конспекта: `low`. Для теста и отчёта: `medium`.
- `candidate_count` не поддерживается.
- Нельзя завершать запрос предзаполненным непустым ходом модели.
- Поток размышлений тарифицируется как выходные токены. Держать `thinking_level` минимально достаточным.
- Использовать официальный SDK `google-genai`. Проверить, стабилен ли новый Interactions API (`client.interactions.create`), и если да, использовать его, иначе `generate_content`. Скрыть выбор за адаптером.
- Структурированный вывод: JSON-схема из Pydantic (`response_format` / `response_schema`), всегда валидировать Pydantic-моделью на нашей стороне.
- Использовать только платный тариф API. На бесплатном тарифе содержимое запросов может использоваться Google для улучшения продуктов, для учебных данных это недопустимо.
- Координаты объектов: `box_2d = [ymin, xmin, ymax, xmax]`, нормализованы в диапазон 0-1000. Пересчёт в пиксели: `y = v/1000*height`, `x = v/1000*width`.

### 4.3. Цепочки отказоустойчивости (настраиваются через env)

- ASR live: Soniox real-time. При обрыве WebSocket переподключение с экспоненциальной паузой (0.5, 1, 2, 4 с, максимум 5 попыток). Пока идёт переподключение, аудио буферизуется (кольцевой буфер 30 с) и досылается. После 5 неудач включается режим резервного ASR: чанки 15-30 с уходят в Whisper на Groq, `transcript.final` продолжают идти, партиалов нет.
- VLM: `gemini-3.5-flash-lite` → (при неверном JSON после 1 ретрая или низком качестве) `gemini-3.6-flash` → (при недоступности провайдера) запасная модель из конфига `VLM_FALLBACK_MODEL` с OpenAI-совместимым API (кандидаты: GLM-5.3-Flash, Qwen 3.x, GPT-5.6 Luna; проверить актуальные ID и цены, выбрать по наличию vision и JSON-схемы).
- LLM: `gemini-3.6-flash` → `gemini-3.5-flash-lite` (при таймауте, с упрощённым промптом) → `LLM_FALLBACK_MODEL`.
- Circuit breaker на провайдера: после 5 подряд ошибок открывается на 30 с, запросы идут сразу в следующее звено цепочки.

---

## 5. Архитектура

```
Преподаватель ──WebRTC/RTMP──► LiveKit (SFU)
                                   │  бот-участник (media-bot)
                        ┌──────────┴───────────┐
                     аудио                   видео (экран)
                        │                       │
                Soniox WebSocket        детектор смены (1 fps)
                        │                       │
              transcript.partial/final    кадр-кандидат (S3 + запись в БД)
                        │                       │
                        └──────► Redis Streams ◄┘
                                     │
                              ai-worker (N процессов)
                       ┌─────────────┼───────────────┐
                 анализ кадра     закрытие окна    финализация
                 (VLM, JSON)      (LLM, блок)   (итог, тест, отчёт)
                       └─────────────┼───────────────┘
                                     ▼
                       Postgres (события, seq) + S3 (кадры)
                                     │
                          Redis pub/sub  ──►  api (FastAPI)  ──► SSE / REST ──► Frontend
```

Процессы (образы Docker):

| Процесс | Роль |
|---|---|
| `api` | REST, SSE, JWT, выдача токенов LiveKit, presigned-URL для загрузки |
| `media-bot` | Подключается к комнате LiveKit, ведёт аудио и видео, запускает ASR, детектор кадров. Один asyncio-таск на урок, тяжёлые операции OpenCV в `ProcessPoolExecutor` |
| `file-processor` | Обработка загруженных записей (ffmpeg → те же компоненты) |
| `ai-worker` | Читает Redis Streams: анализ кадров, блоки конспекта |
| `finalizer` | По окончании урока: итоговый проход, тест, отчёт |
| `postgres`, `redis`, `minio`, `livekit` | Инфраструктура |

Оркестрация жизненного цикла урока: `POST /lessons/{id}/start` → создаётся комната LiveKit, запускается задача для `media-bot` (сообщение в Redis Stream `stream:bot-commands`). `end` → бот отключается, окно закрывается принудительно, ставится задача `finalize`.

Статусы урока: `created → live → processing → ready` (или `failed`). Для записей: `created → uploaded → processing → ready`.

---

## 6. Аудио и распознавание речи

### 6.1. Live

1. `media-bot` подписывается на аудиотрек преподавателя через `rtc.AudioStream(track, sample_rate=16000, num_channels=1)`.
2. Кадры PCM16 отправляются в Soniox по WebSocket. Конфигурация: язык из урока (`language_hints: [ru]` / `[kk, ru]` / `[en]`), диаризация включена, endpoint detection включён, `expected_terms` из настроек урока передаются как контекст/ключевые термины (проверить поддержку и формат в документации Soniox).
3. Ответы Soniox преобразуются во внутренние события:
   - нефинальные токены → `transcript.partial` (не хранится в БД, публикуется только в Redis pub/sub, не имеет `seq`);
   - финализированные токены, сгруппированные в предложение или паузу ≥ 0.8 с → запись в `transcript_segments` и событие `transcript.final` (с `seq`).
4. Тайм-коды хранить в миллисекундах от начала урока (`start_ms`, `end_ms`). Начало урока = момент `start`; учитывать смещение при переподключении.
5. Кольцевой буфер последних 30 с аудио в памяти на случай обрыва ASR.

### 6.2. Записи

`file-processor` выполняет `ffmpeg -i in -vn -ac 1 -ar 16000 -c:a pcm_s16le out.wav`, отправляет в Soniox async, получает токены с тайм-кодами и сохраняет их тем же кодом, что и live (общий модуль `asr/normalize.py`). Видео обрабатывается параллельно (раздел 7.3).

### 6.3. Резервный ASR

Silero VAD режет речь по паузам на куски 15-30 с (перекрытие 1.5 с), куски идут в Whisper (Groq) параллельно (лимит конкурентности из конфига). Склейка перекрытий по тайм-кодам слов. Использовать `language` из урока.

### 6.4. Требования

- Задержка `transcript.partial` от речи: p95 ≤ 2.5 с.
- Потери слов при переподключении: 0 (за счёт буфера).
- Единый формат сегмента: `{start_ms, end_ms, text, speaker, confidence, lang}`.

---

## 7. Кадры

### 7.1. Получение кадров (live)

`rtc.VideoStream(track)` в `media-bot`. Не обрабатывать каждый кадр: брать не чаще 1 кадра в секунду (`FRAME_SAMPLE_FPS=1`), остальные отбрасывать сразу. Кадр конвертируется в RGB, для детекции уменьшается до 320 px по ширине (градации серого), полный кадр сохраняется в памяти только для потенциальных кандидатов.

### 7.2. Детектор смены слайда / доски (алгоритм, все пороги в конфиге)

1. Считать `diff = mean(|gray_t − gray_prev|)/255` и расстояние perceptual hash (`imagehash.phash`) между текущим и предыдущим сэмплом.
2. Состояние `changing`, если `diff > CHANGE_DIFF_THRESHOLD` (по умолчанию 0.04) или `hamming(phash) > 6`.
3. Состояние `stable`, если в течение `STABLE_SECONDS` (по умолчанию 2.0) `diff < STABLE_DIFF_THRESHOLD` (0.01). Кандидат берётся в первый стабильный момент после `changing`.
4. Фильтры кандидата:
   - размытость: дисперсия Лапласа ниже `MIN_LAPLACIAN_VAR` (по умолчанию 60) → отбросить;
   - дубль: расстояние pHash до любого из последних `DEDUP_LAST_N=8` принятых кадров ≤ 4 → отбросить;
   - антиспам: не чаще одного кадра в `MIN_FRAME_GAP_SEC=4`;
   - потолок: не более `MAX_FRAMES_PER_LESSON=150` и `MAX_FRAMES_PER_WINDOW=6`.
5. Накопление рукописного текста (доска): если изменение небольшое, но постоянно накапливается (рисует преподаватель), принимать кадр при паузе ≥ 2 с без изменений и суммарной площади изменений с прошлого принятого кадра ≥ 3% (`BOARD_ACCUMULATION_MIN_AREA`).
6. Область интереса (`roi`, опционально в настройках урока: `[x, y, w, h]` в долях) применяется до детекции и до сохранения кадра.
7. Кандидат: полный кадр сохраняется в WebP (качество 90) в S3 по ключу `lessons/{lesson_id}/frames/{t_ms}.webp`, запись в `frames` со статусом `candidate`, сообщение в `stream:frames`.

### 7.3. Записи

`ffmpeg -i in -vf "fps=1,scale=640:-1" -f image2pipe ...` для детекции, затем полноразмерные кадры кандидатов извлекаются точечно по тайм-коду (`ffmpeg -ss T -i in -frames:v 1`). Логика детектора общая с live (модуль `frames/detector.py` принимает поток кадров с тайм-кодами и не знает источника). Обрабатывать быстрее реального времени: параллельно N окон (`FILE_PROCESSING_CONCURRENCY`).

---

## 8. ИИ-пайплайн

### 8.1. Шаг A: анализ кадра (`ai-worker`, модель VLM)

Триггер: сообщение в `stream:frames`. Вход:
- изображение кадра (длинная сторона ≤ 1280 px, JPEG q85; если текст мелкий, повышать до 1920);
- транскрипт последних 60 с до кадра и 10 с после (если уже есть);
- тема и `expected_terms` урока;
- краткое резюме предыдущих блоков (≤ 500 токенов).

Выход (строгая JSON-схема, Pydantic):

```json
{
  "keep": true,
  "informativeness": 0.0,
  "kind": "slide|board|code|diagram|screen|other",
  "title": "string, до 80 символов",
  "ocr_markdown": "текст кадра в Markdown, формулы в LaTeX ($...$)",
  "description": "1-3 предложения: что показано и зачем",
  "annotations": [
    {"id": 1, "type": "box|arrow|highlight",
     "box_2d": [ymin, xmin, ymax, xmax],
     "point_2d": [y, x],
     "label": "до 60 символов"}
  ],
  "duplicate_of_previous": false
}
```

Правила промпта: не выдумывать текст, которого нет на кадре; помечать нечитаемое как `[неразборчиво]`; аннотаций не более 5; `id` подряд с 1; каждая аннотация должна указывать на реальный объект кадра; `box_2d` в нормализованных координатах 0-1000; язык подписей = язык урока.

Постобработка (в коде, не в модели): проверка диапазонов координат и `ymin<ymax`, `xmin<xmax`; отбрасывание аннотаций площадью < 0.2% или > 90% кадра; если `keep=false` или `informativeness < KEEP_THRESHOLD` (по умолчанию 0.35), кадр получает статус `rejected` и не показывается. Иначе статус `selected`, рендер аннотаций (раздел 9), событие `frame.selected`.

Таймаут вызова 20 с, один ретрай, затем следующее звено цепочки. Запуск не ждёт закрытия окна: цель p95 ≤ 12 с от стабилизации кадра до события.

### 8.2. Окна и блоки конспекта

Окно закрывается, когда выполнено любое из условий (значения в конфиге):
- прошло ≥ `WINDOW_TARGET_SEC=240` с начала окна, и граница выравнивается на ближайший конец предложения или паузу;
- прошло ≥ `WINDOW_MIN_SEC=120` и смена темы (детектор: появился `selected` кадр с `kind=slide` и заголовком, отличным от предыдущего);
- прошло `WINDOW_MAX_SEC=360` (принудительно);
- урок завершён (закрыть остаток, даже если < 30 с).

Закрытое окно кладётся в `stream:windows`. `ai-worker` собирает вход: транскрипт окна, `selected` кадры окна (с `ocr_markdown`, `description`, `annotations`), резюме предыдущих блоков, тему, `expected_terms`, стиль (раздел 8.4). Модель: LLM. Выход:

```json
{
  "title": "string",
  "summary": "1-2 предложения",
  "body_md": "основной текст блока в Markdown, формулы LaTeX",
  "key_terms": [{"term": "", "definition": ""}],
  "callouts": [{"kind": "tip|warning|example|definition", "text": ""}],
  "frame_refs": [{"frame_id": "uuid", "caption": "", "annotation_ids": [1, 2]}],
  "uncertain": ["места, где транскрипт или кадр неоднозначны"]
}
```

Диаграммы Mermaid по умолчанию выключены (`ENABLE_DIAGRAMS=false`), так как невалидный Mermaid ломает отображение. Включать только после добавления серверной валидации.

Код (не модель) проставляет `t_start_ms`, `t_end_ms`, `seq`, `version=1`, проверяет что все `frame_id` из `frame_refs` существуют в окне, и публикует `note.block.created`. Цель: p95 ≤ 30 с от закрытия окна.

### 8.3. Финальный проход (`finalizer`)

По событию окончания урока и после завершения всех блоков (ожидание не более 120 с; блоки, не успевшие сгенерироваться, создаются упрощённо через Flash-Lite):
- `tldr` (3-5 предложений), `outline` (блоки и заголовки), `glossary` (слитый и дедуплицированный из `key_terms`), `takeaways` (5-8 пунктов), `homework` (если озвучено в уроке, иначе `null`);
- правки существующих блоков разрешены только для очевидных повторов и противоречий: изменённый блок получает `version+1` и событие `note.block.updated`. Массово переписывать блоки запрещено (фронтенд не должен перерисовывать всё);
- событие `summary.ready`; статус урока `ready`.

Цель: p95 ≤ 90 с от окончания урока.

### 8.4. Стиль конспекта (общий промпт-блок)

Аудитория: студенты. Простое, точное объяснение, короткие абзацы, определения выделены, примеры оформлены как `example`, типичные ошибки как `warning`. Не добавлять факты, которых нет в транскрипте или на кадрах, за исключением явно необходимых определений, которые помечаются `(справка)`. Формулы только в LaTeX. Язык вывода = язык урока. Для казахского: использовать корректные буквы (ә, ғ, қ, ң, ө, ұ, ү, һ, і).

Все промпты лежат в `app/ai/prompts/*.md` с версией (`PROMPT_VERSION`), версия записывается в `ai_calls`.

---

## 9. Рендер аннотаций на сервере

Для каждого `selected` кадра:
- `frames/{id}.webp` — оригинал (без изменений);
- `frames/{id}_annotated.webp` — с оверлеем, рендерится Pillow.

Стиль: рамка вокруг `box_2d` (толщина 3 px на 1080p, масштабируется по размеру кадра, цвет из фиксированной палитры высокого контраста), пронумерованный кружок-бейдж с номером аннотации в левом верхнем углу рамки; для типа `arrow` — стрелка от края кадра или бейджа к `point_2d`; `highlight` — полупрозрачная заливка (alpha 0.25). Текстовые подписи на изображение не наносятся (это ломает читаемость и Кириллицу/казахские буквы). Расшифровка бейджей выдаётся фронтенду списком `annotations` с `label`, чтобы он показал легенду рядом.

Бейджи не должны перекрываться: при пересечении сдвигать по свободному углу рамки. Если рамки перекрываются на > 60%, оставить более информативную.

Если понадобится текст на картинке, использовать встроенный шрифт Noto Sans (поддерживает кириллицу и казахские буквы), файл шрифта класть в репозиторий.

В событии и в API отдаются оба URL (оригинал и аннотированный) и сырые аннотации, чтобы фронтенд мог сам рисовать оверлей или показывать готовый вариант.

---

## 10. Доставка данных фронтенду в реальном времени (SSE)

### 10.1. Механика

- Эндпоинт `GET /v1/lessons/{id}/events` отдаёт `text/event-stream`.
- Авторизация: браузерный `EventSource` не умеет заголовки, поэтому принимать короткоживущий (5 мин) SSE-токен в query `?token=...`, получаемый через `POST /v1/lessons/{id}/sse-token` (JWT с правом `sse` и `lesson_id`). Обычный `Authorization: Bearer` тоже поддерживать.
- Heartbeat (комментарий `: ping`) каждые 15 с. Заголовки: `Cache-Control: no-cache`, `X-Accel-Buffering: no`.
- Возобновление: заголовок `Last-Event-ID` или query `?after_seq=N`. Сервер сначала отдаёт из БД пропущенные события (`seq > N`), затем переключается на живые из Redis pub/sub без дыр и дублей (подписаться на канал до чтения из БД, склеить по `seq`).
- События с `seq` (постоянные) хранятся в `lesson_events`. Событие `transcript.partial` эфемерное: без `seq`, только pub/sub.
- Публикация: воркер в одной транзакции записывает данные и строку в `lesson_events` (с выделением `seq` через `UPDATE lessons SET last_seq = last_seq + 1 ... RETURNING last_seq`), после коммита публикует в канал `pub:lesson:{id}`. Каждый экземпляр `api` подписан на каналы своих открытых соединений.
- Доступ: ученик видит события урока своей организации/группы; событие `report.ready` и данные отчёта видит только `teacher` и `admin`.

### 10.2. Формат события

```
id: 128
event: note.block.created
data: {"seq":128,"type":"note.block.created","lesson_id":"...","ts":"2026-09-19T10:15:30Z","data":{...}}
```

### 10.3. Каталог событий

| type | seq | data (кратко) |
|---|---|---|
| `lesson.status` | да | `{status}` |
| `transcript.partial` | нет | `{start_ms, text}` |
| `transcript.final` | да | `{segment_id, start_ms, end_ms, text, speaker}` |
| `frame.selected` | да | `{frame_id, t_ms, kind, title, original_url, annotated_url, width, height, annotations[], ocr_markdown, description}` |
| `note.block.created` | да | полный блок (схема 8.2 + `block_id`, `t_start_ms`, `t_end_ms`, `version`, `frames[]`) |
| `note.block.updated` | да | полный блок с увеличенной `version` |
| `lesson.ended` | да | `{ended_at}` |
| `summary.ready` | да | `{tldr, outline, glossary, takeaways, homework}` |
| `quiz.ready` | да | `{quiz_id, status: "draft"}` (только teacher) |
| `quiz.published` | да | `{quiz_id}` (все) |
| `report.ready` | да | `{report_id}` (только teacher) |
| `error.notice` | да | `{code, message, recoverable}` (без утечки внутренних данных) |

URL файлов: подписанные ссылки S3 со сроком жизни 6 часов либо проксирование через `api` (настройка `MEDIA_URL_MODE=signed|proxy`). Обновлять срок ссылок при `GET /state`.

---

## 11. REST API (префикс `/v1`, формат ошибок RFC 7807 `application/problem+json`)

Роли: T = teacher, S = student, A = admin.

| Метод и путь | Роль | Назначение |
|---|---|---|
| `POST /lessons` | T | Создать урок: `{title, subject, language: ru\|kk\|en, source: live\|upload, expected_terms[], roi?, group_id}`. Ответ: урок и, для live, `livekit_url`, `teacher_token` |
| `GET /lessons/{id}` | T, S | Метаданные и статус |
| `POST /lessons/{id}/start` | T | Начать live: запустить бота |
| `POST /lessons/{id}/end` | T | Завершить: закрыть окно, поставить `finalize` |
| `POST /lessons/{id}/upload-url` | T | Presigned PUT URL для записи |
| `POST /lessons/{id}/process` | T | Запустить обработку загруженной записи |
| `GET /lessons/{id}/state` | T, S | Снимок: статус, `last_seq`, блоки, кадры, `summary`, транскрипт (пагинация `?transcript_after_ms=&limit=`) |
| `GET /lessons/{id}/events` | T, S | SSE (10) |
| `POST /lessons/{id}/sse-token` | T, S | Токен для SSE |
| `PATCH /lessons/{id}/blocks/{block_id}` | T | Правка блока преподавателем: `{title?, body_md?}`, `version+1`, событие `note.block.updated`, поле `edited_by_teacher=true` (ИИ такой блок больше не переписывает) |
| `GET /lessons/{id}/export?format=md` | T, S | Готовый конспект в Markdown с относительными ссылками на кадры |
| `GET /lessons/{id}/quiz` | T | Тест целиком (с ответами и рубриками) |
| `PUT /lessons/{id}/quiz` | T | Правка черновика |
| `POST /lessons/{id}/quiz/publish` | T | Опубликовать (после этого правки запрещены, кроме создания новой версии) |
| `POST /lessons/{id}/quiz/regenerate` | T | Перегенерировать черновик |
| `GET /lessons/{id}/quiz/student` | S | Тест без правильных ответов и рубрик |
| `POST /quiz/{quiz_id}/attempts` | S | Начать попытку (одна попытка на ученика по умолчанию, настраивается) |
| `PUT /attempts/{id}/answers` | S | Сохранить ответы (частично, идемпотентно) |
| `POST /attempts/{id}/submit` | S | Завершить: авто-проверка тестовых, постановка проверки открытых |
| `GET /attempts/{id}` | S (свой), T | Результат и обратная связь |
| `GET /lessons/{id}/report` | T, A | Отчёт |
| `POST /lessons/{id}/report/regenerate` | T | Пересчитать (после новых ответов) |
| `GET /healthz`, `GET /readyz`, `GET /metrics` | сервис | Здоровье, готовность (БД, Redis, S3), Prometheus |

Требования: пагинация курсорная, все POST-эндпоинты создания принимают заголовок `Idempotency-Key`, rate limit на пользователя (Redis, по умолчанию 60 запросов в минуту, 5 подключений SSE на пользователя), CORS по списку из конфига, OpenAPI-схема генерируется автоматически и попадает в `docs/openapi.json`.

---

## 12. База данных (PostgreSQL 16, миграции Alembic)

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY, org_id UUID NOT NULL, group_id UUID, teacher_id UUID NOT NULL,
  title TEXT NOT NULL, subject TEXT, language TEXT NOT NULL CHECK (language IN ('ru','kk','en')),
  source TEXT NOT NULL CHECK (source IN ('live','upload')),
  status TEXT NOT NULL DEFAULT 'created',
  expected_terms TEXT[] DEFAULT '{}', roi JSONB,
  livekit_room TEXT, last_seq BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lesson_events (
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  seq BIGINT NOT NULL, type TEXT NOT NULL, payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id, seq)
);

CREATE TABLE transcript_segments (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  start_ms INT NOT NULL, end_ms INT NOT NULL, text TEXT NOT NULL,
  speaker TEXT, confidence REAL, lang TEXT
);
CREATE INDEX ON transcript_segments (lesson_id, start_ms);

CREATE TABLE frames (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  t_ms INT NOT NULL, status TEXT NOT NULL CHECK (status IN ('candidate','selected','rejected')),
  phash TEXT, s3_key TEXT NOT NULL, s3_key_annotated TEXT,
  width INT, height INT, kind TEXT, title TEXT,
  ocr_markdown TEXT, description TEXT, informativeness REAL,
  annotations JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX ON frames (lesson_id, t_ms);

CREATE TABLE windows (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  idx INT NOT NULL, start_ms INT NOT NULL, end_ms INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', UNIQUE (lesson_id, idx)
);

CREATE TABLE note_blocks (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  window_id UUID REFERENCES windows(id), position INT NOT NULL,
  t_start_ms INT NOT NULL, t_end_ms INT NOT NULL,
  title TEXT NOT NULL, summary TEXT, body_md TEXT NOT NULL,
  key_terms JSONB DEFAULT '[]', callouts JSONB DEFAULT '[]', frame_refs JSONB DEFAULT '[]',
  uncertain JSONB DEFAULT '[]', version INT NOT NULL DEFAULT 1,
  edited_by_teacher BOOLEAN NOT NULL DEFAULT false, UNIQUE (lesson_id, position)
);

CREATE TABLE lesson_summary (
  lesson_id UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  tldr TEXT, outline JSONB, glossary JSONB, takeaways JSONB, homework TEXT
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1, status TEXT NOT NULL CHECK (status IN ('draft','published','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), published_at TIMESTAMPTZ
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY, quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position INT NOT NULL, type TEXT NOT NULL CHECK (type IN ('single','multiple','open')),
  text TEXT NOT NULL, options JSONB, correct JSONB, rubric TEXT, explanation TEXT,
  difficulty TEXT, topic TEXT, block_id UUID REFERENCES note_blocks(id), points REAL NOT NULL DEFAULT 1
);

CREATE TABLE attempts (
  id UUID PRIMARY KEY, quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL, started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ, score REAL, max_score REAL, status TEXT NOT NULL DEFAULT 'in_progress',
  UNIQUE (quiz_id, student_id)
);

CREATE TABLE answers (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  value JSONB, is_correct BOOLEAN, points REAL, feedback TEXT,
  graded_by TEXT CHECK (graded_by IN ('auto','llm','teacher')),
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY, lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id), stats JSONB NOT NULL, narrative JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_calls (
  id BIGSERIAL PRIMARY KEY, lesson_id UUID, task TEXT NOT NULL, provider TEXT NOT NULL,
  model TEXT NOT NULL, prompt_version TEXT, tokens_in INT, tokens_out INT,
  latency_ms INT, cost_usd NUMERIC(10,6), status TEXT NOT NULL, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Индексы под запросы API добавить по факту. Все таблицы с данными учеников хранят `org_id` в родительском уроке; проверка прав на уровне сервисного слоя.

---

## 13. Тест, проверка и отчёт

### 13.1. Генерация теста (`finalizer`, модель LLM, `thinking_level=medium`)

Вход: итоговый конспект (блоки + summary). Выход: 8-10 вопросов по схеме:

```json
{"questions": [{
  "type": "single|multiple|open",
  "text": "", "options": ["", "", "", ""],
  "correct": [0], "rubric": "критерии для open, 2-4 пункта",
  "explanation": "почему правильно",
  "difficulty": "easy|medium|hard", "topic": "",
  "block_position": 3, "points": 1
}]}
```

Состав по умолчанию: 6 `single`, 2 `multiple`, 2 `open` (настраивается). Валидации в коде: у `single` ровно один правильный вариант, у `multiple` от двух; 4 варианта; нет дублей вопросов (сравнение эмбеддингов не нужно, достаточно нормализованного текста и триграмм); у каждого вопроса есть `block_position`, который сопоставляется с реальным блоком; распределение по блокам не более 3 вопросов на один блок. Невалидное отбрасывается, при нехватке вопросов делается один дозапрос.

Проверка качества вторым проходом (более дешёвая модель): для каждого вопроса на вход подаются только блок конспекта и вопрос без ключа, модель отвечает; если ответ не совпал с ключом, вопрос помечается `needs_review=true` в черновике (преподаватель увидит предупреждение).

Тест создаётся как `draft`, событие `quiz.ready` (только teacher). Публикация только преподавателем.

### 13.2. Проверка ответов

- `single` и `multiple`: автоматически кодом (для `multiple`: доля верных без штрафа за лишнее или полный балл только при точном совпадении, режим в конфиге).
- `open`: LLM (Flash-Lite, `thinking_level=low`) получает вопрос, рубрику, ответ ученика и возвращает `{points, feedback}` по схеме. Ограничить длину ответа (2000 символов). Ответ ученика подавать в промпт как данные внутри разделителей, инструкции внутри него игнорировать (защита от prompt injection). Баллы за open можно исправить преподавателем (`graded_by='teacher'`).
- Итог попытки считается кодом после проверки всех вопросов.

### 13.3. Отчёт для преподавателя

Числа считает SQL/Python, LLM их только объясняет (иначе будет выдумка).

`stats` (считает код): по уроку (число учеников, начавших, завершивших, средний и медианный балл, распределение по квартилям), по вопросу (доля верных, типичный неверный вариант), по теме и по блоку (средняя доля верных), список учеников с баллом ниже порога (`AT_RISK_THRESHOLD=0.5`; показывается только teacher/admin).

`narrative` (LLM, `gemini-3.6-flash`, `thinking_level=medium`), на вход подаётся только `stats` и тексты вопросов:

```json
{
  "overview": "3-5 предложений",
  "weak_topics": [{"topic": "", "evidence": "цифры из stats", "block_position": 2, "advice": ""}],
  "strong_topics": [""],
  "common_misconceptions": [{"question_position": 4, "description": ""}],
  "recommendations": ["конкретные шаги для следующего урока"]
}
```

Валидация: любое число или процент в тексте `narrative` должно присутствовать в `stats` (простая проверка регулярным выражением; при несоответствии повторить запрос с ошибкой, затем вернуть отчёт без `narrative` и пометкой). Отчёт обновляется по `POST /report/regenerate` и автоматически по таймеру: через N часов после публикации теста (`REPORT_AUTO_REFRESH_HOURS=24`).

---

## 14. Надёжность

- Redis Streams: consumer group `ai-workers` на каждом стриме (`stream:frames`, `stream:windows`, `stream:finalize`, `stream:grading`). `XACK` только после успешного коммита в БД. Зависшие сообщения (без ACK дольше 90 с) забирает `XAUTOCLAIM`. После 3 неудач сообщение уходит в `stream:dlq` с причиной, приходит метрика и событие `error.notice` (для блока: создаётся упрощённый блок из транскрипта без кадров, чтобы конспект не имел дыр).
- Идемпотентность: ключи `lesson_id + window_idx`, `lesson_id + frame_id`, уникальные ограничения в БД (`UNIQUE (lesson_id, position)` и т. п.). Повторная обработка не создаёт дубликатов и не увеличивает `seq` лишний раз.
- Таймауты: ASR-соединение — ping/pong 10 с, VLM 20 с, LLM блока 60 с, LLM теста и отчёта 120 с, S3 10 с.
- Ретраи: экспоненциальная пауза с джиттером (0.5, 1.5, 4 с), максимум 3, только для ошибок 429/5xx/таймаутов. Ошибки 4xx (кроме 429) не ретраятся, сразу звено цепочки или отказ.
- Ограничение параллелизма: семафоры на провайдера (`GEMINI_MAX_CONCURRENCY`, `SONIOX_MAX_STREAMS`), очередь с приоритетом (live-задачи выше файловых и отчётов).
- Бот: watchdog. Если `media-bot` не отправлял heartbeat 20 с, оркестратор перезапускает его для комнаты; при перезапуске состояние (последний `t_ms`, текущее окно, последние pHash) восстанавливается из БД/Redis.
- Graceful shutdown воркеров: дообработать текущую задачу, вернуть непринятые сообщения.
- Ограничение бюджета: перед каждым внешним вызовом проверять `lessons.cost_usd < MAX_COST_USD_PER_LESSON` (по умолчанию 3.0). При превышении: переключение на дешёвые модели, отказ от повторного анализа кадров, событие `error.notice` с кодом `budget_degraded`. Стоимость каждого вызова пишется в `ai_calls`, суммируется в `lessons.cost_usd` (цены из конфига).

---

## 15. Нефункциональные требования

### 15.1. SLO (p95, измерять метриками)

| Этап | Цель |
|---|---|
| `transcript.partial` после произнесённой речи | ≤ 2.5 с |
| `frame.selected` после стабилизации кадра | ≤ 12 с |
| `note.block.created` после закрытия окна | ≤ 30 с |
| Итоговый конспект после окончания урока | ≤ 90 с |
| Черновик теста после окончания урока | ≤ 150 с |
| Ответ `GET /state` | ≤ 300 мс |
| Доступность API | 99.5% |

Цифры-цели, подтвердить измерениями на реальных уроках и зафиксировать фактические значения в `docs/PERF.md`.

### 15.2. Ориентировочная стоимость (оценка, уточнить по `ai_calls`)

Урок 90 минут, около 60 принятых кадров, около 22 окон: ASR около $0.18, анализ кадров (Flash-Lite) около $0.10-0.15, блоки (3.6 Flash) около $0.15-0.25, итог, тест, отчёт около $0.05-0.10. Итого порядка $0.4-0.7 за урок при промо-цене 3.6 Flash. После 01.01.2027 цена Flash-моделей 3.x удваивается, порядка $0.6-0.9. Задача исполнителя: замерить фактические числа и вынести цены в конфиг.

### 15.3. Безопасность и приватность

- Обязательная проверка JWT на каждом эндпоинте, проверка принадлежности урока `org_id`, ученик видит только свои попытки.
- Секреты только через переменные окружения / secret store; секреты не попадают в логи и в образы.
- Согласие на запись: поле `consent_confirmed` при создании урока обязательно `true` для старта live.
- Хранение: срок хранения сырых кадров-кандидатов и аудио-кусков `RAW_RETENTION_DAYS` (по умолчанию 30), конспект и тест хранятся до удаления организацией. Job очистки по расписанию.
- Использовать только платные API-ключи провайдеров, без обучения на данных (проверить условия провайдеров и записать в `docs/DECISIONS.md`).
- Ввод пользователя (ответы учеников, правки) считать недоверенным: в промпты подавать только как данные, экранировать разделители.
- Загрузка файлов: валидация MIME и размера (по умолчанию ≤ 4 GB), проверка ffprobe, ограничение длительности (≤ 4 ч), обработка только в изолированном контейнере без доступа к секретам.

### 15.4. Наблюдаемость

- Логи: structlog JSON, поля `lesson_id`, `task`, `request_id`; без содержимого.
- Метрики Prometheus: латентность и ошибки по провайдерам, размер очередей и лаг consumer group, число активных уроков и SSE-соединений, SLO-гистограммы из 15.1, стоимость по урокам, доля DLQ.
- Алерты (описать в `docs/ALERTS.md`): лаг очереди > 60 с, DLQ > 0, доля ошибок провайдера > 5% за 5 минут, `cost_usd` урока > лимита.

---

## 16. Репозиторий, конфигурация, запуск

```
backend/
  app/
    api/            # роуты, зависимости, SSE, авторизация, схемы ответов
    core/           # config, db, redis, s3, events (публикация с seq), security, logging
    media/          # livekit_bot.py, audio_pipeline.py, video_pipeline.py
    asr/            # soniox_stream.py, soniox_async.py, groq_whisper.py, normalize.py
    frames/         # detector.py, dedup.py, render.py (аннотации), fonts/
    ai/
      providers/    # gemini.py, openai_compat.py (адаптеры), base.py, circuit_breaker.py
      prompts/      # frame_analysis.md, note_block.md, final_pass.md, quiz.md, grade_open.md, report.md
      schemas.py    # Pydantic-схемы ответов моделей
      pipeline.py   # анализ кадра, блок, финал
    quiz/           # generation.py, grading.py, report.py
    workers/        # ai_worker.py, finalizer.py, file_processor.py, bot_supervisor.py
    models/         # SQLAlchemy
  migrations/       # Alembic
  scripts/          # replay_lesson.py, eval_asr.py, seed.py
  tests/            # unit, integration, e2e, fixtures (маленькие видео)
  docs/             # DECISIONS.md, PERF.md, ALERTS.md, openapi.json
  docker-compose.yml, Dockerfile, pyproject.toml, .env.example
```

Единый интерфейс провайдеров (обязательно):

```python
class AsrStream(Protocol):
    async def send_audio(self, pcm16: bytes) -> None: ...
    def events(self) -> AsyncIterator[AsrEvent]: ...   # partial | final
    async def close(self) -> None: ...

class VisionLLM(Protocol):
    async def analyze_frame(self, req: FrameRequest) -> FrameAnalysis: ...

class TextLLM(Protocol):
    async def generate(self, task: str, prompt: PromptBundle, schema: type[BaseModel]) -> BaseModel: ...
```

Переменные окружения (полный список в `.env.example`): `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SONIOX_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `VLM_MODEL=gemini-3.5-flash-lite`, `VLM_ESCALATION_MODEL=gemini-3.6-flash`, `LLM_MODEL=gemini-3.6-flash`, `LLM_LIGHT_MODEL=gemini-3.5-flash-lite`, `VLM_FALLBACK_MODEL`, `LLM_FALLBACK_MODEL`, `FALLBACK_BASE_URL`, `FALLBACK_API_KEY`, `MODEL_PRICES_JSON`, `JWT_ISSUER`, `JWKS_URL` или `JWT_SECRET`, `CORS_ORIGINS`, `MAX_COST_USD_PER_LESSON`, `RAW_RETENTION_DAYS`, все пороги детектора и окон из разделов 7-8.

`docker-compose.yml`: сервисы `api`, `media-bot`, `ai-worker` (реплики 2), `finalizer`, `file-processor`, `postgres`, `redis`, `minio` (+ инициализация бакета), `livekit` (dev-конфиг). Healthcheck у каждого. Один `make dev` (или `just dev`) поднимает всё и применяет миграции.

---

## 17. Тестирование и приёмка

### 17.1. Автотесты

- Unit: детектор смены (синтетические видео: смена слайда, плавное появление текста, рука перед камерой, размытие), дедупликация, рендер аннотаций (снапшот-тесты), нормализация ASR-токенов в сегменты, пересчёт координат 0-1000 → пиксели, валидаторы схем, расчёт статистики отчёта, проверка чисел в narrative.
- Контрактные тесты адаптеров на записанных ответах (respx/VCR): валидный JSON, битый JSON, таймаут, 429, 5xx, обрыв стрима.
- Интеграционные (testcontainers: Postgres, Redis, MinIO): полный прогон записи 3-5 минут с замоканными ИИ-провайдерами; проверка `seq` без пропусков и дублей, идемпотентности при повторной доставке сообщения, возобновления SSE по `Last-Event-ID`.
- E2E replay: `scripts/replay_lesson.py` проигрывает записанный урок как live в комнату LiveKit, слушает SSE и печатает задержки по каждому этапу.
- Тесты авторизации: ученик не видит чужие попытки, отчёт и ключи ответов недоступны роли `student`.

### 17.2. Нагрузочный тест

Скрипт запускает 10 параллельных уроков (replay) и 200 SSE-клиентов. Записать в `docs/PERF.md`: задержки по этапам, использование CPU и памяти, стоимость, размеры очередей.

### 17.3. Оценка качества (обязательно до сдачи)

- `scripts/eval_asr.py`: WER/CER на 10 размеченных фрагментах реальных уроков по 3-5 минут (русский и казахский отдельно) для Soniox и резервного Whisper. Результат в `docs/DECISIONS.md`. Если WER Soniox по казахскому хуже порога (по умолчанию 20%), добавить в решения рекомендацию и переключаемый режим.
- Ручная выборка 20 кадров: доля корректных `box_2d` (визуально), доля отброшенных полезных кадров, доля ложных срабатываний детектора.
- Ручная выборка 10 блоков: фактологические ошибки, пропуски, галлюцинации (помечать в таблице).

### 17.4. Критерии приёмки

1. `docker compose up` поднимает всё, `GET /readyz` зелёный.
2. Live-урок 20 минут (replay): все события приходят в SSE, `seq` без дыр, итоговый конспект и черновик теста создаются автоматически.
3. Загрузка записи 60 минут обрабатывается ≤ 15 минут (цель).
4. Обрыв Soniox, VLM или LLM (имитация) не останавливает урок: срабатывают ретраи и резервные звенья, блок создаётся хотя бы в упрощённом виде.
5. Перезапуск `media-bot` и `ai-worker` посреди урока не приводит к дубликатам и потерянным блокам.
6. Ученик не может получить правильные ответы и отчёт (проверено тестами).
7. Метрики SLO собираются, отчёт `docs/PERF.md` заполнен фактическими числами.
8. Все тесты зелёные, покрытие ключевых модулей (`frames`, `asr/normalize`, `quiz`, `core/events`) ≥ 80%.

---

## 18. План работ (2 недели)

| Дни | Этап | Результат |
|---|---|---|
| 1-2 | Каркас | Репозиторий, Docker Compose, миграции, `core` (config, db, redis, s3, events с `seq`), JWT, `healthz`, CI |
| 2-4 | Аудио и ASR | `media-bot` с LiveKit, Soniox stream, нормализация, `transcript.*` события, SSE с возобновлением, резервный Whisper |
| 4-6 | Кадры | Детектор, дедупликация, сохранение в S3, Redis Stream, VLM-адаптер, анализ кадра, рендер аннотаций, `frame.selected` |
| 6-8 | Конспект | Окна, блок конспекта, финальный проход, правка преподавателем, экспорт Markdown |
| 8-9 | Записи | `file-processor`, Soniox async, общий пайплайн, параллельная обработка окон |
| 9-11 | Тест и отчёт | Генерация, проверка качества вопросов, приём и проверка ответов, отчёт со статистикой и narrative |
| 11-12 | Надёжность | DLQ, XAUTOCLAIM, circuit breaker, бюджет, watchdog бота, ретеншн |
| 12-13 | Качество и нагрузка | `eval_asr`, ручные выборки, нагрузочный тест, подбор порогов, `docs/PERF.md` |
| 14 | Сдача | Документация (`README`, `DECISIONS`, `ALERTS`, `openapi.json`), финальная приёмка по 17.4 |

---

## 19. Риски и открытые вопросы

| Риск | Что делать |
|---|---|
| Качество казахского в ASR ниже заявленного | Замер по 17.3, переключаемый провайдер, ручная правка терминов через `expected_terms` |
| Рост цены Gemini Flash с 01.01.2027 | Цены и модели в конфиге, автоматическое использование Flash-Lite для менее сложных задач, замер стоимости на урок |
| Смена API Gemini (Interactions API, параметры 3.x) | Адаптер, контрактные тесты, проверка документации перед релизом |
| Плохие кадры (рука, блики, камера вместо экрана) | Фильтры детектора, `roi`, оценка `informativeness`, ручное скрытие кадра преподавателем |
| Неверные координаты аннотаций | Постобработка и проверка диапазонов, эскалация на `gemini-3.6-flash`, выборочная ручная оценка |
| Галлюцинации в конспекте и тесте | Промпты «не выдумывать», поле `uncertain`, второй проход проверки вопросов, редактирование преподавателем |
| Перегрузка CPU при обработке видео | Сэмплинг 1 fps, `ProcessPoolExecutor`, масштабирование `media-bot` по процессам |
| Персональные данные учеников и детей | Согласие, ретеншн, роли, отсутствие содержимого в логах, платный тариф провайдеров без обучения на данных |

Открытые вопросы, ответы на которые нужны от заказчика (до этого действуют значения по умолчанию из ТЗ): требования университета к формату конспекта (обязательные разделы), язык интерфейса ответов ИИ для казахских уроков (kk или ru), нужна ли привязка к группам и расписанию, разрешено ли хранить записи после обработки, нужен ли PDF-экспорт.

---

## 20. Ссылки на документацию (сверять перед реализацией)

- Gemini API, цены и модели: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API, понимание изображений и координаты: https://ai.google.dev/gemini-api/docs/image-understanding
- Gemini, руководство по миграции на 3.x: раздел Migration в документации Gemini API
- LiveKit, обработка сырых треков: https://docs.livekit.io/transport/media/raw-tracks.md
- LiveKit Python SDK: https://github.com/livekit/python-sdks
- LiveKit Ingress / Egress: документация docs.livekit.io
- Soniox, цены и языки: https://soniox.com/pricing и документация API Soniox (real-time WebSocket, async)
- Groq, Whisper Large v3 Turbo: документация Groq Speech-to-Text
- Redis Streams: https://redis.io/docs/latest/develop/data-types/streams/
- Рейтинги для пересмотра выбора моделей: https://arena.ai/leaderboard, https://artificialanalysis.ai
