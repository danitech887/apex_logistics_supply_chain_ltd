const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health/`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login/`,
    REFRESH: `${API_BASE_URL}/auth/refresh/`,
    PROFILE: `${API_BASE_URL}/auth/profile/`,
    MFA_VERIFY: `${API_BASE_URL}/auth/mfa-verify/`,
    PASSWORD_ROTATE: `${API_BASE_URL}/auth/password-rotate/`,
    TENANTS: `${API_BASE_URL}/auth/tenants/`,
    QUICK_ACCESS: `${API_BASE_URL}/auth/quick-access-profiles/`,
    ADMIN_OVERVIEW: `${API_BASE_URL}/auth/admin/overview/`,
    ADMIN_USERS: `${API_BASE_URL}/auth/admin/users/`,
    ADMIN_ROLES: `${API_BASE_URL}/auth/admin/roles/`,
  },
  HR: {
    EMPLOYEES: `${API_BASE_URL}/hr/employees/`,
    NEXT_STAFF_NUMBER: `${API_BASE_URL}/hr/employees/next_staff_number/`,
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
    INVENTORY_METRICS: `${API_BASE_URL}/warehouse-crm/inventory/metrics/`,
    WAYBILLS: `${API_BASE_URL}/warehouse-crm/waybills/`,
    WEIGHBRIDGE_STATS: `${API_BASE_URL}/warehouse-crm/waybills/weighbridge_stats/`,
  },
};
