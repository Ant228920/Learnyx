import { useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { useTeacherFinances } from '../../features/teacher/finances';

export default function TeacherFinances() {
  const { data, loading, error } = useTeacherFinances();
  const [showAll, setShowAll] = useState(false);

  const transactions = data?.transactions ?? [];
  const totalEarned = data?.total_earned ?? 0;
  const displayed = showAll ? transactions : transactions.slice(0, 5);

  return (
    <TeacherLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Фінанси</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Детальний моніторинг ваших доходів та дисциплінарних утримань.</p>
        </div>

        {/* Stats */}
        <section aria-label="Фінансова статистика" className="grid grid-cols-2 gap-6">
          <article className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <div className="w-14 h-14 bg-[#1f8cf91a] rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
            </div>
            <div>
              <p className="font-inter font-medium text-[#565d6d] text-sm tracking-[0.60px] uppercase">Загальна сума заробітку</p>
              <p className="font-inter font-black text-slate-900 text-4xl mt-1">{totalEarned.toLocaleString('uk')} ₴</p>
            </div>
          </article>
          <article className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
            <div className="w-14 h-14 bg-[#1f8cf91a] rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
            </div>
            <div>
              <p className="font-inter font-medium text-[#565d6d] text-sm tracking-[0.60px] uppercase">Проведено занять</p>
              <p className="font-inter font-black text-slate-900 text-4xl mt-1">{data?.lessons_count ?? 0}</p>
            </div>
          </article>
        </section>

        {/* History */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <h2 className="font-inter font-bold text-slate-900 text-sm tracking-[0.60px] uppercase">Історія активності</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
              {['ДАТА', 'ЧАС', 'УЧЕНЬ', 'СТАТУС', 'СУМА'].map(h => (
                <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px]">{h}</span>
              ))}
            </div>

            {loading && (
              <div className="px-6 py-8 text-center font-inter text-[#565d6d]">Завантаження...</div>
            )}
            {error && (
              <div className="px-6 py-8 text-center font-inter text-[#e64c4c]">{error}</div>
            )}
            {!loading && !error && transactions.length === 0 && (
              <div className="px-6 py-8 text-center font-inter text-[#565d6d]">Проведених занять ще немає.</div>
            )}

            {displayed.map((t, i) => (
              <div key={t.id} className={`grid grid-cols-[1fr_1fr_2fr_1fr_1fr] items-center px-6 py-4 ${i < displayed.length - 1 ? 'border-b border-[#dee1e6]' : ''}`}>
                <span className="font-inter text-slate-800 text-sm">{t.date}</span>
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="font-inter text-[#565d6d] text-sm">{t.time}</span>
                </div>
                <span className="font-inter text-slate-800 text-sm">{t.student_name}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-inter font-bold text-xs w-fit bg-[#e0f0ff] text-[#1f8cf9]">
                  Нараховано
                </span>
                <span className="font-inter font-bold text-sm text-slate-900">
                  +{t.amount.toLocaleString('uk')} ₴
                </span>
              </div>
            ))}

            {transactions.length > 5 && (
              <div className="border-t border-[#dee1e6]">
                <button type="button" onClick={() => setShowAll(!showAll)}
                  className="w-full py-4 font-inter font-medium text-[#565d6d] text-sm hover:bg-gray-50 transition-colors">
                  {showAll ? 'Згорнути' : 'Завантажити повну історію транзакцій'}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </TeacherLayout>
  );
}
