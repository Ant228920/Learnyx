export type GradeType = 'ДЗ' | 'Урок';

export interface GradeRecord {
  id: number;
  subject: string | null;
  date: string;
  topic: string | null;
  type: GradeType;
  score: number;
  maxScore: number;
  teacher: string | null;
  feedback: string | null;
}
