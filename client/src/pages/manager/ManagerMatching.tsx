import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

interface Slot {
  id: number;
  day: string;
  from: string;
  to: string;
}

interface Teacher {
  id: number;
  name: string;
  experience: string;
  level: string;
  subjects: string[];
  avatarBg: string;
}

const STUDENTS = [
  'Сидоренко Максим (А-12)',
  'Ковальчук Олена',
  'Іванов Дмитро',
  'Ткаченко Софія',
];

const SUBJECTS = ['Англійська мова', 'Математика', 'Українська мова', 'Історія України', 'Інформатика'];

const LEVELS_ENGLISH = ['A1 - Початковий', 'A2 - Елементарний', 'B1 - Середній', 'B2 - Вище середнього', 'C1 - Просунутий', 'C2 - Досконалий'];
const LEVELS_OTHER = ['1 - 4 клас', '5 - 11 клас'];

function getLevels(subject: string): string[] {
  return subject === 'Англійська мова' ? LEVELS_ENGLISH : LEVELS_OTHER;
}

const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

const MOCK_TEACHERS: Teacher[] = [
  { id: 1, name: 'Марія Ковальчук', experience: '8 років', level: 'B2 - C1 (Advanced)', subjects: ['Англійська мова', 'Німецька мова'], avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Олег Петренко', experience: '5 років', level: '5-11 класи (Підготовка до ЗНО)', subjects: ['Математика', 'Фізика'], avatarBg: 'bg-[#dafdf8]' },
  { id: 3, name: 'Анна Сидоренко', experience: '12 років', level: 'C1 - C2 (Mastery)', subjects: ['Англійська мова', 'Підготовка до TOEFL'], avatarBg: 'bg-[#ebe3ff]' },
];

const NAV_ITEMS = [
  { label: 'Дашборд', active: false, path: '/manager' },
  { label: 'Заявки', active: false, path: '/manager/applications' },
  { label: 'Підписки', active: false, path: '/manager/subscriptions' },
  { label: 'Звітність', active: false, path: '/manager/reports' },
  { label: 'Підбір', active: true, path: '/manager/matching' },
];

const FOOTER_LINKS = ['Політика конфіденційності', 'Центр допомоги', 'Умови використання'];

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ManagerMatching() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(STUDENTS[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [level, setLevel] = useState(getLevels(SUBJECTS[0])[2]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searched, setSearched] = useState(false);
  const [successTeacher, setSuccessTeacher] = useState<string | null>(null);

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setLevel(getLevels(newSubject)[0]);
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { id: Date.now(), day: DAYS[0], from: '14:00', to: '16:00' }]);
  };

  const removeSlot = (id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: number, field: keyof Slot, value: string) => {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSearch = () => {
    setTeachers(MOCK_TEACHERS);
    setSearched(true);
  };

  const handleAssign = (name: string) => {
    setSuccessTeacher(name);
    // Скидаємо всі результати і форму після призначення
    setTeachers([]);
    setSearched(false);
    setSlots([]);
    setStudent(STUDENTS.filter((s) => s !== student)[0] ?? STUDENTS[0]);
    setSubject(SUBJECTS[0]);
    setLevel(getLevels(SUBJECTS[0])[0]);
  };

  const selectClass = 'border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-full';

  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 flex h-full w-64 flex-col border-r border-[#dee1e6] bg-white z-30">
        <div className="flex w-full items-center gap-3 p-6">
          <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center"><IconLogo /></div>
          <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
        </div>
        <div className="flex flex-1 flex-col w-full pt-4">
          <nav aria-label="Розділи" className="flex flex-1 flex-col gap-2 px-4">
            {NAV_ITEMS.map((item) => (
              <button key={item.label} type="button" aria-current={item.active ? 'page' : undefined}
                onClick={() => void navigate(item.path)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-colors ${item.active ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]' : 'hover:bg-gray-50'}`}>
                <span className={`font-inter text-sm font-medium ${item.active ? 'text-white' : 'text-[#565d6d]'}`}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-[#dee1e6] p-4 w-full">
          <button type="button" onClick={() => { logout(); void navigate('/'); }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="font-inter text-sm font-medium text-[#565d6d]">Налаштування</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 pl-64 min-h-screen">
        <header className="h-16 flex items-center justify-end px-10 bg-white border-b border-[#dee1e6] sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="font-inter font-bold text-slate-900 text-sm">{user?.firstName} {user?.lastName}</span>
              <span className="font-inter font-bold text-[#1f8cf9] text-[10px] tracking-[0.50px] uppercase">Адміністратор</span>
            </div>
            <div className="relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-[#f4f4f6]">
              <span className="font-inter font-bold text-[#1f8cf9] text-sm">{user?.firstName?.[0]}</span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-16 py-10 w-full">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
            <div>
              <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Підбір викладача</h1>
              <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">
                Налаштуйте параметри запиту та знайдіть ідеального викладача для студента.
              </p>
            </div>

            <div className="flex items-start gap-8">
              {/* Left: form */}
              <div className="flex flex-col gap-6 w-[380px] flex-shrink-0">

                {/* Found count */}
                {searched && (
                  <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase self-end">
                    ЗНАЙДЕНО: {teachers.length} ВИКЛАДАЧІВ
                  </p>
                )}

                {/* Main params */}
                <div className="flex flex-col gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6]">
                  <div>
                    <p className="font-poppins font-bold text-slate-900 text-xl leading-7">Основні параметри</p>
                    <p className="font-inter text-[#565d6d] text-sm mt-1">Виберіть учня та предмет для навчання</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="match-student" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Учень</label>
                    <div className="relative">
                      <select id="match-student" value={student} onChange={(e) => setStudent(e.target.value)} aria-label="Вибір учня" className={selectClass}>
                        {STUDENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="match-subject" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Предмет</label>
                      <div className="relative">
                        <select id="match-subject" value={subject} onChange={(e) => handleSubjectChange(e.target.value)} aria-label="Вибір предмету" className={selectClass}>
                          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="match-level" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Рівень</label>
                      <div className="relative">
                        <select id="match-level" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Вибір рівня" className={selectClass}>
                          {getLevels(subject).map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slots */}
                <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-poppins font-bold text-slate-900 text-xl leading-7">Вільні слоти учня</p>
                      <p className="font-inter text-[#565d6d] text-sm mt-0.5">Додайте доступні часові інтервали</p>
                    </div>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#1f8cf9] font-inter font-bold text-[#1f8cf9] text-xs hover:bg-blue-50 transition-colors"
                    >
                      <IconPlus />
                      Додати слот
                    </button>
                  </div>

                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <button type="button" onClick={() => removeSlot(slot.id)} aria-label="Видалити слот" className="text-[#565d6d] hover:text-red-500 transition-colors flex-shrink-0">
                        <IconX />
                      </button>
                      <div className="relative flex-1">
                        <select
                          value={slot.day}
                          onChange={(e) => updateSlot(slot.id, 'day', e.target.value)}
                          aria-label="День тижня"
                          className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-full pr-7"
                        >
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                      <input
                        type="time"
                        value={slot.from}
                        onChange={(e) => updateSlot(slot.id, 'from', e.target.value)}
                        aria-label="Час початку"
                        className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-24"
                      />
                      <input
                        type="time"
                        value={slot.to}
                        onChange={(e) => updateSlot(slot.id, 'to', e.target.value)}
                        aria-label="Час завершення"
                        className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-24"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="flex items-center justify-center gap-2 py-3 w-full bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors mt-2"
                  >
                    <IconSearch />
                    Знайти викладачів
                  </button>
                </div>
              </div>

              {/* Right: results */}
              {searched && (
                <div className="flex flex-col gap-4 flex-1 animate-fade-in">
                  <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">
                    ЗНАЙДЕНО: {teachers.length} ВИКЛАДАЧІВ
                  </p>

                  {teachers.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dee1e6]">
                      <div className={`w-12 h-12 rounded-full ${t.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                        <span className="font-inter font-bold text-[#1f8cf9] text-lg">{t.name[0]}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <span className="font-poppins font-bold text-slate-900 text-base">{t.name}</span>
                        <span className="font-inter text-[#565d6d] text-xs">
                          Досвід: {t.experience} • Рівень: {t.level}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {t.subjects.map((s) => (
                            <span key={s} className="px-2.5 py-0.5 bg-[#f4f4f6] rounded-full font-inter font-medium text-[#565d6d] text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssign(t.name)}
                        aria-label={`Призначити викладача ${t.name}`}
                        className="px-5 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex-shrink-0"
                      >
                        Призначити
                      </button>
                    </div>
                  ))}

                  <button type="button" className="font-inter font-bold text-[#1f8cf9] text-sm text-center hover:underline mt-2">
                    Показати більше результатів
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="px-16 py-6 bg-white border-t border-[#dee1e6]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <p className="font-inter font-medium text-[#565d6d] text-xs">© 2024 LearnYX Ecosystem. Платформа для професійного навчання та зростання.</p>
            <nav aria-label="Нижня навігація" className="flex items-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <a key={link} href="#" className="font-inter font-bold text-[#565d6d] text-xs hover:text-slate-900 transition-colors">{link}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>

      {/* Success Modal */}
      {successTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSuccessTeacher(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900 text-center">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">
              Викладача <strong>{successTeacher}</strong> успішно призначено студенту.
            </p>
            <button onClick={() => setSuccessTeacher(null)}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}