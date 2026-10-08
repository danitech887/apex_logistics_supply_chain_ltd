import uuid
from django.db import models


class Vehicle(models.Model):
    """
    Fleet Vehicle Registry, Telematics baseline & maintenance status.
    Target Schema: fleet_ops
    """
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available for Dispatch'),
        ('IN_TRANSIT', 'In Transit / On Route'),
        ('MAINTENANCE', 'In Workshop / Maintenance Due'),
        ('RETIRED', 'Decommissioned / Retired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='vehicles')
    registration_plate = models.CharField(max_length=20)
    make = models.CharField(max_length=50)       # e.g., 'Scania', 'Mercedes-Benz Actros', 'Isuzu'
    model = models.CharField(max_length=50)      # e.g., 'R500', '2640LS', 'FRR 90'
    payload_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    current_odometer = models.IntegerField(default=0)
    next_service_odometer = models.IntegerField(default=10000)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='AVAILABLE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fleet_ops"."vehicles'
        unique_together = ('tenant', 'registration_plate')
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'
        ordering = ['registration_plate']

    def __str__(self):
        return f"{self.registration_plate} - {self.make} {self.model} ({self.status})"

    @property
    def is_service_due(self):
        return self.current_odometer >= self.next_service_odometer
