import { useState, useEffect, useCallback } from 'react';
import { managerApi, extractErrorMessage } from '../../../../services/api';
import type { LearningRequestItem } from '../../../../services/api';

export function useManagerLearningRequests() {
  const [requests, setRequests] = useState<LearningRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await managerApi.getLearningRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const updateStatus = useCallback(async (id: number, status: string) => {
    const updated = await managerApi.updateLearningRequest(id, status);
    setRequests(prev => prev.map(r => (r.id === id ? updated : r)));
    return updated;
  }, []);

  return { requests, loading, error, refetch: fetch, updateStatus };
}
