import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import AuthModal from '../../features/auth/AuthModal';

function roleDashboard(role: string): string {
  const r = role.toLowerCase();
  if (r === 'student') return '/dashboard';
  if (r === 'teacher') return '/teacher';
  if (r === 'manager' || r === 'admin') return '/manager';
  return '/';
}

export default function MainLayout() {
  const { openModal, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && location.pathname === '/') {
      void navigate(roleDashboard(user.role));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="w-full sticky top-0 z-40 bg-white/90 border-b border-[#dee1e6] backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto w-full h-20 flex items-center justify-between px-20">

          {/* Logo */}
          <a href="/" aria-label="LearNYX — головна сторінка" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
              </svg>
            </div>
            <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
          </a>

          {/* Nav links — only when not logged in */}
          <nav aria-label="Основна навігація" className="hidden md:flex items-center gap-8">
            {!user && (
              <>
                <button
                  type="button"
                  onClick={() => openModal('student')}
                  className="font-inter text-[#9095a1] text-sm font-medium hover:text-slate-900 transition-colors"
                >
                  Зареєструватись як учень
                </button>
                <button
                  type="button"
                  onClick={() => openModal('teacher')}
                  className="font-inter text-[#9095a1] text-sm font-medium hover:text-slate-900 transition-colors"
                >
                  Стати викладачем
                </button>
                <a
                  href="#catalog"
                  className="font-inter text-[#9095a1] text-sm font-medium hover:text-slate-900 transition-colors"
                >
                  Каталог
                </a>
              </>
            )}
          </nav>

          {/* Right side */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Initials avatar */}
              <div className="w-9 h-9 rounded-full bg-[#1f8cf9] flex items-center justify-center flex-shrink-0">
                <span className="font-inter font-bold text-white text-sm">{initials}</span>
              </div>

              {/* Name */}
              <div className="flex flex-col leading-tight">
                <span className="font-inter font-semibold text-sm text-slate-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="font-inter text-[10px] text-[#1f8cf9] font-medium uppercase tracking-wide">
                  {user.role.toLowerCase() === 'student' ? 'Учень' : user.role.toLowerCase() === 'teacher' ? 'Вчитель' : 'Менеджер'}
                </span>
              </div>

              {/* Back to cabinet */}
              <button
                onClick={() => void navigate(roleDashboard(user.role))}
                className="font-inter px-5 py-2 rounded-lg bg-[#1f8cf9] text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
              >
                До кабінету
              </button>
              <button
                onClick={handleLogout}
                className="font-inter px-4 py-2 rounded-lg border border-[#dee1e6] text-sm text-[#565d6d] hover:bg-gray-50 transition-colors"
              >
                Вийти
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openModal('login')}
              className="font-inter px-6 py-2 bg-[#1f8cf9] rounded-lg text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              Увійти
            </button>
          )}
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center">
        <Outlet />
      </main>

      <AuthModal />
    </div>
  );
}