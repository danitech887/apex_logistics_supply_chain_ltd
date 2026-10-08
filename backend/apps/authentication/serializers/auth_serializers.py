from rest_framework import serializers
from apps.authentication.models import Tenant, User, Role, UserRole


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'company_name', 'subdomain', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'code', 'description']


class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'tenant', 'roles', 'is_active', 'mfa_enabled',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    subdomain = serializers.CharField(required=False, allow_blank=True)


class TokenRefreshSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class MFAVerifySerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    mfa_code = serializers.CharField(max_length=6, min_length=6)


class PasswordRotationSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
