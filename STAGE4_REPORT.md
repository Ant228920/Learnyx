# LearNYX — Звіт по Етапу 4 (70% MVP)

> Дата аналізу: 2026-05-15
> Гілка: `feat/frontend-foundation`

---

## ✅ Що зроблено по фронтенду

### API Integration (Крок 1)

Всі сторінки підключені до реального API через `apiClient` з axios-інтерсепторами.

| Файл | Ендпоінт | Що робить | Loading | Error |
|------|----------|-----------|---------|-------|
| `StudentDashboard.tsx` | `GET /student/dashboard/` | Дашборд: баланс, наступний урок, бонуси | ✅ | ✅ |
| `useStudentHomework.ts` | `GET /journal/` | Фільтрує записи з homework_task | ✅ | ✅ |
| `useStudentSchedule.ts` | `GET /lessons/upcoming/`, `PATCH /lessons/{id}/cancel/` | Карта уроків по днях, скасування | ✅ | ✅ |
| `useStudentSubscription.ts` | `GET /packages/`, `GET /students/me/balance/`, `GET /students/me/wallet/`, `POST /packages/{id}/purchase/`, `POST /students/me/topup/`, `POST /students/me/learning-requests/` | Абонементи, гаманець, поповнення, запит на викладача | ✅ | ✅ |
| `useStudentGrades.ts` | `GET /journal/` | Оцінки за уроки та ДЗ | ✅ | ✅ |
| `useProfile.ts` | `GET /users/me/`, `PATCH /users/me/` | Профіль користувача | ✅ | ✅ |
| `TeacherDashboard.tsx` | `GET /teacher/dashboard/`, `POST /lessons/{id}/evaluate/`, `PATCH /lessons/{id}/status/`, `PATCH /lessons/{id}/meeting-link/` | Дашборд + виставлення оцінок + посилання | ✅ | ✅ |
| `useTeacherSchedule.ts` | `GET /slots/`, `POST /slots/`, `DELETE /slots/{id}/` | Слоти по днях, додавання, видалення | ✅ | ✅ |
| `useTeacherFinances.ts` | `GET /teacher/finances/` | Фінанси викладача | ✅ | ✅ |
| `useTeacherStudents.ts` | `GET /students/`, `GET /students/available/?slot_id=X`, `POST /lessons/assign/` | Список учнів, призначення на урок | ✅ | ✅ |
| `useTeacherHomework.ts` | `GET /journal/?lesson_id=X`, `POST /lessons/{id}/evaluate/`, `POST /lessons/{id}/homework/` | Перевірка ДЗ, виставлення оцінок | ✅ | ✅ |
| `useManagerDashboard.ts` | `GET /students/`, `GET /teachers/` | Статистика + останні реєстрації | ✅ | ✅ |
| `useApplications.ts` | `GET /applicants/`, `POST /applicants/{id}/approve/`, `POST /applicants/{id}/reject/` | Заявки + схвалення/відхилення | ✅ | ✅ |
| `useManagerSubscriptions.ts` | `GET /manager/subscriptions/` | Підписки студентів | ✅ | ✅ |
| `useManagerReports.ts` | `GET /admin/lessons/archive/` | Архів уроків | ✅ | ✅ |
| `useManagerMatching.ts` | `GET /students/`, `GET /teachers/` | Списки для підбору | ✅ | ✅ |
| `useManagerLearningRequests.ts` | `GET /manager/learning-requests/`, `PATCH /manager/learning-requests/{id}/` | Запити на викладача | ✅ | ✅ |

---

### State Management

- **`AuthContext`** (`providers.tsx`): Зберігає `user`, `token`, стан `modal`
- **localStorage**: `token`, `refreshToken`, `userRole`, `user` (JSON)
- **Персистентність після F5**: ✅ Так — `useState(() => JSON.parse(localStorage.getItem('user')))` відновлює стан після перезавантаження
- **Auto-refresh token**: ✅ Реалізований в `apiClient` (інтерсептор 401 → POST `/auth/token/refresh/`)
- **Logout**: ✅ Видаляє всі ключі з localStorage

---

### Dynamic Rendering (статус кожної сторінки)

