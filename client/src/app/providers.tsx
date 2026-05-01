/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, ModalType, User } from './auth.context';

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  modal: null,
  openModal: () => {},
  closeModal: () => {},
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function Providers({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const openModal = useCallback((type: ModalType) => setModal(type), []);
  const closeModal = useCallback(() => setModal(null), []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setModal(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, modal, openModal, closeModal, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}