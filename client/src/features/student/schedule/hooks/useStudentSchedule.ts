import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { LessonsByDay, UpcomingLesson } from '../types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function dayOf(iso: string): number {
  return new Date(iso).getDate();
}

export function useStudentSchedule() {
  const [lessonsByDay, setLessonsByDay] = useState<LessonsByDay>({});
  const [allLessons, setAllLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await studentApi.getUpcomingLessons();
      const map: LessonsByDay = {};
      const flat: UpcomingLesson[] = [];
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
        flat.push(item);
        if (!map[day]) map[day] = [];
        map[day].push(item);
      }
      setAllLessons(flat);
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
      setAllLessons(prev => prev.filter(l => l.id !== lessonId));
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

  return { lessonsByDay, allLessons, loading, error, refetch: fetch, cancelLesson };
}
