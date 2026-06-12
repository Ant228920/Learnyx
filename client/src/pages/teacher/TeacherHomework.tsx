import { useState, useEffect, useCallback } from 'react';
import TeacherLayout from './TeacherLayout';
import { apiClient, teacherApi, extractErrorMessage } from '../../services/api';
import type { JournalRecord } from '../../services/api';
import { showError, showSuccess } from '../../utils/toast';
import { formatDeadline } from '../../utils/date';

// ── Types ──────────────────────────────────────────────────────────────────────

type HWStatus = 'НЕ ПЕРЕВІРЕНО' | 'ПЕРЕВІРЕНО';

interface HomeworkRow {
  lessonId: number;
  journalId: number;
  student: string;
  studentId: number;
  topic: string;
  subject: string;
  deadline: string;         // lesson date (formatted)
  nextLessonDate: string;   // next lesson date (formatted) — homework deadline
  status: HWStatus;
  homeworkGrade: number | null;
  teacherNotes: string | null;
  fileUrl: string | null;       // homework_answer_url — student's submitted file/URL
  homeworkStatus: string;       // 'assigned' | 'submitted' | 'reviewed'
  avatarBg: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]', 'bg-[#fff3e0]'];

function getAvatarBg(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TeacherHomework() {
  const [rows, setRows] = useState<HomeworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HomeworkRow | null>(null);
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [notDoneLoading, setNotDoneLoading] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lessons = await teacherApi.getLessons({ status: 'conducted' });

      const journals = await Promise.all(
        lessons.map(lesson =>
          apiClient
            .get<{ results?: JournalRecord[] } | JournalRecord[]>(
              `/journal/?lesson_id=${lesson.id}`
            )
            .then(res => {
              const d = res.data;
              if (Array.isArray(d)) return d as JournalRecord[];
              return (d as { results?: JournalRecord[] }).results ?? [];
            })
            .catch(() => [] as JournalRecord[])
        )
      );

      const result: HomeworkRow[] = [];

      lessons.forEach((lesson, i) => {
        const j = journals[i]?.[0];
        if (!j) return;
        const task =
          typeof j.teacher_homework_task === 'string'
            ? j.teacher_homework_task
            : '';
        if (!task) return;

        result.push({
          lessonId: lesson.id,
          journalId: j.id,
          student: lesson.student_name ?? `Студент #${lesson.student}`,
          studentId: lesson.student,
          topic: task,
          subject: j.subject_name ?? '—',
          deadline: formatDate(j.start_time),
          nextLessonDate: formatDeadline(j.next_lesson_date),
          status: j.homework_grade != null ? 'ПЕРЕВІРЕНО' : 'НЕ ПЕРЕВІРЕНО',
          homeworkGrade: j.homework_grade,
          teacherNotes: j.teacher_notes,
          fileUrl: j.homework_answer_url,
          homeworkStatus: j.homework_status ?? 'assigned',
          avatarBg: getAvatarBg(lesson.student),
        });
      });

      setRows(result);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Interaction ────────────────────────────────────────────────────────────

  const filtered = rows.filter(r =>
    r.student.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (row: HomeworkRow) => {
    if (selected?.lessonId === row.lessonId) {
      setSelected(null);
      return;
    }
    setSelected(row);
    setComment(row.teacherNotes ?? '');
    setGrade(row.homeworkGrade != null ? String(row.homeworkGrade) : '');
  };

  // ── Save grade ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selected) return;
    const gradeNum = Number(grade);
    if (!grade || isNaN(gradeNum) || gradeNum < 1 || gradeNum > 10) {
      showError('Введіть оцінку від 1 до 10');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/lessons/${selected.lessonId}/evaluate/`, {
        is_present: true,
        homework_grade: gradeNum,
        teacher_notes: comment,
      });
      setRows(prev =>
        prev.map(r =>
          r.lessonId === selected.lessonId
            ? { ...r, status: 'ПЕРЕВІРЕНО' as HWStatus, homeworkGrade: gradeNum, teacherNotes: comment }
            : r
        )
      );
      setSelected(null);
      setComment('');
      setGrade('');
      showSuccess('Оцінку збережено!');
    } catch (e) {
      showError('Помилка: ' + extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Mark "not done" ───────────────────────────────────────────────────────

  const handleMarkNotDone = async () => {
    if (!selected) return;
    setNotDoneLoading(true);
    try {
      await apiClient.post(`/lessons/${selected.lessonId}/evaluate/`, {
        is_present: true,
        homework_grade: 0,
        teacher_notes: 'Домашнє завдання не виконано вчасно',
      });
      setRows(prev =>
        prev.map(r =>
          r.lessonId === selected.lessonId
            ? {
                ...r,
                status: 'ПЕРЕВІРЕНО' as HWStatus,
                homeworkGrade: 0,
                teacherNotes: 'Домашнє завдання не виконано вчасно',
              }
            : r
        )
      );
      setSelected(null);
      setComment('');
      setGrade('');
      showSuccess('Позначено як "Не виконано"');
    } catch (e) {
      showError('Помилка: ' + extractErrorMessage(e));
    } finally {
      setNotDoneLoading(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64 font-inter text-[#565d6d]">
          Завантаження...
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64 font-inter text-red-500">
          Помилка: {error}
        </div>
      </TeacherLayout>
    );
  }

  const isChecked = selected?.status === 'ПЕРЕВІРЕНО';
  // Student has submitted if homeworkStatus === 'submitted' OR homework_answer_url is set
  const studentSubmitted =
    selected != null &&
    (selected.homeworkStatus === 'submitted' || selected.homeworkStatus === 'reviewed' || selected.fileUrl !== null);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TeacherLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">
            Домашні завдання
          </h1>
          <p className="font-inter text-[#565d6d] text-lg mt-2">
            Керуйте навчальним процесом: перевіряйте роботи та виставляйте оцінки в реальному часі.
          </p>
        </div>

        {/* Main layout */}
        <div className="flex items-start gap-6">

          {/* ── LEFT: homework list ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="#9095a1" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Пошук за учнем..."
                className="w-full border border-[#dee1e6] rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9]"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#dee1e6] overflow-hidden">

              {/* Column headers */}
              <div className="grid grid-cols-[2fr_2.5fr_1fr_1fr] px-6 py-4 border-b border-[#dee1e6]">
                {['УЧЕНЬ', 'ТЕМА', 'ТЕРМІН', 'СТАТУС'].map(h => (
                  <span key={h} className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px]">
                    {h}
                  </span>
                ))}
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="font-inter text-[#565d6d] text-sm">
                    {rows.length === 0
                      ? 'Домашніх завдань ще немає'
                      : 'Нічого не знайдено за вашим запитом'}
                  </p>
                </div>
              )}

              {/* Rows */}
              {filtered.map((row, i) => {
                const isRowSelected = selected?.lessonId === row.lessonId;
                return (
                  <div
                    key={row.lessonId}
                    onClick={() => handleSelect(row)}
                    className={[
                      'grid grid-cols-[2fr_2.5fr_1fr_1fr] items-center px-6 py-4 cursor-pointer transition-colors',
                      i < filtered.length - 1 ? 'border-b border-[#dee1e6]' : '',
                      isRowSelected
                        ? 'bg-[#f0f7ff] border-l-4 border-l-[#1f8cf9]'
                        : 'hover:bg-[#f8f9fb]',
                    ].join(' ')}
                  >
                    {/* Student */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${row.avatarBg} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="font-inter font-bold text-[#1f8cf9] text-sm">
                          {row.student[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="font-inter font-bold text-slate-900 text-sm">
                        {row.student}
                      </span>
                    </div>

                    {/* Topic */}
                    <div className="pr-2">
                      <p className="font-inter font-medium text-slate-800 text-sm line-clamp-1">
                        {row.topic}
                      </p>
                      <p className="font-inter text-[#1f8cf9] text-xs mt-0.5">{row.subject}</p>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="font-inter text-[#565d6d] text-xs whitespace-nowrap">
                        {row.nextLessonDate !== 'Не визначено' ? row.nextLessonDate : row.deadline}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span
                      className={[
                        'inline-flex items-center px-2.5 py-1 rounded-full font-inter font-bold text-[10px] w-fit',
                        row.status === 'ПЕРЕВІРЕНО'
                          ? 'bg-[#e0faea] text-[#1a7bd9]'
                          : 'bg-orange-100 text-orange-600',
                      ].join(' ')}
                    >
                      {row.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: detail panel ─────────────────────────────────────── */}
          {selected && (
            <aside className="w-[340px] flex-shrink-0 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden sticky top-24">

              {/* Panel header */}
              <div className="flex items-center gap-3 p-5 border-b border-[#dee1e6]">
                <div className={`w-10 h-10 rounded-full ${selected.avatarBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="font-inter font-bold text-[#1f8cf9] text-sm">{selected.student[0]?.toUpperCase() ?? '?'}</span>
                </div>
                <p className="font-poppins font-bold text-slate-900 text-sm truncate flex-1">{selected.student}</p>
              </div>

              <div className="p-5 flex flex-col gap-4">

                {/* ТЕМА ДОМАШНЬОГО ЗАВДАННЯ */}
                <div>
                  <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1.5">Тема домашнього завдання</p>
                  <p className="font-inter font-medium text-slate-800 text-sm leading-relaxed">{selected.topic}</p>
                </div>

                {/* ТЕРМІН ЗДАЧІ */}
                <div>
                  <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1.5">Термін здачі</p>
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="font-inter text-slate-800 text-sm">До {selected.nextLessonDate !== 'Не визначено' ? selected.nextLessonDate : selected.deadline}</span>
                  </div>
                </div>

                {/* ФАЙЛ УЧНЯ */}
                <div>
                  <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1.5">Файл учня</p>
                  {studentSubmitted && selected.fileUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        const raw = selected.fileUrl!;
                        const viewUrl = raw
                          .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                          .replace('?dl=0', '').replace('?dl=1', '');
                        window.open(viewUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-3 p-3 bg-[#f4f4f6] rounded-2xl hover:bg-blue-50 transition-colors w-full text-left"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" className="flex-shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-inter text-[#1f8cf9] text-sm font-medium flex-1 truncate">
                        {selected.student ? `Домашнє завдання — ${selected.student}` : 'Домашнє завдання учня'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" className="flex-shrink-0">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  ) : (
                    <p className="font-inter text-red-500 text-xs italic">Учень не виконав вчасно</p>
                  )}
                </div>

                {/* ОЦІНКА + ЗБЕРЕГТИ */}
                {isChecked ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1.5">Оцінка</p>
                      <div className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 bg-[#f8f9fb]">
                        <span className="font-inter font-black text-[#1f8cf9] text-lg">{selected.homeworkGrade ?? '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-[#e0faea] rounded-xl">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a7bd9" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="font-inter font-medium text-[#1a7bd9] text-sm">Робота вже перевірена</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {!studentSubmitted && (
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="font-inter text-orange-700 text-xs font-medium">
                          Домашнє завдання не виконано вчасно. Оцінка 0 буде виставлена автоматично.
                        </p>
                      </div>
                    )}
                    <div>
                      <label htmlFor="teacher-grade" className="font-inter font-bold text-[#565d6d] text-[10px] tracking-[0.60px] uppercase mb-1.5 block">Оцінка</label>
                      <input
                        id="teacher-grade"
                        type="number"
                        min={0}
                        max={10}
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        placeholder={studentSubmitted ? 'Наприклад: 8' : '0'}
                        disabled={!studentSubmitted}
                        className="w-full border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] disabled:bg-[#f8f9fb] disabled:text-[#9095a1]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => studentSubmitted ? void handleSave() : void handleMarkNotDone()}
                      disabled={saving || notDoneLoading}
                      className="w-full py-3.5 bg-[#1f8cf9] rounded-2xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-60"
                    >
                      {saving || notDoneLoading ? 'Збереження...' : 'Зберегти'}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
