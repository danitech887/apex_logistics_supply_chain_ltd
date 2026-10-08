import uuid
from django.db import models
from .employee import Employee


class PayrollRun(models.Model):
    """
    Monthly or Bi-Weekly Enterprise Pay Run Batch.
    Target Schema: hr_payroll
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft Batch'),
        ('APPROVED', 'Approved by Finance & HR'),
        ('DISBURSED', 'Disbursed / Paid'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='payroll_runs')
    period_start = models.DateField()
    period_end = models.DateField()
    run_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    total_gross = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    total_net = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_payroll"."payroll_runs'
        ordering = ['-run_date']

    def __str__(self):
        return f"Payroll Run {self.period_start} to {self.period_end} ({self.status})"


class Payslip(models.Model):
    """
    Individual Employee Pay Slip with Statutory Deductions.
    Target Schema: hr_payroll
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey(Employee, on_delete=models.RESTRICT, related_name='payslips')
    base_pay = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)       # PAYE
    deductions_statutory = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # NSSF + SHA + Housing
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    calculation_breakdown = models.JSONField(default=dict, blank=True)
    pdf_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hr_payroll"."payslips'
        unique_together = ('payroll_run', 'employee')
        ordering = ['-created_at']

    def __str__(self):
        return f"Payslip - {self.employee.staff_number} - {self.payroll_run.period_end}"
