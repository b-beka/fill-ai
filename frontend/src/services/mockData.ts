import { Lesson, NoteBlock, Frame, Slide, TranscriptSegment } from '../types/lesson';

export const DEMO_LESSON: Lesson = {
  id: 'd3b07384-d113-4a4b-9c81-8178a9c2b9a1',
  org_id: '11111111-1111-1111-1111-111111111111',
  teacher_id: '33333333-3333-3333-3333-333333333333',
  title: 'Биология · Клетка и её строение',
  subject: 'Биология (9 «Б» класс)',
  language: 'ru',
  source: 'live',
  status: 'live',
  visibility_mode: 'moderated',
  expected_terms: ['мембрана', 'фосфолипидный бислой', 'АТФ', 'митохондрия', 'рецепторный белок', 'окислительное фосфорилирование'],
  last_seq: 18,
  cost_usd: 0.42,
  started_at: new Date(Date.now() - 42 * 60 * 1000 - 15 * 1000).toISOString(),
  created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
};

export const DEMO_SLIDES: Slide[] = [
  {
    id: 's1',
    lesson_id: DEMO_LESSON.id,
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
    lesson_id: DEMO_LESSON.id,
    slide_idx: 2,
    s3_key: 'slides/slide_2.webp',
    phash: 'f6e5d4c3b2a10304',
    extracted_text: 'Рецепторные белки и трансмембранный транспорт: ионные каналы и сигнальные молекулы.',
    terms: ['рецепторный белок', 'лиганд', 'ионные каналы'],
    width: 1920,
    height: 1080,
  },
  {
    id: 's3',
    lesson_id: DEMO_LESSON.id,
    slide_idx: 3,
    s3_key: 'slides/slide_3.webp',
    phash: '1122334455667788',
    extracted_text: 'Митохондрии: строение двойной мембраны, кристы, синтез АТФ.',
    terms: ['митохондрия', 'АТФ', 'кристы', 'матрикс'],
    width: 1920,
    height: 1080,
  },
];

export const DEMO_FRAMES: Frame[] = [
  {
    id: 'f1-cell-membrane',
    lesson_id: DEMO_LESSON.id,
    t_ms: 184000,
    status: 'selected',
    s3_key: 'frames/f1.webp',
    width: 1920,
    height: 1080,
    title: 'Рецепторные белки клеточной мембраны',
    annotations: [
      {
        id: 1,
        label: 'Сигнальная молекула, распознаваемая рецептором',
        type: 'point',
        point_2d: [300, 250],
        box_2d: [220, 200, 360, 300],
      },
      {
        id: 2,
        label: 'Белок-рецептор, встроенный в мембрану',
        type: 'box',
        box_2d: [500, 600, 750, 800],
      },
    ],
  },
];

export const DEMO_BLOCKS: NoteBlock[] = [
  {
    id: 'b1-membrane-structure',
    lesson_id: DEMO_LESSON.id,
    position: 1,
    t_start_ms: 0,
    t_end_ms: 240000,
    title: 'Строение клеточной мембраны',
    body_md: 'Мембрана отделяет содержимое клетки от внешней среды и контролирует, что через неё проходит. Основа мембраны — двойной слой особых молекул, а белки в этом слое отвечают за приём сигналов и транспорт веществ.',
    status: 'approved',
    version: 1,
    callouts: [
      {
        type: 'definition',
        title: 'Фосфолипидный бислой',
        text: 'два слоя молекул, гидрофильные головки направлены наружу, а хвосты — внутрь мембраны.',
      },
      {
        type: 'example',
        title: 'Пример',
        text: 'Мыльный пузырь держит форму по похожему принципу: молекулы мыла выстраиваются слоями на границе воды и воздуха.',
      },
    ],
  },
  {
    id: 'b2-receptor-proteins',
    lesson_id: DEMO_LESSON.id,
    position: 2,
    t_start_ms: 240000,
    t_end_ms: 480000,
    title: 'Рецепторные белки на поверхности',
    body_md: 'На слайде преподаватель отметил, где именно расположены белки-рецепторы и куда крепится сигнальная молекула.',
    status: 'approved',
    version: 1,
    frame_refs: ['f1-cell-membrane'],
  },
  {
    id: 'b3-mitochondria-energy',
    lesson_id: DEMO_LESSON.id,
    position: 3,
    t_start_ms: 480000,
    t_end_ms: 720000,
    title: 'Синтез АТФ и биоэнергетика клетки',
    body_md: 'Митохондрии преобразуют энергию органических веществ в молекулы АТФ в процессе клеточного дыхания на внутренних складках — кристах.',
    status: 'pending_review',
    version: 1,
    uncertain: ['Тезис об абсолютной автономности митохондрий требует уточнения'],
    callouts: [
      {
        type: 'warning',
        title: 'Проверка достоверности (AI Faithfulness)',
        text: 'Автономность митохондрий является полуавтономной: большая часть белков кодируется в ядерной ДНК.',
      },
    ],
  },
];

export const DEMO_LIVE_QUESTION = {
  id: 'q1-atp',
  eyebrow: 'Проверим понимание',
  text: 'Какая органелла отвечает за синтез АТФ?',
  options: [
    { text: 'Митохондрия', percent: 68, is_correct: true },
    { text: 'Рибосома', percent: 22, is_correct: false },
    { text: 'Комплекс Гольджи', percent: 7, is_correct: false },
    { text: 'Лизосома', percent: 3, is_correct: false },
  ],
  answered_count: 21,
  total_students: 28,
  insight: '28 ответили, 68% правильно. 22% выбрали рибосому — возможно, стоит уточнить разницу между синтезом белка и синтезом АТФ.',
};

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
  {
    id: 't3',
    lesson_id: DEMO_LESSON.id,
    start_ms: 136000,
    end_ms: 142000,
    text: 'Именно он отвечает за то, что клетка чувствует сигналы снаружи',
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
