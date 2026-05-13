import { useState, useEffect } from 'react';
import { useProfile } from './hooks/useProfile';

interface Props {
  onCancel: () => void;
}

export default function ProfileContent({ onCancel }: Props) {
  const { profile, loading, error, saving, success, updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(`${profile.first_name} ${profile.last_name}`.trim());
      setTelegram(profile.telegram_nickname);
      setPhone(profile.phone);
    }
  }, [profile]);

  const handleSave = async () => {
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts[0] ?? '';
    const last_name = parts.slice(1).join(' ');
    await updateProfile({ first_name, last_name, phone, telegram_nickname: telegram });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 font-inter text-[#565d6d]">
      Завантаження...
    </div>
  );

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Мій профіль</h1>
        <p className="font-inter text-[#565d6d] text-lg mt-2">
          Керуйте вашою персональною інформацією та налаштовуйте відображення аватару.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-inter text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#e0faea] rounded-xl border border-[#bbf7d0]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="font-inter text-sm font-semibold text-[#15803d]">Зміни збережено!</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#dee1e6]">
          <h2 className="font-poppins font-bold text-slate-900 text-lg">Персональні дані</h2>
          <p className="font-inter text-[#565d6d] text-sm mt-1">
            Ці дані будуть доступні викладачам та адміністрації
          </p>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Avatar section */}
          <div>
            <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-4">
              Фото профілю
            </p>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#e7eff9] flex items-center justify-center flex-shrink-0">
                <span className="font-inter font-bold text-[#1f8cf9] text-2xl">
                  {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm opacity-40 cursor-not-allowed"
                  >
                    Завантажити нове
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 border border-red-300 rounded-xl font-inter font-medium text-red-500 text-sm opacity-40 cursor-not-allowed"
                  >
                    Видалити
                  </button>
                </div>
                <p className="font-inter text-[#9095a1] text-xs">
                  Дозволені формати: JPG, PNG. Максимальний розмір файлу — 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-medium text-[#565d6d] text-sm">
                ПІБ (Повне ім'я)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-medium text-[#565d6d] text-sm">
                Telegram Nickname
              </label>
              <input
                type="text"
                value={telegram}
                onChange={e => setTelegram(e.target.value)}
                placeholder="@username"
                className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-medium text-[#565d6d] text-sm">
                Номер телефону
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+380..."
                className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-medium text-[#565d6d] text-sm">
                Електронна пошта
              </label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-[#f8f9fb] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#dee1e6]">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-[#dee1e6] rounded-xl font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-6 py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Збереження...' : 'Зберегти зміни'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
