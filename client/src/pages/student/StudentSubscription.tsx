import { useState } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentSubscription } from '../../features/student/subscription';
import type { PackagePlan } from '../../features/student/subscription';

const PLAN_FEATURES = ['Доступ до всіх лекцій 24/7', 'Стандартна підтримка куратора', 'Доступ через мобільний додаток', 'Сертифікат про завершення курсу'];
const FEATURES = [
  'Безлімітний доступ до лекцій 24/7', 'Персоналізована траєкторія навчання',
  'Знижки на офлайн-заходи партнерів', 'Участь у закритих вебінарах',
  'Доступ до ком\'юніті студентів', 'Завантаження матеріалів',
];

export default function StudentSubscription() {
  const { subData, plans, loading, error, purchase } = useStudentSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PackagePlan | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const activePackage = subData?.activePackage ?? null;
  const discountPct = subData?.discountPct ?? 0;
  const finalPrice = selectedPlan ? Math.round(selectedPlan.price * (1 - discountPct / 100)) : 0;

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      await purchase(selectedPlan.id);
      setSelectedPlan(null);
    } catch { /* hook error */ } finally {
      setPurchasing(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Ваша Підписка</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте тарифним планом та переглядайте деталі оплати.</p>
          </div>
          {/* Current plan card */}
          {activePackage && (
            <div className="flex-shrink-0 w-72 bg-white rounded-2xl border border-[#dee1e6] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full font-inter font-bold text-xs bg-[#e0faea] text-[#1a7bd9]">Активний</span>
                <div className="text-right">
                  <p className="font-inter text-[#565d6d] text-xs">залишилось занять</p>
                  <p className="font-inter font-black text-slate-900 text-2xl">{activePackage.balance} / {activePackage.total_lessons}</p>
                </div>
              </div>
              <p className="font-poppins font-bold text-[#1f8cf9] text-sm">Поточний абонемент: {activePackage.label}</p>
              {activePackage.purchased_at && (
                <div className="flex items-center gap-2 mt-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="font-inter text-[#565d6d] text-xs">Дата придбання: {new Date(activePackage.purchased_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}
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
                <p className="font-inter text-[#565d6d] text-sm mt-1">Завершіть покупку, обравши метод оплати</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-[#565d6d] text-sm">План: {selectedPlan.name} ({selectedPlan.total_lessons} занять)</span>
                <span className="font-inter font-bold text-slate-900 text-sm">₴{selectedPlan.price}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Застосована знижка</label>
                  <div className="px-3 py-2.5 bg-[#e0faea] rounded-xl font-inter font-bold text-[#1a7bd9] text-sm">{discountPct}% бонусна знижка</div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Спосіб оплати</label>
                <button type="button" className="py-3 border-2 border-[#1f8cf9] rounded-xl font-inter font-medium text-[#1f8cf9] text-sm hover:bg-blue-50 transition-colors">Банківська картка</button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#dee1e6]">
                <span className="font-inter text-slate-800 text-sm">До сплати:</span>
                <span className="font-inter font-black text-slate-900 text-xl">₴{finalPrice}</span>
              </div>
              <button type="button" disabled={purchasing} onClick={() => void handlePurchase()}
                className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60">
                {purchasing ? 'Обробка...' : 'Купити абонемент →'}
              </button>
              <div className="flex items-center justify-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span className="font-inter text-[#9095a1] text-xs">Безпечна оплата згідно стандарту PCI DSS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
