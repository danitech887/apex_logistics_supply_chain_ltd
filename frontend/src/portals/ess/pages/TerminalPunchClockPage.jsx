import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { useAuth } from '../../../hooks/useAuth';
import {
  Clock,
  Play,
  Square,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  History,
  Gauge,
  Calendar,
  Navigation,
  ArrowRight,
  Fuel,
} from 'lucide-react';

export const TERMINAL_CHECKPOINTS = [
  {
    name: 'Mombasa Port CFS Terminal • Gate 3',
    code: 'CFS-GATE-03',
    coords: '4.0435° S, 39.6682° E',
    type: 'PORT_ORIGIN',
  },
  {
    name: 'Nairobi ICD Embakasi Dock • Bay 12',
    code: 'ICD-EMB-12',
    coords: '1.3204° S, 36.8876° E',
    type: 'INLAND_DEPOT',
  },
  {
    name: 'Mtito Andei Highway Waypoint • KM 240',
    code: 'MTO-WYP-240',
    coords: '2.6917° S, 38.1683° E',
    type: 'HIGHWAY_CHECKPOINT',
  },
  {
    name: 'Voi Corridor Weighbridge Station',
    code: 'VOI-WBR-01',
    coords: '3.3967° S, 38.5562° E',
    type: 'WEIGHBRIDGE',
  },
  {
    name: 'Nakuru Silos Regional Depot',
    code: 'NKR-SLO-04',
    coords: '0.2833° S, 36.0667° E',
    type: 'REGIONAL_DEPOT',
  },
];

