import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Briefcase,
  Building,
  Calculator,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  FileText,
} from 'lucide-react';

import { CorporateClientsPage } from './CorporateClientsPage';
import { FreightQuotationsPage } from './FreightQuotationsPage';

export const CRMDashboard = ({ activeSubSection = 'crm_dashboard', onNavigate }) => {
  if (activeSubSection === 'clients') {
    return <CorporateClientsPage onNavigate={onNavigate} />;
  }
  if (activeSubSection === 'quotations') {
    return <FreightQuotationsPage onNavigate={onNavigate} />;
  }
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Rate calculator state
  const [corridor, setCorridor] = useState('MOMBASA_NAIROBI');
  const [cargoType, setCargoType] = useState('CONTAINER');
  const [weightTonnes, setWeightTonnes] = useState(24);
  const [insuranceSelected, setInsuranceSelected] = useState(true);
  const [calculatedQuote, setCalculatedQuote] = useState(null);

  // New Client Modal
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    tax_pin: '',
    credit_limit: 1000000,
    payment_terms_days: 30,
  });
  const [addingClient, setAddingClient] = useState(false);

  // Quotation Preview Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.WAREHOUSE_CRM.CLIENTS);
      setClients(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Failed to load corporate clients:', err);
      setError('Unable to fetch live client portfolio from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Corridors rate card definition
  const CORRIDORS = {
    MOMBASA_NAIROBI: {
      name: 'Mombasa Port Gate -> Nairobi Central ICD',
      distanceKm: 485,
      baseFreightKes: 95000,
      ratePerTonneKes: 1800,
    },
    NAIROBI_KISUMU: {
      name: 'Nairobi ICD Hub -> Kisumu Regional CFS',
      distanceKm: 350,
      baseFreightKes: 82000,
      ratePerTonneKes: 1600,
    },
    NAKURU_MOMBASA: {
      name: 'Nakuru Milling -> Mombasa Port Export Gate',
      distanceKm: 640,
      baseFreightKes: 110000,
      ratePerTonneKes: 1950,
    },
    ELDORET_MALABA: {
      name: 'Eldoret Logistics Hub -> Malaba Border Post',
      distanceKm: 130,
      baseFreightKes: 48000,
      ratePerTonneKes: 1200,
    },
  };

  const handleCalculateRate = () => {
    const corr = CORRIDORS[corridor] || CORRIDORS.MOMBASA_NAIROBI;
    const base = corr.baseFreightKes;
    const weightFee = (parseFloat(weightTonnes) || 1) * corr.ratePerTonneKes;
    const cargoMultiplier = cargoType === 'COLD_CHAIN' ? 1.35 : cargoType === 'HAZMAT' ? 1.4 : 1.0;
    const subtotal = (base + weightFee) * cargoMultiplier;
    const fuelSurcharge = subtotal * 0.08; // 8% EPRA fuel index adjustment
    const insurance = insuranceSelected ? subtotal * 0.025 : 0; // 2.5% transit goods in transit
    const vat = (subtotal + fuelSurcharge) * 0.16; // 16% KRA VAT
    const grandTotal = subtotal + fuelSurcharge + insurance + vat;

    const quote = {
      quoteNumber: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      corridor: corr.name,
      distanceKm: corr.distanceKm,
      cargoType,
      weightTonnes,
      subtotal: Math.round(subtotal),
      fuelSurcharge: Math.round(fuelSurcharge),
      insurance: Math.round(insurance),
      vat: Math.round(vat),
      grandTotal: Math.round(grandTotal),
      validDays: 14,
      date: new Date().toISOString().split('T')[0],
    };
    setCalculatedQuote(quote);
  };

  useEffect(() => {
    handleCalculateRate();
  }, [corridor, cargoType, weightTonnes, insuranceSelected]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      setAddingClient(true);
      const res = await apiClient.post(ENDPOINTS.WAREHOUSE_CRM.CLIENTS, newClient);
      setClients([...clients, res.data]);
      setShowAddClientModal(false);
      setNewClient({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        tax_pin: '',
        credit_limit: 1000000,
        payment_terms_days: 30,
      });
    } catch (err) {
      alert('Failed to register corporate client: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAddingClient(false);
    }
  };

  // KPIs
  const totalCreditLimit = clients.reduce((acc, c) => acc + parseFloat(c.credit_limit || 0), 0);
  const totalOutstanding = clients.reduce((acc, c) => acc + parseFloat(c.outstanding_balance || 0), 0);
  const totalAvailableCredit = totalCreditLimit - totalOutstanding;

  const filteredClients = clients.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tax_pin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-violet-600/10 text-violet-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              CRM & Freight Rate Quotations Desk
            </h1>
            <p className="text-xs text-slate-500">
              Corporate Accounts • Highway Corridor Rate Matrix • Volume Quotas & Billing Limits
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate && onNavigate('clients')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Corporate Accounts</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('quotations')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-violet-600" />
            <span>Rate Cards</span>
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Shipper</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Key Corporate Accounts
            </span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{clients.length}</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Shippers</span>
          </div>
          <div className="mt-2 text-[11px] text-violet-600 font-semibold">
            Unilever, Bidco, Brookside, Bamburi
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Credit Portfolio
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalCreditLimit / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Approved Enterprise Credit Facility
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Invoiced AR
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalOutstanding / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Within 30-45 Days Payment Terms
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Credit Buffer
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalAvailableCredit / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Available For Immediate Consignment Booking
          </div>
        </div>
      </div>

      {/* Main Grid: Section 1 (Client Directory) & Section 2 (Rate Quotation Calculator) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Corporate Client Directory */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-violet-600" />
                <span>Corporate Shipper & Consignee Accounts</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Contract credit limits and real-time receivables ledger status.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search shipper or PIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none w-44"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredClients.map((client) => {
              const limit = parseFloat(client.credit_limit || 0);
              const balance = parseFloat(client.outstanding_balance || 0);
              const available = limit - balance;
              const utilizationPercent = Math.min(100, Math.round((balance / (limit || 1)) * 100));

              return (
                <div
                  key={client.id}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-violet-400 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {client.company_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">
                        KRA PIN: {client.tax_pin} • Terms: {client.payment_terms_days} Days
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Account
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/70 text-center font-mono">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Credit Limit
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        KES {Number(limit).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-x border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Outstanding
                      </span>
                      <span className="text-xs font-bold text-amber-700">
                        KES {Number(balance).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-violet-600 block">
                        Available Credit
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        KES {Number(available).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Credit utilization bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Credit Line Utilization</span>
                      <span className="font-bold">{utilizationPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilizationPercent > 80
                            ? 'bg-rose-500'
                            : utilizationPercent > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${utilizationPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Contact: <strong className="text-slate-700">{client.contact_person}</strong></span>
                    <span className="font-mono text-[10px]">{client.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Interactive Freight Rate Card & Haulage Quotation Calculator */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-violet-600" />
              <span>Haulage Rate Card & Quotation Builder</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live transit pricing engine with corridor distance and fuel surcharge.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Highway Transit Corridor
              </label>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500"
              >
                {Object.entries(CORRIDORS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name} ({item.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cargo Classification
              </label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-500"
              >
                <option value="CONTAINER">Standard 20ft/40ft Dry Container FMCG</option>
                <option value="BULK_GRAIN">Bulk Agricultural Feed / Grain</option>
                <option value="COLD_CHAIN">Refrigerated Fresh Dairy / Pharma (+35%)</option>
                <option value="HAZMAT">Industrial Chemicals & Fuel (+40%)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cargo Weight
                </label>
                <span className="font-mono font-black text-xs text-violet-700">
                  {weightTonnes} Metric Tonnes
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="32"
                step="1"
                value={weightTonnes}
                onChange={(e) => setWeightTonnes(e.target.value)}
                className="w-full accent-violet-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="insCheck"
                checked={insuranceSelected}
                onChange={(e) => setInsuranceSelected(e.target.checked)}
                className="w-4 h-4 rounded-md accent-violet-600"
              />
              <label htmlFor="insCheck" className="text-xs text-slate-700 font-medium">
                Include Comprehensive Goods-in-Transit (GIT) Insurance (2.5%)
              </label>
            </div>

            {/* Live Pricing Breakdown Card */}
            {calculatedQuote && (
              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-violet-200/60">
                  <span className="font-bold text-violet-900">Base Freight Rate:</span>
                  <span className="font-mono font-bold text-slate-800">
                    KES {calculatedQuote.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">EPRA Fuel Index Surcharge (8%):</span>
                  <span className="font-mono text-slate-800">
                    KES {calculatedQuote.fuelSurcharge.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Transit Insurance:</span>
                  <span className="font-mono text-slate-800">
                    KES {calculatedQuote.insurance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">KRA 16% VAT:</span>
                  <span className="font-mono text-slate-800">
                    KES {calculatedQuote.vat.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-violet-200 text-sm">
                  <span className="font-black text-violet-950">Grand Total Quote:</span>
                  <span className="font-mono font-black text-violet-900 text-base">
                    KES {calculatedQuote.grandTotal.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="w-full mt-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Issue Formal Rate Quotation</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal: Onboard Corporate Client */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Onboard Enterprise Shipping Client
                </h3>
              </div>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kakuzi PLC"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient.contact_person}
                    onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="P051..."
                    value={newClient.tax_pin}
                    onChange={(e) => setNewClient({ ...newClient, tax_pin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+254 7..."
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Limit (KES)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    required
                    value={newClient.credit_limit}
                    onChange={(e) => setNewClient({ ...newClient, credit_limit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Terms (Days)
                  </label>
                  <input
                    type="number"
                    required
                    value={newClient.payment_terms_days}
                    onChange={(e) => setNewClient({ ...newClient, payment_terms_days: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingClient}
                  className="flex-1 py-2.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {addingClient ? 'Saving...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Rate Quotation Slip */}
      {showQuoteModal && calculatedQuote && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Formal Freight Rate Quotation
                </h3>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN LTD</p>
                  <p className="text-[10px] text-slate-500">Commercial Sales & Freight Accounts Desk</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-violet-800">{calculatedQuote.quoteNumber}</p>
                  <p className="text-[10px] text-slate-500">Date: {calculatedQuote.date}</p>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>Corridor: <strong>{calculatedQuote.corridor}</strong></p>
                <p>Weight: <strong>{calculatedQuote.weightTonnes} Metric Tonnes</strong> ({calculatedQuote.cargoType})</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Base Corridor Haulage:</span>
                  <span className="font-bold">KES {calculatedQuote.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fuel Index Surcharge:</span>
                  <span>KES {calculatedQuote.fuelSurcharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transit Insurance (GIT):</span>
                  <span>KES {calculatedQuote.insurance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>16% VAT:</span>
                  <span>KES {calculatedQuote.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-violet-950 text-sm">
                  <span>Total Quotation:</span>
                  <span>KES {calculatedQuote.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                Valid for {calculatedQuote.validDays} days from date of issue. Commercial Lead: Brian Otieno (EMP-018)
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
