import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { TeacherHomeworkItem } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function formatDeadline(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export interface PendingLesson {
  id: number;
  studentId: number;
  studentLabel: string;
}

export function useTeacherHomework() {
  const [homeworks, setHomeworks] = useState<TeacherHomeworkItem[]>([]);
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [conductedLessons, scheduledLessons] = await Promise.all([
        teacherApi.getLessons({ status: 'conducted' }),
        teacherApi.getLessons({ status: 'scheduled' }),
      ]);

      // Assigned homework: conducted lessons that have a homework task set
      const journals = await Promise.all(
        conductedLessons.map(l => teacherApi.getJournalForLesson(l.id).catch(() => []))
      );
      const items: TeacherHomeworkItem[] = [];
      conductedLessons.forEach((lesson, idx) => {
        const j = journals[idx]?.[0];
        if (!j || typeof j.teacher_homework_task !== 'string' || !j.teacher_homework_task) return;
        items.push({
          id: j.id,
          lessonId: lesson.id,
          student: lesson.student_name || `Студент #${lesson.student}`,
          topic: j.teacher_homework_task,
          subject: '—',
          deadline: formatDeadline(j.start_time),
          status: j.homework_grade != null ? 'ПЕРЕВІРЕНО' : 'НЕ ПЕРЕВІРЕНО',
          avatarBg: avatarBg(lesson.student),
          savedComment: j.teacher_notes || '',
          savedGrade: j.homework_grade != null ? `${j.homework_grade}/10` : '',
          homeworkGrade: j.homework_grade,
          teacherNotes: j.teacher_notes ?? undefined,
          file: j.homework_answer_url || undefined,
        });
      });

      // Pending: scheduled lessons (upcoming, homework not yet assigned)
      const pending: PendingLesson[] = scheduledLessons.map(lesson => ({
        id: lesson.id,
        studentId: lesson.student,
        studentLabel: lesson.student_name || `Студент #${lesson.student}`,
      }));

      setHomeworks(items);
      setPendingLessons(pending);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const gradeHomework = useCallback(async (
    lessonId: number,
    payload: { is_present: boolean; homework_grade?: number; teacher_notes?: string }
  ) => {
    try {
      await teacherApi.evaluateLesson(lessonId, payload);
      await fetch();
    } catch (e) { showError('Помилка збереження оцінки: ' + extractErrorMessage(e)); throw e; }
  }, [fetch]);

  const setHomework = useCallback(async (lessonId: number, task: string, answerUrl?: string) => {
    try {
      await teacherApi.setHomework(lessonId, { teacher_homework_task: task, homework_answer_url: answerUrl });
      await fetch();
    } catch (e) { showError('Помилка збереження ДЗ: ' + extractErrorMessage(e)); throw e; }
  }, [fetch]);

  return { homeworks, pendingLessons, loading, error, refetch: fetch, gradeHomework, setHomework };
}
