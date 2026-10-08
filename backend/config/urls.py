"""
Root URL Configuration for Apex Logistics Enterprise API.
Mounts modular domain routes under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check and diagnostic endpoint."""
    return Response({
        "status": "healthy",
        "service": "Apex Logistics Enterprise Core API",
        "version": "1.0.0",
        "domains": [
            "auth_core",
            "hr_payroll",
            "fleet_ops",
            "finance",
            "warehouse_crm"
        ]
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='api-health-check'),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/hr/', include('apps.hr_payroll.urls')),
    path('api/v1/fleet/', include('apps.fleet_ops.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/warehouse-crm/', include('apps.warehouse_crm.urls')),
]
