import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Calculator,
  Briefcase,
  Building,
  DollarSign,
  TrendingUp,
  MapPin,
  Truck,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Barcode,
  Calendar,
  FileText,
  ChevronRight,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export const FreightQuotationsPage = ({ onNavigate }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [corridor, setCorridor] = useState('MOMBASA_NAIROBI');
  const [cargoType, setCargoType] = useState('CONTAINER_40FT');
  const [weightTonnes, setWeightTonnes] = useState(26);
  const [cargoValueKes, setCargoValueKes] = useState(4500000);
  const [includeInsurance, setIncludeInsurance] = useState(true);

  // Saved quotations
  const [quotations, setQuotations] = useState([
    {
      id: 'QT-2026-088',
      clientName: 'Unilever Kenya Ltd',
      corridor: 'Mombasa Port -> Nairobi ICD Hub',
      corridorCode: 'MOMBASA_NAIROBI',
      distanceKm: 485,
      cargoType: '40ft High Cube Container (FEU)',
      weightTonnes: 26,
      baseFreight: 145000,
      fuelSurcharge: 23200,
      kenhaLevy: 3500,
      insurance: 15750,
      vatAmount: 29992,
      totalAmount: 217442,
      transitEta: '18 Hours',
      status: 'ACCEPTED',
      createdDate: '2026-10-05',
      validUntil: '2026-11-04',
    },
    {
      id: 'QT-2026-089',
      clientName: 'Bidco Africa Ltd',
      corridor: 'Mombasa Port -> Thika Industrial Park',
      corridorCode: 'MOMBASA_THIKA',
      distanceKm: 520,
      cargoType: 'Bulk Edible Oil Liquid ISO Tank',
      weightTonnes: 28,
      baseFreight: 168000,
      fuelSurcharge: 26880,
      kenhaLevy: 3500,
      insurance: 21000,
      vatAmount: 35100,
      totalAmount: 254480,
      transitEta: '20 Hours',
      status: 'SENT',
      createdDate: '2026-10-07',
      validUntil: '2026-11-06',
    },
    {
      id: 'QT-2026-090',
      clientName: 'Bamburi Cement Ltd',
      corridor: 'Nairobi ICD -> Kisumu Lake Basin',
      corridorCode: 'NAIROBI_KISUMU',
      distanceKm: 350,
      cargoType: 'Bulk Palletized Clinker (Flatbed)',
      weightTonnes: 28,
      baseFreight: 115000,
      fuelSurcharge: 18400,
      kenhaLevy: 3500,
      insurance: 8750,
      vatAmount: 23304,
      totalAmount: 168954,
      transitEta: '12 Hours',
      status: 'UNDER_NEGOTIATION',
      createdDate: '2026-10-08',
      validUntil: '2026-11-07',
    },
    {
      id: 'QT-2026-091',
      clientName: 'Brookside Dairy Ltd',
      corridor: 'Mombasa Port -> Kampala (Uganda Transit)',
      corridorCode: 'MOMBASA_KAMPALA',
      distanceKm: 1170,
      cargoType: '40ft Refrigerated Reefer Container',
      weightTonnes: 24,
      baseFreight: 385000,
      fuelSurcharge: 61600,
      kenhaLevy: 8500,
      insurance: 35000,
      vatAmount: 78416,
      totalAmount: 568516,
      transitEta: '48 Hours',
      status: 'SENT',
      createdDate: '2026-10-08',
      validUntil: '2026-11-07',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview / Print Modal
  const [previewQuote, setPreviewQuote] = useState(null);

  // Corridor pricing matrix config
  const CORRIDORS = {
    MOMBASA_NAIROBI: {
      name: 'Mombasa Port -> Nairobi ICD Hub',
      distanceKm: 485,
      baseRatePerTonne: 5200,
      transitEta: '18 Hours',
      kenhaLevy: 3500,
    },
    MOMBASA_THIKA: {
      name: 'Mombasa Port -> Thika Industrial Park',
      distanceKm: 520,
      baseRatePerTonne: 5600,
      transitEta: '20 Hours',
      kenhaLevy: 3500,
    },
    NAIROBI_MALABA: {
      name: 'Nairobi ICD -> Malaba Border (Uganda)',
      distanceKm: 450,
      baseRatePerTonne: 4800,
      transitEta: '16 Hours',
      kenhaLevy: 3500,
    },
    NAIROBI_KISUMU: {
      name: 'Nairobi ICD -> Kisumu Lake Basin',
      distanceKm: 350,
      baseRatePerTonne: 4100,
      transitEta: '12 Hours',
      kenhaLevy: 3500,
    },
    MOMBASA_KAMPALA: {
      name: 'Mombasa Port -> Kampala (Uganda Transit)',
      distanceKm: 1170,
      baseRatePerTonne: 13500,
      transitEta: '48 Hours',
      kenhaLevy: 8500,
    },
  };

  const CARGO_RATES = {
    CONTAINER_20FT: { name: '20ft Standard Container (TEU)', multiplier: 0.85 },
    CONTAINER_40FT: { name: '40ft High Cube Container (FEU)', multiplier: 1.0 },
    REEFER_40FT: { name: '40ft Refrigerated Reefer Container', multiplier: 1.4 },
    BULK_FLATBED: { name: 'Bulk Palletized / Loose Cargo Flatbed', multiplier: 0.95 },
    ISO_TANK: { name: 'Liquid Bulk ISO Chemical/Oil Tank', multiplier: 1.25 },
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.WAREHOUSE_CRM.CLIENTS);
        const list = res.data?.results || res.data || [];
        setClients(list);
        if (list.length > 0) {
          setSelectedClient(list[0].company_name);
        }
      } catch (err) {
        console.warn('Using client defaults');
      }
    };
    loadClients();
  }, []);

  // Compute live quote based on inputs
  const currentCorridor = CORRIDORS[corridor] || CORRIDORS.MOMBASA_NAIROBI;
  const currentCargo = CARGO_RATES[cargoType] || CARGO_RATES.CONTAINER_40FT;

  const rawBase = currentCorridor.baseRatePerTonne * weightTonnes * currentCargo.multiplier;
  const computedBaseFreight = Math.round(rawBase);
  const computedFuelSurcharge = Math.round(computedBaseFreight * 0.16); // EPRA 16% Fuel Escalation
  const computedKenhaLevy = currentCorridor.kenhaLevy;
  const computedInsurance = includeInsurance
    ? Math.round((parseFloat(cargoValueKes) || 0) * 0.0035) // 0.35% Marine / Goods in Transit
    : 0;
  const subtotal = computedBaseFreight + computedFuelSurcharge + computedKenhaLevy + computedInsurance;
  const computedVat = Math.round(subtotal * 0.16);
  const computedTotal = subtotal + computedVat;

  const handleGenerateQuote = (e) => {
    e.preventDefault();
    const nextSeq = quotations.length + 92;
    const newQ = {
      id: `QT-2026-0${nextSeq}`,
      clientName: selectedClient || 'Corporate Haulage Client',
      corridor: currentCorridor.name,
      corridorCode: corridor,
      distanceKm: currentCorridor.distanceKm,
      cargoType: currentCargo.name,
      weightTonnes: parseFloat(weightTonnes),
      baseFreight: computedBaseFreight,
      fuelSurcharge: computedFuelSurcharge,
      kenhaLevy: computedKenhaLevy,
      insurance: computedInsurance,
      vatAmount: computedVat,
      totalAmount: computedTotal,
      transitEta: currentCorridor.transitEta,
      status: 'SENT',
      createdDate: new Date().toISOString().split('T')[0],
      validUntil: '2026-11-25',
    };
    setQuotations([newQ, ...quotations]);
    setPreviewQuote(newQ);
  };

  const handleAcceptQuote = (quoteId) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'ACCEPTED' } : q))
    );
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.corridor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-600/10 text-cyan-600 rounded-2xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Freight Rate Cards & Quotations Desk
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-cyan-100 text-cyan-800 border border-cyan-200">
                Commercial Pricing Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              East Africa transit corridors, EPRA fuel escalation surcharge index & KeNHA axle compliant rate card
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('clients')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Corporate Accounts</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('crm_dashboard')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>CRM Overview</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Interactive Rate Calculator) & Right (Active Corridor Matrix) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Dynamic Rate Calculator Form */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Instant Freight Quotation Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Calculates haulage tariff, EPRA fuel index, transit levy & insurance
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold font-mono border border-emerald-200">
              EPRA Fuel: 16% Index
            </span>
          </div>

          <form onSubmit={handleGenerateQuote} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Consignee / Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {clients.length > 0 ? (
                    clients.map((c) => (
                      <option key={c.id} value={c.company_name}>
                        {c.company_name} ({c.tax_pin})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Unilever Kenya Ltd">Unilever Kenya Ltd</option>
                      <option value="Bidco Africa Ltd">Bidco Africa Ltd</option>
                      <option value="Brookside Dairy Ltd">Brookside Dairy Ltd</option>
                      <option value="Bamburi Cement Ltd">Bamburi Cement Ltd</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Haulage Transit Corridor
                </label>
                <select
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="MOMBASA_NAIROBI">
                    Mombasa Port -&gt; Nairobi ICD (485 km)
                  </option>
                  <option value="MOMBASA_THIKA">
                    Mombasa Port -&gt; Thika Industrial (520 km)
                  </option>
                  <option value="NAIROBI_MALABA">
                    Nairobi ICD -&gt; Malaba Border (450 km)
                  </option>
                  <option value="NAIROBI_KISUMU">
                    Nairobi ICD -&gt; Kisumu Lake Basin (350 km)
                  </option>
                  <option value="MOMBASA_KAMPALA">
                    Mombasa -&gt; Kampala Transit (1,170 km)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo Specification
                </label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="CONTAINER_40FT">40ft High Cube (FEU)</option>
                  <option value="CONTAINER_20FT">20ft Standard (TEU)</option>
                  <option value="REEFER_40FT">40ft Refrigerated Reefer</option>
                  <option value="BULK_FLATBED">Bulk Palletized Flatbed</option>
                  <option value="ISO_TANK">Liquid ISO Chemical Tank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Net Cargo Weight (Tonnes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  step="0.5"
                  value={weightTonnes}
                  onChange={(e) => setWeightTonnes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Declared Cargo Value (KES)
                </label>
                <input
                  type="number"
                  min="500000"
                  step="100000"
                  value={cargoValueKes}
                  onChange={(e) => setCargoValueKes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="ins-check"
                checked={includeInsurance}
                onChange={(e) => setIncludeInsurance(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
              />
              <label htmlFor="ins-check" className="text-xs font-semibold text-slate-700">
                Include In-Transit Goods & Marine Insurance Rider (0.35% declared value)
              </label>
            </div>

            {/* Instant Tariff Breakdown Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Haulage Freight ({weightTonnes} Tonnes @ rate card):</span>
                <span className="font-mono font-bold text-slate-800">
                  KES {computedBaseFreight.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>EPRA Fuel Escalation Surcharge (16% Index):</span>
                <span className="font-mono font-bold text-slate-800">
                  KES {computedFuelSurcharge.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>KeNHA Highway Axle & Transit Levy:</span>
                <span className="font-mono font-bold text-slate-800">
                  KES {computedKenhaLevy.toLocaleString()}
                </span>
              </div>
              {includeInsurance && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Goods In-Transit Comprehensive Rider (0.35%):</span>
                  <span className="font-mono font-bold text-slate-800">
                    KES {computedInsurance.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Value Added Tax (16% VAT):</span>
                <span className="font-mono font-bold text-slate-800">
                  KES {computedVat.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-800">
                    Total Estimated Freight Charge
                  </span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    KES {computedTotal.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div className="font-semibold text-emerald-700">
                    Guaranteed ETA: {currentCorridor.transitEta}
                  </div>
                  <div>Valid 30 Days</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue & Save Formal Quotation</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Master Corridor Tariffs & Benchmark Cards */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Standard Corridor Tariffs (FY2026)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">KeNHA Compliant</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(CORRIDORS).map(([key, data]) => (
                <div
                  key={key}
                  className={`p-3 rounded-2xl border transition text-xs ${
                    corridor === key
                      ? 'bg-cyan-50/70 border-cyan-300'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{data.name}</span>
                    <span className="font-mono font-black text-cyan-700">
                      KES {data.baseRatePerTonne.toLocaleString()}/T
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Distance: {data.distanceKm} KM</span>
                    <span>Transit Window: {data.transitEta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-cyan-950 rounded-3xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-extrabold tracking-tight">
                Transit Guarantee & Cargo Safety SLA
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All quotes are governed by Apex Logistics Real-time GPS Telemetry tracking, calibrated digital weighbridge gross weight certificates, and 24/7 highway escort rapid response.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-cyan-300 border-t border-slate-800">
              <span>Account Manager: Brian Otieno</span>
              <span>Commercial Desk: EMP-018</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations Registry Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Issued Freight Quotations ({filteredQuotes.length})
            </h2>
            <p className="text-xs text-slate-500">
              Commercial proposals transmitted to manufacturing & FMCG shippers
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent to Shipper</option>
              <option value="ACCEPTED">Accepted / Booking Created</option>
              <option value="UNDER_NEGOTIATION">Under Negotiation</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Quote Ref</th>
                <th className="py-3 px-4">Shipper Client</th>
                <th className="py-3 px-4">Transit Corridor & Cargo</th>
                <th className="py-3 px-4 text-center">Tonnage</th>
                <th className="py-3 px-4 text-center">Transit ETA</th>
                <th className="py-3 px-4 text-right">Total Freight (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                    <div>{q.id}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Valid to: {q.validUntil}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span>{q.clientName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-800 truncate">
                      {q.corridor}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {q.cargoType}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                    {q.weightTonnes} T
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-600">
                    {q.transitEta}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                    KES {q.totalAmount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        q.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : q.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {q.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3" />}
                      {q.status === 'SENT' && <Clock className="w-3 h-3" />}
                      {q.status === 'UNDER_NEGOTIATION' && <AlertCircle className="w-3 h-3" />}
                      <span>{q.status.replace('_', ' ')}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setPreviewQuote(q)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        title="Print Formal Quotation Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {q.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => handleAcceptQuote(q.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer"
                          title="Client Approved Quotation"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Freight Quotation Modal */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black text-sm">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      APEX LOGISTICS & SUPPLY CHAIN LTD
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Commercial Freight & Haulage Tariff
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  Apex Logistics HQ • Embakasi ICD Road, Nairobi, Kenya<br />
                  KRA PIN: <span className="font-mono font-bold text-slate-800">P051987654Z</span> • Tel: +254 20 690 1000
                </div>
              </div>

              <div className="text-right">
                <div className="px-3 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-mono font-black inline-block">
                  FREIGHT QUOTATION
                </div>
                <div className="mt-1 text-sm font-black font-mono text-slate-900">
                  {previewQuote.id}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued: {previewQuote.createdDate} • Valid to: {previewQuote.validUntil}
                </div>
              </div>
            </div>

            {/* Shipper & Route Info */}
            <div className="grid grid-cols-2 gap-4 my-5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Shipper / Consignee:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {previewQuote.clientName}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Commercial Lead: Brian Otieno (EMP-018)
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Corridor & Transit Schedule:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {previewQuote.corridor}
                </div>
                <div className="text-emerald-700 font-semibold text-[11px]">
                  Guaranteed ETA: {previewQuote.transitEta} ({previewQuote.distanceKm} KM)
                </div>
              </div>
            </div>

            {/* Fee Schedule Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tariff Component</th>
                    <th className="py-2.5 px-3">Specification / Basis</th>
                    <th className="py-2.5 px-3 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      Base Transit Haulage
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {previewQuote.cargoType} ({previewQuote.weightTonnes} T)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {previewQuote.baseFreight.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      EPRA Fuel Escalation Surcharge
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      16% Floating Monthly Index
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {previewQuote.fuelSurcharge.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      KeNHA Highway Axle Transit Levy
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      National Highway Infrastructure Surcharge
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {previewQuote.kenhaLevy.toLocaleString()}
                    </td>
                  </tr>
                  {previewQuote.insurance > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Goods In-Transit Cargo Insurance
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        0.35% Marine & Hijack Comprehensive Rider
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {previewQuote.insurance.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan="2" className="py-2 px-3 text-right text-slate-600">
                      Value Added Tax (16% KRA VAT):
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      KES {previewQuote.vatAmount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="text-sm bg-cyan-50 text-cyan-900">
                    <td colSpan="2" className="py-2.5 px-3 text-right font-black">
                      Total Quotation Payable (KES):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono">
                      KES {previewQuote.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Commercial Sign Off */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Prepared & Authorized By:
                </span>
                <div className="mt-4 border-b border-slate-300 pb-1 font-bold text-slate-800">
                  Brian Otieno
                </div>
                <div className="text-[10px] text-slate-500">
                  Commercial Accounts Manager (EMP-018)
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Shipper Acceptance Signature:
                </span>
                <div className="mt-4 border-b border-slate-300 pb-1 font-bold text-slate-800">
                  Authorized Shipper Signatory
                </div>
                <div className="text-[10px] text-slate-500">
                  Terms: Net 30 Days from Certified Waybill POD
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Barcode className="w-5 h-5" />
                <span className="font-mono">{previewQuote.id}-APEX-RATE</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewQuote(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Formal Quote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
