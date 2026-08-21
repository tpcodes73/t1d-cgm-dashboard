import React, { useState, useMemo } from 'react';
import { useGlucoseData } from './hooks/useGlucoseData';
import { Header } from './components/Header';
import { TimeframeSelector } from './components/TimeframeSelector';
import { StatCardGrid } from './components/StatCardGrid';
import { TimeInRangeBar } from './components/TimeInRangeBar';
import { MacroNutritionCard } from './components/MacroNutritionCard';
import { GlucoseTimeline } from './components/GlucoseTimeline';
import { AGPChart } from './components/AGPChart';
import { SimulationGamePanel } from './components/SimulationGamePanel';
import { FoodSelectionModal } from './components/FoodSelectionModal';
import { FoodItem, SimEvent, computeSimulatedPoints, FOOD_MENU } from './utils/gameEngine';
import { calculateGlycemicMetrics } from './utils/metricsCalculator';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, Gamepad2 } from 'lucide-react';

export function App() {
  const {
    allData,
    filteredData,
    metrics: baselineMetrics,
    agpBins,
    timeframe,
    setTimeframe,
    isLoading,
    error,
    minDate,
    maxDate,
  } = useGlucoseData('/t1d_90day_blood_sugar_hba1c_7.csv');

  // Game Mode & Simulation State
  const [isGameMode, setIsGameMode] = useState<boolean>(false);
  const [simEvents, setSimEvents] = useState<SimEvent[]>([]);

  // Food Selection Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDataIndex, setModalDataIndex] = useState<number>(0);
  const [modalTimestampStr, setModalTimestampStr] = useState<string>('');

  const activeDataset = filteredData.length > 0 ? filteredData : allData;

  // Calculate simulated glucose array & data points
  const { simulatedData, simulatedGlucoseValues } = useMemo(() => {
    if (simEvents.length === 0 || activeDataset.length === 0) {
      return { simulatedData: activeDataset, simulatedGlucoseValues: [] };
    }
    return computeSimulatedPoints(activeDataset, simEvents);
  }, [activeDataset, simEvents]);

  // Compute live simulated glycemic metrics
  const simulatedMetrics = useMemo(() => {
    if (simEvents.length === 0 || simulatedData.length === 0) {
      return baselineMetrics;
    }
    return calculateGlycemicMetrics(simulatedData, timeframe);
  }, [simulatedData, timeframe, simEvents, baselineMetrics]);

  // Calculate baseline peak vs simulated peak
  const baselinePeakGlucose = useMemo(() => {
    if (activeDataset.length === 0) return 0;
    return Math.max(...activeDataset.map((d) => d.glucose));
  }, [activeDataset]);

  const simulatedPeakGlucose = useMemo(() => {
    if (simulatedGlucoseValues.length === 0) return baselinePeakGlucose;
    return Math.max(...simulatedGlucoseValues);
  }, [simulatedGlucoseValues, baselinePeakGlucose]);

  // Handlers for adding/removing meal simulation events
  const handleAddEvent = (food: FoodItem, targetIndex?: number, timestampStr?: string) => {
    const dataIdx = targetIndex !== undefined ? targetIndex : Math.max(0, activeDataset.length - 32);
    const tsStr = timestampStr || (activeDataset[dataIdx]?.timestampStr || 'Selected Time');

    const newEvent: SimEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dataIndex: dataIdx,
      timestampStr: tsStr,
      food,
    };

    setSimEvents((prev) => [...prev, newEvent]);
  };

  const handleRemoveEvent = (eventId: string) => {
    setSimEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleClearEvents = () => {
    setSimEvents([]);
  };

  const handleSelectPointForMeal = (dataIndex: number, timestampStr: string) => {
    setModalDataIndex(dataIndex);
    setModalTimestampStr(timestampStr);
    setIsModalOpen(true);
  };

  const startDateStr = minDate ? format(minDate, 'MMM dd, yyyy') : '';
  const endDateStr = maxDate ? format(maxDate, 'MMM dd, yyyy') : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-bold">Loading CGM & Nutrition Dataset...</p>
          <p className="text-xs text-slate-500 mt-1">Parsing 8,640 continuous 15-minute readings across 90 days</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Dataset</h2>
          <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-all shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const activeMetrics = simEvents.length > 0 ? simulatedMetrics : baselineMetrics;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Header Bar */}
      <Header
        totalReadings={allData.length}
        daysCount={90}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        isGameMode={isGameMode}
        onToggleGameMode={setIsGameMode}
        activeEventsCount={simEvents.length}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Timeframe Filter Bar */}
        <TimeframeSelector timeframe={timeframe} onChange={setTimeframe} />

        {/* Simulation Game Control Panel (Visible in Game Mode) */}
        {isGameMode && (
          <SimulationGamePanel
            events={simEvents}
            onAddEvent={(food) => handleAddEvent(food)}
            onRemoveEvent={handleRemoveEvent}
            onClearEvents={handleClearEvents}
            baselineMetrics={baselineMetrics}
            simulatedMetrics={simulatedMetrics}
            baselinePeakGlucose={baselinePeakGlucose}
            simulatedPeakGlucose={simulatedPeakGlucose}
          />
        )}

        {/* Stat Cards Grid (eA1c, Mean, %CV, SD) */}
        <StatCardGrid metrics={activeMetrics} />

        {/* 8-Hour Interactive Glucose & Meal Timeline */}
        <GlucoseTimeline
          data={activeDataset}
          simulatedSeries={simEvents.length > 0 ? simulatedGlucoseValues : undefined}
          simEvents={simEvents}
          onSelectPointForMeal={handleSelectPointForMeal}
          isGameMode={isGameMode}
        />

        {/* Time In Range Breakdown & Macro Nutrition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeInRangeBar metrics={activeMetrics} />
          </div>
          <div>
            <MacroNutritionCard metrics={activeMetrics} />
          </div>
        </div>

        {/* Ambulatory Glucose Profile (AGP) 24h Diurnal Curve */}
        <AGPChart agpBins={agpBins} daysCount={activeMetrics.daysCount} />
      </main>

      {/* Food Selection Modal */}
      <FoodSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetTimestampStr={modalTimestampStr}
        dataIndex={modalDataIndex}
        onSelectFood={(food, index, tsStr) => handleAddEvent(food, index, tsStr)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8 text-center text-xs text-slate-500">
        <p>T1D CGM Analytics Platform & Glucose Simulation Engine • Pharmacokinetic Meal Impulses • Powered by React & ECharts</p>
      </footer>
    </div>
  );
}

export default App;
