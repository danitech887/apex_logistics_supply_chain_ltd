"""
Warehouse CRM Services: Credit limit verifications and weighbridge tare validation.
"""
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.warehouse_crm.models import CorporateClient, Waybill


class CrmWarehouseService:
    """
    Enforces risk checks for commercial accounts and cargo weight accuracy.
    """

    @classmethod
    def verify_credit_standing(cls, client: CorporateClient, order_value: Decimal) -> bool:
        """
        Validates client credit exposure against assigned limits before order approval.
        """
        projected_balance = client.outstanding_balance + Decimal(str(order_value))
        if projected_balance > client.credit_limit:
            raise ValidationError({
                'credit_limit': (
                    f"Order value (KES {order_value}) pushes customer balance to "
                    f"KES {projected_balance}, exceeding credit ceiling of KES {client.credit_limit}."
                )
            })
        return True

    @classmethod
    def verify_weighbridge_weights(cls, waybill: Waybill, tare_kg: Decimal, gross_kg: Decimal) -> Waybill:
        """
        Validates tare and gross weighbridge readings to avoid highway axle-load fines.
        """
        tare = Decimal(str(tare_kg))
        gross = Decimal(str(gross_kg))

        if gross <= tare:
            raise ValidationError({'gross_weight_kg': 'Gross truck weight must exceed empty tare weight.'})

        net = gross - tare
        waybill.tare_weight_kg = tare
        waybill.gross_weight_kg = gross
        waybill.net_weight_kg = net
        waybill.tare_verified = True
        waybill.status = 'TARE_VERIFIED'
        waybill.save(update_fields=['tare_weight_kg', 'gross_weight_kg', 'net_weight_kg', 'tare_verified', 'status'])
        return waybill
