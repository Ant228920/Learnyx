import { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../app/providers';
import { studentApi, apiClient, extractErrorMessage } from '../../services/api';
import type { StudentDashboard as DashboardData } from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaintModal, setComplaintModal] = useState<{ lessonId: number; teacherName: string } | null>(null);
  const [complaintSending, setComplaintSending] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState('');
  const [complaintError, setComplaintError] = useState('');

  useEffect(() => {
    studentApi.getDashboard()
      .then(setData)
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' });

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
                    <div
                      className="h-full bg-[#1f8cf9] transition-all rounded-md"
                      style={{ width: `${Math.min(data?.bonus_progress?.success_pct ?? 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    {['5%', '10%', '15%'].map(v => (
                      <span key={v} className="font-inter font-bold text-xs text-[#565d6d]">{v}</span>
                    ))}
                  </div>
                  <p className="font-inter font-medium text-xs text-[#171a1f]">
                    {data?.bonus_progress
                      ? `${data.bonus_progress.earned_points} / ${data.bonus_progress.max_points} балів → ${data.bonus_progress.bonus_pct}% бонус`
                      : 'Немає активного абонементу'}
                  </p>
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
                    const hasMeetingLink = !!lesson.meeting_link && lesson.meeting_link.trim() !== '';
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
                          {hasMeetingLink ? (
                            <>
                              <a href={lesson.meeting_link ?? undefined} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-1.5 bg-[#1f8cf9] rounded-md font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors">
                                Приєднатися до уроку
                              </a>
                              <button type="button"
                                onClick={() => setComplaintModal({ lessonId: lesson.lesson_id, teacherName: lesson.teacher })}
                                className="flex items-center gap-1.5 px-4 py-1.5 border border-red-300 text-red-500 font-inter font-semibold text-sm rounded-md hover:bg-red-50 transition-colors">
                                Поскаржитись
                              </button>
                            </>
                          ) : (
                            <button type="button" disabled
                              className="px-3 py-1.5 bg-gray-100 rounded-md font-inter font-semibold text-gray-400 text-sm cursor-not-allowed">
                              Очікуйте посилання від викладача
                            </button>
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
      {complaintModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setComplaintModal(null); setComplaintError(''); setComplaintSuccess(''); } }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-inter font-bold text-[#171a1f] text-xl mb-4">Подати скаргу</h3>
            <p className="font-inter text-[#565d6d] text-sm mb-6">
              Викладач <strong>{complaintModal.teacherName}</strong> не з'явився на урок? Подайте скаргу — менеджер розгляне її та вживе заходів.
            </p>
            {complaintError && <p className="text-red-500 text-sm mb-4">{complaintError}</p>}
            {complaintSuccess && <p className="text-green-600 text-sm mb-4">{complaintSuccess}</p>}
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setComplaintModal(null); setComplaintError(''); setComplaintSuccess(''); }}
                className="flex-1 py-3 border border-[#dee1e6] rounded-2xl font-inter font-semibold text-sm text-[#565d6d] hover:bg-[#f4f4f6] transition-colors">
                Скасувати
              </button>
              <button type="button"
                disabled={complaintSending}
                onClick={async () => {
                  setComplaintSending(true);
                  setComplaintError('');
                  try {
                    await apiClient.post(`/lessons/${complaintModal.lessonId}/complaint/`, {
                      reason: 'teacher_missed',
                      description: 'Викладач не з\'явився на урок',
                    });
                    setComplaintSuccess('Скаргу подано. Менеджер розгляне її найближчим часом.');
                    setTimeout(() => { setComplaintModal(null); setComplaintSuccess(''); }, 2000);
                  } catch (err) {
                    setComplaintError(extractErrorMessage(err));
                  } finally {
                    setComplaintSending(false);
                  }
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-inter font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
                {complaintSending ? 'Відправляємо...' : 'Подати скаргу'}
              </button>
            </div>
          </div>
        </div>
      )}

    </StudentLayout>
  );
}