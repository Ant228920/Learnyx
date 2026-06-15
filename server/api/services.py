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
from inventory.models import Package, JournalRecord, CourseCompletion, Slot

logger = logging.getLogger(__name__)


def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def notify_manager_low_balance(package) -> None:
    """
    LEAR-79: Warn manager by email when a student's package balance drops below 2.
    Called after the lesson-status transaction commits.
    Errors are logged but never raised — must not affect the lesson update response.
    """
    if package.low_balance_notified:
        return

    student = package.student
    user = student.user
    if package.discipline:
        discipline = package.discipline.name
    elif package.course and package.course.discipline:
        discipline = package.course.discipline.name
    else:
        discipline = '—'
    try:
        send_mail(
            subject=f'Учень {user.get_full_name()}: залишилось {package.balance} занять',
            message=(
                f'ПІБ: {user.get_full_name()}\n'
                f'Email: {user.email}\n'
                f'Телефон: {user.phone or "—"}\n'
                f'Дисципліна: {discipline}\n'
                f'Залишок занять: {package.balance}\n'
                f'ID пакету: {package.pk}\n'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.MANAGER_EMAIL],
            fail_silently=False,
        )
        package.low_balance_notified = True
        package.save(update_fields=['low_balance_notified'])
        logger.info(f'Low-balance email sent for package {package.pk} (balance={package.balance})')
    except Exception as e:
        logger.warning(f'Failed to send low-balance email for package {package.pk}: {e}')


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
    (Decimal('90'), Decimal('15')),  # 90-100% → 15%
    (Decimal('70'), Decimal('10')),  # 70-89%  → 10%
    (Decimal('50'), Decimal('5')),   # 50-69%  → 5%
]


def calculate_bonus_progress(package) -> dict:
    """
    US15: success scale for a package based on JournalRecords.
    Each lesson is worth up to 20 points (activity_grade + homework_grade,
    both 0-10), so max_points = package.total_lessons * 20. success_pct is
    earned_points / max_points, mapped to a tier via CASHBACK_TIERS.
    """
    records = list(
        JournalRecord.objects
        .filter(lesson__package=package)
        .values_list('activity_grade', 'homework_grade')
    )

    max_points = package.total_lessons * 20
    earned_points = sum((a or 0) + (h or 0) for a, h in records)
    success_pct = Decimal(str(round(earned_points / max_points * 100, 4))) if max_points else Decimal('0')

    bonus_pct = Decimal('0')
    for threshold, discount in CASHBACK_TIERS:
        if success_pct >= threshold:
            bonus_pct = discount
            break

    next_bonus_tier = None
    for threshold, discount in reversed(CASHBACK_TIERS):
        if success_pct < threshold:
            next_bonus_tier = {
                'threshold_pct': float(threshold),
                'cashback_pct': float(discount),
                'gap_pct': float(threshold - success_pct),
            }
            break

    return {
        'graded_lessons': len(records),
        'earned_points': earned_points,
        'max_points': max_points,
        'success_pct': float(success_pct),
        'bonus_pct': float(bonus_pct),
        'next_bonus_tier': next_bonus_tier,
    }


@transaction.atomic
def calculate_cashback(package) -> 'CourseCompletion | None':
    """
    US15: called inside an atomic block when package.status → 'completed'.
    Uses calculate_bonus_progress() to find the success % and the
    corresponding cashback tier, then creates / updates CourseCompletion.
    Returns the completion record, or None when the threshold isn't reached.
    Max cashback is capped at 15 % by the tier table.

    @transaction.atomic creates a savepoint when called from within an outer
    transaction (set_status), so any failure here rolls back only the
    cashback writes — the outer transaction then decides whether to commit
    or roll back the entire set_status chain.
    """
    progress = calculate_bonus_progress(package)

    if progress['graded_lessons'] == 0:
        logger.info(f'Package {package.pk}: no graded lessons, skipping cashback.')
        return None

    earned_discount = Decimal(str(progress['bonus_pct']))

    logger.info(
        f"Package {package.pk}: success_pct={progress['success_pct']:.1f}%, "
        f'earned_discount={earned_discount}%'
    )

    if earned_discount == 0:
        return None

    completion, created = CourseCompletion.objects.update_or_create(
        student=package.student,
        course=package.course,
        defaults={
            'completed_lessons_count': progress['graded_lessons'],
            'total_points': progress['earned_points'],
            'earned_discount': earned_discount,
            'is_discount_used': False,
            'completed_at': timezone.now(),
        },
    )

    # Link the package to this completion record
    package.completed = completion
    package.save(update_fields=['completed'])

    return completion


