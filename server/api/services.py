import logging
import secrets
import string

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

from api.models import RegistrationRequest
from users.models import User, Role, Student, Manager
from inventory.models import Package
from django.utils import timezone

logger = logging.getLogger(__name__)


def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class RegistrationService:
    """Сервіс для роботи з заявками на реєстрацію"""

    @staticmethod
    def create_request(data: dict) -> RegistrationRequest:
        """UC-08: Зберігає заявку і надсилає email менеджеру"""
        reg_request = RegistrationRequest.objects.create(**data)

        try:
            send_mail(
                subject=f'Нова заявка: {reg_request.full_name}',
                message=(
                    f'ПІБ: {reg_request.full_name}\n'
                    f'Email: {reg_request.email}\n'
                    f'Роль: {reg_request.role}\n'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f'Failed to send manager email: {e}')

        return reg_request

    @staticmethod
    def approve_request(pk: int) -> dict:
        """
        UC-18: Апрув заявки менеджером.
        В межах транзакції: створює User + Student/Manager.
        Email відправляється після транзакції.
        """
        reg_request = RegistrationRequest.objects.get(pk=pk)

        if reg_request.status == 'approved':
            raise ValueError('Заявку вже оброблено.')

        password = generate_password()

        with transaction.atomic():
            name_parts = reg_request.full_name.strip().split()
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            role_obj, _ = Role.objects.get_or_create(name=reg_request.role)

            user = User.objects.create_user(
                username=reg_request.email,
                email=reg_request.email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=reg_request.phone,
                nickname=reg_request.telegram_nickname,
                role_obj=role_obj,
                is_approved=True,
            )

            if reg_request.role == 'student':
                Student.objects.create(user=user)
            elif reg_request.role == 'manager':
                Manager.objects.create(user=user)

            reg_request.status = 'approved'
            reg_request.save()

        # Email після транзакції — не блокує rollback
        try:
            send_mail(
                subject='Ваш акаунт на Learnyx створено!',
                message=(
                    f'Вітаємо, {first_name}!\n\n'
                    f'Логін: {reg_request.email}\n'
                    f'Пароль: {password}\n\n'
                    f'Змініть пароль після першого входу.'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[reg_request.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f'Failed to send welcome email: {e}')

        return {'user_id': user.id, 'email': reg_request.email}


class PackageService:
    """Сервіс для роботи з пакетами занять"""

    @staticmethod
    def activate(pk: int) -> Package:
        """Таска 4: Активація пакету. 400 якщо вже активний."""
        package = Package.objects.get(pk=pk)

        if package.status == 'active':
            raise ValueError('Пакет вже активовано.')

        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save()

        return package

    @staticmethod
    def get_student_balance(user) -> dict:
        """Таска 5: Баланс учня — залишок занять активного пакету."""
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            raise ValueError('Профіль учня не знайдено.')

        package = Package.objects.filter(student=student, status='active').first()

        if not package:
            return {'remaining_lessons': 0, 'message': 'У вас немає активних підписок.'}

        return {
            'remaining_lessons': package.balance,
            'total_lessons': package.total_lessons,
            'package_id': package.id,
            'status': package.status,
        }
