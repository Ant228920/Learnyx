export type HWStatus = 'НЕ ПЕРЕВІРЕНО' | 'ПЕРЕВІРЕНО';

export interface TeacherHomeworkItem {
  id: number;
  lessonId: number;
  student: string;
  topic: string;
  subject: string;
  deadline: string;
  status: HWStatus;
  avatarBg: string;
  file?: string;
  savedComment?: string;
  savedGrade?: string;
  homeworkGrade?: number | null;
  teacherNotes?: string;
}
