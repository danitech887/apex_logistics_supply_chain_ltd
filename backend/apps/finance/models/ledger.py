import uuid
from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from .account import Account


class JournalEntry(models.Model):
    """
    Header for Double-Entry Journal Transaction.
    Target Schema: finance
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='journal_entries')
    entry_date = models.DateField()
    reference_type = models.CharField(max_length=50) # 'TRIP_INVOICE', 'PAYROLL_RUN', 'FUEL_EXPENSE', 'MANUAL_JOURNAL'
    reference_id = models.UUIDField(null=True, blank=True)
    description = models.TextField()
    posted_by = models.ForeignKey('authentication.User', on_delete=models.RESTRICT, related_name='posted_journals')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'finance"."journal_entries'
        ordering = ['-entry_date', '-created_at']

    def __str__(self):
        return f"Journal {self.entry_date} - {self.description[:40]}"

    @property
    def total_debit(self):
        return sum((line.debit for line in self.lines.all()), Decimal('0.00'))

    @property
    def total_credit(self):
        return sum((line.credit for line in self.lines.all()), Decimal('0.00'))

    @property
    def is_balanced(self):
        return self.total_debit == self.total_credit


class JournalLine(models.Model):
    """
    Individual Debit or Credit line booked against an Account.
    Target Schema: finance
    """
    id = models.BigAutoField(primary_key=True)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.RESTRICT, related_name='journal_lines')
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'finance"."journal_lines'
        ordering = ['id']

    def clean(self):
        if self.debit < 0 or self.credit < 0:
            raise ValidationError('Debit and credit amounts cannot be negative.')
        if (self.debit > 0 and self.credit > 0) or (self.debit == 0 and self.credit == 0):
            raise ValidationError('A journal line must have either a positive debit OR a positive credit, not both or neither.')

    def __str__(self):
        if self.debit > 0:
            return f"DR {self.account.name}: {self.debit}"
        return f"CR {self.account.name}: {self.credit}"
