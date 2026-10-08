import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PORTAL_CONFIG } from '../../config/portals';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  CalendarDays,
  Truck,
  Fuel,
  BookOpenCheck,
  Receipt,
  Scale,
  Clock,
  ScrollText,
  Lock,
  ShieldCheck,
  Building,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const Sidebar = ({
  activePage,
  onNavigate,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const { activePortal, user } = useAuth();

  const portalMeta = (activePortal && PORTAL_CONFIG[activePortal]) || PORTAL_CONFIG.admin;
  const PortalIcon = portalMeta.icon;

  const portalNavConfigs = {
    admin: [
      { id: 'dashboard', label: 'Executive Analytics', icon: LayoutDashboard },
      { id: 'roles', label: 'RBAC Role Matrix', icon: ShieldAlert },
      { id: 'tenants', label: 'Tenant Audit Viewer', icon: BookOpenCheck },
    ],
    hr: [
      { id: 'payroll', label: 'Payroll Pay Runs', icon: FileSpreadsheet },
      { id: 'employees', label: 'Employee Directory', icon: Users },
      { id: 'leaves', label: 'Leave Approvals', icon: CalendarDays },
    ],
    fleet: [
      { id: 'dispatch', label: 'Live Dispatch Board', icon: Truck },
      { id: 'vehicles', label: 'Fleet Status & Telemetry', icon: Truck },
      { id: 'fuel', label: 'Fuel Station Logs', icon: Fuel },
    ],
    finance: [
      { id: 'invoices', label: 'Freight Invoices (AR)', icon: Receipt },
      { id: 'coa', label: 'Chart of Accounts', icon: Scale },
      { id: 'journals', label: 'General Ledger Entries', icon: BookOpenCheck },
      { id: 'balance_sheet', label: 'Financial Statements', icon: FileSpreadsheet },
    ],
    ess: [
      { id: 'ess_dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
      { id: 'my_payslips', label: 'My Payslips (KRA)', icon: ScrollText },
      { id: 'apply_leave', label: 'Apply for Leave', icon: CalendarDays },
      { id: 'punch_clock', label: 'Terminal Punch Clock', icon: Clock },
    ],
  };

  const currentNav = portalNavConfigs[activePortal] || portalNavConfigs.admin;

  const handleToggle = () => {
    if (setIsCollapsed) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full select-none transition-all duration-300 ease-in-out relative z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Workspace Department Tag / Header */}
      <div
        className={`border-b border-slate-800/90 transition-all duration-300 ${
          isCollapsed ? 'p-3 flex flex-col items-center' : 'p-4 space-y-2'
        }`}
      >
        {isCollapsed ? (
          <>
            <div
              className="p-2.5 rounded-xl bg-slate-800/90 text-indigo-400 border border-slate-700/60 shadow-xs flex items-center justify-center cursor-pointer group relative"
              title={`${portalMeta.shortName} (${user?.roles?.[0] || 'AUTHORIZED'})`}
            >
              <PortalIcon className="w-5 h-5 shrink-0" />
              {/* Floating Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-2xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5 top-1/2 -translate-y-1/2">
                <span>{portalMeta.shortName}</span>
                <span className="text-[10px] font-mono text-indigo-300">
                  ({user?.roles?.[0] || 'AUTH'})
                </span>
              </div>
            </div>

            {setIsCollapsed && (
              <button
                onClick={handleToggle}
                className="mt-2.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Expand sidebar (Ctrl+B)"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Dedicated Portal
              </span>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  Isolated
                </span>
                {setIsCollapsed && (
                  <button
                    onClick={handleToggle}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Collapse sidebar (Ctrl+B)"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-sm font-bold text-white leading-tight truncate" title={portalMeta.name}>
              {portalMeta.shortName}
            </h2>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span>Role:</span>
              <span className="font-mono font-bold text-indigo-300 truncate">
                {user?.roles?.[0] || 'AUTHORIZED'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Nav Items */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 transition-all duration-300 ${
          isCollapsed ? 'p-2' : 'p-3'
        }`}
      >
        {isCollapsed ? (
          <div className="my-1 border-t border-slate-800/80" />
        ) : (
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Department Modules
          </p>
        )}

        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          if (isCollapsed) {
            return (
              <div key={item.id} className="relative group flex justify-center">
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </button>

                {/* Hover Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-2xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2 top-1/2 -translate-y-1/2">
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Enterprise Operational Security / Session Card */}
      {isCollapsed ? (
        <div className="p-2.5 border-t border-slate-800/80 flex flex-col items-center space-y-2">
          <div className="relative group flex justify-center">
            <div
              className="w-10 h-10 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center text-emerald-400 cursor-pointer relative"
              title="Secure Workstation - Nairobi Central Operations"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-slate-950 text-white text-xs font-medium rounded-xl shadow-2xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex flex-col top-1/2 -translate-y-1/2">
              <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure Workstation</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Nairobi Central Operations</span>
              <span className="text-[9px] text-indigo-300 font-mono mt-0.5">Isolated Department</span>
            </div>
          </div>

          {setIsCollapsed && (
            <button
              onClick={handleToggle}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 space-y-2 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure Workstation</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Hub:</span>
              <span className="font-semibold text-white">Nairobi Central Operations</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Departmental isolation active. Unauthorized cross-department actions are restricted.
            </p>
          </div>

          {setIsCollapsed && (
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition cursor-pointer"
              title="Collapse sidebar"
            >
              <div className="flex items-center space-x-2">
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse sidebar</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
                Ctrl+B
              </kbd>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
