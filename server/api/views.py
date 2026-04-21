import logging
import secrets
import string

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
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
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class RegistrationRequestView(APIView):
    """
    POST /api/v1/requests/
    UC-08: Подача заявки на реєстрацію (Guest).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_request = serializer.save()

        try:
            send_mail(
                subject=f'Нова заявка: {reg_request.full_name}',
                message=(
                    f'Нова заявка:\n'
                    f'ПІБ: {reg_request.full_name}\n'
                    f'Email: {reg_request.email}\n'
                    f'Роль: {reg_request.role}\n'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f'Failed to send email: {e}')

        return Response(
            {'message': 'Готово! Ваша заявка успішно відправлена менеджеру.', 'id': reg_request.id},
            status=status.HTTP_201_CREATED,
        )


class ApproveRegistrationRequestView(APIView):
    """
    POST /api/v1/requests/{id}/approve/
    UC-18: Менеджер апрувить заявку → створює User.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reg_request = RegistrationRequest.objects.get(pk=pk)
        except RegistrationRequest.DoesNotExist:
            return Response({'message': 'Заявку не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        if reg_request.status == 'approved':
            return Response({'message': 'Заявку вже оброблено.'}, status=status.HTTP_400_BAD_REQUEST)

        password = generate_password()

        try:
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

        except Exception as e:
            logger.error(f'Approve failed: {e}')
            return Response(
                {'message': f'Помилка створення акаунту: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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

        return Response(
            {'message': f'Акаунт для {reg_request.email} успішно створено.', 'user_id': user.id},
            status=status.HTTP_201_CREATED,
        )


class ActivatePackageView(APIView):
    """
    POST /api/v1/packages/{id}/activate/
    Таска 4: Активація пакету занять.
    Якщо статус вже active — повертає 400.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({'message': 'Пакет не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        if package.status == 'active':
            return Response(
                {'message': 'Пакет вже активовано.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Активуємо пакет
        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save()

        logger.info(f'Package {pk} activated by user {request.user.id}')

        return Response(
            {
                'message': 'Пакет успішно активовано.',
                'package_id': package.id,
                'status': package.status,
                'purchased_at': package.purchased_at,
                'total_lessons': package.total_lessons,
                'balance': package.balance,
            },
            status=status.HTTP_200_OK,
        )
