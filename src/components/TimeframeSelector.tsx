import React from 'react';
import { TimeframeDays } from '../types/cgm';
import { Clock } from 'lucide-react';

interface TimeframeSelectorProps {
  timeframe: TimeframeDays;
  onChange: (days: TimeframeDays) => void;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onChange,
}) => {
  const options: { value: TimeframeDays; label: string; description: string }[] = [
    { value: 14, label: 'Last 14 Days', description: 'Clinical AGP Standard' },
    { value: 30, label: 'Last 30 Days', description: 'Monthly Trend' },
    { value: 90, label: 'Last 90 Days', description: 'Full Dataset (eA1c)' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Clock className="w-4 h-4 text-blue-600" />
        <span>Analysis Window:</span>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
        {options.map((opt) => {
          const isActive = timeframe === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className="font-bold text-sm">{opt.label}</span>
              <span
                className={`text-[10px] ${
                  isActive ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
