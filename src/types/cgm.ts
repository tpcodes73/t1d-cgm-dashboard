export interface RawCSVRow {
  Timestamp: string; // "YYYY-MM-DD HH:mm"
  'Blood Sugar (mg/dL)': string;
  Meal_Name?: string;
  'Carbs (g)'?: string;
  'Protein (g)'?: string;
}

export type GlucoseCategory = 'very_low' | 'low' | 'target' | 'high' | 'very_high';

export interface CGMDataPoint {
  id: number;
  timestamp: Date;
  timestampStr: string;
  timeOfDayHours: number; // 0.0 - 23.75
  timeOfDayLabel: string; // "HH:mm"
  glucose: number;
  hasMeal: boolean;
  mealName?: string;
  carbs?: number;
  protein?: number;
  category: GlucoseCategory;
}

export interface GlycemicMetrics {
  totalReadings: number;
  daysCount: number;
  meanGlucose: number;
  medianGlucose: number;
  sdGlucose: number;
  cvPercent: number; // (SD / Mean) * 100
  estimatedHbA1c: number; // (Mean + 46.7) / 28.7
  tirPercent: number; // 70-180 mg/dL
  tarHighPercent: number; // 181-250 mg/dL
  tarVeryHighPercent: number; // >250 mg/dL
  tbrLowPercent: number; // 54-69 mg/dL
  tbrVeryLowPercent: number; // <54 mg/dL
  avgDailyCarbs: number;
  avgDailyProtein: number;
  totalCarbs: number;
  totalProtein: number;
  mealCount: number;
}

export interface AGPHourBin {
  timeOfDayHours: number; // e.g. 8.25
  timeLabel: string; // "08:15"
  count: number;
  p5: number;
  p25: number;
  p50: number; // Median
  p75: number;
  p95: number;
}

export type TimeframeDays = 14 | 30 | 90;
