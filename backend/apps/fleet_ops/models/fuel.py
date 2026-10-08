import uuid
from django.db import models
from .trip import Trip


class FuelLog(models.Model):
    """
    En-route and Depot Fuel Station Receipts & Meter Readings.
    Target Schema: fleet_ops
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='fuel_logs')
    liters_filled = models.DecimalField(max_digits=8, decimal_places=2)
    cost_per_liter = models.DecimalField(max_digits=8, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_reading = models.IntegerField()
    station_name = models.CharField(max_length=100, default='TotalEnergies Mtito Andei')
    receipt_number = models.CharField(max_length=50)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fleet_ops"."fuel_logs'
        ordering = ['-logged_at']

    def __str__(self):
        return f"Fuel Receipt {self.receipt_number} - {self.liters_filled}L (Trip: {self.trip.id})"
