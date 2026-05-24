# ─── Stage 1: base ─────────────────────────────────────────────
FROM python:3.12-slim AS base

# Не генерувати .pyc файли; stdout/stderr без буферизації
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Системні залежності для psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# ─── Stage 2: dependencies ─────────────────────────────────────
FROM base AS dependencies

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─── Stage 3: final ────────────────────────────────────────────
FROM dependencies AS final

# Копіюємо весь server/ в контейнер
COPY . .

EXPOSE 8000

# Використовуємо gunicorn для production-ready запуску
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]