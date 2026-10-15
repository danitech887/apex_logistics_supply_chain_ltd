import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { useFeedback } from '../../../context/FeedbackContext';
import { useAuth } from '../../../hooks/useAuth';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  CalendarDays,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Calendar,
  XCircle,
  UserCheck,
  History,
  FileText,
} from 'lucide-react';

export const ApplyLeave = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useFeedback();

  // State
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Default dates: next week
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStart = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const nextWeekEnd = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: nextWeekStart,
    endDate: nextWeekEnd,
    reason: 'Mandatory driver fatigue recovery rest post-corridor freight transit.',
  });

  // Fetch driver's leaves and statistics from PostgreSQL
  const fetchLeaveData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');

    try {
      const [leavesRes, statsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.HR.LEAVES).catch((e) => {
          console.warn('Leaves fetch error:', e);
          return { data: [] };
        }),
        apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).catch((e) => {
          console.warn('Stats fetch error:', e);
          return { data: null };
        }),
      ]);

      const items = Array.isArray(leavesRes.data)
        ? leavesRes.data
        : leavesRes.data?.results || [];

      // Sort by creation date descending
      const sorted = items.sort((a, b) => {
        return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
      });

      setLeaves(sorted);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load leave records:', err);
      setErrorMessage('Unable to retrieve leave history from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // Duration in calendar days
  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return -1;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  // Dynamic leave balances
  const leaveBalances = useMemo(() => {
    const totalApproved = stats?.total_approved_days || 0;
    const annualBalance = Math.max(0, 21 - totalApproved);
    const sickBalance = 14;
    return {
      annual: annualBalance,
      sick: sickBalance,
      pendingCount: stats?.pending || 0,
      approvedCount: stats?.approved || 0,
    };
  }, [stats]);

  // Quick Presets for Long-Haul Drivers
  const applyPreset = (type, days, label) => {
    const start = new Date();
    start.setDate(start.getDate() + 2); // 2 days in advance
    const end = new Date(start);
    end.setDate(end.getDate() + (days - 1));

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    setFormData({
      leaveType: type,
      startDate: sStr,
      endDate: eStr,
      reason: label,
    });
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (durationDays <= 0) {
      setErrorMessage('Resumption date must be on or after the commencement date.');
      return;
    }

    if (!formData.reason.trim()) {
      setErrorMessage('Please provide operational notes or reason for HR review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days_requested: durationDays,
        reason: formData.reason.trim(),
        status: 'PENDING',
      };

      const res = await apiClient.post(ENDPOINTS.HR.LEAVES, payload);
      setSuccessMessage(
        `Leave application for ${durationDays} calendar days (${formData.leaveType}) registered in PostgreSQL.`
      );

      // Prepend to list
      setLeaves((prev) => [res.data, ...prev]);

      // Reset form
      setFormData({
        leaveType: 'ANNUAL',
        startDate: nextWeekStart,
        endDate: nextWeekEnd,
        reason: 'Mandatory driver fatigue recovery rest post-corridor freight transit.',
      });

      if (showSuccess) {
        showSuccess({
          title: 'Application Dispatched',
          message: `Your ${formData.leaveType} leave application for ${durationDays} days has been submitted to HR.`,
        });
      }

      // Re-fetch stats to update balances
      fetchLeaveData(false);
    } catch (err) {
      console.error('Leave submission error:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.reason?.[0] ||
        err.response?.data?.end_date?.[0] ||
        err.message ||
        'Failed to submit leave application.';
      setErrorMessage(msg);
      if (showError) {
        showError({
          title: 'Submission Error',
          message: msg,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status, approver, rejectReason) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Approved</span>
            </span>
            {approver && (
              <span className="text-[9px] text-slate-400 mt-0.5">By {approver}</span>
            )}
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <XCircle className="w-3 h-3 text-rose-600" />
              <span>Rejected</span>
            </span>
            {rejectReason && (
              <span className="text-[9px] text-rose-500 mt-0.5 max-w-[160px] truncate" title={rejectReason}>
                {rejectReason}
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending HR</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumbs & Header Banner */}
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'Apply for Leave & Fatigue Rest']} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Request Leave & Driver Fatigue Rest
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                KeNHA / NTSA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct digital submission to HR for fatigue management, medical leave, and statutory rest approvals
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchLeaveData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs flex items-center space-x-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              title="Refresh leave applications from PostgreSQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL Live Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Leave Balance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Annual Vacation</span>
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-xl">
            {leaveBalances.annual} Days
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase block">
            Paid Statutory Leave
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Fatigue Safety</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-xl">
            48h Rest
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
            Post-Highway Compliance
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Medical Leave</span>
            <Zap className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-xl">
            {leaveBalances.sick} Days
          </div>
          <span className="text-[10px] font-bold text-rose-600 uppercase block">
            Sick Leave Allowance
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-xl">
            {leaveBalances.pendingCount}
          </div>
          <span className="text-[10px] font-bold text-amber-600 uppercase block">
            Awaiting HR Action
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leave Application Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Driver Fast Presets Bar */}
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Driver Fatigue Recovery Presets
              </span>
              <span className="text-[10px] font-mono text-slate-400">One-click auto-fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    'ANNUAL',
                    3,
                    'Mandatory driver fatigue recovery rest post Mombasa-Nairobi haulage run.'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/60 transition group cursor-pointer"
              >
                <span className="block text-xs font-bold text-white group-hover:text-indigo-300">
                  Post-Transit (3d)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Corridor Recovery</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset('COMPASSIONATE', 2, 'Weekend transit layover & rest.')
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/60 transition group cursor-pointer"
              >
                <span className="block text-xs font-bold text-white group-hover:text-indigo-300">
                  Layover (2d)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Weekend Rest</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset('ANNUAL', 7, 'Scheduled annual statutory vacation rotation.')
                }
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/60 transition group cursor-pointer"
              >
                <span className="block text-xs font-bold text-white group-hover:text-indigo-300">
                  Annual Rest (7d)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Vacation Rotation</span>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Leave Classification
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ANNUAL">Annual Leave / Fatigue Recovery (Paid)</option>
                <option value="SICK">Sick Leave (Medical certificate prescribed)</option>
                <option value="COMPASSIONATE">Compassionate / Family Emergency</option>
                <option value="MATERNITY">Paternity / Maternity Leave</option>
                <option value="UNPAID">Unpaid Sabbatical</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                label="Commencement Date"
                required
                value={formData.startDate}
                min={todayStr}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <DatePicker
                label="Resumption Date"
                required
                value={formData.endDate}
                min={formData.startDate || todayStr}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            {/* Calculated Duration Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Calculated Total Duration:</span>
              </span>
              {durationDays > 0 ? (
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/80">
                  {durationDays} Calendar {durationDays === 1 ? 'Day' : 'Days'}
                </span>
              ) : (
                <span className="text-rose-600 font-bold">Invalid date range</span>
              )}
            </div>

            <ControlledInput
              label="Operational Reason / Notes for HR"
              required
              placeholder="Provide reason for leave, destination, or corridor handover notes..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || durationDays <= 0}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting to HR Desk...' : 'Transmit Leave Application to HR'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: My Applications History (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                My Leave History & Status
              </h3>
              <p className="text-[11px] text-slate-500">
                Track approval workflow in PostgreSQL
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {leaves.length} Filed
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
              Loading leave records...
            </div>
          ) : leaves.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {leaves.map((leave) => {
                const sDate = leave.start_date
                  ? new Date(leave.start_date).toLocaleDateString('en-KE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '';
                const eDate = leave.end_date
                  ? new Date(leave.end_date).toLocaleDateString('en-KE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={leave.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {leave.leave_type} LEAVE
                      </span>
                      {getStatusBadge(leave.status, leave.approved_by_name, leave.rejection_reason)}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sDate}</span>
                        <span className="text-slate-400">➔</span>
                        <span>{eDate}</span>
                        <span className="text-indigo-600 ml-1">
                          ({leave.days_requested} {leave.days_requested === 1 ? 'day' : 'days'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {leave.reason}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Ref: {String(leave.id).substring(0, 8).toUpperCase()}</span>
                      <span>
                        {leave.created_at
                          ? new Date(leave.created_at).toLocaleDateString('en-KE', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No leave applications filed yet.</p>
              <p className="text-[11px] text-slate-400">
                Use the form on the left or select a preset to submit a request.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
