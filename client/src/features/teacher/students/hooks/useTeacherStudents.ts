import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import type { TeacherStudent } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

export function useTeacherStudents() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await teacherApi.getStudents();
      const mapped: TeacherStudent[] = raw.map(u => ({
        id: u.user_id,
        name: `${u.first_name} ${u.last_name}`.trim(),
        subject: '—',
        level: '—',
        status: u.lessons_balance > 0 ? 'Активний' : 'Неактивний',
        email: u.email,
        phone: '—',
        avatarBg: avatarBg(u.user_id),
        lessons_balance: u.lessons_balance,
      }));
      setStudents(mapped);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const getAvailableForSlot = useCallback(async (slotId: number) => {
    const raw = await teacherApi.getAvailableStudents(slotId);
    return raw;
  }, []);

  return { students, loading, error, refetch: fetch, getAvailableForSlot };
}
