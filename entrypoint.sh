#!/bin/bash
# Зупиняємо скрипт, якщо виникає помилка
set -e

echo "⏳ Застосування міграцій бази даних..."
python manage.py migrate --noinput

echo "Перевірка наявності даних у базі..."
# Використовуємо Python, щоб перевірити, чи є вже головний менеджер
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
import os

if not User.objects.filter(email='manager@learnyx.com').exists():
    print('База порожня! Запускаємо генерацію актуальних Seed-даних...')
    os.system('python manage.py seed_demo')
else:
    print('База вже містить дані. Пропускаємо генерацію.')
"

echo "Запуск основного процесу Django..."
# Виконуємо команду, передану з docker-compose (наприклад, runserver або gunicorn)
exec "$@"