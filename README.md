<div align="center">

# 🎓 Learnyx

### Вебплатформа для структурованого онлайн-репетиторства

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

</div>

---

## 📖 About

**Learnyx** — веб-платформа для автоматизації онлайн-навчання між учнями, викладачами та менеджерами.

Система усуває необхідність у розрізнених інструментах — месенджерах, таблицях, зовнішніх календарях — та об'єднує в єдиному місці:

- 📅 Розклад занять та управління слотами
- 📦 Облік та списання пакетів уроків
- 📊 Журнал успішності та оцінювання
- 💰 Бонусну систему **Learning Cashback**

> **Ключові ролі:** `Student` · `Teacher` · `Manager`

---

## ✨ Key Features

| Функція | Опис |
|---------|------|
| 🔐 **Рольова модель** | Student, Teacher, Manager з розмежованим функціоналом |
| 🎒 **Кабінет учня** | Розклад, оцінки, домашні завдання, пакети, бонусний баланс |
| 👨‍🏫 **Кабінет викладача** | Слоти розкладу, журнал успішності, управління заняттями |
| 🗂️ **Кабінет менеджера** | Обробка заявок, активація пакетів, моніторинг процесу |
| 💎 **Learning Cashback** | Бонуси **5 / 10 / 15%** на наступний пакет за успішність **85–100%** |
| 📋 **Система пакетів** | Автоматичне списання занять після проведення |

---

## 🛠️ Tech Stack

### Backend
| Технологія | Версія | Призначення |
|-----------|--------|------------|
| **Python** | 3.11+ | Основна мова |
| **Django** | 5.x | Веб-фреймворк |
| **Django REST Framework** | latest | REST API |
| **PostgreSQL** | 14+ | База даних |
| **drf-spectacular** | latest | OpenAPI / Swagger |

### Frontend
| Технологія | Версія | Призначення |
|-----------|--------|------------|
| **React** | 18.x | UI-фреймворк |
| **TypeScript** | 5.x | Типізація |
| **Vite** | 6.x | Білдер |
| **Axios** | latest | HTTP-клієнт |
| **React Router** | v6 | Маршрутизація |
| **React Hook Form** | latest | Форми |

---

## 📁 Repository Structure

```
Learnyx/
│
├── 📂 client/              # ⚛️  Frontend — React + TypeScript
│   ├── src/
│   │   ├── components/     # Перевикористовувані UI-компоненти
│   │   ├── pages/          # Сторінки (Student, Teacher, Manager)
│   │   ├── services/       # HTTP-клієнт (Axios), запити до API
│   │   ├── hooks/          # Кастомні React хуки
│   │   └── assets/         # Статичні ресурси
│   ├── .env.example
│   ├── vite.config.ts
│   └── README.md           # 👉 Детальна документація фронтенду
│
├── 📂 server/              # 🐍  Backend — Django + Python
│   ├── core/               # Django-проєкт (settings, urls, wsgi)
│   ├── manage.py
│   ├── requirements.txt
│   ├── openapi.yaml        # OpenAPI 3.0 специфікація
│   ├── .env.example
│   └── README.md           # 👉 Детальна документація бекенду
│
├── 📂 .github/             # PR templates, workflows
├── .editorconfig
├── .gitignore
├── CONTRIBUTORS.md
└── README.md
```

---

## 🚀 Getting Started

### ⚛️ Frontend

```bash
# 1. Перейти в папку клієнта
cd client

# 2. Встановити залежності
npm install

# 3. Налаштувати змінні середовища
cp .env.example .env   # macOS/Linux
copy .env.example .env # Windows

# 4. Запустити dev-сервер
npm run dev
```

> 🌐 Застосунок запуститься на **`http://localhost:5173/`**

---

### 🐍 Backend

```bash
# 1. Перейти в папку сервера
cd server

# 2. Створити та активувати віртуальне середовище
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Встановити залежності
pip install -r requirements.txt

# 4. Налаштувати змінні середовища
cp .env.example .env   # macOS/Linux
copy .env.example .env # Windows

# 5. Застосувати міграції та запустити сервер
python manage.py migrate
python manage.py runserver
```

> 🌐 Сервер запуститься на **`http://127.0.0.1:8000/`**

---

## 👥 Team

| Роль | Ім'я | GitHub |
|------|------|--------|
| 📋 **Project Manager** | Олянюк А.В. | [@Ant228920](https://github.com/Ant228920) |
| ⚙️ **Backend Developer** | Бабин Б.О. | [@MarcoGr11](https://github.com/MarcoGr11) |
| 🎨 **Frontend Developer** | Клевач В.Р. | [@1nxiz](https://github.com/1nxiz) |
| 🗄️ **Database Engineer** | Сусла В.В. | [@Vlad8800](https://github.com/Vlad8800) |
| 🧪 **QA Engineer** | Волущук М.В. | [@Markovoloshchuk](https://github.com/Markovoloshchuk) |
| 🎓 **Ментор-викладач** | Комісарчук В.В. | — |

---

## 📚 Documentation & Links

| Ресурс | Посилання |
|--------|-----------|
| 💻 **GitHub** | [Learnyx Repository](https://github.com/Ant228920/Learnyx) |
| 📌 **Jira Board** | [Learnyx Backlog](https://learnyx123.atlassian.net/jira/software/projects/LEAR/boards/2/backlog) |
| 📝 **Business Requirements** | [Notion — BRL](https://www.notion.so/Business-Requirements-List-328cc7cf61f3806f9db5c414bcaa5cef) |
| 📡 **API Docs (Swagger)** | [OpenAPI Specification](https://www.notion.so/Swagger-OpenAPI-Specification-33acc7cf61f380a19b25f5235443bb35) |
| 🎨 **UI/UX Prototype** | [Figma Wireframes](https://www.figma.com/design/JX3mRS5rRtxMKETHkzbDSf/Wireframes-first-etap?node-id=2034-3&t=tE9YoIxzsK0ciPc1-0) |
| ⚛️ **Frontend Docs** | [client/README.md](./client/README.md) |
| 🐍 **Backend Docs** | [server/README.md](./server/README.md) |

---

<div align="center">

**Learnyx** — університетський проєкт з розробки вебплатформи для онлайн-репетиторства

</div>
