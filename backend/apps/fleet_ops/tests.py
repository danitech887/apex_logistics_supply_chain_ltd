import uuid
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import Tenant, User, Role, UserRole
from apps.hr_payroll.models import Employee
from apps.fleet_ops.models import Vehicle, Trip, FuelLog
from apps.finance.models import Invoice, JournalEntry


class FleetDispatchOperationTests(APITestCase):
    """
    End-to-End Test Suite for Section 1: Live Dispatch Board and Fleet Operations.
    Validates:
    - Scheduling trips with dynamic vehicles and drivers
    - Axle payload limits and safety margins
    - Dispatch transition to IN_TRANSIT
    - Stage 7 Automated Cross-Department Reconciliation (AR Invoicing & GL Posting)
    """

    def setUp(self):
        self.tenant = Tenant.objects.create(
            company_name="Apex Logistics & Supply Chain Ltd",
            subdomain="apex-hq",
        )

        fleet_role, _ = Role.objects.get_or_create(code="FLEET_MANAGER", defaults={"description": "Fleet Manager"})
        driver_role, _ = Role.objects.get_or_create(code="DRIVER", defaults={"description": "Commercial Driver"})

        self.manager_user = User.objects.create_user(
            email="fleet.testmanager@apexlogistics.co.ke",
            password="TestPassword123!",
            tenant=self.tenant,
            first_name="Hassan",
            last_name="Kipchoge",
        )
        UserRole.objects.create(user=self.manager_user, role=fleet_role)

        self.driver_user = User.objects.create_user(
            email="driver.test@apexlogistics.co.ke",
            password="TestPassword123!",
            tenant=self.tenant,
            first_name="Peter",
            last_name="Karanja",
        )
        UserRole.objects.create(user=self.driver_user, role=driver_role)

        self.driver = Employee.objects.create(
            user=self.driver_user,
            tenant=self.tenant,
            staff_number="EMP-TEST-001",
            department="FLEET",
            designation="Long-Haul Commercial Driver",
            date_of_hire="2023-01-01",
            national_id="30112233",
            tax_pin="A001234567X",
            base_salary=Decimal("65000.00"),
        )

        self.vehicle = Vehicle.objects.create(
            tenant=self.tenant,
            registration_plate="KDF 111A",
            make="Scania",
            model="G460 6x4 Prime Mover",
            payload_capacity_kg=Decimal("30000.00"),
            current_odometer=50000,
            next_service_odometer=65000,
            status="AVAILABLE",
        )

        self.client.force_authenticate(user=self.manager_user)

    def test_schedule_trip_success(self):
        """Test scheduling a freight trip within rated vehicle payload capacity."""
        payload = {
            "vehicle": str(self.vehicle.id),
            "driver": str(self.driver.id),
            "customer_name": "Brookside Dairy Ltd",
            "origin": "Mombasa Port CFS",
            "destination": "Nairobi ICD Embakasi",
            "cargo_description": "40ft Refrigerated Container - Dairy Cargo",
            "cargo_weight_kg": 24000.00,
            "agreed_rate": 125000.00,
            "status": "SCHEDULED",
            "scheduled_departure": timezone.now().isoformat(),
            "start_odometer": self.vehicle.current_odometer,
        }

        response = self.client.post("/api/v1/fleet/trips/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "SCHEDULED")
        self.assertEqual(response.data["vehicle_plate"], "KDF 111A")

    def test_overload_payload_rejected(self):
        """Test that scheduling trips exceeding rated vehicle capacity is rejected."""
        payload = {
            "vehicle": str(self.vehicle.id),
            "driver": str(self.driver.id),
            "customer_name": "Heavy Steel Kenya",
            "origin": "Mombasa Port",
            "destination": "Eldoret Depot",
            "cargo_description": "Structural Steel Rebars",
            "cargo_weight_kg": 38000.00,  # Exceeds 30,000 kg capacity
            "agreed_rate": 180000.00,
            "status": "SCHEDULED",
            "scheduled_departure": timezone.now().isoformat(),
        }

        # Attempting to dispatch should trigger axle load validation
        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name=payload["customer_name"],
            origin=payload["origin"],
            destination=payload["destination"],
            cargo_description=payload["cargo_description"],
            cargo_weight_kg=payload["cargo_weight_kg"],
            agreed_rate=payload["agreed_rate"],
            scheduled_departure=timezone.now(),
        )

        response = self.client.post(
            f"/api/v1/fleet/trips/{trip.id}/dispatch/",
            {"start_odometer": 50000},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cargo_weight_kg", str(response.data))

    def test_full_dispatch_to_completion_lifecycle(self):
        """
        Verify the complete Section 1 cycle:
        1. Trip scheduled
        2. Dispatched onto highway (locks vehicle status to IN_TRANSIT)
        3. Delivery completed (verifies Stage 7 automated cross-department settlement)
        """
        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Unilever Kenya Ltd",
            origin="Mombasa Port CFS Gate 2",
            destination="Nairobi ICD Embakasi",
            cargo_description="High Value FMCG Consumables",
            cargo_weight_kg=Decimal("22000.00"),
            agreed_rate=Decimal("130000.00"),
            status="SCHEDULED",
            scheduled_departure=timezone.now(),
            start_odometer=50000,
        )

        # 1. Dispatch
        dispatch_res = self.client.post(
            f"/api/v1/fleet/trips/{trip.id}/dispatch/",
            {"start_odometer": 50000},
            format="json",
        )
        self.assertEqual(dispatch_res.status_code, status.HTTP_200_OK)
        trip.refresh_from_db()
        self.vehicle.refresh_from_db()
        self.assertEqual(trip.status, "IN_TRANSIT")
        self.assertEqual(self.vehicle.status, "IN_TRANSIT")

        # 2. Complete Delivery & Settle
        complete_res = self.client.post(
            f"/api/v1/fleet/trips/{trip.id}/complete/",
            {"end_odometer": 50485},
            format="json",
        )
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        trip.refresh_from_db()
        self.vehicle.refresh_from_db()

        self.assertEqual(trip.status, "COMPLETED")
        self.assertTrue(trip.reconciled)
        self.assertEqual(trip.end_odometer, 50485)
        self.assertEqual(trip.distance_km, 485)
        self.assertEqual(self.vehicle.current_odometer, 50485)
        self.assertEqual(self.vehicle.status, "AVAILABLE")

        # 3. Stage 7 Cross-Department Settlement Checks
        invoice = Invoice.objects.filter(trip=trip).first()
        self.assertIsNotNone(invoice)
        self.assertEqual(invoice.subtotal, Decimal("130000.00"))
        # 16% VAT = 20,800.00, Total = 150,800.00
        self.assertEqual(invoice.tax_amount, Decimal("20800.00"))
        self.assertEqual(invoice.total_amount, Decimal("150800.00"))

        journal = JournalEntry.objects.filter(reference_id=invoice.id).first()
        self.assertIsNotNone(journal)
        total_dr = sum(line.debit for line in journal.lines.all())
        total_cr = sum(line.credit for line in journal.lines.all())
        self.assertEqual(total_dr, total_cr)
        self.assertEqual(total_dr, Decimal("150800.00"))

    def test_closing_odometer_cannot_be_less_than_opening(self):
        """Test that odometer monotonicity is enforced."""
        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Test Shipper",
            origin="Mombasa",
            destination="Nairobi",
            cargo_description="Test Cargo",
            cargo_weight_kg=Decimal("15000.00"),
            agreed_rate=Decimal("100000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=50000,
        )

        res = self.client.post(
            f"/api/v1/fleet/trips/{trip.id}/complete/",
            {"end_odometer": 49000},  # Less than opening 50,000
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_odometer", str(res.data))

    def test_maintenance_flagged_when_service_threshold_exceeded(self):
        """Test that vehicle status changes to MAINTENANCE when next_service_odometer is reached."""
        self.vehicle.current_odometer = 64500
        self.vehicle.next_service_odometer = 65000
        self.vehicle.save()

        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Test Shipper",
            origin="Mombasa",
            destination="Nairobi",
            cargo_description="Test Cargo",
            cargo_weight_kg=Decimal("15000.00"),
            agreed_rate=Decimal("100000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=64500,
        )

        res = self.client.post(
            f"/api/v1/fleet/trips/{trip.id}/complete/",
            {"end_odometer": 65200},  # Exceeds 65,000 km threshold
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.status, "MAINTENANCE")
        self.assertEqual(res.data["vehicle_status"], "MAINTENANCE")

        # Test clearing service cycle via vehicle endpoint
        service_res = self.client.post(f"/api/v1/fleet/vehicles/{self.vehicle.id}/service_complete/")
        self.assertEqual(service_res.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.status, "AVAILABLE")
        self.assertEqual(self.vehicle.next_service_odometer, 65200 + 15000)

    def test_create_vehicle_asset(self):
        """Test registering a new commercial vehicle asset via API."""
        payload = {
            "registration_plate": "KDM 999X",
            "make": "Volvo",
            "model": "FH16 540 Globetrotter",
            "payload_capacity_kg": 34000.00,
            "current_odometer": 75000,
            "next_service_odometer": 90000,
            "status": "AVAILABLE",
        }
        res = self.client.post("/api/v1/fleet/vehicles/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["registration_plate"], "KDM 999X")
        self.assertEqual(res.data["make"], "Volvo")
        self.assertFalse(res.data["is_service_due"])

    def test_duplicate_plate_rejected(self):
        """Test that duplicate registration plates within the same tenant are rejected."""
        payload = {
            "registration_plate": "KDF 111A",  # Already exists in setUp
            "make": "Scania",
            "model": "G460",
            "payload_capacity_kg": 30000.00,
            "current_odometer": 10000,
            "next_service_odometer": 25000,
            "status": "AVAILABLE",
        }
        res = self.client.post("/api/v1/fleet/vehicles/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_vehicles_by_status(self):
        """Test filtering vehicles by status parameter."""
        Vehicle.objects.create(
            tenant=self.tenant,
            registration_plate="KDN 001B",
            make="Isuzu",
            model="FRR 90",
            payload_capacity_kg=Decimal("14000.00"),
            current_odometer=10000,
            next_service_odometer=25000,
            status="MAINTENANCE",
        )

        res_available = self.client.get("/api/v1/fleet/vehicles/?status=AVAILABLE")
        self.assertEqual(res_available.status_code, status.HTTP_200_OK)
        results = res_available.data.get("results", res_available.data)
        self.assertTrue(all(v["status"] == "AVAILABLE" for v in results))

        res_maint = self.client.get("/api/v1/fleet/vehicles/?status=MAINTENANCE")
        self.assertEqual(res_maint.status_code, status.HTTP_200_OK)
        maint_results = res_maint.data.get("results", res_maint.data)
        self.assertTrue(all(v["status"] == "MAINTENANCE" for v in maint_results))
        self.assertGreaterEqual(len(maint_results), 1)

    def test_create_fuel_log_with_auto_cost(self):
        """Test logging fuel procurement with auto-computed total cost and metadata."""
        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Grain Bulk Handlers",
            origin="Mombasa Port",
            destination="Nairobi Silos",
            cargo_description="Imported Wheat",
            cargo_weight_kg=Decimal("28000.00"),
            agreed_rate=Decimal("140000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=50000,
        )

        payload = {
            "trip": str(trip.id),
            "station_name": "TotalEnergies Mtito Andei Highway",
            "receipt_number": "RCP-2026-9901",
            "liters_filled": 350.00,
            "cost_per_liter": 185.50,
            "odometer_reading": 50250,
        }

        res = self.client.post("/api/v1/fleet/fuel-logs/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["station_name"], "TotalEnergies Mtito Andei Highway")
        self.assertEqual(res.data["receipt_number"], "RCP-2026-9901")
        self.assertEqual(res.data["vehicle_plate"], "KDF 111A")
        self.assertEqual(res.data["driver_name"], "Peter Karanja")
        # 350 * 185.50 = 64,925.00
        self.assertEqual(Decimal(str(res.data["total_cost"])), Decimal("64925.00"))

    def test_fuel_log_list_endpoint(self):
        """Test retrieving fuel log list with full route and vehicle metadata."""
        trip = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Bamburi Cement",
            origin="Mombasa",
            destination="Nairobi",
            cargo_description="Cement",
            cargo_weight_kg=Decimal("25000.00"),
            agreed_rate=Decimal("120000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=50000,
        )

        FuelLog.objects.create(
            trip=trip,
            station_name="Shell Voi Corridor Station",
            receipt_number="RCP-VOI-102",
            liters_filled=Decimal("200.00"),
            cost_per_liter=Decimal("186.00"),
            total_cost=Decimal("37200.00"),
            odometer_reading=50150,
        )

        res = self.client.get("/api/v1/fleet/fuel-logs/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get("results", res.data)
        self.assertGreaterEqual(len(results), 1)
        first = results[0]
        self.assertIn("vehicle_plate", first)
        self.assertIn("driver_name", first)
        self.assertIn("trip_origin", first)
        self.assertIn("trip_destination", first)

    def test_driver_ess_trips_and_fuel_scoping(self):
        """Test that driver querying trips and fuel logs receives only their own records."""
        # Create another driver and another vehicle
        other_user = User.objects.create_user(
            email="other.driver@apexlogistics.co.ke",
            password="TestPassword123!",
            tenant=self.tenant,
            first_name="Samuel",
            last_name="Kiprono",
        )
        other_driver = Employee.objects.create(
            user=other_user,
            tenant=self.tenant,
            staff_number="EMP-TEST-002",
            department="FLEET",
            designation="Regional Delivery Driver",
            date_of_hire="2023-05-01",
            national_id="30998877",
            tax_pin="A009876543Y",
            base_salary=Decimal("55000.00"),
        )
        other_vehicle = Vehicle.objects.create(
            tenant=self.tenant,
            registration_plate="KDH 222B",
            make="Mercedes-Benz",
            model="Actros 2645",
            payload_capacity_kg=Decimal("28000.00"),
            current_odometer=30000,
            next_service_odometer=45000,
            status="AVAILABLE",
        )

        trip_driver1 = Trip.objects.create(
            tenant=self.tenant,
            vehicle=self.vehicle,
            driver=self.driver,
            customer_name="Client A",
            origin="Mombasa Port CFS",
            destination="Nairobi ICD Embakasi",
            cargo_description="Dry Goods",
            cargo_weight_kg=Decimal("20000.00"),
            agreed_rate=Decimal("120000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=50000,
        )

        trip_other = Trip.objects.create(
            tenant=self.tenant,
            vehicle=other_vehicle,
            driver=other_driver,
            customer_name="Client B",
            origin="Nakuru Depot",
            destination="Kisumu CFS",
            cargo_description="Grain Silos",
            cargo_weight_kg=Decimal("18000.00"),
            agreed_rate=Decimal("95000.00"),
            status="IN_TRANSIT",
            scheduled_departure=timezone.now(),
            start_odometer=30000,
        )

        FuelLog.objects.create(
            trip=trip_driver1,
            station_name="TotalEnergies Mtito Andei Highway",
            receipt_number="RCP-PETER-01",
            liters_filled=Decimal("250.00"),
            cost_per_liter=Decimal("185.50"),
            total_cost=Decimal("46375.00"),
            odometer_reading=50200,
        )

        FuelLog.objects.create(
            trip=trip_other,
            station_name="Shell Nakuru Regional",
            receipt_number="RCP-OTHER-01",
            liters_filled=Decimal("180.00"),
            cost_per_liter=Decimal("186.00"),
            total_cost=Decimal("33480.00"),
            odometer_reading=30120,
        )

        # Authenticate as driver 1 (Peter Karanja)
        self.client.force_authenticate(user=self.driver_user)

        # 1. Trips query should only return trip_driver1
        trips_res = self.client.get("/api/v1/fleet/trips/")
        self.assertEqual(trips_res.status_code, status.HTTP_200_OK)
        trips_data = trips_res.data.get("results", trips_res.data)
        trip_ids = [t["id"] for t in trips_data]
        self.assertIn(str(trip_driver1.id), trip_ids)
        self.assertNotIn(str(trip_other.id), trip_ids)

        # 2. Fuel query should only return driver 1's fuel log
        fuel_res = self.client.get("/api/v1/fleet/fuel-logs/")
        self.assertEqual(fuel_res.status_code, status.HTTP_200_OK)
        fuel_data = fuel_res.data.get("results", fuel_res.data)
        receipts = [f["receipt_number"] for f in fuel_data]
        self.assertIn("RCP-PETER-01", receipts)
        self.assertNotIn("RCP-OTHER-01", receipts)

        # 3. Log fuel with updated odometer
        log_payload = {
            "trip": str(trip_driver1.id),
            "station_name": "Rubis Salama Bypass Station",
            "receipt_number": "RCP-PETER-02",
            "liters_filled": "200.00",
            "cost_per_liter": "185.50",
            "odometer_reading": 50450,
        }
        create_res = self.client.post("/api/v1/fleet/fuel-logs/", log_payload, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.current_odometer, 50450)

