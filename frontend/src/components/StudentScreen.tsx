import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Clock, 
  X
} from 'lucide-react';
import { ALL_TRACKS, CurriculumTrack } from '../services/mockData';

export const StudentScreen: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [showCatchupModal, setShowCatchupModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [studentQuestions, setStudentQuestions] = useState<string[]>([]);

  // Only approved blocks are shown to students
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

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    setStudentQuestions((prev) => [questionInput.trim(), ...prev]);
    setQuestionInput('');
  };

  const currentOption = currentTrack.live_question.options.find(
    (o) => o.id === selectedOptionId
  );

  return (
    <div className="w-full bg-[#000000] text-white min-h-[calc(100vh-64px)] pb-16 font-body">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: STREAM TITLE, DISCIPLINE & CATCHUP BUTTON                  */}
      {/* ========================================================================= */}
      <div className="border-b border-white/10 bg-[#080a0d] sticky top-[64px] z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/50 border border-red-500/40 text-[11px] font-mono-tag text-red-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-display font-medium text-white truncate max-w-sm sm:max-w-md">
                {currentTrack.lesson.title}
              </h1>
              <span className="text-[11px] text-white/50">
                {currentTrack.category} · 28 учеников в эфире
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Subject Switcher */}
            <div className="flex items-center gap-1 bg-[#12151b] p-1 rounded-lg border border-white/10">
              {ALL_TRACKS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTrackChange(t)}
                  className={`text-xs font-medium py-1 px-2.5 rounded-md transition-all ${
                    currentTrack.id === t.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.name.split(':')[0]}
                </button>
              ))}
            </div>

            {/* Simple Catch-up button */}
            <button
              onClick={() => setShowCatchupModal(true)}
              className="text-xs h-8 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Что я пропустил?</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* ========================================================================= */}
        {/* 2. YOUTUBE CINEMA (LEFT 65%) + SIMPLE QUIZ / QUESTION (RIGHT 35%)         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 16:9 VIDEO PLAYER */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div 
              className="relative w-full aspect-video rounded-2xl bg-[#06080b] border border-white/15 overflow-hidden shadow-2xl flex flex-col justify-between"
              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            >
              {/* Video Simulated Slide Canvas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-[#0a0f18] via-[#06080b] to-[#08120b]">
                <div className="text-xs font-mono-tag text-emerald-400 mb-2">
                  Слайд #02 · Синхронизация активна
                </div>
                <h3 className="text-lg sm:text-2xl font-display font-medium text-white max-w-md">
                  {currentTrack.lesson.title}
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-sm">
                  Трансляция материала лектора в высоком разрешении 1080p
                </p>
              </div>

              {/* PiP Teacher Corner */}
              <div className="absolute top-4 right-4 z-10 w-28 sm:w-36 aspect-video rounded-lg bg-black/80 border border-white/20 p-2 flex flex-col justify-between backdrop-blur-sm">
                <div className="flex items-center justify-between text-[9px] font-mono-tag text-emerald-400 font-bold">
                  <span>КАМЕРА</span>
                  <span>1080p</span>
                </div>
                <div className="text-[11px] font-medium text-white truncate">
                  Лектор в эфире
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsVideoPlaying((p) => !p)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {isVideoPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono-tag text-[11px] text-white/60">42:15 / 60:00</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono-tag text-[10px] text-white/50">HD</span>
                  <button className="hover:text-white text-white/70">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Subtitle Strip */}
            <div className="p-3 rounded-xl bg-[#090b0e] border border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>Лектор: <strong className="text-white font-medium">Д-р Аскар Ибраев</strong></span>
              <span className="text-emerald-400 font-mono-tag">Авто-конспект включен</span>
            </div>
          </div>

          {/* RIGHT: QUIZ & FAST QUESTION (Simple, Clear, No Clutter) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-[130px]">
            
            {/* Live Question Card */}
            <div className="rounded-2xl bg-[#0a0c10] border border-white/15 p-5 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="echoid-tag text-[10px]">
                  ВОПРОС ОТ УЧИТЕЛЯ
                </span>
                <span className="text-xs font-mono-tag text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  00:24
                </span>
              </div>

              <h4 className="text-sm font-display font-medium text-white leading-snug">
                {currentTrack.live_question.text}
              </h4>

              {/* Options */}
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
                            ? 'border-emerald-500 bg-emerald-950/40 text-white'
                            : 'border-amber-500 bg-amber-950/40 text-white'
                          : isAnswered && opt.is_correct
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                          : 'border-white/10 bg-[#12151b] hover:border-white/30 text-white/80'
                      }`}
                    >
                      <span className="font-mono-tag font-bold text-white/50">{opt.id}.</span>
                      <span className="flex-1 leading-tight">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Clear Feedback */}
              {isAnswered && currentOption && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                    currentOption.is_correct
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="font-medium mb-1 flex items-center gap-1.5 font-display">
                    {currentOption.is_correct ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Верно!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Пояснение к ошибке:</span>
                      </>
                    )}
                  </div>
                  <span>{currentOption.explanation}</span>
                </div>
              )}
            </div>

            {/* Quick Question Input to Teacher */}
            <div className="rounded-2xl bg-[#0a0c10] border border-white/15 p-4 flex flex-col gap-2.5">
              <span className="text-xs font-display font-medium text-white/80">
                Задать быстрый вопрос лектору:
              </span>
              <form onSubmit={handleSendQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Напишите вопрос..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  className="flex-1 bg-[#12151b] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim()}
                  className="btn-liquid-solid text-xs h-8 px-3 disabled:opacity-40"
                >
                  <Send className="w-3 h-3 text-black" />
                </button>
              </form>

              {studentQuestions.length > 0 && (
                <div className="text-[11px] text-emerald-400 font-mono-tag">
                  Ваш вопрос #{studentQuestions.length} отправлен в очередь лектора
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. SYNCED EDITORIAL NOTE BLOCKS UNDERNEATH (Simple & Clean)               */}
        {/* ========================================================================= */}
        <section className="mt-12 pt-8 border-t border-white/10">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-xl font-display font-medium text-white">
                Конспект урока в реальном времени
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Ключевые мысли, формулы и слайды появляются синхронно с речью преподавателя
              </p>
            </div>
            <span className="text-xs font-mono-tag text-emerald-400">
              {visibleBlocks.length} раздела
            </span>
          </div>

          <div className="space-y-4">
            {visibleBlocks.map((block, idx) => (
              <div
                key={block.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#090b0e] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-white/10 font-mono-tag text-[11px] font-bold text-white flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-display font-medium text-white">
                      {block.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono-tag text-white/40">
                    Таймкод {Math.floor(block.t_start_ms / 60000)}:00
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  {/* Media Frame if exists */}
                  {block.media_artifact && (
                    <div className="sm:col-span-4 rounded-xl bg-[#12151b] border border-white/10 p-3 flex flex-col gap-2">
                      <div className="text-[10px] font-mono-tag text-white/40 uppercase">
                        Материал к разделу
                      </div>
                      <div className="text-xs font-medium text-white">
                        {block.media_artifact.title}
                      </div>
                      {block.media_artifact.type === 'audio' && (
                        <button
                          onClick={() => setIsPlayingAudio((p) => (p === block.id ? null : block.id))}
                          className="mt-1 text-xs py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-between transition-colors"
                        >
                          <span>{isPlayingAudio === block.id ? 'Пауза' : 'Слушать цитату'}</span>
                          <span className="font-mono-tag text-[10px] text-emerald-400">
                            {block.media_artifact.audio_duration}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Body Text */}
                  <p className={`text-xs sm:text-sm text-white/80 leading-relaxed font-normal ${block.media_artifact ? 'sm:col-span-8' : 'sm:col-span-12'}`}>
                    {block.body_md}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </section>

      </div>

      {/* Catchup Modal ("Что я пропустил?") */}
      {showCatchupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0a0c10] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-medium">Выжимка пропущенного</h3>
              <button onClick={() => setShowCatchupModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              FILL AI зафиксировал время вашего подключения и собрал главное в 2 тезиса:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-white block mb-0.5">1. Фосфолипидный бислой:</strong>
                <span className="text-white/70">Гидрофильные головки снаружи, гидрофобные хвосты внутри.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-white block mb-0.5">2. Активный транспорт:</strong>
                <span className="text-white/70">Идёт против градиента концентрации с расходом энергии АТФ.</span>
              </div>
            </div>
            <button onClick={() => setShowCatchupModal(false)} className="btn-liquid-solid text-xs h-8 w-full mt-2">
              Вернуться к уроку
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
