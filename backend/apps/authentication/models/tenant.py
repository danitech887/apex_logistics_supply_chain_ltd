import uuid
from django.db import models


class Tenant(models.Model):
    """
    Tenant isolation model representing an enterprise organization or operating subsidiary.
    Target Schema: auth_core
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=150)
    subdomain = models.CharField(max_length=63, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_core"."tenants'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['company_name']

    def __str__(self):
        return f"{self.company_name} ({self.subdomain})"
