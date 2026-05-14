import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import type { GradeRecord } from '../types';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function useStudentGrades() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const journal = await studentApi.getJournal();
      const result: GradeRecord[] = [];
      journal.forEach(j => {
        if (j.activity_grade != null) {
          result.push({
            id: j.id * 10,
            subject: '—',
            date: formatDate(j.start_time),
            topic: '—',
            type: 'Урок',
            score: j.activity_grade,
            maxScore: 10,
            teacher: '—',
            feedback: j.teacher_notes || '—',
          });
        }
        if (j.homework_grade != null) {
          result.push({
            id: j.id * 10 + 1,
            subject: '—',
            date: formatDate(j.start_time),
            topic: j.teacher_homework_task || '—',
            type: 'ДЗ',
            score: j.homework_grade,
            maxScore: 10,
            teacher: '—',
            feedback: j.teacher_notes || '—',
          });
        }
      });
      setGrades(result);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { grades, loading, error, refetch: fetch };
}
