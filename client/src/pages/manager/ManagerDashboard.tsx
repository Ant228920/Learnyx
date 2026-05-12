import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

type UserRole = 'Студент' | 'Вчитель';

interface Registration {
  id: number;
  name: string;
  role: UserRole;
  subject: string;
  phone: string;
  email: string;
  telegram: string;
  level: string;
  date: string;
  avatarBg: string;
}

const REGISTRATIONS: Registration[] = [
  { id: 1, name: 'Ковальчук Олена Ігорівна', role: 'Студент', subject: 'Англійська мова', phone: '+380 67 123 45 67', email: 'o.kovalchuk@email.com', telegram: '@elena_learnyx', level: 'B2 (Upper-Intermediate)', date: '24.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Дмитрук Валерій Павлович', role: 'Вчитель', subject: 'Математика', phone: '+380 67 234 56 78', email: 'v.dmytruk@email.com', telegram: '@valerii_physics', level: 'ЗНО Підготовка', date: '23.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 3, name: 'Сидоренко Максим Вікторович', role: 'Студент', subject: 'Математика', phone: '+380 67 345 67 89', email: 'm.sydorenko@email.com', telegram: '@max_math', level: '9 клас', date: '24.05.2024', avatarBg: 'bg-[#dafdf8]' },
  { id: 4, name: 'Іванов Дмитро Сергійович', role: 'Студент', subject: 'Українська мова', phone: '+380 67 456 78 90', email: 'd.ivanov@email.com', telegram: '@dmytro_school', level: '4 клас', date: '23.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 5, name: 'Ткаченко Софія Юріївна', role: 'Студент', subject: 'Інформатика', phone: '+380 67 567 89 01', email: 's.tkachenko@email.com', telegram: '@sofia_code', level: '7 клас', date: '22.05.2024', avatarBg: 'bg-[#ebe3ff]' },
];

const NAV_ITEMS = [
  { label: 'Дашборд', active: true, path: '/manager' },
  { label: 'Заявки', active: false, path: '/manager/applications' },
  { label: 'Підписки', active: false, path: '/manager/subscriptions' },
  { label: 'Звітність', active: false, path: '/manager' },
  { label: 'Підбір', active: false, path: '/manager' },
];

const FOOTER_LINKS = ['Політика конфіденційності', 'Центр допомоги', 'Умови використання'];

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

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Registration | null>(null);

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  const handleToggleUser = (reg: Registration) => {
    setSelectedUser((prev) => (prev?.id === reg.id ? null : reg));
  };

  return (
    <div className="flex w-full min-h-screen bg-white">

      {/* ── Sidebar ── */}
      <aside
        aria-label="Основна навігація адміністратора"
        className="fixed top-0 left-0 flex h-full w-64 flex-col border-r border-[#dee1e6] bg-white z-30"
      >
        <div className="flex w-full items-center gap-3 p-6">
          <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center">
            <IconLogo />
          </div>
          <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
        </div>

        <div className="flex flex-1 flex-col w-full pt-4">
          <nav aria-label="Розділи" className="flex flex-1 flex-col gap-2 px-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-current={item.active ? 'page' : undefined}
                onClick={() => void navigate(item.path)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-colors ${
                  item.active ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`font-inter text-sm font-medium ${item.active ? 'text-white' : 'text-[#565d6d]'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#dee1e6] p-4 w-full">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-inter text-sm font-medium text-[#565d6d]">Налаштування</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 pl-64 min-h-screen">

        {/* Header */}
        <header className="h-16 flex items-center justify-end px-10 bg-white border-b border-[#dee1e6] sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="font-inter font-bold text-slate-900 text-sm">{user?.firstName} {user?.lastName}</span>
              <span className="font-inter font-bold text-[#1f8cf9] text-[10px] tracking-[0.50px] uppercase">Адміністратор</span>
            </div>
            <div className="relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-[#f4f4f6]">
              <span className="font-inter font-bold text-[#1f8cf9] text-sm">{user?.firstName?.[0]}</span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-16 py-10 w-full" aria-label="Загальний дашборд">
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
                  <p className="font-inter font-black text-slate-800 text-3xl mt-1">1,248</p>
                </div>
              </article>
              <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                <div className="w-12 h-12 bg-[#1f8cf90a] rounded-2xl flex items-center justify-center"><IconGraduate /></div>
                <div>
                  <p className="font-inter font-medium text-[#565d6d] text-sm">Загальна кількість викладачів</p>
                  <p className="font-inter font-black text-slate-800 text-3xl mt-1">84</p>
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
                  {REGISTRATIONS.map((reg) => (
                    <article
                      key={reg.id}
                      className={`flex items-center gap-4 p-5 bg-white rounded-2xl border transition-all ${
                        selectedUser?.id === reg.id ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full ${reg.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                        <span className="font-inter font-bold text-[#1f8cf9] text-lg">{reg.name[0]}</span>
                      </div>

                      {/* Name + email + badge */}
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

                      {/* Subject + level */}
                      <div className="flex flex-col w-44 flex-shrink-0">
                        <span className="font-inter font-semibold text-slate-800 text-sm">{reg.subject}</span>
                        <span className="font-inter text-[#565d6d] text-xs">{reg.level}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <IconCalendar />
                        <span className="font-inter text-[#565d6d] text-xs whitespace-nowrap">{reg.date}</span>
                      </div>

                      {/* Button */}
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
                </div>
              </div>

              {/* Side Detail Panel — тільки перегляд, без кнопок дії */}
              {selectedUser && (
                <aside className="w-[300px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24 animate-fade-in">
                  {/* Panel header */}
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

                  {/* Panel body — тільки інформація */}
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
        </main>

        {/* Footer */}
        <footer className="px-16 py-6 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <p className="font-inter font-medium text-[#565d6d] text-xs">
              © 2024 LearnYX Ecosystem. Платформа для професійного навчання та зростання.
            </p>
            <nav aria-label="Нижня навігація" className="flex items-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <a key={link} href="#" className="font-inter font-bold text-[#565d6d] text-xs hover:text-slate-900 transition-colors">{link}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}