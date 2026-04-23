import { useState } from 'react';
import { IconEye, IconEyeOff, IconMail } from '../../components/layout/icons';
import { authApi } from '../../services/api';
import type { LoginDTO } from '../../services/api';
import { useAuth } from '../../app/providers';

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const { login } = useAuth();
  const [form, setForm] = useState<LoginDTO>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: LoginDTO) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Заповніть всі поля'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.data.token, res.data.user);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Невірний email або пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleSubmit();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="l-email" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconMail /></span>
          <input
            id="l-email" name="email" value={form.email}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="example@mail.com" type="email" autoComplete="email"
            className="form-input-icon"
          />
        </div>
      </div>

      <div>
        <label htmlFor="l-password" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Пароль <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="l-password" name="password" value={form.password}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="password123" type={showPassword ? 'text' : 'password'}
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

      {error && <p className="text-sm text-red-500 text-center font-inter">{error}</p>}

      <button onClick={() => void handleSubmit()} disabled={loading} className="btn-primary mt-1">
        {loading ? 'Завантаження...' : 'Підтвердити'}
      </button>
    </div>
  );
}