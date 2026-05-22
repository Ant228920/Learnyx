export interface TeacherStudent {
  id: number;
  name: string;
  subject: string;
  level: string;
  status: 'Активний' | 'Неактивний';
  email: string;
  phone: string;
  avatarBg: string;
  lessons_balance: number;
}

export interface AvailableRequest {
  id: number;
  name: string;
  subject: string;
  level: string;
  days: string;
  time: string;
  avatarBg: string;
}
