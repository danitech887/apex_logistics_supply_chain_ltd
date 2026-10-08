from rest_framework import serializers
from apps.fleet_ops.models import Vehicle, Trip, FuelLog
from apps.authentication.models import Tenant


class VehicleSerializer(serializers.ModelSerializer):
    is_service_due = serializers.BooleanField(read_only=True)
    tenant = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Vehicle
        fields = [
            'id', 'tenant', 'registration_plate', 'make', 'model',
            'payload_capacity_kg', 'current_odometer', 'next_service_odometer',
            'status', 'is_service_due', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FuelLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelLog
        fields = [
            'id', 'trip', 'liters_filled', 'cost_per_liter', 'total_cost',
            'odometer_reading', 'station_name', 'receipt_number', 'logged_at'
        ]
        read_only_fields = ['id', 'logged_at']


class TripSerializer(serializers.ModelSerializer):
    tenant = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        allow_null=True
    )
    vehicle_plate = serializers.CharField(source='vehicle.registration_plate', read_only=True)
    driver_name = serializers.CharField(source='driver.user.full_name', read_only=True)
    driver_staff_no = serializers.CharField(source='driver.staff_number', read_only=True)
    fuel_logs = FuelLogSerializer(many=True, read_only=True)
    distance_km = serializers.IntegerField(read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'tenant', 'vehicle', 'vehicle_plate', 'driver', 'driver_name',
            'driver_staff_no', 'customer_id', 'customer_name', 'origin', 'destination',
            'cargo_description', 'cargo_weight_kg', 'agreed_rate', 'status',
            'scheduled_departure', 'actual_departure', 'actual_arrival',
            'start_odometer', 'end_odometer', 'distance_km', 'reconciled',
            'fuel_logs', 'created_at'
        ]
        read_only_fields = ['id', 'distance_km', 'reconciled', 'created_at']


class DispatchActionSerializer(serializers.Serializer):
    start_odometer = serializers.IntegerField(required=False)


class TripCompletionSerializer(serializers.Serializer):
    end_odometer = serializers.IntegerField()
