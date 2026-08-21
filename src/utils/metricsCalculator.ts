import { CGMDataPoint, GlycemicMetrics } from '../types/cgm';
import { sampleStandardDeviation, median } from 'simple-statistics';

export function getEmptyMetrics(): GlycemicMetrics {
  return {
    totalReadings: 0,
    daysCount: 0,
    meanGlucose: 0,
    medianGlucose: 0,
    sdGlucose: 0,
    cvPercent: 0,
    estimatedHbA1c: 0,
    tirPercent: 0,
    tarHighPercent: 0,
    tarVeryHighPercent: 0,
    tbrLowPercent: 0,
    tbrVeryLowPercent: 0,
    avgDailyCarbs: 0,
    avgDailyProtein: 0,
    totalCarbs: 0,
    totalProtein: 0,
    mealCount: 0,
  };
}

export function calculateGlycemicMetrics(data: CGMDataPoint[], days: number): GlycemicMetrics {
  if (data.length === 0) return getEmptyMetrics();

  const glucoseArray = data.map((d) => d.glucose);
  const totalReadings = glucoseArray.length;

  const sum = glucoseArray.reduce((acc, val) => acc + val, 0);
  const meanGlucose = sum / totalReadings;
  const medGlucose = median(glucoseArray);
  const sdGlucose = totalReadings > 1 ? sampleStandardDeviation(glucoseArray) : 0;
  const cvPercent = meanGlucose > 0 ? (sdGlucose / meanGlucose) * 100 : 0;

  // ADAG Formula for eA1c: (Mean Glucose + 46.7) / 28.7
  const estimatedHbA1c = (meanGlucose + 46.7) / 28.7;

  // Time in Range Classifications
  const veryLowCount = data.filter((d) => d.glucose < 54).length;
  const lowCount = data.filter((d) => d.glucose >= 54 && d.glucose < 70).length;
  const targetCount = data.filter((d) => d.glucose >= 70 && d.glucose <= 180).length;
  const highCount = data.filter((d) => d.glucose > 180 && d.glucose <= 250).length;
  const veryHighCount = data.filter((d) => d.glucose > 250).length;

  // Meal Aggregations
  const meals = data.filter((d) => d.hasMeal);
  const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);

  const effectiveDays = Math.max(days, 1);

  return {
    totalReadings,
    daysCount: days,
    meanGlucose: Math.round(meanGlucose * 10) / 10,
    medianGlucose: Math.round(medGlucose),
    sdGlucose: Math.round(sdGlucose * 10) / 10,
    cvPercent: Math.round(cvPercent * 10) / 10,
    estimatedHbA1c: Math.round(estimatedHbA1c * 100) / 100,
    tirPercent: Math.round((targetCount / totalReadings) * 1000) / 10,
    tarHighPercent: Math.round((highCount / totalReadings) * 1000) / 10,
    tarVeryHighPercent: Math.round((veryHighCount / totalReadings) * 1000) / 10,
    tbrLowPercent: Math.round((lowCount / totalReadings) * 1000) / 10,
    tbrVeryLowPercent: Math.round((veryLowCount / totalReadings) * 1000) / 10,
    avgDailyCarbs: Math.round(totalCarbs / effectiveDays),
    avgDailyProtein: Math.round(totalProtein / effectiveDays),
    totalCarbs: Math.round(totalCarbs),
    totalProtein: Math.round(totalProtein),
    mealCount: meals.length,
  };
}
