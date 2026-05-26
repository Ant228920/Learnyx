from django.db import transaction
from django.core.exceptions import ValidationError
from users.models import Student
from .models import Package, PackagePlan, Course

def purchase_package_for_student(student_id: int, plan_id: int, course_id: int) -> Package:
    """
    Складний бізнес-процес купівлі навчального пакета студентом.
    Реалізує Transaction Supervision та запобігає Race Conditions.
    """
    with transaction.atomic():
        try:
            student = Student.objects.select_for_update().get(user__id=student_id)
        except Student.DoesNotExist:
            raise ValidationError("Студента не знайдено.")

        try:
            plan = PackagePlan.objects.get(id=plan_id)
            course = Course.objects.get(id=course_id)
        except (PackagePlan.DoesNotExist, Course.DoesNotExist):
            raise ValidationError("Тарифний план або курс не знайдено.")

        if student.money_balance < plan.price:
            raise ValidationError(
                f"Недостатньо коштів. Баланс: {student.money_balance}, Ціна: {plan.price}"
            )

        student.money_balance -= plan.price
        student.save(update_fields=['money_balance'])

        new_package = Package.objects.create(
            student=student,
            course=course,
            discipline=course.discipline,
            total_lessons=plan.total_lessons,
            final_price=plan.price,
            balance=plan.total_lessons,
            status='active'
        )

        return new_package