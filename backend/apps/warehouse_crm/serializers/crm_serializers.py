from rest_framework import serializers
from apps.warehouse_crm.models import CorporateClient, InventoryItem, Waybill


class CorporateClientSerializer(serializers.ModelSerializer):
    available_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CorporateClient
        fields = [
            'id', 'tenant', 'company_name', 'contact_person', 'email', 'phone',
            'tax_pin', 'credit_limit', 'outstanding_balance', 'available_credit',
            'payment_terms_days', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'tenant', 'sku', 'description', 'warehouse_location',
            'quantity_on_hand', 'unit_weight_kg', 'reorder_level', 'created_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at']


class WaybillSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)

    class Meta:
        model = Waybill
        fields = [
            'id', 'tenant', 'waybill_number', 'client', 'client_name', 'trip',
            'tare_weight_kg', 'gross_weight_kg', 'net_weight_kg', 'tare_verified',
            'recipient_signature', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at']


class WeighbridgeVerificationSerializer(serializers.Serializer):
    tare_weight_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    gross_weight_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
