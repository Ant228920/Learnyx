import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from './ManagerLayout';
import { apiClient, extractErrorMessage } from '../../services/api';

interface RequestItem {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/user-requests/')
      .then(res => {
        const data = res.data as { results?: RequestItem[] } | RequestItem[];
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setRequests(list);
      })
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const newRequests = requests.filter(r => r.status === 'new');

  return (
    <ManagerLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Панель менеджера</h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">Загальний огляд платформи та активності користувачів.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="font-inter font-bold text-red-700 text-sm">Помилка завантаження</p>
            <p className="font-inter text-red-600 text-sm mt-1">{error}</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <section className="grid grid-cols-3 gap-6">
              {[
                {
                  label: 'Нові заявки',
                  value: newRequests.length,
                  sub: 'Очікують підтвердження',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
                  bg: 'bg-orange-50',
                  color: 'text-orange-600',
                },
                {
                  label: 'Всього заявок',
                  value: requests.length,
                  sub: 'За весь час',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
                  bg: 'bg-[#1f8cf91a]',
                  color: 'text-[#1f8cf9]',
                },
                {
                  label: 'Оброблено',
                  value: requests.filter(r => r.status !== 'new').length,
                  sub: 'Підтверджено або відхилено',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#26d962" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
                  bg: 'bg-[#e0faea]',
                  color: 'text-[#1a7bd9]',
                },
              ].map(s => (
                <article key={s.label} className="flex flex-col gap-3 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                  <div className="flex items-center justify-between">
                    <p className="font-inter font-medium text-[#565d6d] text-sm">{s.label}</p>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
                  </div>
                  <p className={`font-inter font-black text-3xl ${s.color}`}>{s.value}</p>
                  <p className="font-inter text-[#9095a1] text-xs">{s.sub}</p>
                </article>
              ))}
            </section>

            {/* Alert for new requests */}
            {newRequests.length > 0 && (
              <div className="flex items-center justify-between p-5 bg-orange-50 rounded-2xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <p className="font-inter font-medium text-orange-800 text-sm">
                    Є <strong>{newRequests.length}</strong> нових заявок на реєстрацію — потребують вашої уваги
                  </p>
                </div>
                <button type="button" onClick={() => void navigate('/manager/applications')}
                  className="px-4 py-2 bg-orange-500 rounded-xl font-inter font-medium text-white text-sm hover:bg-orange-600 transition-colors flex-shrink-0">
                  Переглянути
                </button>
              </div>
            )}

            {/* Recent requests */}
            {requests.length > 0 && (
              <section>
                <h2 className="font-poppins font-bold text-slate-900 text-xl mb-4">Останні заявки</h2>
                <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
                  {requests.slice(0, 5).map((req, i) => (
                    <div key={req.id}
                      className={`flex items-center gap-5 px-6 py-4 ${i > 0 ? 'border-t border-[#dee1e6]' : ''}`}>
                      <div className="w-9 h-9 rounded-full bg-[#1f8cf91a] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-inter font-semibold text-slate-800 text-sm">{req.title}</p>
                        <p className="font-inter text-[#9095a1] text-xs mt-0.5">{new Date(req.created_at).toLocaleDateString('uk-UA')}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-inter font-bold text-[10px] ${req.status === 'new' ? 'bg-orange-100 text-orange-600' : req.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {req.status === 'new' ? 'НОВА' : req.status === 'in_progress' ? 'В РОБОТІ' : req.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
}