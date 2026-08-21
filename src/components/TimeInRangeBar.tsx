import React from 'react';
import { GlycemicMetrics } from '../types/cgm';
import { Target, AlertCircle, CheckCircle } from 'lucide-react';

interface TimeInRangeBarProps {
  metrics: GlycemicMetrics;
}

export const TimeInRangeBar: React.FC<TimeInRangeBarProps> = ({ metrics }) => {
  const bands = [
    {
      key: 'veryHigh',
      label: 'Very High',
      sublabel: '> 250 mg/dL',
      value: metrics.tarVeryHighPercent,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-50 border-red-200 text-red-700',
      goal: '< 5%',
      metGoal: metrics.tarVeryHighPercent < 5,
    },
    {
      key: 'high',
      label: 'High',
      sublabel: '181 - 250 mg/dL',
      value: metrics.tarHighPercent,
      color: 'bg-amber-400',
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-50 border-amber-200 text-amber-700',
      goal: '< 25%',
      metGoal: metrics.tarHighPercent < 25,
    },
    {
      key: 'target',
      label: 'In Target',
      sublabel: '70 - 180 mg/dL',
      value: metrics.tirPercent,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold',
      goal: '> 70%',
      metGoal: metrics.tirPercent >= 70,
    },
    {
      key: 'low',
      label: 'Low',
      sublabel: '54 - 69 mg/dL',
      value: metrics.tbrLowPercent,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      badgeColor: 'bg-rose-50 border-rose-200 text-rose-700',
      goal: '< 4%',
      metGoal: metrics.tbrLowPercent < 4,
    },
    {
      key: 'veryLow',
      label: 'Very Low',
      sublabel: '< 54 mg/dL',
      value: metrics.tbrVeryLowPercent,
      color: 'bg-purple-600',
      textColor: 'text-purple-700',
      badgeColor: 'bg-purple-50 border-purple-200 text-purple-700',
      goal: '< 1%',
      metGoal: metrics.tbrVeryLowPercent < 1,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Time in Range (TIR) Breakdown</h3>
            <p className="text-xs text-slate-500">Standard 5-Zone Clinical Classification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {metrics.tirPercent >= 70 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Met Clinical Target (&gt;70%)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Below Target (&lt;70%)
            </span>
          )}
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-7 bg-slate-100 rounded-xl overflow-hidden flex p-1 border border-slate-200 shadow-inner">
        {bands.map((band) => (
          <div
            key={band.key}
            style={{ width: `${Math.max(band.value, 0.5)}%` }}
            className={`${band.color} h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-500 relative group`}
            title={`${band.label}: ${band.value.toFixed(1)}%`}
          >
            {band.value >= 7 && (
              <div className="h-full flex items-center justify-center text-[10px] font-extrabold text-white px-1 truncate drop-shadow-sm">
                {band.value.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
        {bands.map((band) => (
          <div
            key={band.key}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${band.color}`} />
                <span className="text-xs font-bold text-slate-800">{band.label}</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold ${band.textColor}`}>{band.goal}</span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-slate-900">
                {band.value.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500">{band.sublabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
