import { useState, useEffect, useRef } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';

export interface TeacherStudent {
  id: number;
  first_name: string;
  last_name: string;
  father_name?: string | null;
  email: string;
  subject?: string;
  level?: string;
  phone?: string | null;
  telegram_nickname?: string | null;
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
        const data = await teacherApi.getStudents();
        if (cancelled) return;
        setStudents(data.map(s => ({
          id: s.user_id,
          first_name: s.first_name,
          last_name: s.last_name,
          father_name: s.father_name,
          email: s.email,
          subject: s.subject ?? undefined,
          level: s.level_name ?? undefined,
          phone: s.phone,
          telegram_nickname: s.telegram_nickname,
          lessons_balance: s.lessons_balance,
          total_lessons: s.total_lessons,
          avatarBg: getAvatarBg(s.user_id),
        })));
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
