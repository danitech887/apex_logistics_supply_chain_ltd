import React from 'react';
import { Fuel, Receipt, DollarSign, Calendar, FileText } from 'lucide-react';

export const ExpenseClaimCard = ({
  title,
  amount,
  date,
  status,
  category = 'Fuel',
  receiptNumber = '',
  vehiclePlate = '',
  liters = null,
}) => {
  const getIcon = () => {
    switch (category) {
      case 'Fuel':
        return <Fuel className="w-5 h-5 text-amber-600" />;
      case 'PerDiem':
        return <DollarSign className="w-5 h-5 text-indigo-600" />;
      default:
        return <Receipt className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getStatusBadge = () => {
    const s = String(status).toUpperCase();
    if (s === 'APPROVED' || s === 'DISBURSED') {
      return 'text-emerald-700 bg-emerald-50 border-emerald-200/80';
    }
    if (s === 'LOGGED' || s === 'PENDING') {
      return 'text-sky-700 bg-sky-50 border-sky-200/80';
    }
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
            {title}
          </h4>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
            <span>{date}</span>
            {receiptNumber && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-600">Ref: {receiptNumber}</span>
              </>
            )}
            {liters && (
              <>
                <span>•</span>
                <span className="font-mono text-amber-700 font-semibold">{liters}L</span>
              </>
            )}
            {vehiclePlate && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-600">{vehiclePlate}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <span className="font-mono font-bold text-xs text-slate-900 block">
          KES {Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
        <span
          className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getStatusBadge()}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};
