import { useState, useRef } from 'react';
import TeacherLayout from './TeacherLayout';
import { useAuth } from '../../app/providers';

interface Lesson { id: number; time: string; title: string; group: string; done: boolean; }
interface UploadedFile { id: number; name: string; size: string; type: string; }

const LESSONS: Lesson[] = [
  { id: 1, time: '09:00', title: 'Математика: Похідні', group: 'Група А-10 (12 учнів)', done: true },
  { id: 2, time: '11:30', title: 'Алгебра: Квадратні рівняння', group: 'Група Б-9 (8 учнів)', done: false },
  { id: 3, time: '14:00', title: 'Геометрія: Планіметрія', group: 'Індивідуально: Олена К.', done: false },
  { id: 4, time: '15:30', title: 'Підготовка до ЗНО', group: 'Група ЗНО-24 (15 учнів)', done: false },
  { id: 5, time: '17:00', title: 'Вища математика', group: 'Група С-1 (5 учнів)', done: false },
];

const INITIAL_FILES: UploadedFile[] = [
  { id: 1, name: 'Конспект_Похідні_Лекція_1.pdf', size: '2.4 MB', type: 'PDF' },
  { id: 2, name: 'Завдання_на_літо_10_клас.docx', size: '1.1 MB', type: 'DOCX' },
  { id: 3, name: 'Архів_тестів_2023.zip', size: '14.8 MB', type: 'ZIP' },
  { id: 4, name: 'Методичні_рекомендації_ЗНО.pdf', size: '3.2 MB', type: 'PDF' },
  { id: 5, name: 'Збірник_задач_алгебра.pdf', size: '5.1 MB', type: 'PDF' },
];

