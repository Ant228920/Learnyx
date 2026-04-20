from django.urls import path
from users.views import LoginView

urlpatterns = [
    path('v1/tokens', LoginView.as_view(), name='login'),
]
