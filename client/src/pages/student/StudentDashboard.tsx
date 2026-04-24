import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';

type LessonStatus = 'completed' | 'join';

interface Lesson {
  time: string;
  title: string;
  status: LessonStatus;
}

const lessons: Lesson[] = [
  { time: '09:00 - 10:30', title: 'Вища математика: Диференціальні рівняння', status: 'completed' },
  { time: '14:00 - 15:30', title: 'Українська література: Поезія шістдесятників', status: 'join' },
  { time: '11:00 - 12:30', title: 'Англійська мова: Business Communication (B2)', status: 'completed' },
  { time: '16:00 - 17:30', title: 'Основи програмування: Структури даних', status: 'join' },
  { time: '18:00 - 19:30', title: 'Історія України: Становлення незалежності', status: 'join' },
];

const navItems = [
  { label: 'Дашборд', active: true },
  { label: 'Домашні завдання', active: false },
  { label: 'Розклад', active: false },
  { label: 'Підписка', active: false },
  { label: 'Оцінки', active: false },
];

const footerLinks = ['Політика конфіденційності', 'Допомога', 'Про проект'];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 flex h-full w-64 flex-col items-start border-r border-[#dee1e6] bg-white z-30">
        <div className="flex w-full items-center gap-3 p-6">
          <div className="w-8 h-8 bg-[#1f8cf9] rounded-md flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" />
            </svg>
          </div>
          <span className="font-poppins font-bold text-[#1f8cf9] text-xl">LearNYX</span>
        </div>

        <nav aria-label="Основна навігація" className="flex flex-1 flex-col gap-2 px-4 py-4 w-full">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
                item.active
                  ? 'bg-[#1f8cf9] shadow-[0px_2px_4px_#1f8cf933]'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className={`font-inter text-sm font-medium ${item.active ? 'text-white' : 'text-[#565d6d]'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="border-t border-[#dee1e6] p-4 w-full">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-inter text-sm font-medium text-[#565d6d]">Налаштування</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 pl-64 min-h-screen">
        {/* Header */}
        <header className="h-16 flex items-center justify-end px-8 border-b border-[#dee1e6] bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4 pl-6 border-l border-[#dee1e6]">
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-inter font-bold text-slate-900 text-sm">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="font-inter text-[#1f8cf9] text-xs">
                @{user?.firstName?.toLowerCase()}_student
              </span>
            </div>
            <div className="relative w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="font-inter font-bold text-[#1f8cf9] text-sm">
                {user?.firstName?.[0]}
              </span>
              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-[#26d962] rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-16 py-8 max-w-[1200px] w-full mx-auto flex flex-col gap-8">
          {/* Greeting */}
          <section aria-label="Вітання">
            <h1 className="font-poppins text-[#171a1f] text-3xl leading-[37.5px]">
              Вітаємо, {user?.firstName}! 👋
            </h1>
            <p className="font-inter text-[#565d6d] text-base leading-6 mt-2">
              Ось огляд ваших успіхів та розклад на сьогодні.
            </p>
          </section>

          {/* Summary cards */}
          <section aria-label="Огляд навчання" className="grid grid-cols-3 gap-6">
            {/* Абонемент */}
            <article className="flex flex-col gap-4 p-6 bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
              <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Ваш абонемент</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1f8cf91a] rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <div>
                  <p className="font-inter font-bold text-[#171a1f] text-lg leading-[22.5px]">З абонементу залишилось:</p>
                  <p className="font-poppins font-bold text-[#1f8cf9] text-2xl leading-8">10 / 12</p>
                </div>
              </div>
            </article>

            {/* Найближче заняття */}
            <article className="flex flex-col gap-4 p-6 bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
              <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Найближче заняття</p>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#f5a83d1a] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a83d" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className="font-poppins font-bold text-[#171a1f] text-xl leading-[25px]">
                  Українська література:<br />Поезія шістдесятників
                </p>
              </div>
            </article>

            {/* Бонуси */}
            <article className="flex flex-col gap-6 p-6 bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
              <p className="font-inter font-medium text-[#565d6d] text-xs tracking-[0.60px] uppercase">Накопичені бонуси</p>
              <div className="flex flex-col gap-4 pt-1">
                <div
                  role="progressbar"
                  aria-valuenow={10}
                  aria-valuemin={0}
                  aria-valuemax={15}
                  aria-label="Прогрес бонусів: 10 з 15"
                  className="h-3 bg-[#bcddfd] rounded-md overflow-hidden"
                >
                  <div className="h-full bg-[#1f8cf9]" style={{ width: '66.7%' }} />
                </div>
                <div className="flex justify-between">
                  {['5', '10', '15'].map((v) => (
                    <span key={v} className={`font-inter font-bold text-xs ${v === '15' ? 'text-[#565d6d]' : 'text-[#1f8cf9]'}`}>{v}</span>
                  ))}
                </div>
              </div>
            </article>
          </section>

          {/* Lessons */}
          <section className="flex flex-col gap-6 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#171a1f" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h2 className="font-poppins font-bold text-[#171a1f] text-xl tracking-[-0.40px] leading-[30px]">Уроки на сьогодні</h2>
              </div>
              <time dateTime="2024-05-24" className="font-inter font-medium text-[#565d6d] text-sm leading-5">
                24 Травня, П'ятниця
              </time>
            </div>

            <div className="bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12] overflow-hidden">
              {lessons.map((lesson, index) => (
                <article
                  key={lesson.time}
                  className={`flex items-center justify-between gap-6 px-6 py-5 ${index > 0 ? 'border-t border-[#dee1e6]' : ''}`}
                >
                  <div className="flex items-center gap-2 w-40 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-inter font-bold text-[#171a1f] text-sm leading-5 whitespace-nowrap">{lesson.time}</span>
                  </div>

                  <p className="font-inter font-medium text-[#171a1f] text-base leading-6 flex-1">{lesson.title}</p>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lesson.status === 'completed' ? (
                      <>
                        <button type="button" aria-label={`Урок завершено: ${lesson.title}`} className="px-4 py-1.5 bg-gray-100 rounded-md font-inter font-semibold text-gray-400 text-sm">
                          Завершено
                        </button>
                        <button type="button" aria-label={`Поскаржитись на урок: ${lesson.title}`} className="px-4 py-1.5 border border-red-500 rounded-md font-inter font-semibold text-red-500 text-sm hover:bg-red-50 transition-colors">
                          Поскаржитись
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" aria-label={`Приєднатися до уроку: ${lesson.title}`} className="px-4 py-1.5 bg-[#1f8cf9] rounded-md font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors">
                          Приєднатися
                        </button>
                        <button type="button" aria-label={`Поскаржитись: ${lesson.title}`} className="px-4 py-1.5 bg-gray-50 border border-[#dee1e6] rounded-md font-inter font-semibold text-gray-400 text-sm hover:bg-gray-100 transition-colors">
                          Поскаржитись
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-16 py-6 border-t border-[#dee1e6] bg-white">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <p className="font-inter text-[#565d6d] text-xs">© 2024 LearnYX Ecosystem. Усі права захищені.</p>
            <nav aria-label="Нижня навігація" className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <a key={link} href="#" className="font-inter font-medium text-[#565d6d] text-xs hover:text-slate-900 transition-colors">{link}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}