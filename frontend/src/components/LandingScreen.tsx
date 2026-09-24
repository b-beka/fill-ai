import React, { useState } from 'react';
import { 
  Play, 
  Mic, 
  Paperclip, 
  ArrowUp, 
  Radio, 
  Star,
  ChevronDown,
  FileText,
  Sparkles,
  Cpu
} from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth?: (role?: 'teacher' | 'student') => void;
}

const PRESET_PROMPTS = [
  'Биомембраны: транспорт веществ, натрий-калиевый насос и градиенты...',
  'Python: асинхронное программирование, Event Loop и asyncio задачи...',
  'IELTS Academic: подготовка к Writing Task 2, связность и лексика...'
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, onOpenAuth }) => {
  const [promptText, setPromptText] = useState(PRESET_PROMPTS[0]);
  const [selectedModel, setSelectedModel] = useState<'Gemini 3.5' | 'Claude 3.5'>('Gemini 3.5');
  const [activeChip, setActiveChip] = useState<'slides' | 'mic' | 'demo'>('slides');

  const handleLaunch = () => {
    onNavigate('live');
  };

  const handleChipClick = (chip: 'slides' | 'mic' | 'demo', textIndex: number) => {
    setActiveChip(chip);
    setPromptText(PRESET_PROMPTS[textIndex]);
  };

  return (
    <div className="w-full bg-[#000000] text-white overflow-x-hidden selection:bg-orange-500/30 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. SINGLE-VIEWPORT HERO WITH FASTSHOT COMPOSER & DAWN CINEMATIC VIDEO     */}
      {/* ========================================================================= */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden bg-[#0a0d12]">
        
        {/* Cinematic Dawn Landscape Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-60 scale-100"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4"
          />
        </div>

        {/* Dual Soft Scrim: Clean, smooth gradient overlay without clutter */}
        <div 
          className="absolute inset-0 pointer-events-none z-1"
          style={{
            background: 'linear-gradient(180deg, rgba(10,13,18,0.7) 0%, rgba(10,13,18,0.4) 45%, rgba(0,0,0,0.92) 100%)'
          }}
        />

        {/* Top Tag & Header Spacer */}
        <div className="relative z-10 w-full pt-10 sm:pt-14 flex items-center justify-center">
          <div className="echoid-tag flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE LECTURE OS · V1.2</span>
          </div>
        </div>

        {/* Center Main Stage: Headline + Fastshot Style Composer */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 flex flex-col items-center text-center">
          
          {/* Crisp, Pristine Headline (Sora Display) */}
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white max-w-[22ch] leading-[1.12] drop-shadow-md">
            Опишите тему урока. <br />
            <span className="text-white/80">FILL AI проведёт эфир и создаст конспект.</span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-white/70 max-w-[50ch] font-normal leading-relaxed">
            Система слушает объяснение учителя, синхронизирует презентацию и формирует мультимедийные заметки с моментальными тестами.
          </p>

          {/* ========================================================================= */}
          {/* FASTSHOT COMPOSER CARD (Pixel-faithful toolbar: chips left, send right)   */}
          {/* ========================================================================= */}
          <div className="w-full max-w-2xl mt-8 composer-card p-4 sm:p-5 flex flex-col justify-between text-left relative overflow-hidden">
            
            {/* Top Prompt / Topic Line */}
            <div className="mb-4">
              <label className="text-[10px] font-mono-tag uppercase tracking-wider text-white/40 block mb-1">
                Тема занятия или запрос
              </label>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Введите тему лекции или предмет..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none font-normal"
              />
            </div>

            {/* Bottom Toolbar Row: Chips left, Right cluster (Model, Clip, Orange Send) */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              
              {/* Left Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => handleChipClick('slides', 0)}
                  className={`composer-chip ${activeChip === 'slides' ? 'active' : ''}`}
                >
                  <FileText className="w-3.5 h-3.5 text-white/70" />
                  <span>Биомембраны</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChipClick('mic', 1)}
                  className={`composer-chip ${activeChip === 'mic' ? 'active' : ''}`}
                >
                  <Mic className="w-3.5 h-3.5 text-white/70" />
                  <span>Python & AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChipClick('demo', 2)}
                  className={`composer-chip ${activeChip === 'demo' ? 'active' : ''}`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white/70" />
                  <span>IELTS Writing</span>
                </button>
              </div>

              {/* Right Cluster: Model label + Paperclip + Orange Send Circle */}
              <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                {/* Model Selector */}
                <button
                  type="button"
                  onClick={() => setSelectedModel((m) => (m === 'Gemini 3.5' ? 'Claude 3.5' : 'Gemini 3.5'))}
                  className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono-tag text-white/60 hover:text-white transition-colors"
                  title="Переключить оркестратор"
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                {/* Paperclip */}
                <button
                  type="button"
                  onClick={() => onNavigate('live')}
                  className="text-white/50 hover:text-white transition-colors"
                  title="Прикрепить PDF презентацию"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Iconic Fastshot Orange Send Circle */}
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="btn-orange-send"
                  title="Запустить прямой эфир"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

            </div>

          </div>

          {/* Quick Dual Mode Launchers */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => onNavigate('live')}
              className="btn-liquid-solid text-xs h-9 px-4 flex items-center gap-2"
            >
              <Radio className="w-3.5 h-3.5 text-black" />
              <span>Эфир преподавателя</span>
            </button>

            <button
              onClick={() => onNavigate('student')}
              className="btn-liquid-ghost text-xs h-9 px-4 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Экран ученика</span>
            </button>

            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('teacher')}
                className="text-white/50 hover:text-white text-xs underline underline-offset-4 px-2 py-1 transition-colors"
              >
                Выбрать роль входа
              </button>
            )}
          </div>

        </div>

        {/* Footer Proof Bar: Built & Tested by Educators */}
        <div className="relative z-10 w-full border-t border-white/10 bg-black/60 backdrop-blur-md py-4 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <div className="font-mono-tag text-[11px] tracking-wider uppercase">
              Разработано для университетов и школ:
            </div>
            <div className="flex items-center gap-6 font-display font-medium text-white/70">
              <span className="hover:text-white transition-colors">КазНУ</span>
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
      {/* 2. THREE CORE PILLARS (Clean, simple, no clutter)                        */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#050608]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="echoid-tag inline-block mb-3">
              КАК ЭТО РАБОТАЕТ
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal font-display text-white tracking-tight">
              Три вещи, которые происходят параллельно
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3 leading-relaxed">
              Преподаватель ведёт занятие как обычно. ИИ незаметно выполняет рутинную фиксацию материала на фоне.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Listen */}
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 mb-4">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="font-mono-tag text-[11px] text-sky-400 mb-1">
                  01 · РАСПОЗНАВАНИЕ
                </div>
                <h3 className="text-base font-bold font-display text-white mb-2">
                  Слушает голос
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Потоковая транскрибация речи преподавателя (Soniox + Groq) с точностью терминологии на казахском, русском и английском языках.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/5 font-mono-tag text-[10px] text-emerald-400">
                Задержка 400 мс
              </div>
            </div>

            {/* 2. Visuals */}
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-mono-tag text-[11px] text-emerald-400 mb-1">
                  02 · МАТЕРИАЛЫ
                </div>
                <h3 className="text-base font-bold font-display text-white mb-2">
                  Смотрит на слайды
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  OpenCV и pHash выявляют переключение слайдов и записи на доске, сохраняя четкие векторные кадры прямо в конспект.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/5 font-mono-tag text-[10px] text-emerald-400">
                Zero-Cost pHash
              </div>
            </div>

            {/* 3. Synthesis */}
            <div className="p-6 rounded-2xl bg-[#0c0e12] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="font-mono-tag text-[11px] text-amber-400 mb-1">
                  03 · ОРКЕСТРАЦИЯ
                </div>
                <h3 className="text-base font-bold font-display text-white mb-2">
                  Собирает конспект и тесты
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Gemini 3.5 Flash компонует структурированные карточки, формулы в LaTeX и автоматически формулирует экспресс-вопрос по команде учителя.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/5 font-mono-tag text-[10px] text-emerald-400">
                0ms Explanations
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VERIFIED REVIEWS FROM EDUCATORS & STUDENTS                            */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#000000]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="echoid-tag inline-block mb-3">
              ОТЗЫВЫ И ПИЛОТЫ
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal font-display text-white tracking-tight">
              Проверено преподавателями и студентами
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#0a0c0f] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-4">
                  «Студенты перестали отвлекаться на механическое переписывание слайдов. Они слушают объяснение, а готовый конспект со схемами получают сразу к концу пары.»
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs font-bold text-white">Д-р Аскар Ибраев</div>
                <div className="text-[11px] text-white/50">Кафедра биофизики КазНУ</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0c0f] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-4">
                  «Команда "Вопрос" в микрофон создаёт тест моментально. Сразу вижу на экране распределение ответов — кто понял тему, а кто запутался.»
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs font-bold text-white">Тимур Касымов</div>
                <div className="text-[11px] text-white/50">Преподаватель CS, AITU</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0c0f] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-4">
                  «Формулы сразу выводятся красиво, к каждой мысли есть аудиофрагмент голоса лектора. Если отвлёкся — кнопка выжимки помогает быстро вернуться в курс дела.»
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs font-bold text-white">Аружан Серикбаева</div>
                <div className="text-[11px] text-white/50">Студентка 3 курса</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLEAN BOTTOM CTA                                                      */}
      {/* ========================================================================= */}
      <section className="py-16 px-6 sm:px-8 border-t border-white/10 bg-[#06080b] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display text-white mb-3">
            Начать работу с FILL AI
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-6">
            Откройте эфир учителя или зайдите в роли ученика для демонстрации работы системы.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('live')}
              className="btn-liquid-solid text-xs h-9 px-5"
            >
              Запустить эфир
            </button>
            <button
              onClick={() => onNavigate('student')}
              className="btn-liquid-ghost text-xs h-9 px-5"
            >
              Смотреть как ученик
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
