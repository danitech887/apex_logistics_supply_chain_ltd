from django.urls import path
from apps.authentication.views import (
    LoginView,
    RefreshTokenView,
    MFAVerifyView,
    UserProfileView,
    PasswordRotationView,
    TenantListView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('mfa-verify/', MFAVerifyView.as_view(), name='auth-mfa-verify'),
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('password-rotate/', PasswordRotationView.as_view(), name='auth-password-rotate'),
    path('tenants/', TenantListView.as_view(), name='auth-tenants-list'),
]
