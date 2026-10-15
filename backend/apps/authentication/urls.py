from django.urls import path
from apps.authentication.views import (
    LoginView,
    RefreshTokenView,
    MFAVerifyView,
    UserProfileView,
    PasswordRotationView,
    TenantListView,
    QuickAccessProfilesView,
    ExecutiveOverviewView,
    AdminUsersView,
    AdminUserDetailView,
    AdminRolesView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('mfa-verify/', MFAVerifyView.as_view(), name='auth-mfa-verify'),
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('password-rotate/', PasswordRotationView.as_view(), name='auth-password-rotate'),
    path('tenants/', TenantListView.as_view(), name='auth-tenants-list'),
    path('quick-access-profiles/', QuickAccessProfilesView.as_view(), name='auth-quick-access-profiles'),
    # Executive Portal Live Endpoints
    path('admin/overview/', ExecutiveOverviewView.as_view(), name='auth-admin-overview'),
    path('admin/users/', AdminUsersView.as_view(), name='auth-admin-users'),
    path('admin/users/<uuid:user_id>/', AdminUserDetailView.as_view(), name='auth-admin-user-detail'),
    path('admin/roles/', AdminRolesView.as_view(), name='auth-admin-roles'),
]
