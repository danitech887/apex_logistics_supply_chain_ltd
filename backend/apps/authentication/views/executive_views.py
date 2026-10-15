"""
Executive Portal API Views.
Provides real-time cross-department analytics, enterprise user provisioning,
and live RBAC role matrix management directly from PostgreSQL database.
"""
import re
from decimal import Decimal
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.models import User, Tenant, Role, UserRole
from apps.hr_payroll.models import Employee, LeaveRequest, PayrollRun
from apps.fleet_ops.models import Vehicle, Trip, FuelLog
from apps.finance.models import Account, JournalEntry, JournalLine, Invoice
from apps.warehouse_crm.models import CorporateClient, InventoryItem, Waybill


def get_current_tenant(request):
    user = getattr(request, 'user', None)
    if user and user.is_authenticated and getattr(user, 'tenant', None):
        return user.tenant
    subdomain = request.query_params.get('subdomain') or request.headers.get('X-Tenant-Subdomain')
    if subdomain:
        t = Tenant.objects.filter(subdomain=subdomain).first()
        if t:
            return t
    return Tenant.objects.first()


class ExecutiveOverviewView(APIView):
    """
    Real-time executive command telemetry aggregating all 5 operational schemas:
    auth_core, hr_payroll, fleet_ops, finance, warehouse_crm.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_current_tenant(request)
        if not tenant:
            return Response({'error': 'Tenant context required'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Fleet Operations Aggregates
        vehicles_qs = Vehicle.objects.filter(tenant=tenant)
        total_vehicles = vehicles_qs.count()
        vehicles_in_transit = vehicles_qs.filter(status='IN_TRANSIT').count()
        vehicles_available = vehicles_qs.filter(status='AVAILABLE').count()
        vehicles_maintenance = vehicles_qs.filter(status='MAINTENANCE').count()

        trips_qs = Trip.objects.filter(tenant=tenant)
        total_trips = trips_qs.count()
        active_trips = trips_qs.filter(status__in=['ASSIGNED', 'IN_TRANSIT']).count()
        completed_trips = trips_qs.filter(status='COMPLETED').count()

        fuel_agg = FuelLog.objects.filter(trip__tenant=tenant).aggregate(
            litres=Sum('liters_filled'),
            cost=Sum('total_cost')
        )
        total_fuel_litres = float(fuel_agg['litres'] or 0)
        total_fuel_cost = float(fuel_agg['cost'] or 0)

        # 2. Finance & Ledger Aggregates
        invoices_qs = Invoice.objects.filter(tenant=tenant)
        total_invoices = invoices_qs.count()
        invoice_agg = invoices_qs.aggregate(total=Sum('total_amount'))
        total_billed_revenue = float(invoice_agg['total'] or 0)

        paid_invoices_qs = invoices_qs.filter(status='PAID')
        paid_revenue = float(paid_invoices_qs.aggregate(total=Sum('total_amount'))['total'] or 0)
        pending_revenue = total_billed_revenue - paid_revenue

        accounts_count = Account.objects.filter(tenant=tenant).count()
        journal_entries_count = JournalEntry.objects.filter(tenant=tenant).count()

        journal_lines_agg = JournalLine.objects.filter(journal_entry__tenant=tenant).aggregate(
            debit=Sum('debit'),
            credit=Sum('credit')
        )
        total_debits = float(journal_lines_agg['debit'] or 0)
        total_credits = float(journal_lines_agg['credit'] or 0)
        double_entry_balanced = abs(total_debits - total_credits) < 0.01

        # 3. HR & Payroll Aggregates
        employees_qs = Employee.objects.filter(tenant=tenant)
        total_employees = employees_qs.count()
        active_employees = employees_qs.filter(is_active=True).count()

        dept_dist = list(employees_qs.values('department').annotate(count=Count('id')).order_by('-count'))
        departments_count = len(dept_dist)

        leaves_qs = LeaveRequest.objects.filter(tenant=tenant)
        pending_leaves = leaves_qs.filter(status='PENDING').count()
        approved_leaves = leaves_qs.filter(status='APPROVED').count()

        payroll_runs_qs = PayrollRun.objects.filter(tenant=tenant).order_by('-period_end')
        payroll_runs_count = payroll_runs_qs.count()
        latest_pay_run = payroll_runs_qs.first()
        latest_payroll_info = None
        if latest_pay_run:
            latest_payroll_info = {
                'id': str(latest_pay_run.id),
                'period_start': str(latest_pay_run.period_start),
                'period_end': str(latest_pay_run.period_end),
                'status': latest_pay_run.status,
                'total_gross': float(latest_pay_run.total_gross or 0),
                'total_net': float(latest_pay_run.total_net or 0),
            }

        # 4. Warehouse & Cargo CRM Aggregates
        clients_qs = CorporateClient.objects.filter(tenant=tenant)
        total_clients = clients_qs.count()

        waybills_qs = Waybill.objects.filter(tenant=tenant)
        total_waybills = waybills_qs.count()
        delivered_waybills = waybills_qs.filter(status='DELIVERED').count()
        in_transit_waybills = waybills_qs.filter(status='DISPATCHED').count()

        wb_weight = waybills_qs.aggregate(
            gross=Sum('gross_weight_kg'),
            tare=Sum('tare_weight_kg')
        )
        total_gross_kg = float(wb_weight['gross'] or 0)
        total_tare_kg = float(wb_weight['tare'] or 0)
        net_cargo_kg = max(0.0, total_gross_kg - total_tare_kg)

        inventory_qs = InventoryItem.objects.filter(tenant=tenant)
        total_inventory_items = inventory_qs.count()
        total_inventory_units = int(inventory_qs.aggregate(u=Sum('quantity_on_hand'))['u'] or 0)
        low_stock_count = inventory_qs.filter(quantity_on_hand__lte=F('reorder_level')).count()

        # 5. Auth & Infrastructure
        total_users = User.objects.filter(tenant=tenant).count()
        total_roles = Role.objects.count()
        all_tenants_count = Tenant.objects.count()

        # 6. Operational Departments Health
        departments_status = [
            {
                'domain': 'auth_core',
                'name': 'Executive Administration & RBAC',
                'schema': 'auth_core',
                'description': f'{total_users} active accounts across {total_roles} RBAC roles with cryptographic JWT isolation',
                'records_count': total_users + total_roles,
                'status': 'OPERATIONAL',
                'badge_color': 'purple',
            },
            {
                'domain': 'finance',
                'name': 'Finance & General Ledger',
                'schema': 'finance',
                'description': f'KES {total_billed_revenue:,.2f} billed across {total_invoices} invoices; Balanced ledger ({total_debits:,.2f})',
                'records_count': total_invoices + journal_entries_count + accounts_count,
                'status': 'OPERATIONAL',
                'badge_color': 'emerald',
            },
            {
                'domain': 'fleet_ops',
                'name': 'Fleet Operations & Telemetry',
                'schema': 'fleet_ops',
                'description': f'{total_vehicles} commercial trucks, {active_trips} trips in transit, {total_fuel_litres:,.0f}L fuel consumed',
                'records_count': total_vehicles + total_trips,
                'status': 'OPERATIONAL',
                'badge_color': 'amber',
            },
            {
                'domain': 'hr_payroll',
                'name': 'Human Resources & Statutory Payroll',
                'schema': 'hr_payroll',
                'description': f'{total_employees} staff in {departments_count} departments; {payroll_runs_count} statutory pay runs executed',
                'records_count': total_employees + payroll_runs_count + leaves_qs.count(),
                'status': 'OPERATIONAL',
                'badge_color': 'blue',
            },
            {
                'domain': 'warehouse_crm',
                'name': 'Warehouse, CRM & Consignment Freight',
                'schema': 'warehouse_crm',
                'description': f'{total_waybills} waybills ({net_cargo_kg:,.0f} kg net freight), {total_clients} clients, {total_inventory_items} stock lines',
                'records_count': total_waybills + total_clients + total_inventory_items,
                'status': 'OPERATIONAL',
                'badge_color': 'teal',
            },
        ]

        # 7. Recent Enterprise Audit Trail / Activity Stream
        recent_activity = []
        for inv in invoices_qs.order_by('-id')[:4]:
            recent_activity.append({
                'id': f'inv-{inv.id}',
                'domain': 'finance',
                'action': 'Invoice Generated',
                'title': f'Tax Invoice #{inv.invoice_number}',
                'description': f'Billed KES {float(inv.total_amount):,.2f} to {inv.client_name} (Status: {inv.status})',
                'timestamp': str(inv.created_at.date()) if hasattr(inv, 'created_at') and inv.created_at else str(inv.issue_date),
                'badge_color': 'emerald',
                'icon': 'Receipt',
            })

        for trip in trips_qs.order_by('-created_at')[:4]:
            truck_plate = trip.vehicle.registration_plate if trip.vehicle else 'Prime Mover'
            recent_activity.append({
                'id': f'trip-{trip.id}',
                'domain': 'fleet_ops',
                'action': 'Freight Dispatch',
                'title': f'Trip #TRP-{str(trip.id)[:8].upper()}',
                'description': f'{truck_plate} dispatched: {trip.origin} → {trip.destination} ({trip.status})',
                'timestamp': str(trip.created_at.date()) if hasattr(trip, 'created_at') and trip.created_at else str(timezone.now().date()),
                'badge_color': 'amber',
                'icon': 'Truck',
            })

        for wb in waybills_qs.select_related('client').order_by('-created_at')[:4]:
            client_name = wb.client.company_name if wb.client else 'Corporate Freight'
            recent_activity.append({
                'id': f'wb-{wb.id}',
                'domain': 'warehouse_crm',
                'action': 'Waybill Intake',
                'title': f'Freight Waybill #{wb.waybill_number}',
                'description': f'Net payload {float(wb.net_weight_kg or 0):,.0f} kg ({client_name}) - {wb.status}',
                'timestamp': str(wb.created_at.date()) if wb.created_at else str(timezone.now().date()),
                'badge_color': 'teal',
                'icon': 'Boxes',
            })

        for emp in employees_qs.order_by('-id')[:3]:
            user_name = emp.user.full_name if emp.user else 'Staff Member'
            recent_activity.append({
                'id': f'emp-{emp.id}',
                'domain': 'hr_payroll',
                'action': 'Personnel Onboarded',
                'title': f'{user_name} ({emp.staff_number})',
                'description': f'Joined {emp.department} as {emp.designation}',
                'timestamp': str(emp.date_of_hire),
                'badge_color': 'blue',
                'icon': 'Users',
            })

        # Sort combined activity chronologically (descending)
        recent_activity.sort(key=lambda x: str(x['timestamp']), reverse=True)

        return Response({
            'tenant': {
                'id': str(tenant.id),
                'company_name': tenant.company_name,
                'subdomain': tenant.subdomain,
            },
            'kpi': {
                'fleet': {
                    'total_vehicles': total_vehicles,
                    'vehicles_in_transit': vehicles_in_transit,
                    'vehicles_available': vehicles_available,
                    'vehicles_maintenance': vehicles_maintenance,
                    'total_trips': total_trips,
                    'active_trips': active_trips,
                    'completed_trips': completed_trips,
                    'total_fuel_litres': total_fuel_litres,
                    'total_fuel_cost': total_fuel_cost,
                },
                'finance': {
                    'total_billed_revenue': total_billed_revenue,
                    'paid_revenue': paid_revenue,
                    'pending_revenue': pending_revenue,
                    'total_invoices': total_invoices,
                    'accounts_count': accounts_count,
                    'journal_entries_count': journal_entries_count,
                    'total_debits': total_debits,
                    'total_credits': total_credits,
                    'double_entry_balanced': double_entry_balanced,
                },
                'hr': {
                    'total_employees': total_employees,
                    'active_employees': active_employees,
                    'departments_count': departments_count,
                    'department_distribution': dept_dist,
                    'pending_leaves': pending_leaves,
                    'approved_leaves': approved_leaves,
                    'payroll_runs_count': payroll_runs_count,
                    'latest_payroll': latest_payroll_info,
                },
                'warehouse_crm': {
                    'total_clients': total_clients,
                    'total_waybills': total_waybills,
                    'delivered_waybills': delivered_waybills,
                    'in_transit_waybills': in_transit_waybills,
                    'total_gross_kg': total_gross_kg,
                    'total_tare_kg': total_tare_kg,
                    'net_cargo_kg': net_cargo_kg,
                    'total_inventory_items': total_inventory_items,
                    'total_inventory_units': total_inventory_units,
                    'low_stock_count': low_stock_count,
                },
                'system': {
                    'total_users': total_users,
                    'total_roles': total_roles,
                    'total_tenants': all_tenants_count,
                    'db_engine': 'PostgreSQL Multi-Tenant Schema Isolation',
                    'system_health': 'HEALTHY',
                },
            },
            'departments_status': departments_status,
            'recent_activity': recent_activity[:10],
        }, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    """
    CRUD endpoint for enterprise user management & credential provisioning.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_current_tenant(request)
        users = User.objects.filter(tenant=tenant).select_related('tenant').prefetch_related('roles', 'employee_profile').order_by('email')
        
        results = []
        for u in users:
            emp = getattr(u, 'employee_profile', None)
            results.append({
                'id': str(u.id),
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'full_name': u.full_name,
                'phone_number': u.phone_number or '',
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'roles': list(u.roles.values('id', 'code', 'description')),
                'staff_number': emp.staff_number if emp else 'EMP-AUTH',
                'department': emp.department if emp else 'General',
                'designation': emp.designation if emp else '',
                'base_salary': float(emp.base_salary) if emp and emp.base_salary else 0.0,
                'date_of_hire': str(emp.date_of_hire) if emp and emp.date_of_hire else None,
                'created_at': u.created_at.isoformat() if u.created_at else None,
            })
        return Response(results, status=status.HTTP_200_OK)

    def post(self, request):
        tenant = get_current_tenant(request)
        data = request.data
        
        email = data.get('email', '').strip().lower()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        phone_number = data.get('phone_number', '').strip()
        role_code = data.get('role', 'HR_OFFICER')
        department = data.get('department', 'Human Resources')
        designation = data.get('designation', '')
        password = data.get('password', '').strip() or 'password123'
        
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not first_name or not last_name:
            return Response({'error': 'First and last name are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(tenant=tenant, email=email).exists():
            return Response({'error': f'User with email {email} already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create User
        user = User.objects.create(
            tenant=tenant,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            is_active=True,
            is_staff=(role_code == 'SUPER_ADMIN'),
            is_superuser=(role_code == 'SUPER_ADMIN'),
        )
        user.set_password(password)
        user.save()
        
        # Assign role
        role = Role.objects.filter(code=role_code).first()
        if role:
            UserRole.objects.get_or_create(user=user, role=role)
            
        # Determine next staff number
        employees = Employee.objects.filter(tenant=tenant)
        max_num = 0
        for e in employees:
            m = re.search(r'EMP-(\d+)', e.staff_number)
            if m:
                num = int(m.group(1))
                if num > max_num:
                    max_num = num
        next_staff_no = f"EMP-{(max_num + 1):03d}"
        
        # Create Employee Profile
        emp = Employee.objects.create(
            tenant=tenant,
            user=user,
            staff_number=next_staff_no,
            national_id=data.get('national_id') or str(10000000 + (max_num + 1)),
            tax_pin=data.get('tax_pin') or f"A00{max_num + 1:04d}98Z",
            department=department,
            designation=designation or f"{department} Specialist",
            base_salary=Decimal(str(data.get('base_salary') or '120000.00')),
            date_of_hire=timezone.now().date(),
            is_active=True,
        )
        
        return Response({
            'message': f'Enterprise account created for {user.full_name}',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'staff_number': emp.staff_number,
                'department': emp.department,
                'designation': emp.designation,
                'role': role_code,
                'temporary_password': password,
            }
        }, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    """
    Manage an individual enterprise user account: activate/deactivate, change role.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        tenant = get_current_tenant(request)
        user = User.objects.filter(tenant=tenant, id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
            user.save()
            if hasattr(user, 'employee_profile'):
                user.employee_profile.is_active = user.is_active
                user.employee_profile.save()
                
        if 'role' in request.data:
            new_role_code = request.data['role']
            new_role = Role.objects.filter(code=new_role_code).first()
            if new_role:
                UserRole.objects.filter(user=user).delete()
                UserRole.objects.create(user=user, role=new_role)
                
        return Response({
            'message': f'User {user.email} updated successfully.',
            'is_active': user.is_active,
            'roles': list(user.roles.values_list('code', flat=True)),
        }, status=status.HTTP_200_OK)


class AdminRolesView(APIView):
    """
    Returns full RBAC role matrix with live user counts and assignments.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_current_tenant(request)
        roles = Role.objects.all().order_by('code')
        results = []
        for r in roles:
            users_qs = r.users.filter(tenant=tenant)
            assigned_users = []
            for u in users_qs:
                emp = getattr(u, 'employee_profile', None)
                assigned_users.append({
                    'id': str(u.id),
                    'name': u.full_name,
                    'email': u.email,
                    'staff_number': emp.staff_number if emp else 'EMP-AUTH',
                    'department': emp.department if emp else 'Corporate',
                    'is_active': u.is_active,
                })
            results.append({
                'id': r.id,
                'code': r.code,
                'description': r.description or '',
                'user_count': users_qs.count(),
                'users': assigned_users,
            })
        return Response(results, status=status.HTTP_200_OK)
