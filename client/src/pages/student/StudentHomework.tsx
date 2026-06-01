import { useState, useRef } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentHomework } from '../../features/student/homework';
import type { StudentHomeworkTask } from '../../features/student/homework';
import { studentApi, extractErrorMessage } from '../../services/api';

type FilterTab = 'Всі' | 'Нові';

const now = new Date();

function getFilename(url: string): string {
  const parts = url.split('/');
  const last = parts[parts.length - 1];
  return last && last.trim() !== '' ? last : 'Файл завдання';
}

export default function StudentHomework() {
  const { homeworks, loading, error, refetch } = useStudentHomework();
  const [tab, setTab] = useState<FilterTab>('Всі');
  const [selected, setSelected] = useState<StudentHomeworkTask | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState<number[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64 font-inter text-[#565d6d]">
          Завантаження...
        </div>
      </StudentLayout>
    );
  }
  if (error) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64 font-inter text-red-500">
          Помилка: {error}
        </div>
      </StudentLayout>
    );
  }

  const isExpired = (hw: StudentHomeworkTask) => hw.deadlineDate < now;
  const isDone = (hw: StudentHomeworkTask) =>
    submitted.includes(hw.id) || hw.homeworkStatus === 'submitted' || hw.homeworkStatus === 'reviewed';

  const filtered = tab === 'Нові'
    ? homeworks.filter(hw => !isExpired(hw) && !isDone(hw))
    : homeworks;

  const handleSelectCard = (hw: StudentHomeworkTask) => {
    setSelected(prev => prev?.id === hw.id ? null : hw);
    setUploadedFile(null);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSubmit = () => {
    if (!selected) return;
    if (!uploadedFile) {
      setSubmitError('Оберіть файл для відправлення');
      return;
    }
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        await studentApi.submitHomeworkUrl(selected.lessonId, base64);
        setSubmitted(p => [...p, selected.id]);
        setSubmitSuccess('Домашнє завдання відправлено!');
        void refetch();
        setTimeout(() => {
          setSelected(null);
          setUploadedFile(null);
          setSubmitSuccess('');
        }, 1800);
      } catch (err) {
        setSubmitError(extractErrorMessage(err));
      } finally {
        setSubmitLoading(false);
      }
    };
    reader.onerror = () => {
      setSubmitError('Не вдалося прочитати файл. Спробуйте інший формат.');
      setSubmitLoading(false);
    };
    reader.readAsDataURL(uploadedFile);
  };

  return (
    <StudentLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
            Домашні завдання
          </h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">
            Керуйте своїми навчальними проєктами та дедлайнами
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['Всі', 'Нові'] as FilterTab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-inter font-medium text-sm transition-colors ${
                tab === t
                  ? 'bg-[#1f8cf9] text-white'
                  : 'bg-white border border-[#dee1e6] text-[#565d6d] hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-8">

          {/* ── Grid of homework cards ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-5 flex-1">
            {filtered.length === 0 && (
              <div className="col-span-2 py-10 text-center">
                <p className="font-inter text-[#565d6d] text-sm">Домашніх завдань ще немає</p>
              </div>
            )}

            {filtered.map(hw => {
              const expired = isExpired(hw);
              const done = isDone(hw);
              const isSelected = selected?.id === hw.id;

              return (
                <article
                  key={hw.id}
                  onClick={() => !expired && !done && handleSelectCard(hw)}
                  className={[
                    'flex flex-col gap-4 p-6 bg-white rounded-2xl border transition-all',
                    isSelected ? 'border-[#1f8cf9] shadow-sm' : 'border-[#dee1e6]',
                    !expired && !done ? 'cursor-pointer hover:shadow-md' : 'opacity-60',
                  ].join(' ')}
                >
                  {/* Subject badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1f8cf91a] rounded-lg">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={expired || done ? '#9095a1' : '#1f8cf9'} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className={`font-inter font-bold text-[10px] tracking-[0.60px] ${
                        expired || done ? 'text-[#9095a1]' : 'text-[#1f8cf9]'
                      }`}>
                        {hw.subject}
                      </span>
                    </span>
                    {hw.urgent && !expired && !done && (
                      <span className="px-2.5 py-0.5 bg-red-500 rounded-full font-inter font-bold text-white text-[10px]">
                        Термінове
                      </span>
                    )}
                  </div>

                  {/* Topic */}
                  <div>
                    <h3 className="font-poppins font-bold text-slate-900 text-lg leading-6 line-clamp-2">
                      {hw.title}
                    </h3>
                  </div>

                  {/* Deadline / status */}
                  <div className="flex items-center justify-between mt-auto">
                    {done ? (
                      <span className="font-inter text-xs text-[#1a7bd9] font-semibold">✓ Здано</span>
                    ) : expired ? (
                      <span className="font-inter text-xs text-[#9095a1]">Термін здачі пройшов</span>
                    ) : (
                      <span className="flex items-center gap-1 font-inter font-medium text-xs text-red-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {hw.deadline}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Side panel (shown when homework selected) ──────────── */}
          {selected && (
            <aside className="w-[340px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24">
              <div className="p-6 flex flex-col gap-5">

                {/* Urgent badge */}
                {selected.urgent && (
                  <span className="px-3 py-1 bg-red-500 rounded-full font-inter font-bold text-white text-[10px] w-fit">
                    Термінове
                  </span>
                )}

                {/* Title + meta */}
                <div>
                  <h2 className="font-poppins font-bold text-slate-900 text-xl leading-tight">
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-inter text-[#565d6d] text-xs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {selected.subject}
                    </span>
                    <span className="flex items-center gap-1 font-inter text-[#565d6d] text-xs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {selected.deadline.replace('До ', '')}
                    </span>
                  </div>
                </div>

                {/* "Домашнє завдання" — teacher's reference file */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="font-inter font-bold text-slate-900 text-sm">
                      Домашнє завдання
                    </span>
                  </div>

                  {selected.fileUrl ? (
                    <div className="flex items-center justify-between p-3 bg-[#f8f9fb] rounded-xl border border-[#dee1e6]">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div className="min-w-0">
                          <p className="font-inter font-semibold text-slate-800 text-xs truncate">
                            {getFilename(selected.fileUrl)}
                          </p>
                          <p className="font-inter text-[#9095a1] text-[10px]">PDF • файл завдання</p>
                        </div>
                      </div>
                      <a
                        href={selected.fileUrl.replace('?dl=0', '?dl=1')}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Завантажити завдання"
                        className="text-[#1f8cf9] hover:text-blue-700 flex-shrink-0 ml-2 transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    </div>
                  ) : (
                    <p className="font-inter text-[#9095a1] text-xs italic">
                      Файл завдання не прикріплено — виконайте письмово
                    </p>
                  )}
                </div>

                {/* "Завантажити результат" */}
                <div>
                  <p className="font-inter font-bold text-slate-900 text-sm mb-3">
                    Завантажити результат
                  </p>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#dee1e6] rounded-xl cursor-pointer hover:border-[#1f8cf9] hover:bg-blue-50 transition-colors"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="#9095a1" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="font-inter text-[#565d6d] text-sm text-center">
                      Натисніть або перетягніть файл
                    </span>
                    <span className="font-inter text-[#9095a1] text-xs">
                      PDF, DOCX, JPG до 10MB
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    aria-label="Завантажити домашнє завдання"
                    onChange={e => {
                      setUploadedFile(e.target.files?.[0] ?? null);
                      setSubmitError('');
                      setSubmitSuccess('');
                    }}
                  />

                  {/* Selected filename */}
                  {uploadedFile && (
                    <div className="flex items-center justify-between mt-2 px-3 py-2 bg-[#f8f9fb] rounded-lg border border-[#dee1e6]">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="#1f8cf9" strokeWidth="2" className="flex-shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="font-inter text-slate-700 text-xs truncate">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                        className="font-inter text-red-500 text-xs hover:underline flex-shrink-0 ml-2"
                      >
                        Видалити
                      </button>
                    </div>
                  )}
                </div>

                {/* Status messages */}
                {submitSuccess && (
                  <p className="font-inter text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    {submitSuccess}
                  </p>
                )}
                {submitError && (
                  <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {submitError}
                  </p>
                )}

                {/* Submit button */}
                <button
                  type="button"
                  disabled={submitLoading || !uploadedFile}
                  onClick={handleSubmit}
                  className="flex items-center justify-center gap-2 py-3.5 w-full bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {submitLoading ? 'Відправлення...' : 'Відправити на оцінення'}
                </button>

                <p className="font-inter text-[10px] text-[#9095a1] text-center italic">
                  Натискаючи кнопку, ви підтверджуєте самостійне виконання роботи
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
