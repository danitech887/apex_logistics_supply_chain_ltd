from decimal import Decimal
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import Tenant, User, Role, UserRole
from apps.warehouse_crm.models import CorporateClient, InventoryItem, Waybill


class WarehouseCRMTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            company_name="Apex Logistics & Supply Chain Ltd",
            subdomain="apex-hq",
        )
        self.role, _ = Role.objects.get_or_create(code="SUPER_ADMIN", defaults={"description": "Admin"})
        self.user = User.objects.create_user(
            email="kevin.wafula@apexlogistics.co.ke",
            password="password123",
            tenant=self.tenant,
            first_name="Kevin",
            last_name="Wafula",
        )
        UserRole.objects.create(user=self.user, role=self.role)
        self.client.force_authenticate(user=self.user)

        self.corp_client = CorporateClient.objects.create(
            tenant=self.tenant,
            company_name="Unilever Kenya Ltd",
            contact_person="James Kariuki",
            email="logistics@unilever.com",
            phone="+254 700 111 222",
            tax_pin="P051123456Z",
            credit_limit=Decimal("2500000.00"),
            payment_terms_days=30,
        )

        self.item = InventoryItem.objects.create(
            tenant=self.tenant,
            sku="SKU-PLT-001",
            description="Standard ISO Wooden Pallet",
            warehouse_location="ICD Bay A-12",
            quantity_on_hand=150,
            unit_weight_kg=Decimal("25.00"),
            reorder_level=20,
        )

        self.waybill = Waybill.objects.create(
            tenant=self.tenant,
            waybill_number="WB-2026-TEST01",
            client=self.corp_client,
            tare_weight_kg=Decimal("14200.00"),
            gross_weight_kg=Decimal("42200.00"),
            net_weight_kg=Decimal("28000.00"),
            status="GENERATED",
        )

    def test_adjust_credit_limit(self):
        url = f"/api/v1/warehouse-crm/clients/{self.corp_client.id}/adjust_credit_limit/"
        res = self.client.post(url, {"credit_limit": 3000000.00})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.corp_client.refresh_from_db()
        self.assertEqual(self.corp_client.credit_limit, Decimal("3000000.00"))

    def test_adjust_stock_inbound(self):
        url = f"/api/v1/warehouse-crm/inventory/{self.item.id}/adjust_stock/"
        res = self.client.post(url, {
            "movement_type": "INBOUND",
            "quantity": 50,
            "reason": "Test pallet intake",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity_on_hand, 200)

    def test_verify_weighbridge(self):
        url = f"/api/v1/warehouse-crm/waybills/{self.waybill.id}/verify_weighbridge/"
        res = self.client.post(url, {
            "tare_weight_kg": 14500.00,
            "gross_weight_kg": 43500.00,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.waybill.refresh_from_db()
        self.assertTrue(self.waybill.tare_verified)
        self.assertEqual(self.waybill.net_weight_kg, Decimal("29000.00"))
        self.assertEqual(self.waybill.status, "TARE_VERIFIED")

    def test_sign_pod(self):
        url = f"/api/v1/warehouse-crm/waybills/{self.waybill.id}/sign_pod/"
        res = self.client.post(url, {
            "recipient_signature": "James Kariuki (Recipient Lead)",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.waybill.refresh_from_db()
        self.assertEqual(self.waybill.status, "DELIVERED")
        self.assertEqual(self.waybill.recipient_signature, "James Kariuki (Recipient Lead)")

    def test_weighbridge_stats(self):
        url = "/api/v1/warehouse-crm/waybills/weighbridge_stats/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("total_waybills", res.data)
        self.assertIn("kenha_compliance_rate", res.data)
