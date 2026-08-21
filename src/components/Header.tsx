import React from 'react';
import { Activity, ShieldCheck, Database, Calendar, Gamepad2, BarChart3 } from 'lucide-react';

interface HeaderProps {
  totalReadings: number;
  daysCount: number;
  startDateStr?: string;
  endDateStr?: string;
  isGameMode: boolean;
  onToggleGameMode: (gameMode: boolean) => void;
  activeEventsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalReadings,
  daysCount,
  startDateStr,
  endDateStr,
  isGameMode,
  onToggleGameMode,
  activeEventsCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl shadow-sm border transition-all ${
              isGameMode
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            {isGameMode ? (
              <Gamepad2 className="w-7 h-7 text-purple-600 animate-bounce" />
            ) : (
              <Activity className="w-7 h-7 text-blue-600 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isGameMode ? 'Glucose Simulation Game' : 'Type 1 Diabetes CGM Analytics'}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isGameMode
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {isGameMode ? 'Triangular PK Simulator' : 'AGP Clinical Standard'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isGameMode
                ? 'Inject custom food items & test real-time glucose Pharmacokinetic curve responses'
                : '8-Hour Interactive Glucose Panner • Ambulatory Glucose Profile • Nutrition Overlay'}
            </p>
          </div>
        </div>

        {/* Mode Switcher & Dataset Summary */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onToggleGameMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isGameMode
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              onClick={() => onToggleGameMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isGameMode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 border border-purple-500'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Simulation Game
              {activeEventsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-700 text-[10px] font-extrabold">
                  {activeEventsCount}
                </span>
              )}
            </button>
          </div>

          {/* Dataset Summary Badges */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px]">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold">t1d_90day_blood_sugar_hba1c_7.csv</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <span className="text-slate-500">Readings:</span>
              <span className="font-bold text-slate-900">{totalReadings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
