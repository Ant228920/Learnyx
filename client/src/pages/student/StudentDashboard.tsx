import { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../app/providers';
import { studentApi, extractErrorMessage } from '../../services/api';
import type { StudentDashboard as DashboardData } from '../../services/api';

// Час завантаження сторінки — поза компонентом, не порушує чистоту
const PAGE_LOAD_TIME = new Date();

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintSent, setComplaintSent] = useState(false);

  useEffect(() => {
    studentApi.getDashboard()
      .then(setData)
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

  const minutesUntil = (iso: string) => Math.floor((new Date(iso).getTime() - PAGE_LOAD_TIME.getTime()) / 60000);

  return (
    <StudentLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <section>
          <h1 className="font-poppins font-bold text-[#171a1f] text-3xl leading-[37.5px]">
            Вітаємо, {user?.firstName}! 👋
          </h1>
          <p className="font-inter text-[#565d6d] text-base mt-2">Ось огляд ваших успіхів та розклад на сьогодні.</p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="font-inter text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Cards */}
            <section className="grid grid-cols-3 gap-6">
              <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Ваш абонемент</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#1f8cf91a] rounded-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                  </div>
                  <div>
                    <p className="font-inter font-bold text-[#171a1f] text-sm">З абонементу залишилось:</p>
                    {data?.balance ? (
                      <p className="font-poppins font-bold text-[#1f8cf9] text-2xl">{data.balance.remaining} / {data.balance.total}</p>
                    ) : (
                      <p className="font-inter text-[#9095a1] text-sm">Немає активного абонементу</p>
                    )}
                  </div>
                </div>
              </article>

              <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Найближче заняття</p>
                {data?.next_lesson ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#f5a83d1a] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a83d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div>
                      <p className="font-inter font-bold text-[#171a1f] text-sm">{formatTime(data.next_lesson.start_time)} — {formatTime(data.next_lesson.end_time)}</p>
                      <p className="font-inter text-[#565d6d] text-xs mt-0.5">{data.next_lesson.teacher}</p>
                      <p className="font-inter text-[#565d6d] text-xs">{formatDate(data.next_lesson.start_time)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-inter text-[#9095a1] text-sm">Немає запланованих занять</p>
                )}
              </article>

              <article className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Накопичені бонуси</p>
                <div className="flex flex-col gap-3">
                  <div role="progressbar"
                    aria-valuenow={data?.bonus_progress?.success_pct ?? 0}
                    aria-valuemin={0} aria-valuemax={100}
                    aria-label={`Бонусний прогрес: ${data?.bonus_progress?.success_pct ?? 0}%`}
                    title={`Бонусний прогрес: ${data?.bonus_progress?.success_pct ?? 0}%`}
                    className="h-3 bg-[#f4f4f6] rounded-md overflow-hidden">
                    <div className={
                        `h-full bg-[#1f8cf9] transition-all rounded-md ${
                          (data?.bonus_progress?.success_pct ?? 0) === 0 ? 'w-0' :
                          (data?.bonus_progress?.success_pct ?? 0) < 86 ? 'w-1/4' :
                          (data?.bonus_progress?.success_pct ?? 0) < 91 ? 'w-1/2' :
                          (data?.bonus_progress?.success_pct ?? 0) < 96 ? 'w-3/4' : 'w-full'
                        }`
                      } />
                  </div>
                  <div className="flex justify-between">
                    {['85%', '90%', '95%'].map(v => (
                      <span key={v} className="font-inter font-bold text-xs text-[#565d6d]">{v}</span>
                    ))}
                  </div>
                  <p className="font-inter text-[10px] text-[#9095a1]">
                    {data?.available_cashback_pct
                      ? `Доступний кешбек: ${data.available_cashback_pct}%`
                      : 'Здавайте ДЗ вчасно для накопичення бонусів'}
                  </p>
                </div>
              </article>
            </section>

            {/* Today's lessons */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#171a1f" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <h2 className="font-poppins font-bold text-[#171a1f] text-xl">Уроки на сьогодні</h2>
                </div>
                <time className="font-inter font-medium text-[#565d6d] text-sm">
                  {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' })}
                </time>
              </div>

              {data?.today_lessons && data.today_lessons.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12] overflow-hidden">
                  {data.today_lessons.map((lesson, i) => {
                    const mins = minutesUntil(lesson.start_time);
                    const isSoon = mins > 0 && mins <= 15;
                    const isActive = mins <= 0 && minutesUntil(lesson.end_time) > 0;
                    return (
                      <article key={lesson.lesson_id}
                        className={`flex items-center justify-between gap-6 px-6 py-5 ${i > 0 ? 'border-t border-[#dee1e6]' : ''}`}>
                        <div className="flex items-center gap-2 w-40 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          <span className="font-inter font-bold text-[#171a1f] text-sm whitespace-nowrap">
                            {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                          </span>
                        </div>
                        <p className="font-inter font-medium text-[#171a1f] text-base flex-1">{lesson.teacher}</p>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {isActive ? (
                            <>
                              {lesson.meeting_link ? (
                                <a href={lesson.meeting_link} target="_blank" rel="noopener noreferrer"
                                  className="px-4 py-1.5 bg-[#1f8cf9] rounded-md font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors">
                                  Приєднатися
                                </a>
                              ) : (
                                <span className="px-4 py-1.5 bg-[#1f8cf9] rounded-md font-inter font-semibold text-white text-sm">Йде урок</span>
                              )}
                              <button type="button" onClick={() => setComplaintOpen(true)}
                                className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                                Поскаржитись
                              </button>
                            </>
                          ) : isSoon ? (
                            <>
                              <span className="px-3 py-1.5 bg-orange-50 rounded-md font-inter font-semibold text-orange-500 text-sm">
                                Через {mins} хв
                              </span>
                              <button type="button" onClick={() => setComplaintOpen(true)}
                                className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                                Поскаржитись
                              </button>
                            </>
                          ) : mins > 15 ? (
                            <>
                              <span className="px-3 py-1.5 bg-[#f4f4f6] rounded-md font-inter font-semibold text-[#565d6d] text-sm">
                                Через {mins} хв
                              </span>
                              <button type="button" disabled
                                className="px-4 py-1.5 bg-gray-50 border border-[#dee1e6] rounded-md font-inter font-semibold text-gray-300 text-sm cursor-not-allowed">
                                Поскаржитись
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-4 py-1.5 bg-gray-100 rounded-md font-inter font-semibold text-gray-400 text-sm">Завершено</span>
                              <button type="button" onClick={() => setComplaintOpen(true)}
                                className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                                Поскаржитись
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#dee1e6] p-10 text-center">
                  <p className="font-inter text-[#9095a1] text-sm">Сьогодні занять немає</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Complaint Modal */}
      {complaintOpen && !complaintSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setComplaintOpen(false); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1f8cf91a] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h2 className="font-poppins font-bold text-slate-900 text-xl">Поскаржити</h2>
              </div>
              <button type="button" onClick={() => setComplaintOpen(false)} aria-label="Закрити" title="Закрити"
                className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="font-inter text-[#565d6d] text-sm leading-6">
              Надішліть скаргу про відсутність викладача на занятті. Ми перевіримо інформацію та вживемо необхідних заходів.
            </p>
            <button type="button" onClick={() => { setComplaintSent(true); setComplaintOpen(false); }}
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
            <button onClick={() => setComplaintSent(false)}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">OK</button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}