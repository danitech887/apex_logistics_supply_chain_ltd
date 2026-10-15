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


class QuickAccessProfilesView(APIView):
    """
    Public discovery endpoint that surfaces active departmental employee profiles
    directly from PostgreSQL for the login page Quick-Access passes.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        tenant_subdomain = request.query_params.get('subdomain', 'apex-hq')
        tenant = Tenant.objects.filter(subdomain=tenant_subdomain).first() or Tenant.objects.first()
        if not tenant:
            return Response([], status=status.HTTP_200_OK)

        # Department roles to surface for quick-access login
        role_department_mapping = [
            {
                'role': 'SUPER_ADMIN',
                'target_portal': 'admin',
                'portal_title': 'Executive Administration Portal',
                'portal_description': 'Enterprise organization audit, system configuration, and company-wide RBAC matrix',
                'database_schema': 'auth_core',
                'badge_text': 'Executive & RBAC',
                'accent_color': 'purple',
                'default_dept': 'Executive Administration',
            },
            {
                'role': 'ACCOUNTANT',
                'target_portal': 'finance',
                'portal_title': 'Finance & General Ledger Portal',
                'portal_description': 'Double-entry journals, chart of accounts, AR freight invoices, and balance sheet',
                'database_schema': 'finance',
                'badge_text': 'Finance & Audit Desk',
                'accent_color': 'emerald',
                'default_dept': 'Finance & General Ledger',
            },
            {
                'role': 'HR_OFFICER',
                'target_portal': 'hr',
                'portal_title': 'HR & Statutory Payroll Workspace',
                'portal_description': 'Staff directory, statutory deductions (PAYE, NSSF, SHIF, Housing Levy), and pay runs',
                'database_schema': 'hr_payroll',
                'badge_text': 'HR & Payroll Desk',
                'accent_color': 'blue',
                'default_dept': 'Human Resources & Payroll',
            },
            {
                'role': 'FLEET_MANAGER',
                'target_portal': 'fleet',
                'portal_title': 'Fleet Operations & Dispatch Portal',
                'portal_description': 'Transit manifests, live GPS truck telemetry, driver scheduling, and fuel logs',
                'database_schema': 'fleet_ops',
                'badge_text': 'Fleet & Dispatch Desk',
                'accent_color': 'amber',
                'default_dept': 'Fleet Operations & Dispatch',
            },
            {
                'role': 'DRIVER',
                'target_portal': 'ess',
                'portal_title': 'Employee Self-Service (ESS)',
                'portal_description': 'Personal punch clock, monthly KRA payslips, and leave requests',
                'database_schema': 'hr_payroll & fleet_ops (Scoped)',
                'badge_text': 'Driver Transit Desk',
                'accent_color': 'rose',
                'default_dept': 'Highway Transit Operations',
            },
            {
                'role': 'WAREHOUSE_SUPERVISOR',
                'target_portal': 'warehouse',
                'portal_title': 'Warehouse, Stock & Inbound Cargo Desk',
                'portal_description': 'Consignment intake, weighbridge gross/tare logging, and pallet inventory',
                'database_schema': 'warehouse_crm',
                'badge_text': 'Warehouse & Stock Desk',
                'accent_color': 'cyan',
                'default_dept': 'Warehouse & Inventory Control',
            },
            {
                'role': 'PROCUREMENT_OFFICER',
                'target_portal': 'procurement',
                'portal_title': 'Procurement, LPO & Vendor Management',
                'portal_description': 'Vendor supplier contracts, Local Purchase Orders (LPOs), fuel tenders, and parts requisitions',
                'database_schema': 'finance & procurement',
                'badge_text': 'Procurement & LPO Desk',
                'accent_color': 'teal',
                'default_dept': 'Procurement & Vendor Management',
            },
            {
                'role': 'SALES_MANAGER',
                'target_portal': 'crm',
                'portal_title': 'CRM & Freight Rate Quotations Desk',
                'portal_description': 'Corporate haulage contracts, rate negotiations, contract quotas, and sales pipeline',
                'database_schema': 'warehouse_crm',
                'badge_text': 'Commercial CRM Desk',
                'accent_color': 'violet',
                'default_dept': 'Sales & Business Development',
            },
            {
                'role': 'CLIENT',
                'target_portal': 'client_portal',
                'portal_title': 'Client Shipment Tracking & Digital POD Portal',
                'portal_description': 'B2B client consignment tracking, electronic waybills, digital PODs, and freight billing',
                'database_schema': 'warehouse_crm & fleet_ops (Restricted)',
                'badge_text': 'B2B Consignee Portal',
                'accent_color': 'emerald',
                'default_dept': 'Unilever Kenya Logistics Desk',
            },
        ]

        profiles = []
        for mapping in role_department_mapping:
            role_code = mapping['role']
            user_qs = User.objects.filter(
                tenant=tenant,
                is_active=True,
                roles__code=role_code
            ).select_related('tenant').prefetch_related('roles')

            if role_code == 'DRIVER':
                user = user_qs.filter(email='m.kamau@apexlogistics.co.ke').first() or user_qs.first()
            elif role_code == 'WAREHOUSE_SUPERVISOR':
                user = user_qs.filter(email='k.wafula@apexlogistics.co.ke').first() or user_qs.first()
            elif role_code == 'PROCUREMENT_OFFICER':
                user = user_qs.filter(email='a.abdi@apexlogistics.co.ke').first() or user_qs.first()
            elif role_code == 'SALES_MANAGER':
                user = user_qs.filter(email='b.otieno@apexlogistics.co.ke').first() or user_qs.first()
            elif role_code == 'CLIENT':
                user = user_qs.filter(email='unilever.logistics@apexlogistics.co.ke').first() or user_qs.first()
            else:
                user = user_qs.first()

            if user:
                emp = getattr(user, 'employee_profile', None)
                staff_no = emp.staff_number if emp else 'EMP-AUTH'
                dept = emp.department if emp and emp.department else mapping['default_dept']
                desig = emp.designation if emp else ''

                # Avatar initials
                parts = user.full_name.split()
                avatar = (parts[0][0] + (parts[1][0] if len(parts) > 1 else '')) if parts else 'AP'

                profiles.append({
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.full_name,
                    'roles': list(user.roles.values_list('code', flat=True)),
                    'department': dept,
                    'designation': desig,
                    'staffNumber': staff_no,
                    'avatar': avatar.upper(),
                    'tenant': {
                        'id': str(user.tenant.id),
                        'company_name': user.tenant.company_name,
                        'subdomain': user.tenant.subdomain,
                    },
                    'targetPortal': mapping['target_portal'],
                    'portalTitle': mapping['portal_title'],
                    'portalDescription': mapping['portal_description'],
                    'databaseSchema': mapping['database_schema'],
                    'accentColor': mapping['accent_color'],
                    'badgeText': mapping['badge_text'],
                    'isFromDatabase': True,
                })

        return Response(profiles, status=status.HTTP_200_OK)
