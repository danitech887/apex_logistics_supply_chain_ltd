from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.fleet_ops.views import (
    VehicleViewSet,
    TripViewSet,
    FuelLogViewSet,
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')

urlpatterns = [
    path('', include(router.urls)),
]
