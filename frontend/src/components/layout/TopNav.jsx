import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PORTAL_CONFIG } from '../../config/portals';
import {
  LogOut,
  Building2,
  ShieldCheck,
  Shield,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';

export const TopNav = ({
  isSidebarCollapsed,
  onToggleSidebar,
  isMobileNavOpen,
  onToggleMobileNav,
}) => {
  const { user, activePortal, logout, tenant } = useAuth();

  const portalConfig = (activePortal && PORTAL_CONFIG[activePortal]) || PORTAL_CONFIG.admin;
  const PortalIcon = portalConfig.icon;

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left Branding & Dedicated Department Badge */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        {/* Mobile Open Menu Button (Mobile view only) */}
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="flex md:hidden items-center space-x-1.5 px-2.5 py-1.5 -ml-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/90 rounded-xl transition cursor-pointer border border-slate-200 shadow-2xs"
            title={isMobileNavOpen ? "Close menu" : "Open menu"}
            aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
          >
            {isMobileNavOpen ? (
              <X className="w-5 h-5 text-indigo-600" />
            ) : (
              <Menu className="w-5 h-5 text-indigo-600" />
            )}
            <span className="text-xs font-bold hidden sm:inline">Menu</span>
          </button>
        )}

        {/* Desktop Sidebar Toggle (Desktop view only) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-200"
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}

        <div className="flex items-center space-x-3 shrink-0">
          <img
            src="/logo.png"
            alt="Apex Logistics & Supply Chain Ltd"
            className="h-9 sm:h-10 w-auto object-contain max-w-[150px] sm:max-w-[200px]"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block shrink-0" />

        {/* Dedicated Department Portal Indicator (Strictly Locked to Role) */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${portalConfig.badgeClass}`}
            title="Your authenticated department portal. Cross-department switching is disabled for data integrity."
          >
            <PortalIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-none">
              {portalConfig.shortName}
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Dedicated Workspace</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Tenant Indicator, Authenticated User & Sign Out */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Tenant Organization */}
        <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold">{tenant?.company_name || 'Apex Logistics HQ'}</span>
          <span className="text-[10px] text-slate-400 font-mono">({tenant?.subdomain || 'apex-hq'})</span>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
            {user?.avatar || 'AP'}
          </div>

          <div className="hidden md:block text-left">
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[150px]">
                {user?.name}
              </p>
              {user?.staffNumber && (
                <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-100 text-slate-600">
                  {user.staffNumber}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[170px]">
              {user?.department}
            </p>
          </div>

          {/* Secure Sign Out Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition cursor-pointer"
            title="Sign out of your dedicated department portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
