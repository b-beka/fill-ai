import React, { useState } from 'react';
import confetti from 'canvas-confetti';
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
  FileText,
  X,
  ArrowLeft
} from 'lucide-react';
import { ALL_TRACKS } from '../services/mockData';

interface StudentScreenProps {
  onBackToLanding?: () => void;
}

export const StudentScreen: React.FC<StudentScreenProps> = ({ onBackToLanding }) => {
  const [currentTrack] = useState(ALL_TRACKS[0]);
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

  const handleSelectOption = (id: string, isCorrect: boolean) => {
    setSelectedOptionId(id);
    setIsAnswered(true);
    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
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
    <div className="w-full bg-[#111318] text-white min-h-[calc(100vh-64px)] pb-16 font-body">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: STREAM TITLE, DISCIPLINE & CATCHUP BUTTON                  */}
      {/* ========================================================================= */}
      <div className="border-b border-white/10 bg-[#0d0f14] sticky top-[64px] z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="На главную"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2A46C7] text-[11px] font-mono-tag text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-[#AEDB00] animate-pulse" />
              <span>LIVE ЭФИР</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-display font-bold text-white truncate max-w-sm sm:max-w-md">
                {currentTrack.lesson.title}
              </h1>
              <span className="text-[11px] text-white/50 font-mono-tag">
                {currentTrack.category} · 28 студентов в аудитории
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">


            {/* Simple Catch-up button */}
            <button
              onClick={() => setShowCatchupModal(true)}
              className="text-xs h-8 px-3 rounded-lg border border-[#AEDB00]/40 bg-[#AEDB00]/10 hover:bg-[#AEDB00]/20 text-[#AEDB00] flex items-center gap-1.5 transition-all font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Что я пропустил?</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* ========================================================================= */}
        {/* 2. YOUTUBE CINEMA (LEFT 65%) + INTERACTIVE QUIZ & FAST Q (RIGHT 35%)     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 16:9 VIDEO PLAYER */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div 
              className="relative w-full aspect-video rounded-xl bg-[#0a0c10] border border-white/15 overflow-hidden shadow-2xl flex flex-col justify-between"
              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            >
              {/* Video Simulated Slide Canvas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d1017]">
                <div className="text-xs font-mono-tag text-[#AEDB00] mb-2 font-bold">
                  Слайд #02 · Синхронизация активна
                </div>
                <h3 className="text-lg sm:text-2xl font-display font-bold text-white max-w-md">
                  {currentTrack.lesson.title}
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-sm">
                  Трансляция материала лектора в высоком разрешении 1080p
                </p>
              </div>

              {/* PiP Teacher Corner */}
              <div className="absolute top-4 right-4 z-10 w-28 sm:w-36 aspect-video rounded-lg bg-black/90 border border-white/20 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[9px] font-mono-tag text-[#AEDB00] font-bold">
                  <span>КАМЕРА</span>
                  <span>1080p</span>
                </div>
                <div className="text-[11px] font-medium text-white truncate">
                  Лектор в эфире
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="relative z-10 p-3 bg-[#080a0e]/95 border-t border-white/10 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsVideoPlaying((p) => !p)}
                    className="hover:text-[#AEDB00] transition-colors"
                  >
                    {isVideoPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className="hover:text-[#AEDB00] transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono-tag text-[11px] text-white/60">42:15 / 60:00</span>
                </div>

                <div className="flex items-center gap-2 font-mono-tag">
                  <span className="text-[10px] text-[#AEDB00] font-bold">HD 1080p</span>
                  <button className="hover:text-white text-white/70">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Subtitle Strip */}
            <div className="p-3 rounded-lg bg-[#0e1118] border border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>Лектор: <strong className="text-white font-medium">Д-р Аскар Ибраев</strong></span>
              <span className="text-[#AEDB00] font-mono-tag font-medium">Авто-конспект включен</span>
            </div>
          </div>

          {/* RIGHT: QUIZ & FAST QUESTION (Simple, Clear, No Clutter) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-[135px]">
            
            {/* Live Question Card */}
            <div className="rounded-xl bg-[#141822] border border-white/15 p-5 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="tag-acid-green text-[10px]">
                  ВОПРОС ОТ УЧИТЕЛЯ
                </span>
                <span className="text-xs font-mono-tag text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#AEDB00]" />
                  00:24
                </span>
              </div>

              <h4 className="text-sm font-display font-bold text-white leading-snug">
                {currentTrack.live_question.text}
              </h4>

              {/* Options */}
              <div className="space-y-2">
                {currentTrack.live_question.options.map((opt) => {
                  const isChosen = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id, opt.is_correct)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all flex items-start gap-2.5 ${
                        isChosen
                          ? opt.is_correct
                            ? 'border-[#AEDB00] bg-[#AEDB00]/15 text-white'
                            : 'border-amber-500 bg-amber-950/40 text-white'
                          : isAnswered && opt.is_correct
                          ? 'border-[#AEDB00]/60 bg-[#AEDB00]/10 text-white'
                          : 'border-white/10 bg-[#0e1118] hover:border-white/30 text-white/80'
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
                  className={`p-3 rounded-lg border text-xs leading-relaxed animate-fadeIn ${
                    currentOption.is_correct
                      ? 'bg-[#AEDB00]/10 border-[#AEDB00]/40 text-white'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5 font-display">
                    {currentOption.is_correct ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#AEDB00]" />
                        <span className="text-[#AEDB00]">Верно!</span>
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
            <div className="rounded-xl bg-[#141822] border border-white/15 p-4 flex flex-col gap-2.5">
              <span className="text-xs font-display font-medium text-white/80">
                Задать быстрый вопрос лектору:
              </span>
              <form onSubmit={handleSendQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Напишите вопрос..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  className="flex-1 bg-[#0e1118] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7]"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim()}
                  className="btn-brand-blue text-xs h-8 px-3 disabled:opacity-40"
                >
                  <Send className="w-3 h-3 text-white" />
                </button>
              </form>

              {studentQuestions.length > 0 && (
                <div className="text-[11px] text-[#AEDB00] font-mono-tag">
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
              <h2 className="text-base sm:text-xl font-display font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A46C7]" />
                <span>Конспект урока в реальном времени</span>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Ключевые мысли, формулы и слайды появляются синхронно с речью преподавателя
              </p>
            </div>
            <span className="text-xs font-mono-tag text-[#AEDB00] font-semibold">
              {visibleBlocks.length} раздела
            </span>
          </div>

          <div className="space-y-4">
            {visibleBlocks.map((block, idx) => (
              <div
                key={block.id}
                className="p-5 sm:p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[#2A46C7] font-mono-tag text-[11px] font-bold text-white flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-display font-bold text-white">
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
                    <div className="sm:col-span-4 rounded-lg bg-[#0e1118] border border-white/10 p-3 flex flex-col gap-2">
                      <div className="text-[10px] font-mono-tag text-white/40 uppercase">
                        Материал к разделу
                      </div>
                      <div className="text-xs font-medium text-white">
                        {block.media_artifact.title}
                      </div>
                      {block.media_artifact.type === 'audio' && (
                        <button
                          onClick={() => setIsPlayingAudio((p) => (p === block.id ? null : block.id))}
                          className="mt-1 text-xs py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-between transition-colors font-medium"
                        >
                          <span>{isPlayingAudio === block.id ? 'Пауза' : 'Слушать цитату'}</span>
                          <span className="font-mono-tag text-[10px] text-[#AEDB00]">
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
              <h3 className="text-base font-display font-bold">Выжимка пропущенного</h3>
              <button onClick={() => setShowCatchupModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              FILL AI зафиксировал время вашего подключения и собрал главное в 2 тезиса:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#141822] border border-white/10">
                <strong className="text-white block mb-0.5">1. Фосфолипидный бислой:</strong>
                <span className="text-white/70">Гидрофильные головки снаружи, гидрофобные хвосты внутри.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-white/10">
                <strong className="text-white block mb-0.5">2. Активный транспорт:</strong>
                <span className="text-white/70">Идёт против градиента концентрации с расходом энергии АТФ.</span>
              </div>
            </div>
            <button onClick={() => setShowCatchupModal(false)} className="btn-brand-blue text-xs h-8 w-full mt-2 font-semibold">
              Вернуться к уроку
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
