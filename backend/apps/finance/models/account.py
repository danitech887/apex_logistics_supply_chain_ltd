from django.db import models


class Account(models.Model):
    """
    Chart of Accounts for Enterprise Financial Ledger.
    Target Schema: finance
    """
    ACCOUNT_TYPES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('REVENUE', 'Revenue'),
        ('EXPENSE', 'Expense'),
    ]

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='accounts')
    account_code = models.CharField(max_length=20)   # e.g., '1000' Cash, '1200' AR, '2000' AP, '4100' Revenue
    name = models.CharField(max_length=100)          # e.g., 'National Bank Operating Account'
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'finance"."accounts'
        unique_together = ('tenant', 'account_code')
        verbose_name = 'General Ledger Account'
        verbose_name_plural = 'General Ledger Accounts'
        ordering = ['account_code']

    def __str__(self):
        return f"[{self.account_code}] {self.name} ({self.account_type})"
