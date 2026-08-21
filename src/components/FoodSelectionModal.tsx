import React, { useState } from 'react';
import { FoodItem, FOOD_MENU } from '../utils/gameEngine';
import { X, Plus, Utensils, Zap } from 'lucide-react';

interface FoodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTimestampStr: string;
  dataIndex: number;
  onSelectFood: (food: FoodItem, dataIndex: number, timestampStr: string) => void;
}

export const FoodSelectionModal: React.FC<FoodSelectionModalProps> = ({
  isOpen,
  onClose,
  targetTimestampStr,
  dataIndex,
  onSelectFood,
}) => {
  const [selectedFoodId, setSelectedFoodId] = useState<string>(FOOD_MENU[0].id);
  const [customCarbs, setCustomCarbs] = useState<number>(30);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isCustom) {
      const customFood: FoodItem = {
        id: `custom_${Date.now()}`,
        name: 'Custom Meal',
        carbs: Math.max(1, customCarbs),
        icon: '🍱',
        category: 'Custom',
      };
      onSelectFood(customFood, dataIndex, targetTimestampStr);
    } else {
      const preset = FOOD_MENU.find((f) => f.id === selectedFoodId) || FOOD_MENU[0];
      onSelectFood(preset, dataIndex, targetTimestampStr);
    }
    onClose();
  };

  const selectedPreset = FOOD_MENU.find((f) => f.id === selectedFoodId) || FOOD_MENU[0];
  const activeCarbs = isCustom ? customCarbs : selectedPreset.carbs;
  const peakDelta = activeCarbs * 3;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Inject Simulated Meal</h3>
              <p className="text-xs text-slate-500 font-mono">Timestamp: {targetTimestampStr}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 my-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setIsCustom(false)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              !isCustom
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preset Menu
          </button>
          <button
            onClick={() => setIsCustom(true)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isCustom
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Carbs (g)
          </button>
        </div>

        {/* Food Menu Grid */}
        {!isCustom ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1 my-3">
            {FOOD_MENU.map((food) => {
              const isSelected = selectedFoodId === food.id;
              return (
                <button
                  key={food.id}
                  onClick={() => setSelectedFoodId(food.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 text-purple-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{food.icon}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                      +{food.carbs * 3} mg/dL
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold truncate">{food.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{food.carbs}g Carbs</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Carbohydrate Amount (grams):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
                <span className="text-sm font-bold text-slate-500">grams</span>
              </div>
            </div>
          </div>
        )}

        {/* Peak Simulation Impact Preview Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <div>
              <span className="font-bold">Peak Impact: </span>
              <span>+{peakDelta} mg/dL at +2.0 hours (8 steps)</span>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-purple-200/60 px-2 py-0.5 rounded font-bold">
            4-Hour Curve
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Inject Meal Event
          </button>
        </div>
      </div>
    </div>
  );
};
