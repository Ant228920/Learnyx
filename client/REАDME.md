# Learnyx — Frontend

> React + TypeScript клієнтська частина платформи онлайн-репетиторства Learnyx.

---

## Tech Stack

| Технологія | Версія |
|-----------|--------|
| React | 18.x |
| TypeScript | 5.x |
| Vite | 8.x |
| Axios | latest |
| React Router | v6 |
| React Hook Form | latest |

---

## Getting Started

### Prerequisites

Перед початком переконайся, що встановлено:

- Node.js 22+
- npm 10+

### Installation

```bash
# 1. Перейти в папку клієнта
cd client

# 2. Встановити залежності
npm install
```

### Environment Variables

Скопіювати `.env.example` і заповнити значення:

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

| Змінна | Опис | Приклад |
|--------|------|---------|
| `VITE_API_URL` | URL Backend API | `http://localhost:8000/api/v1` |
| `VITE_APP_NAME` | Назва застосунку | `Learnyx` |

### Running

```bash
# Запустити dev-сервер
npm run dev
```

Застосунок запуститься на `http://localhost:5173/`

```bash
# Зібрати для production
npm run build

# Перевірити production збірку локально
npm run preview
```

---

## Project Structure

```
client/
├── src/
│   ├── components/        # Перевикористовувані UI-компоненти
│   ├── pages/             # Сторінки (Student, Teacher, Manager dashboards)
│   ├── services/          # HTTP-клієнт (Axios), запити до API
│   ├── hooks/             # Кастомні React хуки
│   ├── assets/            # Статичні ресурси (зображення, шрифти)
│   ├── App.tsx
│   └── main.tsx
├── .env.example           # Шаблон змінних оточення
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Code Style

Проєкт використовує **Airbnb JavaScript Style Guide** + **ESLint** + **Prettier**.

Правила іменування відповідно до [Naming Conventions](../docs/) проєкту:
- Компоненти: `PascalCase` (StudentDashboard.tsx)
- Хуки: `camelCase` з префіксом `use` (useStudentProgress.ts)
- Папки: `kebab-case` (student-dashboard/)

---

## Documentation & Links

| Ресурс | Посилання |
|--------|-----------|
| Backend API | [http://localhost:8000/api/v1](http://localhost:8000/api/v1) |
| Swagger UI | [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) |
| Figma Prototype | [UI/UX Prototype](https://www.figma.com/design/JX3mRS5rRtxMKETHkzbDSf/Wireframes-first-etap?node-id=2034-3&t=tE9YoIxzsK0ciPc1-0) |
| GitHub | [Learnyx Repository](https://github.com/Ant228920/Learnyx) |
