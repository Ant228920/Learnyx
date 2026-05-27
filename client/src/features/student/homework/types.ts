export interface StudentHomeworkTask {
  id: number;          // journal record ID
  lessonId: number;
  subject: string;
  title: string;
  description: string;
  deadline: string;    // formatted "До DD Місяць, HH:MM"
  deadlineDate: Date;
  urgent: boolean;     // true if deadline is today or tomorrow
  answerUrl?: string;  // student's submitted answer URL
  fileUrl?: string;    // teacher's reference file URL (homework_answer_url)
  homeworkStatus: string; // 'assigned' | 'submitted' | 'reviewed'
}
