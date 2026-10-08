"""
Views and ViewSets for General Ledger, Invoicing, and Financial Statements.
"""
import uuid
from decimal import Decimal
from django.db.models import Sum, Q
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.finance.models import Account, JournalEntry, Invoice
from apps.finance.serializers import (
    AccountSerializer,
    JournalEntrySerializer,
    CreateJournalEntrySerializer,
    InvoiceSerializer,
)
from apps.finance.services import DoubleEntryEngine
from common.permissions import IsAccountant


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Account.objects.filter(tenant=self.request.user.tenant_id)
        acc_type = self.request.query_params.get('type')
        if acc_type:
            qs = qs.filter(account_type=acc_type.upper())
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class JournalEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAccountant]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateJournalEntrySerializer
        return JournalEntrySerializer

    def get_queryset(self):
        return JournalEntry.objects.filter(
            tenant=self.request.user.tenant_id
        ).select_related('posted_by').prefetch_related('lines__account')

    def create(self, request, *args, **kwargs):
        serializer = CreateJournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        entry = DoubleEntryEngine.post_journal_entry(
            tenant=request.user.tenant,
            entry_date=serializer.validated_data['entry_date'],
            description=serializer.validated_data['description'],
            lines=serializer.validated_data['lines'],
            posted_by=request.user,
            reference_type=serializer.validated_data.get('reference_type', 'MANUAL_JOURNAL')
        )

        return Response(JournalEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Invoice.objects.filter(tenant=self.request.user.tenant_id).select_related('trip__vehicle')
        stat = self.request.query_params.get('status')
        if stat and stat != 'ALL':
            qs = qs.filter(status=stat.upper())
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(invoice_number__icontains=search) |
                Q(client_name__icontains=search) |
                Q(client_pin__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        tenant = user.tenant
        subtotal = serializer.validated_data.get('subtotal', Decimal('0.00'))
        tax = serializer.validated_data.get('tax_amount')
        if tax is None or tax == 0:
            tax = round(subtotal * Decimal('0.16'), 2)
        total = serializer.validated_data.get('total_amount')
        if total is None or total == 0:
            total = subtotal + tax
        inv_num = serializer.validated_data.get('invoice_number')
        if not inv_num:
            inv_num = f"INV-2026-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(
            tenant=tenant,
            tax_amount=tax,
            total_amount=total,
            invoice_number=inv_num
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = self.request.user
        qs = Invoice.objects.filter(tenant=user.tenant_id)
        total_count = qs.count()
        unpaid_count = qs.filter(status='UNPAID').count()
        paid_count = qs.filter(status='PAID').count()
        total_receivable = qs.filter(status='UNPAID').aggregate(s=Sum('total_amount'))['s'] or 0
        total_collected = qs.filter(status='PAID').aggregate(s=Sum('total_amount'))['s'] or 0
        return Response({
            'total_count': total_count,
            'unpaid_count': unpaid_count,
            'paid_count': paid_count,
            'total_receivable': float(total_receivable),
            'total_collected': float(total_collected),
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAccountant])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'PAID'
        invoice.save(update_fields=['status'])

        # Post cash receipt journal: Debit Cash (1000), Credit AR (1200)
        try:
            cash_acc, _ = Account.objects.get_or_create(
                tenant=request.user.tenant,
                account_code='1000',
                defaults={'name': 'Operating Bank Account - KCB', 'account_type': 'ASSET'}
            )
            ar_acc, _ = Account.objects.get_or_create(
                tenant=request.user.tenant,
                account_code='1200',
                defaults={'name': 'Accounts Receivable - Freight', 'account_type': 'ASSET'}
            )

            DoubleEntryEngine.post_journal_entry(
                tenant=request.user.tenant,
                entry_date=invoice.issue_date,
                description=f"Payment settlement for invoice {invoice.invoice_number}",
                lines=[
                    {'account_id': cash_acc.id, 'debit': invoice.total_amount, 'credit': 0},
                    {'account_id': ar_acc.id, 'debit': 0, 'credit': invoice.total_amount},
                ],
                posted_by=request.user,
                reference_type='INVOICE_PAYMENT',
                reference_id=invoice.id
            )
        except Exception:
            pass

        return Response({
            'status': 'success',
            'message': f'Invoice {invoice.invoice_number} settled and cash receipt posted to General Ledger.',
            'invoice': InvoiceSerializer(invoice).data
        })


class FinancialReportView(APIView):
    """
    Returns automated Trial Balance and Balance Sheet reports.
    """
    permission_classes = [IsAuthenticated, IsAccountant]

    def get(self, request):
        report_type = request.query_params.get('type', 'balance_sheet')
        tenant = request.user.tenant

        if report_type == 'trial_balance':
            data = DoubleEntryEngine.compute_trial_balance(tenant)
        else:
            data = DoubleEntryEngine.compute_balance_sheet(tenant)

        return Response(data, status=status.HTTP_200_OK)
