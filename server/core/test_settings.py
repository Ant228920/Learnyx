"""
Lightweight test settings — SQLite in-memory so tests run without Docker/Postgres.
Usage:  py -m django test --settings=core.test_settings <labels>
"""
from core.settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# bcrypt is slow; use fast hasher for tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# capture emails in memory instead of printing to console
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
