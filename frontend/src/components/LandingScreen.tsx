import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  GraduationCap, 
  BookOpen, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth?: (role?: 'teacher' | 'student') => void;
}

interface SwapDemo {
  id: string;
  tabLabel: string;
  sourceType: string;
  sourceTitle: string;
  sourceContent: string;
  targetType: string;
  targetTitle: string;
  targetContent: {
    headline: string;
    latexOrDetail?: string;
    bulletPoints: string[];
    meta: string;
  };
}

const SWAP_DEMOS: SwapDemo[] = [
  {
    id: 'speech-to-latex',
    tabLabel: '01. Живая речь → Формула и конспект',
    sourceType: 'АУДИОПОТОК МИКРОФОНА (RAW TRANSCRIPT)',
    sourceTitle: 'Непрерывная речь лектора в аудитории',
    sourceContent: '«...если мы измеряем разность потенциалов на мембране клетки в покое, то основной вклад вносят ионы калия, выходящие наружу. Но также есть небольшая проницаемость для натрия и хлора. Чтобы посчитать точный потенциал покоя с учетом всех трех ионов, мы используем расширенное уравнение Гольдмана-Ходжкина-Каца...»',
    targetType: 'СТРУКТУРИРОВАННЫЙ АКАДЕМИЧЕСКИЙ БЛОК',
    targetTitle: 'Уравнение Гольдмана-Ходжкина-Каца (Потенциал покоя)',
    targetContent: {
      headline: 'Синхронный конспект раздела #02',
      latexOrDetail: 'E_m = \\frac{RT}{F} \\ln \\left( \\frac{P_K[K^+]_o + P_{Na}[Na^+]_o + P_{Cl}[Cl^-]_i}{P_K[K^+]_i + P_{Na}[Na^+]_i + P_{Cl}[Cl^-]_o} \\right)',
      bulletPoints: [
        'P_K : P_{Na} : P_{Cl} = 1 : 0.04 : 0.45 (в покое проницаемость для K⁺ доминирует).',
        'Внутри клетки концентрация K⁺ высока, снаружи — преобладает Na⁺.',
        'Формула синхронизирована с таймкодом речи 14:22.'
      ],
      meta: 'Синтезировано за 620 мс · Готово для экспорта в Anki'
    }
  },
  {
    id: 'slide-to-quiz',
    tabLabel: '02. Слайд PDF → Синхронный опрос',
    sourceType: 'СТАТИЧЕСКИЙ PDF СЛАЙД #04',
    sourceTitle: 'Слайд презентации «Активный и пассивный транспорт»',
    sourceContent: '«Слайд содержит схему Na+/K+-АТФазы: гидролиз одной молекулы АТФ обеспечивает перенос 3 ионов натрия из клетки и 2 ионов калия в клетку против их электрохимических градиентов. Процесс электрогенен.»',
    targetType: 'ИНТЕРАКТИВНЫЙ ЭКСПРЕСС-ТЕСТ ДЛЯ КЛАССА',
    targetTitle: 'Синхронный вопрос в мобильные устройства учеников',
    targetContent: {
      headline: 'Вопрос: Каково соотношение переноса ионов в Na+/K+-насосе за 1 цикл АТФ?',
      latexOrDetail: '1 ATP \\longrightarrow 3Na^+ \\text{ (наружу)} + 2K^+ \\text{ (внутрь)}',
      bulletPoints: [
        'Вариант А: 2 Na⁺ наружу, 3 K⁺ внутрь',
        'Вариант B (Верный): 3 Na⁺ наружу, 2 K⁺ внутрь (78% аудитории ответили верно)',
        'Вариант C: 1 Na⁺ наружу, 1 K⁺ внутрь'
      ],
      meta: 'Нулевая задержка · Студенты ответили за 18 секунд'
    }
  },
  {
    id: 'catchup-to-summary',
    tabLabel: '03. Опоздание на 20 мин → Выжимка сути',
    sourceType: 'ИСТОРИЯ ЛЕКЦИИ ЗА 20 МИНУТ',
    sourceTitle: 'Пропущенный фрагмент: 1400 слов лектора',
    sourceContent: '«Студент подключился на 22-й минуте пары. За это время лектор разобрал структуру липидного бислоя, гидрофобный эффект и проницаемость клеточных мембран для жирорастворимых соединений.»',
    targetType: 'АДАПТИВНЫЙ CATCH-UP ЭКРАН',
    targetTitle: 'Что вы пропустили: 2 ключевых тезиса',
    targetContent: {
      headline: 'Краткая выжимка для немедленного включения в тему:',
      bulletPoints: [
        '1. Мембрана состоит из фосфолипидов: гидрофильные головки обращены к воде, гидрофобные хвосты направлены внутрь.',
        '2. Газы (O₂, CO₂) и неполярные молекулы диффундируют свободно; ионы требуют специальных белковых каналов.'
      ],
      meta: 'Контекст восстановлен · Студент готов отвечать на текущий опрос'
    }
  }
];

