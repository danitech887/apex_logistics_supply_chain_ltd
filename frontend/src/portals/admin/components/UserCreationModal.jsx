import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';

export const UserCreationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'HR_OFFICER',
    department: 'Human Resources',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provision Enterprise User</h2>
              <p className="text-xs text-slate-500">Create staff credential with tenant RBAC roles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ControlledInput
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Samuel"
            />
            <ControlledInput
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Kiprono"
            />
          </div>

          <ControlledInput
            label="Corporate Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="s.kiprono@apexlogistics.co.ke"
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Human Resources">Human Resources & Payroll</option>
              <option value="Fleet Operations">Fleet Operations & Workshop</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Warehouse & Logistics">Warehouse & Ambient Hubs</option>
              <option value="Executive Management">Executive Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Assigned Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Full Access)</option>
              <option value="HR_OFFICER">HR_OFFICER (HR & Payroll)</option>
              <option value="FLEET_MANAGER">FLEET_MANAGER (Dispatch & Maintenance)</option>
              <option value="ACCOUNTANT">ACCOUNTANT (Finance & Ledger)</option>
              <option value="DRIVER">DRIVER (Employee Self-Service / Trips)</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
            >
              Provision Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
