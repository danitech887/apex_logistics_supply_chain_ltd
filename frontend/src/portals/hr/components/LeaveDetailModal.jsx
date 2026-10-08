import React from 'react';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import {
  X,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Phone,
  Briefcase,
  AlertCircle,
  Building,
} from 'lucide-react';

export const LeaveDetailModal = ({
  isOpen,
  onClose,
  leave,
  onApprove,
  onOpenRejectModal,
}) => {
  if (!isOpen || !leave) return null;

  const isPending = leave.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Leave Application Details</h3>
                <StatusBadge status={leave.status} />
              </div>
              <p className="text-xs text-slate-500">
                Application ID: <span className="font-mono">{leave.id?.slice(0, 8)}...</span>
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Employee Information Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                {leave.employee_name
                  ? leave.employee_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'EM'}
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {leave.employee_name || 'Staff Member'}
                </span>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center">
                    <Building className="w-3 h-3 mr-1 text-slate-400" />
                    {leave.department || 'Operations'}
                  </span>
                  {leave.designation && (
                    <span>• {leave.designation}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100 block">
                {leave.staff_number}
              </span>
              {leave.phone_number && (
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  {leave.phone_number}
                </span>
              )}
            </div>
          </div>

          {/* Schedule & Duration Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 block font-medium text-[11px] uppercase tracking-wider">
                Leave Classification
              </span>
              <span className="font-bold text-slate-900 text-sm mt-1 block">
                {leave.leave_type} LEAVE
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 block font-medium text-[11px] uppercase tracking-wider">
                Duration
              </span>
              <span className="font-black font-mono text-indigo-600 text-sm mt-1 block">
                {leave.days_requested} Calendar Days
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 block font-medium text-[11px] uppercase tracking-wider">
                Commencement Date
              </span>
              <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">
                {leave.start_date}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-slate-400 block font-medium text-[11px] uppercase tracking-wider">
                Resumption Date
              </span>
              <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">
                {leave.end_date}
              </span>
            </div>
          </div>

          {/* Justification / Notes */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Application Justification & Notes
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
              "{leave.reason}"
            </div>
          </div>

          {/* Audit Trail & Review Resolution */}
          <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Approval Audit Trail
            </span>
            <div className="flex justify-between items-center text-slate-600">
              <span>Date Submitted:</span>
              <span className="font-mono font-medium text-slate-800">
                {leave.created_at ? new Date(leave.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            {leave.approved_by_name && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Reviewed By:</span>
                <span className="font-bold text-slate-800">{leave.approved_by_name}</span>
              </div>
            )}
            {leave.rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mt-2">
                <span className="font-bold block mb-0.5">Rejection Reason:</span>
                <span>{leave.rejection_reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Close
          </button>

          {isPending ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRejectModal(leave);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(leave.id);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Leave</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Resolution Finalized</span>
          )}
        </div>
      </div>
    </div>
  );
};