export const TerminalPunchClockPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const userKey = `apex_punch_shift_${user?.email || 'driver'}`;

  // Read saved shift state
  const [shiftState, setShiftState] = useState(() => {
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      clockedIn: false,
      clockInTime: null,
      clockInEpoch: null,
      checkpoint: TERMINAL_CHECKPOINTS[0].name,
      startOdometer: '142100',
      endOdometer: '',
      history: [
        {
          id: 'shift-1',
          date: '07 Oct 2026',
          clockIn: '06:30 AM',
          clockOut: '03:45 PM',
          duration: '09h 15m 00s',
          location: 'Mombasa Port CFS Terminal • Gate 3',
          startOdo: 141615,
          endOdo: 142100,
          distance: 485,
        },
        {
          id: 'shift-2',
          date: '05 Oct 2026',
          clockIn: '07:00 AM',
          clockOut: '04:15 PM',
          duration: '09h 15m 00s',
          location: 'Nairobi ICD Embakasi Dock • Bay 12',
          startOdo: 141130,
          endOdo: 141615,
          distance: 485,
        },
      ],
    };
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-KE'));
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('en-KE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  );
  const [elapsed, setElapsed] = useState('00h 00m 00s');
  const [odoInput, setOdoInput] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Clock ticker & elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-KE'));

      if (shiftState.clockedIn && shiftState.clockInEpoch) {
        const diffMs = Math.max(0, now.getTime() - shiftState.clockInEpoch);
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        setElapsed(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [shiftState.clockedIn, shiftState.clockInEpoch]);

  // Persist shiftState to localStorage
  const updateShiftState = (newState) => {
    setShiftState(newState);
    try {
      localStorage.setItem(userKey, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to save punch clock state:', e);
    }
  };

  const selectedCheckpointObj = useMemo(() => {
    return (
      TERMINAL_CHECKPOINTS.find((c) => c.name === shiftState.checkpoint) ||
      TERMINAL_CHECKPOINTS[0]
    );
  }, [shiftState.checkpoint]);

  // Handle Clock In / Out
  const handleToggleClock = () => {
    const now = new Date();

    if (!shiftState.clockedIn) {
      // Clock In
      const startOdoVal = odoInput ? parseInt(odoInput, 10) : 142100;
      const newState = {
        ...shiftState,
        clockedIn: true,
        clockInTime: now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
        clockInEpoch: now.getTime(),
        startOdometer: startOdoVal,
      };
      updateShiftState(newState);
      setOdoInput('');
      setActionNotice(`Checked IN at ${selectedCheckpointObj.name} (Start Odo: ${startOdoVal.toLocaleString()} KM)`);
      setTimeout(() => setActionNotice(''), 5000);
    } else {
      // Clock Out
      const clockOutTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const endOdoVal = odoInput ? parseInt(odoInput, 10) : (shiftState.startOdometer || 142100) + 485;
      const startOdoVal = shiftState.startOdometer || 142100;
      const dist = Math.max(0, endOdoVal - startOdoVal);

      const completedShift = {
        id: `shift-${Date.now()}`,
        date: now.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
        clockIn: shiftState.clockInTime,
        clockOut: clockOutTime,
        duration: elapsed,
        location: shiftState.checkpoint,
        startOdo: startOdoVal,
        endOdo: endOdoVal,
        distance: dist,
      };

      const newState = {
        ...shiftState,
        clockedIn: false,
        clockInTime: null,
        clockInEpoch: null,
        history: [completedShift, ...(shiftState.history || [])].slice(0, 10),
      };

      updateShiftState(newState);
      setOdoInput('');
      setElapsed('00h 00m 00s');
      setActionNotice(
        `Checked OUT at ${selectedCheckpointObj.name}. Shift duration: ${completedShift.duration} (${dist} KM logged)`
      );
      setTimeout(() => setActionNotice(''), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs items={['Employee Self-Service (ESS)', 'Terminal Punch Clock']} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Highway Transit Terminal Punch Clock
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                EAT (UTC+3)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time shift recording, GPS depot check-ins, and roadworthiness shift hours compliance
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PWA Offline Sync Enabled</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Duty Status</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                shiftState.clockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>
          <div className="font-mono font-black text-slate-900 text-lg">
            {shiftState.clockedIn ? 'ON DUTY' : 'OFF DUTY'}
          </div>
          <span
            className={`text-[10px] font-bold uppercase block ${
              shiftState.clockedIn ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {shiftState.clockedIn ? 'In Active Transit Shift' : 'Rest / Standby'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Shift Timer</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-lg">
            {shiftState.clockedIn ? elapsed : '00h 00m 00s'}
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase block">
            {shiftState.clockedIn ? `Started at ${shiftState.clockInTime}` : 'Timer Standby'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Corridor Terminal</span>
            <MapPin className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm truncate" title={selectedCheckpointObj.name}>
            {selectedCheckpointObj.name.split('•')[0]}
          </div>
          <span className="text-[10px] font-mono text-slate-500 block truncate">
            {selectedCheckpointObj.coords}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Weekly Hours Cap</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-black text-slate-900 text-lg">
            18.5 / 48 hrs
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
            KeNHA Compliant
          </span>
        </div>
      </div>

      {/* Main Terminal Interaction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Big Terminal Clock (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl border border-indigo-900/50 space-y-6">
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Driver Terminal Dispatch Interface
                  </h3>
                  <p className="text-[11px] text-indigo-300">
                    Logged Driver: {user?.name || 'Michael Kamau'} ({user?.staffNumber || 'EMP-041'})
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  Kenya Standard Time
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">EAT (UTC+3)</span>
              </div>
            </div>

            {/* Live Clock Display */}
            <div className="text-center py-4 space-y-2">
              <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block">
                {currentDate}
              </span>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {currentTime}
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    shiftState.clockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="font-mono font-bold tracking-wider">
                  STATUS: {shiftState.clockedIn ? 'ACTIVE ON DUTY' : 'OFF DUTY'}
                </span>
              </div>
            </div>

            {/* Checkpoint Location & Odometer Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/50 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Depot Checkpoint</span>
                </label>
                <select
                  value={shiftState.checkpoint}
                  onChange={(e) =>
                    updateShiftState({
                      ...shiftState,
                      checkpoint: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
                >
                  {TERMINAL_CHECKPOINTS.map((cp) => (
                    <option key={cp.code} value={cp.name} className="bg-slate-950 text-white">
                      {cp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {shiftState.clockedIn ? 'End Odometer (KM)' : 'Departure Odometer (KM)'}
                  </span>
                </label>
                <input
                  type="number"
                  placeholder={shiftState.clockedIn ? 'e.g. 142585' : 'e.g. 142100'}
                  value={odoInput}
                  onChange={(e) => setOdoInput(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                />
              </div>
            </div>

            {/* Big Clock Action Button */}
            <button
              onClick={handleToggleClock}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer ${
                shiftState.clockedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/50 active:scale-[0.99]'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-950/50 active:scale-[0.99]'
              }`}
            >
              {shiftState.clockedIn ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>Clock Out & Record Shift Completion</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Clock In & Commence Transit Duty</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('ess_dashboard')}
              className="flex-1 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
            >
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Driver Dashboard</span>
            </button>
            <button
              onClick={() => onNavigate('my_payslips')}
              className="flex-1 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
            >
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>My Payslips & KRA P9</span>
            </button>
          </div>
        </div>

        {/* Right Column: Shift Log History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Terminal Shift Logs
                </h3>
                <p className="text-[11px] text-slate-500">
                  Biometric punch & odometer records
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {shiftState.history?.length || 0} Shifts
              </span>
            </div>

            {shiftState.history && shiftState.history.length > 0 ? (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {shiftState.history.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{s.date}</span>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[10px]">
                        {s.duration}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{s.location}</span>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>
                        Time: {s.clockIn} ➔ {s.clockOut}
                      </span>
                      {s.distance ? (
                        <span className="font-bold text-slate-800">
                          {s.distance.toLocaleString()} KM Logged
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No shift logs recorded today.</p>
                <p className="text-[11px] text-slate-400">
                  Click 'Clock In' on the terminal to commence shift recording.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
