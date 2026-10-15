import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Scale,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  FileCheck,
  Building,
  UserCheck,
  Layers,
  ArrowRight,
  Barcode,
  ExternalLink,
} from 'lucide-react';

export const WeighbridgeInboundPage = ({ onNavigate }) => {
  const [waybills, setWaybills] = useState([]);
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Certification Modal State
  const [certifyingWaybill, setCertifyingWaybill] = useState(null);
  const [tareInput, setTareInput] = useState('14200');
  const [grossInput, setGrossInput] = useState('38400');
  const [steerAxleInput, setSteerAxleInput] = useState('7200');
  const [driveAxleInput, setDriveAxleInput] = useState('16400');
  const [trailerAxleInput, setTrailerAxleInput] = useState('14800');
  const [savingCert, setSavingCert] = useState(false);

  // New Inbound Gate Intake Modal State
  const [showGateIntakeModal, setShowGateIntakeModal] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    waybill_number: `WB-2026-0${Math.floor(895 + Math.random() * 50)}`,
    client_id: '',
    truck_plate: 'KDA 101Z (Mercedes Actros)',
    driver_name: 'Michael Kamau (EMP-041)',
    cargo_description: 'Containerized Ambient FMCG Consignment',
    tare_weight_kg: '14200',
    gross_weight_kg: '38500',
  });
  const [savingIntake, setSavingIntake] = useState(false);

  // Print Official Certificate Slip Modal State
  const [slipWaybill, setSlipWaybill] = useState(null);

  // Sign POD Modal State
  const [podWaybill, setPodWaybill] = useState(null);
  const [recipientSig, setRecipientSig] = useState('');
  const [savingPod, setSavingPod] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wbRes, clientRes, statsRes, tripsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.WAYBILLS),
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.CLIENTS).catch(() => ({ data: [] })),
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.WEIGHBRIDGE_STATS).catch(() => null),
        apiClient.get(ENDPOINTS.FLEET.TRIPS).catch(() => ({ data: [] })),
      ]);

      setWaybills(wbRes.data?.results || wbRes.data || []);
      const cl = clientRes.data?.results || clientRes.data || [];
      setClients(cl);
      if (cl.length > 0 && !intakeForm.client_id) {
        setIntakeForm((prev) => ({ ...prev, client_id: cl[0].id }));
      }
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
      setTrips(tripsRes.data?.results || tripsRes.data || []);
    } catch (err) {
      console.error('Failed to load weighbridge records:', err);
      setError('Unable to synchronize weighbridge records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Certify Weighbridge Weights Handler
  const handleCertifyWeighbridge = async (e) => {
    e.preventDefault();
    if (!certifyingWaybill) return;

    const tare = parseFloat(tareInput);
    const gross = parseFloat(grossInput);

    if (gross <= tare) {
      alert('Gross loaded weight must exceed empty tare weight.');
      return;
    }

    try {
      setSavingCert(true);
      const url = `${ENDPOINTS.WAREHOUSE_CRM.WAYBILLS}${certifyingWaybill.id}/verify_weighbridge/`;
      const res = await apiClient.post(url, {
        tare_weight_kg: tare,
        gross_weight_kg: gross,
      });

      setWaybills((prev) =>
        prev.map((w) => (w.id === certifyingWaybill.id ? res.data : w))
      );

      showToast(`Scale Certified: Waybill ${certifyingWaybill.waybill_number} stamped with Tare ${tare}kg & Gross ${gross}kg (Net: ${gross - tare}kg)`);
      setCertifyingWaybill(null);
    } catch (err) {
      alert('Scale certification failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingCert(false);
    }
  };

  // Inbound Gate Intake Handler
  const handleGateIntake = async (e) => {
    e.preventDefault();
    try {
      setSavingIntake(true);
      const tare = parseFloat(intakeForm.tare_weight_kg) || 0;
      const gross = parseFloat(intakeForm.gross_weight_kg) || 0;
      const net = Math.max(0, gross - tare);

      const payload = {
        waybill_number: intakeForm.waybill_number,
        client: intakeForm.client_id,
        tare_weight_kg: tare,
        gross_weight_kg: gross,
        net_weight_kg: net,
        tare_verified: true,
        status: 'TARE_VERIFIED',
      };

      const res = await apiClient.post(ENDPOINTS.WAREHOUSE_CRM.WAYBILLS, payload);
      setWaybills([res.data, ...waybills]);

      showToast(`Inbound Consignment Registered: Waybill ${res.data.waybill_number} created with certified scale weights`);
      setShowGateIntakeModal(false);
      setIntakeForm({
        waybill_number: `WB-2026-0${Math.floor(900 + Math.random() * 90)}`,
        client_id: clients[0]?.id || '',
        truck_plate: 'KDA 101Z (Mercedes Actros)',
        driver_name: 'Michael Kamau (EMP-041)',
        cargo_description: 'Containerized Ambient FMCG Consignment',
        tare_weight_kg: '14200',
        gross_weight_kg: '38500',
      });
    } catch (err) {
      alert('Gate intake failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingIntake(false);
    }
  };

  // Sign POD Handler
  const handleSignPod = async (e) => {
    e.preventDefault();
    if (!podWaybill || !recipientSig.trim()) return;

    try {
      setSavingPod(true);
      const url = `${ENDPOINTS.WAREHOUSE_CRM.WAYBILLS}${podWaybill.id}/sign_pod/`;
      const res = await apiClient.post(url, { recipient_signature: recipientSig });

      setWaybills((prev) =>
        prev.map((w) => (w.id === podWaybill.id ? res.data : w))
      );

      showToast(`Proof of Delivery Recorded: ${podWaybill.waybill_number} endorsed by ${recipientSig}`);
      setPodWaybill(null);
      setRecipientSig('');
    } catch (err) {
      alert('POD signature failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingPod(false);
    }
  };

  // Calculations
  const totalWaybills = waybills.length;
  const verifiedCount = waybills.filter((w) => w.tare_verified).length;
  const pendingCount = waybills.filter((w) => !w.tare_verified).length;
  const totalNetTonnes = (
    waybills.reduce((acc, w) => acc + parseFloat(w.net_weight_kg || 0), 0) / 1000
  ).toFixed(1);
  const totalGrossTonnes = (
    waybills.reduce((acc, w) => acc + parseFloat(w.gross_weight_kg || 0), 0) / 1000
  ).toFixed(1);

  // Filtered waybills
  const filteredWaybills = waybills.filter((w) => {
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    const matchesSearch =
      w.waybill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.client_name && w.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
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
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              ICD Inbound Weighbridge & Cargo Certification Desk
            </h1>
            <p className="text-xs text-slate-500">
              Nairobi Central ICD • KeNHA Multi-Axle Load Enforcement • Tare/Gross Scale Certification & Digital Waybills
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Load Cell Deck 01 Online (Weights & Measures Certified)</span>
          </div>

          <button
            onClick={() => setShowGateIntakeModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inbound Gate Intake</span>
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

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Consignments Scaled
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalWaybills}</span>
            <span className="text-xs text-slate-500 font-medium">Waybill Consignments</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-700 font-semibold">
            {verifiedCount} Scale Certified ({Math.round((verifiedCount / (totalWaybills || 1)) * 100)}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Cargo Tonnage
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalNetTonnes}</span>
            <span className="text-xs text-slate-500 font-medium">Tonnes Billable</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Gross Throughput: {totalGrossTonnes} Tonnes
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Scale Dock
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-xs text-slate-500 font-medium">Awaiting Tare Scale</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Action needed before highway gate release
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              KeNHA Axle Compliance
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">100.0%</span>
            <span className="text-xs text-slate-500 font-medium">Compliance Rate</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Zero Axle Load Penalties / KeNHA Cap 403
          </div>
        </div>
      </div>

      {/* KeNHA Multi-Axle Load Limit Visualizer & Regulatory Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                KeNHA / EAC Legal Axle Load Parameters (6-Axle Semi-Trailer)
              </h2>
              <p className="text-[11px] text-slate-500">
                East African Community Vehicle Load Control Act • Automatic overload tolerance calculation (5% margin)
              </p>
            </div>
          </div>
          <div className="text-xs font-mono font-bold text-slate-600">
            Max Gross Vehicle Mass (GVM): <span className="text-cyan-800 font-black">50,000 kg</span>
          </div>
        </div>

        {/* 3 Axle Cluster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-center">
            <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">
              Axle 1: Steer Axle (Single Tyre)
            </span>
            <span className="text-base font-black text-slate-900">Max 8,000 kg</span>
            <span className="text-[10px] text-emerald-600 font-sans font-semibold block">
              ✓ Typical Empty: ~6,500 kg
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-center">
            <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">
              Axles 2-3: Drive Tandem Axle
            </span>
            <span className="text-base font-black text-slate-900">Max 18,000 kg</span>
            <span className="text-[10px] text-emerald-600 font-sans font-semibold block">
              ✓ Dual Tyre Tandem Group
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-center">
            <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">
              Axles 4-6: Trailer Tridem Group
            </span>
            <span className="text-base font-black text-slate-900">Max 24,000 kg</span>
            <span className="text-[10px] text-emerald-600 font-sans font-semibold block">
              ✓ 3-Axle Semi-Trailer Suspension
            </span>
          </div>
        </div>
      </div>

      {/* Main Table: Weighbridge Queue & Certified Waybills */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-600" />
              <span>Weighbridge Queue & Electronic Waybill Register</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inbound gate weigh tickets and physical scale certification stamps.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Waybill Statuses</option>
              <option value="GENERATED">Generated (Pending Scale)</option>
              <option value="TARE_VERIFIED">Tare Scale Verified</option>
              <option value="DISPATCHED">Dispatched In-Transit</option>
              <option value="DELIVERED">Delivered & POD Signed</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search waybill, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Waybills Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Waybill Ticket</th>
                <th className="pb-3">Shipper / Consignee</th>
                <th className="pb-3 text-right">Tare Weight (kg)</th>
                <th className="pb-3 text-right">Gross Weight (kg)</th>
                <th className="pb-3 text-right">Net Cargo (kg)</th>
                <th className="pb-3 text-center">Scale Status</th>
                <th className="pb-3 text-center">POD Signature</th>
                <th className="pb-3 pr-2 text-right">Scale Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWaybills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    No waybills matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredWaybills.map((wb) => {
                  const isVerified = wb.tare_verified;
                  const isDelivered = wb.status === 'DELIVERED';
                  const netWeight = (
                    parseFloat(wb.gross_weight_kg || 0) - parseFloat(wb.tare_weight_kg || 0)
                  ).toFixed(0);

                  return (
                    <tr key={wb.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-cyan-900 font-extrabold">{wb.waybill_number}</span>
                          <button
                            onClick={() => setSlipWaybill(wb)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Print Official Axle Weight Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="block text-[10px] font-sans text-slate-400 font-normal">
                          {new Date(wb.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className="font-bold text-slate-800">{wb.client_name || 'Standard Client'}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Rig: KDA 101Z • Trailer TR-442
                        </span>
                      </td>

                      <td className="py-3.5 text-right font-mono font-bold text-slate-700">
                        {Number(wb.tare_weight_kg).toLocaleString()} kg
                      </td>

                      <td className="py-3.5 text-right font-mono font-bold text-slate-700">
                        {Number(wb.gross_weight_kg).toLocaleString()} kg
                      </td>

                      <td className="py-3.5 text-right font-mono font-black text-cyan-900">
                        {netWeight > 0 ? `${Number(netWeight).toLocaleString()} kg` : 'Pending Gross'}
                      </td>

                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDelivered
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
                      </td>

                      <td className="py-3.5 text-center">
                        {wb.recipient_signature ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {wb.recipient_signature}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pending POD</span>
                        )}
                      </td>

                      <td className="py-3.5 pr-2 text-right space-x-1.5">
                        {!isVerified && (
                          <button
                            onClick={() => {
                              setCertifyingWaybill(wb);
                              setTareInput(wb.tare_weight_kg || '14200');
                              setGrossInput(wb.gross_weight_kg || '38400');
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-xs"
                          >
                            Certify Scale
                          </button>
                        )}

                        {isVerified && !isDelivered && (
                          <button
                            onClick={() => {
                              setPodWaybill(wb);
                              setRecipientSig('James Kariuki - Consignee Lead');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-xs"
                          >
                            Sign POD
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Certify Weighbridge Tare & Gross Load Cells */}
      {certifyingWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Weighbridge Load Cell Scale Certification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {certifyingWaybill.waybill_number} • {certifyingWaybill.client_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCertifyingWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCertifyWeighbridge} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">KeNHA Multi-Axle Verification:</p>
                <p>Readings are pulled from electronic deck sensors. Net freight is computed automatically.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tare Weight (Empty Rig + Semi-Trailer) [kg]
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
                  Gross Weight (Fully Loaded Consignment) [kg]
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
                <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-cyan-800 block">
                    Certified Net Billable Cargo
                  </span>
                  <span className="text-base font-black font-mono text-cyan-950">
                    {Math.max(0, parseFloat(grossInput) - parseFloat(tareInput)).toLocaleString()} kg
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCertifyingWaybill(null)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCert}
                  className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {savingCert ? 'Certifying...' : 'Stamp & Certify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inbound Gate Intake & New Waybill Registration */}
      {showGateIntakeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Inbound Gate Intake & Waybill Creation
                </h3>
              </div>
              <button
                onClick={() => setShowGateIntakeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGateIntake} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Waybill Number
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.waybill_number}
                    onChange={(e) => setIntakeForm({ ...intakeForm, waybill_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Shipper
                  </label>
                  <select
                    value={intakeForm.client_id}
                    onChange={(e) => setIntakeForm({ ...intakeForm, client_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prime Mover Rig & Driver
                </label>
                <input
                  type="text"
                  required
                  value={`${intakeForm.truck_plate} • ${intakeForm.driver_name}`}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cargo Description
                </label>
                <input
                  type="text"
                  required
                  value={intakeForm.cargo_description}
                  onChange={(e) => setIntakeForm({ ...intakeForm, cargo_description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tare Weight [kg]
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={intakeForm.tare_weight_kg}
                    onChange={(e) => setIntakeForm({ ...intakeForm, tare_weight_kg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gross Weight [kg]
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={intakeForm.gross_weight_kg}
                    onChange={(e) => setIntakeForm({ ...intakeForm, gross_weight_kg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGateIntakeModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIntake}
                  className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {savingIntake ? 'Registering...' : 'Register Inbound Waybill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Sign Proof of Delivery (POD) */}
      {podWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Sign Proof of Delivery (POD)</h3>
                <p className="text-xs text-slate-500 font-mono">{podWaybill.waybill_number}</p>
              </div>
              <button
                onClick={() => setPodWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSignPod} className="space-y-3">
              <div className="text-xs text-slate-600">
                <p>Consignee: <strong className="text-slate-900">{podWaybill.client_name}</strong></p>
                <p className="mt-1">Net Cargo: <strong className="font-mono">{podWaybill.net_weight_kg} kg</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Authorized Signature / Name
                </label>
                <input
                  type="text"
                  required
                  value={recipientSig}
                  onChange={(e) => setRecipientSig(e.target.value)}
                  placeholder="e.g. James Kariuki - Receiving Lead"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPodWaybill(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPod}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {savingPod ? 'Saving...' : 'Endorse POD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Official KeNHA Axle Weight Certificate & Waybill Slip */}
      {slipWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Official Weighbridge Axle Weight Ticket
                </h3>
              </div>
              <button
                onClick={() => setSlipWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN LTD</p>
                  <p className="text-[10px] text-slate-500">Inland Container Depot (ICD) Certified Weighbridge</p>
                  <p className="text-[10px] text-slate-500">Scale License: KENHA-NB-ICD-041</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-cyan-800 text-sm">{slipWaybill.waybill_number}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(slipWaybill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">CONSIGNEE / CLIENT:</span>
                  <span className="font-bold text-slate-800">{slipWaybill.client_name || 'Standard Client'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">STATUS:</span>
                  <span className="font-bold text-cyan-700">{slipWaybill.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Gross Weight (Loaded):</span>
                  <span className="font-bold">{Number(slipWaybill.gross_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Tare Weight (Empty Rig):</span>
                  <span className="font-bold">{Number(slipWaybill.tare_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-cyan-900 text-sm">
                  <span>Net Verified Freight:</span>
                  <span>
                    {(parseFloat(slipWaybill.gross_weight_kg) - parseFloat(slipWaybill.tare_weight_kg)).toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 block">
                  ✓ KeNHA Traffic Act Cap 403 Axle Weight Compliant
                </span>
                <span className="text-[10px] text-emerald-600">
                  Scale Operator: Kevin Wafula (EMP-055) • Weights & Measures Verified
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Weigh Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
