import { useState, useEffect, useMemo } from 'react';
import { CGMDataPoint, GlycemicMetrics, AGPHourBin, TimeframeDays } from '../types/cgm';
import { parseCGMCSVString } from '../utils/csvParser';
import { RAW_CGM_CSV } from '../data/cgmDataset';
import { calculateGlycemicMetrics, getEmptyMetrics } from '../utils/metricsCalculator';
import { calculateAGPBins } from '../utils/agpCalculator';
import { subDays } from 'date-fns';

export function useGlucoseData() {
  const [allData, setAllData] = useState<CGMDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeDays>(90);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse bundled in-memory dataset synchronously
      const parsedData = parseCGMCSVString(RAW_CGM_CSV);
      setAllData(parsedData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to parse in-memory CGM dataset:', err);
      setError(err.message || 'Error loading dataset');
      setIsLoading(false);
    }
  }, []);

  const { minDate, maxDate } = useMemo(() => {
    if (allData.length === 0) return { minDate: null, maxDate: null };
    return {
      minDate: allData[0].timestamp,
      maxDate: allData[allData.length - 1].timestamp,
    };
  }, [allData]);

  // Filter data according to timeframe selection
  const filteredData = useMemo(() => {
    if (allData.length === 0 || !maxDate) return [];

    const cutoffDate = subDays(maxDate, timeframe);
    return allData.filter((point) => point.timestamp >= cutoffDate);
  }, [allData, maxDate, timeframe]);

  // Calculate live glycemic metrics for filtered timeframe
  const metrics: GlycemicMetrics = useMemo(() => {
    if (filteredData.length === 0) return getEmptyMetrics();
    return calculateGlycemicMetrics(filteredData, timeframe);
  }, [filteredData, timeframe]);

  // Calculate AGP 24h percentile bins for filtered timeframe
  const agpBins: AGPHourBin[] = useMemo(() => {
    if (filteredData.length === 0) return [];
    return calculateAGPBins(filteredData);
  }, [filteredData]);

  return {
    allData,
    filteredData,
    metrics,
    agpBins,
    timeframe,
    setTimeframe,
    isLoading,
    error,
    minDate,
    maxDate,
  };
}