| Сторінка | Реальні дані API | Примітка |
|----------|-----------------|---------|
| `StudentDashboard` | ✅ Реальні | Повністю підключена |
| `StudentHomework` | ⚠️ Частково | `subject`, `title` завжди `'—'` (journal API не повертає ці поля) |
| `StudentSchedule` | ✅ Реальні | Відображення + скасування уроків |
| `StudentSubscription` | ✅ Реальні | Перегляд, купівля, поповнення гаманця, запит на викладача |
| `StudentGrades` | ⚠️ Частково | `subject`, `topic`, `teacher` завжди `'—'` (відсутні в `/journal/`) |
| `StudentSettings` | ❌ Зламана | Викликає `GET /users/me/` — ендпоінт не існує, є лише `GET /profile/` |
| `TeacherDashboard` | ✅ Реальні | Оцінювання уроків та встановлення посилань |
| `TeacherSchedule` | ✅ Реальні | Календар слотів із CRUD |
| `TeacherFinances` | ✅ Реальні | Транзакції через `/teacher/finances/` |
| `TeacherStudents` | ✅ Реальні | Список учнів + призначення на урок |
| `TeacherHomework` | ✅ Реальні | Перевірка ДЗ із journal API |
| `TeacherSettings` | ❌ Зламана | Той самий баг з `/users/me/` |
| `ManagerDashboard` | ✅ Реальні | Статистика студентів/викладачів |
| `ManagerApplications` | ✅ Реальні | Заявки + схвалення/відхилення |
| `ManagerSubscriptions` | ✅ Реальні | Список підписок |
| `ManagerReports` | ✅ Реальні | Архів уроків |
| `ManagerMatching` | ⚠️ Частково | Дані реальні, але кнопка "Знайти" не фільтрує за предметом/рівнем/слотами |
| `ManagerSettings` | ❌ Зламана | Той самий баг з `/users/me/` |

---

### Error Handling (UI)

| Сторінка | Відображення помилок |
|----------|---------------------|
| `StudentDashboard` | ✅ Червоний блок із повідомленням |
| `StudentHomework` | ✅ Повноекранне повідомлення |
| `StudentSchedule` | ✅ Повноекранне + `showError` toast |
| `StudentSubscription` | ✅ Повноекранне + `showError` toast |
| `StudentGrades` | ✅ Повноекранне повідомлення |
| `TeacherDashboard` | ✅ Червоний блок + помилка в modal |
| `TeacherSchedule` | ✅ Повноекранне + toast |
| `TeacherFinances` | ✅ В таблиці |
| `TeacherStudents` | ✅ Повноекранне |
| `TeacherHomework` | ✅ Повноекранне |
| `ManagerDashboard` | ✅ Повноекранне |
| `ManagerApplications` | ✅ Повноекранне |
| `ManagerSubscriptions` | ✅ В таблиці |
| `ManagerReports` | ✅ Під заголовком |
| `ManagerMatching` | ✅ Повноекранне |
| `ProfileContent` (Settings) | ✅ Inline блок | але API 404 прихована через error state |

---

### Routes

| Шлях | Компонент | Ролі | Захист |
|------|-----------|------|--------|
| `/` | `HomePage` | Всі | ✅ Публічна |
| `/dashboard` | `StudentDashboard` | student | ✅ `ProtectedRoute` з `.toLowerCase()` |
| `/dashboard/homework` | `StudentHomework` | student | ✅ |
| `/dashboard/schedule` | `StudentSchedule` | student | ✅ |
| `/dashboard/subscription` | `StudentSubscription` | student | ✅ |
| `/dashboard/grades` | `StudentGrades` | student | ✅ |
| `/dashboard/settings` | `StudentSettings` | student | ✅ |
| `/teacher` | `TeacherDashboard` | teacher | ✅ |
| `/teacher/schedule` | `TeacherSchedule` | teacher | ✅ |
| `/teacher/finances` | `TeacherFinances` | teacher | ✅ |
| `/teacher/students` | `TeacherStudents` | teacher | ✅ |
| `/teacher/homework` | `TeacherHomework` | teacher | ✅ |
| `/teacher/settings` | `TeacherSettings` | teacher | ✅ |
| `/manager` | `ManagerDashboard` | manager, admin | ✅ |
| `/manager/applications` | `ManagerApplications` | manager, admin | ✅ |
| `/manager/subscriptions` | `ManagerSubscriptions` | manager, admin | ✅ |
| `/manager/reports` | `ManagerReports` | manager, admin | ✅ |
| `/manager/matching` | `ManagerMatching` | manager, admin | ✅ |
| `/manager/settings` | `ManagerSettings` | manager, admin | ✅ |
| `*` | `RoleRedirect` | — | ⚠️ BUG-02 |

---

## ✅ Що зроблено по бекенду

