import { useState } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentSchedule } from '../../features/student/schedule';
import type { UpcomingLesson } from '../../features/student/schedule';

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTH_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

// Conducted/missed lessons only make sense for past days — hide them from the
// current/upcoming view, show them dimmed when browsing a past week. Cancelled
// lessons can be in the future too, so they stay visible (shown dimmed) everywhere.
const HIDDEN_FROM_UPCOMING = ['conducted', 'student_missed', 'teacher_missed'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dayIndex(d: Date): number {
  return d.getDay() === 0 ? 6 : d.getDay() - 1;
}

export default function StudentSchedule() {
  const { allLessons, loading, error, cancelLesson } = useStudentSchedule();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [cancelTarget, setCancelTarget] = useState<UpcomingLesson | null>(null);
  const [cancellingLesson, setCancellingLesson] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekLabel = `${weekDays[0].getDate()} ${MONTH_SHORT[weekDays[0].getMonth()]} — ${weekDays[6].getDate()} ${MONTH_SHORT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

  const lessonsByWeekDay = weekDays.map(day => {
    const isPast = day < today;
    return {
      date: day,
      lessons: allLessons.filter(l => {
        if (!isSameDay(new Date(l.start_time), day)) return false;
        if (!isPast && HIDDEN_FROM_UPCOMING.includes(l.status ?? '')) return false;
        return true;
      }),
    };
  });

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  const goToday = () => setWeekStart(getMonday(new Date()));

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancellingLesson(cancelTarget.id);
    try {
      const result = await cancelLesson(cancelTarget.id);
      setCancelTarget(null);
      setSuccessMessage(result.rescheduled ? result.message : null);
      setSuccess(true);
    } catch { /* handled by hook */ } finally {
      setCancellingLesson(null);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Розклад занять</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Оптимізований графік навчальних занять.</p>
          </div>
          <div className="flex items-center gap-2 border border-[#dee1e6] rounded-xl px-4 py-2.5 bg-white">
            <button type="button" onClick={prevWeek} aria-label="Попередній тиждень" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button type="button" onClick={goToday} className="font-inter font-semibold text-[#1f8cf9] text-xs px-1 hover:underline">Сьогодні</button>
            <span className="font-inter font-semibold text-slate-900 text-sm px-2">{weekLabel}</span>
            <button type="button" onClick={nextWeek} aria-label="Наступний тиждень" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        {/* Weekly grid */}
        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#dee1e6]">
            {lessonsByWeekDay.map(({ date }) => {
              const isToday = isSameDay(date, today);
              return (
                <div key={date.toISOString()} className="py-3 text-center border-r border-[#dee1e6] last:border-r-0">
                  <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] block">{DAYS_SHORT[dayIndex(date)]}</span>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-inter font-bold text-sm mt-1 ${isToday ? 'bg-[#1f8cf9] text-white' : 'text-[#171a1f]'}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {lessonsByWeekDay.map(({ date, lessons }) => (
              <div key={date.toISOString()} className="min-h-[130px] p-3 border-r border-[#dee1e6] last:border-r-0 flex flex-col gap-2">
                {lessons.length > 0 && (
                  <span className="font-inter font-bold text-[#1f8cf9] text-[10px]">{lessons.length} {lessons.length === 1 ? 'заняття' : 'занять'}</span>
                )}
                {lessons.map(lesson => {
                  const isConducted = ['conducted', 'student_missed', 'teacher_missed'].includes(lesson.status ?? '');
                  const isCancelled = lesson.status === 'canceled_advance';

                  if (isConducted) {
                    return (
                      <div key={lesson.id}
                        className="flex flex-col px-2 py-1 bg-[#f0f0f0] rounded-lg opacity-60">
                        <span className="font-inter text-[#9095a1] text-[10px] font-medium truncate">{lesson.timeLabel}</span>
                        <span className="font-inter text-[9px] text-[#9095a1] leading-tight">Урок проведено</span>
                      </div>
                    );
                  }

                  if (isCancelled) {
                    return (
                      <div key={lesson.id}
                        className="flex flex-col px-2 py-1 bg-[#f0f0f0] border border-[#dee1e6] rounded-lg opacity-60">
                        <span className="font-inter text-[#9095a1] text-[10px] font-medium truncate line-through">{lesson.timeLabel}</span>
                        <span className="font-inter text-[9px] text-[#9095a1] leading-tight">Скасовано</span>
                      </div>
                    );
                  }

                  return (
                    <div key={lesson.id} className="flex items-center gap-1 px-2 py-1 bg-[#1f8cf91a] rounded-lg w-full">
                      <button type="button" onClick={() => setCancelTarget(lesson)}
                        className="flex items-center gap-1 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="font-inter text-[#1f8cf9] text-[10px] font-medium truncate">{lesson.timeLabel}</span>
                      </button>
                    </div>
                  );
                })}
                {lessons.length === 0 && (
                  <span className="font-inter text-[#9095a1] text-[10px] mt-2">Занять немає</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setCancelTarget(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-fade-in p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Відмінити заняття?</h2>
            </div>
            <p className="font-inter text-[#565d6d] text-sm">Ви впевнені, що хочете відмінити це заняття? Це може вплинути на ваш прогрес та баланс абонементу.</p>
            <div className="flex flex-col gap-2 p-4 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="font-inter font-bold text-slate-900 text-sm">
                  {new Date(cancelTarget.start_time).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="font-inter text-[#565d6d] text-sm">{cancelTarget.timeLabel}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p className="font-inter text-[#e64c4c] text-xs leading-5">При скасуванні менш ніж за 12 годин до початку, кошти за заняття не повертаються згідно з правилами платформи.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelTarget(null)} className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50 transition-colors">Скасувати</button>
              <button type="button" onClick={() => void handleCancel()} disabled={cancellingLesson !== null}
                className="flex-1 py-3 rounded-xl bg-red-500 font-inter font-medium text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancellingLesson !== null ? 'Відміняємо...' : 'Підтвердити відміну'}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSuccess(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Заняття відмінено</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">
              {successMessage ?? 'Заняття успішно відмінено. Менеджер отримав повідомлення.'}
            </p>
            <button onClick={() => setSuccess(false)} className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">OK</button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
