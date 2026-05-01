import { useState } from 'react';
import { IconSend, IconPhone, IconMail, IconAtSign } from '../../components/layout/icons';
import { authApi } from '../../services/api';
import type { RegisterTeacherDTO } from '../../services/api';

interface Props {
  onSuccess: () => void;
}

const SUBJECTS = [
  'Англійська мова',
  'Українська мова',
  'Математика',
  'Інформатика',
  'Історія України',
];
const LEVELS = ['Початковий', 'Середній', 'Просунутий'];

const initialForm: RegisterTeacherDTO = {
  lastName: '',
  firstName: '',
  middleName: '',
  phone: '',
  email: '',
  telegram: '',
  subject: '',
  level: '',
};

export default function RegisterTeacherForm({ onSuccess }: Props) {
  const [form, setForm] = useState<RegisterTeacherDTO>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: RegisterTeacherDTO) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: RegisterTeacherDTO) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = (): string | null => {
    if (!form.lastName.trim()) return 'Введіть прізвище';
    if (!form.firstName.trim()) return "Введіть ім'я";
    if (!form.phone.trim()) return 'Введіть номер телефону';
    if (!form.email.trim()) return 'Введіть email';
    if (!form.telegram.trim()) return 'Введіть Telegram нікнейм';
    if (!form.subject) return 'Оберіть предмет';
    if (!form.level) return 'Оберіть рівень';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await authApi.registerTeacher(form);
      onSuccess();
    } catch {
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]';

  return (
    <div className="flex flex-col gap-4">
      {/* Прізвище + Ім'я */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="teacher-lastName" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Прізвище <span className="text-red-500">*</span>
          </label>
          <input id="teacher-lastName" name="lastName" value={form.lastName} onChange={handleInputChange} placeholder="Коваль" className={inputClass} />
        </div>
        <div>
          <label htmlFor="teacher-firstName" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Ім'я <span className="text-red-500">*</span>
          </label>
          <input id="teacher-firstName" name="firstName" value={form.firstName} onChange={handleInputChange} placeholder="Олександр" className={inputClass} />
        </div>
      </div>

      {/* По батькові */}
      <div>
        <label htmlFor="teacher-middleName" className="block text-xs font-semibold text-[#565d6d] mb-1">
          По батькові <span className="text-[#9095a1] font-normal">(опціонально)</span>
        </label>
        <input id="teacher-middleName" name="middleName" value={form.middleName} onChange={handleInputChange} placeholder="Васильович" className={inputClass} />
      </div>

      {/* Телефон + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="teacher-phone" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Номер телефону <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]">
              <IconPhone />
            </span>
            <input id="teacher-phone" name="phone" value={form.phone} onChange={handleInputChange} placeholder="+380" className={`${inputClass} pl-9`} />
          </div>
        </div>
        <div>
          <label htmlFor="teacher-email" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]">
              <IconMail />
            </span>
            <input id="teacher-email" name="email" value={form.email} onChange={handleInputChange} placeholder="example@mail.com" type="email" className={`${inputClass} pl-9`} />
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div>
        <label htmlFor="teacher-telegram" className="block text-xs font-semibold text-[#565d6d] mb-1">
          Telegram nickname <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]">
            <IconAtSign />
          </span>
          <input id="teacher-telegram" name="telegram" value={form.telegram} onChange={handleInputChange} placeholder="nickname" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {/* Предмет + Рівень — accessible selects with htmlFor + id */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="teacher-subject" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Вибрати предмет <span className="text-red-500">*</span>
          </label>
          <select
            id="teacher-subject"
            name="subject"
            value={form.subject}
            onChange={handleSelectChange}
            className={inputClass}
            aria-label="Вибрати предмет"
          >
            <option value="">Оберіть предмет</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="teacher-level" className="block text-xs font-semibold text-[#565d6d] mb-1">
            Вибрати рівень <span className="text-red-500">*</span>
          </label>
          <select
            id="teacher-level"
            name="level"
            value={form.level}
            onChange={handleSelectChange}
            className={inputClass}
            aria-label="Вибрати рівень"
          >
            <option value="">Оберіть рівень</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-60 mt-1"
      >
        {loading ? 'Надсилання...' : (
          <>
            Підтвердити
            <IconSend />
          </>
        )}
      </button>
    </div>
  );
}