import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, MapPin, CheckCircle } from 'lucide-react';

export const PunchClock = () => {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleClock = () => {
    if (!clockedIn) {
      setClockedIn(true);
      setClockInTime(new Date().toLocaleTimeString());
    } else {
      setClockedIn(false);
      setClockInTime(null);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl text-white shadow-xl space-y-4 border border-indigo-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
            Driver Terminal Clock
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-full border border-indigo-700/50">
          {currentTime}
        </span>
      </div>

      <div className="text-center py-2">
        <span className="text-3xl font-black font-mono tracking-tight block">
          {clockedIn ? 'ON DUTY' : 'OFF DUTY'}
        </span>
        <div className="flex items-center justify-center space-x-1.5 text-xs text-indigo-300 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>Mombasa Port CFS Terminal • Gate 3</span>
        </div>
      </div>

      {clockedIn && clockInTime && (
        <div className="p-3 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 text-xs text-center">
          <span className="text-indigo-300">Shift Started At: </span>
          <span className="font-bold text-white font-mono">{clockInTime}</span>
        </div>
      )}

      <button
        onClick={handleToggleClock}
        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center space-x-2 ${
          clockedIn
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40'
            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-900/40'
        }`}
      >
        {clockedIn ? (
          <>
            <Square className="w-4 h-4 fill-white" />
            <span>Clock Out (End Shift)</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Clock In (Start Transit Shift)</span>
          </>
        )}
      </button>
    </div>
  );
};
