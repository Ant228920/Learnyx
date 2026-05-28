export interface Application {
  id: number;
  name: string;
  role: 'Учень' | 'Вчитель';
  subject: string;
  level: string;
  email: string;
  phone: string;
<<<<<<< HEAD
  telegram_nickname: string;
=======
  telegram: string;
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
  date: string;
  avatarBg: string;
}
