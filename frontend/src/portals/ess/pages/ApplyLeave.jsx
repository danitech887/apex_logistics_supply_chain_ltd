import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { CalendarDays, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ApplyLeave = () => {
  const { showSuccess, showError } = useFeedback();

  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '2026-10-15',
    endDate: '2026-10-22',
    reason: 'Scheduled rest and family leave post cross-border transit rotation.',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Duration in days
  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return -1;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (durationDays <= 0) {
      setErrorMessage('Resumption date must be after or equal to the commencement date.');
      return;
    }

    if (!formData.reason.trim()) {
      setErrorMessage('Please provide a reason or note for HR review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.HR.LEAVES, {
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days_requested: durationDays,
        reason: formData.reason.trim(),
        status: 'PENDING',
      });

      setSubmitted(true);
      showSuccess({
        title: 'Application Dispatched',
        message: `Your ${formData.leaveType} leave application for ${durationDays} days has been submitted to HR.`,
      });
    } catch (err) {
      console.error('Leave submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit leave application.';
      setErrorMessage(msg);
      showError({
        title: 'Submission Error',
        message: msg,
        details: err.response?.data?.details,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'Apply for Leave']} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Request Leave & Fatigue Rest
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Direct digital submission to HR for fatigue compliance and statutory leave approval
        </p>
      </div>

      {submitted ? (
        <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-emerald-900">
            Leave Request Submitted to HR
          </h2>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Your application for {durationDays} calendar days has been registered in PostgreSQL and routed to Joseph Omondi (HR Manager). You will receive an instant notification upon review.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-5 py-2 text-xs font-bold text-emerald-800 bg-emerald-200/60 hover:bg-emerald-200 rounded-xl transition"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
        >
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Leave Balances Header */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-indigo-400 font-bold block uppercase text-[10px]">
                Available Annual Leave
              </span>
              <span className="font-black text-indigo-950 text-base">14 Days Remaining</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">
                Sick Leave Allowance
              </span>
              <span className="font-bold text-slate-700 text-sm">7 Days Remaining</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Leave Classification
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ANNUAL">Annual Leave (Paid)</option>
              <option value="SICK">Sick Leave (Medical certificate required)</option>
              <option value="COMPASSIONATE">Compassionate / Emergency</option>
              <option value="MATERNITY">Paternity / Maternity Leave</option>
              <option value="UNPAID">Unpaid Sabbatical</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Commencement Date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <DatePicker
              label="Resumption Date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          {/* Duration Indicator */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Calculated Duration:
            </span>
            {durationDays > 0 ? (
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {durationDays} Calendar {durationDays === 1 ? 'Day' : 'Days'}
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">Invalid date selection</span>
            )}
          </div>

          <ControlledInput
            label="Reason / Notes for HR"
            required
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || durationDays <= 0}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Leave Application'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
