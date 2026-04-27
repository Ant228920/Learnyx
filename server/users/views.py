from django.db import transaction
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Request, User, Role, Student
from users.serializers import LoginSerializer

# --- СЕРІАЛІЗАТОРИ ---

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = '__all__'

# --- В'ЮСЕТИ ТА API VIEWS ---

class RequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet для роботи із запитами на реєстрацію.
    Містить логіку апруву (підтвердження) користувача.
    """
    queryset = Request.objects.all()
    serializer_class = RequestSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Ендпоінт: POST /api/requests/{id}/approve/
        """
        req_obj = self.get_object()

        if req_obj.status == 'approved':
            return Response(
                {"detail": "Цей запит вже був підтверджений раніше."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        role_name = request.data.get('role', 'Student').capitalize()

        try:
            with transaction.atomic():
                
                # 1. Працюємо з користувачем
                user = req_obj.user
                
                # Генерація та хешування пароля
                generated_password = get_random_string(length=12)
                user.set_password(generated_password)
                user.is_approved = True
                
                # 2. Призначення ролі
                role, created = Role.objects.get_or_create(name=role_name)
                user.role_obj = role
                user.save()

                # 3. Створення профілю (якщо роль Student)
                if role_name == 'Student':
                    Student.objects.get_or_create(user=user)

                # 4. Оновлення статусу самого запиту
                req_obj.status = 'approved'
                req_obj.save()

                # --- Відправка листа (SMTP) ---
                subject = 'Ваші доступи до платформи Learnyx'
                message = (
                    f"Вітаємо!\n\n"
                    f"Ваш запит на реєстрацію успішно підтверджено. "
                    f"Ось ваші тимчасові дані для входу:\n\n"
                    f"Логін: {user.email if user.email else user.username}\n"
                    f"Пароль: {generated_password}\n\n"
                    f"Будь ласка, змініть пароль після першого входу в систему."
                )
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None, 
                    recipient_list=[user.email],
                    fail_silently=False, 
                )

            return Response({
                "detail": f"Користувача підтверджено. Лист успішно надіслано на {user.email}",
                "temporary_password": generated_password, 
                "username": user.username
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"Помилка при підтвердженні (транзакцію скасовано): {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """
    Кастомний ендпоінт для логіну (видає JWT токени та інформацію про юзера).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role_obj.name if getattr(user, 'role_obj', None) else None,
                'firstName': user.first_name,
                'lastName': user.last_name,
            }
        }, status=status.HTTP_200_OK)