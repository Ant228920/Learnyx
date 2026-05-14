import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { LessonArchiveItem } from '../types';

function mapLesson(raw: Record<string, unknown>, idx: number): LessonArchiveItem {
  const slot = raw.slot as { start_time?: string } | null | undefined;
  const startTime = slot?.start_time;
  const date = startTime
    ? new Date(startTime).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const time = startTime
    ? new Date(startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const studentRaw = raw.student as { first_name?: string; last_name?: string } | number | null;
  const student = typeof studentRaw === 'object' && studentRaw
    ? `${(studentRaw as { first_name?: string }).first_name ?? ''} ${(studentRaw as { last_name?: string }).last_name ?? ''}`.trim()
    : String(studentRaw ?? '—');
  return {
    id: (raw.id as number) ?? idx,
    date,
    time,
    subject: '—',
    teacher: '—',
    student: student || '—',
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
