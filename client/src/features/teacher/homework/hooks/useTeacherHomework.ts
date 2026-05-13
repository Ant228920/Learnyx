import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import type { TeacherHomeworkItem } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function formatDeadline(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function useTeacherHomework() {
  const [homeworks, setHomeworks] = useState<TeacherHomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lessons = await teacherApi.getLessons({ status: 'conducted' });
      const journals = await Promise.all(
        lessons.map(l => teacherApi.getJournalForLesson(l.id).catch(() => []))
      );
      const items: TeacherHomeworkItem[] = [];
      lessons.forEach((lesson, idx) => {
        const jList = journals[idx];
        const j = jList[0];
        if (!j || !j.teacher_homework_task) return;
        items.push({
          id: j.id,
          lessonId: lesson.id,
          student: `Студент #${lesson.student}`,
          topic: j.teacher_homework_task || '—',
          subject: '—',
          deadline: formatDeadline(j.start_time),
          status: j.homework_grade != null ? 'ПЕРЕВІРЕНО' : 'НЕ ПЕРЕВІРЕНО',
          avatarBg: avatarBg(lesson.student),
          savedComment: j.teacher_notes || '',
          savedGrade: j.homework_grade != null ? `${j.homework_grade}/10` : '',
          homeworkGrade: j.homework_grade,
          teacherNotes: j.teacher_notes,
          file: j.homework_answer_url || undefined,
        });
      });
      setHomeworks(items);
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
    await teacherApi.evaluateLesson(lessonId, payload);
    await fetch();
  }, [fetch]);

  return { homeworks, loading, error, refetch: fetch, gradeHomework };
}
