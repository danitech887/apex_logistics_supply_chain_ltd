import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { PORTAL_CONFIG, getAuthorizedPortal } from '../config/portals';

export const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    id: 'usr-driver-1',
    email: 'm.kamau@apexlogistics.co.ke',
    name: 'Michael Kamau',
    roles: ['DRIVER'],
    department: 'Highway Transit Operations',
    staffNumber: 'EMP-041',
    avatar: 'MK',
    tenant: { id: 'tenant-1', company_name: 'Apex Logistics & Supply Chain Ltd', subdomain: 'apex-hq' },
    targetPortal: 'ess',
    portalTitle: 'Employee Self-Service (ESS)',
    portalDescription: 'Personal punch clock, monthly KRA payslips, and leave requests',
    databaseSchema: 'hr_payroll & fleet_ops (Scoped)',
    accentColor: 'rose',
    badgeText: 'Driver Transit Desk',
  },
  {
    id: 'usr-fin-1',
    email: 'finance.lead@apexlogistics.co.ke',
    name: 'Wanjiku Mwangi, CPA',
    roles: ['ACCOUNTANT'],
    department: 'Finance & General Ledger',
    staffNumber: 'FIN-007',
    avatar: 'WM',
    tenant: { id: 'tenant-1', company_name: 'Apex Logistics & Supply Chain Ltd', subdomain: 'apex-hq' },
    targetPortal: 'finance',
    portalTitle: 'Finance & General Ledger Portal',
    portalDescription: 'Double-entry journals, chart of accounts, AR freight invoices, and balance sheet',
    databaseSchema: 'finance',
    accentColor: 'emerald',
    badgeText: 'Finance & Audit Desk',
  },
  {
    id: 'usr-hr-1',
    email: 'hr.manager@apexlogistics.co.ke',
    name: 'Joseph Omondi',
    roles: ['HR_OFFICER'],
    department: 'Human Resources & Payroll',
    staffNumber: 'HR-012',
    avatar: 'JO',
    tenant: { id: 'tenant-1', company_name: 'Apex Logistics & Supply Chain Ltd', subdomain: 'apex-hq' },
    targetPortal: 'hr',
    portalTitle: 'HR & Statutory Payroll Workspace',
    portalDescription: 'Staff directory, statutory deductions (PAYE, NSSF, SHIF, Housing Levy), and pay runs',
    databaseSchema: 'hr_payroll',
    accentColor: 'blue',
    badgeText: 'HR & Payroll Desk',
  },
  {
    id: 'usr-fleet-1',
    email: 'fleet.ops@apexlogistics.co.ke',
    name: 'Hassan Kipchoge',
    roles: ['FLEET_MANAGER'],
    department: 'Fleet Operations & Dispatch',
    staffNumber: 'FLT-004',
    avatar: 'HK',
    tenant: { id: 'tenant-1', company_name: 'Apex Logistics & Supply Chain Ltd', subdomain: 'apex-hq' },
    targetPortal: 'fleet',
    portalTitle: 'Fleet Operations & Dispatch Portal',
    portalDescription: 'Transit manifests, live GPS truck telemetry, driver scheduling, and fuel logs',
    databaseSchema: 'fleet_ops',
    accentColor: 'amber',
    badgeText: 'Fleet & Dispatch Desk',
  },
  {
    id: 'usr-admin-1',
    email: 'admin@apexlogistics.co.ke',
    name: 'Catherine Njeri',
    roles: ['SUPER_ADMIN'],
    department: 'Executive Administration',
    staffNumber: 'ADM-001',
    avatar: 'CN',
    tenant: { id: 'tenant-1', company_name: 'Apex Logistics & Supply Chain Ltd', subdomain: 'apex-hq' },
    targetPortal: 'admin',
    portalTitle: 'Executive Administration Portal',
    portalDescription: 'Enterprise organization audit, system configuration, and company-wide RBAC matrix',
    databaseSchema: 'auth_core',
    accentColor: 'purple',
    badgeText: 'Executive & RBAC',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Active portal is strictly derived from user's authenticated RBAC roles
  const activePortal = user ? getAuthorizedPortal(user.roles) : null;
  const portalMeta = activePortal ? PORTAL_CONFIG[activePortal] : null;

  useEffect(() => {
    if (user) {
      localStorage.setItem('apex_user', JSON.stringify(user));
      localStorage.setItem('apex_tenant_subdomain', user.tenant?.subdomain || 'apex-hq');
    } else {
      localStorage.removeItem('apex_user');
      localStorage.removeItem('apex_access_token');
      localStorage.removeItem('apex_refresh_token');
    }

    // Auto-replenish access token from backend if missing
    const token = localStorage.getItem('apex_access_token');
    if (user && !token && user.email) {
      apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: user.email,
        password: 'password123',
        subdomain: user.tenant?.subdomain || 'apex-hq',
      }).then((res) => {
        if (res.data?.access_token) {
          localStorage.setItem('apex_access_token', res.data.access_token);
        }
        if (res.data?.refresh_token) {
          localStorage.setItem('apex_refresh_token', res.data.refresh_token);
        }
      }).catch((e) => {
        console.warn('Auto token setup error:', e);
      });
    }
  }, [user]);

  /**
   * Corporate authentication handler
   */
  const login = async (email, password, subdomain = 'apex-hq') => {
    setLoading(true);
    setAuthError(null);

    try {
      // 1. Attempt API authentication if backend is active
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: email.trim(),
        password,
        subdomain: subdomain.trim(),
      });

      const { access_token, refresh_token, user: userData } = response.data;
      if (access_token) localStorage.setItem('apex_access_token', access_token);
      if (refresh_token) localStorage.setItem('apex_refresh_token', refresh_token);
      
      setUser(userData);
      return { success: true };
    } catch (err) {
      // 2. Mock / Demo fallback for local development & demonstration
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (matched) {
        setUser(matched);
        return { success: true };
      }

      const errorMessage =
        err.response?.data?.message ||
        'Authentication failed. Invalid corporate email or tenant mismatch.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fast-track demo login for departmental testing and verification with real JWT tokens
   */
  const loginAsDemoUser = async (userId) => {
    const persona = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
    setLoading(true);
    setAuthError(null);

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: persona.email,
        password: 'password123',
        subdomain: persona.tenant?.subdomain || 'apex-hq',
      });
      const { access_token, refresh_token, user: userData } = response.data;
      if (access_token) localStorage.setItem('apex_access_token', access_token);
      if (refresh_token) localStorage.setItem('apex_refresh_token', refresh_token);
      setUser({ ...persona, ...userData });
    } catch (err) {
      console.warn('Backend login fallback to local persona:', err);
      setUser(persona);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear session and return to corporate login
   */
  const logout = () => {
    setUser(null);
    setAuthError(null);
    localStorage.removeItem('apex_user');
    localStorage.removeItem('apex_access_token');
    localStorage.removeItem('apex_refresh_token');
  };

  const hasRole = (roleCode) => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.roles.includes(roleCode);
  };

  const value = {
    user,
    tenant: user?.tenant,
    activePortal,
    portalMeta,
    isAuthenticated: !!user,
    loading,
    authError,
    setAuthError,
    demoUsers: DEMO_USERS,
    login,
    loginAsDemoUser,
    logout,
    hasRole,
    isAdmin: user?.roles?.includes('SUPER_ADMIN'),
    isHR: hasRole('HR_OFFICER'),
    isFleet: hasRole('FLEET_MANAGER'),
    isFinance: hasRole('ACCOUNTANT'),
    isDriver: user?.roles?.includes('DRIVER'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
