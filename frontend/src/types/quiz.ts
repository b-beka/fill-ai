export type QuestionType = 'single' | 'multiple' | 'open';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface QuizQuestion {
  id: string;
  position: number;
  type: QuestionType;
  text: string;
  options?: string[];
  correct?: number[];
  rubric?: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  points: number;
  // stats for live questions
  stats?: {
    answered_count: number;
    total_students: number;
    option_distribution?: number[]; // percentages
    insight?: string;
  };
}

export interface Quiz {
  id: string;
  lesson_id: string;
  version: number;
  status: QuizStatus;
  created_at: string;
  published_at?: string | null;
  questions: QuizQuestion[];
}

export interface AnswerSubmission {
  question_id: string;
  value: any;
}

export interface AttemptAnswer {
  question_id: string;
  value: any;
  is_correct?: boolean;
  points?: number;
  feedback?: string;
  graded_by?: 'auto' | 'vlm' | 'teacher';
}

export interface Attempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string | null;
  score?: number;
  max_score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answers: AttemptAnswer[];
}

export interface Report {
  id: string;
  lesson_id: string;
  quiz_id: string;
  average_score: number;
  median_score: number;
  quartiles: [number, number, number]; // [q1, q2, q3]
  at_risk_students: Array<{ student_id: string; score: number; reason: string }>;
  narrative_report: string;
  created_at: string;
}
