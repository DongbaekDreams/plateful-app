import type { GroceryItem } from '../types/grocery';

/**
 * Seasoning/spice keywords that should be grouped together.
 */
const SEASONING_KEYWORDS = [
  'salt', 'pepper', 'paprika', 'cumin', 'coriander', 'turmeric', 'cinnamon',
  'nutmeg', 'ginger', 'garlic powder', 'onion powder', 'chili powder',
  'cayenne', 'black pepper', 'white pepper', 'red pepper', 'flakes',
  'oregano', 'basil', 'thyme', 'rosemary', 'sage', 'parsley', 'cilantro',
  'dill', 'bay leaf', 'bay leaves', 'cardamom', 'cloves', 'allspice',
  'curry', 'garam masala', 'herbs', 'spice', 'seasoning', 'seasonings',
];

/**
 * Checks if an item name contains seasoning keywords.
 */
function isSeasoning(name: string): boolean {
  const lowerName = name.toLowerCase();
  return SEASONING_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

/**
 * Normalizes an ingredient name for comparison by:
 * - Converting to lowercase
 * - Removing common prefixes/suffixes
 * - Removing punctuation
 */
function normalizeNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Extracts the base ingredient name, removing modifiers.
 * For example: "Kosher salt" -> "salt", "Sea salt" -> "salt"
 */
function getBaseIngredientName(name: string): string {
  const normalized = normalizeNameForComparison(name);
  
  // Remove common prefixes
  const prefixes = [
    'kosher', 'sea', 'table', 'iodized', 'himalayan', 'pink',
    'black', 'white', 'red', 'green', 'fresh', 'dried', 'ground',
    'whole', 'organic', 'fresh', 'frozen',
  ];
  
  let baseName = normalized;
  for (const prefix of prefixes) {
    const prefixRegex = new RegExp(`^${prefix}\\s+`, 'i');
    if (baseName.match(prefixRegex)) {
      baseName = baseName.replace(prefixRegex, '').trim();
    }
  }
  
  // If we have a multi-word name, try to find the core ingredient
  // Often the last significant word is the ingredient
  const words = baseName.split(/\s+/);
  if (words.length > 1) {
    // Keep the last 1-2 words as they're likely the core ingredient
    baseName = words.slice(-2).join(' ');
  }
  
  return baseName.trim() || normalized;
}

/**
 * Determines if two items are identical and should be merged.
 * Items are considered identical if:
 * - Same normalized name (case-insensitive, punctuation ignored)
 * - Same unit (or both empty)
 * - Same category (or both undefined)
 */
export function areItemsIdentical(item1: GroceryItem, item2: GroceryItem): boolean {
  const name1 = normalizeNameForComparison(item1.name);
  const name2 = normalizeNameForComparison(item2.name);
  
  if (name1 !== name2) {
    return false;
  }
  
  // Same unit (or both empty/null)
  const unit1 = (item1.unit || '').toLowerCase().trim();
  const unit2 = (item2.unit || '').toLowerCase().trim();
  if (unit1 !== unit2) {
    return false;
  }
  
  // Same category (or both undefined)
  const cat1 = item1.category || '';
  const cat2 = item2.category || '';
  if (cat1 !== cat2) {
    return false;
  }
  
  return true;
}

/**
 * Determines if two items are similar (same base ingredient with variations).
 * Similar items should be grouped together but kept distinct.
 * For example: "Kosher salt" and "Sea salt" are similar but not identical.
 */
export function areItemsSimilar(item1: GroceryItem, item2: GroceryItem): boolean {
  // If they're identical, they're definitely similar (but should merge, not group)
  if (areItemsIdentical(item1, item2)) {
    return true;
  }
  
  const base1 = getBaseIngredientName(item1.name);
  const base2 = getBaseIngredientName(item2.name);
  
  // Same base ingredient name
  if (base1 === base2 && base1.length > 0) {
    return true;
  }
  
  // Check if one name contains the other (e.g., "salt" and "sea salt")
  const norm1 = normalizeNameForComparison(item1.name);
  const norm2 = normalizeNameForComparison(item2.name);
  
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // Make sure it's not just a partial word match
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
    if (commonWords.length > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets the category group for an item.
 * Items are grouped by:
 * - Seasonings (special category)
 * - Regular categories (produce, dairy, etc.)
 */
export function getCategoryGroup(item: GroceryItem): string {
  // Seasonings get their own special category
  if (isSeasoning(item.name)) {
    return 'seasonings';
  }
  
  // Use the item's category if set
  if (item.category) {
    return item.category;
  }
  
  // Default category
  return 'other';
}

/**
 * Groups items by category and similarity.
 * 
 * Returns an array of groups, where each group contains:
 * - category: The category name
 * - items: Array of items in that category, grouped by similarity
 * 
 * Within each category, similar items are grouped together but kept as separate entries.
 */
export interface GroupedGroceryItems {
  category: string;
  groups: GroceryItem[][]; // Each inner array contains similar items
}

export function groupGroceryItems(items: GroceryItem[]): GroupedGroceryItems[] {
  // First, group by category
  const byCategory = new Map<string, GroceryItem[]>();
  
  for (const item of items) {
    const category = getCategoryGroup(item);
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(item);
  }
  
  // Then, within each category, group by similarity
  const result: GroupedGroceryItems[] = [];
  
  for (const [category, categoryItems] of byCategory.entries()) {
    const similarityGroups: GroceryItem[][] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < categoryItems.length; i++) {
      if (processed.has(categoryItems[i].id)) {
        continue;
      }
      
      // Start a new similarity group
      const group: GroceryItem[] = [categoryItems[i]];
      processed.add(categoryItems[i].id);
      
      // Find all similar items
      for (let j = i + 1; j < categoryItems.length; j++) {
        if (processed.has(categoryItems[j].id)) {
          continue;
        }
        
        if (areItemsSimilar(categoryItems[i], categoryItems[j])) {
          group.push(categoryItems[j]);
          processed.add(categoryItems[j].id);
        }
      }
      
      similarityGroups.push(group);
    }
    
    result.push({
      category,
      groups: similarityGroups,
    });
  }
  
  // Sort categories: seasonings first, then alphabetically
  result.sort((a, b) => {
    if (a.category === 'seasonings' && b.category !== 'seasonings') {
      return -1;
    }
    if (a.category !== 'seasonings' && b.category === 'seasonings') {
      return 1;
    }
    return a.category.localeCompare(b.category);
  });
  
  return result;
}

/**
 * Merges identical items by combining their quantities.
 * Returns an array of merged items.
 */
export function mergeIdenticalItems(items: GroceryItem[]): GroceryItem[] {
  const mergedMap = new Map<string, GroceryItem>();
  
  for (const item of items) {
    // Create a key based on normalized name, unit, and category
    const key = `${normalizeNameForComparison(item.name)}|${(item.unit || '').toLowerCase()}|${item.category || ''}`;
    
    const existing = mergedMap.get(key);
    if (existing) {
      // Merge: combine quantities and notes
      existing.quantity = (existing.quantity || 0) + (item.quantity || 0);
      
      // Combine notes if different
      if (item.notes && existing.notes && item.notes !== existing.notes) {
        const existingNotes = existing.notes.split(/[,;]/).map(n => n.trim());
        const newNotes = item.notes.split(/[,;]/).map(n => n.trim());
        const allNotes = [...new Set([...existingNotes, ...newNotes])];
        existing.notes = allNotes.join(', ');
      } else if (item.notes && !existing.notes) {
        existing.notes = item.notes;
      }
      
      // Preserve completed status if either is completed
      existing.completed = existing.completed || item.completed;
    } else {
      // First occurrence of this item
      mergedMap.set(key, { ...item });
    }
  }
  
  return Array.from(mergedMap.values());
}

/**
 * Finds duplicate items in a list when adding new items.
 * Returns items that already exist (for merging) and items that are new.
 */
export function findDuplicates(
  existingItems: GroceryItem[],
  newItems: Omit<GroceryItem, 'id' | 'userID' | 'listID' | 'completed' | 'createdAt' | 'updatedAt'>[]
): {
  toMerge: Array<{ existing: GroceryItem; new: typeof newItems[0] }>;
  toAdd: typeof newItems;
} {
  const toMerge: Array<{ existing: GroceryItem; new: typeof newItems[0] }> = [];
  const toAdd: typeof newItems = [];
  
  for (const newItem of newItems) {
    let foundMatch = false;
    
    for (const existingItem of existingItems) {
      // Create a temporary GroceryItem from newItem to use areItemsIdentical
      const tempNewItem: GroceryItem = {
        ...newItem,
        id: '',
        userID: '',
        listID: '',
        completed: false,
        createdAt: '',
        updatedAt: '',
      };
      
      if (areItemsIdentical(existingItem, tempNewItem)) {
        toMerge.push({ existing: existingItem, new: newItem });
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      toAdd.push(newItem);
    }
  }
  
  return { toMerge, toAdd };
}

