import { useState, useEffect, useCallback } from 'react';
import { managerApi } from '../../../../services/api';
import type { SubscriptionsData } from '../types';

export function useManagerSubscriptions() {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await managerApi.getSubscriptions();
      setData(result as SubscriptionsData);
    } catch {
      setError('Не вдалося завантажити підписки.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error };
}
