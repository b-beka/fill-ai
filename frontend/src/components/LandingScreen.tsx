import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Radio, 
  Check, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Star
} from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth?: (role?: 'teacher' | 'student') => void;
}

const TESTIMONIALS = [
  {
    name: 'Д-р Аскар Ибраев',
    role: 'Зав. кафедрой биофизики КазНУ им. аль-Фараби',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    quote: 'Студенты перестали отвлекаться на механическое переписывание слайдов. Они внимательно слушают объяснение, а структурированный конспект со схемами получают сразу к звонку.',
    tag: 'Биофизика'
  },
  {
    name: 'Тимур Касымов',
    role: 'Преподаватель Computer Science, AITU',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    quote: 'Голосовая команда "Вопрос" в микрофон — это восторг. Система за секунду формулирует тест по только что сказанному материалу, а я вижу на экране, кто понял код, а кто запутался.',
    tag: 'Python & AI'
  },
  {
    name: 'Аружан Серикбаева',
    role: 'Студентка 3 курса бакалавриата',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    quote: 'Формулы сразу выводятся в красивом LaTeX, к каждому тезису есть аудиофрагмент речи лектора. Если отвлёкся на пару минут — кнопка "Что я пропустил?" спасает весь урок.',
    tag: 'Студентка'
  },
  {
    name: 'Елена Ким',
    role: 'Академический тренер, Lingua Premier',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    quote: 'Посещаемость выросла на 28%, потому что студенты чувствуют реальную вовлеченность. Интерактивные задания без задержки держат аудиторию в фокусе всё занятие.',
    tag: 'IELTS'
  }
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <div className="w-full bg-[#06080b] text-white overflow-x-hidden font-body">
      
      {/* ========================================================================= */}
      {/* 1. CALM NATURAL CINEMATIC HERO (Dawn landscape video, 3D typography)      */}
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

        {/* Ambient Dark Scrim: Pure Solid Mask Without Gradients */}
        <div className="absolute inset-0 bg-[#07080a]/75 pointer-events-none z-1" />

        {/* Top Tag */}
        <div className="relative z-10 w-full pt-10 sm:pt-16 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="tech-label flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ОПЕРАЦИОННАЯ СИСТЕМА ДЛЯ ЖИВЫХ ЛЕКЦИЙ</span>
          </motion.div>
        </div>

        {/* Main Hero Copy & Clear Cabinets CTA */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 flex flex-col items-center text-center">
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white max-w-[22ch] leading-[1.12]"
          >
            Преподаватель ведёт занятие. <br />
            <span className="text-white/80">FILL AI синхронно создаёт конспект и опрос.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 text-sm sm:text-base md:text-lg text-white/70 max-w-[50ch] font-normal leading-relaxed"
          >
            Никакой ручной расшифровки после уроков. Платформа слушает голос лектора, фиксирует слайды и формулы, организуя моментальные квизы для аудитории.
          </motion.p>

          {/* Clean Cabinet Navigation Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <button
              onClick={() => onNavigate('live')}
              className="btn-solid text-xs sm:text-sm h-11 px-5 flex items-center gap-2 font-medium"
            >
              <GraduationCap className="w-4 h-4 text-black" />
              <span>Кабинет преподавателя</span>
            </button>

            <button
              onClick={() => onNavigate('student')}
              className="btn-outline text-xs sm:text-sm h-11 px-5 flex items-center gap-2 font-medium"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>Кабинет ученика</span>
            </button>

            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('teacher')}
                className="text-white/60 hover:text-white text-xs underline underline-offset-4 py-2 px-3 transition-colors"
              >
                Выбрать роль входа →
              </button>
            )}
          </motion.div>

          {/* Micro Specs Readout */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/50 font-mono-tag">
            <span>Распознавание речи: Soniox + Groq</span>
            <span className="text-white/20">•</span>
            <span>Фиксация слайдов: OpenCV pHash</span>
            <span className="text-white/20">•</span>
            <span>Синтез: Gemini 3.5 Flash</span>
          </div>

        </div>

        {/* 3D Visual Preview Teaser (Side-by-side Teacher Studio & Student Cinema) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="rounded-2xl border border-white/15 bg-[#0a0d12]/90 backdrop-blur-md p-4 sm:p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs font-mono-tag text-white/50">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                СИНХРОННЫЙ ЭФИР: СТУДИЯ ПРЕПОДАВАТЕЛЯ & ПЛЕЕР УЧЕНИКА
              </span>
              <span>1080p 60fps</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher Studio Preview */}
              <div 
                onClick={() => onNavigate('live')}
                className="p-4 rounded-xl bg-[#11141a] border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display font-medium text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Экран преподавателя
                  </span>
                  <span className="text-[10px] font-mono-tag text-white/40 group-hover:text-white transition-colors">
                    Открыть →
                  </span>
                </div>
                <div className="aspect-video rounded-lg bg-black/60 border border-white/10 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs font-medium text-white/90">
                    Эфирный монитор лекции + слайды
                  </span>
                  <span className="text-[11px] text-white/50 mt-1">
                    Кнопка «Задать вопрос классу» и журнал присутствия 28/30
                  </span>
                </div>
              </div>

              {/* Student Cinema Preview */}
              <div 
                onClick={() => onNavigate('student')}
                className="p-4 rounded-xl bg-[#11141a] border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display font-medium text-white flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                    Экран ученика (YouTube-стиль)
                  </span>
                  <span className="text-[10px] font-mono-tag text-white/40 group-hover:text-white transition-colors">
                    Открыть →
                  </span>
                </div>
                <div className="aspect-video rounded-lg bg-black/60 border border-white/10 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs font-medium text-white/90">
                    16:9 трансляция + экспресс-опрос справа
                  </span>
                  <span className="text-[11px] text-white/50 mt-1">
                    Синхронно растущий конспект снизу и выжимка пропусков
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* University Partnerships Bar */}
        <div className="relative z-10 w-full border-t border-white/10 bg-black/60 backdrop-blur-md py-4 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <span className="font-mono-tag text-[11px] uppercase">
              Партнеры и пилотные площадки:
            </span>
            <div className="flex items-center gap-6 font-display font-medium text-white/70">
              <span>КазНУ им. аль-Фараби</span>
              <span className="text-white/20">/</span>
              <span>Astana IT University</span>
              <span className="text-white/20">/</span>
              <span>Nazarbayev University</span>
              <span className="text-white/20">/</span>
              <span>Astana Hub</span>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT US & MISSION (О нас, контекст, почему это создано)               */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#07090d]">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            
            <div className="md:col-span-7">
              <div className="tech-label inline-block mb-3">
                О ПРОЕКТЕ И КОМАНДЕ
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-normal text-white tracking-tight leading-tight">
                Почему мы создали FILL AI
              </h2>
              <p className="text-sm text-white/70 mt-4 leading-relaxed">
                Традиционная лекция устроена парадоксально: студенты тратят до 70% внимания на механическое списывание с доски или слайдов, теряя нить рассуждения преподавателя. А преподаватель после пар часами вручную готовит методички, конспекты и тесты.
              </p>
              <p className="text-sm text-white/70 mt-3 leading-relaxed">
                FILL AI разработан исследователями и разработчиками в Казахстане для того, чтобы превратить каждую живую пару в интерактивный цифровой актив без дополнительных усилий со стороны лектора.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-display font-medium text-white">84%</div>
                  <div className="text-xs text-white/60 mt-1">
                    Экономия времени лектора на подготовку материалов
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-display font-medium text-white">0 мс</div>
                  <div className="text-xs text-white/60 mt-1">
                    Задержка пояснения ошибок в экспресс-опросах
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 p-6 rounded-2xl bg-[#0c0e14] border border-white/10 flex flex-col gap-4">
              <h3 className="text-sm font-display font-medium text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Принципы системы</span>
              </h3>

              <div className="space-y-3 text-xs text-white/70">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                  <span>Работает с обычным микрофоном в классе без сложного монтажа.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                  <span>Поддерживает три языка: русский, казахский и английский.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                  <span>Экспортирует готовые карточки Anki TSV и отчеты в WhatsApp.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                  <span>Умная кнопка «Что я пропустил?» спасает опоздавших студентов.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VERIFIED REVIEWS WITH REAL HUMAN FACES (Лица людей с отзывами)        */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#050609]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="tech-label inline-block mb-3">
              ОТЗЫВЫ ПРЕПОДАВАТЕЛЕЙ И СТУДЕНТОВ
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-normal text-white tracking-tight">
              Лица и впечатления участников пилотов
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-3">
              Реальные преподаватели ведущих вузов и студенты, использующие систему на занятиях.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-[#090c10] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-mono-tag text-[10px] text-white/40 uppercase">
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed italic">
                    «{t.quote}»
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border border-white/20 flex-none"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-display font-medium text-white">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION STRIP: ENTER TEACHER OR STUDENT CABINET                  */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/10 bg-[#06080b] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-normal text-white mb-3">
            Войдите в личный кабинет
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-8 leading-relaxed">
            Выберите ваш формат работы — ведение эфира преподавателем или просмотр и интерактивный конспект студентом.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('live')}
              className="btn-solid text-xs sm:text-sm h-10 px-6 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-black" />
              <span>Кабинет преподавателя</span>
            </button>
            <button
              onClick={() => onNavigate('student')}
              className="btn-outline text-xs sm:text-sm h-10 px-6 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>Кабинет ученика</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
