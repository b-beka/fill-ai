import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Upload, 
  Users, 
  Check, 
  Copy, 
  ShieldCheck, 
  Maximize2, 
  FileText, 
  X,
  ArrowLeft
} from 'lucide-react';
import { ALL_TRACKS, CurriculumTrack } from '../services/mockData';
import { NoteBlock } from '../types/lesson';

interface TeacherLiveScreenProps {
  onBackToLanding?: () => void;
}

export const TeacherLiveScreen: React.FC<TeacherLiveScreenProps> = ({ onBackToLanding }) => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [blocks, setBlocks] = useState<NoteBlock[]>(ALL_TRACKS[0].blocks);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(42 * 60 + 15);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [quizAnswerCount, setQuizAnswerCount] = useState(26);
  const [uploadedPdfName, setUploadedPdfName] = useState('Биомембраны_Лекция_02.pdf');

  // Broadcast timer
  useEffect(() => {
    if (!isBroadcasting) return;
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isBroadcasting]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTrackChange = (track: CurriculumTrack) => {
    setCurrentTrack(track);
    setBlocks(track.blocks);
    setQuizAnswerCount(26);
    if (track.id.includes('python')) {
      setUploadedPdfName('Async_Python_FastAPI.pdf');
    } else if (track.id.includes('ielts')) {
      setUploadedPdfName('IELTS_Academic_Writing_Task2.pdf');
    } else {
      setUploadedPdfName('Биомембраны_Лекция_02.pdf');
    }
  };

  const handleTriggerQuiz = () => {
    setQuizAnswerCount(28);
  };

  const handleCopyReport = () => {
    const text = `Отчёт по уроку: ${currentTrack.lesson.title}\nПрисутствовали: 28/30 учеников\nСредняя концентрация: 94%\nВсе ключевые тезисы зафиксированы в FILL AI.`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="w-full bg-[#111318] text-white min-h-[calc(100vh-64px)] pb-16 font-body">
      
      {/* ========================================================================= */}
      {/* 1. TOP STUDIO CONTROL BAR: BROADCAST STATUS & DISCIPLINE SWITCHER          */}
      {/* ========================================================================= */}
      <div className="border-b border-white/10 bg-[#0d0f14] sticky top-[64px] z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
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

            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#2A46C7] text-white text-[11px] font-mono-tag font-bold">
              <span className="w-2 h-2 rounded-full bg-[#AEDB00] animate-pulse" />
              <span>СТУДИЯ ПРЕПОДАВАТЕЛЯ · В ЭФИРЕ</span>
            </div>

            <div>
              <h1 className="text-sm sm:text-base font-display font-bold text-white truncate max-w-sm sm:max-w-md">
                {currentTrack.lesson.title}
              </h1>
              <div className="text-[11px] text-white/50 flex items-center gap-2 font-mono-tag">
                <span>{currentTrack.category}</span>
                <span>•</span>
                <span className="text-[#AEDB00] font-bold">{formatTimer(timerSeconds)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Subject Selector */}
            <div className="flex items-center gap-1 bg-[#161a24] p-1 rounded-lg border border-white/10">
              {ALL_TRACKS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTrackChange(t)}
                  className={`text-xs font-medium py-1 px-2.5 rounded transition-all ${
                    currentTrack.id === t.id
                      ? 'bg-[#2A46C7] text-white font-semibold'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.name.split(':')[0]}
                </button>
              ))}
            </div>

            {/* Attendance & Focus */}
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="text-xs h-8 px-3 rounded-lg border border-white/15 bg-[#141822] hover:bg-[#1a2030] text-white flex items-center gap-1.5 transition-all font-medium"
            >
              <Users className="w-3.5 h-3.5 text-[#AEDB00]" />
              <span>Ученики: 28/30</span>
            </button>

            {/* Upload PDF */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-xs h-8 px-3 rounded-lg border border-white/15 bg-[#141822] hover:bg-[#1a2030] text-white flex items-center gap-1.5 transition-all font-medium"
            >
              <Upload className="w-3.5 h-3.5 text-white/70" />
              <span>Слайды PDF</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* ========================================================================= */}
        {/* 2. MAIN WORKSPACE: 16:9 MONITOR (LEFT) + INTERACTIVE QUIZ & FOCUS (RIGHT) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 16:9 STUDIO BROADCAST MONITOR */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            
            <div 
              className="relative w-full aspect-video rounded-xl bg-[#0a0c10] border border-white/15 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            >
              {/* Broadcast Screen Canvas: Live Presentation Stream */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d1017]">
                <div className="flex items-center gap-2 mb-2 font-mono-tag">
                  <span className="text-xs text-[#AEDB00] bg-black/60 px-2.5 py-1 rounded border border-white/10 font-bold">
                    Слайд 02/08 · {uploadedPdfName}
                  </span>
                  <span className="text-[10px] text-white/50 bg-black/60 px-2 py-1 rounded border border-white/10">
                    4500 kbps · 1080p 60fps
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-display font-bold text-white max-w-md">
                  {currentTrack.lesson.title}
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-sm">
                  Эфирный монитор лектора: презентация транслируется ученикам синхронно
                </p>
              </div>

              {/* PiP Camera Preview: Lecturer Video in Corner */}
              <div className="absolute top-4 right-4 z-10 w-32 sm:w-40 aspect-video rounded-lg bg-black/90 border border-white/20 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[9px] font-mono-tag text-[#AEDB00] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#AEDB00] animate-pulse" />
                    КАМЕРА ПРЕПОДАВАТЕЛЯ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#2A46C7] text-[10px] font-bold text-white flex items-center justify-center font-mono-tag">
                    ПР
                  </div>
                  <div className="text-[11px] font-medium text-white truncate">
                    Вы в эфире
                  </div>
                </div>
                {/* Audio Wave Indicator */}
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-1 rounded-full ${isMicOn ? 'bg-[#AEDB00] animate-pulse' : 'bg-white/20'}`} />
                  <div className={`h-3 w-1 rounded-full ${isMicOn ? 'bg-[#AEDB00] animate-pulse' : 'bg-white/20'}`} />
                  <div className={`h-2 w-1 rounded-full ${isMicOn ? 'bg-[#AEDB00] animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-[9px] text-white/40 ml-1 font-mono-tag">
                    {isMicOn ? 'Речь захватывается' : 'Микрофон заглушен'}
                  </span>
                </div>
              </div>

              {/* Bottom Studio Controls Bar */}
              <div className="relative z-10 p-3.5 bg-[#080a0e]/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
                
                <div className="flex items-center gap-2.5">
                  {/* Broadcast Play/Pause */}
                  <button
                    onClick={() => setIsBroadcasting((b) => !b)}
                    className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                      isBroadcasting
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-[#2A46C7] hover:bg-[#3453e0] text-white'
                    }`}
                  >
                    {isBroadcasting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isBroadcasting ? 'Остановить эфир' : 'Возобновить эфир'}</span>
                  </button>

                  {/* Mic Toggle */}
                  <button
                    onClick={() => setIsMicOn((m) => !m)}
                    className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-colors ${
                      isMicOn
                        ? 'border-[#AEDB00]/40 bg-[#AEDB00]/10 text-[#AEDB00]'
                        : 'border-white/15 bg-white/5 text-white/50'
                    }`}
                  >
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isMicOn ? 'Микрофон ВКЛ' : 'Микрофон ВЫКЛ'}</span>
                  </button>

                  {/* Upload Slides Trigger */}
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="h-8 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-white/60" />
                    <span>Слайды</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono-tag text-[11px] text-white/60">
                    28 учеников онлайн
                  </span>
                  <button className="text-white/60 hover:text-white p-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Broadcast Details Strip */}
            <div className="p-3 rounded-lg bg-[#0e1118] border border-white/10 flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-2 font-mono-tag">
                <span className="text-[#AEDB00] font-medium">Файл презентации:</span>
                <span className="text-white font-medium">{uploadedPdfName}</span>
              </div>
              <span className="text-[#AEDB00] font-mono-tag">Авто-генерация заметок активна</span>
            </div>

          </div>

          {/* RIGHT: LIVE QUIZ PUSHER & ATTENDANCE CONSOLE */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-[135px]">
            
            {/* Live Class Quiz Card */}
            <div className="rounded-xl bg-[#141822] border border-white/15 p-5 shadow-xl flex flex-col gap-3.5">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="tag-acid-green text-[10px]">
                  ОПРОС В ЭФИРЕ
                </span>
                <span className="text-xs font-mono-tag text-[#AEDB00] font-bold">
                  {quizAnswerCount}/28 ответов
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono-tag text-white/40 uppercase block mb-1">
                  Активный вопрос студентам:
                </span>
                <h4 className="text-sm font-display font-bold text-white leading-snug">
                  {currentTrack.live_question.text}
                </h4>
              </div>

              {/* Real-time Response Distribution Bars */}
              <div className="space-y-2">
                {currentTrack.live_question.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      opt.is_correct
                        ? 'border-[#AEDB00]/50 bg-[#AEDB00]/10 text-white font-semibold'
                        : 'border-white/10 bg-[#0e1118] text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tag font-bold text-white/50">{opt.id}.</span>
                      <span className="truncate max-w-[170px]">{opt.text}</span>
                    </div>
                    <span className="font-mono-tag text-[11px] text-[#AEDB00] font-bold">
                      {opt.is_correct ? '78%' : '7%'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Primary 1-Click Action to Trigger / Next Question */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleTriggerQuiz}
                  className="btn-brand-blue text-xs h-9 flex-1 flex items-center justify-center gap-1.5 font-semibold"
                >
                  <Play className="w-3 h-3 text-white fill-white" />
                  <span>Следующий вопрос классу</span>
                </button>
              </div>

            </div>

            {/* Attendance & Focus Summary */}
            <div className="rounded-xl bg-[#141822] border border-white/15 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-medium text-white flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#AEDB00]" />
                  <span>Вовлеченность аудитории</span>
                </span>
                <span className="text-xs font-mono-tag text-[#AEDB00] font-bold">
                  94% фокус
                </span>
              </div>

              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#AEDB00] h-full rounded-full w-[94%]" />
              </div>

              <button
                onClick={handleCopyReport}
                className="btn-outline text-xs h-8 w-full flex items-center justify-center gap-1.5 mt-1"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#AEDB00]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Отчёт скопирован!' : 'Скопировать отчёт для WhatsApp'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. SYNCED LECTURE NOTES UNDERNEATH MONITOR                                */}
        {/* ========================================================================= */}
        <section className="mt-12 pt-8 border-t border-white/10">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-xl font-display font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A46C7]" />
                <span>Живой конспект лекции (Синхронизирован с речью лектора)</span>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                ИИ автоматически конструирует блоки по ходу объяснения и передает их ученикам
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#AEDB00] font-mono-tag">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Авто-синтез активен</span>
            </div>
          </div>

          <div className="space-y-4">
            {blocks.map((block, idx) => (
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
                  {block.media_artifact && (
                    <div className="sm:col-span-4 rounded-lg bg-[#0e1118] border border-white/10 p-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono-tag text-white/40 uppercase">
                        Слайд #{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-white truncate">
                        {block.media_artifact.title}
                      </span>
                    </div>
                  )}

                  <p className={`text-xs sm:text-sm text-white/80 leading-relaxed font-normal ${block.media_artifact ? 'sm:col-span-8' : 'sm:col-span-12'}`}>
                    {block.body_md}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </section>

      </div>

      {/* PDF Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0a0c10] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-bold flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#AEDB00]" />
                <span>Загрузка слайдов (PDF)</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
              <Upload className="w-6 h-6 text-[#AEDB00]" />
              <span className="text-xs font-medium text-white">
                Перетащите PDF файл презентации сюда
              </span>
              <span className="text-[11px] text-white/40">
                PyMuPDF извлечёт слайды и синхронизирует с речью
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono-tag text-white/40 uppercase">
                Или выберите готовую тему:
              </span>
              <button
                onClick={() => {
                  setUploadedPdfName('Биомембраны_Лекция_02.pdf');
                  setShowUploadModal(false);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-[#141822] border border-white/10 hover:border-white/30 text-white/80 transition-colors text-xs"
              >
                Биомембраны_Лекция_02.pdf (8 слайдов)
              </button>
              <button
                onClick={() => {
                  setUploadedPdfName('Async_Python_FastAPI.pdf');
                  setShowUploadModal(false);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-[#141822] border border-white/10 hover:border-white/30 text-white/80 transition-colors text-xs"
              >
                Async_Python_FastAPI.pdf (6 слайдов)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0a0c10] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-bold">Журнал присутствия (28/30)</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs font-mono-tag">
              <div className="p-2.5 rounded-lg bg-[#141822] flex items-center justify-between">
                <span className="text-white">Алихан Смагулов</span>
                <span className="text-[#AEDB00]">В сети (96% фокус)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141822] flex items-center justify-between">
                <span className="text-white">Айгерим Нурланова</span>
                <span className="text-[#AEDB00]">В сети (92% фокус)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141822] flex items-center justify-between">
                <span className="text-white">Ернар Маратов</span>
                <span className="text-amber-400">Пропуск 1 темы (Выжимка отправлена)</span>
              </div>
            </div>
            <button onClick={() => setShowAttendanceModal(false)} className="btn-solid text-xs h-8 w-full font-semibold">
              Закрыть
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
