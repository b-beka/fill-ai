import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Radio, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  FileText, 
  Image as ImageIcon, 
  RotateCcw,
  X
} from 'lucide-react';
import { ALL_TRACKS, CurriculumTrack } from '../services/mockData';

export type QuizTab = 'quiz' | 'ask';

export const StudentScreen: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [showCatchupModal, setShowCatchupModal] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<QuizTab>('quiz');
  
  // Video player interactive states
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [videoViewMode, setVideoViewMode] = useState<'slide' | 'pip'>('pip');
  const [studentQuestionInput, setStudentQuestionInput] = useState('');
  const [submittedQuestions, setSubmittedQuestions] = useState<string[]>([
    'Связан ли вторично-активный транспорт с гидролизом АТФ напрямую?',
  ]);
  const [countdown, setCountdown] = useState(24);

  // In moderated mode, students only see approved blocks
  const visibleBlocks = currentTrack.blocks.filter((b) => b.status === 'approved');

  // Question countdown simulation
  useEffect(() => {
    if (countdown > 0 && !isAnswered) {
      const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown, isAnswered]);

  const handleSelectOption = (id: string) => {
    setSelectedOptionId(id);
    setIsAnswered(true);
  };

  const handleTrackChange = (track: CurriculumTrack) => {
    setCurrentTrack(track);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setCountdown(28);
  };

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuestionInput.trim()) return;
    setSubmittedQuestions((prev) => [studentQuestionInput.trim(), ...prev]);
    setStudentQuestionInput('');
  };

  const currentOption = currentTrack.live_question.options.find(
    (o) => o.id === selectedOptionId
  );

  return (
    <div className="w-full bg-[#000000] text-white min-h-[calc(100vh-64px)] pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP SUB-HEADER: STREAM META & SUBJECT SWITCHER                        */}
      {/* ========================================================================= */}
      <div className="border-b border-white/10 bg-[#07080a] sticky top-[64px] z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Stream Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/40 text-[11px] font-mono font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE ЭФИР</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-head text-white truncate max-w-md">
                {currentTrack.lesson.title}
              </h1>
              <div className="text-[11px] text-[#9a9a9a] flex items-center gap-2">
                <span>{currentTrack.category}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">28 учеников в эфире</span>
              </div>
            </div>
          </div>

          {/* Center / Right: Track Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Subject Selector */}
            <div className="flex items-center gap-1 bg-[#121417] p-1 rounded-lg border border-white/10">
              {ALL_TRACKS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTrackChange(t)}
                  className={`text-xs font-semibold py-1 px-2.5 rounded-md transition-all whitespace-nowrap ${
                    currentTrack.id === t.id
                      ? 'bg-white/15 text-white shadow-sm border border-white/20'
                      : 'text-[#9a9a9a] hover:text-white'
                  }`}
                >
                  {t.name.split(':')[0]}
                </button>
              ))}
            </div>

            {/* "What did I miss?" Smart Catchup */}
            <button
              onClick={() => setShowCatchupModal(true)}
              className="btn-liquid-ghost text-xs h-8 px-3 flex items-center gap-1.5"
              title="Получить смысловую выжимку пропущенных фрагментов лекции"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Что я пропустил?</span>
              <span className="sm:hidden">Выжимка</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* ========================================================================= */}
        {/* 2. YOUTUBE-STYLE CINEMA GRID: 16:9 PLAYER (LEFT) + LIVE QUIZ/ASK (RIGHT)  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================== */}
          {/* LEFT: 16:9 CINEMA LECTURE BROADCAST PLAYER (Col 1..8)      */}
          {/* ========================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            
            <div 
              className="relative w-full aspect-video rounded-2xl bg-[#050608] border border-white/15 overflow-hidden shadow-2xl flex flex-col justify-between group select-none"
              style={{
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,255,255,0.03)'
              }}
            >
              {/* Screen Content: Live Visual Stream Simulation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Background Tech Mesh */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#060e18] via-[#090b10] to-[#04120c] opacity-90" />
                <div className="grain-overlay opacity-30" />

                {/* Simulated Presentation Canvas */}
                <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono text-white/90">
                      Слайд 02 / 08 · {currentTrack.name.split(':')[0]}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] border border-emerald-500/30">
                        Zero-Cost Slide Capture
                      </span>
                    </div>
                  </div>

                  {/* Visual Diagram Representation */}
                  <div className="flex flex-col items-center justify-center text-center my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-white mb-3 shadow-inner">
                      <Radio className="w-8 h-8 text-sky-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-head text-white tracking-tight max-w-md">
                      {currentTrack.lesson.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9a9a9a] mt-1 max-w-sm">
                      Синхронный видеопоток лектора и распознанных материалов доски в 1080p
                    </p>
                  </div>

                  {/* Empty spacer */}
                  <div className="h-6" />
                </div>
              </div>

              {/* PiP Overlay: Teacher Video Avatar in Corner */}
              {videoViewMode === 'pip' && (
                <div className="absolute top-4 right-4 z-20 w-36 sm:w-44 aspect-video rounded-xl bg-black/85 border border-white/20 shadow-xl overflow-hidden p-2 flex flex-col justify-between backdrop-blur-md">
                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      КАМЕРА
                    </span>
                    <span className="font-mono text-white/40">HD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/15 text-[11px] font-bold text-white flex items-center justify-center font-mono">
                      ПР
                    </div>
                    <div className="text-[11px] text-white font-semibold leading-tight truncate">
                      Лектор в эфире
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2.5 w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[9px] text-[#9a9a9a] ml-1 font-mono">ASR транскрибирует</span>
                  </div>
                </div>
              )}

              {/* Top Controls Overlay */}
              <div className="relative z-10 p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-black/60 border border-white/20 text-xs font-mono text-white">
                    FILL AI Cinema Engine
                  </span>
                </div>
                <button
                  onClick={() => setVideoViewMode((m) => (m === 'pip' ? 'slide' : 'pip'))}
                  className="px-2.5 py-1 rounded bg-black/60 border border-white/20 text-xs text-white hover:bg-white/10 transition-colors"
                >
                  {videoViewMode === 'pip' ? 'Скрыть окно лектора' : 'Показать окно лектора'}
                </button>
              </div>

              {/* Bottom Player Controller Bar (YouTube Style) */}
              <div className="relative z-10 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2">
                {/* Progress bar line */}
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer relative">
                  <div className="w-3/4 h-full bg-red-600 rounded-full" />
                </div>

                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsVideoPlaying((p) => !p)}
                      className="p-1 rounded hover:text-red-500 transition-colors"
                      title={isVideoPlaying ? 'Пауза' : 'Воспроизведение'}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <button
                      onClick={() => setIsMuted((m) => !m)}
                      className="p-1 rounded hover:text-[#9a9a9a] transition-colors"
                      title={isMuted ? 'Включить звук' : 'Выключить звук'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="font-mono text-[11px] text-white/70">
                      42:15 / 60:00
                    </span>

                    <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-red-500 font-bold ml-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      ПРЯМОЙ ЭФИР
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/80">
                      1080p 60fps
                    </span>
                    <button className="p-1 rounded hover:text-[#9a9a9a] transition-colors">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Video Meta & Verified Badge Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#090b0e] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/15 flex items-center justify-center font-bold text-xs text-white font-mono flex-none">
                  {(currentTrack.lesson.subject || 'F').charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{currentTrack.lesson.subject || 'Дисциплина'}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Верифицировано преподавателем
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9a9a9a]">
                    Оркестрация конспекта: Gemini 3.5 Flash-Lite + Soniox ASR
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                <span>Блоков в конспекте:</span>
                <span className="text-white font-bold">{visibleBlocks.length}</span>
              </div>
            </div>

          </div>

          {/* ========================================================== */}
          {/* RIGHT: LIVE QUIZ & FAST QUESTION SIDEBAR (Col 9..12)       */}
          {/* ========================================================== */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-[130px]">
            
            {/* Tab Switcher: Live Quiz vs Quick Questions */}
            <div className="grid grid-cols-2 p-1 bg-[#0b0d10] rounded-xl border border-white/10 gap-1">
              <button
                onClick={() => setActiveSideTab('quiz')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold font-head flex items-center justify-center gap-1.5 transition-all ${
                  activeSideTab === 'quiz'
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-[#9a9a9a] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Квиз лектора</span>
              </button>

              <button
                onClick={() => setActiveSideTab('ask')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold font-head flex items-center justify-center gap-1.5 transition-all ${
                  activeSideTab === 'ask'
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-[#9a9a9a] hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Быстрый вопрос</span>
              </button>
            </div>

            {/* TAB CONTENT 1: LIVE QUIZ */}
            {activeSideTab === 'quiz' && (
              <div className="rounded-2xl bg-[#090b0e] border border-white/15 p-5 shadow-xl flex flex-col gap-4">
                
                {/* Header with countdown */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {currentTrack.live_question.eyebrow}
                  </span>
                  <span className="text-xs font-bold font-mono text-white flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-[#9a9a9a]" />
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-sm font-bold font-head text-white leading-snug">
                  {currentTrack.live_question.text}
                </h3>

                {/* Options List */}
                <div className="space-y-2">
                  {currentTrack.live_question.options.map((opt) => {
                    const isChosen = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 ${
                          isChosen
                            ? opt.is_correct
                              ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                              : 'border-red-500 bg-red-950/40 text-white'
                            : isAnswered && opt.is_correct
                            ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                            : 'border-white/10 bg-[#121417] hover:border-white/30 text-white/90'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex-none flex items-center justify-center text-[10px] font-bold border ${
                            isChosen
                              ? opt.is_correct
                                ? 'border-emerald-400 bg-emerald-400 text-black'
                                : 'border-red-400 bg-red-400 text-white'
                              : 'border-white/20 text-white/60'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 leading-tight">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Explanatory Feedback (0ms distractor explanation) */}
                {isAnswered && currentOption && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                      currentOption.is_correct
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      {currentOption.is_correct ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Правильный ответ!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Пояснение к ошибке (0ms latency):</span>
                        </>
                      )}
                    </div>
                    <span>{currentOption.explanation}</span>
                  </div>
                )}

                {/* Reset test button for Stand showcase */}
                {isAnswered && (
                  <button
                    onClick={() => {
                      setSelectedOptionId(null);
                      setIsAnswered(false);
                      setCountdown(24);
                    }}
                    className="text-xs text-[#9a9a9a] hover:text-white flex items-center justify-center gap-1.5 py-1 text-center"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Пройти заново для демонстрации</span>
                  </button>
                )}

              </div>
            )}

            {/* TAB CONTENT 2: QUICK QUESTION TO TEACHER */}
            {activeSideTab === 'ask' && (
              <div className="rounded-2xl bg-[#090b0e] border border-white/15 p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Вопрос в эфир
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    Live Chat
                  </span>
                </div>

                {/* List of submitted questions */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {submittedQuestions.map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#121417] border border-white/10 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                        <span>Вы (Ученик)</span>
                        <span className="text-emerald-400">В очереди лектора</span>
                      </div>
                      <div className="text-white/90">{q}</div>
                    </div>
                  ))}
                </div>

                {/* Question Input Form */}
                <form onSubmit={handleSendQuestion} className="flex flex-col gap-2 pt-2 border-t border-white/10">
                  <textarea
                    rows={2}
                    value={studentQuestionInput}
                    onChange={(e) => setStudentQuestionInput(e.target.value)}
                    placeholder="Напишите быстрый вопрос лектору..."
                    className="w-full bg-[#13161a] border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!studentQuestionInput.trim()}
                    className="btn-liquid-solid text-xs h-8 px-3 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <span>Отправить в эфир</span>
                    <Send className="w-3 h-3 text-black" />
                  </button>
                </form>
              </div>
            )}

            {/* Attendance & Catchup Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c121c] to-[#080a0e] border border-white/10 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Смысловое присутствие</span>
                <span className="text-[11px] text-[#9a9a9a]">Синхронизировано с таймкодом</span>
              </div>
              <button
                onClick={() => setShowCatchupModal(true)}
                className="btn-liquid-ghost text-xs h-7 px-2.5"
              >
                Выжимка
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. EDITORIAL NOTE BLOCKS UNDERNEATH VIDEO ("поля конспекта снизу")         */}
        {/* ========================================================================= */}
        <section className="mt-12 pt-8 border-t border-white/10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="liquid-badge text-[11px] py-0.5 px-2">
                  <FileText className="w-3.5 h-3.5 text-white" />
                  Мультимедийный конспект
                </span>
                <span className="text-xs text-emerald-400 font-mono">Real-time sync</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-head text-white">
                Конспект лекции в реальном времени
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#9a9a9a] max-w-md">
              Слайды, формулы LaTeX, аудиоцитаты и структурированный текст появляются автоматически по ходу объяснения учителя.
            </p>
          </div>

          {/* Note Blocks Stream */}
          <div className="space-y-8">
            {visibleBlocks.map((block, idx) => {
              const hasMedia = Boolean(block.media_artifact);
              const isMediaLeft = block.media_artifact?.align === 'left';

              return (
                <article
                  key={block.id}
                  className="rounded-2xl bg-[#090a0d] border border-white/10 p-6 sm:p-8 hover:border-white/25 transition-all shadow-lg"
                >
                  {/* Top Bar of the Block */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-head font-bold text-xs text-white">
                        {idx + 1}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-head text-white">
                        {block.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#9a9a9a]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Math.floor(block.t_start_ms / 60000)}:00</span>
                    </div>
                  </div>

                  {/* 2-Column Responsive Layout (Media Frame + Narrative Text) */}
                  <div className={`grid grid-cols-1 ${hasMedia ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
                    
                    {/* MEDIA ARTIFACT IN LIQUID ACCENT FRAME */}
                    {hasMedia && block.media_artifact && (
                      <div
                        className={`lg:col-span-5 ${
                          isMediaLeft ? 'lg:order-1' : 'lg:order-2'
                        } border border-white/15 rounded-xl overflow-hidden bg-[#0e1014] shadow-md`}
                      >
                        {/* Frame Header */}
                        <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between bg-[#13161c] text-xs font-bold text-white">
                          <span className="flex items-center gap-2">
                            {block.media_artifact.type === 'audio' && <Volume2 className="w-4 h-4 text-sky-400" />}
                            {block.media_artifact.type === 'code' && <Code className="w-4 h-4 text-emerald-400" />}
                            {block.media_artifact.type === 'slide' && <FileText className="w-4 h-4 text-amber-400" />}
                            {block.media_artifact.type === 'photo' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                            <span>{block.media_artifact.title || 'Иллюстрация к тезису'}</span>
                          </span>
                          {block.media_artifact.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 border border-white/15 text-white/70">
                              {block.media_artifact.badge}
                            </span>
                          )}
                        </div>

                        {/* Frame Content */}
                        <div className="p-4 flex flex-col gap-3">
                          {/* Code Preview */}
                          {block.media_artifact.type === 'code' && block.media_artifact.code_snippet && (
                            <pre className="font-mono text-xs p-3.5 rounded-lg bg-[#050608] text-emerald-300 border border-white/10 overflow-x-auto leading-relaxed">
                              <code>{block.media_artifact.code_snippet}</code>
                            </pre>
                          )}

                          {/* Audio Player Mock */}
                          {block.media_artifact.type === 'audio' && (
                            <div className="p-3 rounded-lg bg-[#14181f] border border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    setIsPlayingAudio((prev) =>
                                      prev === block.id ? null : block.id
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                  {isPlayingAudio === block.id ? (
                                    <Pause className="w-3.5 h-3.5 fill-black" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                                  )}
                                </button>
                                <div>
                                  <div className="text-xs font-semibold text-white">
                                    Аудиоцитата учителя
                                  </div>
                                  <div className="text-[10px] text-[#9a9a9a]">
                                    {block.media_artifact.audio_duration}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                {isPlayingAudio === block.id ? 'Воспроизведение...' : 'Слушать'}
                              </span>
                            </div>
                          )}

                          {/* Slide / Diagram Frame */}
                          {(block.media_artifact.type === 'slide' ||
                            block.media_artifact.type === 'diagram' ||
                            block.media_artifact.type === 'photo') && (
                            <div className="w-full h-40 rounded-lg bg-[#07080a] border border-dashed border-white/15 flex flex-col items-center justify-center text-center p-4">
                              <span className="text-xs font-bold text-white mb-1">
                                {block.media_artifact.title}
                              </span>
                              <span className="text-[11px] text-[#9a9a9a] max-w-xs">
                                Векторный слайд из предзагруженной презентации (Zero-Cost pHash)
                              </span>
                            </div>
                          )}

                          {/* Caption */}
                          <p className="text-[11px] text-[#9a9a9a] italic leading-snug border-t border-white/10 pt-2">
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
                      <p className="text-sm sm:text-base leading-relaxed text-white/90 font-normal">
                        {block.body_md}
                      </p>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>

        </section>

      </div>

      {/* ========================================================================= */}
      {/* 4. SMART CATCHUP MODAL ("Что я пропустил?")                               */}
      {/* ========================================================================= */}
      {showCatchupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#090b0e] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold font-head">
                  Смысловая выжимка пропущенного
                </h3>
              </div>
              <button
                onClick={() => setShowCatchupModal(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9a9a9a] leading-relaxed">
              FILL AI зафиксировал таймкоды вашего присутствия и сгенерировал персонализированный дайджест:
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <strong className="text-white block font-semibold mb-1">
                  1. Определение гидрофобного ядра:
                </strong>
                <span className="text-[#9a9a9a]">
                  Фосфолипидный бислой формирует полупроницаемый барьер толщиной 7-10 нм.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <strong className="text-white block font-semibold mb-1">
                  2. Первично-активный транспорт:
                </strong>
                <span className="text-[#9a9a9a]">
                  3 иона Na+ выкачиваются наружу, 2 иона K+ закачиваются внутрь за 1 молекулу АТФ.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCatchupModal(false)}
              className="btn-liquid-solid text-xs h-9 w-full mt-2"
            >
              Вернуться к эфиру
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
