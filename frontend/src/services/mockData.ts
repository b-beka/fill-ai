import { Lesson, NoteBlock, Slide, TranscriptSegment, LessonAttendanceReport } from '../types/lesson';

export interface CurriculumTrack {
  id: string;
  name: string;
  category: string;
  lesson: Lesson;
  blocks: NoteBlock[];
  slides: Slide[];
  live_question: {
    id: string;
    eyebrow: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      percent: number;
      is_correct: boolean;
      explanation: string;
    }>;
    answered_count: number;
    total_students: number;
    insight: string;
  };
}

// 1. БИОЛОГИЯ И МЕДИЦИНА
export const TRACK_BIOLOGY: CurriculumTrack = {
  id: 'biology',
  name: 'Биология: Клетка и биоэнергетика',
  category: 'Естественные науки',
  lesson: {
    id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
    org_id: '11111111-1111-1111-1111-111111111111',
    teacher_id: '33333333-3333-3333-3333-333333333333',
    title: 'Биология: Клетка и её строение',
    subject: 'Биология (9 «Б» класс)',
    language: 'ru',
    source: 'live',
    status: 'live',
    visibility_mode: 'moderated',
    expected_terms: ['мембрана', 'фосфолипидный бислой', 'АТФ', 'митохондрия', 'рецепторный белок'],
    last_seq: 18,
    cost_usd: 0.24,
    started_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  slides: [
    {
      id: 's1',
      lesson_id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
      slide_idx: 1,
      s3_key: 'slides/slide_1.webp',
      phash: 'a1b2c3d4e5f60102',
      extracted_text: 'Строение эукариотической клетки: мембрана, ядро, цитоплазма, органоиды.',
      terms: ['мембрана', 'органоиды', 'цитоплазма'],
      width: 1920,
      height: 1080,
    },
    {
      id: 's2',
      lesson_id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
      slide_idx: 2,
      s3_key: 'slides/slide_2.webp',
      phash: 'f6e5d4c3b2a10304',
      extracted_text: 'Рецепторные белки и трансмембранный транспорт: ионные каналы и сигнальные молекулы.',
      terms: ['рецепторный белок', 'лиганд', 'ионные каналы'],
      width: 1920,
      height: 1080,
    },
  ],
  blocks: [
    {
      id: 'b1-membrane-structure',
      lesson_id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
      position: 1,
      t_start_ms: 0,
      t_end_ms: 240000,
      title: 'Строение клеточной мембраны и липидный барьер',
      body_md: 'Клеточная мембрана отделяет живое содержимое клетки от внешней агрессивной среды и обеспечивает избирательную проницаемость. Преподаватель подчеркивает: основа мембраны — двойной слой фосфолипидов. Гидрофильные «головки» молекул развернуты наружу к водным растворам, а гидрофобные «хвосты» спрятаны внутрь бислоя.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'diagram',
        title: 'Схема фосфолипидного бислоя',
        caption: 'Кадр 04:15. Двойной слой липидов и встроенные белковые каналы',
        badge: 'Слайд 1',
        align: 'right',
      },
    },
    {
      id: 'b2-receptor-proteins',
      lesson_id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
      position: 2,
      t_start_ms: 240000,
      t_end_ms: 480000,
      title: 'Рецепторные белки и передача внешних сигналов',
      body_md: 'На слайде лектор детально разбирает, как клетка реагирует на внешние гормоны и медиаторы. Сигнальная молекула (лиганд) физически связывается с внешней частью рецептора по принципу «ключ-замок», вызывая изменение формы белка и запуск каскада реакций внутри цитоплазмы.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'slide',
        title: 'Трансмембранный рецептор',
        caption: 'Кадр 08:30. Векторный слайд презентации: связывание сигнальной молекулы',
        badge: 'Слайд 2',
        align: 'left',
      },
    },
    {
      id: 'b3-mitochondria-energy',
      lesson_id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
      position: 3,
      t_start_ms: 480000,
      t_end_ms: 720000,
      title: 'Синтез АТФ на кристах митохондрий',
      body_md: 'Митохондрии выполняют роль клеточных электростанций. На внутренних складках (кристах) сосредоточены ферментные комплексы дыхательной цепи. Энергия окисления органических веществ расходуется на синтез молекул АТФ — универсального аккумулятора энергии клетки.',
      status: 'pending_review',
      version: 1,
      media_artifact: {
        type: 'audio',
        title: 'Аудио-пояснение преподавателя',
        audio_duration: '0:45',
        caption: 'Фрагмент 12:10. Преподаватель объясняет разницу между анаэробным гликолизом и аэробным дыханием',
        badge: 'Аудио 12:10',
        align: 'right',
      },
    },
  ],
  live_question: {
    id: 'q1-atp',
    eyebrow: 'Экспресс-задача классу',
    text: 'Какая органелла клетки отвечает за синтез молекул АТФ?',
    options: [
      {
        id: 'A',
        text: 'Митохондрия',
        percent: 68,
        is_correct: true,
        explanation: 'Верно! Именно на кристах митохондрий происходит окислительное фосфорилирование и синтез АТФ.',
      },
      {
        id: 'B',
        text: 'Рибосома',
        percent: 22,
        is_correct: false,
        explanation: 'Ошибка: рибосомы синтезируют белки (полипептидные цепи), а не АТФ.',
      },
      {
        id: 'C',
        text: 'Комплекс Гольджи',
        percent: 7,
        is_correct: false,
        explanation: 'Ошибка: аппарат Гольджи модифицирует и упаковывает белки для экспорта.',
      },
      {
        id: 'D',
        text: 'Лизосома',
        percent: 3,
        is_correct: false,
        explanation: 'Ошибка: лизосомы расщепляют биополимеры гидролитическими ферментами.',
      },
    ],
    answered_count: 24,
    total_students: 28,
    insight: '24 ученика ответили, точность 68%. 6 человек перепутали с рибосомами — рекомендуется кратко подчеркнуть разницу между синтезом белка и выработкой энергии.',
  },
};

