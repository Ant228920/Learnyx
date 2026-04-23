from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequestViewSet

# 1. Створюємо роутер
router = DefaultRouter()

# 2. Реєструємо наш в'юсет. 
# Саме це перетворить твій метод approve на шлях /api/requests/{id}/approve/
router.register(r'requests', RequestViewSet, basename='request')

# 3. Визначаємо urlpatterns для цього додатка
urlpatterns = [
    path('', include(router.urls)),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]