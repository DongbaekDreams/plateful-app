export interface PantryItem {
  id: string;
  userID: string;
  name: string;
  category: PantryCategory;
  quantity?: number; // Optional - only for countable items like eggs, milk, etc.
  unit?: string; // Optional - e.g., "eggs", "oz", "lb", "cups"
  createdAt: string;
  updatedAt: string;
}

export type PantryCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'spices'
  | 'condiments'
  | 'other';

export interface CommonIngredient {
  name: string;
  category: PantryCategory;
  requiresQuantity: boolean; // true for eggs, milk, etc. - false for salt, pepper, etc.
  commonUnits?: string[]; // Suggested units for quantity input
}

