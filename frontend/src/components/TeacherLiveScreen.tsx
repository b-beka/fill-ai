import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Mic, 
  Layers, 
  HelpCircle, 
  CheckCircle, 
  ShieldCheck, 
  FileSpreadsheet, 
  Video, 
  Presentation, 
  Check, 
  Download, 
  X,
  Volume2,
  Code,
  FileText,
  Image as ImageIcon,
  Play,
  Pause,
  AlertCircle,
  Users,
  CheckCheck,
  RotateCcw,
  BarChart3,
  Copy,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  ALL_TRACKS,
  CurriculumTrack,
  DEMO_SLIDES, 
  DEMO_TRANSCRIPT,
  DEMO_ANKI_TSV,
  DEMO_ATTENDANCE_REPORT
} from '../services/mockData';
import { NoteBlock, VisibilityMode } from '../types/lesson';

export type LiveDemoState = 'listen' | 'process' | 'question' | 'results' | 'attention';

interface TeacherLiveScreenProps {
  blocks?: NoteBlock[];
  onApproveBlock?: (blockId: string) => void;
}

export const TeacherLiveScreen: React.FC<TeacherLiveScreenProps> = () => {
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(ALL_TRACKS[0]);
  const [blocks, setBlocks] = useState<NoteBlock[]>(ALL_TRACKS[0].blocks);
  const [liveState, setLiveState] = useState<LiveDemoState>('listen');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('moderated');
  const [activeTab, setActiveTab] = useState<'notes' | 'slides'>('notes');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(42 * 60 + 15);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  
  const [showAnkiModal, setShowAnkiModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [sentCatchupIds, setSentCatchupIds] = useState<string[]>(['att-2']);
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);

  // Stand Interactive Demo & Speech Recognition (Fair Showcase)
  const [isLiveDemoRunning, setIsLiveDemoRunning] = useState(false);
  const [liveDemoNotification, setLiveDemoNotification] = useState<string | null>(null);
  const [demoLiveTranscript, setDemoLiveTranscript] = useState<string>('');
  const [isMicListening, setIsMicListening] = useState(false);
  const [micTranscript, setMicTranscript] = useState<string>('');
  const recognitionRef = React.useRef<any>(null);
  const demoTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  const stopLiveDemo = () => {
    demoTimersRef.current.forEach((t) => clearTimeout(t));
    demoTimersRef.current = [];
    setIsLiveDemoRunning(false);
    setLiveDemoNotification(null);
  };

  const startLiveDemo = () => {
    stopLiveDemo();
    setIsLiveDemoRunning(true);
    setIsTranscriptOpen(true);
    setLiveState('listen');
    setDemoLiveTranscript('«Итак, внимание на фосфолипидный бислой мембраны и ориентацию гидрофильных головок к водным средам...»');
    setLiveDemoNotification('Шаг 1 из 5: Soniox ASR транскрибирует живую речь преподавателя.');

    const t1 = setTimeout(() => {
      setLiveState('process');
      setDemoLiveTranscript('Gemini 3.5 Flash-Lite сопоставляет тезис со слайдом №2 и формирует медиа-фрейм...');
      setLiveDemoNotification('Шаг 2 из 5: VLM формирует структурированный конспект с визуальной привязкой.');
    }, 3500);

    const t2 = setTimeout(() => {
      const generatedBlock: NoteBlock = {
        id: 'block-live-demo-generated',
        lesson_id: currentTrack.lesson.id,
        position: blocks.length,
        t_start_ms: 42 * 60 * 1000,
        t_end_ms: 43 * 60 * 1000,
        title: 'Рецепторы и каскад передачи сигналов',
        body_md: 'Клеточная мембрана отделяет внутреннее пространство клетки от внешней среды благодаря ориентации полярных головок к водным фазам. При связывании лиганда рецептор активирует вторичные посредники.',
        status: 'pending_review',
        key_terms: [{ term: 'Вторичный посредник', definition: 'Внутриклеточная молекула передачи внешнего сигнала от мембранного рецептора.' }],
        media_artifact: {
          type: 'photo',
          title: 'Схема фосфолипидного бислоя',
          caption: 'Схема мембраны из презентации урока',
          align: 'right',
          badge: 'Слайд 2',
        },
        version: 1,
      };
      setBlocks((prev) => [generatedBlock, ...prev.filter((b) => b.id !== 'block-live-demo-generated')]);
      setLiveDemoNotification('Шаг 3 из 5: Новый блок появился в режиме «На проверке». Ученики увидят его после клика «Одобрить».');
    }, 7000);

    const t3 = setTimeout(() => {
      setLiveState('question');
      setDemoLiveTranscript('ИИ обнаружил проверочный вопрос в речи: запущен интерактивный микро-опрос аудитории.');
      setLiveDemoNotification('Шаг 4 из 5: Вопрос активирован hands-free! Ученики отвечают со своих устройств.');
    }, 11000);

    const t4 = setTimeout(() => {
      setLiveState('results');
      setDemoLiveTranscript('Опрос завершен. 28 из 30 учеников ответили (точность 78%). Gemini Flash-Lite сформировал диагностический комментарий.');
      setLiveDemoNotification('Шаг 5 из 5: Результаты агрегированы за 0ms, AI выдал диагностическую подсказку.');
    }, 15500);

    const t5 = setTimeout(() => {
      setLiveDemoNotification('Демо завершено! Нажмите «Аналитика» или «Anki TSV» для демонстрации полного цикла.');
      setIsLiveDemoRunning(false);
    }, 20500);

    demoTimersRef.current = [t1, t2, t3, t4, t5];
  };

  const toggleMicrophone = () => {
    if (isMicListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsMicListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API поддерживается в браузерах Google Chrome, Microsoft Edge и Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentTrack.lesson.language === 'en' ? 'en-US' : 'ru-RU';

      recognition.onstart = () => {
        setIsMicListening(true);
        setIsTranscriptOpen(true);
        setLiveState('listen');
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setMicTranscript(text);
      };

      recognition.onerror = () => {
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsMicListening(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      demoTimersRef.current.forEach((t) => clearTimeout(t));
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleTrackChange = (track: CurriculumTrack) => {
    stopLiveDemo();
    setCurrentTrack(track);
    setBlocks(track.blocks);
    setLiveState('listen');
  };

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

  const handleApproveAll = () => {
    setBlocks((prev) => prev.map((b) => ({ ...b, status: 'approved' })));
  };

  const downloadAnkiTsv = () => {
    const blob = new Blob([DEMO_ANKI_TSV], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson_${currentTrack.lesson.id}_anki.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendCatchup = (studentId: string) => {
    setSentCatchupIds((prev) => [...prev, studentId]);
  };

  const handleCopyWhatsApp = () => {
    const text = `ОТЧЕТ ПО УРОКУ: ${currentTrack.lesson.title.toUpperCase()}\n` +
      `Предмет: ${currentTrack.lesson.subject}\n` +
      `Присутствовало: ${DEMO_ATTENDANCE_REPORT.present_students_count} из ${DEMO_ATTENDANCE_REPORT.total_students_enrolled} учеников\n` +
      `Средний фокус внимания: ${Math.round(DEMO_ATTENDANCE_REPORT.average_focus_score * 100)}%\n` +
      `Успешность практических задач: ${Math.round(DEMO_ATTENDANCE_REPORT.total_tasks_accuracy * 100)}%\n` +
      `----------------------------------------\n` +
      DEMO_ATTENDANCE_REPORT.students.map((s, idx) => {
        const missed = s.missed_blocks.length > 0 
          ? `Пропущенные темы: ${s.missed_blocks.map(m => `${m.title} (${m.duration_str})`).join(', ')}`
          : 'Пропущенные темы: Все темы усвоены';
        const catchup = sentCatchupIds.includes(s.id) ? ' [Выжимка доставлена]' : '';
        return `${idx + 1}. ${s.student_name} — ${s.duration_minutes} мин (${s.presence_percentage}%), фокус ${Math.round(s.focus_score * 100)}%\n   ${missed}${catchup}\n   Задачи: ${s.tasks_correct}/${s.tasks_answered} верно\n   Итог: ${s.recommendation}`;
      }).join('\n\n') +
      `\n----------------------------------------\nСформировано автоматически платформой FILL AI.`;

    navigator.clipboard.writeText(text);
    setIsCopiedWhatsApp(true);
    setTimeout(() => setIsCopiedWhatsApp(false), 2500);
  };

  const approvedCount = blocks.filter((b) => b.status === 'approved').length;
  const pendingCount = blocks.filter((b) => b.status === 'pending_review').length;

  return (
    <div className="bg-fill-bg min-h-[calc(100vh-60px)] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-fill-surface border-b border-fill-border px-4 sm:px-8 py-3.5 flex items-center gap-4 flex-wrap">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <strong className="font-head font-bold text-[15px] text-fill-text leading-snug">
              {currentTrack.lesson.title}
            </strong>
            <span className="badge badge-blue text-xs font-bold">RU</span>
            <span className="badge badge-live text-xs">
              <span className="dot" />
              В эфире
            </span>
          </div>
          <span className="text-xs text-fill-text-faint">{currentTrack.lesson.subject} · {currentTrack.category}</span>
        </div>

        {/* Visibility Moderation Gate Badge */}
        <button
          onClick={() => setVisibilityMode((prev) => (prev === 'moderated' ? 'live' : 'moderated'))}
          className={`badge text-xs transition-colors cursor-pointer ${
            visibilityMode === 'moderated'
              ? 'bg-fill-warning-soft text-fill-warning border border-fill-warning/30'
              : 'bg-fill-blue-soft text-fill-blue-text'
          }`}
          title="Нажмите для переключения режима видимости конспекта для учеников"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          {visibilityMode === 'moderated' ? 'Премодерация конспекта' : 'Прямой эфир (без премодерации)'}
        </button>

        <div className="flex-1" />

        {/* Action Controls: Slides, Anki, Recording & Fair Demo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={isLiveDemoRunning ? stopLiveDemo : startLiveDemo}
            className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold transition-all shadow-sm ${
              isLiveDemoRunning
                ? 'bg-fill-danger text-white border-fill-danger animate-pulse'
                : 'bg-fill-green-deep text-white hover:opacity-90'
            }`}
            title="Запустить интерактивную демонстрацию для ярмарки (5 шагов: речь -> ИИ -> конспект -> опрос -> аналитика)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLiveDemoRunning ? 'Остановить демо' : 'Запустить живой демо-поток'}
          </button>

          <button
            onClick={toggleMicrophone}
            className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 transition-all ${
              isMicListening
                ? 'bg-fill-blue text-white animate-pulse font-bold'
                : 'btn-ghost'
            }`}
            title="Распознавание речи через Web Speech API прямо в браузере"
          >
            {isMicListening ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                Микрофон включен
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-fill-blue" />
                Микрофон (Web Speech)
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab((prev) => (prev === 'notes' ? 'slides' : 'notes'))}
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
          Стрим активен
        </span>
      </div>

      {/* Live Demo Step-by-Step Notification Banner */}
      {liveDemoNotification && (
        <div className="bg-fill-blue-soft border-b border-fill-blue/20 px-4 sm:px-8 py-2 text-xs text-fill-blue-text font-medium flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fill-blue flex-none" />
            <span>{liveDemoNotification}</span>
          </span>
          <button
            onClick={() => setLiveDemoNotification(null)}
            className="text-fill-text-faint hover:text-fill-text p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Curriculum Track Switcher & Status Bar */}
      <div className="bg-fill-surface-alt border-b border-fill-border px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Universal Subject Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-fill-text-faint uppercase mr-1 flex-none">
            Дисциплина:
          </span>
          {ALL_TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => handleTrackChange(track)}
              className={`text-xs font-semibold py-1 px-2.5 rounded-md transition-all whitespace-nowrap ${
                currentTrack.id === track.id
                  ? 'bg-fill-surface text-fill-text font-bold shadow-sm border border-fill-border'
                  : 'text-fill-text-muted hover:text-fill-text'
              }`}
            >
              {track.name.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Live State Simulation Controls */}
        <div className="flex items-center gap-1 bg-fill-surface p-1 rounded-full border border-fill-border overflow-x-auto">
          {(
            [
              ['listen', 'Слушает'],
              ['process', 'Обрабатывает'],
              ['question', 'Вопрос активен'],
              ['results', 'Результаты'],
              ['attention', 'Внимание'],
            ] as const
          ).map(([stateKey, label]) => (
            <button
              key={stateKey}
              onClick={() => setLiveState(stateKey)}
              aria-pressed={liveState === stateKey}
              className={`text-[11px] font-semibold py-1 px-2.5 rounded-full whitespace-nowrap transition-all ${
                liveState === stateKey
                  ? 'bg-fill-text text-fill-surface shadow-sm'
                  : 'text-fill-text-muted hover:text-fill-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Notes Stream or Slide Deck */}
      {activeTab === 'slides' ? (
        /* Slide Deck View */
        <div className="px-4 sm:px-8 py-5 flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-fill-text flex items-center gap-2">
                <Presentation className="w-4 h-4 text-fill-blue" />
                Слайды презентации (Materials Ingestion)
              </h2>
              <p className="text-xs text-fill-text-muted">
                Автоматически обработаны из PDF через PyMuPDF с извлечением ключевых понятий и генерацией pHash.
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
                  <span className="text-xs text-fill-text-faint font-mono">
                    pHash: {slide.phash.slice(0, 8)}…
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-fill-text-muted mb-3 leading-relaxed">
                    {slide.extracted_text}
                  </p>
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
        /* Main Grid: Editorial Notes & Live Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 px-4 sm:px-8 py-5 flex-1 items-start">
          {/* Left: Editorial Book-like Notes Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-fill-border pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-fill-text">
                  AI-конспект урока
                </h2>
                <span className="text-xs text-fill-text-faint">
                  {blocks.length} раздела ({approvedCount} одобрено)
                </span>
              </div>

              {/* Moderation Controls */}
              {visibilityMode === 'moderated' && pendingCount > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5"
                  title="Одобрить все ожидающие блоки одной кнопкой"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-fill-success" />
                  Одобрить все ({pendingCount})
                </button>
              )}
            </div>

            {/* Render Blocks in Editorial Side-by-Side Style */}
            {blocks.map((block, idx) => {
              const hasMedia = Boolean(block.media_artifact);
              const isMediaLeft = block.media_artifact?.align === 'left';

              return (
                <div
                  key={block.id}
                  className={`bg-fill-surface border rounded-xl p-5 sm:p-6 shadow-sm transition-all ${
                    block.status === 'pending_review'
                      ? 'border-fill-warning/60 bg-fill-warning-soft/10'
                      : 'border-fill-border'
                  }`}
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-fill-border/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-fill-text-faint">
                        #{idx + 1}
                      </span>
                      <h3 className="text-[16px] font-bold text-fill-text">
                        {block.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-fill-text-faint">
                        {Math.floor(block.t_start_ms / 60000)}:00
                      </span>

                      {/* Moderation Status */}
                      {visibilityMode === 'moderated' && (
                        block.status === 'pending_review' ? (
                          <span className="badge bg-fill-warning-soft text-fill-warning text-[11px] font-bold">
                            На проверке
                          </span>
                        ) : (
                          <span className="badge bg-fill-success-soft text-fill-success text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Одобрен
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Two-Column Editorial Grid for Media + Narrative */}
                  <div
                    className={`grid grid-cols-1 ${
                      hasMedia ? 'md:grid-cols-12' : ''
                    } gap-5 items-start`}
                  >
                    {/* Media Artifact Frame */}
                    {hasMedia && block.media_artifact && (
                      <div
                        className={`md:col-span-5 ${
                          isMediaLeft ? 'md:order-1' : 'md:order-2'
                        } border border-fill-border rounded-lg overflow-hidden bg-fill-surface-alt shadow-sm`}
                      >
                        {/* Frame Header */}
                        <div className="px-3 py-1.5 border-b border-fill-border flex items-center justify-between bg-fill-surface text-[11px] font-bold text-fill-text-muted">
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

                        {/* Frame Body */}
                        <div className="p-3 bg-fill-surface flex flex-col gap-2">
                          {/* Code Preview */}
                          {block.media_artifact.type === 'code' && block.media_artifact.code_snippet && (
                            <pre className="font-mono text-[11px] p-2.5 rounded bg-[#14171A] text-slate-100 overflow-x-auto leading-relaxed">
                              <code>{block.media_artifact.code_snippet}</code>
                            </pre>
                          )}

                          {/* Audio Player Preview */}
                          {block.media_artifact.type === 'audio' && (
                            <div className="p-2.5 rounded-md bg-fill-surface-alt border border-fill-border flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setIsPlayingAudio((prev) =>
                                      prev === block.id ? null : block.id
                                    )
                                  }
                                  className="w-6 h-6 rounded-full bg-fill-text text-fill-surface flex items-center justify-center text-xs"
                                >
                                  {isPlayingAudio === block.id ? (
                                    <Pause className="w-3 h-3 text-fill-surface" />
                                  ) : (
                                    <Play className="w-3 h-3 text-fill-surface ml-0.5" />
                                  )}
                                </button>
                                <span className="text-xs font-semibold text-fill-text">
                                  Аудио {block.media_artifact.audio_duration}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-fill-green-deep font-bold">
                                {isPlayingAudio === block.id ? 'Играет' : 'Слушать'}
                              </span>
                            </div>
                          )}

                          {/* Diagram / Slide Placeholder */}
                          {(block.media_artifact.type === 'slide' ||
                            block.media_artifact.type === 'diagram' ||
                            block.media_artifact.type === 'photo') && (
                            <div className="w-full h-28 rounded bg-fill-surface-alt border border-dashed border-fill-border flex flex-col items-center justify-center text-center p-2">
                              <span className="text-xs font-bold text-fill-text">
                                {block.media_artifact.title}
                              </span>
                              <span className="text-[10.5px] text-fill-text-faint mt-0.5">
                                Векторный слайд (Zero-Cost pHash)
                              </span>
                            </div>
                          )}

                          {/* Caption */}
                          <p className="text-[11px] text-fill-text-faint italic leading-snug border-t border-fill-border pt-1.5">
                            {block.media_artifact.caption}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Narrative Explanation Column */}
                    <div className={hasMedia ? 'md:col-span-7' : 'w-full'}>
                      <p className="text-sm text-fill-text leading-relaxed whitespace-pre-line">
                        {block.body_md}
                      </p>

                      {/* Genuine Callout (e.g. Faithfulness warning or key takeaway) */}
                      {block.callouts?.map((callout, cIdx) => (
                        <div
                          key={cIdx}
                          className="rounded-md p-3 mt-3 text-xs leading-relaxed bg-fill-surface-alt border border-fill-border text-fill-text-muted flex gap-2"
                        >
                          <AlertCircle className="w-3.5 h-3.5 flex-none mt-0.5 text-fill-blue" />
                          <span>
                            {callout.title && <b className="text-fill-text">{callout.title}: </b>}
                            {callout.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Moderation Action */}
                  {visibilityMode === 'moderated' && block.status === 'pending_review' && (
                    <div className="mt-4 pt-3 border-t border-fill-border flex items-center justify-between">
                      <span className="text-xs text-fill-text-faint">
                        Ученики увидят этот блок только после вашего подтверждения.
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
              );
            })}

            {/* Skeleton Block during 'process' state */}
            {liveState === 'process' && (
              <div className="bg-fill-surface border border-dashed border-fill-border rounded-xl p-5 sm:p-6">
                <div className="text-xs text-fill-text-faint flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-fill-blue animate-pulse" />
                  Gemini 3.6 Flash формирует новый блок конспекта…
                </div>
                <div className="sk-line" style={{ width: '55%' }} />
                <div className="sk-line" style={{ width: '88%' }} />
                <div className="sk-line" style={{ width: '70%' }} />
              </div>
            )}
          </div>

          {/* Right: Live Interactive Sidebar */}
          <div className="space-y-4">
            {/* Attention Alert Banner */}
            {liveState === 'attention' && (
              <div className="bg-fill-warning-soft border border-fill-warning-soft rounded-lg p-3.5 flex gap-2.5 text-xs text-fill-warning leading-snug">
                <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
                <span>Живые вопросы временно приостановлены. Конспект продолжает создаваться в штатном режиме.</span>
              </div>
            )}

            {/* AI Status Card */}
            <div className="bg-fill-surface border border-fill-border rounded-xl p-4 sm:p-5 shadow-sm">
              <h4 className="text-[11.5px] font-bold text-fill-text-faint uppercase tracking-wider mb-3">
                Статус AI-ассистента
              </h4>

              {liveState === 'listen' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Слушаю</strong>
                    <span className="text-xs text-fill-text-muted">Анализирую живую речь преподавателя</span>
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
                    <span className="text-xs text-fill-text-muted">Генерирую понятную заметку с медиа</span>
                  </div>
                </div>
              )}

              {liveState === 'question' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Вопрос активен</strong>
                    <span className="text-xs text-fill-text-muted">Ученики отправляют ответы</span>
                  </div>
                </div>
              )}

              {liveState === 'results' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-green-soft text-fill-green-deep flex items-center justify-center flex-none">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Результаты получены</strong>
                    <span className="text-xs text-fill-text-muted">Аналитика готова к разбору</span>
                  </div>
                </div>
              )}

              {liveState === 'attention' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-fill-warning-soft text-fill-warning flex items-center justify-center flex-none">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-fill-text">Нужно внимание</strong>
                    <span className="text-xs text-fill-text-muted">Проверьте соединение с микрофоном</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connected Students & Attendance Intelligence Card */}
            <div className="bg-fill-surface border border-fill-border rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
              <div 
                onClick={() => setShowAttendanceModal(true)}
                className="cursor-pointer group"
                title="Нажмите, чтобы открыть аналитику посещаемости и вовлечённости"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[11.5px] font-bold text-fill-text-faint uppercase tracking-wider group-hover:text-fill-green-deep transition-colors">
                    Ученики в аудитории
                  </h4>
                  <span className="text-[11px] text-fill-blue font-semibold flex items-center gap-1 group-hover:underline">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Аналитика
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-head font-extrabold text-2xl text-fill-text tabular-nums flex items-center gap-2">
                    <Users className="w-5 h-5 text-fill-green-deep" />
                    28 / 30
                  </span>
                  <span className="text-xs text-fill-green-deep font-medium bg-fill-green-soft px-2 py-0.5 rounded-full">
                    93% в эфире
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-fill-border flex items-center justify-between text-xs">
                <span className="text-fill-text-muted">Премодерация:</span>
                <span className="font-bold text-fill-text">
                  {approvedCount} из {blocks.length} одобрено
                </span>
              </div>
            </div>

            {/* Interactive Live Task Card (Sprint 3 / Hands-free Live Tasks) */}
            <div className="bg-fill-surface border border-fill-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-fill-green-deep">
                  {currentTrack.live_question.eyebrow}
                </div>
                <span className="badge badge-blue text-[10px]">
                  {liveState === 'question' ? 'Опрос идёт' : 'Завершён'}
                </span>
              </div>

              <h3 className="text-[14.5px] font-bold text-fill-text mb-3 leading-snug">
                {currentTrack.live_question.text}
              </h3>

              {/* Options & Response Distribution */}
              <div className="space-y-2.5">
                {currentTrack.live_question.options.map((opt) => (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={opt.is_correct ? 'text-fill-success font-bold flex items-center gap-1' : 'text-fill-text-muted'}>
                        {opt.id}. {opt.text}
                        {opt.is_correct && <Check className="w-3.5 h-3.5 inline text-fill-success" />}
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

              {/* Real-time Diagnostics Insight from Gemini Flash-Lite */}
              <div className="mt-4 p-3 rounded-lg bg-fill-blue-soft border border-fill-blue-soft text-xs text-fill-blue-text leading-relaxed">
                <div className="font-bold text-[11px] uppercase tracking-wider mb-1 text-fill-blue">
                  AI-аналитика ответов:
                </div>
                <div>{currentTrack.live_question.insight}</div>
              </div>

              {/* Action Buttons for Task */}
              <div className="mt-4 pt-3 border-t border-fill-border flex gap-2">
                <button
                  onClick={() => setLiveState((prev) => (prev === 'question' ? 'results' : 'question'))}
                  className="btn btn-secondary flex-1 text-xs py-1.5"
                >
                  {liveState === 'question' ? 'Остановить сбор' : 'Запустить опрос'}
                </button>
                <button
                  onClick={() => setLiveState('listen')}
                  className="btn btn-ghost text-xs py-1.5 px-2.5"
                  title="Сбросить состояние"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Collapsible Transcript Strip with Word Timestamps */}
      <div className="border-t border-fill-border bg-fill-surface px-4 sm:px-8 mt-auto">
        <div
          onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
          className="flex items-center justify-between py-3.5 cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-fill-text-faint">
            <Mic className="w-4 h-4" />
            Живой транскрипт урока (Soniox ASR)
          </div>
          <ChevronDown
            className={`w-4 h-4 text-fill-text-faint transition-transform duration-200 ${
              isTranscriptOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {isTranscriptOpen && (
          <div className="pb-4 text-[13.5px] text-fill-text-faint flex flex-col gap-2 max-w-3xl">
            {/* Live speech from mic or automated showcase */}
            {(micTranscript || demoLiveTranscript) && (
              <div className="p-3 rounded-lg bg-fill-surface-alt border border-fill-blue/30 flex flex-col gap-1 mb-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-fill-blue flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fill-blue animate-ping" />
                    {isMicListening ? 'Живой микрофон (Web Speech ASR)' : 'Демо-поток речи'}
                  </span>
                  <span className="text-fill-text-faint font-mono">Прямой эфир</span>
                </div>
                <p className="text-[13.5px] text-fill-text font-medium leading-relaxed">
                  {micTranscript || demoLiveTranscript}
                </p>
              </div>
            )}

            {DEMO_TRANSCRIPT.map((seg, i) => (
              <div key={seg.id || i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-[11px] text-fill-text-faint">
                  <span className="font-semibold text-fill-text">{seg.speaker || 'Учитель'}</span>
                  <span>[{(seg.start_ms / 1000).toFixed(1)}s – {(seg.end_ms / 1000).toFixed(1)}s]</span>
                </div>
                <span className={i === DEMO_TRANSCRIPT.length - 1 ? 'typing-cursor text-fill-text' : ''}>
                  {seg.words ? (
                    seg.words.map((w, wIdx) => (
                      <span
                        key={wIdx}
                        className="hover:text-fill-blue hover:underline cursor-pointer"
                        title={`${w.start_ms}ms`}
                      >
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

      {/* Anki Flashcards Export Modal */}
      {showAnkiModal && (
        <div className="fixed inset-0 bg-[#14171A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface border border-fill-border rounded-xl max-w-lg w-full p-6 shadow-xl relative">
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

            <div className="bg-fill-surface-alt rounded-lg p-3 max-h-48 overflow-auto mb-5 font-mono text-[11px] text-fill-text whitespace-pre border border-fill-border">
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
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать lesson_anki.tsv
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Recording Playback Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-[#14171A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface border border-fill-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
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

            <div className="aspect-video bg-fill-surface-alt rounded-lg border border-fill-border flex flex-col items-center justify-center p-4 text-center mb-5">
              <Video className="w-10 h-10 text-fill-text-faint mb-2" />
              <span className="text-xs font-semibold text-fill-text">
                LiveKit Room: room_{currentTrack.lesson.id.slice(0, 8)}
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

      {/* Semantic Attendance & Engagement Intelligence Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-[#14171A]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fill-surface border border-fill-border rounded-xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="absolute top-5 right-5 text-fill-text-faint hover:text-fill-text p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-fill-green-deep" />
                <h2 className="text-lg font-bold text-fill-text">
                  Смысловая посещаемость и пульс вовлечённости
                </h2>
              </div>
              <p className="text-xs text-fill-text-muted mt-1">
                Интеллектуальный учёт присутствия с привязкой к разделам конспекта, определение пропущенных тем и экспресс-рекапы без навязчивой слежки по веб-камере.
              </p>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto pr-1 space-y-6 flex-1">
              {/* 3 Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-fill-surface-alt border border-fill-border rounded-lg p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-fill-text-faint block mb-1">
                    Присутствие в эфире
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-fill-text tabular-nums">
                      {DEMO_ATTENDANCE_REPORT.present_students_count} / {DEMO_ATTENDANCE_REPORT.total_students_enrolled}
                    </span>
                    <span className="text-xs font-semibold text-fill-green-deep">
                      ({DEMO_ATTENDANCE_REPORT.average_presence_percent}%)
                    </span>
                  </div>
                  <span className="text-[11px] text-fill-text-faint mt-1 block">
                    В среднем 41.2 мин активного участия
                  </span>
                </div>

                <div className="bg-fill-surface-alt border border-fill-border rounded-lg p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-fill-text-faint block mb-1">
                    Фокус внимания
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-fill-text tabular-nums">
                      {Math.round(DEMO_ATTENDANCE_REPORT.average_focus_score * 100)}%
                    </span>
                    <span className="text-xs font-semibold text-fill-blue">
                      Высокий
                    </span>
                  </div>
                  <span className="text-[11px] text-fill-text-faint mt-1 block">
                    По активности вкладки и взаимодействию с конспектом
                  </span>
                </div>

                <div className="bg-fill-surface-alt border border-fill-border rounded-lg p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-fill-text-faint block mb-1">
                    Точность задач
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-fill-text tabular-nums">
                      {Math.round(DEMO_ATTENDANCE_REPORT.total_tasks_accuracy * 100)}%
                    </span>
                    <span className="text-xs font-semibold text-fill-success">
                      Успешно
                    </span>
                  </div>
                  <span className="text-[11px] text-fill-text-faint mt-1 block">
                    Hands-Free опросы преподавателя
                  </span>
                </div>
              </div>

              {/* Attention Timeline Pulse */}
              <div className="bg-fill-surface-alt border border-fill-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-fill-text uppercase tracking-wider">
                      Пульс внимания группы (Attention Timeline)
                    </h3>
                    <p className="text-[11px] text-fill-text-faint">
                      Динамика концентрации класса по 5-минутным интервалам урока
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-fill-text-faint">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-fill-green-deep" />
                      &gt;85% Фокус
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-fill-warning" />
                      &lt;75% Просадка
                    </span>
                  </div>
                </div>

                {/* Pulse Bars */}
                <div className="grid grid-cols-9 gap-2 items-end h-24 pt-2 border-b border-fill-border pb-2">
                  {DEMO_ATTENDANCE_REPORT.pulse.map((p) => {
                    const isWarning = p.attention_percent < 75;
                    return (
                      <div key={p.minute} className="flex flex-col items-center gap-1 group relative">
                        <div
                          className={`w-full rounded-t transition-all ${
                            isWarning ? 'bg-fill-warning/80 hover:bg-fill-warning' : 'bg-fill-green-deep hover:opacity-90'
                          }`}
                          style={{ height: `${p.attention_percent * 0.75}px` }}
                          title={`Минута ${p.minute}: ${p.attention_percent}% активного внимания (${p.active_students_count} учеников)`}
                        />
                        <span className="text-[10px] font-mono text-fill-text-faint">
                          {p.minute}м
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Students Semantic Attendance Table */}
              <div>
                <h3 className="text-xs font-bold text-fill-text uppercase tracking-wider mb-2.5">
                  Детализация по ученикам
                </h3>
                <div className="border border-fill-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-fill-surface-alt border-b border-fill-border text-fill-text-faint font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Ученик</th>
                          <th className="py-2.5 px-3">В эфире</th>
                          <th className="py-2.5 px-3">Фокус</th>
                          <th className="py-2.5 px-3">Темы конспекта</th>
                          <th className="py-2.5 px-3">Задачи</th>
                          <th className="py-2.5 px-3 text-right">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-fill-border">
                        {DEMO_ATTENDANCE_REPORT.students.map((s) => {
                          const hasMissed = s.missed_blocks.length > 0;
                          const isCatchupSent = sentCatchupIds.includes(s.id);

                          return (
                            <tr key={s.id} className="hover:bg-fill-surface-alt/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-fill-text">{s.student_name}</div>
                                <div className="text-[11px] text-fill-text-faint">
                                  {s.status === 'active' && <span className="text-fill-success font-medium">В сети</span>}
                                  {s.status === 'idle' && <span className="text-fill-warning font-medium">Вкладка в фоне</span>}
                                  {s.status === 'disconnected' && <span className="text-fill-danger font-medium">Отключен</span>}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <span className="font-bold text-fill-text">{s.duration_minutes}м</span>
                                <span className="text-fill-text-faint ml-1">({s.presence_percentage}%)</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-mono font-bold text-fill-text">
                                  {Math.round(s.focus_score * 100)}%
                                </span>
                              </td>
                              <td className="py-3 px-3 max-w-[220px]">
                                {hasMissed ? (
                                  <div className="space-y-1">
                                    {s.missed_blocks.map((mb, mIdx) => (
                                      <span
                                        key={mIdx}
                                        className="inline-block bg-fill-warning-soft text-fill-warning border border-fill-warning/30 rounded px-1.5 py-0.5 text-[10.5px] font-medium leading-tight mr-1"
                                      >
                                        Пропуск: {mb.title} ({mb.duration_str})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-fill-success font-medium text-[11px] flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Все темы усвоены
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <span className={s.tasks_correct > 0 ? 'text-fill-success font-bold' : 'text-fill-text-muted'}>
                                  {s.tasks_correct}
                                </span>
                                <span className="text-fill-text-faint">/{s.tasks_answered}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {hasMissed ? (
                                  isCatchupSent ? (
                                    <span className="badge bg-fill-success-soft text-fill-success text-[10.5px] font-bold">
                                      Рекап отправлен
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleSendCatchup(s.id)}
                                      className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                                      title="Сформировать и доставить 3-тезисную выжимку пропущенного материала"
                                    >
                                      <Send className="w-3 h-3" />
                                      Отправить выжимку
                                    </button>
                                  )
                                ) : (
                                  <span className="text-fill-text-faint text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-5 pt-4 border-t border-fill-border flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-fill-text-faint">
                Сформировано автоматически по таймкодам конспекта и микро-опросам FILL AI.
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopyWhatsApp}
                  className={`btn text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm transition-all ${
                    isCopiedWhatsApp
                      ? 'bg-fill-success text-white'
                      : 'btn-secondary'
                  }`}
                  title="Скопировать готовый текстовый отчет для отправки родителям или в чат группы"
                >
                  {isCopiedWhatsApp ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Скопировано в буфер!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Скопировать отчёт для WhatsApp / Telegram
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="btn btn-primary text-xs py-2 px-4"
                >
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
