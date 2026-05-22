import { useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { useTeacherSchedule } from '../../features/teacher/schedule';
import type { SlotItem } from '../../features/teacher/schedule';

const DAYS_HEADER = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
const TODAY = new Date().getDate();
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

function buildCalendar() {
  const firstDay = new Date(CURRENT_YEAR, CURRENT_MONTH, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
  const prevMonthDays = new Date(CURRENT_YEAR, CURRENT_MONTH, 0).getDate();
  const cells: Array<{ day: number; prev?: boolean; next?: boolean }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: prevMonthDays - startOffset + 1 + i, prev: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, next: true });
  return cells;
}

const MONTH_NAMES = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

export default function TeacherSchedule() {
  const { slotsByDay, loading, error, createSlot, deleteSlot } = useTeacherSchedule();
  const [dayModal, setDayModal] = useState<number | null>(null);
  const [cancelSlot, setCancelSlot] = useState<SlotItem & { day: number } | null>(null);
  const [freeFrom, setFreeFrom] = useState('08:30');
  const [freeTo, setFreeTo] = useState('09:30');
  const cells = buildCalendar();

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  const handleAddFreeSlot = async () => {
    if (!dayModal) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const month = pad(CURRENT_MONTH + 1);
    const day = pad(dayModal);
    const startIso = `${CURRENT_YEAR}-${month}-${day}T${freeFrom}:00`;
    const endIso = `${CURRENT_YEAR}-${month}-${day}T${freeTo}:00`;
    try {
      await createSlot(startIso, endIso);
    } catch { /* error shown by hook */ }
    setDayModal(null);
  };

  const handleDeleteSlot = async () => {
    if (!cancelSlot) return;
    try {
      await deleteSlot(cancelSlot.id);
    } catch { /* error shown by hook */ }
    setCancelSlot(null);
  };

  return (
    <TeacherLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Розклад викладача</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте вашим навчальним часом та новими заняттями.</p>
          </div>
          <div className="flex items-center gap-2 border border-[#dee1e6] rounded-xl px-4 py-2.5 bg-white">
            <button type="button" aria-label="Попередній місяць" title="Попередній місяць" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="font-inter font-semibold text-slate-900 text-sm px-2">{MONTH_NAMES[CURRENT_MONTH]} {CURRENT_YEAR}</span>
            <button type="button" aria-label="Наступний місяць" title="Наступний місяць" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#dee1e6]">
            {DAYS_HEADER.map(d => (
              <div key={d} className="py-3 text-center font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px]">{d}</div>
            ))}
          </div>
          {Array.from({ length: cells.length / 7 }).map((_, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {cells.slice(wi * 7, wi * 7 + 7).map((cell, ci) => {
                const slots = (!cell.prev && !cell.next && slotsByDay[cell.day]) || [];
                const isToday = cell.day === TODAY && !cell.prev && !cell.next;
                const total = slots.length;
                return (
                  <div key={ci}
                    onClick={() => !cell.prev && !cell.next && setDayModal(cell.day)}
                    className={`min-h-[120px] p-3 border-b border-r border-[#dee1e6] last:border-r-0 flex flex-col gap-1.5 ${cell.prev || cell.next ? 'bg-[#f8f9fb]' : 'cursor-pointer hover:bg-[#f0f7ff] transition-colors'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full font-inter font-bold text-sm ${isToday ? 'bg-[#1f8cf9] text-white' : cell.prev || cell.next ? 'text-[#9095a1]' : 'text-[#171a1f]'}`}>
                        {cell.day}
                      </div>
                      {total > 0 && (
                        <span className="text-[10px] font-inter font-bold text-[#1f8cf9] bg-[#1f8cf91a] rounded-full px-1.5">{total}</span>
                      )}
                    </div>
                    {slots.map(s => (
                      <div key={s.id} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${s.is_booked ? 'bg-[#fff0e0]' : 'bg-[#e0faea]'}`}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={s.is_booked ? '#f5a83d' : '#26d962'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className={`font-inter text-[10px] font-medium ${s.is_booked ? 'text-[#f5a83d]' : 'text-[#1a7bd9]'}`}>{s.time}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f5a83d]" />
            <span className="font-inter text-[#565d6d] text-xs">Заброньовані слоти</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#26d962]" />
            <span className="font-inter text-[#565d6d] text-xs">Вільні години</span>
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
              <h2 className="font-poppins font-bold text-slate-900 text-xl">День — {dayModal} {MONTH_NAMES[CURRENT_MONTH]} {CURRENT_YEAR}</h2>
              <button type="button" onClick={() => setDayModal(null)} aria-label="Закрити" title="Закрити" className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-6 pb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Слоти на цей день</p>
                <span className="w-6 h-6 bg-[#1f8cf9] rounded-full flex items-center justify-center font-inter font-bold text-white text-[10px]">
                  {(slotsByDay[dayModal] || []).length}
                </span>
              </div>
              {(slotsByDay[dayModal] || []).map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className="font-inter font-semibold text-slate-800 text-sm">{slot.time}</span>
                    {slot.is_booked && <span className="text-[10px] font-inter text-[#f5a83d]">(забронійовано)</span>}
                  </div>
                  {!slot.is_booked && (
                    <button type="button" onClick={() => { setCancelSlot({ ...slot, day: dayModal }); setDayModal(null); }}
                      className="font-inter text-[#e64c4c] text-xs hover:underline">Видалити</button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[#dee1e6] px-6 py-4">
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase mb-3">Додати вільні години</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="free-from" className="font-inter text-[#565d6d] text-xs mb-1 block">Початок</label>
                  <input id="free-from" type="time" value={freeFrom} onChange={e => setFreeFrom(e.target.value)}
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
              <button type="button" onClick={() => void handleAddFreeSlot()}
                className="w-full py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Додати вільний час
              </button>
            </div>
            <div className="border-t border-[#dee1e6] px-6 py-3 text-center">
              <p className="font-inter text-[#9095a1] text-[10px] tracking-[0.60px] uppercase">© 2024 LEARNYX EDUCATION</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Delete Modal */}
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
            <p className="font-inter text-[#565d6d] text-sm">Ви впевнені, що хочете видалити цей слот? Це може вплинути на ваш розклад.</p>
            <div className="flex flex-col gap-2 p-4 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="font-inter font-bold text-slate-900 text-sm">{cancelSlot.day} {MONTH_NAMES[CURRENT_MONTH]} {CURRENT_YEAR}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="font-inter text-[#565d6d] text-sm">{cancelSlot.time}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelSlot(null)} className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50">Назад</button>
              <button type="button" onClick={() => void handleDeleteSlot()}
                className="flex-1 py-3 rounded-xl bg-red-500 font-inter font-medium text-sm text-white hover:bg-red-600">Підтвердити</button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
