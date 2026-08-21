# Implementation Plan & Blueprint: T1D CGM & Nutrition Dashboard

This document serves as the complete technical implementation guide for building the client-side Single Page Application (SPA) for Type 1 Diabetes (T1D) Continuous Glucose Monitoring (CGM) and Nutrition Analytics.

---

## 1. Project Overview & System Requirements

### 1.1 Goal
Build an interactive, high-performance web dashboard that loads `t1d_90day_blood_sugar_with_meals.csv` (8,640 records across 90 days), renders an 8-hour scrollable glucose timeline with interactive meal markers, and calculates clinical-grade glycemic analytics across 14-day, 30-day, and 90-day timeframes.

### 1.2 Tech Stack Selection

| Component | Choice | Reason / Specification |
| :--- | :--- | :--- |
| **Framework** | React 18 + Vite + TypeScript | High performance, static bundle capability, strong type safety. |
| **Styling** | Tailwind CSS + Lucide React | Modern utility-first CSS and crisp UI icons. |
| **Charting Engine** | Apache ECharts (`echarts`, `echarts-for-react`) | Native `dataZoom` support for 8k+ points, smooth timeline panning, custom SVG meal markers. |
| **CSV Engine** | PapaParse (`papaparse`) | Zero-dependency fast streaming browser CSV parser. |
| **Date & Math Utility** | `date-fns`, `simple-statistics` | Precision date manipulation and quantile calculations for AGP bands. |

---

## 2. Directory Structure & Architecture

```
t1d-cgm-dashboard/
├── public/
│   └── data/
│       └── t1d_90day_blood_sugar_with_meals.csv
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── GlucoseTimeline.tsx
│   │   ├── TimeframeSelector.tsx
│   │   ├── TimeInRangeBar.tsx
│   │   ├── StatCardGrid.tsx
│   │   ├── MacroNutritionCard.tsx
│   │   └── AGPChart.tsx
│   ├── hooks/
│   │   └── useGlucoseData.ts
│   ├── types/
│   │   └── cgm.ts
│   ├── utils/
│   │   ├── csvParser.ts
│   │   └── metricsCalculator.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Data Schema & Types (`src/types/cgm.ts`)

```typescript
export interface RawCSVRow {
  Timestamp: string; // "YYYY-MM-DD HH:mm"
  'Blood Sugar (mg/dL)': string;
  Meal_Name?: string;
  'Carbs (g)'?: string;
  'Protein (g)'?: string;
}

export interface CGMDataPoint {
  id: number;
  timestamp: Date;
  timestampStr: string;
  timeOfDayHours: number; // 0.0 - 23.75
  glucose: number;
  hasMeal: boolean;
  mealName?: string;
  carbs?: number;
  protein?: number;
  category: 'very_low' | 'low' | 'target' | 'high' | 'very_high';
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
}

export interface AGPHourBin {
  timeOfDay: number; // e.g. 8.25
  timeLabel: string; // "08:15"
  p5: number;
  p25: number;
  p50: number; // Median
  p75: number;
  p95: number;
}
```

---

## 4. Business Logic & Calculations (`src/utils/metricsCalculator.ts`)

### 4.1 Glycemic Metric Engine

```typescript
import { CGMDataPoint, GlycemicMetrics } from '../types/cgm';
import { sampleStandardDeviation, median } from 'simple-statistics';

