import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Shield,
  Check,
  X,
  Users,
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Building,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';

export const RoleMatrixPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.AUTH.ADMIN_ROLES);
      setRoles(res.data);
      if (res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch RBAC roles:', err);
      setError('Unable to load RBAC roles from PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // System RBAC Permission Governance Matrix across all 5 operational schemas
  const permissions = [
    {
      domain: 'auth_core',
      action: 'Manage Corporate Tenants & Subdomain Isolation',
      allowed: ['SUPER_ADMIN'],
    },
    {
      domain: 'auth_core',
      action: 'Provision Enterprise User Accounts & RBAC Roles',
      allowed: ['SUPER_ADMIN'],
    },
    {
      domain: 'hr_payroll',
      action: 'Execute Monthly Statutory Payroll Runs (KRA/NSSF/SHIF)',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER'],
    },
    {
      domain: 'hr_payroll',
      action: 'Approve & Reject Employee Statutory Leave Requests',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER'],
    },
    {
      domain: 'hr_payroll',
      action: 'Onboard New Personnel with Sequential Staff Numbering',
      allowed: ['SUPER_ADMIN', 'HR_OFFICER'],
    },
    {
      domain: 'fleet_ops',
      action: 'Dispatch Commercial Prime Movers & Assign Drivers',
      allowed: ['SUPER_ADMIN', 'FLEET_MANAGER'],
    },
    {
      domain: 'fleet_ops',
      action: 'Inspect Live GPS Corridor Telemetry & Odometer Logs',
      allowed: ['SUPER_ADMIN', 'FLEET_MANAGER'],
    },
    {
      domain: 'fleet_ops',
      action: 'Log Highway Fuel Station Receipts & Litre Dispense',
      allowed: ['SUPER_ADMIN', 'FLEET_MANAGER', 'DRIVER'],
    },
    {
      domain: 'finance',
      action: 'Post Balanced Double-Entry General Ledger Journals',
      allowed: ['SUPER_ADMIN', 'ACCOUNTANT'],
    },
    {
      domain: 'finance',
      action: 'Generate AR Freight Tax Invoices & Download KRA PDFs',
      allowed: ['SUPER_ADMIN', 'ACCOUNTANT'],
    },
    {
      domain: 'finance',
      action: 'Inspect Balance Sheet & Chart of Accounts (COA)',
      allowed: ['SUPER_ADMIN', 'ACCOUNTANT'],
    },
    {
      domain: 'warehouse_crm',
      action: 'Capture CFS Inbound Gross/Tare Weighbridge Scale Weights',
      allowed: ['SUPER_ADMIN', 'WAREHOUSE_SUPERVISOR'],
    },
    {
      domain: 'warehouse_crm',
      action: 'Manage Pallet Bay Storage & Track Stock Items',
      allowed: ['SUPER_ADMIN', 'WAREHOUSE_SUPERVISOR'],
    },
    {
      domain: 'warehouse_crm',
      action: 'Issue Local Purchase Orders (LPO) & Manage Vendors',
      allowed: ['SUPER_ADMIN', 'PROCUREMENT_OFFICER'],
    },
    {
      domain: 'warehouse_crm',
      action: 'Negotiate Freight Rate Cards & Manage B2B CRM Pipeline',
      allowed: ['SUPER_ADMIN', 'SALES_MANAGER'],
    },
    {
      domain: 'warehouse_crm',
      action: 'Track Corporate Consignments & Download Digital PODs',
      allowed: ['SUPER_ADMIN', 'CLIENT', 'SALES_MANAGER', 'WAREHOUSE_SUPERVISOR'],
    },
    {
      domain: 'ess',
      action: 'Employee Self-Service (KRA P9, Payslips, Time Clock)',
      allowed: [
        'SUPER_ADMIN',
        'HR_OFFICER',
        'FLEET_MANAGER',
        'ACCOUNTANT',
        'DRIVER',
        'WAREHOUSE_SUPERVISOR',
        'PROCUREMENT_OFFICER',
        'SALES_MANAGER',
      ],
    },
  ];

  const filteredPermissions = permissions.filter((p) => {
    const matchesDomain = selectedDomain === 'ALL' || p.domain === selectedDomain;
    const matchesSearch =
      !searchFilter ||
      p.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Executive Portal', 'Role-Based Access Control Matrix']} />
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Enterprise RBAC Role Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Least-privilege security matrix enforced across API endpoints, database schemas, and user portals
          </p>
        </div>

        <button
          onClick={fetchRoles}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Cards Row (Live from Database) */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Provisioned Database Roles ({roles.length} Total)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {roles.map((r) => {
            const isSelected = selectedRole?.code === r.code;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-900 shadow-2xs'
                }`}
              >
                <div>
                  <span
                    className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-indigo-800 text-indigo-200'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {r.code}
                  </span>
                  <h4
                    className={`text-xs font-bold mt-1.5 truncate ${
                      isSelected ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {r.code.replace(/_/g, ' ')}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100/30 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                    {r.user_count} {r.user_count === 1 ? 'User' : 'Users'}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  >
                    Active
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Role Inspector Card */}
      {selectedRole && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-black tracking-tight">{selectedRole.code}</h3>
                <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60">
                  ID: {selectedRole.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {selectedRole.description || 'No system description provided.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800 shrink-0">
              {selectedRole.user_count} Active Assigned Accounts
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Staff Members Holding This Role in PostgreSQL:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedRole.users && selectedRole.users.length > 0 ? (
                selectedRole.users.map((u) => (
                  <div
                    key={u.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex items-center space-x-2"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-bold text-white">{u.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({u.staff_number})</span>
                    <span className="text-[10px] text-indigo-300">• {u.email}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No users currently assigned to this role.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Matrix Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700">Filter Domain:</span>
          {['ALL', 'auth_core', 'hr_payroll', 'fleet_ops', 'finance', 'warehouse_crm', 'ess'].map(
            (dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDomain === dom
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {dom}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Interactive Permission Grid Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-4 px-6 min-w-[280px]">Operational Capability / Action</th>
                {roles.map((r) => (
                  <th
                    key={r.code}
                    className={`py-4 px-3 text-center min-w-[90px] ${
                      selectedRole?.code === r.code ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <span className="block text-slate-900 font-extrabold text-[11px]">
                      {r.code.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] text-indigo-700 font-mono font-medium block">
                      {r.user_count} users
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-6">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-indigo-700 mr-2 border border-slate-200">
                      {perm.domain}
                    </span>
                    <span className="font-semibold text-slate-800">{perm.action}</span>
                  </td>
                  {roles.map((r) => {
                    const isGranted = perm.allowed.includes(r.code);
                    const isColSelected = selectedRole?.code === r.code;
                    return (
                      <td
                        key={r.code}
                        className={`py-3.5 px-3 text-center ${isColSelected ? 'bg-indigo-50/30' : ''}`}
                      >
                        {isGranted ? (
                          <div className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-800 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="inline-flex p-1 rounded-full bg-slate-100 text-slate-300">
                            <X className="w-3.5 h-3.5 stroke-[2]" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
