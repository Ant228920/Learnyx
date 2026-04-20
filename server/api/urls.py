from django.urls import path
from users.views import LoginView
from api.views import RegistrationRequestView, ApproveRegistrationRequestView

urlpatterns = [
    path('v1/tokens', LoginView.as_view(), name='login'),
    path('v1/requests/', RegistrationRequestView.as_view(), name='registration-request'),
    path('v1/requests/<int:pk>/approve/', ApproveRegistrationRequestView.as_view(), name='approve-request'),
]