export function calculateGlycemicMetrics(data: CGMDataPoint[], days: number): GlycemicMetrics {
  if (data.length === 0) return getEmptyMetrics();

  const glucoseArray = data.map(d => d.glucose);
  const totalReadings = glucoseArray.length;
  
  const sum = glucoseArray.reduce((acc, val) => acc + val, 0);
  const meanGlucose = sum / totalReadings;
  const medGlucose = median(glucoseArray);
  const sdGlucose = sampleStandardDeviation(glucoseArray);
  const cvPercent = (sdGlucose / meanGlucose) * 100;
  
  // ADAG Formula for eA1c
  const estimatedHbA1c = (meanGlucose + 46.7) / 28.7;

  // Time in Range Classifications
  const veryLowCount = data.filter(d => d.glucose < 54).length;
  const lowCount = data.filter(d => d.glucose >= 54 && d.glucose < 70).length;
  const targetCount = data.filter(d => d.glucose >= 70 && d.glucose <= 180).length;
  const highCount = data.filter(d => d.glucose > 180 && d.glucose <= 250).length;
  const veryHighCount = data.filter(d => d.glucose > 250).length;

  // Meal Aggregations
  const meals = data.filter(d => d.hasMeal);
  const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);

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
    avgDailyCarbs: Math.round(totalCarbs / days),
    avgDailyProtein: Math.round(totalProtein / days),
  };
}
```

---

## 5. Main Component Specifications & Features

### 5.1 Component 1: `GlucoseTimeline.tsx` (Interactive 8-Hour Chart)

#### UI & Requirements:
* **Default Display:** Viewport locks to **8 hours of data** (32 consecutive 15-minute intervals).
* **Navigation Header:** 
  * Buttons: `[⏮ 24h Left]`, `[◀ 8h Left]`, Date Picker Dropdown, `[8h Right ▶]`, `[24h Right ⏭]`.
  * Display current window range: e.g., `Viewing: June 01, 2026 00:00 - June 01, 2026 08:00`.
* **Apache ECharts Configuration:**
  * **X-Axis:** Type `'category'`, showing timestamps (`HH:mm`).
  * **Y-Axis:** Glucose values (40 to 300 mg/dL).
  * **Target Area (`markArea`):** Shaded background color `#E8F5E9` (soft green) from y=70 to y=180.
  * **Threshold Lines (`markLine`):** Dashed line at y=180 (Orange `#FB8C00`) and y=70 (Red `#E53935`).
  * **DataZoom Slider:** Fixed bottom slider showing entire 90-day macro overview. Setting `startValue` and `endValue` controls the 8-hour window position dynamically.
  * **Meal Dots (`scatter` series overlay):**
    * Displayed at indices where `hasMeal === true`.
    * Icon: Custom circular badge with inner utensil or bold marker.
    * Symbol size: 14px.

#### Interactive Tooltip Formatter Spec:
```javascript
formatter: function (params) {
  const item = params[0];
  const dataObj = rawDataArray[item.dataIndex];
  
  let html = `<div style="font-weight: bold; margin-bottom: 4px;">${dataObj.timestampStr}</div>`;
  html += `<div>Glucose: <b style="font-size: 14px;">${dataObj.glucose} mg/dL</b></div>`;
  
  if (dataObj.hasMeal) {
    html += `<hr style="margin: 6px 0; border: none; border-top: 1px solid #ccc;" />`;
    html += `<div style="color: #D84315; font-weight: bold;">🍽️ ${dataObj.mealName}</div>`;
    html += `<div style="font-size: 12px; margin-top: 2px;">`;
    html += `  <span>Carbs: <b>${dataObj.carbs}g</b></span> | `;
    html += `  <span>Protein: <b>${dataObj.protein}g</b></span>`;
    html += `</div>`;
  }
  return html;
}
```

---

### 5.2 Component 2: `TimeframeSelector.tsx`

* **Tabs:** `[ Last 14 Days ]`, `[ Last 30 Days ]`, `[ Last 90 Days ]`.
* **Behavior:** Updates central state `selectedTimeframe` (14, 30, or 90). Filtering selects data points where `timestamp >= (maxTimestamp - selectedDays)`.

---

### 5.3 Component 3: Glycemic Analytics Grid

#### 1. Time in Range (TIR) Stacked Progress Bar & Visual Card (`TimeInRangeBar.tsx`)
* Displays stacked horizontal bar with standard clinical colors:
  * **Very High (>250 mg/dL):** Amber `#E65100`
  * **High (181–250 mg/dL):** Yellow `#FB8C00`
  * **Target Range (70–180 mg/dL):** Green `#4CAF50` (Primary Goal >70%)
  * **Low (54–69 mg/dL):** Red `#E53935`
  * **Very Low (<54 mg/dL):** Dark Red `#B71C1C`
