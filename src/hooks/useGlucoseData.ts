import { useState, useEffect, useMemo } from 'react';
import { CGMDataPoint, GlycemicMetrics, AGPHourBin, TimeframeDays } from '../types/cgm';
import { loadAndParseCGMCSV } from '../utils/csvParser';
import { calculateGlycemicMetrics, getEmptyMetrics } from '../utils/metricsCalculator';
import { calculateAGPBins } from '../utils/agpCalculator';
import { subDays } from 'date-fns';

export function useGlucoseData(csvUrl: string = '/t1d_90day_blood_sugar_hba1c_7.csv') {
  const [allData, setAllData] = useState<CGMDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeDays>(90);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    loadAndParseCGMCSV(csvUrl)
      .then((data) => {
        if (isMounted) {
          setAllData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load CGM data:', err);
          setError(err.message || 'Error loading CSV dataset');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [csvUrl]);

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
