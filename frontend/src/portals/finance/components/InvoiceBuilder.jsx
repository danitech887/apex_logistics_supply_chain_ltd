import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Receipt,
  Building,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Check,
  Hash,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { useAuth } from '../../../hooks/useAuth';

export const InvoiceBuilder = ({
  isOpen,
  onClose,
  onSave,
  existingInvoices = [],
}) => {
  const { user } = useAuth();
  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  // Helper to generate a new sequential invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    // Find highest invoice number in current series if available
    let highestSeq = 817;
    existingInvoices.forEach((inv) => {
      const match = (inv.invoice_number || '').match(/INV-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > highestSeq) highestSeq = seq;
      }
    });
    const nextSeq = String(highestSeq + 1).padStart(4, '0');
    return `INV-${year}-${nextSeq}`;
  };

  const [formData, setFormData] = useState({
    tenantId: '',
    invoiceNumber: '',
    clientName: '',
    clientPin: '',
    subtotal: '',
    issueDate: '',
    dueDate: '',
  });

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(30);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const issueStr = today.toISOString().split('T')[0];
      const due = new Date();
      due.setDate(today.getDate() + 30);
      const dueStr = due.toISOString().split('T')[0];

      setFormData({
        tenantId: currentTenant.id || '',
        invoiceNumber: generateInvoiceNumber(),
        clientName: '',
        clientPin: '',
        subtotal: '',
        issueDate: issueStr,
        dueDate: dueStr,
      });
      setPaymentTerms(30);
      setTouched({});
      setServerError('');
    }
  }, [isOpen, currentTenant.id]);

  // Handle Quick Terms Selection (Net 15, Net 30, Net 45, Net 60)
  const applyPaymentTerms = (days) => {
    setPaymentTerms(days);
    if (!formData.issueDate) return;
    const issue = new Date(formData.issueDate);
    const due = new Date(issue);
    due.setDate(issue.getDate() + days);
    setFormData((prev) => ({
      ...prev,
      dueDate: due.toISOString().split('T')[0],
    }));
  };

  // Live Calculations
  const subtotal = Number(formData.subtotal || 0);
  const vat = Math.round(subtotal * 0.16 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  // Comprehensive Validation Rules
  const errors = useMemo(() => {
    const errs = {};

    // 1. Tenant validation
    if (!formData.tenantId) {
      errs.tenant = 'Active corporate operating tenant is required.';
    }

    // 2. Invoice Number validation
    if (!formData.invoiceNumber.trim()) {
      errs.invoiceNumber = 'Invoice number is required.';
    } else if (formData.invoiceNumber.trim().length < 5) {
      errs.invoiceNumber = 'Invoice number must be at least 5 characters (e.g. INV-2026-0818).';
    } else if (
      existingInvoices.some(
        (i) =>
          (i.invoice_number || '').trim().toUpperCase() ===
          formData.invoiceNumber.trim().toUpperCase()
      )
    ) {
      errs.invoiceNumber = 'This invoice number already exists in the general ledger.';
    }

    // 3. Customer Name validation
    if (!formData.clientName.trim()) {
      errs.clientName = 'Corporate customer / shipper name is required.';
    } else if (formData.clientName.trim().length < 3) {
      errs.clientName = 'Customer name must be at least 3 characters.';
    }

    // 4. Customer KRA Tax PIN validation (11-character alphanumeric code)
    const pinClean = (formData.clientPin || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!pinClean) {
      errs.clientPin = 'Client KRA Tax PIN is required for tax invoice issuance.';
    } else if (pinClean.length !== 11) {
      errs.clientPin = `KRA PIN must be exactly 11 characters (${pinClean.length}/11 entered).`;
    }

    // 5. Freight Subtotal validation
    if (!formData.subtotal || isNaN(subtotal) || subtotal <= 0) {
      errs.subtotal = 'Freight tariff subtotal must be greater than KES 0.00.';
    }

    // 6. Dates validation
    if (!formData.issueDate) {
      errs.issueDate = 'Invoice issue date is required.';
    }
    if (!formData.dueDate) {
      errs.dueDate = 'Payment due date is required.';
    } else if (formData.issueDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.issueDate)) {
        errs.dueDate = 'Payment due date cannot precede the invoice issue date.';
      }
    }

    return errs;
  }, [formData, subtotal, existingInvoices]);

  const isValid = Object.keys(errors).length === 0;

  if (!isOpen) return null;

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Mark all fields touched
    const allTouched = {
      tenant: true,
      invoiceNumber: true,
      clientName: true,
      clientPin: true,
      subtotal: true,
      issueDate: true,
      dueDate: true,
    };
    setTouched(allTouched);

    if (!isValid) {
      setServerError('Please correct the validation errors highlighted below before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        tenant: formData.tenantId,
        invoice_number: formData.invoiceNumber.trim().toUpperCase(),
        client_name: formData.clientName.trim(),
        client_pin: formData.clientPin.replace(/[^A-Z0-9]/g, '').trim().toUpperCase(),
        subtotal: subtotal,
        tax_amount: vat,
        total_amount: total,
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        status: 'UNPAID',
      });
      onClose();
    } catch (err) {
      console.error('Invoice issuance failed:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.details?.detail ||
        err.message ||
        'Failed to issue freight invoice. Check customer details.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Issue Freight Tax Invoice</h2>
              <p className="text-xs text-slate-500">
                KRA 16% VAT Compliant Accounts Receivable & General Ledger Posting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-4 h-4" />
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

          {/* 1. Operating Tenant Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Operating Corporate Tenant <span className="text-rose-500">*</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                  <img
                    src="/logo.png"
                    alt="Apex Logistics"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {currentTenant.company_name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Subdomain: <span className="font-bold text-indigo-600">{currentTenant.subdomain}</span> • PIN: P051239840Z
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Tenant
              </span>
            </div>
            {touched.tenant && errors.tenant && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.tenant}</p>
            )}
          </div>

          {/* 2. Invoice Number & Auto-Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    invoiceNumber: generateInvoiceNumber(),
                  }));
                  markTouched('invoiceNumber');
                }}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Sequence Next #</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="invoiceNumber"
                required
                value={formData.invoiceNumber}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceNumber: e.target.value.toUpperCase() });
                  markTouched('invoiceNumber');
                }}
                onBlur={() => markTouched('invoiceNumber')}
                placeholder="e.g. INV-2026-0818"
                className={`block w-full rounded-xl border pl-10 pr-3.5 py-2.5 sm:text-sm font-mono font-bold transition ${
                  touched.invoiceNumber && errors.invoiceNumber
                    ? 'border-rose-300 text-rose-900 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white'
                }`}
              />
            </div>
            {touched.invoiceNumber && errors.invoiceNumber ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.invoiceNumber}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Sequential billing reference format: INV-YYYY-XXXX (custom series supported).
              </p>
            )}
          </div>

          {/* 3. Customer Name */}
          <div>
            <ControlledInput
              label="Corporate Customer / Shipper"
              required
              placeholder="e.g. Brookside Dairy Ltd, Unilever Kenya Ltd"
              value={formData.clientName}
              onChange={(e) => {
                setFormData({ ...formData, clientName: e.target.value });
                markTouched('clientName');
              }}
              error={touched.clientName ? errors.clientName : null}
            />
          </div>

          {/* 4. Customer KRA Tax PIN & Freight Tariff Subtotal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer Tax PIN <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, clientPin: 'P051199482X' }));
                    markTouched('clientPin');
                  }}
                  className="inline-flex items-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                  title="Use Sample KRA PIN (Brookside Dairy)"
                >
                  Use Sample PIN
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="clientPin"
                  maxLength={11}
                  placeholder="e.g. P051199482X"
                  value={formData.clientPin}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                    setFormData((prev) => ({ ...prev, clientPin: clean }));
                    if (clean.length === 11) {
                      markTouched('clientPin');
                    }
                  }}
                  onBlur={() => markTouched('clientPin')}
                  className={`block w-full rounded-xl border pl-10 pr-3.5 py-2.5 sm:text-sm font-mono font-bold uppercase transition ${
                    touched.clientPin && errors.clientPin
                      ? 'border-rose-300 text-rose-900 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white'
                  }`}
                />
              </div>
              {touched.clientPin && errors.clientPin ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.clientPin}</p>
              ) : formData.clientPin.length === 11 ? (
                <p className="mt-1 text-[11px] text-emerald-600 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {/^[A-Z][0-9]{9}[A-Z]$/.test(formData.clientPin)
                    ? 'Verified KRA Standard (1 Letter + 9 Digits + 1 Letter)'
                    : 'Valid 11-Character Tax PIN'}
                </p>
              ) : formData.clientPin.length > 0 ? (
                <p className="mt-1 text-[11px] text-slate-400 font-mono">
                  11 characters required ({formData.clientPin.length}/11)
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  11-character corporate tax identifier (e.g. P051199482X)
                </p>
              )}
            </div>

            <div>
              <CurrencyInput
                label="Freight Tariff Subtotal"
                required
                placeholder="0.00"
                value={formData.subtotal}
                onChange={(e) => {
                  setFormData({ ...formData, subtotal: e.target.value });
                  markTouched('subtotal');
                }}
              />
              {touched.subtotal && errors.subtotal && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.subtotal}</p>
              )}
            </div>
          </div>

          {/* 5. Dates & Payment Terms Quick Pick */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Terms & Due Dates
              </span>
              <div className="flex items-center space-x-1">
                {[15, 30, 45, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => applyPaymentTerms(days)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition ${
                      paymentTerms === days
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Net {days}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                label="Invoice Date"
                required
                value={formData.issueDate}
                onChange={(e) => {
                  setFormData({ ...formData, issueDate: e.target.value });
                  markTouched('issueDate');
                }}
                error={touched.issueDate ? errors.issueDate : null}
              />
              <DatePicker
                label="Payment Due Date"
                required
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ ...formData, dueDate: e.target.value });
                  markTouched('dueDate');
                }}
                error={touched.dueDate ? errors.dueDate : null}
              />
            </div>
          </div>

          {/* 6. Tax Calculation Breakdown Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Freight Service Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">
                KES {subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">16% KRA Output VAT:</span>
              <span className="font-mono font-bold text-slate-800">
                + KES {vat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-indigo-950">
              <span>Total Invoice Amount Due:</span>
              <span className="font-mono text-indigo-600 text-base">
                KES {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 7. Validation Compliance Status Banner */}
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isValid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-bold">
                {isValid
                  ? 'All KRA Tax Compliance & Tenant Validations Passed'
                  : 'Complete all required fields with valid KRA Tax PIN'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider opacity-75">
              {isValid ? 'Ready to Issue' : 'Incomplete'}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing Tax Invoice...' : 'Issue Tax Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
