export interface Transaction {
  id: string;
  date: string;
  time: string;
  student_name: string;
  title: string;
  amount: number;
  is_penalty: boolean;
  status: string;
  lesson_id: number | null;
}

export interface FinancesData {
  transactions: Transaction[];
  total_earned: number;
  total_penalties: number;
  balance: number;
  lessons_count: number;
}
