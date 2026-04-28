import logging
import secrets
import string
from decimal import Decimal

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from api.models import RegistrationRequest
from users.models import User, Role, Student, Manager
from inventory.models import Package, JournalRecord, CourseCompletion

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


# ---------------------------------------------------------------------------
# Bonus / cashback (US14 + US15)
# ---------------------------------------------------------------------------

# Ordered highest → lowest so the first match gives the best tier.
CASHBACK_TIERS = [
    (Decimal('95'), Decimal('15')),
    (Decimal('90'), Decimal('10')),
    (Decimal('85'), Decimal('5')),
]


def calculate_cashback(package) -> 'CourseCompletion | None':
    """
    US15: called inside an atomic block when package.status → 'completed'.
    Reads activity_grade from JournalRecords, calculates success % and the
    corresponding cashback tier, then creates / updates CourseCompletion.
    Returns the completion record, or None when the threshold isn't reached.
    Max cashback is capped at 15 % by the tier table.
    """
    grades = list(
        JournalRecord.objects
        .filter(lesson__package=package, activity_grade__isnull=False)
        .values_list('activity_grade', flat=True)
    )

    if not grades:
        logger.info(f'Package {package.pk}: no graded lessons, skipping cashback.')
        return None

    total_points = sum(grades)
    avg = total_points / len(grades)
    success_pct = Decimal(str(round(avg / 10 * 100, 4)))

    earned_discount = Decimal('0')
    for threshold, discount in CASHBACK_TIERS:
        if success_pct >= threshold:
            earned_discount = discount
            break

    logger.info(
        f'Package {package.pk}: success_pct={success_pct:.1f}%, '
        f'earned_discount={earned_discount}%'
    )

    if earned_discount == 0:
        return None

    completion, created = CourseCompletion.objects.update_or_create(
        student=package.student,
        course=package.course,
        defaults={
            'completed_lessons_count': len(grades),
            'total_points': total_points,
            'earned_discount': earned_discount,
            'is_discount_used': False,
            'completed_at': timezone.now(),
        },
    )

    # Link the package to this completion record
    package.completed = completion
    package.save(update_fields=['completed'])

    return completion


def get_bonus_balance(student) -> dict:
    """
    US14: returns bonus balance payload for a student.
    Includes unused cashback discounts and progress scale for the active package.
    """
    completions = list(
        CourseCompletion.objects
        .filter(student=student, is_discount_used=False, earned_discount__gt=0)
        .select_related('course')
        .order_by('-completed_at')
    )
    total_available = sum(c.earned_discount for c in completions) or Decimal('0')

    # Progress scale for the current active package
    active_package = Package.objects.filter(student=student, status='active').first()
    progress = None
    if active_package:
        grades = list(
            JournalRecord.objects
            .filter(lesson__package=active_package, activity_grade__isnull=False)
            .values_list('activity_grade', flat=True)
        )
        if grades:
            avg = sum(grades) / len(grades)
            current_pct = round(avg / 10 * 100, 1)

            next_tier = None
            for threshold, discount in CASHBACK_TIERS:
                if Decimal(str(current_pct)) < threshold:
                    next_tier = {
                        'threshold_pct': float(threshold),
                        'cashback_pct': float(discount),
                        'gap_pct': round(float(threshold) - current_pct, 1),
                    }
            # next_tier stays None when student already qualifies for the top tier

            progress = {
                'package_id': active_package.pk,
                'conducted_lessons': len(grades),
                'average_grade': round(avg, 2),
                'success_pct': current_pct,
                'next_bonus_tier': next_tier,
            }

    return {
        'available_cashback_pct': float(total_available),
        'unused_discounts': [
            {
                'course_id': c.course_id,
                'course_title': c.course.title,
                'cashback_pct': float(c.earned_discount),
                'completed_at': c.completed_at,
            }
            for c in completions
        ],
        'current_package_progress': progress,
    }
