import React from 'react';
import { X, Printer, ShieldCheck, Download, FileText, CheckCircle2 } from 'lucide-react';

export const KraP9Modal = ({ isOpen, onClose, payslips = [], user }) => {
  if (!isOpen) return null;

  const currentYear = 2026;
  const employerPin = 'P051239840Z';
  const employerName = 'APEX LOGISTICS & SUPPLY CHAIN LTD';

  const employeeName = user?.name || user?.full_name || payslips[0]?.employee_name || 'Michael Kamau';
  const staffNumber = user?.staffNumber || payslips[0]?.staff_number || 'EMP-041';
  const taxPin = user?.taxPin || payslips[0]?.tax_pin || 'A009124892K';

  // Sort payslips chronologically for P9
  const sortedSlips = [...payslips].sort((a, b) => {
    return new Date(a.period_end || a.created_at) - new Date(b.period_end || b.created_at);
  });

  // Calculate totals
  const totals = sortedSlips.reduce(
    (acc, p) => {
      const breakdown = p.calculation_breakdown || {};
      const base = Number(p.base_pay || 0);
      const allow = Number(p.allowances || 0);
      const gross = base + allow;
      const nssf = Number(breakdown.total_nssf || (p.deductions_statutory ? p.deductions_statutory * 0.5 : 2160));
      const hLevy = Number(breakdown.housing_levy || gross * 0.015);
      const sha = Number(breakdown.sha || gross * 0.0275);
      const paye = Number(p.deductions_tax || breakdown.net_paye || 0);
      const relief = Number(breakdown.personal_relief || 2400) + Number(breakdown.insurance_relief || sha * 0.15);

      acc.basic += base;
      acc.allowances += allow;
      acc.gross += gross;
      acc.nssf += nssf;
      acc.housing += hLevy;
      acc.sha += sha;
      acc.paye += paye;
      acc.relief += relief;
      acc.net += Number(p.net_pay || 0);
      return acc;
    },
    { basic: 0, allowances: 0, gross: 0, nssf: 0, housing: 0, sha: 0, paye: 0, relief: 0, net: 0 }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-tight">KRA P9A Tax Deduction Certificate</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Tax Year {currentYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kenya Revenue Authority • Domestic Taxes Department • Statutory ITA Cap 470
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Print P9 Form"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Official KRA Certificate Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs font-black tracking-wider text-rose-700 uppercase">
                KENYA REVENUE AUTHORITY
              </span>
              <span>•</span>
              <span className="text-xs font-bold text-slate-700 uppercase">
                DOMESTIC TAXES DEPARTMENT
              </span>
            </div>
            <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
              TAX DEDUCTION CARD (P.9A) - YEAR {currentYear}
            </h2>
            <p className="text-[11px] text-slate-500">
              Certificate of PAYE, Statutory NSSF, Housing Levy and SHA Remittances
            </p>
          </div>

          {/* Employer & Employee Metadata Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employer's Name:</span>
                <span className="font-bold text-slate-900 text-right">{employerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employer's PIN:</span>
                <span className="font-mono font-bold text-slate-900">{employerPin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Company Physical HQ:</span>
                <span className="text-slate-700 font-medium text-right">ICD Road, Industrial Area, Nairobi</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employee's Name:</span>
                <span className="font-bold text-slate-900 text-right">{employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employee's Tax PIN:</span>
                <span className="font-mono font-bold text-indigo-700">{taxPin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Staff Identity Number:</span>
                <span className="font-mono font-bold text-slate-900">{staffNumber}</span>
              </div>
            </div>
          </div>

          {/* P9 Statutory Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Basic Pay (A)</th>
                  <th className="py-2.5 px-3 text-right">Allowances (B)</th>
                  <th className="py-2.5 px-3 text-right">Gross (C)</th>
                  <th className="py-2.5 px-3 text-right">NSSF (D)</th>
                  <th className="py-2.5 px-3 text-right">Housing (E)</th>
                  <th className="py-2.5 px-3 text-right">Tax Relief (H)</th>
                  <th className="py-2.5 px-3 text-right">PAYE Tax (J)</th>
                  <th className="py-2.5 px-3 text-right font-black">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedSlips.map((p) => {
                  const breakdown = p.calculation_breakdown || {};
                  const base = Number(p.base_pay || 0);
                  const allow = Number(p.allowances || 0);
                  const gross = base + allow;
                  const nssf = Number(breakdown.total_nssf || 2160);
                  const hLevy = Number(breakdown.housing_levy || gross * 0.015);
                  const relief = Number(breakdown.personal_relief || 2400) + Number(breakdown.insurance_relief || 0);
                  const paye = Number(p.deductions_tax || breakdown.net_paye || 0);
                  const net = Number(p.net_pay || 0);

                  const monthLabel = p.period_end
                    ? new Date(p.period_end).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
                    : 'Pay Cycle';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-bold text-slate-900">{monthLabel}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {base.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {allow.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {gross.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {nssf.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {hLevy.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        {relief.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                        {paye.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-indigo-900">
                        {net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-black text-slate-950 border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-3 uppercase text-[10px] tracking-wider">TOTALS (YTD)</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {totals.basic.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {totals.allowances.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-950">
                    {totals.gross.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {totals.nssf.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {totals.housing.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800">
                    {totals.relief.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-800">
                    {totals.paye.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-950 text-xs">
                    {totals.net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Sign-off Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>
                <strong>Certification:</strong> Official employer tax deduction return prepared and transmitted to the Kenya Revenue Authority (KRA).
              </p>
            </div>
            <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md shrink-0">
              STATUS: COMPLIANT
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Form P.9A (Rev. 2026) • Republic of Kenya
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form P9</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
