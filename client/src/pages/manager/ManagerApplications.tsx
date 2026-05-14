import { useState, useEffect, useMemo } from 'react';
import ManagerLayout from './ManagerLayout';
import { apiClient, extractErrorMessage } from '../../services/api';

type FilterStatus = 'Усі' | 'new' | 'in_progress' | 'resolved';

// Request model from users/models.py — те що реально повертає /user-requests/
interface Request {
  id: number;
  user: number;
  manager: number | null;
  title: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'НОВА',
  in_progress: 'В РОБОТІ',
  resolved: 'ВИРІШЕНО',
  rejected: 'ВІДХИЛЕНО',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-orange-100 text-orange-600',
  in_progress: 'bg-blue-100 text-blue-600',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function ManagerApplications() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Усі');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; req: Request } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    apiClient.get('/user-requests/')
      .then(res => {
        const data = res.data as { results?: Request[] } | Request[];
        setRequests(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = useMemo(() =>
    requests.filter(r => filterStatus === 'Усі' || r.status === filterStatus),
    [requests, filterStatus]
  );

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const newStatus = confirmAction.type === 'approve' ? 'resolved' : 'rejected';
      await apiClient.patch(`/user-requests/${confirmAction.req.id}/`, { status: newStatus });
      setRequests(p => p.map(r => r.id === confirmAction.req.id ? { ...r, status: newStatus } : r));
      if (selected?.id === confirmAction.req.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      setSuccessMsg(confirmAction.type === 'approve' ? 'Заявку прийнято!' : 'Заявку відхилено.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <ManagerLayout>
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Заявки</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Керування запитами від користувачів платформи.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {(['Усі', 'new', 'in_progress', 'resolved'] as FilterStatus[]).map(s => (
            <button key={s} type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl font-inter font-medium text-sm transition-colors ${filterStatus === s ? 'bg-[#1f8cf9] text-white' : 'bg-white border border-[#dee1e6] text-[#565d6d] hover:bg-gray-50'}`}>
              {s === 'Усі' ? 'Всі' : STATUS_LABELS[s]}
            </button>
          ))}
          <span className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-xl font-inter text-orange-600 text-xs font-bold">
            Нових: {requests.filter(r => r.status === 'new').length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="font-inter font-bold text-red-700 text-sm">Помилка</p>
            <p className="font-inter text-red-600 text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex items-start gap-8">
            {/* List */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {filtered.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-[#dee1e6] text-center">
                  <svg className="mx-auto mb-3" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dee1e6" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  <p className="font-inter font-bold text-slate-900">Немає заявок</p>
                  <p className="font-inter text-[#9095a1] text-sm mt-1">Нові запити з'являться тут автоматично</p>
                </div>
              ) : filtered.map(req => (
                <article key={req.id}
                  className={`flex items-center gap-5 p-5 bg-white rounded-2xl border transition-all cursor-pointer ${selected?.id === req.id ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6] hover:shadow-sm'}`}
                  onClick={() => setSelected(p => p?.id === req.id ? null : req)}>
                  <div className="w-11 h-11 rounded-full bg-[#1f8cf91a] flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-bold text-slate-900 text-base">{req.title}</p>
                    <p className="font-inter text-[#9095a1] text-xs mt-0.5">
                      Користувач #{req.user}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full font-inter font-bold text-[10px] ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[req.status] ?? req.status.toUpperCase()}
                    </span>
                    <span className="font-inter text-[#9095a1] text-xs">
                      {new Date(req.created_at).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Side panel */}
            {selected && (
              <aside className="w-[300px] flex-shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                <div className="flex items-center justify-between p-6 bg-[#1f8cf91a]">
                  <div>
                    <p className="font-poppins font-bold text-slate-900 text-lg">Деталі заявки</p>
                    <p className="font-inter font-bold text-[#1f8cf9] text-xs mt-0.5">#{selected.id}</p>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-[#1f8cf9] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  {[
                    { label: 'ЗАПИТ', value: selected.title },
                    { label: 'КОРИСТУВАЧ', value: `#${selected.user}` },
                    { label: 'ДАТА', value: new Date(selected.created_at).toLocaleDateString('uk-UA') },
                    { label: 'СТАТУС', value: STATUS_LABELS[selected.status] ?? selected.status },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-0.5 pb-3 border-b border-[#f4f4f6] last:border-0 last:pb-0">
                      <span className="font-inter font-bold text-[#565d6d] text-[10px] tracking-widest uppercase">{f.label}</span>
                      <span className="font-inter font-semibold text-slate-800 text-sm break-words">{f.value}</span>
                    </div>
                  ))}

                  {selected.status === 'new' && (
                    <div className="flex flex-col gap-3 pt-2">
                      <button type="button"
                        onClick={() => setConfirmAction({ type: 'approve', req: selected })}
                        className="flex items-center justify-center gap-2 py-3 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Прийняти
                      </button>
                      <button type="button"
                        onClick={() => setConfirmAction({ type: 'reject', req: selected })}
                        className="flex items-center justify-center gap-2 py-3 w-full border border-red-200 rounded-2xl font-inter font-medium text-red-500 text-sm hover:bg-red-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Відхилити
                      </button>
                    </div>
                  )}

                  {selected.status !== 'new' && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${selected.status === 'resolved' ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected.status === 'resolved' ? '#16a34a' : '#6b7280'} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      <span className={`font-inter text-sm font-medium ${selected.status === 'resolved' ? 'text-green-700' : 'text-gray-500'}`}>
                        {selected.status === 'resolved' ? 'Заявку вирішено' : 'Заявку відхилено'}
                      </span>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setConfirmAction(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-8 flex flex-col items-center gap-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmAction.type === 'approve' ? 'bg-blue-50 text-[#1f8cf9]' : 'bg-red-50 text-red-500'}`}>
              {confirmAction.type === 'approve'
                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">
              {confirmAction.type === 'approve' ? 'Прийняти заявку?' : 'Відхилити заявку?'}
            </h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">
              {`Статус заявки "${confirmAction.req.title}" буде змінено.`}
            </p>
            <div className="flex gap-3 w-full">
              <button type="button" onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50">
                Скасувати
              </button>
              <button type="button" onClick={() => void handleConfirm()} disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-inter font-medium text-sm text-white disabled:opacity-50 ${confirmAction.type === 'approve' ? 'bg-[#1f8cf9] hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {actionLoading ? 'Збереження...' : confirmAction.type === 'approve' ? 'Прийняти' : 'Відхилити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSuccessMsg('')} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">{successMsg}</p>
            <button type="button" onClick={() => setSuccessMsg('')}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600">OK</button>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}