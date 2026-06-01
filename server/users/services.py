from rest_framework.exceptions import NotFound, ValidationError
from django.core.exceptions import ObjectDoesNotExist
from users.models import Student  # Обов'язково імпортуємо модель

def get_student_balance(student_id):
    try:
        # Шукаємо студента за ID його прив'язаного користувача
        student = Student.objects.get(user_id=student_id)
        return student.money_balance

    except ObjectDoesNotExist:
        raise NotFound(detail="Студента з таким ID не знайдено.")

    except Exception as e:
        raise ValidationError(detail=f"Сталася помилка при перевірці балансу: {str(e)}")
