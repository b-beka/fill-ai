import { 
  Play, 
  Mic, 
  Monitor, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Quote,
  Star,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth?: (role?: 'teacher' | 'student') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, onOpenAuth }) => {
  const scrollToExplore = () => {
    document.getElementById('platform-features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-[#000000] text-white overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Liquid Metal Pure Black Single-Viewport Architecture)   */}
      {/* ========================================================================= */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden bg-[#000000]">
        
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-60 scale-105"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
          />
        </div>

        {/* Ambient Dark Scrim and Tech Grain Overlay */}
        <div className="hero-scrim z-1" />
        <div className="grain-overlay z-1" />

        {/* Top Spacer / Ambient Accents */}
        <div className="relative z-10 w-full pt-10 sm:pt-16 flex items-center justify-center">
          {/* Sparkle Pill */}
          <div className="appear appear--soft liquid-badge cursor-pointer hover:border-white/40 transition-colors" onClick={scrollToExplore}>
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>Операционная образовательная инфраструктура нового поколения</span>
          </div>
        </div>

        {/* Main Center-Bottom Hero Copy */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-10 flex flex-col items-center text-center">
          
          {/* 2-Line Headline with Instrument Serif Italic Accent */}
          <h1 className="appear appear--pop text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-head text-white max-w-[20ch] leading-[1.12]">
            Интеллектуальная среда для живых лекций с оркестрацией{' '}
            <span className="font-serif-italic font-normal text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              AI-агентов
            </span>
          </h1>

          {/* Lede Narrative */}
          <p className="appear appear--soft mt-6 text-sm sm:text-base md:text-lg text-[#9a9a9a] max-w-[48ch] leading-relaxed">
            FILL AI слушает лектора, синхронизирует слайды и конструирует мультимедийный конспект, моментальные квизы и смысловой трекинг присутствия — прямо во время эфира.
          </p>

          {/* Interactive CTA Buttons */}
          <div className="appear appear--btn mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('live')}
              className="btn-liquid-solid flex items-center gap-2 group"
            >
              <Radio className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
              <span>Запустить эфир преподавателя</span>
            </button>

            <button
              onClick={() => onNavigate('student')}
              className="btn-liquid-ghost flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 text-white fill-white/80 group-hover:scale-110 transition-transform" />
              <span>Войти как ученик</span>
            </button>

            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('teacher')}
                className="text-xs text-[#9a9a9a] hover:text-white underline underline-offset-4 py-2 px-3 transition-colors"
              >
                Выбрать демо-профиль →
              </button>
            )}
          </div>

          {/* Live Micro Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] sm:text-xs text-[#9a9a9a] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Русский · Қазақша · English
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Zero-Cost OpenCV Slide Sync
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Instant 0ms Distractor Explanations
            </span>
          </div>

        </div>

        {/* 3-Item Stats Footer Bar */}
        <div className="relative z-10 w-full border-t border-white/10 bg-black/70 backdrop-blur-md py-6 px-6 sm:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="appear appear--stat flex items-start gap-4" style={{ animationDelay: '0.1s' }}>
              <span className="font-mono text-xs text-white/40 pt-1">01</span>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-head text-white tracking-tight">
                  84%
                </div>
                <div className="text-xs sm:text-[13px] text-[#9a9a9a] mt-0.5 leading-snug">
                  Сокращение рутинной подготовки конспектов, тестов и Anki-карточек
                </div>
              </div>
            </div>

            <div className="appear appear--stat flex items-start gap-4" style={{ animationDelay: '0.2s' }}>
              <span className="font-mono text-xs text-white/40 pt-1">02</span>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-head text-white tracking-tight">
                  0 ms
                </div>
                <div className="text-xs sm:text-[13px] text-[#9a9a9a] mt-0.5 leading-snug">
                  Мгновенная выдача пояснений к неверным ответам (дистракторам)
                </div>
              </div>
            </div>

            <div className="appear appear--stat flex items-start gap-4" style={{ animationDelay: '0.3s' }}>
              <span className="font-mono text-xs text-white/40 pt-1">03</span>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-head text-white tracking-tight">
                  180+
                </div>
                <div className="text-xs sm:text-[13px] text-[#9a9a9a] mt-0.5 leading-snug">
                  Аудиторий и онлайн-курсов в программе пилотного внедрения
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. PARALLEL AI ENGINES TRIAD (Слушает · Смотрит · Синтезирует)             */}
      {/* ========================================================================= */}
      <section id="platform-features" className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#050607]">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="liquid-badge text-[11px] mb-3">
                <Cpu className="w-3.5 h-3.5 text-white" />
                Архитектура реального времени
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-head text-white tracking-tight mt-1">
                Три параллельных потока FILL AI
              </h2>
            </div>
            <p className="text-sm text-[#9a9a9a] max-w-[42ch]">
              Без задержек и ручной пост-обработки. Все процессы выполняются одновременно, пока преподаватель ведёт урок как обычно.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Audio */}
            <div className="p-7 rounded-2xl bg-[#0c0d10] border border-white/10 hover:border-white/25 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform">
                  <Mic className="w-6 h-6 text-sky-400" />
                </div>
                <div className="text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
                  Soniox + Groq ASR
                </div>
                <h3 className="text-lg font-bold font-head text-white mb-3">
                  Слушает и транскрибирует
                </h3>
                <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed">
                  Потоковое распознавание речи со словарём терминов (биология, IT, высшая математика) с задержкой 400 мс даже с одного микрофона в большой аудитории.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                <span>Multi-language</span>
                <span className="text-emerald-400 font-semibold">RU / KZ / EN</span>
              </div>
            </div>

            {/* Card 2: Vision */}
            <div className="p-7 rounded-2xl bg-[#0c0d10] border border-white/10 hover:border-white/25 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform">
                  <Monitor className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
                  OpenCV + Zero-Cost pHash
                </div>
                <h3 className="text-lg font-bold font-head text-white mb-3">
                  Смотрит на экран и доску
                </h3>
                <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed">
                  Выявляет смену слайдов, формулы и новые рисунки. В конспект попадают только содержательные кадры в высоком разрешении с привязкой к таймкодам.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                <span>Perceptual Hash</span>
                <span className="text-emerald-400 font-semibold">&lt; 15 ms processing</span>
              </div>
            </div>

            {/* Card 3: Synthesis */}
            <div className="p-7 rounded-2xl bg-[#0c0d10] border border-white/10 hover:border-white/25 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                  Gemini Flash + Claude Sonnet
                </div>
                <h3 className="text-lg font-bold font-head text-white mb-3">
                  Собирает живой конспект
                </h3>
                <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed">
                  Оркестратор собирает единый структурированный конспект: формулы LaTeX, аудиоцитаты, фрагменты кода и экспресс-тесты по голосовой команде «Вопрос».
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                <span>VLM Synthesis</span>
                <span className="text-emerald-400 font-semibold">Instant Render</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. YOUTUBE-STYLE LIVE EXPERIENCE PREVIEW (Cinema Screen Teaser)           */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#000000]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="liquid-badge text-[11px] mb-3">
              <Play className="w-3 h-3 text-white fill-white" />
              Интерфейс ученика нового поколения
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-head text-white tracking-tight mt-1">
              Эфир как в YouTube — только с живым конспектом
            </h2>
            <p className="text-sm sm:text-base text-[#9a9a9a] mt-3">
              Студент видит 16:9 трансляцию лектора, а под ней — синхронно растущий конспект. Рядом — моментальные квизы без задержек.
            </p>
          </div>

          {/* Cinema Mockup Preview */}
          <div className="rounded-2xl border border-white/15 bg-[#090b0e] p-4 sm:p-6 shadow-2xl overflow-hidden">
            
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-white/50 ml-3">fill-ai.live/session/biomembranes</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="liquid-badge py-0.5 px-2 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
                <span className="font-mono text-white/60">28 учеников в эфире</span>
              </div>
            </div>

            {/* Split Grid Mock: Cinema Player + Side Quiz */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left: 16:9 Video Mock */}
              <div className="lg:col-span-8 rounded-xl bg-[#030304] border border-white/10 aspect-video relative overflow-hidden flex flex-col justify-between p-4 group">
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-bold font-head text-white/90 bg-black/60 px-3 py-1 rounded-md backdrop-blur-md border border-white/10">
                    Лекция: Биомембраны и транспорт веществ
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1 rounded-md border border-white/10">
                    1080p 60fps
                  </span>
                </div>

                {/* Simulated Visual Screen */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                  <div className="w-full h-full bg-gradient-to-tr from-sky-950/30 via-transparent to-emerald-950/20 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-lg sm:text-xl font-bold font-head text-white/80">
                        Фосфолипидный бислой & Натрий-калиевый насос
                      </div>
                      <div className="text-xs font-mono text-white/40 mt-1">
                        Zero-Cost Slide Capture #2 · pHash Sync Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Player Controls Mock */}
                <div className="z-10 flex items-center justify-between bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <button className="text-white hover:text-emerald-400 transition-colors">
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                    <span className="text-[11px] font-mono text-white/60">42:15 / 60:00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/60">Спикер: Д-р Аскар Ибраев</span>
                  </div>
                </div>
              </div>

              {/* Right: Side Quiz Mock */}
              <div className="lg:col-span-4 rounded-xl bg-[#111316] border border-white/10 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Экспресс-опрос лектора
                    </span>
                    <span className="text-[11px] font-mono text-white/50">00:18</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white mb-3">
                    Какая часть молекулы фосфолипида гидрофобна?
                  </h4>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-none" />
                      <span>Углеводородные хвосты жирных кислот</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-white/10 bg-[#16191e] text-xs text-[#9a9a9a] flex items-center gap-2 opacity-60">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center text-[9px]">B</span>
                      <span>Фосфатная головка</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#9a9a9a]">
                  <strong className="text-emerald-400 font-semibold">0ms Пояснение: </strong>
                  Хвосты обращены внутрь мембраны, образуя гидрофобное ядро.
                </div>
              </div>

            </div>

            {/* Bottom Teaser for Note Blocks Underneath */}
            <div className="mt-5 p-4 rounded-xl bg-[#0e1013] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">
                  Конспект собирается прямо под видео
                </div>
                <div className="text-[11px] text-[#9a9a9a]">
                  Каждый блок содержит слайд, аудиофрагмент речи учителя и формулы в LaTeX.
                </div>
              </div>
              <button
                onClick={() => onNavigate('student')}
                className="btn-liquid-solid text-xs h-8 px-4 flex-none"
              >
                Открыть студенческий вид
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VERIFIED REVIEWS & TESTIMONIALS ("Люди с отзывами")                   */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#050607]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="liquid-badge text-[11px] mb-3">
              <Quote className="w-3 h-3 text-white" />
              Отзывы преподавателей и студентов
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-head text-white tracking-tight mt-1">
              Что говорят участники пилотных уроков
            </h2>
            <p className="text-sm sm:text-base text-[#9a9a9a] mt-3">
              Реальные впечатления преподавателей ведущих вузов и студентов, опробовавших живые лекции с FILL AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Review 1 */}
            <div className="p-6 rounded-2xl bg-[#0b0d10] border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed mb-6">
                  «Больше не нужно тратить 2 часа после каждой пары на подготовку методичек. Студенты сразу получают готовый конспект со схемами, а я вижу в журнале, кто реально слушал объяснение.»
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold font-head text-xs text-white">
                  АИ
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Д-р Аскар Ибраев</div>
                  <div className="text-[11px] text-[#9a9a9a]">Зав. кафедрой биофизики КазНУ</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 rounded-2xl bg-[#0b0d10] border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed mb-6">
                  «Голосовой триггер «Вопрос» — это чистая магия. Я просто говорю: «Вопрос по мембранам», и через 1 секунду у всего потока открывается интерактивный опрос. Никаких ручных кликов во время лекции!»
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold font-head text-xs text-white">
                  ТК
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Тимур Касымов</div>
                  <div className="text-[11px] text-[#9a9a9a]">Преподаватель Computer Science, AITU</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 rounded-2xl bg-[#0b0d10] border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed mb-6">
                  «Когда препод диктует сложную формулу, FILL AI мгновенно оформляет её в LaTeX и привязывает таймкод. Если отвлёкся на пару минут — кнопка «Что я пропустил?» спасает весь урок.»
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold font-head text-xs text-white">
                  АС
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Аружан Серикбаева</div>
                  <div className="text-[11px] text-[#9a9a9a]">Студентка 3 курса бакалавриата</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. UNIVERSITY & COURSE ROI METRICS                                        */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#000000]">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="liquid-badge text-[11px] mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                Экономика и ценность для учебных заведений
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-head text-white tracking-tight mt-1">
                Почему университетам и онлайн-школам выгодно внедрять FILL AI
              </h2>
              <p className="text-sm sm:text-base text-[#9a9a9a] mt-4 leading-relaxed">
                Традиционные записи лекций почти никто не пересматривает — это сотни гигабайт "мёртвого" видео. FILL AI превращает каждую пару в активный структурированный цифровой актив.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
                  <div>
                    <strong className="text-white text-sm font-semibold block">
                      Рост Retention и посещаемости на 28%
                    </strong>
                    <span className="text-xs text-[#9a9a9a]">
                      Студенты не боятся опоздать или пропустить фрагмент: система формирует выжимку персонально под каждого.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
                  <div>
                    <strong className="text-white text-sm font-semibold block">
                      Нулевые затраты на ручную расшифровку и тесты
                    </strong>
                    <span className="text-xs text-[#9a9a9a]">
                      Готовые флеш-карточки Anki TSV и квизы экспортируются сразу в LMS школы или университета в один клик.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
                  <div>
                    <strong className="text-white text-sm font-semibold block">
                      Мгновенный отчёт для родителей и деканата
                    </strong>
                    <span className="text-xs text-[#9a9a9a]">
                      Готовый отчёт об активности группы формируется сразу в WhatsApp/Telegram без заполнения бумажных журналов.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Comparison Card */}
            <div className="rounded-2xl border border-white/15 bg-[#090b0e] p-6 sm:p-8 flex flex-col gap-6">
              <h3 className="text-base font-bold font-head text-white border-b border-white/10 pb-3 flex items-center justify-between">
                <span>Сравнение форматов проведения лекций</span>
                <span className="text-xs font-mono text-emerald-400 font-normal">ROI ×4.2</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-xs font-bold text-red-400 mb-1">
                    Стандартный Zoom / YouTube эфир:
                  </div>
                  <div className="text-xs text-[#9a9a9a] leading-relaxed">
                    Пассивные слушатели, камера выключена, конспект от руки или потерян, 0 понимания усвояемости темы до сессии.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/20 to-sky-950/20 border border-emerald-500/30">
                  <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    FILL AI Operational Studio:
                  </div>
                  <div className="text-xs text-white/90 leading-relaxed">
                    100% авто-конспект со схемами, интерактивные экспресс-вопросы с таймером, смысловой лог посещаемости и экспорт в Anki.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('live')}
                  className="btn-liquid-solid w-full text-xs h-10"
                >
                  Оценить живой эфир на стенде
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CTA BANNER & FOOTER                                             */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-gradient-to-b from-[#050607] to-[#000000]">
        <div className="max-w-4xl mx-auto text-center">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold font-head text-white tracking-tight leading-tight">
            Готовы провести живой урок с оркестрацией{' '}
            <span className="font-serif-italic font-normal text-white">AI?</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#9a9a9a] max-w-[48ch] mx-auto leading-relaxed">
            Запустите эфир преподавателя или войдите как ученик, чтобы увидеть синхронную работу ИИ на реальном материале.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('live')}
              className="btn-liquid-solid"
            >
              Запустить эфир преподавателя
            </button>
            <button
              onClick={() => onNavigate('student')}
              className="btn-liquid-ghost"
            >
              Открыть вид ученика
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/70">FILL AI</span>
              <span>· Operational Educational Infrastructure v1.2</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Русский · Қазақша · English</span>
              <span>FastAPI + Gemini + LiveKit</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
