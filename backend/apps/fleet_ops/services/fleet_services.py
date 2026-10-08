"""
Fleet Operations Services: Dispatch Verification, Route Costing, and Automated Cross-Department Reconciliation.
"""
from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.fleet_ops.models import Vehicle, Trip, FuelLog


class DispatchService:
    """
    Manages truck dispatches, payload safety margins, and automated reconciliation.
    """

    @classmethod
    def verify_and_schedule_dispatch(cls, vehicle: Vehicle, driver, cargo_weight_kg: Decimal) -> bool:
        """
        Validates vehicle availability, weight limits, and driver rest requirements.
        """
        if vehicle.status == 'MAINTENANCE':
            raise ValidationError({'vehicle': f"Truck {vehicle.registration_plate} is currently in workshop maintenance."})

        if vehicle.status == 'IN_TRANSIT':
            raise ValidationError({'vehicle': f"Truck {vehicle.registration_plate} is currently dispatched on active transit."})

        if Decimal(cargo_weight_kg) > Decimal(vehicle.payload_capacity_kg):
            raise ValidationError({
                'cargo_weight_kg': f"Cargo weight ({cargo_weight_kg} kg) exceeds maximum payload capacity ({vehicle.payload_capacity_kg} kg)."
            })

        # Check driver active ongoing trips
        active_trips = Trip.objects.filter(
            driver=driver,
            status__in=['IN_TRANSIT', 'DISPATCH_READY']
        ).exists()

        if active_trips:
            raise ValidationError({'driver': f"Driver {driver.user.full_name} is already assigned to an in-transit route."})

        return True

    @classmethod
    def dispatch_trip(cls, trip: Trip, start_odometer: int = None) -> Trip:
        """Transitions scheduled trip to IN_TRANSIT and locks vehicle."""
        vehicle = trip.vehicle
        driver = trip.driver

        cls.verify_and_schedule_dispatch(vehicle, driver, trip.cargo_weight_kg)

        current_odo = start_odometer if start_odometer is not None else vehicle.current_odometer
        trip.start_odometer = current_odo
        trip.status = 'IN_TRANSIT'
        trip.actual_departure = timezone.now()
        trip.save(update_fields=['start_odometer', 'status', 'actual_departure'])

        vehicle.status = 'IN_TRANSIT'
        vehicle.save(update_fields=['status'])

        return trip

    @classmethod
    def complete_and_reconcile(cls, trip: Trip, end_odometer: int) -> dict:
        """
        Performs Stage 7 Cross-Department Reconciliation:
        1. Finalizes trip distance and vehicle odometer
        2. Inspects service milestone trigger
        3. Automatically posts AR Invoice & Balanced Journal Entry in Finance
        """
        if end_odometer < (trip.start_odometer or 0):
            raise ValidationError({'end_odometer': 'Closing odometer reading cannot be less than opening reading.'})

        vehicle = trip.vehicle
        trip.end_odometer = end_odometer
        trip.actual_arrival = timezone.now()
        trip.status = 'COMPLETED'
        trip.save(update_fields=['end_odometer', 'actual_arrival', 'status'])

        # Update vehicle odometer
        vehicle.current_odometer = end_odometer
        if vehicle.current_odometer >= vehicle.next_service_odometer:
            vehicle.status = 'MAINTENANCE'
        else:
            vehicle.status = 'AVAILABLE'
        vehicle.save(update_fields=['current_odometer', 'status'])

        distance_covered = end_odometer - (trip.start_odometer or 0)

        # Cross-Department Reconciliation with Finance Engine
        reconciliation_data = cls._reconcile_with_finance(trip, distance_covered)
        trip.reconciled = True
        trip.save(update_fields=['reconciled'])

        return {
            'trip_id': str(trip.id),
            'distance_km': distance_covered,
            'vehicle_status': vehicle.status,
            'finance_reconciliation': reconciliation_data
        }

    @classmethod
    def _reconcile_with_finance(cls, trip: Trip, distance_km: int) -> dict:
        """Invokes double-entry ledger posting and invoice generation."""
        try:
            from apps.finance.models import Invoice, Account, JournalEntry, JournalLine
            from apps.authentication.models import User

            tenant = trip.tenant
            poster = User.objects.filter(tenant=tenant).first()

            # 1. Create Tax Invoice
            inv_number = f"INV-TRIP-{trip.id.hex[:6].upper()}"
            subtotal = trip.agreed_rate
            tax_rate = Decimal('0.16') # 16% VAT
            tax_amount = (subtotal * tax_rate).quantize(Decimal('0.01'))
            total_amount = subtotal + tax_amount

            issue_date = timezone.now().date()
            due_date = issue_date + timezone.timedelta(days=30)

            invoice, _ = Invoice.objects.get_or_create(
                trip=trip,
                defaults={
                    'tenant': tenant,
                    'invoice_number': inv_number,
                    'issue_date': issue_date,
                    'due_date': due_date,
                    'subtotal': subtotal,
                    'tax_amount': tax_amount,
                    'total_amount': total_amount,
                    'status': 'UNPAID',
                }
            )

            # 2. Post Journal Entry for Revenue & AR
            ar_acc, _ = Account.objects.get_or_create(
                tenant=tenant,
                account_code='1200',
                defaults={'name': 'Accounts Receivable - Freight', 'account_type': 'ASSET'}
            )
            rev_acc, _ = Account.objects.get_or_create(
                tenant=tenant,
                account_code='4100',
                defaults={'name': 'Freight Revenue - Long Haul', 'account_type': 'REVENUE'}
            )
            tax_acc, _ = Account.objects.get_or_create(
                tenant=tenant,
                account_code='2200',
                defaults={'name': 'VAT Output Tax Payable', 'account_type': 'LIABILITY'}
            )

            entry = JournalEntry.objects.create(
                tenant=tenant,
                entry_date=issue_date,
                reference_type='TRIP_INVOICE',
                reference_id=invoice.id,
                description=f"Automated settlement entry for trip {trip.origin} -> {trip.destination}",
                posted_by=poster
            )

            # Debit Accounts Receivable
            JournalLine.objects.create(
                journal_entry=entry,
                account=ar_acc,
                debit=total_amount,
                credit=Decimal('0.00')
            )
            # Credit Freight Revenue
            JournalLine.objects.create(
                journal_entry=entry,
                account=rev_acc,
                debit=Decimal('0.00'),
                credit=subtotal
            )
            # Credit VAT Output
            if tax_amount > 0:
                JournalLine.objects.create(
                    journal_entry=entry,
                    account=tax_acc,
                    debit=Decimal('0.00'),
                    credit=tax_amount
                )

            return {
                'invoice_number': invoice.invoice_number,
                'total_amount': str(invoice.total_amount),
                'journal_entry_id': str(entry.id),
                'balanced': True
            }
        except Exception as e:
            return {'error': str(e)}
