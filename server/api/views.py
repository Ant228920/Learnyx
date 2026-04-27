import logging
import secrets
import string

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from django.db.models import Sum, Q
from django.db.models.functions import Coalesce

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, mixins, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.models import RegistrationRequest
from api.permissions import IsTeacher, IsStudent, IsManager
from api.serializers import (
    RegistrationRequestSerializer,
    SlotSerializer,
    LessonSerializer,
    LessonWithSlotSerializer,
    LessonCreateSerializer,
    LessonStatusSerializer,
    MeetingLinkSerializer,
    JournalRecordSerializer,
    JournalListSerializer,
    StudentListSerializer,
)
from users.models import User, Role, Student, Manager
from inventory.models import Package, Slot, Teacher, Lesson, JournalRecord, CourseCompletion
from api.services import calculate_cashback, get_bonus_balance, CASHBACK_TIERS

logger = logging.getLogger(__name__)


def generate_password(length=10):
    """Генерація безпечного випадкового пароля."""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class RegistrationRequestView(APIView):
    """Сценарій 1: Подача заявки гостем."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_request = serializer.save()

        try:
            send_mail(
                subject=f'Нова заявка на Learnyx: {reg_request.full_name}',
                message=f'ПІБ: {reg_request.full_name}\nEmail: {reg_request.email}\nРоль: {reg_request.role}',
                from_email=settings.DEFAULT_FROM_EMAIL, # Використовуємо стандартний параметр
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f'Failed to send notification email to manager: {e}')

        return Response({
            'message': 'Готово! Ваша заявка успішно відправлена менеджеру.',
            'id': reg_request.id
        }, status=status.HTTP_201_CREATED)


class ApproveRegistrationRequestView(APIView):
    """Сценарій 2: Апрув заявки менеджером та створення акаунту."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        reg_request = get_object_or_404(RegistrationRequest, pk=pk)

        if reg_request.status == 'approved':
            return Response({'message': 'Заявку вже оброблено.'}, status=status.HTTP_400_BAD_REQUEST)

        password = generate_password()

        try:
            with transaction.atomic():
                # Розбиваємо ім'я більш надійно
                name_parts = reg_request.full_name.strip().split(maxsplit=1)
                first_name = name_parts[0] if name_parts else "User"
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                role_obj, _ = Role.objects.get_or_create(name=reg_request.role)

                # Створення користувача
                user = User.objects.create_user(
                    username=reg_request.email, # email як унікальний логін
                    email=reg_request.email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone=reg_request.phone,
                    nickname=reg_request.telegram_nickname,
                    role_obj=role_obj,
                    is_approved=True,
                )

                # Створення профілю залежно від ролі
                if reg_request.role.lower() == 'student':
                    Student.objects.create(user=user)
                elif reg_request.role.lower() == 'manager':
                    Manager.objects.create(user=user)

                # Оновлення статусу заявки
                reg_request.status = 'approved'
                reg_request.save()

            # Відправка пароля користувачу (після завершення транзакції)
            send_mail(
                subject='Ваш акаунт на Learnyx створено!',
                message=f'Вітаємо, {first_name}!\n\nВаш акаунт активовано.\nЛогін: {reg_request.email}\nПароль: {password}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[reg_request.email],
                fail_silently=True,
            )

            return Response({
                'message': f'Акаунт для {reg_request.email} успішно створено.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Approve failed for request {pk}: {e}')
            return Response({'message': f'Помилка при створенні акаунту: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ActivatePackageView(APIView):
    """Активація навчального пакету."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        package = get_object_or_404(Package, pk=pk)

        if package.status == 'active':
            return Response({'message': 'Пакет вже активовано.'}, status=status.HTTP_400_BAD_REQUEST)

        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save()

        logger.info(f'Package {pk} activated by user {request.user.id}')

        return Response({
            'message': 'Пакет успішно активовано.',
            'package_id': package.id,
            'status': package.status,
            'balance': package.balance,
        }, status=status.HTTP_200_OK)


class StudentBalanceView(APIView):
    """Перегляд залишку занять учня."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        package = Package.objects.filter(student=student, status='active').first()

        if not package:
            return Response({
                'remaining_lessons': 0,
                'message': 'У вас немає активних підписок.',
            }, status=status.HTTP_200_OK)

        return Response({
            'remaining_lessons': package.balance,
            'total_lessons': package.total_lessons,
            'package_id': package.id,
            'status': package.status,
        }, status=status.HTTP_200_OK)


class SlotViewSet(viewsets.ModelViewSet):
    """US5 + US9: Teacher slot management — create with overlap check, delete if unbooked."""
    serializer_class = SlotSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Slot.objects.select_related('teacher__user').all()

        teacher_id = self.request.query_params.get('teacher_id')
        is_booked = self.request.query_params.get('is_booked')
        date = self.request.query_params.get('date')

        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if is_booked is not None:
            qs = qs.filter(is_booked=is_booked.lower() in ('true', '1'))
        if date:
            qs = qs.filter(start_time__date=date)

        return qs

    def perform_create(self, serializer):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        serializer.save(teacher=teacher)

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        if slot.is_booked:
            return Response(
                {'message': 'Неможливо видалити заброньований слот.'},
                status=status.HTTP_409_CONFLICT,
            )
        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LessonViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """US4 + US6: Lesson booking (atomic) and status update (atomic)."""

    def get_permissions(self):
        if self.action == 'create':
            return [(IsManager | IsStudent)()]
        if self.action in ('set_status', 'evaluate', 'set_meeting_link'):
            return [IsTeacher()]
        if self.action == 'cancel':
            return [IsStudent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return LessonCreateSerializer
        return LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related('slot', 'package').all()

        # Role-based scoping: students/teachers see only their own lessons
        user = self.request.user
        role = user.role_obj.name.lower() if user.role_obj else ''
        if role == 'student':
            student = Student.objects.filter(user=user).first()
            qs = qs.filter(student=student) if student else qs.none()
        elif role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            qs = qs.filter(slot__teacher=teacher) if teacher else qs.none()
        # manager sees all

        # Query-param filters (used by manager for US13-style filtering)
        p = self.request.query_params
        if p.get('status'):
            qs = qs.filter(status=p['status'])
        if p.get('date_from'):
            qs = qs.filter(slot__start_time__date__gte=p['date_from'])
        if p.get('date_to'):
            qs = qs.filter(slot__start_time__date__lte=p['date_to'])
        if p.get('teacher_id'):
            qs = qs.filter(slot__teacher_id=p['teacher_id'])

        return qs.order_by('slot__start_time')

    def create(self, request, *args, **kwargs):
        """US4: Book a lesson — slot + balance check inside a single transaction."""
        data = request.data.copy()
        if 'student' not in data:
            student = get_object_or_404(Student, user=request.user)
            data['student'] = student.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Lock both rows to prevent race conditions on concurrent booking
            slot = Slot.objects.select_for_update().get(
                pk=serializer.validated_data['slot'].pk
            )
            if slot.is_booked:
                return Response(
                    {'slot': 'Slot is already booked.'},
                    status=status.HTTP_409_CONFLICT,
                )

            package = Package.objects.select_for_update().get(
                pk=serializer.validated_data['package'].pk
            )
            if package.balance <= 0:
                return Response(
                    {'package': 'Package has no remaining lessons.'},
                    status=status.HTTP_409_CONFLICT,
                )

            slot.is_booked = True
            slot.save()

            lesson = serializer.save(slot=slot, package=package)

        logger.info(f'Lesson {lesson.id} booked: student {lesson.student_id}, slot {slot.id}')
        return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='status')
    def set_status(self, request, pk=None):
        """US6: Update lesson status — deduct package balance when conducted."""
        status_serializer = LessonStatusSerializer(data=request.data)
        status_serializer.is_valid(raise_exception=True)
        new_status = status_serializer.validated_data['status']

        terminal = {'conducted', 'cancelled', 'missed'}

        with transaction.atomic():
            lesson = Lesson.objects.select_for_update().get(pk=pk)

            if lesson.status in terminal:
                return Response(
                    {'status': f'Lesson already has a terminal status "{lesson.status}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            lesson.status = new_status
            lesson.save()

            package_balance_remaining = None
            cashback_earned = None
            if new_status == 'conducted':
                package = Package.objects.select_for_update().get(pk=lesson.package_id)
                package.balance = max(0, package.balance - 1)
                if package.balance == 0:
                    package.status = 'completed'
                package.save()
                package_balance_remaining = package.balance
                logger.info(
                    f'Lesson {lesson.id} conducted: package {package.id} balance → {package.balance}'
                )

                if package.status == 'completed':
                    completion = calculate_cashback(package)
                    if completion:
                        cashback_earned = float(completion.earned_discount)
                        logger.info(
                            f'Package {package.id} completed: cashback {cashback_earned}% awarded '
                            f'to student {package.student_id}'
                        )

        data = dict(LessonSerializer(lesson).data)
        if package_balance_remaining is not None:
            data['package_balance_remaining'] = package_balance_remaining
        if cashback_earned is not None:
            data['cashback_earned_pct'] = cashback_earned
        return Response(data)

    @action(detail=True, methods=['post'], url_path='evaluate')
    def evaluate(self, request, pk=None):
        """US7: Teacher fills in a JournalRecord for a lesson (create or update)."""
        lesson = get_object_or_404(Lesson, pk=pk)
        existing = JournalRecord.objects.filter(lesson=lesson).first()
        serializer = JournalRecordSerializer(existing, data=request.data, partial=bool(existing))
        serializer.is_valid(raise_exception=True)
        journal = serializer.save(lesson=lesson)
        code = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(JournalRecordSerializer(journal).data, status=code)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        """US10: Return the authenticated student's future lessons ordered by start time."""
        student = get_object_or_404(Student, user=request.user)
        qs = (
            Lesson.objects
            .filter(student=student, slot__start_time__gt=timezone.now())
            .select_related('slot')
            .order_by('slot__start_time')
        )
        return Response(LessonWithSlotSerializer(qs, many=True).data)

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        """US20: Student cancels their own scheduled lesson; slot freed atomically."""
        with transaction.atomic():
            lesson = Lesson.objects.select_related('slot').select_for_update().get(pk=pk)

            student = get_object_or_404(Student, user=request.user)
            if lesson.student_id != student.pk:
                return Response(
                    {'detail': 'You can only cancel your own lessons.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if lesson.status != 'scheduled':
                return Response(
                    {'detail': f'Cannot cancel a lesson with status "{lesson.status}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            if lesson.slot.start_time <= timezone.now():
                return Response(
                    {'detail': 'Cannot cancel a lesson that has already started.'},
                    status=status.HTTP_409_CONFLICT,
                )

            lesson.status = 'cancelled'
            lesson.save(update_fields=['status'])

            slot = lesson.slot
            slot.is_booked = False
            slot.save(update_fields=['is_booked'])

        logger.info(f'Lesson {lesson.pk} cancelled by student {student.pk}, slot {slot.pk} freed')
        return Response(LessonSerializer(lesson).data)

    @action(detail=True, methods=['patch'], url_path='meeting-link')
    def set_meeting_link(self, request, pk=None):
        """US21: Teacher sets the meeting link for a lesson."""
        serializer = MeetingLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson = get_object_or_404(
            Lesson.objects.select_related('slot__teacher'),
            pk=pk,
        )

        teacher = get_object_or_404(Teacher, user=request.user)
        if lesson.slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only set meeting links for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        lesson.meeting_link = serializer.validated_data['meeting_link']
        lesson.save(update_fields=['meeting_link'])

        return Response(LessonSerializer(lesson).data)


class BonusBalanceView(APIView):
    """US14: Student's cashback balance + current-package progress scale."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(Student, pk=student_id)
        return Response({'student_id': student_id, **get_bonus_balance(student)})


class StudentListView(generics.ListAPIView):
    """US8: Manager sees all students with their total active-package balance, ascending."""
    permission_classes = [IsManager]
    serializer_class = StudentListSerializer

    def get_queryset(self):
        return (
            Student.objects
            .select_related('user')
            .annotate(
                lessons_balance=Coalesce(
                    Sum('package__balance', filter=Q(package__status='active')),
                    0,
                )
            )
            .order_by('lessons_balance')
        )
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> d84ca05 (feat: implement US2/US3 student and teacher dashboards)


class StudentDashboardView(APIView):
    """US2: Aggregated dashboard for the authenticated student."""
    permission_classes = [IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        now = timezone.now()
        today = now.date()

        # --- balance block ---
        active_pkg = Package.objects.filter(student=student, status='active').first()
        balance = (
            {
                'remaining': active_pkg.balance,
                'total': active_pkg.total_lessons,
                'package_id': active_pkg.pk,
            }
            if active_pkg else None
        )

        # --- cashback block ---
        completions = CourseCompletion.objects.filter(
            student=student, is_discount_used=False, earned_discount__gt=0
        )
        available_cashback_pct = float(
            sum(c.earned_discount for c in completions) or 0
        )

        # --- next scheduled lesson ---
        next_lesson_obj = (
            Lesson.objects
            .filter(student=student, status='scheduled', slot__start_time__gt=now)
            .select_related('slot__teacher__user')
            .order_by('slot__start_time')
            .first()
        )
        next_lesson = None
        if next_lesson_obj:
            sl = next_lesson_obj.slot
            next_lesson = {
                'lesson_id': next_lesson_obj.pk,
                'start_time': sl.start_time,
                'end_time': sl.end_time,
                'meeting_link': next_lesson_obj.meeting_link,
                'teacher': f'{sl.teacher.user.first_name} {sl.teacher.user.last_name}'.strip(),
            }

        # --- today's lessons ---
        today_qs = (
            Lesson.objects
            .filter(student=student, status='scheduled', slot__start_time__date=today)
            .select_related('slot__teacher__user')
            .order_by('slot__start_time')
        )
        today_lessons = [
            {
                'lesson_id': l.pk,
                'start_time': l.slot.start_time,
                'end_time': l.slot.end_time,
                'meeting_link': l.meeting_link,
                'teacher': f'{l.slot.teacher.user.first_name} {l.slot.teacher.user.last_name}'.strip(),
            }
            for l in today_qs
        ]

        # --- bonus progress for the active package ---
        bonus_progress = None
        if active_pkg:
            grades = list(
                JournalRecord.objects
                .filter(lesson__package=active_pkg, activity_grade__isnull=False)
                .values_list('activity_grade', flat=True)
            )
            if grades:
                from decimal import Decimal
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
                        break
                bonus_progress = {
                    'success_pct': current_pct,
                    'next_bonus_tier': next_tier,
                }

        return Response({
            'balance': balance,
            'available_cashback_pct': available_cashback_pct,
            'next_lesson': next_lesson,
            'today_lessons': today_lessons,
            'bonus_progress': bonus_progress,
        })


class TeacherDashboardView(APIView):
    """US3: Aggregated dashboard for the authenticated teacher."""
    permission_classes = [IsTeacher]

    def get(self, request):
        teacher = get_object_or_404(Teacher, user=request.user)
        now = timezone.now()
        today = now.date()

        # --- today's schedule ---
        today_slots = list(
            Slot.objects
            .filter(teacher=teacher, start_time__date=today)
            .order_by('start_time')
        )
        # One query for all lessons on those slots
        lessons_by_slot = {
            l.slot_id: l
            for l in Lesson.objects
            .filter(slot__in=today_slots)
            .select_related('student__user', 'curriculum_lesson')
        }

        today_lessons = []
        for slot in today_slots:
            lesson = lessons_by_slot.get(slot.pk)
            delta_seconds = (slot.start_time - now).total_seconds()
            # can_start: within the 10-minute window before start, or lesson already ongoing
            can_start = delta_seconds <= 600

            today_lessons.append({
                'slot_id': slot.pk,
                'lesson_id': lesson.pk if lesson else None,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'student_name': (
                    f'{lesson.student.user.first_name} {lesson.student.user.last_name}'.strip()
                    if lesson else None
                ),
                'topic': lesson.curriculum_lesson.title if lesson and lesson.curriculum_lesson else None,
                'meeting_link': lesson.meeting_link if lesson else None,
                'lesson_status': lesson.status if lesson else None,
                'can_start': can_start,
            })

        # --- stats ---
        total_students = (
            Lesson.objects
            .filter(slot__teacher=teacher)
            .values('student')
            .distinct()
            .count()
        )
        conducted_lessons = Lesson.objects.filter(
            slot__teacher=teacher, status='conducted'
        ).count()

        return Response({
            'today_lessons': today_lessons,
            'stats': {
                'total_students': total_students,
                'conducted_lessons': conducted_lessons,
                'materials_count': 0,   # US22 (LessonMaterial model) not yet implemented
            },
        })
<<<<<<< HEAD


class JournalListView(generics.ListAPIView):
    """Student views their own journal records ordered by lesson date descending."""
    permission_classes = [IsStudent]
    serializer_class = JournalListSerializer

    def get_queryset(self):
        student = get_object_or_404(Student, user=self.request.user)
        return (
            JournalRecord.objects
            .filter(lesson__student=student)
            .select_related('lesson__slot')
            .order_by('-lesson__slot__start_time')
        )
=======
>>>>>>> 0d0d56b (feat: implement US8 student list with annotated lesson balance)
=======
>>>>>>> d84ca05 (feat: implement US2/US3 student and teacher dashboards)
