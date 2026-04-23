import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.models import RegistrationRequest
from api.serializers import RegistrationRequestSerializer
from api.services import RegistrationService, PackageService

logger = logging.getLogger(__name__)


class RegistrationRequestView(APIView):
    """
    POST /api/v1/requests/
    UC-08: Подача заявки на реєстрацію (Guest).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reg_request = RegistrationService.create_request(serializer.validated_data)
        return Response(
            {'message': 'Готово! Ваша заявка успішно відправлена менеджеру.', 'id': reg_request.id},
            status=status.HTTP_201_CREATED,
        )


class ApproveRegistrationRequestView(APIView):
    """
    POST /api/v1/requests/{id}/approve/
    UC-18: Менеджер апрувить заявку → створює User.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            result = RegistrationService.approve_request(pk)
        except RegistrationRequest.DoesNotExist:
            return Response({'message': 'Заявку не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Approve failed: {e}')
            return Response({'message': f'Помилка: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {'message': f'Акаунт для {result["email"]} успішно створено.', 'user_id': result['user_id']},
            status=status.HTTP_201_CREATED,
        )


class ActivatePackageView(APIView):
    """
    POST /api/v1/packages/{id}/activate/
    Таска 4: Активація пакету занять.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            package = PackageService.activate(pk)
        except Exception as e:
            if 'не знайдено' in str(e) or 'DoesNotExist' in type(e).__name__:
                return Response({'message': 'Пакет не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f'Package {pk} activated by user {request.user.id}')
        return Response({
            'message': 'Пакет успішно активовано.',
            'package_id': package.id,
            'status': package.status,
            'purchased_at': package.purchased_at,
            'total_lessons': package.total_lessons,
            'balance': package.balance,
        }, status=status.HTTP_200_OK)


class StudentBalanceView(APIView):
    """
    GET /api/v1/students/me/balance/
    Таска 5: Баланс учня.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            result = PackageService.get_student_balance(request.user)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)

        return Response(result, status=status.HTTP_200_OK)