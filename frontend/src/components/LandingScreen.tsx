import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Clock, 
  Download, 
  CheckCircle2, 
  Radio, 
  Sparkles 
} from 'lucide-react';
import { ScreenId } from './Header';
import { MathFormula } from './MathFormula';

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
    a: 'Система использует специализированный семантический парсер на базе Gemini 3.5. Когда преподаватель говорит «потенциал покоя по формуле Гольдмана равен...», движок автоматически транслирует речь в синтаксически выверенный LaTeX-код и рендерит его в векторную типографику.'
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
    a: 'Нажмите кнопку «Начать бесплатно», выберите роль преподавателя и начните тестовое занятие за 2 минуты. Доступен полный функционал без ввода банковской карты.'
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
    quote: 'Если ты заболел или опоздал на 15 минут из-за пробки, кнопка «Что я пропустил?» выдает четкую выжимку тезисов. А формулы выводятся в каноническом виде с аудиофрагментами лектора.',
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

interface FormulaItem {
  id: string;
  discipline: string;
  name: string;
  speech: string;
  latex: string;
  explanation: string;
}

const FORMULAS_DATA: FormulaItem[] = [
  {
    id: 'goldman',
    discipline: 'Биофизика мембран',
    name: 'Уравнение Гольдмана-Ходжкина-Катца',
    speech: '«Потенциал покоя мембраны равен отношению RT к F, умноженному на натуральный логарифм дроби проницаемостей ионов калия, натрия и хлора снаружи и внутри клетки...»',
    latex: 'E_m = \\frac{RT}{F} \\ln \\left( \\frac{P_{\\text{K}}[\\text{K}^+]_o + P_{\\text{Na}}[\\text{Na}^+]_o + P_{\\text{Cl}}[\\text{Cl}^-]_i}{P_{\\text{K}}[\\text{K}^+]_i + P_{\\text{Na}}[\\text{Na}^+]_i + P_{\\text{Cl}}[\\text{Cl}^-]_o} \\right)',
    explanation: 'Расчет мембранного трансмембранного потенциала покоя клетки с учетом проницаемостей P и концентраций ионов.'
  },
  {
    id: 'schrodinger',
    discipline: 'Квантовая механика & Физика',
    name: 'Уравнение Шрёдингера (временное)',
    speech: '«Мнимая единица на постоянную Планка умножить на частную производную пси по времени равна гамильтониану, действующему на пси...»',
    latex: 'i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)',
    explanation: 'Фундаментальное уравнение волновой функции частицы в переменном потенциальном поле.'
  },
  {
    id: 'shannon',
    discipline: 'AI & Теория информации',
    name: 'Энтропия Шеннона & Cross-Entropy Loss',
    speech: '«Функция потерь кросс-энтропии определяется как минус сумма истинных меток на логарифм предсказанных вероятностей софтмакса...»',
    latex: '\\mathcal{L}_{\\text{CE}} = -\\sum_{c=1}^{M} y_{o,c} \\ln(p_{o,c}), \\quad H(X) = -\\sum_{i=1}^n P(x_i)\\log_2 P(x_i)',
    explanation: 'Оценка неопределенности распределения и градиент обучения современных трансформерных моделей.'
  }
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate: _onNavigate, onOpenAuth }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(1);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('goldman');
  const [interactiveQuizChoice, setInteractiveQuizChoice] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const activeFormula = FORMULAS_DATA.find((f) => f.id === selectedFormulaId) || FORMULAS_DATA[0];

  return (
    <div className="w-full bg-[#0a0c10] text-white overflow-x-hidden font-body selection:bg-[#2A46C7] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: ART-DIRECTED ARCHITECTURAL COMPOSITION                  */}
      {/* ========================================================================= */}
      <section id="hero" className="relative w-full border-b border-white/10 bg-[#07090e] pt-20 pb-24 px-4 sm:px-8 overflow-hidden bg-academic-grid">
        
        {/* Visual Architectural Elements: Deep Cobalt Halo, Concentric Rings & Coordinate Grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[#2A46C7]/25 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.07] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-dashed border-white/[0.05] pointer-events-none" />
        
        {/* Floating Technical Coordinates & Pips */}
        <div className="absolute top-12 left-10 hidden xl:flex items-center gap-2 font-mono-tag text-[10px] text-white/30 tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#AEDB00] animate-pulse" />
          <span>REALTIME SPEECH PARSER · LATENCY &lt; 800MS</span>
        </div>
        <div className="absolute top-12 right-10 hidden xl:flex items-center gap-2 font-mono-tag text-[10px] text-white/30 tracking-widest uppercase">
          <span>ALMATY / ASTANA</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A46C7]" />
          <span>SECURE TLS 1.3</span>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Focal Tag Pill with Neon Green Indicator */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111624] border border-white/15 text-xs font-mono-tag mb-8 shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-[#AEDB00] shadow-[0_0_8px_#AEDB00]" />
              <span className="text-[#AEDB00] font-bold tracking-wider uppercase text-[11px]">
                FILL AI · СИНХРОННЫЙ АКАДЕМИЧЕСКИЙ СИНТЕЗ
              </span>
              <span className="text-white/30">|</span>
              <span className="text-white/60 text-[11px]">ДЛЯ ВУЗОВ И КУРСОВ</span>
            </motion.div>

            {/* Dramatic Master Headline with Typography Interplay */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-white tracking-tight leading-[1.06]"
            >
              Преподаватель объясняет суть. <br />
              <span className="font-serif italic font-normal text-[#AEDB00]">FILL AI синхронно</span> создаёт формулы, конспект и тесты.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-7 text-base sm:text-lg md:text-xl text-white/70 max-w-[58ch] leading-relaxed font-normal"
            >
              Никакой ручной расшифровки после уроков. Платформа прямо в ходе живой лекции превращает 
              речь профессора в канонические LaTeX-формулы, структурированный конспект и запускает моментальные 
              опросы аудитории за секунды.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="btn-brand-blue h-13 px-8 text-sm font-semibold flex items-center gap-2.5 shadow-2xl hover:scale-[1.02] transition-transform"
              >
                <span>Начать бесплатно</span>
                <ArrowRight className="w-4 h-4 text-white/90" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('pipeline');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-solid h-13 px-8 text-sm font-semibold flex items-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <span>Как это работает</span>
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="text-white/60 hover:text-white text-xs underline underline-offset-4 py-2 px-3 transition-colors"
              >
                Войти в кабинет →
              </button>
            </motion.div>

            {/* Micro Live Simulation Pill */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-12 w-full max-w-2xl bg-[#0e121a] border border-white/15 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A46C7] flex items-center justify-center text-white flex-none">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-mono-tag text-white/40 uppercase">Живой аудиопоток лектора</div>
                  <div className="text-xs sm:text-sm font-medium text-white truncate max-w-[260px] sm:max-w-md">
                    «...по формуле Гольдмана мембранный потенциал равен...»
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono-tag text-[11px] text-[#AEDB00] bg-[#1a2336] px-3 py-1.5 rounded-lg border border-white/10 flex-none">
                <Sparkles className="w-3.5 h-3.5 text-[#AEDB00]" />
                <span className="hidden sm:inline">KaTeX синтез:</span>
                <span className="font-bold">&lt; 780 мс</span>
              </div>
            </motion.div>

            {/* Hard Metrics Proof Points */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-4 border border-white/10 bg-[#0d0f14]/80 backdrop-blur-sm p-6 rounded-2xl text-left"
            >
              <div className="border-r border-white/10 pr-4 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase tracking-wider">Экономия времени</div>
                <div className="text-3xl font-display font-bold text-white mt-1">84%</div>
                <div className="text-[11px] text-white/50 mt-1">на подготовку конспектов и тестов</div>
              </div>

              <div className="border-r border-white/10 pr-4 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase tracking-wider">Скорость синтеза</div>
                <div className="text-3xl font-display font-bold text-[#AEDB00] mt-1">&lt; 800 мс</div>
                <div className="text-[11px] text-white/50 mt-1">с момента произнесения фразы</div>
              </div>

              <div className="border-r border-white/10 pr-4 last:border-none">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase tracking-wider">Запуск квиза</div>
                <div className="text-3xl font-display font-bold text-white mt-1">0 сек</div>
                <div className="text-[11px] text-white/50 mt-1">1 клик на смартфон каждого студента</div>
              </div>

              <div>
                <div className="text-[10px] font-mono-tag text-white/40 uppercase tracking-wider">Фокус аудитории</div>
                <div className="text-3xl font-display font-bold text-[#AEDB00] mt-1">94%</div>
                <div className="text-[11px] text-white/50 mt-1">активное участие всей группы</div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* Technical Academic Ruler Divider */}
      <div className="academic-ruler academic-ruler-major border-y border-white/10 opacity-70 flex items-center justify-between px-6 text-[9px] font-mono-tag text-white/30 select-none bg-[#090b10]">
        <span>000 mm</span>
        <span className="hidden sm:inline">250 mm · AUDIO FREQ 44.1 kHz</span>
        <span>500 mm · PIPELINE TRANSFORMATION</span>
        <span className="hidden sm:inline">750 mm · GEMINI PARSER</span>
        <span>1000 mm</span>
      </div>

      {/* ========================================================================= */}
      {/* 2. HOW IT WORKS: INTERACTIVE PIPELINE CONSOLE (CREATIVE & DYNAMIC)         */}
      {/* ========================================================================= */}
      <section id="pipeline" className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#090b10] relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-14">
            <span className="tag-brand-blue mb-3">
              СКВОЗНОЙ ПАЙПЛАЙН ЛЕКЦИИ
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-3">
              Как работает FILL AI в реальной аудитории
            </h2>
            <p className="text-sm sm:text-base text-white/60 mt-3 leading-relaxed">
              Нажмите на этап, чтобы увидеть работу модулей в реальном времени. Вся обработка происходит 
              на лету параллельно с живой речью лектора.
            </p>
          </div>

          {/* Interactive Pipeline Step Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            
            {/* Step 1 Tab Button */}
            <button
              onClick={() => setActivePipelineStep(0)}
              className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
                activePipelineStep === 0
                  ? 'bg-[#151a26] border-[#2A46C7] ring-1 ring-[#2A46C7]'
                  : 'bg-[#0e1118] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-tag text-xs font-bold ${
                  activePipelineStep === 0 ? 'bg-[#2A46C7] text-white' : 'bg-white/10 text-white/60'
                }`}>
                  01
                </span>
                <span className="text-[10px] font-mono-tag uppercase text-[#AEDB00] font-bold">
                  ЗАХВАТ ЗВУКА
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-white">Речь & Презентация</h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Шумоподавление Soniox + Groq, захват формул и слайдов через OpenCV.
              </p>
            </button>

            {/* Step 2 Tab Button */}
            <button
              onClick={() => setActivePipelineStep(1)}
              className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
                activePipelineStep === 1
                  ? 'bg-[#151a26] border-[#2A46C7] ring-1 ring-[#2A46C7]'
                  : 'bg-[#0e1118] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-tag text-xs font-bold ${
                  activePipelineStep === 1 ? 'bg-[#2A46C7] text-white' : 'bg-white/10 text-white/60'
                }`}>
                  02
                </span>
                <span className="text-[10px] font-mono-tag uppercase text-[#AEDB00] font-bold">
                  СИНТЕЗ GEMINI 3.5
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-white">Семантическое ядро</h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Синтаксический парсинг формул в чистый LaTeX, выделение ключевых тезисов.
              </p>
            </button>

            {/* Step 3 Tab Button */}
            <button
              onClick={() => setActivePipelineStep(2)}
              className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden ${
                activePipelineStep === 2
                  ? 'bg-[#151a26] border-[#2A46C7] ring-1 ring-[#2A46C7]'
                  : 'bg-[#0e1118] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-tag text-xs font-bold ${
                  activePipelineStep === 2 ? 'bg-[#2A46C7] text-white' : 'bg-white/10 text-white/60'
                }`}>
                  03
                </span>
                <span className="text-[10px] font-mono-tag uppercase text-[#AEDB00] font-bold">
                  ОТКЛИК И МАТЕРИАЛЫ
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-white">Студенты & Экспорт</h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                1-клик опрос смартфонов аудитории, конспект к звонку, карточки Anki.
              </p>
            </button>

          </div>

          {/* Interactive Pipeline Display Screen */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#111520] border border-white/15 shadow-2xl relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {activePipelineStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="tag-acid-green text-[10px]">ЭТАП 01 · ЗАХВАТ И ФИЛЬТРАЦИЯ</span>
                    <h3 className="text-2xl font-display font-bold text-white">
                      Преподаватель говорит свободно — система слышит смысл
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      Лектору не нужно подбирать темп или называть знаки препинания голосом. Нейросетевой 
                      модуль распознает русскую, казахскую и английскую терминологию с первого раза, отсекая 
                      посторонние шумы аудитории.
                    </p>
                    <div className="space-y-2 pt-2 text-xs font-mono-tag">
                      <div className="flex items-center gap-2 text-white/80">
                        <Check className="w-4 h-4 text-[#AEDB00]" />
                        <span>Частота дискретизации: 44.1 kHz, 16-bit PCM</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Check className="w-4 h-4 text-[#AEDB00]" />
                        <span>Синхронизация слайдов: OpenCV pHash perceptual hashing</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-[#090b10] border border-white/10 rounded-xl p-5 space-y-4 font-mono-tag">
                    <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/10 pb-3">
                      <span className="flex items-center gap-2 text-[#AEDB00]">
                        <Radio className="w-4 h-4 animate-pulse" />
                        ИНТЕЛЛЕКТУАЛЬНЫЙ СПЕКТРОАНАЛИЗАТОР
                      </span>
                      <span>BUFFER: 256 MS</span>
                    </div>

                    {/* Animated Audio Waveform Simulation */}
                    <div className="flex items-center justify-between h-16 px-4 bg-[#11141c] rounded-lg border border-white/5 gap-1.5">
                      {[40, 75, 20, 90, 60, 30, 85, 95, 45, 65, 80, 50, 90, 35, 70, 85, 60, 40, 95, 30, 75, 55].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-1.5 rounded-full bg-[#AEDB00] animate-pulse"
                        />
                      ))}
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#141824] border border-white/10 text-xs text-white/90">
                      <span className="text-[10px] text-white/40 block mb-1 uppercase">Распознанный транскрипт речи:</span>
                      «...когда натрий-калиевый насос расщепляет АТФ, три иона натрия выходят наружу против градиента, а два иона калия входят внутрь...»
                    </div>
                  </div>
                </motion.div>
              )}

              {activePipelineStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="tag-brand-blue text-[10px]">ЭТАП 02 · СИНТЕЗ ФОРМУЛ И ТЕЗИСОВ</span>
                    <h3 className="text-2xl font-display font-bold text-white">
                      Мгновенная трансформация устной речи в канонический LaTeX
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      Когда лектор диктует сложную физическую или математическую зависимость, система не просто 
                      записывает слова, а генерирует точную математическую формулу с дробями, индексами и интегралами.
                    </p>
                    <div className="p-3 rounded-lg bg-[#0e121a] border border-white/10 text-xs font-mono-tag text-white/70">
                      <span className="text-[#AEDB00] font-bold">Синтаксический валидатор:</span> 100% синтаксическая корректность перед выводом на экран студентов.
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-[#090b10] border border-white/10 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono-tag text-white/50 border-b border-white/10 pb-3">
                      <span className="text-[#2A46C7] font-bold">LATEX СЕМАНТИЧЕСКИЙ ВЫВОД</span>
                      <span className="text-[#AEDB00]">СИНХРОНИЗИРОВАНО</span>
                    </div>

                    <div className="p-5 rounded-xl bg-[#141824] border border-[#2A46C7]/30 text-center overflow-x-auto shadow-inner">
                      <div className="text-[10px] font-mono-tag text-white/40 mb-3 uppercase">Синтезированная векторная формула:</div>
                      <MathFormula formula="E_m = \frac{RT}{F} \ln \left( \frac{P_{\text{K}}[\text{K}^+]_o + P_{\text{Na}}[\text{Na}^+]_o}{P_{\text{K}}[\text{K}^+]_i + P_{\text{Na}}[\text{Na}^+]_i} \right)" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono-tag text-white/70">
                      <div className="p-3 bg-[#11141c] rounded-lg border border-white/5">
                        <span className="text-white/40 block text-[10px]">ВХОДНОЙ АУДИОФРАГМЕНТ</span>
                        <span>00:14:28 — 00:14:35</span>
                      </div>
                      <div className="p-3 bg-[#11141c] rounded-lg border border-white/5">
                        <span className="text-white/40 block text-[10px]">ВРЕМЯ КОМПИЛЯЦИИ</span>
                        <span className="text-[#AEDB00] font-bold">640 миллисекунд</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePipelineStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="tag-acid-green text-[10px]">ЭТАП 03 · МГНОВЕННЫЙ ОТКЛИК</span>
                    <h3 className="text-2xl font-display font-bold text-white">
                      1-клик экспресс-опрос прямо в смартфоны студентов
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      Преподаватель нажимает одну кнопку на экране — у 30 студентов в аудитории появляется 
                      вопрос. Через 20 секунд лектор видит распределение ответов и разбирает типичные ошибки.
                    </p>
                    <div className="space-y-2 text-xs font-mono-tag text-white/70">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#AEDB00]" />
                        <span>Авто-экспорт отчета посещаемости для WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#AEDB00]" />
                        <span>Карточки Anki TSV готовы сразу к звонку</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Live Quiz Simulation */}
                  <div className="lg:col-span-7 bg-[#090b10] border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono-tag border-b border-white/10 pb-3">
                      <span className="text-[#AEDB00] font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#AEDB00] animate-pulse" />
                        ДЕМОНСТРАЦИОННЫЙ ВОПРОС АУДИТОРИИ (НАЖМИТЕ ОТВЕТ):
                      </span>
                      <span className="text-white/40">28/30 ответили</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141824] border border-white/10 space-y-3">
                      <div className="text-xs font-display font-bold text-white">
                        Какой ион имеет наивысшую проницаемость через мембрану в состоянии покоя?
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'A', text: 'Ионы натрия (Na+)', isCorrect: false },
                          { id: 'B', text: 'Ионы калия (K+)', isCorrect: true },
                          { id: 'C', text: 'Ионы хлора (Cl-)', isCorrect: false }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setInteractiveQuizChoice(opt.id)}
                            className={`w-full text-left p-3 rounded-lg border text-xs font-mono-tag transition-all flex items-center justify-between ${
                              interactiveQuizChoice === opt.id
                                ? opt.isCorrect
                                  ? 'bg-[#AEDB00]/20 border-[#AEDB00] text-white font-bold'
                                  : 'bg-red-500/20 border-red-500 text-white'
                                : 'bg-[#0f121a] border-white/10 text-white/80 hover:border-white/30'
                            }`}
                          >
                            <span>{opt.id}. {opt.text}</span>
                            {interactiveQuizChoice === opt.id && (
                              <span className="text-[10px] uppercase font-bold">
                                {opt.isCorrect ? '✓ Верно (78% группы)' : '✗ Ошибка (12% группы)'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {interactiveQuizChoice && (
                        <div className="text-[11px] font-mono-tag text-[#AEDB00] pt-1">
                          ✓ Результат зафиксирован в общем отчёте занятия
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LATEX FORMULA ENGINE SHOWCASE: PRISTINE MATHEMATICAL TYPESETTING       */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#0d0f17] relative bg-academic-dots">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="tag-acid-green mb-3">
                ВЕКТОРНЫЙ СЕМАНТИЧЕСКИЙ РЕНДЕРИНГ
              </span>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
                Живая речь → Академический KaTeX
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 max-w-[48ch] leading-relaxed">
              Больше никаких нечитаемых каракулей на доске или сырых формул в Word. 
              Система автоматически транслирует живую речь преподавателя в типографику уровня академических журналов.
            </p>
          </div>

          {/* Formula Subject Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FORMULAS_DATA.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedFormulaId(item.id)}
                className={`text-xs font-mono-tag px-4 py-2 rounded-lg border transition-all ${
                  selectedFormulaId === item.id
                    ? 'bg-[#2A46C7] border-[#2A46C7] text-white font-semibold shadow-md'
                    : 'bg-[#131622] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {item.discipline}
              </button>
            ))}
          </div>

          {/* Master Formula Display Card */}
          <div className="rounded-2xl bg-[#131722] border border-white/15 p-6 sm:p-10 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-mono-tag uppercase text-white/40">Название зависимости:</span>
                <h3 className="text-lg sm:text-xl font-display font-bold text-white">
                  {activeFormula.name}
                </h3>
              </div>
              <span className="text-xs font-mono-tag text-[#AEDB00] px-3 py-1 rounded bg-[#AEDB00]/10 border border-[#AEDB00]/30 w-fit">
                СИНТАКСИЧЕСКИ ВЫВЕРЕНО
              </span>
            </div>

            {/* Before / After Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left: Raw Speech Transcription */}
              <div className="lg:col-span-5 p-5 rounded-xl bg-[#090b10] border border-white/10 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono-tag text-white/40 uppercase mb-2">
                    <Radio className="w-3.5 h-3.5 text-[#2A46C7]" />
                    <span>Сырой аудиопоток лектора в микрофон:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 italic leading-relaxed font-body">
                    {activeFormula.speech}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 text-[11px] font-mono-tag text-white/40">
                  Язык: смешанный научно-русский с латинскими символами
                </div>
              </div>

              {/* Right: Beautiful KaTeX Rendered Formula */}
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-[#07090e] border border-[#2A46C7]/50 shadow-inner flex flex-col justify-between space-y-4 text-center">
                <div className="text-[10px] font-mono-tag text-white/40 uppercase text-left">
                  Векторная компиляция KaTeX:
                </div>

                <div className="py-4 overflow-x-auto text-white">
                  <MathFormula formula={activeFormula.latex} className="text-lg sm:text-2xl" />
                </div>

                <div className="text-left text-xs text-white/60 font-body border-t border-white/10 pt-3">
                  <strong className="text-[#AEDB00] font-mono-tag">Семантический комментарий: </strong>
                  {activeFormula.explanation}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURES BENTO GRID: COMPREHENSIVE CAPABILITIES                        */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="tag-acid-green mb-3">
                ВОЗМОЖНОСТИ ПЛАТФОРМЫ
              </span>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
                Инструменты для продуктивного урока
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 max-w-[45ch] leading-relaxed">
              Создано при участии ведущих преподавателей биофизики, IT и иностранных языков Казахстана.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Feature 1: Speech to LaTeX (7 cols) */}
            <div className="md:col-span-7 p-7 sm:p-9 rounded-2xl bg-[#141822] border border-white/15 flex flex-col justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#AEDB00] mb-3">
                  <Zap className="w-4 h-4" />
                  <span>СИНХРОННЫЙ АКАДЕМИЧЕСКИЙ СИНТЕЗ</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-white">
                  Автоматический LaTeX-конспект из живой речи
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  Лектор говорит о разности потенциалов или дифференциальных уравнениях — система 
                  моментально конструирует чистые блоки конспекта с привязкой к слайдам и таймкодам речи.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#090b10] border border-white/10 font-mono-tag text-xs text-white/80 space-y-2">
                <div className="text-[10px] text-white/40 uppercase">Распознанная формула:</div>
                <div className="text-white py-1">
                  <MathFormula formula="E_m = \frac{RT}{F} \ln \left( \frac{P_K[K^+]_o + P_{Na}[Na^+]_o}{P_K[K^+]_i + P_{Na}[Na^+]_i} \right)" />
                </div>
              </div>
            </div>

            {/* Feature 2: 1-Click Audience Quizzes (5 cols, Solid Blue #2A46C7) */}
            <div className="md:col-span-5 p-7 sm:p-9 rounded-2xl bg-[#2A46C7] text-white flex flex-col justify-between gap-6 shadow-2xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-white/80 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#AEDB00]" />
                  <span>ПРОВЕРКА ЗНАНИЙ В ЭФИРЕ</span>
                </div>
                <h3 className="text-2xl font-display font-bold leading-tight">
                  Экспресс-опросы аудитории в 1 клик
                </h3>
                <p className="text-xs sm:text-sm text-white/90 mt-3 leading-relaxed">
                  Одна кнопка на экране преподавателя — и 28 студентов отвечают на смартфонах без скачивания приложений. 
                  Преподаватель сразу видит гистограмму ответов и разбирает типичные ошибки.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/25 border border-white/20 text-xs font-mono-tag flex items-center justify-between">
                <span>Скорость сбора ответов:</span>
                <span className="text-[#AEDB00] font-bold">18 секунд на группу</span>
              </div>
            </div>

            {/* Feature 3: Catch-Up Module (5 cols, Solid Acid Green #AEDB00) */}
            <div className="md:col-span-5 p-7 sm:p-9 rounded-2xl bg-[#AEDB00] text-[#111318] flex flex-col justify-between gap-6 shadow-2xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#111318]/70 mb-3">
                  <Clock className="w-4 h-4 text-[#111318]" />
                  <span>УМНЫЙ CATCH-UP</span>
                </div>
                <h3 className="text-2xl font-display font-bold leading-tight">
                  Кнопка «Что я пропустил?» для опоздавших
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/85 mt-3 leading-relaxed">
                  Если студент подключился позже, платформа не дает ему потерять нить. 
                  Система выдает краткую смысловую выжимку пропущенных 20 минут в 2 тезиса с формулами.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111318] text-white text-xs font-mono-tag">
                <span className="text-[#AEDB00]">Фокус:</span> 94% студентов доходят до конца пары
              </div>
            </div>

            {/* Feature 4: Multi-format Export (7 cols, Tactile Cream #F5F2E8) */}
            <div className="md:col-span-7 p-7 sm:p-9 rounded-2xl bg-[#F5F2E8] text-[#111318] flex flex-col justify-between gap-6 shadow-2xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tag text-[#2A46C7] font-bold mb-3">
                  <Download className="w-4 h-4" />
                  <span>МНОГОФОРМАТНЫЙ ЭКСПОРТ</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-[#111318]">
                  Материалы готовы к звонку
                </h3>
                <p className="text-xs sm:text-sm text-[#111318]/75 mt-3 leading-relaxed">
                  Никаких часов на перепечатку лекций. FILL AI автоматически формирует файл конспекта, 
                  карточки Anki TSV для интервального повторения и WhatsApp-отчет присутствия для деканата.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono-tag">
                <span className="px-3 py-1.5 rounded-lg bg-[#111318] text-white font-bold">PDF Конспект</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#2A46C7] text-white font-bold">Anki TSV</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#AEDB00] text-[#111318] font-bold">WhatsApp Отчёт</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SERVICES & INSTITUTIONAL PRICING TIERS                                */}
      {/* ========================================================================= */}
      <section id="services" className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#07090e]">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-14">
            <span className="tag-brand-blue mb-3">
              ТАРИФНЫЕ ПЛАНЫ И УСЛУГИ
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
              Прозрачные тарифы для лекторов и вузов
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3 leading-relaxed">
              От индивидуальных преподавателей до развертывания в масштабе целого университета с локальным контуром.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tier 1: Free Pilot */}
            <div className="p-7 rounded-2xl bg-[#11141c] border border-white/10 flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
              <div>
                <div className="text-xs font-mono-tag text-white/40 uppercase">Для знакомства</div>
                <h3 className="text-xl font-display font-bold text-white mt-1">Индивидуальный пилот</h3>
                <div className="mt-4 text-3xl font-display font-bold text-white">0 ₸</div>
                <div className="text-xs text-white/50 mt-1">Бесплатно навсегда</div>

                <div className="space-y-3 mt-6 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>До 3 живых лекций в неделю</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Базовый синтез формул и конспекта</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Экспресс-опросы до 30 студентов</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="btn-outline w-full text-xs font-semibold h-11"
              >
                Начать бесплатно
              </button>
            </div>

            {/* Tier 2: Department / Online School (Highlighted Blue) */}
            <div className="p-7 rounded-2xl bg-[#182038] border-2 border-[#2A46C7] flex flex-col justify-between gap-6 relative shadow-2xl">
              <span className="absolute -top-3 left-6 text-[10px] font-mono-tag bg-[#AEDB00] text-[#111318] px-3 py-0.5 rounded-full font-bold uppercase">
                ХИТ ДЛЯ КАФЕДР
              </span>
              <div>
                <div className="text-xs font-mono-tag text-[#AEDB00] uppercase font-bold">Кафедра & Онлайн-школа</div>
                <h3 className="text-xl font-display font-bold text-white mt-1">Академический Pro</h3>
                <div className="mt-4 text-3xl font-display font-bold text-white">45 000 ₸</div>
                <div className="text-xs text-white/60 mt-1">в месяц за кафедру до 10 преподавателей</div>

                <div className="space-y-3 mt-6 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Безлимитные лекции и вебинары</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Экспорт в Anki, PDF, WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Приоритетный доступ к Gemini 3.5 (&lt; 800 мс)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Аналитика вовлеченности групп</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="btn-brand-blue w-full text-xs font-semibold h-11 shadow-lg"
              >
                Подключить кафедру
              </button>
            </div>

            {/* Tier 3: Enterprise University */}
            <div className="p-7 rounded-2xl bg-[#11141c] border border-white/10 flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
              <div>
                <div className="text-xs font-mono-tag text-white/40 uppercase">Масштаб вуза</div>
                <h3 className="text-xl font-display font-bold text-white mt-1">University On-Premise</h3>
                <div className="mt-4 text-3xl font-display font-bold text-white">Договорная</div>
                <div className="text-xs text-white/50 mt-1">Развертывание в изолированном контуре</div>

                <div className="space-y-3 mt-6 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Интеграция с Platonus, Canvas, Moodle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Хранение данных строго в Республике Казахстан</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#AEDB00]" />
                    <span>Выделенный SLA 99.9% и обучение персонала</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register', 'teacher')}
                className="btn-outline w-full text-xs font-semibold h-11"
              >
                Запросить пилот для ВУЗа
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TESTIMONIALS WITH REAL FACULTY PROFILES                                */}
      {/* ========================================================================= */}
      <section id="testimonials" className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-14">
            <span className="tag-acid-green mb-3">
              ОТЗЫВЫ ПРЕПОДАВАТЕЛЕЙ И СТУДЕНТОВ
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
              Проверено в аудиториях вузов
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div 
                key={idx}
                className="p-7 sm:p-8 rounded-2xl bg-[#131620] border border-white/10 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={t.photo} 
                      alt={t.name}
                      className="w-13 h-13 rounded-full object-cover border-2 border-white/20"
                    />
                    <div>
                      <h4 className="text-base font-display font-bold text-white">{t.name}</h4>
                      <p className="text-xs text-white/50">{t.role}</p>
                      <p className="text-xs text-[#AEDB00] font-mono-tag">{t.org}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed italic">
                    «{t.quote}»
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-tag">
                  <span className="text-white/40">Эффект внедрения:</span>
                  <span className="text-[#AEDB00] font-bold">{t.stat}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ ACCORDION                                                         */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 px-4 sm:px-8 border-b border-white/10 bg-[#07090e]">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-14">
            <span className="tag-brand-blue mb-3">
              ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
              Всё, что нужно знать о внедрении
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-[#0e1118] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4"
                  >
                    <span className="text-sm sm:text-base font-display font-bold text-white">
                      {item.q}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 flex-none">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
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
      {/* 8. MASTER CALL TO ACTION                                                 */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-8 bg-[#0a0c10] text-center relative overflow-hidden bg-academic-grid">
        <div className="max-w-4xl mx-auto relative z-10">
          
          <span className="tag-acid-green mb-5">
            ГОТОВО К ДЕМОНСТРАЦИИ НА ЯРМАРКЕ
          </span>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
            Превратите каждую лекцию в <br />
            <span className="font-serif italic font-normal text-[#AEDB00]">структурированный цифровой актив</span>.
          </h2>

          <p className="text-sm sm:text-base text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Подключение за 2 минуты. Доступен полный функционал ведения лекций, распознавания формул 
            и моментальных опросов без привязки банковской карты.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register', 'teacher')}
              className="btn-brand-blue h-13 px-9 text-sm font-semibold flex items-center gap-2 shadow-2xl hover:scale-[1.02] transition-transform"
            >
              <span>Зарегистрироваться бесплатно</span>
              <ArrowRight className="w-4 h-4 text-white/90" />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn-solid h-13 px-9 text-sm font-semibold hover:scale-[1.02] transition-transform"
            >
              <span>Войти в систему</span>
            </button>
          </div>

          <div className="mt-8 text-[11px] font-mono-tag text-white/40">
            Работает прямо в веб-браузере · Полная совместимость с мобильными устройствами
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#06080c] py-12 px-4 sm:px-8 text-xs text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2A46C7] flex items-center justify-center text-white font-display font-black text-sm">
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
