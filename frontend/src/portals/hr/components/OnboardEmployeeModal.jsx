import React, { useState } from 'react';
import { X, UserPlus, Shield, User, Briefcase, DollarSign, AlertCircle } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { HelperMessage } from '../../../components/feedback/HelperMessage';

export const OnboardEmployeeModal = ({ isOpen, onClose, onSave, nextStaffNumber = 'EMP-071' }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    taxPin: '',
    staffNumber: nextStaffNumber,
    department: 'Human Resources',
    designation: '',
    role: 'HR_OFFICER',
    baseSalary: '',
    hourlyRate: '0.00',
    dateOfHire: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First and Last names are mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('A valid corporate email address is required.');
      return;
    }
    if (!formData.staffNumber.trim()) {
      setFormError('Staff number is required.');
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
      await onSave(formData);
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to onboard employee.';
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
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
                Onboard New Employee
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                Register workforce profile, assign statutory tax PIN & provision portal RBAC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {formError && (
            <HelperMessage
              type="error"
              title="Validation Notice"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          {/* Section 1: Personal & Identity */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Personal Details & Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="e.g. Catherine"
                disabled={isSubmitting}
              />
              <ControlledInput
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="e.g. Njeri"
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
                placeholder="c.njeri@apexlogistics.co.ke"
                disabled={isSubmitting}
              />
              <ControlledInput
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+254 722 000 111"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="National ID / Passport"
                required
                value={formData.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                placeholder="e.g. 10293847"
                disabled={isSubmitting}
              />
              <ControlledInput
                label="KRA Tax PIN"
                required
                value={formData.taxPin}
                onChange={(e) => handleChange('taxPin', e.target.value.toUpperCase())}
                placeholder="e.g. A001928374M"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 2: Department & Designation */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Department, Designation & System Access
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ControlledInput
                label="Staff ID / Number"
                required
                value={formData.staffNumber}
                onChange={(e) => handleChange('staffNumber', e.target.value.toUpperCase())}
                placeholder="EMP-071"
                disabled={isSubmitting}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Department <span className="text-rose-500">*</span>
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
                label="Designation / Job Title"
                required
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="e.g. Commercial Freight Driver"
                disabled={isSubmitting}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  System Role (Portal RBAC) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HR_OFFICER">HR_OFFICER (HR & Payroll Portal)</option>
                  <option value="DRIVER">DRIVER (Employee Self-Service / Trips)</option>
                  <option value="FLEET_MANAGER">FLEET_MANAGER (Fleet Operations)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Finance & General Ledger)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Administration)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Compensation & Date */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Compensation & Contract Date
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <CurrencyInput
                  label="Base Salary (Monthly)"
                  required
                  value={formData.baseSalary}
                  onChange={(e) => handleChange('baseSalary', e.target.value)}
                  placeholder="55,000"
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
          <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition disabled:opacity-50 shadow-indigo-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Onboarding Employee...' : 'Confirm & Register Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
