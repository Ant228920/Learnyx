import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

type SubscriptionStatus = 'Активна' | 'Закінчується' | 'Завершена';

interface Subscription {
  id: number;
  name: string;
  email: string;
  lessons: number;
  used: number;
  status: SubscriptionStatus;
  avatarBg: string;
}

const SUBSCRIPTIONS: Subscription[] = [
  { id: 1, name: 'Ковальчук Олена Ігорівна', email: 'o.kovalchuk@email.com', lessons: 12, used: 2, status: 'Активна', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Сидоренко Максим Вікторович', email: 'm.sydorenko@email.com', lessons: 8, used: 6, status: 'Закінчується', avatarBg: 'bg-[#dafdf8]' },
  { id: 3, name: 'Дмитрук Валерій Павлович', email: 'v.dmytruk@email.com', lessons: 15, used: 15, status: 'Завершена', avatarBg: 'bg-[#e7eff9]' },
  { id: 4, name: 'Ткаченко Софія Юріївна', email: 's.tkachenko@email.com', lessons: 8, used: 2, status: 'Активна', avatarBg: 'bg-[#ebe3ff]' },
  { id: 5, name: 'Бондаренко Андрій Сергійович', email: 'a.bond@email.com', lessons: 12, used: 0, status: 'Активна', avatarBg: 'bg-[#e7eff9]' },
  { id: 6, name: 'Левченко Марія Олександрівна', email: 'm.levchenko@email.com', lessons: 15, used: 12, status: 'Активна', avatarBg: 'bg-[#dafdf8]' },
  { id: 7, name: 'Павленко Іван Костянтинович', email: 'i.pavlenko@email.com', lessons: 8, used: 8, status: 'Завершена', avatarBg: 'bg-[#e7eff9]' },
  { id: 8, name: 'Шевченко Вікторія Петрівна', email: 'v.shev@email.com', lessons: 12, used: 10, status: 'Закінчується', avatarBg: 'bg-[#e7eff9]' },
];

const NAV_ITEMS = [
  { label: 'Дашборд', active: false, path: '/manager' },
  { label: 'Заявки', active: false, path: '/manager/applications' },
  { label: 'Підписки', active: true, path: '/manager/subscriptions' },
  { label: 'Звітність', active: false, path: '/manager/reports' },
  { label: 'Підбір', active: false, path: '/manager/matching' },
];

const FOOTER_LINKS = ['Політика конфіденційності', 'Центр допомоги', 'Умови використання'];

// ─── Status helpers ───────────────────────────────────────────────────────────

function getStatusStyle(status: SubscriptionStatus) {
  switch (status) {
    case 'Активна':
      return 'border border-[#dee1e6] text-slate-700 bg-white';
    case 'Закінчується':
      return 'border border-[#f5a83d] text-[#f5a83d] bg-white';
    case 'Завершена':
      return 'border border-[#e64c4c] text-[#e64c4c] bg-white';
  }
}

function getProgressStyle(status: SubscriptionStatus) {
  switch (status) {
    case 'Активна':
      return 'border border-[#dee1e6] text-slate-700 bg-white';
    case 'Закінчується':
      return 'border border-[#f5a83d] text-[#f5a83d] bg-[#fff8ee]';
    case 'Завершена':
      return 'border border-[#e64c4c] text-[#e64c4c] bg-[#fff0f0]';
  }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerSubscriptions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); void navigate('/'); };

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
        <main className="flex-1 px-16 py-10 w-full">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

            {/* Title */}
            <div>
              <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
                Студентські підписки
              </h1>
              <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">
                Повний список активних та завершених абонементів учнів платформи.
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
                <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Студент</span>
                <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Тип підписки</span>
                <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Залишок занять</span>
                <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Статус</span>
              </div>

              {/* Rows */}
              {SUBSCRIPTIONS.map((sub, index) => {
                const remaining = sub.lessons - sub.used;
                return (
                  <div
                    key={sub.id}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-6 py-5 ${
                      index < SUBSCRIPTIONS.length - 1 ? 'border-b border-[#dee1e6]' : ''
                    }`}
                  >
                    {/* Student */}
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${sub.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                        <span className="font-inter font-bold text-[#1f8cf9] text-sm">{sub.name[0]}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-poppins font-bold text-slate-900 text-sm leading-5">{sub.name}</span>
                        <span className="font-inter text-[#565d6d] text-xs">{sub.email}</span>
                      </div>
                    </div>

                    {/* Subscription type */}
                    <div className="flex items-center gap-2">
                      <IconBook />
                      <span className="font-inter font-semibold text-slate-800 text-sm">{sub.lessons} занять</span>
                    </div>

                    {/* Remaining */}
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-inter font-bold text-sm ${getProgressStyle(sub.status)}`}>
                        {remaining} / {sub.lessons}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full font-inter font-medium text-sm ${getStatusStyle(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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