// 2. АНГЛИЙСКИЙ ЯЗЫК И ПОДГОТОВКА К IELTS
export const TRACK_IELTS: CurriculumTrack = {
  id: 'ielts',
  name: 'IELTS Academic: Writing Task 2',
  category: 'Иностранные языки',
  lesson: {
    id: 'ielts-001',
    org_id: '11111111-1111-1111-1111-111111111111',
    teacher_id: '33333333-3333-3333-3333-333333333333',
    title: 'IELTS Academic Writing: Структура эссе Band 8+',
    subject: 'English (IELTS Preparation)',
    language: 'ru',
    source: 'live',
    status: 'live',
    visibility_mode: 'moderated',
    expected_terms: ['PEEL structure', 'Topic sentence', 'Hedging', 'Lexical Resource', 'Coherence and Cohesion'],
    last_seq: 14,
    cost_usd: 0.19,
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  slides: [
    {
      id: 'ielts-s1',
      lesson_id: 'ielts-001',
      slide_idx: 1,
      s3_key: 'slides/ielts_1.webp',
      phash: '9988776655443322',
      extracted_text: 'Body Paragraph Architecture: Point, Explanation, Evidence, Link (PEEL).',
      terms: ['PEEL', 'Topic Sentence', 'Link'],
      width: 1920,
      height: 1080,
    },
  ],
  blocks: [
    {
      id: 'ielts-b1',
      lesson_id: 'ielts-001',
      position: 1,
      t_start_ms: 0,
      t_end_ms: 180000,
      title: 'Академическая скромность (Hedging) в аргументации',
      body_md: 'Преподаватель предостерегает: категоричные утверждения ("It is a 100% proven fact", "I strongly believe") снижают балл за Task Achievement. Экзаменаторы IELTS в академическом модуле требуют использования модального смягчения (hedging). Вместо прямолинейности используем устойчивые академические вводные конструкции: "It is widely argued that...", "Evidence tends to suggest that...".',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'audio',
        title: 'Образец академической интонации',
        audio_duration: '0:18',
        caption: 'Кадр 06:20. Преподаватель демонстрирует интонационное выделение в предложении со связкой Nevertheless',
        badge: 'Аудиопример',
        align: 'left',
      },
    },
    {
      id: 'ielts-b2',
      lesson_id: 'ielts-001',
      position: 2,
      t_start_ms: 180000,
      t_end_ms: 360000,
      title: 'Архитектура абзаца по модели PEEL',
      body_md: 'Каждый аргументирующий абзац должен состоять из четырех логических шагов: тезис (Point), подробное обоснование механизма (Explanation), конкретный иллюстрирующий факт или статистика (Evidence) и связка с темой эссе (Link). Без шага Link абзац кажется оборванным.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'slide',
        title: 'Схема PEEL на слайде',
        caption: 'Кадр 11:40. Слайд с декомпозицией абзаца эссе на 4 смысловых элемента',
        badge: 'Слайд 1',
        align: 'right',
      },
    },
  ],
  live_question: {
    id: 'ielts-q1',
    eyebrow: 'Практика академического стиля',
    text: 'Какая фраза наиболее соответствует академическому стилю Band 8+ вместо "Everyone knows that pollution is bad"?',
    options: [
      {
        id: 'A',
        text: 'It is widely acknowledged that environmental degradation poses substantial risks.',
        percent: 75,
        is_correct: true,
        explanation: 'Верно! Использована академическая пассивная конструкция (It is widely acknowledged) и точная лексика (environmental degradation).',
      },
      {
        id: 'B',
        text: 'I strongly think that dirty air kills a lot of people.',
        percent: 15,
        is_correct: false,
        explanation: 'Ошибка: разговорная лексика (dirty air) и избыточная субъективность (I strongly think).',
      },
      {
        id: 'C',
        text: 'Needless to say, nature is destroyed completely.',
        percent: 10,
        is_correct: false,
        explanation: 'Ошибка: штамп (needless to say) и преувеличение без обоснования (destroyed completely).',
      },
    ],
    answered_count: 22,
    total_students: 25,
    insight: '75% выбрали академический вариант. 3 студента выбрали субъективную фразу (I strongly think). Напомните классу правило исключения местоимения I из основных абзацев.',
  },
};

