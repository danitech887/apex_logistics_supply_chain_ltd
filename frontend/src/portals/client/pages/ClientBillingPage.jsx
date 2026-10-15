import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Receipt,
  FileText,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Download,
  Building,
  Calendar,
  Barcode,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Truck,
} from 'lucide-react';

export const ClientBillingPage = ({ onNavigate }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview / Print Tax Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Statement summary
  const [statementModal, setStatementModal] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.FINANCE.INVOICES);
      const list = res.data?.results || res.data || [];
      // Filter for Unilever or display list
      setInvoices(list);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      // Fallback demo enterprise invoices
      setInvoices([
        {
          id: 'INV-2026-081',
          invoice_number: 'INV-2026-081',
          client_name: 'Unilever Kenya Ltd',
          waybill_number: 'WB-2026-1049',
          corridor: 'Mombasa Port -> Nairobi ICD Hub',
          subtotal: 187450,
          tax_amount: 29992,
          total_amount: 217442,
          status: 'PAID',
          issue_date: '2026-10-06',
          due_date: '2026-11-05',
          payment_reference: 'EFT-SCB-998821',
        },
        {
          id: 'INV-2026-082',
          invoice_number: 'INV-2026-082',
          client_name: 'Unilever Kenya Ltd',
          waybill_number: 'WB-2026-1050',
          corridor: 'Mombasa Port -> Nairobi ICD Hub',
          subtotal: 187450,
          tax_amount: 29992,
          total_amount: 217442,
          status: 'SENT',
          issue_date: '2026-10-07',
          due_date: '2026-11-06',
          payment_reference: null,
        },
        {
          id: 'INV-2026-083',
          invoice_number: 'INV-2026-083',
          client_name: 'Unilever Kenya Ltd',
          waybill_number: 'WB-2026-1051',
          corridor: 'Nairobi ICD Hub -> Malaba Border',
          subtotal: 145000,
          tax_amount: 23200,
          total_amount: 168200,
          status: 'SENT',
          issue_date: '2026-10-08',
          due_date: '2026-11-07',
          payment_reference: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const invNum = inv.invoice_number || inv.id || '';
    const matchesSearch =
      invNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.waybill_number && inv.waybill_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce(
    (acc, inv) => acc + parseFloat(inv.total_amount || 0),
    0
  );
  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Freight Invoices & Account Statements Desk
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                E-TIMS Tax Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Corporate billing statements, KRA E-TIMS tax invoices & electronic remittance reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('shipments')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Active Shipments & POD</span>
          </button>
          <button
            onClick={() => setStatementModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download Statement</span>
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced (YTD)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalBilled / 1000).toLocaleString()}k
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Across {invoices.length} Corporate Haulage Waybills
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Settled / Paid
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono text-emerald-700">
              KES {(totalPaid / 1000).toLocaleString()}k
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Reconciled via Corporate EFT
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono text-amber-700">
              KES {(totalOutstanding / 1000).toLocaleString()}k
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-semibold">
            Net 30 Days Credit Facility
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Credit Facility
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES 2.50M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-semibold">
            Available Headroom: KES {((2500000 - totalOutstanding) / 1000).toLocaleString()}k
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, waybill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Status:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Invoices</option>
            <option value="SENT">Pending Payment (Sent)</option>
            <option value="PAID">Paid / Cleared</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Tax Invoices & Billing Schedule ({filteredInvoices.length})
            </h2>
            <p className="text-xs text-slate-500">
              Authenticated electronic tax invoices generated for Unilever Kenya Ltd
            </p>
          </div>
          <button
            onClick={() => setStatementModal(true)}
            className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span>Account Statement Summary</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Waybill & Route Details</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Freight Subtotal</th>
                <th className="py-3 px-4 text-right">VAT (16%)</th>
                <th className="py-3 px-4 text-right">Total Payable (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                    <div>{inv.invoice_number || inv.id}</div>
                    <div className="text-[10px] text-slate-400 font-sans font-normal">
                      Issued: {inv.issue_date || '2026-10-06'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-emerald-800 font-bold">
                      {inv.waybill_number || 'WB-2026-1049'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {inv.corridor || 'Mombasa Port -> Nairobi ICD Hub'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {inv.due_date || '2026-11-05'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    KES {parseFloat(inv.subtotal || 187450).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    KES {parseFloat(inv.tax_amount || 29992).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                    KES {parseFloat(inv.total_amount || 217442).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status === 'PAID' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{inv.status === 'PAID' ? 'Paid' : 'Pending Payment'}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border border-blue-200 ml-auto cursor-pointer"
                      title="View Official E-TIMS Tax Invoice"
                    >
                      <Printer className="w-3 h-3" />
                      <span>E-TIMS Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable E-TIMS Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      APEX LOGISTICS & SUPPLY CHAIN LTD
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      KRA E-TIMS Compliant Tax Invoice
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  Apex Logistics HQ • Embakasi ICD Road, Nairobi, Kenya<br />
                  KRA PIN: <span className="font-mono font-bold text-slate-800">P051987654Z</span> • VAT: 16%
                </div>
              </div>

              <div className="text-right">
                <div className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-mono font-black inline-block">
                  TAX INVOICE
                </div>
                <div className="mt-1 text-sm font-black font-mono text-slate-900">
                  {selectedInvoice.invoice_number || selectedInvoice.id}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued: {selectedInvoice.issue_date || '2026-10-06'} • Due: {selectedInvoice.due_date || '2026-11-05'}
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 my-5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Billed To Consignee:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  Unilever Kenya Ltd
                </div>
                <div className="text-slate-600 text-[11px]">
                  KRA PIN: <span className="font-mono font-bold">P051123456Z</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Commercial Contact: James Kariuki
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Payment Status:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedInvoice.status === 'PAID' ? 'SETTLED' : 'PENDING PAYMENT'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Waybill Ref: {selectedInvoice.waybill_number || 'WB-2026-1049'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Corridor & Waybill</th>
                    <th className="py-2.5 px-3 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        Heavy Haulage Freight Transit Service
                      </div>
                      <div className="text-[11px] text-slate-500">
                        40ft Container • Weighbridge Verified Tare & Gross
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {selectedInvoice.corridor || 'Mombasa Port -> Nairobi ICD Hub'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      KES {parseFloat(selectedInvoice.subtotal || 187450).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan="2" className="py-2 px-3 text-right text-slate-600">
                      Subtotal (Net of Tax):
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      KES {parseFloat(selectedInvoice.subtotal || 187450).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="py-2 px-3 text-right text-slate-600">
                      VAT (16% Kenya Standard Rate):
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      KES {parseFloat(selectedInvoice.tax_amount || 29992).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="text-sm bg-blue-50 text-blue-900">
                    <td colSpan="2" className="py-2.5 px-3 text-right font-black">
                      Total Invoice Payable (KES):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono">
                      KES {parseFloat(selectedInvoice.total_amount || 217442).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Remittance & Bank Instructions */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">
                Bank Remittance Details (EFT / RTGS):
              </span>
              <div className="text-slate-800 font-medium">
                Bank: Standard Chartered Bank Kenya • Branch: Kenyatta Avenue Nairobi<br />
                Account Name: Apex Logistics & Supply Chain Ltd • Acc #: <span className="font-mono font-bold">0100234567800</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Barcode className="w-5 h-5" />
                <span className="font-mono">{selectedInvoice.id}-ETIMS-KE</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print E-TIMS Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Statement Modal */}
      {statementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 font-mono">
                  Monthly Account Statement
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Unilever Kenya Ltd • Statement of Account
                </h3>
              </div>
              <button
                onClick={() => setStatementModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Billed YTD:</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {totalBilled.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Settled via EFT:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    KES {totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-800">Current Outstanding:</span>
                  <span className="font-mono text-amber-700">
                    KES {totalOutstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStatementModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
