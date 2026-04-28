from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    ProfileView,
    RegisterView,
    ReportView,
    SessionListCreateView,
    StatsView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('sessions/', SessionListCreateView.as_view(), name='sessions'),
    path('stats/', StatsView.as_view(), name='stats'),
    path('report/', ReportView.as_view(), name='report'),
]
