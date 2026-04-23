from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction
from django.utils.crypto import get_random_string
from django.core.mail import send_mail  # Додано імпорт для пошти
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Request, User, Role, Student

# --- СЕРІАЛІЗАТОРИ (базові, щоб ViewSet працював) ---

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = '__all__'

# --- В'ЮСЕТИ ---

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
        Логіка:
        1. Перевірка статусу запиту.
        2. Генерація та хешування пароля (BCrypt).
        3. Зміна статусу користувача та запиту.
        4. Призначення ролі та створення профілю студента.
        5. Відправка email з доступами.
        Усе всередині transaction.atomic для безпеки даних (Rollback при помилці пошти).
        """
        # Отримуємо об'єкт запиту (Request) по ID з URL
        req_obj = self.get_object()

        # Якщо запит вже оброблений, видаємо помилку
        if req_obj.status == 'approved':
            return Response(
                {"detail": "Цей запит вже був підтверджений раніше."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Визначаємо роль: беремо з запиту (POST body) або за замовчуванням 'Student'
        role_name = request.data.get('role', 'Student').capitalize()

        try:
            # Використовуємо атомарну транзакцію: якщо щось впаде (навіть пошта), БД відкотиться
            with transaction.atomic():
                
                # 1. Працюємо з користувачем (User)
                user = req_obj.user
                
                # --- LEAR-76: Генерація та хешування пароля ---

                # set_password автоматично захешує його за допомогою BCrypt 
                # (оскільки ми налаштували його першим у settings.py)
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
                # Формуємо тему та тіло листа
                subject = 'Ваші доступи до платформи Learnyx'
                message = (
                    f"Вітаємо!\n\n"
                    f"Ваш запит на реєстрацію успішно підтверджено. "
                    f"Ось ваші тимчасові дані для входу:\n\n"
                    f"Логін: {user.username}\n"
                    f"Пароль: {generated_password}\n\n"
                    f"Будь ласка, змініть пароль після першого входу в систему."
                )
                
                # Відправляємо лист. 
                # fail_silently=False - КРИТИЧНО ВАЖЛИВО! Якщо пошта впаде, 
                # це викличе помилку, і транзакція вище автоматично скасує збереження юзера в БД.
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,  # Береться значення DEFAULT_FROM_EMAIL з settings.py
                    recipient_list=[user.email],
                    fail_silently=False, 
                )

            # Якщо ми дійшли сюди, значить і база збереглась, і лист відправився
            return Response({
                "detail": f"Користувача підтверджено. Лист успішно надіслано на {user.email}",
                "temporary_password": generated_password, 
                "username": user.username
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # У разі помилки (наприклад, невірні налаштування SMTP), транзакція скасовується.
            # Ми повертаємо 500 статус і пояснення проблеми.
            return Response(
                {"detail": f"Помилка при підтвердженні (транзакцію скасовано): {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(TokenObtainPairView):
    pass