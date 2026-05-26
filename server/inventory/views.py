from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError

# Імпортуємо нашу транзакційну функцію
from inventory.services import purchase_package_for_student 

class PackagePurchaseView(APIView):
    """
    Ендпоінт: POST /api/inventory/purchase/
    Відповідає за купівлю пакета студентом. 
    Демонструє Transaction Supervision та безпечну обробку помилок.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Отримуємо дані від фронтенду
        plan_id = request.data.get('plan_id')
        course_id = request.data.get('course_id')
        student_id = request.user.id  # Безпечно беремо ID авторизованого користувача

        # Базова валідація вхідних даних
        if not plan_id or not course_id:
            return Response(
                {"detail": "Необхідно передати plan_id та course_id."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 2. Викликаємо нашу захищену сервісну функцію (де працюють транзакції)
            new_package = purchase_package_for_student(
                student_id=student_id,
                plan_id=plan_id,
                course_id=course_id
            )
            
            # Якщо все добре, повертаємо 201 Created
            return Response({
                "detail": "Пакет успішно придбано!",
                "package_id": new_package.id
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            # 3. BACKEND BUG FIXING: Перехоплюємо помилки бізнес-логіки 
            # (наприклад, якщо "Недостатньо коштів" або "Курс не знайдено")
            # Віддаємо 400 Bad Request замість 500 Internal Server Error
            error_message = e.message if hasattr(e, 'message') else str(e)
            return Response(
                {"detail": error_message}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            # Перехоплюємо будь-які інші непередбачувані баги бази даних
            return Response(
                {"detail": f"Сталася помилка при оформленні покупки: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )