import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

// ── Axios instance ─────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Додаємо токен до кожного запиту
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обробка 401 — refresh або logout
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (refresh) {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('token', data.accessToken ?? data.access);
          original.headers.Authorization = `Bearer ${data.accessToken ?? data.access}`;
          return apiClient(original);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ── Types ──────────────────────────────────────────────────────────────────
export interface LoginDTO { email: string; password: string; }

export interface RegisterDTO {
  full_name: string;
  email: string;
  phone: string;
  telegram_nickname?: string;
  role: 'student' | 'teacher';
  subject?: string;
  level?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'manager' | 'admin';
  firstName: string;
  lastName: string;
}

export interface Slot {
  id: number;
  teacher: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface Lesson {
  id: number;
  slot: number;
  student: number;
  package: number;
  curriculum_lesson: number | null;
  status: 'scheduled' | 'conducted' | 'missed' | 'cancelled';
  meeting_link: string | null;
}

export interface LessonWithSlot {
  id: number;
  slot: {
    id: number;
    start_time: string;
    end_time: string;
  };
  student: number;
  package: number;
  curriculum_lesson: number | null;
  status: 'scheduled' | 'conducted' | 'missed' | 'cancelled';
  meeting_link: string | null;
}

export interface Package {
  id: number;
  student_id: number;
  discipline: string;
  total_lessons: number;
  balance: number;
  final_price: number;
  discount: number;
  status: 'active' | 'completed' | 'expired';
  purchased_at: string;
}

export interface JournalRecord {
  id: number;
  lesson: number;
  is_present: boolean;
  activity_grade: number | null;
  homework_grade: number | null;
  teacher_homework_task: string;
  homework_answer_url: string;
  teacher_notes: string;
  start_time?: string;
  lesson_status?: string;
}

export interface StudentDashboard {
  balance: { remaining: number; total: number; package_id: number } | null;
  available_cashback_pct: number;
  next_lesson: {
    lesson_id: number;
    start_time: string;
    end_time: string;
    meeting_link: string | null;
    teacher: string;
  } | null;
  today_lessons: Array<{
    lesson_id: number;
    start_time: string;
    end_time: string;
    meeting_link: string | null;
    teacher: string;
  }>;
  bonus_progress: {
    success_pct: number;
    next_bonus_tier: { threshold_pct: number; cashback_pct: number; gap_pct: number } | null;
  } | null;
}

export interface TeacherDashboard {
  today_lessons: Array<{
    slot_id: number;
    lesson_id: number | null;
    start_time: string;
    end_time: string;
    student_name: string | null;
    topic: string | null;
    meeting_link: string | null;
    lesson_status: string | null;
    can_start: boolean;
  }>;
  stats: {
    total_students: number;
    conducted_lessons: number;
    materials_count: number;
  };
}

export interface ApiError {
  timestamp: string;
  errorCode: string;
  message: string;
  path: string;
  details?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Витягує зрозуміле повідомлення з помилки axios */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.detail) return data.detail;
    if (data?.non_field_errors) return data.non_field_errors[0];
    // DRF field errors
    const firstField = Object.values(data ?? {})[0];
    if (Array.isArray(firstField)) return firstField[0] as string;
    if (typeof firstField === 'string') return firstField;
    if (error.message) return error.message;
  }
  return 'Щось пішло не так. Спробуйте ще раз.';
}

// ── Auth API ───────────────────────────────────────────────────────────────
export const authApi = {
  login: async (dto: LoginDTO) => {
    const { data } = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login/', { email: dto.email, password: dto.password });
    return data;
  },

  register: async (dto: RegisterDTO) => {
    const { data } = await apiClient.post('/auth/register/', dto);
    return data;
  },

  refreshToken: async (refresh: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>(
      '/auth/token/refresh/', { refresh }
    );
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/users/me/');
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  },
};

