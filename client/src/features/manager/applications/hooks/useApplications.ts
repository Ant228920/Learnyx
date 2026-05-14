import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
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
function mapRequest(r: any): Application {
  return {
    id: r.id,
    name: r.full_name ?? '—',
    role: r.role === 'student' ? 'Учень' : 'Вчитель',
    subject: r.subject ?? '—',
    level: r.level ?? '—',
    email: r.email ?? '—',
    phone: r.phone ?? '—',
    telegram: r.telegram_nickname ?? '—',
    date: formatDate(r.created_at),
    avatarBg: avatarBg(r.id),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requests: any[] = await managerApi.getRegistrationRequests();
      setData(requests.map(mapRequest));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const approve = async (id: number) => {
    try {
      await managerApi.approveUser(id);
      setData(prev => prev.filter(a => a.id !== id));
    } catch (e) { showError('Помилка: ' + extractErrorMessage(e)); throw e; }
  };

  const reject = async (id: number) => {
    try {
      await managerApi.rejectUser(id);
      setData(prev => prev.filter(a => a.id !== id));
    } catch (e) { showError('Помилка: ' + extractErrorMessage(e)); throw e; }
  };

  return { data, loading, error, refetch: fetch, approve, reject };
}
