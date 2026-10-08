import React, { useState, useEffect, useMemo } from 'react';
import { DatePicker } from '../../../components/forms/DatePicker';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import {
  CalendarDays,
  X,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const RecordLeaveModal = ({ isOpen, onClose, onSave, employees = [] }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Set default initial dates when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
      setLeaveType('ANNUAL');
      setReason('');
      setFormError('');
      if (employees.length > 0 && !employeeId) {
        setEmployeeId(employees[0].id);
      }
    }
  }, [isOpen, employees]);

  // Calculate duration in days
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return -1;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!employeeId) {
      setFormError('Please select an employee for this leave request.');
      return;
    }

    if (!startDate || !endDate) {
      setFormError('Please specify both commencement and resumption dates.');
      return;
    }

    if (durationDays <= 0) {
      setFormError('Resumption date must be after or equal to the commencement date.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Please provide a justification or compliance note for HR records.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        employee: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days_requested: durationDays,
        reason: reason.trim(),
        status: 'PENDING',
      });
      onClose();
    } catch (err) {
      console.error('Failed to record leave:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Leave Application</h3>
              <p className="text-xs text-slate-500">
                Log workforce leave request or driver fatigue compliance rest
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Workforce Member <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    [{emp.staff_number}] {emp.first_name} {emp.last_name} • {emp.department || emp.designation || 'Staff'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leave Classification */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Leave Classification <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition"
            >
              <option value="ANNUAL">Annual Leave (Statutory 21 Days)</option>
              <option value="SICK">Sick Leave (Medical Certificate Attached)</option>
              <option value="COMPASSIONATE">Compassionate / Emergency Leave</option>
              <option value="MATERNITY">Maternity / Paternity Leave</option>
              <option value="UNPAID">Unpaid Sabbatical / Extended Leave</option>
            </select>
          </div>

          {/* Dates Selection */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Commencement Date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <DatePicker
              label="Resumption Date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Calculated Duration Display */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-indigo-900 font-medium">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Calculated Leave Duration:</span>
            </div>
            {durationDays > 0 ? (
              <span className="font-mono font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                {durationDays} Calendar {durationDays === 1 ? 'Day' : 'Days'}
              </span>
            ) : (
              <span className="text-rose-600 font-bold">Invalid Date Range</span>
            )}
          </div>

          {/* Application Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason / Compliance Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Mandatory driver rest following Mombasa-Kigali transit run; or scheduled personal leave."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition placeholder:text-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
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
              disabled={isSubmitting || durationDays <= 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
