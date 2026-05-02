import { useState } from 'react';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../app/providers';

type LessonStatus = 'completed' | 'join' | 'soon';
interface Lesson { id: number; time: string; title: string; status: LessonStatus; minutesUntil?: number; }

const lessons: Lesson[] = [
  { id: 1, time: '09:00 - 10:30', title: 'Англійська мова: Business Communication (B2)', status: 'completed' },
  { id: 2, time: '14:00 - 15:30', title: 'Українська мова: Поезія шістдесятників', status: 'join' },
  { id: 3, time: '11:00 - 12:30', title: 'Математика: Диференціальні рівняння', status: 'completed' },
  { id: 4, time: '16:00 - 17:30', title: 'Інформатика: Структури даних', status: 'soon', minutesUntil: 12 },
  { id: 5, time: '18:00 - 19:30', title: 'Історія України: Становлення незалежності', status: 'join' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaintLesson, setComplaintLesson] = useState<Lesson | null>(null);
  const [complaintSent, setComplaintSent] = useState(false);
  const isComplaintActive = (l: Lesson) => l.status === 'soon' && (l.minutesUntil ?? 99) <= 15;

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Greeting */}
        <section>
          <h1 className="font-poppins font-bold text-[#171a1f] text-3xl leading-[37.5px]">Вітаємо, {user?.firstName}! 👋</h1>
          <p className="font-inter text-[#565d6d] text-base leading-6 mt-2">Ось огляд ваших успіхів та розклад на сьогодні.</p>
        </section>

        {/* Cards */}
        <section aria-label="Огляд навчання" className="grid grid-cols-3 gap-6">
          <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Ваш абонемент</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1f8cf91a] rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <div>
                <p className="font-inter font-bold text-[#171a1f] text-sm">З абонементу залишилось:</p>
                <p className="font-poppins font-bold text-[#1f8cf9] text-2xl leading-8">10 / 12</p>
              </div>
            </div>
          </article>

          <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Найближче заняття</p>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-[#f5a83d1a] rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a83d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <p className="font-poppins font-bold text-[#171a1f] text-xl leading-[25px]">Українська мова:<br />Поезія шістдесятників</p>
            </div>
          </article>

          <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Накопичені бонуси</p>
            <div className="flex flex-col gap-3 pt-1">
              <div role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={15}
                aria-label="Накопичені бонуси: 0 з 15" title="Накопичені бонуси: 0 з 15"
                className="h-3 bg-[#f4f4f6] rounded-md overflow-hidden">
                <div className="h-full bg-[#1f8cf9] w-0" />
              </div>
              <div className="flex justify-between">
                {['5', '10', '15'].map(v => <span key={v} className="font-inter font-bold text-xs text-[#565d6d]">{v}</span>)}
              </div>
              <p className="font-inter text-[10px] text-[#9095a1] leading-4">Здавайте домашні завдання вчасно для накопичення бонусів</p>
            </div>
          </article>
        </section>

        {/* Lessons */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#171a1f" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <h2 className="font-poppins font-bold text-[#171a1f] text-xl tracking-[-0.40px]">Уроки на сьогодні</h2>
            </div>
            <time className="font-inter font-medium text-[#565d6d] text-sm">24 Травня, П'ятниця</time>
          </div>
          <div className="bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12] overflow-hidden">
            {lessons.map((lesson, i) => (
              <article key={lesson.id} className={`flex items-center justify-between gap-6 px-6 py-5 ${i > 0 ? 'border-t border-[#dee1e6]' : ''}`}>
                <div className="flex items-center gap-2 w-40 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="font-inter font-bold text-[#171a1f] text-sm whitespace-nowrap">{lesson.time}</span>
                </div>
                <p className="font-inter font-medium text-[#171a1f] text-base flex-1">{lesson.title}</p>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {lesson.status === 'completed' ? (
                    <>
                      <button type="button" className="px-4 py-1.5 bg-gray-100 rounded-md font-inter font-semibold text-gray-400 text-sm">Завершено</button>
                      <button type="button" onClick={() => setComplaintLesson(lesson)}
                        className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                        Поскаржитись
                      </button>
                    </>
                  ) : lesson.status === 'soon' ? (
                    <>
                      <span className="px-3 py-1.5 bg-orange-50 rounded-md font-inter font-semibold text-orange-500 text-sm">
                        Через {lesson.minutesUntil} хв
                      </span>
                      {isComplaintActive(lesson) && (
                        <button type="button" onClick={() => setComplaintLesson(lesson)}
                          className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                          Поскаржитись
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button type="button" className="px-4 py-1.5 bg-[#1f8cf9] rounded-md font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors">Приєднатися</button>
                      <button type="button" className="px-4 py-1.5 bg-gray-50 border border-[#dee1e6] rounded-md font-inter font-semibold text-gray-400 text-sm cursor-not-allowed">Поскаржитись</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Complaint Modal */}
      {complaintLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setComplaintLesson(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1f8cf91a] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h2 className="font-poppins font-bold text-slate-900 text-xl">Поскаржити</h2>
              </div>
              <button type="button" onClick={() => setComplaintLesson(null)} aria-label="Закрити вікно" title="Закрити" className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="font-inter text-[#565d6d] text-sm leading-6">Надішліть скаргу про відсутність викладача на занятті. Ми перевіримо інформацію та вживемо необхідних заходів.</p>
            <button type="button" onClick={() => { setComplaintSent(true); setComplaintLesson(null); }}
              className="w-full py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
              Відправити
            </button>
          </div>
        </div>
      )}
      {complaintSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setComplaintSent(false)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Скаргу відправлено!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">Ми розглянемо вашу скаргу та повідомимо про результат.</p>
            <button onClick={() => setComplaintSent(false)} className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">OK</button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}