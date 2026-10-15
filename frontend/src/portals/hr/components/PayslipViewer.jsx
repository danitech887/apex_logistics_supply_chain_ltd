import React from 'react';
import { X, Printer, Download, ShieldCheck, Building } from 'lucide-react';

export const PayslipViewer = ({ payslip, isOpen, onClose }) => {
  if (!isOpen || !payslip) return null;

  const breakdown = payslip.calculation_breakdown || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Official Payslip
            </span>
            <span className="text-xs text-slate-400 font-mono">
              REF: {payslip.id ? payslip.id.slice(0, 8) : 'PAY-2026-OCT'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800">
          {/* Header Branding */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <img
                src="/logo.png"
                alt="Apex Logistics & Supply Chain Ltd"
                className="h-12 w-auto object-contain mb-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Corporate HQ: ICD Road, Industrial Area, Nairobi, Kenya
              </p>
              <p className="text-[11px] text-slate-400">PIN: P051239840Z • KRA Compliant</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Pay Period</span>
              <span className="text-sm font-bold text-slate-900">
                {payslip.period_end || 'October 2026'}
              </span>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Employee Name</span>
              <span className="font-bold text-slate-900">{payslip.employee_name || 'Michael Kamau'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Staff Number</span>
              <span className="font-bold text-indigo-600 font-mono">
                {payslip.staff_number || 'EMP-041'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="font-bold text-slate-900">{payslip.department || 'Operations'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tax PIN</span>
              <span className="font-bold text-slate-900 font-mono">
                {payslip.tax_pin || payslip.taxPin || 'KRA PIN Registered'}
              </span>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                Gross Earnings
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Salary</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {Number(payslip.base_pay || 45000).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Per-Diem & Trip Allowances</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {Number(payslip.allowances || 12000).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                  <span>Gross Pay</span>
                  <span className="font-mono text-indigo-600">
                    KES {(Number(payslip.base_pay || 45000) + Number(payslip.allowances || 12000)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Statutory Deductions */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                Statutory Deductions (KRA)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">PAYE Tax (Post Relief)</span>
                  <span className="font-mono font-bold text-rose-600">
                    - KES {Number(payslip.deductions_tax || breakdown.net_paye || 6542).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">NSSF (Tier I + II)</span>
                  <span className="font-mono font-bold text-slate-700">
                    - KES {Number(breakdown.total_nssf || 2160).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Affordable Housing Levy (1.5%)</span>
                  <span className="font-mono font-bold text-slate-700">
                    - KES {Number(breakdown.housing_levy || 855).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SHA Health Contribution (2.75%)</span>
                  <span className="font-mono font-bold text-slate-700">
                    - KES {Number(breakdown.sha || 1567.5).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Callout Banner */}
          <div className="p-5 rounded-2xl bg-indigo-900 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-indigo-200 block font-bold">
                Net Disbursed Take-Home Pay
              </span>
              <p className="text-xs text-indigo-300 mt-0.5">
                Bank Transfer: Equity Bank • Acct ending in 4102
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                KES {Number(payslip.net_pay || 45875.5).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
