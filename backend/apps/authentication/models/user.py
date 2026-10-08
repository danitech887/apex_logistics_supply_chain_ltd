import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from .tenant import Tenant


class Role(models.Model):
    """
    Role definitions for RBAC (e.g. SUPER_ADMIN, HR_OFFICER, ACCOUNTANT, FLEET_MANAGER, DRIVER).
    Target Schema: auth_core
    """
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_core"."roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['code']

    def __str__(self):
        return self.code


class UserManager(BaseUserManager):
    """Custom manager supporting email authentication within tenant context."""

    def create_user(self, email, password=None, tenant=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required for user creation.')
        email = self.normalize_email(email)

        if tenant is None:
            # Fallback or default tenant assignment
            tenant = Tenant.objects.first()

        user = self.model(email=email, tenant=tenant, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        tenant, _ = Tenant.objects.get_or_create(
            subdomain='apex-hq',
            defaults={'company_name': 'Apex Logistics Headquarters'}
        )

        user = self.create_user(email, password=password, tenant=tenant, **extra_fields)
        role, _ = Role.objects.get_or_create(code='SUPER_ADMIN', defaults={'description': 'Root Administrator'})
        UserRole.objects.get_or_create(user=user, role=role)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Enterprise user model bound to a Tenant and granted granular RBAC roles.
    Target Schema: auth_core
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.RESTRICT, related_name='users')
    email = models.EmailField(max_length=255,unique = True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    roles = models.ManyToManyField(Role, through='UserRole', related_name='users', blank=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'auth_core"."users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        unique_together = ('tenant', 'email')
        ordering = ['email']

    def __str__(self):
        return f"{self.email} ({self.tenant.subdomain})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def has_role(self, role_code):
        return self.roles.filter(code=role_code).exists()


class UserRole(models.Model):
    """
    Explicit associative relationship granting roles to users with audit timestamp.
    Target Schema: auth_core
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.RESTRICT, related_name='user_roles')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_core"."user_roles'
        unique_together = ('user', 'role')
        verbose_name = 'User Role Assignment'
        verbose_name_plural = 'User Role Assignments'
