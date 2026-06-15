import { useState, useEffect } from 'react';
import { useManagerReports } from '../../features/manager/reports';
import ManagerLayout from './ManagerLayout';
import { apiClient, extractErrorMessage } from '../../services/api';

interface ComplaintItem {
  id: number;
  lesson_id: number | null;
  lesson_date: string;
  teacher_name: string;
  student_name: string;
  filed_by_name: string;
  filed_by_role: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'conducted':      return { label: 'Проведено',            className: 'bg-[#e0faea] text-green-700' };
    case 'scheduled':      return { label: 'Заплановано',          className: 'bg-orange-100 text-orange-600' };
    case 'student_missed': return { label: 'Учень не з\'явився',   className: 'bg-red-100 text-red-600' };
    case 'teacher_missed': return { label: 'Вчитель не з\'явився', className: 'bg-red-100 text-red-600' };
    case 'canceled_advance':
    case 'cancelled':      return { label: 'Скасовано',            className: 'bg-gray-100 text-gray-500' };
    default:               return { label: status,                 className: 'bg-gray-100 text-gray-500' };
  }
}

function getComplaintStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'accepted': return { label: 'Прийнято',        className: 'bg-[#e0faea] text-green-700' };
    case 'rejected': return { label: 'Відхилено',       className: 'bg-red-100 text-red-600' };
    case 'reviewed': return { label: 'Розглянуто',      className: 'bg-blue-100 text-blue-600' };
    default:         return { label: 'Очікує розгляду', className: 'bg-orange-100 text-orange-600' };
  }
}

function reasonLabel(reason: string): string {
  if (reason === 'teacher_missed') return 'Викладач не з\'явився на урок';
  if (reason === 'student_missed') return 'Учень не з\'явився на урок';
  return reason;
}

