import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, MapPin, CheckCircle2, AlertCircle, History, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export const TERMINAL_CHECKPOINTS = [
  'Mombasa Port CFS Terminal • Gate 3',
  'Nairobi ICD Embakasi Dock • Bay 12',
  'Mtito Andei Highway Waypoint • KM 240',
  'Voi Corridor Inspection Station',
  'Nakuru Silos Regional Depot',
];

export const PunchClock = () => {
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
      checkpoint: TERMINAL_CHECKPOINTS[0],
      history: [],
    };
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-KE'));
  const [elapsed, setElapsed] = useState('00h 00m 00s');

  // Clock ticker
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

  // Save changes to localStorage
  const updateShiftState = (newState) => {
    setShiftState(newState);
    try {
      localStorage.setItem(userKey, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to save punch clock state:', e);
    }
  };

  const handleToggleClock = () => {
    const now = new Date();
    if (!shiftState.clockedIn) {
      // Clock In
      const newState = {
        ...shiftState,
        clockedIn: true,
        clockInTime: now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
        clockInEpoch: now.getTime(),
      };
      updateShiftState(newState);
    } else {
      // Clock Out
      const clockOutTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const completedShift = {
        id: `shift-${Date.now()}`,
        date: now.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' }),
        clockIn: shiftState.clockInTime,
        clockOut: clockOutTime,
        duration: elapsed,
        location: shiftState.checkpoint,
      };

      const newState = {
        ...shiftState,
        clockedIn: false,
        clockInTime: null,
        clockInEpoch: null,
        history: [completedShift, ...(shiftState.history || [])].slice(0, 5),
      };
      updateShiftState(newState);
      setElapsed('00h 00m 00s');
    }
  };

  const handleCheckpointChange = (e) => {
    updateShiftState({
      ...shiftState,
      checkpoint: e.target.value,
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl text-white shadow-xl space-y-4 border border-indigo-900/50">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
            Terminal Punch Clock
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-200 bg-indigo-900/60 px-2.5 py-1 rounded-full border border-indigo-700/50">
          {currentTime}
        </span>
      </div>

      {/* Main Status Badge */}
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              shiftState.clockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="text-3xl font-black font-mono tracking-tight">
            {shiftState.clockedIn ? 'ON DUTY' : 'OFF DUTY'}
          </span>
        </div>

        {/* Checkpoint Location Selector */}
        <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-xs text-indigo-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <select
            value={shiftState.checkpoint}
            onChange={handleCheckpointChange}
            className="bg-slate-800/80 text-white text-[11px] font-medium rounded-lg px-2 py-1 border border-indigo-800/60 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {TERMINAL_CHECKPOINTS.map((cp) => (
              <option key={cp} value={cp} className="bg-slate-900 text-white">
                {cp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Shift Duration */}
      {shiftState.clockedIn && shiftState.clockInTime && (
        <div className="p-3.5 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 text-xs flex items-center justify-between">
          <div>
            <span className="text-indigo-300 block text-[10px] font-bold uppercase">Started At</span>
            <span className="font-bold text-white font-mono">{shiftState.clockInTime}</span>
          </div>
          <div className="text-right">
            <span className="text-indigo-300 block text-[10px] font-bold uppercase">Duration</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{elapsed}</span>
          </div>
        </div>
      )}

      {/* Punch Action Button */}
      <button
        onClick={handleToggleClock}
        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
          shiftState.clockedIn
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40'
            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-900/40'
        }`}
      >
        {shiftState.clockedIn ? (
          <>
            <Square className="w-4 h-4 fill-white" />
            <span>Clock Out (End Transit Shift)</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Clock In (Start Transit Shift)</span>
          </>
        )}
      </button>

      {/* Recent Shift Summary */}
      {shiftState.history && shiftState.history.length > 0 && (
        <div className="pt-2 border-t border-indigo-900/40 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/80 block">
            Recent Shifts Log
          </span>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {shiftState.history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-300"
              >
                <div className="truncate mr-2">
                  <span className="font-medium text-white">{h.date}</span>: {h.clockIn} - {h.clockOut}
                </div>
                <span className="font-mono text-emerald-400 font-bold shrink-0">{h.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
