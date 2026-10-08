"""
Role-Based Access Control (RBAC) Permission Evaluation Classes.
"""
from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """
    Base permission allowing access only to users with specific roles.
    Subclasses should define `required_roles`.
    """
    required_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers bypass RBAC checks
        if getattr(request.user, 'is_superuser', False):
            return True

        user_roles = request.user.roles.values_list('code', flat=True)

        # 'SUPER_ADMIN' role also has global access across all departmental endpoints
        if 'SUPER_ADMIN' in user_roles:
            return True

        return any(role in user_roles for role in self.required_roles)


class IsSuperAdmin(HasRole):
    """Allows access only to Super Admins."""
    required_roles = ['SUPER_ADMIN']


class IsHROfficer(HasRole):
    """Allows access to HR Officers and Super Admins."""
    required_roles = ['HR_OFFICER']


class IsAccountant(HasRole):
    """Allows access to Accountants and Finance Controllers."""
    required_roles = ['ACCOUNTANT', 'FINANCE_CONTROLLER']


class IsFleetManager(HasRole):
    """Allows access to Fleet Managers and Dispatch Officers."""
    required_roles = ['FLEET_MANAGER', 'DISPATCH_OFFICER']


class IsDriver(HasRole):
    """Allows access to Drivers."""
    required_roles = ['DRIVER']


class TenantScopedPermission(BasePermission):
    """
    Ensures that any accessed object belongs strictly to the authenticated user's tenant.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(request.user, 'is_superuser', False):
            return True

        obj_tenant_id = getattr(obj, 'tenant_id', None)
        if obj_tenant_id is None and hasattr(obj, 'tenant'):
            obj_tenant_id = obj.tenant.id

        return str(obj_tenant_id) == str(request.user.tenant_id)
