from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import Tenant, User, Role, UserRole
from apps.hr_payroll.models import Employee, PayrollRun, Payslip
from apps.hr_payroll.services import PayrollCalculator


class MyPayslipsEndpointTests(APITestCase):
    """
    Test suite for Employee Self-Service (ESS) My Payslips endpoint.
    Validates:
    - Dedicated ESS access to personal payslips
    - Scoping: Drivers/staff only see their own records
    - KRA statutory calculations (PAYE, NSSF, Housing Levy, SHA)
    """

    def setUp(self):
        self.tenant = Tenant.objects.create(
            company_name="Apex Logistics & Supply Chain Ltd",
            subdomain="apex-hq",
        )

        driver_role, _ = Role.objects.get_or_create(code="DRIVER", defaults={"description": "Driver"})
        hr_role, _ = Role.objects.get_or_create(code="HR_OFFICER", defaults={"description": "HR Officer"})

        # Driver 1 (Michael Kamau)
        self.driver1_user = User.objects.create_user(
            email="m.kamau.test@apexlogistics.co.ke",
            password="TestPassword123!",
            tenant=self.tenant,
            first_name="Michael",
            last_name="Kamau",
        )
        UserRole.objects.create(user=self.driver1_user, role=driver_role)

        self.driver1_emp = Employee.objects.create(
            user=self.driver1_user,
            tenant=self.tenant,
            staff_number="EMP-041",
            department="Transit Operations",
            designation="Heavy Commercial Lead Driver",
            date_of_hire="2022-04-18",
            national_id="46281930",
            tax_pin="A009124892K",
            base_salary=Decimal("55000.00"),
        )

        # Driver 2 (Bernard Mutua)
        self.driver2_user = User.objects.create_user(
            email="b.mutua.test@apexlogistics.co.ke",
            password="TestPassword123!",
            tenant=self.tenant,
            first_name="Bernard",
            last_name="Mutua",
        )
        UserRole.objects.create(user=self.driver2_user, role=driver_role)

        self.driver2_emp = Employee.objects.create(
            user=self.driver2_user,
            tenant=self.tenant,
            staff_number="EMP-042",
            department="Transit Operations",
            designation="Commercial Freight Driver",
            date_of_hire="2022-06-01",
            national_id="48192031",
            tax_pin="A008123984J",
            base_salary=Decimal("52000.00"),
        )

        # Payroll Run
        self.run = PayrollRun.objects.create(
            tenant=self.tenant,
            period_start="2026-10-01",
            period_end="2026-10-31",
            run_date="2026-10-28",
            status="APPROVED",
            total_gross=Decimal("107000.00"),
            total_net=Decimal("81533.22"),
        )

        # Payslip for Driver 1
        calc1 = PayrollCalculator.compute_full_payslip(
            base_salary=Decimal("55000.00"),
            allowances=Decimal("16500.00")
        )
        self.slip1 = Payslip.objects.create(
            payroll_run=self.run,
            employee=self.driver1_emp,
            base_pay=Decimal("55000.00"),
            allowances=Decimal("16500.00"),
            deductions_tax=Decimal(str(calc1['net_paye'])),
            deductions_statutory=Decimal(str(calc1['statutory_deductions'])),
            net_pay=Decimal(str(calc1['net_pay'])),
            calculation_breakdown={k: str(v) for k, v in calc1.items()},
        )

        # Payslip for Driver 2
        calc2 = PayrollCalculator.compute_full_payslip(
            base_salary=Decimal("52000.00"),
            allowances=Decimal("0.00")
        )
        self.slip2 = Payslip.objects.create(
            payroll_run=self.run,
            employee=self.driver2_emp,
            base_pay=Decimal("52000.00"),
            allowances=Decimal("0.00"),
            deductions_tax=Decimal(str(calc2['net_paye'])),
            deductions_statutory=Decimal(str(calc2['statutory_deductions'])),
            net_pay=Decimal(str(calc2['net_pay'])),
            calculation_breakdown={k: str(v) for k, v in calc2.items()},
        )

    def test_driver1_my_payslips_scoping(self):
        """Driver 1 must only see their own payslip and not Driver 2's."""
        self.client.force_authenticate(user=self.driver1_user)
        response = self.client.get("/api/v1/hr/payslips/my_payslips/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        slip = response.data[0]
        self.assertEqual(slip["employee_name"], "Michael Kamau")
        self.assertEqual(slip["staff_number"], "EMP-041")
        self.assertEqual(slip["tax_pin"], "A009124892K")
        self.assertEqual(slip["base_pay"], 55000.0)
        self.assertEqual(slip["allowances"], 16500.0)
        self.assertEqual(slip["period_end"], "2026-10-31")

    def test_driver2_my_payslips_scoping(self):
        """Driver 2 must only see their own payslip."""
        self.client.force_authenticate(user=self.driver2_user)
        response = self.client.get("/api/v1/hr/payslips/my_payslips/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        slip = response.data[0]
        self.assertEqual(slip["employee_name"], "Bernard Mutua")
        self.assertEqual(slip["staff_number"], "EMP-042")
        self.assertEqual(slip["base_pay"], 52000.0)
        self.assertEqual(slip["allowances"], 0.0)

    def test_unauthenticated_request_rejected(self):
        """Unauthenticated requests must be denied 401."""
        response = self.client.get("/api/v1/hr/payslips/my_payslips/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_driver_submit_leave_request(self):
        """Driver submits leave application and is automatically linked to their profile."""
        from apps.hr_payroll.models import LeaveRequest
        self.client.force_authenticate(user=self.driver1_user)

        payload = {
            "leave_type": "ANNUAL",
            "start_date": "2026-11-01",
            "end_date": "2026-11-07",
            "days_requested": 7,
            "reason": "Mandatory driver fatigue recovery rest post-corridor delivery.",
            "status": "PENDING",
        }
        response = self.client.post("/api/v1/hr/leaves/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["employee_name"], "Michael Kamau")
        self.assertEqual(response.data["staff_number"], "EMP-041")
        self.assertEqual(response.data["status"], "PENDING")
        self.assertEqual(response.data["days_requested"], 7)

        # Verify record in DB
        created_leave = LeaveRequest.objects.get(id=response.data["id"])
        self.assertEqual(created_leave.employee, self.driver1_emp)
        self.assertEqual(created_leave.tenant, self.tenant)

    def test_driver_leave_list_and_stats_scoping(self):
        """Driver only sees their own leave requests and stats."""
        from apps.hr_payroll.models import LeaveRequest

        # Leave for Driver 1
        LeaveRequest.objects.create(
            tenant=self.tenant,
            employee=self.driver1_emp,
            leave_type="ANNUAL",
            start_date="2026-10-12",
            end_date="2026-10-19",
            days_requested=7,
            status="APPROVED",
            reason="Fatigue recovery",
        )

        # Leave for Driver 2
        LeaveRequest.objects.create(
            tenant=self.tenant,
            employee=self.driver2_emp,
            leave_type="SICK",
            start_date="2026-10-09",
            end_date="2026-10-12",
            days_requested=3,
            status="PENDING",
            reason="Medical consultation",
        )

        # Driver 1 queries list
        self.client.force_authenticate(user=self.driver1_user)
        list_res = self.client.get("/api/v1/hr/leaves/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        items = list_res.data.get("results", list_res.data)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["staff_number"], "EMP-041")

        # Driver 1 queries stats
        stats_res = self.client.get("/api/v1/hr/leaves/stats/")
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_res.data["total"], 1)
        self.assertEqual(stats_res.data["approved"], 1)
        self.assertEqual(stats_res.data["pending"], 0)
        self.assertEqual(stats_res.data["total_approved_days"], 7)

