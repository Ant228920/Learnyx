import { useState } from 'react';
import { useManagerLearningRequests, useManagerMatching } from '../../features/manager/matching';
import ManagerLayout from './ManagerLayout';
import { apiClient, extractErrorMessage } from '../../services/api';
import type { LearningRequestItem } from '../../services/api';

interface Slot {
  id: number;
  day: string;
  from: string;
  to: string;
}

interface Teacher {
  id: number;
  name: string;
  discipline: string;
  level: string;
  avatarBg: string;
}

const SUBJECTS = ['Англійська мова', 'Математика', 'Українська мова', 'Історія України', 'Інформатика'];
const SUBJECT_LABELS: Record<string, string> = {
  english: 'Англійська мова', math: 'Математика', ukrainian: 'Українська мова',
  history: 'Історія України', informatics: 'Інформатика',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує', matched: 'Підібрано', cancelled: 'Скасовано',
};
const LEVELS_ENGLISH = ['A1-B1 рівень', 'B2-C2 рівень'];
const LEVELS_OTHER = ['1-4 клас', '5-11 клас'];
const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];
function getLevels(subject: string): string[] {
  if (subject === 'Англійська мова') return LEVELS_ENGLISH;
  if (!subject) return [...LEVELS_ENGLISH, ...LEVELS_OTHER];
  return LEVELS_OTHER;
}

// ── Kyiv timezone helpers ─────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  'Понеділок': 1, 'Вівторок': 2, 'Середа': 3,
  'Четвер': 4, "П'ятниця": 5, 'Субота': 6, 'Неділя': 0,
};

