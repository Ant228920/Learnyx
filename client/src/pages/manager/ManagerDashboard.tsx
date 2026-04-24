import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import ConfirmModal from '../../features/auth/ConfirmModal';
import SuccessModal from '../../features/auth/SuccessModal';

type ApplicantType = 'Учень' | 'Вчитель';

interface Applicant {
  id: number;
  name: string;
  email: string;
  type: ApplicantType;
  subject: string;
  level: string;
  date: string;
  phone: string;
  telegram: string;
}

const INITIAL_APPLICANTS: Applicant[] = [
  { id: 1, name: 'Ковальчук Олена Ігорівна', email: 'o.kovalchuk@email.com', type: 'Учень', subject: 'Англійська мова', level: 'B2 (Upper-Intermediate)', date: '24.05.2024', phone: '+380 67 123 45 67', telegram: '@elena_learnyx' },
  { id: 2, name: 'Дмитрук Валерій Павлович', email: 'v.dmytruk@email.com', type: 'Вчитель', subject: 'Фізика', level: 'ЗНО Підготовка', date: '23.05.2024', phone: '+380 67 123 45 67', telegram: '@valerii_physics' },
  { id: 3, name: 'Сидоренко Максим Вікторович', email: 'm.sydorenko@email.com', type: 'Учень', subject: 'Математика', level: '9 клас', date: '24.05.2024', phone: '+380 67 123 45 67', telegram: '@max_math' },
  { id: 4, name: 'Іванов Дмитро Сергійович', email: 'd.ivanov@email.com', type: 'Учень', subject: 'Українська мова', level: '4 клас', date: '23.05.2024', phone: '+380 67 123 45 67', telegram: '@dmytro_school' },
  { id: 5, name: 'Ткаченко Софія Юріївна', email: 's.tkachenko@email.com', type: 'Учень', subject: 'Інформатика', level: '7 клас', date: '22.05.2024', phone: '+380 67 123 45 67', telegram: '@sofia_code' },
];

type FilterType = 'Усі' | 'Учень' | 'Вчитель';
type FilterSubject = 'Усі' | 'Англійська мова' | 'Фізика' | 'Математика' | 'Українська мова' | 'Інформатика';

