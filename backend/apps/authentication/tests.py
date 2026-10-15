from decimal import Decimal
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import Tenant, User, Role, UserRole
from apps.hr_payroll.models import Employee


class AuthenticationQuickAccessTests(APITestCase):
    """
    Test suite for login page Quick-Access Department Profiles endpoint and authentication.
    """

    def setUp(self):
        self.tenant = Tenant.objects.create(
            company_name="Apex Logistics & Supply Chain Ltd",
            subdomain="apex-hq",
        )

        # Department Roles
        self.roles = {}
        for code in ["SUPER_ADMIN", "ACCOUNTANT", "HR_OFFICER", "FLEET_MANAGER", "DRIVER"]:
            role, _ = Role.objects.get_or_create(code=code, defaults={"description": f"{code} role"})
            self.roles[code] = role

        # Seed Department Users
        self.admin = User.objects.create_user(
            email="admin.test@apexlogistics.co.ke",
            password="password123",
            tenant=self.tenant,
            first_name="Catherine",
            last_name="Njeri",
        )
        UserRole.objects.create(user=self.admin, role=self.roles["SUPER_ADMIN"])
        Employee.objects.create(
            user=self.admin,
            tenant=self.tenant,
            staff_number="EMP-001",
            department="Executive Administration",
            designation="Managing Director",
            national_id="111111",
            tax_pin="A111111111X",
            date_of_hire="2020-01-01",
        )

        self.accountant = User.objects.create_user(
            email="accountant.test@apexlogistics.co.ke",
            password="password123",
            tenant=self.tenant,
            first_name="Wanjiku",
            last_name="Mwangi",
        )
        UserRole.objects.create(user=self.accountant, role=self.roles["ACCOUNTANT"])
        Employee.objects.create(
            user=self.accountant,
            tenant=self.tenant,
            staff_number="EMP-031",
            department="Finance & Accounts",
            designation="Financial Controller",
            national_id="222222",
            tax_pin="A222222222X",
            date_of_hire="2021-01-01",
        )

        self.fleet_manager = User.objects.create_user(
            email="fleet.test@apexlogistics.co.ke",
            password="password123",
            tenant=self.tenant,
            first_name="Hassan",
            last_name="Kipchoge",
        )
        UserRole.objects.create(user=self.fleet_manager, role=self.roles["FLEET_MANAGER"])
        Employee.objects.create(
            user=self.fleet_manager,
            tenant=self.tenant,
            staff_number="EMP-022",
            department="Fleet Operations",
            designation="Fleet Dispatch Superintendent",
            national_id="333333",
            tax_pin="A333333333X",
            date_of_hire="2021-06-01",
        )

    def test_quick_access_profiles_endpoint(self):
        """Test that public quick-access endpoint returns department profiles from database."""
        response = self.client.get("/api/v1/auth/quick-access-profiles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertGreaterEqual(len(data), 3)

        emails = [p["email"] for p in data]
        self.assertIn("admin.test@apexlogistics.co.ke", emails)
        self.assertIn("accountant.test@apexlogistics.co.ke", emails)
        self.assertIn("fleet.test@apexlogistics.co.ke", emails)

        admin_profile = next(p for p in data if p["email"] == "admin.test@apexlogistics.co.ke")
        self.assertEqual(admin_profile["staffNumber"], "EMP-001")
        self.assertEqual(admin_profile["department"], "Executive Administration")
        self.assertEqual(admin_profile["targetPortal"], "admin")
        self.assertTrue(admin_profile["isFromDatabase"])

    def test_authenticate_with_seeded_credentials(self):
        """Test authenticating with seeded corporate credentials."""
        response = self.client.post("/api/v1/auth/login/", {
            "email": "fleet.test@apexlogistics.co.ke",
            "password": "password123",
            "subdomain": "apex-hq",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["user"]["email"], "fleet.test@apexlogistics.co.ke")

    def test_authenticate_fails_with_invalid_password(self):
        """Test authentication rejection with wrong password."""
        response = self.client.post("/api/v1/auth/login/", {
            "email": "fleet.test@apexlogistics.co.ke",
            "password": "WrongPassword123!",
            "subdomain": "apex-hq",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
