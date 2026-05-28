import { useState, useEffect } from 'react';
import { useManagerMatching, useManagerLearningRequests } from '../../features/manager/matching';
import ManagerLayout from './ManagerLayout';
<<<<<<< HEAD
import { apiClient, extractErrorMessage } from '../../services/api';
import type { LearningRequestItem } from '../../services/api';
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

interface Slot {
  id: number;
  day: string;
  from: string;
  to: string;
}

interface Teacher {
  id: number;
  name: string;
  experience: string;
  level: string;
  subjects: string[];
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
const LEVELS_ENGLISH = ['A1 - Початковий', 'A2 - Елементарний', 'B1 - Середній', 'B2 - Вище середнього', 'C1 - Просунутий', 'C2 - Досконалий'];
const LEVELS_OTHER = ['1 - 4 клас', '5 - 11 клас'];
const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
const AVATAR_COLORS = ['bg-[#e7eff9]', 'bg-[#dafdf8]', 'bg-[#ebe3ff]'];
<<<<<<< HEAD
const MANAGER_TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const total = 8 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

function getLevels(subject: string): string[] {
  return subject === 'Англійська мова' ? LEVELS_ENGLISH : LEVELS_OTHER;
}

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
  const { students: rawStudents, teachers: rawTeachers, loading, error } = useManagerMatching();
  const { requests, loading: reqLoading, updateStatus } = useManagerLearningRequests();

  const studentOptions = rawStudents.map(s => `${s.first_name} ${s.last_name}`.trim() || s.email);
  const allTeacherCards: Teacher[] = rawTeachers.map((t, i) => ({
    id: t.id,
    name: `${t.first_name} ${t.last_name}`.trim() || t.email,
    experience: '—',
    level: '—',
    subjects: [],
    avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [level, setLevel] = useState(getLevels(SUBJECTS[0])[2]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searched, setSearched] = useState(false);
  const [successTeacher, setSuccessTeacher] = useState<string | null>(null);
<<<<<<< HEAD
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LearningRequestItem | null>(null);
  const [managerDays, setManagerDays] = useState<string[]>([]);
  const [managerTimeFrom, setManagerTimeFrom] = useState('08:00');
  const [managerTimeTo, setManagerTimeTo] = useState('12:00');
  const [successCount, setSuccessCount] = useState(0);
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

  useEffect(() => {
    if (!student && rawStudents.length > 0) {
      const first = rawStudents[0];
      setStudent(`${first.first_name} ${first.last_name}`.trim() || first.email);
    }
  }, [student, rawStudents]);

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setLevel(getLevels(newSubject)[0]);
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { id: Date.now(), day: DAYS[0], from: '14:00', to: '16:00' }]);
  };

