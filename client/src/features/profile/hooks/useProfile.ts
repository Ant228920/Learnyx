import { useState, useEffect, useCallback } from 'react';
import { profileApi, extractErrorMessage } from '../../../services/api';
import type { ProfileData } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileApi.get();
      setProfile(data as ProfileData);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateProfile = async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    telegram_nickname?: string;
  }) => {
    setSaving(true);
    setError(null);
    try {
      await profileApi.update(data);
      setProfile(prev => prev ? { ...prev, ...data } : prev);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, error, saving, success, updateProfile };
}
