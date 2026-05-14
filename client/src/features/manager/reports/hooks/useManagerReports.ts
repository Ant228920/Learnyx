import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { LessonArchiveItem } from '../types';

function mapLesson(raw: Record<string, unknown>, idx: number): LessonArchiveItem {
  const startTime = raw.start_time as string | undefined;
  const date = startTime
    ? new Date(startTime).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const time = startTime
    ? new Date(startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    : '—';
  return {
    id: (raw.id as number) ?? idx,
    date,
    time,
    subject: (raw.subject as string) || '—',
    teacher: (raw.teacher_name as string) || '—',
    student: (raw.student_name as string) || '—',
    status: (raw.status as string) ?? '—',
  };
}

export function useManagerReports() {
  const [lessons, setLessons] = useState<LessonArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (params?: {
    date_from?: string; date_to?: string; status?: string; teacher_id?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const raw = await managerApi.getLessonArchive(params);
      const arr: Record<string, unknown>[] = Array.isArray(raw) ? raw : ((raw as { results?: unknown[] })?.results ?? []);
      setLessons(arr.map((item, i) => mapLesson(item, i)));
    } catch (e) {
      console.error('Reports error:', e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { lessons, loading, error, refetch: fetch };
}
