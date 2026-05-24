import { useState, useEffect, useCallback } from 'react';
import { studentApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { PackageItem, SubscriptionData, PackagePlan } from '../types';

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
      const [plansRaw, balanceRaw, walletRaw] = await Promise.all([
        studentApi.getPackagePlans(),
        studentApi.getActiveBalance().catch(() => null),
        studentApi.getWallet().catch(() => null),
      ]);
      const active: PackageItem | null = balanceRaw?.package_id ? {
        id: balanceRaw.package_id,
        label: `${balanceRaw.total_lessons} занять`,
        subtitle: 'Абонемент',
        price: 0,
        popular: false,
        status: balanceRaw.status as PackageItem['status'],
        balance: balanceRaw.remaining_lessons,
        total_lessons: balanceRaw.total_lessons,
        purchased_at: null,
        discipline: '',
      } : null;
      const discountPct = walletRaw?.bonus_discount_pct ?? 0;
      setSubData({ activePackage: active, packages: active ? [active] : [], discountPct });
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
    try {
      const result = await studentApi.topUp(amount);
      setMoneyBalance(result.money_balance);
      return result;
    } catch (e) { showError('Помилка поповнення: ' + extractErrorMessage(e)); throw e; }
  }, []);

  const purchase = useCallback(async (planId: number) => {
    try {
      const result = await studentApi.purchasePlan(planId);
      if (result.money_balance !== undefined) {
        setMoneyBalance(result.money_balance);
      }
      await fetch();
      return result;
    } catch (e) { showError('Помилка платежу: ' + extractErrorMessage(e)); throw e; }
  }, [fetch]);

  return { subData, plans, loading, error, refetch: fetch, purchase, moneyBalance, bonusDiscountPct, topUp };
}
