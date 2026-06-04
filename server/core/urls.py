from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from datetime import datetime, timezone

from api.health import health_check
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health_check, name="health_check"),

    # API schema & docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Маршрути загального API
    path("api/", include("api.urls")),

    # Маршрути для користувачів, логіну та заявок
    path("api/", include("users.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


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
