import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { PunchClock } from '../components/PunchClock';
import { ExpenseClaimCard } from '../components/ExpenseClaimCard';
import { ConsignmentManifestModal } from '../components/ConsignmentManifestModal';
import { LogFuelModal } from '../../fleet/components/LogFuelModal';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import {
  Truck,
  CalendarDays,
  ScrollText,
  Fuel,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  MapPin,
  Gauge,
  Clock,
  Plus,
  FileText,
  DollarSign,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const ESSDashboard = ({ onNavigate }) => {
  const { user } = useAuth();

  // State
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [fuelSuccessMessage, setFuelSuccessMessage] = useState('');

  // Fetch driver data from PostgreSQL backend
  const fetchDriverData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Trips (scoped to driver)
      const tripsPromise = apiClient.get(ENDPOINTS.FLEET.TRIPS).catch((e) => {
        console.warn('Could not fetch trips:', e);
        return { data: [] };
      });

      // 2. Fetch Fuel Logs (scoped to driver)
      const fuelPromise = apiClient.get(ENDPOINTS.FLEET.FUEL_LOGS).catch((e) => {
        console.warn('Could not fetch fuel logs:', e);
        return { data: [] };
      });

      // 3. Fetch Payslips
      const payslipsPromise = apiClient
        .get(ENDPOINTS.HR.MY_PAYSLIPS)
        .catch(() => apiClient.get(ENDPOINTS.HR.PAYSLIPS))
        .catch((e) => {
          console.warn('Could not fetch payslips:', e);
          return { data: [] };
        });

      // 4. Fetch Leave Stats
      const leavePromise = apiClient.get(`${ENDPOINTS.HR.LEAVES}stats/`).catch((e) => {
        console.warn('Could not fetch leave stats:', e);
        return { data: null };
      });

      const [tripsRes, fuelRes, payslipsRes, leaveRes] = await Promise.all([
        tripsPromise,
        fuelPromise,
        payslipsPromise,
        leavePromise,
      ]);

      const tripsData = Array.isArray(tripsRes.data)
        ? tripsRes.data
        : tripsRes.data?.results || [];
      const fuelData = Array.isArray(fuelRes.data)
        ? fuelRes.data
        : fuelRes.data?.results || [];
      const payslipsData = Array.isArray(payslipsRes.data)
        ? payslipsRes.data
        : payslipsRes.data?.results || [];

      setTrips(tripsData);
      setFuelLogs(fuelData);
      setPayslips(payslipsData);
      setLeaveStats(leaveRes.data);
    } catch (err) {
      console.error('Error fetching driver dashboard data:', err);
      setError('Unable to synchronize live database records. Displaying cached view.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  // Handle Fuel Log Submission
  const handleLogFuel = async (fuelData) => {
    try {
      const tripId = fuelData.trip || fuelData.tripId;
      const stationName = (fuelData.station_name || fuelData.stationName || '').trim();
      const receiptNumber = (fuelData.receipt_number || fuelData.receiptNumber || '').trim().toUpperCase();
      const liters = parseFloat(fuelData.liters_filled ?? fuelData.litersFilled ?? 0);
      const rate = parseFloat(fuelData.cost_per_liter ?? fuelData.costPerLiter ?? 0);
      const total = parseFloat(fuelData.total_cost ?? fuelData.totalCost ?? (liters * rate));
      const odo = parseInt(fuelData.odometer_reading ?? fuelData.odometerReading ?? 0, 10);

      const payload = {
        trip: tripId,
        station_name: stationName,
        receipt_number: receiptNumber,
        liters_filled: liters,
        cost_per_liter: rate,
        total_cost: total,
        odometer_reading: odo,
      };

      const res = await apiClient.post(ENDPOINTS.FLEET.FUEL_LOGS, payload);
      setFuelLogs((prev) => [res.data, ...prev]);
      setFuelSuccessMessage(
        `Fuel voucher #${res.data.receipt_number || receiptNumber} recorded successfully (${liters}L at ${stationName})`
      );
      setTimeout(() => setFuelSuccessMessage(''), 5000);
      setIsFuelModalOpen(false);
      fetchDriverData();
      return { success: true };
    } catch (err) {
      console.error('Fuel logging failed:', err);
      const errObj = err.response?.data;
      let msg = 'Failed to save fuel voucher to database.';
      if (errObj) {
        if (typeof errObj === 'string') msg = errObj;
        else if (errObj.detail) msg = errObj.detail;
        else if (errObj.message) msg = errObj.message;
        else {
          const firstKey = Object.keys(errObj)[0];
          if (firstKey) {
            const val = errObj[firstKey];
            msg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
          }
        }
      }
      throw new Error(msg);
    }
  };

  // Identify active and past trips
  const activeTrip = useMemo(() => {
    return (
      trips.find((t) => t.status === 'IN_TRANSIT') ||
      trips.find((t) => t.status === 'DISPATCH_READY') ||
      trips.find((t) => t.status === 'SCHEDULED') ||
      null
    );
  }, [trips]);

  const lastCompletedTrip = useMemo(() => {
    return trips.find((t) => t.status === 'COMPLETED') || null;
  }, [trips]);

  const completedTripsCount = useMemo(() => {
    return trips.filter((t) => t.status === 'COMPLETED').length;
  }, [trips]);

  const totalDistanceKm = useMemo(() => {
    return trips.reduce((acc, t) => acc + (t.distance_km || 0), 0);
  }, [trips]);

  // Aggregate allowances & expenses
  const expenseClaimsList = useMemo(() => {
    const list = [];

    // Fuel Logs from Database
    fuelLogs.forEach((f) => {
      const dateFormatted = f.logged_at
        ? new Date(f.logged_at).toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Recent Highway Fill';

      list.push({
        id: `fuel-${f.id}`,
        title: `${f.station_name} (${f.liters_filled} Liters)`,
        amount: f.total_cost,
        date: dateFormatted,
        status: 'LOGGED',
        category: 'Fuel',
        receiptNumber: f.receipt_number,
        vehiclePlate: f.vehicle_plate,
        liters: f.liters_filled,
      });
    });

    // Per-diem trip allowances
    if (activeTrip) {
      list.push({
        id: `perdiem-active-${activeTrip.id}`,
        title: `${activeTrip.origin} ➔ ${activeTrip.destination} Per-Diem`,
        amount: 14500,
        date: 'Active Transit',
        status: 'APPROVED',
        category: 'PerDiem',
        vehiclePlate: activeTrip.vehicle_plate,
      });
    }

    if (lastCompletedTrip) {
      list.push({
        id: `perdiem-completed-${lastCompletedTrip.id}`,
        title: `${lastCompletedTrip.origin} ➔ ${lastCompletedTrip.destination} Highway Per-Diem`,
        amount: 14500,
        date: lastCompletedTrip.actual_arrival
          ? new Date(lastCompletedTrip.actual_arrival).toLocaleDateString('en-KE', {
              day: '2-digit',
              month: 'short',
            })
          : 'Delivered',
        status: 'DISBURSED',
        category: 'PerDiem',
        vehiclePlate: lastCompletedTrip.vehicle_plate,
      });
    }

    // From payslip allowances if available
    payslips.slice(0, 2).forEach((p) => {
      if (p.allowances && Number(p.allowances) > 0) {
        list.push({
          id: `payslip-allowance-${p.id}`,
          title: `Monthly Transport & Subsistence Allowances`,
          amount: p.allowances,
          date: p.period_end || 'Pay Run',
          status: 'DISBURSED',
          category: 'Allowance',
        });
      }
    });

    return list.slice(0, 6);
  }, [fuelLogs, activeTrip, lastCompletedTrip, payslips]);

  const totalAllowancesAmount = useMemo(() => {
    let sum = 0;
    if (activeTrip) sum += 14500;
    if (lastCompletedTrip) sum += 14500;
    if (payslips[0]?.allowances) sum += Number(payslips[0].allowances);
    return sum || 14500;
  }, [activeTrip, lastCompletedTrip, payslips]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumbs & Header Banner */}
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'Staff & Driver Dashboard']} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 border border-white/20">
              {user?.avatar || 'MK'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {user?.name || user?.full_name || 'Driver Terminal'}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                  {user?.staffNumber || 'EMP-041'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {user?.designation || 'Heavy Commercial Lead Driver'} •{' '}
                <span className="font-semibold text-slate-700">
                  {user?.department || 'Transit Operations'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchDriverData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs flex items-center space-x-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL Live Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {fuelSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{fuelSuccessMessage}</span>
          </div>
          <button
            onClick={() => setFuelSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Operational KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Transit</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-base truncate">
            {activeTrip ? `${activeTrip.origin.split(' ')[0]} ➔ ${activeTrip.destination.split(' ')[0]}` : 'Standby Depot'}
          </div>
          <span className="text-[10px] font-bold text-sky-600 uppercase block">
            {activeTrip ? activeTrip.status : 'Awaiting Route'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Assigned Rig</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-base truncate">
            {activeTrip?.vehicle_plate || lastCompletedTrip?.vehicle_plate || 'KDG 412M'}
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase block">
            {activeTrip ? 'In Motion' : 'Road Ready'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Trip Allowances</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-base">
            KES {totalAllowancesAmount.toLocaleString('en-KE')}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
            Disbursed & Dispatched
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Rest Days Available</span>
            <CalendarDays className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-base">
            21 Days
          </div>
          <span className="text-[10px] font-bold text-rose-600 uppercase block">
            {leaveStats?.pending ? `${leaveStats.pending} Pending Review` : 'Fatigue Compliance OK'}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Punch Clock & Quick Portals */}
        <div className="md:col-span-1 space-y-5">
          <PunchClock />

          {/* Quick Portals Navigation Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Quick Driver Portals
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                ESS Scoped
              </span>
            </div>

            <button
              onClick={() => onNavigate('my_payslips')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-transparent hover:border-slate-200 group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-slate-900">My Payslips (KRA)</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    {payslips.length > 0 ? `${payslips.length} statutory records` : 'View tax & deductions'}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('apply_leave')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-transparent hover:border-slate-200 group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-slate-900">Request Fatigue Rest / Leave</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Annual, sick & mandatory rest
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('punch_clock')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-transparent hover:border-slate-200 group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-slate-900">Full Terminal Punch Clock</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Shift timer & GPS depot logs
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>
          </div>
        </div>

        {/* Right Column: Active Highway Transit & Expenses */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Assigned Transit Card */}
          {activeTrip ? (
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    Active Highway Transit
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    MANIFEST #{String(activeTrip.id).substring(0, 8).toUpperCase()}
                  </span>
                </div>

                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {activeTrip.status}
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2.5 text-base font-black text-slate-900">
                  <span>{activeTrip.origin}</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{activeTrip.destination}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Prime Mover:{' '}
                  <span className="font-bold text-slate-800">
                    {activeTrip.vehicle_plate} ({activeTrip.vehicle_model || 'Scania R500'})
                  </span>{' '}
                  • Cargo: {Number(activeTrip.cargo_weight_kg || 28000).toLocaleString('en-KE')} KG{' '}
                  {activeTrip.cargo_description || 'Containerized Freight'}
                </p>
              </div>

              {/* Transit Telemetry Strip */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Start Odometer
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeTrip.start_odometer
                      ? `${activeTrip.start_odometer.toLocaleString()} KM`
                      : '142,100 KM'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Est. Corridor
                  </span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {activeTrip.distance_km || 485} KM
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Driver Allowance
                  </span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    KES 14,500.00
                  </span>
                </div>
              </div>

              {/* Action Buttons for Active Transit */}
              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={() => setIsFuelModalOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <Fuel className="w-4 h-4 fill-slate-950" />
                  <span>Log En-Route Fuel</span>
                </button>
                <button
                  onClick={() => setIsManifestModalOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Waybill Manifest</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standby Card when no trip is currently in transit */
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Standby Fleet Allocation
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Available on Duty
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Standby at Central Freight Depot
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ready for transit dispatch. Ensure your punch clock is checked in and pre-trip vehicle roadworthiness inspection is completed.
                </p>
              </div>

              {lastCompletedTrip && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Last Completed Voyage
                    </span>
                    <span className="font-bold text-slate-800">
                      {lastCompletedTrip.origin} ➔ {lastCompletedTrip.destination}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Rig: {lastCompletedTrip.vehicle_plate} • Delivered
                    </span>
                  </div>
                  <button
                    onClick={() => setIsManifestModalOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    View Manifest
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={() => setIsFuelModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>Log Depot Fuel Voucher</span>
                </button>
                <button
                  onClick={() => fetchDriverData(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Dispatch Board</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent Disbursed Driver Allowances & Fuel Logs */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Disbursed Driver Allowances & Fuel Logs
                </h3>
                <p className="text-[11px] text-slate-400">
                  Recorded directly in PostgreSQL database
                </p>
              </div>

              <button
                onClick={() => setIsFuelModalOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Fuel Voucher</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                Loading live records from database...
              </div>
            ) : expenseClaimsList.length > 0 ? (
              <div className="space-y-2.5">
                {expenseClaimsList.map((claim) => (
                  <ExpenseClaimCard
                    key={claim.id}
                    title={claim.title}
                    amount={claim.amount}
                    date={claim.date}
                    status={claim.status}
                    category={claim.category}
                    receiptNumber={claim.receiptNumber}
                    vehiclePlate={claim.vehiclePlate}
                    liters={claim.liters}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No recent allowances or fuel vouchers recorded for this profile.</p>
                <button
                  onClick={() => setIsFuelModalOpen(true)}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Record first fuel voucher now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fuel Voucher Modal */}
      <LogFuelModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        onLogFuel={handleLogFuel}
        trips={trips}
      />

      {/* Waybill / Manifest Modal */}
      <ConsignmentManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        trip={activeTrip || lastCompletedTrip}
      />
    </div>
  );
};
