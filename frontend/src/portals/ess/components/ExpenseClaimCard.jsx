import React from 'react';
import { Fuel, Receipt, ArrowUpRight } from 'lucide-react';

export const ExpenseClaimCard = ({ title, amount, date, status, category = 'Fuel' }) => {
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
          {category === 'Fuel' ? <Fuel className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900">{title}</h4>
          <p className="text-[11px] text-slate-400">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="font-mono font-bold text-xs text-slate-900 block">
          KES {Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          {status}
        </span>
      </div>
    </div>
  );
};
