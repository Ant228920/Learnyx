import { useState } from 'react';
import StudentLayout from './StudentLayout';

const PLANS = [
  { id: 8, label: '8 занять', subtitle: 'Гнучкий старт для новачків', price: 800, popular: false },
  { id: 12, label: '12 занять', subtitle: 'Оптимальний вибір для навчання', price: 1100, popular: true },
  { id: 15, label: '15 занять', subtitle: 'Максимальна вигода та результат', price: 1300, popular: false },
];
const FEATURES = [
  'Безлімітний доступ до лекцій 24/7', 'Персоналізована траєкторія навчання',
  'Знижки на офлайн-заходи партнерів', 'Участь у закритих вебінарах',
  'Доступ до ком\'юніті студентів', 'Завантаження матеріалів',
];
const PLAN_FEATURES = ['Доступ до всіх лекцій 24/7', 'Стандартна підтримка куратора', 'Доступ через мобільний додаток', 'Сертифікат про завершення курсу'];
const DISCOUNTS = ['Без знижки', '5% (5 бонусів)', '10% (10 бонусів)', '15% (15 бонусів)'];

export default function StudentSubscription() {
  const [currentPlan] = useState(12);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [discount, setDiscount] = useState('Без знижки');

  const plan = PLANS.find(p => p.id === (selectedPlan ?? currentPlan));
  const discountPct = discount === 'Без знижки' ? 0 : parseInt(discount);
  const finalPrice = plan ? Math.round(plan.price * (1 - discountPct / 100)) : 0;

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Ваша Підписка</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте тарифним планом та переглядайте деталі оплати.</p>
          </div>
          {/* Current plan card */}
          <div className="flex-shrink-0 w-72 bg-white rounded-2xl border border-[#dee1e6] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full font-inter font-bold text-xs bg-[#e0faea] text-[#1a7bd9]">Активний</span>
              <div className="text-right">
                <p className="font-inter text-[#565d6d] text-xs">залишилось занять</p>
                <p className="font-inter font-black text-slate-900 text-2xl">12 / 12</p>
              </div>
            </div>
            <p className="font-poppins font-bold text-[#1f8cf9] text-sm">Поточний абонемент: 12 занять</p>
            <div className="flex items-center gap-2 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span className="font-inter text-[#565d6d] text-xs">Дата придбання: 12 Травня, 2024</span>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-poppins font-bold text-slate-900 text-2xl">Оберіть свій ідеальний абонемент</h2>
            <p className="font-inter text-[#565d6d] text-base mt-1">Змінюйте план у будь-який час. Ми підберемо найкраще рішення для вашого темпу.</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {PLANS.map(p => {
              const isCurrent = p.id === currentPlan && !selectedPlan;
              const isSelected = p.id === selectedPlan;
              return (
                <div key={p.id} className={`relative flex flex-col gap-5 p-6 bg-white rounded-2xl border-2 transition-all ${isCurrent || isSelected ? 'border-[#1f8cf9]' : 'border-[#dee1e6]'}`}>
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-[#f5a83d] rounded-full font-inter font-bold text-white text-[10px] uppercase whitespace-nowrap">Найпопулярніший</span>
                    </div>
                  )}
                  <div>
                    <p className="font-poppins font-bold text-slate-900 text-2xl">{p.label}</p>
                    <p className="font-inter text-[#565d6d] text-sm mt-1">{p.subtitle}</p>
                  </div>
                  <div>
                    <span className="font-inter font-black text-slate-900 text-3xl">₴{p.price}</span>
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
                  <button type="button" onClick={() => setSelectedPlan(p.id === currentPlan && !selectedPlan ? null : p.id)}
                    className="py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">
                    {isCurrent ? 'Поточний' : isSelected ? 'Вибрано' : 'Вибрати'}
                  </button>
                </div>
              );
            })}
          </div>
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

          {selectedPlan && (
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#dee1e6] p-6 flex flex-col gap-5 sticky top-24 animate-fade-in">
              <div>
                <h3 className="font-poppins font-bold text-slate-900 text-xl">Оформлення</h3>
                <p className="font-inter text-[#565d6d] text-sm mt-1">Завершіть покупку, обравши метод оплати</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-[#565d6d] text-sm">План: {plan?.label}</span>
                <span className="font-inter font-bold text-slate-900 text-sm">₴{plan?.price}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Застосувати знижку</label>
                <div className="relative">
                  <select value={discount} onChange={e => setDiscount(e.target.value)}
                    aria-label="Застосувати знижку" title="Застосувати знижку"
                    className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] pr-8">
                    {DISCOUNTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Спосіб оплати</label>
                <button type="button" className="py-3 border-2 border-[#1f8cf9] rounded-xl font-inter font-medium text-[#1f8cf9] text-sm hover:bg-blue-50 transition-colors">Банківська картка</button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#dee1e6]">
                <span className="font-inter text-slate-800 text-sm">До сплати:</span>
                <span className="font-inter font-black text-slate-900 text-xl">₴{finalPrice}</span>
              </div>
              <button type="button" className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                Купити абонемент →
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