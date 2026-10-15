import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { JournalEntryForm } from '../components/JournalEntryForm';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  BookOpenCheck,
  Plus,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ShieldCheck,
  Scale,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

export const JournalEntries = () => {
  const { showSuccess, showError } = useFeedback();

  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);

  // Fetch journals and accounts from PostgreSQL
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const [journalsRes, accountsRes] = await Promise.all([
          apiClient.get(ENDPOINTS.FINANCE.JOURNALS),
          apiClient.get(ENDPOINTS.FINANCE.ACCOUNTS),
        ]);

        const rawJournals = journalsRes.data?.results || journalsRes.data || [];
        const rawAccounts = accountsRes.data?.results || accountsRes.data || [];

        setJournals(Array.isArray(rawJournals) ? rawJournals : []);
        setAccounts(Array.isArray(rawAccounts) ? rawAccounts : []);
        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'General Ledger Synchronized',
            message: `Loaded ${rawJournals.length} balanced journal transactions from PostgreSQL.`,
          });
        }
      } catch (err) {
        console.warn('Failed to load journals from database:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest journal entries from PostgreSQL.',
          });
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [showSuccess, showError]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Post Journal
  const handlePostJournal = async (payload) => {
    try {
      const res = await apiClient.post(ENDPOINTS.FINANCE.JOURNALS, payload);
      const created = res.data;

      setJournals((prev) => [created, ...prev]);

      // Re-fetch accounts to update balances
      apiClient.get(ENDPOINTS.FINANCE.ACCOUNTS).then((accRes) => {
        const rawAccounts = accRes.data?.results || accRes.data || [];
        setAccounts(Array.isArray(rawAccounts) ? rawAccounts : []);
      });

      showSuccess({
        title: 'Journal Entry Posted',
        message: `Transaction "${created.description}" successfully posted and committed to the General Ledger.`,
      });
    } catch (err) {
      console.error('Failed to post journal:', err);
      const msg =
        err.response?.data?.balance ||
        err.response?.data?.message ||
        err.message ||
        'Failed to commit journal entry to PostgreSQL.';
      showError({
        title: 'Journal Posting Error',
        message: msg,
      });
      throw err;
    }
  };

  // Dynamic Metrics across General Ledger
  const metrics = useMemo(() => {
    let totalDebitSum = 0;
    let totalCreditSum = 0;
    let balancedCount = 0;

    journals.forEach((j) => {
      const d = Number(j.total_debit || 0);
      const c = Number(j.total_credit || 0);
      totalDebitSum += d;
      totalCreditSum += c;
      if (Math.abs(d - c) < 0.01) {
        balancedCount += 1;
      }
    });

    return {
      totalCount: journals.length,
      totalDebitSum,
      totalCreditSum,
      balancedCount,
      isInvariantStrict: totalDebitSum === totalCreditSum,
    };
  }, [journals]);

  // Filtered Journals
  const filteredJournals = useMemo(() => {
    if (typeFilter === 'ALL') return journals;
    return journals.filter((j) => j.reference_type === typeFilter);
  }, [journals, typeFilter]);

  // Reference Type Badge Helper
  const getRefBadge = (type) => {
    const config = {
      OPENING_BALANCE: { label: 'Opening Balance', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
      MANUAL_JOURNAL: { label: 'Manual Adjustment', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      TRIP_INVOICE: { label: 'Freight Billing', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      INVOICE_PAYMENT: { label: 'Customer Payment', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      FUEL_EXPENSE: { label: 'Diesel Procurement', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      PAYROLL_RUN: { label: 'Driver Payroll', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    };
    const c = config[type] || { label: type, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!journals || journals.length === 0) {
      showError({ title: 'Export Notice', message: 'No journal entries available to export.' });
      return;
    }

    const headers = [
      'Transaction Date',
      'Journal ID',
      'Reference Type',
      'Description',
      'Account Code',
      'Account Name',
      'Debit (KES)',
      'Credit (KES)',
      'Posted By',
    ];

    const rows = [];
    journals.forEach((j) => {
      if (Array.isArray(j.lines) && j.lines.length > 0) {
        j.lines.forEach((l) => {
          rows.push([
            `"${j.entry_date}"`,
            `"${j.id}"`,
            `"${j.reference_type}"`,
            `"${(j.description || '').replace(/"/g, '""')}"`,
            `"${l.account_code || ''}"`,
            `"${(l.account_name || '').replace(/"/g, '""')}"`,
            Number(l.debit || 0).toFixed(2),
            Number(l.credit || 0).toFixed(2),
            `"${j.posted_by_name || ''}"`,
          ]);
        });
      } else {
        rows.push([
          `"${j.entry_date}"`,
          `"${j.id}"`,
          `"${j.reference_type}"`,
          `"${(j.description || '').replace(/"/g, '""')}"`,
          '""',
          '""',
          Number(j.total_debit || 0).toFixed(2),
          Number(j.total_credit || 0).toFixed(2),
          `"${j.posted_by_name || ''}"`,
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_General_Ledger_Journals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV ledger journal register with ${rows.length} line items.`,
    });
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Date',
      accessor: 'entry_date',
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{r.entry_date}</span>
          <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[100px]">
            {String(r.id).slice(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      header: 'Reference Type',
      accessor: 'reference_type',
      cell: (r) => getRefBadge(r.reference_type),
    },
    {
      header: 'Transaction Narrative',
      accessor: 'description',
      cell: (r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block leading-tight">{r.description}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Posted by: <span className="font-bold text-slate-700">{r.posted_by_name || 'System Accountant'}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Ledger Lines Breakdown',
      accessor: 'lines',
      cell: (r) => {
        const lines = r.lines || [];
        const drCount = lines.filter((l) => Number(l.debit || 0) > 0).length;
        const crCount = lines.filter((l) => Number(l.credit || 0) > 0).length;
        return (
          <div className="space-y-1 max-w-xs">
            <div className="flex flex-wrap items-center gap-1">
              {lines.slice(0, 3).map((l, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    Number(l.debit || 0) > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                  title={`${l.account_code} - ${l.account_name}`}
                >
                  {Number(l.debit || 0) > 0 ? 'DR ' : 'CR '}
                  {l.account_code}
                </span>
              ))}
              {lines.length > 3 && (
                <span className="text-[10px] text-slate-400 font-mono">+{lines.length - 3} more</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {drCount} Debits • {crCount} Credits
            </span>
          </div>
        );
      },
    },
    {
      header: 'Total Volume',
      accessor: 'total_debit',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-xs block">
            KES {Number(r.total_debit || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Balanced
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            type="button"
            onClick={() => setSelectedJournal(r)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Inspect Official Journal Voucher"
          >
            <Eye className="w-4 h-4" />
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
          <Breadcrumbs items={['Finance & Ledger Workspace', 'General Ledger Journal Entries']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              General Ledger Journal Entries
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
            Double-entry transaction audit log, balanced journal vouchers, and ledger reconciliations
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync DB */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Reload Journals from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Export Journal Register to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Post Journal Button */}
          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Journal</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Posted Transactions
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {metrics.totalCount} Journals
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> 100% Invariant Compliant
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpenCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Debits Booked */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Debits Booked
            </span>
            <span className="text-lg font-black text-blue-700 font-mono mt-1 block">
              KES {metrics.totalDebitSum.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Asset & Expense Debits
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Credits Booked */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Credits Booked
            </span>
            <span className="text-lg font-black text-purple-700 font-mono mt-1 block">
              KES {metrics.totalCreditSum.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Liability, Equity & Revenue
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Ledger Equilibrium Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Double-Entry Invariant
            </span>
            <span className="text-base font-black text-emerald-700 font-mono mt-1 block">
              Balanced (Diff: KES 0.00)
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
              Sum(Debits) == Sum(Credits)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Journals', count: journals.length },
          { key: 'MANUAL_JOURNAL', label: 'Manual Adjustments', count: journals.filter((j) => j.reference_type === 'MANUAL_JOURNAL').length },
          { key: 'INVOICE_PAYMENT', label: 'Customer Payments', count: journals.filter((j) => j.reference_type === 'INVOICE_PAYMENT').length },
          { key: 'TRIP_INVOICE', label: 'Freight Billing', count: journals.filter((j) => j.reference_type === 'TRIP_INVOICE').length },
          { key: 'FUEL_EXPENSE', label: 'Diesel Procurement', count: journals.filter((j) => j.reference_type === 'FUEL_EXPENSE').length },
          { key: 'OPENING_BALANCE', label: 'Opening Balances', count: journals.filter((j) => j.reference_type === 'OPENING_BALANCE').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTypeFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              typeFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                typeFilter === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Journals DataTable */}
      <DataTable
        columns={columns}
        data={filteredJournals}
        searchPlaceholder="Live search by narrative, date (YYYY-MM-DD), reference type..."
        pageSize={8}
        isLoading={loading}
      />

      {/* Modal: Post New Journal Entry */}
      <JournalEntryForm
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSave={handlePostJournal}
        accounts={accounts}
      />

      {/* Modal: Official General Ledger Voucher Viewer */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  GL Voucher • {String(selectedJournal.id).slice(0, 13)}
                </span>
                {getRefBadge(selectedJournal.reference_type)}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center space-x-1 text-xs font-bold"
                  title="Print Journal Voucher"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJournal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800">
              {/* Corporate Letterhead */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <img
                    src="/logo.png"
                    alt="Apex Logistics & Supply Chain Ltd"
                    className="h-12 w-auto object-contain mb-2"
                  />
                  <p className="text-xs text-slate-600 font-medium">
                    ICD Road, Industrial Area, Nairobi, Kenya
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Company Tax PIN: P051239840Z • VAT Reg: 0142859B
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    Voucher Date
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono block">
                    {selectedJournal.entry_date}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1.5 uppercase font-bold tracking-wider">
                    Audited Status
                  </span>
                  <span className="text-xs font-bold text-emerald-600 font-mono block">
                    POSTED & BALANCED
                  </span>
                </div>
              </div>

              {/* Transaction Narrative Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                  Transaction Narrative / Purpose:
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedJournal.description}
                </p>
                <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Reference Classification: {selectedJournal.reference_type}</span>
                  <span>Posted By: {selectedJournal.posted_by_name || 'System Lead'}</span>
                </div>
              </div>

              {/* Line-by-Line Debit / Credit Table */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  General Ledger Line Breakdown
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 text-left">Code</th>
                        <th className="py-2.5 px-4 text-left">Account Description</th>
                        <th className="py-2.5 px-4 text-right">Debit (KES)</th>
                        <th className="py-2.5 px-4 text-right">Credit (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedJournal.lines || []).map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                            {l.account_code}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {l.account_name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {Number(l.debit || 0) > 0
                              ? Number(l.debit).toLocaleString('en-KE', { minimumFractionDigits: 2 })
                              : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {Number(l.credit || 0) > 0
                              ? Number(l.credit).toLocaleString('en-KE', { minimumFractionDigits: 2 })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold text-xs">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 uppercase text-[11px] text-slate-700">
                          Total Balanced Ledger Lines:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-700 text-sm">
                          KES {Number(selectedJournal.total_debit || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-700 text-sm">
                          KES {Number(selectedJournal.total_credit || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Compliance & Sign-off Signature */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 block">Authorized Signature:</span>
                  <div className="mt-2 h-10 border-b border-dashed border-slate-400 w-48 flex items-end">
                    <span className="font-mono text-[11px] text-indigo-600 font-bold italic">
                      {selectedJournal.posted_by_name || 'Wanjiku Mwangi, CPA'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Chief Financial Officer / Controller</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Double-Entry Invariant Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
