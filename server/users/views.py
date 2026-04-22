from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction
from django.utils.crypto import get_random_string
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
        Усе всередині transaction.atomic для безпеки даних.
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
            # Використовуємо атомарну транзакцію: якщо щось впаде, БД відкотиться до початкового стану
            with transaction.atomic():
                
                # 1. Працюємо з користувачем (User)
                user = req_obj.user
                
                # --- LEAR-76: Генерація та хешування пароля ---
                # Генеруємо "сирий" пароль (12 символів)
                generated_password = get_random_string(length=12)
                
                # set_password автоматично захешує його за допомогою BCrypt 
                # (оскільки ми налаштували його першим у settings.py)
                user.set_password(generated_password)
                user.is_approved = True
                
                # 2. Призначаємо роль
                role, created = Role.objects.get_or_create(name=role_name)
                user.role_obj = role
                user.save()

                # 3. Створюємо профіль (якщо роль Student)
                if role_name == 'Student':
                    Student.objects.get_or_create(user=user)

                # 4. Оновлюємо статус самого запиту (Request)
                req_obj.status = 'approved'
                req_obj.save()

            # Якщо транзакція пройшла успішно
            return Response({
                "detail": f"Користувача підтверджено. Роль: {role_name}",
                "temporary_password": generated_password, # Віддаємо пароль, щоб менеджер міг його передати юзеру
                "username": user.username
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # У разі будь-якої помилки транзакція скасує всі зміни в БД автоматично
            return Response(
                {"detail": f"Сталася критична помилка: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class LoginView(TokenObtainPairView):
        pass