from rest_framework import serializers
from api.models import RegistrationRequest
from inventory.models import Slot, Teacher, Lesson, Package, JournalRecord, CurriculumLesson, PackagePlan, LearningRequest, Complaint, LessonMaterial
from users.models import Student, Review


class RegistrationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationRequest
        fields = [
            'id', 'full_name', 'phone', 'email',
            'telegram_nickname', 'role', 'subject', 'level',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate(self, data):
        if data.get('role') == 'teacher':
            if not data.get('subject'):
                raise serializers.ValidationError(
                    {'subject': 'Поле subject обов\'язкове для викладача.'}
                )
            if not data.get('level'):
                raise serializers.ValidationError(
                    {'level': 'Поле level обов\'язкове для викладача.'}
                )
        return data


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ['id', 'teacher', 'start_time', 'end_time', 'status']
        read_only_fields = ['id', 'teacher', 'status']

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {'end_time': 'end_time must be after start_time.'}
            )

        request = self.context.get('request')
        if request and start_time and end_time:
            try:
                teacher = Teacher.objects.get(user=request.user)
            except Teacher.DoesNotExist:
                raise serializers.ValidationError('Current user has no Teacher profile.')

            overlap_qs = Slot.objects.filter(
                teacher=teacher,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
            if self.instance:
                overlap_qs = overlap_qs.exclude(pk=self.instance.pk)
            if overlap_qs.exists():
                raise serializers.ValidationError(
                    {'start_time': 'Slot overlaps with an existing slot.'}
                )

        return data


class LessonSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        try:
            u = obj.student.user
            return f'{u.first_name} {u.last_name}'.strip() or None
        except Exception:
            return None

    class Meta:
        model = Lesson
        fields = ['id', 'slot', 'student', 'student_name', 'package', 'curriculum_lesson', 'status', 'meeting_link']


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'slot', 'student', 'package', 'curriculum_lesson', 'meeting_link', 'status']
        read_only_fields = ['id', 'status']

    def validate(self, data):
        slot = data.get('slot')
        package = data.get('package')
        student = data.get('student')

        if slot and slot.status == 'booked':
            raise serializers.ValidationError({'slot': 'Slot is already booked.'})

        if package:
            if package.status != 'active':
                raise serializers.ValidationError({'package': 'Package is not active.'})
            if package.balance <= 0:
                raise serializers.ValidationError({'package': 'Package has no remaining lessons.'})
            if student and package.student != student:
                raise serializers.ValidationError({'package': 'Package does not belong to this student.'})

        return data


class LessonStatusSerializer(serializers.Serializer):
    VALID_STATUSES = ['conducted', 'canceled_advance', 'student_missed', 'teacher_missed']
    status = serializers.ChoiceField(choices=VALID_STATUSES)


class MeetingLinkSerializer(serializers.Serializer):
    meeting_link = serializers.URLField(max_length=255)


class JournalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalRecord
        fields = [
            'id', 'lesson', 'is_present', 'activity_grade',
            'teacher_homework_task', 'homework_answer_url',
            'homework_grade', 'teacher_notes',
        ]
        read_only_fields = ['id', 'lesson']

    def validate_activity_grade(self, value):
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError('activity_grade must be between 1 and 10.')
        return value

    def validate_homework_grade(self, value):
<<<<<<< HEAD
        # Allow 0 (not done) through 12 (extended scale used by teachers)
        if value is not None and not (0 <= value <= 12):
            raise serializers.ValidationError('homework_grade must be between 0 and 12.')
=======
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError('homework_grade must be between 1 and 10.')
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
        return value


class SlotInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ['id', 'start_time', 'end_time']


class LessonWithSlotSerializer(serializers.ModelSerializer):
    slot = SlotInlineSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'slot', 'student', 'package', 'curriculum_lesson', 'status', 'meeting_link']


class StudentListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField(source='user.phone', allow_null=True, default=None)
<<<<<<< HEAD
    telegram_nickname = serializers.CharField(source='user.nickname', allow_null=True, default=None)
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
    level = serializers.CharField(source='level.name', allow_null=True, default=None)
    lessons_balance = serializers.IntegerField()

    class Meta:
        model = Student
<<<<<<< HEAD
        fields = ['user_id', 'first_name', 'last_name', 'email', 'phone', 'telegram_nickname', 'level', 'lessons_balance']
=======
        fields = ['user_id', 'first_name', 'last_name', 'email', 'phone', 'level', 'lessons_balance']
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621


class JournalListSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source='lesson.slot.start_time', read_only=True)
    lesson_status = serializers.CharField(source='lesson.status', read_only=True)
<<<<<<< HEAD
    homework_status = serializers.CharField(read_only=True)
    student_name = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        u = obj.lesson.student.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

    class Meta:
        model = JournalRecord
        fields = [
            'id', 'lesson', 'start_time', 'lesson_status',
            'is_present', 'activity_grade', 'homework_grade',
            'teacher_homework_task', 'homework_answer_url', 'teacher_notes',
<<<<<<< HEAD
            'homework_status', 'student_name',
=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
        ]


# ── LEAR-141 ────────────────────────────────────────────────────────────────

class TeacherInlineSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')

    class Meta:
        model = Teacher
        fields = ['user_id', 'first_name', 'last_name']


class TeacherListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Teacher
        fields = ['user_id', 'first_name', 'last_name', 'email']


class SlotAvailableSerializer(serializers.ModelSerializer):
    teacher = TeacherInlineSerializer(read_only=True)

    class Meta:
        model = Slot
        fields = ['id', 'teacher', 'start_time', 'end_time', 'status']


# ── LEAR-182 ────────────────────────────────────────────────────────────────

class AvailableStudentSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Student
        fields = ['user_id', 'first_name', 'last_name', 'email']


class AssignLessonSerializer(serializers.Serializer):
    slot = serializers.PrimaryKeyRelatedField(queryset=Slot.objects.all())
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    package = serializers.PrimaryKeyRelatedField(queryset=Package.objects.all(), required=False, allow_null=True)
    curriculum_lesson = serializers.PrimaryKeyRelatedField(
        queryset=CurriculumLesson.objects.all(), required=False, allow_null=True
    )


# ── LEAR-186 ────────────────────────────────────────────────────────────────

class HomeworkSerializer(serializers.Serializer):
    teacher_homework_task = serializers.JSONField()
<<<<<<< HEAD
    homework_answer_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
=======
    homework_answer_url = serializers.URLField(max_length=255, required=False, allow_blank=True)
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
    # LEAR-67: optional file attachment — saved as LessonMaterial on the lesson
    file = serializers.FileField(required=False)
    file_title = serializers.CharField(max_length=200, required=False, default='Homework material')

    def validate_file(self, value):
        if value:
            from api.validators import validate_file_size, validate_file_extension
            validate_file_size(value)
            validate_file_extension(value)
        return value


# ── LEAR-75 ──────────────────────────────────────────────────────────────────

class HomeworkGradeSerializer(serializers.Serializer):
    homework_grade = serializers.IntegerField(
        min_value=1,
        max_value=10,
        error_messages={
            'required': 'Ви не оцінили виконання домашнього завдання',
            'null': 'Ви не оцінили виконання домашнього завдання',
            'invalid': 'Ви не оцінили виконання домашнього завдання',
        },
    )


# ── LEAR-189/190 ────────────────────────────────────────────────────────────

class LessonArchiveSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source='slot.start_time', read_only=True)
    end_time = serializers.DateTimeField(source='slot.end_time', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    def get_teacher_name(self, obj):
        u = obj.slot.teacher.user
        return f'{u.first_name} {u.last_name}'.strip()

    def get_student_name(self, obj):
        u = obj.student.user
        return f'{u.first_name} {u.last_name}'.strip()

    def get_subject(self, obj):
        try:
            return obj.package.discipline.name
        except Exception:
            return '—'

    class Meta:
        model = Lesson
        fields = [
            'id', 'status', 'start_time', 'end_time',
            'teacher_name', 'student_name', 'subject', 'package', 'meeting_link',
        ]


class PackagePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagePlan
        fields = ['id', 'name', 'total_lessons', 'price', 'description', 'is_active']


<<<<<<< HEAD
class StudentAvailablePackageSerializer(serializers.ModelSerializer):
    """Package records pre-created for a student and available for purchase."""
    class Meta:
        model = Package
        fields = ['id', 'total_lessons', 'balance', 'final_price', 'discount', 'status']


class ManagerPackageSerializer(serializers.ModelSerializer):
    """Full package info for manager views — includes student name."""
    student_name = serializers.SerializerMethodField()

    def get_student_name(self, obj) -> str:
        try:
            u = obj.student.user
            return f'{u.first_name} {u.last_name}'.strip() or u.email
        except Exception:
            return '—'

    class Meta:
        model = Package
        fields = ['id', 'student', 'student_name', 'total_lessons', 'balance', 'final_price', 'discount', 'status', 'purchased_at']


=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
class LearningRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        u = obj.student.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email

    def get_student_email(self, obj):
        return obj.student.user.email

    class Meta:
        model = LearningRequest
        fields = [
            'id', 'student_name', 'student_email',
            'subject', 'level', 'preferred_days', 'preferred_time',
            'notes', 'status', 'created_at', 'package',
        ]
        read_only_fields = ['id', 'student_name', 'student_email', 'created_at']


class LearningRequestCreateSerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        required=False,
        allow_null=True,
    )

=======
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621
    class Meta:
        model = LearningRequest
        fields = ['subject', 'level', 'preferred_days', 'preferred_time', 'notes', 'package']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'text', 'created_at', 'is_visible', 'user_name', 'user_role']
        read_only_fields = ['id', 'created_at', 'is_visible']

    def get_user_name(self, obj):
        return obj.user.get_full_name()

    def get_user_role(self, obj):
        return obj.user.role_obj.name if obj.user.role_obj else None