* Includes legend badges showing target vs actual percentages for the selected timeframe.

#### 2. Key Glycemic Stat Cards (`StatCardGrid.tsx`)
Four key stat cards with icons and status colors:
* **Estimated HbA1c (eA1c):** Value (e.g., `7.0%`), Formula reference badge (`ADAG Standard`).
* **Average Glucose:** Value (e.g., `154 mg/dL`).
* **Glycemic Variability (%CV):** Value (e.g., `28.4%`), Badge showing `Stable (≤36%)` in green or `High Variability (>36%)` in red.
* **Standard Deviation (SD):** Value (e.g., `42.1 mg/dL`).

#### 3. Macro Nutrition Card (`MacroNutritionCard.tsx`)
* **Avg Carbs per Day:** e.g., `118 g/day`.
* **Avg Protein per Day:** e.g., `51 g/day`.
* **Carb-to-Protein Visual Ratio Bar.**

---

### 5.4 Component 4: `AGPChart.tsx` (Hourly Diurnal Profile)

#### Overview:
Aggregates all readings in the selected timeframe (14, 30, or 90 days) into **96 time bins** (every 15 minutes of a 24-hour day).

#### Percentile Calculation Algorithm:
For each 15-minute slot (e.g., `08:00`, `08:15`, etc.):
1. Extract all readings occurring at that exact time of day across the $N$ days in timeframe.
2. Sort values ascendingly.
3. Compute percentiles: `p5`, `p25`, `p50` (median), `p75`, `p95`.

#### Chart Visualization in ECharts:
* **Outer Band (5th to 95th Percentile):** `type: 'line'`, `stack: 'p95-band'`, light blue fill (`rgba(25, 118, 210, 0.15)`).
* **Inner Band (25th to 75th Percentile - IQR):** `type: 'line'`, `stack: 'p75-band'`, darker blue fill (`rgba(25, 118, 210, 0.35)`).
* **Median Curve (50th Percentile):** Solid dark blue line (`#0D47A1`), linewidth 3px.
* **X-Axis:** `00:00` to `24:00` (24 hours).
* **Target Band Overlay:** Green shaded region (70-180 mg/dL).

---

## 6. Development Step-by-Step Checklist for Antigravity

- [ ] **Step 1: Bootstrap Project**
  - Run `npm create vite@latest t1d-dashboard -- --template react-ts`.
  - Install dependencies: `npm i echarts echarts-for-react papaparse lucide-react date-fns simple-statistics`.
  - Install Tailwind CSS: `npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`.

- [ ] **Step 2: Copy Dataset**
  - Place `t1d_90day_blood_sugar_with_meals.csv` inside `/public/data/`.

- [ ] **Step 3: CSV Loader Custom Hook (`useGlucoseData.ts`)**
  - Write PapaParse fetcher inside `useEffect`.
  - Parse dates using `date-fns/parse`.
  - Store enriched `CGMDataPoint[]` in React state.

- [ ] **Step 4: Build Timeline Navigation State**
  - Maintain `windowStartIndex` state (default: `totalReadings - 32` to show the latest 8 hours).
  - Implement step handlers (`shiftWindow(offsetInPoints)`).

- [ ] **Step 5: Implement `GlucoseTimeline.tsx`**
  - Configure ECharts option object with smooth spline, scatter meal dots, target background, and tooltip formatter.

- [ ] **Step 6: Implement Timeframe State & Stat Engines**
  - Build active tab state (`14`, `30`, `90`).
  - Wire `calculateGlycemicMetrics()` to generate live data for cards and TIR bar.

- [ ] **Step 7: Implement AGP Diurnal Aggregation Chart**
  - Write percentile grouping logic per 15-minute bin.
  - Render dual shaded percentile areas with ECharts line bands.

- [ ] **Step 8: UI Polishing & Testing**
  - Verify zero console errors.
  - Verify smooth mouse scrolling / touch panning.
  - Ensure meal tooltips hover accurately over meal timestamps.