const navItems = [
  { label: 'Дашборд', active: false },
  { label: 'Заявки', active: true },
  { label: 'Звітність', active: false },
  { label: 'Підбір', active: false },
];

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [filterType, setFilterType] = useState<FilterType>('Усі');
  const [filterSubject, setFilterSubject] = useState<FilterSubject>('Усі');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{ type: 'approve' | 'reject'; id: number } | null>(null);
  // Success modal state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = useMemo(() =>
    applicants.filter((a) =>
      (filterType === 'Усі' || a.type === filterType) &&
      (filterSubject === 'Усі' || a.subject === filterSubject)
    ), [applicants, filterType, filterSubject]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? applicants[0];

  const handleConfirm = () => {
    if (!confirmModal) return;
    const { type, id } = confirmModal;

    // Remove from list
    setApplicants((prev) => prev.filter((a) => a.id !== id));

    const name = applicants.find((a) => a.id === id)?.name ?? '';
    setConfirmModal(null);
    setSuccessMessage(
      type === 'approve'
        ? `Заявку від ${name} успішно прийнято!`
        : `Заявку від ${name} відхилено.`
    );
  };

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8f9fb]">
      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 w-64 h-full bg-white border-r border-[#dee1e6] flex flex-col z-30">
        <div className="flex items-center gap-3 p-6">
          <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
            </svg>
          </div>
          <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
        </div>

        <nav aria-label="Розділи застосунку" className="flex flex-1 flex-col gap-2 px-4 py-0">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-colors ${
                item.active ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`font-inter text-sm font-medium ${item.active ? 'text-white' : 'text-[#565d6d]'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="border-t border-[#dee1e6] p-4">
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-gray-50 transition-colors">
            <span className="font-inter text-sm font-medium text-[#565d6d]">Налаштування</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 pl-64 min-h-screen">
        {/* Header */}
        <header className="h-16 flex items-center justify-end px-8 bg-white border-b border-[#dee1e6] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-inter font-bold text-slate-900 text-sm">{user?.firstName} {user?.lastName}</span>
              <span className="font-inter font-bold text-[#1f8cf9] text-xs tracking-[0.50px] uppercase">Адміністратор</span>
            </div>
            <div className="relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="font-inter font-bold text-[#1f8cf9] text-sm">{user?.firstName?.[0]}</span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-16 py-10">
          <div className="max-w-[1440px] mx-auto">
            {/* Title */}
            <div className="mb-6">
              <h1 className="font-poppins text-slate-900 text-2xl leading-8">Заявки</h1>
              <p className="font-inter text-[#565d6d] text-lg leading-7 mt-1">Керування новими реєстраціями студентів та викладачів.</p>
            </div>

            <div className="flex items-start gap-8">
              {/* Left: list */}
              <section className="flex flex-col gap-4 flex-1">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2px_#0000000d] w-fit">
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#dee1e6] bg-white cursor-pointer min-w-[160px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                    <span className="font-inter text-slate-800 text-sm">Тип: {filterType}</span>
                    <select
                      aria-label="Фільтр за типом"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                    >
                      {(['Усі', 'Учень', 'Вчитель'] as FilterType[]).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#dee1e6] bg-white cursor-pointer min-w-[200px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                    <span className="font-inter text-slate-800 text-sm">Предмет: {filterSubject}</span>
                    <select
                      aria-label="Фільтр за предметом"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value as FilterSubject)}
                    >
                      {(['Усі', 'Англійська мова', 'Фізика', 'Математика', 'Українська мова', 'Інформатика'] as FilterSubject[]).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                </div>

                {/* Applicant list */}
                <div className="flex flex-col gap-4 pt-2">
                  {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#dee1e6] p-8 text-center">
                      <p className="font-inter text-[#565d6d] text-sm">Немає заявок за обраними фільтрами</p>
                    </div>
                  ) : (
                    filtered.map((a) => {
                      const isSelected = a.id === selected?.id;
                      const isTeacher = a.type === 'Вчитель';
                      return (
                        <article
                          key={a.id}
                          className={`flex items-center gap-4 p-5 bg-white rounded-2xl border transition-colors ${isSelected ? 'border-[#1f8cf9]' : 'border-[#dee1e6]'}`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="font-inter font-bold text-[#1f8cf9] text-lg">{a.name[0]}</span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-poppins font-bold text-slate-900 text-base whitespace-nowrap">{a.name}</span>
                              <span className={`px-2 py-0.5 rounded-full font-inter font-semibold text-xs ${isTeacher ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'}`}>
                                {a.type}
                              </span>
                            </div>
                            <span className="font-inter text-[#565d6d] text-xs">{a.email}</span>
                          </div>
                          <div className="flex flex-col w-40">
                            <span className="font-inter font-semibold text-slate-800 text-sm">{a.subject}</span>
                            <span className="font-inter text-[#565d6d] text-xs">{a.level}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
                            <span className="font-inter text-[#565d6d] text-xs whitespace-nowrap">{a.date}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedId(a.id)}
                            aria-label={`Переглянути заявку ${a.name}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1f8cf933] hover:bg-blue-50 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            <span className="font-inter font-bold text-[#1f8cf9] text-xs">Переглянути</span>
                          </button>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Right: detail card */}
              {selected && (
                <aside className="w-[360px] flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between p-6 bg-[#1f8cf91a]">
                      <div>
                        <p className="font-poppins font-bold text-slate-900 text-xl leading-7">
                          {selected.type === 'Вчитель' ? 'Анкета вчителя' : 'Анкета студента'}
                        </p>
                        <p className="font-inter font-bold text-[#1f8cf9] text-xs leading-4">Перевірка даних реєстрації</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="font-inter font-bold text-[#1f8cf9] text-lg">{selected.name[0]}</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col gap-6 px-6 pt-6 pb-6">
                      <span className={`px-2 py-0.5 rounded-full font-inter font-bold text-xs w-fit ${selected.type === 'Вчитель' ? 'bg-[#ebe3ff] text-purple-700' : 'bg-[#e0faea] text-[#1a7bd9]'}`}>
                        {selected.type}
                      </span>

                      {/* Fields */}
                      {[
                        { label: selected.type === 'Вчитель' ? 'ПІБ ВЧИТЕЛЯ' : 'ПІБ СТУДЕНТА', value: selected.name },
                        { label: 'НОМЕР ТЕЛЕФОНУ', value: selected.phone },
                        { label: 'ЕЛЕКТРОННА ПОШТА', value: selected.email },
                        { label: 'TELEGRAM НІКНЕЙМ', value: selected.telegram },
                        { label: 'ОБРАНИЙ ПРЕДМЕТ', value: selected.subject },
                        { label: 'РІВЕНЬ ПІДГОТОВКИ', value: selected.level },
                      ].map((field) => (
                        <div key={field.label} className="flex flex-col gap-1 pb-3 border-b border-[#f4f4f6]">
                          <span className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[1px] leading-[15px]">{field.label}</span>
                          <span className="font-inter font-semibold text-slate-800 text-sm leading-5">{field.value}</span>
                        </div>
                      ))}

                      {/* Action buttons */}
                      <div className="flex flex-col gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ type: 'approve', id: selected.id })}
                          aria-label={`Прийняти заявку ${selected.name}`}
                          className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors shadow-[0px_10px_15px_-3px_#bfdbfe]"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          Прийняти заявку
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ type: 'reject', id: selected.id })}
                          aria-label={`Відхилити заявку ${selected.name}`}
                          className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#e64c4c] rounded-2xl font-inter font-medium text-white text-sm hover:bg-red-600 transition-colors shadow-[0px_10px_15px_-3px_#fee2e2]"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          Відхилити
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-16 py-8 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <p className="font-inter text-[#565d6d] text-xs">© 2024 LearnYX Ecosystem. Платформа для професійного навчання та зростання.</p>
            <nav aria-label="Корисні посилання" className="flex items-center gap-6">
              {['Політика конфіденційності', 'Центр допомоги', 'Умови використання'].map((l) => (
                <a key={l} href="#" className="font-inter font-bold text-[#565d6d] text-xs hover:text-slate-900 transition-colors">{l}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          type={confirmModal.type}
          applicantName={applicants.find((a) => a.id === confirmModal.id)?.name ?? ''}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Success Modal after action */}
      {successMessage && (
        <SuccessModal
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
        />
      )}
    </div>
  );
}