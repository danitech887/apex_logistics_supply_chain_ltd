import uuid
from django.db import models


class Employee(models.Model):
    """
    Staff Profile and Payroll Baseline Parameters.
    Target Schema: hr_payroll
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('authentication.Tenant', on_delete=models.RESTRICT, related_name='employees')
    user = models.OneToOneField('authentication.User', on_delete=models.RESTRICT, related_name='employee_profile')
    staff_number = models.CharField(max_length=50)
    national_id = models.CharField(max_length=50)
    tax_pin = models.CharField(max_length=50)
    department = models.CharField(max_length=50)  # e.g., 'Operations', 'Finance', 'Fleet', 'HR'
    designation = models.CharField(max_length=100) # e.g., 'Heavy Commercial Driver', 'Senior Accountant'
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    date_of_hire = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hr_payroll"."employees'
        unique_together = ('tenant', 'staff_number')
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['staff_number']

    def __str__(self):
        return f"[{self.staff_number}] {self.user.full_name} ({self.designation})"
