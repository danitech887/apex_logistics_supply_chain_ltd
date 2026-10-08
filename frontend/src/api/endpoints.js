export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health/`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login/`,
    REFRESH: `${API_BASE_URL}/auth/refresh/`,
    PROFILE: `${API_BASE_URL}/auth/profile/`,
    MFA_VERIFY: `${API_BASE_URL}/auth/mfa-verify/`,
    PASSWORD_ROTATE: `${API_BASE_URL}/auth/password-rotate/`,
    TENANTS: `${API_BASE_URL}/auth/tenants/`,
  },
  HR: {
    EMPLOYEES: `${API_BASE_URL}/hr/employees/`,
    LEAVES: `${API_BASE_URL}/hr/leaves/`,
    PAYROLL_RUNS: `${API_BASE_URL}/hr/payroll-runs/`,
    PAYSLIPS: `${API_BASE_URL}/hr/payslips/`,
    MY_PAYSLIPS: `${API_BASE_URL}/hr/payslips/my_payslips/`,
  },
  FLEET: {
    VEHICLES: `${API_BASE_URL}/fleet/vehicles/`,
    TRIPS: `${API_BASE_URL}/fleet/trips/`,
    FUEL_LOGS: `${API_BASE_URL}/fleet/fuel-logs/`,
  },
  FINANCE: {
    ACCOUNTS: `${API_BASE_URL}/finance/accounts/`,
    JOURNALS: `${API_BASE_URL}/finance/journals/`,
    INVOICES: `${API_BASE_URL}/finance/invoices/`,
    REPORTS: `${API_BASE_URL}/finance/reports/`,
  },
  WAREHOUSE_CRM: {
    CLIENTS: `${API_BASE_URL}/warehouse-crm/clients/`,
    INVENTORY: `${API_BASE_URL}/warehouse-crm/inventory/`,
    WAYBILLS: `${API_BASE_URL}/warehouse-crm/waybills/`,
  },
};
