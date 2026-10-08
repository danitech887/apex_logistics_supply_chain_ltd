"""
Views and ViewSets for Corporate CRM, Warehousing, and Weighbridge Waybills.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.warehouse_crm.models import CorporateClient, InventoryItem, Waybill
from apps.warehouse_crm.serializers import (
    CorporateClientSerializer,
    InventoryItemSerializer,
    WaybillSerializer,
    WeighbridgeVerificationSerializer,
)
from apps.warehouse_crm.services import CrmWarehouseService


class CorporateClientViewSet(viewsets.ModelViewSet):
    serializer_class = CorporateClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CorporateClient.objects.filter(tenant=self.request.user.tenant_id)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(tenant=self.request.user.tenant_id)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class WaybillViewSet(viewsets.ModelViewSet):
    serializer_class = WaybillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Waybill.objects.filter(tenant=self.request.user.tenant_id).select_related('client', 'trip')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def verify_weighbridge(self, request, pk=None):
        """Verifies tare and gross weights captured at physical weighbridge dock."""
        waybill = self.get_object()
        serializer = WeighbridgeVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = CrmWarehouseService.verify_weighbridge_weights(
            waybill=waybill,
            tare_kg=serializer.validated_data['tare_weight_kg'],
            gross_kg=serializer.validated_data['gross_weight_kg']
        )
        return Response(WaybillSerializer(updated).data, status=status.HTTP_200_OK)
