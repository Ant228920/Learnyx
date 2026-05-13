export interface DashboardRegistration {
  id: number;
  name: string;
  role: 'Студент' | 'Вчитель';
  subject: string;
  phone: string;
  email: string;
  telegram: string;
  level: string;
  date: string;
  avatarBg: string;
}

export interface ManagerDashboardData {
  totalStudents: number;
  totalTeachers: number;
  recentRegistrations: DashboardRegistration[];
}
