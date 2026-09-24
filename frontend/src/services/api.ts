import { Lesson, LessonState, NoteBlock, Slide } from '../types/lesson';
import { Quiz, Report } from '../types/quiz';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string = 'api_error', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (!headers['X-Request-ID']) {
      headers['X-Request-ID'] = crypto.randomUUID();
    }

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errDetail = 'Request failed';
        let errCode = 'http_error';
        try {
          const errData = await response.json();
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errDetail = errData.detail;
            } else if (typeof errData.detail === 'object') {
              errDetail = errData.detail.message || JSON.stringify(errData.detail);
              errCode = errData.detail.code || errCode;
            }
          }
        } catch {
          errDetail = response.statusText;
        }
        throw new ApiError(errDetail, errCode, response.status);
      }

      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return (await response.text()) as unknown as T;
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(e.message || 'Network error', 'network_error', 0);
    }
  }

  // Health checks
  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/healthz');
  }

  async checkReadiness(): Promise<{ status: string; checks: Record<string, string> }> {
    return this.request<{ status: string; checks: Record<string, string> }>('/readyz');
  }

  // Lessons
  async createLesson(payload: {
    title: string;
    subject?: string;
    language: 'ru' | 'kk' | 'en';
    source: 'live' | 'upload';
    visibility_mode?: 'live' | 'moderated';
    expected_terms?: string[];
    consent_confirmed?: boolean;
  }): Promise<Lesson> {
    return this.request<Lesson>('/v1/lessons', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        visibility_mode: payload.visibility_mode || 'live',
        consent_confirmed: payload.source === 'live' ? true : false,
      }),
    });
  }

  async listLessons(): Promise<Lesson[]> {
    return this.request<Lesson[]>('/v1/lessons');
  }

  async getLesson(lessonId: string): Promise<Lesson> {
    return this.request<Lesson>(`/v1/lessons/${lessonId}`);
  }

  async getLessonState(lessonId: string): Promise<LessonState> {
    return this.request<LessonState>(`/v1/lessons/${lessonId}/state`);
  }

  async startLesson(lessonId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/v1/lessons/${lessonId}/start`, {
      method: 'POST',
    });
  }

  async endLesson(lessonId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/v1/lessons/${lessonId}/end`, {
      method: 'POST',
    });
  }

  async getUploadUrl(lessonId: string, filename: string, contentType: string = 'video/mp4'): Promise<{ upload_url: string; s3_key: string; expires_in: number }> {
    return this.request(`/v1/lessons/${lessonId}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ filename, content_type: contentType }),
    });
  }

  async processLesson(lessonId: string, s3_key?: string): Promise<{ status: string }> {
    return this.request(`/v1/lessons/${lessonId}/process`, {
      method: 'POST',
      body: JSON.stringify({ s3_key }),
    });
  }

  async updateNoteBlock(lessonId: string, blockId: string, payload: { title?: string; body_md?: string }): Promise<NoteBlock> {
    return this.request<NoteBlock>(`/v1/lessons/${lessonId}/blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Moderated mode approval (Sprint 1)
  async approveNoteBlock(lessonId: string, blockId: string): Promise<NoteBlock> {
    return this.request<NoteBlock>(`/v1/lessons/${lessonId}/blocks/${blockId}/approve`, {
      method: 'POST',
    });
  }

  // Presentation Materials (Sprint 2)
  async uploadMaterials(lessonId: string, file: File): Promise<Slide[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<Slide[]>(`/v1/lessons/${lessonId}/materials`, {
      method: 'POST',
      body: formData,
    });
  }

  async getSlides(lessonId: string): Promise<Slide[]> {
    return this.request<Slide[]>(`/v1/lessons/${lessonId}/slides`);
  }

  // Lesson Recording (Sprint 3)
  async getRecording(lessonId: string): Promise<{ lesson_id: string; recording_url: string; format: string }> {
    return this.request(`/v1/lessons/${lessonId}/recording`);
  }

  // Exports: Markdown and Anki TSV
  async exportLesson(lessonId: string, format: 'md' | 'anki' | 'anki_tsv' = 'md'): Promise<string> {
    return this.request<string>(`/v1/lessons/${lessonId}/export?format=${format}`);
  }

  // SSE Token
  async getSseToken(lessonId: string): Promise<{ token: string; expires_in: number }> {
    return this.request<{ token: string; expires_in: number }>(`/v1/lessons/${lessonId}/sse-token`, {
      method: 'POST',
    });
  }

  // Quizzes & Reports
  async getQuiz(lessonId: string): Promise<Quiz> {
    return this.request<Quiz>(`/v1/lessons/${lessonId}/quiz`);
  }

  async getStudentQuiz(lessonId: string): Promise<Quiz> {
    return this.request<Quiz>(`/v1/lessons/${lessonId}/quiz/student`);
  }

  async publishQuiz(lessonId: string): Promise<Quiz> {
    return this.request<Quiz>(`/v1/lessons/${lessonId}/quiz/publish`, {
      method: 'POST',
    });
  }

  async getReport(lessonId: string): Promise<Report> {
    return this.request<Report>(`/v1/lessons/${lessonId}/report`);
  }
}

export const api = new ApiClient();