const FileIcon = ({ type }: { type: string }) => {
  const color = type === 'PDF' ? '#e64c4c' : type === 'DOCX' ? '#1f8cf9' : '#f5a83d';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>(INITIAL_FILES);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [gradeLesson, setGradeLesson] = useState<Lesson | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [notConducted, setNotConducted] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [homeworkTopic, setHomeworkTopic] = useState('Тригонометричні рівняння. Частина 2');
  const [link, setLink] = useState('');
  const [gradedIds, setGradedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedFiles = showAllFiles ? files : files.slice(0, 3);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    const newFiles: UploadedFile[] = Array.from(uploaded).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      type: f.name.split('.').pop()?.toUpperCase() ?? 'FILE',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleDeleteFile = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGradeSubmit = () => {
    if (gradeLesson) {
      setGradedIds(p => [...p, gradeLesson.id]);
      setGradeLesson(null);
      setGradeValue('');
      setNotConducted(false);
      setAbsenceReason('');
    }
  };

  // Кнопка "Поставити оцінку" активна тільки для уроку done=true або gradedIds
  const canGrade = (lesson: Lesson) => lesson.done || gradedIds.includes(lesson.id);

  return (
    <TeacherLayout>
      <div className="max-w-[1440px] mx-auto flex gap-8">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-8">
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
              Вітаємо, {user?.firstName} {user?.lastName}! 👋
            </h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">Ось актуальний розклад ваших занять на сьогодні.</p>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-6">
            {[
              { label: 'Кількість учнів', value: '42', sub: '+4 з минулого місяця', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { label: 'Всього уроків', value: '6', sub: 'Сьогодні у графіку', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
              { label: 'Фінанси за місяць', value: '12 450 ₴', sub: 'Виплачено 8 200 ₴', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> },
            ].map(s => (
              <article key={s.label} className="flex flex-col gap-3 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]">
                <div className="flex items-center justify-between">
                  <p className="font-inter font-medium text-[#565d6d] text-sm">{s.label}</p>
                  <div className="w-9 h-9 bg-[#f4f4f6] rounded-xl flex items-center justify-center">{s.icon}</div>
                </div>
                <p className="font-inter font-black text-slate-900 text-3xl">{s.value}</p>
                <p className="font-inter text-[#1f8cf9] text-xs font-medium">{s.sub}</p>
              </article>
            ))}
          </section>

          {/* Lessons */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-poppins font-bold text-slate-900 text-xl">Уроки на сьогодні</h2>
                <p className="font-inter text-[#565d6d] text-sm mt-0.5">{LESSONS.length} запланованих занять</p>
              </div>
              <span className="px-3 py-1.5 bg-[#1f8cf91a] rounded-xl font-inter font-bold text-[#1f8cf9] text-xs">Сьогодні: 8 квітня</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
              {LESSONS.map((lesson, i) => {
                const graded = gradedIds.includes(lesson.id);
                const active = canGrade(lesson);
                return (
                  <div key={lesson.id} className={`flex items-center gap-6 px-6 py-5 ${i > 0 ? 'border-t border-[#dee1e6]' : ''}`}>
                    <span className="font-inter font-bold text-slate-900 text-sm w-12 flex-shrink-0">{lesson.time}</span>
                    <div className="flex-1">
                      <p className="font-inter font-bold text-slate-900 text-sm">{lesson.title}</p>
                      <p className="font-inter text-[#565d6d] text-xs mt-0.5">{lesson.group}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {lesson.done || graded ? (
                        <>
                          <button type="button" className="px-4 py-2 bg-gray-100 rounded-xl font-inter font-semibold text-gray-400 text-sm cursor-default">
                            Проведено
                          </button>
                          <button type="button" onClick={() => { setGradeLesson(lesson); setNotConducted(false); setGradeValue(''); }}
                            className="px-4 py-2 bg-[#1f8cf9] rounded-xl font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            Поставити оцінку
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setLinkModal(true)}
                            className="px-4 py-2 bg-[#1f8cf9] rounded-xl font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors">
                            Почати урок
                          </button>
                          <button type="button" disabled={!active}
                            className={`px-4 py-2 rounded-xl font-inter font-semibold text-sm flex items-center gap-1.5 ${active ? 'bg-[#1f8cf9] text-white hover:bg-blue-600 transition-colors cursor-pointer' : 'bg-gray-50 border border-[#dee1e6] text-gray-300 cursor-not-allowed'}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            Поставити оцінку
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right — Materials */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-6">
          <h2 className="font-poppins font-bold text-slate-900 text-xl">Матеріали</h2>
          <div className="bg-white rounded-2xl border border-[#dee1e6] p-5 flex flex-col gap-4">
            <label className="flex flex-col items-center gap-3 p-5 border-2 border-dashed border-[#dee1e6] rounded-xl cursor-pointer hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div className="text-center">
                <p className="font-inter font-semibold text-slate-800 text-sm">Перетягніть файли сюди</p>
                <p className="font-inter text-[#9095a1] text-xs mt-0.5">або натисніть кнопку нижче</p>
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 border border-[#dee1e6] rounded-lg font-inter text-slate-700 text-sm hover:bg-gray-50 transition-colors">
                Вибрати файл
              </button>
              <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
            <p className="font-inter text-[#9095a1] text-[10px] text-center">Дозволені формати: PDF, DOCX, ZIP. Максимальний розмір: 50MB.</p>
          </div>

          <div>
            <p className="font-inter font-bold text-slate-900 text-xs tracking-[0.60px] uppercase mb-3">Нещодавні</p>
            <div className="flex flex-col gap-2">
              {displayedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#dee1e6] hover:shadow-sm transition-shadow group">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon type={file.type} />
                    <div className="min-w-0">
                      <p className="font-inter font-semibold text-slate-800 text-xs truncate max-w-[140px]">{file.name}</p>
                      <p className="font-inter text-[#9095a1] text-[10px]">{file.size} • {file.type}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleDeleteFile(file.id)}
                    aria-label={`Видалити ${file.name}`} title="Видалити"
                    className="text-[#9095a1] hover:text-red-500 transition-colors flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
              ))}
            </div>

            {files.length > 3 && (
              <button type="button" onClick={() => setShowAllFiles(!showAllFiles)}
                className="mt-3 font-inter font-bold text-[#1f8cf9] text-sm flex items-center gap-1 hover:underline">
                {showAllFiles ? 'Сховати' : `Переглянути всі файли (${files.length})`}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points={showAllFiles ? '18 15 12 9 6 15' : '9 18 15 12 9 6'} />
                </svg>
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Grade Modal */}
      {gradeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setGradeLesson(null); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-fade-in p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Поставити оцінку</h2>
              <button type="button" onClick={() => setGradeLesson(null)} aria-label="Закрити" title="Закрити"
                className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Not conducted toggle */}
            <div className="flex items-center justify-between p-4 bg-[#fff5f5] rounded-xl border border-[#fee2e2]">
              <div>
                <p className="font-inter font-bold text-slate-900 text-sm">Урок не проведено</p>
                <p className="font-inter text-[#565d6d] text-xs mt-0.5">Учень не з'явився — оцінка 0</p>
              </div>
              <button type="button" onClick={() => { setNotConducted(!notConducted); if (!notConducted) setGradeValue('0'); else setGradeValue(''); }}
                className={`relative w-12 h-6 rounded-full transition-colors ${notConducted ? 'bg-[#e64c4c]' : 'bg-[#dee1e6]'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notConducted ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {notConducted ? (
              <div className="flex flex-col gap-1">
                <label htmlFor="absence-reason" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Причина відсутності</label>
                <textarea id="absence-reason" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)}
                  placeholder="Вкажіть причину відсутності учня..."
                  rows={3}
                  className="w-full border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                <p className="font-inter text-xs text-[#9095a1]">Оцінка автоматично: <span className="font-bold text-[#e64c4c]">0 балів</span></p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="grade-value" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Оцінка за урок</label>
                  <div className="relative">
                    <input id="grade-value" type="text" value={gradeValue} onChange={e => setGradeValue(e.target.value)}
                      placeholder="Оцінка, наприклад 8/10"
                      className="w-full border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] pr-10" />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Статус уроку</label>
                  <div className="w-full border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-[#9095a1] bg-[#f8f9fb]">Проведено ✓</div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="hw-topic" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Тема домашнього завдання</label>
                  <input id="hw-topic" type="text" value={homeworkTopic} onChange={e => setHomeworkTopic(e.target.value)}
                    placeholder="Введіть тему домашнього завдання"
                    aria-label="Тема домашнього завдання"
                    className="w-full border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Завантажити файл домашнього завдання</label>
                  <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-[#dee1e6] rounded-xl cursor-pointer hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <p className="font-inter text-[#565d6d] text-sm text-center">Перетягніть файл сюди або скористайтеся кнопкою</p>
                    <p className="font-inter text-[#9095a1] text-xs">PDF, DOCX, JPG • ДО 10MB</p>
                    <button type="button" className="px-4 py-1.5 border border-[#dee1e6] rounded-lg font-inter text-slate-700 text-sm hover:bg-gray-50">Вибрати файл</button>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </>
            )}

            <button type="button" onClick={handleGradeSubmit}
              className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
              Підтвердити оцінку
            </button>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setLinkModal(false); }}
          role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Надіслати посилання</h2>
              <button type="button" onClick={() => setLinkModal(false)} aria-label="Закрити" title="Закрити"
                className="text-[#9095a1] hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="font-inter text-[#565d6d] text-sm text-center">Поділіться навчальним матеріалом або корисним ресурсом зі своєю групою.</p>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input type="url" value={link} onChange={e => setLink(e.target.value)}
                placeholder="Вставте посилання сюди"
                aria-label="Посилання"
                className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]" />
            </div>
            <button type="button" onClick={() => { setLinkModal(false); setLink(''); }}
              className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors">
              Відправити
            </button>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}