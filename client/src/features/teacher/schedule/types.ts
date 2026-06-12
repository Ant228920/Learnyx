export interface SlotItem {
  id: number;
  time: string;
  is_booked: boolean;
  start_time: string;
  end_time: string;
  lesson_status?: string | null;
  lesson_student_name?: string | null;
}

export type SlotsByDay = Record<number, SlotItem[]>;
