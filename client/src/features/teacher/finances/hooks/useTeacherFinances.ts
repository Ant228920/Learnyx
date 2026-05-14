import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '../../../../services/api';
import type { FinancesData } from '../types';

export function useTeacherFinances() {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await teacherApi.getFinances();
      setData(result as FinancesData);
    } catch {
      setError('Не вдалося завантажити фінанси.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error };
}
