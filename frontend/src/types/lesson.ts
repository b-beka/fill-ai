export type Language = 'ru' | 'kk' | 'en';
export type LessonSource = 'live' | 'upload';
export type VisibilityMode = 'live' | 'moderated';
export type LessonStatus = 'created' | 'live' | 'processing' | 'ready' | 'failed';
export type BlockStatus = 'approved' | 'pending_review';

export interface Annotation {
  id: string | number;
  label: string;
  type: 'box' | 'arrow' | 'highlight' | 'point';
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  point_2d?: [number, number]; // [y, x] 0-1000
  color?: string;
}

export interface Frame {
  id: string;
  lesson_id: string;
  t_ms: number;
  status: 'candidate' | 'selected' | 'rejected';
  s3_key: string;
  s3_key_annotated?: string;
  original_url?: string;
  annotated_url?: string;
  width: number;
  height: number;
  kind?: string;
  title?: string;
  ocr_markdown?: string;
  description?: string;
  annotations: Annotation[];
}

export interface Slide {
  id: string;
  lesson_id: string;
  slide_idx: number;
  s3_key: string;
  url?: string;
  phash: string;
  extracted_text: string;
  terms: string[];
  width: number;
  height: number;
}

export interface Callout {
  type: 'definition' | 'example' | 'warning' | 'important';
  title?: string;
  text: string;
}

export interface MediaArtifact {
  type: 'slide' | 'code' | 'diagram' | 'photo' | 'audio';
  title?: string;
  code_snippet?: string;
  language?: string;
  image_url?: string;
  audio_duration?: string;
  caption: string;
  badge?: string;
  align?: 'left' | 'right';
}

export interface NoteBlock {
  id: string;
  lesson_id: string;
  position: number;
  t_start_ms: number;
  t_end_ms: number;
  title: string;
  summary?: string;
  body_md: string;
  status?: BlockStatus;
  key_terms?: Array<{ term: string; definition: string }> | string[];
  callouts?: Callout[];
  frame_refs?: string[];
  uncertain?: string[];
  version: number;
  edited_by_teacher?: boolean;
  media_artifact?: MediaArtifact;
}

export interface LessonSummary {
  lesson_id: string;
  tldr?: string;
  outline?: Array<{ title: string; t_start_ms?: number }>;
  glossary?: Array<{ term: string; definition: string }>;
  takeaways?: string[];
  homework?: string;
}

export interface WordTimestamp {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface TranscriptSegment {
  id: string;
  lesson_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker?: string;
  confidence?: number;
  words?: WordTimestamp[];
}

export interface Lesson {
  id: string;
  org_id: string;
  group_id?: string | null;
  teacher_id: string;
  title: string;
  subject?: string | null;
  language: Language;
  source: LessonSource;
  status: LessonStatus;
  visibility_mode?: VisibilityMode;
  expected_terms: string[];
  roi?: Record<string, any> | null;
  livekit_room?: string | null;
  last_seq: number;
  cost_usd: number;
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  livekit_url?: string | null;
  teacher_token?: string | null;
}

export interface LessonState {
  lesson: Lesson;
  last_seq: number;
  blocks: NoteBlock[];
  frames: Frame[];
  slides?: Slide[];
  summary?: LessonSummary | null;
  transcript: TranscriptSegment[];
}
