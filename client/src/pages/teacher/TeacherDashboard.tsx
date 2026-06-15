import { useState, useEffect, useRef } from 'react';
import TeacherLayout from './TeacherLayout';
import { useAuth } from '../../app/providers';
import { apiClient, teacherApi, extractErrorMessage, formatUkrTime } from '../../services/api';
import type { TeacherDashboard as DashboardData } from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

interface UploadedFile { id: number; name: string; size: string; type: string; url?: string; }

type LessonStatus = 'conducted' | 'student_missed';

const LESSON_STATUS_OPTIONS: { value: LessonStatus; label: string }[] = [
  { value: 'conducted',      label: 'Урок проведено' },
  { value: 'student_missed', label: 'Учень не з\'явився' },
];

const FileIcon = ({ type }: { type: string }) => {
  const color = type === 'PDF' ? '#e64c4c' : type === 'DOCX' ? '#1f8cf9' : '#f5a83d';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    try { return JSON.parse(localStorage.getItem('teacher_materials') ?? '[]') as UploadedFile[]; }
    catch { return []; }
  });
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const [gradeModal, setGradeModal] = useState<DashboardData['today_lessons'][0] | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [linkLessonId, setLinkLessonId] = useState<number | null>(null);
  const [gradeForm, setGradeForm] = useState<{
    lessonTopic: string;
    activityGrade: number;
    lessonStatus: LessonStatus;
    homeworkTopic: string;
    homeworkFile: File | null;
  }>({
    lessonTopic: '',
    activityGrade: 10,
    lessonStatus: 'conducted',
    homeworkTopic: '',
    homeworkFile: null,
  });
  const [gradeSuccess, setGradeSuccess] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [gradedIds, setGradedIds] = useState<number[]>([]);
  const [startedLessons, setStartedLessons] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('started_lessons');
      return saved ? new Set(JSON.parse(saved) as number[]) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hwFileInputRef = useRef<HTMLInputElement>(null);

  // ── Data load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teacherApi.getDashboard()
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => { if (!cancelled) setApiError(extractErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const fetchDashboard = () => teacherApi.getDashboard().then(setData).catch(() => {});

  useEffect(() => {
    if (!gradeSuccess) return;
    const t = setTimeout(() => setGradeSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [gradeSuccess]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatTime = formatUkrTime;

  const resetGradeForm = () =>
    setGradeForm({ lessonTopic: '', activityGrade: 10, lessonStatus: 'conducted', homeworkTopic: '', homeworkFile: null });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = '';
    for (const f of uploaded) {
      void (async () => {
        setUploadingMaterial(true);
        setMaterialError('');
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
          const res = await apiClient.post('/teacher/materials/', {
            file_data: base64,
            filename: f.name,
            file_size: f.size,
          });
          const d = res.data as { url: string; name: string };
          const newFile: UploadedFile = {
            id: Date.now(),
            name: f.name,
            size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
            type: f.name.split('.').pop()?.toUpperCase() ?? 'FILE',
            url: d.url || undefined,
          };
          setFiles(prev => {
            const updated = [newFile, ...prev];
            localStorage.setItem('teacher_materials', JSON.stringify(updated));
            return updated;
          });
        } catch (err) {
          setMaterialError(extractErrorMessage(err));
        } finally {
          setUploadingMaterial(false);
        }
      })();
    }
  };

  const handleStartLesson = (lesson: DashboardData['today_lessons'][0]) => {
    if (!lesson.meeting_link) {
      setLinkLessonId(lesson.lesson_id ?? null);
      setLinkModal(true);
      return;
    }
    window.open(lesson.meeting_link, '_blank', 'noopener,noreferrer');
    if (lesson.lesson_id) {
      setStartedLessons(prev => {
        const next = new Set([...prev, lesson.lesson_id!]);
        localStorage.setItem('started_lessons', JSON.stringify(Array.from(next)));
        return next;
      });
    }
  };

  // ── Grade submit ──────────────────────────────────────────────────────────────

  const handleGradeSubmit = async () => {
    if (!gradeModal?.lesson_id) return;

    // Validation — all fields required
    const validationErrors: string[] = [];

    if (!gradeForm.lessonTopic.trim()) {
      validationErrors.push('Введіть тему уроку');
    }

    if (gradeForm.lessonStatus === 'conducted') {
      if (!gradeForm.activityGrade || gradeForm.activityGrade === 0) {
        validationErrors.push('Виставте оцінку за урок (від 1 до 10)');
      }
      if (!gradeForm.homeworkTopic.trim()) {
        validationErrors.push('Введіть тему домашнього завдання');
      }
      if (!gradeForm.homeworkFile) {
        validationErrors.push('Завантажте файл домашнього завдання');
      }
    }

    if (validationErrors.length > 0) {
      setGradeError(validationErrors.join('. '));
      return;
    }

    setGrading(true);
    setGradeError('');
    const lessonId = gradeModal.lesson_id;

    try {
      if (gradeForm.lessonStatus === 'student_missed') {
        // Student absent — file complaint for manager to resolve
        await apiClient.post(`/lessons/${lessonId}/complaint/`, {
          reason: 'student_missed',
          description: 'Учень не з\'явився на урок',
        });
        setGradeModal(null);
        resetGradeForm();
        setGradeSuccess('Скаргу подано менеджеру. Очікуйте рішення.');
        void fetchDashboard();
        return;
      }

      // ── Conducted lesson ──
      // 1. Evaluate — record attendance + activity grade
      await apiClient.post(`/lessons/${lessonId}/evaluate/`, {
        is_present: true,
        activity_grade: gradeForm.activityGrade,
        lesson_topic: gradeForm.lessonTopic.trim() || undefined,
      });

      // 2. Set lesson status to conducted
      await teacherApi.setLessonStatus(lessonId, 'conducted');

      // 3. Upload homework task + optional file (converted to base64 → Dropbox)
      if (gradeForm.homeworkTopic.trim() || gradeForm.homeworkFile) {
        let fileData = '';
        let filename = '';
        if (gradeForm.homeworkFile) {
          filename = gradeForm.homeworkFile.name;
          fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(gradeForm.homeworkFile!);
          });
        }
        await apiClient.post(`/lessons/${lessonId}/homework/`, {
          teacher_homework_task: gradeForm.homeworkTopic,
          homework_file_url: fileData || undefined,
          filename: filename || undefined,
        });
      }

      setGradedIds(p => [...p, lessonId]);
      setGradeSuccess('Оцінку виставлено успішно!');
      setGradeModal(null);
      resetGradeForm();
      void fetchDashboard();
    } catch (err) {
      setGradeError(extractErrorMessage(err));
    } finally {
      setGrading(false);
    }
  };

  // ── Meeting link ──────────────────────────────────────────────────────────────

  const handleSetLink = async () => {
    if (!link) return;
    if (!linkLessonId) {
      setLinkError('Немає заброньованого уроку для цього слоту.');
      return;
    }
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      setLinkError('Посилання має починатись з https://');
      return;
    }
    setLinkError('');
    try {
      await teacherApi.setMeetingLink(linkLessonId, link);
      setLinkModal(false);
      setLink('');
      void fetchDashboard();
    } catch (err) {
      setLinkError(extractErrorMessage(err));
    }
  };

  const displayedFiles = showAllFiles ? files : files.slice(0, 3);
  // Only show lessons that are still scheduled — hide conducted / missed / cancelled
  const scheduledLessons = (data?.today_lessons ?? []).filter(
    l => !l.lesson_status || l.lesson_status === 'scheduled'
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <TeacherLayout>
      <div className="max-w-[1440px] mx-auto flex gap-8">
        <div className="flex-1 flex flex-col gap-8">

          {/* Page header */}
          <div>
            <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
              Вітаємо, {user?.firstName} {user?.lastName}! 👋
            </h1>
            <p className="font-inter text-[#565d6d] text-lg mt-2">
              Ось актуальний розклад ваших занять на сьогодні.
            </p>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-6">
            {[
              {
                label: 'Кількість учнів',
                value: data?.stats.total_students ?? '—',
                sub: 'Загалом',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                label: 'Всього уроків',
                value: scheduledLessons.length,
                sub: 'Сьогодні у графіку',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
              },
              {
                label: 'Проведено занять',
                value: data?.stats.conducted_lessons ?? '—',
                sub: 'Всього за весь час',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
              },
            ].map(s => (
              <article
                key={s.label}
                className="flex flex-col gap-3 p-6 bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_#171a1f12]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-inter font-medium text-[#565d6d] text-sm">{s.label}</p>
                  <div className="w-9 h-9 bg-[#f4f4f6] rounded-xl flex items-center justify-center">
                    {s.icon}
                  </div>
                </div>
                <p className="font-inter font-black text-slate-900 text-3xl">{s.value}</p>
                <p className="font-inter text-[#1f8cf9] text-xs font-medium">{s.sub}</p>
              </article>
            ))}
          </section>

          {/* Lessons list */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-poppins font-bold text-slate-900 text-xl">Уроки на сьогодні</h2>
                <p className="font-inter text-[#565d6d] text-sm mt-0.5">
                  {scheduledLessons.length} запланованих занять
                </p>
              </div>
              <span className="px-3 py-1.5 bg-[#1f8cf91a] rounded-xl font-inter font-bold text-[#1f8cf9] text-xs">
                {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
            ) : apiError ? (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="font-inter text-red-600 text-sm">{apiError}</p>
              </div>
            ) : scheduledLessons.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">
                {scheduledLessons.map((lesson, i) => {
                  const graded = gradedIds.includes(lesson.lesson_id ?? -1);
                  const started = lesson.lesson_id ? startedLessons.has(lesson.lesson_id) : false;
                  return (
                    <div
                      key={lesson.slot_id}
                      className={`flex flex-col px-6 py-5 ${i > 0 ? 'border-t border-[#dee1e6]' : ''}`}
                    >
                      {lesson.has_rejected_complaint && (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl mb-3">
                          <p className="font-inter text-red-600 text-xs font-medium">
                            Скаргу відхилено. Будь ласка, виставте оцінку за урок.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-6">
                      <span className="font-inter font-bold text-slate-900 text-sm w-28 flex-shrink-0">
                        {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                      </span>
                      <div className="flex-1">
                        <p className="font-inter font-bold text-slate-900 text-sm">
                          {lesson.topic ?? 'Заняття'}
                        </p>
                        <p className="font-inter text-[#565d6d] text-xs mt-0.5">
                          {lesson.student_name ?? 'Учень не призначений'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {graded ? (
                          <span className="px-4 py-2 bg-gray-100 rounded-xl font-inter font-semibold text-gray-400 text-sm">
                            Оцінено
                          </span>
                        ) : lesson.lesson_id ? (
                          <>
                            {!lesson.meeting_link ? (
                              <button
                                type="button"
                                onClick={() => { setLinkLessonId(lesson.lesson_id ?? null); setLinkModal(true); }}
                                className="px-4 py-2 border border-[#1f8cf9] text-[#1f8cf9] rounded-xl font-inter text-sm hover:bg-blue-50 transition-colors"
                              >
                                Додати посилання
                              </button>
                            ) : started ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => window.open(lesson.meeting_link!, '_blank', 'noopener,noreferrer')}
                                  className="px-4 py-2 border border-[#1f8cf9] text-[#1f8cf9] rounded-xl font-inter text-sm hover:bg-blue-50 transition-colors"
                                >
                                  Приєднатись до уроку
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGradeModal(lesson)}
                                  className="px-4 py-2 bg-[#1f8cf9] text-white rounded-xl font-inter text-sm hover:bg-blue-600 transition-colors"
                                >
                                  Поставити оцінку
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartLesson(lesson)}
                                className="px-4 py-2 bg-[#1f8cf9] rounded-xl font-inter font-semibold text-white text-sm hover:bg-blue-600 transition-colors"
                              >
                                Розпочати урок
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#dee1e6] p-10 text-center">
                <p className="font-inter text-[#9095a1] text-sm">Сьогодні занять немає</p>
              </div>
            )}
          </section>
        </div>

        {/* ── Materials sidebar ─────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-5">
          <h2 className="font-poppins font-bold text-slate-900 text-xl">Матеріали</h2>
          <div className="bg-white rounded-2xl border border-[#dee1e6] p-5 flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[#dee1e6] rounded-xl cursor-pointer hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div className="text-center">
                <p className="font-inter font-semibold text-slate-800 text-sm">Перетягніть файли сюди</p>
                <p className="font-inter text-[#9095a1] text-xs mt-0.5">або натисніть кнопку нижче</p>
              </div>
              <button type="button" className="px-4 py-2 border border-[#dee1e6] rounded-lg font-inter text-slate-700 text-sm hover:bg-gray-50">
                Вибрати файл
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
              aria-label="Завантажити файли матеріалів"
              title="Завантажити файли"
            />
            <p className="font-inter text-[#9095a1] text-[10px] text-center leading-4">
              PDF, DOCX, ZIP. Максимум 50MB.
            </p>
            {uploadingMaterial && (
              <p className="font-inter text-[#1f8cf9] text-xs text-center">Завантаження...</p>
            )}
            {materialError && (
              <p className="font-inter text-red-500 text-xs text-center">{materialError}</p>
            )}
          </div>

          {files.length > 0 && (
            <div>
              <p className="font-inter font-bold text-slate-900 text-xs tracking-[0.60px] uppercase mb-3">Нещодавні</p>
              <div className="flex flex-col gap-2">
                {displayedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#dee1e6] hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon type={file.type} />
                      <div className="min-w-0">
                        <p className="font-inter font-semibold text-slate-800 text-xs truncate max-w-[140px]">{file.name}</p>
                        <p className="font-inter text-[#9095a1] text-[10px]">{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1 opacity-0 group-hover:opacity-100">
                      {file.url && (
                        <a href={file.url} download target="_blank" rel="noopener noreferrer"
                          aria-label={`Завантажити ${file.name}`} title="Завантажити"
                          className="text-[#1f8cf9] hover:text-blue-700 transition-colors p-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setFiles(p => {
                          const updated = p.filter(f => f.id !== file.id);
                          localStorage.setItem('teacher_materials', JSON.stringify(updated));
                          return updated;
                        })}
                        aria-label={`Видалити ${file.name}`} title="Видалити"
                        className="text-[#9095a1] hover:text-[#e64c4c] transition-colors p-1"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {files.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="mt-3 font-inter font-bold text-[#1f8cf9] text-sm flex items-center gap-1 hover:underline"
                >
                  {showAllFiles ? 'Приховати' : `Переглянути всі файли (${files.length})`}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points={showAllFiles ? '18 15 12 9 6 15' : '9 18 15 12 9 6'} />
                  </svg>
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Success toast ──────────────────────────────────────────────────────── */}
      {gradeSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl font-inter font-semibold text-sm shadow-lg animate-fade-in">
          {gradeSuccess}
        </div>
      )}

      {/* ── Grade Modal ───────────────────────────────────────────────────────── */}
      {gradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setGradeModal(null); resetGradeForm(); } }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-poppins font-bold text-xl text-slate-900">Поставити оцінку</h2>
              <button
                onClick={() => { setGradeModal(null); resetGradeForm(); }}
                className="text-[#9095a1] hover:text-slate-900"
                aria-label="Закрити"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Lesson info */}
            <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
              <p className="font-inter font-bold text-slate-900 text-sm">
                {gradeModal.student_name ?? 'Учень'}
              </p>
              <p className="font-inter text-[#565d6d] text-xs mt-0.5">
                {formatTime(gradeModal.start_time)} —{' '}
                {gradeModal.topic ?? 'Заняття'}
              </p>
            </div>

            {/* 0. Тема уроку */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-bold text-slate-900 text-sm">Тема уроку</label>
              <input
                type="text"
                value={gradeForm.lessonTopic}
                onChange={e => setGradeForm(p => ({ ...p, lessonTopic: e.target.value }))}
                placeholder="Введіть тему уроку..."
                className="border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            {/* 1. Оцінка за урок */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-bold text-slate-900 text-sm">
                Оцінка за урок
              </label>
              <select
                value={gradeForm.activityGrade}
                onChange={e => setGradeForm(p => ({ ...p, activityGrade: Number(e.target.value) }))}
                disabled={gradeForm.lessonStatus !== 'conducted'}
                aria-label="Оцінка за урок"
                className="border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] disabled:bg-[#f8f9fb] disabled:text-[#9095a1]"
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '0 — не оцінювати' : `${i}/10`}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Статус уроку */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-bold text-slate-900 text-sm">
                Статус уроку
              </label>
              <select
                value={gradeForm.lessonStatus}
                onChange={e => setGradeForm(p => ({
                  ...p,
                  lessonStatus: e.target.value as LessonStatus,
                  activityGrade: e.target.value !== 'conducted' ? 0 : p.activityGrade,
                }))}
                aria-label="Статус уроку"
                className="border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              >
                {LESSON_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 3 & 4: Only shown when lesson was conducted */}
            {gradeForm.lessonStatus === 'conducted' && (
              <>
                {/* 3. Тема домашнього завдання */}
                <div className="flex flex-col gap-2">
                  <label className="font-inter font-bold text-slate-900 text-sm">
                    Тема домашнього завдання
                  </label>
                  <input
                    type="text"
                    value={gradeForm.homeworkTopic}
                    onChange={e => setGradeForm(p => ({ ...p, homeworkTopic: e.target.value }))}
                    placeholder="Введіть тему ДЗ..."
                    className="border border-[#dee1e6] rounded-xl px-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
                  />
                </div>

                {/* 4. Завантажити файл домашнього завдання */}
                <div className="flex flex-col gap-2">
                  <label className="font-inter font-bold text-slate-900 text-sm">
                    Завантажити файл домашнього завдання
                  </label>
                  <div
                    onClick={() => hwFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#dee1e6] rounded-xl p-5 text-center hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke="#9095a1" strokeWidth="1.5" className="mx-auto mb-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="font-inter text-[#565d6d] text-sm">
                      Перетягніть файл сюди або скористайтеся кнопкою
                    </p>
                    <p className="font-inter text-[#9095a1] text-xs mt-1">
                      PDF, DOCX, JPG • до 10MB
                    </p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); hwFileInputRef.current?.click(); }}
                      className="mt-3 px-4 py-1.5 border border-[#dee1e6] rounded-lg font-inter text-slate-700 text-sm hover:bg-gray-50"
                    >
                      Вибрати файл
                    </button>
                  </div>
                  <input
                    ref={hwFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    aria-label="Завантажити файл домашнього завдання"
                    onChange={e => setGradeForm(p => ({ ...p, homeworkFile: e.target.files?.[0] ?? null }))}
                  />
                  {gradeForm.homeworkFile && (
                    <div className="flex items-center gap-3 p-3 bg-[#f4f4f6] rounded-xl">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-inter text-slate-800 text-sm flex-1 truncate">
                        {gradeForm.homeworkFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGradeForm(p => ({ ...p, homeworkFile: null }))}
                        className="text-[#9095a1] hover:text-red-500 flex-shrink-0"
                        aria-label="Видалити файл"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {gradeForm.lessonStatus === 'student_missed' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <p className="font-inter text-orange-700 text-sm">
                  Скаргу буде надіслано менеджеру. Якщо менеджер підтвердить — учню автоматично поставиться 0 за урок. Якщо відхилить — вам потрібно буде виставити оцінку.
                </p>
              </div>
            )}

            {gradeError && (
              <p className="font-inter text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {gradeError}
              </p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={() => void handleGradeSubmit()}
              disabled={grading}
              className="py-3 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {gradeForm.lessonStatus === 'student_missed'
                ? (grading ? 'Відправляємо...' : 'Подати скаргу')
                : (grading ? 'Зберігаємо...' : 'Підтвердити оцінку')}
            </button>
          </div>
        </div>
      )}

      {/* ── Grade success modal ───────────────────────────────────────────────── */}
      {gradeSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setGradeSuccess('')}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">{gradeSuccess}</p>
            <button
              type="button"
              onClick={() => setGradeSuccess('')}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Link Modal ─────────────────────────────────────────────────────────── */}
      {linkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setLinkModal(false); setLinkError(''); } }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-poppins font-bold text-slate-900 text-xl">Надіслати посилання</h2>
              <button
                type="button"
                onClick={() => { setLinkModal(false); setLinkError(''); }}
                aria-label="Закрити"
                className="text-[#9095a1] hover:text-slate-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="font-inter text-[#565d6d] text-sm text-center">
              Поділіться посиланням на урок зі своєю групою.
            </p>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="#9095a1" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                type="url"
                value={link}
                onChange={e => { setLink(e.target.value); setLinkError(''); }}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                aria-label="Посилання на урок"
                className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>
            {linkError && (
              <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {linkError}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleSetLink()}
              className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors"
            >
              Відправити
            </button>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
