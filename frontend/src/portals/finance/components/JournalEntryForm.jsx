import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { useAuth } from '../../../hooks/useAuth';

export const JournalEntryForm = ({ isOpen, onClose, onSave, accounts = [] }) => {
  const { user } = useAuth();
  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [referenceType, setReferenceType] = useState('MANUAL_JOURNAL');
  const [lines, setLines] = useState([
    { accountCode: '1000', debit: '', credit: '' },
    { accountCode: '1200', debit: '', credit: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntryDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setReferenceType('MANUAL_JOURNAL');
      const defaultAcc1 = accounts[0]?.account_code || '1000';
      const defaultAcc2 = accounts[1]?.account_code || '1200';
      setLines([
        { accountCode: defaultAcc1, debit: '', credit: '' },
        { accountCode: defaultAcc2, debit: '', credit: '' },
      ]);
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const addLine = () => {
    const defaultAcc = accounts[0]?.account_code || '1000';
    setLines([...lines, { accountCode: defaultAcc, debit: '', credit: '' }]);
  };

  const removeLine = (idx) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    // Auto-zero the opposing field if an amount is entered
    if (field === 'debit' && Number(value) > 0) updated[idx].credit = '';
    if (field === 'credit' && Number(value) > 0) updated[idx].debit = '';
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!description.trim()) {
      setServerError('Journal transaction description is required.');
      return;
    }

    if (!isBalanced) {
      setServerError('Double-entry invariant violated: Total Debits must equal Total Credits before posting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        entry_date: entryDate,
        description: description.trim(),
        reference_type: referenceType,
        lines: lines.map((l) => ({
          account_code: l.accountCode,
          debit: parseFloat(l.debit || 0),
          credit: parseFloat(l.credit || 0),
        })),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to post journal entry:', err);
      const msg =
        err.response?.data?.balance ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to post journal entry to General Ledger.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Post General Ledger Journal</h2>
            <p className="text-xs text-slate-500">
              Double-entry invariant: Total Debits must strictly equal Total Credits
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Operating Tenant Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Apex Logistics"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">{currentTenant.company_name}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Subdomain: {currentTenant.subdomain}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Tenant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DatePicker
              label="Transaction Date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reference Classification
              </label>
              <select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 pl-3 pr-8 py-2.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MANUAL_JOURNAL">Manual Adjustment Journal</option>
                <option value="TRIP_INVOICE">Freight Transit Billing</option>
                <option value="INVOICE_PAYMENT">Customer Remittance Settlement</option>
                <option value="FUEL_EXPENSE">Bulk Diesel Procurement</option>
                <option value="PAYROLL_RUN">Driver Payroll Disbursement</option>
              </select>
            </div>
          </div>

          <div>
            <ControlledInput
              label="Journal Description / Memorandum"
              required
              placeholder="e.g. Month-end depreciation for commercial prime mover fleet"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Journal Debit & Credit Lines
              </span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <select
                    value={line.accountCode}
                    onChange={(e) => updateLine(idx, 'accountCode', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {accounts.length > 0 ? (
                      accounts.map((acc) => (
                        <option key={acc.account_code || acc.code} value={acc.account_code || acc.code}>
                          [{acc.account_code || acc.code}] {acc.name} ({acc.account_type || acc.type})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1000">[1000] Cash & Bank - KCB Operating</option>
                        <option value="1200">[1200] Accounts Receivable - Freight Clients</option>
                        <option value="1500">[1500] Commercial Fleet Assets</option>
                        <option value="2000">[2000] Accounts Payable - Suppliers</option>
                        <option value="2200">[2200] VAT Output Tax Payable (16%)</option>
                        <option value="3000">[3000] Shareholders Paid-in Capital</option>
                        <option value="3500">[3500] Retained Operational Earnings</option>
                        <option value="4100">[4100] Freight Revenue - Long Haul Transit</option>
                        <option value="5100">[5100] Diesel Fuel Expense</option>
                        <option value="5200">[5200] Driver Mileage & Per-Diem Expense</option>
                      </>
                    )}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit (DR)"
                    value={line.debit}
                    onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono font-bold text-right border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Credit (CR)"
                    value={line.credit}
                    onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono font-bold text-right border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 2}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition"
                    title="Remove Line"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Invariant Indicator Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isBalanced ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {isBalanced ? 'Journal Entry is In Balance' : 'Out of Balance! Cannot Post'}
                </span>
                <span className="text-[11px] opacity-80">
                  Total Debits: KES {totalDebit.toLocaleString('en-KE', { minimumFractionDigits: 2 })} • Total Credits: KES{' '}
                  {totalCredit.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold block opacity-70">Difference</span>
              <span className="text-sm font-mono font-black">
                KES {difference.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced || isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting to Ledger...' : 'Post to General Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
