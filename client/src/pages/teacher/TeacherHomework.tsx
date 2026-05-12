import { useState } from 'react';
import TeacherLayout from './TeacherLayout';

type HWStatus = 'НЕ ПЕРЕВІРЕНО' | 'ПЕРЕВІРЕНО';

interface Homework {
  id: number;
  student: string;
  topic: string;
  subject: string;
  deadline: string;
  status: HWStatus;
  avatarBg: string;
  file?: string;
  savedComment?: string;
  savedGrade?: string;
}

const INITIAL_HW: Homework[] = [
  { id: 1, student: 'Олена Ковальчук', topic: 'Тригонометричні рівняння. Частина 2', subject: 'Математика', deadline: '12 Жов, 2023', status: 'НЕ ПЕРЕВІРЕНО', avatarBg: 'bg-[#e7eff9]', file: 'homework_math_kov...' },
  { id: 2, student: 'Анна Мельник', topic: 'Essay: Future of AI', subject: 'Англійська', deadline: '10 Жов, 2023', status: 'ПЕРЕВІРЕНО', avatarBg: 'bg-[#ebe3ff]', savedComment: 'Чудова робота! Гарна структура есе.', savedGrade: '9/10' },
  { id: 3, student: 'Максим Сидоренко', topic: 'Закони термодинаміки', subject: 'Математика', deadline: '11 Жов, 2023', status: 'НЕ ПЕРЕВІРЕНО', avatarBg: 'bg-[#dafdf8]', file: 'thermodynamics_hw...' },
  { id: 4, student: 'Дмитро Іванов', topic: 'Київська Русь: аналіз джерел', subject: 'Математика', deadline: '09 Жов, 2023', status: 'ПЕРЕВІРЕНО', avatarBg: 'bg-[#e7eff9]', savedComment: 'Добре розкрита тема. Зверніть увагу на джерела.', savedGrade: '8/10' },
  { id: 5, student: 'Софія Ткаченко', topic: 'Органічні сполуки', subject: 'Математика', deadline: '08 Жов, 2023', status: 'НЕ ПЕРЕВІРЕНО', avatarBg: 'bg-[#e7eff9]', file: 'organic_compounds...' },
];

