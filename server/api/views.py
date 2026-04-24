import logging
import secrets
import string

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.models import RegistrationRequest
from api.serializers import RegistrationRequestSerializer
from users.models import User, Role, Student, Manager
from inventory.models import Package

logger = logging.getLogger(__name__)


def generate_password(length=10):
    """Генерація безпечного випадкового пароля."""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class RegistrationRequestView(APIView):
    """Сценарій 1: Подача заявки гостем."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_request = serializer.save()

        try:
            send_mail(
                subject=f'Нова заявка на Learnyx: {reg_request.full_name}',
                message=f'ПІБ: {reg_request.full_name}\nEmail: {reg_request.email}\nРоль: {reg_request.role}',
                from_email=settings.DEFAULT_FROM_EMAIL, # Використовуємо стандартний параметр
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f'Failed to send notification email to manager: {e}')

        return Response({
            'message': 'Готово! Ваша заявка успішно відправлена менеджеру.',
            'id': reg_request.id
        }, status=status.HTTP_201_CREATED)


class ApproveRegistrationRequestView(APIView):
    """Сценарій 2: Апрув заявки менеджером та створення акаунту."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        reg_request = get_object_or_404(RegistrationRequest, pk=pk)

        if reg_request.status == 'approved':
            return Response({'message': 'Заявку вже оброблено.'}, status=status.HTTP_400_BAD_REQUEST)

        password = generate_password()
        
        try:
            with transaction.atomic():
                # Розбиваємо ім'я більш надійно
                name_parts = reg_request.full_name.strip().split(maxsplit=1)
                first_name = name_parts[0] if name_parts else "User"
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                role_obj, _ = Role.objects.get_or_create(name=reg_request.role)

                # Створення користувача
                user = User.objects.create_user(
                    username=reg_request.email, # email як унікальний логін
                    email=reg_request.email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone=reg_request.phone,
                    nickname=reg_request.telegram_nickname,
                    role_obj=role_obj,
                    is_approved=True,
                )

                # Створення профілю залежно від ролі
                if reg_request.role.lower() == 'student':
                    Student.objects.create(user=user)
                elif reg_request.role.lower() == 'manager':
                    Manager.objects.create(user=user)

                # Оновлення статусу заявки
                reg_request.status = 'approved'
                reg_request.save()

            # Відправка пароля користувачу (після завершення транзакції)
            send_mail(
                subject='Ваш акаунт на Learnyx створено!',
                message=f'Вітаємо, {first_name}!\n\nВаш акаунт активовано.\nЛогін: {reg_request.email}\nПароль: {password}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[reg_request.email],
                fail_silently=True,
            )

            return Response({
                'message': f'Акаунт для {reg_request.email} успішно створено.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Approve failed for request {pk}: {e}')
            return Response({'message': f'Помилка при створенні акаунту: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ActivatePackageView(APIView):
    """Активація навчального пакету."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        package = get_object_or_404(Package, pk=pk)

        if package.status == 'active':
            return Response({'message': 'Пакет вже активовано.'}, status=status.HTTP_400_BAD_REQUEST)

        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save()
        
        logger.info(f'Package {pk} activated by user {request.user.id}')
        
        return Response({
            'message': 'Пакет успішно активовано.',
            'package_id': package.id,
            'status': package.status,
            'balance': package.balance,
        }, status=status.HTTP_200_OK)


class StudentBalanceView(APIView):
    """Перегляд залишку занять учня."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        package = Package.objects.filter(student=student, status='active').first()

        if not package:
            return Response({
                'remaining_lessons': 0,
                'message': 'У вас немає активних підписок.',
            }, status=status.HTTP_200_OK)

        return Response({
            'remaining_lessons': package.balance,
            'total_lessons': package.total_lessons,
            'package_id': package.id,
            'status': package.status,
        }, status=status.HTTP_200_OK)
    