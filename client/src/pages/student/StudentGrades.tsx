import { useState } from 'react';
import StudentLayout from './StudentLayout';

type GradeTab = 'Всі оцінки' | 'Уроки' | 'Домашні завдання';
type GradeType = 'ДЗ' | 'Урок';
interface Grade { id: number; subject: string; date: string; topic: string; type: GradeType; score: number; maxScore: number; teacher: string; feedback: string; }

const GRADES: Grade[] = [
  { id: 1, subject: 'Математика', date: '15 Травня, 2024', topic: 'Інтегрування частинами', type: 'ДЗ', score: 9, maxScore: 10, teacher: 'Др. Світлана Ковальчук', feedback: 'Чудова робота! Ви продемонстрували глибоке розуміння методу. Зверніть увагу на оформлення кінцевих результатів у третій задачі.' },
  { id: 2, subject: 'Інформатика', date: '10 Травня, 2024', topic: 'Бінарні дерева пошуку', type: 'Урок', score: 8, maxScore: 10, teacher: 'Олег Петренко', feedback: 'Гарне розуміння концепції. Потрібно більше практики з балансуванням дерев.' },
  { id: 3, subject: 'Українська мова', date: '08 Травня, 2024', topic: 'Аналіз поезії "Каменярі"', type: 'ДЗ', score: 10, maxScore: 10, teacher: 'Марія Іваненко', feedback: 'Відмінна робота! Гарно структурований аналіз.' },
  { id: 4, subject: 'Англійська мова', date: '05 Травня, 2024', topic: 'Business Communication B2', type: 'Урок', score: 7, maxScore: 10, teacher: 'Анна Сидоренко', feedback: 'Гарний прогрес у вимові. Продовжуйте практикувати вокабуляр.' },
  { id: 5, subject: 'Історія України', date: '03 Травня, 2024', topic: 'Становлення незалежності', type: 'ДЗ', score: 10, maxScore: 10, teacher: 'Іван Мельник', feedback: 'Відмінна робота! Повне розкриття теми.' },
];

function getScoreColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.9) return 'text-[#1f8cf9]';
  if (pct >= 0.7) return 'text-[#f5a83d]';
  return 'text-[#e64c4c]';
}

export default function StudentGrades() {
  const [tab, setTab] = useState<GradeTab>('Всі оцінки');
  const [selected, setSelected] = useState<Grade | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = tab === 'Всі оцінки' ? GRADES : tab === 'Уроки' ? GRADES.filter(g => g.type === 'Урок') : GRADES.filter(g => g.type === 'ДЗ');
  const displayed = showAll ? filtered : filtered.slice(0, 5);

  return (
    <StudentLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Ваші успіхи</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Огляд академічних досягнень та оцінок</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#dee1e6]">
          {(['Всі оцінки', 'Уроки', 'Домашні завдання'] as GradeTab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setSelected(null); }}
              className={`px-5 py-3 font-inter font-medium text-sm transition-colors border-b-2 ${tab === t ? 'border-[#1f8cf9] text-slate-900' : 'border-transparent text-[#565d6d] hover:text-slate-900'}`}>{t}</button>
          ))}
        </div>

        <div className="flex items-start gap-8">
          {/* Table */}
          <div className="flex-1 bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_0.7fr_0.7fr] px-6 py-4 border-b border-[#dee1e6]">
              {['Предмет', 'Тема завдання', 'Тип', 'Оцінка'].map(h => (
                <span key={h} className="font-inter font-medium text-[#565d6d] text-sm">{h}</span>
              ))}
            </div>
            {displayed.map((g, i) => (
              <div key={g.id}
                onClick={() => setSelected(p => p?.id === g.id ? null : g)}
                className={`grid grid-cols-[2fr_2fr_0.7fr_0.7fr] items-center px-6 py-5 cursor-pointer transition-colors ${i < displayed.length - 1 ? 'border-b border-[#dee1e6]' : ''} ${selected?.id === g.id ? 'bg-[#f0f7ff]' : 'hover:bg-[#f8f9fb]'}`}>
                <div>
                  <p className="font-inter font-bold text-slate-900 text-sm">{g.subject}</p>
                  <p className="font-inter text-[#9095a1] text-xs mt-0.5">{g.date}</p>
                </div>
                <span className="font-inter text-slate-800 text-sm">{g.topic}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-inter font-bold text-xs w-fit ${g.type === 'ДЗ' ? 'bg-[#e0f0ff] text-[#1f8cf9]' : 'bg-[#fff0e0] text-[#f5a83d]'}`}>{g.type}</span>
                <div className={`w-9 h-9 rounded-full border-2 border-[#dee1e6] flex items-center justify-center font-inter font-black text-sm ${getScoreColor(g.score, g.maxScore)}`}>{g.score}</div>
              </div>
            ))}
            {filtered.length > 5 && (
              <div className="flex justify-center py-4 border-t border-[#dee1e6]">
                <button type="button" onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-1 font-inter font-bold text-[#565d6d] text-sm hover:text-slate-900">
                  {showAll ? 'Показати менше' : 'Завантажити більше записів'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={showAll ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <aside className="w-[300px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24 animate-fade-in">
              <div className="h-1 bg-[#1f8cf9] w-full" />
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full font-inter font-bold text-xs ${selected.type === 'ДЗ' ? 'bg-[#e0f0ff] text-[#1f8cf9]' : 'bg-[#fff0e0] text-[#f5a83d]'}`}>{selected.type}</span>
                  <span className="font-inter text-[#9095a1] text-xs">{selected.date}</span>
                </div>
                <div>
                  <h2 className="font-poppins font-bold text-slate-900 text-xl">{selected.topic}</h2>
                  <p className="font-inter font-bold text-[#1f8cf9] text-sm mt-1">{selected.subject}</p>
                </div>
                <div className="flex flex-col items-center gap-1 py-4 bg-[#f8f9fb] rounded-xl">
                  <span className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Оцінка</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-inter font-black text-5xl ${getScoreColor(selected.score, selected.maxScore)}`}>{selected.score}</span>
                    <span className="font-inter font-bold text-[#9095a1] text-xl">/ {selected.maxScore}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-4 border-b border-[#f4f4f6]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <span className="font-inter font-medium text-slate-800 text-sm">{selected.teacher}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span className="font-inter font-bold text-slate-900 text-sm">Відгук викладача</span>
                  </div>
                  <p className="font-inter text-[#565d6d] text-sm leading-5 italic">"{selected.feedback}"</p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}