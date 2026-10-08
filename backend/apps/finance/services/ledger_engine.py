"""
Double-Entry General Ledger Engine & Balance Sheet Validation.
Enforces fundamental accounting equation: Assets = Liabilities + Equity
and transactional invariant: Sum(Debits) == Sum(Credits)
"""
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from apps.finance.models import Account, JournalEntry, JournalLine


class DoubleEntryEngine:
    """
    Core General Ledger Engine ensuring rigorous transactional balance and audit trails.
    """

    @classmethod
    def validate_lines(cls, lines: list) -> tuple:
        """
        Validates that list of journal line dictionaries adheres to double-entry rules.
        """
        if len(lines) < 2:
            raise ValidationError({'lines': 'A journal transaction must comprise at least two lines.'})

        total_debit = Decimal('0.00')
        total_credit = Decimal('0.00')

        for idx, line in enumerate(lines):
            debit = Decimal(str(line.get('debit', 0)))
            credit = Decimal(str(line.get('credit', 0)))

            if debit < 0 or credit < 0:
                raise ValidationError({f'lines[{idx}]': 'Amounts cannot be negative.'})

            if (debit > 0 and credit > 0) or (debit == 0 and credit == 0):
                raise ValidationError({f'lines[{idx}]': 'Each line must specify either debit or credit, not both.'})

            total_debit += debit
            total_credit += credit

        if total_debit != total_credit:
            raise ValidationError({
                'balance': f"Journal entry is out of balance. Total Debits (KES {total_debit}) != Total Credits (KES {total_credit})."
            })

        return total_debit, total_credit

    @classmethod
    @transaction.atomic
    def post_journal_entry(
        cls,
        tenant,
        entry_date,
        description: str,
        lines: list,
        posted_by,
        reference_type: str = 'MANUAL_JOURNAL',
        reference_id=None
    ) -> JournalEntry:
        """
        Atomically records a balanced journal entry into the general ledger.
        """
        cls.validate_lines(lines)

        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_date=entry_date,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
            posted_by=posted_by
        )

        for line_data in lines:
            account_id = line_data.get('account_id')
            account_code = line_data.get('account_code')
            if account_id:
                account = Account.objects.get(id=account_id, tenant=tenant)
            elif account_code:
                account = Account.objects.get(account_code=account_code, tenant=tenant)
            else:
                raise ValidationError("Each journal line must specify either an account_id or account_code.")
            JournalLine.objects.create(
                journal_entry=entry,
                account=account,
                debit=Decimal(str(line_data.get('debit', 0))),
                credit=Decimal(str(line_data.get('credit', 0)))
            )

        return entry

    @classmethod
    def compute_trial_balance(cls, tenant) -> dict:
        """
        Calculates trial balance across all Chart of Accounts for the given tenant.
        """
        accounts = Account.objects.filter(tenant=tenant, is_active=True)
        tb_lines = []
        total_debit = Decimal('0.00')
        total_credit = Decimal('0.00')

        for acc in accounts:
            lines = JournalLine.objects.filter(journal_entry__tenant=tenant, account=acc)
            debit_sum = sum((line.debit for line in lines), Decimal('0.00'))
            credit_sum = sum((line.credit for line in lines), Decimal('0.00'))

            if debit_sum > 0 or credit_sum > 0:
                tb_lines.append({
                    'account_code': acc.account_code,
                    'account_name': acc.name,
                    'account_type': acc.account_type,
                    'debit': str(debit_sum),
                    'credit': str(credit_sum),
                })
                total_debit += debit_sum
                total_credit += credit_sum

        return {
            'accounts': tb_lines,
            'total_debit': str(total_debit),
            'total_credit': str(total_credit),
            'is_balanced': total_debit == total_credit
        }

    @classmethod
    def compute_balance_sheet(cls, tenant) -> dict:
        """
        Generates formal Assets, Liabilities, and Equity summary.
        """
        accounts = Account.objects.filter(tenant=tenant, is_active=True)
        assets = []
        liabilities = []
        equity = []

        total_assets = Decimal('0.00')
        total_liabilities = Decimal('0.00')
        total_equity = Decimal('0.00')

        total_revenue = Decimal('0.00')
        total_expense = Decimal('0.00')

        for acc in accounts:
            lines = JournalLine.objects.filter(journal_entry__tenant=tenant, account=acc)
            debits = sum((line.debit for line in lines), Decimal('0.00'))
            credits = sum((line.credit for line in lines), Decimal('0.00'))

            if acc.account_type == 'REVENUE':
                total_revenue += (credits - debits)
            elif acc.account_type == 'EXPENSE':
                total_expense += (debits - credits)
            else:
                net_balance = debits - credits if acc.account_type == 'ASSET' else credits - debits
                item = {
                    'code': acc.account_code,
                    'name': acc.name,
                    'balance': str(net_balance)
                }

                if acc.account_type == 'ASSET':
                    assets.append(item)
                    total_assets += net_balance
                elif acc.account_type == 'LIABILITY':
                    liabilities.append(item)
                    total_liabilities += net_balance
                elif acc.account_type == 'EQUITY':
                    equity.append(item)
                    total_equity += net_balance

        net_income = total_revenue - total_expense
        if net_income != Decimal('0.00'):
            equity.append({
                'code': '3999',
                'name': 'Current Period Net Income (P&L)',
                'balance': str(net_income)
            })
            total_equity += net_income

        return {
            'assets': {'items': assets, 'total': str(total_assets)},
            'liabilities': {'items': liabilities, 'total': str(total_liabilities)},
            'equity': {'items': equity, 'total': str(total_equity)},
            'net_income': str(net_income),
            'accounting_equation_balanced': total_assets == (total_liabilities + total_equity)
        }
