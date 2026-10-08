from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.warehouse_crm.views import (
    CorporateClientViewSet,
    InventoryItemViewSet,
    WaybillViewSet,
)

router = DefaultRouter()
router.register(r'clients', CorporateClientViewSet, basename='client')
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'waybills', WaybillViewSet, basename='waybill')

urlpatterns = [
    path('', include(router.urls)),
]