// 3. ПРОГРАММИРОВАНИЕ: PYTHON & BACKEND
export const TRACK_CODING: CurriculumTrack = {
  id: 'coding',
  name: 'Python: Асинхронное программирование и AsyncIO',
  category: 'Программирование и IT',
  lesson: {
    id: 'py-001',
    org_id: '11111111-1111-1111-1111-111111111111',
    teacher_id: '33333333-3333-3333-3333-333333333333',
    title: 'Python: Event Loop, Coroutines и Task Management',
    subject: 'Backend разработка (Senior Python)',
    language: 'ru',
    source: 'live',
    status: 'live',
    visibility_mode: 'moderated',
    expected_terms: ['Event Loop', 'Coroutine', 'async/await', 'Blocking call', 'asyncio.gather'],
    last_seq: 22,
    cost_usd: 0.28,
    started_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  slides: [],
  blocks: [
    {
      id: 'py-b1',
      lesson_id: 'py-001',
      position: 1,
      t_start_ms: 0,
      t_end_ms: 300000,
      title: 'Блокирующие вызовы внутри Event Loop',
      body_md: 'Преподаватель запускает пример и показывает вывод терминала: синхронная функция time.sleep парализует весь сервер на 5 секунд. В этот момент асинхронный цикл событий (Event Loop) не может переключиться на обработку запросов других пользователей, так как системный поток заблокирован.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'code',
        title: 'Антипаттерн блокировки потока',
        language: 'python',
        code_snippet: `async def get_user_data(user_id: int):
    # ОШИБКА: блокирующий синхронный вызов
    time.sleep(5) 
    return {"id": user_id, "status": "active"}`,
        caption: 'Кадр 14:20. Код с экрана лектора: синхронный time.sleep блокирует выполнение',
        badge: 'Python Код',
        align: 'left',
      },
    },
    {
      id: 'py-b2',
      lesson_id: 'py-001',
      position: 2,
      t_start_ms: 300000,
      t_end_ms: 600000,
      title: 'Параллельное выполнение через asyncio.gather',
      body_md: 'Правильное решение, демонстрируемое лектором — использование неблокирующего await asyncio.sleep(5) и группировка сопрограмм через asyncio.gather. При таком подходе три сетевых запроса суммарной длительностью 15 секунд выполняются параллельно ровно за 5 секунд.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'code',
        title: 'Оптимизированный неблокирующий вызов',
        language: 'python',
        code_snippet: `async def fetch_all(ids: list[int]):
    tasks = [fetch_one(i) for i in ids]
    # Все запросы выполняются параллельно
    return await asyncio.gather(*tasks)`,
        caption: 'Кадр 19:45. Использование asyncio.gather для конкурентного выполнения',
        badge: 'Рефакторинг',
        align: 'right',
      },
    },
  ],
  live_question: {
    id: 'py-q1',
    eyebrow: 'Анализ производительности',
    text: 'Если запустить три корутины по 2 секунды каждая через await asyncio.gather(c1, c2, c3), сколько суммарно займет выполнение?',
    options: [
      {
        id: 'A',
        text: 'Около 2 секунд',
        percent: 88,
        is_correct: true,
        explanation: 'Верно! Так как корутины выполняются конкурентно в неблокирующем цикле, общее время равно длительности самой долгой задачи (~2 с).',
      },
      {
        id: 'B',
        text: 'Ровно 6 секунд',
        percent: 8,
        is_correct: false,
        explanation: 'Ошибка: 6 секунд заняло бы последовательное выполнение, а gather запускает их одновременно.',
      },
      {
        id: 'C',
        text: '0 секунд (фоновая задача)',
        percent: 4,
        is_correct: false,
        explanation: 'Ошибка: вызов await блокирует управление текущей функции до завершения всех переданных задач.',
      },
    ],
    answered_count: 26,
    total_students: 27,
    insight: '88% верно поняли параллелизм asyncio.gather. Двое ответили 6 секунд (перепутали с последовательным циклом).',
  },
};

