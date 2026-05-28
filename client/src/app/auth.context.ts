export type ModalType = 'student' | 'teacher' | 'login' | null;

export interface User {
  id: number;
  email: string;
<<<<<<< HEAD
  role: 'student' | 'teacher' | 'manager' | 'admin' | 'Student' | 'Teacher' | 'Manager' | 'Admin';
=======
  role: 'Student' | 'Teacher' | 'Manager' | 'Admin';
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
  firstName: string;
  lastName: string;
  phone?: string;
  nickname?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  modal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}