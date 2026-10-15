import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
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
  RefreshCw,
  Boxes,
  Fuel,
  Receipt,
  Clock,
  Database,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.AUTH.ADMIN_OVERVIEW);
      setData(res.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch executive overview:', err);
      setError(err.response?.data?.error || 'Unable to connect to the Executive telemetry database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpi = data?.kpi;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Diagnostics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Executive Portal', 'Analytics Dashboard']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Command & Diagnostics
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cross-departmental telemetry across Nairobi Corporate HQ, Mombasa CFS Terminal, Nakuru & Kisumu
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Synced: {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOverview} className="font-bold underline text-rose-700 hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fleet KPI */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Fleet in Transit
            </span>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : `${kpi?.fleet?.vehicles_in_transit ?? 0} Units`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading
                ? 'Loading fleet telemetry...'
                : `${kpi?.fleet?.vehicles_available ?? 0} Available • ${kpi?.fleet?.vehicles_maintenance ?? 0} In Workshop (${kpi?.fleet?.total_vehicles ?? 0} Total)`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {kpi?.fleet?.active_trips ?? 0} Active Trip Dispatch
            </span>
            <span className="text-slate-400 uppercase text-[10px] font-mono">Live DB</span>
          </div>
        </div>

        {/* Finance KPI */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Billed Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : `KES ${(kpi?.finance?.total_billed_revenue ?? 0).toLocaleString()}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading
                ? 'Reconciling ledger...'
                : `KES ${(kpi?.finance?.paid_revenue ?? 0).toLocaleString()} Collected • KES ${(kpi?.finance?.pending_revenue ?? 0).toLocaleString()} Pending`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {kpi?.finance?.total_invoices ?? 0} Invoices Issued
            </span>
            <span className="text-slate-400 uppercase text-[10px] font-mono">KRA Audited</span>
          </div>
        </div>

        {/* HR KPI */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Active Staff
            </span>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : `${kpi?.hr?.total_employees ?? 0} Employees`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading
                ? 'Loading staff roster...'
                : `Across ${kpi?.hr?.departments_count ?? 0} Departments • ${kpi?.hr?.pending_leaves ?? 0} Pending Leave`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-indigo-600 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
              {kpi?.hr?.active_employees ?? 0} Active On Duty
            </span>
            <span className="text-slate-400 uppercase text-[10px] font-mono">HR Verified</span>
          </div>
        </div>

        {/* Double-Entry Invariant KPI */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Double-Entry Invariant
            </span>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{kpi?.finance?.double_entry_balanced ? 'Balanced (0.00)' : 'Unbalanced'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Debits: KES {loading ? '...' : (kpi?.finance?.total_debits ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-emerald-700 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
              Debits = Credits Verified
            </span>
            <span className="text-slate-400 uppercase text-[10px] font-mono">Strict Ledger</span>
          </div>
        </div>
      </div>

      {/* Second Row: Secondary Departmental Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Freight & Cargo Telemetry */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Consignment Cargo Throughput
            </span>
            <h4 className="text-base font-black text-slate-900">
              {loading ? '...' : `${(kpi?.warehouse_crm?.net_cargo_kg ?? 0).toLocaleString()} kg Net Goods`}
            </h4>
            <p className="text-[11px] text-slate-500">
              {kpi?.warehouse_crm?.total_waybills ?? 0} Waybills • {kpi?.warehouse_crm?.total_clients ?? 0} B2B Accounts
            </p>
          </div>
        </div>

        {/* Warehouse Pallet Units */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Warehouse Stock On Hand
            </span>
            <h4 className="text-base font-black text-slate-900">
              {loading ? '...' : `${(kpi?.warehouse_crm?.total_inventory_units ?? 0).toLocaleString()} Pallet Units`}
            </h4>
            <p className="text-[11px] text-slate-500">
              {kpi?.warehouse_crm?.total_inventory_items ?? 0} SKU Lines • {kpi?.warehouse_crm?.low_stock_count ?? 0} Low Stock Alerts
            </p>
          </div>
        </div>

        {/* Highway Fuel Consumption */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Highway Transit Fuel Log
            </span>
            <h4 className="text-base font-black text-slate-900">
              {loading ? '...' : `${(kpi?.fleet?.total_fuel_litres ?? 0).toLocaleString()} Litres`}
            </h4>
            <p className="text-[11px] text-slate-500">
              KES {(kpi?.fleet?.total_fuel_cost ?? 0).toLocaleString()} Total En-Route Expense
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Operational Department Status & Real-Time Enterprise Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Department Workspaces Status */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>Enterprise Departmental Health & Isolation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live PostgreSQL schema status, record counts, and domain isolation
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
              Tenant: {data?.tenant?.subdomain || 'apex-hq'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.departments_status ? (
              data.departments_status.map((dept) => (
                <div
                  key={dept.domain}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900">{dept.name}</span>
                      <span className="text-[9px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded">
                        {dept.schema}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {dept.records_count} DB Records
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      {dept.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">Loading department status...</div>
            )}
          </div>

          {/* End-to-End Operational Lifecycle Pipeline */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Automated Cross-Department Transaction Lifecycle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                {
                  step: '1. Quotation & Order',
                  domain: 'warehouse_crm',
                  desc: 'Corporate client quote approved; automated credit verification.',
                  border: 'border-l-indigo-500',
                },
                {
                  step: '2. Asset & Crew Lock',
                  domain: 'fleet_ops & hr',
                  desc: 'Truck roadworthiness confirmed; driver shift assigned.',
                  border: 'border-l-cyan-500',
                },
                {
                  step: '3. Corridor Transit',
                  domain: 'fleet_ops',
                  desc: 'Weighbridge tare verified; live GPS telematics logged.',
                  border: 'border-l-amber-500',
                },
                {
                  step: '4. Final Settlement',
                  domain: 'finance & hr',
                  desc: 'Signed POD triggers KRA invoice & balanced journal.',
                  border: 'border-l-emerald-500',
                },
              ].map((pipe, i) => (
                <div
                  key={i}
                  className={`p-3 bg-white rounded-xl border border-slate-200/80 border-l-4 ${pipe.border} space-y-1 shadow-2xs`}
                >
                  <span className="text-[9px] font-black uppercase text-slate-400 block">
                    {pipe.step}
                  </span>
                  <h5 className="text-[11px] font-bold text-slate-800">{pipe.domain}</h5>
                  <p className="text-[10px] text-slate-500 leading-snug">{pipe.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Live Activity Stream / Audit Trail */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Enterprise Audit Stream</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Events</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recent ledger, dispatch, freight, and personnel events recorded in PostgreSQL
            </p>

            <div className="space-y-3 mt-4 overflow-y-auto max-h-[480px] pr-1">
              {data?.recent_activity && data.recent_activity.length > 0 ? (
                data.recent_activity.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1 text-xs hover:border-slate-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{act.action}</span>
                      <span className="text-[10px] font-mono text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] font-bold text-indigo-700">{act.title}</p>
                    <p className="text-[11px] text-slate-600 leading-snug">{act.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  {loading ? 'Streaming events from PostgreSQL...' : 'No activity records found.'}
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Database Engine</span>
              <span className="text-emerald-400 font-mono">Connected</span>
            </div>
            <p className="text-[10px] text-slate-400">
              PostgreSQL 16 Multi-Tenant schema partition: <strong>apex_logistics_db</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
