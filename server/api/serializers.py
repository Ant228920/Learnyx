from rest_framework import serializers
from api.models import RegistrationRequest
from inventory.models import Slot, Teacher, Lesson, Package


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
        fields = ['id', 'teacher', 'start_time', 'end_time', 'is_booked']
        read_only_fields = ['id', 'teacher', 'is_booked']

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
    class Meta:
        model = Lesson
        fields = ['id', 'slot', 'student', 'package', 'curriculum_lesson', 'status', 'meeting_link']


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'slot', 'student', 'package', 'curriculum_lesson', 'meeting_link', 'status']
        read_only_fields = ['id', 'status']

    def validate(self, data):
        slot = data.get('slot')
        package = data.get('package')
        student = data.get('student')

        if slot and slot.is_booked:
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
    VALID_STATUSES = ['conducted', 'cancelled', 'missed']
    status = serializers.ChoiceField(choices=VALID_STATUSES)
