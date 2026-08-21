import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { CGMDataPoint } from '../types/cgm';
import { SimEvent } from '../utils/gameEngine';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  RotateCcw,
  Utensils,
  Gamepad2,
} from 'lucide-react';
import { format } from 'date-fns';

interface GlucoseTimelineProps {
  data: CGMDataPoint[];
  simulatedSeries?: number[];
  simEvents?: SimEvent[];
  onSelectPointForMeal?: (dataIndex: number, timestampStr: string) => void;
  isGameMode?: boolean;
}

const POINTS_PER_HOUR = 4; // 15-minute readings
const WINDOW_SIZE_8H = 8 * POINTS_PER_HOUR; // 32 readings
const POINTS_24H = 24 * POINTS_PER_HOUR; // 96 readings

export const GlucoseTimeline: React.FC<GlucoseTimelineProps> = ({
  data,
  simulatedSeries,
  simEvents = [],
  onSelectPointForMeal,
  isGameMode = false,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const totalReadings = data.length;

  // Window start index (0 to totalReadings - WINDOW_SIZE_8H)
  const [startIndex, setStartIndex] = useState<number>(() =>
    Math.max(0, totalReadings - WINDOW_SIZE_8H)
  );

  // Sync index when data length changes
  useEffect(() => {
    if (totalReadings > 0) {
      setStartIndex((prev) => {
        if (prev >= totalReadings) return Math.max(0, totalReadings - WINDOW_SIZE_8H);
        return prev;
      });
    }
  }, [totalReadings]);

  // Current viewing window calculations
  const endIndex = Math.min(totalReadings - 1, startIndex + WINDOW_SIZE_8H - 1);
  const currentWindowPoints = useMemo(() => {
    if (totalReadings === 0) return [];
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex, totalReadings]);

  const windowLabel = useMemo(() => {
    if (currentWindowPoints.length === 0) return 'No Data';
    const startPoint = currentWindowPoints[0];
    const endPoint = currentWindowPoints[currentWindowPoints.length - 1];
    return `${format(startPoint.timestamp, 'MMM dd, yyyy HH:mm')} — ${format(
      endPoint.timestamp,
      'MMM dd, yyyy HH:mm'
    )}`;
  }, [currentWindowPoints]);

  // Handle navigation window shifts
  const shiftWindow = (offset: number) => {
    setStartIndex((prev) => {
      const next = prev + offset;
      const maxStart = Math.max(0, totalReadings - WINDOW_SIZE_8H);
      if (next < 0) return 0;
      if (next > maxStart) return maxStart;
      return next;
    });
  };

  const jumpToLatest = () => {
    setStartIndex(Math.max(0, totalReadings - WINDOW_SIZE_8H));
  };

  const jumpToFirst = () => {
    setStartIndex(0);
  };

  // Date selection helper
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, number>(); // YYYY-MM-DD -> first index
    data.forEach((pt, index) => {
      const key = format(pt.timestamp, 'yyyy-MM-dd');
      if (!datesMap.has(key)) {
        datesMap.set(key, index);
      }
    });
    return Array.from(datesMap.entries()).map(([dateStr, idx]) => ({
      dateStr,
      label: format(data[idx].timestamp, 'MMM dd, yyyy'),
      index: idx,
    }));
  }, [data]);

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx)) {
      setStartIndex(Math.min(idx, Math.max(0, totalReadings - WINDOW_SIZE_8H)));
    }
  };

  // ECharts Option Construction
  const option = useMemo(() => {
    if (totalReadings === 0) return {};

    const xAxisCategories = data.map((d) => d.timestampStr);
    const lineSeriesData = data.map((d) => d.glucose);

    // Scatter data for meals overlay
    const mealScatterData = data
      .map((d) => {
        if (!d.hasMeal) return null;
        return {
          name: d.mealName || 'Meal',
          value: [d.timestampStr, d.glucose],
          carbs: d.carbs,
          protein: d.protein,
          timestampStr: d.timestampStr,
        };
      })
      .filter(Boolean);

    // Scatter data for user-injected simulation meal events
    const simEventScatterData = simEvents
      .map((evt) => {
        const pt = data[evt.dataIndex];
        if (!pt) return null;
        const simGlucose = simulatedSeries ? simulatedSeries[evt.dataIndex] : pt.glucose;
        return {
          name: evt.food.name,
          value: [pt.timestampStr, simGlucose],
          icon: evt.food.icon,
          carbs: evt.food.carbs,
          peakDelta: evt.food.carbs * 3,
          timestampStr: pt.timestampStr,
        };
      })
      .filter(Boolean);

    // Calculate start/end percentage for dataZoom matching startIndex & endIndex
    const zoomStartPercent = (startIndex / Math.max(totalReadings, 1)) * 100;
    const zoomEndPercent = (Math.min(endIndex + 1, totalReadings) / Math.max(totalReadings, 1)) * 100;

    const seriesList: any[] = [
      // Main Baseline Glucose Line
      {
        name: 'Baseline BG',
        type: 'line',
        data: lineSeriesData,
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        itemStyle: { color: '#2563EB' },
        lineStyle: { width: 2.5, color: '#2563EB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.22)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
            ],
          },
        },
        markArea: {
          silent: true,
          data: [
            [
              {
                name: 'Target Range (70-180 mg/dL)',
                yAxis: 70,
                itemStyle: { color: 'rgba(16, 185, 129, 0.12)' },
                label: {
                  show: true,
                  position: ['10', '10'],
                  color: '#059669',
                  fontSize: 10,
                  fontWeight: 'bold',
                },
              },
              { yAxis: 180 },
            ],
          ],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              yAxis: 180,
              name: 'High Threshold (180)',
              lineStyle: { color: '#D97706', type: 'dashed', width: 1.5 },
              label: {
                formatter: 'High 180',
                color: '#D97706',
                fontSize: 10,
                position: 'insideEndTop',
              },
            },
            {
              yAxis: 70,
              name: 'Low Threshold (70)',
              lineStyle: { color: '#DC2626', type: 'dashed', width: 1.5 },
              label: {
                formatter: 'Low 70',
                color: '#DC2626',
                fontSize: 10,
                position: 'insideEndBottom',
              },
            },
          ],
        },
      },
    ];

    // If simulated series exists, add secondary dashed purple line
    if (simulatedSeries && simulatedSeries.length > 0) {
      seriesList.push({
        name: 'Simulated BG',
        type: 'line',
        data: simulatedSeries,
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        itemStyle: { color: '#9333EA' },
        lineStyle: { width: 3, color: '#9333EA', type: 'dashed' },
        z: 8,
      });
    }

    // Baseline Meal Overlay Scatter Series
    seriesList.push({
      name: 'Meal Marker',
      type: 'scatter',
      data: mealScatterData,
      symbol: 'circle',
      symbolSize: 14,
      itemStyle: {
        color: '#EA580C',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        shadowBlur: 6,
        shadowColor: 'rgba(234, 88, 12, 0.4)',
      },
      z: 10,
    });

    // Injected Simulation Meal Events Scatter Series
    if (simEventScatterData.length > 0) {
      seriesList.push({
        name: 'Injected Meal Event',
        type: 'scatter',
        data: simEventScatterData,
        symbol: 'pin',
        symbolSize: 22,
        itemStyle: {
          color: '#9333EA',
          borderColor: '#FFFFFF',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(147, 51, 234, 0.5)',
        },
        z: 12,
      });
    }

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 40,
        right: 30,
        bottom: 80,
        left: 55,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#64748B' },
        },
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        padding: [10, 14],
        textStyle: { color: '#0F172A', fontSize: 12 },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const dataObj = data[idx];
          if (!dataObj) return '';

          const baseGlucose = dataObj.glucose;
          const simGlucose = simulatedSeries ? simulatedSeries[idx] : null;

          let html = `<div style="font-weight: 700; color: #64748B; margin-bottom: 4px; font-size: 11px;">📅 ${dataObj.timestampStr}</div>`;
          html += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">`;
          html += `<span style="color: #475569;">Baseline BG:</span>`;
          html += `<b style="font-size: 15px; color: #2563EB;">${baseGlucose} mg/dL</b>`;
          html += `</div>`;

          if (simGlucose !== null && simGlucose !== baseGlucose) {
            const diff = simGlucose - baseGlucose;
            html += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 2px;">`;
            html += `<span style="color: #9333EA; font-weight: 700;">Simulated BG:</span>`;
            html += `<b style="font-size: 16px; color: #9333EA;">${simGlucose} mg/dL (+${diff})</b>`;
            html += `</div>`;
          }

          if (dataObj.hasMeal) {
            html += `<hr style="margin: 8px 0; border: none; border-top: 1px solid #E2E8F0;" />`;
            html += `<div style="color: #EA580C; font-weight: 700; font-size: 13px;">🍽️ ${dataObj.mealName}</div>`;
            html += `<div style="font-size: 12px; margin-top: 4px; color: #334155;">`;
            html += `Carbs: <b style="color: #D97706;">${dataObj.carbs || 0}g</b> | Protein: <b style="color: #2563EB;">${dataObj.protein || 0}g</b>`;
            html += `</div>`;
          }

          return html;
        },
      },
      xAxis: {
        type: 'category',
        data: xAxisCategories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          formatter: (value: string) => {
            if (!value) return '';
            const parts = value.split(' ');
            return parts.length > 1 ? parts[1] : value;
          },
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 350,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          formatter: '{value}',
        },
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: zoomStartPercent,
          end: zoomEndPercent,
          bottom: 15,
          height: 32,
          borderColor: '#E2E8F0',
          backgroundColor: '#F8FAFC',
          fillerColor: 'rgba(37, 99, 235, 0.15)',
          handleIcon:
            'path://M10.7,11.9v-1.3H3.3v1.3h7.4zm0-2.5V8.1H3.3v1.3h7.4zm0-2.5V5.6H3.3v1.3h7.4z',
          handleSize: '80%',
          handleStyle: {
            color: '#2563EB',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          textStyle: { color: '#64748B', fontSize: 10 },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          zoomOnMouseWheel: 'ctrl',
          moveOnMouseMove: true,
        },
      ],
      series: seriesList,
    };
  }, [data, totalReadings, startIndex, endIndex, simulatedSeries, simEvents]);

  // Handle chart click to trigger meal injection modal
  const onEvents = useMemo(
    () => ({
      datazoom: (evt: any) => {
        if (totalReadings === 0) return;
        let startPercent = 0;
        if (evt.batch && evt.batch[0]) {
          startPercent = evt.batch[0].start;
        } else if (evt.start !== undefined) {
          startPercent = evt.start;
        }
        const newStartIdx = Math.round((startPercent / 100) * totalReadings);
        setStartIndex(Math.max(0, Math.min(newStartIdx, totalReadings - WINDOW_SIZE_8H)));
      },
      click: (params: any) => {
        if (onSelectPointForMeal && params.dataIndex !== undefined) {
          const pt = data[params.dataIndex];
          if (pt) {
            onSelectPointForMeal(params.dataIndex, pt.timestampStr);
          }
        }
      },
    }),
    [totalReadings, data, onSelectPointForMeal]
  );

  return (
    <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${isGameMode ? 'border-purple-300 ring-2 ring-purple-500/10' : 'border-slate-200'}`}>
      {/* Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            {isGameMode ? (
              <Gamepad2 className="w-5 h-5 text-purple-600" />
            ) : (
              <Utensils className="w-5 h-5 text-blue-600" />
            )}
            <h3 className="text-lg font-bold text-slate-900">
              {isGameMode ? '🎮 Interactive Simulation Timeline' : '8-Hour Glucose & Meal Timeline'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Window: <span className="font-semibold text-blue-600">{windowLabel}</span>
            {isGameMode && (
              <span className="ml-2 font-bold text-purple-600">
                (Click chart to inject food event)
              </span>
            )}
          </p>
        </div>

        {/* Step Control Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={jumpToFirst}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Jump to First Day (June 01, 2026)"
          >
            <ChevronsLeft className="w-3.5 h-3.5" /> June 01
          </button>

          <button
            onClick={() => shiftWindow(-POINTS_24H)}
            disabled={startIndex === 0}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
            title="Shift 24 Hours Left"
          >
            -24h
          </button>

          <button
            onClick={() => shiftWindow(-WINDOW_SIZE_8H)}
            disabled={startIndex === 0}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
            title="Shift 8 Hours Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> 8h Left
          </button>

          {/* Quick Date Selector */}
          <div className="relative flex items-center">
            <select
              onChange={handleDateSelect}
              className="bg-white text-slate-700 border border-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-7 shadow-sm"
            >
              <option value="">Jump to Date...</option>
              {availableDates.map((d) => (
                <option key={d.dateStr} value={d.index}>
                  {d.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          <button
            onClick={() => shiftWindow(WINDOW_SIZE_8H)}
            disabled={startIndex >= totalReadings - WINDOW_SIZE_8H}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
            title="Shift 8 Hours Right"
          >
            8h Right <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => shiftWindow(POINTS_24H)}
            disabled={startIndex >= totalReadings - WINDOW_SIZE_8H}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
            title="Shift 24 Hours Right"
          >
            24h <ChevronsRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={jumpToLatest}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Reset to Latest 8 Hours"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Latest
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[400px]">
        <ReactECharts
          ref={chartRef}
          option={option}
          onEvents={onEvents}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-[11px] text-slate-500 px-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" /> Baseline BG
          </span>
          {simulatedSeries && (
            <span className="flex items-center gap-1.5 font-bold text-purple-700">
              <span className="w-3 h-0.5 bg-purple-600 inline-block border-b border-dashed" /> Simulated BG
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 border border-white inline-block" /> Meal Marker
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40 inline-block" /> Target (70-180 mg/dL)
          </span>
        </div>
        <span>Use bottom slider or mouse wheel to pan/zoom</span>
      </div>
    </div>
  );
};
