import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  GraduationCap, 
  Clock, 
  Download, 
  CheckCircle2, 
  Building,
  Smartphone
} from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate?: (screen: ScreenId) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: 'teacher' | 'student') => void;
}

const FAQ_ITEMS = [
  {
    q: 'Нужно ли покупать дорогое студийное оборудование или микрофоны?',
    a: 'Нет. FILL AI оптимизирован для работы со стандартными микрофонами ноутбуков, петличками за 5 000 ₸ или аудиторными микрофонами кафедры. Алгоритмы шумоподавления Soniox и Groq отсекают эхо аудитории и шорохи.'
  },
  {
    q: 'Какие языки поддерживаются платформой?',
    a: 'Платформа полностью поддерживает русский, казахский и английский языки. Нейросетевая модель корректно понимает смешанную речь (код-свитчинг) и узкоспециализированные термины медицины, IT, физики и права.'
  },
  {
    q: 'Как система распознает сложные математические и химические формулы?',
    a: 'Система использует специализированный семантический парсер на базе Gemini 3.5. Когда преподаватель говорит «потенциал покоя по формуле Гольдмана равен...», движок автоматически транслирует речь в синтаксически выверенный LaTeX-код.'
  },
  {
    q: 'Как студенты подключаются к экспресс-опросам в аудитории?',
    a: 'Студентам не нужно скачивать или устанавливать приложения. Они открывают ссылку или сканируют QR-код на доске со своего смартфона и мгновенно получают активный вопрос с нулевой задержкой.'
  },
  {
    q: 'Соответствует ли платформа требованиям безопасности и защите данных?',
    a: 'Да. Все аудиопотоки и учебные материалы шифруются по протоколу TLS 1.3. Для университетов и государственных вузов предусмотрено развертывание в изолированном локальном контуре (On-Premise / Private Cloud).'
  },
  {
    q: 'Как запустить бесплатный пилот на нашей кафедре или в онлайн-школе?',
    a: 'Нажмите кнопку «Регистрация», выберите роль преподавателя и начните тестовое занятие за 2 минуты. Доступен полный функционал без ввода банковской карты.'
  }
];