| Ендпоінт | Статус | Примітка |
|----------|--------|---------|
| `POST /v1/auth/login/` | ✅ Реалізовано | LoginView, повертає JWT |
| `POST /v1/auth/token/refresh/` | ✅ Реалізовано | |
| `POST /v1/auth/register/` | ✅ Реалізовано | Створює RegistrationRequest, email менеджеру |
| `GET /v1/applicants/` | ✅ Реалізовано | Повертає заявки зі статусом 'new' |
| `POST /v1/applicants/<pk>/approve/` | ✅ Реалізовано | Створює акаунт, повертає пароль |
| `POST /v1/applicants/<pk>/reject/` | ✅ Реалізовано | |
| `GET /v1/packages/` | ✅ Реалізовано | PackagePlanListView |
| `POST /v1/packages/<pk>/activate/` | ✅ Реалізовано | |
| `POST /v1/packages/<pk>/purchase/` | ✅ Реалізовано | PackagePurchaseView |
| `GET /v1/students/` | ✅ Реалізовано | StudentListView |
| `GET /v1/students/available/` | ✅ Реалізовано | Фільтр за slot_id |
| `GET /v1/students/me/balance/` | ✅ Реалізовано | StudentBalanceView |
| `GET /v1/students/me/wallet/` | ✅ Реалізовано | StudentWalletView |
| `POST /v1/students/me/topup/` | ✅ Реалізовано | StudentBalanceTopUpView |
| `GET/POST /v1/students/me/learning-requests/` | ✅ Реалізовано | StudentLearningRequestView |
| `GET /v1/teachers/` | ✅ Реалізовано | TeacherListView |
| `GET /v1/student/dashboard/` | ✅ Реалізовано | StudentDashboardView |
| `GET /v1/teacher/dashboard/` | ✅ Реалізовано | TeacherDashboardView |
| `GET /v1/teacher/finances/` | ✅ Реалізовано | TeacherFinancesView |
| `GET /v1/manager/subscriptions/` | ✅ Реалізовано | ManagerSubscriptionsView |
| `GET/PATCH /v1/manager/learning-requests/` | ✅ Реалізовано | ManagerLearningRequestsView |
| `GET /v1/journal/` | ✅ Реалізовано | JournalListView |
| `GET /v1/admin/lessons/archive/` | ✅ Реалізовано | LessonArchiveView |
| `GET/PATCH /v1/profile/` | ⚠️ Реалізовано, але не використовується | Фронт викликає `/users/me/` (BUG-01) |
| `GET /v1/slots/` + ViewSet | ✅ Реалізовано | SlotViewSet (GET, POST, DELETE) |
| `GET /v1/lessons/` + ViewSet | ✅ Реалізовано | LessonViewSet |
| `PATCH /v1/lessons/{id}/status/` | ✅ Реалізовано | custom action |
| `PATCH /v1/lessons/{id}/meeting-link/` | ✅ Реалізовано | custom action |
| `POST /v1/lessons/{id}/evaluate/` | ✅ Реалізовано | custom action |
| `POST /v1/lessons/{id}/homework/` | ✅ Реалізовано | custom action |
| `POST /v1/lessons/assign/` | ✅ Реалізовано | custom action |
| `GET /v1/users/me/` | ❌ Відсутній | Фронт викликає цей URL, але backend не має його (є лише `/profile/`) |
| `PATCH /v1/users/me/` | ❌ Відсутній | Аналогічно |
| `GET /v1/requests/` | ❌ Відсутній | `managerApi.getRequests()` викликає цей URL (невикористовується у сторінках, але є latent bug) |
| `GET /v1/lessons/upcoming/` | ⚠️ Перевірити | Використовується StudentSchedule через ViewSet router |
| `GET /v1/bonus/balance/<student_id>/` | ✅ Реалізовано | BonusBalanceView (але виклик прямий, не через api.ts) |

---

## 📊 RTM — Матриця вимог MVP

