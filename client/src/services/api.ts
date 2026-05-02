import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as { response?: { data?: { message?: string } } };
    const message = err.response?.data?.message || 'Помилка сервера.';
    return Promise.reject(new Error(message));
  }
);

export interface RegisterStudentDTO {
  lastName: string;
  firstName: string;
  middleName?: string;
  phone: string;
  email: string;
  telegram: string;
}

export interface RegisterTeacherDTO {
  lastName: string;
  firstName: string;
  middleName?: string;
  phone: string;
  email: string;
  telegram: string;
  subject: string;
  level: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: 'student' | 'teacher' | 'manager' | 'admin';
    firstName: string;
    lastName: string;
  };
}

export const authApi = {
  registerStudent: (data: RegisterStudentDTO) =>
    api.post('/auth/register/student', data),
  registerTeacher: (data: RegisterTeacherDTO) =>
    api.post('/auth/register/teacher', data),
  login: (data: LoginDTO) => api.post<LoginResponse>('/auth/login', data),
  me: () => api.get('/auth/me'),
  health: () => api.get('/health'),
};

export const applicantsApi = {
  getAll: () => api.get('/applicants'),
  approve: (id: number) => api.post(`/applicants/${id}/approve`),
  reject: (id: number) => api.post(`/applicants/${id}/reject`),
};

export const lessonsApi = {
  getToday: () => api.get('/lessons/today'),
};

export default api;

