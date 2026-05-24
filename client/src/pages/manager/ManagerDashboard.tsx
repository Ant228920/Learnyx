import { useState } from 'react';
import { useManagerDashboard } from '../../features/manager/dashboard';
import type { DashboardRegistration } from '../../features/manager/dashboard';
import ManagerLayout from './ManagerLayout';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconGraduate = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconAt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconTrend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { data, loading, error } = useManagerDashboard();
  const [selectedUser, setSelectedUser] = useState<DashboardRegistration | null>(null);

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const handleToggleUser = (reg: DashboardRegistration) => {
    setSelectedUser((prev) => (prev?.id === reg.id ? null : reg));
  };

  return (
    <ManagerLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">

        {/* Title */}
        <section>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl tracking-[-0.90px] leading-10">
            Загальний Дашборд
          </h1>
          <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">
            Огляд ключових показників освітньої платформи та активності.
          </p>
        </section>

        {/* Stats */}
        <section aria-label="Ключові показники" className="grid grid-cols-2 gap-6">
          <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <div className="w-12 h-12 bg-[#f4f4f6] rounded-2xl flex items-center justify-center"><IconUsers /></div>
            <div>
              <p className="font-inter font-medium text-[#565d6d] text-sm">Загальна кількість учнів</p>
              <p className="font-inter font-black text-slate-800 text-3xl mt-1">{data?.totalStudents ?? 0}</p>
            </div>
          </article>
          <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <div className="w-12 h-12 bg-[#1f8cf90a] rounded-2xl flex items-center justify-center"><IconGraduate /></div>
            <div>
              <p className="font-inter font-medium text-[#565d6d] text-sm">Загальна кількість викладачів</p>
              <p className="font-inter font-black text-slate-800 text-3xl mt-1">{data?.totalTeachers ?? 0}</p>
            </div>
          </article>
        </section>

        {/* Registrations + Side Panel */}
        <section aria-labelledby="registrations-title" className="flex items-start gap-8">

          {/* List */}
          <div className="flex flex-col gap-6 flex-1 min-w-0">
            <h2 id="registrations-title" className="font-poppins font-bold text-slate-900 text-xl tracking-[-0.40px] leading-7">
              Останні реєстрації
            </h2>
            <div className="flex flex-col gap-4">
              {(data?.recentRegistrations ?? []).map((reg) => (
                <article
                  key={reg.id}
                  className={`flex items-center gap-4 p-5 bg-white rounded-2xl border transition-all ${
                    selectedUser?.id === reg.id ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${reg.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <span className="font-inter font-bold text-[#1f8cf9] text-lg">{reg.name[0]}</span>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-poppins font-bold text-slate-900 text-base tracking-[-0.32px] leading-6 truncate">
                        {reg.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-inter font-semibold text-[11px] flex-shrink-0 ${
                        reg.role === 'Вчитель' ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'
                      }`}>
                        {reg.role}
                      </span>
                    </div>
                    <span className="font-inter text-[#565d6d] text-xs">{reg.email}</span>
                  </div>

                  <div className="flex flex-col w-44 flex-shrink-0">
                    <span className="font-inter font-semibold text-slate-800 text-sm">{reg.subject}</span>
                    <span className="font-inter text-[#565d6d] text-xs">{reg.level}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <IconCalendar />
                    <span className="font-inter text-[#565d6d] text-xs whitespace-nowrap">{reg.date}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleUser(reg)}
                    aria-label={`${selectedUser?.id === reg.id ? 'Закрити' : 'Переглянути'} профіль: ${reg.name}`}
                    aria-expanded={selectedUser?.id === reg.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1f8cf933] hover:bg-blue-50 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8cf9]"
                  >
                    <IconEye />
                    <span className="font-inter font-bold text-[#1f8cf9] text-xs leading-4">Переглянути</span>
                  </button>
                </article>
              ))}
              {(data?.recentRegistrations ?? []).length === 0 && (
                <p className="font-inter text-[#565d6d] text-sm">Немає нових реєстрацій</p>
              )}
            </div>
          </div>

          {/* Side Detail Panel */}
          {selectedUser && (
            <aside className="w-[300px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24 animate-fade-in">
              <div className="flex items-center justify-between p-6 bg-[#1f8cf91a]">
                <div>
                  <p className="font-poppins font-bold text-slate-900 text-xl leading-7">
                    {selectedUser.role === 'Вчитель' ? 'Анкета вчителя' : 'Анкета студента'}
                  </p>
                  <p className="font-inter font-bold text-[#1f8cf9] text-xs leading-4 mt-0.5">
                    Перевірка даних реєстрації
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${selectedUser.avatarBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="font-inter font-bold text-[#1f8cf9] text-lg">{selectedUser.name[0]}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
                <span className={`px-2 py-0.5 rounded-full font-inter font-bold text-[10px] w-fit ${
                  selectedUser.role === 'Вчитель' ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'
                }`}>
                  {selectedUser.role}
                </span>

                {[
                  { label: selectedUser.role === 'Вчитель' ? 'ПІБ ВЧИТЕЛЯ' : 'ПІБ СТУДЕНТА', value: selectedUser.name, icon: <IconUser /> },
                  { label: 'НОМЕР ТЕЛЕФОНУ', value: selectedUser.phone, icon: <IconPhone /> },
                  { label: 'ЕЛЕКТРОННА ПОШТА', value: selectedUser.email, icon: <IconMail /> },
                  { label: 'TELEGRAM НІКНЕЙМ', value: selectedUser.telegram, icon: <IconAt /> },
                  { label: 'ОБРАНИЙ ПРЕДМЕТ', value: selectedUser.subject, icon: <IconBook /> },
                  { label: 'РІВЕНЬ ПІДГОТОВКИ', value: selectedUser.level, icon: <IconTrend /> },
                ].map((field) => (
                  <div key={field.label} className="flex flex-col gap-1 pb-3 border-b border-[#f4f4f6] last:border-0 last:pb-0">
                    <span className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[1px] uppercase">
                      {field.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {field.icon}
                      <span className="font-inter font-semibold text-slate-800 text-sm leading-5 break-all">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </section>
      </div>
    </ManagerLayout>
  );
}
