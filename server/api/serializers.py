from rest_framework import serializers
from api.models import RegistrationRequest
from inventory.models import Slot, Teacher, Lesson, Package, JournalRecord, CurriculumLesson, PackagePlan, LearningRequest
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
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError('homework_grade must be between 1 and 10.')
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
    level = serializers.CharField(source='level.name', allow_null=True, default=None)
    lessons_balance = serializers.IntegerField()

    class Meta:
        model = Student
        fields = ['user_id', 'first_name', 'last_name', 'email', 'phone', 'level', 'lessons_balance']


class JournalListSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source='lesson.slot.start_time', read_only=True)
    lesson_status = serializers.CharField(source='lesson.status', read_only=True)

    class Meta:
        model = JournalRecord
        fields = [
            'id', 'lesson', 'start_time', 'lesson_status',
            'is_present', 'activity_grade', 'homework_grade',
            'teacher_homework_task', 'homework_answer_url', 'teacher_notes',
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
    homework_answer_url = serializers.URLField(max_length=255, required=False, allow_blank=True)


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
