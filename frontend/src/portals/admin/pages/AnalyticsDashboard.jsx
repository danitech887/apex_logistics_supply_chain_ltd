import React from 'react';
import {
  TrendingUp,
  Truck,
  Users,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';

export const AnalyticsDashboard = () => {
  const kpiStats = [
    {
      title: 'Active Fleet in Transit',
      value: '42 Units',
      subtitle: '35% of total 120 truck fleet',
      trend: '+12% vs last week',
      icon: Truck,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Gross Billed Revenue MTD',
      value: 'KES 14,820,000',
      subtitle: 'Average KES 125,000 per route',
      trend: '+18.4% MoM',
      icon: Coins,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Total Active Staff',
      value: '350 Staff',
      subtitle: '120 drivers, 40 workshop mechanics',
      trend: '100% compliant',
      icon: Users,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Double-Entry Invariant',
      value: 'Balanced (0.00)',
      subtitle: 'Debits = Credits verified',
      trend: 'Strict Ledger',
      icon: ShieldCheck,
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Executive Portal', 'Analytics Dashboard']} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Executive Command & Diagnostics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cross-departmental telemetry across Nairobi HQ, Mombasa CFS, Nakuru & Kisumu
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-xs`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.subtitle}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  {kpi.trend}
                </span>
                <span className="text-slate-400 uppercase text-[10px]">Verified Live</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture & Cross-Department Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                End-to-End Operational Lifecycle State Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Automated 7-stage transaction progression with zero paper bottlenecks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            {[
              {
                step: '1. Order Inception',
                domain: 'warehouse_crm',
                desc: 'Corporate client quote converted to confirmed sales order & credit limit verified.',
                color: 'border-l-indigo-500',
              },
              {
                step: '2. Asset & Crew Lock',
                domain: 'fleet_ops & hr',
                desc: 'Truck status checked for maintenance; driver rest hours validated.',
                color: 'border-l-cyan-500',
              },
              {
                step: '3. Corridor Transit',
                domain: 'fleet_ops',
                desc: 'Weighbridge tare verified, GPS telematics pinging, and en-route fuel logged.',
                color: 'border-l-amber-500',
              },
              {
                step: '4. Reconciliation',
                domain: 'finance & hr',
                desc: 'Electronic POD triggers final tax invoice, balanced journal, and driver allowances.',
                color: 'border-l-emerald-500',
              },
            ].map((st, i) => (
              <div
                key={i}
                className={`p-4 bg-slate-50/70 rounded-2xl border-l-4 border border-slate-200/70 ${st.color} space-y-2`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {st.step}
                </span>
                <h4 className="text-xs font-bold text-slate-800">{st.domain}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Department Modules Health */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            Operational Department Status
          </h2>
          <p className="text-xs text-slate-500">Real-time status of active departmental workspaces</p>

          <div className="space-y-2.5 pt-1">
            {[
              { name: 'Executive Administration', desc: 'Tenant isolation, user directory, RBAC governance', status: 'Operational' },
              { name: 'Human Resources & Payroll', desc: '350 active personnel, KRA statutory deductions', status: 'Operational' },
              { name: 'Fleet Operations & Dispatch', desc: '120 Prime Movers, live trip tracking, fuel logs', status: 'Operational' },
              { name: 'Finance & General Ledger', desc: 'Chart of accounts, balanced double-entry ledger', status: 'Operational' },
              { name: 'Warehouse & Cargo CRM', desc: 'CFS waybills, corporate clients, cargo stock', status: 'Operational' },
            ].map((sch) => (
              <div
                key={sch.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800">{sch.name}</span>
                  <p className="text-[10px] text-slate-500">{sch.desc}</p>
                </div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {sch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
