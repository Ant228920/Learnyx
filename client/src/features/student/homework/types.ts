export interface StudentHomeworkTask {
<<<<<<< HEAD
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
=======
  id: number;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  deadlineDate: Date;
  urgent: boolean;
  lessonId: number;
  answerUrl?: string;
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
}
