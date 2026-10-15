import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { DataTable } from '../../../components/tables/DataTable';
import { PayslipViewer } from '../components/PayslipViewer';
import { NewPayRunModal } from '../components/NewPayRunModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  FileSpreadsheet,
  Play,
  CheckCircle,
  Eye,
  RefreshCw,
  Plus,
  Calendar,
  Lock,
  Download,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Database,
} from 'lucide-react';

export const PayrollRunPage = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();

  const [payrollRuns, setPayrollRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Modals state
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);

  // Load payslips for a given run ID
  const loadPayslips = useCallback(async (runId) => {
    if (!runId) return;
    try {
      const res = await apiClient.get(`${ENDPOINTS.HR.PAYSLIPS}?payroll_run=${runId}`);
      const raw = res.data?.results || res.data || [];
      setPayslips(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.warn('Failed to fetch payslips from DB:', err);
    }
  }, []);

  // Fetch all payroll runs from PostgreSQL
  const fetchPayrollRuns = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await apiClient.get(ENDPOINTS.HR.PAYROLL_RUNS);
      const runs = res.data?.results || res.data || [];

      if (Array.isArray(runs) && runs.length > 0) {
        setPayrollRuns(runs);
        setDbConnected(true);

        // Keep current active run or default to latest
        setActiveRun((prev) => {
          const match = prev ? runs.find((r) => r.id === prev.id) : null;
          return match || runs[0];
        });
      } else {
        // If no runs exist in DB, create initial default cycle
        const newRunRes = await apiClient.post(ENDPOINTS.HR.PAYROLL_RUNS, {
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          run_date: '2026-10-08',
          status: 'APPROVED',
        });
        const created = newRunRes.data;
        setPayrollRuns([created]);
        setActiveRun(created);
        setDbConnected(true);
      }

      if (isManual) {
        showSuccess({
          title: 'Database Synchronized',
          message: 'Latest pay runs and statutory computations reloaded from PostgreSQL.',
        });
      }
    } catch (err) {
      console.warn('Error loading payroll runs:', err);
      setDbConnected(false);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showSuccess]);

  // Initial load
  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  // When active run changes, load its payslips
  useEffect(() => {
    if (activeRun?.id) {
      loadPayslips(activeRun.id);
    }
  }, [activeRun?.id, loadPayslips]);

  // Dynamic calculations across loaded payslips
  const summaryMetrics = useMemo(() => {
    if (!payslips || payslips.length === 0) {
      return {
        gross: activeRun?.total_gross || 0,
        net: activeRun?.total_net || 0,
        statutory: Math.max(0, (activeRun?.total_gross || 0) - (activeRun?.total_net || 0)),
        count: activeRun?.payslips_count || 0,
      };
    }

    const totalGross = payslips.reduce(
      (sum, p) => sum + (Number(p.base_pay || 0) + Number(p.allowances || 0)),
      0
    );
    const totalStatutory = payslips.reduce(
      (sum, p) => sum + (Number(p.deductions_tax || 0) + Number(p.deductions_statutory || 0)),
      0
    );
    const totalNet = payslips.reduce((sum, p) => sum + Number(p.net_pay || 0), 0);

    return {
      gross: totalGross,
      statutory: totalStatutory,
      net: totalNet,
      count: payslips.length,
    };
  }, [payslips, activeRun]);

  // Button Action: Recalculate / Execute Pay Run
  const handleExecuteRun = async () => {
    if (!activeRun) return;
    setIsRecalculating(true);
    try {
      const response = await apiClient.post(
        `${ENDPOINTS.HR.PAYROLL_RUNS}${activeRun.id}/execute/`
      );
      const updatedRun = response.data?.payroll_run || activeRun;

      // Reload updated run & payslips
      await loadPayslips(activeRun.id);
      setActiveRun((prev) => ({
        ...prev,
        ...updatedRun,
        status: 'APPROVED',
      }));
      setPayrollRuns((prev) =>
        prev.map((r) => (r.id === activeRun.id ? { ...r, ...updatedRun, status: 'APPROVED' } : r))
      );

      const netFormatted = Number(response.data?.batch_results?.total_net || summaryMetrics.net).toLocaleString(
        'en-KE',
        { minimumFractionDigits: 2 }
      );

      showSuccess({
        title: 'Pay Run Recomputed',
        message: `KRA PAYE, NSSF, SHA, and Housing Levy recalculated for all active staff. Total Net: KES ${netFormatted}.`,
      });
    } catch (err) {
      showError({
        title: 'Calculation Error',
        message: err.response?.data?.message || err.message || 'Failed to execute payroll run batch.',
        details: err.response?.data?.details,
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  // Button Action: Disburse & Authorize Run
  const handleAuthorizeDisbursement = () => {
    if (!activeRun) return;
    showConfirm({
      title: 'Authorize Bank Disbursement',
      message: `Are you sure you want to approve and lock the ${activeRun.period_start} to ${activeRun.period_end} pay run? Total bank transmission: KES ${summaryMetrics.net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}.`,
      confirmText: 'Disburse Batch',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await apiClient.patch(
            `${ENDPOINTS.HR.PAYROLL_RUNS}${activeRun.id}/`,
            { status: 'DISBURSED' }
          );
          const updated = res.data;
          setActiveRun((prev) => ({ ...prev, status: 'DISBURSED' }));
          setPayrollRuns((prev) =>
            prev.map((r) => (r.id === activeRun.id ? { ...r, status: 'DISBURSED' } : r))
          );
          showSuccess({
            title: 'Batch Disbursed',
            message: 'Pay run has been locked and authorized for bank wire disbursement.',
          });
        } catch (err) {
          showError({
            title: 'Disbursement Error',
            message: err.response?.data?.message || err.message || 'Failed to update pay run status.',
          });
        }
      },
    });
  };

  // Button Action: Create New Pay Run Cycle
  const handleCreateNewCycle = async (formData) => {
    try {
      const res = await apiClient.post(ENDPOINTS.HR.PAYROLL_RUNS, formData);
      const newRun = res.data;
      setPayrollRuns((prev) => [newRun, ...prev]);
      setActiveRun(newRun);
      await loadPayslips(newRun.id);

      showSuccess({
        title: 'New Cycle Initialized',
        message: `Pay run cycle (${newRun.period_start} to ${newRun.period_end}) created with automated statutory computation.`,
      });
    } catch (err) {
      showError({
        title: 'Cycle Creation Failed',
        message: err.response?.data?.message || err.message || 'Could not create pay run.',
        details: err.response?.data?.details,
      });
      throw err;
    }
  };

  // Button Action: Export CSV Summary
  const handleExportCSV = () => {
    if (!payslips || payslips.length === 0) {
      showError({ title: 'Export Notice', message: 'No payslip records available to export.' });
      return;
    }

    const headers = [
      'Staff Number',
      'Employee Name',
      'Department',
      'Base Salary (KES)',
      'Allowances (KES)',
      'Gross Pay (KES)',
      'PAYE Tax (KES)',
      'NSSF (KES)',
      'Housing Levy (KES)',
      'SHA Health (KES)',
      'Total Statutory (KES)',
      'Net Pay (KES)',
    ];

    const rows = payslips.map((p) => {
      const b = p.calculation_breakdown || {};
      const gross = Number(p.base_pay || 0) + Number(p.allowances || 0);
      return [
        `"${p.staff_number || ''}"`,
        `"${p.employee_name || ''}"`,
        `"${p.department || ''}"`,
        Number(p.base_pay || 0).toFixed(2),
        Number(p.allowances || 0).toFixed(2),
        gross.toFixed(2),
        Number(p.deductions_tax || b.net_paye || 0).toFixed(2),
        Number(b.total_nssf || 0).toFixed(2),
        Number(b.housing_levy || 0).toFixed(2),
        Number(b.sha || 0).toFixed(2),
        (Number(p.deductions_tax || 0) + Number(p.deductions_statutory || 0)).toFixed(2),
        Number(p.net_pay || 0).toFixed(2),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Apex_Payroll_Batch_${activeRun?.period_start || 'Cycle'}_${activeRun?.period_end || 'End'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV summary for ${payslips.length} workforce payslips.`,
    });
  };

  // DataTable Columns definition
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
      header: 'Employee Name & Department',
      accessor: 'employee_name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block">{r.employee_name}</span>
          <span className="text-[11px] text-slate-500 font-medium">{r.department}</span>
        </div>
      ),
    },
    {
      header: 'Base Salary',
      accessor: 'base_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-semibold text-slate-700 text-xs">
          KES {Number(r.base_pay || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Allowances (Mileage)',
      accessor: 'allowances',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-emerald-600 font-semibold text-xs">
          + KES {Number(r.allowances || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Statutory (KRA/NSSF/SHA)',
      accessor: 'deductions_statutory',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-rose-600 font-semibold text-xs">
          - KES {(Number(r.deductions_tax || 0) + Number(r.deductions_statutory || 0)).toLocaleString(
            'en-KE',
            { minimumFractionDigits: 2 }
          )}
        </span>
      ),
    },
    {
      header: 'Net Take-Home Pay',
      accessor: 'net_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-black text-slate-900 text-xs bg-slate-100/80 px-2 py-0.5 rounded-md">
          KES {Number(r.net_pay || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <button
          type="button"
          onClick={() => {
            setSelectedPayslip(r);
            setIsViewerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:bg-indigo-200 text-xs font-bold rounded-xl border border-indigo-200/70 transition shadow-xs"
          title="View Official Statutory Payslip"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Slip</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['HR & Payroll Workspace', 'Payroll Pay Runs']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Monthly Pay Run & Statutory Engine
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
            Automated statutory tax deduction pipeline (PAYE, SHA, NSSF Tier I/II, Housing Levy)
          </p>
        </div>

        {/* Global Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button: Refresh Database */}
          <button
            type="button"
            onClick={() => fetchPayrollRuns(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'
              }`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Sync DB'}</span>
          </button>

          {/* Button: Export Summary */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Button: New Pay Run Cycle */}
          <button
            type="button"
            onClick={() => setIsNewRunModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Cycle</span>
          </button>

          {/* Button: Recalculate Pay Run */}
          <button
            type="button"
            onClick={handleExecuteRun}
            disabled={isRecalculating}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 shadow-indigo-500/20"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Calculating Batch...' : 'Recalculate Pay Run'}</span>
          </button>
        </div>
      </div>

      {/* Cycle Selector & Batch Summary Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Cycle Bar & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Cycle:
            </span>
            {payrollRuns.length > 1 ? (
              <select
                value={activeRun?.id || ''}
                onChange={(e) => {
                  const selected = payrollRuns.find((r) => r.id === e.target.value);
                  if (selected) setActiveRun(selected);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {payrollRuns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.period_start} to {r.period_end} ({r.status})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono font-bold text-slate-900 text-sm">
                {activeRun?.period_start || '01 Oct 2026'} - {activeRun?.period_end || '31 Oct 2026'}
              </span>
            )}
            <StatusBadge status={activeRun?.status || 'APPROVED'} />
          </div>

          <div className="flex items-center space-x-2">
            {activeRun?.status !== 'DISBURSED' ? (
              <button
                type="button"
                onClick={handleAuthorizeDisbursement}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition shadow-xs"
                title="Mark payroll batch disbursed to bank"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorize Disbursement</span>
              </button>
            ) : (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Batch Disbursed & Locked</span>
              </span>
            )}
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Batch Cycle Period
            </span>
            <span className="text-base font-black text-slate-900 block mt-1">
              {activeRun?.period_start} - {activeRun?.period_end}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Run Date: {activeRun?.run_date || 'Today'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Gross Pay Emoluments
            </span>
            <span className="text-xl font-black font-mono text-slate-900 block mt-1">
              KES {summaryMetrics.gross.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">
              Includes base pay & trip mileage allowances
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Statutory Remittance
            </span>
            <span className="text-xl font-black font-mono text-rose-600 block mt-1">
              KES {summaryMetrics.statutory.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">
              KRA PAYE, NSSF, SHA & Housing Levy
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Net Bank Disbursement Total
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 block mt-1">
              KES {summaryMetrics.net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center mt-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              {summaryMetrics.count} Staff Verified in DB
            </span>
          </div>
        </div>
      </div>

      {/* Workforce Payslips Header & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-black text-slate-900">
            Workforce Payroll Ledger
          </span>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
            {payslips.length} Employee Payslips Generated
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Showing all registered employees for the active cycle. New staff can be synced via <strong>Recalculate Pay Run</strong>.
        </p>
      </div>

      {/* Payslips Table with Live Search */}
      <DataTable
        columns={columns}
        data={payslips}
        searchPlaceholder="Live filter payslips by staff #, name, or department..."
        pageSize={25}
        isLoading={loading}
      />

      {/* Official Payslip Viewer Modal */}
      <PayslipViewer
        payslip={selectedPayslip}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />

      {/* New Pay Run Cycle Modal */}
      <NewPayRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        onSave={handleCreateNewCycle}
      />
    </div>
  );
};
