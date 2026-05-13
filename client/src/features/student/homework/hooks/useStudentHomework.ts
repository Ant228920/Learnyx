import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import type { StudentHomeworkTask } from '../types';

function formatDeadline(iso?: string): string {
  if (!iso) return 'До —';
  const d = new Date(iso);
  return `До ${d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}, ${d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
}

export function useStudentHomework() {
  const [homeworks, setHomeworks] = useState<StudentHomeworkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const journal = await studentApi.getJournal();
      const tasks: StudentHomeworkTask[] = journal
        .filter(j => j.teacher_homework_task && j.teacher_homework_task.trim() !== '')
        .map(j => ({
          id: j.id,
          lessonId: j.lesson,
          subject: '—',
          title: j.teacher_homework_task,
          description: j.teacher_homework_task,
          deadline: formatDeadline(j.start_time),
          deadlineDate: j.start_time ? new Date(j.start_time) : new Date(),
          urgent: false,
          answerUrl: j.homework_answer_url || undefined,
        }));
      setHomeworks(tasks);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { homeworks, loading, error, refetch: fetch };
}
