import { useState, useEffect, useRef } from 'react';
import { apiClient, extractErrorMessage } from '../../../../services/api';

export interface TeacherStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject?: string;
  level?: string;
  phone?: string;
  lessons_balance?: number;
  total_lessons?: number;
  avatarBg?: string;
}

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function getAvatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

export function useTeacherStudents() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await apiClient.get<{ results?: Record<string, unknown>[] } | Record<string, unknown>[]>('/lessons/');
        if (cancelled) return;
        const data = res.data;
        const lessons: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : ((data as { results?: Record<string, unknown>[] }).results ?? []);
        const map = new Map<number, TeacherStudent>();
        lessons.forEach((lesson: Record<string, unknown>) => {
          const s = lesson.student as Record<string, unknown> | null | undefined;
          if (s && typeof s.id === 'number' && !map.has(s.id)) {
            map.set(s.id, {
              id: s.id,
              first_name: String(s.first_name ?? ''),
              last_name: String(s.last_name ?? ''),
              email: String(s.email ?? ''),
              subject: String(s.subject ?? (lesson.subject as string) ?? ''),
              level: String(s.level_name ?? (lesson.level as string) ?? ''),
              phone: String(s.phone ?? ''),
              lessons_balance: Number(s.lessons_balance ?? 0),
              total_lessons: Number(s.total_lessons ?? 0),
              avatarBg: getAvatarBg(s.id),
            });
          }
        });
        if (!cancelled) setStudents(Array.from(map.values()));
      } catch (err: unknown) {
        if (!cancelled) setErrorMsg(extractErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  return { students, isLoading, errorMsg };
}
