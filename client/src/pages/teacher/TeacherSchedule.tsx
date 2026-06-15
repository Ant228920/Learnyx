import { useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { useTeacherSchedule } from '../../features/teacher/schedule';
import type { SlotItem } from '../../features/teacher/schedule';
import { apiClient, extractErrorMessage } from '../../services/api';

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTH_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

// Conducted/missed lessons only make sense for past days — hide them from the
// current/upcoming view, show them dimmed when browsing a past week.
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

export default function TeacherSchedule() {
  const { allSlots, loading, error, createSlot, deleteSlot, refetch } = useTeacherSchedule();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [dayModal, setDayModal] = useState<Date | null>(null);
  const [cancelSlot, setCancelSlot] = useState<SlotItem | null>(null);
  const [freeFrom, setFreeFrom] = useState('08:30');
  const [freeTo, setFreeTo] = useState('09:30');
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [cancelError, setCancelError] = useState('');
  const [cancellingLesson, setCancellingLesson] = useState<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekLabel = `${weekDays[0].getDate()} ${MONTH_SHORT[weekDays[0].getMonth()]} — ${weekDays[6].getDate()} ${MONTH_SHORT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

  const slotsByWeekDay = weekDays.map(day => {
    const isPast = day < today;
    return {
      date: day,
      slots: allSlots.filter(s => {
        if (!isSameDay(new Date(s.start_time), day)) return false;
        if (!isPast && HIDDEN_FROM_UPCOMING.includes(s.lesson_status ?? '')) return false;
        return true;
      }),
    };
  });

  const weekHasSlots = slotsByWeekDay.some(d => d.slots.length > 0);

  const dayModalSlots = dayModal
    ? allSlots.filter(s => {
        if (!isSameDay(new Date(s.start_time), dayModal)) return false;
        if (!(dayModal < today) && HIDDEN_FROM_UPCOMING.includes(s.lesson_status ?? '')) return false;
        return true;
      })
    : [];

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  const goToday = () => setWeekStart(getMonday(new Date()));

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const handleCancelLesson = async (lessonId: number) => {
    setCancelError('');
    setCancellingLesson(lessonId);
    try {
      await apiClient.patch(`/lessons/${lessonId}/cancel/`);
      void refetch();
    } catch (err) {
      setCancelError(extractErrorMessage(err));
    } finally {
      setCancellingLesson(null);
    }
  };

  const handleAddFreeSlot = async () => {
    if (!dayModal) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    let weeksCount = 1;
    if (repeatWeekly) {
      const endOfYear = new Date(dayModal.getFullYear(), 11, 31);
      weeksCount = Math.max(1, Math.ceil((endOfYear.getTime() - dayModal.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
    }
    try {
      for (let w = 0; w < weeksCount; w++) {
        const slotDate = new Date(dayModal);
        slotDate.setDate(dayModal.getDate() + w * 7);
        if (slotDate < now && w > 0) continue;
        const y = slotDate.getFullYear();
        const mo = pad(slotDate.getMonth() + 1);
        const d = pad(slotDate.getDate());
        await createSlot(`${y}-${mo}-${d}T${freeFrom}:00`, `${y}-${mo}-${d}T${freeTo}:00`);
      }
    } catch { /* error shown by hook */ }
    setDayModal(null);
  };

  return (
    <TeacherLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Розклад викладача</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте вашим навчальним часом та заняттями.</p>
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

        {/* Empty state */}
        {weekHasSlots === false && (
          <div className="bg-[#f0f7ff] border border-[#dee1e6] rounded-2xl px-6 py-4 font-inter text-sm text-[#565d6d]">
            У вас немає запланованих слотів на цьому тижні. Натисніть «+ Додати слот» щоб додати час занять.
          </div>
        )}

        {/* Weekly grid */}
        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#dee1e6]">
            {slotsByWeekDay.map(({ date }) => {
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
            {slotsByWeekDay.map(({ date, slots }) => (
              <div
                key={date.toISOString()}
                onClick={() => setDayModal(date)}
                className="min-h-[160px] p-3 border-r border-[#dee1e6] last:border-r-0 flex flex-col gap-1.5 cursor-pointer hover:bg-[#f0f7ff] transition-colors"
              >
                {slots.length > 0 && (
                  <span className="text-[10px] font-inter font-bold text-[#1f8cf9] bg-[#1f8cf91a] rounded-full px-1.5 w-fit">{slots.length}</span>
                )}
                {slots.map(s => {
                  const conducted = ['conducted', 'student_missed', 'teacher_missed'].includes(s.lesson_status ?? '');
                  return (
                    <div key={s.id} className={`flex flex-col px-2 py-1 rounded-lg ${conducted ? 'bg-[#f0f0f0] opacity-60' : s.is_booked ? 'bg-[#e8f4fd]' : 'bg-[#e0faea]'}`}>
                      <span className={`font-inter text-[10px] font-semibold truncate ${conducted ? 'text-[#9095a1]' : s.is_booked ? 'text-[#1f8cf9]' : 'text-[#1a7bd9]'}`}>{s.time}</span>
                      <span className={`font-inter text-[9px] leading-tight ${conducted ? 'text-[#9095a1]' : s.is_booked ? 'text-[#565d6d]' : 'text-[#26d962]'}`}>
                        {conducted ? 'Проведено' : s.is_booked ? 'Заплановано' : 'Вільний'}
                      </span>
                    </div>
                  );
                })}
                {slots.length === 0 && (
                  <span className="font-inter text-[#9095a1] text-[10px] mt-2">+ Додати слот</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Day Modal */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setDayModal(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">
                {DAYS_SHORT[dayIndex(dayModal)]}, {dayModal.getDate()} {MONTH_SHORT[dayModal.getMonth()]} {dayModal.getFullYear()}
              </h2>
              <button type="button" onClick={() => setDayModal(null)} aria-label="Закрити" className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-6 pb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Слоти на цей день</p>
                <span className="w-6 h-6 bg-[#1f8cf9] rounded-full flex items-center justify-center font-inter font-bold text-white text-[10px]">{dayModalSlots.length}</span>
              </div>
              {dayModalSlots.map(slot => {
                const conducted = ['conducted', 'student_missed', 'teacher_missed'].includes(slot.lesson_status ?? '');
                return (
                <div key={slot.id} className={`flex items-center justify-between p-3 rounded-xl border ${conducted ? 'bg-[#f8f9fb] border-[#dee1e6] opacity-60' : slot.is_booked ? 'bg-[#e8f4fd] border-[#1f8cf9]/30' : 'bg-[#f8f9fb] border-[#dee1e6]'}`}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={conducted ? '#9095a1' : slot.is_booked ? '#1f8cf9' : '#565d6d'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="font-inter font-semibold text-slate-800 text-sm">{slot.time}</span>
                    </div>
                    <span className={`font-inter text-[10px] ml-5 ${conducted ? 'text-[#9095a1]' : slot.is_booked ? 'text-[#1f8cf9]' : 'text-[#9095a1]'}`}>
                      {conducted ? 'Заняття вже проведено' : slot.is_booked ? (slot.lesson_student_name ? `Заняття: ${slot.lesson_student_name}` : 'Заняття заплановано') : 'Вільний слот'}
                    </span>
                  </div>
                  {!conducted && (slot.is_booked ? (
                    <button type="button"
                      onClick={() => { if (slot.lesson_id != null) void handleCancelLesson(slot.lesson_id); }}
                      disabled={cancellingLesson === slot.lesson_id}
                      className={`font-inter text-red-500 hover:text-red-600 text-xs underline ${cancellingLesson === slot.lesson_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {cancellingLesson === slot.lesson_id ? 'Скасування...' : 'Скасувати'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setCancelSlot(slot); setDayModal(null); }}
                      className="font-inter text-[#e64c4c] text-xs hover:underline">Видалити</button>
                  ))}
                </div>
                );
              })}
              {cancelError && <p className="font-inter text-red-500 text-xs">{cancelError}</p>}
            </div>

            <div className="border-t border-[#dee1e6] px-6 py-4">
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase mb-3">Додати вільні години</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="free-from" className="font-inter text-[#565d6d] text-xs mb-1 block">Початок</label>
                  <input id="free-from" type="time" value={freeFrom}
                    onChange={e => {
                      const val = e.target.value;
                      setFreeFrom(val);
                      const [h, m] = val.split(':').map(Number);
                      setFreeTo(`${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                    }}
                    aria-label="Початок вільного часу"
                    className="w-full border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
                <div>
                  <label htmlFor="free-to" className="font-inter text-[#565d6d] text-xs mb-1 block">Кінець</label>
                  <input id="free-to" type="time" value={freeTo} onChange={e => setFreeTo(e.target.value)}
                    aria-label="Кінець вільного часу"
                    className="w-full border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={e => setRepeatWeekly(e.target.checked)}
                  className="w-4 h-4 accent-[#1f8cf9]"
                />
                <span className="font-inter text-sm text-slate-800">
                  Повторювати щотижня до кінця року
                </span>
              </label>
              <button type="button" onClick={() => void handleAddFreeSlot()}
                className="w-full py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {repeatWeekly ? 'Додати до кінця року' : 'Додати вільний час'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Slot Modal */}
      {cancelSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setCancelSlot(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-fade-in p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Видалити слот?</h2>
            </div>
            <p className="font-inter text-[#565d6d] text-sm">Ви впевнені, що хочете видалити цей слот?</p>
            <div className="flex flex-col gap-2 p-4 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="font-inter font-bold text-slate-900 text-sm">
                  {new Date(cancelSlot.start_time).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="font-inter text-[#565d6d] text-sm">{cancelSlot.time}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelSlot(null)} className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50">Назад</button>
              <button type="button" onClick={async () => { try { await deleteSlot(cancelSlot.id); } catch { /* */ } setCancelSlot(null); }}
                className="flex-1 py-3 rounded-xl bg-red-500 font-inter font-medium text-sm text-white hover:bg-red-600">Підтвердити</button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
