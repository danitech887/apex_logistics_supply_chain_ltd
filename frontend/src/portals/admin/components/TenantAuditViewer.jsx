import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  Server,
  Users,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Building,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { UserCreationModal } from './UserCreationModal';

export const TenantAuditViewer = () => {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'branches'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(ENDPOINTS.AUTH.TENANTS);
      setTenants(res.data);
    } catch (err) {
      console.warn('Tenants fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await apiClient.get(ENDPOINTS.AUTH.ADMIN_USERS);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load enterprise users:', err);
      setError('Unable to load enterprise user directory from PostgreSQL.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      await apiClient.patch(`${ENDPOINTS.AUTH.ADMIN_USERS}${user.id}/`, {
        is_active: newStatus,
      });

      // Update locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );

      setActionSuccess(
        `Account ${user.email} marked as ${newStatus ? 'Active' : 'Suspended'}.`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      alert('Failed to update user status in database.');
    }
  };

  const handleUserCreated = (newUser) => {
    fetchUsers();
    setActionSuccess(`Account provisioned successfully for ${newUser.full_name}!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesDept = departmentFilter === 'ALL' || u.department === departmentFilter;
    const matchesRole =
      roleFilter === 'ALL' || u.roles.some((r) => r.code === roleFilter);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.staff_number && u.staff_number.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));

    return matchesDept && matchesRole && matchesSearch;
  });

  // Extract distinct departments
  const distinctDepts = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  const fallbackTenants = [
    {
      id: 'tenant-1',
      company_name: 'Apex Logistics & Supply Chain Ltd',
      subdomain: 'apex-hq',
      status: 'AVAILABLE',
      schemas: ['auth_core', 'hr_payroll', 'fleet_ops', 'finance', 'warehouse_crm'],
      usersCount: users.length || 13,
      fleetCount: 5,
      region: 'Nairobi Corporate Headquarters & Inland Terminal',
    },
    {
      id: 'tenant-2',
      company_name: 'Apex Port CFS Logistics Ltd',
      subdomain: 'apex-mombasa',
      status: 'AVAILABLE',
      schemas: ['auth_core', 'fleet_ops', 'warehouse_crm'],
      usersCount: 8,
      fleetCount: 2,
      region: 'Mombasa Port CFS Terminal & Maritime Berth',
    },
  ];

  const displayTenants = tenants.length > 0 ? tenants : fallbackTenants;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Executive Portal', 'Organizations & User Directory']} />
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Enterprise Directory & Branch Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage corporate tenants, PostgreSQL schema partitions, and provisioned user credentials
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchTenants();
              fetchUsers();
            }}
            disabled={usersLoading}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Enterprise User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'branches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Tenant Branches ({displayTenants.length})</span>
        </button>
      </div>

      {/* Tab 1: Live User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, EMP-ID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments</option>
                {distinctDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All RBAC Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="HR_OFFICER">HR_OFFICER</option>
                <option value="FLEET_MANAGER">FLEET_MANAGER</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="DRIVER">DRIVER</option>
                <option value="WAREHOUSE_SUPERVISOR">WAREHOUSE_SUPERVISOR</option>
                <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
                <option value="SALES_MANAGER">SALES_MANAGER</option>
                <option value="CLIENT">CLIENT</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-4">Staff Number</th>
                    <th className="py-4 px-4">Department & Designation</th>
                    <th className="py-4 px-4">Assigned Roles</th>
                    <th className="py-4 px-4">Account Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {usersLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Querying PostgreSQL user directory...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No enterprise accounts match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const initials = u.full_name
                        ? u.full_name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()
                        : 'AP';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block">
                                  {u.full_name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                            {u.staff_number}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">
                              {u.department}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {u.designation || 'Staff'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r) => (
                                  <span
                                    key={r.id || r.code}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                                  >
                                    {r.code}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No role</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  u.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                u.is_active
                                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              }`}
                            >
                              {u.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tenant Branches */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {displayTenants.map((t) => (
            <div
              key={t.id}
              className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {t.subdomain}.apexlogistics.co.ke
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{t.company_name}</h3>
                  <p className="text-xs text-slate-500">{t.region}</p>
                </div>
                <StatusBadge status={t.status || 'AVAILABLE'} />
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Provisioned Staff:</span>
                  <span className="text-sm font-black text-slate-900">
                    {t.usersCount || users.length} Personnel
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Commercial Trucks:</span>
                  <span className="text-sm font-black text-slate-900">
                    {t.fleetCount || 5} Prime Movers
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Active PostgreSQL Schema Partitions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(t.schemas || ['auth_core', 'hr_payroll', 'fleet_ops', 'finance', 'warehouse_crm']).map(
                    (s) => {
                      const labels = {
                        auth_core: 'Executive & Admin',
                        hr_payroll: 'HR & Payroll',
                        fleet_ops: 'Fleet Operations',
                        finance: 'Finance & Ledger',
                        warehouse_crm: 'Warehouse & CRM',
                      };
                      return (
                        <span
                          key={s}
                          className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          {labels[s] || s}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provision User Modal */}
      <UserCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};