export default function TeacherHomework() {
  const [search, setSearch] = useState('');
  const [homeworks, setHomeworks] = useState<Homework[]>(INITIAL_HW);
  const [selected, setSelected] = useState<Homework | null>(null);
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');

  const filtered = homeworks.filter(hw =>
    hw.student.toLowerCase().includes(search.toLowerCase()) ||
    hw.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (hw: Homework) => {
    if (selected?.id === hw.id) { setSelected(null); return; }
    setSelected(hw);
    setComment(hw.savedComment || '');
    setGrade(hw.savedGrade || '');
  };

  const handleSave = () => {
    if (!selected) return;
    setHomeworks(prev => prev.map(hw =>
      hw.id === selected.id
        ? { ...hw, status: 'ПЕРЕВІРЕНО', savedComment: comment, savedGrade: grade }
        : hw
    ));
    setSelected(null);
    setComment('');
    setGrade('');
  };

  const isChecked = selected?.status === 'ПЕРЕВІРЕНО';

  return (
    <TeacherLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Домашні завдання</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Керуйте навчальним процесом: перевіряйте роботи та виставляйте оцінки в реальному часі.</p>
        </div>

        <div className="flex items-start gap-8">
          {/* Table */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Пошук за учнем..."
                className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
            </div>

            <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
              <div className="grid grid-cols-[2fr_2.5fr_1fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
                {['УЧЕНЬ', 'ТЕМА', 'ТЕРМІН', 'СТАТУС'].map(h => (
                  <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px]">{h}</span>
                ))}
              </div>
              {filtered.map((hw, i) => (
                <div key={hw.id}
                  onClick={() => handleSelect(hw)}
                  className={`grid grid-cols-[2fr_2.5fr_1fr_1fr] items-center px-6 py-4 cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-[#dee1e6]' : ''} ${selected?.id === hw.id ? 'bg-[#f0f7ff] border-l-4 border-l-[#1f8cf9]' : 'hover:bg-[#f8f9fb]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${hw.avatarBg} flex items-center justify-center flex-shrink-0`}>
                      <span className="font-inter font-bold text-[#1f8cf9] text-sm">{hw.student[0]}</span>
                    </div>
                    <span className="font-inter font-bold text-slate-900 text-sm">{hw.student}</span>
                  </div>
                  <div>
                    <p className="font-inter font-medium text-slate-800 text-sm">{hw.topic}</p>
                    <p className="font-inter text-[#1f8cf9] text-xs mt-0.5">{hw.subject}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span className="font-inter text-[#565d6d] text-xs">{hw.deadline}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-inter font-bold text-[10px] w-fit ${hw.status === 'ПЕРЕВІРЕНО' ? 'bg-[#e0faea] text-[#1a7bd9]' : 'bg-orange-100 text-orange-600'}`}>
                    {hw.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          {selected && (
            <aside className="w-[300px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24 animate-fade-in">
              {/* Header — БЕЗ 3 крапок */}
              <div className="flex items-center gap-3 p-5 border-b border-[#dee1e6]">
                <div className={`w-10 h-10 rounded-full ${selected.avatarBg} flex items-center justify-center`}>
                  <span className="font-inter font-bold text-[#1f8cf9] text-sm">{selected.student[0]}</span>
                </div>
                <div>
                  <p className="font-poppins font-bold text-slate-900 text-sm">{selected.student}</p>
                  <p className="font-inter font-bold text-[#1f8cf9] text-xs">{selected.subject}</p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1">Поточне завдання</p>
                  <p className="font-inter font-semibold text-slate-800 text-sm">{selected.topic}</p>
                </div>

                {selected.file && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-inter font-bold text-slate-900 text-sm">Файли роботи</p>
                      <span className="w-5 h-5 bg-[#1f8cf9] rounded-full flex items-center justify-center font-inter font-bold text-white text-[10px]">1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        <div>
                          <p className="font-inter font-semibold text-slate-800 text-xs">{selected.file}</p>
                          <p className="font-inter text-[#9095a1] text-[10px]">PDF • 2.4 MB</p>
                        </div>
                      </div>
                      <button type="button" aria-label="Завантажити файл" title="Завантажити" className="text-[#1f8cf9]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="teacher-comment" className="font-inter font-bold text-slate-900 text-sm block mb-2">Коментар вчителя</label>
                  {isChecked ? (
                    <div className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-[#f8f9fb] min-h-[80px]">
                      {selected.savedComment || <span className="text-[#9095a1]">Коментар відсутній</span>}
                    </div>
                  ) : (
                    <textarea id="teacher-comment" value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Вкажіть сильні сторони або помилки..."
                      rows={4}
                      className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                  )}
                </div>

                <div>
                  <label htmlFor="teacher-grade" className="font-inter font-bold text-slate-900 text-sm block mb-2">Оцінка</label>
                  {isChecked ? (
                    <div className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm bg-[#f8f9fb]">
                      <span className="font-inter font-black text-[#1f8cf9] text-lg">{selected.savedGrade || '—'}</span>
                    </div>
                  ) : (
                    <input id="teacher-grade" type="text" value={grade} onChange={e => setGrade(e.target.value)}
                      placeholder="Наприклад: 8/10"
                      className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                  )}
                </div>

                {isChecked ? (
                  <div className="flex items-center gap-2 p-3 bg-[#e0faea] rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a7bd9" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    <span className="font-inter font-medium text-[#1a7bd9] text-sm">Робота вже перевірена</span>
                  </div>
                ) : (
                  <button type="button" onClick={handleSave}
                    className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                    Зберегти та надіслати
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}