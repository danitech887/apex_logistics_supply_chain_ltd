import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-4">
      <div className="flex items-center hover:text-slate-800 transition">
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Enterprise</span>
      </div>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span
            className={`${
              index === items.length - 1
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 transition cursor-pointer'
            }`}
          >
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};
