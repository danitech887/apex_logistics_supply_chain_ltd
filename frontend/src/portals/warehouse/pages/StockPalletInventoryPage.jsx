import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Printer,
  Barcode,
  Truck,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Scale,
  Clock,
  SlidersHorizontal,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

export const StockPalletInventoryPage = ({ onNavigate }) => {
  const [inventory, setInventory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Modals state
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBinLabelModal, setShowBinLabelModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Inbound Form State (GRN)
  const [inboundForm, setInboundForm] = useState({
    sku: '',
    description: '',
    warehouse_location: 'Nairobi Central ICD Hub - Bay 4A',
    quantity: 10,
    unit_weight_kg: 50.0,
    reorder_level: 10,
    reference_doc: 'GRN-2026-105',
    shipper_vendor: 'Unilever Kenya Ltd',
  });

  // Outbound Form State
  const [outboundForm, setOutboundForm] = useState({
    quantity: 2,
    target_truck: 'KDA 101Z (Mercedes Actros)',
    job_card_ref: 'JC-2026-092',
    reason: 'Routine Scheduled Maintenance',
  });

  // Audit Recount Form State
  const [auditForm, setAuditForm] = useState({
    new_quantity: 0,
    audit_notes: 'Physical monthly stocktake reconciliation',
  });

  // Toast / feedback alert
  const [toastMessage, setToastMessage] = useState(null);

  // Movement Audit Logs
  const [recentMovements, setRecentMovements] = useState([
    {
      id: 'MOV-901',
      sku: 'PAL-DET-500KG',
      description: 'Unilever OMO Auto Concentrated Powder Bulk Pallet',
      type: 'INBOUND',
      quantity: 85,
      ref: 'GRN-2026-102',
      operator: 'Kevin Wafula (EMP-055)',
      time: 'Today, 08:30 AM',
      location: 'Warehouse Ambient Bay C3',
    },
    {
      id: 'MOV-902',
      sku: 'TIRE-315-80R22.5',
      description: 'Michelin X Multiway 3D Heavy Steering Tire',
      type: 'OUTBOUND',
      quantity: 2,
      ref: 'JC-2026-088 (KDA 101Z)',
      operator: 'Kevin Wafula (EMP-055)',
      time: 'Today, 10:15 AM',
      location: 'Nairobi Central ICD Hub - Bay 4A',
    },
    {
      id: 'MOV-903',
      sku: 'OIL-15W40-200L',
      description: 'Shell Rimula R4 X 15W-40 Heavy Duty Diesel Drum',
      type: 'OUTBOUND',
      quantity: 1,
      ref: 'JC-2026-089 (Workshop Lube)',
      operator: 'Dennis Kiprotich (EMP-070)',
      time: 'Yesterday, 04:40 PM',
      location: 'Workshop Lubricants Stores - Bay L1',
    },
    {
      id: 'MOV-904',
      sku: 'AGRI-CORN-50KG',
      description: 'Bidco Industrial Refined Corn Starch 50kg Sacks',
      type: 'INBOUND',
      quantity: 120,
      ref: 'GRN-2026-098',
      operator: 'Kevin Wafula (EMP-055)',
      time: 'Yesterday, 01:20 PM',
      location: 'Warehouse Dry Silo Wing 1',
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invRes, metricsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.INVENTORY),
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.INVENTORY_METRICS).catch(() => null),
      ]);

      const items = invRes.data?.results || invRes.data || [];
      setInventory(items);

      if (metricsRes && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setError('Unable to synchronize warehouse stock records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category determination helper
  const getItemCategory = (sku, desc) => {
    if (sku.startsWith('TIRE')) return 'TIRES';
    if (sku.startsWith('OIL')) return 'LUBRICANTS';
    if (sku.startsWith('BRK') || sku.startsWith('FLTR')) return 'SPARES';
    if (sku.startsWith('PAL') || sku.startsWith('AGRI')) return 'PALLETS_CARGO';
    return 'OTHER';
  };

  // Warehouse Zones
  const WAREHOUSE_ZONES = [
    {
      id: 'ZONE_A',
      name: 'Zone A - Ambient Pallet Racks',
      type: 'Palletized FMCG & Packaged Goods',
      capacity: 180,
      occupied: 135,
      temp: 'Ambient (21°C)',
      bays: ['Bay A1', 'Bay A2', 'Bay A3', 'Bay A4'],
    },
    {
      id: 'ZONE_B',
      name: 'Zone B - Commercial Fleet Spares',
      type: 'Tires, Axle Components & Hardware',
      capacity: 120,
      occupied: 86,
      temp: 'Dry Sheltered',
      bays: ['Bay 4A', 'Bay 2B', 'Spares Rack 12'],
    },
    {
      id: 'ZONE_C',
      name: 'Zone C - Lubricants & Workshop Drums',
      type: 'Heavy Engine Oils & Fluids (Bunded)',
      capacity: 60,
      occupied: 38,
      temp: 'Hazardous Bunded',
      bays: ['Bay L1', 'Spares Rack 04'],
    },
    {
      id: 'ZONE_D',
      name: 'Zone D - Dry Bulk Silos & Export Wing',
      type: 'Agricultural Starch & Grain Consignments',
      capacity: 90,
      occupied: 65,
      temp: 'Ventilated Silo',
      bays: ['Dry Silo Wing 1'],
    },
  ];

  // Inbound Pallet intake handler (GRN)
  const handleInboundIntake = async (e) => {
    e.preventDefault();
    try {
      // Check if item already exists by SKU
      const existing = inventory.find((i) => i.sku.toUpperCase() === inboundForm.sku.toUpperCase());

      if (existing) {
        // Adjust existing item stock
        const url = `${ENDPOINTS.WAREHOUSE_CRM.INVENTORY}${existing.id}/adjust_stock/`;
        const res = await apiClient.post(url, {
          movement_type: 'INBOUND',
          quantity: parseInt(inboundForm.quantity, 10),
          reason: `GRN Intake from ${inboundForm.shipper_vendor}`,
          reference_doc: inboundForm.reference_doc,
        });

        setInventory((prev) =>
          prev.map((i) => (i.id === existing.id ? res.data.item : i))
        );
      } else {
        // Create brand new item in PostgreSQL
        const res = await apiClient.post(ENDPOINTS.WAREHOUSE_CRM.INVENTORY, {
          sku: inboundForm.sku.toUpperCase(),
          description: inboundForm.description,
          warehouse_location: inboundForm.warehouse_location,
          quantity_on_hand: parseInt(inboundForm.quantity, 10),
          unit_weight_kg: parseFloat(inboundForm.unit_weight_kg),
          reorder_level: parseInt(inboundForm.reorder_level, 10),
        });
        setInventory((prev) => [res.data, ...prev]);
      }

      // Record movement
      const newMov = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        sku: inboundForm.sku.toUpperCase(),
        description: inboundForm.description,
        type: 'INBOUND',
        quantity: parseInt(inboundForm.quantity, 10),
        ref: inboundForm.reference_doc,
        operator: 'Kevin Wafula (EMP-055)',
        time: 'Just now',
        location: inboundForm.warehouse_location,
      };
      setRecentMovements([newMov, ...recentMovements]);

      showToast(`Inbound Pallets Received: +${inboundForm.quantity} units for ${inboundForm.sku} (${inboundForm.reference_doc})`);
      setShowInboundModal(false);
      setInboundForm({
        sku: '',
        description: '',
        warehouse_location: 'Nairobi Central ICD Hub - Bay 4A',
        quantity: 10,
        unit_weight_kg: 50.0,
        reorder_level: 10,
        reference_doc: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
        shipper_vendor: 'Unilever Kenya Ltd',
      });
    } catch (err) {
      alert('Inbound receipt failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Outbound Issue to Fleet handler
  const handleOutboundIssue = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      const url = `${ENDPOINTS.WAREHOUSE_CRM.INVENTORY}${activeItem.id}/adjust_stock/`;
      const res = await apiClient.post(url, {
        movement_type: 'OUTBOUND',
        quantity: parseInt(outboundForm.quantity, 10),
        reason: `${outboundForm.reason} - Requisitioned to ${outboundForm.target_truck}`,
        reference_doc: outboundForm.job_card_ref,
      });

      setInventory((prev) =>
        prev.map((i) => (i.id === activeItem.id ? res.data.item : i))
      );

      const newMov = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        sku: activeItem.sku,
        description: activeItem.description,
        type: 'OUTBOUND',
        quantity: parseInt(outboundForm.quantity, 10),
        ref: `${outboundForm.job_card_ref} (${outboundForm.target_truck})`,
        operator: 'Kevin Wafula (EMP-055)',
        time: 'Just now',
        location: activeItem.warehouse_location,
      };
      setRecentMovements([newMov, ...recentMovements]);

      showToast(`Stock Issued to Fleet: -${outboundForm.quantity} units of ${activeItem.sku} to ${outboundForm.target_truck}`);
      setShowOutboundModal(false);
      setActiveItem(null);
    } catch (err) {
      alert('Outbound issue failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Audit Recount handler
  const handleAuditRecount = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      const url = `${ENDPOINTS.WAREHOUSE_CRM.INVENTORY}${activeItem.id}/adjust_stock/`;
      const res = await apiClient.post(url, {
        movement_type: 'RECONCILIATION',
        new_quantity: parseInt(auditForm.new_quantity, 10),
        reason: auditForm.audit_notes,
        reference_doc: 'AUDIT-REC-2026',
      });

      setInventory((prev) =>
        prev.map((i) => (i.id === activeItem.id ? res.data.item : i))
      );

      const diff = parseInt(auditForm.new_quantity, 10) - activeItem.quantity_on_hand;
      const newMov = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        sku: activeItem.sku,
        description: activeItem.description,
        type: diff >= 0 ? 'INBOUND' : 'OUTBOUND',
        quantity: Math.abs(diff),
        ref: 'AUDIT-REC-2026 (Stocktake Variance)',
        operator: 'Kevin Wafula (EMP-055)',
        time: 'Just now',
        location: activeItem.warehouse_location,
      };
      setRecentMovements([newMov, ...recentMovements]);

      showToast(`Stock Recount Saved: ${activeItem.sku} recalibrated to ${auditForm.new_quantity} units`);
      setShowAuditModal(false);
      setActiveItem(null);
    } catch (err) {
      alert('Recount failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Calculations
  const totalSkus = inventory.length;
  const totalUnits = inventory.reduce((acc, i) => acc + i.quantity_on_hand, 0);
  const totalWeightTonnes = inventory
    .reduce((acc, i) => acc + (i.quantity_on_hand * parseFloat(i.unit_weight_kg || 0)) / 1000, 0)
    .toFixed(1);
  const lowStockCount = inventory.filter((i) => i.quantity_on_hand <= i.reorder_level).length;

  const totalPalletCapacity = 450;
  const occupiedPallets = Math.min(totalPalletCapacity, Math.round(totalUnits * 0.72));
  const utilizationPercentage = Math.round((occupiedPallets / totalPalletCapacity) * 100);

  // Filtered inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse_location.toLowerCase().includes(searchQuery.toLowerCase());

    const cat = getItemCategory(item.sku, item.description);
    const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

    const isLowStock = item.quantity_on_hand <= item.reorder_level;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'LOW'
        ? isLowStock
        : !isLowStock;

    const matchesZone =
      selectedZone === 'ALL'
        ? true
        : selectedZone === 'ZONE_A'
        ? item.warehouse_location.includes('Bay A') || item.warehouse_location.includes('Ambient')
        : selectedZone === 'ZONE_B'
        ? item.warehouse_location.includes('Bay 4A') || item.warehouse_location.includes('Bay 2B') || item.warehouse_location.includes('Spares')
        : selectedZone === 'ZONE_C'
        ? item.warehouse_location.includes('Lube') || item.warehouse_location.includes('Bay L1')
        : item.warehouse_location.includes('Silo') || item.warehouse_location.includes('Wing');

    return matchesSearch && matchesCategory && matchesStatus && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-900/95 text-emerald-100 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-cyan-600/10 text-cyan-600 rounded-2xl">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Stock & Pallet Inventory Control
            </h1>
            <p className="text-xs text-slate-500">
              Nairobi Central ICD Hub • Bay Racks, Drum Bunds & Heavy Fleet Workshop Spare Parts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowInboundModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Pallets (GRN)</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
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

      {/* Warehouse Bay Racking & Pallet Capacity Utilization Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              ICD Pallet Slot Capacity & Bay Occupancy
            </h2>
          </div>
          <div className="text-xs font-mono font-bold text-slate-700">
            Occupied: <span className="text-cyan-700">{occupiedPallets}</span> / {totalPalletCapacity} Pallet Positions ({utilizationPercentage}%)
          </div>
        </div>

        {/* Progress Bar with Color coding */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              utilizationPercentage > 90
                ? 'bg-rose-500'
                : utilizationPercentage > 75
                ? 'bg-amber-500'
                : 'bg-cyan-600'
            }`}
            style={{ width: `${utilizationPercentage}%` }}
          />
        </div>

        {/* Zone Selector Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          {WAREHOUSE_ZONES.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(isSelected ? 'ALL' : zone.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] truncate">{zone.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600">
                    {zone.occupied}/{zone.capacity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{zone.type}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Stocked SKUs
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalSkus}</span>
            <span className="text-xs text-slate-500 font-medium">Distinct Line Items</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-700 font-semibold">
            PostgreSQL Schema warehouse_crm
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Units On Hand
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Number(totalUnits).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">Units / Pallets</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Across 4 ICD Storage Zones
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Weight In Stores
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalWeightTonnes}</span>
            <span className="text-xs text-slate-500 font-medium">Metric Tonnes</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Verified Physical Warehouse Tonnage
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
            <span className="text-xs text-slate-500 font-medium">SKUs Below Reorder</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-semibold">
            {lowStockCount > 0 ? 'Urgent Procurement Requisition Required' : 'All Stock Above Safety Levels'}
          </div>
        </div>
      </div>

      {/* Main Table: Stock Catalog & Real-Time Control */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Table Controls / Filters Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Catalog ({inventory.length})
            </button>
            <button
              onClick={() => setCategoryFilter('TIRES')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === 'TIRES'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fleet Tires
            </button>
            <button
              onClick={() => setCategoryFilter('LUBRICANTS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === 'LUBRICANTS'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Engine Lubricants
            </button>
            <button
              onClick={() => setCategoryFilter('SPARES')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === 'SPARES'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Brakes & Spares
            </button>
            <button
              onClick={() => setCategoryFilter('PALLETS_CARGO')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === 'PALLETS_CARGO'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Palletized Freight
            </button>
          </div>

          {/* Search & Stock Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="HEALTHY">Healthy Stock</option>
              <option value="LOW">Low Stock / Reorder</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU, bay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none w-48"
              />
            </div>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">SKU / Barcode</th>
                <th className="pb-3">Description & Consumable Spec</th>
                <th className="pb-3">Storage Bay Location</th>
                <th className="pb-3 text-right">Unit Wt (kg)</th>
                <th className="pb-3 text-right">Gross Tonnes</th>
                <th className="pb-3 text-center">On-Hand / Reorder</th>
                <th className="pb-3 text-center">Health Status</th>
                <th className="pb-3 pr-2 text-right">Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    No items matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock = item.quantity_on_hand <= item.reorder_level;
                  const lineWeightTonnes = (
                    (item.quantity_on_hand * parseFloat(item.unit_weight_kg || 0)) /
                    1000
                  ).toFixed(2);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                            {item.sku}
                          </span>
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setShowBinLabelModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Print Pallet Bin Label"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 max-w-xs">
                        <span className="font-bold text-slate-800">{item.description}</span>
                        <span className="block text-[10px] text-slate-400">
                          Cat: {getItemCategory(item.sku, item.description)}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/60 font-mono text-[11px]">
                          {item.warehouse_location}
                        </span>
                      </td>

                      <td className="py-3.5 text-right font-mono font-semibold text-slate-700">
                        {item.unit_weight_kg} kg
                      </td>

                      <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                        {lineWeightTonnes} T
                      </td>

                      <td className="py-3.5 text-center font-mono">
                        <span className="font-black text-sm text-slate-900">
                          {item.quantity_on_hand}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">/ {item.reorder_level}</span>
                      </td>

                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLowStock
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isLowStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Adequate
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 pr-2 text-right space-x-1">
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setOutboundForm({
                              quantity: 2,
                              target_truck: 'KDA 101Z (Mercedes Actros)',
                              job_card_ref: `JC-2026-${Math.floor(100 + Math.random() * 900)}`,
                              reason: 'Routine Scheduled Maintenance',
                            });
                            setShowOutboundModal(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                          title="Issue Outbound to Fleet/Truck"
                        >
                          <Minus className="w-3 h-3 inline mr-0.5" />
                          Issue
                        </button>

                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setAuditForm({
                              new_quantity: item.quantity_on_hand,
                              audit_notes: 'Physical monthly stocktake reconciliation',
                            });
                            setShowAuditModal(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                          title="Recalibrate Physical Stock Count"
                        >
                          Recount
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Audit History Trail */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Recent Pallet Intake & Fleet Issue Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Logged movements verified with GRN delivery vouchers and workshop maintenance job cards.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentMovements.map((mov) => {
            const isInbound = mov.type === 'INBOUND';
            return (
              <div key={mov.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition px-2 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isInbound
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {isInbound ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{mov.sku}</span>
                      <span className="font-mono text-[10px] text-slate-400">({mov.ref})</span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px]">{mov.description}</p>
                    <p className="text-[10px] text-slate-400">
                      Site: {mov.location} • Handler: {mov.operator}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:shrink-0 pl-11 sm:pl-0">
                  <span
                    className={`font-mono font-black text-sm ${
                      isInbound ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {isInbound ? `+${mov.quantity}` : `-${mov.quantity}`} Units
                  </span>
                  <span className="block text-[10px] text-slate-400">{mov.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Inbound Pallet Receipt (GRN) */}
      {showInboundModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Inbound Pallet & Cargo Intake (GRN)
                </h3>
              </div>
              <button
                onClick={() => setShowInboundModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInboundIntake} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Consignor Shipper / Supplier
                </label>
                <select
                  value={inboundForm.shipper_vendor}
                  onChange={(e) => setInboundForm({ ...inboundForm, shipper_vendor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Unilever Kenya Ltd">Unilever Kenya Ltd (FMCG Pallets)</option>
                  <option value="Bidco Africa Ltd">Bidco Africa Ltd (Industrial Starch)</option>
                  <option value="Michelin East Africa">Michelin East Africa (Heavy Commercial Tires)</option>
                  <option value="Shell Lubricants (Vivo)">Shell Lubricants (Vivo Energy 200L Drums)</option>
                  <option value="Knorr-Bremse Spares">Knorr-Bremse Spares (Workshop Air Actuators)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PAL-DET-500KG"
                    value={inboundForm.sku}
                    onChange={(e) => setInboundForm({ ...inboundForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GRN Voucher Ref
                  </label>
                  <input
                    type="text"
                    required
                    value={inboundForm.reference_doc}
                    onChange={(e) => setInboundForm({ ...inboundForm, reference_doc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unilever OMO Concentrated Powder Pallets"
                  value={inboundForm.description}
                  onChange={(e) => setInboundForm({ ...inboundForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Warehouse Bay Location
                </label>
                <select
                  value={inboundForm.warehouse_location}
                  onChange={(e) => setInboundForm({ ...inboundForm, warehouse_location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Warehouse Ambient Bay C3">Zone A: Warehouse Ambient Bay C3</option>
                  <option value="Nairobi Central ICD Hub - Bay 4A">Zone B: Nairobi Central ICD Hub - Bay 4A</option>
                  <option value="Mombasa Port Yard - Bay 2B">Zone B: Mombasa Port Yard - Bay 2B</option>
                  <option value="Workshop Lubricants Stores - Bay L1">Zone C: Workshop Lubricants Stores - Bay L1</option>
                  <option value="Workshop Spares Rack 12">Zone B: Workshop Spares Rack 12</option>
                  <option value="Warehouse Dry Silo Wing 1">Zone D: Warehouse Dry Silo Wing 1</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Units / Pallets
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inboundForm.quantity}
                    onChange={(e) => setInboundForm({ ...inboundForm, quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Wt (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={inboundForm.unit_weight_kg}
                    onChange={(e) => setInboundForm({ ...inboundForm, unit_weight_kg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inboundForm.reorder_level}
                    onChange={(e) => setInboundForm({ ...inboundForm, reorder_level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInboundModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Commit Inbound GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Outbound Issue to Fleet / Workshop */}
      {showOutboundModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Issue to Fleet / Workshop</h3>
                <p className="text-xs text-slate-500 font-mono">{activeItem.sku}</p>
              </div>
              <button
                onClick={() => setShowOutboundModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOutboundIssue} className="space-y-3">
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{activeItem.description}</p>
                <p className="mt-1">
                  Available in store: <strong className="font-mono text-slate-900">{activeItem.quantity_on_hand}</strong> units
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Issue Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={activeItem.quantity_on_hand}
                  required
                  value={outboundForm.quantity}
                  onChange={(e) => setOutboundForm({ ...outboundForm, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Destination Truck Rig / Bay
                </label>
                <select
                  value={outboundForm.target_truck}
                  onChange={(e) => setOutboundForm({ ...outboundForm, target_truck: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="KDA 101Z (Mercedes Actros - Mombasa)">KDA 101Z (Mercedes Actros - Michael Kamau)</option>
                  <option value="KDA 102Z (Scania R500 - Nakuru)">KDA 102Z (Scania R500 - Bernard Mutua)</option>
                  <option value="KDA 103Z (Isuzu Giga - Kisumu)">KDA 103Z (Isuzu Giga - Samuel Kiprono)</option>
                  <option value="Workshop Lubricants Stores">Workshop General Service Bay</option>
                  <option value="Direct Outbound Client Consignment">Direct Client Consignment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Card / Requisition Reference
                </label>
                <input
                  type="text"
                  required
                  value={outboundForm.job_card_ref}
                  onChange={(e) => setOutboundForm({ ...outboundForm, job_card_ref: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutboundModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Issue Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Audit Recount / Variance Calibration */}
      {showAuditModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Stocktake Recount Audit</h3>
                <p className="text-xs text-slate-500 font-mono">{activeItem.sku}</p>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuditRecount} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>System Count: <strong className="font-mono">{activeItem.quantity_on_hand}</strong> units</p>
                <p className="text-slate-500">Enter the physical verified quantity counted on shelf.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Counted Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={auditForm.new_quantity}
                  onChange={(e) => setAuditForm({ ...auditForm, new_quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Stocktake Variance Rationale
                </label>
                <input
                  type="text"
                  required
                  value={auditForm.audit_notes}
                  onChange={(e) => setAuditForm({ ...auditForm, audit_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Reconcile Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Pallet Bin Label / Barcode Tag Preview */}
      {showBinLabelModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Barcode className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Pallet Rack Bin Label
                </h3>
              </div>
              <button
                onClick={() => setShowBinLabelModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">
                Apex Logistics • Inland Container Depot (ICD)
              </div>

              <div className="py-2 bg-slate-100 rounded-lg">
                <span className="text-lg font-black tracking-widest text-slate-900 block">
                  ||||| | ||||| || |||||| |
                </span>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  *{activeItem.sku}*
                </span>
              </div>

              <div className="text-xs font-bold text-slate-900 line-clamp-2">
                {activeItem.description}
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-[11px] pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[9px]">STORAGE BAY:</span>
                  <span className="font-bold text-slate-800">{activeItem.warehouse_location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">UNIT WEIGHT:</span>
                  <span className="font-bold text-slate-800">{activeItem.unit_weight_kg} kg</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1">
                Verified: Kevin Wafula (Supervisor)
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bin Tag Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
