import React from 'react';
import { GlycemicMetrics } from '../types/cgm';
import { Utensils, Wheat, PieChart } from 'lucide-react';

interface MacroNutritionCardProps {
  metrics: GlycemicMetrics;
}

export const MacroNutritionCard: React.FC<MacroNutritionCardProps> = ({ metrics }) => {
  const totalMacros = metrics.avgDailyCarbs + metrics.avgDailyProtein;
  const carbPercent = totalMacros > 0 ? Math.round((metrics.avgDailyCarbs / totalMacros) * 100) : 70;
  const proteinPercent = 100 - carbPercent;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-600">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Macro Nutrition Overview</h3>
              <p className="text-xs text-slate-500">Average Intake per Day ({metrics.daysCount} Days)</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
            {metrics.mealCount} Meals Logged
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-3">
          {/* Carbs */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mb-1">
              <Wheat className="w-4 h-4 text-amber-600" />
              <span>Avg Daily Carbs</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.avgDailyCarbs}</span>
              <span className="text-xs text-slate-500">g / day</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Total: {metrics.totalCarbs.toLocaleString()}g
            </p>
          </div>

          {/* Protein */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mb-1">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Avg Daily Protein</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.avgDailyProtein}</span>
              <span className="text-xs text-slate-500">g / day</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Total: {metrics.totalProtein.toLocaleString()}g
            </p>
          </div>
        </div>
      </div>

      {/* Carb vs Protein Ratio Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-amber-700">Carbs ({carbPercent}%)</span>
          <span className="text-xs font-bold text-slate-500">Macro Ratio</span>
          <span className="font-semibold text-blue-700">Protein ({proteinPercent}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
          <div
            style={{ width: `${carbPercent}%` }}
            className="bg-amber-500 h-full rounded-l-full transition-all duration-500"
          />
          <div
            style={{ width: `${proteinPercent}%` }}
            className="bg-blue-600 h-full rounded-r-full transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
};