// Slots are stored with naive ISO times that Django treats as UTC.
// UTC value = wall-clock value. Use UTC methods directly — no timezone conversion needed.
function getKyivComponents(isoString: string): { dayOfWeek: number; hours: number; minutes: number } {
  const d = new Date(isoString);
  return { dayOfWeek: d.getUTCDay(), hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
}

function getTeacherSubject(t: Record<string, unknown>): string {
  return String(
    t.discipline_name ?? t.discipline ?? t.subject ?? t.subject_name ?? ''
  ).toLowerCase().trim();
}

function getTeacherLevel(t: Record<string, unknown>): string {
  return String(t.level_name ?? t.level ?? '').toLowerCase().trim();
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8cf9" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ManagerMatching() {
  const { students: rawStudents, loading, error } = useManagerMatching();
  const { requests, loading: reqLoading, updateStatus } = useManagerLearningRequests();

  const studentOptions = rawStudents.map(s => `${s.first_name} ${s.last_name}`.trim() || s.email);

  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searched, setSearched] = useState(false);
  const [successTeacher, setSuccessTeacher] = useState<string | null>(null);
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LearningRequestItem | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [filterErrors, setFilterErrors] = useState<string[]>([]);


  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setLevel('');
  };

  const addSlot = () => {
    setFilterErrors([]);
    setSlots((prev) => [...prev, { id: Date.now(), day: DAYS[0], from: '14:00', to: '15:00' }]);
  };

  const removeSlot = (id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: number, field: keyof Slot, value: string) => {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSlotFromChange = (id: number, fromTime: string) => {
    const [h, m] = fromTime.split(':').map(Number);
    const toH = (h + 1) % 24;
    const toTime = `${String(toH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setSlots(prev => prev.map(s => s.id === id ? { ...s, from: fromTime, to: toTime } : s));
  };

  const handleSearch = async () => {
    const errors: string[] = [];
    if (!student) errors.push('Оберіть учня');
    if (!subject) errors.push('Оберіть предмет');
    if (!level) errors.push('Оберіть рівень');
    if (slots.length === 0) errors.push('Додайте хоча б один вільний слот учня з днем та часом');
    if (errors.length > 0) { setFilterErrors(errors); return; }

    setFilterErrors([]);
    setSearching(true);
    setAssignError('');
    setTeachers([]);

    try {
      const res = await apiClient.get('/teachers/');
      const data = res.data as { results?: unknown[] } | unknown[];
      const raw = (Array.isArray(data) ? data : ((data as { results?: unknown[] }).results ?? [])) as Array<Record<string, unknown>>;

      // Soft subject filter — if teacher has no discipline, include them anyway
      const reqSubject = subject.toLowerCase().trim();
      const subjectFiltered = raw.filter(t => {
        const disc = getTeacherSubject(t);
        if (!disc) return true; // no discipline set — include
        return disc.includes(reqSubject) || reqSubject.includes(disc) || disc === reqSubject;
      });

      // Soft level filter — if teacher has no level, include them anyway
      const reqLevel = level.toLowerCase().trim();
      const levelFiltered = subjectFiltered.filter(t => {
        const lvl = getTeacherLevel(t);
        if (!lvl) return true; // no level set — include
        return lvl.includes(reqLevel) || reqLevel.includes(lvl) || lvl === reqLevel;
      });

      // Optional slot-time filter — only applied when student slots are provided
      let finalSource = levelFiltered;
      if (slots.length > 0) {
        const slotsRes = await apiClient.get('/slots/', { params: { status: 'available' } });
        const allSlots = (Array.isArray(slotsRes.data) ? slotsRes.data : []) as Array<Record<string, unknown>>;

        console.log('[Matching] raw slots count:', allSlots.length);
        if (allSlots.length > 0) {
          console.log('[Matching] first slot:', JSON.stringify(allSlots[0]));
        }

        const slotsByTeacher: Record<number, Array<{ start_time: string }>> = {};
        for (const s of allSlots) {
          let tid: number | undefined;
          if (typeof s.teacher === 'object' && s.teacher !== null) {
            const obj = s.teacher as Record<string, unknown>;
            tid = Number(obj.user_id ?? obj.id) || undefined;
          } else if (s.teacher_id != null) {
            tid = Number(s.teacher_id);
          } else if (s.teacher != null) {
            tid = Number(s.teacher);
          }
          if (tid != null) {
            if (!slotsByTeacher[tid]) slotsByTeacher[tid] = [];
            slotsByTeacher[tid].push({ start_time: s.start_time as string });
          }
        }

        console.log('[Matching] slotsByTeacher keys:', Object.keys(slotsByTeacher));
        console.log('[Matching] levelFiltered teacher IDs:', levelFiltered.map(t => t.user_id));

        const withSlots = levelFiltered.filter(t => {
          const tid = Number(t.user_id ?? t.id);
          const teacherSlots = slotsByTeacher[tid] ?? [];
          if (teacherSlots.length === 0) return false;
          return slots.every(reqSlot => {
            if (!reqSlot.day || !reqSlot.from) return true;
            const reqDayNum = DAY_MAP[reqSlot.day];
            if (reqDayNum === undefined) return true;
            const [fromH, fromM] = reqSlot.from.split(':').map(Number);
            const reqFromMin = fromH * 60 + fromM;
            const reqToMin = reqSlot.to
              ? (() => { const [h, m] = reqSlot.to.split(':').map(Number); return h * 60 + m; })()
              : reqFromMin + 60;
            return teacherSlots.some(ts => {
              const k = getKyivComponents(ts.start_time);
              return k.dayOfWeek === reqDayNum && (k.hours * 60 + k.minutes) >= reqFromMin && (k.hours * 60 + k.minutes) < reqToMin;
            });
          });
        });
        // Show only teachers with a matching available slot at the requested time
        finalSource = withSlots;
      }

      const cards: Teacher[] = finalSource.map((t, i) => ({
        id: t.user_id as number,
        name: `${String(t.first_name ?? '')} ${String(t.last_name ?? '')}`.trim() || String(t.email ?? ''),
        discipline: getTeacherSubject(t) || subject,
        level: getTeacherLevel(t) || level,
        avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));

      setTeachers(cards);
      setSearched(true);
      if (cards.length === 0) {
        setFilterErrors([`Викладачів з предмету "${subject}" не знайдено.`]);
      }
    } catch (err) {
      setFilterErrors([extractErrorMessage(err)]);
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (teacher: Teacher) => {
    setAssignError('');
    setAssignLoading(true);

    const selectedStudentObj = rawStudents.find(s =>
      `${s.first_name} ${s.last_name}`.trim() === student || s.email === student
    );

    if (!selectedStudentObj) {
      setAssignError('Оберіть учня для призначення.');
      setAssignLoading(false);
      return;
    }

    try {
      // 1. Get student's active package
      const pkgRes = await apiClient.get('/packages/?status=active');
      const pkgRaw = pkgRes.data as { results?: unknown[] } | unknown[];
      const pkgList = (Array.isArray(pkgRaw) ? pkgRaw : (pkgRaw as { results?: unknown[] }).results ?? []) as Array<{ id: number; student: number }>;
      const studentPackage = pkgList.find(p => p.student === selectedStudentObj.id);

      if (!studentPackage) {
        setAssignError(`Учень ${student} не має активного абонементу. Спершу учень повинен придбати абонемент.`);
        setAssignLoading(false);
        return;
      }

      // 2. Get available slots for this teacher
      const slotsRes = await apiClient.get(`/slots/available/?teacher_id=${teacher.id}`);
      const slotsData = (Array.isArray(slotsRes.data) ? slotsRes.data : []) as Array<{ id: number; start_time: string }>;

      if (slotsData.length === 0) {
        setAssignError(`Викладач ${teacher.name} не має вільних слотів. Попросіть викладача додати слоти в розкладі.`);
        setAssignLoading(false);
        return;
      }

      // 3. Determine filter criteria from selected request or student slots
      const reqDays = selectedRequest?.preferred_days
        ? selectedRequest.preferred_days.split(', ').filter(Boolean)
        : slots.map(s => s.day);
      const reqTimeFrom = selectedRequest?.preferred_time?.split('-')[0] ?? slots[0]?.from ?? '08:00';
      const reqTimeTo = selectedRequest?.preferred_time?.split('-')[1] ?? slots[slots.length - 1]?.to ?? '21:00';

      // 4. Filter slots by days + time range; fall back to first slot if none match
      let slotsToBook = slotsData.filter(ts => {
        const dayName = new Date(ts.start_time).toLocaleDateString('uk-UA', { weekday: 'long' });
        const slotTime = ts.start_time.slice(11, 16);
        const dayOk = reqDays.length === 0 || reqDays.some((d: string) => dayName.toLowerCase().includes(d.toLowerCase()));
        const timeOk = slotTime >= reqTimeFrom && slotTime < reqTimeTo;
        return dayOk && timeOk;
      });
      if (slotsToBook.length === 0) slotsToBook = [slotsData[0]];

      // 5. Book the first matching slot — the backend fills the rest of the
      // package's balance from the teacher's other available slots in the same call.
      let lessonsCount = 0;
      for (const slotToBook of slotsToBook) {
        try {
          const res = await apiClient.post('/lessons/assign/', {
            slot: slotToBook.id,
            student: selectedStudentObj.id,
            package: studentPackage.id,
            student_slots: slots.map(s => ({ day: s.day, from: s.from })),
          });
          const data = res.data as { lessons_count?: number };
          lessonsCount = data.lessons_count ?? 1;
          break;
        } catch {
          // Skip — slot already booked or student conflict at this time, try the next one
        }
      }

      if (lessonsCount === 0) {
        setAssignError('Не вдалося призначити жодного заняття. Всі підходящі слоти вже зайняті або конфліктують.');
        setAssignLoading(false);
        return;
      }

      setSuccessCount(lessonsCount);
      setSuccessTeacher(teacher.name);
      setTeachers([]);
      setSearched(false);
      setSlots([]);
      setStudent('');
      setSubject('');
      setLevel('');
    } catch (err) {
      setAssignError(extractErrorMessage(err));
    } finally {
      setAssignLoading(false);
    }
  };

  const selectClass = 'border border-[#dee1e6] rounded-xl px-3 py-2.5 font-inter text-sm text-slate-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-full';

  if (loading) return <div className="flex items-center justify-center h-screen font-inter text-[#565d6d]">Завантаження...</div>;
  if (error) return <div className="flex items-center justify-center h-screen font-inter text-red-500">Помилка: {error}</div>;

  return (
    <ManagerLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">

        <div>
          <h1 className="font-poppins font-bold text-slate-900 text-4xl leading-10">Підбір викладача</h1>
          <p className="font-inter text-[#565d6d] text-lg leading-7 mt-2">
            Налаштуйте параметри запиту та знайдіть ідеального викладача для студента.
          </p>
        </div>

        {/* Learning requests from students */}
        {!reqLoading && requests.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-poppins font-bold text-slate-900 text-xl">Запити від студентів</h2>
            <div className="flex flex-col gap-3">
              {requests.map((req) => (
                <div key={req.id}
                  className={`flex items-center gap-4 p-4 bg-white rounded-2xl border cursor-pointer transition-colors ${
                    selectedRequest?.id === req.id ? 'border-[#1f8cf9] bg-blue-50/50' : 'border-[#dee1e6] hover:border-[#1f8cf9]/50'
                  }`}
                  onClick={() => {
                    if (selectedRequest?.id === req.id) {
                      setSelectedRequest(null);
                    } else {
                      setSelectedRequest(req);
                    }
                  }}
                >
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="font-inter font-bold text-slate-900 text-sm">{req.student_name || req.student_email}</span>
                    <span className="font-inter text-[#565d6d] text-xs">
                      {SUBJECT_LABELS[req.subject] ?? req.subject} • {req.level}
                      {req.preferred_days ? ` • ${req.preferred_days}` : ''}
                      {req.preferred_time ? ` • ${req.preferred_time}` : ''}
                    </span>
                    {req.notes && <span className="font-inter text-[#9095a1] text-xs mt-0.5">{req.notes}</span>}
                  </div>
                  <span className={`text-xs font-inter font-bold px-2.5 py-1 rounded-full ${
                    req.status === 'matched' ? 'bg-green-100 text-green-700' :
                    req.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button type="button"
                        onClick={() => void updateStatus(req.id, 'matched')}
                        className="px-3 py-1.5 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-xs hover:bg-blue-600 transition-colors">
                        Підібрано
                      </button>
                      <button type="button"
                        onClick={() => void updateStatus(req.id, 'cancelled')}
                        className="px-3 py-1.5 border border-[#dee1e6] rounded-xl font-inter font-medium text-[#565d6d] text-xs hover:bg-gray-50 transition-colors">
                        Скасувати
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-8">
          {/* Left: form */}
          <div className="flex flex-col gap-6 w-[380px] flex-shrink-0">

            {searched && (
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase self-end">
                ЗНАЙДЕНО: {teachers.length} ВИКЛАДАЧІВ
              </p>
            )}

            {/* Main params */}
            <div className="flex flex-col gap-5 p-6 bg-white rounded-2xl border border-[#dee1e6]">
              <div>
                <p className="font-poppins font-bold text-slate-900 text-xl leading-7">Основні параметри</p>
                <p className="font-inter text-[#565d6d] text-sm mt-1">Виберіть учня та предмет для навчання</p>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="match-student" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Учень</label>
                <div className="relative">
                  <select id="match-student" value={student} onChange={(e) => setStudent(e.target.value)} aria-label="Вибір учня" className={selectClass}>
                    <option value="">— Оберіть учня —</option>
                    {studentOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="match-subject" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Предмет</label>
                  <div className="relative">
                    <select id="match-subject" value={subject} onChange={(e) => handleSubjectChange(e.target.value)} aria-label="Вибір предмету" className={selectClass}>
                      <option value="">— Оберіть предмет —</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="match-level" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Рівень</label>
                  <div className="relative">
                    <select id="match-level" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Вибір рівня" className={selectClass}>
                      <option value="">— Оберіть рівень —</option>
                      {getLevels(subject).map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>

            </div>

            {/* Slots */}
            <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dee1e6]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-poppins font-bold text-slate-900 text-xl leading-7">Вільні слоти учня</p>
                  <p className="font-inter text-[#565d6d] text-sm mt-0.5">Додайте доступні часові інтервали</p>
                </div>
                <button type="button" onClick={addSlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#1f8cf9] font-inter font-bold text-[#1f8cf9] text-xs hover:bg-blue-50 transition-colors">
                  <IconPlus />
                  Додати слот
                </button>
              </div>

              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => removeSlot(slot.id)} aria-label="Видалити слот" className="text-[#565d6d] hover:text-red-500 transition-colors flex-shrink-0">
                    <IconX />
                  </button>
                  <div className="relative flex-1">
                    <select value={slot.day} onChange={(e) => updateSlot(slot.id, 'day', e.target.value)}
                      aria-label="День тижня"
                      className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-full pr-7">
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                  <input type="time" value={slot.from} onChange={(e) => handleSlotFromChange(slot.id, e.target.value)}
                    aria-label="Час початку"
                    className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-24" />
                  <input type="time" value={slot.to} readOnly
                    aria-label="Час завершення (авто)"
                    className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-[#f8f9fb] w-24 cursor-default" />
                </div>
              ))}

              {filterErrors.length > 0 && (
                <div className="flex flex-col gap-1 p-3 bg-red-50 border border-red-200 rounded-xl">
                  {filterErrors.map((e, i) => (
                    <p key={i} className="font-inter text-red-600 text-xs">{e}</p>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => void handleSearch()} disabled={searching}
                className="flex items-center justify-center gap-2 py-3 w-full bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors mt-2 disabled:opacity-50">
                {searching ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Пошук...
                  </>
                ) : (
                  <><IconSearch />Знайти викладачів</>
                )}
              </button>
            </div>
          </div>

          {/* Right: results */}
          {searched && (
            <div className="flex flex-col gap-4 flex-1 animate-fade-in">
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">
                ЗНАЙДЕНО: {teachers.length} ВИКЛАДАЧІВ
              </p>

              {assignError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="font-inter text-red-600 text-sm">{assignError}</p>
                </div>
              )}

              {teachers.length === 0 && (
                <p className="font-inter text-[#9095a1] text-sm">Викладачів не знайдено</p>
              )}

              {teachers.map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#dee1e6]">
                  <div className={`w-12 h-12 rounded-full ${t.avatarBg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <span className="font-inter font-bold text-[#1f8cf9] text-lg">{t.name[0]}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="font-poppins font-bold text-slate-900 text-base">{t.name}</span>
                    <span className="font-inter text-[#565d6d] text-xs">
                      {t.discipline || 'Предмет не вказано'}{t.level ? ` • ${t.level}` : ''}
                    </span>
                  </div>
                  <button type="button"
                    onClick={() => void handleAssign(t)}
                    disabled={assignLoading}
                    aria-label={`Призначити викладача ${t.name}`}
                    className="px-5 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
                    {assignLoading ? 'Призначення...' : 'Призначити'}
                  </button>
                </div>
              ))}

              {teachers.length > 0 && (
                <button type="button" className="font-inter font-bold text-[#1f8cf9] text-sm text-center hover:underline mt-2">
                  Показати більше результатів
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign error modal */}
      {assignError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAssignError('')} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col gap-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <h2 className="font-poppins font-bold text-slate-900 text-lg">Неможливо призначити</h2>
            </div>
            <p className="font-inter text-[#565d6d] text-sm">{assignError}</p>
            <button type="button" onClick={() => setAssignError('')}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">
              Зрозуміло
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSuccessTeacher(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-poppins font-bold text-xl text-slate-900 text-center">Готово!</h2>
            <p className="font-inter text-sm text-[#565d6d] text-center">
              Призначено <strong>{successCount}</strong> занять з викладачем <strong>{successTeacher}</strong>.
            </p>
            <button onClick={() => setSuccessTeacher(null)}
              className="w-full py-3 rounded-xl bg-[#1f8cf9] text-white font-inter font-medium text-sm hover:bg-blue-600 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
