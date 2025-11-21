import type { RecipeNutrition } from '@plateful/shared';

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




