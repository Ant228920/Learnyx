from django.db import models


class RegistrationRequest(models.Model):
    """
    UC-08: Заявка на реєстрацію від гостя (без акаунту).
    Зберігається до моменту апруву менеджером.
    """

    class RoleChoice(models.TextChoices):
        STUDENT = 'student', 'Учень'
        TEACHER = 'teacher', 'Викладач'

    # Основні поля
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    telegram_nickname = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=10, choices=RoleChoice.choices)

    # Поля для викладача (обов'язкові якщо role=teacher)
    subject = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(max_length=100, blank=True, null=True)

    # Статус заявки
    status = models.CharField(max_length=20, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.full_name} ({self.role}) - {self.status}'