function getComplaintInfo(complaint: ComplaintItem): { title: string; description: string; consequence: string } {
  if (complaint.reason === 'teacher_missed') {
    return {
      title: 'Скарга від учня',
      description: `Учень ${complaint.student_name} скаржиться, що викладач ${complaint.teacher_name} не з'явився на урок.`,
      consequence: 'При прийнятті: викладачу нараховується штраф. Заняття зберігається в абонементі учня.',
    };
  }
  if (complaint.reason === 'student_missed') {
    return {
      title: 'Скарга від викладача',
      description: `Викладач ${complaint.teacher_name} скаржиться, що учень ${complaint.student_name} не з'явився на урок.`,
      consequence: 'При прийнятті: з абонементу учня списується 1 заняття. Оцінка 0 виставляється автоматично.',
    };
  }
  return {
    title: 'Скарга',
    description: `Скарга від ${complaint.filed_by_name}`,
    consequence: '',
  };
}

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function ManagerReports() {
  const { lessons, loading, error } = useManagerReports();
  const [activeTab, setActiveTab] = useState<'lessons' | 'complaints'>('lessons');

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState('');

  const [complaintModal, setComplaintModal] = useState<ComplaintItem | null>(null);
  const [processingComplaint, setProcessingComplaint] = useState(false);
  const [complaintActionMsg, setComplaintActionMsg] = useState('');

  const conducted = lessons.filter(l => l.status === 'conducted').length;
  const cancelled = lessons.filter(l =>
    ['student_missed', 'teacher_missed', 'canceled_advance', 'cancelled'].includes(l.status)
  ).length;

  const fetchComplaints = () => {
    setLoadingComplaints(true);
    setComplaintsError('');
    apiClient.get('/complaints/')
      .then(res => {
        const data = res.data as ComplaintItem[] | { results?: ComplaintItem[] };
        setComplaints(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(err => setComplaintsError(extractErrorMessage(err)))
      .finally(() => setLoadingComplaints(false));
  };

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
  }, [activeTab]);

  // Load complaint count on mount so the badge is visible before clicking the tab
  useEffect(() => {
    void fetchComplaints();
  }, []);

  const handleComplaintDecision = async (complaintId: number, decision: 'accepted' | 'rejected') => {
    setProcessingComplaint(true);
    setComplaintActionMsg('');
    try {
      await apiClient.patch(`/complaints/${complaintId}/`, { status: decision });
      setComplaintActionMsg(
        decision === 'accepted'
          ? 'Скаргу прийнято. Урок оновлено.'
          : 'Скаргу відхилено. Викладач має виставити оцінку.'
      );
      fetchComplaints();
      setTimeout(() => { setComplaintModal(null); setComplaintActionMsg(''); }, 2000);
    } catch (err) {
      setComplaintActionMsg(extractErrorMessage(err));
    } finally {
      setProcessingComplaint(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Звітність</h1>
          <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">Аналіз проведених занять та скарги.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#f4f4f6] rounded-2xl w-fit">
          <button type="button" onClick={() => setActiveTab('lessons')}
            className={`px-6 py-2.5 rounded-xl font-inter font-semibold text-sm transition-colors ${
              activeTab === 'lessons' ? 'bg-white text-slate-900 shadow-sm' : 'text-[#565d6d] hover:text-slate-900'
            }`}>
            Уроки
          </button>
          <button type="button" onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-inter font-semibold text-sm transition-colors ${
              activeTab === 'complaints' ? 'bg-white text-slate-900 shadow-sm' : 'text-[#565d6d] hover:text-slate-900'
            }`}>
            Скарги
            {complaints.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                {complaints.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* ── Lessons tab ── */}
        {activeTab === 'lessons' && (
          <>
            {loading && <p className="font-inter text-[#565d6d] text-sm">Завантаження...</p>}
            {error && <p className="font-inter text-red-500 text-sm">Помилка: {error}</p>}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-5 p-6 bg-[#f0f7ff] rounded-2xl border border-[#dee1e6]">
                    <div className="w-12 h-12 rounded-full bg-[#1f8cf9] flex items-center justify-center flex-shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-inter font-medium text-[#565d6d] text-sm">Кількість проведених уроків</p>
                      <p className="font-inter font-black text-slate-900 text-4xl leading-10 mt-0.5">{conducted}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 p-6 bg-[#fff5f5] rounded-2xl border border-[#dee1e6]">
                    <div className="w-12 h-12 rounded-full bg-[#e64c4c] flex items-center justify-center flex-shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-inter font-medium text-[#565d6d] text-sm">Кількість відмінених уроків</p>
                      <p className="font-inter font-black text-slate-900 text-4xl leading-10 mt-0.5">{cancelled}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
                  <div className="grid grid-cols-[1fr_0.6fr_1.2fr_1fr_1fr_1.5fr] px-6 py-4 border-b border-[#dee1e6]">
                    {['ДАТА', 'ЧАС', 'ПРЕДМЕТ', 'ВИКЛАДАЧ', 'УЧЕНЬ', 'СТАТУС'].map(h => (
                      <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">{h}</span>
                    ))}
                  </div>
                  {lessons.length === 0 && (
                    <div className="px-6 py-10 text-center">
                      <p className="font-inter text-[#565d6d] text-sm">Занять ще немає</p>
                    </div>
                  )}
                  {lessons.map((lesson, i) => (
                    <div key={lesson.id}
                      className={`grid grid-cols-[1fr_0.6fr_1.2fr_1fr_1fr_1.5fr] items-center px-6 py-4 ${i < lessons.length - 1 ? 'border-b border-[#dee1e6]' : ''}`}>
                      <span className="font-inter font-medium text-slate-800 text-sm">{lesson.date}</span>
                      <span className="font-inter font-medium text-slate-800 text-sm">{lesson.time}</span>
                      <div className="flex items-center gap-2">
                        <IconBook />
                        {lesson.subject && lesson.subject !== '—'
                          ? <span className="font-inter font-semibold text-slate-800 text-sm">{lesson.subject}</span>
                          : <span className="font-inter text-[#9095a1] text-sm">Не вказано</span>
                        }
                      </div>
                      <span className="font-inter text-[#565d6d] text-sm">{lesson.teacher}</span>
                      <span className="font-inter text-[#565d6d] text-sm">{lesson.student}</span>
                      {(() => { const b = getStatusBadge(lesson.status); return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-inter font-bold text-[10px] w-fit ${b.className}`}>{b.label}</span>
                      ); })()}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Complaints tab ── */}
        {activeTab === 'complaints' && (
          <>
            {loadingComplaints && <p className="font-inter text-[#565d6d] text-sm">Завантаження...</p>}
            {complaintsError && <p className="font-inter text-red-500 text-sm">Помилка: {complaintsError}</p>}
            {!loadingComplaints && !complaintsError && (
              <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
                  {['УЧЕНЬ', 'ВИКЛАДАЧ', 'ДАТА УРОКУ', 'ПРИЧИНА', 'СТАТУС'].map(h => (
                    <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">{h}</span>
                  ))}
                </div>
                {complaints.length === 0 && (
                  <div className="px-6 py-10 text-center">
                    <p className="font-inter text-[#565d6d] text-sm">Скарг поки немає</p>
                  </div>
                )}
                {complaints.map((c, i) => {
                  const badge = getComplaintStatusBadge(c.status);
                  return (
                    <div key={c.id} onClick={() => { setComplaintModal(c); setComplaintActionMsg(''); }}
                      className={`grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr] items-center px-6 py-4 cursor-pointer hover:bg-[#f8f9fb] transition-colors ${i < complaints.length - 1 ? 'border-b border-[#dee1e6]' : ''}`}>
                      <span className="font-inter text-slate-800 text-sm">{c.student_name}</span>
                      <span className="font-inter text-[#565d6d] text-sm">{c.teacher_name}</span>
                      <span className="font-inter text-[#565d6d] text-sm">{c.lesson_date}</span>
                      <span className="font-inter text-[#565d6d] text-sm truncate pr-2">{reasonLabel(c.reason)}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-inter font-bold text-[10px] w-fit ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Complaint detail modal ── */}
      {complaintModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setComplaintModal(null); setComplaintActionMsg(''); } }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-inter font-bold text-[#171a1f] text-xl">{getComplaintInfo(complaintModal).title}</h3>
              <button type="button" onClick={() => { setComplaintModal(null); setComplaintActionMsg(''); }}
                className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="font-inter text-[#565d6d] text-sm mb-4">{getComplaintInfo(complaintModal).description}</p>

            <div className="flex flex-col gap-3 mb-6">
              {[
                { label: 'Подав', value: complaintModal.filed_by_name },
                { label: 'Причина', value: reasonLabel(complaintModal.reason) },
                { label: 'Дата уроку', value: complaintModal.lesson_date },
                { label: 'Викладач', value: complaintModal.teacher_name },
                { label: 'Учень', value: complaintModal.student_name },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <span className="font-inter text-[#9095a1] text-sm flex-shrink-0">{row.label}</span>
                  <span className="font-inter text-slate-800 text-sm font-medium text-right">{row.value}</span>
                </div>
              ))}
              {complaintModal.description && (
                <div className="flex flex-col gap-1 pt-2 border-t border-[#f4f4f6]">
                  <span className="font-inter text-[#9095a1] text-sm">Опис</span>
                  <p className="font-inter text-slate-800 text-sm bg-[#f4f4f6] p-3 rounded-xl">
                    {complaintModal.description}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#f4f4f6]">
                <span className="font-inter text-[#9095a1] text-sm">Статус</span>
                {(() => { const b = getComplaintStatusBadge(complaintModal.status); return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-inter font-bold text-[10px] ${b.className}`}>{b.label}</span>
                ); })()}
              </div>
            </div>

            {complaintModal.status === 'pending' && getComplaintInfo(complaintModal).consequence && (
              <p className="font-inter text-sm text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">
                {getComplaintInfo(complaintModal).consequence}
              </p>
            )}

            {complaintActionMsg && (
              <p className={`font-inter text-sm mb-4 ${complaintActionMsg.includes('Помилка') ? 'text-red-500' : 'text-green-600'}`}>
                {complaintActionMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setComplaintModal(null); setComplaintActionMsg(''); }}
                className="flex-1 py-3 border border-[#dee1e6] rounded-2xl font-inter font-semibold text-sm text-[#565d6d] hover:bg-[#f4f4f6] transition-colors">
                Закрити
              </button>
              {complaintModal.status === 'pending' && (
                <>
                  <button type="button"
                    disabled={processingComplaint}
                    onClick={() => void handleComplaintDecision(complaintModal.id, 'rejected')}
                    className="flex-1 py-3 border border-red-300 text-red-500 rounded-2xl font-inter font-semibold text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                    Відхилити
                  </button>
                  <button type="button"
                    disabled={processingComplaint}
                    onClick={() => void handleComplaintDecision(complaintModal.id, 'accepted')}
                    className="flex-1 py-3 bg-[#1f8cf9] text-white rounded-2xl font-inter font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors">
                    Прийняти
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