  const removeSlot = (id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: number, field: keyof Slot, value: string) => {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

<<<<<<< HEAD
  const handleSearch = async () => {
    setSearching(true);
    setAssignError('');
    const searchSubject = selectedRequest ? selectedRequest.subject : subject;
    const searchLevel = selectedRequest ? selectedRequest.level : level;
    const searchDays = selectedRequest?.preferred_days
      ? selectedRequest.preferred_days.split(', ').filter(Boolean)
      : managerDays;
    const searchTimeFrom = selectedRequest?.preferred_time?.split('-')[0] ?? managerTimeFrom;
    const searchTimeTo = selectedRequest?.preferred_time?.split('-')[1] ?? managerTimeTo;
    try {
      const [teachersRes, slotsRes] = await Promise.all([
        apiClient.get('/teachers/'),
        apiClient.get('/slots/available/'),
      ]);
      const raw = (Array.isArray(teachersRes.data) ? teachersRes.data : []) as Array<{
        user_id: number; email: string; first_name: string; last_name: string;
        discipline?: string | null; level?: string | null;
      }>;

      let filtered = raw;

      if (searchSubject) {
        const subLower = searchSubject.toLowerCase();
        filtered = filtered.filter(t => {
          const disc = (t.discipline ?? '').toLowerCase();
          return disc === '' || disc.includes(subLower) || subLower.includes(disc);
        });
      }

      if (searchLevel) {
        const lvlLower = searchLevel.toLowerCase();
        filtered = filtered.filter(t => {
          const lvl = (t.level ?? '').toLowerCase();
          return lvl === '' || lvl.includes(lvlLower) || lvlLower.includes(lvl);
        });
      }

      const source = filtered.length > 0 ? filtered : raw;

      // Group available slots by teacher user_id for day/time filtering
      const allSlots = (Array.isArray(slotsRes.data) ? slotsRes.data : []) as Array<{
        id: number; teacher: { user_id: number }; start_time: string;
      }>;
      const slotsByTeacher: Record<number, Array<{ start_time: string }>> = {};
      for (const s of allSlots) {
        const tid = s.teacher.user_id;
        if (!slotsByTeacher[tid]) slotsByTeacher[tid] = [];
        slotsByTeacher[tid].push(s);
      }

      let finalSource = source;
      if (searchDays.length > 0) {
        const withMatchingSlots = source.filter(t =>
          (slotsByTeacher[t.user_id] ?? []).some(s => {
            const dayName = new Date(s.start_time).toLocaleDateString('uk-UA', { weekday: 'long' });
            const slotTime = s.start_time.slice(11, 16);
            const dayOk = searchDays.some(d => dayName.toLowerCase().includes(d.toLowerCase()));
            const timeOk = slotTime >= searchTimeFrom && slotTime < searchTimeTo;
            return dayOk && timeOk;
          })
        );
        if (withMatchingSlots.length > 0) finalSource = withMatchingSlots;
      }

      const cards: Teacher[] = finalSource.map((t, i) => ({
        id: t.user_id,
        name: `${t.first_name} ${t.last_name}`.trim() || t.email,
        experience: '—',
        level: t.level ?? '—',
        subjects: t.discipline ? [t.discipline] : [],
        avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));

      setTeachers(cards);
      setSearched(true);
      if (cards.length === 0) {
        setAssignError('Викладачів не знайдено. Переконайтеся, що викладачі зареєстровані та підтверджені.');
      }
    } catch (err) {
      setAssignError(extractErrorMessage(err));
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

      // 3. Determine filter criteria from selected request or manager form
      const searchDays = selectedRequest?.preferred_days
        ? selectedRequest.preferred_days.split(', ').filter(Boolean)
        : managerDays;
      const searchTimeFrom = selectedRequest?.preferred_time?.split('-')[0] ?? managerTimeFrom;
      const searchTimeTo = selectedRequest?.preferred_time?.split('-')[1] ?? managerTimeTo;

      // 4. Filter slots by days + time range; fall back to first slot if none match
      let slotsToBook = slotsData.filter(ts => {
        const dayName = new Date(ts.start_time).toLocaleDateString('uk-UA', { weekday: 'long' });
        const slotTime = ts.start_time.slice(11, 16);
        const dayOk = searchDays.length === 0 || searchDays.some(d => dayName.toLowerCase().includes(d.toLowerCase()));
        const timeOk = slotTime >= searchTimeFrom && slotTime < searchTimeTo;
        return dayOk && timeOk;
      });
      if (slotsToBook.length === 0) slotsToBook = [slotsData[0]];

      // 5. Book all matching slots, skip conflicts
      let bookedCount = 0;
      for (const slotToBook of slotsToBook) {
        try {
          await apiClient.post('/lessons/assign/', {
            slot: slotToBook.id,
            student: selectedStudentObj.id,
            package: studentPackage.id,
          });
          bookedCount++;
        } catch {
          // Skip — slot already booked or student conflict at this time
        }
      }

      if (bookedCount === 0) {
        setAssignError('Не вдалося призначити жодного заняття. Всі підходящі слоти вже зайняті або конфліктують.');
        setAssignLoading(false);
        return;
      }

      setSuccessCount(bookedCount);
      setSuccessTeacher(teacher.name);
      setTeachers([]);
      setSearched(false);
      setSlots([]);
      const next = studentOptions.filter((s) => s !== student)[0] ?? studentOptions[0] ?? '';
      setStudent(next);
      setSubject(SUBJECTS[0]);
      setLevel(getLevels(SUBJECTS[0])[0]);
    } catch (err) {
      setAssignError(extractErrorMessage(err));
    } finally {
      setAssignLoading(false);
    }
=======
  const handleSearch = () => {
    setTeachers(allTeacherCards);
    setSearched(true);
  };

  const handleAssign = (name: string) => {
    setSuccessTeacher(name);
    setTeachers([]);
    setSearched(false);
    setSlots([]);
    const next = studentOptions.filter((s) => s !== student)[0] ?? studentOptions[0] ?? '';
    setStudent(next);
    setSubject(SUBJECTS[0]);
    setLevel(getLevels(SUBJECTS[0])[0]);
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
<<<<<<< HEAD
                <div key={req.id}
                  className={`flex items-center gap-4 p-4 bg-white rounded-2xl border cursor-pointer transition-colors ${
                    selectedRequest?.id === req.id ? 'border-[#1f8cf9] bg-blue-50/50' : 'border-[#dee1e6] hover:border-[#1f8cf9]/50'
                  }`}
                  onClick={() => {
                    if (selectedRequest?.id === req.id) {
                      setSelectedRequest(null);
                    } else {
                      setSelectedRequest(req);
                      setSubject(req.subject);
                      setLevel(getLevels(req.subject)[0]);
                    }
                  }}
                >
=======
                <div key={req.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#dee1e6]">
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
                    {studentOptions.length === 0
                      ? <option value="">— Немає студентів —</option>
                      : studentOptions.map((s) => <option key={s} value={s}>{s}</option>)
                    }
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="match-subject" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Предмет</label>
                  <div className="relative">
                    <select id="match-subject" value={subject} onChange={(e) => handleSubjectChange(e.target.value)} aria-label="Вибір предмету" className={selectClass}>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="match-level" className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Рівень</label>
                  <div className="relative">
                    <select id="match-level" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Вибір рівня" className={selectClass}>
                      {getLevels(subject).map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
              </div>
<<<<<<< HEAD

              <div className="flex flex-col gap-2">
                <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Дні тижня</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} type="button"
                      onClick={() => setManagerDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                      className={`px-3 py-1.5 rounded-xl font-inter text-xs font-medium border transition-colors ${
                        managerDays.includes(day) ? 'bg-[#1f8cf9] text-white border-[#1f8cf9]' : 'bg-white text-[#565d6d] border-[#dee1e6] hover:border-[#1f8cf9]'
                      }`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">Час</label>
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="font-inter text-[#565d6d] text-xs">З</span>
                    <div className="relative">
                      <select
                        value={managerTimeFrom}
                        onChange={e => {
                          const val = e.target.value;
                          setManagerTimeFrom(val);
                          if (managerTimeTo <= val) {
                            const nextIdx = MANAGER_TIME_OPTIONS.indexOf(val) + 1;
                            setManagerTimeTo(MANAGER_TIME_OPTIONS[nextIdx] ?? '21:00');
                          }
                        }}
                        aria-label="Час початку"
                        className={selectClass}>
                        {MANAGER_TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="font-inter text-[#565d6d] text-xs">До</span>
                    <div className="relative">
                      <select
                        value={managerTimeTo}
                        onChange={e => setManagerTimeTo(e.target.value)}
                        aria-label="Час завершення"
                        className={selectClass}>
                        {MANAGER_TIME_OPTIONS.filter(t => t > managerTimeFrom).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565d6d" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                  </div>
                </div>
              </div>
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
                  <input type="time" value={slot.from} onChange={(e) => updateSlot(slot.id, 'from', e.target.value)}
                    aria-label="Час початку"
                    className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-24" />
                  <input type="time" value={slot.to} onChange={(e) => updateSlot(slot.id, 'to', e.target.value)}
                    aria-label="Час завершення"
                    className="border border-[#dee1e6] rounded-xl px-3 py-2 font-inter text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f8cf9] w-24" />
                </div>
              ))}

<<<<<<< HEAD
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
=======
              <button type="button" onClick={handleSearch}
                className="flex items-center justify-center gap-2 py-3 w-full bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors mt-2">
                <IconSearch />
                Знайти викладачів
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
              </button>
            </div>
          </div>

          {/* Right: results */}
          {searched && (
            <div className="flex flex-col gap-4 flex-1 animate-fade-in">
              <p className="font-inter font-bold text-[#565d6d] text-xs tracking-[0.60px] uppercase">
                ЗНАЙДЕНО: {teachers.length} ВИКЛАДАЧІВ
              </p>

<<<<<<< HEAD
              {assignError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e64c4c" strokeWidth="2" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="font-inter text-red-600 text-sm">{assignError}</p>
                </div>
              )}

=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
                      Досвід: {t.experience} • Рівень: {t.level}
                    </span>
                    {t.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {t.subjects.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 bg-[#f4f4f6] rounded-full font-inter font-medium text-[#565d6d] text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
<<<<<<< HEAD
                  <button type="button"
                    onClick={() => void handleAssign(t)}
                    disabled={assignLoading}
                    aria-label={`Призначити викладача ${t.name}`}
                    className="px-5 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
                    {assignLoading ? 'Призначення...' : 'Призначити'}
=======
                  <button type="button" onClick={() => handleAssign(t.name)}
                    aria-label={`Призначити викладача ${t.name}`}
                    className="px-5 py-2 bg-[#1f8cf9] rounded-xl font-inter font-medium text-white text-sm hover:bg-blue-600 transition-colors flex-shrink-0">
                    Призначити
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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

<<<<<<< HEAD
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

=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
<<<<<<< HEAD
              Призначено <strong>{successCount}</strong> занять з викладачем <strong>{successTeacher}</strong>.
=======
              Викладача <strong>{successTeacher}</strong> успішно призначено студенту.
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
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
