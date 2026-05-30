import csv
import logging
import secrets
import string

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
    HomeworkSerializer,
    HomeworkGradeSerializer,
    GradeEntrySerializer,
    LessonArchiveSerializer,
    PackagePlanSerializer,
    StudentAvailablePackageSerializer,
    ManagerPackageSerializer,
    TeacherListSerializer,
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
from users.models import User, Role, Student, Manager, Review, StudentLevel
from inventory.models import Package, Slot, Teacher, Lesson, JournalRecord, CourseCompletion, PackagePlan, Course, LearningRequest, Complaint, LessonMaterial
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

        if reg_request.role.lower() == 'student':
            reg_request.subject = request.data.get('subject', reg_request.subject)
            reg_request.level = request.data.get('level', reg_request.level)
            if not reg_request.subject or not reg_request.level:
                return Response(
                    {'error': 'Для учня обов\'язково вкажіть subject і level при апруві.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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

                if reg_request.role.lower() == 'student':
                    student_level = None
                    if reg_request.level:
                        student_level, _ = StudentLevel.objects.get_or_create(name=reg_request.level)
                    student_obj = Student.objects.create(user=user, level=student_level)
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
                    Teacher.objects.get_or_create(user=user)
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
        qs = Slot.objects.select_related('teacher__user').all()

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
        """LEAR-141: Available (unbooked) slots with nested teacher info."""
        qs = Slot.objects.filter(status='available').select_related('teacher__user')
        teacher_id = request.query_params.get('teacher_id')
        date = request.query_params.get('date')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if date:
            qs = qs.filter(start_time__date=date)
        return Response(SlotAvailableSerializer(qs, many=True).data)


class LessonViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """US4 + US6: Lesson booking (atomic) and status update (atomic)."""

    def get_permissions(self):
        if self.action == 'create':
            return [(IsManager | IsStudent)()]
        if self.action in ('set_status', 'evaluate', 'set_meeting_link', 'homework'):
            return [IsTeacher()]
        if self.action == 'assign':
            return [(IsTeacher | IsManager)()]
        if self.action in ('upcoming', 'cancel', 'submit_homework'):
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
        with transaction.atomic():
            lesson = Lesson.objects.select_for_update().get(pk=pk)

            if lesson.status in terminal:
                return Response(
                    {'status': f'Lesson already has a terminal status "{lesson.status}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            lesson.status = new_status
            lesson.save()

            if new_status in {'conducted', 'student_missed', 'teacher_missed'}:
                Slot.objects.filter(pk=lesson.slot_id).update(status='available')

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

                if package.balance < 2:
                    low_balance_package = package

                if package.status == 'completed':
                    completion = calculate_cashback(package)
                    if completion:
                        cashback_earned = float(completion.earned_discount)
                        logger.info(
                            f'Package {package.id} completed: cashback {cashback_earned}% awarded '
                            f'to student {package.student_id}'
                        )

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

            lesson.status = 'canceled_advance'
            lesson.save(update_fields=['status'])

            slot = lesson.slot
            slot.status = 'available'
            slot.save(update_fields=['status'])

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

    @action(detail=False, methods=['post'], url_path='assign')
    def assign(self, request):
        """LEAR-182: Teacher or Manager assigns a student to a slot (atomic)."""
        serializer = AssignLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        slot = serializer.validated_data['slot']
        student = serializer.validated_data['student']
        curriculum_lesson = serializer.validated_data.get('curriculum_lesson')

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

            lesson = Lesson.objects.create(
                slot=slot,
                student=student,
                package=package,
                curriculum_lesson=curriculum_lesson,
            )

        logger.info(f'Lesson {lesson.id} assigned by user {request.user.id}: student {student.pk}, slot {slot.pk}')
        return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='homework')
    def homework(self, request, pk=None):
        """LEAR-186: Teacher sets homework text (and optional URL) on a conducted lesson."""
        lesson = get_object_or_404(Lesson.objects.select_related('slot__teacher'), pk=pk)

        teacher = get_object_or_404(Teacher, user=request.user)
        if lesson.slot.teacher_id != teacher.pk:
            return Response(
                {'detail': 'You can only add homework for your own lessons.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if lesson.status not in ('conducted', 'scheduled'):
            return Response(
                {'detail': 'Homework can only be added for conducted or scheduled lessons.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = HomeworkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record, created = JournalRecord.objects.get_or_create(lesson=lesson)
        record.teacher_homework_task = serializer.validated_data['teacher_homework_task']
        record.homework_answer_url = serializer.validated_data.get('homework_answer_url') or ''
        record.save(update_fields=['teacher_homework_task', 'homework_answer_url'])

        material = None
        uploaded_file = serializer.validated_data.get('file')
        if uploaded_file:
            from api.dropbox_storage import upload_lesson_material
            title = serializer.validated_data.get('file_title') or 'Homework material'
            dropbox_url = upload_lesson_material(lesson.pk, uploaded_file, notify_email=request.user.email)
            material = LessonMaterial.objects.create(
                lesson=lesson,
                uploaded_by=teacher,
                title=title,
                file_url=dropbox_url,
            )
            logger.info(
                f'Homework material "{title}" attached to lesson {lesson.pk} by teacher {teacher.pk}'
            )


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

        answer_url = request.data.get('homework_answer_url', '')
        if not answer_url:
            return Response(
                {'detail': 'homework_answer_url is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record, _ = JournalRecord.objects.get_or_create(lesson=lesson)
        # Store up to 2000 chars (CharField max_length is 255, but we store a URL or short data ref)
        record.homework_answer_url = str(answer_url)[:255]
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
        base_qs = Student.objects.select_related('user', 'level').annotate(
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
                'level': t.level.name if t.level else None,
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
                'materials_count': LessonMaterial.objects.filter(uploaded_by=teacher).count(),
            },
        })


class JournalListView(generics.ListAPIView):
    """Journal records: student sees own, teacher sees records for their lessons."""
    permission_classes = [IsStudent | IsTeacher | IsManager]
    serializer_class = JournalListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = JournalRecord.objects.select_related('lesson__slot')
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
            'slot__teacher__user', 'student__user', 'package__discipline'
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
    Activate a pre-created Package record (status: available → active).
    Any authenticated user with a Student profile can purchase their own package.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {'detail': 'У вас немає профілю студента.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        package = get_object_or_404(Package, pk=pk)

        if package.student_id != student.pk:
            return Response(
                {'detail': 'Цей пакет не належить вам.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if package.status == 'active':
            return Response(
                {'detail': 'Цей пакет вже активний.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block purchase if student already has a different active package
        existing_active = Package.objects.filter(student=student, status='active').exclude(pk=pk).first()
        if existing_active:
            return Response(
                {'detail': 'У вас вже є активний абонемент. Завершіть поточний курс перед покупкою нового.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if package.status != 'available':
            return Response(
                {'detail': 'Цей пакет недоступний для покупки.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save(update_fields=['status', 'purchased_at'])

        logger.info(f'Package {pk} purchased by student {student.pk}')

        package.status = 'active'
        package.purchased_at = timezone.now()
        package.save(update_fields=['status', 'purchased_at', 'final_price', 'discount'])

        logger.info(f'Package {pk} purchased by student {student.pk}')

        return Response({
            'package_id': package.id,
            'total_lessons': package.total_lessons,
            'balance': package.balance,
            'final_price': float(package.final_price),
            'status': package.status,
            'message': f'Пакет на {package.total_lessons} уроків успішно придбано!',
        }, status=status.HTTP_201_CREATED)


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

        course = Course.objects.filter(is_active=True).first()
        if not course:
            return Response(
                {'detail': 'Немає доступних курсів. Зверніться до менеджера.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.money_balance -= final_price
        student.save(update_fields=['money_balance'])

        pkg = Package.objects.create(
            student=student,
            course=course,
            total_lessons=plan.total_lessons,
            balance=plan.total_lessons,
            final_price=final_price,
            discount=Decimal(str(bonus_pct)),
            status='active',
        )

        return Response({
            'message': f'Абонемент на {plan.total_lessons} уроків придбано!',
            'package_id': pkg.id,
            'total_lessons': plan.total_lessons,
            'final_price': str(final_price),
        }, status=status.HTTP_201_CREATED)


class TeacherFinancesView(APIView):
    """Teacher's conducted-lesson transaction history."""
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
                'id': lesson.id,
                'date': st.strftime('%d.%m.%Y') if st else '—',
                'time': (
                    f"{st.strftime('%H:%M')} - {et.strftime('%H:%M')}"
                    if st and et else '—'
                ),
                'student_name': (
                    f"{lesson.student.user.first_name} {lesson.student.user.last_name}".strip()
                    or lesson.student.user.email
                ),
                'amount': 250,
                'status': 'paid',
                'lesson_id': lesson.id,
            })

        total = len(transactions) * 250
        return Response({
            'transactions': transactions,
            'total_earned': total,
            'lessons_count': len(transactions),
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
    """LEAR-266: Student submits a complaint; Manager lists all complaints."""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [IsManager()]

    def get(self, request):
        qs = (
            Complaint.objects
            .select_related('student__user', 'lesson__slot__teacher__user')
            .all()
        )
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(ComplaintListSerializer(qs, many=True).data)

    def post(self, request):
        serializer = ComplaintCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        student = get_object_or_404(Student, user=request.user)
        complaint = serializer.save(student=student)
        return Response(
            ComplaintListSerializer(complaint).data,
            status=status.HTTP_201_CREATED,
        )


class ComplaintDetailView(APIView):
    """LEAR-266: Manager updates complaint status; sets reviewed_at automatically."""
    permission_classes = [IsManager]

    def patch(self, request, pk):
        complaint = get_object_or_404(
            Complaint.objects.select_related('student__user', 'lesson__slot__teacher__user'),
            pk=pk,
        )
        serializer = ComplaintStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint.status = serializer.validated_data['status']
        if complaint.status == Complaint.Status.REVIEWED:
            complaint.reviewed_at = timezone.now()
        complaint.save()
        return Response(ComplaintListSerializer(complaint).data)


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
