import logging
from datetime import datetime, timezone

from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    200 OK     — всі сервіси живі
    503        — БД недоступна
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        logger.info("Health check passed")
        return Response(
            {
                "status": "ok",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database": "connected",
            },
            status=status.HTTP_200_OK,
        )

    except OperationalError as e:
        logger.error(f"Health check failed: {e}")
        return Response(
            {
                "status": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database": "unavailable",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
