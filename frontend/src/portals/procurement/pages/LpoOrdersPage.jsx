import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building,
  DollarSign,
  Truck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  FileCheck,
  PackageCheck,
  Barcode,
  AlertTriangle,
} from 'lucide-react';

export const LpoOrdersPage = ({ onNavigate }) => {
  const [lpos, setLpos] = useState([
    {
      id: 'LPO-2026-041',
      vendor: 'Michelin East Africa Ltd',
      vendorCategory: 'Fleet Tires',
      item: 'Michelin X Multiway 3D Steering Tires (315/80 R22.5)',
      quantity: 24,
      unitPrice: 62000,
      totalAmount: 1488000,
      status: 'APPROVED',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: 'Nairobi Central ICD Hub',
      deliveryDate: '2026-10-12',
      createdDate: '2026-10-06',
      notes: 'Replacement steer tires for Long-Haul Mercedes Actros fleet batch 4',
    },
    {
      id: 'LPO-2026-042',
      vendor: 'TotalEnergies Kenya PLC',
      vendorCategory: 'Corridor Fuel Supply',
      item: 'Bulk Ultra-Low Sulphur Diesel (ULSD 50ppm) - Mtito Andei & Voi Depot',
      quantity: 12000,
      unitPrice: 182.5,
      totalAmount: 2190000,
      status: 'APPROVED',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: 'Mombasa-Nairobi Transit Corridor',
      deliveryDate: '2026-10-15',
      createdDate: '2026-10-07',
      notes: 'Transit replenishment for northern corridor prime mover fleet',
    },
    {
      id: 'LPO-2026-043',
      vendor: 'Shell Lubricants (Vivo Energy)',
      vendorCategory: 'Engine Lubricants',
      item: 'Shell Rimula R4 X 15W-40 Heavy Duty Diesel Drums (200L)',
      quantity: 10,
      unitPrice: 78500,
      totalAmount: 785000,
      status: 'PENDING_FINANCE_APPROVAL',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: 'Workshop Lubricants Stores',
      deliveryDate: '2026-10-18',
      createdDate: '2026-10-08',
      notes: 'Scheduled 50,000 KM major maintenance services for 18 Scania R450 trucks',
    },
    {
      id: 'LPO-2026-044',
      vendor: 'Knorr-Bremse Commercial Spares',
      vendorCategory: 'Air Brake Systems',
      item: 'Type 24/30 Spring Brake Chambers & Air Valves',
      quantity: 30,
      unitPrice: 12200,
      totalAmount: 366000,
      status: 'PENDING_FINANCE_APPROVAL',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: 'Workshop Spares Rack 12',
      deliveryDate: '2026-10-20',
      createdDate: '2026-10-08',
      notes: 'Pneumatic braking overhaul spares for tri-axle semi-trailers',
    },
    {
      id: 'LPO-2026-045',
      vendor: 'AutoXpress Kenya Ltd',
      vendorCategory: 'Workshop Spares',
      item: 'Donaldson Heavy Duty Fleet Air & Fuel Filter Kits',
      quantity: 45,
      unitPrice: 8500,
      totalAmount: 382500,
      status: 'DELIVERED',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: 'Nairobi Central ICD Hub',
      deliveryDate: '2026-10-09',
      createdDate: '2026-10-04',
      notes: 'Preventative engine filtration stock intake for October cycle',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for New LPO
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vendorSelect, setVendorSelect] = useState('Michelin East Africa Ltd');
  const [vendorCategory, setVendorCategory] = useState('Fleet Tires');
  const [itemInput, setItemInput] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [rateInput, setRateInput] = useState(0);
  const [depotSelect, setDepotSelect] = useState('Nairobi Central ICD Hub');
  const [deliveryDateInput, setDeliveryDateInput] = useState('2026-10-25');
  const [notesInput, setNotesInput] = useState('');

  // Preview / Print LPO Modal
  const [previewLpo, setPreviewLpo] = useState(null);

  const handleVendorChange = (vendorName) => {
    setVendorSelect(vendorName);
    if (vendorName.includes('Total') || vendorName.includes('Vivo')) {
      setVendorCategory('Corridor Fuel Supply');
    } else if (vendorName.includes('Michelin')) {
      setVendorCategory('Fleet Tires');
    } else if (vendorName.includes('Knorr')) {
      setVendorCategory('Air Brake Systems');
    } else {
      setVendorCategory('Workshop Spares');
    }
  };

  const handleCreateLpo = (e) => {
    e.preventDefault();
    const qty = parseFloat(qtyInput) || 1;
    const rate = parseFloat(rateInput) || 0;
    const total = qty * rate;
    const nextSeq = lpos.length + 46;
    const newLpo = {
      id: `LPO-2026-0${nextSeq}`,
      vendor: vendorSelect,
      vendorCategory: vendorCategory,
      item: itemInput || 'Heavy Vehicle Replacement Spares',
      quantity: qty,
      unitPrice: rate,
      totalAmount: total,
      status: 'PENDING_FINANCE_APPROVAL',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: depotSelect,
      deliveryDate: deliveryDateInput,
      createdDate: new Date().toISOString().split('T')[0],
      notes: notesInput || 'Procured under FY2026 Fleet Maintenance OPEX Budget',
    };
    setLpos([newLpo, ...lpos]);
    setShowCreateModal(false);
    setItemInput('');
    setQtyInput(1);
    setRateInput(0);
    setNotesInput('');
  };

  const handleApproveLpo = (lpoId) => {
    setLpos((prev) =>
      prev.map((l) => (l.id === lpoId ? { ...l, status: 'APPROVED' } : l))
    );
  };

  const handleDeliverLpo = (lpoId) => {
    setLpos((prev) =>
      prev.map((l) => (l.id === lpoId ? { ...l, status: 'DELIVERED' } : l))
    );
  };

  const filteredLpos = lpos.filter((l) => {
    const matchesSearch =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetDepot.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || l.vendorCategory === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCommittedSpend = lpos.reduce((acc, l) => acc + l.totalAmount, 0);
  const pendingApprovalsCount = lpos.filter(
    (l) => l.status === 'PENDING_FINANCE_APPROVAL'
  ).length;
  const approvedCount = lpos.filter((l) => l.status === 'APPROVED').length;
  const deliveredCount = lpos.filter((l) => l.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-600/10 text-teal-600 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Local Purchase Orders (LPO) Desk
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                ERP Sourcing Module
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Fleet tires, bulk transit fuel contracts, workshop spares procurement & Finance authorization
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('procurement_dashboard')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Procurement Overview</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New LPO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total LPOs Issued
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{lpos.length}</span>
            <span className="text-xs text-slate-500 font-medium">Orders Recorded</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-semibold">
            {approvedCount} active in supply chain pipeline
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Committed Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalCommittedSpend / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Fleet Maintenance & Corridor OPEX
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Finance Sign-Off
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {pendingApprovalsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Under Review</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-semibold">
            Requires Finance Director Approval
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Delivered & Verified
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {deliveredCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Received at Depots</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Goods Received Notes (GRN) stamped
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search LPO #, vendor, item, depot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_FINANCE_APPROVAL">Pending Finance</option>
            <option value="APPROVED">Approved</option>
            <option value="DELIVERED">Delivered (GRN)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Fleet Tires">Fleet Tires</option>
            <option value="Corridor Fuel Supply">Corridor Fuel</option>
            <option value="Engine Lubricants">Engine Lubricants</option>
            <option value="Air Brake Systems">Air Brake Systems</option>
            <option value="Workshop Spares">Workshop Spares</option>
          </select>
        </div>
      </div>

      {/* LPOs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Procurement Orders Registry ({filteredLpos.length})
            </h2>
            <p className="text-xs text-slate-500">
              Official commercial purchase agreements authorized by Head of Procurement
            </p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('vendor_contracts')}
            className="flex items-center space-x-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
          >
            <span>View Master Vendor Contracts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">LPO Reference</th>
                <th className="py-3 px-4">Vendor & Category</th>
                <th className="py-3 px-4">Line Item & Target Depot</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLpos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No purchase orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLpos.map((lpo) => (
                  <tr key={lpo.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                      <div>{lpo.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        Issued: {lpo.createdDate}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{lpo.vendor}</span>
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-slate-100 text-slate-600">
                        {lpo.vendorCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-800 font-semibold truncate" title={lpo.item}>
                        {lpo.item}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>{lpo.targetDepot}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {lpo.quantity}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      KES {lpo.unitPrice.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      KES {lpo.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          lpo.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : lpo.status === 'DELIVERED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {lpo.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {lpo.status === 'DELIVERED' && <PackageCheck className="w-3 h-3" />}
                        {lpo.status === 'PENDING_FINANCE_APPROVAL' && <Clock className="w-3 h-3" />}
                        <span>
                          {lpo.status === 'PENDING_FINANCE_APPROVAL'
                            ? 'Pending Finance'
                            : lpo.status}
                        </span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPreviewLpo(lpo)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="View / Print Official LPO Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {lpo.status === 'PENDING_FINANCE_APPROVAL' && (
                          <button
                            onClick={() => handleApproveLpo(lpo.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                            title="Finance Direct Sign-off"
                          >
                            Approve
                          </button>
                        )}
                        {lpo.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDeliverLpo(lpo.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                            title="Confirm Goods Received Note (GRN)"
                          >
                            GRN Intake
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate New LPO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Issue Local Purchase Order (LPO)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Requisitioned by Amina Abdi (EMP-061) • Head of Procurement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLpo} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor / Supplier Master Contract
                </label>
                <select
                  value={vendorSelect}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Michelin East Africa Ltd">
                    Michelin East Africa Ltd (Tires - CONT-MICH-2026)
                  </option>
                  <option value="TotalEnergies Kenya PLC">
                    TotalEnergies Kenya PLC (Bulk ULSD Diesel - CONT-TEK-2025/27)
                  </option>
                  <option value="Shell Lubricants (Vivo Energy)">
                    Shell Lubricants / Vivo Energy (Engine Oil Drums - CONT-VIVO-2025/26)
                  </option>
                  <option value="Knorr-Bremse Commercial Spares">
                    Knorr-Bremse Commercial Spares (Air Brakes - CONT-KB-2026)
                  </option>
                  <option value="AutoXpress Kenya Ltd">
                    AutoXpress Kenya Ltd (Workshop Heavy Spares - CONT-AXP-2026)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Line Item Description & Technical Specs
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michelin X Multiway 3D Steering Tires (315/80 R22.5)"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contract Unit Price (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-800">
                    Total Order Value (KES)
                  </span>
                  <div className="text-lg font-black text-teal-900 font-mono">
                    KES {((parseFloat(qtyInput) || 0) * (parseFloat(rateInput) || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-teal-700">
                  <div className="font-semibold">Inclusive of 16% VAT</div>
                  <div>Cost Center: Fleet Operations</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Delivery Depot
                  </label>
                  <select
                    value={depotSelect}
                    onChange={(e) => setDepotSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Nairobi Central ICD Hub">Nairobi Central ICD Hub</option>
                    <option value="Mombasa-Nairobi Transit Corridor">
                      Mombasa-Nairobi Transit Corridor
                    </option>
                    <option value="Workshop Lubricants Stores">Workshop Lubricants Stores</option>
                    <option value="Workshop Spares Rack 12">Workshop Spares Rack 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDateInput}
                    onChange={(e) => setDeliveryDateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procurement Justification / Notes
                </label>
                <textarea
                  rows="2"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Justification for order under fleet maintenance budget..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Transmit LPO to Finance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable LPO Voucher Modal */}
      {previewLpo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Apex Official Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      APEX LOGISTICS & SUPPLY CHAIN LTD
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Enterprise Transport & Haulage Operations
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  Apex Logistics HQ • Embakasi ICD Road, Nairobi, Kenya<br />
                  KRA PIN: <span className="font-mono font-bold text-slate-800">P051987654Z</span> • Tel: +254 20 690 1000
                </div>
              </div>

              <div className="text-right">
                <div className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-mono font-black inline-block">
                  LOCAL PURCHASE ORDER
                </div>
                <div className="mt-1 text-sm font-black font-mono text-slate-900">
                  {previewLpo.id}
                </div>
                <div className="text-[11px] text-slate-500">
                  Date: {previewLpo.createdDate}
                </div>
              </div>
            </div>

            {/* Vendor & Deliver-To Grid */}
            <div className="grid grid-cols-2 gap-6 my-5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Vendor / Supplier Details:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {previewLpo.vendor}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Category: {previewLpo.vendorCategory}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Payment Terms: 30 Days Net from GRN
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Deliver To Depot:
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {previewLpo.targetDepot}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Delivery Due: {previewLpo.deliveryDate}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Requisitioner: {previewLpo.requisitionBy}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item #</th>
                    <th className="py-2.5 px-3">Description & Specification</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (KES)</th>
                    <th className="py-2.5 px-3 text-right">Subtotal (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">01</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{previewLpo.item}</div>
                      <div className="text-[11px] text-slate-500">{previewLpo.notes}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {previewLpo.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {previewLpo.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                      {previewLpo.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan="4" className="py-2 px-3 text-right text-slate-600">
                      Subtotal (Exclusive of VAT):
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      KES {(previewLpo.totalAmount / 1.16).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="py-2 px-3 text-right text-slate-600">
                      VAT (16% Kenya Standard Rate):
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      KES {(previewLpo.totalAmount - previewLpo.totalAmount / 1.16).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="text-sm bg-teal-50 text-teal-900">
                    <td colSpan="4" className="py-2.5 px-3 text-right font-black">
                      Total Order Value (KES):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono">
                      KES {previewLpo.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Authorization Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Requisitioned & Certified By:
                </span>
                <div className="mt-4 border-b border-slate-300 pb-1 font-bold text-slate-800">
                  Amina Abdi
                </div>
                <div className="text-[10px] text-slate-500">
                  Head of Procurement & Sourcing (EMP-061)
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Finance Approval Sign-Off:
                </span>
                <div className="mt-4 border-b border-slate-300 pb-1 font-bold text-slate-800 flex items-center justify-between">
                  <span>Finance Director</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    APPROVED
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Authorized Signatory • Apex Enterprise ERP
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Barcode className="w-5 h-5" />
                <span className="font-mono">{previewLpo.id}-APEX-KE</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewLpo(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Formal LPO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
