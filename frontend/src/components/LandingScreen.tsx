import React from 'react';
import { Play, Mic, Monitor, Layers, Check, ArrowRight } from 'lucide-react';
import { ScreenId } from './Header';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.08] text-fill-text max-w-[15ch]">
                Урок идёт своим&nbsp;чередом. Конспект — тоже.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-fill-text-muted max-w-[46ch] leading-relaxed">
                FILL AI слушает объяснение учителя, замечает кадры с доски или презентации и собирает из этого структурированный конспект — прямо во время урока, без отдельного шага «обработать запись».
              </p>
              
              <div className="flex flex-wrap gap-3.5 mt-8">
                <button
                  onClick={() => onNavigate('live')}
                  className="btn btn-primary shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Смотреть живой урок
                </button>
                <button
                  onClick={scrollToHow}
                  className="btn btn-ghost"
                >
                  Как это устроено
                </button>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 mt-10 text-xs sm:text-[13px] text-fill-text-faint">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-fill-green-deep flex-none" />
                  Русский · Қазақша · English
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-fill-green-deep flex-none" />
                  До 40 учеников на урок
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-fill-green-deep flex-none" />
                  Работает и без видео — с одним микрофоном
                </span>
              </div>
            </div>

            {/* Visual Diagram */}
            <div className="bg-fill-surface-alt border border-fill-border rounded-lg p-6 sm:p-7 shadow-sm">
              <svg viewBox="0 0 420 300" className="w-full h-auto">
                {/* Waveform */}
                <g stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" fill="none">
                  <path d="M20 150 v-18 M34 150 v-40 M48 150 v20 M62 150 v-55 M76 150 v34 M90 150 v-14 M104 150 v46 M118 150 v-30 M132 150 v10" />
                </g>
                <path d="M132 150 C 165 150, 150 60, 195 60" stroke="var(--border)" strokeWidth="1.4" fill="none" strokeDasharray="3 4" />
                <circle cx="195" cy="60" r="4" fill="var(--green)" />
                {/* Note blocks preview */}
                <g>
                  <rect x="215" y="40" width="185" height="40" rx="8" fill="var(--surface)" stroke="var(--border)" />
                  <rect x="229" y="52" width="70" height="6" rx="3" fill="var(--text-faint)" />
                  <rect x="229" y="64" width="140" height="6" rx="3" fill="var(--border)" />
                  <rect x="215" y="90" width="185" height="56" rx="8" fill="var(--surface)" stroke="var(--border)" />
                  <rect x="229" y="102" width="90" height="6" rx="3" fill="var(--text-faint)" />
                  <rect x="229" y="114" width="150" height="6" rx="3" fill="var(--border)" />
                  <rect x="229" y="126" width="90" height="14" rx="4" fill="var(--green-soft)" />
                  <rect x="215" y="156" width="185" height="40" rx="8" fill="var(--surface)" stroke="var(--border)" />
                  <rect x="229" y="168" width="60" height="6" rx="3" fill="var(--text-faint)" />
                  <rect x="229" y="180" width="130" height="6" rx="3" fill="var(--border)" />
                </g>
                <text x="20" y="220" fontFamily="IBM Plex Sans" fontSize="11" fill="var(--text-faint)">Речь и кадры урока</text>
                <text x="215" y="220" fontFamily="IBM Plex Sans" fontSize="11" fill="var(--text-faint)">Готовые блоки конспекта</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Capabilities */}
      <section className="py-14 border-t border-fill-border bg-fill-surface">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="max-w-[640px] mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fill-text">
              Три вещи, которые FILL AI делает параллельно
            </h2>
            <p className="mt-3 text-fill-text-muted text-base">
              Не поочерёдно и не после урока — всё одновременно, пока преподаватель ведёт занятие как обычно.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-fill-bg border border-fill-border rounded-lg p-6">
              <div className="w-10 h-10 rounded-md bg-fill-blue-soft text-fill-blue-text flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-fill-text mb-2">Слушает</h3>
              <p className="text-fill-text-muted text-sm leading-relaxed">
                Распознаёт речь на русском, казахском и английском в реальном времени (Soniox + Groq Whisper), даже когда в классе один общий микрофон, а не гарнитура у каждого.
              </p>
            </div>

            <div className="bg-fill-bg border border-fill-border rounded-lg p-6">
              <div className="w-10 h-10 rounded-md bg-fill-blue-soft text-fill-blue-text flex items-center justify-center mb-4">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-fill-text mb-2">Смотрит</h3>
              <p className="text-fill-text-muted text-sm leading-relaxed">
                Замечает смену слайда или новую запись на доске (OpenCV) и сохраняет только содержательные кадры — с пронумерованными пометками там, где учитель что-то показывает.
              </p>
            </div>

            <div className="bg-fill-bg border border-fill-border rounded-lg p-6">
              <div className="w-10 h-10 rounded-md bg-fill-blue-soft text-fill-blue-text flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-fill-text mb-2">Собирает</h3>
              <p className="text-fill-text-muted text-sm leading-relaxed">
                Складывает услышанное и увиденное в блоки конспекта через Gemini 3.6 Flash: определения, примеры, формулы LaTeX — а не просто дословный пересказ урока.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps: How it works */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="max-w-[640px] mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fill-text">
              Как рождается живой вопрос
            </h2>
            <p className="mt-3 text-fill-text-muted text-base">
              Единственная последовательность в продукте, которую стоит показывать по шагам — она и есть фирменная функция FILL AI.
            </p>
          </div>

          <div className="relative space-y-8 before:absolute before:left-[27px] before:top-[50px] before:bottom-4 before:w-[1px] before:bg-fill-border">
            <div className="relative grid grid-cols-[54px_1fr] gap-5 items-start">
              <div className="w-[54px] h-[54px] rounded-full bg-fill-surface border-2 border-fill-border flex items-center justify-center font-head font-extrabold text-base text-fill-text z-10 shadow-sm">
                1
              </div>
              <div className="pt-2">
                <h3 className="text-lg font-bold text-fill-text">Учитель ведёт урок как обычно</h3>
                <p className="mt-1 text-sm text-fill-text-muted max-w-[56ch]">
                  Никаких дополнительных действий — не нужно ничего запускать вручную, кроме начала урока.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-[54px_1fr] gap-5 items-start">
              <div className="w-[54px] h-[54px] rounded-full bg-fill-surface border-2 border-fill-border flex items-center justify-center font-head font-extrabold text-base text-fill-text z-10 shadow-sm">
                2
              </div>
              <div className="pt-2">
                <h3 className="text-lg font-bold text-fill-text">FILL AI собирает конспект на фоне</h3>
                <p className="mt-1 text-sm text-fill-text-muted max-w-[56ch]">
                  Текстовые блоки, ключевые термины и кадры появляются по ходу занятия, без участия учителя.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-[54px_1fr] gap-5 items-start">
              <div className="w-[54px] h-[54px] rounded-full bg-fill-green border-2 border-fill-green flex items-center justify-center font-head font-extrabold text-base text-[#14171A] z-10 shadow-sm">
                3
              </div>
              <div className="pt-2">
                <h3 className="text-lg font-bold text-fill-text">Учитель произносит «Вопрос»</h3>
                <p className="mt-1 text-sm text-fill-text-muted max-w-[56ch]">
                  FILL AI распознаёт команду и за секунды формулирует вопрос по теме, которая обсуждается прямо сейчас.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-[54px_1fr] gap-5 items-start">
              <div className="w-[54px] h-[54px] rounded-full bg-fill-surface border-2 border-fill-border flex items-center justify-center font-head font-extrabold text-base text-fill-text z-10 shadow-sm">
                4
              </div>
              <div className="pt-2">
                <h3 className="text-lg font-bold text-fill-text">Ученики отвечают, учитель видит результат</h3>
                <p className="mt-1 text-sm text-fill-text-muted max-w-[56ch]">
                  Ответы приходят со своих устройств, а распределение и процент понимания — сразу на экране учителя.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes Grid */}
      <section className="py-14 bg-fill-surface border-t border-fill-border">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="max-w-[640px] mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fill-text">
              Что получает каждая сторона
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-fill-border rounded-lg overflow-hidden border border-fill-border shadow-sm">
            <div className="bg-fill-surface p-7 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fill-text-faint mb-5">
                Учителю
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Не тратит время на конспект после урока — он уже готов к звонку</span>
                </li>
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Видит, кто понял тему, а кто нет — ещё до конца урока</span>
                </li>
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Публикует тест по материалу урока одним нажатием</span>
                </li>
              </ul>
            </div>

            <div className="bg-fill-surface p-7 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fill-text-faint mb-5">
                Ученику
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Получает структурированный конспект сразу после звонка</span>
                </li>
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Отвечает на вопросы, не отвлекаясь от объяснения</span>
                </li>
                <li className="flex gap-3 text-sm sm:text-[15px] text-fill-text items-start">
                  <Check className="w-5 h-5 text-fill-success flex-none mt-0.5" />
                  <span>Видит свои ошибки с объяснением, а не только итоговый балл</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="bg-fill-text text-fill-bg rounded-lg p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-fill-bg max-w-[22ch]">
                Готовится к пилоту в школах
              </h3>
              <p className="mt-2 text-sm text-fill-bg/75 max-w-[44ch] leading-relaxed">
                Первый запуск — одна-две школы, до 40 учеников на урок, несколько параллельных уроков одновременно.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onNavigate('live')}
                className="btn btn-primary"
              >
                Открыть демо урока
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-fill-border py-6 text-xs text-fill-text-faint">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex flex-wrap justify-between items-center gap-4">
          <span>FILL AI · пилотная версия v1.0</span>
          <span>Русский · Қазақша · English</span>
        </div>
      </footer>
    </div>
  );
};
