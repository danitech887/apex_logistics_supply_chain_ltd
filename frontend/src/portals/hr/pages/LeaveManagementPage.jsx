import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { DataTable } from '../../../components/tables/DataTable';
import { RecordLeaveModal } from '../components/RecordLeaveModal';
import { RejectLeaveModal } from '../components/RejectLeaveModal';
import { LeaveDetailModal } from '../components/LeaveDetailModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  CalendarDays,
  Check,
  X,
  Eye,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Filter,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const LeaveManagementPage = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    on_leave_today: 0,
    total_approved_days: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [leaveToReject, setLeaveToReject] = useState(null);

  // Fetch leaves from PostgreSQL
  const fetchLeaves = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        let url = `${ENDPOINTS.HR.LEAVES}?`;
        if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
        if (typeFilter !== 'ALL') url += `leave_type=${typeFilter}&`;

        const [leavesRes, statsRes] = await Promise.all([
          apiClient.get(url),
          apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`),
        ]);

        const rawLeaves = leavesRes.data?.results || leavesRes.data || [];
        setLeaves(Array.isArray(rawLeaves) ? rawLeaves : []);

        if (statsRes.data) {
          setStats(statsRes.data);
        }

        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Database Synchronized',
            message: 'All leave applications and fatigue rest records reloaded from PostgreSQL.',
          });
        }
      } catch (err) {
        console.warn('Failed to load leaves from database:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest leave records from PostgreSQL.',
          });
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter, typeFilter, showSuccess, showError]
  );

  // Fetch active employees for the record leave modal
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.HR.EMPLOYEES);
      const raw = res.data?.results || res.data || [];
      if (Array.isArray(raw)) {
        setEmployees(raw);
      }
    } catch (err) {
      console.warn('Failed to load employees for leave modal:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Button Action: Record New Leave Request
  const handleRecordLeave = async (leavePayload) => {
    try {
      const res = await apiClient.post(ENDPOINTS.HR.LEAVES, leavePayload);
      const created = res.data;
      setLeaves((prev) => [created, ...prev]);

      // Refresh stats
      apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).then((r) => setStats(r.data));

      showSuccess({
        title: 'Leave Application Logged',
        message: `Recorded ${created.leave_type} leave (${created.days_requested} days) for staff member ${created.staff_number || ''}.`,
      });
    } catch (err) {
      showError({
        title: 'Submission Failed',
        message: err.response?.data?.message || err.message || 'Failed to submit leave request.',
        details: err.response?.data?.details,
      });
      throw err;
    }
  };

  // Button Action: Inline Quick Approve
  const handleApprove = (leaveId, staffNumber = '') => {
    showConfirm({
      title: 'Approve Leave Application',
      message: `Are you sure you want to approve this leave request? This will deduct from the employee's statutory balance and schedule fatigue cover.`,
      confirmText: 'Approve Leave',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: async () => {
        try {
          const res = await apiClient.post(`${ENDPOINTS.HR.LEAVES}${leaveId}/approve/`);
          const updated = res.data?.leave;

          setLeaves((prev) =>
            prev.map((l) => (l.id === leaveId ? { ...l, ...updated, status: 'APPROVED' } : l))
          );

          // Update stats
          apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).then((r) => setStats(r.data));

          showSuccess({
            title: 'Leave Approved',
            message: `Leave request for ${staffNumber || 'staff member'} has been officially authorized.`,
          });
        } catch (err) {
          showError({
            title: 'Approval Failed',
            message: err.response?.data?.message || err.message || 'Could not approve leave request.',
          });
        }
      },
    });
  };

  // Button Action: Confirm Rejection with Justification
  const handleConfirmReject = async (leaveId, reason) => {
    try {
      const res = await apiClient.post(`${ENDPOINTS.HR.LEAVES}${leaveId}/reject/`, {
        reason,
      });
      const updated = res.data?.leave;

      setLeaves((prev) =>
        prev.map((l) =>
          l.id === leaveId ? { ...l, ...updated, status: 'REJECTED', rejection_reason: reason } : l
        )
      );

      // Update stats
      apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).then((r) => setStats(r.data));

      showSuccess({
        title: 'Leave Application Rejected',
        message: `Leave request updated to Rejected with operational justification logged.`,
      });
    } catch (err) {
      showError({
        title: 'Rejection Failed',
        message: err.response?.data?.message || err.message || 'Could not reject leave request.',
      });
      throw err;
    }
  };

  // Button Action: Delete Leave Application
  const handleDeleteLeave = (leave) => {
    showConfirm({
      title: 'Delete Leave Record',
      message: `Are you sure you want to permanently delete the leave request for ${leave.employee_name || leave.staff_number}? This action cannot be reversed.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`${ENDPOINTS.HR.LEAVES}${leave.id}/`);
          setLeaves((prev) => prev.filter((l) => l.id !== leave.id));

          // Refresh stats
          apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).then((r) => setStats(r.data));

          showSuccess({
            title: 'Leave Record Removed',
            message: `The leave record has been removed from PostgreSQL.`,
          });
        } catch (err) {
          showError({
            title: 'Deletion Failed',
            message: err.response?.data?.message || err.message || 'Failed to delete leave record.',
          });
        }
      },
    });
  };

  // Button Action: Export CSV Summary
  const handleExportCSV = () => {
    if (!leaves || leaves.length === 0) {
      showError({ title: 'Export Notice', message: 'No leave applications available to export.' });
      return;
    }

    const headers = [
      'Staff Number',
      'Employee Name',
      'Department',
      'Designation',
      'Leave Type',
      'Commencement Date',
      'Resumption Date',
      'Days Requested',
      'Status',
      'Approved By',
      'Reason',
      'Rejection Reason',
    ];

    const rows = leaves.map((l) => [
      `"${l.staff_number || ''}"`,
      `"${l.employee_name || ''}"`,
      `"${l.department || ''}"`,
      `"${l.designation || ''}"`,
      `"${l.leave_type || ''}"`,
      `"${l.start_date || ''}"`,
      `"${l.end_date || ''}"`,
      l.days_requested || 0,
      `"${l.status || ''}"`,
      `"${l.approved_by_name || ''}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.rejection_reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Leave_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV register for ${leaves.length} workforce leave records.`,
    });
  };

  // Table columns definition
  const columns = [
    {
      header: 'Staff #',
      accessor: 'staff_number',
      cell: (r) => (
        <span className="font-mono font-bold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100">
          {r.staff_number}
        </span>
      ),
    },
    {
      header: 'Employee Name & Dept',
      accessor: 'employee_name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block">{r.employee_name}</span>
          <span className="text-[11px] text-slate-500 font-medium">
            {r.department} {r.designation ? `• ${r.designation}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Classification',
      accessor: 'leave_type',
      cell: (r) => {
        const typeColors = {
          ANNUAL: 'bg-blue-50 text-blue-700 border-blue-200',
          SICK: 'bg-amber-50 text-amber-700 border-amber-200',
          COMPASSIONATE: 'bg-purple-50 text-purple-700 border-purple-200',
          MATERNITY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          UNPAID: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        const color = typeColors[r.leave_type] || 'bg-slate-100 text-slate-700 border-slate-200';
        return (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${color}`}>
            {r.leave_type}
          </span>
        );
      },
    },
    {
      header: 'Schedule & Duration',
      accessor: 'days_requested',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs font-mono">
            {r.days_requested} {r.days_requested === 1 ? 'Day' : 'Days'}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            {r.start_date} → {r.end_date}
          </span>
        </div>
      ),
    },
    {
      header: 'Reason / Notes',
      accessor: 'reason',
      cell: (r) => (
        <span
          className="text-xs text-slate-600 block max-w-xs truncate"
          title={r.reason}
        >
          {r.reason}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* View Details */}
          <button
            type="button"
            onClick={() => {
              setSelectedLeave(r);
              setIsDetailModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
            title="View Application Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Quick Approve / Reject for Pending */}
          {r.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(r.id, r.staff_number)}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition shadow-2xs"
                title="Approve Leave"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveToReject(r);
                  setIsRejectModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition shadow-2xs"
                title="Reject Leave"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Delete Record */}
          <button
            type="button"
            onClick={() => handleDeleteLeave(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['HR & Statutory Payroll Workspace', 'Leave Approvals & Scheduling']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Workforce Leave Management & Approvals
            </h1>
            {dbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Offline Cache
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review driver fatigue recovery rest, statutory medical leaves, and annual time-off compliance
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync DB */}
          <button
            type="button"
            onClick={() => fetchLeaves(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'
              }`}
            />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Download CSV register"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Record Application */}
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Leave Application</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Applications
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 block mt-2">
            {stats.total}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Workforce requests logged in DB
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Pending HR Review
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-amber-600 block mt-2">
            {stats.pending}
          </span>
          <span className="text-xs text-amber-700/80 mt-1 block font-medium">
            {stats.pending > 0 ? 'Requires immediate supervisor action' : 'All requests resolved'}
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Approved Leaves
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-emerald-600 block mt-2">
            {stats.approved}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {stats.total_approved_days} cumulative authorized days
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Away Today
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 block mt-2">
            {stats.on_leave_today}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Personnel on current active schedule
          </span>
        </div>
      </div>

      {/* Filter Tabs & Classification Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Requests', count: stats.total },
            { id: 'PENDING', label: 'Pending Review', count: stats.pending, alert: stats.pending > 0 },
            { id: 'APPROVED', label: 'Approved', count: stats.approved },
            { id: 'REJECTED', label: 'Rejected', count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id
                    ? 'bg-indigo-700/80 text-white'
                    : tab.alert
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Classification Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="COMPASSIONATE">Compassionate</option>
            <option value="MATERNITY">Maternity / Paternity</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>
      </div>

      {/* Main Leave Requests Table */}
      <DataTable
        columns={columns}
        data={leaves}
        searchPlaceholder="Live filter by staff #, name, department, or reason..."
        pageSize={8}
        isLoading={loading}
      />

      {/* Record Leave Modal */}
      <RecordLeaveModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleRecordLeave}
        employees={employees}
      />

      {/* Reject Leave Modal */}
      <RejectLeaveModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setLeaveToReject(null);
        }}
        onConfirm={handleConfirmReject}
        leave={leaveToReject}
      />

      {/* Leave Details Modal */}
      <LeaveDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        onApprove={(id) => handleApprove(id, selectedLeave?.staff_number)}
        onOpenRejectModal={(l) => {
          setLeaveToReject(l);
          setIsRejectModalOpen(true);
        }}
      />
    </div>
  );
};
