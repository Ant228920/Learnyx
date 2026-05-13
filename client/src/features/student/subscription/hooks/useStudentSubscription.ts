import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import { useAuth } from '../../../../app/providers';
import type { PackageItem, SubscriptionData } from '../types';

function mapPackage(p: {
  id: number; discipline: string; total_lessons: number; balance: number;
  final_price: number; discount: number; status: string; purchased_at: string;
}, idx: number): PackageItem {
  return {
    id: p.id,
    label: `${p.total_lessons} занять`,
    subtitle: p.discipline || 'Абонемент',
    price: Number(p.final_price),
    popular: idx === 1,
    status: p.status as PackageItem['status'],
    balance: p.balance,
    total_lessons: p.total_lessons,
    purchased_at: p.purchased_at || null,
    discipline: p.discipline,
  };
}

export function useStudentSubscription() {
  const { user } = useAuth();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [packages, bonusRaw] = await Promise.all([
        studentApi.getPackages(),
        user ? studentApi.getBonusBalance(user.id) : Promise.resolve(null),
      ]);
      const mapped = packages.map((p, i) => mapPackage(p, i));
      const active = mapped.find(p => p.status === 'active') ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const discountPct = (bonusRaw as any)?.available_discount_pct ?? 0;
      setSubData({ activePackage: active, packages: mapped, discountPct });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void fetch(); }, [fetch]);

  const purchase = useCallback(async (packageId: number) => {
    await studentApi.purchasePackage(packageId);
    await fetch();
  }, [fetch]);

  return { subData, loading, error, refetch: fetch, purchase };
}
