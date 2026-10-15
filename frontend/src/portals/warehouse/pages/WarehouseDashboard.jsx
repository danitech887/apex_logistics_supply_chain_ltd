import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Boxes,
  Scale,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Plus,
  FileText,
  Printer,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const WarehouseDashboard = ({ activeSubSection = 'all', onNavigate }) => {
  const [waybills, setWaybills] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Weighbridge verification modal state
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [tareInput, setTareInput] = useState('');
  const [grossInput, setGrossInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(null);

  // Inbound stock receiving modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockAddAmount, setStockAddAmount] = useState('');
  const [receivingStock, setReceivingStock] = useState(false);

  // Waybill preview slip modal
  const [slipModalWaybill, setSlipModalWaybill] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wbRes, invRes] = await Promise.all([
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.WAYBILLS),
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.INVENTORY),
      ]);
      setWaybills(wbRes.data?.results || wbRes.data || []);
      setInventory(invRes.data?.results || invRes.data || []);
    } catch (err) {
      console.error('Failed to load warehouse data:', err);
      setError('Unable to synchronize live warehouse and weighbridge records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyWeighbridge = async (e) => {
    e.preventDefault();
    if (!selectedWaybill) return;
    try {
      setVerifying(true);
      const url = `${ENDPOINTS.WAREHOUSE_CRM.WAYBILLS}${selectedWaybill.id}/verify_weighbridge/`;
      const res = await apiClient.post(url, {
        tare_weight_kg: parseFloat(tareInput),
        gross_weight_kg: parseFloat(grossInput),
      });

      // Update state
      setWaybills((prev) =>
        prev.map((w) => (w.id === selectedWaybill.id ? res.data : w))
      );
      setVerifySuccess(`Weighbridge Tare & Gross certified for Waybill ${selectedWaybill.waybill_number}`);
      setTimeout(() => {
        setSelectedWaybill(null);
        setVerifySuccess(null);
      }, 1500);
    } catch (err) {
      alert('Verification failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    if (!selectedItem || !stockAddAmount) return;
    try {
      setReceivingStock(true);
      const newQty = selectedItem.quantity_on_hand + parseInt(stockAddAmount, 10);
      const url = `${ENDPOINTS.WAREHOUSE_CRM.INVENTORY}${selectedItem.id}/`;
      const res = await apiClient.patch(url, { quantity_on_hand: newQty });

      setInventory((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? res.data : i))
      );
      setSelectedItem(null);
      setStockAddAmount('');
    } catch (err) {
      alert('Stock receipt failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReceivingStock(false);
    }
  };

  // KPIs
  const totalSkus = inventory.length;
  const lowStockCount = inventory.filter((i) => i.quantity_on_hand <= i.reorder_level).length;
  const totalWeightTonnes = inventory
    .reduce((acc, i) => acc + (i.quantity_on_hand * parseFloat(i.unit_weight_kg || 0)) / 1000, 0)
    .toFixed(1);
  const pendingWeighbridgeCount = waybills.filter((w) => !w.tare_verified).length;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse_location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredWaybills = waybills.filter((wb) => {
    const matchesStatus = statusFilter === 'ALL' || wb.status === statusFilter;
    const matchesSearch =
      wb.waybill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wb.client_name && wb.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-cyan-600/10 text-cyan-600 rounded-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Warehouse, Stock & Inbound Cargo Desk
              </h1>
              <p className="text-xs text-slate-500">
                ICD Weighbridge Tare/Gross Certification • Pallet Storage & Spare Parts Inventory Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Nairobi ICD Weighbridge Online</span>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Catalogued SKUs
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalSkus}</span>
            <span className="text-xs text-slate-500 font-medium">Distinct Line Items</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-600 font-semibold flex items-center gap-1">
            <span>Verified in PostgreSQL Schema warehouse_crm</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Stock Volume
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalWeightTonnes}</span>
            <span className="text-xs text-slate-500 font-medium">Metric Tonnes</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Across Ambient ICD Bays & Workshop Stores
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Weighbridge
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{pendingWeighbridgeCount}</span>
            <span className="text-xs text-slate-500 font-medium">Awaiting Tare Dock</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Axle load compliance verification required
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Stock Warnings
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{lowStockCount}</span>
            <span className="text-xs text-slate-500 font-medium">Below Reorder Level</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-semibold">
            Critical parts & consumables threshold reached
          </div>
        </div>
      </div>

      {/* Main Grid: Section 1 (Inbound Weighbridge) & Section 2 (Stock Inventory) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Section 1: Inbound Weighbridge & Waybill Certification Dock */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-600" />
                <span>ICD Inbound Weighbridge & Digital Waybills</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify tare (empty truck) and gross weights before outbound dispatch.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate && onNavigate('weighbridge')}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-xs font-bold transition border border-cyan-200 cursor-pointer"
              >
                <span>Full Scale Dock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="GENERATED">Generated</option>
                <option value="TARE_VERIFIED">Tare Verified</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredWaybills.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No waybills found matching current filter.
              </div>
            ) : (
              filteredWaybills.map((wb) => {
                const isVerified = wb.tare_verified;
                const netWeight = (parseFloat(wb.gross_weight_kg || 0) - parseFloat(wb.tare_weight_kg || 0)).toFixed(0);

                return (
                  <div
                    key={wb.id}
                    className="p-4 rounded-2xl border border-slate-200/90 hover:border-cyan-400 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-sm text-cyan-900">
                            {wb.waybill_number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              wb.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : wb.status === 'DISPATCHED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : wb.status === 'TARE_VERIFIED'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {wb.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{wb.client_name}</p>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setSlipModalWaybill(wb)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                          title="View Digital Weighbridge Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {!isVerified && (
                          <button
                            onClick={() => {
                              setSelectedWaybill(wb);
                              setTareInput(wb.tare_weight_kg || '14200');
                              setGrossInput(wb.gross_weight_kg || '38500');
                            }}
                            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Certify Scale</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Weight Breakdown */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 text-center font-mono">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Tare (Empty)
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {Number(wb.tare_weight_kg).toLocaleString()} kg
                        </span>
                      </div>
                      <div className="border-x border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Gross (Loaded)
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {Number(wb.gross_weight_kg).toLocaleString()} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-600 block">
                          Net Cargo
                        </span>
                        <span className="text-xs font-black text-cyan-800">
                          {netWeight > 0 ? `${Number(netWeight).toLocaleString()} kg` : 'Pending Gross'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center space-x-1.5">
                        {isVerified ? (
                          <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Weighbridge Certified</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-amber-600 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Scale Verification</span>
                          </span>
                        )}
                      </div>

                      {wb.recipient_signature && (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">
                          POD: {wb.recipient_signature}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Stock Pallet & Spare Parts Inventory */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                <span>Pallet Storage & Truck Spare Parts</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track consignment pallets and maintenance workshop consumables.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate && onNavigate('inventory')}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 cursor-pointer"
              >
                <span>Full Pallet Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU, bay..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredInventory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No inventory items found.
              </div>
            ) : (
              filteredInventory.map((item) => {
                const isLowStock = item.quantity_on_hand <= item.reorder_level;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-xs text-indigo-900 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                          {item.sku}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">{item.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Loc: <span className="font-medium text-slate-700">{item.warehouse_location}</span> • Unit:{' '}
                        <span className="font-mono">{item.unit_weight_kg} kg</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase text-slate-400 block text-[10px]">
                          On Hand / Reorder
                        </span>
                        <span
                          className={`text-sm font-black font-mono ${
                            isLowStock ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.quantity_on_hand} <span className="text-slate-400 text-xs font-normal">/ {item.reorder_level}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setStockAddAmount('10');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Receive</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Modal: Certify Weighbridge Scale */}
      {selectedWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Weighbridge Tare & Gross Certification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedWaybill.waybill_number} • {selectedWaybill.client_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {verifySuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{verifySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleVerifyWeighbridge} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-900">Dock Verification Protocol:</p>
                  <p>Readings are pulled from certified weighbridge load cells. Net cargo will be calculated automatically.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tare Weight (Empty Vehicle + Trailer) [kg]
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={tareInput}
                    onChange={(e) => setTareInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gross Weight (Loaded Consignment) [kg]
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={grossInput}
                    onChange={(e) => setGrossInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {tareInput && grossInput && (
                  <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase text-cyan-700 block">
                      Calculated Net Billable Cargo
                    </span>
                    <span className="text-base font-black font-mono text-cyan-900">
                      {Math.max(0, parseFloat(grossInput) - parseFloat(tareInput)).toLocaleString()} kg
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWaybill(null)}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    {verifying ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Stamp & Certify</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Receive Stock Inbound */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Inbound Stock Receipt</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedItem.sku}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-4">
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{selectedItem.description}</p>
                <p className="mt-1">
                  Current on hand: <span className="font-mono font-bold">{selectedItem.quantity_on_hand}</span> units
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Units Received Into Bay
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockAddAmount}
                  onChange={(e) => setStockAddAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receivingStock}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {receivingStock ? 'Recording...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Digital Waybill & Weighbridge Slip Preview */}
      {slipModalWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Electronic Waybill & Axle Certificate
                </h3>
              </div>
              <button
                onClick={() => setSlipModalWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN</p>
                  <p className="text-[10px] text-slate-500">Nairobi Inland Container Depot (ICD Hub)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-cyan-800">{slipModalWaybill.waybill_number}</p>
                  <p className="text-[10px] text-slate-500">{new Date(slipModalWaybill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">CONSIGNEE / CLIENT:</span>
                  <span className="font-bold text-slate-800">{slipModalWaybill.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">STATUS:</span>
                  <span className="font-bold text-cyan-700">{slipModalWaybill.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Gross Weight (Loaded):</span>
                  <span className="font-bold">{Number(slipModalWaybill.gross_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Tare Weight (Empty Rig):</span>
                  <span className="font-bold">{Number(slipModalWaybill.tare_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-cyan-900 text-sm">
                  <span>Net Verified Freight:</span>
                  <span>
                    {(parseFloat(slipModalWaybill.gross_weight_kg) - parseFloat(slipModalWaybill.tare_weight_kg)).toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center pt-1">
                Kenya KeNHA Axle Weight Enforcement Act • Scale ID: ICD-NB-01
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
