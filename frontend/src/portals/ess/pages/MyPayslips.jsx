import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { PayslipViewer } from '../../hr/components/PayslipViewer';
import { KraP9Modal } from '../components/KraP9Modal';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import {
  ScrollText,
  Eye,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const MyPayslips = () => {
  const { user } = useAuth();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isP9ModalOpen, setIsP9ModalOpen] = useState(false);

  // Fetch logged-in driver's official payslips from PostgreSQL
  const fetchPayslips = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Try my_payslips action endpoint first
      let res;
      try {
        res = await apiClient.get(ENDPOINTS.HR.MY_PAYSLIPS);
      } catch (e) {
        // Fallback to standard payslips endpoint
        res = await apiClient.get(ENDPOINTS.HR.PAYSLIPS);
      }

      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

      // Sort by period_end descending
      const sorted = data.sort((a, b) => {
        return new Date(b.period_end || b.created_at) - new Date(a.period_end || a.created_at);
      });

      setPayslips(sorted);
    } catch (err) {
      console.error('Failed to load payslips:', err);
      setError('Unable to retrieve official payslips from server. Check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  // Format month for display
  const formatPeriod = (dateStr) => {
    if (!dateStr) return 'Pay Cycle';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Cumulative Totals
  const totals = useMemo(() => {
    return payslips.reduce(
      (acc, p) => {
        const base = Number(p.base_pay || 0);
        const allow = Number(p.allowances || 0);
        const gross = base + allow;
        const tax = Number(p.deductions_tax || p.calculation_breakdown?.net_paye || 0);
        const stat = Number(p.deductions_statutory || 0);
        const net = Number(p.net_pay || 0);

        acc.gross += gross;
        acc.tax += tax;
        acc.statutory += stat;
        acc.net += net;
        return acc;
      },
      { gross: 0, tax: 0, statutory: 0, net: 0 }
    );
  }, [payslips]);

  const columns = [
    {
      header: 'Pay Cycle',
      accessor: 'period_end',
      cell: (r) => (
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">
              {formatPeriod(r.period_end)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              REF: {String(r.id || '').substring(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Base Salary',
      accessor: 'base_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          KES {Number(r.base_pay || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Trip Allowances',
      accessor: 'allowances',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs text-indigo-600 font-semibold">
          + KES {Number(r.allowances || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Gross Earnings',
      accessor: 'gross_earnings',
      align: 'right',
      cell: (r) => {
        const gross = Number(r.base_pay || 0) + Number(r.allowances || 0);
        return (
          <span className="font-mono text-xs font-bold text-slate-900">
            KES {gross.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      header: 'Statutory Taxes',
      accessor: 'deductions_tax',
      align: 'right',
      cell: (r) => {
        const totalDeductions = Number(r.deductions_tax || 0) + Number(r.deductions_statutory || 0);
        return (
          <div className="text-right">
            <span className="font-mono text-xs text-rose-600 font-semibold block">
              - KES {totalDeductions.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              PAYE + NSSF + SHA + Housing
            </span>
          </div>
        );
      },
    },
    {
      header: 'Net Take-Home',
      accessor: 'net_pay',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-black text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
          KES {Number(r.net_pay || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Official Slip',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <button
          onClick={() => {
            setSelectedSlip({
              ...r,
              period_end: formatPeriod(r.period_end),
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200/60 cursor-pointer shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Payslip</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'My Official Payslips']} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Personal Earnings & Statutory Records
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                KRA P9 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly payslips with transparent PAYE, NSSF, SHA, and Affordable Housing Levy breakdowns
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchPayslips(true)}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs flex items-center space-x-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              title="Refresh payslips from PostgreSQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            <button
              onClick={() => setIsP9ModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>KRA P9 Tax Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KRA Tax & Earnings Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-indigo-900/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-wide">
                  Kenya Revenue Authority Statutory Account
                </h3>
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
                  Tax Compliant
                </span>
              </div>
              <p className="text-[11px] text-indigo-300">
                Staff PIN:{' '}
                <span className="font-mono font-bold text-white">
                  {user?.taxPin || payslips[0]?.tax_pin || 'A009124892K'}
                </span>{' '}
                • Employer: Apex Logistics & Supply Chain Ltd (P051239840Z)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsP9ModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 text-xs font-bold transition flex items-center space-x-1.5 border border-indigo-700/60 w-fit cursor-pointer"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Generate P9 Certificate</span>
          </button>
        </div>

        {/* Totals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
              YTD Net Take-Home
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 block">
              KES {totals.net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Net bank disbursements</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
              Cumulative Gross
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-white block">
              KES {totals.gross.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Base salary + allowances</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
              KRA PAYE Remitted
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-rose-400 block">
              KES {totals.tax.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Post-relief income tax</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
              Statutory Contributions
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-indigo-300 block">
              KES {totals.statutory.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">NSSF + SHA + Housing</span>
          </div>
        </div>
      </div>

      {/* Pay Cycles DataTable */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Official Historical Pay Cycles
            </h3>
            <p className="text-[11px] text-slate-500">
              Verified corporate payroll batches recorded in PostgreSQL
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {payslips.length} Cycles Available
          </span>
        </div>

        <DataTable
          columns={columns}
          data={payslips}
          searchPlaceholder="Search pay period, reference..."
          pageSize={6}
          isLoading={loading}
        />
      </div>

      {/* Payslip Viewer Modal */}
      <PayslipViewer
        payslip={selectedSlip}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* KRA P9 Tax Card Modal */}
      <KraP9Modal
        isOpen={isP9ModalOpen}
        onClose={() => setIsP9ModalOpen(false)}
        payslips={payslips}
        user={user}
      />
    </div>
  );
};
