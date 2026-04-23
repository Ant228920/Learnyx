from django.urls import path
from users.views import LoginView
from api.views import (
    RegistrationRequestView,
    ApproveRegistrationRequestView,
    ActivatePackageView,
    StudentBalanceView,
)

urlpatterns = [
    path('v1/tokens', LoginView.as_view(), name='login'),
    path('v1/requests/', RegistrationRequestView.as_view(), name='registration-request'),
    path('v1/requests/<int:pk>/approve/', ApproveRegistrationRequestView.as_view(), name='approve-request'),
    path('v1/packages/<int:pk>/activate/', ActivatePackageView.as_view(), name='activate-package'),
    path('v1/students/me/balance/', StudentBalanceView.as_view(), name='student-balance'),
]
