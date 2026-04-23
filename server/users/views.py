from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import LoginSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role_obj.name if user.role_obj else None,
            }
        }, status=status.HTTP_201_CREATED)
