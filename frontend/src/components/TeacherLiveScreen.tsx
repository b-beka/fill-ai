import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Mic, 
  Layers, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Sparkles,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  Video,
  Presentation,
  Check,
  Download,
  X
} from 'lucide-react';
import { 
  DEMO_LESSON, 
  DEMO_BLOCKS, 
  DEMO_SLIDES, 
  DEMO_LIVE_QUESTION, 
  DEMO_TRANSCRIPT,
  DEMO_ANKI_TSV
} from '../services/mockData';
import { NoteBlock, VisibilityMode } from '../types/lesson';

export type LiveDemoState = 'listen' | 'process' | 'question' | 'results' | 'attention';

interface TeacherLiveScreenProps {
  blocks?: NoteBlock[];
  onApproveBlock?: (blockId: string) => void;
}

export const TeacherLiveScreen: React.FC<TeacherLiveScreenProps> = () => {
  const [liveState, setLiveState] = useState<LiveDemoState>('listen');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(42 * 60 + 15);
  
  // New Sprint 1, 2, 3 features state
  const [blocks, setBlocks] = useState<NoteBlock[]>(DEMO_BLOCKS);
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('moderated');
  const [activeTab, setActiveTab] = useState<'notes' | 'slides'>('notes');
  const [showAnkiModal, setShowAnkiModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApprove = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, status: 'approved' } : b))
    );
  };

  const downloadAnkiTsv = () => {
    const blob = new Blob([DEMO_ANKI_TSV], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson_${DEMO_LESSON.id}_anki.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-fill-bg min-h-[calc(100vh-60px)] flex flex-col">
      {/* Top Bar */}
      <div className="bg-fill-surface border-b border-fill-border px-4 sm:px-8 py-3.5 flex items-center gap-4 flex-wrap">
        <div className="flex flex-col">
          <strong className="font-head font-bold text-[15px] text-fill-text leading-snug">
            {DEMO_LESSON.title}
          </strong>
          <span className="text-xs text-fill-text-faint">{DEMO_LESSON.subject}</span>
        </div>

        <span className="badge badge-blue text-xs font-bold">RU</span>
        <span className="badge badge-live text-xs">
          <span className="dot" />
          В эфире
        </span>

        {/* Visibility Mode Badge */}
        <button
          onClick={() => setVisibilityMode(prev => prev === 'moderated' ? 'live' : 'moderated')}
          className={`badge text-xs transition-colors cursor-pointer ${
            visibilityMode === 'moderated'
              ? 'bg-fill-warning-soft text-fill-warning border border-fill-warning/30'
              : 'bg-fill-blue-soft text-fill-blue-text'
          }`}
          title="Нажмите для переключения режима видимости"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          {visibilityMode === 'moderated' ? 'Премодерация конспекта' : 'Прямой эфир'}
        </button>

        <div className="flex-1" />

        {/* Action Buttons: Slides, Anki, Recording */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(prev => prev === 'notes' ? 'slides' : 'notes')}
            className={`btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 ${
              activeTab === 'slides' ? 'bg-fill-surface-alt font-bold' : ''
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-fill-blue" />
            Слайды ({DEMO_SLIDES.length})
          </button>

          <button
            onClick={() => setShowAnkiModal(true)}
            className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Экспорт карточек для Anki"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-fill-green-deep" />
            Anki TSV
          </button>

          <button
            onClick={() => setShowRecordingModal(true)}
            className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Синхронизированная запись урока (LiveKit Egress)"
          >
            <Video className="w-3.5 h-3.5 text-fill-danger" />
            Запись
          </button>
        </div>

        <span className="font-head font-bold text-sm text-fill-text-muted tabular-nums ml-2">
          {formatTimer(timerSeconds)}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-fill-text-faint">
          <span className="w-1.5 h-1.5 rounded-full bg-fill-success" />
          Подключено
        </span>
      </div>

      {/* State Switcher Controls */}
      <div className="px-4 sm:px-8 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0.5 bg-fill-surface-alt p-1 rounded-full overflow-x-auto max-w-full">
          {(
            [
              ['listen', 'Слушает'],
              ['process', 'Обрабатывает'],
              ['question', 'Вопрос активен'],
              ['results', 'Результаты'],
              ['attention', 'Нужно внимание'],
            ] as const
          ).map(([stateKey, label]) => (
            <button
              key={stateKey}
              onClick={() => setLiveState(stateKey)}
              aria-pressed={liveState === stateKey}
              className={`text-xs font-semibold py-1.5 px-3 rounded-full whitespace-nowrap transition-all ${
                liveState === stateKey
                  ? 'bg-fill-surface text-fill-text shadow-sm'
                  : 'text-fill-text-muted hover:text-fill-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-xs text-fill-text-faint">
          {visibilityMode === 'moderated' ? (
            <span className="text-fill-warning font-medium">
              * Режим премодерации: ученики видят только одобренные блоки
            </span>
          ) : (
            <span>* Прямой режим: блоки сразу видны ученикам</span>
          )}
        </div>
      </div>

      {/* Main Area: Notes or Slides */}
      {activeTab === 'slides' ? (
        /* Slide Deck View (Sprint 2) */
        <div className="px-4 sm:px-8 py-5 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-fill-text flex items-center gap-2">
                <Presentation className="w-4 h-4 text-fill-blue" />
                Слайды презентации (Materials Ingestion)
              </h2>
              <p className="text-xs text-fill-text-muted">
                Автоматически обработаны из PDF через PyMuPDF с извлечением OCR и ключевых понятий.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('notes')}
              className="btn btn-ghost text-xs py-1 px-3"
            >
              Вернуться к конспекту
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_SLIDES.map((slide) => (
              <div
                key={slide.id}
                className="bg-fill-surface border border-fill-border rounded-lg overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-fill-surface-alt p-6 flex flex-col items-center justify-center border-b border-fill-border relative min-h-[140px]">
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-fill-surface text-fill-text-muted border border-fill-border">
                    Слайд #{slide.slide_idx}
                  </span>
                  <Presentation className="w-12 h-12 text-fill-blue opacity-50 mb-2" />
                  <span className="text-xs text-fill-text-faint font-mono">pHash: {slide.phash.slice(0, 8)}…</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-fill-text-muted mb-3 leading-relaxed">
                      {slide.extracted_text}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-fill-text-faint block mb-1.5">
                      Ключевые термины:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {slide.terms.map((term, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[11px] bg-fill-blue-soft text-fill-blue-text px-2 py-0.5 rounded-full font-medium"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Grid: Notes Stream & Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 px-4 sm:px-8 py-5 flex-1 items-start">
          {/* Left: Notes Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-fill-text">AI-конспект</h2>
              <span className="text-xs text-fill-text-faint flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-fill-blue animate-pulse" />
                Обновляется в реальном времени
              </span>
            </div>

            {/* Render Blocks */}
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`bg-fill-surface border rounded-lg p-5 sm:p-6 shadow-sm transition-all ${
                  block.status === 'pending_review'
                    ? 'border-fill-warning bg-fill-warning-soft/20'
                    : 'border-fill-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[16.5px] font-bold text-fill-text">
                    {block.title}
                  </h3>

                  {/* Moderation Status (Sprint 1) */}
                  {visibilityMode === 'moderated' && (
                    <div className="flex items-center gap-2">
                      {block.status === 'pending_review' ? (
                        <span className="badge bg-fill-warning-soft text-fill-warning text-[11px] font-bold">
                          На проверке
                        </span>
                      ) : (
                        <span className="badge bg-fill-success-soft text-fill-success text-[11px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Одобрен
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm sm:text-[14.5px] text-fill-text-muted leading-relaxed">
                  {block.body_md}
                </p>

                {/* Callouts (Definitions, Examples, Faithfulness Warnings) */}
                {block.callouts?.map((callout, cIdx) => (
                  <div
                    key={cIdx}
                    className={`rounded-md p-3.5 mt-3 text-xs sm:text-[13.5px] leading-relaxed flex gap-2.5 ${
                      callout.type === 'definition'
                        ? 'bg-fill-blue-soft text-fill-blue-text'
                        : callout.type === 'warning'
                        ? 'bg-fill-warning-soft text-fill-warning border border-fill-warning/40'
                        : 'bg-fill-surface-alt text-fill-text-muted border border-dashed border-fill-border'
                    }`}
                  >
                    {callout.type === 'definition' && <BookOpen className="w-4 h-4 flex-none mt-0.5" />}
                    {callout.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-none mt-0.5 text-fill-warning" />}
                    {callout.type === 'example' && <Sparkles className="w-4 h-4 flex-none mt-0.5 text-fill-green-deep" />}
                    <span>
                      {callout.title && <b>{callout.title}: </b>}
                      {callout.text}
                    </span>
                  </div>
                ))}

                {/* Visual Frame if referenced */}
                {block.frame_refs && block.frame_refs.length > 0 && (
                  <div className="mt-4 border border-fill-border rounded-md overflow-hidden bg-fill-surface">
                    <div className="bg-fill-surface-alt p-4 flex justify-center">
                      <svg viewBox="0 0 280 140" className="w-[240px] h-auto">
                        <rect x="4" y="60" width="272" height="10" rx="5" fill="var(--border)" />
                        <circle cx="70" cy="65" r="16" fill="none" stroke="var(--blue)" strokeWidth="2" />
                        <circle cx="70" cy="65" r="3" fill="var(--blue)" />
                        <circle cx="70" cy="30" r="8" fill="none" stroke="var(--green-deep)" strokeWidth="2" />
                        <line x1="70" y1="38" x2="70" y2="50" stroke="var(--green-deep)" strokeWidth="2" />
                        <circle cx="70" cy="30" r="12" fill="none" stroke="var(--border)" strokeDasharray="2 3" />
                        <circle cx="200" cy="65" r="10" fill="none" stroke="var(--blue)" strokeWidth="2" />
                        <circle cx="52" cy="18" r="9" fill="var(--surface)" stroke="var(--text)" strokeWidth="1.3" />
                        <text x="52" y="22" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Sans" fill="var(--text)">1</text>
                        <circle cx="200" cy="46" r="9" fill="var(--surface)" stroke="var(--text)" strokeWidth="1.3" />
                        <text x="200" y="50" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Sans" fill="var(--text)">2</text>
                      </svg>
                    </div>
                    <div className="p-2.5 sm:p-3 text-xs text-fill-text-muted flex flex-col gap-1 border-t border-fill-border bg-fill-surface">
                      <span><b>1.</b> Сигнальная молекула, распознаваемая рецептором</span>
                      <span><b>2.</b> Белок-рецептор, встроенный в мембрану</span>
                    </div>
                  </div>
                )}

                {/* Teacher Action: Approve block button (Sprint 1) */}
                {visibilityMode === 'moderated' && block.status === 'pending_review' && (
                  <div className="mt-4 pt-3 border-t border-fill-border flex items-center justify-between">
                    <span className="text-xs text-fill-text-faint">
                      Ученики увидят этот блок только после одобрения.
                    </span>
                    <button
                      onClick={() => handleApprove(block.id)}
                      className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Одобрить блок для учеников
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Skeleton Block during 'process' state */}
            {liveState === 'process' && (
              <div className="bg-fill-surface border border-dashed border-fill-border rounded-lg p-5 sm:p-6">
                <div className="text-xs text-fill-text-faint flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-fill-blue animate-pulse" />
                  Формируется новый блок конспекта…
                </div>
                <div className="sk-line" style={{ width: '55%' }} />
                <div className="sk-line" style={{ width: '88%' }} />
                <div className="sk-line" style={{ width: '70%' }} />
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Attention Banner */}
            {liveState === 'attention' && (
              <div className="bg-fill-warning-soft border border-fill-warning-soft rounded-md p-3.5 flex gap-2.5 text-xs sm:text-[13.5px] text-fill-warning leading-snug">
                <AlertTriangle className="w-4 h-4 flex-none mt-0.5" />
                <span>Живые вопросы временно недоступны. Конспект продолжает создаваться в обычном режиме.</span>
              </div>
            )}

            {/* AI Status Card */}
            <div className="bg-fill-surface border border-fill-border rounded-lg p-4 sm:p-5 shadow-sm">
              <h4 className="text-[11.5px] font-bold text-fill-text-faint uppercase tracking-wider mb-3">
                Статус AI
              </h4>

              {liveState === 'listen' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Слушаю</strong>
                    <span className="text-xs text-fill-text-muted">Улавливаю объяснение учителя</span>
                  </div>
                </div>
              )}

              {liveState === 'process' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-blue-soft text-fill-blue-text flex items-center justify-center flex-none">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Обрабатываю</strong>
                    <span className="text-xs text-fill-text-muted">Собираю новый блок конспекта</span>
                  </div>
                </div>
              )}

              {liveState === 'question' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Вопрос опубликован</strong>
                    <span className="text-xs text-fill-text-muted">Ждём ответы учеников</span>
                  </div>
                </div>
              )}

              {liveState === 'results' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Слушаю</strong>
                    <span className="text-xs text-fill-text-muted">Вопрос закрыт, продолжаю конспект</span>
                  </div>
                </div>
              )}

              {liveState === 'attention' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-warning-soft text-fill-warning flex items-center justify-center flex-none">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Нужно внимание</strong>
                    <span className="text-xs text-fill-text-muted">Живые вопросы приостановлены</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connected Students */}
            <div className="bg-fill-surface border border-fill-border rounded-lg p-4 sm:p-5 shadow-sm">
              <h4 className="text-[11.5px] font-bold text-fill-text-faint uppercase tracking-wider mb-2">
                Ученики на уроке
              </h4>
              <div className="flex items-baseline justify-between">
                <span className="font-head font-extrabold text-2xl text-fill-text tabular-nums">
                  28 / 30
                </span>
                <span className="text-xs text-fill-text-faint">подключено</span>
              </div>
            </div>

            {/* Active Question Card */}
            {liveState === 'question' && (
              <div className="bg-fill-surface border border-fill-border rounded-lg p-5 shadow-sm">
                <div className="text-[11.5px] font-bold uppercase tracking-wider text-fill-green-deep mb-2">
                  {DEMO_LIVE_QUESTION.eyebrow}
                </div>
                <h3 className="text-[15.5px] font-bold text-fill-text mb-3 leading-snug">
                  {DEMO_LIVE_QUESTION.text}
                </h3>

                <div className="space-y-2">
                  {DEMO_LIVE_QUESTION.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1 text-sm text-fill-text-muted">
                      <span className="w-4 h-4 rounded-full border-[1.6px] border-fill-border flex-none" />
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3.5 border-t border-fill-border">
                  <div className="flex justify-between text-xs text-fill-text-faint mb-1.5">
                    <span>Ответили</span>
                    <span>{DEMO_LIVE_QUESTION.answered_count} из {DEMO_LIVE_QUESTION.total_students}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-fill-surface-alt overflow-hidden">
                    <div 
                      className="h-full bg-fill-blue rounded-full transition-all duration-500" 
                      style={{ width: `${(DEMO_LIVE_QUESTION.answered_count / DEMO_LIVE_QUESTION.total_students) * 100}%` }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setLiveState('results')}
                  className="btn btn-ghost w-full justify-center text-xs mt-4 py-2"
                >
                  Закрыть вопрос
                </button>
              </div>
            )}

            {/* Closed Question Results */}
            {liveState === 'results' && (
              <div className="bg-fill-surface border border-fill-border rounded-lg p-5 shadow-sm">
                <div className="text-[11.5px] font-bold uppercase tracking-wider text-fill-text-faint mb-2">
                  Вопрос закрыт
                </div>
                <h3 className="text-[15.5px] font-bold text-fill-text mb-3 leading-snug">
                  {DEMO_LIVE_QUESTION.text}
                </h3>

                <div className="space-y-3">
                  {DEMO_LIVE_QUESTION.options.map((opt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className={opt.is_correct ? 'text-fill-success font-bold flex items-center gap-1' : 'text-fill-text-muted'}>
                          {opt.text}
                          {opt.is_correct && <CheckCircle className="w-3.5 h-3.5 inline" />}
                        </span>
                        <span className={opt.is_correct ? 'text-fill-success font-bold' : 'text-fill-text-faint'}>
                          {opt.percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-fill-surface-alt overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            opt.is_correct ? 'bg-fill-success' : 'bg-fill-border'
                          }`}
                          style={{ width: `${opt.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-md bg-fill-blue-soft border border-fill-blue-soft flex gap-2.5 text-xs text-fill-blue-text leading-relaxed">
                  <Info className="w-4 h-4 flex-none mt-0.5" />
                  <span>{DEMO_LIVE_QUESTION.insight}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Collapsible Transcript Strip with Word Timestamps (Sprint 3) */}
      <div className="border-t border-fill-border bg-fill-surface px-4 sm:px-8 mt-auto">
        <div
          onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
          className="flex items-center justify-between py-3.5 cursor-pointer user-select-none hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-fill-text-faint">
            <Mic className="w-4 h-4" />
            Транскрипт урока (Soniox ASR)
          </div>
          <ChevronDown className={`w-4 h-4 text-fill-text-faint transition-transform duration-200 ${isTranscriptOpen ? 'rotate-180' : ''}`} />
        </div>

        {isTranscriptOpen && (
          <div className="pb-4 text-[13.5px] text-fill-text-faint flex flex-col gap-2 max-w-3xl">
            {DEMO_TRANSCRIPT.map((seg, i) => (
              <div key={seg.id || i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-[11px] text-fill-text-faint">
                  <span className="font-semibold text-fill-text">{seg.speaker || 'Учитель'}</span>
                  <span>[{(seg.start_ms / 1000).toFixed(1)}s – {(seg.end_ms / 1000).toFixed(1)}s]</span>
                </div>
                <span className={i === DEMO_TRANSCRIPT.length - 1 ? 'typing-cursor text-fill-text' : ''}>
                  {seg.words ? (
                    seg.words.map((w, wIdx) => (
                      <span key={wIdx} className="hover:text-fill-blue hover:underline cursor-pointer" title={`${w.start_ms}ms`}>
                        {w.word}{' '}
                      </span>
                    ))
                  ) : (
                    seg.text
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anki Flashcards Modal (Sprint 1) */}
      {showAnkiModal && (
        <div className="fixed inset-0 bg-[#14171A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface border border-fill-border rounded-lg max-w-lg w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowAnkiModal(false)}
              className="absolute top-4 right-4 text-fill-text-faint hover:text-fill-text"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-base font-bold text-fill-text mb-2">
              <FileSpreadsheet className="w-5 h-5 text-fill-green-deep" />
              Экспорт карточек для Anki (TSV)
            </div>
            <p className="text-xs text-fill-text-muted mb-4">
              Сгенерировано эндпоинтом <code>GET /v1/lessons/{'{id}'}/export?format=anki</code> из глоссария и ключевых понятий урока.
            </p>

            <div className="bg-fill-surface-alt rounded-md p-3 max-h-48 overflow-auto mb-5 font-mono text-[11px] text-fill-text whitespace-pre">
              {DEMO_ANKI_TSV}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAnkiModal(false)}
                className="btn btn-ghost text-xs py-2 px-4"
              >
                Закрыть
              </button>
              <button
                onClick={downloadAnkiTsv}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать lesson_anki.tsv
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Playback Modal (Sprint 3) */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-[#14171A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface border border-fill-border rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowRecordingModal(false)}
              className="absolute top-4 right-4 text-fill-text-faint hover:text-fill-text"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-base font-bold text-fill-text mb-2">
              <Video className="w-5 h-5 text-fill-danger" />
              Синхронизированная запись урока
            </div>
            <p className="text-xs text-fill-text-muted mb-4">
              LiveKit Egress сервис сохраняет видео/аудио поток в MinIO S3 и предоставляет воспроизведение через <code>GET /v1/lessons/{'{id}'}/recording</code>.
            </p>

            <div className="aspect-video bg-fill-surface-alt rounded-md border border-fill-border flex flex-col items-center justify-center p-4 text-center mb-5">
              <Video className="w-10 h-10 text-fill-text-faint mb-2" />
              <span className="text-xs font-semibold text-fill-text">
                LiveKit Room: room_{DEMO_LESSON.id.slice(0, 8)}
              </span>
              <span className="text-[11px] text-fill-text-faint mt-1">
                Формат: MP4 H.264 / AAC (1080p, 30fps)
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowRecordingModal(false)}
                className="btn btn-primary text-xs py-2 px-4"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
