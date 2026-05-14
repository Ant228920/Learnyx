import { useState } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentSubscription } from '../../features/student/subscription';
import type { PackagePlan } from '../../features/student/subscription';
import { studentApi } from '../../services/api';

const PLAN_FEATURES = ['Доступ до всіх лекцій 24/7', 'Стандартна підтримка куратора', 'Доступ через мобільний додаток', 'Сертифікат про завершення курсу'];
const SUBJECT_OPTIONS = [
  { value: 'english', label: 'Англійська мова' },
  { value: 'math', label: 'Математика' },
  { value: 'ukrainian', label: 'Українська мова' },
  { value: 'history', label: 'Історія України' },
  { value: 'informatics', label: 'Інформатика' },
];
const FEATURES = [
  'Безлімітний доступ до лекцій 24/7', 'Персоналізована траєкторія навчання',
  'Знижки на офлайн-заходи партнерів', 'Участь у закритих вебінарах',
  'Доступ до ком\'юніті студентів', 'Завантаження матеріалів',
];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function StudentSubscription() {
  const { subData, plans, loading, error, purchase, moneyBalance, bonusDiscountPct, topUp } = useStudentSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PackagePlan | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpCustom, setTopUpCustom] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState('');
  const [showLearningReq, setShowLearningReq] = useState(false);
  const [lrSubject, setLrSubject] = useState('english');
  const [lrLevel, setLrLevel] = useState('');
  const [lrDays, setLrDays] = useState('');
  const [lrTime, setLrTime] = useState('');
  const [lrNotes, setLrNotes] = useState('');
  const [lrSending, setLrSending] = useState(false);
  const [lrSent, setLrSent] = useState(false);
  const [purchasedPackageId, setPurchasedPackageId] = useState<number | null>(null);

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const activePackage = subData?.activePackage ?? null;
  const finalPrice = selectedPlan ? Math.round(selectedPlan.price * (1 - bonusDiscountPct / 100)) : 0;
  const canAfford = !selectedPlan || moneyBalance >= finalPrice;

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      const result = await purchase(selectedPlan.id);
      setPurchasedPackageId(result?.package_id ?? null);
      setPurchased(true);
      setSelectedPlan(null);
      setShowLearningReq(true);
    } catch { /* backend error */ } finally {
      setPurchasing(false);
    }
  };

  const handleLearningReqSubmit = async () => {
    if (!lrLevel.trim()) return;
    setLrSending(true);
    try {
      await studentApi.createLearningRequest({
        subject: lrSubject,
        level: lrLevel,
        preferred_days: lrDays,
        preferred_time: lrTime,
        notes: lrNotes,
        package: purchasedPackageId,
      });
      setLrSent(true);
      setTimeout(() => { setShowLearningReq(false); setLrSent(false); }, 1800);
    } catch { /* ignore */ } finally {
      setLrSending(false);
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
      {/* Purchase success banner */}
      {purchased && (
        <div className="mb-4 mx-auto max-w-[1200px] flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#e0faea] border border-[#1a7bd9]">
          <span className="text-xl">✅</span>
          <span className="font-inter font-medium text-[#1a7bd9] text-sm">Абонемент придбано! Ваш баланс оновлено.</span>
          <button type="button" onClick={() => setPurchased(false)} className="ml-auto font-inter text-[#1a7bd9] text-sm hover:underline">×</button>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Ваша Підписка</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте тарифним планом та переглядайте деталі оплати.</p>
          </div>

          <div className="flex gap-4 flex-shrink-0">
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

        {/* Bonus banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${bonusDiscountPct > 0 ? 'bg-[#e0faea] border-[#1a7bd9]' : 'bg-[#f8f9fb] border-[#dee1e6]'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={bonusDiscountPct > 0 ? '#1a7bd9' : '#9095a1'} strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className={`font-inter font-medium text-sm ${bonusDiscountPct > 0 ? 'text-[#1a7bd9]' : 'text-[#565d6d]'}`}>
            {bonusDiscountPct > 0
              ? `У вас є бонусна знижка ${bonusDiscountPct}% на наступний абонемент`
              : 'Завершіть курс для отримання бонусу'}
          </span>
        </div>

        {/* Plans */}
        {plans.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-poppins font-bold text-slate-900 text-2xl">Оберіть свій ідеальний абонемент</h2>
              <p className="font-inter text-[#565d6d] text-base mt-1">Змінюйте план у будь-який час. Ми підберемо найкраще рішення для вашого темпу.</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {plans.map((plan, idx) => {
                const isCurrent = activePackage?.total_lessons === plan.total_lessons && !selectedPlan;
                const isSelected = selectedPlan?.id === plan.id;
                const isPopular = idx === 1;
                return (
                  <div key={plan.id} className={`relative flex flex-col gap-5 p-6 bg-white rounded-2xl border-2 transition-all ${isCurrent || isSelected ? 'border-[#1f8cf9]' : 'border-[#dee1e6]'}`}>
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 bg-[#f5a83d] rounded-full font-inter font-bold text-white text-[10px] uppercase whitespace-nowrap">Найпопулярніший</span>
                      </div>
                    )}
                    <div>
                      <p className="font-poppins font-bold text-slate-900 text-2xl">{plan.name}</p>
                      <p className="font-inter text-[#565d6d] text-sm mt-1">{plan.total_lessons} занять</p>
                    </div>
                    <div>
                      <span className="font-inter font-black text-slate-900 text-3xl">₴{plan.price}</span>
                      <span className="font-inter text-[#565d6d] text-sm"> /міс</span>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {PLAN_FEATURES.map(f => (
                        <li key={f} className="flex items-center gap-2 font-inter text-[#565d6d] text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelectedPlan(isSelected ? null : plan)}
                      className="py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isCurrent ? 'Поточний' : isSelected ? 'Вибрано' : 'Вибрати'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

          {selectedPlan && (
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#dee1e6] p-6 flex flex-col gap-5 sticky top-24 animate-fade-in">
              <div>
                <h3 className="font-poppins font-bold text-slate-900 text-xl">Оформлення</h3>
                <p className="font-inter text-[#565d6d] text-sm mt-1">Оплата з балансу гаманця</p>
              </div>

              {/* Order summary */}
              <div className="flex flex-col gap-2 py-3 border-y border-[#dee1e6]">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-[#565d6d] text-sm">План ({selectedPlan.total_lessons} занять)</span>
                  <span className="font-inter font-bold text-slate-900 text-sm">₴{selectedPlan.price}</span>
                </div>
                {bonusDiscountPct > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-[#565d6d] text-sm">Знижка {bonusDiscountPct}%</span>
                    <span className="font-inter font-bold text-green-600 text-sm">-₴{selectedPlan.price - finalPrice}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-[#f4f4f6]">
                  <span className="font-inter font-bold text-slate-800 text-sm">До сплати</span>
                  <span className="font-inter font-black text-slate-900 text-xl">₴{finalPrice}</span>
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-[#f8f9fb] rounded-xl">
                <span className="font-inter text-[#565d6d] text-sm">Баланс гаманця</span>
                <span className={`font-inter font-bold text-sm ${canAfford ? 'text-slate-900' : 'text-[#e64c4c]'}`}>
                  ₴{moneyBalance.toLocaleString('uk')}
                </span>
              </div>

              {/* Insufficient funds warning */}
              {!canAfford && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span className="font-inter text-[#e64c4c] text-xs">Недостатньо коштів. Поповніть гаманець.</span>
                </div>
              )}

              <button
                type="button"
                disabled={purchasing || !canAfford}
                onClick={() => void handlePurchase()}
                className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Обробка...' : 'Купити абонемент →'}
              </button>

              {!canAfford && (
                <button
                  type="button"
                  onClick={() => setShowTopUp(true)}
                  className="w-full py-2.5 border border-[#1f8cf9] rounded-xl font-inter font-medium text-[#1f8cf9] text-sm hover:bg-blue-50 transition-colors"
                >
                  Поповнити гаманець
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span className="font-inter text-[#9095a1] text-xs">Безпечна оплата</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learning request modal */}
      {showLearningReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl p-8 flex flex-col gap-5">
            {lrSent ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <span className="text-4xl">✅</span>
                <p className="font-poppins font-bold text-slate-900 text-xl text-center">Запит надіслано!</p>
                <p className="font-inter text-[#565d6d] text-sm text-center">Менеджер підбере викладача та зв'яжеться з вами.</p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="font-poppins font-bold text-slate-900 text-xl">Запит на підбір викладача</h2>
                  <p className="font-inter text-[#565d6d] text-sm mt-1">Вкажіть параметри — менеджер підбере найкращого викладача.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="lr-subject" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Предмет</label>
                    <select
                      id="lr-subject"
                      value={lrSubject}
                      onChange={e => setLrSubject(e.target.value)}
                      className="border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
                    >
                      {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="lr-level" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Рівень <span className="text-red-400">*</span></label>
                    <input
                      id="lr-level"
                      type="text"
                      value={lrLevel}
                      onChange={e => setLrLevel(e.target.value)}
                      placeholder="напр. B1, 7 клас, початківець…"
                      className="border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="lr-days" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Зручні дні</label>
                      <input
                        id="lr-days"
                        type="text"
                        value={lrDays}
                        onChange={e => setLrDays(e.target.value)}
                        placeholder="пн, ср, пт"
                        className="border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="lr-time" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Зручний час</label>
                      <input
                        id="lr-time"
                        type="text"
                        value={lrTime}
                        onChange={e => setLrTime(e.target.value)}
                        placeholder="16:00 – 19:00"
                        className="border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="lr-notes" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Побажання</label>
                    <textarea
                      id="lr-notes"
                      rows={3}
                      value={lrNotes}
                      onChange={e => setLrNotes(e.target.value)}
                      placeholder="Будь-які додаткові побажання…"
                      className="border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowLearningReq(false)}
                    className="flex-1 py-3 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors"
                  >
                    Пропустити
                  </button>
                  <button
                    type="button"
                    disabled={lrSending || !lrLevel.trim()}
                    onClick={() => void handleLearningReqSubmit()}
                    className="flex-1 py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {lrSending ? 'Надсилання...' : 'Надіслати запит'}
                  </button>
                </div>
              </>
            )}
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

            <p className="font-inter text-[#565d6d] text-sm text-center">Емуляція платежу (тестовий режим)</p>

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
