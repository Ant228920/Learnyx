import axios from 'axios';

// docker-compose: VITE_API_URL=http://localhost:8000/api/v1
// Всі ендпоінти БЕЗ /v1/ — він вже в BASE_URL
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// JWT interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
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
          const newToken = (data as { accessToken?: string; access?: string }).accessToken ?? (data as { access?: string }).access ?? '';
          localStorage.setItem('token', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
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
  phone?: string;
  nickname?: string;
}

export interface Slot {
  id: number;
  teacher: number;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked';
}

export interface Lesson {
  id: number;
  slot: number;
  student: number;
  package: number;
  curriculum_lesson: number | null;
  status: string;
  meeting_link: string | null;
}

export interface LessonWithSlot {
  id: number;
  slot: { id: number; start_time: string; end_time: string; };
  student: number;
  package: number;
  curriculum_lesson: number | null;
  status: string;
  meeting_link: string | null;
}

export interface Package {
  id: number;
  student: number;
  course: number;
  discipline: number | null;
  total_lessons: number;
  balance: number;
  final_price: string;
  discount: string;
  status: string;
  purchased_at: string;
}

export interface JournalRecord {
  id: number;
  lesson: number;
  is_present: boolean;
  activity_grade: number | null;
  homework_grade: number | null;
  grade: number | null;
  teacher_homework_task: unknown;
  homework_answer_url: string | null;
  teacher_notes: string | null;
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

export interface RegistrationRequest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  telegram_nickname: string | null;
  role: 'student' | 'teacher';
  subject: string | null;
  level: string | null;
  status: string;
  created_at: string;
}

// ── Error helper ────────────────────────────────────────────────────────────
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data?.message) return data.message as string;
    if (data?.detail) return data.detail as string;
    if (data?.non_field_errors) return (data.non_field_errors as string[])[0];
    const firstField = data ? Object.values(data)[0] : undefined;
    if (Array.isArray(firstField)) return firstField[0] as string;
    if (typeof firstField === 'string') return firstField;
  }
  return 'Щось пішло не так. Спробуйте ще раз.';
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login/
// POST /api/v1/auth/register/
// POST /api/v1/auth/token/refresh/
export const authApi = {
  login: async (dto: LoginDTO) => {
    const { data } = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: number; email: string; role: string; firstName: string; lastName: string };
    }>('/auth/login/', { email: dto.email, password: dto.password });
    return data;
  },

  register: async (dto: RegisterDTO) => {
    const { data } = await apiClient.post('/auth/register/', dto);
    return data;
  },
};

