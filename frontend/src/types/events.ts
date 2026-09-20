export type SSEEventType =
  | 'lesson.status'
  | 'transcript.partial'
  | 'transcript.final'
  | 'frame.selected'
  | 'note.block.created'
  | 'note.block.updated'
  | 'note.block.approved'
  | 'lesson.materials.ready'
  | 'lesson.ended'
  | 'summary.ready'
  | 'quiz.ready'
  | 'quiz.published'
  | 'report.ready'
  | 'error.notice';

export interface SSEEnvelope<T = any> {
  seq?: number;
  type: SSEEventType;
  lesson_id: string;
  ts: string;
  data: T;
}

export interface TranscriptPartialData {
  start_ms: number;
  text: string;
}

export interface TranscriptFinalData {
  segment_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker?: string;
  words?: Array<{ word: string; start_ms: number; end_ms: number }>;
}

export interface ErrorNoticeData {
  code: string;
  message: string;
  recoverable: boolean;
}
