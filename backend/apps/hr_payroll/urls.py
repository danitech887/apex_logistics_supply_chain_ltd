from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.hr_payroll.views import (
    EmployeeViewSet,
    LeaveRequestViewSet,
    PayrollRunViewSet,
    PayslipViewSet,
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'leaves', LeaveRequestViewSet, basename='leave')
router.register(r'payroll-runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payslips', PayslipViewSet, basename='payslip')

urlpatterns = [
    path('', include(router.urls)),
]