def mark_lesson_conducted(lesson) -> dict:
    """
    US6/US7: Transition `lesson` to 'conducted' — frees its slot, deducts one
    lesson from the package balance, and (if the package thereby completes)
    awards cashback via calculate_cashback().

    Caller must hold a row lock on `lesson` (select_for_update) inside an
    atomic block; this function locks and updates the related Package itself.

    Returns a dict with:
      - 'package_balance_remaining': int
      - 'cashback_earned_pct': float | None
      - 'low_balance_package': Package | None (set when balance <= 2)
    """
    lesson.status = 'conducted'
    lesson.save(update_fields=['status'])

    Slot.objects.filter(pk=lesson.slot_id).update(status='available')

    package = Package.objects.select_for_update().get(pk=lesson.package_id)
    package.balance = max(0, package.balance - 1)
    if package.balance == 0:
        package.status = 'completed'
    package.save()
    logger.info(f'Lesson {lesson.id} conducted: package {package.id} balance → {package.balance}')

    cashback_earned = None
    if package.status == 'completed':
        completion = calculate_cashback(package)
        if completion:
            cashback_earned = float(completion.earned_discount)
            logger.info(
                f'Package {package.id} completed: cashback {cashback_earned}% awarded '
                f'to student {package.student_id}'
            )

    return {
        'package_balance_remaining': package.balance,
        'cashback_earned_pct': cashback_earned,
        'low_balance_package': package if package.balance <= 2 else None,
    }


def purchase_package(package, student) -> dict:
    """
    LEAR-203: Activate a package with optional split-payment bonus discount.
    Finds the best unexpired CourseCompletion discount (<= 180 days old),
    applies it to final_price, and commits everything in one ACID transaction.
    """
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(days=180)
    completion = (
        CourseCompletion.objects
        .filter(student=student, is_discount_used=False, earned_discount__gt=0, completed_at__gte=cutoff)
        .order_by('-earned_discount')
        .first()
    )

    discount_pct = completion.earned_discount if completion else Decimal('0')
    original_price = package.final_price
    final_price = (original_price * (1 - discount_pct / Decimal('100'))).quantize(Decimal('0.01'))

    with transaction.atomic():
        pkg = Package.objects.select_for_update().get(pk=package.pk)
        if pkg.status == 'active':
            raise ValueError('Package is already active.')

        pkg.status = 'active'
        pkg.purchased_at = timezone.now()
        if discount_pct > 0:
            pkg.final_price = final_price
            pkg.discount = discount_pct
        pkg.save()

        if completion:
            completion.is_discount_used = True
            completion.save(update_fields=['is_discount_used'])

    return {
        'package_id': pkg.pk,
        'final_price': float(final_price),
        'discount_applied': discount_pct > 0,
        'discount_pct': float(discount_pct),
    }


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
        bp = calculate_bonus_progress(active_package)
        progress = {
            'package_id': active_package.pk,
            'earned_points': bp['earned_points'],
            'max_points': bp['max_points'],
            'success_pct': bp['success_pct'],
            'bonus_pct': bp['bonus_pct'],
            'next_bonus_tier': bp['next_bonus_tier'],
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
