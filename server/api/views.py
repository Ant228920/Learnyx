import csv
import logging
import secrets
import string
from datetime import timedelta

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404

from django.db.models import Sum, Q
from django.db.models.functions import Coalesce

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, mixins, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser

from api.models import RegistrationRequest
from api.permissions import IsTeacher, IsStudent, IsManager
from api.serializers import (
    RegistrationRequestSerializer,
    SlotSerializer,
    SlotAvailableSerializer,
    LessonSerializer,
    LessonWithSlotSerializer,
    LessonCreateSerializer,
    LessonStatusSerializer,
    MeetingLinkSerializer,
    JournalRecordSerializer,
    JournalListSerializer,
    StudentListSerializer,
    AvailableStudentSerializer,
    AssignLessonSerializer,
    HomeworkGradeSerializer,
    LessonArchiveSerializer,
    PackagePlanSerializer,
    StudentAvailablePackageSerializer,
    ManagerPackageSerializer,
    LearningRequestSerializer,
    LearningRequestCreateSerializer,
    ReviewSerializer,
    ComplaintCreateSerializer,
    ComplaintListSerializer,
    ComplaintStatusSerializer,
    LessonMaterialUploadSerializer,
    LessonMaterialListSerializer,
    HomeworkDetailSerializer,
    HomeworkSubmitSerializer,
)
from users.models import User, Role, Student, Manager, Review, TeacherLevel
from inventory.models import Package, Slot, Teacher, Lesson, JournalRecord, CourseCompletion, PackagePlan, Course, LearningRequest, Complaint, LessonMaterial, Discipline
from api.services import calculate_cashback, get_bonus_balance, CASHBACK_TIERS, notify_manager_low_balance

logger = logging.getLogger(__name__)


def generate_password(length=10):
    """Генерація безпечного випадкового пароля."""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


