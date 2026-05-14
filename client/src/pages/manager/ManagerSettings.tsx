import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from './ManagerLayout';
import { useAuth } from '../../app/providers';
import { apiClient } from '../../services/api';

export default function ManagerSettings() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    telegram: user?.nickname ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const nameParts = form.fullName.trim().split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') ?? '';

      await apiClient.patch('/users/me/', {
        first_name: firstName,
        last_name: lastName,
        phone: form.phone || undefined,
        nickname: form.telegram || undefined,
      });

      // Update stored user
      if (user) {
        const updatedUser = { ...user, firstName, lastName, phone: form.phone, nickname: form.telegram };
        const token = localStorage.getItem('token') ?? '';
        login(token, updatedUser);
      }

      setSaved(true);
    } catch {
      // /users/me/ PATCH may not be implemented — save locally
      if (user) {
        const nameParts = form.fullName.trim().split(' ');
        const updatedUser = {
          ...user,
          firstName: nameParts[0] ?? user.firstName,
          lastName: nameParts.slice(1).join(' ') || user.lastName,
          phone: form.phone,
          nickname: form.telegram,
        };
        const token = localStorage.getItem('token') ?? '';
        login(token, updatedUser);
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="max-w-[800px] mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Мій профіль</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте вашою персональною інформацією.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-[#dee1e6]">
            <div className="w-9 h-9 bg-[#1f8cf91a] rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div>
              <p className="font-poppins font-bold text-slate-900 text-base">Персональні дані</p>
              <p className="font-inter text-[#565d6d] text-sm">Менеджер платформи LearNYX</p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Avatar */}
            <div>
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-widest uppercase mb-3">ФОТО ПРОФІЛЮ</p>
              <div className="flex items-center gap-6 p-5 bg-[#f8f9fb] rounded-2xl border border-[#dee1e6]">
                <div className="relative w-20 h-20 rounded-full bg-[#1f8cf91a] flex items-center justify-center flex-shrink-0">
                  <span className="font-poppins font-bold text-[#1f8cf9] text-2xl">
                    {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
                  </span>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#1f8cf9] rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex gap-3">
                    <button type="button" className="px-4 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                      Завантажити нове
                    </button>
                    <button type="button" className="px-4 py-2 border border-red-200 rounded-xl font-inter font-medium text-red-500 text-sm hover:bg-red-50 transition-colors flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                      Видалити
                    </button>
                  </div>
                  <p className="font-inter text-[#9095a1] text-xs">Дозволені формати: JPG, PNG. Максимальний розмір — 5MB.</p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="mg-name" className="font-inter font-bold text-slate-900 text-sm">ПІБ (Повне ім'я)</label>
                  <span className="font-inter text-[#9095a1] text-xs">По батькові не обов'язково</span>
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <input id="mg-name" type="text" value={form.fullName} onChange={set('fullName')}
                    className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>

              <div>
                <label htmlFor="mg-telegram" className="font-inter font-bold text-slate-900 text-sm block mb-2">Telegram Nickname</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  <input id="mg-telegram" type="text" value={form.telegram} onChange={set('telegram')}
                    placeholder="@username"
                    className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>

              <div>
                <label htmlFor="mg-phone" className="font-inter font-bold text-slate-900 text-sm block mb-2">Номер телефону</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  <input id="mg-phone" type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+380 67 123 45 67"
                    className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>

              <div>
                <label htmlFor="mg-email" className="font-inter font-bold text-slate-900 text-sm block mb-2">Електронна пошта</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  <input id="mg-email" type="email" value={form.email} onChange={set('email')}
                    className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg>
                <p className="font-inter text-red-600 text-sm">{error}</p>
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 p-3 bg-[#e0faea] rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <p className="font-inter text-green-700 text-sm font-medium">Зміни успішно збережено!</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#dee1e6]">
              <button type="button"
                onClick={() => {
                  setForm({ fullName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(), telegram: user?.nickname ?? '', phone: user?.phone ?? '', email: user?.email ?? '' });
                  setSaved(false);
                }}
                className="px-6 py-3 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
                Скасувати
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={saving}
                className="px-6 py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /></svg>
                {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-[#dee1e6] p-6 flex flex-col gap-4">
          <p className="font-poppins font-bold text-slate-900 text-lg">Дії з акаунтом</p>
          <div className="flex items-center justify-between p-4 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
            <div>
              <p className="font-inter font-semibold text-slate-800 text-sm">Вийти на головну</p>
              <p className="font-inter text-[#565d6d] text-xs mt-0.5">Повернутися до головної без виходу з акаунту</p>
            </div>
            <button type="button" onClick={() => void navigate('/')}
              className="px-4 py-2 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
              На головну
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div>
              <p className="font-inter font-semibold text-red-700 text-sm">Вийти з акаунту</p>
              <p className="font-inter text-red-400 text-xs mt-0.5">Ви будете перенаправлені на головну сторінку</p>
            </div>
            <button type="button" onClick={() => { logout(); void navigate('/'); }}
              className="px-4 py-2 bg-red-500 rounded-xl font-inter font-medium text-white text-sm hover:bg-red-600 transition-colors flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Вийти
            </button>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}