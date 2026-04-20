from rest_framework import serializers
from django.contrib.auth import authenticate
from users.models import User


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError(
                "Невірний email або пароль."
            )

        data['user'] = user
        return data
