import { CGMDataPoint, AGPHourBin } from '../types/cgm';
import { quantile } from 'simple-statistics';

export function calculateAGPBins(data: CGMDataPoint[]): AGPHourBin[] {
  // 96 15-minute bins in a 24-hour day (0 to 95)
  const binsMap = new Map<number, number[]>();

  for (let i = 0; i < 96; i++) {
    binsMap.set(i, []);
  }

  // Group glucose values by 15-minute slot of the day
  data.forEach((point) => {
    const hours = point.timestamp.getHours();
    const minutes = point.timestamp.getMinutes();
    const binIndex = Math.floor((hours * 60 + minutes) / 15);
    if (binIndex >= 0 && binIndex < 96) {
      binsMap.get(binIndex)?.push(point.glucose);
    }
  });

  const agpBins: AGPHourBin[] = [];

  for (let i = 0; i < 96; i++) {
    const values = binsMap.get(i) || [];
    const totalMinutes = i * 15;
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    const timeLabel = `${hh}:${mm}`;
    const timeOfDayHours = totalMinutes / 60;

    if (values.length === 0) {
      agpBins.push({
        timeOfDayHours,
        timeLabel,
        count: 0,
        p5: 100,
        p25: 110,
        p50: 120,
        p75: 130,
        p95: 140,
      });
      continue;
    }

    const sorted = [...values].sort((a, b) => a - b);

    const p5 = quantile(sorted, 0.05);
    const p25 = quantile(sorted, 0.25);
    const p50 = quantile(sorted, 0.50);
    const p75 = quantile(sorted, 0.75);
    const p95 = quantile(sorted, 0.95);

    agpBins.push({
      timeOfDayHours,
      timeLabel,
      count: values.length,
      p5: Math.round(p5 * 10) / 10,
      p25: Math.round(p25 * 10) / 10,
      p50: Math.round(p50 * 10) / 10,
      p75: Math.round(p75 * 10) / 10,
      p95: Math.round(p95 * 10) / 10,
    });
  }

  return agpBins;
}
