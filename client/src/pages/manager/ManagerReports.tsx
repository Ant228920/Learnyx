import { useManagerReports } from '../../features/manager/reports';
import ManagerLayout from './ManagerLayout';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'conducted': return 'Проведено';
    case 'missed':    return 'Не проведено — по вині учня';
    case 'cancelled': return 'Не проведено — по вині викладача';
    default:          return status;
  }
}

function getStatusStyle(status: string): string {
  if (status === 'conducted') return 'bg-[#e0faea] text-[#1a7bd9]';
  return 'bg-[#fff0f0] text-[#e64c4c]';
}

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function ManagerReports() {
  const { lessons, loading, error } = useManagerReports();

  const conducted = lessons.filter(l => l.status === 'conducted').length;
  const cancelled = lessons.filter(l => l.status !== 'conducted').length;

  return (
    <ManagerLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Звітність</h1>
          <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">Аналіз проведених занять та активності викладачів.</p>
        </div>

        {loading && <p className="font-inter text-[#565d6d] text-sm">Завантаження...</p>}
        {error && <p className="font-inter text-red-500 text-sm">Помилка: {error}</p>}

        {!loading && !error && (
          <>
            {/* Stats cards */}
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

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
              <div className="grid grid-cols-[1fr_0.6fr_1.2fr_1fr_1fr_1.5fr] px-6 py-4 border-b border-[#dee1e6]">
                {['ДАТА', 'ЧАС', 'ПРЕДМЕТ', 'ВИКЛАДАЧ', 'УЧЕНЬ', 'СТАТУС'].map((h) => (
                  <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">{h}</span>
                ))}
              </div>

              {lessons.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <p className="font-inter text-[#565d6d] text-sm">Занять ще немає</p>
                </div>
              )}

              {lessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className={`grid grid-cols-[1fr_0.6fr_1.2fr_1fr_1fr_1.5fr] items-center px-6 py-4 ${
                    i < lessons.length - 1 ? 'border-b border-[#dee1e6]' : ''
                  }`}
                >
                  <span className="font-inter font-medium text-slate-800 text-sm">{lesson.date}</span>
                  <span className="font-inter font-medium text-slate-800 text-sm">{lesson.time}</span>
                  <div className="flex items-center gap-2">
                    <IconBook />
                    <span className="font-inter font-semibold text-slate-800 text-sm">{lesson.subject}</span>
                  </div>
                  <span className="font-inter text-[#565d6d] text-sm">{lesson.teacher}</span>
                  <span className="font-inter text-[#565d6d] text-sm">{lesson.student}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full font-inter font-semibold text-xs w-fit ${getStatusStyle(lesson.status)}`}>
                    {getStatusLabel(lesson.status)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
