# Fill AI Backend — Сервис автоматических конспектов уроков

Высоконагруженный бэкенд для приёма медиа-потоков уроков (WebRTC LiveKit или загруженные записи), распознавания речи (Soniox + Groq Whisper), детекции слайдов/доски (OpenCV), VLM-анализа и рендера аннотаций ключевых кадров (Pillow), формирования конспекта уроков по смысловым окнам (Gemini 3.6 Flash), генерации тестов, автоматической проверки ответов учеников и аналитических отчётов для преподавателя.

Разработано строго по спецификации ТЗ v1.0 от 19.09.2026.

---

## 🏗 Архитектура системы

```
Клиент / OBS / Запись
       │ (WebRTC / RTMP / Upload PUT)
       ▼
 ┌─────────────┐       ┌─────────────────┐       ┌────────────────┐
 │   LiveKit   │ <───> │    media-bot    │ ───>  │  Soniox ASR /  │
 │   SFU/RTMP  │       │   (OpenCV/Web)  │       │  Groq Whisper  │
 └─────────────┘       └─────────────────┘       └────────────────┘
                                │                         │
                                ▼                         ▼
                        Redis Streams & Pub/Sub (транскрипт, кадры)
                                │
                                ▼
                       ┌─────────────────┐
                       │    ai-worker    │ ───> Gemini 3.5 Flash-Lite /
                       │   & finalizer   │      Gemini 3.6 Flash
                       └─────────────────┘
                                │
                                ▼
                   PostgreSQL 16 (seq, события, данные)
                         + MinIO S3 (WebP кадры)
                                │
                                ▼
                     FastAPI REST & SSE Stream (v1)
                                │
                                ▼
                        Frontend Клиенты
```

---

## 🚀 Быстрый старт (Docker Compose)

### 1. Подготовка конфигурации
Скопируйте файл переменных окружения и укажите API-ключи:
```bash
cp .env.example .env
```

### 2. Запуск инфраструктуры и сервисов
```bash
docker compose up -d --build
```

Все сервисы стартуют с автоматическими healthcheck'ами:
- **api** (FastAPI): `http://localhost:8000`
- **PostgreSQL 16**: `localhost:5432`
- **Redis 7**: `localhost:6379`
- **MinIO S3 Console**: `http://localhost:9001` (API: `9000`)
- **LiveKit SFU**: `localhost:7880`

### 3. Проверка работоспособности
```bash
curl http://localhost:8000/readyz
# {"status":"ok","checks":{"db":"ok","redis":"ok","s3":"ok"}}
```

---

## 🧪 Запуск автоматических тестов

Тестовый набор покрывает unit-, интеграционные и контрактные сценарии:
```bash
pytest backend/tests/ -v
```

Тесты проверяют:
- Модели SQLAlchemy и миграции Alembic.
- Выделение строго монотонных `seq` без дыр и дубликатов.
- Детектор смены слайдов, проверку размытия Лапласа и ROI.
- Серверный рендер оверлеев и стрелок аннотаций Pillow.
- Нарезку семантических окон конспекта по 240/120/360 с.
- S3 presigned PUT URL и валидацию загруженных медиа-файлов.
- Двухпроходную генерацию тестов и защиту от Prompt Injection при проверке ответов.
- Расчёт успеваемости (квартили, зона риска) и строгую regex-валидацию чисел в narrative отчёта.
- Ограничение бюджета урока ($3.00) и супервизор watchdog для медиа-бота.

---

## 📡 Реальное время: SSE Поток Событий

Подключение к живому потоку урока:
1. Получить короткоживущий токен для `EventSource`:
   `POST /v1/lessons/{id}/sse-token` (Bearer JWT учителя или ученика).
2. Подключиться к SSE:
   `GET /v1/lessons/{id}/events?token={sse_token}&after_seq=N`

**Каталог событий:**
- `lesson.status`: смена статуса (`created`, `live`, `processing`, `ready`, `failed`).
- `transcript.partial`: эфемерный текст распознавания речи (только pub/sub, задержка p95 ≤ 2.5 с).
- `transcript.final`: зафиксированное предложение со `start_ms`, `end_ms`, спикером и `seq`.
- `frame.selected`: ключевой кадр с оригинальным и аннотированным URL в S3, OCR-текстом и геометрией аннотаций.
- `note.block.created` / `note.block.updated`: структурированный блок конспекта с привязкой к кадрам и LaTeX-формулами.
- `summary.ready`: итоговое резюме урока (TL;DR, оглавление, глоссарий, выводы, ДЗ).
- `quiz.ready` / `quiz.published`: готовность теста и публикация для учеников.
- `report.ready`: аналитический отчёт об успеваемости группы (только для преподавателя).
- `error.notice`: уведомление о нештатной ситуации (восстанавливаемой или фатальной).

---

## 📚 Документация и контракты API

- **OpenAPI Спецификация:** `docs/openapi.json`
- **Интерактивный Swagger UI:** `http://localhost:8000/docs`
- **ReDoc UI:** `http://localhost:8000/redoc`
- **Архитектурные решения (ADR):** `docs/DECISIONS.md`
- **Результаты нагрузочных тестов и SLO:** `docs/PERF.md`
- **Спецификация алертов Alertmanager:** `docs/ALERTS.md`

---

## 🛠 Скрипты и утилиты

- **Оценка качества распознавания речи (WER/CER):**
  ```bash
  python scripts/eval_asr.py
  ```
- **Эмуляция и замер задержек урока (Replay E2E):**
  ```bash
  python scripts/replay_lesson.py
  ```
- **Экспорт актуальной схемы OpenAPI:**
  ```bash
  python scripts/generate_openapi.py
  ```
