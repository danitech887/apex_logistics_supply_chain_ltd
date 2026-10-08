"""
Custom JWT Header Decoding and Multi-Tenant Authentication.
"""
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication that extracts and verifies bearer tokens,
    binds the user and tenant context to the incoming request.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()

        if not auth_header:
            return None

        if auth_header[0].decode().lower() != self.keyword.lower():
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed('Invalid token header. No credentials provided.')
        elif len(auth_header) > 2:
            raise AuthenticationFailed('Invalid token header. Token string should not contain spaces.')

        try:
            token = auth_header[1].decode()
        except UnicodeError:
            raise AuthenticationFailed('Invalid token header. Token string contains invalid characters.')

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        from apps.authentication.models.user import User

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired. Please refresh your credentials.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token signature or malformed payload.')

        user_id = payload.get('user_id')
        tenant_id = payload.get('tenant_id')

        if not user_id:
            raise AuthenticationFailed('Token payload is missing user identification.')

        try:
            user = User.objects.select_related('tenant').prefetch_related('roles').get(
                id=user_id,
                is_active=True
            )
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found or account is deactivated.')

        # Enforce tenant isolation match if tenant_id was encoded in the token
        if tenant_id and str(user.tenant_id) != str(tenant_id):
            raise AuthenticationFailed('Tenant mismatch detected in token claims.')

        return (user, payload)

    def authenticate_header(self, request):
        return self.keyword
