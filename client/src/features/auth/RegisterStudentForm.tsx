import { useState } from 'react';
import { IconPhone, IconMail, IconAtSign } from '../../components/layout/icons';
import { authApi, extractErrorMessage } from '../../services/api';

interface Props { onSuccess: () => void; }

export default function RegisterStudentForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    lastName: '', firstName: '', middleName: '', phone: '', email: '', telegram: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.lastName.trim() || !form.firstName.trim() || !form.phone.trim() || !form.email.trim() || !form.telegram.trim()) {
      setError('Заповніть всі обов\'язкові поля');
      return;
    }
    setLoading(true);
    try {
      const fullName = [form.lastName, form.firstName, form.middleName].filter(Boolean).join(' ');
      await authApi.register({
        full_name: fullName,
        email: form.email,
        phone: form.phone,
        telegram_nickname: form.telegram,
        role: 'student',
      });
      onSuccess();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Прізвище + Ім'я */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-last" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Прізвище <span className="text-red-500">*</span>
          </label>
          <input id="s-last" value={form.lastName} onChange={set('lastName')}
            placeholder="Коваль" className="form-input" />
        </div>
        <div>
          <label htmlFor="s-first" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Ім'я <span className="text-red-500">*</span>
          </label>
          <input id="s-first" value={form.firstName} onChange={set('firstName')}
            placeholder="Олександр" className="form-input" />
        </div>
      </div>

      {/* По батькові */}
      <div>
        <label htmlFor="s-middle" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          По батькові <span className="text-[#9095a1] font-normal">(опціонально)</span>
        </label>
        <input id="s-middle" value={form.middleName} onChange={set('middleName')}
          placeholder="Миколайович" className="form-input" />
      </div>

      {/* Телефон */}
      <div>
        <label htmlFor="s-phone" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Номер телефону <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconPhone /></span>
          <input id="s-phone" type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+380 00 000 00 00" className="form-input-icon" />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="s-email" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconMail /></span>
          <input id="s-email" type="email" value={form.email} onChange={set('email')}
            placeholder="example@mail.com" className="form-input-icon" />
        </div>
      </div>

      {/* Telegram */}
      <div>
        <label htmlFor="s-telegram" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Telegram nickname <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconAtSign /></span>
          <input id="s-telegram" value={form.telegram} onChange={set('telegram')}
            placeholder="username" className="form-input-icon" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-600 font-inter">{error}</p>
        </div>
      )}

      <button type="button" onClick={() => void handleSubmit()} disabled={loading}
        className="btn-primary mt-1 flex items-center justify-center gap-2">
        {loading ? 'Відправляємо...' : (
          <>Підтвердити
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}