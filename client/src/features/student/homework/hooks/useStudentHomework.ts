import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import type { StudentHomeworkTask } from '../types';

function formatDeadline(lessonStartTime?: string): string {
  if (!lessonStartTime) return 'До —';
  const lessonDate = new Date(lessonStartTime);
  const deadline = new Date(lessonDate);
  deadline.setDate(lessonDate.getDate() + 2);
  return `До ${deadline.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}`;
}

const hasHomework = (val: unknown): boolean => {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() !== '';
  if (typeof val === 'object') return Object.keys(val as Record<string, unknown>).length > 0;
  return false;
};

const taskText = (val: unknown): string =>
  typeof val === 'string' ? val : JSON.stringify(val);

function isUrgentDeadline(lessonStartTime?: string): boolean {
  if (!lessonStartTime) return false;
  const lessonDate = new Date(lessonStartTime);
  const deadline = new Date(lessonDate);
  deadline.setDate(lessonDate.getDate() + 2);
  const hoursLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursLeft <= 24 && hoursLeft > 0;
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
        .filter(j => hasHomework(j.teacher_homework_task as unknown))
        .map(j => ({
          id: j.id,
          lessonId: j.lesson,
          subject: '—',
          title: taskText(j.teacher_homework_task as unknown),
          description: taskText(j.teacher_homework_task as unknown),
          deadline: formatDeadline(j.start_time),
          deadlineDate: (() => {
            const d = j.start_time ? new Date(j.start_time) : new Date();
            d.setDate(d.getDate() + 2);
            return d;
          })(),
          urgent: !j.homework_answer_url && isUrgentDeadline(j.start_time),
          answerUrl: j.homework_answer_url || undefined,
          fileUrl: (j as Record<string, unknown>).homework_file_url as string | undefined || undefined,
          homeworkStatus: j.homework_status ?? 'assigned',
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
