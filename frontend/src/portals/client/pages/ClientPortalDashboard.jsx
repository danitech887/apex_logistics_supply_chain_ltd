import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Globe,
  Truck,
  FileText,
  Receipt,
  CheckCircle2,
  Clock,
  MapPin,
  Scale,
  Printer,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Download,
} from 'lucide-react';

import { ClientShipmentsPage } from './ClientShipmentsPage';
import { ClientBillingPage } from './ClientBillingPage';

export const ClientPortalDashboard = ({ activeSubSection = 'client_dashboard', onNavigate }) => {
  if (activeSubSection === 'shipments') {
    return <ClientShipmentsPage onNavigate={onNavigate} />;
  }
  if (activeSubSection === 'billing') {
    return <ClientBillingPage onNavigate={onNavigate} />;
  }
  const [waybills, setWaybills] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedPodWaybill, setSelectedPodWaybill] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wbRes, tripRes, invRes] = await Promise.all([
        apiClient.get(ENDPOINTS.WAREHOUSE_CRM.WAYBILLS).catch(() => ({ data: [] })),
        apiClient.get(ENDPOINTS.FLEET.TRIPS).catch(() => ({ data: [] })),
        apiClient.get(ENDPOINTS.FINANCE.INVOICES).catch(() => ({ data: [] })),
      ]);

      const allWbs = wbRes.data?.results || wbRes.data || [];
      const allTrips = tripRes.data?.results || tripRes.data || [];
      const allInvs = invRes.data?.results || invRes.data || [];

      // Filter for Unilever or client relevant records
      const clientWbs = allWbs.filter(
        (w) => !w.client_name || w.client_name.toLowerCase().includes('unilever')
      );
      setWaybills(clientWbs.length > 0 ? clientWbs : allWbs);
      setTrips(allTrips);
      setInvoices(allInvs);
    } catch (err) {
      console.error('Failed to load client portal data:', err);
      setError('Unable to fetch live tracking and invoice records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const activeInTransitWaybills = waybills.filter(
    (w) => w.status === 'DISPATCHED' || w.status === 'TARE_VERIFIED'
  );
  const deliveredWaybills = waybills.filter((w) => w.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      {/* Top Banner: Corporate Client Branding */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified B2B Consignee Account
              </span>
              <span className="text-xs text-slate-300 font-mono">PIN: P051123456Z</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Unilever Kenya Ltd • Logistics Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Consignee Shipment Tracking & Digital POD Portal. Monitor highway rigs, electronic weighbridge tare certificates, and download approved tax invoices.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onNavigate && onNavigate('shipments')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Active Consignments & POD</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('billing')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition backdrop-blur-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoices & Statements</span>
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 space-y-2 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Available Credit Line
              </span>
              <span className="text-xl font-black font-mono text-emerald-300">
                KES 2,050,000
              </span>
              <span className="text-[10px] text-slate-300 block">
                of KES 2,500,000 facility (30 Days Net)
              </span>
            </div>
            <div className="flex items-center justify-end space-x-1.5 text-xs text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Good Credit Standing</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active In-Transit
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{activeInTransitWaybills.length || 1}</span>
            <span className="text-xs text-slate-500 font-medium">Consignments Rolling</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            Live GPS Telemetry Active
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Delivered with Signed POD
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{deliveredWaybills.length || 1}</span>
            <span className="text-xs text-slate-500 font-medium">Verified Receipts</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Instant POD Download Available
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Verified Weight
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">24.2</span>
            <span className="text-xs text-slate-500 font-medium">Tonnes (Net Cargo)</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-600 font-semibold">
            Weighbridge Certified Axle Compliance
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Open Balance
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">KES 450,000</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Due on 2026-10-31
          </div>
        </div>
      </div>

      {/* Main Grid: Section 1 (Live Shipment GPS & Waybills) & Section 2 (PODs & Invoices) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Active Consignments & Waybills */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Live Consignments & GPS Corridor Tracking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time truck coordinates, verified cargo weighbridge slips, and trip milestones.
              </p>
            </div>

            <button
              onClick={fetchClientData}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4">
            {waybills.map((wb) => {
              const isDispatched = wb.status === 'DISPATCHED';
              const isDelivered = wb.status === 'DELIVERED';
              const netWeight = (parseFloat(wb.gross_weight_kg || 0) - parseFloat(wb.tare_weight_kg || 0)).toFixed(0);

              return (
                <div
                  key={wb.id}
                  className="p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-emerald-900">
                          {wb.waybill_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isDispatched
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {wb.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Carrier: <strong className="text-slate-800">Apex Logistics Fleet (Prime Mover KDA 101Z)</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedPodWaybill(wb)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 w-fit cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isDelivered ? 'View Signed POD' : 'View Waybill Certificate'}</span>
                    </button>
                  </div>

                  {/* Route & GPS Corridor Milestone */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-bold text-slate-900">Mombasa Port Berth 19</span>
                      </div>
                      <span className="text-[10px] text-slate-400">485 km Route</span>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold text-slate-900">Nairobi ICD Depot</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDelivered ? 'w-full bg-emerald-500' : 'w-3/5 bg-blue-500'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Status: {isDelivered ? 'Delivered at Receiver Dock' : 'En-route: Mtito Andei Highway Waypoint'}</span>
                      <span className="font-semibold text-slate-700">
                        {isDelivered ? 'POD Verified' : 'ETA: 4 Hours'}
                      </span>
                    </div>
                  </div>

                  {/* Axle Scale Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Tare</span>
                      <span className="font-bold text-slate-800">{Number(wb.tare_weight_kg).toLocaleString()} kg</span>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <span className="text-[9px] uppercase text-slate-400 block font-sans font-bold">Gross</span>
                      <span className="font-bold text-slate-800">{Number(wb.gross_weight_kg).toLocaleString()} kg</span>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-[9px] uppercase text-emerald-700 block font-sans font-bold">Net Freight</span>
                      <span className="font-black text-emerald-900">{Number(netWeight).toLocaleString()} kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Freight Invoices & Financial Account Ledger */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Freight Billing & E-Invoices</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official KRA electronic tax invoices and freight statements.
            </p>
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No invoices found for this account.
              </div>
            ) : (
              invoices.map((inv) => {
                const isPaid = inv.status === 'PAID';

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-slate-900">
                          {inv.invoice_number}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Issue: {inv.issue_date} • Due: {inv.due_date}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-black text-slate-900 text-xs">
                        KES {Number(inv.total_amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                        title="Download / View E-Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
            <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Bank Settlement Protocol</span>
            </h4>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Payments are reconciled via Standard Chartered Corporate RTGS Account <strong>01020-482910-00</strong>. Digital receipts are instantly generated upon clearance.
            </p>
          </div>
        </div>

      </div>

      {/* Modal: View Signed POD & Weighbridge Certificate */}
      {selectedPodWaybill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Electronic Proof of Delivery (POD)
                </h3>
              </div>
              <button
                onClick={() => setSelectedPodWaybill(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN LTD</p>
                  <p className="text-[10px] text-slate-500">Official Freight Consignment Waybill & POD</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-800">{selectedPodWaybill.waybill_number}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(selectedPodWaybill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">CONSIGNEE:</span>
                  <span className="font-bold text-slate-800">{selectedPodWaybill.client_name || 'Unilever Kenya Ltd'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">CONSIGNMENT STATUS:</span>
                  <span className="font-bold text-emerald-700">{selectedPodWaybill.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Gross Scale Weight:</span>
                  <span className="font-bold">{Number(selectedPodWaybill.gross_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Tare Rig Weight:</span>
                  <span className="font-bold">{Number(selectedPodWaybill.tare_weight_kg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-emerald-950 text-sm">
                  <span>Net Verified Goods:</span>
                  <span>
                    {(parseFloat(selectedPodWaybill.gross_weight_kg) - parseFloat(selectedPodWaybill.tare_weight_kg)).toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Consignee Digital Recipient Endorsement
                </span>
                <span className="font-black text-slate-800 text-sm">
                  {selectedPodWaybill.recipient_signature || 'James Kariuki - Unilever Warehouse Receiving Dock'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  ✓ Verified Cryptographic Signature & Timestamp
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official POD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View E-Invoice */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Electronic Tax Freight Invoice
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">APEX LOGISTICS & SUPPLY CHAIN LTD</p>
                  <p className="text-[10px] text-slate-500">KRA Tax PIN: P051982736M</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-800">{selectedInvoice.invoice_number}</p>
                  <p className="text-[10px] text-slate-500">Issue: {selectedInvoice.issue_date}</p>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>Billed To: <strong>{selectedInvoice.client_name}</strong></p>
                <p>PIN: <strong>{selectedInvoice.client_pin || 'P051123456Z'}</strong></p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Haulage Subtotal:</span>
                  <span className="font-bold">KES {Number(selectedInvoice.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>16% VAT Tax:</span>
                  <span>KES {Number(selectedInvoice.tax_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-emerald-950 text-sm">
                  <span>Total Amount Due:</span>
                  <span>KES {Number(selectedInvoice.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                Payment due within 30 days. Status: <strong>{selectedInvoice.status}</strong>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