// 4. ПРИКЛАДНОЙ КУРС: ПАРИКМАХЕРСКОЕ ДЕЛО И СТИЛИСТИКА
export const TRACK_HAIRDRESSING: CurriculumTrack = {
  id: 'hairdressing',
  name: 'Парикмахерское дело: Градуированные стрижки',
  category: 'Прикладные профессии и ремесло',
  lesson: {
    id: 'hair-001',
    org_id: '11111111-1111-1111-1111-111111111111',
    teacher_id: '33333333-3333-3333-3333-333333333333',
    title: 'Техника точной градуировки затылочной зоны',
    subject: 'Колористика и стрижки (Школа стилистов)',
    language: 'ru',
    source: 'live',
    status: 'live',
    visibility_mode: 'moderated',
    expected_terms: ['угол оттяжки 45°', 'диагональный пробор', 'линия среза', 'контрольная прядь', 'градуировка'],
    last_seq: 16,
    cost_usd: 0.15,
    started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  slides: [],
  blocks: [
    {
      id: 'hair-b1',
      lesson_id: 'hair-001',
      position: 1,
      t_start_ms: 0,
      t_end_ms: 240000,
      title: 'Угол оттяжки пряди и сохранение веса затылка',
      body_md: 'Мастер детально показывает положение рук: при градуировке затылка угол оттяжки пряди должен составлять ровно 45 градусов относительно поверхности головы. Если поднять прядь выше (до 90 градусов), массив волос на затылке истончится, и получится резкая неровная ступенька вместо плавного перехода.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'photo',
        title: 'Угол оттяжки пряди',
        caption: 'Кадр 05:40. Положение пальцев мастера: наклон расчески 45° к плоскости шеи',
        badge: 'Фото техники',
        align: 'left',
      },
    },
    {
      id: 'hair-b2',
      lesson_id: 'hair-001',
      position: 2,
      t_start_ms: 240000,
      t_end_ms: 480000,
      title: 'Положение ножниц и работа контрольной пряди',
      body_md: 'Срез выполняется кончиками прямых ножниц, не заходя за второй сустав пальцев, чтобы не травмировать кожу и не сбить угол. Каждая следующая секция подтягивается к предыдущей (подвижная контрольная прядь), обеспечивая ровный каскадный прирост длины.',
      status: 'approved',
      version: 1,
      media_artifact: {
        type: 'audio',
        title: 'Совет преподавателя по захвату пряди',
        audio_duration: '0:22',
        caption: 'Фрагмент 09:15. Мастер объясняет, почему нельзя натягивать мокрые волосы с усилием',
        badge: 'Аудиосовет',
        align: 'right',
      },
    },
  ],
  live_question: {
    id: 'hair-q1',
    eyebrow: 'Проверка техники стрижки',
    text: 'Что произойдет с затылочной зоной, если вместо угла оттяжки 45° мастер поднимет прядь до 90°?',
    options: [
      {
        id: 'A',
        text: 'Потеряется плотность и вес, образуется резкая нежелательная ступенька.',
        percent: 85,
        is_correct: true,
        explanation: 'Верно! Угол 90° создает сильную слоистость и срезает массу затылка, образуя резкий переход.',
      },
      {
        id: 'B',
        text: 'Стрижка станет идеально ровным прямым каре без слоев.',
        percent: 10,
        is_correct: false,
        explanation: 'Ошибка: каре без слоев требует угла оттяжки 0° (падение пряди вниз по естественному росту).',
      },
      {
        id: 'C',
        text: 'Ничего не изменится, угол оттяжки влияет только на челку.',
        percent: 5,
        is_correct: false,
        explanation: 'Ошибка: угол оттяжки — фундаментальный закон геометрии стрижки для любой зоны головы.',
      },
    ],
    answered_count: 20,
    total_students: 22,
    insight: '85% правильно указали на потерю веса затылка при 90°. Двое учеников перепутали с техникой каре (угол 0°).',
  },
};

