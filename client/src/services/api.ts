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

export interface LearningRequestItem {
  id: number;
  student_name: string;
  student_email: string;
  subject: string;
  level: string;
  preferred_days: string;
  preferred_time: string;
  notes: string;
  status: 'pending' | 'matched' | 'cancelled';
  created_at: string;
  package: number | null;
}

export interface ApiError {
  timestamp: string;
  errorCode: string;
  message: string;
  path: string;
  details?: string[];
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

  refreshToken: async (refresh: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>(
      '/auth/token/refresh/', { refresh }
    );
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
    return data;
  },

  getActiveBalance: async (): Promise<{
    remaining_lessons: number; total_lessons: number; package_id: number; status: string;
  } | null> => {
    const { data } = await apiClient.get('/students/me/balance/');
    return data.package_id ? data : null;
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

  getPackagePlans: async () => {
    const { data } = await apiClient.get('/packages/');
    return (data.results ?? data) as Array<{
      id: number; name: string; total_lessons: number;
      price: number; description: string; is_active: boolean;
    }>;
  },

  purchasePlan: async (planId: number) => {
    const { data } = await apiClient.post(`/packages/${planId}/purchase/`);
    return data;
  },

  getWallet: async (): Promise<{ money_balance: number; bonus_discount_pct: number; bonus_description: string }> => {
    const { data } = await apiClient.get('/students/me/wallet/');
    return data;
  },

  topUp: async (amount: number): Promise<{ money_balance: number; added: number; message: string }> => {
    const { data } = await apiClient.post('/students/me/topup/', { amount });
    return data;
  },

  getLearningRequests: async () => {
    const { data } = await apiClient.get('/students/me/learning-requests/');
    return data as LearningRequestItem[];
  },

  createLearningRequest: async (payload: {
    subject: string; level: string; preferred_days?: string;
    preferred_time?: string; notes?: string; package?: number | null;
  }) => {
    const { data } = await apiClient.post('/students/me/learning-requests/', payload);
    return data as LearningRequestItem;
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

  setLessonStatus: async (
    lessonId: number,
    status: 'conducted' | 'canceled_advance' | 'student_missed' | 'teacher_missed'
  ): Promise<Lesson> => {
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

  assignLesson: async (payload: {
    slot: number;
    student: number;
    package?: number;
  }): Promise<Lesson> => {
    const { data } = await apiClient.post('/lessons/assign/', payload);
    return data as Lesson;
  },

  getStudents: async (): Promise<Array<{
    user_id: number; first_name: string; last_name: string; email: string; lessons_balance: number;
  }>> => {
    const { data } = await apiClient.get('/students/');
    return data.results ?? data;
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

  getFinances: async () => {
    const { data } = await apiClient.get('/teacher/finances/');
    return data;
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
  getRegistrationRequests: async () => {
    const { data } = await apiClient.get('/applicants/');
    return data.results ?? data;
  },

  getStudents: async (params?: { is_approved?: boolean }) => {
    const query = params?.is_approved !== undefined ? `?is_approved=${params.is_approved}` : '';
    const { data } = await apiClient.get(`/students/${query}`);
    return data.results ?? data;
  },

  getTeachers: async () => {
    const { data } = await apiClient.get('/teachers/');
    return data.results ?? data;
  },

  approveUser: async (userId: number) => {
    const { data } = await apiClient.post(`/applicants/${userId}/approve/`);
    return data;
  },

  rejectUser: async (userId: number) => {
    const { data } = await apiClient.post(`/applicants/${userId}/reject/`);
    return data;
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

  getRequests: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const { data } = await apiClient.get(`/requests/${query}`);
    return data.results ?? data;
  },

  getAvailableSlots: async (params?: { teacher_id?: number; date?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    const { data } = await apiClient.get(`/slots/available/?${q}`);
    return data;
  },

  bookLesson: async (payload: {
    slot_id: number;
    student_id: number;
    package_id: number;
    meeting_link?: string;
  }) => {
    const { data } = await apiClient.post('/lessons/', payload);
    return data;
  },

  getSubscriptions: async () => {
    const { data } = await apiClient.get('/manager/subscriptions/');
    return data;
  },

  getLearningRequests: async (statusFilter?: string) => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const { data } = await apiClient.get(`/manager/learning-requests/${query}`);
    return data as LearningRequestItem[];
  },

  updateLearningRequest: async (id: number, status: string) => {
    const { data } = await apiClient.patch(`/manager/learning-requests/${id}/`, { status });
    return data as LearningRequestItem;
  },
};

// ── Profile API ────────────────────────────────────────────────────────────
export const profileApi = {
  get: async () => {
    const { data } = await apiClient.get('/users/me/');
    return data;
  },

  update: async (payload: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    telegram_nickname?: string;
  }) => {
    const { data } = await apiClient.patch('/users/me/', payload);
    return data;
  },
};