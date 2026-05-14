import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import type { Slot } from '../../../../services/api';
import type { TeacherStudent } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

export interface AvailableStudent {
  id: number;
  name: string;
  email: string;
  lessons_balance: number;
  avatarBg: string;
}

export function useTeacherStudents() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRaw, slotsRaw] = await Promise.all([
        teacherApi.getStudents(),
        teacherApi.getSlots(),
      ]);
      const mapped: TeacherStudent[] = studentsRaw.map(u => ({
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
      setSlots(slotsRaw);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const selectSlot = useCallback(async (slotId: number) => {
    setSelectedSlotId(slotId);
    setAvailableStudents([]);
    try {
      const raw = await teacherApi.getAvailableStudents(slotId);
      const arr = Array.isArray(raw) ? raw : (raw?.results ?? []);
      const mapped: AvailableStudent[] = (arr as Array<{ user_id: number; first_name: string; last_name: string; email: string; lessons_balance: number }>).map(u => ({
        id: u.user_id,
        name: `${u.first_name} ${u.last_name}`.trim(),
        email: u.email,
        lessons_balance: u.lessons_balance,
        avatarBg: avatarBg(u.user_id),
      }));
      setAvailableStudents(mapped);
    } catch {
      setAvailableStudents([]);
    }
  }, []);

  const assignStudent = useCallback(async (slotId: number, studentId: number) => {
    await teacherApi.assignLesson({ slot: slotId, student: studentId });
    setSelectedSlotId(null);
    setAvailableStudents([]);
    await fetch();
  }, [fetch]);

  return { students, slots, selectedSlotId, availableStudents, loading, error, refetch: fetch, selectSlot, assignStudent };
}
