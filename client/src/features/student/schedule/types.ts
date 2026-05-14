export interface UpcomingLesson {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link: string | null;
  timeLabel: string;
}

export type LessonsByDay = Record<number, UpcomingLesson[]>;
