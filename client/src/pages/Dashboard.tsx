import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) void navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-20 py-16 w-full">
      <h1
        className="font-bold text-slate-900 text-4xl mb-4"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Вітаємо, {user.firstName} {user.lastName}!
      </h1>
      <p
        className="text-[#565d6d] text-lg mb-8"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Ви увійшли як{' '}
        <span className="font-semibold text-[#1f8cf9]">
          {user.role === 'teacher' ? 'викладач' : 'учень'}
        </span>
        .
      </p>
      <button
        onClick={() => { logout(); void navigate('/'); }}
        className="px-6 py-3 bg-[#1f8cf9] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Вийти
      </button>
    </div>
  );
}