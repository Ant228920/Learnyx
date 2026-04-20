from django.urls import path
from users.views import LoginView
from api.views import RegistrationRequestView

urlpatterns = [
    path('v1/tokens', LoginView.as_view(), name='login'),
    path('v1/requests/', RegistrationRequestView.as_view(), name='registration-request'),
]
