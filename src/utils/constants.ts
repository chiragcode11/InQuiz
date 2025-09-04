import { DifficultyLevel, QuestionType } from '../types';

export const DIFFICULTY_OPTIONS = [
  { value: DifficultyLevel.ENTRY, label: 'Entry Level', description: 'Basic concepts and fundamentals' },
  { value: DifficultyLevel.MID, label: 'Mid Level', description: 'Practical application and problem solving' },
  { value: DifficultyLevel.SENIOR, label: 'Senior Level', description: 'Architecture and leadership decisions' },
];

export const QUESTION_TYPE_OPTIONS = [
  { value: QuestionType.TECHNICAL, label: 'Technical', description: 'Skills and technical knowledge' },
  { value: QuestionType.BEHAVIORAL, label: 'Behavioral', description: 'Soft skills and past experiences' },
  { value: QuestionType.EXPERIENCE, label: 'Experience', description: 'Work history and projects' },
];

export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
];

export const DEFAULT_CONFIG = {
  difficulty: DifficultyLevel.MID,
  duration_minutes: 20,
  question_types: [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL],
  num_questions: 5,
};
