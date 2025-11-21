export interface GroceryItem {
  id: string;
  listID: string; // Required for Cosmos DB partitioning
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
  completed: boolean;
  userID: string; // Matches pattern used in pantry, recipes, etc.
  createdAt: string; // ISO string for Cosmos DB compatibility
  updatedAt: string; // ISO string for Cosmos DB compatibility
}

export interface GroceryList {
  id: string; // Cosmos DB requires id field
  listID: string; // Partition key for Cosmos DB (/listID), primary identifier
  name: string;
  items: GroceryItem[]; // Items stored separately in Cosmos, populated when fetched
  itemCount?: number; // Count of items in the list (for display purposes)
  userID: string; // Matches pattern used in pantry, recipes, etc.  
  sharedWith?: string[];
  createdAt: string; // ISO string for Cosmos DB compatibility
  updatedAt: string; // ISO string for Cosmos DB compatibility
}

export type GroceryCategory = 
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'other';

