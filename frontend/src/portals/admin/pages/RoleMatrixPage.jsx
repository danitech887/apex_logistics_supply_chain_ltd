import React from 'react';
import { Shield, Check, X } from 'lucide-react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';

export const RoleMatrixPage = () => {
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Executive Administrator' },
    { code: 'HR_OFFICER', name: 'HR & Payroll Manager' },
    { code: 'FLEET_MANAGER', name: 'Fleet & Dispatch Officer' },
    { code: 'ACCOUNTANT', name: 'Senior Accountant' },
    { code: 'DRIVER', name: 'Transit Commercial Driver' },
  ];

  const permissions = [
    {
      domain: 'auth_core',
      action: 'Manage Corporate Tenants & Provision Users',
      allowed: ['SUPER_ADMIN'],
    },
    {
      domain: 'hr_payroll',
      action: 'Execute Monthly Statutory Payroll Runs',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER'],
    },
    {
      domain: 'hr_payroll',
      action: 'Approve Employee Leave Requests',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER'],
    },
    {
      domain: 'fleet_ops',
      action: 'Dispatch Commercial Trucks & Route Schedules',
      allowed: ['SUPER_ADMIN', 'FLEET_MANAGER'],
    },
    {
      domain: 'fleet_ops',
      action: 'Log Highway Fuel Station Receipts',
      allowed: ['SUPER_ADMIN', 'FLEET_MANAGER', 'DRIVER'],
    },
    {
      domain: 'finance',
      action: 'Post Balanced Double-Entry Journal Entries',
      allowed: ['SUPER_ADMIN', 'ACCOUNTANT'],
    },
    {
      domain: 'finance',
      action: 'View Balance Sheet & Trial Balance Statements',
      allowed: ['SUPER_ADMIN', 'ACCOUNTANT'],
    },
    {
      domain: 'ess',
      action: 'Inspect Personal Tax Payslips & Mobile Punch Clock',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER', 'FLEET_MANAGER', 'ACCOUNTANT', 'DRIVER'],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={['Executive Portal', 'Role-Based Access Control Matrix']} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Enterprise RBAC Role Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Strict least-privilege security policy enforced across API endpoints and UI portals
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-4 px-6">Domain / Action</th>
                {roles.map((r) => (
                  <th key={r.code} className="py-4 px-4 text-center">
                    <span className="block text-slate-900 font-extrabold">{r.name}</span>
                    <span className="text-[10px] text-indigo-600 font-mono font-medium">
                      {r.code}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {permissions.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-6">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-indigo-700 mr-2 border border-slate-200">
                      {perm.domain}
                    </span>
                    <span className="font-semibold text-slate-800">{perm.action}</span>
                  </td>
                  {roles.map((r) => {
                    const isGranted = perm.allowed.includes(r.code);
                    return (
                      <td key={r.code} className="py-3.5 px-4 text-center">
                        {isGranted ? (
                          <div className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="inline-flex p-1 rounded-full bg-slate-100 text-slate-300">
                            <X className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