export const ALL_TRACKS: CurriculumTrack[] = [
  TRACK_BIOLOGY,
  TRACK_IELTS,
  TRACK_CODING,
  TRACK_HAIRDRESSING,
];

// Fallback aliases for existing components
export const DEMO_LESSON = TRACK_BIOLOGY.lesson;
export const DEMO_SLIDES = TRACK_BIOLOGY.slides;
export const DEMO_BLOCKS = TRACK_BIOLOGY.blocks;
export const DEMO_LIVE_QUESTION = TRACK_BIOLOGY.live_question;
export const DEMO_FRAMES = [];

export const DEMO_TRANSCRIPT: TranscriptSegment[] = [
  {
    id: 't1',
    lesson_id: DEMO_LESSON.id,
    start_ms: 120000,
    end_ms: 128000,
    text: '…поэтому мембрана пропускает одни вещества и задерживает другие.',
    speaker: 'Преподаватель',
    words: [
      { word: 'поэтому', start_ms: 120000, end_ms: 120500 },
      { word: 'мембрана', start_ms: 120600, end_ms: 121200 },
      { word: 'пропускает', start_ms: 121300, end_ms: 122100 },
      { word: 'одни', start_ms: 122200, end_ms: 122500 },
      { word: 'вещества', start_ms: 122600, end_ms: 123400 },
      { word: 'и', start_ms: 123500, end_ms: 123700 },
      { word: 'задерживает', start_ms: 123800, end_ms: 124600 },
      { word: 'другие', start_ms: 124700, end_ms: 125300 },
    ],
  },
  {
    id: 't2',
    lesson_id: DEMO_LESSON.id,
    start_ms: 129000,
    end_ms: 135000,
    text: 'Обратите внимание на рецепторный белок здесь, на слайде.',
    speaker: 'Преподаватель',
  },
];

export const DEMO_ANKI_TSV = `#separator:tab
#html:true
Front\tBack
Фосфолипидный бислой\tДвойной слой амфифильных липидов, формирующий основу биомембран.<br><small><i>(Тема: Строение клеточной мембраны)</i></small>
Рецепторный белок\tТрансмембранный или мембранный белок, связывающий лиганд и передающий сигнал внутрь клетки.<br><small><i>(Тема: Рецепторные белки на поверхности)</i></small>
АТФ (Аденозинтрифосфат)\tУниверсальный источник химической энергии для всех биохимических процессов в клетке.<br><small><i>(Тема: Синтез АТФ и биоэнергетика клетки)</i></small>
`;

