"""
Views and ViewSets for HR, Leaves, and Payroll Operations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.hr_payroll.models import Employee, LeaveRequest, PayrollRun, Payslip
from apps.hr_payroll.serializers import (
    EmployeeSerializer,
    LeaveRequestSerializer,
    PayrollRunSerializer,
    PayslipSerializer,
)
from apps.hr_payroll.tasks import bulk_run_payroll_generation, generate_payslip_pdf
from apps.hr_payroll.services import PayrollCalculator
from django.db.models import Q, Sum
from django.utils import timezone
from apps.authentication.models import Tenant
from common.permissions import IsHROfficer


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.filter(tenant=user.tenant_id).select_related('user').prefetch_related('user__roles')
        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department__iexact=dept)

        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(staff_number__icontains=search) |
                Q(national_id__icontains=search) |
                Q(tax_pin__icontains=search) |
                Q(designation__icontains=search) |
                Q(department__icontains=search)
            )
        return qs.order_by('staff_number')

    def perform_create(self, serializer):
        tenant = getattr(self.request.user, 'tenant', None)
        if not tenant:
            tenant = Tenant.objects.first()
        emp = serializer.save(tenant=tenant)
        # Automatically recalculate current active payroll run so new employee appears immediately
        if not emp.staff_number.startswith('CLIENT'):
            open_runs = PayrollRun.objects.filter(tenant=tenant, status__in=['DRAFT', 'APPROVED']).order_by('-period_end')
            current_run = open_runs.first()
            if current_run:
                try:
                    bulk_run_payroll_generation(str(current_run.id))
                except Exception:
                    pass

    @action(detail=False, methods=['get'])
    def next_staff_number(self, request):
        """
        Determines the next sequential staff number for the tenant (e.g. EMP-072).
        """
        import re
        tenant = getattr(request.user, 'tenant', None) or Tenant.objects.first()
        employees = Employee.objects.filter(tenant=tenant)
        max_num = 0
        for emp in employees:
            m = re.search(r'EMP-(\d+)', emp.staff_number)
            if m:
                num = int(m.group(1))
                if num > max_num:
                    max_num = num
        next_num = max_num + 1 if max_num > 0 else 1
        return Response({'next_staff_number': f"EMP-{next_num:03d}"}, status=status.HTTP_200_OK)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant_id = getattr(user, 'tenant_id', None)
        qs = LeaveRequest.objects.filter(tenant=tenant_id).select_related(
            'employee__user', 'approved_by'
        ).order_by('-created_at')

        # Non-HR and non-admin see only their own requests
        if not user.has_role('HR_OFFICER') and not user.has_role('SUPER_ADMIN'):
            qs = qs.filter(employee__user=user)

        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'ALL':
            qs = qs.filter(status=status_param)

        leave_type_param = self.request.query_params.get('leave_type')
        if leave_type_param and leave_type_param != 'ALL':
            qs = qs.filter(leave_type=leave_type_param)

        search_param = self.request.query_params.get('search')
        if search_param:
            qs = qs.filter(
                Q(employee__user__first_name__icontains=search_param) |
                Q(employee__user__last_name__icontains=search_param) |
                Q(employee__staff_number__icontains=search_param) |
                Q(employee__department__icontains=search_param) |
                Q(reason__icontains=search_param)
            )

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        employee = serializer.validated_data.get('employee')
        if not employee:
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                employee = Employee.objects.filter(tenant=user.tenant).first()
        serializer.save(tenant=user.tenant, employee=employee)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = self.request.user
        tenant_id = getattr(user, 'tenant_id', None)
        qs = LeaveRequest.objects.filter(tenant=tenant_id)
        if not user.has_role('HR_OFFICER') and not user.has_role('SUPER_ADMIN'):
            qs = qs.filter(employee__user=user)

        today = timezone.now().date()
        total = qs.count()
        pending = qs.filter(status='PENDING').count()
        approved = qs.filter(status='APPROVED').count()
        rejected = qs.filter(status='REJECTED').count()
        on_leave_today = qs.filter(status='APPROVED', start_date__lte=today, end_date__gte=today).count()
        total_approved_days = qs.filter(status='APPROVED').aggregate(
            total=Sum('days_requested')
        )['total'] or 0

        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'on_leave_today': on_leave_today,
            'total_approved_days': total_approved_days,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsHROfficer])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'APPROVED'
        leave.approved_by = request.user
        leave.rejection_reason = ''
        leave.save(update_fields=['status', 'approved_by', 'rejection_reason', 'updated_at'])
        return Response({
            'status': 'success',
            'message': f'Leave request for {leave.employee.staff_number} approved successfully.',
            'leave': LeaveRequestSerializer(leave).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsHROfficer])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'REJECTED'
        leave.rejection_reason = request.data.get('reason', 'Application rejected according to HR operational policies.')
        leave.approved_by = request.user
        leave.save(update_fields=['status', 'rejection_reason', 'approved_by', 'updated_at'])
        return Response({
            'status': 'success',
            'message': f'Leave request for {leave.employee.staff_number} rejected.',
            'leave': LeaveRequestSerializer(leave).data
        })


class PayrollRunViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAuthenticated, IsHROfficer]

    def get_queryset(self):
        user = self.request.user
        tenant_id = getattr(user, 'tenant_id', None)
        return PayrollRun.objects.filter(tenant=tenant_id).prefetch_related('payslips').order_by('-period_end')

    def perform_create(self, serializer):
        tenant = getattr(self.request.user, 'tenant', None)
        if not tenant:
            tenant = Tenant.objects.first()
        run = serializer.save(tenant=tenant)
        bulk_run_payroll_generation(str(run.id))

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Triggers or recalculates the statutory payroll calculation batch."""
        run = self.get_object()
        result = bulk_run_payroll_generation(str(run.id))
        run.refresh_from_db()
        serializer = self.get_serializer(run)
        return Response({
            'status': 'Payroll calculation completed successfully.',
            'batch_results': result,
            'payroll_run': serializer.data
        }, status=status.HTTP_200_OK)


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Payslip.objects.filter(payroll_run__tenant=user.tenant_id).select_related('employee__user', 'employee', 'payroll_run')
        if not user.has_role('HR_OFFICER') and not user.has_role('ACCOUNTANT') and not user.has_role('SUPER_ADMIN'):
            qs = qs.filter(employee__user=user)

        run_id = self.request.query_params.get('payroll_run') or self.request.query_params.get('run_id')
        if run_id:
            qs = qs.filter(payroll_run_id=run_id)

        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            qs = qs.filter(
                Q(employee__user__first_name__icontains=search) |
                Q(employee__user__last_name__icontains=search) |
                Q(employee__staff_number__icontains=search) |
                Q(employee__department__icontains=search)
            )
        return qs.order_by('employee__staff_number')

    @action(detail=False, methods=['get'])
    def my_payslips(self, request):
        """ESS endpoint returning the logged-in staff member's payslips."""
        payslips = Payslip.objects.filter(
            employee__user=request.user
        ).select_related('payroll_run').order_by('-payroll_run__period_end')
        serializer = self.get_serializer(payslips, many=True)
        return Response(serializer.data)
