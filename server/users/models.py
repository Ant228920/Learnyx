from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', 'Student'
        TEACHER = 'teacher', 'Teacher'
        MANAGER = 'manager', 'Manager'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email} ({self.role})'
