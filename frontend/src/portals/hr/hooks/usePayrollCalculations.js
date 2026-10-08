import { useMemo } from 'react';

export const usePayrollCalculations = (baseSalary = 0, allowances = 0) => {
  return useMemo(() => {
    const gross = Number(baseSalary || 0) + Number(allowances || 0);

    // NSSF Act 2013: Tier 1 up to 8,000 @ 6% (max 480)
    const tier1 = Math.min(gross, 8000) * 0.06;
    // Tier 2 between 8,000 and 72,000 @ 6% (max 3840)
    const tier2 = gross > 8000 ? (Math.min(gross, 72000) - 8000) * 0.06 : 0;
    const totalNssf = Math.round((tier1 + tier2) * 100) / 100;

    // Affordable Housing Levy: 1.5%
    const housingLevy = Math.round(gross * 0.015 * 100) / 100;

    // SHA: 2.75% (minimum KES 300)
    const sha = Math.max(300, Math.round(gross * 0.0275 * 100) / 100);

    // Taxable Pay (Gross - NSSF)
    const taxablePay = Math.max(0, gross - totalNssf);

    // Graduated PAYE Monthly Bands
    let rem = taxablePay;
    let grossTax = 0;

    // Band 1: Up to 24,000 @ 10%
    const b1 = Math.min(rem, 24000);
    if (b1 > 0) {
      grossTax += b1 * 0.1;
      rem -= b1;
    }
    // Band 2: Next 8,333.33 @ 25%
    const b2 = Math.min(rem, 8333.33);
    if (b2 > 0) {
      grossTax += b2 * 0.25;
      rem -= b2;
    }
    // Band 3: Next 467,666.67 @ 30%
    const b3 = Math.min(rem, 467666.67);
    if (b3 > 0) {
      grossTax += b3 * 0.3;
      rem -= b3;
    }
    // Band 4: Next 300,000 @ 32.5%
    const b4 = Math.min(rem, 300000);
    if (b4 > 0) {
      grossTax += b4 * 0.325;
      rem -= b4;
    }
    // Band 5: Above 800,000 @ 35%
    if (rem > 0) {
      grossTax += rem * 0.35;
    }

    grossTax = Math.round(grossTax * 100) / 100;

    // Reliefs
    const personalRelief = 2400.0;
    const insuranceRelief = Math.min(Math.round(sha * 0.15 * 100) / 100, 5000);
    const totalRelief = personalRelief + insuranceRelief;
    const netPaye = Math.max(0, Math.round((grossTax - totalRelief) * 100) / 100);

    const statutoryDeductions = Math.round((totalNssf + housingLevy + sha) * 100) / 100;
    const totalDeductions = Math.round((netPaye + statutoryDeductions) * 100) / 100;
    const netPay = Math.round((gross - totalDeductions) * 100) / 100;

    return {
      gross,
      tier1,
      tier2,
      totalNssf,
      housingLevy,
      sha,
      taxablePay,
      grossTax,
      personalRelief,
      insuranceRelief,
      netPaye,
      statutoryDeductions,
      totalDeductions,
      netPay,
    };
  }, [baseSalary, allowances]);
};
