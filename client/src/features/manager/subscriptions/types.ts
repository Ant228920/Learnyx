export interface Subscription {
  id: number;
  student_name: string;
  email: string;
  total_lessons: number;
  balance: number;
  used_lessons: number;
  final_price: number;
  status: string;
  purchased_at: string;
}

export interface SubscriptionsData {
  subscriptions: Subscription[];
  total_active: number;
  total_revenue: number;
}
