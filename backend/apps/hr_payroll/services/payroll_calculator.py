"""
Kenyan Statutory Payroll Calculation Engine (PAYE, NSSF, SHA, Housing Levy).
Compliant with current Kenya Revenue Authority (KRA) & Statutory Bands.
"""
from decimal import Decimal, ROUND_HALF_UP


class PayrollCalculator:
    """
    Computes statutory deductions and net earnings with mathematical precision.
    """

    PERSONAL_RELIEF = Decimal('2400.00')
    HOUSING_LEVY_RATE = Decimal('0.015')   # 1.5%
    SHA_RATE = Decimal('0.0275')            # 2.75%
    SHA_MINIMUM = Decimal('300.00')
    NSSF_TIER_1_LIMIT = Decimal('8000.00')
    NSSF_TIER_2_LIMIT = Decimal('72000.00')
    NSSF_RATE = Decimal('0.06')             # 6%

    @classmethod
    def round_currency(cls, amount: Decimal) -> Decimal:
        return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_nssf(cls, gross_pay: Decimal) -> dict:
        """
        NSSF Act 2013 Computation:
        Tier I: 6% of earnings up to KES 8,000 (Max 480)
        Tier II: 6% of earnings between KES 8,000 and KES 72,000 (Max 3,840)
        """
        tier1_base = min(gross_pay, cls.NSSF_TIER_1_LIMIT)
        tier1 = cls.round_currency(tier1_base * cls.NSSF_RATE)

        if gross_pay > cls.NSSF_TIER_1_LIMIT:
            tier2_base = min(gross_pay, cls.NSSF_TIER_2_LIMIT) - cls.NSSF_TIER_1_LIMIT
            tier2 = cls.round_currency(tier2_base * cls.NSSF_RATE)
        else:
            tier2 = Decimal('0.00')

        total_nssf = tier1 + tier2
        return {
            'tier1': tier1,
            'tier2': tier2,
            'total_nssf': total_nssf
        }

    @classmethod
    def calculate_housing_levy(cls, gross_pay: Decimal) -> Decimal:
        """Affordable Housing Levy: 1.5% of Gross Emoluments."""
        return cls.round_currency(gross_pay * cls.HOUSING_LEVY_RATE)

    @classmethod
    def calculate_sha(cls, gross_pay: Decimal) -> Decimal:
        """Social Health Authority (SHA): 2.75% of Gross Pay (min KES 300)."""
        sha = cls.round_currency(gross_pay * cls.SHA_RATE)
        return max(sha, cls.SHA_MINIMUM)

    @classmethod
    def calculate_paye(cls, taxable_pay: Decimal, sha_contribution: Decimal) -> dict:
        """
        Computes KRA PAYE graduated tax bands, personal relief, and insurance relief.
        """
        rem = taxable_pay
        gross_tax = Decimal('0.00')

        # Band 1: First 24,000 @ 10%
        b1 = min(rem, Decimal('24000.00'))
        if b1 > Decimal('0.00'):
            gross_tax += b1 * Decimal('0.10')
            rem -= b1

        # Band 2: Next 8,333 (24,001 to 32,333) @ 25%
        b2 = min(rem, Decimal('8333.33'))
        if b2 > Decimal('0.00'):
            gross_tax += b2 * Decimal('0.25')
            rem -= b2

        # Band 3: Next 467,666.67 (32,334 to 500,000) @ 30%
        b3 = min(rem, Decimal('467666.67'))
        if b3 > Decimal('0.00'):
            gross_tax += b3 * Decimal('0.30')
            rem -= b3

        # Band 4: Next 300,000 (500,001 to 800,000) @ 32.5%
        b4 = min(rem, Decimal('300000.00'))
        if b4 > Decimal('0.00'):
            gross_tax += b4 * Decimal('0.325')
            rem -= b4

        # Band 5: Above 800,000 @ 35%
        if rem > Decimal('0.00'):
            gross_tax += rem * Decimal('0.35')

        gross_tax = cls.round_currency(gross_tax)

        # Reliefs
        personal_relief = cls.PERSONAL_RELIEF
        insurance_relief = cls.round_currency(min(sha_contribution * Decimal('0.15'), Decimal('5000.00')))

        total_relief = personal_relief + insurance_relief
        net_tax = max(Decimal('0.00'), cls.round_currency(gross_tax - total_relief))

        return {
            'gross_tax': gross_tax,
            'personal_relief': personal_relief,
            'insurance_relief': insurance_relief,
            'total_relief': total_relief,
            'net_paye': net_tax
        }

    @classmethod
    def compute_full_payslip(cls, base_salary: Decimal, allowances: Decimal = Decimal('0.00')) -> dict:
        """
        Full payroll pipeline producing complete payslip ledger details.
        """
        gross_pay = cls.round_currency(base_salary + allowances)

        nssf_data = cls.calculate_nssf(gross_pay)
        nssf_deduction = nssf_data['total_nssf']

        housing_levy = cls.calculate_housing_levy(gross_pay)
        sha_deduction = cls.calculate_sha(gross_pay)

        # Taxable pay allows NSSF as tax-exempt deduction
        taxable_pay = max(Decimal('0.00'), gross_pay - nssf_deduction)

        paye_data = cls.calculate_paye(taxable_pay, sha_deduction)
        net_paye = paye_data['net_paye']

        statutory_deductions = cls.round_currency(nssf_deduction + housing_levy + sha_deduction)
        total_deductions = cls.round_currency(net_paye + statutory_deductions)
        net_pay = cls.round_currency(gross_pay - total_deductions)

        return {
            'base_salary': base_salary,
            'allowances': allowances,
            'gross_pay': gross_pay,
            'taxable_pay': taxable_pay,
            'nssf_tier1': nssf_data['tier1'],
            'nssf_tier2': nssf_data['tier2'],
            'total_nssf': nssf_deduction,
            'housing_levy': housing_levy,
            'sha': sha_deduction,
            'statutory_deductions': statutory_deductions,
            'gross_tax': paye_data['gross_tax'],
            'personal_relief': paye_data['personal_relief'],
            'insurance_relief': paye_data['insurance_relief'],
            'net_paye': net_paye,
            'total_deductions': total_deductions,
            'net_pay': net_pay,
        }
