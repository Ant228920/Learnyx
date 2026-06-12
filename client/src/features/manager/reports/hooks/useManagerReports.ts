import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { LessonArchiveItem } from '../types';

function mapLesson(raw: Record<string, unknown>, idx: number): LessonArchiveItem {
  const startTime = raw.start_time as string | undefined;
  const d = startTime ? new Date(startTime) : null;
  const date = d
    ? `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
    : '—';
  const time = d
    ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
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
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { lessons, loading, error, refetch: fetch };
}
