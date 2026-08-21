import { CGMDataPoint, GlucoseCategory } from '../types/cgm';
import { getGlucoseCategory } from './csvParser';

export interface FoodItem {
  id: string;
  name: string;
  carbs: number; // in grams
  icon: string;
  category?: string;
}

export interface SimEvent {
  id: string;
  dataIndex: number; // index in the baseline time series array
  timestampStr: string;
  food: FoodItem;
}

export const FOOD_MENU: FoodItem[] = [
  { id: 'apple', name: 'Apple', carbs: 15, icon: '🍎', category: 'Fruit' },
  { id: 'banana', name: 'Banana', carbs: 27, icon: '🍌', category: 'Fruit' },
  { id: 'slice_bread', name: 'Slice of Bread', carbs: 15, icon: '🍞', category: 'Bakery' },
  { id: 'chocolate_bar', name: 'Chocolate Bar', carbs: 25, icon: '🍫', category: 'Snack' },
  { id: 'orange_juice', name: 'Orange Juice (8oz)', carbs: 26, icon: '🧃', category: 'Beverage' },
  { id: 'glazed_donut', name: 'Glazed Donut', carbs: 30, icon: '🍩', category: 'Bakery' },
  { id: 'pizza_slice', name: 'Slice of Pizza', carbs: 35, icon: '🍕', category: 'Meal' },
  { id: 'can_soda', name: 'Regular Soda (12oz)', carbs: 39, icon: '🥤', category: 'Beverage' },
  { id: 'white_rice', name: 'White Rice (1 cup)', carbs: 45, icon: '🍚', category: 'Meal' },
  { id: 'plain_bagel', name: 'Plain Bagel', carbs: 55, icon: '🥯', category: 'Bakery' },
];

/**
 * Computes simulated glucose array by layering 4-hour triangular impulse curves
 * for each user-injected food event on top of the baseline CGM readings.
 * 1g carb = +3 mg/dL peak at +2 hours (8 steps of 15 min).
 * Linear rise (0 to 8 steps), linear fall (8 to 16 steps).
 */
export function computeSimulatedPoints(
  baselineData: CGMDataPoint[],
  events: SimEvent[]
): { simulatedData: CGMDataPoint[]; simulatedGlucoseValues: number[] } {
  if (baselineData.length === 0) {
    return { simulatedData: [], simulatedGlucoseValues: [] };
  }

  const simulatedValues = baselineData.map((d) => d.glucose);

  events.forEach((event) => {
    const peakDelta = event.food.carbs * 3.0; // 1g carb = +3 mg/dL peak
    const totalSteps = 16; // 4 hours = 16 * 15min steps

    for (let step = 0; step <= totalSteps; step++) {
      const idx = event.dataIndex + step;
      if (idx >= simulatedValues.length) break;

      const factor = step <= 8 ? step / 8.0 : (16 - step) / 8.0;
      const delta = factor * peakDelta;
      simulatedValues[idx] += Math.round(delta);
    }
  });

  // Enrich into CGMDataPoint array
  const simulatedData: CGMDataPoint[] = baselineData.map((pt, index) => {
    const simGlucose = simulatedValues[index];
    const category: GlucoseCategory = getGlucoseCategory(simGlucose);

    return {
      ...pt,
      glucose: simGlucose,
      category,
    };
  });

  return { simulatedData, simulatedGlucoseValues: simulatedValues };
}
