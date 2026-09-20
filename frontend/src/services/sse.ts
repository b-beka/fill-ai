import { SSEEventType, SSEEnvelope } from '../types/events';

export type SSEEventListener = (event: SSEEnvelope) => void;

export class LessonSSEClient {
  private eventSource: EventSource | null = null;
  private lessonId: string;
  private sseToken: string;
  private lastSeq: number = 0;
  private listeners: Map<string, Set<SSEEventListener>> = new Map();
  private isExplicitlyClosed: boolean = false;
  private reconnectTimer: number | null = null;

  constructor(lessonId: string, sseToken: string, initialSeq: number = 0) {
    this.lessonId = lessonId;
    this.sseToken = sseToken;
    this.lastSeq = initialSeq;
  }

  connect() {
    this.isExplicitlyClosed = false;
    this.close();

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${baseUrl}/v1/lessons/${this.lessonId}/events?token=${encodeURIComponent(this.sseToken)}&after_seq=${this.lastSeq}`;

    this.eventSource = new EventSource(url);

    // Default message handler
    this.eventSource.onmessage = (e) => {
      try {
        const envelope: SSEEnvelope = JSON.parse(e.data);
        if (envelope.seq && envelope.seq > this.lastSeq) {
          this.lastSeq = envelope.seq;
        }
        this.emit(envelope.type, envelope);
        this.emit('*', envelope);
      } catch (err) {
        console.warn('[SSE] failed to parse message', err, e.data);
      }
    };

    // Named event listeners
    const knownEvents: SSEEventType[] = [
      'lesson.status',
      'transcript.partial',
      'transcript.final',
      'frame.selected',
      'note.block.created',
      'note.block.updated',
      'lesson.ended',
      'summary.ready',
      'quiz.ready',
      'quiz.published',
      'report.ready',
      'error.notice',
    ];

    knownEvents.forEach((eventType) => {
      this.eventSource?.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const envelope: SSEEnvelope = JSON.parse(e.data);
          if (envelope.seq && envelope.seq > this.lastSeq) {
            this.lastSeq = envelope.seq;
          }
          this.emit(eventType, envelope);
          this.emit('*', envelope);
        } catch (err) {
          console.warn(`[SSE] error parsing ${eventType}`, err, e.data);
        }
      });
    });

    this.eventSource.onerror = (err) => {
      console.warn('[SSE] connection error', err);
      this.eventSource?.close();
      if (!this.isExplicitlyClosed) {
        // Auto-reconnect after 3 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = window.setTimeout(() => {
          this.connect();
        }, 3000);
      }
    };
  }

  on(eventType: SSEEventType | '*', listener: SSEEventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => this.off(eventType, listener);
  }

  off(eventType: SSEEventType | '*', listener: SSEEventListener) {
    this.listeners.get(eventType)?.delete(listener);
  }

  private emit(eventType: string, data: SSEEnvelope) {
    this.listeners.get(eventType)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('[SSE] Listener error:', e);
      }
    });
  }

  close() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  getLastSeq(): number {
    return this.lastSeq;
  }
}
