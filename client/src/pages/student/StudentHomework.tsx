import { useState } from 'react';
import StudentLayout from './StudentLayout';

type FilterTab = 'Всі' | 'Нові';
interface Homework { id: number; subject: string; title: string; description: string; deadline: string; deadlineDate: Date; urgent: boolean; }

const now = new Date('2024-05-24T12:00:00');
const HW: Homework[] = [
  { id: 1, subject: 'АНГЛІЙСЬКА МОВА', title: 'Есе: Вплив технологій на освіту', description: 'Написати твір обсягом 250-300 слів про позитивні та негативні аспекти...', deadline: 'До 25 Травня, 18:00', deadlineDate: new Date('2024-05-25T18:00:00'), urgent: true },
  { id: 2, subject: 'МАТЕМАТИКА', title: 'Тригонометричні тотожності', description: "Розв'язати вправи №45-52 зі сторінки 112 підручника.", deadline: 'До 26 Травня, 10:00', deadlineDate: new Date('2024-05-26T10:00:00'), urgent: false },
  { id: 3, subject: 'УКРАЇНСЬКА МОВА', title: 'Аналіз поезії "Каменярі"', description: 'Виписати художні засоби та визначити головну ідею твору.', deadline: 'До 27 Травня, 15:00', deadlineDate: new Date('2024-05-27T15:00:00'), urgent: false },
  { id: 4, subject: 'ІНФОРМАТИКА', title: 'Проєкт на Python: Калькулятор', description: 'Створити консольну програму з базовими арифметичними операціями.', deadline: 'До 24 Травня, 23:59', deadlineDate: new Date('2024-05-24T23:59:00'), urgent: false },
];

export default function StudentHomework() {
  const [tab, setTab] = useState<FilterTab>('Всі');
  const [selected, setSelected] = useState<Homework | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<number[]>([]);

  const isExpired = (hw: Homework) => hw.deadlineDate < now;
  const filtered = tab === 'Нові' ? HW.filter(hw => !isExpired(hw) && !submitted.includes(hw.id)) : HW;

  return (
    <StudentLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Домашні завдання</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте своїми навчальними проєктами та дедлайнами</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['Всі', 'Нові'] as FilterTab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-inter font-medium text-sm transition-colors ${tab === t ? 'bg-[#1f8cf9] text-white' : 'bg-white border border-[#dee1e6] text-[#565d6d] hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>

        <div className="flex items-start gap-8">
          {/* Grid */}
          <div className="grid grid-cols-2 gap-5 flex-1">
            {filtered.map(hw => {
              const expired = isExpired(hw);
              const done = submitted.includes(hw.id);
              return (
                <article key={hw.id}
                  onClick={() => !expired && !done && setSelected(p => p?.id === hw.id ? null : hw)}
                  className={`flex flex-col gap-4 p-6 bg-white rounded-2xl border transition-all ${selected?.id === hw.id ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6]'} ${!expired && !done ? 'cursor-pointer hover:shadow-md' : 'opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${expired || done ? 'bg-gray-100' : 'bg-[#1f8cf91a]'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={expired || done ? '#9095a1' : '#1f8cf9'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <span className={`font-inter font-bold text-[10px] tracking-[0.60px] ${expired || done ? 'text-[#9095a1]' : 'text-[#565d6d]'}`}>{hw.subject}</span>
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-slate-900 text-lg leading-6">{hw.title}</h3>
                    <p className="font-inter text-[#565d6d] text-sm mt-1">{hw.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    {done
                      ? <span className="font-inter text-xs text-[#1a7bd9] font-semibold">✓ Здано</span>
                      : expired
                        ? <span className="font-inter text-xs text-[#9095a1]">Термін здачі пройшов</span>
                        : <span className="flex items-center gap-1 font-inter font-medium text-xs text-red-500">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {hw.deadline}
                          </span>
                    }
                    {hw.urgent && !expired && !done && <span className="px-2.5 py-0.5 bg-red-500 rounded-full font-inter font-bold text-white text-[10px]">Терміново</span>}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Side panel */}
          {selected && (
            <aside className="w-[340px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24 animate-fade-in">
              <div className="p-6 flex flex-col gap-5">
                {selected.urgent && <span className="px-3 py-1 bg-red-500 rounded-full font-inter font-bold text-white text-[10px] w-fit">Терміново</span>}
                <div>
                  <h2 className="font-poppins font-bold text-slate-900 text-xl">{selected.title}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-inter text-[#565d6d] text-xs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      {selected.subject.charAt(0) + selected.subject.slice(1).toLowerCase()}
                    </span>
                    <span className="flex items-center gap-1 font-inter text-[#565d6d] text-xs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {selected.deadline.replace('До ', '')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span className="font-inter font-bold text-slate-900 text-sm">Інструкції до виконання</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <div>
                        <p className="font-inter font-semibold text-slate-800 text-xs">homework_task...</p>
                        <p className="font-inter text-[#9095a1] text-[10px]">PDF • 2.4 MB</p>
                      </div>
                    </div>
                    <button type="button" aria-label="Завантажити інструкцію" title="Завантажити" className="text-[#1f8cf9]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-inter font-bold text-slate-900 text-sm mb-3">Завантажити результат</p>
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#dee1e6] rounded-xl cursor-pointer hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <span className="font-inter text-[#565d6d] text-sm text-center">Натисніть або перетягніть файл</span>
                    <span className="font-inter text-[#9095a1] text-xs">PDF, DOCX, JPG до 10MB</span>
                    <input type="file" className="hidden" onChange={e => setUploadedFile(e.target.files?.[0]?.name ?? null)} />
                  </label>
                  {uploadedFile && (
                    <div className="flex items-center justify-between mt-2 px-3 py-2 bg-[#f8f9fb] rounded-lg border border-[#dee1e6]">
                      <span className="font-inter text-slate-700 text-xs">{uploadedFile}</span>
                      <button type="button" onClick={() => setUploadedFile(null)} className="font-inter text-red-500 text-xs hover:underline">Видалити</button>
                    </div>
                  )}
                </div>

                <button type="button"
                  onClick={() => { setSubmitted(p => [...p, selected.id]); setSelected(null); setUploadedFile(null); }}
                  className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  Відправити на оцінення
                </button>
                <p className="font-inter text-[10px] text-[#9095a1] text-center italic">Натискаючи кнопку, ви підтверджуєте самостійне виконання роботи</p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}