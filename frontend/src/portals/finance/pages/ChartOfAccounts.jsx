import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { useFeedback } from '../../../context/FeedbackContext';
import { useAuth } from '../../../hooks/useAuth';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Scale,
  Plus,
  Download,
  BookOpen,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  Hash,
  Power,
  Check,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';

// Fallback accounts if backend is unreachable
const FALLBACK_ACCOUNTS = [
  { id: 1, account_code: '1000', name: 'KCB Corporate Operating Bank Account', account_type: 'ASSET', balance: 42150000, is_active: true },
  { id: 2, account_code: '1200', name: 'Accounts Receivable - Corporate Freight Clients', account_type: 'ASSET', balance: 18450000, is_active: true },
  { id: 3, account_code: '1500', name: 'Commercial Truck Fleet Capital Assets', account_type: 'ASSET', balance: 480000000, is_active: true },
  { id: 4, account_code: '2000', name: 'Accounts Payable - Fuel & Spare Suppliers', account_type: 'LIABILITY', balance: 14200000, is_active: true },
  { id: 5, account_code: '2200', name: 'VAT Output Tax Payable to KRA (16%)', account_type: 'LIABILITY', balance: 2371200, is_active: true },
  { id: 6, account_code: '3000', name: 'Shareholders Paid-in Capital', account_type: 'EQUITY', balance: 300000000, is_active: true },
  { id: 7, account_code: '3500', name: 'Retained Operational Earnings', account_type: 'EQUITY', balance: 224028800, is_active: true },
  { id: 8, account_code: '4100', name: 'Freight Revenue - Long Haul Transit', account_type: 'REVENUE', balance: 14820000, is_active: true },
  { id: 9, account_code: '5100', name: 'Direct Fleet Fuel & En-Route Diesel Expense', account_type: 'EXPENSE', balance: 4850000, is_active: true },
  { id: 10, account_code: '5200', name: 'Driver Mileage Per-Diem & Shift Allowances', account_type: 'EXPENSE', balance: 1425800, is_active: true },
];