// ── STUDENT ───────────────────────────────────────────────────────────────────
// GET /api/v1/student/dashboard/
// GET /api/v1/lessons/upcoming/
// GET /api/v1/lessons/?status=...
// PATCH /api/v1/lessons/{id}/cancel/
// GET /api/v1/journal/
// GET /api/v1/packages/
// GET /api/v1/students/me/balance/
export const studentApi = {
  getDashboard: async (): Promise<StudentDashboard> => {
    const { data } = await apiClient.get('/student/dashboard/');
    return data as StudentDashboard;
  },

  getUpcomingLessons: async (): Promise<LessonWithSlot[]> => {
    const { data } = await apiClient.get('/lessons/upcoming/');
    return data as LessonWithSlot[];
  },

  getLessons: async (status?: string): Promise<LessonWithSlot[]> => {
    const q = status ? `?status=${status}` : '';
    const { data } = await apiClient.get(`/lessons/${q}`);
    const arr = (data as { results?: LessonWithSlot[] }).results ?? data;
    return arr as LessonWithSlot[];
  },

  cancelLesson: async (lessonId: number): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/cancel/`, { status: 'canceled_advance' });
    return data as Lesson;
  },

  getJournal: async (): Promise<JournalRecord[]> => {
    const { data } = await apiClient.get('/journal/');
    const arr = (data as { results?: JournalRecord[] }).results ?? data;
    return arr as JournalRecord[];
  },

  getPackages: async (): Promise<Package[]> => {
    const { data } = await apiClient.get('/packages/?status=active');
    const arr = (data as { results?: Package[] }).results ?? data;
    return arr as Package[];
  },

  getBalance: async () => {
    const { data } = await apiClient.get('/students/me/balance/');
    return data;
  },
};

// ── TEACHER ───────────────────────────────────────────────────────────────────
// GET /api/v1/teacher/dashboard/
// GET/POST/DELETE /api/v1/slots/
// GET /api/v1/lessons/
// PATCH /api/v1/lessons/{id}/status/
// POST /api/v1/lessons/{id}/evaluate/
// PATCH /api/v1/lessons/{id}/meeting-link/
// POST /api/v1/lessons/{id}/homework/
// POST /api/v1/lessons/assign/
// GET /api/v1/students/
// GET /api/v1/students/available/?slot_id=X
export const teacherApi = {
  getDashboard: async (): Promise<TeacherDashboard> => {
    const { data } = await apiClient.get('/teacher/dashboard/');
    return data as TeacherDashboard;
  },

  getSlots: async (params?: { date?: string; status?: string }): Promise<Slot[]> => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/slots/?${q}`);
    const arr = (data as { results?: Slot[] }).results ?? data;
    return arr as Slot[];
  },

  createSlot: async (start_time: string, end_time: string): Promise<Slot> => {
    const { data } = await apiClient.post('/slots/', { start_time, end_time });
    return data as Slot;
  },

  deleteSlot: async (slotId: number): Promise<void> => {
    await apiClient.delete(`/slots/${slotId}/`);
  },

  getLessons: async (params?: { status?: string }): Promise<Lesson[]> => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/lessons/?${q}`);
    const arr = (data as { results?: Lesson[] }).results ?? data;
    return arr as Lesson[];
  },

  setLessonStatus: async (lessonId: number, status: string): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/status/`, { status });
    return data as Lesson;
  },

  evaluateLesson: async (lessonId: number, payload: {
    is_present: boolean;
    activity_grade?: number;
    teacher_homework_task?: string;
    homework_grade?: number;
  }): Promise<JournalRecord> => {
    const { data } = await apiClient.post(`/lessons/${lessonId}/evaluate/`, payload);
    return data as JournalRecord;
  },

  setMeetingLink: async (lessonId: number, meeting_link: string): Promise<Lesson> => {
    const { data } = await apiClient.patch(`/lessons/${lessonId}/meeting-link/`, { meeting_link });
    return data as Lesson;
  },

  setHomework: async (lessonId: number, payload: {
    teacher_homework_task: string;
    homework_answer_url?: string;
  }): Promise<JournalRecord> => {
    const { data } = await apiClient.post(`/lessons/${lessonId}/homework/`, payload);
    return data as JournalRecord;
  },

  assignLesson: async (payload: { slot_id: number; student_id: number; package_id?: number }): Promise<Lesson> => {
    const { data } = await apiClient.post('/lessons/assign/', payload);
    return data as Lesson;
  },

  getStudents: async () => {
    const { data } = await apiClient.get('/students/');
    const arr = (data as { results?: unknown[] }).results ?? data;
    return arr;
  },

  getAvailableStudents: async (slotId: number) => {
    const { data } = await apiClient.get(`/students/available/?slot_id=${slotId}`);
    return data;
  },

  getJournalForLesson: async (lessonId: number): Promise<JournalRecord[]> => {
    const { data } = await apiClient.get(`/journal/?lesson_id=${lessonId}`);
    const arr = (data as { results?: JournalRecord[] }).results ?? data;
    return arr as JournalRecord[];
  },
};

// ── MANAGER ───────────────────────────────────────────────────────────────────
// GET /api/v1/requests/          ← реєстраційні заявки (RegistrationRequest)
// POST /api/v1/applicants/{id}/approve/
// GET /api/v1/students/
// GET /api/v1/packages/
// GET /api/v1/admin/lessons/archive/
// GET /api/v1/slots/available/
// POST /api/v1/lessons/
// GET /api/v1/user-requests/     ← запити до менеджера (Request model)
export const managerApi = {
  // Реєстраційні заявки — для сторінки Applications
  getRegistrationRequests: async (): Promise<RegistrationRequest[]> => {
    const { data } = await apiClient.get('/requests/');
    const arr = (data as { results?: RegistrationRequest[] }).results ?? data;
    return arr as RegistrationRequest[];
  },

  approveApplicant: async (id: number) => {
    const { data } = await apiClient.post(`/applicants/${id}/approve/`);
    return data;
  },

  getStudents: async () => {
    const { data } = await apiClient.get('/students/');
    const arr = (data as { results?: unknown[] }).results ?? data;
    return arr;
  },

  getPackages: async (params?: { student_id?: number; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/packages/?${q}`);
    const arr = (data as { results?: Package[] }).results ?? data;
    return arr as Package[];
  },

  activatePackage: async (packageId: number) => {
    const { data } = await apiClient.post(`/packages/${packageId}/activate/`);
    return data;
  },

  getLessonArchive: async (params?: { date_from?: string; date_to?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/admin/lessons/archive/?${q}`);
    const arr = (data as { results?: unknown[] }).results ?? data;
    return arr;
  },

  getAvailableSlots: async (params?: { teacher_id?: number; date?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/slots/available/?${q}`);
    return data;
  },

  bookLesson: async (payload: { slot_id: number; student_id: number; package_id: number }) => {
    const { data } = await apiClient.post('/lessons/', payload);
    return data;
  },

  // Запити до менеджера (Request model — окремо від реєстраційних заявок)
  getUserRequests: async (status?: string) => {
    const q = status ? `?status=${status}` : '';
    const { data } = await apiClient.get(`/user-requests/${q}`);
    const arr = (data as { results?: unknown[] }).results ?? data;
    return arr;
  },
};