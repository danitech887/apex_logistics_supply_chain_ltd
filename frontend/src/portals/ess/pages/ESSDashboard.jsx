import React from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { PunchClock } from '../components/PunchClock';
import { ExpenseClaimCard } from '../components/ExpenseClaimCard';
import {
  Truck,
  CalendarDays,
  ScrollText,
  Fuel,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ESSDashboard = ({ onNavigate }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'Driver Dashboard']} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <img
              src="/src/assets/logo.png"
              alt="Apex Logistics & Supply Chain Ltd"
              className="h-9 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Driver & Staff Terminal
              </h1>
              <p className="text-xs text-slate-500">
                Transit crew mobile PWA workspace
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            PWA Ready • Offline Cache
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Terminal Clock Column */}
        <div className="md:col-span-1 space-y-4">
          <PunchClock />

          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block px-2">
              Quick Portals
            </span>
            <button
              onClick={() => onNavigate('my_payslips')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center space-x-2.5">
                <ScrollText className="w-4 h-4 text-indigo-600" />
                <span>My Payslips (KRA)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate('apply_leave')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center space-x-2.5">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                <span>Request Fatigue Rest / Leave</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Active Trip & Allowances Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Assigned Transit Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                Active Highway Transit
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                MANIFEST #TRP-01
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
                <span>Mombasa Port CFS Gate 3</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
                <span>Nairobi ICD Embakasi Dock</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Prime Mover: <span className="font-bold text-slate-800">KDG 412M (Scania R500)</span> • Cargo: 28,000 KG Ambient Container
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Start Odometer
                </span>
                <span className="font-mono font-bold text-slate-800">142,100 KM</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Est. Route
                </span>
                <span className="font-mono font-bold text-indigo-600">485 KM</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Driver Allowance
                </span>
                <span className="font-mono font-bold text-emerald-600">KES 14,500</span>
              </div>
            </div>
          </div>

          {/* Recent Claims / Allowances */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Disbursed Driver Allowances
              </h3>
              <span className="text-xs text-slate-400">Pushed to Payroll</span>
            </div>

            <div className="space-y-2.5">
              <ExpenseClaimCard
                title="Mombasa - Nairobi Per-Diem Allowance"
                amount="14500"
                date="05 Oct 2026"
                status="APPROVED"
                category="PerDiem"
              />
              <ExpenseClaimCard
                title="TotalEnergies Mtito Andei Diesel Fuel (180 Liters)"
                amount="37800"
                date="04 Oct 2026"
                status="LOGGED"
                category="Fuel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
