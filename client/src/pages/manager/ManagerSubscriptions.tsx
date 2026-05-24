import { useManagerSubscriptions } from '../../features/manager/subscriptions';
import type { Subscription } from '../../features/manager/subscriptions';
import ManagerLayout from './ManagerLayout';

type SubscriptionStatus = 'Активна' | 'Закінчується' | 'Завершена';

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];

function getStatusLabel(sub: Subscription): SubscriptionStatus {
  if (sub.status === 'active') {
    return sub.balance <= 2 ? 'Закінчується' : 'Активна';
  }
  return 'Завершена';
}

function getStatusStyle(status: SubscriptionStatus) {
  switch (status) {
    case 'Активна':     return 'border border-[#dee1e6] text-slate-700 bg-white';
    case 'Закінчується':return 'border border-[#f5a83d] text-[#f5a83d] bg-white';
    case 'Завершена':   return 'border border-[#e64c4c] text-[#e64c4c] bg-white';
  }
}

function getProgressStyle(status: SubscriptionStatus) {
  switch (status) {
    case 'Активна':     return 'border border-[#dee1e6] text-slate-700 bg-white';
    case 'Закінчується':return 'border border-[#f5a83d] text-[#f5a83d] bg-[#fff8ee]';
    case 'Завершена':   return 'border border-[#e64c4c] text-[#e64c4c] bg-[#fff0f0]';
  }
}

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function ManagerSubscriptions() {
  const { data, loading, error } = useManagerSubscriptions();
  const subscriptions = data?.subscriptions ?? [];

  return (
    <ManagerLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

        {/* Title */}
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
            Студентські підписки
          </h1>
          <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">
            Повний список активних та завершених абонементів учнів платформи.
            {data && (
              <span className="ml-2 font-inter text-[#565d6d] text-base">
                (Активних: {data.total_active}, Виручка: {data.total_revenue.toLocaleString('uk')} ₴)
              </span>
            )}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
            <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Студент</span>
            <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Тип підписки</span>
            <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Залишок занять</span>
            <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Статус</span>
          </div>

          {loading && <div className="px-6 py-8 text-center font-inter text-[#565d6d]">Завантаження...</div>}
          {error && <div className="px-6 py-8 text-center font-inter text-[#e64c4c]">{error}</div>}
          {!loading && !error && subscriptions.length === 0 && (
            <div className="px-6 py-8 text-center font-inter text-[#565d6d]">Підписок ще немає.</div>
          )}

          {subscriptions.map((sub, index) => {
            const statusLabel = getStatusLabel(sub);
            return (
              <div
                key={sub.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-6 py-5 ${
                  index < subscriptions.length - 1 ? 'border-b border-[#dee1e6]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <span className="font-inter font-bold text-[#1f8cf9] text-sm">{sub.student_name[0]}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-poppins font-bold text-slate-900 text-sm leading-5">{sub.student_name}</span>
                    <span className="font-inter text-[#565d6d] text-xs">{sub.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconBook />
                  <span className="font-inter font-semibold text-slate-800 text-sm">{sub.total_lessons} занять</span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full font-inter font-bold text-sm ${getProgressStyle(statusLabel)}`}>
                    {sub.balance} / {sub.total_lessons}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full font-inter font-medium text-sm ${getStatusStyle(statusLabel)}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ManagerLayout>
  );
}
