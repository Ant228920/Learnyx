const subjects = [
  { icon: '🔤', name: 'Англійська мова' },
  { icon: '📖', name: 'Українська мова' },
  { icon: '📐', name: 'Математика' },
  { icon: '🕐', name: 'Історія України' },
  { icon: '💻', name: 'Інформатика' },
];

const stats = ['500+ ВИКЛАДАЧІВ', '10,000+ УЧНІВ', '15+ МОВ НАВЧАННЯ'];

const testimonials = [
  {
    title: 'Відгуки учнів',
    name: 'Олександр Коваль',
    role: 'Студент КПІ',
    avatar: 'https://i.pravatar.cc/56?img=11',
    quote: '"Знайшов чудового викладача з математики. Пояснює складні теми простими словами. Завдяки платформі підтягнув успішність за семестр!"',
  },
  {
    title: 'Відгуки викладачів',
    name: 'Віктор Іванович',
    role: 'Викладач англійської, 15 років досвіду',
    avatar: 'https://i.pravatar.cc/56?img=3',
    quote: '"Платформа надає чудові інструменти для організації навчального процесу. Прозорість виплат та постійний потік мотивованих студентів."',
  },
];

const footerLinks = ['Конфіденційність', 'Умови використання', 'Допомога'];

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex w-full flex-col bg-white">

      {/* ── Hero ── */}
      <section className="flex flex-col max-w-[1440px] w-full items-start gap-8 pt-24 pb-32 px-20 mx-auto">
        <div className="inline-flex items-center pt-[11.5px] pb-[8.5px] px-4 bg-[#1f8cf91a] rounded-full">
          <p className="font-bold text-[#1f8cf9] text-xs tracking-[0.60px] leading-4 whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif" }}>
            НОВА ЕРА ОНЛАЙН ОСВІТИ В УКРАЇНІ
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full items-center">
          <div>
            <h1 className="sr-only">Навчайся ефективно. Досягай більше.</h1>
            <div aria-hidden="true" className="relative h-hero-title">
              <div className="absolute top-0 left-0 font-bold text-slate-900 text-7xl tracking-[-1.80px] leading-[79.2px]" style={{ fontFamily: "'Poppins', sans-serif" }}>Навчайся</div>
              <div className="absolute top-20 left-0 font-extrabold italic text-[#1f8cf9] text-7xl tracking-[-1.80px] leading-[79.2px]" style={{ fontFamily: "'Inter', sans-serif" }}>ефективно</div>
              <div className="absolute top-40 left-0 font-bold text-slate-900 text-7xl tracking-[-1.80px] leading-[79.2px]" style={{ fontFamily: "'Poppins', sans-serif" }}>Досягай</div>
              <div className="absolute top-[159px] left-[303px] font-extrabold italic text-[#1f8cf9] text-7xl tracking-[-1.80px] leading-[79.2px]" style={{ fontFamily: "'Inter', sans-serif" }}>більше</div>
            </div>
          </div>
          <div className="flex items-start gap-8">
            <div aria-hidden="true" className="w-1.5 h-40 bg-[#1f8cf9] rounded-full flex-shrink-0" />
            <p className="font-medium text-[#565d6d] text-3xl leading-[48.8px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Єдина екосистема для взаємодії амбітних студентів та професійних викладачів. Ми робимо знання доступними, а процес навчання — прозорим.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section aria-label="Статистика" className="w-full bg-slate-900 border-t border-b border-white/5 py-8">
        <div className="max-w-[1440px] mx-auto px-20 flex flex-wrap items-center justify-center">
          {stats.map((stat, i) => (
            <div key={stat} className={`inline-flex items-center px-8 ${i < stats.length - 1 ? 'border-r border-white/10' : ''}`}>
              <span className="font-bold text-white text-2xl tracking-[2.40px] leading-8 whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif" }}>{stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catalog ── */}
      <section id="catalog" className="w-full bg-gray-50/30 px-60 py-24">
        <div className="max-w-[1440px] mx-auto px-20 flex flex-col items-center gap-4">
          <h2 className="font-bold text-slate-900 text-4xl text-center leading-10" style={{ fontFamily: "'Poppins', sans-serif" }}>Каталог предметів</h2>
          <p className="text-[#565d6d] text-lg text-center leading-7 max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            Оберіть напрямок, який допоможе вам змінити майбутнє вже сьогодні.<br />Найкращі репетитори чекають на вас.
          </p>
          <div className="grid grid-cols-3 gap-6 pt-12 w-full">
            {subjects.slice(0, 3).map((s) => (
              <article key={s.name} className="flex flex-col items-start gap-5 pt-8 pb-9 px-8 bg-white rounded-2xl border border-[#dee1e6] hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl" aria-hidden="true">{s.icon}</div>
                <div className="flex flex-col pt-7">
                  <h3 className="font-bold text-slate-900 text-2xl leading-8" style={{ fontFamily: "'Poppins', sans-serif" }}>{s.name}</h3>
                </div>
                <button type="button" className="font-bold text-[#1f8cf9] text-sm tracking-[0.70px] leading-5 hover:underline" style={{ fontFamily: "'Inter', sans-serif" }} aria-label={`Переглянути інформацію про ${s.name}`}>
                  ПЕРЕГЛЯНУТИ ІНФОРМАЦІЮ
                </button>
              </article>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 pt-8 max-w-4xl w-full">
            {subjects.slice(3).map((s) => (
              <article key={s.name} className="flex flex-col items-start gap-5 pt-8 pb-9 px-8 bg-white rounded-2xl border border-[#dee1e6] hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl" aria-hidden="true">{s.icon}</div>
                <div className="flex flex-col pt-7">
                  <h3 className="font-bold text-slate-900 text-2xl leading-8" style={{ fontFamily: "'Poppins', sans-serif" }}>{s.name}</h3>
                </div>
                <button type="button" className="font-bold text-[#1f8cf9] text-sm tracking-[0.70px] leading-5 hover:underline" style={{ fontFamily: "'Inter', sans-serif" }} aria-label={`Переглянути інформацію про ${s.name}`}>
                  ПЕРЕГЛЯНУТИ ІНФОРМАЦІЮ
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section aria-label="Відгуки" className="w-full px-80 py-24 border-t border-[#dee1e6]">
        <div className="grid grid-cols-2 gap-16 max-w-[1440px] mx-auto">
          {testimonials.map((t) => (
            <article key={t.title} className="flex flex-col items-start gap-12">
              <h2 className="font-bold text-slate-900 text-4xl leading-10" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.title}</h2>
              <div className="flex flex-col gap-6 p-8 bg-gray-50 rounded-2xl w-full">
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <p className="font-bold text-slate-900 text-lg leading-7" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.name}</p>
                    <p className="text-[#565d6d] text-sm leading-5" style={{ fontFamily: "'Inter', sans-serif" }}>{t.role}</p>
                  </div>
                </div>
                <blockquote className="italic text-[#565d6d] text-base leading-[26px]" style={{ fontFamily: "'Inter', sans-serif" }}>{t.quote}</blockquote>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Feedback ── */}
      <section className="w-full bg-blue-50 px-60 py-24">
        <div className="grid grid-cols-2 gap-16 max-w-[1440px] mx-auto px-20 items-center min-h-[481px]">
          <div className="flex flex-col gap-8 self-center">
            <h2 className="font-bold text-[#140b41] text-4xl leading-10" style={{ fontFamily: "'Poppins', sans-serif" }}>Допоможіть нам стати кращими</h2>
            <p className="text-[#565d6d] text-xl leading-[32.5px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Ваш досвід — це найцінніше, що у нас є. Поділіться своїми враженнями від навчання на LearNYX, щоб ми могли вдосконалювати платформу та робити освіту ще якіснішою для кожного українця.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-10 shadow-[0px_25px_50px_#00000040] flex flex-col gap-2 self-center">
            <h3 className="font-bold text-slate-900 text-2xl leading-8" style={{ fontFamily: "'Poppins', sans-serif" }}>Залиште свій відгук</h3>
            <p className="text-[#565d6d] text-sm leading-5" style={{ fontFamily: "'Inter', sans-serif" }}>Будь ласка, опишіть ваші враження від роботи з репетиторами або функціоналу сайту.</p>
            <div className="flex flex-col gap-3 pt-6 pb-[22px]">
              <label htmlFor="feedback-text" className="font-bold text-[#565d6d] text-xs tracking-[0.60px]" style={{ fontFamily: "'Inter', sans-serif" }}>ВАШ ВІДГУК</label>
              <div className="h-32 bg-gray-50/50 rounded-2xl overflow-hidden border border-[#dee1e6]">
                <textarea
                  id="feedback-text"
                  placeholder="Напишіть ваші враження тут..."
                  className="w-full h-full resize-none bg-transparent p-4 text-[#565d6d] text-base leading-6 placeholder:text-gray-400 outline-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-3 py-4 w-full bg-white rounded-xl border border-[#1f8cf9]/20 shadow-[0px_4px_7px_#1f8cf933] hover:bg-blue-50 transition-colors"
            >
              <span className="font-semibold text-[#1f8cf9] text-lg leading-7" style={{ fontFamily: "'Inter', sans-serif" }}>Надіслати відгук</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
            <p className="text-[#565d6d] text-xs text-center pt-4" style={{ fontFamily: "'Inter', sans-serif" }}>Натискаючи на кнопку, ви погоджуєтесь з умовами обробки персональних даних та публікації відгуку.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full bg-white border-t border-[#dee1e6] px-60 py-10">
        <div className="max-w-[1440px] mx-auto px-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2" aria-label="LearNYX">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="#1f8cf9" />
              </svg>
              <span className="font-bold text-[#1f8cf9] text-base leading-6" style={{ fontFamily: "'Poppins', sans-serif" }}>LearNYX</span>
            </a>
            <nav aria-label="Навігація в підвалі" className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <a key={link} href="#" className="font-medium text-[#565d6d] text-xs leading-4 hover:text-slate-900 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{link}</a>
              ))}
            </nav>
          </div>
          <p className="font-medium text-[#565d6d] text-sm text-right" style={{ fontFamily: "'Inter', sans-serif" }}>
            © 2026 LearNYX. Всі права захищені. Зроблено з любов'ю в Україні 🇺🇦
          </p>
        </div>
      </footer>
    </div>
  );
}