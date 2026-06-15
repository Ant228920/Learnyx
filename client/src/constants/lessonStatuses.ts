export const LESSON_STATUS = {
  SCHEDULED: 'scheduled',
  CONDUCTED: 'conducted',
  STUDENT_MISSED: 'student_missed',
  TEACHER_MISSED: 'teacher_missed',
  CANCELLED: 'cancelled',
} as const;

export type LessonStatus = typeof LESSON_STATUS[keyof typeof LESSON_STATUS];

export const LESSON_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Заплановано',
  conducted: 'Проведено',
  student_missed: 'Учень не з\'явився',
  teacher_missed: 'Вчитель не з\'явився',
  cancelled: 'Скасовано',
};

export const PACKAGE_STATUS = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
