import { useState } from 'react';
import StudentLayout from './StudentLayout';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
const LESSON_DAYS = [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27, 29, 31];
const TODAY = 24;

function buildCalendar() {
  const startOffset = 2; // 1 травня 2024 = середа
  const cells: Array<{ day: number; prev?: boolean; next?: boolean }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: 29 + i, prev: true });
  for (let d = 1; d <= 31; d++) cells.push({ day: d });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, next: true });
  return cells;
}

export default function StudentSchedule() {
  const [cancelDay, setCancelDay] = useState<number | null>(null);
  const [cancelled, setCancelled] = useState<number[]>([]);
  const [success, setSuccess] = useState(false);
  const cells = buildCalendar();

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Розклад занять</h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Оптимізований графік: по 1 заняттю 3 рази на тиждень.</p>
          </div>
          <div className="flex items-center gap-2 border border-[#dee1e6] rounded-xl px-4 py-2.5 bg-white">
            <button type="button" aria-label="Попередній місяць" title="Попередній місяць" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="font-inter font-semibold text-slate-900 text-sm">Травень 2024</span>
            <button type="button" className="font-inter text-sm text-[#1f8cf9] font-medium px-1">Сьогодні</button>
            <button type="button" aria-label="Наступний місяць" title="Наступний місяць" className="text-[#565d6d] hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#dee1e6]">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px]">{d}</div>
            ))}
          </div>
          {Array.from({ length: cells.length / 7 }).map((_, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {cells.slice(wi * 7, wi * 7 + 7).map((cell, ci) => {
                const hasLesson = !cell.prev && !cell.next && LESSON_DAYS.includes(cell.day) && !cancelled.includes(cell.day);
                const isToday = cell.day === TODAY && !cell.prev && !cell.next;
                return (
                  <div key={ci} className={`min-h-[110px] p-3 border-b border-r border-[#dee1e6] last:border-r-0 flex flex-col gap-2 ${cell.prev || cell.next ? 'bg-[#f8f9fb]' : ''}`}>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full font-inter font-bold text-sm ${isToday ? 'bg-[#1f8cf9] text-white' : cell.prev || cell.next ? 'text-[#9095a1]' : 'text-[#171a1f]'}`}>
                      {cell.day}
                    </div>
                    {hasLesson && (
                      <div className="flex flex-col gap-1">
                        <span className="font-inter font-bold text-[#1f8cf9] text-[10px]">1 заняття</span>
                        <button type="button" onClick={() => setCancelDay(cell.day)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#1f8cf91a] rounded-lg hover:bg-[#1f8cf933] transition-colors text-left">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          <span className="font-inter text-[#1f8cf9] text-[10px] font-medium">10:00 - 11:30</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setCancelDay(null); }}
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
                <span className="font-inter font-bold text-slate-900 text-sm">{cancelDay} Травня 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="font-inter text-[#565d6d] text-sm">10:00 - 11:30 (П'ятниця)</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p className="font-inter text-[#e64c4c] text-xs leading-5">При скасуванні менш ніж за 12 годин до початку, кошти за заняття не повертаються згідно з правилами платформи.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelDay(null)} className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50 transition-colors">Скасувати</button>
              <button type="button" onClick={() => { setCancelled(p => [...p, cancelDay]); setCancelDay(null); setSuccess(true); }}
                className="flex-1 py-3 rounded-xl bg-red-500 font-inter font-medium text-sm text-white hover:bg-red-600 transition-colors">Підтвердити відміну</button>
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
            <p className="font-inter text-sm text-[#565d6d] text-center">Заняття успішно відмінено. Менеджер отримав повідомлення.</p>
            <button onClick={() => setSuccess(false)} className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">OK</button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}