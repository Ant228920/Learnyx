import logging
from datetime import datetime, timezone

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    timestamp = datetime.now(timezone.utc).isoformat()

    if response is not None:
        error_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            429: "TOO_MANY_REQUESTS",
        }

        error_code = error_map.get(response.status_code, "API_ERROR")

        if isinstance(response.data, dict):
            message = response.data.get("detail", str(response.data))
        elif isinstance(response.data, list):
            message = response.data[0] if response.data else "Validation error"
        else:
            message = str(response.data)

        response.data = {
            "timestamp": timestamp,
            "errorCode": error_code,
            "message": str(message),
        }

        logger.warning(
            f"[{error_code}] {context.get('request').method} "
            f"{context.get('request').path} → {response.status_code}: {message}"
        )

    else:
        logger.exception(f"Unhandled exception: {exc}")

        response = Response(
            {
                "timestamp": timestamp,
                "errorCode": "INTERNAL_ERROR",
                "message": "Внутрішня помилка сервера. Спробуйте пізніше.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