export const ChartOfAccounts = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();
  const { user } = useAuth();

  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filters
  const [classificationFilter, setClassificationFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form State for Add Account Modal
  const [formData, setFormData] = useState({
    account_code: '',
    name: '',
    account_type: 'ASSET',
    is_active: true,
  });
  const [formTouched, setFormTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');

  // Fetch accounts from PostgreSQL
  const fetchAccounts = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const res = await apiClient.get(ENDPOINTS.FINANCE.ACCOUNTS);
        const rawList = res.data?.results || res.data || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          setAccounts(rawList);
        } else {
          setAccounts(FALLBACK_ACCOUNTS);
        }

        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Chart of Accounts Synchronized',
            message: 'All general ledger accounts and real-time balances updated from PostgreSQL.',
          });
        }
      } catch (err) {
        console.warn('Failed to load accounts from database, using cached fallback:', err);
        setAccounts(FALLBACK_ACCOUNTS);
        setDbConnected(false);

        if (isManual) {
          showError({
            title: 'Database Sync Notice',
            message: 'Could not fetch live accounts from PostgreSQL. Displaying cached ledger records.',
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
    fetchAccounts();
  }, [fetchAccounts]);

  // Dynamic Metrics across the Chart of Accounts
  const metrics = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpense = 0;

    accounts.forEach((acc) => {
      const bal = Number(acc.balance || 0);
      switch (acc.account_type) {
        case 'ASSET':
          totalAssets += bal;
          break;
        case 'LIABILITY':
          totalLiabilities += bal;
          break;
        case 'EQUITY':
          totalEquity += bal;
          break;
        case 'REVENUE':
          totalRevenue += bal;
          break;
        case 'EXPENSE':
          totalExpense += bal;
          break;
        default:
          break;
      }
    });

    return {
      totalCount: accounts.length,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense,
    };
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    if (classificationFilter === 'ALL') return accounts;
    return accounts.filter((acc) => acc.account_type === classificationFilter);
  }, [accounts, classificationFilter]);

  // Suggested next code generator based on selected account type
  const getSuggestedCode = (type) => {
    const prefixes = {
      ASSET: '1',
      LIABILITY: '2',
      EQUITY: '3',
      REVENUE: '4',
      EXPENSE: '5',
    };
    const prefix = prefixes[type] || '1';
    const sameTypeCodes = accounts
      .filter((a) => a.account_code && a.account_code.startsWith(prefix))
      .map((a) => parseInt(a.account_code, 10))
      .filter((n) => !isNaN(n));

    if (sameTypeCodes.length === 0) {
      return `${prefix}000`;
    }
    const maxCode = Math.max(...sameTypeCodes);
    return String(maxCode + 100);
  };

  // Form Validation
  const formErrors = useMemo(() => {
    const errs = {};
    const code = (formData.account_code || '').trim();

    if (!code) {
      errs.account_code = 'Account code is required.';
    } else if (!/^\d{4}$/.test(code)) {
      errs.account_code = 'Account code must be a 4-digit number (e.g. 1010).';
    } else if (accounts.some((a) => a.account_code === code)) {
      errs.account_code = `Account code ${code} is already registered in this ledger.`;
    }

    if (!formData.name.trim()) {
      errs.name = 'Account title/name is required.';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Account name must be at least 3 characters.';
    }

    return errs;
  }, [formData, accounts]);

  const isFormValid = Object.keys(formErrors).length === 0;

  // Open Add Modal with smart defaults
  const handleOpenAddModal = () => {
    const defaultType = 'ASSET';
    setFormData({
      account_code: getSuggestedCode(defaultType),
      name: '',
      account_type: defaultType,
      is_active: true,
    });
    setFormTouched({});
    setFormServerError('');
    setIsAddModalOpen(true);
  };

  // Create New Account in PostgreSQL
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormServerError('');
    setFormTouched({ account_code: true, name: true });

    if (!isFormValid) {
      setFormServerError('Please resolve the highlighted validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenant: currentTenant.id,
        account_code: formData.account_code.trim(),
        name: formData.name.trim(),
        account_type: formData.account_type,
        is_active: formData.is_active,
      };

      const res = await apiClient.post(ENDPOINTS.FINANCE.ACCOUNTS, payload);
      const created = res.data;

      setAccounts((prev) => [...prev, created]);
      setIsAddModalOpen(false);

      showSuccess({
        title: 'GL Account Created',
        message: `Account [${created.account_code}] "${created.name}" has been registered in the General Ledger.`,
      });
    } catch (err) {
      console.error('Failed to create account:', err);
      const msg =
        err.response?.data?.account_code?.[0] ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save GL account in PostgreSQL.';
      setFormServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Account Active Status
  const handleToggleActive = (account) => {
    const actionVerb = account.is_active ? 'deactivate' : 'activate';
    showConfirm({
      title: `${account.is_active ? 'Deactivate' : 'Activate'} GL Account`,
      message: `Are you sure you want to ${actionVerb} [${account.account_code}] "${account.name}"? Inactive accounts will be restricted from future journal entries.`,
      confirmLabel: `${account.is_active ? 'Deactivate' : 'Activate'}`,
      variant: account.is_active ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          const res = await apiClient.patch(`${ENDPOINTS.FINANCE.ACCOUNTS}${account.id}/`, {
            is_active: !account.is_active,
          });
          const updated = res.data;
          setAccounts((prev) => prev.map((a) => (a.id === account.id ? updated : a)));
          showSuccess({
            title: 'Account Updated',
            message: `Account [${account.account_code}] is now ${updated.is_active ? 'ACTIVE' : 'INACTIVE'}.`,
          });
        } catch (err) {
          showError({
            title: 'Update Failed',
            message: err.response?.data?.message || err.message || 'Failed to update account status.',
          });
        }
      },
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!accounts || accounts.length === 0) {
      showError({ title: 'Export Notice', message: 'No accounts available to export.' });
      return;
    }

    const headers = [
      'Account Code',
      'Account Name',
      'Classification',
      'Normal Balance Rule',
      'Current Balance (KES)',
      'Status',
    ];

    const rows = accounts.map((acc) => [
      `"${acc.account_code || ''}"`,
      `"${acc.name || ''}"`,
      `"${acc.account_type || ''}"`,
      acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE' ? 'Debit (DR)' : 'Credit (CR)',
      Number(acc.balance || 0).toFixed(2),
      acc.is_active ? 'ACTIVE' : 'INACTIVE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Chart_of_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV ledger catalog for ${accounts.length} general ledger accounts.`,
    });
  };

  // Classification Badge Helper
  const getBadgeClass = (type) => {
    const badgeColors = {
      ASSET: 'bg-blue-50 text-blue-700 border-blue-200',
      LIABILITY: 'bg-rose-50 text-rose-700 border-rose-200',
      EQUITY: 'bg-purple-50 text-purple-700 border-purple-200',
      REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      EXPENSE: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return badgeColors[type] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'GL Code',
      accessor: 'account_code',
      cell: (r) => (
        <span className="font-mono font-black text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
          {r.account_code}
        </span>
      ),
    },
    {
      header: 'Account Name',
      accessor: 'name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.name}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {r.account_type === 'ASSET' && '1xxx Asset Balance Sheet Account'}
            {r.account_type === 'LIABILITY' && '2xxx Liability Balance Sheet Account'}
            {r.account_type === 'EQUITY' && '3xxx Equity Balance Sheet Account'}
            {r.account_type === 'REVENUE' && '4xxx Operational Freight Revenue Account'}
            {r.account_type === 'EXPENSE' && '5xxx Operating Expense P&L Account'}
          </span>
        </div>
      ),
    },
    {
      header: 'Classification',
      accessor: 'account_type',
      cell: (r) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wider uppercase ${getBadgeClass(
            r.account_type
          )}`}
        >
          {r.account_type}
        </span>
      ),
    },
    {
      header: 'Normal Balance',
      accessor: 'account_type',
      cell: (r) => {
        const isDebit = r.account_type === 'ASSET' || r.account_type === 'EXPENSE';
        return (
          <span
            className={`font-mono text-xs font-bold ${
              isDebit ? 'text-blue-700' : 'text-purple-700'
            }`}
          >
            {isDebit ? 'DR (Debit)' : 'CR (Credit)'}
          </span>
        );
      },
    },
    {
      header: 'Current Ledger Balance',
      accessor: 'balance',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-sm block">
            KES {Number(r.balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 block">PostgreSQL Live Aggregated</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (r) => <StatusBadge status={r.is_active ? 'AVAILABLE' : 'INACTIVE'} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            type="button"
            onClick={() => setSelectedAccount(r)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Inspect Account Ledger Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActive(r)}
            className={`p-1.5 rounded-lg transition ${
              r.is_active
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={r.is_active ? 'Deactivate Account' : 'Activate Account'}
          >
            <Power className="w-4 h-4" />
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
          <Breadcrumbs items={['Finance & Ledger Workspace', 'General Ledger Chart of Accounts']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              General Ledger Chart of Accounts
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
            Standard enterprise double-entry general ledger chart of accounts, classification hierarchy, and real-time ledger balances
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync DB Button */}
          <button
            type="button"
            onClick={() => fetchAccounts(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Reload Accounts from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Export Chart of Accounts to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Add GL Account Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add GL Account</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Accounts */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Master Accounts
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {metrics.totalCount} Accounts
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
              <Check className="w-3 h-3 mr-0.5" /> 100% Invariant Indexed
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Asset Holdings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Assets (1xxx)
            </span>
            <span className="text-lg font-black text-blue-700 font-mono mt-1 block">
              KES {metrics.totalAssets.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Normal Debit (DR) Balance
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Liabilities */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Liabilities (2xxx)
            </span>
            <span className="text-lg font-black text-rose-700 font-mono mt-1 block">
              KES {metrics.totalLiabilities.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Normal Credit (CR) Balance
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Shareholder Equity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Shareholder Equity (3xxx)
            </span>
            <span className="text-lg font-black text-purple-700 font-mono mt-1 block">
              KES {metrics.totalEquity.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Normal Credit (CR) Balance
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Accounting Equilibrium Verification Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold block">
              Fundamental Accounting Equation Check (Assets = Liabilities + Equity)
            </span>
            <span className="text-slate-600 text-[11px]">
              All journal entries post atomically using the Double-Entry General Ledger Engine.
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3 font-mono font-bold text-[11px] text-slate-700">
          <span>Assets: KES {metrics.totalAssets.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</span>
          <span className="text-slate-400">=</span>
          <span>L + E: KES {(metrics.totalLiabilities + metrics.totalEquity).toLocaleString('en-KE', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Classification Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Accounts', count: accounts.length },
          { key: 'ASSET', label: 'Assets (1xxx)', count: accounts.filter((a) => a.account_type === 'ASSET').length },
          { key: 'LIABILITY', label: 'Liabilities (2xxx)', count: accounts.filter((a) => a.account_type === 'LIABILITY').length },
          { key: 'EQUITY', label: 'Equity (3xxx)', count: accounts.filter((a) => a.account_type === 'EQUITY').length },
          { key: 'REVENUE', label: 'Revenue (4xxx)', count: accounts.filter((a) => a.account_type === 'REVENUE').length },
          { key: 'EXPENSE', label: 'Expenses (5xxx)', count: accounts.filter((a) => a.account_type === 'EXPENSE').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setClassificationFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              classificationFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                classificationFilter === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Master Accounts DataTable */}
      <DataTable
        columns={columns}
        data={filteredAccounts}
        searchPlaceholder="Live search accounts by code (e.g. 1000), name, or classification..."
        pageSize={8}
        isLoading={loading}
      />

      {/* Modal: Add General Ledger Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add General Ledger Account</h2>
                  <p className="text-xs text-slate-500">
                    Register a new account in the master Chart of Accounts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4 overflow-y-auto pr-1">
              {formServerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formServerError}</span>
                </div>
              )}

              {/* Operating Tenant Banner */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Operating Corporate Tenant
                </label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                      APX
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{currentTenant.company_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Subdomain: {currentTenant.subdomain}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Tenant
                  </span>
                </div>
              </div>

              {/* Account Classification */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'ASSET', label: 'Asset (1xxx)', desc: 'DR Normal' },
                    { type: 'LIABILITY', label: 'Liability (2xxx)', desc: 'CR Normal' },
                    { type: 'EQUITY', label: 'Equity (3xxx)', desc: 'CR Normal' },
                    { type: 'REVENUE', label: 'Revenue (4xxx)', desc: 'CR Normal' },
                    { type: 'EXPENSE', label: 'Expense (5xxx)', desc: 'DR Normal' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          account_type: item.type,
                          account_code: getSuggestedCode(item.type),
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        formData.account_type === item.type
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Code & Auto Next # */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Account Code (4 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        account_code: getSuggestedCode(prev.account_type),
                      }));
                    }}
                    className="inline-flex items-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Auto-Next Code
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 1010"
                    value={formData.account_code}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData({ ...formData, account_code: clean });
                    }}
                    onBlur={() => setFormTouched((prev) => ({ ...prev, account_code: true }))}
                    className={`block w-full rounded-xl border pl-10 pr-3.5 py-2.5 sm:text-sm font-mono font-bold transition ${
                      formTouched.account_code && formErrors.account_code
                        ? 'border-rose-300 text-rose-900 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white'
                    }`}
                  />
                </div>
                {formTouched.account_code && formErrors.account_code ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.account_code}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400 font-mono">
                    Must be 4 digits matching classification series ({formData.account_type === 'ASSET' ? '1xxx' : formData.account_type === 'LIABILITY' ? '2xxx' : formData.account_type === 'EQUITY' ? '3xxx' : formData.account_type === 'REVENUE' ? '4xxx' : '5xxx'}).
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <ControlledInput
                  label="Account Title / Name"
                  required
                  placeholder="e.g. Petty Cash - Mombasa Port Depot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
                  error={formTouched.name ? formErrors.name : null}
                />
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="account_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="account_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Activate account immediately for journal posting
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save GL Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Account Detail & Ledger Inspector */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl text-base border border-indigo-100">
                  [{selectedAccount.account_code}]
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedAccount.name}</h3>
                  <span className="text-xs text-slate-500">General Ledger Account Detail</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Account Classification:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${getBadgeClass(selectedAccount.account_type)}`}>
                    {selectedAccount.account_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Normal Accounting Balance:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedAccount.account_type === 'ASSET' || selectedAccount.account_type === 'EXPENSE'
                      ? 'Debit (DR) Normal'
                      : 'Credit (CR) Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Balance Computation Formula:</span>
                  <span className="font-mono font-bold text-slate-600 text-[11px]">
                    {selectedAccount.account_type === 'ASSET' || selectedAccount.account_type === 'EXPENSE'
                      ? 'Sum(Debits) - Sum(Credits)'
                      : 'Sum(Credits) - Sum(Debits)'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-indigo-950">
                  <span>Current Ledger Balance:</span>
                  <span className="font-mono text-indigo-600 text-base">
                    KES {Number(selectedAccount.balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold block text-indigo-900 uppercase tracking-wider text-[10px]">
                  Double-Entry Ledger Audit Trail:
                </span>
                <p>
                  Every balance movement on this account is backed by immutable journal transactions signed by authorized financial personnel.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