const TESTIMONIALS = [
  {
    name: 'Д-р Аскар Ибраев',
    role: 'Зав. кафедрой биофизики, д.б.н.',
    org: 'КазНУ им. аль-Фараби',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    quote: 'Студенты перестали сидеть с опущенными головами, переписывая слайды в тетрадь. Они слушают объяснение сути, а академический конспект со всеми формулами получают сразу к звонку.',
    stat: '94% вовлеченность на парах'
  },
  {
    name: 'Тимур Касымов',
    role: 'Преподаватель Computer Science',
    org: 'Astana IT University',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    quote: '1-клик опрос аудитории в середине пары сразу показывает мне, усвоила ли группа концепцию асинхронности в Python. Это экономит недели при подготовке к коллоквиумам.',
    stat: '0 сек на подготовку теста'
  },
  {
    name: 'Аружан Серикбаева',
    role: 'Студентка 3 курса',
    org: 'Биотехнология и биоинженерия',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    quote: 'Если ты заболел или опоздал на 15 минут из-за пробки, кнопка «Что я пропустил?» выдает четкую выжимку тезисов. А формулы выводятся в чистом LaTeX с аудиофрагментами лектора.',
    stat: '100% сохранение материала'
  },
  {
    name: 'Елена Ким',
    role: 'Академический директор',
    org: 'Lingua Premier Academy',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    quote: 'Посещаемость выросла на 28%, потому что вебинары перестали быть монологом. Интерактивная трансляция и моментальные квизы держат студентов в постоянном фокусе.',
    stat: '+28% посещаемость занятий'
  }
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate: _onNavigate, onOpenAuth }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="w-full bg-[#111318] text-white overflow-x-hidden font-body selection:bg-[#AEDB00] selection:text-[#111318]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: VALUE PROPOSITION & ACADEMIC ACCREDITATION               */}
      {/* ========================================================================= */}
      <section id="hero" className="relative w-full border-b border-white/10 bg-[#111318] pt-16 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Institutional Pillar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <span className="tag-brand-blue">
                FILL AI
              </span>
              <span className="font-mono-tag text-white/50 text-[11px] tracking-wider uppercase">
                ОПЕРАЦИОННАЯ СИСТЕМА ДЛЯ ЖИВЫХ ЛЕКЦИЙ И ВЕБИНАРОВ
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono-tag text-[11px] text-white/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#AEDB00]" />
                ПИЛОТНЫЕ ВУЗЫ: КАЗНУ · AITU · NU
              </span>
              <span className="text-white/20">|</span>
              <span>ВЕРСИЯ 2.4</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <span className="tag-acid-green mb-5">
              СИНХРОННЫЙ АКАДЕМИЧЕСКИЙ СИНТЕЗ
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-white tracking-tight leading-[1.12]">
              Преподаватель говорит свободно. <br />
              <span className="text-[#AEDB00]">FILL AI синхронно</span> создаёт конспект, формулы и опросы.
            </h1>

            <p className="mt-6 text-sm sm:text-base md:text-lg text-white/70 max-w-[58ch] leading-relaxed font-normal">
              Никакой ручной расшифровки после уроков. Платформа в реальном времени превращает живую речь лектора 
              в структурированный конспект, выводит формулы в LaTeX и запускает моментальные опросы аудитории 
              с нулевой задержкой.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="btn-brand-blue h-12 px-7 text-sm font-semibold flex items-center gap-2 shadow-lg"
              >
                <span>Начать бесплатно</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-solid h-12 px-7 text-sm font-semibold flex items-center gap-2"
              >
                <span>Как это работает</span>
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="text-white/60 hover:text-white text-xs underline underline-offset-4 py-2 px-3 transition-colors"
              >
                Уже есть аккаунт? Войти →
              </button>
            </div>

            {/* Hard Metrics Proof Points */}
            <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 border border-white/10 bg-[#0d0f14] p-5 rounded-xl text-left">
              <div className="border-r border-white/10 pr-3 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase">Экономия времени</div>
                <div className="text-2xl font-display font-bold text-white mt-1">84%</div>
                <div className="text-[11px] text-white/50 mt-0.5">на подготовку материалов</div>
              </div>

              <div className="border-r border-white/10 pr-3 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase">Скорость синтеза</div>
                <div className="text-2xl font-display font-bold text-[#AEDB00] mt-1">&lt; 800 мс</div>
                <div className="text-[11px] text-white/50 mt-0.5">с момента произнесения</div>
              </div>

              <div className="border-r border-white/10 pr-3 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase">Подготовка квиза</div>
                <div className="text-2xl font-display font-bold text-white mt-1">0 сек</div>
                <div className="text-[11px] text-white/50 mt-0.5">1-клик пуск в мобильные</div>
              </div>

              <div>
                <div className="text-[10px] font-mono-tag text-white/40 uppercase">Фокус аудитории</div>
                <div className="text-2xl font-display font-bold text-[#AEDB00] mt-1">94%</div>
                <div className="text-[11px] text-white/50 mt-0.5">вовлеченность студентов</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HOW IT WORKS: 3-STEP REAL-TIME ARCHITECTURE                           */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-2xl mb-14">
            <span className="tag-brand-blue mb-3">
              ПРИНЦИП РАБОТЫ
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
              Как работает FILL AI на реальном занятии
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3 leading-relaxed">
              Всё происходит синхронно по ходу лекции без дополнительных усилий со стороны преподавателя.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 sm:p-7 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#2A46C7] text-white font-mono-tag text-xs font-bold flex items-center justify-center">
                    01
                  </span>
                  <span className="text-[10px] font-mono-tag text-[#AEDB00] uppercase font-bold">
                    ЗВУК & СЛАЙДЫ
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white">
                  Преподаватель ведёт пару в обычном режиме
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Лектор говорит в обычный микрофон или петличку и показывает слайды. Модуль Soniox + Groq 
                  сверхбыстро переводит аудиопоток в текст, фильтруя оговорки и эхо аудитории.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0c10] border border-white/10 text-xs font-mono-tag text-white/60">
                <span className="text-[#AEDB00]">Языки:</span> Русский, Казахский, English
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-7 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#2A46C7] text-white font-mono-tag text-xs font-bold flex items-center justify-center">
                    02
                  </span>
                  <span className="text-[10px] font-mono-tag text-[#AEDB00] uppercase font-bold">
                    СИНТЕЗ GEMINI 3.5
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white">
                  ИИ синхронно формирует конспект и тесты
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Система анализирует смысл речи, автоматически верстает формулы в канонический LaTeX, 
                  привязывает слайды по OpenCV pHash и генерирует проверочные вопросы для аудитории.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0c10] border border-white/10 text-xs font-mono-tag text-white/60">
                <span className="text-[#AEDB00]">Задержка:</span> Менее 800 миллисекунд
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-7 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#2A46C7] text-white font-mono-tag text-xs font-bold flex items-center justify-center">
                    03
                  </span>
                  <span className="text-[10px] font-mono-tag text-[#AEDB00] uppercase font-bold">
                    ВОВЛЕЧЕНИЕ ГРУППЫ
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white">
                  Мгновенный отклик и готовые материалы
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Студенты со смартфонов отвечают на 1-клик опросы. К звонку преподаватель получает готовый 
                  список присутствия для WhatsApp, а ученики — конспект и карточки Anki TSV.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0c10] border border-white/10 text-xs font-mono-tag text-white/60">
                <span className="text-[#AEDB00]">Результат:</span> 0 минут на ручную методичку
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURES: EDITORIAL BENTO CAPABILITIES                                */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#111318]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="tag-acid-green mb-3">
                ВОЗМОЖНОСТИ ПЛАТФОРМЫ
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
                Инструменты для продуктивной лекции
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 max-w-[45ch] leading-relaxed">
              Создано совместно с ведущими лекторами биофизики, IT и иностранных языков Казахстана.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Feature 1: Speech to LaTeX (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-xl bg-[#151922] border border-white/15 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#AEDB00] mb-3">
                  <Zap className="w-3.5 h-3.5" />
                  <span>СИНТЕЗ ФОРМУЛ И ТЕЗИСОВ</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Автоматический LaTeX-конспект из живой речи
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Лектор говорит о разности потенциалов или дифференциальных уравнениях — система 
                  моментально конструирует чистые блоки конспекта с привязкой к слайдам и таймкодам речи.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0a0c10] border border-white/10 font-mono-tag text-xs text-white/80 space-y-1.5">
                <div className="text-[10px] text-white/40 uppercase">Распознанная формула:</div>
                <div className="text-[#AEDB00] font-semibold">
                  {"E_m = \\frac{RT}{F} \\ln \\left( \\frac{P_K[K^+]_o + P_{Na}[Na^+]_o}{P_K[K^+]_i + P_{Na}[Na^+]_i} \\right)"}
                </div>
              </div>
            </div>

            {/* Feature 2: 1-Click Audience Quizzes (5 cols, Solid Blue #2A46C7) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-xl bg-[#2A46C7] text-white flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-white/80 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#AEDB00]" />
                  <span>ПРОВЕРКА ЗНАНИЙ В ЭФИРЕ</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  Экспресс-опросы аудитории в 1 клик
                </h3>
                <p className="text-xs sm:text-sm text-white/85 mt-3 leading-relaxed">
                  Одна кнопка на экране преподавателя — и 28 студентов отвечают на смартфонах. 
                  Преподаватель сразу видит гистограмму ответов и разбирает типичные ошибки.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/25 border border-white/20 text-xs font-mono-tag flex items-center justify-between">
                <span>Скорость сбора ответов:</span>
                <span className="text-[#AEDB00] font-bold">18 секунд на группу</span>
              </div>
            </div>

            {/* Feature 3: Catch-Up Module (5 cols, Solid Acid Green #AEDB00) */}
            <div className="md:col-span-5 p-6 sm:p-8 rounded-xl bg-[#AEDB00] text-[#111318] flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#111318]/70 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#111318]" />
                  <span>УМНЫЙ CATCH-UP</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  Кнопка «Что я пропустил?» для опоздавших
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/85 mt-3 leading-relaxed">
                  Если студент подключился позже, платформа не дает ему потерять нить. 
                  Система выдает краткую смысловую выжимку пропущенных 20 минут в 2 тезиса.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111318] text-white text-xs font-mono-tag">
                <span className="text-[#AEDB00]">Фокус:</span> 94% студентов доходят до конца пары
              </div>
            </div>

            {/* Feature 4: Multi-format Export (7 cols, Tactile Cream #F5F2E8) */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-xl bg-[#F5F2E8] text-[#111318] flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#2A46C7] font-bold mb-3">
                  <Download className="w-3.5 h-3.5" />
                  <span>МНОГОФОРМАТНЫЙ ЭКСПОРТ</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#111318]">
                  Материалы готовы к звонку
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/75 mt-3 leading-relaxed">
                  Никаких часов на перепечатку лекций. FILL AI автоматически выгружает колоды Anki TSV 
                  для подготовки к сессии, PDF-конспект со слайдами и текстовый отчёт в WhatsApp для кафедры.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-tag font-bold">
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
      {/* 4. SERVICES & USE CASES: УНИВЕРСИТЕТЫ, ОНЛАЙН-КУРСЫ, ПРЕПОДАВАТЕЛИ         */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="tag-brand-blue mb-3">
              ФОРМАТЫ И УСЛУГИ
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
              Решения для университетов и онлайн-образования
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3">
              Интеграция в действующий учебный процесс без замены существующей инфраструктуры.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Service 1: University */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6 hover:border-[#2A46C7] transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#2A46C7] text-white flex items-center justify-center mb-4">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">
                  Для университетов и институтов
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Полная цифровизация аудиторных лекций кафедры. Автоматическое формирование аккредитационных 
                  материалов, синхронизация с LMS Platonus и Moodle, единый электронный журнал посещаемости для деканата.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Интеграция с Platonus / Moodle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Локальный закрытый контур (On-Premise)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Поддержка до 5 000 студентов</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="w-full btn-solid h-10 text-xs font-semibold"
              >
                Подключить факультет
              </button>
            </div>

            {/* Service 2: Online EdTech Schools */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#141822] border-2 border-[#2A46C7] flex flex-col justify-between gap-6 shadow-2xl relative">
              <div className="absolute -top-3 right-6 bg-[#AEDB00] text-[#111318] text-[10px] font-mono-tag font-bold px-2.5 py-0.5 rounded">
                ПОПУЛЯРНО
              </div>

              <div>
                <div className="w-10 h-10 rounded-lg bg-[#2A46C7] text-white flex items-center justify-center mb-4">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">
                  Для онлайн-школ и курсов
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Повышение доходимости студентов до 92%. Превращение вебинаров в динамичные интерактивные сессии 
                  с мгновенными опросами и авто-выгрузкой конспектов в закрытые Telegram/WhatsApp каналы.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Рост доходимости до 92%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Автоматический Telegram/WhatsApp бот</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Кастомный брендинг школы</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="w-full btn-brand-blue h-10 text-xs font-semibold"
              >
                Начать пилотный проект
              </button>
            </div>

            {/* Service 3: Individual Teachers */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6 hover:border-[#2A46C7] transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#2A46C7] text-white flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">
                  Для преподавателей и репетиторов
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Идеальный помощник для ведения пар без рутины. Подключите ноутбук, начните говорить — 
                  и получите готовый структурированный конспект занятия с формулами к звонку.
                </p>

                <ul className="mt-6 space-y-2 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Быстрый старт за 2 минуты</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>До 30 студентов в одной группе</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#AEDB00]" />
                    <span>Экспорт в Anki и PDF</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="w-full btn-outline h-10 text-xs font-semibold"
              >
                Создать личный кабинет
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VERIFIED REVIEWS WITH REAL ACADEMIC PRACTITIONERS                       */}
      {/* ========================================================================= */}
      <section id="testimonials" className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#111318]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="tag-brand-blue mb-3">
              ОТЗЫВЫ ПРЕПОДАВАТЕЛЕЙ И СТУДЕНТОВ
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
              Реальный опыт использования в вузах Казахстана
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3">
              Преподаватели ведущих кафедр и студенты, использующие систему на занятиях.
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
                      {t.stat}
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

          {/* Institutional Partners Banner */}
          <div className="mt-14 p-6 rounded-xl bg-[#0a0c10] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <span className="font-mono-tag text-white/50 text-[11px] uppercase tracking-wider">
              Академические партнеры и пилотные площадки:
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
      {/* 6. FAQ: FREQUENTLY ASKED QUESTIONS ACCORDION                              */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-b border-white/10 bg-[#0d0f14]">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-14">
            <span className="tag-acid-green mb-3">
              ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-2">
              Ответы на ключевые вопросы о FILL AI
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3">
              Всё, что нужно знать перед началом работы и внедрением на кафедре.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-[#141822] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-display font-medium text-sm sm:text-base text-white">
                      {item.q}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white/70 flex-none">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-white/75 leading-relaxed border-t border-white/10">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CTA STRIP: READY TO TRANSFORM EDUCATION                                */}
      {/* ========================================================================= */}
      <section id="cta" className="py-20 px-4 sm:px-8 bg-[#0a0c10] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="tag-acid-green mb-4">
            НАЧНИТЕ БЕСПЛАТНО
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight mt-3 mb-4">
            Готовы превратить каждую пару в цифровой актив?
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-8 max-w-xl mx-auto leading-relaxed">
            Подключитесь за 2 минуты. Доступен полный функционал ведения лекций, распознавания формул 
            и моментальных опросов без привязки банковской карты.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register', 'teacher')}
              className="btn-brand-blue h-12 px-8 text-sm font-semibold flex items-center gap-2 shadow-xl"
            >
              <span>Зарегистрироваться бесплатно</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn-solid h-12 px-8 text-sm font-semibold"
            >
              <span>Войти в систему</span>
            </button>
          </div>

          <div className="mt-8 text-[11px] font-mono-tag text-white/40">
            Готово для демонстрации на выставке · Работает в браузере
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#08090d] py-10 px-4 sm:px-8 text-xs text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#2A46C7] flex items-center justify-center text-white font-display font-black text-xs">
              F
            </div>
            <div>
              <span className="font-display font-bold text-sm text-white">FILL AI</span>
              <div className="text-[10px] font-mono-tag text-white/40">
                Синхронная операционная система для высшего образования
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono-tag text-[11px]">
            <span>КазНУ · AITU · Astana Hub</span>
            <span className="text-white/20">•</span>
            <span>Алматы / Астана, Казахстан</span>
            <span className="text-white/20">•</span>
            <span>© 2026 FILL AI. Все права защищены.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
