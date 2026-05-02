import TeacherLayout from './TeacherLayout';

interface Student { id: number; name: string; subject: string; level: string; status: 'Активний' | 'Неактивний'; avatarBg: string; }
interface Request { id: number; name: string; goal: string; days: string; time: string; avatarBg: string; }

const STUDENTS: Student[] = [
  { id: 1, name: 'Олена Ковальчук', subject: 'Математика', level: 'B2', status: 'Активний', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Максим Сидоренко', subject: 'Математика', level: 'A1', status: 'Активний', avatarBg: 'bg-[#dafdf8]' },
  { id: 3, name: 'Анна Мельник', subject: 'Англійська', level: 'C1', status: 'Неактивний', avatarBg: 'bg-[#ebe3ff]' },
  { id: 4, name: 'Дмитро Іванов', subject: 'Математика', level: 'B1', status: 'Активний', avatarBg: 'bg-[#e7eff9]' },
  { id: 5, name: 'Софія Ткаченко', subject: 'Математика', level: 'A2', status: 'Активний', avatarBg: 'bg-[#e7eff9]' },
];

const REQUESTS: Request[] = [
  { id: 1, name: 'Іван Петренко', goal: '"Цікавиться математикою"', days: 'Пн, Ср, Пт', time: '16:00 - 18:00', avatarBg: 'bg-[#e7eff9]' },
  { id: 2, name: 'Марія Зайцева', goal: '"Підготовка до ЗНО"', days: 'Вт, Чт', time: '14:30 - 16:00', avatarBg: 'bg-[#dafdf8]' },
];

export default function TeacherStudents() {
  return (
    <TeacherLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Керування учнями</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Ваш персональний список активних студентів та доступних запитів на навчання.</p>
        </div>

        {/* Total */}
        <article className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12] w-fit">
          <div className="w-14 h-14 bg-[#1f8cf91a] rounded-2xl flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Загальна кількість учнів</p>
            <p className="font-inter font-black text-slate-900 text-4xl mt-1">24</p>
          </div>
        </article>

        <div className="flex items-start gap-8">
          {/* Students list */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="font-poppins font-bold text-slate-900 text-xl">Ваші учні</h2>
            <div className="flex flex-col gap-3">
              {STUDENTS.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dee1e6]">
                  <div className={`w-11 h-11 rounded-full ${s.avatarBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-inter font-bold text-[#1f8cf9] text-base">{s.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-poppins font-bold text-slate-900 text-base">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <span className="font-inter text-[#565d6d] text-xs">{s.subject}</span>
                      <span className="px-2 py-0.5 bg-[#f4f4f6] rounded-full font-inter font-bold text-[#565d6d] text-[10px]">{s.level}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Активний' ? 'bg-[#26d962]' : 'bg-[#9095a1]'}`} />
                      <span className="font-inter text-[#565d6d] text-xs">{s.status}</span>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors flex-shrink-0">
                    Перегляд профілю
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="w-full py-4 bg-white border border-[#dee1e6] rounded-2xl font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
              Завантажити ще...
            </button>
          </div>

          {/* Requests */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-slate-900 text-sm tracking-[0.60px] uppercase">Доступні учні</h2>
              <span className="px-2.5 py-0.5 bg-[#1f8cf9] rounded-full font-inter font-bold text-white text-[10px]">
                Нових: {REQUESTS.length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {REQUESTS.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-[#dee1e6] p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${r.avatarBg} flex items-center justify-center flex-shrink-0`}>
                      <span className="font-inter font-bold text-[#1f8cf9] text-sm">{r.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-poppins font-bold text-slate-900 text-sm">{r.name}</p>
                      <p className="font-inter text-[#565d6d] text-xs italic">{r.goal}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <span className="font-inter text-[#565d6d] text-xs">{r.days}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="font-inter text-[#565d6d] text-xs">{r.time}</span>
                    </div>
                  </div>
                  <button type="button" className="w-full py-2.5 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                    Підтвердити запит
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}