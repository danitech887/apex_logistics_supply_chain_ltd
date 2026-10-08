import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Edit3,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Building,
  CreditCard,
  Hash,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { HelperMessage } from '../../../components/feedback/HelperMessage';

export const EmployeeDetailModal = ({
  isOpen,
  onClose,
  employee,
  initialTab = 'profile', // 'profile' | 'edit'
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (employee) {
      // Split name if first/last not explicitly present
      let firstName = employee.first_name || '';
      let lastName = employee.last_name || '';
      if (!firstName && !lastName && employee.name) {
        const parts = employee.name.trim().split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      setFormData({
        id: employee.id,
        firstName,
        lastName,
        email: employee.email || employee.user_details?.email || '',
        phoneNumber: employee.phone || employee.phone_number || employee.user_details?.phone_number || '',
        staffNumber: employee.staffNumber || employee.staff_number || '',
        nationalId: employee.nationalId || employee.national_id || '',
        taxPin: employee.taxPin || employee.tax_pin || '',
        department: employee.department || 'Transit Operations',
        designation: employee.designation || '',
        baseSalary: employee.baseSalary ?? employee.base_salary ?? '',
        hourlyRate: employee.hourlyRate ?? employee.hourly_rate ?? '0.00',
        dateOfHire: employee.dateOfHire || employee.date_of_hire || '',
        role: employee.role || (employee.roles && employee.roles[0]) || 'DRIVER',
        isActive: employee.is_active ?? (employee.status !== 'INACTIVE'),
      });
      setFormError(null);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First and Last names are mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (!formData.designation.trim()) {
      setFormError('Designation is required.');
      return;
    }
    if (!formData.baseSalary || Number(formData.baseSalary) <= 0) {
      setFormError('Please provide a valid base salary.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      setActiveTab('profile');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update employee details.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = (employee.name || employee.full_name || 'Staff')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formattedSalary = Number(employee.baseSalary || employee.base_salary || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scale-up">
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {employee.name || employee.full_name}
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700">
                  {employee.staffNumber || employee.staff_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {employee.designation} • {employee.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Header */}
        <div className="flex items-center space-x-1 px-6 bg-slate-100/70 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm rounded-t-xl -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'edit'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm rounded-t-xl -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Employee Details</span>
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="p-6 space-y-6 max-h-[calc(80vh-140px)] overflow-y-auto">
            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Employment Status:
                </span>
                <StatusBadge status={employee.status || (employee.is_active ? 'AVAILABLE' : 'INACTIVE')} />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  System Role:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {employee.role || (employee.roles && employee.roles[0]) || 'EMPLOYEE'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Switch to Edit</span>
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Contact Details */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Contact Information</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Corporate Email</span>
                    <span className="font-bold text-slate-800 break-all">
                      {employee.email || employee.user_details?.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Phone Contact</span>
                    <span className="font-bold text-slate-800">
                      {employee.phone || employee.phone_number || employee.user_details?.phone_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Identity & Statutory */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Statutory & Identity</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">National ID / Passport</span>
                    <span className="font-mono font-bold text-slate-800">
                      {employee.nationalId || employee.national_id || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">KRA Tax PIN</span>
                    <span className="font-mono font-bold text-indigo-600">
                      {employee.taxPin || employee.tax_pin || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Department & Assignment */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Department & Assignment</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Department</span>
                    <span className="font-bold text-slate-800">{employee.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Designation</span>
                    <span className="font-bold text-slate-800">{employee.designation}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Compensation & Terms */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Compensation & Tenure</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Base Salary (Gross Monthly)</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      KES {formattedSalary}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Date of Hire</span>
                    <span className="font-medium text-slate-700">
                      {employee.dateOfHire || employee.date_of_hire || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Form */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[calc(80vh-140px)] overflow-y-auto">
            {formError && (
              <HelperMessage
                type="error"
                title="Update Error"
                message={formError}
                onClose={() => setFormError(null)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={isSubmitting}
              />
              <ControlledInput
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="Corporate Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isSubmitting}
              />
              <ControlledInput
                label="Phone Contact"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="Staff ID"
                required
                value={formData.staffNumber}
                onChange={(e) => handleChange('staffNumber', e.target.value)}
                disabled={isSubmitting}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Human Resources">Human Resources & Payroll</option>
                  <option value="Fleet Operations">Fleet Operations</option>
                  <option value="Transit Operations">Transit Operations</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Workshop">Workshop & Maintenance</option>
                  <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                  <option value="Executive Administration">Executive Administration</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="Designation / Position"
                required
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                disabled={isSubmitting}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  System Role (RBAC)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HR_OFFICER">HR_OFFICER (HR & Payroll)</option>
                  <option value="DRIVER">DRIVER (Transit Operations & Trips)</option>
                  <option value="FLEET_MANAGER">FLEET_MANAGER (Fleet Ops)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Finance & Ledger)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="National ID"
                required
                value={formData.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                disabled={isSubmitting}
              />
              <ControlledInput
                label="KRA Tax PIN"
                required
                value={formData.taxPin}
                onChange={(e) => handleChange('taxPin', e.target.value.toUpperCase())}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <CurrencyInput
                  label="Base Salary (KES)"
                  required
                  value={formData.baseSalary}
                  onChange={(e) => handleChange('baseSalary', e.target.value)}
                  currency="KES"
                  disabled={isSubmitting}
                />
              </div>
              <div className="sm:col-span-1">
                <DatePicker
                  label="Date of Hire"
                  required
                  value={formData.dateOfHire}
                  onChange={(e) => handleChange('dateOfHire', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Active Status
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => handleChange('isActive', e.target.value === 'true')}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="true">Active / Available</option>
                  <option value="false">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition disabled:opacity-50 shadow-indigo-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
