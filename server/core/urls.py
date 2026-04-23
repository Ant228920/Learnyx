from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from datetime import datetime, timezone

from api.health import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health_check, name="health_check"),
    
    # Маршрути загального API
    path("api/", include("api.urls")),
    
    # Маршрути для користувачів, логіну та заявок
    path("api/", include("users.urls")),
]

# ─── Обробка помилок (Custom Error Handlers) ──────────────────────

def handler404(request, exception):
    return JsonResponse({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "errorCode": "NOT_FOUND",
        "message": "Ресурс не знайдено",
    }, status=404)

def handler500(request):
    return JsonResponse({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "errorCode": "INTERNAL_ERROR",
        "message": "Внутрішня помилка сервера",
    }, status=500)

# Призначаємо обробники (Django автоматично підхопить ці змінні)
handler404 = handler404
handler500 = handler500