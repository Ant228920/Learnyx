import { useState } from 'react';
import { IconPhone, IconMail, IconAtSign } from '../../components/layout/icons';
import { authApi, extractErrorMessage } from '../../services/api';

interface Props { onSuccess: () => void; }

const SUBJECTS = [
  'Англійська мова',
  'Українська мова',
  'Математика',
  'Інформатика',
  'Історія України',
];

const LEVELS_ENGLISH = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVELS_OTHER = ['1 - 4 клас', '5 - 11 клас'];

export default function RegisterTeacherForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    lastName: '', firstName: '', middleName: '',
    phone: '', email: '', telegram: '',
    subject: '', level: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => {
      const updated = { ...prev, [field]: e.target.value };
      // Скидаємо рівень при зміні предмету
      if (field === 'subject') updated.level = '';
      return updated;
    });
    setError('');
  };

  const getLevels = () =>
    form.subject === 'Англійська мова' ? LEVELS_ENGLISH : LEVELS_OTHER;

  const handleSubmit = async () => {
    if (
      !form.lastName.trim() || !form.firstName.trim() ||
      !form.phone.trim() || !form.email.trim() ||
      !form.telegram.trim() || !form.subject || !form.level
    ) {
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
        role: 'teacher',
        subject: form.subject,
        level: form.level,
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
          <label htmlFor="t-last" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Прізвище <span className="text-red-500">*</span>
          </label>
          <input id="t-last" value={form.lastName} onChange={set('lastName')}
            placeholder="Коваль" className="form-input" />
        </div>
        <div>
          <label htmlFor="t-first" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Ім'я <span className="text-red-500">*</span>
          </label>
          <input id="t-first" value={form.firstName} onChange={set('firstName')}
            placeholder="Олександр" className="form-input" />
        </div>
      </div>

      {/* По батькові */}
      <div>
        <label htmlFor="t-middle" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          По батькові <span className="text-[#9095a1] font-normal">(опціонально)</span>
        </label>
        <input id="t-middle" value={form.middleName} onChange={set('middleName')}
          placeholder="Васильович" className="form-input" />
      </div>

      {/* Телефон + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="t-phone" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Номер телефону <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconPhone /></span>
            <input id="t-phone" type="tel" value={form.phone} onChange={set('phone')}
              placeholder="+380" className="form-input-icon" />
          </div>
        </div>
        <div>
          <label htmlFor="t-email" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconMail /></span>
            <input id="t-email" type="email" value={form.email} onChange={set('email')}
              placeholder="example@mail.com" className="form-input-icon" />
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div>
        <label htmlFor="t-telegram" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Telegram nickname <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconAtSign /></span>
          <input id="t-telegram" value={form.telegram} onChange={set('telegram')}
            placeholder="nickname" className="form-input-icon" />
        </div>
      </div>

      {/* Предмет + Рівень */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="t-subject" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Вибрати предмет <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select id="t-subject" value={form.subject} onChange={set('subject')}
              className="form-input appearance-none pr-8 cursor-pointer">
              <option value="">Оберіть предмет</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <div>
          <label htmlFor="t-level" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Вибрати рівень <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select id="t-level" value={form.level} onChange={set('level')}
              disabled={!form.subject}
              className="form-input appearance-none pr-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Оберіть рівень</option>
              {getLevels().map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
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