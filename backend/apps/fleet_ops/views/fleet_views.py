"""
Views and ViewSets for Fleet Operations, Dispatch, and Fuel Tracking.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.fleet_ops.models import Vehicle, Trip, FuelLog
from apps.fleet_ops.serializers import (
    VehicleSerializer,
    TripSerializer,
    FuelLogSerializer,
    DispatchActionSerializer,
    TripCompletionSerializer,
)
from apps.fleet_ops.services import DispatchService
from common.permissions import IsFleetManager


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Vehicle.objects.filter(tenant=self.request.user.tenant_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsFleetManager])
    def service_complete(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.status = 'AVAILABLE'
        # Next service interval +15,000 km
        vehicle.next_service_odometer = vehicle.current_odometer + 15000
        vehicle.save(update_fields=['status', 'next_service_odometer'])
        return Response({
            'status': 'Vehicle maintenance cycle cleared. Status updated to AVAILABLE.',
            'next_service_odometer': vehicle.next_service_odometer
        })


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Trip.objects.filter(tenant=user.tenant_id).select_related(
            'vehicle', 'driver__user'
        ).prefetch_related('fuel_logs')

        # If driver, filter to their assigned trips
        if user.has_role('DRIVER') and not user.has_role('FLEET_MANAGER') and not user.has_role('SUPER_ADMIN'):
            qs = qs.filter(driver__user=user)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsFleetManager], url_path='dispatch')
    def dispatch_trip(self, request, pk=None):
        """Dispatches scheduled truck onto active transit corridor."""
        trip = self.get_object()
        serializer = DispatchActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        start_odo = serializer.validated_data.get('start_odometer')
        dispatched_trip = DispatchService.dispatch_trip(trip, start_odometer=start_odo)
        return Response(TripSerializer(dispatched_trip).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completes delivery and triggers automated multi-ledger reconciliation."""
        trip = self.get_object()
        serializer = TripCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        end_odo = serializer.validated_data['end_odometer']
        result = DispatchService.complete_and_reconcile(trip, end_odometer=end_odo)
        return Response(result, status=status.HTTP_200_OK)


class FuelLogViewSet(viewsets.ModelViewSet):
    serializer_class = FuelLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FuelLog.objects.filter(trip__tenant=self.request.user.tenant_id).select_related('trip')
