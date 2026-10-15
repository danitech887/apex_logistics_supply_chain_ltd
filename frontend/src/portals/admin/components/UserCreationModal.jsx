import React, { useState } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  X,
  UserPlus,
  Shield,
  Key,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Building,
  UserCheck,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';

export const UserCreationModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'HR_OFFICER',
    department: 'Human Resources',
    designation: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Please provide first name, last name, and corporate email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        role: formData.role,
        department: formData.department,
        designation: formData.designation.trim() || `${formData.department} Officer`,
        password: formData.password.trim() || 'password123',
      };

      const res = await apiClient.post(ENDPOINTS.AUTH.ADMIN_USERS, payload);
      setCreatedResult(res.data);
      if (onUserCreated) {
        onUserCreated(res.data.user);
      }
    } catch (err) {
      console.error('User provisioning failed:', err);
      setError(err.response?.data?.error || 'Failed to provision enterprise account in database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult?.user) return;
    const credText = `APEX LOGISTICS & SUPPLY CHAIN LTD - CORPORATE CREDENTIALS
Tenant Subdomain: apex-hq
Full Name: ${createdResult.user.full_name}
Staff Number: ${createdResult.user.staff_number}
Corporate Email: ${createdResult.user.email}
Assigned Role: ${createdResult.user.role}
Department: ${createdResult.user.department}
Password: ${createdResult.user.temporary_password}
Portal URL: http://localhost:5173/`;

    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setCreatedResult(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'HR_OFFICER',
      department: 'Human Resources',
      designation: '',
      password: '',
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Provision Enterprise User</h2>
              <p className="text-xs text-slate-500">
                Atomically generates PostgreSQL user account and sequential employee profile
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Post-Creation Success Card */}
        {createdResult?.user ? (
          <div className="mt-5 space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <h4 className="font-extrabold text-sm">Account Successfully Provisioned in Database!</h4>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1.5 font-mono text-xs text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Staff Number:</span>
                  <span className="font-bold text-indigo-600">{createdResult.user.staff_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold">{createdResult.user.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Corporate Email:</span>
                  <span className="font-bold">{createdResult.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Role & Department:</span>
                  <span className="font-bold">{createdResult.user.role} ({createdResult.user.department})</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Initial Password:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {createdResult.user.temporary_password}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <ControlledInput
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Kevin"
              />
              <ControlledInput
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Maina"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ControlledInput
                label="Corporate Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="k.maina@apexlogistics.co.ke"
              />
              <ControlledInput
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Executive Administration">Executive Administration</option>
                  <option value="Human Resources">Human Resources & Payroll</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Fleet Operations">Fleet Operations & Dispatch</option>
                  <option value="Transit Operations">Transit Operations</option>
                  <option value="Warehouse & Inventory Control">Warehouse & Inventory Control</option>
                  <option value="Procurement & Vendor Management">Procurement & Vendor Management</option>
                  <option value="Sales & Business Development">Sales & Business Development</option>
                  <option value="Unilever Kenya Logistics Desk">Unilever Kenya Logistics Desk</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned RBAC Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Full Access)</option>
                  <option value="HR_OFFICER">HR_OFFICER (HR & Payroll)</option>
                  <option value="FLEET_MANAGER">FLEET_MANAGER (Dispatch & Maintenance)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Finance & Ledger)</option>
                  <option value="DRIVER">DRIVER (Driver Self-Service & Trips)</option>
                  <option value="WAREHOUSE_SUPERVISOR">WAREHOUSE_SUPERVISOR (Warehouse & Weighbridge)</option>
                  <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER (LPO & Sourcing)</option>
                  <option value="SALES_MANAGER">SALES_MANAGER (Commercial CRM & Rates)</option>
                  <option value="CLIENT">CLIENT (External B2B Consignee)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Initial Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Secure</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank for universal default: password123"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{loading ? 'Provisioning...' : 'Provision Enterprise Account'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
