from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import LoginView
from api.views import (
    RegistrationRequestView,
    ApproveRegistrationRequestView,
    ActivatePackageView,
    StudentBalanceView,
    SlotViewSet,
    LessonViewSet,
    BonusBalanceView,
)
from users.views import RequestViewSet

router = DefaultRouter()
router.register(r'v1/slots', SlotViewSet, basename='slot')
router.register(r'v1/lessons', LessonViewSet, basename='lesson')
router.register(r'v1/user-requests', RequestViewSet, basename='user-request')

urlpatterns = [
    # ── Auth (canonical)
    path('v1/auth/login/', LoginView.as_view(), name='auth-login'),
    path('v1/auth/register/', RegistrationRequestView.as_view(), name='auth-register'),
    path('v1/applicants/<int:pk>/approve/', ApproveRegistrationRequestView.as_view(), name='approve-applicant'),

    # ── Auth (legacy aliases — kept for backward compatibility)
    path('v1/tokens', LoginView.as_view(), name='login-legacy'),
    path('v1/requests/', RegistrationRequestView.as_view(), name='registration-request-legacy'),
    path('v1/requests/<int:pk>/approve/', ApproveRegistrationRequestView.as_view(), name='approve-request-legacy'),

    # ── Packages & Students
    path('v1/packages/<int:pk>/activate/', ActivatePackageView.as_view(), name='activate-package'),
    path('v1/students/me/balance/', StudentBalanceView.as_view(), name='student-balance'),

    # ── Bonus / cashback
    path('v1/bonus/balance/<int:student_id>/', BonusBalanceView.as_view(), name='bonus-balance'),

    # ── ViewSets
    path('', include(router.urls)),
]