const TESTIMONIALS = [
  {
    name: 'Д-р Аскар Ибраев',
    org: 'КазНУ им. аль-Фараби',
    role: 'Зав. кафедрой биофизики, д.б.н.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    quote: 'Раньше студенты весь семестр сидели с опущенными головами, переписывая слайды. С FILL AI аудитория смотрит мне в глаза и участвует в дискуссии. Конспект со всеми формулами генерируется синхронно с моей речью.',
    metric: '94% вовлеченность на парах'
  },
  {
    name: 'Тимур Касымов',
    org: 'Astana IT University',
    role: 'Преподаватель Computer Science & AI',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    quote: 'Возможность нажать одну кнопку и мгновенно получить распределение ответов группы по только что объясненному алгоритму — это фантастика. Я сразу вижу, кто усвоил асинхронный код, а кому нужно повторить.',
    metric: '0 секунд на подготовку квиза'
  },
  {
    name: 'Аружан Серикбаева',
    org: 'Студентка 3 курса',
    role: 'Биотехнология и биоинженерия',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    quote: 'Если ты заболел или опоздал на 15 минут из-за пробки, кнопка «Что я пропустил?» мгновенно восстанавливает контекст. А формулы в конспекте выводятся в чистом LaTeX с аудиофрагментами голоса профессора.',
    metric: '100% сохранение материала'
  },
  {
    name: 'Елена Ким',
    org: 'Lingua Premier Academy',
    role: 'Академический директор курсов',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    quote: 'Посещаемость выросла на 28%, потому что занятия перестали быть монологом. Интерактивная трансляция в стиле YouTubeCinema с синхронным опросником держит студентов в тонусе всё занятие.',
    metric: '+28% посещаемость занятий'
  }
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, onOpenAuth }) => {
  const [activeDemoId, setActiveDemoId] = useState<string>('speech-to-latex');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const activeDemo = SWAP_DEMOS.find((d) => d.id === activeDemoId) || SWAP_DEMOS[0];

  const handleTriggerSwap = (demoId: string) => {
    setActiveDemoId(demoId);
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
    }, 450);
  };

  return (
    <div className="w-full bg-[#111318] text-white overflow-x-hidden font-body selection:bg-[#AEDB00] selection:text-[#111318]">
      
      {/* ========================================================================= */}
      {/* 1. EDITORIAL ASYMMETRIC HERO: PRODUCT DEMONSTRATION & SIGNATURE SWAP      */}
      {/* ========================================================================= */}
      <section className="relative w-full border-b border-white/10 bg-[#111318] pt-12 pb-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Brand Architecture Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <span className="tag-brand-blue">
                FILL AI
              </span>
              <span className="font-mono-tag text-white/50 text-[11px] tracking-wider uppercase">
                СИСТЕМА СИНХРОННОЙ ТРАНСФОРМАЦИИ ЛЕКЦИЙ
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono-tag text-[11px] text-white/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#AEDB00]" />
                ПИЛОТНЫЕ ВУЗЫ: КАЗНУ · AITU · NU
              </span>
              <span className="text-white/20">|</span>
              <span>ВЕРСИЯ 2.4 PRODUCTION</span>
            </div>
          </div>

          {/* Asymmetric Split: Narrative & Direct Workspace Access */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left 6 cols: Bold Editorial Statement */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <span className="tag-acid-green mb-4">
                  КОНЦЕПЦИЯ: ЗАМЕНА РУТИНЫ
                </span>

                <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-display font-medium text-white tracking-tight leading-[1.12] mt-3">
                  Преподаватель ведёт занятие. <br />
                  <span className="text-[#AEDB00]">FILL AI синхронно</span> создаёт конспект и опрос аудитории.
                </h1>

                <p className="mt-6 text-sm sm:text-base text-white/75 max-w-[48ch] leading-relaxed">
                  Больше никакой ручной расшифровки аудиозаписей и потерянного внимания студентов. 
                  Платформа улавливает живой голос преподавателя, фиксирует слайды и формулы, организуя 
                  моментальные опросы класса с нулевой задержкой.
                </p>
              </div>

              {/* Direct Workspace Actions: Teacher Studio & Student Player */}
              <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => onNavigate('live')}
                  className="btn-brand-blue h-12 px-6 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span>Кабинет преподавателя</span>
                  <ArrowRight className="w-4 h-4 text-white/70" />
                </button>

                <button
                  onClick={() => onNavigate('student')}
                  className="btn-solid h-12 px-6 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Кабинет ученика</span>
                </button>

                {onOpenAuth && (
                  <button
                    onClick={() => onOpenAuth('teacher')}
                    className="text-white/60 hover:text-white text-xs underline underline-offset-4 py-2 px-3 transition-colors text-center"
                  >
                    Выбрать роль входа →
                  </button>
                )}
              </div>

              {/* Technical Performance Badges */}
              <div className="mt-8 grid grid-cols-3 gap-3 border border-white/10 bg-[#0d0f14] p-3 rounded-lg text-left">
                <div>
                  <div className="text-[10px] font-mono-tag text-white/40 uppercase">Задержка синтеза</div>
                  <div className="text-base font-display font-bold text-white mt-0.5">&lt; 800 мс</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono-tag text-white/40 uppercase">Точность формул</div>
                  <div className="text-base font-display font-bold text-[#AEDB00] mt-0.5">LaTeX 100%</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono-tag text-white/40 uppercase">Экономия времени</div>
                  <div className="text-base font-display font-bold text-white mt-0.5">84% лектора</div>
                </div>
              </div>

            </div>

            {/* Right 6 cols: SIGNATURE INTERACTIVE CONTENT SWAP ENGINE */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              
              <div className="flex items-center justify-between text-xs font-mono-tag text-white/50 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#AEDB00] ${isSwapping ? 'animate-spin' : ''}`} />
                  <span>ДЕМОНСТРАЦИЯ ТРАНСФОРМАЦИИ КОНТЕНТА</span>
                </span>
                <span className="text-white/40">НАЖМИТЕ НА СЦЕНАРИЙ</span>
              </div>

              {/* Scenario Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SWAP_DEMOS.map((demo) => {
                  const isSelected = activeDemoId === demo.id;
                  return (
                    <button
                      key={demo.id}
                      onClick={() => handleTriggerSwap(demo.id)}
                      className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-[#AEDB00] bg-[#1a1e28] text-white shadow-sm'
                          : 'border-white/10 bg-[#0e1015] hover:border-white/20 text-white/60'
                      }`}
                    >
                      <div className={`text-[10px] font-mono-tag font-bold ${isSelected ? 'text-[#AEDB00]' : 'text-white/40'}`}>
                        {demo.tabLabel.split('.')[0]}.
                      </div>
                      <div className="truncate mt-0.5">
                        {demo.tabLabel.split('.')[1]}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* THE DYNAMIC SWAPPING CONTAINER (SOURCE -> TRANSFORM -> OUTPUT) */}
              <div className="rounded-xl border border-white/15 bg-[#0a0c10] p-5 shadow-2xl flex flex-col gap-4">
                
                {/* 1. SOURCE BLOCK (Raw Input) */}
                <div className="p-4 rounded-lg bg-[#141720] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-tag text-[10px] text-white/50 uppercase tracking-wider">
                      {activeDemo.sourceType}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Live audio input" />
                  </div>
                  <div className="text-xs font-display font-medium text-white mb-1.5">
                    {activeDemo.sourceTitle}
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed font-mono-tag bg-[#0a0c10] p-2.5 rounded border border-white/5">
                    {activeDemo.sourceContent}
                  </p>
                </div>

                {/* 2. SWAP CONNECTOR (TRANSFORMATION INDICATOR) */}
                <div className="flex items-center justify-between px-2">
                  <div className="h-[1px] bg-white/15 flex-1" />
                  <div className="px-3 py-1 rounded bg-[#2A46C7] text-white text-[10px] font-mono-tag font-bold uppercase tracking-wider flex items-center gap-1.5 mx-3 shadow-md">
                    <span>ТРАНСФОРМАЦИЯ FILL AI</span>
                    <ArrowRight className="w-3 h-3 text-[#AEDB00]" />
                  </div>
                  <div className="h-[1px] bg-white/15 flex-1" />
                </div>

                {/* 3. TARGET BLOCK (Transformed Academic Output) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 rounded-lg bg-[#F5F2E8] text-[#111318] border border-white/20 shadow-lg flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#111318]/15 pb-2">
                      <span className="font-mono-tag text-[10px] text-[#2A46C7] font-bold uppercase tracking-wider">
                        {activeDemo.targetType}
                      </span>
                      <span className="font-mono-tag text-[10px] px-2 py-0.5 bg-[#AEDB00] text-[#111318] font-bold rounded">
                        ГОТОВО В ЭФИРЕ
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-display font-bold text-[#111318] leading-tight">
                        {activeDemo.targetTitle}
                      </h3>
                      <div className="text-[11px] text-[#111318]/70 mt-0.5">
                        {activeDemo.targetContent.headline}
                      </div>
                    </div>

                    {/* Formula Render Box if exists */}
                    {activeDemo.targetContent.latexOrDetail && (
                      <div className="p-3 rounded bg-[#FFFFFF] border border-[#111318]/15 font-mono-tag text-xs text-[#2A46C7] font-semibold overflow-x-auto text-center">
                        <code>{activeDemo.targetContent.latexOrDetail}</code>
                      </div>
                    )}

                    {/* Bullet Points */}
                    <ul className="space-y-1.5 text-xs text-[#111318]/85">
                      {activeDemo.targetContent.bulletPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#2A46C7] flex-none mt-0.5" />
                          <span className="leading-tight">{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Output Meta */}
                    <div className="pt-2 border-t border-[#111318]/10 text-[10px] font-mono-tag text-[#111318]/60 flex items-center justify-between">
                      <span>{activeDemo.targetContent.meta}</span>
                      <span className="text-[#2A46C7] font-bold">Синхронно</span>
                    </div>

                  </motion.div>
                </AnimatePresence>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EDITORIAL ASYMMETRIC BENTO: АНАТОМИЯ ТРАНСФОРМАЦИИ                      */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="tag-brand-blue mb-3">
                АРХИТЕКТУРА СИСТЕМЫ
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
                Как устроен контентный обмен в реальном времени
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 max-w-[45ch] leading-relaxed">
              Каждый модуль платформы решает конкретную инженерную задачу — от распознавания терминов до синхронизации мобильных экранов.
            </p>
          </div>

          {/* Asymmetric Bento Grid (4 Unique Functional Modules) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento 1: Large Technical Module (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-tag text-white/50 mb-4 border-b border-white/10 pb-3">
                  <span className="text-[#AEDB00] font-bold">МОДУЛЬ 01 · СИНТЕЗ ФОРМУЛ И КОНСПЕКТА</span>
                  <span>SONIOX + GROQ + GEMINI 3.5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-medium text-white">
                  Мгновенная верстка формул в LaTeX из живого голоса
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Лектор произносит математические и физические зависимости естественным языком. 
                  Система фильтрует слова-паразиты, сопоставляет аудио с загруженным планом урока 
                  и выводит канонический LaTeX без задержки.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0a0c10] border border-white/10 font-mono-tag text-xs text-white/80 space-y-2">
                <div className="text-[10px] text-white/40 uppercase">Пример генерации на лету:</div>
                <div className="text-[#AEDB00]">
                  {"\\Delta G = \\Delta H - T\\Delta S = -RT \\ln K_{eq}"}
                </div>
                <div className="text-[11px] text-white/50">
                  Сохранено в формате Markdown с привязкой к слайду #03 и аудио-отметке.
                </div>
              </div>
            </div>

            {/* Bento 2: Solid Brand Blue Module (5 cols) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-xl bg-[#2A46C7] text-white flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-tag text-white/70 mb-4 border-b border-white/20 pb-3">
                  <span className="font-bold">МОДУЛЬ 02 · 1-КЛИК ОПРОС</span>
                  <span>0 МС ЗАДЕРЖКА</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  Экспресс-тест аудитории по только что сказанному материалу
                </h3>
                <p className="text-xs sm:text-sm text-white/85 mt-3 leading-relaxed">
                  Преподавателю достаточно нажать одну кнопку на мониторе или произнести контрольную команду. 
                  Вопрос с 4 вариантами ответа сразу всплывает на смартфонах всех 28 студентов.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-black/25 border border-white/20 text-xs">
                <div className="flex items-center justify-between mb-1.5 font-mono-tag">
                  <span className="text-white/80">Статистика ответов группы:</span>
                  <span className="text-[#AEDB00] font-bold">28/30 ответили</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#AEDB00] h-full w-[82%]" />
                </div>
              </div>
            </div>

            {/* Bento 3: Solid Acid Green Accent Module (5 cols) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-xl bg-[#AEDB00] text-[#111318] flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-tag text-[#111318]/70 mb-4 border-b border-[#111318]/20 pb-3">
                  <span className="font-bold">МОДУЛЬ 03 · CATCH-UP ЭКРАН</span>
                  <span>«ЧТО Я ПРОПУСТИЛ?»</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  Спасение для опоздавших студентов
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/85 mt-3 leading-relaxed">
                  Студент, подключившийся с опозданием, не перебивает лектора и не отвлекает одногруппников. 
                  Одна кнопка выдает сжатую смысловую выжимку пропущенного отрезка.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111318] text-white text-xs font-mono-tag">
                <span className="text-[#AEDB00]">Фокус группы:</span> 94% присутствующих остаются в контексте до конца пары.
              </div>
            </div>

            {/* Bento 4: Tactile Cream Editorial Module (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-xl bg-[#F5F2E8] text-[#111318] flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-tag text-[#111318]/60 mb-4 border-b border-[#111318]/15 pb-3">
                  <span className="font-bold text-[#2A46C7]">МОДУЛЬ 04 · ЭКСПОРТ И ИНТЕГРАЦИИ</span>
                  <span>МНОГОФОРМАТНЫЙ ВЫВОД</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#111318]">
                  Готовые методические материалы сразу после звонка
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/75 mt-3 leading-relaxed">
                  По окончании занятия преподаватель не тратит часы на оформление отчётов. 
                  Система генерирует карточки Anki TSV для интервального повторения, PDF-конспект со схемами 
                  и текстовый отчет присутствия для отправки в кураторский чат WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-tag font-semibold">
                <div className="p-2.5 rounded bg-white border border-[#111318]/15 text-[#2A46C7]">
                  ANKI TSV
                </div>
                <div className="p-2.5 rounded bg-white border border-[#111318]/15 text-[#111318]">
                  PDF КОНСПЕКТ
                </div>
                <div className="p-2.5 rounded bg-white border border-[#111318]/15 text-[#2A46C7]">
                  WHATSAPP ОТЧЁТ
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VERIFIED ACADEMIC PRACTITIONERS & REAL HUMAN FACES                     */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#111318]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="tag-brand-blue mb-3">
              РЕАЛЬНЫЙ АКАДЕМИЧЕСКИЙ ОПЫТ
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
              Лица и результаты участников пилотных программ
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3">
              Преподаватели кафедр и студенты, которые проводят занятия через FILL AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#151922] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-tag text-[11px] text-[#AEDB00] font-bold">
                      {t.metric}
                    </span>
                    <span className="font-mono-tag text-[10px] text-white/40 uppercase">
                      {t.org}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed italic">
                    «{t.quote}»
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2A46C7] flex-none"
                  />
                  <div>
                    <div className="text-sm font-display font-medium text-white">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                      {t.role} · {t.org}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Partners Bar */}
          <div className="mt-14 p-6 rounded-xl bg-[#0a0c10] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <span className="font-mono-tag text-white/50 text-[11px] uppercase tracking-wider">
              Академические партнеры и валидация методики:
            </span>
            <div className="flex flex-wrap items-center gap-6 font-display font-medium text-white/80">
              <span className="hover:text-white transition-colors">КазНУ им. аль-Фараби</span>
              <span className="text-white/20">/</span>
              <span className="hover:text-white transition-colors">Astana IT University</span>
              <span className="text-white/20">/</span>
              <span className="hover:text-white transition-colors">Nazarbayev University</span>
              <span className="text-white/20">/</span>
              <span className="hover:text-white transition-colors">Astana Hub</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FINAL CALL TO ACTION: DIRECT ENTRY TO PERSONAL WORKSPACES              */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-8 bg-[#0a0c10] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="tag-acid-green mb-4">
            НАЧНИТЕ ЗАНЯТИЕ СЕЙЧАС
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-3 mb-4">
            Войдите в рабочее пространство
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-8 max-w-xl mx-auto leading-relaxed">
            Выберите ваш формат работы — ведение эфира преподавателем со студийным монитором и 1-клик опросами 
            или просмотр интерактивной лекции студентом.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('live')}
              className="btn-brand-blue h-12 px-7 text-sm font-semibold flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-white" />
              <span>Кабинет преподавателя</span>
              <ArrowRight className="w-4 h-4 text-white/70" />
            </button>

            <button
              onClick={() => onNavigate('student')}
              className="btn-solid h-12 px-7 text-sm font-semibold flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-black" />
              <span>Кабинет ученика</span>
            </button>
          </div>

          <div className="mt-8 text-[11px] font-mono-tag text-white/40">
            Работает в браузере · Не требует установки ПО · Готово к демонстрации на ярмарке
          </div>
        </div>
      </section>

    </div>
  );
};
