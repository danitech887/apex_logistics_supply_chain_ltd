from django.apps import AppConfig
from django.db.backends.signals import connection_created


def ensure_postgres_schemas(sender, connection, **kwargs):
    if connection.vendor == 'postgresql':
        try:
            with connection.cursor() as cursor:
                for s in ['auth_core', 'hr_payroll', 'finance', 'fleet_ops', 'warehouse_crm']:
                    cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {s};")
                cursor.execute("SET search_path = auth_core, hr_payroll, finance, fleet_ops, warehouse_crm, public;")
        except Exception:
            pass


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.authentication'
    verbose_name = 'Authentication & Multi-Tenant RBAC'

    def ready(self):
        connection_created.connect(ensure_postgres_schemas)
