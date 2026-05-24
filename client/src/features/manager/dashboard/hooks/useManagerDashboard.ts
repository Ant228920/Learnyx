import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { ManagerDashboardData, DashboardRegistration } from '../types';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function avatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function formatDate(raw?: string): string {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRegistration(u: any, role: DashboardRegistration['role']): DashboardRegistration {
  return {
    id: u.user_id ?? u.id ?? 0,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
    role,
    subject: u.subject ?? u.discipline ?? '—',
    phone: u.phone ?? '—',
    email: u.email ?? '—',
    telegram: u.telegram_nickname ?? '—',
    level: u.level ?? '—',
    date: formatDate(u.created_at),
    avatarBg: avatarBg(u.user_id ?? u.id ?? 0),
  };
}

export function useManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [students, teachers] = await Promise.all([
        managerApi.getStudents(),
        managerApi.getTeachers(),
      ]);
      const recent: DashboardRegistration[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(students as any[]).slice(0, 3).map(u => toRegistration(u, 'Студент')),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(teachers as any[]).slice(0, 2).map(u => toRegistration(u, 'Вчитель')),
      ];
      setData({
        totalStudents: (students as unknown[]).length,
        totalTeachers: (teachers as unknown[]).length,
        recentRegistrations: recent,
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
