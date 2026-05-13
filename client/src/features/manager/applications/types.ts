export interface Application {
  id: number;
  name: string;
  role: 'Учень' | 'Вчитель';
  subject: string;
  level: string;
  email: string;
  phone: string;
  telegram: string;
  date: string;
  avatarBg: string;
}
