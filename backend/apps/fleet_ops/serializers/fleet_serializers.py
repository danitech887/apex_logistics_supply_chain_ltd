from decimal import Decimal
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
        validators = []

    def validate(self, attrs):
        plate = attrs.get('registration_plate')
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        tenant = attrs.get('tenant') or getattr(user, 'tenant', None)
        if plate and tenant:
            instance = getattr(self, 'instance', None)
            qs = Vehicle.objects.filter(tenant=tenant, registration_plate=plate)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                raise serializers.ValidationError({
                    'registration_plate': f"Vehicle with plate '{plate}' already exists in your fleet registry."
                })
        return attrs


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='trip.vehicle.registration_plate', read_only=True)
    vehicle_model = serializers.CharField(source='trip.vehicle.model', read_only=True)
    driver_name = serializers.CharField(source='trip.driver.user.full_name', read_only=True)
    driver_staff_no = serializers.CharField(source='trip.driver.staff_number', read_only=True)
    trip_origin = serializers.CharField(source='trip.origin', read_only=True)
    trip_destination = serializers.CharField(source='trip.destination', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = FuelLog
        fields = [
            'id', 'trip', 'vehicle_plate', 'vehicle_model', 'driver_name',
            'driver_staff_no', 'trip_origin', 'trip_destination',
            'liters_filled', 'cost_per_liter', 'total_cost',
            'odometer_reading', 'station_name', 'receipt_number', 'logged_at'
        ]
        read_only_fields = ['id', 'logged_at']

    def validate(self, attrs):
        liters = attrs.get('liters_filled')
        cost_per_l = attrs.get('cost_per_liter')
        if liters and cost_per_l and not attrs.get('total_cost'):
            attrs['total_cost'] = (liters * cost_per_l).quantize(Decimal('0.01'))
        return attrs


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
