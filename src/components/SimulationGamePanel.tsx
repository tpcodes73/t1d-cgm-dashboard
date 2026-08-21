import React from 'react';
import { FoodItem, SimEvent } from '../utils/gameEngine';
import { GlycemicMetrics } from '../types/cgm';
import { Gamepad2, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';

interface SimulationGamePanelProps {
  events: SimEvent[];
  onAddEvent: (food: FoodItem) => void;
  onRemoveEvent: (eventId: string) => void;
  onClearEvents: () => void;
  baselineMetrics: GlycemicMetrics;
  simulatedMetrics: GlycemicMetrics;
  baselinePeakGlucose: number;
  simulatedPeakGlucose: number;
}

export const SimulationGamePanel: React.FC<SimulationGamePanelProps> = ({
  events,
  onAddEvent,
  onRemoveEvent,
  onClearEvents,
  baselineMetrics,
  simulatedMetrics,
  baselinePeakGlucose,
  simulatedPeakGlucose,
}) => {
  const peakDifference = Math.round(simulatedPeakGlucose - baselinePeakGlucose);
  const tirDifference = (simulatedMetrics.tirPercent - baselineMetrics.tirPercent).toFixed(1);
  const hasSpikeWarning = simulatedPeakGlucose > 180;
  const hasExtremeSpike = simulatedPeakGlucose > 250;

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 border border-purple-200 rounded-xl text-purple-700">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Glucose Simulation Game Mode</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                Triangular PK Model
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Click food items or click on the timeline chart to inject meals and see glucose response
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            onClick={onClearEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All ({events.length})
          </button>
        )}
      </div>

      {/* Real-time Impact Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Peak Glucose */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Peak Glucose
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{simulatedPeakGlucose}</span>
              <span className="text-xs text-slate-500 font-semibold ml-1">mg/dL</span>
            </div>
            {peakDifference > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-xs">
                +{peakDifference} mg/dL
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Baseline Peak: {baselinePeakGlucose} mg/dL</p>
        </div>

        {/* Metric 2: Time in Range % */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Simulated Time in Range (TIR)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">
                {simulatedMetrics.tirPercent.toFixed(1)}%
              </span>
            </div>
            {events.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded font-bold text-xs ${
                  Number(tirDifference) >= 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {Number(tirDifference) >= 0 ? `+${tirDifference}%` : `${tirDifference}%`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline TIR: {baselineMetrics.tirPercent.toFixed(1)}%
          </p>
        </div>

        {/* Metric 3: eA1c Estimate */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Simulated eA1c
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">
                {simulatedMetrics.estimatedHbA1c.toFixed(2)}%
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Mean: {Math.round(simulatedMetrics.meanGlucose)} mg/dL
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline eA1c: {baselineMetrics.estimatedHbA1c.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Glucose Spike Warning Banners */}
      {hasSpikeWarning && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
            hasExtremeSpike
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold">
              {hasExtremeSpike ? '🚨 Severe Hyperglycemia Spike Warning!' : '⚠️ Target Exceeded Spike Warning!'}
            </span>
            <p className="mt-0.5">
              Simulated glucose reached <b className="font-extrabold">{simulatedPeakGlucose} mg/dL</b>. Consider carb management or bolus strategies.
            </p>
          </div>
        </div>
      )}



      {/* Injected Meal Events List */}
      {events.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Active Simulated Injections ({events.length})
          </h4>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs shadow-sm"
              >
                <span className="text-base">{evt.food.icon}</span>
                <div>
                  <span className="font-bold">{evt.food.name}</span>
                  <span className="text-[10px] text-purple-700 ml-1.5 font-mono">
                    ({evt.food.carbs}g → +{evt.food.carbs * 3} mg/dL)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono ml-1">
                  @ {evt.timestampStr}
                </span>
                <button
                  onClick={() => onRemoveEvent(evt.id)}
                  className="p-1 text-purple-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all ml-1"
                  title="Remove this meal event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
