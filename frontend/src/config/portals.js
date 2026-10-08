import {
  ShieldCheck,
  Users,
  Truck,
  Landmark,
  Smartphone,
} from 'lucide-react';

export const PORTAL_CONFIG = {
  admin: {
    id: 'admin',
    name: 'Executive Administration & RBAC',
    shortName: 'Executive Admin',
    description: 'Cross-tenant telemetry, system audit logs, and company-wide RBAC role matrix',
    icon: ShieldCheck,
    schema: 'auth_core',
    themeColor: 'purple',
    accentGradient: 'from-purple-600 to-indigo-700',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    requiredRole: 'SUPER_ADMIN',
  },
  hr: {
    id: 'hr',
    name: 'Human Resources & Statutory Payroll',
    shortName: 'HR & Payroll',
    description: 'Staff directory, KRA statutory deductions (PAYE, NSSF, SHIF, Housing Levy), and pay runs',
    icon: Users,
    schema: 'hr_payroll',
    themeColor: 'blue',
    accentGradient: 'from-blue-600 to-cyan-700',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    requiredRole: 'HR_OFFICER',
  },
  fleet: {
    id: 'fleet',
    name: 'Fleet Operations & Transit Dispatch',
    shortName: 'Fleet Operations',
    description: 'Transit manifests, live GPS truck telemetry, driver scheduling, and fuel station logs',
    icon: Truck,
    schema: 'fleet_ops',
    themeColor: 'amber',
    accentGradient: 'from-amber-600 to-orange-700',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    requiredRole: 'FLEET_MANAGER',
  },
  finance: {
    id: 'finance',
    name: 'Finance & General Ledger Desk',
    shortName: 'Finance & Ledger',
    description: 'Double-entry journal validation, chart of accounts, AR freight invoices, and balance sheets',
    icon: Landmark,
    schema: 'finance',
    themeColor: 'emerald',
    accentGradient: 'from-emerald-600 to-teal-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    requiredRole: 'ACCOUNTANT',
  },
  ess: {
    id: 'ess',
    name: 'Employee Self-Service (ESS)',
    shortName: 'Staff & Driver Portal',
    description: 'Mobile PWA: personal punch clock, KRA monthly payslips, and leave request submission',
    icon: Smartphone,
    schema: 'hr_payroll & fleet_ops (Scoped)',
    themeColor: 'rose',
    accentGradient: 'from-pink-600 to-rose-700',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    requiredRole: 'DRIVER',
  },
};

/**
 * Deterministically maps user RBAC roles to their authorized departmental workspace.
 * Enforces strict portal isolation.
 */
export const getAuthorizedPortal = (roles = []) => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return 'ess';
  if (roles.includes('SUPER_ADMIN')) return 'admin';
  if (roles.includes('HR_OFFICER')) return 'hr';
  if (roles.includes('FLEET_MANAGER') || roles.includes('DISPATCH_OFFICER')) return 'fleet';
  if (roles.includes('ACCOUNTANT') || roles.includes('FINANCE_CONTROLLER')) return 'finance';
  return 'ess'; // default for drivers and general personnel
};
