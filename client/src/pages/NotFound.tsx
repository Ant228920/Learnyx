import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (!user) {
      navigate('/');
      return;
    }
    const role = user.role?.toLowerCase() ?? '';
    if (role === 'student') navigate('/dashboard');
    else if (role === 'teacher') navigate('/teacher');
    else if (role === 'manager' || role === 'admin') navigate('/manager');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f4f4f6] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-24 h-24 bg-[#1f8cf91a] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="font-inter font-bold text-[#171a1f] text-6xl mb-4">404</h1>
        <h2 className="font-inter font-bold text-[#171a1f] text-2xl mb-3">Сторінку не знайдено</h2>
        <p className="font-inter text-[#9095a1] text-base mb-8">
          Схоже, сторінка яку ви шукаєте не існує або була переміщена.
        </p>
        <button
          onClick={handleGoHome}
          className="bg-[#1f8cf9] text-white font-inter font-semibold text-sm px-8 py-3 rounded-2xl hover:bg-blue-600 transition-colors"
        >
          Повернутись на головну
        </button>
      </div>
    </div>
  );
}
