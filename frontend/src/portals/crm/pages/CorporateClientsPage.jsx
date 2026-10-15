import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Building,
  Briefcase,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Barcode,
  X,
  Check,
  Calculator,
} from 'lucide-react';

export const CorporateClientsPage = ({ onNavigate }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Client Modal
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    tax_pin: '',
    credit_limit: 1500000,
    payment_terms_days: 30,
  });
  const [addingClient, setAddingClient] = useState(false);

  // Credit Adjustment Modal
  const [adjustingClient, setAdjustingClient] = useState(null);
  const [newLimitInput, setNewLimitInput] = useState('');
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // Client Dossier Modal
  const [dossierClient, setDossierClient] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.WAREHOUSE_CRM.CLIENTS);
      const clientList = res.data?.results || res.data || [];
      setClients(clientList);
    } catch (err) {
      console.error('Failed to load corporate clients:', err);
      setError('Unable to synchronize corporate accounts from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      setAddingClient(true);
      const res = await apiClient.post(ENDPOINTS.WAREHOUSE_CRM.CLIENTS, newClient);
      setClients((prev) => [res.data, ...prev]);
      setShowAddClientModal(false);
      setNewClient({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        tax_pin: '',
        credit_limit: 1500000,
        payment_terms_days: 30,
      });
    } catch (err) {
      alert('Failed to register client: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAddingClient(false);
    }
  };

  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    if (!adjustingClient) return;
    try {
      setSubmittingCredit(true);
      const url = `${ENDPOINTS.WAREHOUSE_CRM.CLIENTS}${adjustingClient.id}/adjust_credit_limit/`;
      const res = await apiClient.post(url, {
        credit_limit: parseFloat(newLimitInput),
      });
      setClients((prev) =>
        prev.map((c) => (c.id === adjustingClient.id ? res.data : c))
      );
      setAdjustingClient(null);
    } catch (err) {
      // Fallback if endpoint is updating standard PATCH
      try {
        const patchUrl = `${ENDPOINTS.WAREHOUSE_CRM.CLIENTS}${adjustingClient.id}/`;
        const res = await apiClient.patch(patchUrl, {
          credit_limit: parseFloat(newLimitInput),
        });
        setClients((prev) =>
          prev.map((c) => (c.id === adjustingClient.id ? res.data : c))
        );
        setAdjustingClient(null);
      } catch (patchErr) {
        alert('Failed to update credit: ' + (patchErr.response?.data?.detail || patchErr.message));
      }
    } finally {
      setSubmittingCredit(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tax_pin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? c.is_active
        : !c.is_active;
    return matchesSearch && matchesStatus;
  });

  const totalCreditLimit = clients.reduce(
    (acc, c) => acc + parseFloat(c.credit_limit || 0),
    0
  );
  const totalOutstanding = clients.reduce(
    (acc, c) => acc + parseFloat(c.outstanding_balance || 0),
    0
  );
  const totalAvailable = Math.max(0, totalCreditLimit - totalOutstanding);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Corporate Accounts & Shipper Portfolio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                Brian Otieno (EMP-018)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Commercial haulage agreements, KRA Tax PIN validations & corporate credit line facilities
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('quotations')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>Freight Rate Cards</span>
          </button>
          <button
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Corporate Shipper</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Corporate Shippers
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{clients.length}</span>
            <span className="text-xs text-slate-500 font-medium">Contracted Clients</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            PostgreSQL Schema warehouse_crm.clients
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Credit Extended
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalCreditLimit / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-semibold">
            Corporate Haulage Facility Pool
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Receivables
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalOutstanding / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-semibold">
            Invoiced Shipments Pending Collection
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Credit Buffer
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalAvailable / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Available for New Dispatch Bookings
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, contact, KRA PIN..."
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
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Trading Accounts</option>
            <option value="INACTIVE">Credit Hold Accounts</option>
          </select>
        </div>
      </div>

      {/* Corporate Clients Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Corporate Accounts Registry ({filteredClients.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live enterprise consignees, manufacturer accounts & credit terms
            </p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('quotations')}
            className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span>Quote Freight for Shippers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Corporate Shipper</th>
                <th className="py-3 px-4">Commercial Contact</th>
                <th className="py-3 px-4">KRA Tax PIN</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-right">Credit Facility (KES)</th>
                <th className="py-3 px-4 text-right">Available Credit</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading corporate accounts from PostgreSQL...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No corporate accounts found matching current query.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const limit = parseFloat(client.credit_limit || 0);
                  const balance = parseFloat(client.outstanding_balance || 0);
                  const available = parseFloat(client.available_credit || Math.max(0, limit - balance));
                  const utilization = limit > 0 ? ((balance / limit) * 100).toFixed(0) : 0;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{client.company_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {client.id.substring(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-bold">{client.contact_person}</div>
                        <div className="text-[11px] text-slate-400">{client.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {client.tax_pin}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {client.payment_terms_days} Days Net
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        KES {limit.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-emerald-600">
                          KES {available.toLocaleString()}
                        </div>
                        <div className="w-24 ml-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilization > 80
                                ? 'bg-rose-500'
                                : utilization > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            client.is_active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              client.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{client.is_active ? 'Active' : 'On Hold'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setAdjustingClient(client);
                              setNewLimitInput(client.credit_limit);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Adjust Corporate Credit Facility"
                          >
                            Limit
                          </button>
                          <button
                            onClick={() => setDossierClient(client)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
                            title="View Shipper Dossier"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Corporate Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Onboard Corporate Haulage Shipper
                  </h3>
                  <p className="text-xs text-slate-500">
                    Brian Otieno (EMP-018) • Commercial CRM Desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Corporate Entity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unilever Kenya Ltd / Bidco Africa PLC"
                  value={newClient.company_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, company_name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. James Kariuki"
                    value={newClient.contact_person}
                    onChange={(e) =>
                      setNewClient({ ...newClient, contact_person: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P051123456Z"
                    value={newClient.tax_pin}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        tax_pin: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="logistics@unilever.com"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+254 700 000 000"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approved Credit Facility Limit (KES)
                  </label>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    required
                    value={newClient.credit_limit}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        credit_limit: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Terms (Days)
                  </label>
                  <select
                    value={newClient.payment_terms_days}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        payment_terms_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={15}>15 Days Net</option>
                    <option value={30}>30 Days Net</option>
                    <option value={45}>45 Days Net</option>
                    <option value={60}>60 Days Net</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingClient}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{addingClient ? 'Saving to Database...' : 'Register Corporate Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Credit Modal */}
      {adjustingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Adjust Credit Facility
              </h3>
              <button
                onClick={() => setAdjustingClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustCredit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800">
                  {adjustingClient.company_name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Current Limit: KES {parseFloat(adjustingClient.credit_limit).toLocaleString()} • Outstanding: KES {parseFloat(adjustingClient.outstanding_balance).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Credit Limit (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  required
                  value={newLimitInput}
                  onChange={(e) => setNewLimitInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingClient(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCredit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingCredit ? 'Updating...' : 'Save New Limit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipper Dossier Modal */}
      {dossierClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 font-mono">
                  Corporate Dossier • {dossierClient.tax_pin}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {dossierClient.company_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Commercial Haulage Agreement Partner
                </p>
              </div>
              <button
                onClick={() => setDossierClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Contact Person:
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {dossierClient.contact_person}
                  </div>
                  <div className="text-[11px] text-slate-500">{dossierClient.phone}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Payment Terms:
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {dossierClient.payment_terms_days} Days Net
                  </div>
                  <div className="text-[11px] text-slate-500">{dossierClient.email}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Total Credit Line:</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {parseFloat(dossierClient.credit_limit).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-amber-600">
                    KES {parseFloat(dossierClient.outstanding_balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Available Headroom:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    KES {parseFloat(dossierClient.available_credit).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDossierClient(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDossierClient(null);
                  if (onNavigate) onNavigate('quotations');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Generate Rate Quote</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