// ── Student API ────────────────────────────────────────────────────────────
export const studentApi = {
  getDashboard: async (): Promise<StudentDashboard> => {
    const { data } = await apiClient.get('/student/dashboard/');
    return data;
  },

  getPackages: async (): Promise<Package[]> => {
    const { data } = await apiClient.get('/packages/?status=active');
    return data.results ?? data;
  },

  getUpcomingLessons: async (): Promise<LessonWithSlot[]> => {
    const { data } = await apiClient.get('/lessons/upcoming/');
    return data;
  },

  getLessons: async (status?: string): Promise<Lesson[]> => {
    const params = status ? `?status=${status}` : '';
    const { data } = await apiClient.get(`/lessons/${params}`);
    return data.results ?? data;
  },

  cancelLesson: async (lessonId: number): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/cancel/`);
    return data;
  },

  getJournal: async (): Promise<JournalRecord[]> => {
    const { data } = await apiClient.get('/journal/');
    return data.results ?? data;
  },

  getBonusBalance: async (studentId: number) => {
    const { data } = await apiClient.get(`/bonus/balance/${studentId}/`);
    return data;
  },

  purchasePackage: async (packageId: number) => {
    const { data } = await apiClient.post(`/packages/${packageId}/purchase/`);
    return data;
  },
};

// ── Teacher API ────────────────────────────────────────────────────────────
export const teacherApi = {
  getDashboard: async (): Promise<TeacherDashboard> => {
    const { data } = await apiClient.get('/teacher/dashboard/');
    return data;
  },

  getSlots: async (params?: { date?: string; is_booked?: boolean }): Promise<Slot[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.is_booked !== undefined) query.set('is_booked', String(params.is_booked));
    const { data } = await apiClient.get(`/slots/?${query}`);
    return data.results ?? data;
  },

  createSlot: async (start_time: string, end_time: string): Promise<Slot> => {
    const { data } = await apiClient.post('/slots/', { start_time, end_time });
    return data;
  },

  deleteSlot: async (slotId: number): Promise<void> => {
    await apiClient.delete(`/slots/${slotId}/`);
  },

  getLessons: async (params?: { status?: string; date_from?: string; date_to?: string }): Promise<Lesson[]> => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/lessons/?${query}`);
    return data.results ?? data;
  },

  setLessonStatus: async (
    lessonId: number,
    status: 'conducted' | 'cancelled' | 'missed'
  ): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/status/`, { status });
    return data;
  },

  evaluateLesson: async (lessonId: number, payload: {
    is_present: boolean;
    activity_grade?: number;
    teacher_homework_task?: string;
    homework_grade?: number;
    homework_answer_url?: string;
  }): Promise<JournalRecord> => {
    const { data } = await apiClient.post(`/lessons/${lessonId}/evaluate/`, payload);
    return data;
  },

  setMeetingLink: async (lessonId: number, meeting_link: string): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/meeting-link/`, { meeting_link });
    return data;
  },

  setHomework: async (lessonId: number, payload: {
    teacher_homework_task: string;
    homework_answer_url?: string;
  }): Promise<JournalRecord> => {
    const { data } = await apiClient.post(`/lessons/${lessonId}/homework/`, payload);
    return data;
  },

  assignLesson: async (payload: {
    slot_id: number;
    student_id: number;
    package_id?: number;
  }): Promise<Lesson> => {
    const { data } = await apiClient.post('/lessons/assign/', payload);
    return data;
  },

  getStudents: async (): Promise<Array<{
    user_id: number; first_name: string; last_name: string; email: string; lessons_balance: number;
  }>> => {
    const { data } = await apiClient.get('/users/students/');
    return data.results ?? data;
  },

  getAvailableStudents: async (slotId: number) => {
    const { data } = await apiClient.get(`/lessons/available-students/?slot_id=${slotId}`);
    return data;
  },

  getJournalForLesson: async (lessonId: number): Promise<JournalRecord[]> => {
    const { data } = await apiClient.get(`/journal/?lesson_id=${lessonId}`);
    return data.results ?? data;
  },
};

// ── Manager API ────────────────────────────────────────────────────────────
export const managerApi = {
  getStudents: async (params?: { is_approved?: boolean }) => {
    const query = params?.is_approved !== undefined ? `?is_approved=${params.is_approved}` : '';
    const { data } = await apiClient.get(`/users/students/${query}`);
    return data.results ?? data;
  },

  getTeachers: async () => {
    const { data } = await apiClient.get('/users/teachers/');
    return data.results ?? data;
  },

  approveUser: async (userId: number) => {
    const { data } = await apiClient.patch(`/users/approve/${userId}/`, { is_approved: true });
    return data;
  },

  rejectUser: async (userId: number) => {
    const { data } = await apiClient.patch(`/users/approve/${userId}/`, { is_approved: false });
    return data;
  },

  getPackages: async (params?: { student_id?: number; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/packages/?${query}`);
    return data.results ?? data;
  },

  createPackage: async (payload: {
    student_id: number;
    course_id: number;
    discipline_id: number;
    total_lessons: number;
    final_price: number;
    discount?: number;
  }) => {
    const { data } = await apiClient.post('/packages/', payload);
    return data;
  },

  getLessonArchive: async (params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    teacher_id?: number;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/admin/lessons/archive/?${query}`);
    return data;
  },

  getRequests: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const { data } = await apiClient.get(`/requests/${query}`);
    return data.results ?? data;
  },

  processRequest: async (id: number, payload: { status: string; manager_id?: number }) => {
    const { data } = await apiClient.patch(`/requests/${id}/process/`, payload);
    return data;
  },

  getAvailableSlots: async (params?: { teacher_id?: number; date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/slots/available/?${query}`);
    return data;
  },

  bookLesson: async (payload: {
    slot_id: number;
    student_id: number;
    package_id: number;
    meting_link?: string;
  }) => {
    const { data } = await apiClient.post('/lessons/', payload);
    return data;
  },
};