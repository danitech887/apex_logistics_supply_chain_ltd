import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { InvoiceBuilder } from '../components/InvoiceBuilder';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Receipt,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  Eye,
  X,
  Printer,
  RefreshCw,
  Trash2,
  DollarSign,
  AlertCircle,
  Calendar,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const InvoiceList = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();

  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    unpaid_count: 0,
    paid_count: 0,
    total_receivable: 0,
    total_collected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch invoices and stats from PostgreSQL
  const fetchInvoices = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        let url = `${ENDPOINTS.FINANCE.INVOICES}?`;
        if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;

        const [invoicesRes, statsRes] = await Promise.all([
          apiClient.get(url),
          apiClient.get(`${ENDPOINTS.FINANCE.INVOICES}stats/`),
        ]);

        const rawList = invoicesRes.data?.results || invoicesRes.data || [];
        setInvoices(Array.isArray(rawList) ? rawList : []);

        if (statsRes.data) {
          setStats(statsRes.data);
        }

        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Database Synchronized',
            message: 'All Accounts Receivable invoices and ledger entries reloaded from PostgreSQL.',
          });
        }
      } catch (err) {
        console.warn('Failed to load invoices from database:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest invoice records from PostgreSQL.',
          });
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter, showSuccess, showError]
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Button Action: Create & Issue New Tax Invoice
  const handleCreateInvoice = async (invoiceData) => {
    try {
      const res = await apiClient.post(ENDPOINTS.FINANCE.INVOICES, invoiceData);
      const created = res.data;
      setInvoices((prev) => [created, ...prev]);

      // Refresh stats
      apiClient.get(`${ENDPOINTS.FINANCE.INVOICES}stats/`).then((r) => setStats(r.data));

      showSuccess({
        title: 'Tax Invoice Issued',
        message: `Invoice ${created.invoice_number} for KES ${Number(created.total_amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })} has been saved to the database.`,
      });
    } catch (err) {
      showError({
        title: 'Invoice Issuance Failed',
        message: err.response?.data?.message || err.message || 'Failed to issue tax invoice.',
        details: err.response?.data?.details,
      });
      throw err;
    }
  };

  // Button Action: Mark Invoice Paid & Post Cash Receipt to General Ledger
  const handleMarkPaid = (invoice) => {
    showConfirm({
      title: 'Settle Freight Invoice',
      message: `Are you sure you want to mark invoice ${invoice.invoice_number} (${invoice.client_name}) as PAID? This will automatically post a double-entry cash receipt journal (Debit Cash 1000, Credit AR 1200: KES ${Number(invoice.total_amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}) into the General Ledger.`,
      confirmText: 'Settle Invoice & Post Journal',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: async () => {
        try {
          const res = await apiClient.post(
            `${ENDPOINTS.FINANCE.INVOICES}${invoice.id}/mark_paid/`
          );
          const updated = res.data?.invoice || { ...invoice, status: 'PAID' };

          setInvoices((prev) =>
            prev.map((inv) => (inv.id === invoice.id ? { ...inv, ...updated, status: 'PAID' } : inv))
          );

          // Refresh stats
          apiClient.get(`${ENDPOINTS.FINANCE.INVOICES}stats/`).then((r) => setStats(r.data));

          showSuccess({
            title: 'Invoice Settled & Reconciled',
            message: `Invoice ${invoice.invoice_number} has been settled. Double-entry receipt journal posted to General Ledger.`,
          });
        } catch (err) {
          showError({
            title: 'Settlement Failed',
            message: err.response?.data?.message || err.message || 'Could not settle invoice.',
          });
        }
      },
    });
  };

  // Button Action: Delete Invoice
  const handleDeleteInvoice = (invoice) => {
    showConfirm({
      title: 'Delete Freight Invoice',
      message: `Are you sure you want to delete invoice ${invoice.invoice_number} for ${invoice.client_name}? This action cannot be reversed.`,
      confirmText: 'Delete Invoice',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`${ENDPOINTS.FINANCE.INVOICES}${invoice.id}/`);
          setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));

          // Refresh stats
          apiClient.get(`${ENDPOINTS.FINANCE.INVOICES}stats/`).then((r) => setStats(r.data));

          showSuccess({
            title: 'Invoice Deleted',
            message: `Invoice ${invoice.invoice_number} was successfully removed from PostgreSQL.`,
          });
        } catch (err) {
          showError({
            title: 'Deletion Failed',
            message: err.response?.data?.message || err.message || 'Failed to delete invoice record.',
          });
        }
      },
    });
  };

  // Button Action: Export CSV Register
  const handleExportCSV = () => {
    if (!invoices || invoices.length === 0) {
      showError({ title: 'Export Notice', message: 'No invoice records available to export.' });
      return;
    }

    const headers = [
      'Invoice Number',
      'Client Name',
      'Client KRA PIN',
      'Issue Date',
      'Due Date',
      'Subtotal (KES)',
      '16% VAT (KES)',
      'Total Amount Due (KES)',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoice_number || ''}"`,
      `"${inv.client_name || ''}"`,
      `"${inv.client_pin || ''}"`,
      `"${inv.issue_date || ''}"`,
      `"${inv.due_date || ''}"`,
      Number(inv.subtotal || 0).toFixed(2),
      Number(inv.tax_amount || 0).toFixed(2),
      Number(inv.total_amount || 0).toFixed(2),
      `"${inv.status || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Freight_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV register for ${invoices.length} freight tax invoices.`,
    });
  };

  // Calculated 16% VAT Total across loaded invoices
  const totalVATComputed = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
  }, [invoices]);

  // DataTable Columns definition
  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-indigo-600 block bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">
            {r.invoice_number}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            ID: {r.id ? r.id.slice(0, 8) : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Client & Tax PIN',
      accessor: 'client_name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.client_name}</span>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">{r.client_pin}</span>
        </div>
      ),
    },
    {
      header: 'Invoice & Due Date',
      accessor: 'issue_date',
      cell: (r) => {
        const isOverdue =
          r.status === 'UNPAID' && r.due_date && new Date(r.due_date) < new Date();
        return (
          <div>
            <span className="text-xs text-slate-800 font-mono block">{r.issue_date}</span>
            <span
              className={`text-[10px] block font-mono font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
              }`}
            >
              Due: {r.due_date} {isOverdue && '(Overdue)'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Subtotal & 16% VAT',
      accessor: 'subtotal',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono text-xs text-slate-800 block">
            KES {Number(r.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="font-mono text-[10px] text-slate-400 block font-medium">
            + KES {Number(r.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })} VAT
          </span>
        </div>
      ),
    },
    {
      header: 'Total Amount Due',
      accessor: 'total_amount',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-black text-slate-900 text-xs bg-slate-100/80 px-2.5 py-1 rounded-md block w-fit ml-auto">
          KES {Number(r.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
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
          {/* View Invoice */}
          <button
            type="button"
            onClick={() => setSelectedInvoice(r)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl transition"
            title="View Tax Invoice"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {/* Mark Paid button for UNPAID */}
          {r.status === 'UNPAID' ? (
            <button
              type="button"
              onClick={() => handleMarkPaid(r)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition"
              title="Mark Paid & Post to GL"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Settled
            </span>
          )}

          {/* Delete Invoice */}
          <button
            type="button"
            onClick={() => handleDeleteInvoice(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Invoice"
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
          <Breadcrumbs items={['Finance & Ledger Workspace', 'Accounts Receivable & Billing']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Accounts Receivable & Freight Billing
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
            Corporate freight tax invoicing, KRA 16% output VAT tracking, and automated double-entry ledger reconciliation
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync DB */}
          <button
            type="button"
            onClick={() => fetchInvoices(true)}
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

          {/* Issue Tax Invoice */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Invoices
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 block mt-2">
            {stats.total_count}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Freight billings logged in DB
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Outstanding AR (Unpaid)
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-amber-600 block mt-2">
            KES {Number(stats.total_receivable).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-amber-700/80 mt-1 block font-medium">
            {stats.unpaid_count} customer invoices pending settlement
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Settled Revenue (Paid)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-emerald-600 block mt-2">
            KES {Number(stats.total_collected).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {stats.paid_count} invoices cleared to Operating Bank Account
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              KRA 16% Output VAT
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 block mt-2">
            KES {Number(totalVATComputed).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Automated KRA VAT payable booked to GL (2200)
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-1.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs w-fit">
        {[
          { id: 'ALL', label: 'All Invoices', count: stats.total_count },
          { id: 'UNPAID', label: 'Unpaid & Due', count: stats.unpaid_count, alert: stats.unpaid_count > 0 },
          { id: 'PAID', label: 'Settled & Paid', count: stats.paid_count },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
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

      {/* Data Table with Live Search */}
      <DataTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Live search by invoice #, client name, or KRA PIN..."
        pageSize={6}
        isLoading={loading}
      />

      {/* Invoice Builder Modal */}
      <InvoiceBuilder
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateInvoice}
        existingInvoices={invoices}
      />

      {/* Official Tax Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  KRA Tax Invoice • {selectedInvoice.invoice_number}
                </span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center space-x-1 text-xs font-bold"
                  title="Print Tax Invoice"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Invoice Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800">
              {/* Letterhead */}
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
                    Invoice Date
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono block">
                    {selectedInvoice.issue_date}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1.5 uppercase font-bold tracking-wider">
                    Payment Due Date (Net 30)
                  </span>
                  <span className="text-xs font-bold text-rose-600 font-mono block">
                    {selectedInvoice.due_date}
                  </span>
                </div>
              </div>

              {/* Billed To Customer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                    Billed To (Corporate Customer):
                  </span>
                  <span className="font-black text-slate-900 text-sm block mt-0.5">
                    {selectedInvoice.client_name}
                  </span>
                  <span className="font-mono text-slate-600 font-semibold block mt-0.5">
                    Customer Tax PIN: {selectedInvoice.client_pin}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                    Terms & Settlement:
                  </span>
                  <span className="font-semibold text-slate-800">Bank Wire / RTGS</span>
                  <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                    {selectedInvoice.status === 'PAID' ? 'PAID & CLEARED' : 'PENDING SETTLEMENT'}
                  </span>
                </div>
              </div>

              {/* Invoice Line Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-700 font-semibold">
                    Freight Transit Hauling Services (Cross-Corridor Transport)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {Number(selectedInvoice.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-700 font-semibold">
                    KRA Output Value Added Tax (16%)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {Number(selectedInvoice.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-4 text-base font-black text-indigo-950 border-t border-slate-200">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-indigo-600 text-lg">
                    KES {Number(selectedInvoice.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bank Remittance Instructions */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/70 text-xs text-indigo-950 space-y-1">
                <span className="font-bold block uppercase text-[10px] tracking-wider text-indigo-600">
                  Corporate Banking Remittance Details:
                </span>
                <p className="text-slate-600 font-medium">
                  Bank: <span className="font-bold text-slate-900">Kenya Commercial Bank (KCB)</span> • Branch: Industrial Area Nairobi
                </p>
                <p className="text-slate-600 font-medium">
                  Account Name: <span className="font-bold text-slate-900">Apex Logistics & Supply Chain Ltd</span> • A/C: <span className="font-mono font-bold text-slate-900">1289 4402 9182</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
