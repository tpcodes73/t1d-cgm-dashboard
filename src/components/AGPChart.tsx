import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AGPHourBin } from '../types/cgm';
import { Layers } from 'lucide-react';

interface AGPChartProps {
  agpBins: AGPHourBin[];
  daysCount: number;
}

export const AGPChart: React.FC<AGPChartProps> = ({ agpBins, daysCount }) => {
  const option = useMemo(() => {
    if (!agpBins || agpBins.length === 0) return {};

    const timeLabels = agpBins.map((b) => b.timeLabel);
    const p5Data = agpBins.map((b) => b.p5);
    const p25Data = agpBins.map((b) => b.p25);
    const p50Data = agpBins.map((b) => b.p50);
    const p75Data = agpBins.map((b) => b.p75);
    const p95Data = agpBins.map((b) => b.p95);

    // ECharts stacked band calculations for area rendering
    const p95MinusP5 = agpBins.map((b) => Math.max(0, b.p95 - b.p5));
    const p75MinusP25 = agpBins.map((b) => Math.max(0, b.p75 - b.p25));

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 35,
        right: 30,
        bottom: 45,
        left: 55,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#2563EB', type: 'dashed' } },
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
          const bin = agpBins[idx];
          if (!bin) return '';

          let html = `<div style="font-weight: 700; color: #64748B; margin-bottom: 6px;">⏱️ Time Slot: ${bin.timeLabel}</div>`;
          html += `<div style="display: flex; flex-col; gap: 4px; font-size: 12px;">`;
          html += `<div><span style="color: #3B82F6;">● 95th Percentile:</span> <b>${bin.p95} mg/dL</b></div>`;
          html += `<div><span style="color: #2563EB;">● 75th Percentile:</span> <b>${bin.p75} mg/dL</b></div>`;
          html += `<div style="color: #059669; font-weight: 700; font-size: 13px;">● 50th (Median): ${bin.p50} mg/dL</div>`;
          html += `<div><span style="color: #2563EB;">● 25th Percentile:</span> <b>${bin.p25} mg/dL</b></div>`;
          html += `<div><span style="color: #3B82F6;">● 5th Percentile:</span> <b>${bin.p5} mg/dL</b></div>`;
          html += `</div>`;
          return html;
        },
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          interval: 7, // Show label roughly every 2 hours (8 slots of 15m)
        },
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 300,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      series: [
        // Base p5 line (invisible, used for outer band stacking)
        {
          name: 'p5_base',
          type: 'line',
          data: p5Data,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'outer_band',
        },
        // Outer Band: 5th - 95th Percentile Fill
        {
          name: '5th - 95th Percentile Range',
          type: 'line',
          data: p95MinusP5,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'outer_band',
          areaStyle: { color: 'rgba(37, 99, 235, 0.12)' },
        },
        // Base p25 line (invisible, used for inner band stacking)
        {
          name: 'p25_base',
          type: 'line',
          data: p25Data,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'inner_band',
        },
        // Inner Band: 25th - 75th Percentile (IQR) Fill
        {
          name: '25th - 75th Percentile (IQR)',
          type: 'line',
          data: p75MinusP25,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'inner_band',
          areaStyle: { color: 'rgba(37, 99, 235, 0.28)' },
        },
        // Median Line (50th Percentile)
        {
          name: '50th Percentile (Median)',
          type: 'line',
          data: p50Data,
          smooth: 0.3,
          symbol: 'none',
          lineStyle: { width: 3, color: '#1D4ED8' },
          z: 5,
          // Target Area shading 70-180 mg/dL
          markArea: {
            silent: true,
            data: [
              [
                {
                  yAxis: 70,
                  itemStyle: { color: 'rgba(16, 185, 129, 0.08)' },
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
                lineStyle: { color: '#D97706', type: 'dashed', width: 1 },
                label: { formatter: '180', color: '#D97706', fontSize: 10 },
              },
              {
                yAxis: 70,
                lineStyle: { color: '#DC2626', type: 'dashed', width: 1 },
                label: { formatter: '70', color: '#DC2626', fontSize: 10 },
              },
            ],
          },
        },
      ],
    };
  }, [agpBins]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ambulatory Glucose Profile (AGP)</h3>
            <p className="text-xs text-slate-500">
              24-Hour Diurnal Glucose Modal Curves ({daysCount} Days Data Superimposed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40" /> 5th–95th %
          </span>
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" /> 25th–75th % (IQR)
          </span>
          <span className="flex items-center gap-1 text-blue-700 font-bold">
            <span className="w-3 h-0.5 bg-blue-700" /> Median (50th)
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[320px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
};
