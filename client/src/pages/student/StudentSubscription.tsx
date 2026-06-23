import { useState } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentSubscription } from '../../features/student/subscription';
import { apiClient, extractErrorMessage } from '../../services/api';
const FEATURES = [
  'Безлімітний доступ до лекцій 24/7', 'Персоналізована траєкторія навчання',
  'Знижки на офлайн-заходи партнерів', 'Участь у закритих вебінарах',
  'Доступ до ком\'юніті студентів', 'Завантаження матеріалів',
];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const DEFAULT_PLANS = [
  {
    id: 1,
    total_lessons: 8,
    final_price: '2400',
    description: 'Базовий пакет для початку навчання',
    features: ['8 індивідуальних уроків', 'Доступ до матеріалів', 'Чат з викладачем'],
    popular: false,
  },
  {
    id: 2,
    total_lessons: 10,
    final_price: '2900',
    description: 'Найпопулярніший вибір студентів',
    features: ['10 індивідуальних уроків', 'Доступ до матеріалів', 'Чат з викладачем', 'Домашні завдання'],
    popular: true,
  },
  {
    id: 3,
    total_lessons: 12,
    final_price: '3400',
    description: 'Максимальний результат за мінімальну ціну',
    features: ['12 індивідуальних уроків', 'Доступ до матеріалів', 'Чат з викладачем', 'Домашні завдання', 'Бонус кешбек'],
    popular: false,
  },
];

const PLAN_FEATURES: Record<number, string[]> = {
  8:  DEFAULT_PLANS[0].features,
  10: DEFAULT_PLANS[1].features,
  12: DEFAULT_PLANS[2].features,
};

