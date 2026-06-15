import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers';

const NAV_ITEMS = [
  { label: 'Дашборд',  path: '/manager' },
  { label: 'Заявки',   path: '/manager/applications' },
  { label: 'Підписки', path: '/manager/subscriptions' },
  { label: 'Звітність',path: '/manager/reports' },
  { label: 'Підбір',   path: '/manager/matching' },
];

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

function roleLabel(role: string | undefined): string {
  switch ((role ?? '').toLowerCase()) {
    case 'student': return 'Учень';
    case 'teacher': return 'Викладач';
    case 'manager': return 'Менеджер';
    case 'admin': return 'Адміністратор';
    default: return '—';
  }
}

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSettings = location.pathname === '/manager/settings';
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fb]">

      {/* Sidebar */}
      <aside
        aria-label="Навігація адміністратора"
        className="fixed top-0 left-0 flex h-full w-64 flex-col border-r border-[#dee1e6] bg-white z-30"
      >
        <button type="button" onClick={() => void navigate('/')} className="flex w-full items-center gap-3 p-6 hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center">
            <IconLogo />
          </div>
          <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
        </button>

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
                    active ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]' : 'hover:bg-gray-50'
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

        <div className="border-t border-[#dee1e6] p-4 w-full flex flex-col gap-1">
          <button
            type="button"
            onClick={() => void navigate('/manager/settings')}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isSettings ? 'bg-[#f0f7ff]' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`font-inter text-sm font-medium ${isSettings ? 'text-[#1f8cf9]' : 'text-[#565d6d]'}`}>
              Налаштування
            </span>
          </button>
          <button
            type="button"
            onClick={() => { logout(); void navigate('/'); }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors"
          >
            <span className="font-inter text-sm font-medium text-red-500">Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 pl-64 min-h-screen">

        {/* Header */}
        <header className="h-16 flex items-center justify-end px-10 bg-white border-b border-[#dee1e6] sticky top-0 z-20">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowProfile(true)}>
            <div className="flex flex-col items-end">
              <span className="font-inter font-bold text-slate-900 text-sm">{user?.firstName} {user?.lastName}</span>
              <span className="font-inter font-bold text-[#1f8cf9] text-[10px] tracking-[0.50px] uppercase">Адміністратор</span>
            </div>
            <div className="relative w-10 h-10 rounded-full bg-[#1f8cf9] flex items-center justify-center flex-shrink-0">
              <span className="font-inter font-bold text-white text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-16 py-10 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-16 py-6 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1440px] mx-auto flex items-center">
            <p className="font-inter font-medium text-[#565d6d] text-xs">
              © 2026 LearnYX Ecosystem. Платформа для професійного навчання та зростання.
            </p>
          </div>
        </footer>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowProfile(false); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-8 flex flex-col items-center gap-5 relative">
            <button onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 text-[#9095a1] hover:text-slate-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <div className="w-20 h-20 rounded-full bg-[#1f8cf9] flex items-center justify-center">
              <span className="font-poppins font-bold text-white text-2xl">
                {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
              </span>
            </div>
            <div className="text-center">
              <p className="font-poppins font-bold text-slate-900 text-xl">Профіль</p>
              <p className="font-inter text-[#1f8cf9] text-sm">LearNYX Ecosystem</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              {[
                { label: "ІМ'Я ПРІЗВИЩЕ", value: (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`).trim() || '—' },
                { label: 'РОЛЬ', value: roleLabel(user?.role) },
                { label: 'НОМЕР ТЕЛЕФОНУ', value: user?.phone || '—' },
                { label: 'ЕЛЕКТРОННА ПОШТА', value: user?.email || '—' },
                { label: 'TELEGRAM NICKNAME', value: user?.nickname || '—' },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-0.5 pb-3 border-b border-[#f4f4f6] last:border-0">
                  <span className="font-inter font-bold text-[#565d6d] text-[10px] tracking-widest uppercase">{f.label}</span>
                  <span className="font-inter font-semibold text-slate-800 text-sm">{f.value}</span>
                </div>
              ))}
            </div>
            <p className="font-inter text-[#9095a1] text-xs">ACCOUNT ID: LYX-{String(user?.id ?? '0').padStart(4, '0')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
