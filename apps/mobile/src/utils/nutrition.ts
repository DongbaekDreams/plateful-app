import type { RecipeNutrition } from '../../../packages/shared/src/types/recipe';
import type { MealTracking, DailyNutritionTotals } from '../../../packages/shared/src/types/meal-tracking';

/**
 * Parse nutrition value from string format to number
 * Handles formats like "520 kcal", "38g", "38 g", etc.
 */
export function parseNutritionValue(value: string): number {
  if (!value) return 0;
  
  // Extract numeric value using regex
  const match = value.match(/[\d.]+/);
  if (!match) return 0;
  
  return parseFloat(match[0]);
}

/**
 * Calculate meal nutrition from recipe nutrition and portions consumed
 */
export function calculateMealNutrition(
  recipeNutrition: RecipeNutrition,
  portions: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const calories = parseNutritionValue(recipeNutrition.calories_per_portion || '0');
  const protein = parseNutritionValue(recipeNutrition.protein || '0');
  const carbs = parseNutritionValue(recipeNutrition.carbs || '0');
  const fat = parseNutritionValue(recipeNutrition.fat || '0');

  return {
    calories: calories * portions,
    protein: protein * portions,
    carbs: carbs * portions,
    fat: fat * portions,
  };
}

/**
 * Format nutrition value for display
 */
export function formatNutritionValue(value: number, unit: 'kcal' | 'g'): string {
  if (unit === 'kcal') {
    return `${Math.round(value)} kcal`;
  }
  return `${Math.round(value)}g`;
}

/**
 * Aggregate daily nutrition from multiple meals
 */
export function aggregateDailyNutrition(meals: MealTracking[]): DailyNutritionTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fat: acc.fat + meal.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculate percentage of target
 */
export function calculatePercentage(actual: number, target: number | undefined): number | null {
  if (!target || target === 0) return null;
  return Math.round((actual / target) * 100);
}




