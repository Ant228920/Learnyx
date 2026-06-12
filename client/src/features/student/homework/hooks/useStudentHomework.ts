import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import { formatDeadline } from '../../../../utils/date';
import type { StudentHomeworkTask } from '../types';

const hasHomework = (val: unknown): boolean => {
  if (!val) return false;
  if (typeof val === 'string') return val.trim() !== '';
  if (typeof val === 'object') return Object.keys(val as Record<string, unknown>).length > 0;
  return false;
};

const taskText = (val: unknown): string =>
  typeof val === 'string' ? val : JSON.stringify(val);

function isUrgentDeadline(nextLessonDate?: string | null): boolean {
  if (!nextLessonDate) return false;
  const hoursLeft = (new Date(nextLessonDate).getTime() - Date.now()) / (1000 * 60 * 60);
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
        .filter(j => j.package_status === 'active' || j.package_status === undefined || j.package_status === null)
        .filter(j => hasHomework(j.teacher_homework_task as unknown))
        .map(j => ({
          id: j.id,
          lessonId: j.lesson,
          subject: '',
          title: taskText(j.teacher_homework_task as unknown),
          description: taskText(j.teacher_homework_task as unknown),
          deadline: formatDeadline(j.next_lesson_date),
          deadlineDate: j.next_lesson_date ? new Date(j.next_lesson_date) : new Date(),
          urgent: !j.homework_answer_url && isUrgentDeadline(j.next_lesson_date),
          answerUrl: j.homework_answer_url || undefined,
          fileUrl: j.homework_file_url ?? undefined,
          homeworkStatus: j.homework_status ?? 'assigned',
          overdue: j.homework_overdue ?? false,
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