export const DEMO_ATTENDANCE_REPORT: LessonAttendanceReport = {
  lesson_id: DEMO_LESSON.id,
  lesson_title: DEMO_LESSON.title,
  total_students_enrolled: 30,
  present_students_count: 28,
  average_presence_percent: 91.5,
  average_focus_score: 0.89,
  total_tasks_accuracy: 0.86,
  pulse: [
    { minute: 5, active_students_count: 28, attention_percent: 96.0 },
    { minute: 10, active_students_count: 28, attention_percent: 94.0 },
    { minute: 15, active_students_count: 27, attention_percent: 90.0 },
    { minute: 20, active_students_count: 26, attention_percent: 85.0 },
    { minute: 25, active_students_count: 23, attention_percent: 72.0, is_drop_alert: false },
    { minute: 30, active_students_count: 27, attention_percent: 88.0 },
    { minute: 35, active_students_count: 28, attention_percent: 92.0 },
    { minute: 40, active_students_count: 28, attention_percent: 95.0 },
    { minute: 45, active_students_count: 28, attention_percent: 93.0 },
  ],
  students: [
    {
      id: 'att-1',
      student_id: 's-1',
      student_name: 'Алихан Ибрагимов',
      status: 'active',
      duration_minutes: 45.0,
      presence_percentage: 100.0,
      focus_score: 0.96,
      missed_blocks: [],
      tasks_answered: 2,
      tasks_correct: 2,
      tasks_accuracy: 1.0,
      catchup_sent: false,
      recommendation: 'Материал усвоен полностью. Отличная скорость и точность в практических опросах.',
    },
    {
      id: 'att-2',
      student_id: 's-2',
      student_name: 'Аружан Сапарова',
      status: 'active',
      duration_minutes: 38.0,
      presence_percentage: 84.4,
      focus_score: 0.89,
      missed_blocks: [
        {
          id: 'b-2',
          title: 'Рецепторные белки на поверхности',
          t_start_ms: 360000,
          t_end_ms: 780000,
          duration_str: '7 мин',
          reason: 'disconnected',
        },
      ],
      tasks_answered: 2,
      tasks_correct: 1,
      tasks_accuracy: 0.5,
      catchup_sent: true,
      recommendation: 'Кратковременный обрыв Wi-Fi на 7 минут. Персональная выжимка темы №2 доставлена.',
    },
    {
      id: 'att-3',
      student_id: 's-3',
      student_name: 'Данияр Сериков',
      status: 'active',
      duration_minutes: 43.5,
      presence_percentage: 96.6,
      focus_score: 0.94,
      missed_blocks: [],
      tasks_answered: 2,
      tasks_correct: 2,
      tasks_accuracy: 1.0,
      catchup_sent: false,
      recommendation: 'Высокая вовлеченность. Быстрый и безошибочный выбор верных вариантов.',
    },
    {
      id: 'att-4',
      student_id: 's-4',
      student_name: 'Максим Ковалев',
      status: 'idle',
      duration_minutes: 45.0,
      presence_percentage: 100.0,
      focus_score: 0.62,
      missed_blocks: [
        {
          id: 'b-3',
          title: 'Синтез АТФ и биоэнергетика клетки',
          t_start_ms: 780000,
          t_end_ms: 1260000,
          duration_str: '8 мин',
          reason: 'unfocused',
        },
      ],
      tasks_answered: 2,
      tasks_correct: 0,
      tasks_accuracy: 0.0,
      catchup_sent: false,
      recommendation: 'Окно урока находилось в фоновом режиме 38% времени. Рекомендован повтор темы №3.',
    },
    {
      id: 'att-5',
      student_id: 's-5',
      student_name: 'Мадина Жумабаева',
      status: 'active',
      duration_minutes: 44.0,
      presence_percentage: 97.8,
      focus_score: 0.95,
      missed_blocks: [],
      tasks_answered: 2,
      tasks_correct: 2,
      tasks_accuracy: 1.0,
      catchup_sent: false,
      recommendation: 'Идеальное прохождение урока и практических заданий.',
    },
    {
      id: 'att-6',
      student_id: 's-6',
      student_name: 'Ербол Кенесов',
      status: 'disconnected',
      duration_minutes: 19.0,
      presence_percentage: 42.2,
      focus_score: 0.71,
      missed_blocks: [
        {
          id: 'b-1',
          title: 'Строение клеточной мембраны',
          t_start_ms: 0,
          t_end_ms: 360000,
          duration_str: '6 мин',
          reason: 'disconnected',
        },
        {
          id: 'b-2',
          title: 'Рецепторные белки на поверхности',
          t_start_ms: 360000,
          t_end_ms: 780000,
          duration_str: '7 мин',
          reason: 'disconnected',
        },
      ],
      tasks_answered: 0,
      tasks_correct: 0,
      tasks_accuracy: 0.0,
      catchup_sent: false,
      recommendation: 'Опоздал на 26 минут. Требуется отправка автоматического рекапа за начало занятия.',
    },
  ],
};

