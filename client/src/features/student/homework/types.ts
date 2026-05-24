export interface StudentHomeworkTask {
  id: number;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  deadlineDate: Date;
  urgent: boolean;
  lessonId: number;
  answerUrl?: string;
}
