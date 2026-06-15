import logging
from datetime import datetime, timezone

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def format_detail(detail):
    """Extract a plain user-facing string from DRF error data, avoiding
    repr-formatted output like "{'email': [ErrorDetail(string='...', code='...')]}"."""
    if isinstance(detail, dict):
        for value in detail.values():
            if isinstance(value, list) and value:
                return str(value[0])
            return str(value)
        return str(detail)
    if isinstance(detail, list) and detail:
        return str(detail[0])
    return str(detail)


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

        message = format_detail(response.data)

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
