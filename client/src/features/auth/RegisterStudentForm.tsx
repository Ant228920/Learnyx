import { useState } from 'react';
import { IconSend, IconPhone, IconMail, IconAtSign } from '../../components/layout/icons';
import { authApi } from '../../services/api';
import type { RegisterStudentDTO } from '../../services/api';

interface Props {
  onSuccess: () => void;
}

const initialForm: RegisterStudentDTO = {
  lastName: '',
  firstName: '',
  middleName: '',
  phone: '',
  email: '',
  telegram: '',
};

export default function RegisterStudentForm({ onSuccess }: Props) {
  const [form, setForm] = useState<RegisterStudentDTO>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: RegisterStudentDTO) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = (): string | null => {
    if (!form.lastName.trim()) return 'Введіть прізвище';
    if (!form.firstName.trim()) return "Введіть ім'я";
    if (!form.phone.trim()) return 'Введіть номер телефону';
    if (!form.email.trim()) return 'Введіть email';
    if (!form.telegram.trim()) return 'Введіть Telegram нікнейм';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      await authApi.registerStudent(form);
      onSuccess();
    } catch {
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-lastName" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Прізвище <span className="text-red-500">*</span>
          </label>
          <input id="s-lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Коваль" className="form-input" />
        </div>
        <div>
          <label htmlFor="s-firstName" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
            Ім'я <span className="text-red-500">*</span>
          </label>
          <input id="s-firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Олександр" className="form-input" />
        </div>
      </div>

      <div>
        <label htmlFor="s-middleName" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          По батькові <span className="text-[#9095a1] font-normal">(опціонально)</span>
        </label>
        <input id="s-middleName" name="middleName" value={form.middleName} onChange={handleChange} placeholder="Миколайович" className="form-input" />
      </div>

      <div>
        <label htmlFor="s-phone" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Номер телефону <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconPhone /></span>
          <input id="s-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+380 00 000 00 00" className="form-input-icon" />
        </div>
      </div>

      <div>
        <label htmlFor="s-email" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconMail /></span>
          <input id="s-email" name="email" value={form.email} onChange={handleChange} placeholder="example@mail.com" type="email" className="form-input-icon" />
        </div>
      </div>

      <div>
        <label htmlFor="s-telegram" className="block text-xs font-semibold text-[#565d6d] mb-1 font-inter">
          Telegram nickname <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9095a1]"><IconAtSign /></span>
          <input id="s-telegram" name="telegram" value={form.telegram} onChange={handleChange} placeholder="username" className="form-input-icon" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center font-inter">{error}</p>}

      <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-1">
        {loading ? 'Надсилання...' : (<>Підтвердити <IconSend /></>)}
      </button>
    </div>
  );
}