import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Play, 
  Square, 
  Download, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Upload,
  Presentation
} from 'lucide-react';
import { api } from '../services/api';
import { Lesson, Slide } from '../types/lesson';

interface LessonsManagerProps {
  onBackendStatusChange?: (online: boolean) => void;
}

export const LessonsManager: React.FC<LessonsManagerProps> = ({ onBackendStatusChange }) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [readinessChecks, setReadinessChecks] = useState<Record<string, string>>({});
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exportContent, setExportContent] = useState<{ format: string; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('Введение в генетику');
  const [subject, setSubject] = useState('Биология (10 класс)');
  const [language, setLanguage] = useState<'ru' | 'kk' | 'en'>('ru');
  const [source, setSource] = useState<'live' | 'upload'>('live');
  const [visibilityMode, setVisibilityMode] = useState<'live' | 'moderated'>('moderated');
  const [expectedTerms, setExpectedTerms] = useState('ДНК, ген, аллель, фенотип, генотип');

  // Materials upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedSlides, setUploadedSlides] = useState<Slide[]>([]);

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const res = await api.checkReadiness();
      setBackendStatus('online');
      setReadinessChecks(res.checks || {});
      onBackendStatusChange?.(true);
      try {
        const loaded = await api.listLessons();
        if (loaded && loaded.length > 0) {
          setLessons(loaded);
        }
      } catch {
        // silent fallback
      }
    } catch {
      setBackendStatus('offline');
      onBackendStatusChange?.(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const terms = expectedTerms.split(',').map((t) => t.trim()).filter(Boolean);
      const newLesson = await api.createLesson({
        title,
        subject,
        language,
        source,
        visibility_mode: visibilityMode,
        expected_terms: terms,
      });
      setLessons((prev) => [newLesson, ...prev]);
      setSuccessMsg(`Урок «${newLesson.title}» успешно создан! Режим: ${visibilityMode === 'moderated' ? 'Премодерация' : 'Прямой'}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка создания урока. Проверьте подключение к бэкенду.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async (lessonId: string) => {
    try {
      await api.startLesson(lessonId);
      const updated = await api.getLesson(lessonId);
      setLessons((prev) => prev.map((l) => (l.id === lessonId ? updated : l)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось запустить урок');
    }
  };

  const handleEndLesson = async (lessonId: string) => {
    try {
      await api.endLesson(lessonId);
      const updated = await api.getLesson(lessonId);
      setLessons((prev) => prev.map((l) => (l.id === lessonId ? updated : l)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось завершить урок');
    }
  };

  const handleExport = async (lessonId: string, format: 'md' | 'anki' = 'md') => {
    try {
      const res = await api.exportLesson(lessonId, format);
      setExportContent({ format, text: res });
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось экспортировать конспект');
    }
  };

  const handleUploadMaterials = async (lessonId: string) => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const slides = await api.uploadMaterials(lessonId, selectedFile);
      setUploadedSlides(slides);
      setSuccessMsg(`Презентация обработана: извлечено ${slides.length} слайдов и термины!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки материалов презентации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8">
      {/* Backend Connection Status Banner */}
      <div className="bg-fill-surface border border-fill-border rounded-lg p-5 sm:p-6 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center ${
                backendStatus === 'online'
                  ? 'bg-fill-success-soft text-fill-success'
                  : 'bg-fill-warning-soft text-fill-warning'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-fill-text">
                  FastAPI Backend (localhost:8000)
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    backendStatus === 'online'
                      ? 'bg-fill-success text-white'
                      : 'bg-fill-warning text-white'
                  }`}
                >
                  {backendStatus === 'online' ? 'В сети' : 'Недоступен'}
                </span>
              </div>
              <p className="text-xs text-fill-text-muted mt-0.5">
                {backendStatus === 'online'
                  ? `БД: ${readinessChecks.db || 'ok'} · Redis: ${readinessChecks.redis || 'ok'} · S3: ${readinessChecks.s3 || 'ok'}`
                  : 'Запустите бэкенд через Docker Compose (docker compose up -d) для реальной связи.'}
              </p>
            </div>
          </div>

          <button
            onClick={checkBackend}
            className="btn btn-ghost text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Проверить связь
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-fill-danger-soft border border-fill-danger-soft text-fill-danger rounded-md p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-none mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-fill-success-soft border border-fill-success-soft text-fill-success rounded-md p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 flex-none mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Create Lesson & Lessons List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
        {/* Form: Create Lesson */}
        <div className="bg-fill-surface border border-fill-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-fill-text mb-1 flex items-center gap-2">
            <Plus className="w-5 h-5 text-fill-green-deep" />
            Создать новый урок в API
          </h3>
          <p className="text-xs text-fill-text-muted mb-5">
            Отправляет запрос <code>POST /v1/lessons</code> на бэкенд с поддержкой премодерации.
          </p>

          <form onSubmit={handleCreateLesson} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-fill-text mb-1">Название урока</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-fill-border bg-fill-bg text-fill-text focus:outline-none focus:border-fill-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-fill-text mb-1">Предмет / Класс</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-fill-border bg-fill-bg text-fill-text focus:outline-none focus:border-fill-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-fill-text mb-1">Язык</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-fill-border bg-fill-bg text-fill-text focus:outline-none focus:border-fill-blue"
                >
                  <option value="ru">Русский (ru)</option>
                  <option value="kk">Қазақша (kk)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
            </div>

            {/* Visibility Mode (Sprint 1) */}
            <div>
              <label className="block font-semibold text-fill-text mb-1">
                Режим показа конспекта ученикам
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`border rounded-md p-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    visibilityMode === 'moderated'
                      ? 'border-fill-warning bg-fill-warning-soft/30'
                      : 'border-fill-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="moderated"
                    checked={visibilityMode === 'moderated'}
                    onChange={() => setVisibilityMode('moderated')}
                  />
                  <div>
                    <strong className="block text-xs text-fill-text">Премодерация</strong>
                    <span className="text-[10px] text-fill-text-muted">Учитель одобряет блоки</span>
                  </div>
                </label>

                <label
                  className={`border rounded-md p-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    visibilityMode === 'live'
                      ? 'border-fill-blue bg-fill-blue-soft/30'
                      : 'border-fill-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="live"
                    checked={visibilityMode === 'live'}
                    onChange={() => setVisibilityMode('live')}
                  />
                  <div>
                    <strong className="block text-xs text-fill-text">Прямой эфир</strong>
                    <span className="text-[10px] text-fill-text-muted">Блоки видны сразу</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-fill-text mb-1">Источник урока</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source"
                    value="live"
                    checked={source === 'live'}
                    onChange={() => setSource('live')}
                  />
                  <span>Live (WebRTC / RTMP бот)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source"
                    value="upload"
                    checked={source === 'upload'}
                    onChange={() => setSource('upload')}
                  />
                  <span>Upload (Загрузка файла S3)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-fill-text mb-1">
                Ожидаемые термины (через запятую)
              </label>
              <input
                type="text"
                value={expectedTerms}
                onChange={(e) => setExpectedTerms(e.target.value)}
                placeholder="ДНК, ген, аллель"
                className="w-full px-3 py-2 rounded-md border border-fill-border bg-fill-bg text-fill-text focus:outline-none focus:border-fill-blue"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full justify-center text-xs py-2.5 mt-2"
            >
              {isLoading ? 'Создание…' : 'Создать урок на сервере'}
            </button>
          </form>
        </div>

        {/* Lessons List & Active lesson actions */}
        <div className="space-y-6">
          <div className="bg-fill-surface border border-fill-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-fill-text mb-1">Уроки в текущей сессии</h3>
            <p className="text-xs text-fill-text-muted mb-4">
              Управление статусом, материалами, презентациями и экспортом.
            </p>

            {lessons.length === 0 ? (
              <div className="py-8 text-center text-xs text-fill-text-faint border border-dashed border-fill-border rounded-md">
                Нет созданных уроков. Заполните форму слева для отправки на бэкенд.
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((les) => (
                  <div
                    key={les.id}
                    className="p-4 rounded-md border border-fill-border bg-fill-bg flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-fill-text">{les.title}</strong>
                      <div className="flex items-center gap-1.5">
                        <span className="badge badge-blue text-[10px] font-bold">
                          {les.status}
                        </span>
                        {les.visibility_mode === 'moderated' && (
                          <span className="badge bg-fill-warning-soft text-fill-warning text-[10px] font-bold">
                            Премодерация
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-fill-text-faint">
                      ID: <span className="font-mono text-[10px]">{les.id}</span> · Язык: {les.language}
                    </div>

                    {/* Materials Ingestion (Sprint 2) */}
                    <div className="pt-2 border-t border-fill-border flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-fill-text-muted flex items-center gap-1.5">
                        <Presentation className="w-3.5 h-3.5 text-fill-blue" />
                        Загрузка презентации PDF (Materials):
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept=".pdf,.pptx"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-fill-surface-alt file:text-fill-text hover:file:bg-fill-border cursor-pointer"
                        />
                        <button
                          onClick={() => handleUploadMaterials(les.id)}
                          disabled={!selectedFile || isLoading}
                          className="btn btn-ghost text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Загрузить
                        </button>
                        {uploadedSlides.length > 0 && (
                          <span className="text-[11px] text-fill-blue font-semibold ml-2">
                            Загружено слайдов: {uploadedSlides.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Start, Stop, Export Markdown, Export Anki */}
                    <div className="flex gap-2 pt-2 border-t border-fill-border flex-wrap">
                      {les.status === 'created' && (
                        <button
                          onClick={() => handleStartLesson(les.id)}
                          className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-fill-green-deep border-fill-green-deep/30"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Старт
                        </button>
                      )}

                      {les.status === 'live' && (
                        <button
                          onClick={() => handleEndLesson(les.id)}
                          className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-fill-danger border-fill-danger/30"
                        >
                          <Square className="w-3.5 h-3.5" />
                          Завершить
                        </button>
                      )}

                      <button
                        onClick={() => handleExport(les.id, 'md')}
                        className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Markdown
                      </button>

                      <button
                        onClick={() => handleExport(les.id, 'anki')}
                        className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-fill-green-deep"
                        title="Экспорт карточек для Anki (Sprint 1)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Anki TSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Preview Modal/Box */}
          {exportContent && (
            <div className="bg-fill-surface border border-fill-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-fill-text">
                  {exportContent.format === 'anki' ? (
                    <FileSpreadsheet className="w-4 h-4 text-fill-green-deep" />
                  ) : (
                    <FileText className="w-4 h-4 text-fill-blue" />
                  )}
                  Экспорт конспекта ({exportContent.format.toUpperCase()})
                </div>
                <button
                  onClick={() => setExportContent(null)}
                  className="text-xs text-fill-text-faint hover:text-fill-text"
                >
                  Закрыть
                </button>
              </div>
              <pre className="p-3 bg-fill-surface-alt rounded-md text-[11px] text-fill-text overflow-x-auto max-h-60 whitespace-pre-wrap font-mono">
                {exportContent.text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
