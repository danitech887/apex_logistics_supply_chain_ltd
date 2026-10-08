from decimal import Decimal
from rest_framework import serializers
from apps.finance.models import Account, JournalEntry, JournalLine, Invoice
from apps.authentication.models import Tenant


class AccountSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    tenant = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        allow_null=True
    )
    tenant_name = serializers.CharField(source='tenant.company_name', read_only=True)

    class Meta:
        model = Account
        fields = ['id', 'tenant', 'tenant_name', 'account_code', 'name', 'account_type', 'is_active', 'balance']
        read_only_fields = ['id']

    def validate(self, attrs):
        code = attrs.get('account_code')
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if code and user and hasattr(user, 'tenant') and user.tenant:
            instance = getattr(self, 'instance', None)
            qs = Account.objects.filter(tenant=user.tenant, account_code=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                raise serializers.ValidationError({"account_code": f"Account code '{code}' already exists in your Chart of Accounts."})
        return attrs

    def get_balance(self, obj):
        lines = obj.journal_lines.all()
        debits = sum((l.debit for l in lines), Decimal('0.00'))
        credits = sum((l.credit for l in lines), Decimal('0.00'))
        if obj.account_type in ['ASSET', 'EXPENSE']:
            return float(debits - credits)
        return float(credits - debits)


class JournalLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.account_code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalLine
        fields = ['id', 'account', 'account_code', 'account_name', 'debit', 'credit']
        read_only_fields = ['id']


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True, read_only=True)
    total_debit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_credit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    is_balanced = serializers.BooleanField(read_only=True)
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'tenant', 'entry_date', 'reference_type', 'reference_id',
            'description', 'posted_by', 'posted_by_name', 'lines',
            'total_debit', 'total_credit', 'is_balanced', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateJournalLineSerializer(serializers.Serializer):
    account_id = serializers.IntegerField(required=False, allow_null=True)
    account_code = serializers.CharField(required=False, allow_null=True)
    debit = serializers.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    credit = serializers.DecimalField(max_digits=14, decimal_places=2, default=0.00)


class CreateJournalEntrySerializer(serializers.Serializer):
    entry_date = serializers.DateField()
    description = serializers.CharField()
    reference_type = serializers.CharField(default='MANUAL_JOURNAL', required=False)
    lines = CreateJournalLineSerializer(many=True)


class InvoiceSerializer(serializers.ModelSerializer):
    trip_details = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.company_name', read_only=True)
    tenant_subdomain = serializers.CharField(source='tenant.subdomain', read_only=True)
    tenant = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        allow_null=True
    )
    invoice_number = serializers.CharField(required=False, max_length=50)

    class Meta:
        model = Invoice
        fields = [
            'id', 'tenant', 'tenant_name', 'tenant_subdomain', 'trip', 'trip_details', 'invoice_number',
            'issue_date', 'due_date', 'client_name', 'client_pin',
            'subtotal', 'tax_amount', 'total_amount', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        issue_date = attrs.get('issue_date')
        due_date = attrs.get('due_date')
        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError({"due_date": "Payment due date cannot precede invoice issue date."})
        subtotal = attrs.get('subtotal')
        if subtotal is not None and subtotal <= 0:
            raise serializers.ValidationError({"subtotal": "Freight subtotal must be greater than zero."})
        return attrs

    def validate_client_pin(self, value):
        if value:
            import re
            cleaned = re.sub(r'[^A-Z0-9]', '', str(value).upper()).strip()
            if len(cleaned) != 11:
                raise serializers.ValidationError("KRA Tax PIN must be an 11-character alphanumeric code (e.g. P051199482X).")
            return cleaned
        return value

    def get_trip_details(self, obj):
        if obj.trip:
            return {
                'origin': obj.trip.origin,
                'destination': obj.trip.destination,
                'vehicle': obj.trip.vehicle.registration_plate,
            }
        return None
