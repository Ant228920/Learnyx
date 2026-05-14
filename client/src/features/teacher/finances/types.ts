export interface Transaction {
  id: number;
  date: string;
  time: string;
  student_name: string;
  amount: number;
  status: string;
  lesson_id: number;
}

export interface FinancesData {
  transactions: Transaction[];
  total_earned: number;
  lessons_count: number;
}
