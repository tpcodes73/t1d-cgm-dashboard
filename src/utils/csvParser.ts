import Papa from 'papaparse';
import { parse, getHours, getMinutes, format } from 'date-fns';
import { RawCSVRow, CGMDataPoint, GlucoseCategory } from '../types/cgm';

export function getGlucoseCategory(glucose: number): GlucoseCategory {
  if (glucose < 54) return 'very_low';
  if (glucose < 70) return 'low';
  if (glucose <= 180) return 'target';
  if (glucose <= 250) return 'high';
  return 'very_high';
}

export async function loadAndParseCGMCSV(url: string): Promise<CGMDataPoint[]> {
  const response = await fetch(url);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<RawCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const dataPoints: CGMDataPoint[] = [];

          results.data.forEach((row, index) => {
            if (!row.Timestamp || !row['Blood Sugar (mg/dL)']) return;

            const glucose = parseFloat(row['Blood Sugar (mg/dL)']);
            if (isNaN(glucose)) return;

            // Parse timestamp format "YYYY-MM-DD HH:mm"
            const parsedDate = parse(row.Timestamp, 'yyyy-MM-dd HH:mm', new Date());
            const hours = getHours(parsedDate);
            const minutes = getMinutes(parsedDate);
            const timeOfDayHours = hours + minutes / 60;
            const timeOfDayLabel = format(parsedDate, 'HH:mm');

            const mealName = row.Meal_Name?.trim();
            const carbsStr = row['Carbs (g)'];
            const proteinStr = row['Protein (g)'];

            const carbs = carbsStr && !isNaN(parseFloat(carbsStr)) ? parseFloat(carbsStr) : 0;
            const protein = proteinStr && !isNaN(parseFloat(proteinStr)) ? parseFloat(proteinStr) : 0;
            const hasMeal = Boolean(mealName && mealName.length > 0) || carbs > 0 || protein > 0;

            dataPoints.push({
              id: index,
              timestamp: parsedDate,
              timestampStr: row.Timestamp,
              timeOfDayHours,
              timeOfDayLabel,
              glucose,
              hasMeal,
              mealName: hasMeal ? (mealName || 'Meal') : undefined,
              carbs: hasMeal ? carbs : undefined,
              protein: hasMeal ? protein : undefined,
              category: getGlucoseCategory(glucose),
            });
          });

          // Sort chronologically by timestamp
          dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          resolve(dataPoints);
        } catch (err) {
          reject(err);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
