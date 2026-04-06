# Learnyx — Backend

> LMS-платформа для організації онлайн-репетиторства: управління заняттями, учнями, пакетами уроків та системою бонусів.

---

## About

Learnyx — веб-платформа для структурованого онлайн-навчання між учнями, викладачами та менеджерами. Система автоматизує розклад занять, облік пакетів уроків, оцінювання та нарахування бонусного балансу (Learning Cashback), усуваючи необхідність використання розрізнених інструментів (месенджери, таблиці, зовнішні календарі).

**Ключові ролі:** Student · Teacher · Manager


---

## Tech Stack

> Повний стек проєкту. Цей репозиторій містить Backend.

| Шар | Технологія |
|-----|-----------|
| Frontend | React |
| Backend | Django / Python |
| Database | PostgreSQL |

---

## Getting Started

### Prerequisites

Перед початком переконайся, що встановлено:

- Python 3.11+ (pip включено)
- PostgreSQL 14+

> Всі Python-залежності (Django, DRF тощо) встановлюються автоматично через `pip install -r requirements.txt`

### Installation

```bash
# 1. Клонувати репозиторій
git clone https://github.com/Ant228920/Learnyx.git
cd Learnyx

# 2. Створити та активувати віртуальне середовище
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Встановити залежності
pip install -r requirements.txt
```

### Environment Variables

Скопіювати `.env.example` і заповнити значення:

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

| Змінна | Опис |
|--------|------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Режим налагодження (True/False) |
| `DB_NAME` | Назва бази даних PostgreSQL |
| `DB_USER` | Користувач бази даних |
| `DB_PASSWORD` | Пароль до бази даних |
| `DB_HOST` | Хост бази даних (за замовчуванням `localhost`) |
| `DB_PORT` | Порт бази даних (за замовчуванням `5432`) |

### Running

```bash
# Застосувати міграції
python manage.py migrate

# Запустити сервер
python manage.py runserver
```

Сервер запуститься на `http://127.0.0.1:8000/`

---

## Project Structure

```
Learnyx/
├── core/                  # Основний Django-проєкт (settings, urls, wsgi)
├── .env.example           # Шаблон змінних оточення
├── .gitignore             # Виключення для Git
├── manage.py              # Django CLI
├── requirements.txt       # Залежності проєкту
├── README.md
└── CONTRIBUTORS.md
```

---

## Key Features

- **Рольова модель доступу** — Student, Teacher, Manager з розмежованим функціоналом
- **Кабінет учня** — розклад, оцінки, домашні завдання, пакети, бонусний баланс
- **Кабінет викладача** — слоти розкладу, журнал успішності, управління заняттями
- **Кабінет менеджера** — обробка заявок, активація пакетів, моніторинг процесу
- **Learning Cashback** — бонусна система до 15% вартості пакету за успішність 85–100%
- **Система пакетів** — облік та автоматичне списання занять після проведення

---

## Team

| Роль | Ім'я | GitHub |
|------|------|---|
| Project Manager | Олянюк А.В. | https://github.com/Ant228920 |
| Backend Developer | Бабин Б.О. | https://github.com/MarcoGr11 |
| Frontend Developer | Клевач В.Р. | https://github.com/1nxiz |
| Database Engineer | Сусла В.В. | https://github.com/Vlad8800 |
| QA Engineer | Волущук М.В. | https://github.com/Markovoloshchuk |
| Ментор-викладач | Комісарчук В.В. | — |

---

## Documentation & Links

| Ресурс | Посилання |
|--------|-----------|
| GitHub | [Learnyx Repository](https://github.com/Ant228920/Learnyx) |
| Jira Board | [Learnyx Backlog](https://learnyx123.atlassian.net/jira/software/projects/LEAR/boards/2/backlog) |
| Business Requirements | [Notion — BRL](https://www.notion.so/Business-Requirements-List-328cc7cf61f3806f9db5c414bcaa5cef) |
| API Docs | Swagger (в розробці) |

---
