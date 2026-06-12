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
        const r = j as unknown as Record<string, unknown>;
        const subjectName = (r.subject_name as string | null) || null;
        const lessonTopic = (r.lesson_topic as string | null) || null;
        const hwTask = typeof j.teacher_homework_task === 'string'
          ? j.teacher_homework_task
          : null;

        if (j.activity_grade != null) {
          result.push({
            id: j.id * 10,
            subject: subjectName ?? null,
            date: formatDate(j.start_time),
            topic: lessonTopic ?? null,
            type: 'Урок',
            score: j.activity_grade,
            maxScore: 10,
            teacher: null,
            feedback: j.teacher_notes || null,
          });
        }
        if (j.homework_grade != null) {
          result.push({
            id: j.id * 10 + 1,
            subject: subjectName ?? null,
            date: formatDate(j.start_time),
            topic: hwTask ?? lessonTopic ?? null,
            type: 'ДЗ',
            score: j.homework_grade,
            maxScore: 10,
            teacher: null,
            feedback: j.teacher_notes || null,
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
