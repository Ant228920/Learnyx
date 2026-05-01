import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, IconMail } from '../icons';
import type { LoginDTO } from '../../services/api';
import { useAuth } from '../../app/providers';

interface Props {
  onSuccess?: () => void;
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'student': return '/dashboard';
    case 'teacher': return '/teacher';
    case 'manager': return '/manager';
    case 'admin':   return '/manager';
    default:        return '/';
  }
}

function getRoleByEmail(email: string): 'student' | 'teacher' | 'manager' | 'admin' {
  const e = email.toLowerCase();
  if (e.includes('manager') || e.includes('admin')) return 'manager';
  if (e.includes('teacher')) return 'teacher';
  return 'student';
}

export default function LoginForm({ onSuccess }: Props) {
  const { login, closeModal } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginDTO>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: LoginDTO) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = () => {
    if (!form.email.trim() || !form.password.trim()) {
      setError('Заповніть всі поля');
      return;
    }

    setLoading(true);

    const role = getRoleByEmail(form.email);

    const demoUser = {
      id: 1,
      email: form.email,
      role,
      firstName: role === 'manager' ? 'Олександр' : 'Олена',
      lastName:  role === 'manager' ? 'Петрович'  : 'Коваль',
    };

    login('demo-token', demoUser);
    closeModal();
    onSuccess?.();
    setLoading(false);
    void navigate(getRedirectPath(role));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
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
            value={form.email}
            onChange={handleChange}
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
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="password123"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="form-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9095a1] hover:text-slate-600"
            aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center font-inter">{error}</p>
      )}

      {/* Demo hint */}
      <div className="bg-blue-50 rounded-xl p-3 text-xs font-inter text-[#565d6d]">
        <p className="font-semibold text-slate-700 mb-1">Демо-входи (будь-який пароль):</p>
        <p>👨‍🎓 Студент: <span className="text-[#1f8cf9] font-medium">student@test.com</span></p>
        <p>🧑‍💼 Менеджер: <span className="text-[#1f8cf9] font-medium">manager@test.com</span></p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary mt-1"
      >
        {loading ? 'Завантаження...' : 'Підтвердити'}
      </button>
    </div>
  );
}
