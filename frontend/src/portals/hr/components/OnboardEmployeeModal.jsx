import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Shield,
  User,
  Briefcase,
  DollarSign,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { HelperMessage } from '../../../components/feedback/HelperMessage';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

export const OnboardEmployeeModal = ({ isOpen, onClose, onSave, nextStaffNumber = 'EMP-072' }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Apex@2026',
    phoneNumber: '',
    nationalId: '',
    taxPin: '',
    staffNumber: nextStaffNumber,
    department: 'Warehouse & Inventory Control',
    designation: '',
    role: 'WAREHOUSE_SUPERVISOR',
    baseSalary: '',
    hourlyRate: '0.00',
    dateOfHire: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-fetch next sequential staff number from PostgreSQL on open
  useEffect(() => {
    if (isOpen) {
      setCreatedCredentials(null);
      setFormError(null);
      setCopied(false);

      const fetchNextNum = async () => {
        try {
          const res = await apiClient.get(ENDPOINTS.HR.NEXT_STAFF_NUMBER);
          if (res.data?.next_staff_number) {
            setFormData((prev) => ({
              ...prev,
              staffNumber: res.data.next_staff_number,
            }));
          }
        } catch (err) {
          // Fall back to prop
          if (nextStaffNumber) {
            setFormData((prev) => ({ ...prev, staffNumber: nextStaffNumber }));
          }
        }
      };
      fetchNextNum();
    }
  }, [isOpen, nextStaffNumber]);

  if (!isOpen) return null;

  const handleDepartmentChange = (dept) => {
    let role = 'DRIVER';
    let defaultDesig = '';

    if (dept === 'Warehouse & Inventory Control') {
      role = 'WAREHOUSE_SUPERVISOR';
      defaultDesig = 'Warehouse Operations Supervisor';
    } else if (dept === 'Procurement & Vendor Management') {
      role = 'PROCUREMENT_OFFICER';
      defaultDesig = 'Procurement & Sourcing Lead';
    } else if (dept === 'Sales & Commercial CRM') {
      role = 'SALES_MANAGER';
      defaultDesig = 'Commercial Accounts Manager';
    } else if (dept === 'Client Logistics Consignee') {
      role = 'CLIENT';
      defaultDesig = 'Corporate Consignee Lead';
    } else if (dept === 'Fleet Operations') {
      role = 'FLEET_MANAGER';
      defaultDesig = 'Fleet Dispatch Superintendent';
    } else if (dept === 'Transit Operations (Drivers)') {
      role = 'DRIVER';
      defaultDesig = 'Heavy Commercial Freight Driver';
    } else if (dept === 'Finance & Accounts') {
      role = 'ACCOUNTANT';
      defaultDesig = 'Financial Accountant';
    } else if (dept === 'Human Resources') {
      role = 'HR_OFFICER';
      defaultDesig = 'HR & Payroll Specialist';
    } else if (dept === 'Executive Administration') {
      role = 'SUPER_ADMIN';
      defaultDesig = 'Executive Operations Director';
    }

    setFormData((prev) => ({
      ...prev,
      department: dept,
      role,
      designation: prev.designation || defaultDesig,
    }));
  };

  const handleSuggestEmail = () => {
    if (formData.firstName.trim() && formData.lastName.trim()) {
      const first = formData.firstName.trim().toLowerCase().charAt(0);
      const last = formData.lastName.trim().toLowerCase().replace(/\s+/g, '');
      const suggested = `${first}.${last}@apexlogistics.co.ke`;
      setFormData((prev) => ({ ...prev, email: suggested }));
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let gen = '';
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: `Apex@${gen}` }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First and Last names are mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Corporate email address is required.');
      return;
    }
    if (!formData.password.trim()) {
      setFormError('Initial login password is required for user account creation.');
      return;
    }
    if (!formData.nationalId.trim()) {
      setFormError('National ID number is required.');
      return;
    }
    if (!formData.taxPin.trim()) {
      setFormError('KRA Tax PIN is required for statutory payroll.');
      return;
    }
    if (!formData.designation.trim()) {
      setFormError('Designation / Job Title is required.');
      return;
    }
    if (!formData.baseSalary || Number(formData.baseSalary) <= 0) {
      setFormError('Please specify a positive baseline monthly salary.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onSave(formData);
      // Capture credentials for the confirmation view
      setCreatedCredentials({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        staffNumber: formData.staffNumber,
        department: formData.department,
        designation: formData.designation,
        role: formData.role,
      });
    } catch (err) {
      const errMsg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to onboard employee and create credentials.';
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Apex Enterprise Logistics - Employee Login Credentials\nStaff ID: ${createdCredentials.staffNumber}\nName: ${createdCredentials.name}\nDepartment: ${createdCredentials.department}\nCorporate Email: ${createdCredentials.email}\nInitial Password: ${createdCredentials.password}\nPortal Workspace: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !createdCredentials) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scale-up">
        {/* Header Strip */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {createdCredentials
                  ? 'Login Account & Employee Created'
                  : 'Onboard Employee & Provision Login Account'}
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                {createdCredentials
                  ? 'Credentials have been stored in PostgreSQL auth_core & hr_payroll'
                  : 'Automated sequential staff numbering & instant corporate login generation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Created: Show Confirmation Card with Credentials */}
        {createdCredentials ? (
          <div className="p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3.5">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-emerald-950">
                  Employee Onboarded & Login Account Provisioned!
                </h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  A real corporate login profile was generated in PostgreSQL. The employee can now sign into their dedicated departmental portal.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Apex Enterprise Credentials Slip
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  {createdCredentials.staffNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Full Name:</span>
                  <span className="font-bold text-white font-sans">{createdCredentials.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Department:</span>
                  <span className="font-bold text-white font-sans">{createdCredentials.department}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mt-2">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-bold block font-sans">
                    Corporate Email (Username):
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {createdCredentials.email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-bold block font-sans">
                    Initial Password:
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    {createdCredentials.password}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">
                    Assigned Portal Role:
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {createdCredentials.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Login Credentials</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Done & Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* Form for Onboarding */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
            {formError && (
              <HelperMessage
                type="error"
                title="Validation Notice"
                message={formError}
                onClose={() => setFormError(null)}
              />
            )}

            {/* Section 1: Staff Sequence & Department */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Staff Number & Department Assignment
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Staff ID / Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Auto-Sequenced
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.staffNumber}
                    onChange={(e) => handleChange('staffNumber', e.target.value.toUpperCase())}
                    placeholder="EMP-072"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Department Workspace <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Warehouse & Inventory Control">
                      Warehouse & Inventory Control (Stock/Weighbridge)
                    </option>
                    <option value="Procurement & Vendor Management">
                      Procurement & Vendor Management (LPO/Suppliers)
                    </option>
                    <option value="Sales & Commercial CRM">
                      Sales & Commercial CRM (Rate Cards/Shippers)
                    </option>
                    <option value="Client Logistics Consignee">
                      Client Logistics Consignee (Tracking/POD)
                    </option>
                    <option value="Fleet Operations">
                      Fleet Operations & Dispatch
                    </option>
                    <option value="Transit Operations (Drivers)">
                      Transit Operations (Heavy Commercial Drivers)
                    </option>
                    <option value="Finance & Accounts">
                      Finance & Accounts (General Ledger)
                    </option>
                    <option value="Human Resources">
                      Human Resources & Payroll
                    </option>
                    <option value="Executive Administration">
                      Executive Administration & RBAC
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ControlledInput
                  label="Designation / Job Title"
                  required
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  placeholder="e.g. Warehouse Operations Supervisor"
                  disabled={isSubmitting}
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Assigned Portal Role
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.role}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-100 text-indigo-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Personal Identity */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Personal Identity & Statutory Tax
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ControlledInput
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => {
                    handleChange('firstName', e.target.value);
                  }}
                  placeholder="e.g. Kevin"
                  disabled={isSubmitting}
                />
                <ControlledInput
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => {
                    handleChange('lastName', e.target.value);
                  }}
                  placeholder="e.g. Wafula"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <ControlledInput
                    label="Phone Number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    placeholder="+254 700 000 000"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <ControlledInput
                    label="National ID"
                    required
                    value={formData.nationalId}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    placeholder="12345678"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <ControlledInput
                    label="KRA Tax PIN"
                    required
                    value={formData.taxPin}
                    onChange={(e) => handleChange('taxPin', e.target.value.toUpperCase())}
                    placeholder="A012345678B"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Login Credentials Provisioning */}
            <div className="space-y-3 pt-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center space-x-2 text-indigo-900">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">
                    3. Corporate Login Account Creation
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  PostgreSQL User
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Corporate Email (Login Username) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestEmail}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Auto-Generate from Name
                    </button>
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. k.wafula@apexlogistics.co.ke"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Initial Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Generate Strong Password
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className="w-full px-3.5 pr-10 py-2.5 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    This password will be securely hashed with Argon2/PBKDF2 in the database.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Compensation & Date */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Baseline Compensation & Date of Hire
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <CurrencyInput
                    label="Base Salary (Monthly)"
                    required
                    value={formData.baseSalary}
                    onChange={(e) => handleChange('baseSalary', e.target.value)}
                    placeholder="65,000"
                    currency="KES"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="sm:col-span-1">
                  <CurrencyInput
                    label="Hourly Rate"
                    value={formData.hourlyRate}
                    onChange={(e) => handleChange('hourlyRate', e.target.value)}
                    placeholder="0.00"
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
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Employee & User Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
