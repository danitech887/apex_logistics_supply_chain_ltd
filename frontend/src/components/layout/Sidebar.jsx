import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PORTAL_CONFIG } from '../../config/portals';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CalendarDays,
  Truck,
  Fuel,
  Receipt,
  Scale,
  Clock,
  ScrollText,
  Boxes,
  ShoppingBag,
  Briefcase,
  Globe,
  PackageCheck,
  Calculator,
  Building,
  BookOpenCheck,
  X,
} from 'lucide-react';

const portalNavConfigs = {
  admin: [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'roles', label: 'Roles', icon: BookOpenCheck },
    { id: 'tenants', label: 'Tenants', icon: Building },
  ],
  hr: [
    { id: 'payroll', label: 'Payroll', icon: FileSpreadsheet },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'leaves', label: 'Leave', icon: CalendarDays },
  ],
  fleet: [
    { id: 'dispatch', label: 'Dispatch', icon: Truck },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'fuel', label: 'Fuel logs', icon: Fuel },
  ],
  finance: [
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'coa', label: 'Accounts', icon: Scale },
    { id: 'journals', label: 'Journals', icon: BookOpenCheck },
    { id: 'balance_sheet', label: 'Balance sheet', icon: FileSpreadsheet },
  ],
  ess: [
    { id: 'ess_dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'my_payslips', label: 'Payslips', icon: ScrollText },
    { id: 'apply_leave', label: 'Leave', icon: CalendarDays },
    { id: 'punch_clock', label: 'Time clock', icon: Clock },
  ],
  warehouse: [
    { id: 'warehouse_dashboard', label: 'Overview', icon: Boxes },
    { id: 'inventory', label: 'Inventory', icon: PackageCheck },
    { id: 'weighbridge', label: 'Weighbridge', icon: Scale },
  ],
  procurement: [
    { id: 'procurement_dashboard', label: 'Overview', icon: ShoppingBag },
    { id: 'lpo_orders', label: 'Purchase orders', icon: FileSpreadsheet },
    { id: 'vendor_contracts', label: 'Suppliers', icon: Building },
  ],
  crm: [
    { id: 'crm_dashboard', label: 'Overview', icon: Briefcase },
    { id: 'clients', label: 'Clients', icon: Building },
    { id: 'quotations', label: 'Quotations', icon: Calculator },
  ],
  client_portal: [
    { id: 'client_dashboard', label: 'Overview', icon: Globe },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ],
};

export const Sidebar = ({
  activePage,
  onNavigate,
  isCollapsed = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { activePortal, user } = useAuth();
  const portal = PORTAL_CONFIG[activePortal] || PORTAL_CONFIG.admin;
  const navItems = portalNavConfigs[activePortal] || portalNavConfigs.admin;
  const PortalIcon = portal.icon;
  const role = user?.roles?.[0]?.replaceAll('_', ' ') || 'Team member';

  const renderNav = (mobile = false) => (
    <nav aria-label={`${portal.shortName} navigation`} className="flex-1 overflow-y-auto p-3">
      <div className="space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => {
                onNavigate(id);
                if (mobile) onCloseMobile?.();
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              title={isCollapsed && !mobile ? label : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed && !mobile ? 'justify-center px-2' : ''}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {(!isCollapsed || mobile) && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );

  const header = (mobile = false) => (
    <div className={`border-b border-slate-800 ${isCollapsed && !mobile ? 'px-2 py-4' : 'px-4 py-4'}`}>
      {isCollapsed && !mobile ? (
        <div className="flex justify-center" title={portal.shortName}>
          <PortalIcon className="h-5 w-5 text-indigo-400" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <PortalIcon className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold text-white">{portal.shortName}</span>
            </div>
            {mobile && (
              <button
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="mt-2 pl-10 text-xs capitalize text-slate-500">{role}</p>
        </>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`relative z-30 hidden h-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-[width] duration-200 md:flex ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {header()}
        {renderNav()}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-slate-950/60"
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-900 shadow-xl animate-slide-right">
            {header(true)}
            {renderNav(true)}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
