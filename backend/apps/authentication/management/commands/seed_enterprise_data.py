import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.models import Tenant, Role, User, UserRole
from apps.hr_payroll.models import Employee, LeaveRequest
from apps.finance.models import Account, JournalEntry, JournalLine, Invoice
from apps.fleet_ops.models import Vehicle, Trip, FuelLog
from apps.warehouse_crm.models import CorporateClient, InventoryItem, Waybill

class Command(BaseCommand):
    help = 'Seeds initial tenant, roles, demo users, and employees into PostgreSQL database'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Enterprise Data...")

        # 1. Tenant
        tenant, created = Tenant.objects.get_or_create(
            subdomain='apex-hq',
            defaults={
                'company_name': 'Apex Logistics & Supply Chain Ltd',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created Tenant: {tenant.company_name} ({tenant.subdomain})"))
        else:
            self.stdout.write(f"Tenant already exists: {tenant.company_name}")

        # 2. Roles
        roles_data = [
            ('SUPER_ADMIN', 'Executive full administration & system control'),
            ('HR_OFFICER', 'Human resources, onboarding, and payroll governance'),
            ('FLEET_MANAGER', 'Fleet operations, telemetry, dispatch, and maintenance'),
            ('ACCOUNTANT', 'Financial general ledger, invoicing, and accounts'),
            ('DRIVER', 'Transit operations, driver trips, and employee self-service'),
            ('WAREHOUSE_SUPERVISOR', 'Warehouse operations, weighbridge tare/gross verification, and stock control'),
            ('PROCUREMENT_OFFICER', 'Vendor contracts, LPO generation, fuel/parts supplier sourcing, and requisitions'),
            ('SALES_MANAGER', 'Commercial freight accounts, rate card negotiations, sales pipeline, and freight contracts'),
            ('CLIENT', 'External B2B client consignee shipment tracking, POD access, and freight billing'),
        ]
        roles_dict = {}
        for code, desc in roles_data:
            role, _ = Role.objects.get_or_create(code=code, defaults={'description': desc})
            roles_dict[code] = role

        self.stdout.write(self.style.SUCCESS(f"Roles seeded: {list(roles_dict.keys())}"))

        # 3. Staff & Employees
        default_password = 'password123'
        staff_data = [
            {
                'first_name': 'Catherine',
                'last_name': 'Njeri',
                'email': 'admin@apexlogistics.co.ke',
                'phone': '+254 722 000 111',
                'role': 'SUPER_ADMIN',
                'staff_number': 'EMP-001',
                'national_id': '10293847',
                'tax_pin': 'A001928374M',
                'department': 'Executive Administration',
                'designation': 'Managing Director',
                'base_salary': Decimal('380000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2020-01-15',
            },
            {
                'first_name': 'Joseph',
                'last_name': 'Omondi',
                'email': 'hr.manager@apexlogistics.co.ke',
                'phone': '+254 733 111 222',
                'role': 'HR_OFFICER',
                'staff_number': 'EMP-014',
                'national_id': '19283746',
                'tax_pin': 'A002837465P',
                'department': 'Human Resources',
                'designation': 'Head of People & Culture',
                'base_salary': Decimal('210000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2021-03-01',
            },
            {
                'first_name': 'Hassan',
                'last_name': 'Kipchoge',
                'email': 'fleet.ops@apexlogistics.co.ke',
                'phone': '+254 712 333 444',
                'role': 'FLEET_MANAGER',
                'staff_number': 'EMP-022',
                'national_id': '28374650',
                'tax_pin': 'A003948576Q',
                'department': 'Fleet Operations',
                'designation': 'Fleet Dispatch Superintendent',
                'base_salary': Decimal('185000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2021-06-10',
            },
            {
                'first_name': 'Wanjiku',
                'last_name': 'Mwangi, CPA',
                'email': 'finance.lead@apexlogistics.co.ke',
                'phone': '+254 721 555 666',
                'role': 'ACCOUNTANT',
                'staff_number': 'EMP-031',
                'national_id': '37482910',
                'tax_pin': 'A004123984R',
                'department': 'Finance & Accounts',
                'designation': 'Financial Controller',
                'base_salary': Decimal('240000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2021-02-01',
            },
            {
                'first_name': 'Michael',
                'last_name': 'Kamau',
                'email': 'm.kamau@apexlogistics.co.ke',
                'phone': '+254 711 777 888',
                'role': 'DRIVER',
                'staff_number': 'EMP-041',
                'national_id': '46281930',
                'tax_pin': 'A009124892K',
                'department': 'Transit Operations',
                'designation': 'Heavy Commercial Lead Driver',
                'base_salary': Decimal('55000.00'),
                'hourly_rate': Decimal('280.00'),
                'date_of_hire': '2022-04-18',
            },
            {
                'first_name': 'Bernard',
                'last_name': 'Mutua',
                'email': 'b.mutua@apexlogistics.co.ke',
                'phone': '+254 714 888 999',
                'role': 'DRIVER',
                'staff_number': 'EMP-042',
                'national_id': '58291039',
                'tax_pin': 'A008273645T',
                'department': 'Transit Operations',
                'designation': 'Commercial Freight Driver',
                'base_salary': Decimal('52000.00'),
                'hourly_rate': Decimal('260.00'),
                'date_of_hire': '2022-05-02',
            },
            {
                'first_name': 'Dennis',
                'last_name': 'Kiprotich',
                'email': 'd.kiprotich@apexlogistics.co.ke',
                'phone': '+254 723 999 000',
                'role': 'DRIVER',
                'staff_number': 'EMP-070',
                'national_id': '69201928',
                'tax_pin': 'A007384950U',
                'department': 'Workshop',
                'designation': 'Master Diesel Technician',
                'base_salary': Decimal('85000.00'),
                'hourly_rate': Decimal('420.00'),
                'date_of_hire': '2022-08-15',
            },
            {
                'first_name': 'Kevin',
                'last_name': 'Wafula',
                'email': 'k.wafula@apexlogistics.co.ke',
                'phone': '+254 722 445 566',
                'role': 'WAREHOUSE_SUPERVISOR',
                'staff_number': 'EMP-055',
                'national_id': '32145678',
                'tax_pin': 'A005678912W',
                'department': 'Warehouse & Inventory Control',
                'designation': 'Warehouse Operations Supervisor',
                'base_salary': Decimal('145000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2021-09-01',
            },
            {
                'first_name': 'Amina',
                'last_name': 'Abdi',
                'email': 'a.abdi@apexlogistics.co.ke',
                'phone': '+254 713 667 788',
                'role': 'PROCUREMENT_OFFICER',
                'staff_number': 'EMP-061',
                'national_id': '34567890',
                'tax_pin': 'A006789012A',
                'department': 'Procurement & Vendor Management',
                'designation': 'Head of Procurement & Sourcing',
                'base_salary': Decimal('195000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2021-04-15',
            },
            {
                'first_name': 'Brian',
                'last_name': 'Otieno',
                'email': 'b.otieno@apexlogistics.co.ke',
                'phone': '+254 725 889 900',
                'role': 'SALES_MANAGER',
                'staff_number': 'EMP-018',
                'national_id': '29876543',
                'tax_pin': 'A007890123O',
                'department': 'Sales & Business Development',
                'designation': 'Commercial Accounts Manager',
                'base_salary': Decimal('175000.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2020-11-01',
            },
            {
                'first_name': 'James',
                'last_name': 'Kariuki',
                'email': 'unilever.logistics@apexlogistics.co.ke',
                'phone': '+254 720 123 999',
                'role': 'CLIENT',
                'staff_number': 'CLIENT-001',
                'national_id': '21345678',
                'tax_pin': 'P051123456Z',
                'department': 'Unilever Kenya Logistics Desk',
                'designation': 'Corporate Cargo Consignee Lead',
                'base_salary': Decimal('0.00'),
                'hourly_rate': Decimal('0.00'),
                'date_of_hire': '2022-01-01',
            },
        ]

        for s in staff_data:
            user, u_created = User.objects.get_or_create(
                email=s['email'],
                defaults={
                    'tenant': tenant,
                    'first_name': s['first_name'],
                    'last_name': s['last_name'],
                    'phone_number': s['phone'],
                    'is_active': True,
                    'is_staff': (s['role'] == 'SUPER_ADMIN'),
                    'is_superuser': (s['role'] == 'SUPER_ADMIN'),
                }
            )
            user.set_password(default_password)
            user.save()

            role = roles_dict[s['role']]
            UserRole.objects.get_or_create(user=user, role=role)

            emp, e_created = Employee.objects.get_or_create(
                tenant=tenant,
                staff_number=s['staff_number'],
                defaults={
                    'user': user,
                    'national_id': s['national_id'],
                    'tax_pin': s['tax_pin'],
                    'department': s['department'],
                    'designation': s['designation'],
                    'base_salary': s['base_salary'],
                    'hourly_rate': s['hourly_rate'],
                    'date_of_hire': s['date_of_hire'],
                    'is_active': True,
                }
            )
            if not e_created:
                emp.user = user
                emp.national_id = s['national_id']
                emp.tax_pin = s['tax_pin']
                emp.department = s['department']
                emp.designation = s['designation']
                emp.base_salary = s['base_salary']
                emp.hourly_rate = s['hourly_rate']
                emp.date_of_hire = s['date_of_hire']
                emp.is_active = True
                emp.save()

            self.stdout.write(f"Processed employee: {emp.staff_number} - {user.full_name}")

        # Seed realistic initial leave requests
        hr_manager_user = User.objects.filter(email='hr.manager@apexlogistics.co.ke').first()
        leaves_data = [
            {
                'staff_number': 'EMP-041',
                'leave_type': 'ANNUAL',
                'start_date': '2026-10-12',
                'end_date': '2026-10-19',
                'days_requested': 7,
                'status': 'PENDING',
                'reason': 'Mandatory driver fatigue recovery leave post Northern Corridor Mombasa-Kigali transit run.',
                'approved_by': None,
                'rejection_reason': '',
            },
            {
                'staff_number': 'EMP-042',
                'leave_type': 'SICK',
                'start_date': '2026-10-09',
                'end_date': '2026-10-12',
                'days_requested': 3,
                'status': 'PENDING',
                'reason': 'Outpatient medical consultation & recovery prescribed by hospital doctor.',
                'approved_by': None,
                'rejection_reason': '',
            },
            {
                'staff_number': 'EMP-070',
                'leave_type': 'ANNUAL',
                'start_date': '2026-10-01',
                'end_date': '2026-10-07',
                'days_requested': 6,
                'status': 'APPROVED',
                'reason': 'Scheduled annual workshop technician rotation rest.',
                'approved_by': hr_manager_user,
                'rejection_reason': '',
            },
            {
                'staff_number': 'EMP-001',
                'leave_type': 'COMPASSIONATE',
                'start_date': '2026-09-22',
                'end_date': '2026-09-26',
                'days_requested': 4,
                'status': 'APPROVED',
                'reason': 'Urgent bereavement attendance and family arrangement.',
                'approved_by': hr_manager_user,
                'rejection_reason': '',
            },
            {
                'staff_number': 'EMP-071',
                'leave_type': 'UNPAID',
                'start_date': '2026-10-15',
                'end_date': '2026-10-25',
                'days_requested': 10,
                'status': 'REJECTED',
                'reason': 'Personal project sabbatical request during peak quarterly closing.',
                'approved_by': hr_manager_user,
                'rejection_reason': 'Staffing restrictions during Q4 enterprise logistics peak audit window.',
            },
        ]

        for lv in leaves_data:
            emp = Employee.objects.filter(tenant=tenant, staff_number=lv['staff_number']).first()
            if emp:
                l_obj, created = LeaveRequest.objects.get_or_create(
                    tenant=tenant,
                    employee=emp,
                    start_date=lv['start_date'],
                    end_date=lv['end_date'],
                    defaults={
                        'leave_type': lv['leave_type'],
                        'days_requested': lv['days_requested'],
                        'status': lv['status'],
                        'reason': lv['reason'],
                        'approved_by': lv['approved_by'],
                        'rejection_reason': lv['rejection_reason'],
                    }
                )
                if created:
                    self.stdout.write(f"Created Leave: {emp.staff_number} - {lv['leave_type']} ({lv['status']})")

        # Seed Finance & Chart of Accounts
        accountant_user = User.objects.filter(email='finance.lead@apexlogistics.co.ke').first() or User.objects.first()

        accounts_data = [
            {'code': '1000', 'name': 'KCB Corporate Operating Bank Account', 'type': 'ASSET'},
            {'code': '1200', 'name': 'Accounts Receivable - Corporate Freight Clients', 'type': 'ASSET'},
            {'code': '1500', 'name': 'Commercial Truck Fleet Capital Assets', 'type': 'ASSET'},
            {'code': '2000', 'name': 'Accounts Payable - Fuel & Spare Suppliers', 'type': 'LIABILITY'},
            {'code': '2200', 'name': 'VAT Output Tax Payable to KRA (16%)', 'type': 'LIABILITY'},
            {'code': '3000', 'name': 'Shareholders Paid-in Capital', 'type': 'EQUITY'},
            {'code': '3500', 'name': 'Retained Operational Earnings', 'type': 'EQUITY'},
            {'code': '4100', 'name': 'Freight Revenue - Long Haul Transit', 'type': 'REVENUE'},
            {'code': '5100', 'name': 'Direct Fleet Fuel & En-Route Diesel Expense', 'type': 'EXPENSE'},
            {'code': '5200', 'name': 'Driver Mileage Per-Diem & Shift Allowances', 'type': 'EXPENSE'},
        ]
        acc_dict = {}
        for a in accounts_data:
            acc_obj, created = Account.objects.get_or_create(
                tenant=tenant,
                account_code=a['code'],
                defaults={
                    'name': a['name'],
                    'account_type': a['type'],
                    'is_active': True,
                }
            )
            acc_dict[a['code']] = acc_obj
            if created:
                self.stdout.write(f"Created GL Account: [{a['code']}] {a['name']}")

        # Seed Opening & Operational Journal Entries (Double-Entry Invariant)
        if not JournalEntry.objects.filter(tenant=tenant).exists():
            # Journal 1: FY2026 Opening Balance Sheet
            j1 = JournalEntry.objects.create(
                tenant=tenant,
                entry_date='2026-01-01',
                reference_type='OPENING_BALANCE',
                description='FY2026 General Ledger Opening Balances & Share Capital',
                posted_by=accountant_user,
            )
            # Debits (Assets) = 540,600,000
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['1000'], debit=Decimal('42150000.00'), credit=Decimal('0.00'))
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['1200'], debit=Decimal('18450000.00'), credit=Decimal('0.00'))
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['1500'], debit=Decimal('480000000.00'), credit=Decimal('0.00'))
            # Credits (Liabilities & Equity) = 540,600,000
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['2000'], debit=Decimal('0.00'), credit=Decimal('14200000.00'))
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['2200'], debit=Decimal('0.00'), credit=Decimal('2371200.00'))
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['3000'], debit=Decimal('0.00'), credit=Decimal('300000000.00'))
            JournalLine.objects.create(journal_entry=j1, account=acc_dict['3500'], debit=Decimal('0.00'), credit=Decimal('224028800.00'))

            # Journal 2: Freight Transit Billing - Northern Corridor
            j2 = JournalEntry.objects.create(
                tenant=tenant,
                entry_date='2026-10-04',
                reference_type='TRIP_INVOICE',
                description='Revenue recognition: Mombasa Port CFS to Nairobi ICD haulage',
                posted_by=accountant_user,
            )
            JournalLine.objects.create(journal_entry=j2, account=acc_dict['1200'], debit=Decimal('156600.00'), credit=Decimal('0.00'))
            JournalLine.objects.create(journal_entry=j2, account=acc_dict['4100'], debit=Decimal('0.00'), credit=Decimal('135000.00'))
            JournalLine.objects.create(journal_entry=j2, account=acc_dict['2200'], debit=Decimal('0.00'), credit=Decimal('21600.00'))

            # Journal 3: Bulk Fleet Fuel Settlement - Shell Athi River
            j3 = JournalEntry.objects.create(
                tenant=tenant,
                entry_date='2026-10-05',
                reference_type='FUEL_EXPENSE',
                description='Diesel bulk settlement: 3,200 Liters en-route fueling',
                posted_by=accountant_user,
            )
            JournalLine.objects.create(journal_entry=j3, account=acc_dict['5100'], debit=Decimal('485000.00'), credit=Decimal('0.00'))
            JournalLine.objects.create(journal_entry=j3, account=acc_dict['1000'], debit=Decimal('0.00'), credit=Decimal('485000.00'))

            self.stdout.write("Created initial General Ledger Journal Entries.")

        # Seed Invoices (AR)
        invoices_data = [
            {
                'invoice_number': 'INV-2026-0814',
                'client_name': 'Brookside Dairy Ltd',
                'client_pin': 'P051928374M',
                'subtotal': Decimal('110000.00'),
                'tax_amount': Decimal('17600.00'),
                'total_amount': Decimal('127600.00'),
                'issue_date': '2026-10-02',
                'due_date': '2026-11-01',
                'status': 'PAID',
            },
            {
                'invoice_number': 'INV-2026-0815',
                'client_name': 'Unilever Kenya Ltd',
                'client_pin': 'P051199482X',
                'subtotal': Decimal('135000.00'),
                'tax_amount': Decimal('21600.00'),
                'total_amount': Decimal('156600.00'),
                'issue_date': '2026-10-04',
                'due_date': '2026-11-03',
                'status': 'UNPAID',
            },
            {
                'invoice_number': 'INV-2026-0816',
                'client_name': 'Bidco Africa Ltd',
                'client_pin': 'P051827364Y',
                'subtotal': Decimal('98000.00'),
                'tax_amount': Decimal('15680.00'),
                'total_amount': Decimal('113680.00'),
                'issue_date': '2026-10-05',
                'due_date': '2026-11-04',
                'status': 'UNPAID',
            },
            {
                'invoice_number': 'INV-2026-0817',
                'client_name': 'Bamburi Cement Plc',
                'client_pin': 'P051338829K',
                'subtotal': Decimal('240000.00'),
                'tax_amount': Decimal('38400.00'),
                'total_amount': Decimal('278400.00'),
                'issue_date': '2026-10-06',
                'due_date': '2026-11-05',
                'status': 'UNPAID',
            },
        ]
        for inv in invoices_data:
            i_obj, created = Invoice.objects.get_or_create(
                tenant=tenant,
                invoice_number=inv['invoice_number'],
                defaults=inv
            )
            if created:
                self.stdout.write(f"Created Invoice: {inv['invoice_number']} - {inv['client_name']}")

        # 6. Seed Fleet Operations (Vehicles, Trips, Fuel Logs)
        vehicles_data = [
            {
                'registration_plate': 'KDG 412M',
                'make': 'Scania',
                'model': 'R500 Highline Prime Mover',
                'payload_capacity_kg': Decimal('32000.00'),
                'current_odometer': 142585,
                'next_service_odometer': 145000,
                'status': 'IN_TRANSIT',
            },
            {
                'registration_plate': 'KDE 889P',
                'make': 'Mercedes-Benz',
                'model': 'Actros 2640LS 6x4',
                'payload_capacity_kg': Decimal('30000.00'),
                'current_odometer': 89340,
                'next_service_odometer': 90000,
                'status': 'AVAILABLE',
            },
            {
                'registration_plate': 'KDA 102Z',
                'make': 'Isuzu',
                'model': 'FRR 90 Forward Medium Freight',
                'payload_capacity_kg': Decimal('14000.00'),
                'current_odometer': 216010,
                'next_service_odometer': 215000,
                'status': 'MAINTENANCE',
            },
            {
                'registration_plate': 'KDB 773Y',
                'make': 'Volvo',
                'model': 'FH16 540 Globetrotter',
                'payload_capacity_kg': Decimal('34000.00'),
                'current_odometer': 112000,
                'next_service_odometer': 125000,
                'status': 'AVAILABLE',
            },
            {
                'registration_plate': 'KDC 551L',
                'make': 'MAN',
                'model': 'TGX 26.480 EfficientLine',
                'payload_capacity_kg': Decimal('31000.00'),
                'current_odometer': 64500,
                'next_service_odometer': 75000,
                'status': 'AVAILABLE',
            },
        ]

        veh_dict = {}
        for v in vehicles_data:
            v_obj, created = Vehicle.objects.get_or_create(
                tenant=tenant,
                registration_plate=v['registration_plate'],
                defaults=v
            )
            veh_dict[v['registration_plate']] = v_obj
            if created:
                self.stdout.write(f"Created Vehicle: {v_obj.registration_plate} - {v_obj.make} {v_obj.model}")

        # Seed Trips
        emp_michael = Employee.objects.filter(tenant=tenant, staff_number='EMP-041').first()
        emp_bernard = Employee.objects.filter(tenant=tenant, staff_number='EMP-042').first()
        emp_peter = Employee.objects.filter(tenant=tenant, staff_number='EMP-070').first()

        if emp_michael and emp_bernard and emp_peter:
            trips_data = [
                {
                    'vehicle': veh_dict['KDG 412M'],
                    'driver': emp_michael,
                    'customer_name': 'Brookside Dairy Ltd',
                    'origin': 'Mombasa Port CFS',
                    'destination': 'Nairobi ICD Embakasi',
                    'cargo_description': '40ft Ambient Container - FMCG Cargo',
                    'cargo_weight_kg': Decimal('28000.00'),
                    'agreed_rate': Decimal('135000.00'),
                    'status': 'IN_TRANSIT',
                    'scheduled_departure': timezone.now() - timezone.timedelta(hours=6),
                    'actual_departure': timezone.now() - timezone.timedelta(hours=5),
                    'start_odometer': 142100,
                    'reconciled': False,
                },
                {
                    'vehicle': veh_dict['KDE 889P'],
                    'driver': emp_bernard,
                    'customer_name': 'Unilever Kenya Ltd',
                    'origin': 'Nairobi Central Depot',
                    'destination': 'Kisumu Regional CFS',
                    'cargo_description': 'Pharmaceutical & Medical Consumables',
                    'cargo_weight_kg': Decimal('14500.00'),
                    'agreed_rate': Decimal('98000.00'),
                    'status': 'SCHEDULED',
                    'scheduled_departure': timezone.now() + timezone.timedelta(hours=4),
                    'start_odometer': 89340,
                    'reconciled': False,
                },
                {
                    'vehicle': veh_dict['KDA 102Z'],
                    'driver': emp_peter,
                    'customer_name': 'Bidco Africa Ltd',
                    'origin': 'Nakuru Milling Silos',
                    'destination': 'Mombasa Port Export Gate',
                    'cargo_description': '20ft Bulk Grain Feed',
                    'cargo_weight_kg': Decimal('26000.00'),
                    'agreed_rate': Decimal('110000.00'),
                    'status': 'COMPLETED',
                    'scheduled_departure': timezone.now() - timezone.timedelta(days=1, hours=8),
                    'actual_departure': timezone.now() - timezone.timedelta(days=1, hours=7),
                    'actual_arrival': timezone.now() - timezone.timedelta(hours=2),
                    'start_odometer': 215400,
                    'end_odometer': 216010,
                    'reconciled': True,
                },
            ]

            created_trips = []
            for t in trips_data:
                t_obj, created = Trip.objects.get_or_create(
                    tenant=tenant,
                    vehicle=t['vehicle'],
                    driver=t['driver'],
                    origin=t['origin'],
                    destination=t['destination'],
                    defaults=t
                )
                created_trips.append(t_obj)
                if created:
                    self.stdout.write(f"Created Trip: {t_obj.origin} -> {t_obj.destination} ({t['vehicle'].registration_plate})")

            # Seed Fuel Logs
            if len(created_trips) >= 2:
                fuel_logs = [
                    {
                        'trip': created_trips[0],
                        'liters_filled': Decimal('380.00'),
                        'cost_per_liter': Decimal('185.50'),
                        'total_cost': Decimal('70490.00'),
                        'odometer_reading': 142350,
                        'station_name': 'TotalEnergies Mtito Andei Highway',
                        'receipt_number': 'FL-2026-9011',
                    },
                    {
                        'trip': created_trips[2],
                        'liters_filled': Decimal('420.00'),
                        'cost_per_liter': Decimal('186.00'),
                        'total_cost': Decimal('78120.00'),
                        'odometer_reading': 215720,
                        'station_name': 'Shell Voi Corridor Station',
                        'receipt_number': 'FL-2026-8942',
                    },
                ]
                for fl in fuel_logs:
                    fl_obj, created = FuelLog.objects.get_or_create(
                        trip=fl['trip'],
                        receipt_number=fl['receipt_number'],
                        defaults=fl
                    )
                    if created:
                        self.stdout.write(f"Created Fuel Log: {fl_obj.receipt_number} - {fl_obj.liters_filled}L ({fl_obj.station_name})")

        # 8. Seed Corporate Clients, Inventory Items & Waybills
        clients_data = [
            {
                'company_name': 'Unilever Kenya Ltd',
                'contact_person': 'James Kariuki',
                'email': 'unilever.logistics@apexlogistics.co.ke',
                'phone': '+254 720 123 999',
                'tax_pin': 'P051123456Z',
                'credit_limit': Decimal('2500000.00'),
                'outstanding_balance': Decimal('450000.00'),
                'payment_terms_days': 30,
            },
            {
                'company_name': 'Bidco Africa Ltd',
                'contact_person': 'Rajesh Shah',
                'email': 'r.shah@bidco-africa.com',
                'phone': '+254 733 987 654',
                'tax_pin': 'P051234567A',
                'credit_limit': Decimal('3000000.00'),
                'outstanding_balance': Decimal('1120000.00'),
                'payment_terms_days': 45,
            },
            {
                'company_name': 'Brookside Dairy Ltd',
                'contact_person': 'Mercy Chebet',
                'email': 'm.chebet@brookside.co.ke',
                'phone': '+254 721 456 789',
                'tax_pin': 'P051345678B',
                'credit_limit': Decimal('1800000.00'),
                'outstanding_balance': Decimal('280000.00'),
                'payment_terms_days': 30,
            },
            {
                'company_name': 'Bamburi Cement Ltd',
                'contact_person': 'George Muriuki',
                'email': 'g.muriuki@bamburi.lafarge.com',
                'phone': '+254 722 654 321',
                'tax_pin': 'P051456789C',
                'credit_limit': Decimal('4000000.00'),
                'outstanding_balance': Decimal('890000.00'),
                'payment_terms_days': 60,
            },
        ]
        client_objs = {}
        for c in clients_data:
            c_obj, _ = CorporateClient.objects.get_or_create(
                tenant=tenant,
                tax_pin=c['tax_pin'],
                defaults=c
            )
            client_objs[c['company_name']] = c_obj

        items_data = [
            {
                'sku': 'TIRE-315-80R22.5',
                'description': 'Michelin X Multiway 3D Heavy Steering Tire (315/80 R22.5)',
                'warehouse_location': 'Nairobi Central ICD Hub - Bay 4A',
                'quantity_on_hand': 48,
                'unit_weight_kg': Decimal('68.50'),
                'reorder_level': 12,
            },
            {
                'sku': 'TIRE-12.00R20',
                'description': 'Bridgestone M840 Heavy Drive Axle Commercial Tire (12.00 R20)',
                'warehouse_location': 'Mombasa Port Yard - Bay 2B',
                'quantity_on_hand': 36,
                'unit_weight_kg': Decimal('74.00'),
                'reorder_level': 10,
            },
            {
                'sku': 'OIL-15W40-200L',
                'description': 'Shell Rimula R4 X 15W-40 Heavy Duty Diesel Engine Oil 200L Drum',
                'warehouse_location': 'Workshop Lubricants Stores - Bay L1',
                'quantity_on_hand': 14,
                'unit_weight_kg': Decimal('195.00'),
                'reorder_level': 5,
            },
            {
                'sku': 'BRK-CHAMBER-T24',
                'description': 'Knorr-Bremse Type 24/30 Spring Brake Actuator Chamber',
                'warehouse_location': 'Workshop Spares Rack 12',
                'quantity_on_hand': 22,
                'unit_weight_kg': Decimal('9.80'),
                'reorder_level': 8,
            },
            {
                'sku': 'PAL-DET-500KG',
                'description': 'Unilever OMO Auto Concentrated Powder Bulk Pallet (500kg)',
                'warehouse_location': 'Warehouse Ambient Bay C3',
                'quantity_on_hand': 85,
                'unit_weight_kg': Decimal('520.00'),
                'reorder_level': 20,
            },
            {
                'sku': 'AGRI-CORN-50KG',
                'description': 'Bidco Industrial Refined Corn Starch 50kg Heavy Export Sacks',
                'warehouse_location': 'Warehouse Dry Silo Wing 1',
                'quantity_on_hand': 320,
                'unit_weight_kg': Decimal('50.00'),
                'reorder_level': 50,
            },
            {
                'sku': 'FLTR-FUEL-FS197',
                'description': 'Fleetguard FS19732 High-Efficiency Fuel Water Separator Filter',
                'warehouse_location': 'Workshop Spares Rack 04',
                'quantity_on_hand': 64,
                'unit_weight_kg': Decimal('1.20'),
                'reorder_level': 15,
            },
        ]
        for itm in items_data:
            InventoryItem.objects.get_or_create(
                tenant=tenant,
                sku=itm['sku'],
                defaults=itm
            )

        trip_list = list(Trip.objects.filter(tenant=tenant))
        trip_a = trip_list[0] if len(trip_list) > 0 else None
        trip_b = trip_list[1] if len(trip_list) > 1 else None

        waybills_data = [
            {
                'waybill_number': 'WB-2026-0891',
                'client': client_objs.get('Unilever Kenya Ltd'),
                'trip': trip_a,
                'tare_weight_kg': Decimal('14200.00'),
                'gross_weight_kg': Decimal('38400.00'),
                'net_weight_kg': Decimal('24200.00'),
                'tare_verified': True,
                'status': 'DISPATCHED',
            },
            {
                'waybill_number': 'WB-2026-0892',
                'client': client_objs.get('Bidco Africa Ltd'),
                'trip': trip_b,
                'tare_weight_kg': Decimal('15100.00'),
                'gross_weight_kg': Decimal('41100.00'),
                'net_weight_kg': Decimal('26000.00'),
                'tare_verified': True,
                'recipient_signature': 'R. Shah - Bidco Port Agent',
                'status': 'DELIVERED',
            },
            {
                'waybill_number': 'WB-2026-0893',
                'client': client_objs.get('Brookside Dairy Ltd'),
                'trip': None,
                'tare_weight_kg': Decimal('13800.00'),
                'gross_weight_kg': Decimal('28300.00'),
                'net_weight_kg': Decimal('14500.00'),
                'tare_verified': True,
                'status': 'TARE_VERIFIED',
            },
            {
                'waybill_number': 'WB-2026-0894',
                'client': client_objs.get('Bamburi Cement Ltd'),
                'trip': None,
                'tare_weight_kg': Decimal('14600.00'),
                'gross_weight_kg': Decimal('0.00'),
                'net_weight_kg': Decimal('0.00'),
                'tare_verified': False,
                'status': 'GENERATED',
            },
        ]
        for wb in waybills_data:
            if wb['client']:
                Waybill.objects.get_or_create(
                    tenant=tenant,
                    waybill_number=wb['waybill_number'],
                    defaults=wb
                )

        self.stdout.write(self.style.SUCCESS("All enterprise seed data successfully written!"))
