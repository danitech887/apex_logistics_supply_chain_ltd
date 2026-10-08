import uuid
from decimal import Decimal
from django.db import models


class CorporateClient(models.Model):
    """
    Corporate Shipping and Ambient Warehousing Clients.
    Target Schema: warehouse_crm
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='clients')
    company_name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    tax_pin = models.CharField(max_length=50)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payment_terms_days = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouse_crm"."clients'
        unique_together = ('tenant', 'tax_pin')
        ordering = ['company_name']

    def __str__(self):
        return f"{self.company_name} (Credit: KES {self.credit_limit})"

    @property
    def available_credit(self):
        return max(Decimal('0.00'), self.credit_limit - self.outstanding_balance)


class InventoryItem(models.Model):
    """
    Warehouse Stocked Goods & Consumables.
    Target Schema: warehouse_crm
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='inventory_items')
    sku = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    warehouse_location = models.CharField(max_length=50, default='Nairobi Central ICD Hub')
    quantity_on_hand = models.IntegerField(default=0)
    unit_weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    reorder_level = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouse_crm"."inventory_items'
        unique_together = ('tenant', 'sku')
        ordering = ['sku']

    def __str__(self):
        return f"[{self.sku}] {self.description} ({self.quantity_on_hand} in stock)"


class Waybill(models.Model):
    """
    Digital Waybill with Verified Tare and Gross Weighbridge Weights.
    Target Schema: warehouse_crm
    """
    STATUS_CHOICES = [
        ('GENERATED', 'Waybill Generated'),
        ('TARE_VERIFIED', 'Weighbridge Tare Verified'),
        ('DISPATCHED', 'Dispatched with Driver'),
        ('DELIVERED', 'Delivered & POD Signed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='waybills')
    waybill_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(CorporateClient, on_delete=models.RESTRICT, related_name='waybills')
    trip = models.ForeignKey('fleet_ops.Trip', on_delete=models.SET_NULL, null=True, blank=True, related_name='waybills')
    tare_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gross_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tare_verified = models.BooleanField(default=False)
    recipient_signature = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='GENERATED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouse_crm"."waybills'
        ordering = ['-created_at']

    def __str__(self):
        return f"Waybill #{self.waybill_number} - {self.client.company_name}"