export default function StudentSubscription() {
  const { subData, plans, loading, error, moneyBalance, bonusDiscountPct, topUp, refetch } = useStudentSubscription();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpCustom, setTopUpCustom] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState('');
  const [selectedBonus, setSelectedBonus] = useState(0);

  // Derive display plans from PackagePlan catalog (hook fetches GET /packages/)
  const displayPlans = plans.filter(p => [8, 10, 12].includes(p.total_lessons)).length > 0
    ? plans
        .filter(p => [8, 10, 12].includes(p.total_lessons))
        .map((p, idx) => ({
          id: p.id,
          total_lessons: p.total_lessons,
          final_price: String(p.price).replace(/\.00$/, ''),
          description: p.description || DEFAULT_PLANS[idx]?.description || '',
          features: PLAN_FEATURES[p.total_lessons] ?? DEFAULT_PLANS[idx]?.features ?? [],
          popular: idx === 1,
        }))
    : DEFAULT_PLANS;

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const activePackage = subData?.activePackage ?? null;
  const availableBonus = Math.min(bonusDiscountPct, 15);

  const handlePurchase = async (plan: typeof displayPlans[0]) => {
    setPurchasing(plan.id);
    setPurchaseError('');
    try {
      const res = await apiClient.post(`/package-plans/${plan.id}/purchase/`, {
        bonus_discount_pct: selectedBonus || 0,
      });
      const data = res.data as { total_lessons?: number; message?: string };
      setPurchaseSuccess(data.message ?? `Абонемент на ${data.total_lessons ?? plan.total_lessons} уроків успішно придбано!`);
      await refetch();
    } catch (err) {
      setPurchaseError(extractErrorMessage(err));
    } finally {
      setPurchasing(null);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpCustom);
    if (!amount || amount <= 0 || amount > 10000) return;
    setTopUpLoading(true);
    try {
      const result = await topUp(amount);
      setTopUpMsg(result.message);
      setTopUpCustom('');
      setTimeout(() => { setTopUpMsg(''); setShowTopUp(false); }, 2000);
    } catch { /* ignore */ } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Ваша Підписка</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте тарифним планом та переглядайте деталі оплати.</p>
          </div>

          <div className="flex gap-4 flex-shrink-0 items-start">
            {/* Current plan card */}
            {activePackage && (
              <div className="w-64 bg-white rounded-2xl border border-[#dee1e6] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full font-inter font-bold text-xs bg-[#e0faea] text-[#1a7bd9]">Активний</span>
                  <div className="text-right">
                    <p className="font-inter text-[#565d6d] text-xs">залишилось</p>
                    <p className="font-inter font-black text-slate-900 text-2xl">{activePackage.balance} / {activePackage.total_lessons}</p>
                  </div>
                </div>
                <p className="font-poppins font-bold text-[#1f8cf9] text-sm">Абонемент: {activePackage.label}</p>
                {activePackage.purchased_at && (
                  <div className="flex items-center gap-2 mt-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className="font-inter text-[#565d6d] text-xs">Куплено: {new Date(activePackage.purchased_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Wallet card */}
            <div className="w-52 bg-white rounded-2xl border border-[#dee1e6] p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                <p className="font-inter font-bold text-slate-900 text-sm">Мій гаманець</p>
              </div>
              <p className="font-inter font-black text-slate-900 text-3xl">₴{moneyBalance.toLocaleString('uk')}</p>
              <button
                type="button"
                onClick={() => setShowTopUp(true)}
                className="w-full py-2 border border-[#1f8cf9] rounded-xl font-inter font-medium text-[#1f8cf9] text-sm hover:bg-blue-50 transition-colors"
              >
                Поповнити
              </button>
            </div>
          </div>
        </div>

        {/* Subscription plan cards */}
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-poppins font-bold text-slate-900 text-2xl">Оберіть свій ідеальний абонемент</h2>
            <p className="font-inter text-[#565d6d] text-base mt-1">Змінюйте план у будь-який час. Ми підберемо найкраще рішення для вашого темпу.</p>
          </div>

          {/* Bonus info card */}
          {availableBonus > 0 ? (
            <div className="p-5 bg-gradient-to-r from-[#1f8cf9]/10 to-[#00c896]/10 border border-[#1f8cf9]/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#1f8cf9] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-inter font-bold text-[#171a1f] text-base">
                    У вас є бонус {availableBonus}% 🎉
                  </p>
                  <p className="font-inter text-[#565d6d] text-sm">
                    Застосуйте знижку при покупці наступного абонементу
                  </p>
                </div>
                <label className="flex items-center gap-2 font-inter text-sm text-slate-800 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedBonus > 0}
                    onChange={e => setSelectedBonus(e.target.checked ? availableBonus : 0)}
                    className="w-4 h-4 accent-[#1f8cf9]"
                  />
                  Застосувати {availableBonus}%
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {displayPlans.map(plan => {
                  const originalPrice = Number(plan.final_price);
                  const discount = Math.round(originalPrice * availableBonus / 100);
                  const discountedPrice = originalPrice - discount;
                  return (
                    <div key={plan.id} className="bg-white rounded-xl p-3 border border-[#1f8cf9]/20">
                      <p className="font-inter font-semibold text-[#171a1f] text-sm">{plan.total_lessons} занять</p>
                      <p className="font-inter text-[#9095a1] text-xs line-through mt-1">₴{originalPrice}</p>
                      <p className="font-inter font-bold text-[#1f8cf9] text-lg">₴{discountedPrice}</p>
                      <p className="font-inter text-[#00c896] text-xs font-semibold">Економія ₴{discount}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#f4f4f6] border border-[#dee1e6] rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#dee1e6] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-inter font-semibold text-[#565d6d] text-sm">Бонусів поки немає</p>
                  <p className="font-inter text-[#9095a1] text-xs">
                    Виконуйте домашні завдання вчасно і отримуйте оцінки 8-10 щоб заробити знижку 5-15% на наступний абонемент
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex-1 text-center p-2 bg-white rounded-xl border border-[#dee1e6]">
                  <p className="font-inter font-bold text-[#1f8cf9] text-sm">5%</p>
                  <p className="font-inter text-[#9095a1] text-xs">від 50% балів</p>
                </div>
                <div className="flex-1 text-center p-2 bg-white rounded-xl border border-[#dee1e6]">
                  <p className="font-inter font-bold text-[#1f8cf9] text-sm">10%</p>
                  <p className="font-inter text-[#9095a1] text-xs">від 70% балів</p>
                </div>
                <div className="flex-1 text-center p-2 bg-white rounded-xl border border-[#dee1e6]">
                  <p className="font-inter font-bold text-[#1f8cf9] text-sm">15%</p>
                  <p className="font-inter text-[#9095a1] text-xs">від 90% балів</p>
                </div>
              </div>
            </div>
          )}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {displayPlans.map(plan => (
              <div key={plan.id}
                className={`flex flex-col gap-4 p-6 bg-white rounded-2xl border transition-all ${
                  plan.popular ? 'border-[#1f8cf9] shadow-[0px_4px_24px_#1f8cf920]' : 'border-[#dee1e6]'
                }`}>
                {plan.popular && (
                  <span className="px-3 py-1 bg-[#1f8cf9] text-white font-inter font-bold text-xs rounded-full w-fit">
                    Найпопулярніший
                  </span>
                )}
                <div>
                  <p className="font-poppins font-bold text-slate-900 text-2xl">{plan.total_lessons} уроків</p>
                  <p className="font-inter text-[#565d6d] text-sm mt-1">{plan.description}</p>
                </div>
                {selectedBonus > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="font-inter text-[#9095a1] text-lg line-through">₴{plan.final_price}</span>
                    <span className="font-poppins font-bold text-[#1f8cf9] text-3xl">
                      ₴{Math.round(Number(plan.final_price) * (1 - selectedBonus / 100))}
                    </span>
                  </div>
                ) : (
                  <p className="font-poppins font-bold text-[#1f8cf9] text-3xl">₴{plan.final_price}</p>
                )}
                <ul className="flex flex-col gap-2">
                  {plan.features?.map(f => (
                    <li key={f} className="flex items-center gap-2 font-inter text-sm text-slate-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button type="button"
                  onClick={() => void handlePurchase(plan)}
                  disabled={purchasing === plan.id}
                  className="mt-auto py-3 w-full bg-[#1f8cf9] rounded-xl font-inter font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {purchasing === plan.id ? 'Обробка...' : 'Придбати'}
                </button>
              </div>
            ))}
          </div>
          {purchaseError && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 w-full max-w-lg mx-auto">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="font-inter text-sm text-red-600">{purchaseError}</p>
              </div>
              {purchaseError.includes('коштів') && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 w-full max-w-lg mx-auto">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" className="flex-shrink-0">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span className="font-inter text-sm text-[#1f8cf9] flex-1">Ваш баланс: ₴{moneyBalance.toLocaleString('uk')}</span>
                  <button type="button" onClick={() => setShowTopUp(true)}
                    className="px-3 py-1.5 bg-[#1f8cf9] rounded-lg font-inter font-medium text-white text-xs hover:bg-blue-600 transition-colors">
                    Поповнити
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features + Payment */}
        <div className="flex items-start gap-8">
          <div className="flex flex-col gap-4 flex-1">
            <h3 className="font-poppins font-bold text-slate-900 text-xl">Що ви отримуєте з кожним абонементом</h3>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#dee1e6]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  <span className="font-inter text-slate-800 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
 
      {/* Purchase success modal */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPurchaseSuccess('')} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">{purchaseSuccess}</p>
            <button type="button" onClick={() => setPurchaseSuccess('')}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}


      {/* Top-up modal */}
      {showTopUp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowTopUp(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Поповнення балансу</h2>
              <button
                type="button"
                onClick={() => setShowTopUp(false)}
                aria-label="Закрити"
                title="Закрити"
                className="text-[#9095a1] hover:text-slate-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p className="font-inter text-[#565d6d] text-sm text-center">Поповнення балансу</p>

            {/* Quick amounts */}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpCustom(String(amt))}
                  className={`py-2.5 rounded-xl font-inter font-bold text-sm border transition-colors ${topUpCustom === String(amt) ? 'bg-[#1f8cf9] text-white border-[#1f8cf9]' : 'border-[#dee1e6] text-slate-700 hover:border-[#1f8cf9] hover:text-[#1f8cf9]'}`}
                >
                  ₴{amt.toLocaleString('uk')}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex flex-col gap-1">
              <label htmlFor="topup-amount" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Своя сума</label>
              <input
                id="topup-amount"
                type="number"
                min="1"
                max="10000"
                value={topUpCustom}
                onChange={e => setTopUpCustom(e.target.value)}
                placeholder="Введіть суму (макс. ₴10 000)"
                className="w-full border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            {topUpMsg && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#e0faea] rounded-xl">
                <span className="text-lg">✅</span>
                <span className="font-inter font-medium text-[#1a7bd9] text-sm">{topUpMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={topUpLoading || !topUpCustom || parseFloat(topUpCustom) <= 0}
              onClick={() => void handleTopUp()}
              className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {topUpLoading ? 'Обробка...' : 'Поповнити баланс'}
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
