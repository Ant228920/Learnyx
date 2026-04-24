export type ModalType = 'student' | 'teacher' | 'login' | null;

export interface User {
  id: number;
  email: string;
  feat/frontend-foundation
  role: 'student' | 'teacher' | 'manager' | 'admin';

  role: 'student' | 'teacher';
  develop
  firstName: string;
  lastName: string;
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