export interface MealTrackingNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTracking {
  id: string;
  userID: string;
  recipeID: string; // Links to tracked recipe
  date: string; // YYYY-MM-DD in user's timezone
  portions: number; // Portions consumed (e.g., 1, 1.5, 2)
  nutrition: MealTrackingNutrition; // Calculated from recipe nutrition * portions
  createdAt: string;
  updatedAt: string;
}

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

