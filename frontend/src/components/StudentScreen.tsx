import React, { useState } from 'react';
import { Clock, BookOpen, Check, ShieldCheck } from 'lucide-react';
import { DEMO_LIVE_QUESTION, DEMO_BLOCKS } from '../services/mockData';

export type StudentDemoState = 'wait' | 'notes' | 'question';

export const StudentScreen: React.FC = () => {
  const [studentState, setStudentState] = useState<StudentDemoState>('notes');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // In moderated mode (Sprint 1), students only see approved blocks
  const visibleBlocks = DEMO_BLOCKS.filter((b) => b.status === 'approved');

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setTimeout(() => {
      setIsAnswered(true);
    }, 300);
  };

  const handleStateChange = (state: StudentDemoState) => {
    setStudentState(state);
    if (state !== 'question') {
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 px-4 flex flex-col items-center gap-6 bg-fill-bg min-h-[calc(100vh-60px)]">
      {/* State Switcher Tabs */}
      <div className="flex gap-0.5 bg-fill-surface-alt p-1 rounded-full shadow-sm">
        {(
          [
            ['wait', 'Ожидание'],
            ['notes', 'Конспект'],
            ['question', 'Вопрос'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleStateChange(key)}
            aria-pressed={studentState === key}
            className={`text-xs font-semibold py-1.5 px-3.5 rounded-full transition-all ${
              studentState === key
                ? 'bg-fill-surface text-fill-text shadow-sm'
                : 'text-fill-text-muted hover:text-fill-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-fill-text-faint text-center max-w-sm">
        Мобильный интерфейс ученика: адаптивный просмотр проверенного учителем конспекта и мгновенный ответ на экспресс-опросы прямо со смартфона.
      </p>

      {/* Realistic Smartphone Frame */}
      <div className="w-[340px] sm:w-[360px] h-[680px] sm:h-[720px] rounded-[36px] border-[8px] border-fill-text bg-fill-surface overflow-hidden relative shadow-md flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[20px] bg-fill-text rounded-b-xl z-20" />

        {/* Top bar inside phone */}
        <div className="pt-6 pb-2.5 px-4 border-b border-fill-border flex items-center justify-between bg-fill-surface z-10">
          <strong className="text-xs font-bold font-head text-fill-text">
            Биология · Клетка
          </strong>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-fill-success-soft text-fill-success font-bold px-1.5 py-0.5 rounded">
              Одобрено
            </span>
            <span className="text-[11px] text-fill-text-faint">9 «Б»</span>
          </div>
        </div>

        {/* Phone Content Area */}
        <div className="flex-1 overflow-y-auto p-4 relative bg-fill-surface">
          {/* WAIT STATE */}
          {studentState === 'wait' && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-4">
              <Clock className="w-11 h-11 text-fill-text-faint stroke-[1.4]" />
              <h4 className="text-[15px] font-bold text-fill-text">Урок ещё не начался</h4>
              <p className="text-xs text-fill-text-muted leading-relaxed">
                Как только преподаватель начнёт занятие, здесь появится живой конспект.
              </p>
            </div>
          )}

          {/* NOTES & QUESTION STATES */}
          {(studentState === 'notes' || studentState === 'question') && (
            <div className="space-y-3 pb-6">
              <div className="text-[11px] text-fill-text-faint flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Живой конспект · только чтение
                </span>
                <span className="flex items-center gap-1 text-[10px] text-fill-green-deep">
                  <ShieldCheck className="w-3 h-3" />
                  Проверено учителем
                </span>
              </div>

              {visibleBlocks.map((b) => (
                <div key={b.id} className="bg-fill-surface-alt rounded-md p-3.5">
                  <h5 className="text-[13.5px] font-bold text-fill-text mb-1">
                    {b.title}
                  </h5>
                  <p className="text-xs text-fill-text-muted leading-relaxed">
                    {b.body_md}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* QUESTION MODAL / BOTTOM SHEET */}
          {studentState === 'question' && (
            <div className="absolute inset-0 bg-[#14171A]/45 flex items-end z-20 transition-opacity">
              <div className="bg-fill-surface w-full rounded-t-2xl p-5 shadow-lg border-t border-fill-border">
                <div className="text-[11px] font-bold uppercase tracking-wider text-fill-green-deep mb-1">
                  {DEMO_LIVE_QUESTION.eyebrow}
                </div>
                <h3 className="text-[15px] font-bold text-fill-text mb-4 leading-snug">
                  {DEMO_LIVE_QUESTION.text}
                </h3>

                {!isAnswered ? (
                  <div className="space-y-2">
                    {DEMO_LIVE_QUESTION.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(i)}
                        className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-md border text-xs transition-all ${
                          selectedOption === i
                            ? 'border-fill-green-deep bg-fill-green-soft text-fill-text font-semibold'
                            : 'border-fill-border bg-fill-surface text-fill-text hover:border-fill-text-faint'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-[1.6px] flex-none flex items-center justify-center ${
                            selectedOption === i
                              ? 'border-fill-green bg-fill-green'
                              : 'border-fill-border'
                          }`}
                        />
                        <span>{opt.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 px-1">
                    <div className="w-9 h-9 rounded-full bg-fill-success/15 text-fill-success flex items-center justify-center mx-auto mb-2">
                      <Check className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-fill-text mb-1">Ответ принят</h4>
                    <p className="text-xs text-fill-text-muted max-w-[30ch] mx-auto leading-relaxed">
                      Результат появится, когда преподаватель закроет вопрос — чтобы не спойлерить остальным.
                    </p>
                    <button
                      onClick={() => {
                        setIsAnswered(false);
                        setSelectedOption(null);
                      }}
                      className="mt-4 text-[11px] text-fill-text-faint underline hover:text-fill-text"
                    >
                      Сбросить (демо)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
