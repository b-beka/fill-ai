import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Users, 
  Check, 
  Copy, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  X
} from 'lucide-react';
import { ALL_TRACKS, CurriculumTrack } from '../services/mockData';
import { NoteBlock } from '../types/lesson';

export const TeacherLiveScreen: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [blocks, setBlocks] = useState<NoteBlock[]>(ALL_TRACKS[0].blocks);
  const [isMicOn, setIsMicOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'slides'>('notes');
  const [showAttendance, setShowAttendance] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(42 * 60 + 15);
  const [isCopied, setIsCopied] = useState(false);

  // Live Quiz State
  const [isQuizActive, setIsQuizActive] = useState(true);
  const [quizAnswerCount, setQuizAnswerCount] = useState(26);

  // Timer tick
  useEffect(() => {
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTrackChange = (track: CurriculumTrack) => {
    setCurrentTrack(track);
    setBlocks(track.blocks);
    setQuizAnswerCount(26);
  };

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const handleTriggerQuestion = () => {
    setIsQuizActive(true);
    setQuizAnswerCount(28);
  };

  const handleCopyReport = () => {
    const text = `Отчёт по уроку: ${currentTrack.lesson.title}\nПрисутствовали: 28/30 учеников\nСредний фокус: 94%\nВсе ключевые темы усвоены. Конспект сформирован в FILL AI.`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="w-full bg-[#000000] text-white min-h-[calc(100vh-64px)] pb-16 flex flex-col font-body">
      
      {/* ========================================================================= */}
      {/* 1. TOP STUDIO BAR: STATUS, TIMER & ESSENTIAL ACTION BUTTONS               */}
      {/* ========================================================================= */}
      <div className="border-b border-white/10 bg-[#080a0d] sticky top-[64px] z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Stream Info & Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-500/40 text-[11px] font-mono-tag text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>В ЭФИРЕ</span>
            </div>

            <div>
              <h1 className="text-sm sm:text-base font-display font-medium text-white truncate max-w-sm sm:max-w-md">
                {currentTrack.lesson.title}
              </h1>
              <div className="text-[11px] text-white/50 flex items-center gap-2">
                <span>{currentTrack.category}</span>
                <span>•</span>
                <span className="font-mono-tag text-white/70">{formatTimer(timerSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Right: Only the 4 essential buttons (No clutter!) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Subject Selector */}
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

            {/* 1. Microphone Button */}
            <button
              onClick={toggleMic}
              className={`text-xs h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
                isMicOn
                  ? 'bg-emerald-500 text-black border-emerald-400 font-semibold'
                  : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
              }`}
              title="Включить или выключить распознавание речи"
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-white/40" />}
              <span>{isMicOn ? 'Микрофон ВКЛ' : 'Микрофон'}</span>
            </button>

            {/* 2. Slides / PDF Upload Button */}
            <button
              onClick={() => setActiveTab((t) => (t === 'notes' ? 'slides' : 'notes'))}
              className={`text-xs h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
                activeTab === 'slides'
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Слайды PDF</span>
            </button>

            {/* 3. Students Attendance Button */}
            <button
              onClick={() => setShowAttendance((v) => !v)}
              className="text-xs h-8 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 flex items-center gap-1.5 font-medium transition-all"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ученики (28/30)</span>
            </button>

            {/* 4. Trigger Live Question (Primary Orange CTA) */}
            <button
              onClick={handleTriggerQuestion}
              className="btn-liquid-solid text-xs h-8 px-3.5 flex items-center gap-1.5 font-semibold"
              title="Запустить экспресс-опрос для всего класса"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Задать вопрос классу</span>
            </button>

          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 flex-1 w-full">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PDF SLIDES UPLOADER (If Slides tab active)                        */}
        {/* ========================================================================= */}
        {activeTab === 'slides' ? (
          <div className="rounded-2xl bg-[#090b0e] border border-white/15 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-medium text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Слайды презентации к уроку</span>
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  FILL AI автоматически привязывает кадры из PDF к конспекту и речи учителя
                </p>
              </div>
              <button
                onClick={() => setActiveTab('notes')}
                className="text-xs text-white/60 hover:text-white underline"
              >
                Вернуться к конспекту →
              </button>
            </div>

            {/* Simple Drag & Drop Area */}
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
              <Upload className="w-8 h-8 text-sky-400" />
              <div>
                <span className="text-sm font-medium text-white block">
                  Перетащите PDF файл презентации сюда
                </span>
                <span className="text-xs text-white/50">
                  или выберите готовую тему урока:
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setActiveTab('notes')}
                  className="composer-chip active text-xs"
                >
                  Биомембраны.pdf (8 слайдов)
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="composer-chip text-xs"
                >
                  Python_Async.pdf (6 слайдов)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: CLEAN 2-COLUMN STUDIO (AI Live Notes + Active Question/Activity) */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: LIVE NOTES STREAM (Col 1..8) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm sm:text-base font-display font-medium text-white">
                    Живой конспект урока
                  </h2>
                  <span className="text-xs font-mono-tag text-white/50">
                    ({blocks.length} темы)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tag">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Авто-одобрено для учеников</span>
                </div>
              </div>

              {/* Note Cards List */}
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className="p-5 rounded-xl bg-[#090b0e] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-white/10 font-mono-tag text-[11px] font-bold text-white flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-display font-medium text-white">
                          {block.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono-tag text-white/40">
                        {Math.floor(block.t_start_ms / 60000)}:00
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      {/* Media artifact preview */}
                      {block.media_artifact && (
                        <div className="sm:col-span-4 rounded-lg bg-[#12151b] border border-white/10 p-2.5 text-center text-xs">
                          <span className="font-mono-tag text-[10px] text-white/40 uppercase block mb-1">
                            Слайд #{idx + 1}
                          </span>
                          <span className="font-medium text-white/90 block truncate">
                            {block.media_artifact.title}
                          </span>
                        </div>
                      )}

                      {/* Text */}
                      <p className={`text-xs sm:text-sm text-white/80 leading-relaxed ${block.media_artifact ? 'sm:col-span-8' : 'sm:col-span-12'}`}>
                        {block.body_md}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* RIGHT: LIVE QUIZ & ENGAGEMENT (Col 9..12) */}
            <div className="lg:col-span-4 flex flex-col gap-5 sticky top-[130px]">
              
              {/* Active Live Question Card */}
              {isQuizActive && (
                <div className="rounded-2xl bg-[#0a0c10] border border-white/15 p-5 shadow-xl flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="echoid-tag text-[10px]">
                      ОПРОС КЛАССА
                    </span>
                    <span className="text-xs font-mono-tag text-emerald-400">
                      {quizAnswerCount}/28 ответили
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono-tag text-white/40 uppercase mb-1">
                      Вопрос в эфире:
                    </h4>
                    <p className="text-sm font-display font-medium text-white leading-snug">
                      {currentTrack.live_question.text}
                    </p>
                  </div>

                  {/* Response Distribution */}
                  <div className="space-y-2">
                    {currentTrack.live_question.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          opt.is_correct
                            ? 'border-emerald-500/40 bg-emerald-950/20 text-white'
                            : 'border-white/10 bg-[#12141a] text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tag font-bold text-white/60">{opt.id}.</span>
                          <span className="truncate max-w-[180px]">{opt.text}</span>
                        </div>
                        <span className="font-mono-tag text-[11px] text-emerald-400 font-medium">
                          {opt.is_correct ? '78%' : '7%'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleTriggerQuestion}
                      className="btn-liquid-solid text-xs h-8 flex-1"
                    >
                      Следующий вопрос
                    </button>
                  </div>

                </div>
              )}

              {/* Attendance & Class Focus Widget */}
              <div className="rounded-2xl bg-[#0a0c10] border border-white/15 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-medium text-white flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Присутствие класса</span>
                  </span>
                  <span className="text-xs font-mono-tag text-emerald-400 font-bold">
                    28 / 30
                  </span>
                </div>

                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full w-[93%]" />
                </div>

                <p className="text-[11px] text-white/50 leading-snug">
                  94% учеников активно взаимодействуют с конспектом. 2 ученика имеют пропуски.
                </p>

                <button
                  onClick={handleCopyReport}
                  className="btn-liquid-ghost text-xs h-8 w-full flex items-center justify-center gap-1.5 mt-1"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Отчёт скопирован!' : 'Скопировать отчёт для WhatsApp'}</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Attendance Modal (Clean & Simple) */}
      {showAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0a0c10] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-medium">Журнал присутствия (28/30)</h3>
              <button onClick={() => setShowAttendance(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                <span>Алихан Смагулов</span>
                <span className="text-emerald-400 font-mono-tag">В сети (96% фокус)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                <span>Айгерим Нурланова</span>
                <span className="text-emerald-400 font-mono-tag">В сети (92% фокус)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                <span>Ернар Маратов</span>
                <span className="text-amber-400 font-mono-tag">Пропуск 1 темы (Выжимка отправлена)</span>
              </div>
            </div>
            <button onClick={() => setShowAttendance(false)} className="btn-liquid-solid text-xs h-8 w-full">
              Закрыть
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
