import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './portals/auth/LoginPage';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';

// Portals
import { AnalyticsDashboard } from './portals/admin/pages/AnalyticsDashboard';
import { RoleMatrixPage } from './portals/admin/pages/RoleMatrixPage';
import { TenantAuditViewer } from './portals/admin/components/TenantAuditViewer';

import { EmployeeDirectory } from './portals/hr/pages/EmployeeDirectory';
import { PayrollRunPage } from './portals/hr/pages/PayrollRunPage';
import { LeaveManagementPage } from './portals/hr/pages/LeaveManagementPage';

import { DispatchBoard } from './portals/fleet/pages/DispatchBoard';
import { FleetStatusPage } from './portals/fleet/pages/FleetStatusPage';
import { FuelStationLogs } from './portals/fleet/pages/FuelStationLogs';

import { ChartOfAccounts } from './portals/finance/pages/ChartOfAccounts';
import { JournalEntries } from './portals/finance/pages/JournalEntries';
import { BalanceSheet } from './portals/finance/pages/BalanceSheet';
import { InvoiceList } from './portals/finance/pages/InvoiceList';

import { ESSDashboard } from './portals/ess/pages/ESSDashboard';
import { MyPayslips } from './portals/ess/pages/MyPayslips';
import { ApplyLeave } from './portals/ess/pages/ApplyLeave';
import { TerminalPunchClockPage } from './portals/ess/pages/TerminalPunchClockPage';
import { PunchClock } from './portals/ess/components/PunchClock';

import { WarehouseDashboard } from './portals/warehouse/pages/WarehouseDashboard';
import { StockPalletInventoryPage } from './portals/warehouse/pages/StockPalletInventoryPage';
import { WeighbridgeInboundPage } from './portals/warehouse/pages/WeighbridgeInboundPage';
import { ProcurementDashboard } from './portals/procurement/pages/ProcurementDashboard';
import { LpoOrdersPage } from './portals/procurement/pages/LpoOrdersPage';
import { VendorContractsPage } from './portals/procurement/pages/VendorContractsPage';

import { CRMDashboard } from './portals/crm/pages/CRMDashboard';
import { CorporateClientsPage } from './portals/crm/pages/CorporateClientsPage';
import { FreightQuotationsPage } from './portals/crm/pages/FreightQuotationsPage';

import { ClientPortalDashboard } from './portals/client/pages/ClientPortalDashboard';
import { ClientShipmentsPage } from './portals/client/pages/ClientShipmentsPage';
import { ClientBillingPage } from './portals/client/pages/ClientBillingPage';

export const App = () => {
  const { isAuthenticated, activePortal } = useAuth();

  // Active page per portal defaults
  const defaultPages = {
    admin: 'dashboard',
    hr: 'payroll',
    fleet: 'dispatch',
    finance: 'invoices',
    ess: 'ess_dashboard',
    warehouse: 'warehouse_dashboard',
    procurement: 'procurement_dashboard',
    crm: 'crm_dashboard',
    client_portal: 'client_dashboard',
  };

  const [activePage, setActivePage] = useState(
    activePortal ? defaultPages[activePortal] || 'dashboard' : 'dashboard'
  );

  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('apex_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('apex_sidebar_collapsed', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handleSetSidebarCollapsed = (val) => {
    if (typeof val === 'function') {
      setIsSidebarCollapsed((prev) => {
        const next = val(prev);
        try {
          localStorage.setItem('apex_sidebar_collapsed', String(next));
        } catch (e) {}
        return next;
      });
    } else {
      setIsSidebarCollapsed(val);
      try {
        localStorage.setItem('apex_sidebar_collapsed', String(val));
      } catch (e) {}
    }
  };

  // Mobile sidebar drawer state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  // Close mobile nav on route/portal change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [activePage, activePortal]);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar, Esc to close mobile nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activePortal) {
      setActivePage(defaultPages[activePortal] || 'dashboard');
    }
  }, [activePortal]);

  // If not logged in, enforce the corporate login screen
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activePortal) {
      case 'admin':
        if (activePage === 'roles') return <RoleMatrixPage />;
        if (activePage === 'tenants') return <TenantAuditViewer />;
        return <AnalyticsDashboard />;

      case 'hr':
        if (activePage === 'employees') return <EmployeeDirectory />;
        if (activePage === 'leaves') return <LeaveManagementPage />;
        return <PayrollRunPage />;

      case 'fleet':
        if (activePage === 'vehicles') return <FleetStatusPage />;
        if (activePage === 'fuel') return <FuelStationLogs />;
        return <DispatchBoard />;

      case 'finance':
        if (activePage === 'coa') return <ChartOfAccounts />;
        if (activePage === 'journals') return <JournalEntries />;
        if (activePage === 'balance_sheet') return <BalanceSheet />;
        return <InvoiceList />;

      case 'ess':
        if (activePage === 'my_payslips') return <MyPayslips />;
        if (activePage === 'apply_leave') return <ApplyLeave />;
        if (activePage === 'punch_clock') return <TerminalPunchClockPage onNavigate={setActivePage} />;
        return <ESSDashboard onNavigate={setActivePage} />;

      case 'warehouse':
        if (activePage === 'inventory') return <StockPalletInventoryPage onNavigate={setActivePage} />;
        if (activePage === 'weighbridge') return <WeighbridgeInboundPage onNavigate={setActivePage} />;
        return <WarehouseDashboard activeSubSection={activePage} onNavigate={setActivePage} />;

      case 'procurement':
        if (activePage === 'lpo_orders') return <LpoOrdersPage onNavigate={setActivePage} />;
        if (activePage === 'vendor_contracts') return <VendorContractsPage onNavigate={setActivePage} />;
        return <ProcurementDashboard activeSubSection={activePage} onNavigate={setActivePage} />;

      case 'crm':
        if (activePage === 'clients') return <CorporateClientsPage onNavigate={setActivePage} />;
        if (activePage === 'quotations') return <FreightQuotationsPage onNavigate={setActivePage} />;
        return <CRMDashboard activeSubSection={activePage} onNavigate={setActivePage} />;

      case 'client_portal':
        if (activePage === 'shipments') return <ClientShipmentsPage onNavigate={setActivePage} />;
        if (activePage === 'billing') return <ClientBillingPage onNavigate={setActivePage} />;
        return <ClientPortalDashboard activeSubSection={activePage} onNavigate={setActivePage} />;

      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans overflow-hidden">
      <TopNav
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={toggleMobileNav}
      />
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={handleSetSidebarCollapsed}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={closeMobileNav}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/60 min-h-0">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
