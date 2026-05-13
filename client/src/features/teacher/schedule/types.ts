export interface SlotItem {
  id: number;
  time: string;
  is_booked: boolean;
  start_time: string;
  end_time: string;
}

export type SlotsByDay = Record<number, SlotItem[]>;
