import uuid
from django.db import models
from .vehicle import Vehicle


class Trip(models.Model):
    """
    Freight Transit Manifests and Operational Dispatches.
    Target Schema: fleet_ops
    """
    STATUS_CHOICES = [
        ('SCHEDULED', 'Trip Scheduled'),
        ('DISPATCH_READY', 'Dispatch Ready & Waybill Issued'),
        ('IN_TRANSIT', 'In Transit / On Highway'),
        ('COMPLETED', 'Completed & Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='trips')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.RESTRICT, related_name='trips')
    driver = models.ForeignKey('hr_payroll.Employee', on_delete=models.RESTRICT, related_name='trips')
    customer_id = models.UUIDField(null=True, blank=True)
    customer_name = models.CharField(max_length=150, default='Direct Freight Client')
    origin = models.CharField(max_length=100)          # e.g., 'Mombasa Port CFS'
    destination = models.CharField(max_length=100)     # e.g., 'Nairobi ICD Embakasi'
    cargo_description = models.TextField()             # e.g., '40ft Container - FMCG Consumer Goods'
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    agreed_rate = models.DecimalField(max_digits=12, decimal_places=2, default=120000.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='SCHEDULED')
    scheduled_departure = models.DateTimeField()
    actual_departure = models.DateTimeField(null=True, blank=True)
    actual_arrival = models.DateTimeField(null=True, blank=True)
    start_odometer = models.IntegerField(null=True, blank=True)
    end_odometer = models.IntegerField(null=True, blank=True)
    reconciled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fleet_ops"."trips'
        ordering = ['-scheduled_departure']

    def __str__(self):
        return f"Trip {self.origin} -> {self.destination} ({self.vehicle.registration_plate})"

    @property
    def distance_km(self):
        if self.start_odometer is not None and self.end_odometer is not None:
            return max(0, self.end_odometer - self.start_odometer)
        return 0
