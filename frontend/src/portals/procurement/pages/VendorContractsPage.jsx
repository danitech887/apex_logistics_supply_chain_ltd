import React, { useState } from 'react';
import {
  Building,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Calendar,
  Phone,
  Mail,
  Award,
  X,
  Check,
  ShoppingBag,
} from 'lucide-react';

export const VendorContractsPage = ({ onNavigate }) => {
  const [vendors, setVendors] = useState([
    {
      id: 'VND-001',
      name: 'TotalEnergies Kenya PLC',
      category: 'Fuel & Fleet Card Master Agreement',
      contractRef: 'CONT-TEK-2025/27',
      creditTerms: '30 Days Net',
      contactPerson: 'Eric Mwangi (Key Accounts Lead)',
      contactEmail: 'corporate.fleet@totalenergies.ke',
      phone: '+254 20 288 4000',
      kraPin: 'P051100223M',
      slaRating: '99.4%',
      status: 'ACTIVE',
      contractCap: 60000000,
      spentYtd: 48200000,
      startDate: '2025-01-01',
      expiryDate: '2027-12-31',
      scope: 'Bulk ULSD 50ppm Diesel supply across 14 corridor waystations and electronic fleet card dispensing.',
    },
    {
      id: 'VND-002',
      name: 'Michelin East Africa Ltd',
      category: 'Heavy Commercial Truck Tires',
      contractRef: 'CONT-MICH-2026',
      creditTerms: '45 Days Net',
      contactPerson: 'David Mutua (Fleet Solutions)',
      contactEmail: 'commercial.fleet@ke.michelin.com',
      phone: '+254 700 334 221',
      kraPin: 'P051229988X',
      slaRating: '98.1%',
      status: 'ACTIVE',
      contractCap: 25000000,
      spentYtd: 16400000,
      startDate: '2026-01-15',
      expiryDate: '2027-01-14',
      scope: 'Radial steer, drive, and trailer tires with casing retread warranty and depot tire management audits.',
    },
    {
      id: 'VND-003',
      name: 'Vivo Energy / Shell Kenya',
      category: 'Bulk Lubricants & Regional Depot Fuel',
      contractRef: 'CONT-VIVO-2025/26',
      creditTerms: '30 Days Net',
      contactPerson: 'Grace Wanjiru (Industrial Lubricants)',
      contactEmail: 'industrial.sales@vivoenergy.com',
      phone: '+254 20 695 2000',
      kraPin: 'P051334455Y',
      slaRating: '97.8%',
      status: 'ACTIVE',
      contractCap: 30000000,
      spentYtd: 22100000,
      startDate: '2025-06-01',
      expiryDate: '2026-11-30',
      scope: 'Shell Rimula Heavy Duty engine oils, differential gear lubes, and high-temp chassis greases.',
    },
    {
      id: 'VND-004',
      name: 'Knorr-Bremse Commercial Spares',
      category: 'Air Brake Systems & Pneumatics',
      contractRef: 'CONT-KB-2026',
      creditTerms: '30 Days Net',
      contactPerson: 'Marcus Langat (Technical Spares)',
      contactEmail: 'technical.sales@knorr-bremse.co.ke',
      phone: '+254 722 889 900',
      kraPin: 'P051445566Z',
      slaRating: '99.0%',
      status: 'ACTIVE',
      contractCap: 12000000,
      spentYtd: 7200000,
      startDate: '2026-02-01',
      expiryDate: '2027-01-31',
      scope: 'OEM air brake actuators, EBS/ABS modular valves, air dryers, and trailer couplings.',
    },
    {
      id: 'VND-005',
      name: 'AutoXpress Kenya Ltd',
      category: 'Workshop Heavy Commercial Spares',
      contractRef: 'CONT-AXP-2026',
      creditTerms: '30 Days Net',
      contactPerson: 'Pravin Shah (Commercial Fleet)',
      contactEmail: 'heavyvehicles@auto-xpress.co.ke',
      phone: '+254 733 600 500',
      kraPin: 'P051556677A',
      slaRating: '96.5%',
      status: 'ACTIVE',
      contractCap: 15000000,
      spentYtd: 8900000,
      startDate: '2026-03-01',
      expiryDate: '2027-02-28',
      scope: 'Donaldson air/fuel filters, heavy duty maintenance batteries, and workshop hydraulic jacks.',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for New Vendor
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Heavy Commercial Truck Tires');
  const [newContractRef, setNewContractRef] = useState('');
  const [newKraPin, setNewKraPin] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCreditTerms, setNewCreditTerms] = useState('30 Days Net');
  const [newContractCap, setNewContractCap] = useState(10000000);
  const [newScope, setNewScope] = useState('');

  // Selected Vendor Dossier Modal
  const [selectedVendorDossier, setSelectedVendorDossier] = useState(null);

  const handleAddVendor = (e) => {
    e.preventDefault();
    const nextId = `VND-00${vendors.length + 1}`;
    const newEntry = {
      id: nextId,
      name: newVendorName,
      category: newVendorCategory,
      contractRef: newContractRef || `CONT-${nextId}-2026`,
      creditTerms: newCreditTerms,
      contactPerson: newContactPerson,
      contactEmail: newContactEmail,
      phone: newPhone,
      kraPin: newKraPin,
      slaRating: '100.0%',
      status: 'ACTIVE',
      contractCap: parseFloat(newContractCap) || 10000000,
      spentYtd: 0,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-12-31',
      scope: newScope || 'Certified enterprise procurement supply agreement.',
    };
    setVendors([newEntry, ...vendors]);
    setShowAddVendorModal(false);
    setNewVendorName('');
    setNewContractRef('');
    setNewKraPin('');
    setNewContactPerson('');
    setNewContactEmail('');
    setNewPhone('');
    setNewScope('');
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contractRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || v.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const totalContractCap = vendors.reduce((acc, v) => acc + v.contractCap, 0);
  const totalSpentYtd = vendors.reduce((acc, v) => acc + v.spentYtd, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Master Suppliers & Vendor Contracts
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                SLA & Procurement Governance
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Corporate vendor agreements, fuel supplier SLAs, credit facilities & spend ceiling compliance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('lpo_orders')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Go to LPO Orders</span>
          </button>
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Master Vendor Contracts
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{vendors.length}</span>
            <span className="text-xs text-slate-500 font-medium">Approved Suppliers</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-semibold">
            All 100% KRA Tax Compliant
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contract Ceilings (YTD)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalContractCap / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Total Authorized Commercial Facility
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Actual Spend Executed
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              KES {(totalSpentYtd / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({((totalSpentYtd / totalContractCap) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Within Approved OPEX Variance (+/- 3%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Vendor SLA
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">98.2%</span>
            <span className="text-xs text-slate-500 font-medium">Quality & On-Time</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-semibold">
            ISO 9001:2015 Tier-1 Vendor Score
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor, contract ref, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Category:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Fuel">Fuel & Corridor Dispensing</option>
            <option value="Tires">Heavy Commercial Tires</option>
            <option value="Lubricants">Lubricants & Oils</option>
            <option value="Spares">Mechanical & Brake Spares</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVendors.map((vendor) => {
          const spendPercent = Math.min(
            100,
            (vendor.spentYtd / vendor.contractCap) * 100
          ).toFixed(1);

          return (
            <div
              key={vendor.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-indigo-300 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {vendor.id}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {vendor.contractRef}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-slate-500">{vendor.category}</p>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{vendor.slaRating} SLA</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">
                    {vendor.creditTerms}
                  </span>
                </div>
              </div>

              {/* Progress Bar for Spend vs Cap */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Committed Spend YTD:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {(vendor.spentYtd / 1000000).toFixed(2)}M / {(vendor.contractCap / 1000000).toFixed(2)}M ({spendPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      parseFloat(spendPercent) > 90
                        ? 'bg-rose-500'
                        : parseFloat(spendPercent) > 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${spendPercent}%` }}
                  />
                </div>
              </div>

              {/* Contact Info & Validity */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Account Contact:
                  </div>
                  <div className="font-bold text-slate-800 truncate">
                    {vendor.contactPerson}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{vendor.contactEmail}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Agreement Term:
                  </div>
                  <div className="font-mono text-slate-700">
                    Until {vendor.expiryDate}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    KRA: {vendor.kraPin}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  Requisitioner: Amina Abdi (EMP-061)
                </span>
                <button
                  onClick={() => setSelectedVendorDossier(vendor)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <span>View Contract SLA Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard New Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Onboard Master Commercial Supplier
                  </h3>
                  <p className="text-xs text-slate-500">
                    Amina Abdi • Head of Procurement & Sourcing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor Legal Registered Entity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scania East Africa Commercial Ltd"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procurement Category
                  </label>
                  <select
                    value={newVendorCategory}
                    onChange={(e) => setNewVendorCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Heavy Commercial Truck Tires">
                      Heavy Commercial Truck Tires
                    </option>
                    <option value="Fuel & Fleet Card Master Agreement">
                      Fuel & Fleet Card Master Agreement
                    </option>
                    <option value="Bulk Lubricants & Regional Depot Fuel">
                      Bulk Lubricants & Oils
                    </option>
                    <option value="Air Brake Systems & Pneumatics">
                      Air Brake Systems & Pneumatics
                    </option>
                    <option value="Workshop Heavy Commercial Spares">
                      Workshop Heavy Commercial Spares
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P051667788B"
                    value={newKraPin}
                    onChange={(e) => setNewKraPin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Key Account Lead"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="fleet.sales@vendor.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+254 700 000 000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credit Terms
                  </label>
                  <select
                    value={newCreditTerms}
                    onChange={(e) => setNewCreditTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="30 Days Net">30 Days Net</option>
                    <option value="45 Days Net">45 Days Net</option>
                    <option value="60 Days Net">60 Days Net</option>
                    <option value="Direct Advance">Direct Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Cap (KES)
                  </label>
                  <input
                    type="number"
                    min="100000"
                    value={newContractCap}
                    onChange={(e) => setNewContractCap(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Scope & Key Provisions
                </label>
                <textarea
                  rows="2"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="Outline deliverables, warranty terms, and delivery points..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Execute Contract Dossier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract SLA Details Dossier Modal */}
      {selectedVendorDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 font-mono">
                  {selectedVendorDossier.contractRef} • {selectedVendorDossier.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedVendorDossier.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVendorDossier.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedVendorDossier(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Agreement Scope:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedVendorDossier.scope}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800">
                    SLA Rating & Compliance
                  </span>
                  <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                    {selectedVendorDossier.slaRating}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    On-time dispatch rate & zero defect rate
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-800">
                    Commercial Terms
                  </span>
                  <div className="text-sm font-black text-indigo-900 mt-1">
                    {selectedVendorDossier.creditTerms}
                  </div>
                  <div className="text-[11px] text-indigo-700">
                    KRA Tax PIN: {selectedVendorDossier.kraPin}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Annual Authorized Cap:</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {selectedVendorDossier.contractCap.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Actual Spend YTD:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    KES {selectedVendorDossier.spentYtd.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Remaining Budget Capacity:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    KES {(selectedVendorDossier.contractCap - selectedVendorDossier.spentYtd).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedVendorDossier(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
              >
                Close Dossier
              </button>
              <button
                onClick={() => {
                  setSelectedVendorDossier(null);
                  if (onNavigate) onNavigate('lpo_orders');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Issue LPO to Vendor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
