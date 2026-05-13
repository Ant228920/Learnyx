import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { Application } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function formatDate(raw?: string): string {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudent(u: any): Application {
  return {
    id: u.user_id ?? u.id ?? 0,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
    role: 'Учень',
    subject: u.subject ?? u.discipline ?? '—',
    level: u.level ?? '—',
    email: u.email ?? '—',
    phone: u.phone ?? '—',
    telegram: u.telegram_nickname ?? '—',
    date: formatDate(u.created_at),
    avatarBg: avatarBg(u.user_id ?? u.id ?? 0),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeacher(u: any): Application {
  return {
    id: u.user_id ?? u.id ?? 0,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
    role: 'Вчитель',
    subject: u.subject ?? u.discipline ?? '—',
    level: u.level ?? '—',
    email: u.email ?? '—',
    phone: u.phone ?? '—',
    telegram: u.telegram_nickname ?? '—',
    date: formatDate(u.created_at),
    avatarBg: avatarBg(u.user_id ?? u.id ?? 0),
  };
}

export function useApplications() {
  const [data, setData] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [students, teachers] = await Promise.all([
        managerApi.getStudents({ is_approved: false }),
        managerApi.getTeachers(),
      ]);
      const mapped: Application[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(students as any[]).map(mapStudent),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(teachers as any[]).map(mapTeacher),
      ];
      setData(mapped);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const approve = async (id: number) => {
    await managerApi.approveUser(id);
    setData(prev => prev.filter(a => a.id !== id));
  };

  const reject = async (id: number) => {
    await managerApi.rejectUser(id);
    setData(prev => prev.filter(a => a.id !== id));
  };

  return { data, loading, error, refetch: fetch, approve, reject };
}
