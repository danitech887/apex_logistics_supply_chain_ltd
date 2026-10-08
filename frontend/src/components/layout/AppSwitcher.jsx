import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldCheck,
  Users,
  Truck,
  Landmark,
  Smartphone,
  Check,
} from 'lucide-react';

export const PORTALS = [
  {
    id: 'admin',
    name: 'Executive & Admin',
    description: 'System audit, tenant config, and RBAC matrix',
    icon: ShieldCheck,
    color: 'from-purple-500 to-indigo-600',
    requiredRole: 'SUPER_ADMIN',
  },
  {
    id: 'hr',
    name: 'HR & Payroll',
    description: 'Staff directory, statutory pay runs & leaves',
    icon: Users,
    color: 'from-blue-500 to-cyan-600',
    requiredRole: 'HR_OFFICER',
  },
  {
    id: 'fleet',
    name: 'Fleet Operations',
    description: 'Dispatch board, truck telemetry & fuel logs',
    icon: Truck,
    color: 'from-amber-500 to-orange-600',
    requiredRole: 'FLEET_MANAGER',
  },
  {
    id: 'finance',
    name: 'Finance & Ledger',
    description: 'Chart of accounts, journals & AR invoices',
    icon: Landmark,
    color: 'from-emerald-500 to-teal-600',
    requiredRole: 'ACCOUNTANT',
  },
  {
    id: 'ess',
    name: 'Employee Self-Service (ESS)',
    description: 'Mobile PWA: payslips, punch-clock & leave',
    icon: Smartphone,
    color: 'from-pink-500 to-rose-600',
    requiredRole: null, // Open to all staff
  },
];

export const AppSwitcher = ({ isOpen, onClose }) => {
  const { activePortal, switchPortal } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Departmental Workspaces</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch between specialized operational portals across Apex Logistics Ltd
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            Esc
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = activePortal === portal.id;

            return (
              <button
                key={portal.id}
                onClick={() => {
                  switchPortal(portal.id);
                  onClose();
                }}
                className={`relative flex items-start p-4 rounded-2xl border text-left transition-all group ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm'
                }`}
              >
                <div
                  className={`p-3 rounded-xl text-white bg-gradient-to-br ${portal.color} shadow-sm shrink-0 mr-3.5`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {portal.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {portal.description}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute top-4 right-4 text-indigo-600">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
