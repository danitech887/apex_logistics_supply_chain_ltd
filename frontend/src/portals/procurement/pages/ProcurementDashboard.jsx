import React, { useState } from 'react';
import {
  ShoppingBag,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  ShieldCheck,
  AlertCircle,
  Fuel,
  Truck,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  Download,
} from 'lucide-react';

import { LpoOrdersPage } from './LpoOrdersPage';
import { VendorContractsPage } from './VendorContractsPage';

export const ProcurementDashboard = ({ activeSubSection = 'procurement_dashboard', onNavigate }) => {
  if (activeSubSection === 'lpo_orders') {
    return <LpoOrdersPage onNavigate={onNavigate} />;
  }
  if (activeSubSection === 'vendor_contracts') {
    return <VendorContractsPage onNavigate={onNavigate} />;
  }
  // Demo initial LPOs backed by standard procurement workflows
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
    },
  ]);

  // Master vendor contracts
  const vendors = [
    {
      id: 'VND-001',
      name: 'TotalEnergies Kenya PLC',
      category: 'Fuel & Fleet Card Master Agreement',
      contractRef: 'CONT-TEK-2025/27',
      creditTerms: '30 Days Net',
      contact: 'corporate.fleet@totalenergies.ke',
      slaRating: '99.4%',
      status: 'ACTIVE',
      totalOrdersYTD: 'KES 48.2M',
    },
    {
      id: 'VND-002',
      name: 'Michelin East Africa Ltd',
      category: 'Heavy Commercial Truck Tires',
      contractRef: 'CONT-MICH-2026',
      creditTerms: '45 Days Net',
      contact: 'commercial.fleet@ke.michelin.com',
      slaRating: '98.1%',
      status: 'ACTIVE',
      totalOrdersYTD: 'KES 16.4M',
    },
    {
      id: 'VND-003',
      name: 'Vivo Energy / Shell Kenya',
      category: 'Bulk Lubricants & Regional Depot Fuel',
      contractRef: 'CONT-VIVO-2025/26',
      creditTerms: '30 Days Net',
      contact: 'industrial.sales@vivoenergy.com',
      slaRating: '97.8%',
      status: 'ACTIVE',
      totalOrdersYTD: 'KES 22.1M',
    },
    {
      id: 'VND-004',
      name: 'AutoXpress Kenya Ltd',
      category: 'Workshop Heavy Commercial Spares',
      contractRef: 'CONT-AXP-2026',
      creditTerms: '30 Days Net',
      contact: 'heavyvehicles@auto-xpress.co.ke',
      slaRating: '96.5%',
      status: 'ACTIVE',
      totalOrdersYTD: 'KES 8.9M',
    },
  ];

  // Modal State for New LPO
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vendorSelect, setVendorSelect] = useState('Michelin East Africa Ltd');
  const [itemInput, setItemInput] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [rateInput, setRateInput] = useState(0);
  const [depotSelect, setDepotSelect] = useState('Nairobi Central ICD Hub');

  // Modal State for View/Print LPO
  const [previewLpo, setPreviewLpo] = useState(null);

  const handleCreateLpo = (e) => {
    e.preventDefault();
    const qty = parseFloat(qtyInput) || 1;
    const rate = parseFloat(rateInput) || 0;
    const total = qty * rate;
    const newLpo = {
      id: `LPO-2026-0${lpos.length + 42}`,
      vendor: vendorSelect,
      vendorCategory:
        vendorSelect.includes('Total') || vendorSelect.includes('Vivo')
          ? 'Fuel / Lubricants'
          : vendorSelect.includes('Michelin')
          ? 'Tires'
          : 'Workshop Spares',
      item: itemInput || 'Heavy Vehicle Replacement Spares',
      quantity: qty,
      unitPrice: rate,
      totalAmount: total,
      status: 'PENDING_FINANCE_APPROVAL',
      requisitionBy: 'Amina Abdi (EMP-061)',
      targetDepot: depotSelect,
      deliveryDate: '2026-10-25',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setLpos([newLpo, ...lpos]);
    setShowCreateModal(false);
    setItemInput('');
    setQtyInput(1);
    setRateInput(0);
  };

  const handleApproveLpo = (lpoId) => {
    setLpos((prev) =>
      prev.map((l) =>
        l.id === lpoId ? { ...l, status: 'APPROVED' } : l
      )
    );
  };

  const totalCommittedSpend = lpos.reduce((acc, l) => acc + l.totalAmount, 0);
  const pendingApprovalsCount = lpos.filter((l) => l.status === 'PENDING_FINANCE_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-teal-600/10 text-teal-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Procurement, LPO & Vendor Management
            </h1>
            <p className="text-xs text-slate-500">
              Local Purchase Orders (LPO) • Fuel Supply Contracts • Workshop Spare Parts Sourcing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate && onNavigate('lpo_orders')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>LPO Orders</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('vendor_contracts')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vendor SLAs</span>
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
              Active LPOs
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{lpos.length}</span>
            <span className="text-xs text-slate-500 font-medium">Orders Issued</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-semibold">
            Linked to Fleet & Workshop Cost Centers
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Committed Spend
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
            Governed under Finance Budget Caps
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Finance Approval
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{pendingApprovalsCount}</span>
            <span className="text-xs text-slate-500 font-medium">LPOs Pending</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Requires dual sign-off before dispatch
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Suppliers
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{vendors.length}</span>
            <span className="text-xs text-slate-500 font-medium">Contracted Vendors</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            100% KeBS & ISO Certified SLA Quality
          </div>
        </div>
      </div>

      {/* Main Section: LPO Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>Local Purchase Order (LPO) Register</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified orders for truck tires, highway diesel tenders, and workshop brake components.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">LPO Number</th>
                <th className="pb-3">Vendor / Category</th>
                <th className="pb-3">Item Description</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Unit Rate (KES)</th>
                <th className="pb-3 text-right">Total Amount (KES)</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lpos.map((lpo) => {
                const isApproved = lpo.status === 'APPROVED';
                return (
                  <tr key={lpo.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">
                      {lpo.id}
                      <span className="block text-[10px] font-sans text-slate-400 font-normal">
                        {lpo.createdDate}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold text-slate-800">{lpo.vendor}</span>
                      <span className="block text-[10px] text-teal-700 font-medium">
                        {lpo.vendorCategory}
                      </span>
                    </td>
                    <td className="py-3.5 max-w-xs">
                      <span className="text-slate-700 font-medium">{lpo.item}</span>
                      <span className="block text-[10px] text-slate-400">
                        Dest: {lpo.targetDepot}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-800">
                      {Number(lpo.quantity).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-600">
                      {Number(lpo.unitPrice).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-right font-mono font-black text-slate-900">
                      {Number(lpo.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pending Finance
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right space-x-1.5">
                      <button
                        onClick={() => setPreviewLpo(lpo)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                        title="Print / View LPO"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {!isApproved && (
                        <button
                          onClick={() => handleApproveLpo(lpo.id)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Framework Supplier Contracts */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Approved Suppliers & Master Framework Contracts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Long-term negotiated supplier agreements for fuel corridor rates and heavy tires.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{v.contractRef}</span>
                  <h3 className="font-extrabold text-sm text-slate-900">{v.name}</h3>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {v.status}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1">
                <p className="text-[11px] text-slate-600 font-medium">{v.category}</p>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Terms:</span>
                  <span className="font-semibold text-slate-700">{v.creditTerms}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">SLA Delivery:</span>
                  <span className="font-bold text-emerald-700">{v.slaRating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Orders YTD:</span>
                <span className="font-mono font-bold text-slate-800">{v.totalOrdersYTD}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Generate New LPO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Generate Local Purchase Order (LPO)
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLpo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contracted Supplier
                </label>
                <select
                  value={vendorSelect}
                  onChange={(e) => setVendorSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Description & Specification
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michelin 315/80 R22.5 Steer Axle Tires"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Price (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Destination Depot
                </label>
                <select
                  value={depotSelect}
                  onChange={(e) => setDepotSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="Nairobi Central ICD Hub">Nairobi Central ICD Hub</option>
                  <option value="Mombasa Port Yard Depot">Mombasa Port Yard Depot</option>
                  <option value="Workshop Lubricants Stores">Workshop Lubricants Stores</option>
                  <option value="Workshop Spares Rack 12">Workshop Spares Rack 12</option>
                </select>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-center">
                <span className="text-[10px] font-bold uppercase text-teal-800 block">
                  Total LPO Order Value
                </span>
                <span className="text-lg font-black font-mono text-teal-950">
                  KES {((parseFloat(qtyInput) || 0) * (parseFloat(rateInput) || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Transmit LPO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official LPO Slip Preview */}
      {previewLpo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Official Local Purchase Order (LPO)
                </h3>
              </div>
              <button
                onClick={() => setPreviewLpo(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN LTD</p>
                  <p className="text-[10px] text-slate-500">P.O. Box 48291 - 00100, Nairobi, Kenya</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-800">{previewLpo.id}</p>
                  <p className="text-[10px] text-slate-500">Date: {previewLpo.createdDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">VENDOR / RECIPIENT:</span>
                  <span className="font-bold text-slate-800">{previewLpo.vendor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">DELIVERY SITE:</span>
                  <span className="font-bold text-slate-800">{previewLpo.targetDepot}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span>Item:</span>
                  <span className="font-bold text-right">{previewLpo.item}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Quantity Ordered:</span>
                  <span className="font-bold">{previewLpo.quantity}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Unit Rate:</span>
                  <span className="font-bold">KES {Number(previewLpo.unitPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-teal-950 text-sm">
                  <span>Total Amount (VAT Inclusive):</span>
                  <span>KES {Number(previewLpo.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Requisitioned By: {previewLpo.requisitionBy}</span>
                <span>Status: {previewLpo.status}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official LPO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