| ID | User Story | Frontend | Backend | Status |
|----|-----------|----------|---------|--------|
| US.01 | Реєстрація студента | ✅ `RegisterStudentForm` | ✅ `POST /auth/register/` | ✅ Done |
| US.02 | Реєстрація вчителя | ✅ `RegisterTeacherForm` | ✅ `POST /auth/register/` | ✅ Done |
| US.03 | Логін | ✅ `LoginForm` (JWT, role normalize) | ✅ `POST /auth/login/` | ✅ Done |
| US.04 | Кабінет студента | ✅ `StudentDashboard` (реальний API) | ✅ `GET /student/dashboard/` | ✅ Done |
| US.05 | Розклад студента | ✅ `StudentSchedule` (real API, cancel) | ✅ `GET /lessons/upcoming/`, `PATCH /cancel/` | ✅ Done |
| US.06 | Домашні завдання студента | ⚠️ `StudentHomework` (дані реальні, але `subject`/`title` = `'—'`) | ✅ `GET /journal/` | ⚠️ In Progress |
| US.07 | Оцінки/журнал | ⚠️ `StudentGrades` (`subject`, `teacher` = `'—'`) | ✅ `GET /journal/` | ⚠️ In Progress |
| US.08 | Підписка/абонемент | ✅ `StudentSubscription` (перегляд, купівля, гаманець, запит на викладача) | ✅ `/packages/`, `/purchase/`, `/wallet/`, `/topup/`, `/learning-requests/` | ✅ Done |
| US.09 | Кабінет вчителя | ✅ `TeacherDashboard` (реальний API, оцінки, посилання) | ✅ `GET /teacher/dashboard/` + evaluate/status/meeting-link | ✅ Done |
| US.10 | Управління слотами | ✅ `TeacherSchedule` (реальний API, CRUD) | ✅ `GET/POST/DELETE /slots/` | ✅ Done |
| US.11 | Проведення уроку (відеозв'язок) | ⚠️ Вчитель встановлює link → студент бачить кнопку "Приєднатися" | ✅ `PATCH /lessons/{id}/meeting-link/` | ⚠️ In Progress |
| US.12 | Домашнє завдання від вчителя | ✅ `TeacherHomework` (реальний API, оцінювання) | ✅ `POST /lessons/{id}/homework/`, `POST /evaluate/` | ✅ Done |
| US.13 | Панель менеджера | ✅ `ManagerDashboard` (реальний API) | ✅ `GET /students/`, `GET /teachers/` | ✅ Done |
| US.14 | Заявки на реєстрацію | ✅ `ManagerApplications` (реальний API, схвалення/відхилення) | ✅ `GET /applicants/`, `POST /approve/`, `POST /reject/` | ✅ Done |
| US.15 | Підбір викладача | ⚠️ `ManagerMatching` (дані реальні, але пошук не фільтрує за критеріями) | ✅ `GET /students/`, `GET /teachers/`, `GET/PATCH /manager/learning-requests/` | ⚠️ In Progress |
| US.16 | Налаштування профілю | ❌ `ProfileContent` викликає `/users/me/` — ендпоінт не існує | ⚠️ `GET/PATCH /profile/` (не підключений до фронту) | ❌ Not Done |
| US.17 | Вихід/вхід в акаунт | ✅ `providers.tsx` login/logout + localStorage | ✅ `POST /auth/login/` | ✅ Done |
| US.18 | JWT авторизація | ✅ Автоматичний рефреш токену, Bearer header | ✅ `POST /auth/token/refresh/` | ✅ Done |

---

## 🐛 Відомі баги (Bug Tracker)

| ID | Назва | Severity | Priority | Status | Файл |
|----|-------|----------|----------|--------|------|
| BUG-01 | Profile API endpoint mismatch: `/users/me/` → 404 | S1 (Critical) | P1 | Open | `client/src/services/api.ts:520`, `client/src/features/profile/hooks/useProfile.ts` |
| BUG-02 | `roleDashboard()` не підтримує lowercase ролі — RoleRedirect завжди повертає `/` | S2 (Major) | P2 | Open | `client/src/app/router.tsx:31-36` |
| BUG-03 | `StudentHomework`/`StudentGrades`: поля `subject`, `topic`, `teacher` завжди `'—'` | S3 (Minor) | P3 | Open | `useStudentHomework.ts:36`, `useStudentGrades.ts:23-43` |
| BUG-04 | `ManagerMatching` не фільтрує викладачів — кнопка "Знайти" показує всіх | S3 (Minor) | P3 | Open | `client/src/pages/manager/ManagerMatching.tsx:102-105` |
| BUG-05 | `managerApi.getRequests()` викликає неіснуючий `GET /requests/` | S2 (Major) | P2 | Open | `client/src/services/api.ts:471` |
| BUG-06 | `TeacherHomework`: файл ДЗ показується як URL рядок, не завантажується як файл | S3 (Minor) | P3 | Open | `client/src/pages/teacher/TeacherHomework.tsx:156-175` |
| BUG-07 | `StudentHomework`: submit кнопка локально змінює стан але не надсилає дані на API (`homework_answer_url` не зберігається) | S2 (Major) | P2 | Open | `client/src/pages/student/StudentHomework.tsx:138-143` |
| BUG-08 | `TeacherDashboard`: матеріали (файли) зберігаються лише в локальному state — зникають після F5 | S3 (Minor) | P3 | Open | `client/src/pages/teacher/TeacherDashboard.tsx:46-55` |

---

## 📈 Загальний прогрес Етапу 4

| Метрика | Кількість | % |
|---------|-----------|---|
| Всього User Stories | 18 | 100% |
| ✅ Done (повністю) | 13 | 72% |
| ⚠️ In Progress (частково) | 4 | 22% |
| ❌ Not Done (зламано/відсутнє) | 1 | 6% |

**Розрахунок completion:**
- Повне виконання (Done): 13 × 1.0 = 13.0 балів
- Часткове виконання (In Progress): 4 × 0.5 = 2.0 балів
- Не виконано: 1 × 0.0 = 0.0 балів
- **Загальний прогрес Етапу 4: 83% (15/18)**

**Консервативна оцінка (лише повністю готові фічі): 72%**

---

## 🔧 Що ще потрібно зробити до 70%

Для **мінімального 70% MVP** потрібно виправити наступне:

### Критично (P1) — блокує функціонал

**1. BUG-01: Виправити URL профілю**

Файл: `client/src/services/api.ts` (рядки 520-534)

```typescript
// Змінити:
const { data } = await apiClient.get('/users/me/');
// На:
const { data } = await apiClient.get('/profile/');

// Змінити:
const { data } = await apiClient.patch('/users/me/', payload);
// На:
const { data } = await apiClient.patch('/profile/', payload);
```

Або додати в `server/api/urls.py`:
```python
path('v1/users/me/', ProfileView.as_view(), name='users-me'),
```

**2. BUG-07: StudentHomework — реальний submit ДЗ**

Файл: `client/src/pages/student/StudentHomework.tsx` (рядок 138)

Потрібно викликати `studentApi` для збереження `homework_answer_url` після завантаження файлу.

---

### Важливо (P2) — впливає на UX

**3. BUG-02: Виправити roleDashboard у router.tsx**

Файл: `client/src/app/router.tsx` (рядки 31-36)

```typescript
function roleDashboard(role: string): string {
  const r = role.toLowerCase();  // додати normalize
  if (r === 'student') return '/dashboard';
  if (r === 'teacher') return '/teacher';
  if (r === 'manager' || r === 'admin') return '/manager';
  return '/';
}
```

**4. BUG-03: Збагатити дані для StudentHomework та StudentGrades**

Файли: `useStudentHomework.ts`, `useStudentGrades.ts`

Додати join з даними уроку (предмет, тема, ім'я викладача) через `GET /lessons/{id}/` або розширити `GET /journal/` у бекенді.

**5. BUG-04: ManagerMatching — реальна логіка фільтрації**

Файл: `client/src/pages/manager/ManagerMatching.tsx` (рядок 102)

Замість `setTeachers(allTeacherCards)` — реалізувати виклик API з фільтрами предмету та рівня.

---

### Додатково (P3) — для покращення

**6. TeacherDashboard — збереження матеріалів у базі даних**

Файл: `TeacherDashboard.tsx` — матеріали зараз у локальному стані, потрібен ендпоінт.

**7. StudentHomework — відображення subject і deadline з реальних даних**

Файл: `useStudentHomework.ts` — розширити `/journal/` або додати вкладені дані.

**8. Виправити BUG-05** — або видалити `managerApi.getRequests()` або додати відповідний ендпоінт:
```python
path('v1/requests/', SomeView.as_view(), name='manager-requests'),
```

---

## 📋 Підсумок по компонентах

| Модуль | Готовність | Критичні проблеми |
|--------|-----------|-------------------|
| Auth (Login/Register/JWT) | ✅ 100% | — |
| Student Dashboard | ✅ 100% | — |
| Student Schedule | ✅ 100% | — |
| Student Subscription | ✅ 100% | — |
| Student Homework | ⚠️ 65% | Немає реального submit ДЗ, поля '—' |
| Student Grades | ⚠️ 70% | subject/teacher завжди '—' |
| Student Settings | ❌ 0% | BUG-01: 404 на /users/me/ |
| Teacher Dashboard | ✅ 95% | Матеріали лише в локальному стані |
| Teacher Schedule | ✅ 100% | — |
| Teacher Finances | ✅ 100% | — |
| Teacher Students | ✅ 100% | — |
| Teacher Homework | ✅ 90% | Файл як URL рядок |
| Teacher Settings | ❌ 0% | BUG-01: 404 на /users/me/ |
| Manager Dashboard | ✅ 100% | — |
| Manager Applications | ✅ 100% | — |
| Manager Subscriptions | ✅ 100% | — |
| Manager Reports | ✅ 100% | — |
| Manager Matching | ⚠️ 70% | Пошук не фільтрує (показує всіх) |
| Manager Settings | ❌ 0% | BUG-01: 404 на /users/me/ |
| Backend endpoints | ✅ 92% | /users/me/ відсутній |
