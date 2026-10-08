import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const colorMap = {
    // Greens
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',

    // Blues
    IN_TRANSIT: 'bg-sky-50 text-sky-700 border-sky-200/80 animate-pulse',
    DISPATCH_READY: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    TARE_VERIFIED: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    DISPATCHED: 'bg-sky-50 text-sky-700 border-sky-200/80',

    // Yellows & Ambers
    SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200/80',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200/80',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200/80',

    // Reds
    MAINTENANCE: 'bg-rose-50 text-rose-700 border-rose-200/80',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200/80',
    UNPAID: 'bg-rose-50 text-rose-700 border-rose-200/80',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200/80',
    VOID: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const style = colorMap[normalized] || 'bg-slate-50 text-slate-700 border-slate-200';

  const dotColor = {
    AVAILABLE: 'bg-emerald-500',
    APPROVED: 'bg-emerald-500',
    COMPLETED: 'bg-emerald-500',
    PAID: 'bg-emerald-500',
    IN_TRANSIT: 'bg-sky-500',
    SCHEDULED: 'bg-amber-500',
    PENDING: 'bg-amber-500',
    MAINTENANCE: 'bg-rose-500',
    UNPAID: 'bg-rose-500',
  }[normalized] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wider uppercase ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
