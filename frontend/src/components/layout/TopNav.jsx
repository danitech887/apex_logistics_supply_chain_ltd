import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PORTAL_CONFIG } from '../../config/portals';
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

export const TopNav = ({
  isSidebarCollapsed,
  onToggleSidebar,
  isMobileNavOpen,
  onToggleMobileNav,
}) => {
  const { user, activePortal, logout } = useAuth();
  const portal = PORTAL_CONFIG[activePortal] || PORTAL_CONFIG.admin;
  const PortalIcon = portal.icon;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          title={isMobileNavOpen ? 'Close menu' : 'Open menu'}
          aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:block"
          title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed
            ? <PanelLeftOpen className="h-5 w-5" />
            : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <img
          src="/logo.png"
          alt="Apex Logistics & Supply Chain Ltd"
          className="h-8 w-auto max-w-[150px] object-contain"
        />
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex ${portal.badgeClass}`}>
          <PortalIcon className="h-3.5 w-3.5" />
          <span>{portal.shortName}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-medium text-slate-800">
            {user?.name || 'Apex user'}
          </p>
          <p className="max-w-40 truncate text-xs text-slate-500">
            {user?.department || portal.shortName}
          </p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700"
          aria-hidden="true"
        >
          {user?.avatar || 'AP'}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default TopNav;
