import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import type { PackageItem, SubscriptionData, PackagePlan } from '../types';

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
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moneyBalance, setMoneyBalance] = useState(0);
  const [bonusDiscountPct, setBonusDiscountPct] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [packagesRaw, plansRaw, walletRaw] = await Promise.all([
        studentApi.getPackages(),
        studentApi.getPackagePlans(),
        studentApi.getWallet(),
      ]);
      const pkgArray = Array.isArray(packagesRaw) ? packagesRaw : (packagesRaw ? [packagesRaw] : []);
      const mapped = pkgArray.map((p, i) => mapPackage(p, i));
      const active = mapped.find(p => p.status === 'active') ?? null;
      const discountPct = walletRaw?.bonus_discount_pct ?? 0;
      setSubData({ activePackage: active, packages: mapped, discountPct });
      setPlans(plansRaw);
      setMoneyBalance(walletRaw?.money_balance ?? 0);
      setBonusDiscountPct(discountPct);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const topUp = useCallback(async (amount: number) => {
    const result = await studentApi.topUp(amount);
    setMoneyBalance(result.money_balance);
    return result;
  }, []);

  const purchase = useCallback(async (planId: number) => {
    const result = await studentApi.purchasePlan(planId);
    if (result.money_balance !== undefined) {
      setMoneyBalance(result.money_balance);
    }
    await fetch();
    return result;
  }, [fetch]);

  return { subData, plans, loading, error, refetch: fetch, purchase, moneyBalance, bonusDiscountPct, topUp };
}
