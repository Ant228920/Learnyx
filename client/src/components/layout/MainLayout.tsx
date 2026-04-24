import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import AuthModal from '../../features/auth/AuthModal';

export default function MainLayout() {
  const { openModal, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="w-full sticky top-0 z-40 bg-white/90 border-b border-[#dee1e6] backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto w-full h-20 flex items-center justify-between px-20">

          <a href="/" aria-label="LearNYX — головна сторінка" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
              </svg>
            </div>
            <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
          </a>

          <nav aria-label="Основна навігація" className="hidden md:flex items-center gap-8">
            {!user && (
              <>
                <button
                  onClick={() => openModal('student')}
                  className="font-inter text-[#9095a1] text-sm font-medium hover:text-slate-900 transition-colors"
                >
                  Зареєструватись як учень
                </button>
                <button
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

          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-inter text-sm text-slate-700">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="font-inter px-5 py-2 rounded-lg border border-[#dee1e6] text-sm text-[#565d6d] hover:bg-gray-50 transition-colors"
              >
                Вийти
              </button>
            </div>
          ) : (
            <button
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