import React from 'react';
import { Database, ShieldCheck, CheckCircle2, Server } from 'lucide-react';
import { StatusBadge } from '../../../components/tables/StatusBadge';

export const TenantAuditViewer = () => {
  const tenants = [
    {
      id: 'tenant-1',
      name: 'Apex Logistics & Supply Chain Ltd',
      subdomain: 'apex-hq',
      status: 'AVAILABLE',
      schemas: ['auth_core', 'hr_payroll', 'fleet_ops', 'finance', 'warehouse_crm'],
      usersCount: 350,
      fleetCount: 120,
      region: 'Nairobi Corporate HQ',
    },
    {
      id: 'tenant-2',
      name: 'Apex Port CFS Logistics Ltd',
      subdomain: 'apex-mombasa',
      status: 'AVAILABLE',
      schemas: ['auth_core', 'fleet_ops', 'warehouse_crm'],
      usersCount: 45,
      fleetCount: 28,
      region: 'Mombasa Port CFS Terminal',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Multi-Branch Organization Audit</h2>
          <p className="text-xs text-slate-500">
            Branch organization profiles, provisioned staff, and active operational modules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {t.subdomain}.apexlogistics.co.ke
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.region}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Provisioned Staff:</span>
                <span className="text-sm font-bold text-slate-800">{t.usersCount} Employees</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Commercial Trucks:</span>
                <span className="text-sm font-bold text-slate-800">{t.fleetCount} Prime Movers</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Active Operational Modules:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {t.schemas.map((s) => {
                  const labels = {
                    auth_core: 'Executive & Admin',
                    hr_payroll: 'HR & Payroll',
                    fleet_ops: 'Fleet Operations',
                    finance: 'Finance & Ledger',
                    warehouse_crm: 'Warehouse & CRM',
                  };
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                      {labels[s] || s}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