# ── LEAR-84 ──────────────────────────────────────────────────────────────────

class GradeEntrySerializer(serializers.Serializer):
    """Read-only schema for one item in lesson_grades / homework_grades arrays."""
    lesson_id = serializers.IntegerField()
    date = serializers.DateTimeField()
    discipline = serializers.CharField(allow_null=True)
    teacher_name = serializers.CharField()
    grade = serializers.IntegerField(allow_null=True)


# ── LEAR-266 ──────────────────────────────────────────────────────────────────

class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['lesson', 'reason']

    def validate(self, data):
        lesson = data.get('lesson')
        if lesson.status != 'teacher_missed':
            raise serializers.ValidationError(
                {'lesson': 'Скаргу можна подати лише на урок зі статусом teacher_missed.'}
            )
        request = self.context.get('request')
        if request:
            try:
                student = Student.objects.get(user=request.user)
            except Student.DoesNotExist:
                raise serializers.ValidationError({'lesson': 'Профіль учня не знайдено.'})
            if lesson.student_id != student.pk:
                raise serializers.ValidationError(
                    {'lesson': 'Ви можете поскаржитись лише на свій урок.'}
                )
            if Complaint.objects.filter(student=student, lesson=lesson).exists():
                raise serializers.ValidationError(
                    {'lesson': 'Ви вже подали скаргу на цей урок.'}
                )
        return data


class ComplaintListSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    lesson_date = serializers.DateTimeField(source='lesson.slot.start_time', read_only=True)

    def get_student_name(self, obj):
        u = obj.student.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email

    def get_teacher_name(self, obj):
        u = obj.lesson.slot.teacher.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email

    class Meta:
        model = Complaint
        fields = [
            'id', 'student_name', 'teacher_name', 'lesson_date',
            'reason', 'status', 'created_at', 'reviewed_at',
        ]
        read_only_fields = fields


class ComplaintStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)


# ── LEAR-125 ──────────────────────────────────────────────────────────────────

class LessonMaterialUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonMaterial
        fields = ['title', 'file']

    def validate_file(self, value):
        from api.validators import validate_file_size, validate_file_extension
        validate_file_size(value)
        validate_file_extension(value)
        return value


class LessonMaterialListSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    def get_file_url(self, obj):
<<<<<<< HEAD
        return obj.file.url if obj.file else None
=======
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

    def get_uploaded_by_name(self, obj):
        u = obj.uploaded_by.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email

    class Meta:
        model = LessonMaterial
        fields = ['id', 'title', 'file_url', 'uploaded_by_name', 'uploaded_at']


# ── LEAR-74 ──────────────────────────────────────────────────────────────────

class HomeworkDetailSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField(source='lesson.pk', read_only=True)
    lesson_date = serializers.DateTimeField(source='lesson.slot.start_time', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    discipline = serializers.SerializerMethodField()
    teacher_materials = serializers.SerializerMethodField()
    homework_file_url = serializers.SerializerMethodField()

    def get_teacher_name(self, obj):
        u = obj.lesson.slot.teacher.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email

    def get_discipline(self, obj):
        pkg = obj.lesson.package
        if not pkg:
            return None
        if pkg.discipline:
            return pkg.discipline.name
        if pkg.course and pkg.course.discipline:
            return pkg.course.discipline.name
        return None

    def get_teacher_materials(self, obj):
        qs = obj.lesson.materials.select_related('uploaded_by__user').all()
        request = self.context.get('request')
        return LessonMaterialListSerializer(qs, many=True, context={'request': request}).data

    def get_homework_file_url(self, obj):
<<<<<<< HEAD
        return obj.homework_file.url if obj.homework_file else None
=======
        if not obj.homework_file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.homework_file.url)
        return obj.homework_file.url
>>>>>>> 9eb61c56c0ee2f61c17f17c3b112086ca969d621

    class Meta:
        model = JournalRecord
        fields = [
            'id', 'lesson_id', 'lesson_date', 'teacher_name', 'discipline',
            'teacher_homework_task', 'homework_status',
            'teacher_materials',
            'homework_file_url', 'homework_grade',
            'homework_submitted_at', 'reviewed_at',
        ]


class HomeworkSubmitSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        from api.validators import validate_file_size, validate_file_extension
        validate_file_size(value)
        validate_file_extension(value)
        return value

    def validate(self, data):
        record = self.context.get('record')
        if record:
            if record.homework_status == JournalRecord.HomeworkStatus.REVIEWED:
                raise serializers.ValidationError(
                    'Домашнє завдання вже перевірено — повторна здача неможлива.'
                )
            if not record.teacher_homework_task:
                raise serializers.ValidationError(
                    'Викладач ще не задав домашнє завдання.'
                )
        return data
