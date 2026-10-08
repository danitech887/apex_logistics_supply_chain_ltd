import uuid
from django.db import models


class Invoice(models.Model):
    """
    Accounts Receivable (AR) Customer Invoices and AP Vendor Bills.
    Target Schema: finance
    """
    STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Settled / Paid'),
        ('VOID', 'Voided'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='invoices')
    trip = models.OneToOneField(
        'fleet_ops.Trip',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='invoice'
    )
    invoice_number = models.CharField(max_length=50)
    issue_date = models.DateField()
    due_date = models.DateField()
    client_name = models.CharField(max_length=150, default='Standard Corporate Client')
    client_pin = models.CharField(max_length=50, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNPAID')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'finance"."invoices'
        unique_together = ('tenant', 'invoice_number')
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.client_name} (KES {self.total_amount})"
