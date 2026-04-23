from rest_framework import serializers
from api.models import RegistrationRequest


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
