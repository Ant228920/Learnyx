import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers';

const NAV_ITEMS = [
  { label: 'Дашборд',           path: '/dashboard' },
  { label: 'Домашні завдання',  path: '/dashboard/homework' },
  { label: 'Розклад',           path: '/dashboard/schedule' },
  { label: 'Підписка',          path: '/dashboard/subscription' },
  { label: 'Оцінки',            path: '/dashboard/grades' },
];

const FOOTER_LINKS = ['Політика конфіденційності', 'Допомога', 'Про проект'];

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

interface Props {
  children: ReactNode;
}

export default function StudentLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); void navigate('/'); };

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fb]">

      {/* ── Sidebar ── */}
      <aside
        aria-label="Навігація студента"
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
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => void navigate(item.path)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-colors ${
                    active
                      ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-inter text-sm font-medium ${active ? 'text-white' : 'text-[#565d6d]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
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
              <span className="font-inter font-bold text-slate-900 text-sm">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="font-inter font-bold text-[#1f8cf9] text-[10px] tracking-[0.50px] uppercase">
                @{user?.firstName?.toLowerCase()}_student
              </span>
            </div>
            <div className="relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-[#f4f4f6]">
              <span className="font-inter font-bold text-[#1f8cf9] text-sm">{user?.firstName?.[0]}</span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-16 py-10 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-16 py-6 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <p className="font-inter font-medium text-[#565d6d] text-xs">
              © 2024 LearnYX Ecosystem. Усі права захищені.
            </p>
            <nav aria-label="Нижня навігація" className="flex items-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <a key={link} href="#" className="font-inter font-bold text-[#565d6d] text-xs hover:text-slate-900 transition-colors">
                  {link}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}