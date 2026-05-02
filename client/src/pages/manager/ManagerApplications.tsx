import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

type UserRole = 'Учень' | 'Вчитель';
type FilterType = 'Усі' | 'Учень' | 'Вчитель';
type FilterSubject = 'Усі' | 'Англійська мова' | 'Математика' | 'Українська мова' | 'Історія України' | 'Інформатика';

interface Applicant {
  id: number;
  name: string;
  role: UserRole;
  subject: string;
  level: string;
  email: string;
  phone: string;
  telegram: string;
  date: string;
  avatarBg: string;
}

const APPLICANTS: Applicant[] = [
  { id: 1, name: 'Ковальчук Олена Ігорівна', role: 'Учень', subject: 'Англійська мова', level: 'B2 (Upper-Intermediate)', email: 'o.kovalchuk@email.com', phone: '+380 67 123 45 67', telegram: '@elena_learnyx', date: '24.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Дмитрук Валерій Павлович', role: 'Вчитель', subject: 'Математика', level: 'ЗНО Підготовка', email: 'v.dmytruk@email.com', phone: '+380 67 234 56 78', telegram: '@valerii_physics', date: '23.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 3, name: 'Сидоренко Максим Вікторович', role: 'Учень', subject: 'Математика', level: '9 клас', email: 'm.sydorenko@email.com', phone: '+380 67 345 67 89', telegram: '@max_math', date: '24.05.2024', avatarBg: 'bg-[#dafdf8]' },
  { id: 4, name: 'Іванов Дмитро Сергійович', role: 'Учень', subject: 'Українська мова', level: '4 клас', email: 'd.ivanov@email.com', phone: '+380 67 456 78 90', telegram: '@dmytro_school', date: '23.05.2024', avatarBg: 'bg-[#e7eff9]' },
  { id: 5, name: 'Ткаченко Софія Юріївна', role: 'Учень', subject: 'Інформатика', level: '7 клас', email: 's.tkachenko@email.com', phone: '+380 67 567 89 01', telegram: '@sofia_code', date: '22.05.2024', avatarBg: 'bg-[#ebe3ff]' },
];

const NAV_ITEMS = [
  { label: 'Дашборд', active: false, path: '/manager' },
  { label: 'Заявки', active: true, path: '/manager/applications' },
  { label: 'Підписки', active: false, path: '/manager/subscriptions' },
  { label: 'Звітність', active: false, path: '/manager' },
  { label: 'Підбір', active: false, path: '/manager' },
];

const FOOTER_LINKS = ['Політика конфіденційності', 'Центр допомоги', 'Умови використання'];

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconSubject = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerApplications() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<Applicant | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS);
  const [filterType, setFilterType] = useState<FilterType>('Усі');
  const [filterSubject, setFilterSubject] = useState<FilterSubject>('Усі');
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; id: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogout = () => { logout(); void navigate('/'); };

  const handleToggle = (app: Applicant) => {
    setSelectedUser((prev) => prev?.id === app.id ? null : app);
  };

  const filtered = useMemo(() =>
    applicants.filter((a) =>
      (filterType === 'Усі' || a.role === filterType) &&
      (filterSubject === 'Усі' || a.subject === filterSubject)
    ), [applicants, filterType, filterSubject]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    const name = applicants.find((a) => a.id === id)?.name ?? '';
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
    setConfirmAction(null);
    setSuccessMessage(
      type === 'approve'
        ? `Заявку від ${name} успішно прийнято!`
        : `Заявку від ${name} відхилено.`
    );
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fb]">

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
        <main className="flex-1 px-16 py-10 w-full">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-6">

            {/* Title */}
            <div>
              <h1 className="font-poppins font-bold text-slate-900 text-2xl leading-8">Заявки</h1>
              <p className="font-inter text-[#565d6d] text-lg leading-7 mt-1">
                Керування новими реєстраціями студентів та викладачів.
              </p>
            </div>

            {/* Main layout */}
            <div className="flex items-start gap-8">

              {/* Left: filters + list */}
              <div className="flex flex-col gap-4 flex-1 min-w-0">

                {/* Filters */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2px_#0000000d] w-fit">
                  {/* Type filter */}
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#dee1e6] bg-white cursor-pointer min-w-[160px]">
                    <IconFilter />
                    <span className="font-inter text-slate-800 text-sm flex-1">Тип: {filterType}</span>
                    <IconChevron />
                    <select
                      aria-label="Фільтр за типом"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                    >
                      {(['Усі', 'Учень', 'Вчитель'] as FilterType[]).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>

                  {/* Subject filter */}
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#dee1e6] bg-white cursor-pointer min-w-[200px]">
                    <IconSubject />
                    <span className="font-inter text-slate-800 text-sm flex-1">Предмет: {filterSubject}</span>
                    <IconChevron />
                    <select
                      aria-label="Фільтр за предметом"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value as FilterSubject)}
                    >
                      {(['Усі', 'Англійська мова', 'Математика', 'Українська мова', 'Історія України', 'Інформатика'] as FilterSubject[]).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* List */}
                <div className="flex flex-col gap-4">
                  {filtered.length === 0 ? (
                    <div className="p-10 bg-white rounded-2xl border border-[#dee1e6] text-center">
                      <p className="font-inter text-[#565d6d] text-sm">Немає заявок за обраними фільтрами</p>
                    </div>
                  ) : (
                    filtered.map((app) => (
                      <article
                        key={app.id}
                        className={`flex items-center gap-4 p-5 bg-white rounded-2xl border transition-all ${
                          selectedUser?.id === app.id ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full ${app.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                          <span className="font-inter font-bold text-[#1f8cf9] text-lg">{app.name[0]}</span>
                        </div>

                        {/* Name + email + badge */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-poppins font-bold text-slate-900 text-base tracking-[-0.32px] leading-6">
                              {app.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-inter font-semibold text-[11px] flex-shrink-0 ${
                              app.role === 'Вчитель' ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'
                            }`}>
                              {app.role}
                            </span>
                          </div>
                          <span className="font-inter text-[#565d6d] text-xs">{app.email}</span>
                        </div>

                        {/* Subject + level */}
                        <div className="flex flex-col w-44 flex-shrink-0">
                          <span className="font-inter font-semibold text-slate-800 text-sm">{app.subject}</span>
                          <span className="font-inter text-[#565d6d] text-xs">{app.level}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <IconCalendar />
                          <span className="font-inter text-[#565d6d] text-xs whitespace-nowrap">{app.date}</span>
                        </div>

                        {/* Button */}
                        <button
                          type="button"
                          onClick={() => handleToggle(app)}
                          aria-label={`${selectedUser?.id === app.id ? 'Закрити' : 'Переглянути'} заявку: ${app.name}`}
                          aria-expanded={selectedUser?.id === app.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1f8cf933] hover:bg-blue-50 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8cf9]"
                        >
                          <IconEye />
                          <span className="font-inter font-bold text-[#1f8cf9] text-xs leading-4">Переглянути</span>
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>

              {/* Right: detail panel WITH action buttons */}
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

                  {/* Panel body */}
                  <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
                    {/* Role badge */}
                    <span className={`px-2 py-0.5 rounded-full font-inter font-bold text-[10px] w-fit ${
                      selectedUser.role === 'Вчитель' ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'
                    }`}>
                      {selectedUser.role}
                    </span>

                    {/* Fields */}
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

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'approve', id: selectedUser.id })}
                        aria-label={`Прийняти заявку ${selectedUser.name}`}
                        className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors shadow-[0px_10px_15px_-3px_#bfdbfe]"
                      >
                        <IconCheck />
                        Прийняти заявку
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'reject', id: selectedUser.id })}
                        aria-label={`Відхилити заявку ${selectedUser.name}`}
                        className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#e64c4c] rounded-2xl font-inter font-medium text-white text-sm hover:bg-red-600 transition-colors shadow-[0px_10px_15px_-3px_#fee2e2]"
                      >
                        <IconX />
                        Відхилити
                      </button>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-16 py-6 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
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

      {/* ── Confirm Modal ── */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in p-8 flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              confirmAction.type === 'approve' ? 'bg-blue-50 text-[#1f8cf9]' : 'bg-red-50 text-red-500'
            }`}>
              {confirmAction.type === 'approve'
                ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              }
            </div>
            <h2 id="confirm-title" className="font-poppins font-bold text-xl text-slate-900 text-center">
              {confirmAction.type === 'approve' ? 'Прийняти заявку?' : 'Відхилити заявку?'}
            </h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">
              {confirmAction.type === 'approve'
                ? `Ви підтверджуєте прийняття заявки від ${selectedUser?.name}.`
                : `Ви підтверджуєте відхилення заявки від ${selectedUser?.name}.`}
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl font-inter font-medium text-sm text-white transition-colors ${
                  confirmAction.type === 'approve' ? 'bg-[#1f8cf9] hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmAction.type === 'approve' ? 'Прийняти' : 'Відхилити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {successMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSuccessMessage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Операція успішна"
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}