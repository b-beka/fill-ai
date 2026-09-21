import React, { useState } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Volume2, 
  Code, 
  FileText, 
  Image as ImageIcon,
  Smartphone,
  Maximize2,
  HelpCircle,
  Play,
  Pause,
  X
} from 'lucide-react';
import { ALL_TRACKS, CurriculumTrack } from '../services/mockData';

export type StudentDemoState = 'notes' | 'question';

export const StudentScreen: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [studentState, setStudentState] = useState<StudentDemoState>('notes');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [showCatchupModal, setShowCatchupModal] = useState(false);

  // In moderated mode (Sprint 1), students only see approved blocks
  const visibleBlocks = currentTrack.blocks.filter((b) => b.status === 'approved');

  const handleSelectOption = (id: string) => {
    setSelectedOptionId(id);
    setIsAnswered(true);
  };

  const handleTrackChange = (track: CurriculumTrack) => {
    setCurrentTrack(track);
    setSelectedOptionId(null);
    setIsAnswered(false);
  };

  const currentOption = currentTrack.live_question.options.find(
    (o) => o.id === selectedOptionId
  );

  return (
    <div className="py-8 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center gap-6 bg-fill-bg min-h-[calc(100vh-60px)]">
      {/* Top Header & Multi-Subject Selector */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-fill-border pb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-fill-green-deep">
            Интерфейс ученика
          </span>
          <h2 className="text-lg font-bold text-fill-text">
            Живой конспект и интерактивные задания
          </h2>
        </div>

        {/* Universal Subject Switcher */}
        <div className="flex items-center gap-1.5 bg-fill-surface-alt p-1 rounded-lg border border-fill-border overflow-x-auto max-w-full">
          {ALL_TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => handleTrackChange(track)}
              className={`text-xs font-semibold py-1.5 px-3 rounded-md transition-all whitespace-nowrap ${
                currentTrack.id === track.id
                  ? 'bg-fill-surface text-fill-text shadow-sm border border-fill-border'
                  : 'text-fill-text-muted hover:text-fill-text'
              }`}
            >
              {track.name.split(':')[0]}
            </button>
          ))}
        </div>

        {/* View Mode Toggle & Catch-up Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatchupModal(true)}
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Получить сжатую выжимку пропущенного материала"
          >
            <HelpCircle className="w-3.5 h-3.5 text-fill-green-deep" />
            <span>Что я пропустил?</span>
          </button>

          <div className="hidden sm:flex bg-fill-surface-alt p-0.5 rounded-md border border-fill-border">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'desktop' ? 'bg-fill-surface text-fill-text shadow-sm' : 'text-fill-text-muted'
              }`}
              title="Книжный вид (Ноутбук / Планшет)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'mobile' ? 'bg-fill-surface text-fill-text shadow-sm' : 'text-fill-text-muted'
              }`}
              title="Мобильный вид (Смартфон)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* State Switcher (Конспект vs Задача от учителя) */}
      <div className="flex gap-2">
        <button
          onClick={() => setStudentState('notes')}
          className={`text-xs font-bold py-1.5 px-4 rounded-full border transition-all ${
            studentState === 'notes'
              ? 'bg-fill-text text-fill-surface border-fill-text'
              : 'bg-fill-surface text-fill-text-muted border-fill-border hover:text-fill-text'
          }`}
        >
          Книжный конспект ({visibleBlocks.length} раздела)
        </button>
        <button
          onClick={() => setStudentState('question')}
          className={`text-xs font-bold py-1.5 px-4 rounded-full border flex items-center gap-1.5 transition-all ${
            studentState === 'question'
              ? 'bg-fill-green-deep text-white border-fill-green-deep'
              : 'bg-fill-surface text-fill-green-deep border-fill-green-deep/30 hover:bg-fill-green-soft'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-fill-green animate-pulse" />
          Задача от учителя
        </button>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP / TABLET EDITORIAL BOOK LAYOUT                     */}
      {/* ========================================================= */}
      {viewMode === 'desktop' ? (
        <div className="w-full bg-fill-surface rounded-xl border border-fill-border shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          {/* Header of the Book Chapter */}
          <div className="border-b border-fill-border pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-fill-text-faint tracking-wider uppercase">
                {currentTrack.category} · {currentTrack.lesson.subject}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-head text-fill-text mt-0.5">
                {currentTrack.lesson.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-fill-success-soft text-fill-success font-semibold px-2 py-0.5 rounded border border-fill-success/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Проверено преподавателем
              </span>
            </div>
          </div>

          {/* ACTIVE QUESTION BANNER IF IN QUESTION STATE */}
          {studentState === 'question' && (
            <div className="bg-fill-surface-alt border-2 border-fill-green-deep/40 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fill-green-deep flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-fill-green-deep" />
                  {currentTrack.live_question.eyebrow}
                </span>
                <span className="text-xs font-bold text-fill-text flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-fill-text-muted" />
                  Осталось 00:22
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-fill-text mb-4">
                {currentTrack.live_question.text}
              </h3>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentTrack.live_question.options.map((opt) => {
                  const isChosen = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isAnswered}
                      className={`text-left p-3.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${
                        isChosen
                          ? opt.is_correct
                            ? 'border-fill-success bg-fill-success-soft text-fill-text'
                            : 'border-fill-warning bg-fill-warning-soft text-fill-text'
                          : 'border-fill-border bg-fill-surface hover:border-fill-text-faint text-fill-text'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex-none flex items-center justify-center text-[11px] font-bold border ${
                          isChosen
                            ? opt.is_correct
                              ? 'border-fill-success bg-fill-success text-white'
                              : 'border-fill-warning bg-fill-warning text-white'
                            : 'border-fill-border text-fill-text-muted'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanatory Feedback (0ms distractor explanation) */}
              {isAnswered && currentOption && (
                <div
                  className={`mt-4 p-4 rounded-lg border text-xs sm:text-sm leading-relaxed ${
                    currentOption.is_correct
                      ? 'bg-fill-success-soft border-fill-success/30 text-fill-text'
                      : 'bg-fill-warning-soft border-fill-warning/40 text-fill-text'
                  }`}
                >
                  <strong className="font-bold">
                    {currentOption.is_correct ? 'Правильный ответ: ' : 'Пояснение к ошибке: '}
                  </strong>
                  <span>{currentOption.explanation}</span>
                </div>
              )}
            </div>
          )}

          {/* EDITORIAL CHAPTER BLOCKS: SIDE-BY-SIDE MEDIA & NARRATIVE */}
          <div className="space-y-8">
            {visibleBlocks.map((block, idx) => {
              const hasMedia = Boolean(block.media_artifact);
              const isMediaLeft = block.media_artifact?.align === 'left';

              return (
                <article
                  key={block.id}
                  className="border-t border-fill-border/70 pt-6 first:border-t-0 first:pt-0"
                >
                  {/* Section Title & Timecode */}
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-base sm:text-lg font-bold font-head text-fill-text">
                      {idx + 1}. {block.title}
                    </h2>
                    <span className="text-[11px] font-mono text-fill-text-faint flex-none">
                      Таймкод {Math.floor(block.t_start_ms / 60000)}:00
                    </span>
                  </div>

                  {/* Two-Column Editorial Layout (Media + Narrative) */}
                  <div
                    className={`grid grid-cols-1 ${
                      hasMedia ? 'lg:grid-cols-12' : ''
                    } gap-6 items-start`}
                  >
                    {/* MEDIA ARTIFACT IN ACCENT FRAME */}
                    {hasMedia && block.media_artifact && (
                      <div
                        className={`lg:col-span-5 ${
                          isMediaLeft ? 'lg:order-1' : 'lg:order-2'
                        } border border-fill-border rounded-lg overflow-hidden bg-fill-surface-alt shadow-sm`}
                      >
                        {/* Frame Header / Badge */}
                        <div className="px-3 py-2 border-b border-fill-border flex items-center justify-between bg-fill-surface text-[11px] font-bold text-fill-text-muted">
                          <span className="flex items-center gap-1.5">
                            {block.media_artifact.type === 'audio' && <Volume2 className="w-3.5 h-3.5 text-fill-blue" />}
                            {block.media_artifact.type === 'code' && <Code className="w-3.5 h-3.5 text-fill-green-deep" />}
                            {block.media_artifact.type === 'slide' && <FileText className="w-3.5 h-3.5 text-fill-text-faint" />}
                            {block.media_artifact.type === 'photo' && <ImageIcon className="w-3.5 h-3.5 text-fill-text-faint" />}
                            {block.media_artifact.title || 'Иллюстрация к тезису'}
                          </span>
                          {block.media_artifact.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-fill-surface-alt border border-fill-border text-fill-text-faint">
                              {block.media_artifact.badge}
                            </span>
                          )}
                        </div>

                        {/* Frame Content */}
                        <div className="p-3 bg-fill-surface flex flex-col gap-2">
                          {/* Code Preview */}
                          {block.media_artifact.type === 'code' && block.media_artifact.code_snippet && (
                            <pre className="font-mono text-[11.5px] p-3 rounded bg-[#14171A] text-slate-100 overflow-x-auto leading-relaxed">
                              <code>{block.media_artifact.code_snippet}</code>
                            </pre>
                          )}

                          {/* Audio Player Mock */}
                          {block.media_artifact.type === 'audio' && (
                            <div className="p-3 rounded-md bg-fill-surface-alt border border-fill-border flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() =>
                                    setIsPlayingAudio((prev) =>
                                      prev === block.id ? null : block.id
                                    )
                                  }
                                  className="w-7 h-7 rounded-full bg-fill-text text-fill-surface flex items-center justify-center text-xs"
                                >
                                  {isPlayingAudio === block.id ? (
                                    <Pause className="w-3 h-3 text-fill-surface" />
                                  ) : (
                                    <Play className="w-3 h-3 text-fill-surface ml-0.5" />
                                  )}
                                </button>
                                <div className="text-xs">
                                  <div className="font-semibold text-fill-text">
                                    Аудиозапись лектора
                                  </div>
                                  <div className="text-[10px] text-fill-text-faint">
                                    Длительность: {block.media_artifact.audio_duration}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-fill-green-deep font-bold">
                                {isPlayingAudio === block.id ? 'Воспроизведение...' : 'Слушать'}
                              </span>
                            </div>
                          )}

                          {/* SVG / Diagram Placeholder */}
                          {(block.media_artifact.type === 'slide' ||
                            block.media_artifact.type === 'diagram' ||
                            block.media_artifact.type === 'photo') && (
                            <div className="w-full h-36 rounded bg-fill-surface-alt border border-dashed border-fill-border flex flex-col items-center justify-center text-center p-3">
                              <span className="text-xs font-bold text-fill-text">
                                {block.media_artifact.title}
                              </span>
                              <span className="text-[11px] text-fill-text-faint mt-1 max-w-[240px]">
                                Векторный слайд из предзагруженной презентации (Zero-Cost pHash)
                              </span>
                            </div>
                          )}

                          {/* Caption */}
                          <p className="text-[11px] text-fill-text-faint italic leading-snug border-t border-fill-border pt-2">
                            {block.media_artifact.caption}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* NARRATIVE TEXT COLUMN */}
                    <div
                      className={`${
                        hasMedia ? 'lg:col-span-7' : 'w-full'
                      } ${isMediaLeft ? 'lg:order-2' : 'lg:order-1'}`}
                    >
                      <p className="text-sm sm:text-[15px] leading-relaxed text-fill-text font-normal">
                        {block.body_md}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* MOBILE VIEW (SMARTPHONE NOTCH FRAME)                      */
        /* ========================================================= */
        <div className="w-[340px] sm:w-[360px] h-[680px] sm:h-[720px] rounded-[36px] border-[8px] border-fill-text bg-fill-surface overflow-hidden relative shadow-md flex flex-col">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[20px] bg-fill-text rounded-b-xl z-20" />

          {/* Top bar inside phone */}
          <div className="pt-6 pb-2.5 px-4 border-b border-fill-border flex items-center justify-between bg-fill-surface z-10">
            <strong className="text-xs font-bold font-head text-fill-text truncate max-w-[180px]">
              {currentTrack.lesson.title}
            </strong>
            <span className="text-[10px] bg-fill-success-soft text-fill-success font-bold px-1.5 py-0.5 rounded">
              Одобрено
            </span>
          </div>

          {/* Phone Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-fill-surface">
            {/* Live Question Card inside Mobile */}
            {studentState === 'question' && (
              <div className="bg-fill-surface-alt border border-fill-green-deep/30 rounded-lg p-3.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-fill-green-deep mb-1">
                  {currentTrack.live_question.eyebrow}
                </div>
                <h4 className="text-xs font-bold text-fill-text mb-3 leading-snug">
                  {currentTrack.live_question.text}
                </h4>

                <div className="space-y-1.5">
                  {currentTrack.live_question.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isAnswered}
                      className={`w-full text-left p-2.5 rounded border text-xs transition-all flex items-center gap-2 ${
                        selectedOptionId === opt.id
                          ? opt.is_correct
                            ? 'border-fill-success bg-fill-success-soft font-semibold'
                            : 'border-fill-warning bg-fill-warning-soft'
                          : 'border-fill-border bg-fill-surface'
                      }`}
                    >
                      <span className="font-bold">{opt.id}.</span>
                      <span className="truncate">{opt.text}</span>
                    </button>
                  ))}
                </div>

                {isAnswered && currentOption && (
                  <div className="mt-2.5 p-2 rounded bg-fill-surface text-[11px] border border-fill-border text-fill-text-muted leading-tight">
                    <b>{currentOption.is_correct ? 'Верно: ' : 'Пояснение: '}</b>
                    {currentOption.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Note Blocks inside Mobile */}
            {visibleBlocks.map((block) => (
              <div key={block.id} className="border border-fill-border rounded-lg p-3 bg-fill-surface-alt">
                <h5 className="text-xs font-bold text-fill-text mb-1.5">
                  {block.title}
                </h5>
                <p className="text-[11.5px] text-fill-text-muted leading-relaxed">
                  {block.body_md}
                </p>
                {block.media_artifact && (
                  <div className="mt-2.5 p-2 rounded bg-fill-surface border border-fill-border text-[10.5px] text-fill-text-faint">
                    <b>{block.media_artifact.badge}: </b>
                    {block.media_artifact.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATCH-UP MODAL ("ЧТО Я ПРОПУСТИЛ?") */}
      {showCatchupModal && (
        <div className="fixed inset-0 bg-[#14171A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface max-w-md w-full rounded-xl border border-fill-border p-6 shadow-xl relative">
            <button
              onClick={() => setShowCatchupModal(false)}
              className="absolute top-4 right-4 text-fill-text-muted hover:text-fill-text"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-fill-green-deep">
              Экспресс-выжимка (0 токенов)
            </span>
            <h3 className="text-base font-bold text-fill-text mt-1 mb-3">
              Что вы пропустили за первые 20 минут:
            </h3>

            <div className="space-y-2.5 text-xs text-fill-text-muted leading-relaxed">
              <div className="p-2.5 rounded bg-fill-surface-alt border border-fill-border">
                <b className="text-fill-text block mb-0.5">1. Базовые принципы</b>
                Преподаватель объяснил вводные понятия и ограничения рассматриваемой модели.
              </div>
              <div className="p-2.5 rounded bg-fill-surface-alt border border-fill-border">
                <b className="text-fill-text block mb-0.5">2. Ключевая формула и механика</b>
                Разобран механизм взаимодействия компонентов и влияние погрешностей на результат.
              </div>
              <div className="p-2.5 rounded bg-fill-surface-alt border border-fill-border">
                <b className="text-fill-text block mb-0.5">3. Типичные ошибки</b>
                Сделан акцент на распространенных заблуждениях, снижающих качество решения.
              </div>
            </div>

            <button
              onClick={() => setShowCatchupModal(false)}
              className="btn btn-primary w-full text-xs py-2 mt-5"
            >
              Понятно, вернуться к текущему моменту
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
