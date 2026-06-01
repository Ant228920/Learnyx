from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        User = get_user_model()
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
        if not user:
            raise serializers.ValidationError(
                "Невірний email або пароль."
            )

        role = getattr(user, 'role_obj', None)
        role_name = role.name.lower() if role else ''
        if not user.is_approved and role_name not in ('manager', 'admin'):
            raise serializers.ValidationError(
                "Ваш акаунт ще не підтверджено менеджером."
            )

        data['user'] = user
        return data
