import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { LessonsByDay, UpcomingLesson } from '../types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso: string): number {
  return new Date(iso).getDate();
}

export function useStudentSchedule() {
  const [lessonsByDay, setLessonsByDay] = useState<LessonsByDay>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await studentApi.getUpcomingLessons();
      const map: LessonsByDay = {};
      for (const l of raw) {
        const day = dayOf(l.slot.start_time);
        const item: UpcomingLesson = {
          id: l.id,
          start_time: l.slot.start_time,
          end_time: l.slot.end_time,
          status: l.status,
          meeting_link: l.meeting_link,
          timeLabel: `${formatTime(l.slot.start_time)} - ${formatTime(l.slot.end_time)}`,
        };
        if (!map[day]) map[day] = [];
        map[day].push(item);
      }
      setLessonsByDay(map);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const cancelLesson = useCallback(async (lessonId: number) => {
    try {
      await studentApi.cancelLesson(lessonId);
      setLessonsByDay(prev => {
        const next = { ...prev };
        for (const day of Object.keys(next)) {
          next[+day] = next[+day].filter(l => l.id !== lessonId);
          if (next[+day].length === 0) delete next[+day];
        }
        return next;
      });
    } catch (e) {
      const errorMessages: Record<string, string> = {
        "Cannot cancel a lesson with status 'student_missed'": "Неможливо скасувати урок зі статусом 'пропущено'",
        "Cannot cancel a lesson with status 'conducted'": "Неможливо скасувати вже проведений урок",
        "Cannot cancel a lesson with status 'canceled_advance'": "Урок вже скасовано",
      };
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showError(errorMessages[msg ?? ''] || 'Не вдалось скасувати урок');
      throw e;
    }
  }, []);

  return { lessonsByDay, loading, error, refetch: fetch, cancelLesson };
}
