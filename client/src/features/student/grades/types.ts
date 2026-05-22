export type GradeType = 'ДЗ' | 'Урок';

export interface GradeRecord {
  id: number;
  subject: string;
  date: string;
  topic: string;
  type: GradeType;
  score: number;
  maxScore: number;
  teacher: string;
  feedback: string;
}