class RegistrationRequestView(APIView):
    """Сценарій 1: Подача заявки гостем / перегляд заявок менеджером."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsManager()]
        return [AllowAny()]

    def get(self, request):
        requests = RegistrationRequest.objects.filter(status='new').order_by('-created_at')
        serializer = RegistrationRequestSerializer(requests, many=True)
        return Response(serializer.data)

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


class ApplicantRejectView(APIView):
    permission_classes = [IsManager]

    def post(self, request, pk):
        try:
            req = RegistrationRequest.objects.get(pk=pk)
            req.status = 'rejected'
            req.save()
            return Response({'message': 'Заявку відхилено.'})
        except RegistrationRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class ApproveRegistrationRequestView(APIView):
    """Сценарій 2: Апрув заявки менеджером та створення акаунту."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        reg_request = get_object_or_404(RegistrationRequest, pk=pk)

        # Idempotent — return 200 if already approved (not 400)
        if reg_request.status == 'approved':
            return Response({'message': 'Заявку вже оброблено.'}, status=status.HTTP_200_OK)

        if User.objects.filter(phone=reg_request.phone).exists():
            return Response({'error': 'Користувач з таким телефоном вже існує'}, status=status.HTTP_400_BAD_REQUEST)

        password = generate_password()

        try:
            with transaction.atomic():
                name_parts = reg_request.full_name.strip().split(maxsplit=1)
                first_name = name_parts[0] if name_parts else "User"
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                role_name = reg_request.role.strip().capitalize()
                role_obj, _ = Role.objects.get_or_create(name=role_name)

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
                user.is_approved = True
                user.save(update_fields=['is_approved'])

                if reg_request.role.lower() == 'student':
                    student_obj = Student.objects.create(user=user)
                    # Create 3 available package options for this student
                    course = Course.objects.first()
                    if course:
                        for pkg_data in [
                            {'total_lessons': 8,  'balance': 8,  'final_price': '2400.00', 'discount': '0.00', 'status': 'available'},
                            {'total_lessons': 10, 'balance': 10, 'final_price': '2900.00', 'discount': '0.00', 'status': 'available'},
                            {'total_lessons': 12, 'balance': 12, 'final_price': '3400.00', 'discount': '0.00', 'status': 'available'},
                        ]:
                            Package.objects.create(student=student_obj, course=course, **pkg_data)
                elif reg_request.role.lower() == 'teacher':
                    teacher, _ = Teacher.objects.get_or_create(user=user)
                    if reg_request.subject:
                        discipline = Discipline.objects.filter(name__iexact=reg_request.subject).first()
                        if discipline:
                            teacher.discipline = discipline
                    if reg_request.level:
                        teacher_level = TeacherLevel.objects.filter(name__iexact=reg_request.level).first()
                        if teacher_level:
                            teacher.level = teacher_level
                    if teacher.discipline_id or teacher.level_id:
                        teacher.save()
                elif reg_request.role.lower() == 'manager':
                    Manager.objects.create(user=user)

                reg_request.status = 'approved'
                reg_request.save()

            try:
                send_mail(
                    subject='Ваш акаунт на Learnyx створено!',
                    message=f'Вітаємо, {first_name}!\n\nВаш акаунт активовано.\nЛогін: {reg_request.email}\nПароль: {password}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[reg_request.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f'Failed to send welcome email to {reg_request.email}: {e}')

            return Response({
                'message': f'Акаунт для {reg_request.email} успішно створено.',
                'user_id': user.id,
                'email': reg_request.email,
                'temporary_password': password,
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
    """US5 + US9 + LEAR-127: Teacher slot management — create, delete, partial_update."""
    serializer_class = SlotSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'partial_update'):
            return [IsTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Slot.objects.select_related('teacher__user').order_by('start_time')

        user = self.request.user
        role = user.role_obj.name.lower() if user.role_obj else ''
        if role == 'teacher':
            try:
                teacher = Teacher.objects.get(user=user)
                qs = qs.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                return qs.none()

        teacher_id = self.request.query_params.get('teacher_id')
        slot_status = self.request.query_params.get('status')
        date = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if slot_status:
            qs = qs.filter(status=slot_status)

        if start_date or end_date:
            if start_date:
                qs = qs.filter(start_time__date__gte=start_date)
            if end_date:
                qs = qs.filter(start_time__date__lte=end_date)
        elif date:
            qs = qs.filter(start_time__date=date)

        return qs

    def perform_create(self, serializer):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        serializer.save(teacher=teacher)

    def update(self, request, *args, **kwargs):
        """LEAR-127: Only the slot's owner can PATCH; booked slots are frozen."""
        slot = self.get_object()
        teacher = get_object_or_404(Teacher, user=request.user)
        if slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only edit your own slots.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if slot.status == 'booked':
            return Response(
                {'detail': 'Cannot edit a booked slot.'},
                status=status.HTTP_409_CONFLICT,
            )
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        if slot.status == 'booked':
            return Response(
                {'message': 'Неможливо видалити заброньований слот.'},
                status=status.HTTP_409_CONFLICT,
            )
        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """LEAR-141: Available (unbooked) slots with nested teacher info.

        Ordered chronologically and limited to future slots so callers (e.g.
        ManagerMatching) pick the teacher's earliest free slot as the anchor
        for /lessons/assign/ — keeping the resulting schedule gap-free.
        """
        qs = Slot.objects.filter(
            status='available', start_time__gt=timezone.now(),
        ).select_related('teacher__user').order_by('start_time')
        teacher_id = request.query_params.get('teacher_id')
        date = request.query_params.get('date')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if date:
            qs = qs.filter(start_time__date=date)
        return Response(SlotAvailableSerializer(qs, many=True).data)


# Maps the day names used by ManagerMatching.tsx to JS-style weekday numbers (Sunday=0).
DAY_MAP = {
    'Понеділок': 1, 'Вівторок': 2, 'Середа': 3,
    'Четвер': 4, "П'ятниця": 5, 'Субота': 6, 'Неділя': 0,
}


def slot_matches_request(slot, student_slots):
    """Check whether slot.start_time falls in one of the student's requested day/time windows.

    Slot times are stored as naive wall-clock values (the UTC field's weekday/hour/minute
    equal the Kyiv wall-clock values the teacher entered — see getKyivComponents in
    ManagerMatching.tsx), so the UTC components are read directly without converting timezones.
    """
    slot_dt = slot.start_time
    slot_day = slot_dt.weekday() + 1  # Python Monday=0 -> 1
    if slot_day == 7:
        slot_day = 0  # Sunday -> 0
    slot_minutes = slot_dt.hour * 60 + slot_dt.minute

    for req in student_slots:
        req_day = DAY_MAP.get(req.get('day', ''))
        if req_day is None or slot_day != req_day:
            continue
        try:
            fh, fm = map(int, req.get('from', '00:00').split(':'))
        except (ValueError, AttributeError):
            continue
        req_from = fh * 60 + fm
        req_to = req_from + 60  # 1-hour window
        if req_from <= slot_minutes < req_to:
            return True
    return False


class LessonViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """US4 + US6: Lesson booking (atomic) and status update (atomic)."""

    def get_permissions(self):
        if self.action == 'create':
            return [(IsManager | IsStudent)()]
        if self.action in ('set_status', 'evaluate', 'set_meeting_link', 'homework'):
            return [IsTeacher()]
        if self.action == 'assign':
            return [(IsTeacher | IsManager)()]
        if self.action == 'cancel':
            return [(IsStudent | IsTeacher)()]
        if self.action in ('upcoming', 'submit_homework'):
            return [IsStudent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return LessonCreateSerializer
        return LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related('slot', 'package', 'student__user').all()

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
            if slot.status == 'booked':
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

            slot.status = 'booked'
            slot.save(update_fields=['status'])

            lesson = serializer.save(slot=slot, package=package)

        logger.info(f'Lesson {lesson.id} booked: student {lesson.student_id}, slot {slot.id}')
        return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='status')
    def set_status(self, request, pk=None):
        """US6: Update lesson status — deduct package balance when conducted."""
        status_serializer = LessonStatusSerializer(data=request.data)
        status_serializer.is_valid(raise_exception=True)
        new_status = status_serializer.validated_data['status']

        terminal = {'conducted', 'canceled_advance', 'student_missed', 'teacher_missed'}

        low_balance_package = None
        package_balance_remaining = None
        cashback_earned = None
        with transaction.atomic():
            lesson = Lesson.objects.select_for_update().get(pk=pk)

            if lesson.status in terminal:
                return Response(
                    {'status': f'Lesson already has a terminal status "{lesson.status}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            if new_status == 'conducted':
                result = mark_lesson_conducted(lesson)
                package_balance_remaining = result['package_balance_remaining']
                cashback_earned = result['cashback_earned_pct']
                low_balance_package = result['low_balance_package']
            else:
                lesson.status = new_status
                lesson.save()

                if new_status in {'student_missed', 'teacher_missed'}:
                    Slot.objects.filter(pk=lesson.slot_id).update(status='available')

        if low_balance_package is not None:
            notify_manager_low_balance(low_balance_package)

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
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        # Force activity_grade=0 when student/teacher missed — serializer only allows 0–10
        if not data.get('is_present', True):
            data['activity_grade'] = 0
        serializer = JournalRecordSerializer(existing, data=data, partial=bool(existing))
        serializer.is_valid(raise_exception=True)
        journal = serializer.save(lesson=lesson)

        # Save additional fields not handled by the main serializer
        update_fields = []

        lesson_topic = request.data.get('lesson_topic', '')
        if lesson_topic:
            journal.lesson_topic = lesson_topic
            update_fields.append('lesson_topic')

        hw_file = request.data.get('homework_file_url', '')
        hw_task = request.data.get('teacher_homework_task', '')
        hw_filename = request.data.get('homework_filename', 'homework.pdf')

        if hw_file and hw_file.startswith('data:'):
            from api.storage import DropboxStorage
            hw_file = DropboxStorage().upload(hw_file, hw_filename, '/learnyx/tasks')

        if hw_file:
            journal.homework_file_url = hw_file
            update_fields.append('homework_file_url')
        if hw_task:
            journal.teacher_homework_task = hw_task
            update_fields.append('teacher_homework_task')

        # Teacher graded 0 for homework the student never submitted —
        # close the submission window for good.
        if journal.homework_grade == 0 and not journal.homework_answer_url:
            journal.homework_overdue = True
            update_fields.append('homework_overdue')

        if update_fields:
            journal.save(update_fields=update_fields)

        # US7: a graded lesson is automatically considered conducted — apply
        # the same side effects as PATCH /status (frees slot, deducts package
        # balance, awards cashback on completion).
        low_balance_package = None
        if lesson.status == 'scheduled':
            with transaction.atomic():
                lesson = Lesson.objects.select_for_update().get(pk=lesson.pk)
                if lesson.status == 'scheduled':
                    result = mark_lesson_conducted(lesson)
                    low_balance_package = result['low_balance_package']

        if low_balance_package is not None:
            notify_manager_low_balance(low_balance_package)

        code = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(JournalRecordSerializer(journal).data, status=code)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        """US10: Return the authenticated student's future scheduled lessons."""
        student = get_object_or_404(Student, user=request.user)
        qs = (
            Lesson.objects
            .filter(student=student, status='scheduled', slot__start_time__gt=timezone.now())
            .select_related('slot')
            .order_by('slot__start_time')
        )
        return Response(LessonWithSlotSerializer(qs, many=True).data)

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        """US20: Student or teacher cancels a scheduled lesson; slot freed atomically."""
        with transaction.atomic():
            # of=('self',) scopes the row lock to the Lesson table only — curriculum_lesson
            # is a nullable FK, and Postgres rejects FOR UPDATE on the nullable side of
            # the resulting LEFT OUTER JOIN if the lock isn't scoped this way.
            lesson = Lesson.objects.select_related(
                'slot__teacher__user', 'package', 'curriculum_lesson', 'student'
            ).select_for_update(of=('self',)).get(pk=pk)

            role = request.user.role_obj.name.lower() if request.user.role_obj else ''
            if role == 'teacher':
                if lesson.slot.teacher.user != request.user:
                    return Response(
                        {'detail': 'You can only cancel your own lessons.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                student = get_object_or_404(Student, user=request.user)
                if lesson.student_id != student.pk:
                    return Response(
                        {'detail': 'You can only cancel your own lessons.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            if lesson.status == 'canceled_advance':
                return Response({'message': 'Урок вже скасовано.'})

            if lesson.status != 'scheduled':
                return Response(
                    {'detail': f'Cannot cancel a lesson with status "{lesson.status}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            lesson.status = 'canceled_advance'
            lesson.save(update_fields=['status'])

            slot = lesson.slot
            slot.status = 'available'
            slot.save(update_fields=['status'])

            # Whoever cancels (student or teacher), try to auto-reschedule the same
            # student to the same weekday & time in one of the next 12 weeks, reusing
            # the cancelled lesson's package so the student's balance is unaffected.
            rescheduled = False
            for weeks_ahead in range(1, 13):
                target_start = slot.start_time + timedelta(weeks=weeks_ahead)
                candidate = Slot.objects.filter(
                    teacher=slot.teacher, status='available', start_time=target_start,
                ).first()
                if candidate is None:
                    continue

                candidate = Slot.objects.select_for_update().get(pk=candidate.pk)
                if candidate.status != 'available':
                    continue

                conflict = Lesson.objects.filter(
                    student=lesson.student,
                    status='scheduled',
                    slot__start_time__lt=candidate.end_time,
                    slot__end_time__gt=candidate.start_time,
                ).exists()
                if conflict:
                    continue

                # Lesson.slot is a OneToOneField — a slot that previously held a
                # cancelled/conducted lesson already owns a row, so recycle it
                # instead of creating a new one (would violate the unique constraint).
                stale = Lesson.objects.filter(slot=candidate).exclude(status='scheduled').first()
                if stale:
                    stale.student = lesson.student
                    stale.package = lesson.package
                    stale.curriculum_lesson = lesson.curriculum_lesson
                    stale.status = 'scheduled'
                    stale.meeting_link = None
                    stale.save(update_fields=['student', 'package', 'curriculum_lesson', 'status', 'meeting_link'])
                else:
                    Lesson.objects.create(
                        slot=candidate,
                        student=lesson.student,
                        package=lesson.package,
                        curriculum_lesson=lesson.curriculum_lesson,
                    )

                candidate.status = 'booked'
                candidate.save(update_fields=['status'])
                rescheduled = True
                break

        logger.info(
            f'Lesson {lesson.pk} cancelled by {role} {request.user.pk}, slot {slot.pk} freed'
            + (', rescheduled to next available week' if rescheduled else '')
        )
        data = dict(LessonSerializer(lesson).data)
        data['rescheduled'] = rescheduled
        data['message'] = (
            'Урок скасовано. Заняття перенесено на наступний тиждень.' if rescheduled
            else 'Урок скасовано.'
        )
        return Response(data)

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

    @action(detail=False, methods=['post'], url_path='assign')
    def assign(self, request):
        """LEAR-182: Teacher or Manager assigns a student to a slot (atomic).

        Books the requested slot, then fills the rest of the package's
        remaining balance with the teacher's next available slots that match
        the student's requested day/time windows (student_slots), so the
        whole package gets a schedule in one go.
        """
        serializer = AssignLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        slot = serializer.validated_data['slot']
        student = serializer.validated_data['student']
        curriculum_lesson = serializer.validated_data.get('curriculum_lesson')
        student_slots = request.data.get('student_slots', [])

        # Idempotency: a retried assign call (e.g. the frontend re-submitting
        # after the first call already filled the package) should report what
        # is already scheduled instead of failing on an already-booked slot.
        existing = Lesson.objects.filter(
            student=student,
            slot__teacher_id=slot.teacher_id,
            status='scheduled',
        ).count()
        if existing > 0:
            return Response({
                'message': f'Учню вже призначено {existing} занять з цим викладачем.',
                'lessons_count': existing,
            }, status=status.HTTP_200_OK)

        # Teachers must own the slot; managers can assign any slot
        role = getattr(getattr(request.user, 'role_obj', None), 'name', '').lower()
        if role == 'teacher':
            teacher = get_object_or_404(Teacher, user=request.user)
            if slot.teacher_id != teacher.pk:
                return Response(
                    {'detail': 'You can only assign students to your own slots.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Resolve package: use supplied or pick student's active package
        package = serializer.validated_data.get('package')
        if package is None:
            package = Package.objects.filter(student=student, status='active').first()
            if package is None:
                return Response(
                    {'detail': 'Student has no active package.'},
                    status=status.HTTP_409_CONFLICT,
                )

        if package.student_id != student.pk:
            return Response(
                {'detail': 'Package does not belong to this student.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if package.balance <= 0:
            return Response({'detail': 'Package has no remaining lessons.'}, status=status.HTTP_409_CONFLICT)

        def book_lesson(target_slot):
            """Create a Lesson for target_slot, or recycle a stale one.

            Lesson.slot is a OneToOneField, so a slot that previously held a
            cancelled/conducted lesson already owns a row at that slot_id —
            inserting a new Lesson would violate the unique constraint.
            Reuse that row (re-scheduling it) instead of creating a new one.
            """
            stale = Lesson.objects.filter(slot=target_slot).exclude(status='scheduled').first()
            if stale:
                stale.student = student
                stale.package = package
                stale.curriculum_lesson = curriculum_lesson
                stale.status = 'scheduled'
                stale.meeting_link = None
                stale.save(update_fields=['student', 'package', 'curriculum_lesson', 'status', 'meeting_link'])
                return stale
            return Lesson.objects.create(
                slot=target_slot,
                student=student,
                package=package,
                curriculum_lesson=curriculum_lesson,
            )

        created_lessons = []
        with transaction.atomic():
            slot = Slot.objects.select_for_update().get(pk=slot.pk)
            if slot.status == 'booked':
                return Response({'detail': 'Slot is already booked.'}, status=status.HTTP_409_CONFLICT)

            # Check student is free at this slot's time
            conflict = Lesson.objects.filter(
                student=student,
                status='scheduled',
                slot__start_time__lt=slot.end_time,
                slot__end_time__gt=slot.start_time,
            ).exists()
            if conflict:
                return Response(
                    {'detail': 'Student already has a lesson at this time.'},
                    status=status.HTTP_409_CONFLICT,
                )

            slot.status = 'booked'
            slot.save(update_fields=['status'])

            created_lessons.append(book_lesson(slot))

            # Fill the rest of the package balance with the teacher's next available slots
            # that match the student's requested day/time windows (if provided).
            remaining = package.balance - 1
            if remaining > 0:
                candidate_slots = Slot.objects.filter(
                    teacher_id=slot.teacher_id, status='available', start_time__gt=timezone.now(),
                ).exclude(pk=slot.pk).order_by('start_time')

                if student_slots:
                    candidate_slots = [s for s in candidate_slots if slot_matches_request(s, student_slots)]

                extra_slot_ids = [s.pk for s in candidate_slots][:remaining]
                for extra_slot_id in extra_slot_ids:
                    extra_slot = Slot.objects.select_for_update().get(pk=extra_slot_id)
                    if extra_slot.status != 'available':
                        continue

                    overlap = Lesson.objects.filter(
                        student=student,
                        status='scheduled',
                        slot__start_time__lt=extra_slot.end_time,
                        slot__end_time__gt=extra_slot.start_time,
                    ).exists()
                    if overlap:
                        continue

                    extra_slot.status = 'booked'
                    extra_slot.save(update_fields=['status'])

                    created_lessons.append(book_lesson(extra_slot))

        logger.info(
            f'{len(created_lessons)} lesson(s) assigned by user {request.user.id}: '
            f'student {student.pk}, package {package.pk}'
        )
        return Response({
            'message': f'Успішно призначено {len(created_lessons)} занять.',
            'lessons_count': len(created_lessons),
            'lessons': LessonSerializer(created_lessons, many=True).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='homework')
    def homework(self, request, pk=None):
        """Teacher sets homework task, optional teacher file, optional student answer — with Dropbox upload."""
        from api.storage import DropboxStorage
        storage = DropboxStorage()

        lesson = get_object_or_404(Lesson.objects.select_related('slot__teacher'), pk=pk)

        teacher = get_object_or_404(Teacher, user=request.user)
        if lesson.slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only add homework for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        record, created = JournalRecord.objects.get_or_create(lesson=lesson)
        homework_was_empty = not bool(record.teacher_homework_task)

        data = request.data

        # Teacher's homework file (base64 → Dropbox)
        hw_file = data.get('homework_file_url', '')
        filename = data.get('filename', 'homework.pdf')
        if hw_file and hw_file.startswith('data:'):
            hw_file = storage.upload(hw_file, filename, '/learnyx/tasks')
        if hw_file:
            record.homework_file_url = hw_file

        # Homework task text
        task = data.get('teacher_homework_task')
        if task:
            record.teacher_homework_task = task

        record.save()


        http_status = status.HTTP_201_CREATED if (created or homework_was_empty) else status.HTTP_200_OK
        return Response(JournalRecordSerializer(record).data, status=http_status)

    @action(detail=True, methods=['patch'], url_path='homework/grade')
    def grade_homework(self, request, pk=None):
        """LEAR-75: Teacher grades a student's homework (1–10) on a conducted lesson."""
        lesson = get_object_or_404(Lesson.objects.select_related('slot__teacher'), pk=pk)

        teacher = get_object_or_404(Teacher, user=request.user)
        if lesson.slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only grade homework for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HomeworkGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record, _ = JournalRecord.objects.get_or_create(lesson=lesson)
        grade = serializer.validated_data['homework_grade']
        record.homework_grade = grade
        record.homework_status = JournalRecord.HomeworkStatus.REVIEWED
        record.reviewed_at = timezone.now()
        update_fields = ['homework_grade', 'homework_status', 'reviewed_at']

        if grade == 0 and not record.homework_answer_url:
            record.homework_overdue = True
            update_fields.append('homework_overdue')

        record.save(update_fields=update_fields)

        # If the package already completed before this homework was graded,
        # recompute cashback now that the grade is in (calculate_cashback is
        # idempotent — it updates the existing CourseCompletion record).
        package = lesson.package
        if package.status == 'completed':
            try:
                calculate_cashback(package)
            except Exception as e:
                logger.error(f'Cashback recompute error for package {package.pk}: {e}')

        return Response(JournalRecordSerializer(record).data)

    @action(detail=True, methods=['post'], url_path='homework/grade/reset')
    def reset_homework_grade(self, request, pk=None):
        """LEAR-rollback: Teacher resets homework grade back to submitted state."""
        lesson = self.get_object()
        teacher = get_object_or_404(Teacher, user=request.user)

        if lesson.slot.teacher_id != teacher.pk:
            return Response({'error': 'Немає доступу'}, status=status.HTTP_403_FORBIDDEN)

        try:
            record = JournalRecord.objects.get(lesson=lesson)
        except JournalRecord.DoesNotExist:
            return Response({'error': 'ДЗ не знайдено'}, status=status.HTTP_404_NOT_FOUND)

        if record.homework_status != JournalRecord.HomeworkStatus.REVIEWED:
            return Response(
                {'error': 'Оцінку можна скасувати тільки якщо статус reviewed'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            record.homework_grade = None
            record.homework_status = JournalRecord.HomeworkStatus.SUBMITTED
            record.reviewed_at = None
            record.save(update_fields=['homework_grade', 'homework_status', 'reviewed_at'])

        return Response(JournalRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='submit-homework')
    def submit_homework(self, request, pk=None):
        """Student submits homework answer URL for a lesson."""
        lesson = get_object_or_404(Lesson.objects.select_related('student'), pk=pk)
        student = get_object_or_404(Student, user=request.user)

        if lesson.student_id != student.pk:
            return Response(
                {'detail': 'You can only submit homework for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        record = JournalRecord.objects.filter(lesson=lesson).first()
        if record and record.homework_overdue:
            return Response(
                {'detail': 'Термін здачі домашнього завдання минув. Оцінка вже виставлена.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer_url = request.data.get('homework_answer_url', '')
        if not answer_url:
            return Response(
                {'detail': 'homework_answer_url is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if answer_url.startswith('data:'):
            try:
                import io
                import base64 as _b64
                from api.dropbox_storage import upload_homework_file

                header, encoded = answer_url.split(',', 1)
                mime = header.split(':')[1].split(';')[0] if ':' in header else 'application/octet-stream'
                ext = mime.split('/')[1] if '/' in mime else 'bin'
                file_bytes = _b64.b64decode(encoded)

                class _FileLike:
                    def __init__(self, data: bytes, name: str):
                        self._buf = io.BytesIO(data)
                        self.name = name
                    def read(self):
                        return self._buf.read()

                buf = _FileLike(file_bytes, f'homework.{ext}')
                answer_url = upload_homework_file(lesson.pk, student.pk, buf, notify_email=request.user.email)
            except Exception as e:
                logger.error(f'Dropbox upload failed in submit_homework: {e}')

        record, _ = JournalRecord.objects.get_or_create(lesson=lesson)
        record.homework_answer_url = answer_url
        record.homework_status = JournalRecord.HomeworkStatus.SUBMITTED
        record.homework_submitted_at = timezone.now()
        record.save(update_fields=['homework_answer_url', 'homework_status', 'homework_submitted_at'])

        return Response(JournalRecordSerializer(record).data, status=status.HTTP_200_OK)


class BonusBalanceView(APIView):
    """US14: Student's cashback balance + current-package progress scale."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(Student, pk=student_id)
        return Response({'student_id': student_id, **get_bonus_balance(student)})


class StudentReportView(APIView):
    """LEAR-84: Student's grade report split into lesson_grades and homework_grades."""
    permission_classes = [IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)

        qs = (
            JournalRecord.objects
            .filter(lesson__student=student)
            .select_related(
                'lesson__slot__teacher__user',
                'lesson__package__discipline',
                'lesson__package__course__discipline',
            )
            .order_by('lesson__slot__start_time')
        )

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(lesson__slot__start_time__date__gte=start_date)
        if end_date:
            qs = qs.filter(lesson__slot__start_time__date__lte=end_date)

        lesson_grades = []
        homework_grades = []

        for record in qs:
            lesson = record.lesson
            slot = lesson.slot
            teacher_u = slot.teacher.user
            pkg = lesson.package
            discipline = None
            if pkg:
                if pkg.discipline:
                    discipline = pkg.discipline.name
                elif pkg.course and pkg.course.discipline:
                    discipline = pkg.course.discipline.name

            base = {
                'lesson_id': lesson.pk,
                'date': slot.start_time,
                'discipline': discipline,
                'teacher_name': f'{teacher_u.first_name} {teacher_u.last_name}'.strip(),
            }

            if record.grade is not None:
                lesson_grades.append({**base, 'grade': record.grade})

            if record.homework_grade is not None:
                homework_grades.append({**base, 'grade': record.homework_grade})

        return Response({
            'lesson_grades': lesson_grades,
            'homework_grades': homework_grades,
        })


class StudentListView(generics.ListAPIView):
    """US8: Manager or Teacher sees all students with their total active-package balance, ascending."""
    permission_classes = [IsManager | IsTeacher]
    serializer_class = StudentListSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'role_obj', None), 'name', '').lower()
        base_qs = Student.objects.select_related('user').prefetch_related(
            'packages', 'learning_requests',
        ).annotate(
            lessons_balance=Coalesce(
                Sum('packages__balance', filter=Q(packages__status='active')),
                0,
            )
        )
        if role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                return Student.objects.none()
            return base_qs.filter(lessons__slot__teacher=teacher).distinct().order_by('lessons_balance')
        return base_qs.order_by('lessons_balance')


class TeacherListView(APIView):
    """Manager fetches all registered teachers."""
    permission_classes = [IsManager]

    def get(self, request):
        teachers = Teacher.objects.select_related('user', 'user__role_obj', 'discipline', 'level').filter(
            user__is_approved=True
        )
        data = [
            {
                'user_id': t.user.id,
                'email': t.user.email,
                'first_name': t.user.first_name,
                'last_name': t.user.last_name,
                'phone': t.user.phone or None,
                'telegram_nickname': t.user.nickname or None,
                'discipline': t.discipline.name if t.discipline else None,
                'discipline_name': t.discipline.name if t.discipline else None,
                'level': t.level.name if t.level else None,
                'level_name': t.level.name if t.level else None,
            }
            for t in teachers
        ]
        return Response(data)


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
                'lesson_id': lesson.pk,
                'start_time': lesson.slot.start_time,
                'end_time': lesson.slot.end_time,
                'meeting_link': lesson.meeting_link,
                'teacher': f'{lesson.slot.teacher.user.first_name} {lesson.slot.teacher.user.last_name}'.strip(),
            }
            for lesson in today_qs
        ]

        # --- bonus progress for the active package ---
        bonus_progress = None
        if active_pkg:
            bp = calculate_bonus_progress(active_pkg)
            bonus_progress = {
                'earned_points': bp['earned_points'],
                'max_points': bp['max_points'],
                'success_pct': bp['success_pct'],
                'bonus_pct': bp['bonus_pct'],
                'next_bonus_tier': bp['next_bonus_tier'],
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
            lesson.slot_id: lesson
            for lesson in Lesson.objects
            .filter(slot__in=today_slots)
            .select_related('student__user', 'curriculum_lesson')
        }

        today_lessons = []
        for slot in today_slots:
            lesson = lessons_by_slot.get(slot.pk)
            delta_seconds = (slot.start_time - now).total_seconds()
            # can_start: within the 10-minute window before start, or lesson already ongoing
            can_start = delta_seconds <= 600

            has_rejected = (
                Complaint.objects.filter(lesson=lesson, status='rejected').exists()
                if lesson else False
            )

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
                'has_rejected_complaint': has_rejected,
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
                'materials_count': LessonMaterial.objects.filter(uploaded_by=teacher).count(),
            },
        })


class JournalListView(generics.ListAPIView):
    """Journal records: student sees own, teacher sees records for their lessons."""
    permission_classes = [IsStudent | IsTeacher | IsManager]
    serializer_class = JournalListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = JournalRecord.objects.select_related(
            'lesson__slot__teacher__discipline',
            'lesson__student__user',
            'lesson__package__discipline',
            'lesson__package__course__discipline',
        )
        lesson_id = self.request.query_params.get('lesson_id')

        try:
            teacher = Teacher.objects.get(user=user)
            qs = qs.filter(lesson__slot__teacher=teacher)
        except Teacher.DoesNotExist:
            try:
                student = Student.objects.get(user=user)
                qs = qs.filter(lesson__student=student)
            except Student.DoesNotExist:
                pass  # Manager: no ownership filter

        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        return qs.order_by('-lesson__slot__start_time')


class AvailableStudentListView(generics.ListAPIView):
    """LEAR-182: Teacher or Manager sees students free at a given slot's time (?slot_id=X)."""
    permission_classes = [IsTeacher | IsManager]
    serializer_class = AvailableStudentSerializer

    def get_queryset(self):
        slot_id = self.request.query_params.get('slot_id')
        if not slot_id:
            return Student.objects.none()
        slot = get_object_or_404(Slot, pk=slot_id)

        busy_ids = Lesson.objects.filter(
            status='scheduled',
            slot__start_time__lt=slot.end_time,
            slot__end_time__gt=slot.start_time,
        ).values_list('student_id', flat=True)

        qs = (
            Student.objects
            .select_related('user')
            .filter(packages__balance__gt=0, packages__status='active')
            .exclude(pk__in=busy_ids)
            .distinct()
        )

        teacher = Teacher.objects.filter(user=self.request.user).first()
        if teacher:
            already_ids = Lesson.objects.filter(
                status='scheduled',
                slot__teacher=teacher,
            ).values_list('student_id', flat=True)
            qs = qs.exclude(pk__in=already_ids)

        return qs


class LessonArchiveView(generics.ListAPIView):
    """LEAR-189/190: Manager's lesson archive with filters and optional CSV export."""
    permission_classes = [IsManager]
    serializer_class = LessonArchiveSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related(
            'slot__teacher__user', 'slot__teacher__discipline',
            'student__user',
            'package__discipline', 'package__course__discipline',
        )
        p = self.request.query_params
        if p.get('date_from'):
            qs = qs.filter(slot__start_time__date__gte=p['date_from'])
        if p.get('date_to'):
            qs = qs.filter(slot__start_time__date__lte=p['date_to'])
        statuses = p.getlist('status')
        if statuses:
            qs = qs.filter(status__in=statuses)
        if p.get('teacher_id'):
            qs = qs.filter(slot__teacher_id=p['teacher_id'])
        return qs.order_by('slot__start_time')

    def list(self, request, *args, **kwargs):
        if request.query_params.get('export') == 'csv':
            return self._export_csv()
        return super().list(request, *args, **kwargs)

    def _export_csv(self):
        qs = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="lessons_archive.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Status', 'Start Time', 'End Time', 'Teacher', 'Student', 'Package ID'])
        for lesson in qs:
            t = lesson.slot.teacher.user
            s = lesson.student.user
            writer.writerow([
                lesson.pk,
                lesson.status,
                lesson.slot.start_time,
                lesson.slot.end_time,
                f'{t.first_name} {t.last_name}'.strip(),
                f'{s.first_name} {s.last_name}'.strip(),
                lesson.package_id,
            ])
        return response


class PackagePlanListView(generics.ListAPIView):
    """
    GET /packages/                  → all active PackagePlans (plans to buy)
    GET /packages/?status=available → student's own available Package records
    GET /packages/?status=active    → manager: all active packages; student: own active packages
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        role = getattr(getattr(user, 'role_obj', None), 'name', '').lower()
        if role in ('manager', 'admin') and self.request.query_params.get('status'):
            return ManagerPackageSerializer
        if role == 'student' and self.request.query_params.get('status'):
            return StudentAvailablePackageSerializer
        return PackagePlanSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'role_obj', None), 'name', '').lower()
        status_param = self.request.query_params.get('status')

        if role in ('manager', 'admin') and status_param:
            return (
                Package.objects
                .select_related('student__user')
                .filter(status=status_param)
                .order_by('-purchased_at')
            )

        if role == 'student' and status_param:
            student = Student.objects.filter(user=user).first()
            if not student:
                return Package.objects.none()
            return Package.objects.filter(student=student, status=status_param).order_by('total_lessons')

        return PackagePlan.objects.filter(is_active=True)


class PackagePurchaseView(APIView):
    """
    POST /packages/<pk>/purchase/
    pk is always a PackagePlan id (from the catalog). Creates a new active Package for the student.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from decimal import Decimal

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {'detail': 'У вас немає профілю студента.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        plan = get_object_or_404(PackagePlan, pk=pk, is_active=True)

        if Package.objects.filter(student=student, status='active').exists():
            return Response(
                {'detail': 'У вас вже є активний абонемент. Завершіть поточний перед покупкою нового.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bonus_pct = max(0, min(15, int(request.data.get('bonus_discount_pct', 0) or 0)))
        base_price = Decimal(str(plan.price))
        final_price = base_price * (Decimal('1') - Decimal(str(bonus_pct)) / Decimal('100'))

        wallet_balance = Decimal(str(student.money_balance or 0))
        if wallet_balance < final_price:
            return Response(
                {'detail': f'Недостатньо коштів. Ваш баланс: ₴{wallet_balance:.0f}. Потрібно: ₴{final_price:.0f}. Поповніть рахунок.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.money_balance = wallet_balance - final_price
        student.save(update_fields=['money_balance'])

        package = Package.objects.create(
            student=student,
            course=Course.objects.filter(is_active=True).first(),
            total_lessons=plan.total_lessons,
            balance=plan.total_lessons,
            final_price=final_price,
            discount=Decimal(str(bonus_pct)),
            status='active',
        )

        if bonus_pct > 0:
            completion = CourseCompletion.objects.filter(
                student=student, is_discount_used=False, earned_discount__gt=0,
            ).order_by('-earned_discount').first()
            if completion:
                completion.is_discount_used = True
                completion.save(update_fields=['is_discount_used'])

        logger.info(f'Package {package.pk} (plan {pk}) purchased by student {student.pk}')

        return Response({
            'message': f'Абонемент на {plan.total_lessons} уроків успішно придбано!',
            'package_id': package.id,
            'total_lessons': package.total_lessons,
            'balance': package.balance,
            'final_price': str(final_price),
            'discount_applied': f'{bonus_pct}%' if bonus_pct > 0 else 'Без знижки',
        }, status=status.HTTP_200_OK)


class StudentWalletView(APIView):
    """Returns student money balance + bonus discount info."""
    permission_classes = [IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        bonus = get_bonus_balance(student)
        return Response({
            'money_balance': float(student.money_balance),
            'bonus_discount_pct': bonus.get('available_cashback_pct', 0),
            'bonus_description': bonus.get('description', ''),
        })


class StudentBalanceTopUpView(APIView):
    """Simulated top-up: adds money to student wallet balance."""
    permission_classes = [IsStudent]

    def post(self, request):
        from decimal import Decimal
        amount = request.data.get('amount', 500)
        try:
            amount = float(amount)
            if amount <= 0 or amount > 10000:
                return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        student = get_object_or_404(Student, user=request.user)
        student.money_balance += Decimal(str(amount))
        student.save(update_fields=['money_balance'])
        return Response({
            'money_balance': float(student.money_balance),
            'added': amount,
            'message': f'Баланс поповнено на ₴{amount:.0f}',
        })


class PackagePlanCatalogView(APIView):
    """GET /package-plans/ — list active PackagePlan templates for students."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = PackagePlan.objects.filter(is_active=True).order_by('total_lessons')
        data = [
            {
                'id': p.id,
                'total_lessons': p.total_lessons,
                'price': str(p.price),
                'description': p.description,
            }
            for p in plans
        ]
        return Response(data)


class PackagePlanPurchaseView(APIView):
    """POST /package-plans/<pk>/purchase/ — create an active Package from a plan template."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from decimal import Decimal

        plan = get_object_or_404(PackagePlan, pk=pk, is_active=True)
        student = get_object_or_404(Student, user=request.user)

        existing = Package.objects.filter(student=student, status='active').first()
        if existing:
            return Response(
                {'detail': 'У вас вже є активний абонемент.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bonus_pct = int(request.data.get('bonus_discount_pct', 0) or 0)
        base_price = Decimal(str(plan.price))
        final_price = base_price * (Decimal('1') - Decimal(str(bonus_pct)) / Decimal('100'))

        if student.money_balance < final_price:
            return Response(
                {'detail': f'Недостатньо коштів. Баланс: ₴{student.money_balance:.0f}. Потрібно: ₴{final_price:.0f}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.money_balance -= final_price
        student.save(update_fields=['money_balance'])

        pkg = Package.objects.create(
            student=student,
            course=Course.objects.filter(is_active=True).first(),
            total_lessons=plan.total_lessons,
            balance=plan.total_lessons,
            final_price=final_price,
            discount=Decimal(str(bonus_pct)),
            status='active',
        )

        if bonus_pct > 0:
            completion = CourseCompletion.objects.filter(
                student=student, is_discount_used=False, earned_discount__gt=0,
            ).order_by('-earned_discount').first()
            if completion:
                completion.is_discount_used = True
                completion.save(update_fields=['is_discount_used'])

        return Response({
            'message': f'Абонемент на {plan.total_lessons} уроків придбано!',
            'package_id': pkg.id,
            'total_lessons': plan.total_lessons,
            'final_price': str(final_price),
        }, status=status.HTTP_201_CREATED)


class TeacherFinancesView(APIView):
    """Teacher's conducted-lesson earnings and complaint-penalty history."""
    permission_classes = [IsTeacher]

    def get(self, request):
        teacher = get_object_or_404(Teacher, user=request.user)
        lessons = Lesson.objects.filter(
            slot__teacher=teacher,
            status='conducted',
        ).select_related('slot', 'student__user').order_by('-slot__start_time')

        transactions = []
        for lesson in lessons:
            st = lesson.slot.start_time
            et = lesson.slot.end_time
            transactions.append({
                'id': f'lesson-{lesson.id}',
                'date': st.strftime('%d.%m.%Y') if st else '—',
                'time': (
                    f"{st.strftime('%H:%M')} - {et.strftime('%H:%M')}"
                    if st and et else '—'
                ),
                'student_name': (
                    f"{lesson.student.user.first_name} {lesson.student.user.last_name}".strip()
                    or lesson.student.user.email
                ),
                'title': 'Проведений урок',
                'amount': 250,
                'is_penalty': False,
                'status': 'paid',
                'lesson_id': lesson.id,
                'sort_at': st,
            })

        penalties = Transaction.objects.filter(
            teacher=teacher, is_penalty=True,
        ).select_related('lesson__slot', 'lesson__student__user')

        for txn in penalties:
            penalty_lesson = txn.lesson
            slot = penalty_lesson.slot if penalty_lesson else None
            if penalty_lesson and penalty_lesson.student:
                student_name = (
                    f"{penalty_lesson.student.user.first_name} {penalty_lesson.student.user.last_name}".strip()
                    or penalty_lesson.student.user.email
                )
            else:
                student_name = '—'
            transactions.append({
                'id': f'penalty-{txn.id}',
                'date': txn.created_at.strftime('%d.%m.%Y'),
                'time': (
                    f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
                    if slot else '—'
                ),
                'student_name': student_name,
                'title': txn.title,
                'amount': float(txn.amount),
                'is_penalty': True,
                'status': 'penalty',
                'lesson_id': penalty_lesson.id if penalty_lesson else None,
                'sort_at': txn.created_at,
            })

        transactions.sort(key=lambda t: t['sort_at'], reverse=True)
        for t in transactions:
            del t['sort_at']

        total_earned = len(lessons) * 250
        total_penalties = sum(float(txn.amount) for txn in penalties)
        return Response({
            'transactions': transactions,
            'total_earned': total_earned,
            'total_penalties': total_penalties,
            'balance': total_earned - total_penalties,
            'lessons_count': len(lessons),
        })


class ManagerSubscriptionsView(APIView):
    """Manager view of purchased student packages (active + completed only, not available)."""
    permission_classes = [IsManager]

    def get(self, request):
        packages = Package.objects.select_related('student__user').filter(
            status__in=['active', 'completed']
        ).order_by('-purchased_at', '-id')

        data = []
        for pkg in packages:
            data.append({
                'id': pkg.id,
                'student_name': (
                    f"{pkg.student.user.first_name} {pkg.student.user.last_name}".strip()
                    or pkg.student.user.email
                ),
                'email': pkg.student.user.email,
                'total_lessons': pkg.total_lessons,
                'balance': pkg.balance,
                'used_lessons': pkg.total_lessons - pkg.balance,
                'final_price': float(pkg.final_price),
                'status': pkg.status,
                'purchased_at': pkg.purchased_at.strftime('%d.%m.%Y') if pkg.purchased_at else '—',
            })

        return Response({
            'subscriptions': data,
            'total_active': sum(1 for p in data if p['status'] == 'active'),
            'total_revenue': sum(p['final_price'] for p in data),
        })


class ProfileView(APIView):
    """Shared profile endpoint for all roles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': getattr(user, 'phone', '') or '',
            'telegram_nickname': getattr(user, 'nickname', '') or '',
            'role': user.role_obj.name if getattr(user, 'role_obj', None) else '',
        })

    def patch(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'telegram_nickname' in data:
            user.nickname = data['telegram_nickname']
        user.save()
        return Response({'message': 'Профіль оновлено успішно.'})


class StudentLearningRequestView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        qs = LearningRequest.objects.filter(student=student)
        return Response(LearningRequestSerializer(qs, many=True).data)

    def post(self, request):
        student = get_object_or_404(Student, user=request.user)
        serializer = LearningRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        req = serializer.save(student=student)
        return Response(LearningRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class ManagerLearningRequestsView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        qs = LearningRequest.objects.select_related('student__user').all()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(LearningRequestSerializer(qs, many=True).data)

    def patch(self, request, pk):
        req = get_object_or_404(LearningRequest, pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(LearningRequest.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = new_status
        req.save(update_fields=['status'])
        return Response(LearningRequestSerializer(req).data)


class ReviewView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        reviews = Review.objects.filter(is_visible=True).select_related('user').order_by('-created_at')
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LessonMaterialView(APIView):
    """LEAR-125: Teacher uploads / lists materials for a lesson."""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacher()]
        return [IsAuthenticated()]

    def get(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        qs = lesson.materials.select_related('uploaded_by__user').all()
        serializer = LessonMaterialListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson.objects.select_related('slot__teacher'), pk=lesson_id)
        teacher = get_object_or_404(Teacher, user=request.user)
        if lesson.slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only upload materials for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = LessonMaterialUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from api.dropbox_storage import upload_lesson_material
        dropbox_url = upload_lesson_material(lesson.pk, serializer.validated_data['file'], notify_email=request.user.email)
        material = LessonMaterial.objects.create(
            lesson=lesson,
            uploaded_by=teacher,
            title=serializer.validated_data['title'],
            file_url=dropbox_url,
        )
        return Response(
            LessonMaterialListSerializer(material, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ComplaintListCreateView(APIView):
    """LEAR-266: Manager lists all complaints; others see their own. Student creates via LessonComplaintView."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(getattr(request.user, 'role_obj', None), 'name', '').lower()

        qs = Complaint.objects.select_related(
            'student__user',
            'lesson__slot__teacher__user',
            'lesson__slot',
        ).order_by('-created_at')

        if role not in ('manager', 'admin'):
            # Students and teachers only see their own filed complaints
            try:
                student = Student.objects.get(user=request.user)
                qs = qs.filter(student=student)
            except Student.DoesNotExist:
                qs = qs.none()

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        data = []
        for c in qs:
            lesson = c.lesson
            slot = lesson.slot if lesson else None

            teacher_name = '—'
            try:
                if slot and slot.teacher and slot.teacher.user:
                    u = slot.teacher.user
                    teacher_name = f'{u.first_name} {u.last_name}'.strip() or u.email
            except Exception:
                pass

            student_user = c.student.user
            student_name = f'{student_user.first_name} {student_user.last_name}'.strip() or student_user.email

            lesson_date = '—'
            try:
                if slot and slot.start_time:
                    lesson_date = slot.start_time.strftime('%d.%m.%Y %H:%M')
            except Exception:
                pass

            # Reason field stores "reason_key: description" or just "reason_key"
            raw_reason = c.reason or ''
            if ':' in raw_reason:
                reason_key = raw_reason.split(':')[0].strip()
                description = raw_reason.split(':', 1)[1].strip()
            else:
                reason_key = raw_reason
                description = ''

            data.append({
                'id': c.id,
                'lesson_id': lesson.pk if lesson else None,
                'lesson_date': lesson_date,
                'teacher_name': teacher_name,
                'student_name': student_name,
                'filed_by_name': student_name,
                'reason': reason_key,
                'description': description,
                'status': c.status,
                'created_at': c.created_at.isoformat(),
                'reviewed_at': c.reviewed_at.isoformat() if c.reviewed_at else None,
            })

        return Response(data)


class ComplaintDetailView(APIView):
    """LEAR-266: Manager resolves a complaint — accept applies business logic, reject resets lesson."""
    permission_classes = [IsManager]

    def patch(self, request, pk):
        complaint = get_object_or_404(
            Complaint.objects.select_related('student__user', 'lesson__slot__teacher__user', 'lesson__student'),
            pk=pk,
        )

        decision = request.data.get('status')
        if decision not in ('accepted', 'rejected', 'reviewed'):
            return Response({'detail': 'Невірний статус.'}, status=status.HTTP_400_BAD_REQUEST)

        complaint.status = decision
        complaint.reviewed_at = timezone.now()
        complaint.save()

        lesson = complaint.lesson
        reason = (complaint.reason or '').split(':')[0].strip()

        if decision == 'accepted':
            if reason == 'teacher_missed':
                # Teacher failed to appear — mark lesson, student keeps package balance
                if lesson.status not in {'conducted', 'teacher_missed', 'canceled_advance'}:
                    lesson.status = 'teacher_missed'
                    lesson.save(update_fields=['status'])
                # Record financial penalty transaction for teacher
                try:
                    from inventory.models import Transaction
                    Transaction.objects.create(
                        teacher=lesson.slot.teacher,
                        lesson=lesson,
                        title='Штраф за пропущений урок',
                        amount=250,
                        is_penalty=True,
                    )
                except Exception as e:
                    logger.warning(f'Failed to create penalty transaction for complaint {pk}: {e}')
                return Response({'message': 'Скаргу прийнято. Урок позначено як пропущений викладачем.'})

            else:
                # student_missed or other — deduct from student package
                if lesson.status not in {'conducted', 'student_missed', 'canceled_advance', 'teacher_missed'}:
                    lesson.status = 'student_missed'
                    lesson.save(update_fields=['status'])
                try:
                    pkg = Package.objects.select_for_update().filter(
                        student=lesson.student, status='active'
                    ).first()
                    if pkg and pkg.balance > 0:
                        pkg.balance -= 1
                        if pkg.balance == 0:
                            pkg.status = 'completed'
                        pkg.save()
                        if pkg.balance <= 2:
                            notify_manager_low_balance(pkg)
                except Exception as e:
                    logger.warning(f'Could not deduct lesson balance for complaint {pk}: {e}')
                    pass
                try:
                    record, _ = JournalRecord.objects.get_or_create(lesson=lesson)
                    if record.activity_grade is None:
                        record.activity_grade = 0
                        record.save(update_fields=['activity_grade'])
                except Exception:
                    pass
                return Response({'message': 'Скаргу прийнято. Урок списано з балансу учня.'})

        elif decision == 'rejected':
            # Complaint invalid — reset lesson so teacher can grade it
            if lesson.status not in {'conducted', 'canceled_advance'}:
                lesson.status = 'scheduled'
                lesson.save(update_fields=['status'])
            # Clear any auto-set zero grade so teacher fills it properly
            try:
                record = JournalRecord.objects.filter(lesson=lesson).first()
                if record and record.activity_grade == 0:
                    record.activity_grade = None
                    record.save(update_fields=['activity_grade'])
            except Exception:
                pass
            return Response({
                'message': 'Скаргу відхилено. Викладач має виставити оцінку за урок.',
                'requires_teacher_action': True,
            })

        return Response({'message': 'Оновлено.'})


class LessonComplaintView(APIView):
    """Student files a complaint for a specific lesson via lesson ID."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        lesson = get_object_or_404(Lesson, pk=pk)
        reason = request.data.get('reason', 'teacher_missed')
        description = request.data.get('description', '')
        full_reason = f'{reason}: {description}'.strip(': ') if description else reason

        # Block duplicate pending complaints (allow re-filing after rejection/acceptance)
        existing_pending = Complaint.objects.filter(lesson=lesson, status='pending').first()
        if existing_pending:
            return Response({'message': 'Скаргу вже подано. Очікуйте рішення менеджера.'})

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            # Teacher filing a complaint — associate with the lesson's student
            student = lesson.student

        Complaint.objects.create(
            student=student,
            lesson=lesson,
            reason=full_reason,
        )

        return Response({'message': 'Скаргу подано успішно. Менеджер розгляне її найближчим часом.'})


class HomeworkDetailView(APIView):
    """LEAR-74: Student or lesson's Teacher can view homework details."""

    def get_permissions(self):
        return [IsAuthenticated()]

    def get(self, request, pk):
        record = get_object_or_404(
            JournalRecord.objects.select_related(
                'lesson__slot__teacher__user',
                'lesson__student__user',
                'lesson__package__discipline',
                'lesson__package__course__discipline',
            ),
            pk=pk,
        )
        lesson = record.lesson
        user = request.user
        role = user.role_obj.name.lower() if user.role_obj else ''

        if role == 'student':
            student = get_object_or_404(Student, user=user)
            if lesson.student_id != student.pk:
                return Response(
                    {'detail': 'You can only view your own homework.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif role == 'teacher':
            teacher = get_object_or_404(Teacher, user=user)
            if lesson.slot.teacher_id != teacher.pk:
                return Response(
                    {'detail': 'You can only view homework for your own lessons.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(HomeworkDetailSerializer(record, context={'request': request}).data)


class HomeworkSubmitView(APIView):
    """LEAR-74: Student submits (or re-submits) homework file."""
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser]

    def post(self, request, pk):
        record = get_object_or_404(
            JournalRecord.objects.select_related('lesson__student'),
            pk=pk,
        )
        student = get_object_or_404(Student, user=request.user)
        if record.lesson.student_id != student.pk:
            return Response(
                {'detail': 'You can only submit homework for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HomeworkSubmitSerializer(
            data=request.data,
            context={'record': record},
        )
        serializer.is_valid(raise_exception=True)

        from api.dropbox_storage import upload_homework_file
        dropbox_url = upload_homework_file(record.lesson.pk, student.pk, serializer.validated_data['file'], notify_email=request.user.email)
        record.homework_file_url = dropbox_url
        record.homework_status = JournalRecord.HomeworkStatus.SUBMITTED
        record.homework_submitted_at = timezone.now()
        record.save(update_fields=['homework_file_url', 'homework_status', 'homework_submitted_at'])

        return Response(HomeworkDetailSerializer(record, context={'request': request}).data)


class PackageCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {'detail': 'У вас немає профілю студента.'},
                status=status.HTTP_403_FORBIDDEN
            )

        package = get_object_or_404(Package, pk=pk, student=student)

        if package.status != 'active':
            return Response(
                {'detail': 'Можна скасувати лише активний абонемент.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        package.status = 'cancelled'
        package.save()

        return Response({'message': 'Абонемент скасовано.'})


class TeacherMaterialView(APIView):
    """Upload a material file to Dropbox and return its URL."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from api.storage import DropboxStorage
        storage = DropboxStorage()

        file_data = request.data.get('file_data', '')
        filename = request.data.get('filename', 'material.pdf')
        file_size = request.data.get('file_size', 0)

        if not file_data:
            return Response({'detail': 'Файл не надано.'}, status=status.HTTP_400_BAD_REQUEST)

        url = storage.upload(file_data, filename, '/learnyx/materials')

        return Response({'url': url, 'name': filename, 'size': file_size})
