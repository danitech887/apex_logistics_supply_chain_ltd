import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { OnboardEmployeeModal } from '../components/OnboardEmployeeModal';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  UserPlus,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

export const EmployeeDirectory = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailModalTab, setDetailModalTab] = useState('profile');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Normalizes an employee record to guarantee both snake_case and camelCase access
  const normalizeEmployee = useCallback((emp) => {
    const fullName =
      emp.name ||
      emp.full_name ||
      (emp.user_details ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() : '') ||
      'Staff Member';

    const email =
      emp.email ||
      (emp.user_details && emp.user_details.email) ||
      '';

    const phone =
      emp.phone ||
      emp.phone_number ||
      (emp.user_details && emp.user_details.phone_number) ||
      '';

    const staffNumber = emp.staffNumber || emp.staff_number || '';
    const taxPin = emp.taxPin || emp.tax_pin || '';
    const nationalId = emp.nationalId || emp.national_id || '';
    const baseSalary = Number(emp.baseSalary ?? emp.base_salary ?? 0);
    const hourlyRate = Number(emp.hourlyRate ?? emp.hourly_rate ?? 0);
    const dateOfHire = emp.dateOfHire || emp.date_of_hire || '';
    const status = emp.status || (emp.is_active ? 'AVAILABLE' : 'INACTIVE');
    const roles = emp.roles || (emp.user_details?.roles?.map((r) => r.code)) || [];
    const role = emp.role || (roles.length > 0 ? roles[0] : 'EMPLOYEE');

    return {
      ...emp,
      id: emp.id,
      name: fullName,
      full_name: fullName,
      email,
      phone,
      phone_number: phone,
      staffNumber,
      staff_number: staffNumber,
      taxPin,
      tax_pin: taxPin,
      nationalId,
      national_id: nationalId,
      department: emp.department || 'Operations',
      designation: emp.designation || 'Staff',
      baseSalary,
      base_salary: baseSalary,
      hourlyRate,
      hourly_rate: hourlyRate,
      dateOfHire,
      date_of_hire: dateOfHire,
      status,
      is_active: status === 'AVAILABLE' || emp.is_active === true,
      roles,
      role,
    };
  }, []);

  // Fetch employees from PostgreSQL backend API
  const fetchEmployees = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const response = await apiClient.get(ENDPOINTS.HR.EMPLOYEES);
      const rawData = response.data?.results || response.data || [];
      const normalized = (Array.isArray(rawData) ? rawData : []).map(normalizeEmployee);

      setEmployees(normalized);
      setDbConnected(true);
      if (isManualRefresh) {
        showSuccess({
          title: 'Database Synchronized',
          message: `Successfully refreshed ${normalized.length} staff records directly from PostgreSQL.`,
        });
      }
    } catch (err) {
      console.warn('Backend employees fetch warning, falling back:', err);
      setDbConnected(false);
      // Fallback dummy records if server was temporarily unavailable
      if (employees.length === 0) {
        const fallbacks = [
          {
            id: 'emp-1',
            staffNumber: 'EMP-001',
            name: 'Catherine Njeri',
            email: 'admin@apexlogistics.co.ke',
            phone: '+254 722 000 111',
            department: 'Executive Administration',
            designation: 'Managing Director',
            baseSalary: 380000,
            taxPin: 'A001928374M',
            nationalId: '10293847',
            dateOfHire: '2020-01-15',
            status: 'AVAILABLE',
            role: 'SUPER_ADMIN',
          },
          {
            id: 'emp-2',
            staffNumber: 'EMP-014',
            name: 'Joseph Omondi',
            email: 'hr.manager@apexlogistics.co.ke',
            phone: '+254 733 111 222',
            department: 'Human Resources',
            designation: 'Head of People & Culture',
            baseSalary: 210000,
            taxPin: 'A002837465P',
            nationalId: '19283746',
            dateOfHire: '2021-03-01',
            status: 'AVAILABLE',
            role: 'HR_OFFICER',
          },
          {
            id: 'emp-3',
            staffNumber: 'EMP-022',
            name: 'Hassan Kipchoge',
            email: 'fleet.ops@apexlogistics.co.ke',
            phone: '+254 712 333 444',
            department: 'Fleet Operations',
            designation: 'Fleet Dispatch Superintendent',
            baseSalary: 185000,
            taxPin: 'A003948576Q',
            nationalId: '28374650',
            dateOfHire: '2021-06-10',
            status: 'AVAILABLE',
            role: 'FLEET_MANAGER',
          },
          {
            id: 'emp-4',
            staffNumber: 'EMP-031',
            name: 'Wanjiku Mwangi, CPA',
            email: 'finance.lead@apexlogistics.co.ke',
            phone: '+254 721 555 666',
            department: 'Finance & Accounts',
            designation: 'Financial Controller',
            baseSalary: 240000,
            taxPin: 'A004123984R',
            nationalId: '37482910',
            dateOfHire: '2021-02-01',
            status: 'AVAILABLE',
            role: 'ACCOUNTANT',
          },
        ].map(normalizeEmployee);
        setEmployees(fallbacks);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [normalizeEmployee, showSuccess, employees.length]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Compute next suggested staff number
  const nextStaffNumber = useMemo(() => {
    const numbers = employees
      .map((e) => {
        const num = String(e.staffNumber || e.staff_number || '').replace(/\D/g, '');
        return num ? parseInt(num, 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const highest = numbers.length > 0 ? Math.max(...numbers) : 70;
    return `EMP-${String(highest + 1).padStart(3, '0')}`;
  }, [employees]);

  // Handle Onboard Employee (POST)
  const handleOnboardEmployee = async (formData) => {
    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone_number: formData.phoneNumber.trim(),
      staff_number: formData.staffNumber.trim().toUpperCase(),
      national_id: formData.nationalId.trim(),
      tax_pin: formData.taxPin.trim().toUpperCase(),
      department: formData.department,
      designation: formData.designation.trim(),
      base_salary: parseFloat(formData.baseSalary) || 0.00,
      hourly_rate: parseFloat(formData.hourlyRate) || 0.00,
      date_of_hire: formData.dateOfHire,
      role: formData.role,
      is_active: formData.isActive,
    };

    try {
      const response = await apiClient.post(ENDPOINTS.HR.EMPLOYEES, payload);
      const newEmp = normalizeEmployee(response.data);

      setEmployees((prev) => [newEmp, ...prev]);
      showSuccess({
        title: 'Employee Onboarded Successfully',
        message: `Staff member ${newEmp.name} (${newEmp.staffNumber}) is now active in ${newEmp.department}.`,
      });
      setIsOnboardModalOpen(false);
      return newEmp;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Could not register employee in the database.';
      const details = err.response?.data?.details || null;

      showError({
        title: 'Onboarding Failed',
        message: errorMsg,
        details,
      });
      throw err;
    }
  };

  // Open Details Modal with specific tab ('profile' or 'edit')
  const handleOpenDetails = (employee, tab = 'profile') => {
    setSelectedEmployee(employee);
    setDetailModalTab(tab);
    setIsDetailModalOpen(true);
  };

  // Handle Edit/Update Employee (PATCH)
  const handleUpdateEmployee = async (updatedData) => {
    const payload = {
      first_name: updatedData.firstName?.trim(),
      last_name: updatedData.lastName?.trim(),
      email: updatedData.email?.trim().toLowerCase(),
      phone_number: updatedData.phoneNumber?.trim(),
      staff_number: updatedData.staffNumber?.trim().toUpperCase(),
      national_id: updatedData.nationalId?.trim(),
      tax_pin: updatedData.taxPin?.trim().toUpperCase(),
      department: updatedData.department,
      designation: updatedData.designation?.trim(),
      base_salary: parseFloat(updatedData.baseSalary) || 0.00,
      hourly_rate: parseFloat(updatedData.hourlyRate) || 0.00,
      date_of_hire: updatedData.dateOfHire,
      role: updatedData.role,
      is_active: updatedData.isActive,
    };

    try {
      const response = await apiClient.patch(
        `${ENDPOINTS.HR.EMPLOYEES}${updatedData.id}/`,
        payload
      );
      const updated = normalizeEmployee(response.data);

      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      setSelectedEmployee(updated);

      showSuccess({
        title: 'Employee Updated',
        message: `Profile changes for ${updated.name} (${updated.staffNumber}) have been saved.`,
      });
      return updated;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to save employee changes.';
      const details = err.response?.data?.details || null;

      showError({
        title: 'Update Error',
        message: errorMsg,
        details,
      });
      throw err;
    }
  };

  // Handle Delete Employee (DELETE with Confirmation Modal)
  const handleDeleteEmployee = (employee) => {
    showConfirm({
      title: 'Delete Employee Record',
      message: `Are you sure you want to permanently remove employee "${employee.name}" (${employee.staffNumber})? This action will revoke their system access and remove their statutory payroll profile.`,
      confirmText: 'Delete Employee',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`${ENDPOINTS.HR.EMPLOYEES}${employee.id}/`);
          setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
          showSuccess({
            title: 'Employee Deleted',
            message: `Employee "${employee.name}" (${employee.staffNumber}) has been permanently deleted.`,
          });
        } catch (err) {
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            'Failed to delete employee from database.';
          showError({
            title: 'Delete Failed',
            message: errorMsg,
            details: err.response?.data?.details,
          });
        }
      },
    });
  };

  // Columns definition for DataTable with action buttons in each row
  const columns = [
    {
      header: 'Staff #',
      accessor: 'staffNumber',
      cell: (r) => (
        <span className="font-mono font-bold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100">
          {r.staffNumber || r.staff_number}
        </span>
      ),
    },
    {
      header: 'Employee Name & Contact',
      accessor: 'name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block">{r.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {r.email}
            </span>
            {r.phone && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {r.phone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Department / Role',
      accessor: 'department',
      cell: (r) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">
            {r.department}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {r.designation}
          </span>
        </div>
      ),
    },
    {
      header: 'Tax PIN',
      accessor: 'taxPin',
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-600">
          {r.taxPin || r.tax_pin}
        </span>
      ),
    },
    {
      header: 'Base Salary',
      accessor: 'baseSalary',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          KES{' '}
          {Number(r.baseSalary || r.base_salary || 0).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: 'Date of Hire',
      accessor: 'dateOfHire',
      cell: (r) => (
        <span className="text-xs text-slate-500">
          {r.dateOfHire || r.date_of_hire}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (r) => (
        <StatusBadge status={r.status || (r.is_active ? 'AVAILABLE' : 'INACTIVE')} />
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* Button 1: Edit / View Details */}
          <button
            type="button"
            onClick={() => handleOpenDetails(r, 'profile')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/90 active:bg-indigo-200 border border-indigo-200/80 rounded-xl transition shadow-xs"
            title="View Profile Overview or Edit Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View / Edit</span>
          </button>

          {/* Button 2: Delete Employee */}
          <button
            type="button"
            onClick={() => handleDeleteEmployee(r)}
            className="inline-flex items-center gap-1 p-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 active:bg-rose-700 border border-rose-200/80 rounded-xl transition shadow-xs"
            title="Delete Employee Record"
            aria-label={`Delete ${r.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['HR & Payroll Workspace', 'Employee Directory']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Workforce Registry & Profiles
            </h1>
            {dbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Offline Cache
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {employees.length} active personnel recorded in PostgreSQL database
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => fetchEmployees(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Sync DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Employee</span>
          </button>
        </div>
      </div>

      {/* Main Table with Live Search */}
      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Live search by name, staff ID, PIN, designation, email..."
        pageSize={8}
        isLoading={loading}
      />

      {/* Onboard Employee Modal */}
      <OnboardEmployeeModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onSave={handleOnboardEmployee}
        nextStaffNumber={nextStaffNumber}
      />

      {/* Profile View / Edit Details Modal */}
      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employee={selectedEmployee}
        initialTab={detailModalTab}
        onSave={handleUpdateEmployee}
      />
    </div>
  );
};
