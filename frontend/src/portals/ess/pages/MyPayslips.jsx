import React, { useState } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { PayslipViewer } from '../../hr/components/PayslipViewer';
import { ScrollText, Eye, Download, ShieldCheck } from 'lucide-react';

export const MyPayslips = () => {
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const payslips = [
    {
      id: 'pay-2026-09',
      staff_number: 'EMP-041',
      employee_name: 'Michael Kamau',
      department: 'Transit Operations',
      period_end: 'September 2026',
      base_pay: 55000,
      allowances: 16500, // 3 Mombasa-Nairobi trips
      deductions_tax: 8520,
      deductions_statutory: 4980,
      net_pay: 58000,
      calculation_breakdown: {
        total_nssf: 2160,
        housing_levy: 1072.5,
        sha: 1747.5,
        net_paye: 8520,
      },
    },
    {
      id: 'pay-2026-08',
      staff_number: 'EMP-041',
      employee_name: 'Michael Kamau',
      department: 'Transit Operations',
      period_end: 'August 2026',
      base_pay: 55000,
      allowances: 14000,
      deductions_tax: 7980,
      deductions_statutory: 4895,
      net_pay: 56125,
      calculation_breakdown: {
        total_nssf: 2160,
        housing_levy: 1035,
        sha: 1700,
        net_paye: 7980,
      },
    },
    {
      id: 'pay-2026-07',
      staff_number: 'EMP-041',
      employee_name: 'Michael Kamau',
      department: 'Transit Operations',
      period_end: 'July 2026',
      base_pay: 55000,
      allowances: 12500,
      deductions_tax: 7420,
      deductions_statutory: 4810,
      net_pay: 55270,
      calculation_breakdown: {
        total_nssf: 2160,
        housing_levy: 1012.5,
        sha: 1637.5,
        net_paye: 7420,
      },
    },
  ];

  const columns = [
    {
      header: 'Pay Cycle',
      accessor: 'period_end',
      cell: (r) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
          {r.period_end}
        </span>
      ),
    },
    {
      header: 'Gross Earnings',
      accessor: 'base_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          KES {(r.base_pay + r.allowances).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Statutory Taxes',
      accessor: 'deductions_tax',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs text-rose-600">
          - KES {(r.deductions_tax + r.deductions_statutory).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Take-Home',
      accessor: 'net_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-black text-emerald-700 text-xs">
          KES {r.net_pay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Document',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <button
          onClick={() => {
            setSelectedSlip(r);
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Payslip</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'My Official Payslips']} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Personal Earnings & Statutory Records
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          KRA P9 and monthly payslips with transparent NSSF, SHA, and Housing Levy breakdowns
        </p>
      </div>

      <DataTable
        columns={columns}
        data={payslips}
        searchPlaceholder="Filter pay cycles..."
        pageSize={5}
      />

      <PayslipViewer
        payslip={selectedSlip}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
