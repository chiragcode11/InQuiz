export enum DifficultyLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior'
}

export enum QuestionType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  EXPERIENCE = 'experience',
  SITUATIONAL = 'situational'
}

export interface Resume {
  _id: string;
  filename: string;
  content: string;
  skills: string[];
  experience: string[];
  education: string[];
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  expected_answer_points: string[];
  follow_up_questions: string[];
}

export interface InterviewResponse {
  question_id: string;
  question_text: string;
  user_response: string;
  response_time: number;
  timestamp: string;
  analysis?: {
    completeness_score: number;
    accuracy_score: number;
    clarity_score: number;
    missing_points: string[];
    strengths: string[];
    follow_up_needed: boolean;
    suggested_follow_up: string;
  };
}

export interface InterviewSession {
  _id: string;
  resume_id: string;
  difficulty: DifficultyLevel;
  questions: Question[];
  responses: InterviewResponse[];
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface InterviewConfig {
  difficulty: DifficultyLevel;
  duration_minutes: number;
  question_types: QuestionType[];
  num_questions: number;
}
