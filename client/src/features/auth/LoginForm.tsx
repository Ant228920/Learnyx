import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, IconMail } from '../../components/layout/icons';
import { authApi, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../app/providers';

interface Props {
  onSuccess?: () => void;
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'student':  return '/dashboard';
    case 'teacher':  return '/teacher';
    case 'manager':  return '/manager';
    case 'admin':    return '/manager';
    default:         return '/';
  }
}

export default function LoginForm({ onSuccess }: Props) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Заповніть всі поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authApi.login({ email, password });

      // Зберігаємо refresh токен
      localStorage.setItem('refreshToken', data.refreshToken);

      // Нормалізуємо роль (бекенд повертає 'Student' або 'student')
      const role = (data.user.role ?? '').toLowerCase() as 'student' | 'teacher' | 'manager' | 'admin';

      const normalizedUser = {
        ...data.user,
        role,
      };

      login(data.accessToken, normalizedUser);
      onSuccess?.();

      setTimeout(() => {
        void navigate(getRedirectPath(role));
      }, 0);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleSubmit();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Email */}
      <div>
        <label htmlFor="l-email" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]">
            <IconMail />
          </span>
          <input
            id="l-email"
            name="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="example@mail.com"
            type="email"
            autoComplete="email"
            className="form-input-icon"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="l-password" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Пароль <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="l-password"
            name="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="form-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9095a1] hover:text-slate-600"
            aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-600 font-inter">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={loading}
        className="btn-primary mt-1 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Вхід...
          </>
        ) : 'Підтвердити'}
      </button>
    </div>
  );
}