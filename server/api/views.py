import logging
from datetime import datetime, timezone

from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from api.serializers import RegistrationRequestSerializer

logger = logging.getLogger(__name__)


class RegistrationRequestView(APIView):
    """
    POST /api/v1/requests/
    UC-08: Подача заявки на реєстрацію (Guest).
    Доступно без авторизації.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_request = serializer.save()

        # Відправка email менеджеру через Django SMTP
        try:
            send_mail(
                subject=f'Нова заявка на реєстрацію: {reg_request.full_name}',
                message=(
                    f'Нова заявка на реєстрацію:\n\n'
                    f'ПІБ: {reg_request.full_name}\n'
                    f'Email: {reg_request.email}\n'
                    f'Телефон: {reg_request.phone}\n'
                    f'Роль: {reg_request.role}\n'
                    f'Telegram: {reg_request.telegram_nickname or "-"}\n'
                    f'Предмет: {reg_request.subject or "-"}\n'
                    f'Рівень: {reg_request.level or "-"}\n'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )
            logger.info(f'Email sent for registration request {reg_request.id}')
        except Exception as e:
            logger.error(f'Failed to send email: {e}')

        return Response(
            {
                'message': 'Готово! Ваша заявка успішно відправлена менеджеру.',
                'id': reg_request.id,
            },
            status=status.HTTP_201_CREATED,
        )
