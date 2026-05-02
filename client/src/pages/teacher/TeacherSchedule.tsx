import { useState } from 'react';
import TeacherLayout from './TeacherLayout';

const DAYS_HEADER = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
const TODAY = 24;

const INITIAL_SLOTS: Record<number, string[]> = {
  1: ['08:30 - 09:15', '10:00 - 10:45'],
  2: ['08:30 - 09:15'],
  3: ['08:30 - 09:15', '10:00 - 10:45'],
  6: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  7: ['08:30 - 09:15'],
  8: ['08:30 - 09:15'],
  9: ['08:30 - 09:15'],
  10: ['08:30 - 09:15', '10:00 - 10:45'],
  13: ['08:30 - 09:15'],
  14: ['08:30 - 09:15'],
  15: ['08:30 - 09:15'],
  16: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  17: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  20: ['08:30 - 09:15', '10:00 - 10:45'],
  21: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  22: ['08:30 - 09:15'],
  23: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  24: ['08:30 - 09:30'],
  27: ['08:30 - 09:15'],
  28: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
  29: ['08:30 - 09:15'],
  30: ['08:30 - 09:15', '10:00 - 10:45'],
  31: ['08:30 - 09:15', '10:00 - 10:45', '11:15 - 12:00'],
};

function buildCalendar() {
  const startOffset = 4;
  const cells: Array<{ day: number; prev?: boolean; next?: boolean }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: 27 + i, prev: true });
  for (let d = 1; d <= 31; d++) cells.push({ day: d });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, next: true });
  return cells;
}

export default function TeacherSchedule() {
  const [slots, setSlots] = useState<Record<number, string[]>>(INITIAL_SLOTS);
  const [cancelled, setCancelled] = useState<string[]>([]);
  const [dayModal, setDayModal] = useState<number | null>(null);
  const [cancelSlot, setCancelSlot] = useState<{ day: number; time: string } | null>(null);
  const [freeFrom, setFreeFrom] = useState('08:30');
  const [freeTo, setFreeTo] = useState('09:30');
  const [success, setSuccess] = useState(false);
  const cells = buildCalendar();

  const cancelKey = (day: number, time: string) => `${day}-${time}`;

  const handleAddFreeTime = () => {
    if (!dayModal || !freeFrom || !freeTo) return;
    const newSlot = `${freeFrom} - ${freeTo}`;
    setSlots(prev => ({
      ...prev,
      [dayModal]: [...(prev[dayModal] || []), newSlot],
    }));
    setDayModal(null);
    setSuccess(true);
  };

  const handleCancel = () => {
    if (!cancelSlot) return;
    setCancelled(p => [...p, cancelKey(cancelSlot.day, cancelSlot.time)]);
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
            <span className="font-inter font-semibold text-slate-900 text-sm px-2">Травень 2026</span>
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
                const daySlots = (!cell.prev && !cell.next && slots[cell.day]) || [];
                const activeSlots = daySlots.filter(s => !cancelled.includes(cancelKey(cell.day, s)));
                const isToday = cell.day === TODAY && !cell.prev && !cell.next;
                return (
                  <div key={ci}
                    onClick={() => !cell.prev && !cell.next && setDayModal(cell.day)}
                    className={`min-h-[120px] p-3 border-b border-r border-[#dee1e6] last:border-r-0 flex flex-col gap-1.5 ${cell.prev || cell.next ? 'bg-[#f8f9fb]' : 'cursor-pointer hover:bg-[#f0f7ff] transition-colors'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full font-inter font-bold text-sm ${isToday ? 'bg-[#1f8cf9] text-white' : cell.prev || cell.next ? 'text-[#9095a1]' : 'text-[#171a1f]'}`}>
                        {cell.day}
                      </div>
                      {activeSlots.length > 0 && (
                        <span className="text-[10px] font-inter font-bold text-[#1f8cf9] bg-[#1f8cf91a] rounded-full px-1.5">{activeSlots.length}</span>
                      )}
                    </div>
                    {activeSlots.map(s => (
                      <div key={s} className="flex items-center gap-1 px-2 py-0.5 bg-[#1f8cf91a] rounded-lg">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="font-inter text-[#1f8cf9] text-[10px] font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day Modal */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setDayModal(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">День — {dayModal} Травня 2024</h2>
              <button type="button" onClick={() => setDayModal(null)} aria-label="Закрити" title="Закрити"
                className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-6 pb-3">
              <div className="flex items-center justify-between mb-3">
                <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Сьогоднішні заняття</p>
                <span className="w-6 h-6 bg-[#1f8cf9] rounded-full flex items-center justify-center font-inter font-bold text-white text-[10px]">
                  {(slots[dayModal] || []).filter(s => !cancelled.includes(cancelKey(dayModal, s))).length}
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {(slots[dayModal] || []).filter(s => !cancelled.includes(cancelKey(dayModal, s))).map(slot => (
                  <div key={slot} className="flex items-center justify-between p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="font-inter font-semibold text-slate-800 text-sm">{slot}</span>
                    </div>
                    <button type="button"
                      onClick={() => { setCancelSlot({ day: dayModal, time: slot }); setDayModal(null); }}
                      className="font-inter text-[#e64c4c] text-xs hover:underline">
                      Відмінити
                    </button>
                  </div>
                ))}
                {(slots[dayModal] || []).filter(s => !cancelled.includes(cancelKey(dayModal, s))).length === 0 && (
                  <p className="font-inter text-[#9095a1] text-sm text-center py-2">Немає занять</p>
                )}
              </div>
            </div>

            <div className="border-t border-[#dee1e6] px-6 py-4">
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase mb-3">Додати вільні години</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="free-from" className="font-inter text-[#565d6d] text-xs mb-1 block">Початок</label>
                  <input id="free-from" type="time" value={freeFrom} onChange={e => setFreeFrom(e.target.value)}
                    className="w-full border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
                <div>
                  <label htmlFor="free-to" className="font-inter text-[#565d6d] text-xs mb-1 block">Кінець</label>
                  <input id="free-to" type="time" value={freeTo} onChange={e => setFreeTo(e.target.value)}
                    className="w-full border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
              </div>
              <button type="button" onClick={handleAddFreeTime}
                className="w-full py-3 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Додати вільний час
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setCancelSlot(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-fade-in p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Відмінити заняття?</h2>
            </div>
            <p className="font-inter text-[#565d6d] text-sm">Ви впевнені, що хочете відмінити це заняття?</p>
            <div className="flex flex-col gap-2 p-4 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="font-inter font-bold text-slate-900 text-sm">{cancelSlot.day} Травня 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="font-inter text-[#565d6d] text-sm">{cancelSlot.time}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p className="font-inter text-[#e64c4c] text-xs leading-5">При скасуванні менш ніж за 12 годин до початку, кошти за заняття не повертаються.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelSlot(null)} className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50">Назад</button>
              <button type="button" onClick={handleCancel} className="flex-1 py-3 rounded-xl bg-red-500 font-inter font-medium text-sm text-white hover:bg-red-600">Підтвердити відміну</button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSuccess(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Вільний час додано!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">Години з'явились у вашому розкладі.</p>
            <button onClick={() => setSuccess(false)} className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600">OK</button>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}