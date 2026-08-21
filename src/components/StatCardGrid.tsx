import React from 'react';
import { GlycemicMetrics } from '../types/cgm';
import { Award, Activity, TrendingUp, BarChart2 } from 'lucide-react';

interface StatCardGridProps {
  metrics: GlycemicMetrics;
}

export const StatCardGrid: React.FC<StatCardGridProps> = ({ metrics }) => {
  const isCvStable = metrics.cvPercent <= 36;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Estimated HbA1c */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estimated HbA1c (eA1c)
          </span>
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.estimatedHbA1c.toFixed(2)}
          </span>
          <span className="text-base font-semibold text-slate-500">%</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">ADAG Standard Formula</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
            (Mean + 46.7)/28.7
          </span>
        </div>
      </div>

      {/* Card 2: Average Glucose */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Glucose
          </span>
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {Math.round(metrics.meanGlucose)}
          </span>
          <span className="text-base font-semibold text-slate-500">mg/dL</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Median: {metrics.medianGlucose} mg/dL</span>
          <span className="text-emerald-700 font-semibold">Target &lt; 154 mg/dL</span>
        </div>
      </div>

      {/* Card 3: Glycemic Variability (%CV) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
        <div
          className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-xl transition-all ${
            isCvStable ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'
          }`}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Variability (%CV)
          </span>
          <div
            className={`p-2 rounded-xl border ${
              isCvStable ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.cvPercent.toFixed(1)}
          </span>
          <span className="text-base font-semibold text-slate-500">%</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Goal: ≤ 36%</span>
          <span
            className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
              isCvStable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isCvStable ? '✓ Stable (≤36%)' : '⚠ High (&gt;36%)'}
          </span>
        </div>
      </div>

      {/* Card 4: Standard Deviation (SD) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Standard Deviation (SD)
          </span>
          <div className="p-2 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.sdGlucose.toFixed(1)}
          </span>
          <span className="text-base font-semibold text-slate-500">mg/dL</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Sample Std Dev</span>
          <span className="text-purple-700 font-medium">Spread Index</span>
        </div>
      </div>
    </div>
  );
};
