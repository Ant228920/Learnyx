import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { MatchingStudent, MatchingTeacher } from '../types';

type RawUser = { user_id?: number; id?: number; email: string; first_name: string; last_name: string; lessons_balance?: number };

export function useManagerMatching() {
  const [students, setStudents] = useState<MatchingStudent[]>([]);
  const [teachers, setTeachers] = useState<MatchingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRaw, teachersRaw] = await Promise.all([
        managerApi.getStudents(),
        managerApi.getTeachers(),
      ]);
      const toStudents = (arr: RawUser[]): MatchingStudent[] =>
        arr.map(s => ({
          id: s.user_id ?? s.id ?? 0,
          email: s.email,
          first_name: s.first_name,
          last_name: s.last_name,
          lessons_balance: s.lessons_balance ?? 0,
        }));
      const toTeachers = (arr: RawUser[]): MatchingTeacher[] =>
        arr.map(t => ({
          id: t.user_id ?? t.id ?? 0,
          email: t.email,
          first_name: t.first_name,
          last_name: t.last_name,
        }));
      setStudents(toStudents(Array.isArray(studentsRaw) ? studentsRaw : []));
      setTeachers(toTeachers(Array.isArray(teachersRaw) ? teachersRaw : []));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { students, teachers, loading, error };
}
