export type ModalType = 'student' | 'teacher' | 'login' | null;

export interface User {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'manager' | 'admin' | 'Student' | 'Teacher' | 'Manager' | 'Admin';
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