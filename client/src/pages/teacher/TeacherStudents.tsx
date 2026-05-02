import { useState, useRef } from 'react';
import TeacherLayout from './TeacherLayout';

interface Student { id: number; name: string; subject: string; level: string; status: 'Активний' | 'Неактивний'; email: string; phone: string; avatarBg: string; }
interface Request { id: number; name: string; subject: string; level: string; days: string; time: string; avatarBg: string; }

const ALL_STUDENTS: Student[] = [
  { id: 1, name: 'Олена Ковальчук', subject: 'Математика', level: 'B2', status: 'Активний', email: 'o.kovalchuk@email.com', phone: '+380 67 123 45 67', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Максим Сидоренко', subject: 'Математика', level: 'A1', status: 'Активний', email: 'm.sydorenko@email.com', phone: '+380 67 234 56 78', avatarBg: 'bg-[#dafdf8]' },
  { id: 3, name: 'Анна Мельник', subject: 'Англійська мова', level: 'C1', status: 'Неактивний', email: 'a.melnyk@email.com', phone: '+380 67 345 67 89', avatarBg: 'bg-[#ebe3ff]' },
  { id: 4, name: 'Дмитро Іванов', subject: 'Математика', level: 'B1', status: 'Активний', email: 'd.ivanov@email.com', phone: '+380 67 456 78 90', avatarBg: 'bg-[#e7eff9]' },
  { id: 5, name: 'Софія Ткаченко', subject: 'Математика', level: 'A2', status: 'Активний', email: 's.tkachenko@email.com', phone: '+380 67 567 89 01', avatarBg: 'bg-[#e7eff9]' },
  { id: 6, name: 'Василь Петренко', subject: 'Математика', level: 'B1', status: 'Активний', email: 'v.petrenko@email.com', phone: '+380 67 678 90 12', avatarBg: 'bg-[#dafdf8]' },
  { id: 7, name: 'Катерина Бондаренко', subject: 'Англійська мова', level: 'B2', status: 'Активний', email: 'k.bondarenko@email.com', phone: '+380 67 789 01 23', avatarBg: 'bg-[#ebe3ff]' },
  { id: 8, name: 'Олег Марченко', subject: 'Математика', level: 'C1', status: 'Активний', email: 'o.marchenko@email.com', phone: '+380 67 890 12 34', avatarBg: 'bg-[#e7eff9]' },
  { id: 9, name: 'Ірина Шевченко', subject: 'Математика', level: 'A1', status: 'Неактивний', email: 'i.shevchenko@email.com', phone: '+380 67 901 23 45', avatarBg: 'bg-[#dafdf8]' },
  { id: 10, name: 'Микола Коваль', subject: 'Англійська мова', level: 'B1', status: 'Активний', email: 'm.koval@email.com', phone: '+380 67 012 34 56', avatarBg: 'bg-[#e7eff9]' },
];

const INITIAL_REQUESTS: Request[] = [
  { id: 1, name: 'Іван Петренко', subject: 'Математика', level: '5 - 11 клас', days: 'Пн, Ср, Пт', time: '16:00 - 18:00', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Марія Зайцева', subject: 'Англійська мова', level: 'B1 - Середній', days: 'Вт, Чт', time: '14:30 - 16:00', avatarBg: 'bg-[#dafdf8]' },
];

const PAGE_SIZE = 5;

export default function TeacherStudents() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [students, setStudents] = useState<Student[]>(ALL_STUDENTS.slice(0, PAGE_SIZE));
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);
  const nextId = useRef(ALL_STUDENTS.length + 1);

  const handleLoadMore = () => {
    const next = visibleCount + PAGE_SIZE;
    setStudents(ALL_STUDENTS.slice(0, next));
    setVisibleCount(next);
  };

  const handleConfirmRequest = (req: Request) => {
    const newStudent: Student = {
      id: ++nextId.current,
      name: req.name,
      subject: req.subject,
      level: req.level,
      status: 'Активний',
      email: `${req.name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: '+380 67 000 00 00',
      avatarBg: req.avatarBg,
    };
    setStudents(prev => [newStudent, ...prev]);
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setConfirmedMsg(`${req.name} доданий до ваших учнів! Години ${req.time} (${req.days}) додано до розкладу.`);
  };

  return (
    <TeacherLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Керування учнями</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Ваш персональний список активних студентів та доступних запитів на навчання.</p>
        </div>

        <article className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12] w-fit">
          <div className="w-14 h-14 bg-[#1f8cf91a] rounded-2xl flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Загальна кількість учнів</p>
            <p className="font-inter font-black text-slate-900 text-4xl mt-1">{students.length}</p>
          </div>
        </article>

        <div className="flex items-start gap-8">
          {/* Students */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="font-poppins font-bold text-slate-900 text-xl">Ваші учні</h2>
            <div className="flex flex-col gap-3">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dee1e6]">
                  <div className={`w-11 h-11 rounded-full ${s.avatarBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-inter font-bold text-[#1f8cf9] text-base">{s.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-poppins font-bold text-slate-900 text-base">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <span className="font-inter text-[#565d6d] text-xs">{s.subject}</span>
                      <span className="px-2 py-0.5 bg-[#f4f4f6] rounded-full font-inter font-bold text-[#565d6d] text-[10px]">{s.level}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Активний' ? 'bg-[#26d962]' : 'bg-[#9095a1]'}`} />
                      <span className="font-inter text-[#565d6d] text-xs">{s.status}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setProfileStudent(s)}
                    className="px-4 py-2 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors flex-shrink-0">
                    Перегляд профілю
                  </button>
                </div>
              ))}
            </div>
            {visibleCount < ALL_STUDENTS.length && (
              <button type="button" onClick={handleLoadMore}
                className="w-full py-4 bg-white border border-[#dee1e6] rounded-2xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
                Завантажити ще ({ALL_STUDENTS.length - visibleCount} залишилось)
              </button>
            )}
          </div>

          {/* Requests */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-slate-900 text-sm tracking-[0.60px] uppercase">Доступні учні</h2>
              {requests.length > 0 && (
                <span className="px-2.5 py-0.5 bg-[#1f8cf9] rounded-full font-inter font-bold text-white text-[10px]">
                  Нових: {requests.length}
                </span>
              )}
            </div>
            {requests.length === 0 ? (
              <p className="font-inter text-[#9095a1] text-sm">Немає нових запитів</p>
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-[#dee1e6] p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${r.avatarBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="font-inter font-bold text-[#1f8cf9] text-sm">{r.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-poppins font-bold text-slate-900 text-sm">{r.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-inter text-[#565d6d] text-xs">{r.subject}</span>
                          <span className="px-1.5 py-0.5 bg-[#f4f4f6] rounded font-inter font-bold text-[#565d6d] text-[9px]">{r.level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span className="font-inter text-[#565d6d] text-xs">{r.days}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="font-inter text-[#565d6d] text-xs">{r.time}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleConfirmRequest(r)}
                      className="w-full py-2.5 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                      Підтвердити запит
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setProfileStudent(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-[#1f8cf91a]">
              <div>
                <p className="font-poppins font-bold text-slate-900 text-xl">Профіль учня</p>
                <p className="font-inter font-bold text-[#1f8cf9] text-xs mt-0.5">Деталі студента</p>
              </div>
              <div className={`w-14 h-14 rounded-full ${profileStudent.avatarBg} flex items-center justify-center`}>
                <span className="font-inter font-bold text-[#1f8cf9] text-2xl">{profileStudent.name[0]}</span>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-poppins font-bold text-slate-900 text-lg">{profileStudent.name}</h3>
                <span className={`px-2.5 py-1 rounded-full font-inter font-bold text-xs ${profileStudent.status === 'Активний' ? 'bg-[#e0faea] text-[#1a7bd9]' : 'bg-gray-100 text-[#9095a1]'}`}>
                  {profileStudent.status}
                </span>
              </div>
              {[
                { label: 'ПРЕДМЕТ', value: profileStudent.subject, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
                { label: 'РІВЕНЬ', value: profileStudent.level, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg> },
                { label: 'EMAIL', value: profileStudent.email, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> },
                { label: 'ТЕЛЕФОН', value: profileStudent.phone, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-1 pb-3 border-b border-[#f4f4f6] last:border-0 last:pb-0">
                  <span className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[1px] uppercase">{f.label}</span>
                  <div className="flex items-center gap-2">{f.icon}<span className="font-inter font-semibold text-slate-800 text-sm">{f.value}</span></div>
                </div>
              ))}
              <button type="button" onClick={() => setProfileStudent(null)}
                className="w-full py-3 mt-2 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed message */}
      {confirmedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmedMsg(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">{confirmedMsg}</p>
            <button onClick={() => setConfirmedMsg(null)} className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600">OK</button>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}