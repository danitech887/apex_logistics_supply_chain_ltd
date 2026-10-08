"""
Authentication and Session Views: Login, Refresh, MFA, and Profile.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed, ValidationError

from apps.authentication.models import User, Tenant, Role
from apps.authentication.serializers import (
    LoginSerializer,
    TokenRefreshSerializer,
    MFAVerifySerializer,
    PasswordRotationSerializer,
    UserProfileSerializer,
    TenantSerializer,
)
from apps.authentication.services import AuthService
from common.permissions import IsSuperAdmin


class LoginView(APIView):
    """
    Authenticates user credentials against the tenant scope and returns signed JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        subdomain = serializer.validated_data.get('subdomain')

        query = User.objects.select_related('tenant').prefetch_related('roles').filter(
            email=email,
            is_active=True
        )
        if subdomain:
            query = query.filter(tenant__subdomain=subdomain)

        user = query.first()

        if not user or not user.check_password(password):
            raise AuthenticationFailed('Invalid email or password.')

        if user.mfa_enabled:
            # Issue a temporary session token for the MFA challenge
            tokens = AuthService.generate_tokens(user)
            return Response({
                'mfa_required': True,
                'temp_token': tokens['access_token'],
                'message': 'Two-factor authentication code required.'
            }, status=status.HTTP_200_OK)

        tokens = AuthService.generate_tokens(user)
        return Response(tokens, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """
    Exchanges a valid refresh token for a newly minted access token pair.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data['refresh_token']
        token_data = AuthService.refresh_access_token(refresh_token)
        return Response(token_data, status=status.HTTP_200_OK)


class MFAVerifyView(APIView):
    """
    Verifies one-time password during login flow.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        temp_token = serializer.validated_data['temp_token']
        mfa_code = serializer.validated_data['mfa_code']

        # Decode temp token to retrieve target user
        from django.conf import settings
        import jwt
        try:
            payload = jwt.decode(
                temp_token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user = User.objects.select_related('tenant').prefetch_related('roles').get(
                id=payload['user_id'],
                is_active=True
            )
        except Exception:
            raise AuthenticationFailed('Temporary challenge token expired or invalid.')

        if not AuthService.verify_mfa(user, mfa_code):
            raise ValidationError({'mfa_code': 'Invalid multi-factor authentication code.'})

        tokens = AuthService.generate_tokens(user)
        return Response(tokens, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    Returns current authenticated user details and active role permissions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordRotationView(APIView):
    """
    Allows authenticated users to change or rotate their operational password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordRotationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService.rotate_password(
            user=request.user,
            old_password=serializer.validated_data['old_password'],
            new_password=serializer.validated_data['new_password']
        )
        return Response({'message': 'Password rotated successfully.'}, status=status.HTTP_200_OK)


class TenantListView(APIView):
    """
    System Administration endpoint to inspect all configured corporate tenants.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        tenants = Tenant.objects.all()
        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
