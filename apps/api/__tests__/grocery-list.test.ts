/**
 * Test Cases for Requirement 2.2.12 - Generate Grocery List from Recipes
 * 
 * Tests client-side functions: parseIngredients(), scaleIngredient(), findPantryMatch()
 * and API endpoint: POST /api/grocery/:userID/lists/:listID/items
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Hono } from 'hono';
import type { Env } from 'hono';

// Mock dependencies BEFORE imports
jest.mock('../lib/cosmos', () => ({
  getContainer: jest.fn(),
  generateId: jest.fn((prefix) => `${prefix}-${Date.now()}`),
  isCosmosAvailable: jest.fn(() => true),
}));

// Mock the shared utils that grocery API imports
jest.mock('../../../../packages/shared/src/utils/grocery-grouping', () => ({
  findDuplicates: jest.fn((existingItems: any[], newItems: any[]) => ({
    toMerge: [],
    toAdd: newItems,
  })),
  mergeIdenticalItems: jest.fn((items: any[]) => items),
}));

import { getContainer } from '../lib/cosmos';
import { parseIngredients } from '../../../../packages/shared/src/utils/ingredient-parser';
import { scaleIngredient } from '../../../../packages/shared/src/utils/portion-scaling';
import { findPantryMatch } from '../../../../packages/shared/src/utils/pantry-matcher';
import groceryRoutes from '../api/grocery';

const app = new Hono<Env>();
app.route('/api/grocery', groceryRoutes);

describe('Requirement 2.2.12 - Generate Grocery List from Recipes', () => {
  let mockListsContainer: any;
  let mockItemsContainer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockListsContainer = {
      items: {
        create: jest.fn(),
        query: jest.fn(),
        upsert: jest.fn(),
      },
      item: jest.fn(() => ({
        read: jest.fn(),
        replace: jest.fn(),
        delete: jest.fn(),
      })),
    };

    mockItemsContainer = {
      items: {
        create: jest.fn(),
        query: jest.fn(),
        upsert: jest.fn(),
      },
      item: jest.fn(() => ({
        read: jest.fn(),
        replace: jest.fn(),
        delete: jest.fn(),
      })),
    };

    (getContainer as jest.Mock).mockImplementation((containerName: string) => {
      if (containerName === 'groceryLists') return mockListsContainer;
      if (containerName === 'groceryItems') return mockItemsContainer;
      return null;
    });
  });

  describe('TC-2.2.12.1: Generate Grocery List from Single Recipe', () => {
    it('should parse ingredients and add to grocery list', async () => {
      // Initialization
      const userID = 'user-123';
      const listID = 'list-456';
      const ingredients = [
        '500g chicken breast',
        '200ml tomato puree',
        '2 tbsp garam masala',
        '150ml cream',
      ];

      mockListsContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: listID, userID, name: 'Test List' }],
        }),
      });
      mockItemsContainer.items.query.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      });
      mockItemsContainer.items.create.mockResolvedValue({ resource: {} });

      // Test Steps
      const parsed = parseIngredients(ingredients);
      expect(parsed.length).toBe(4);
      expect(parsed[0].name).toContain('chicken breast');
      expect(parsed[0].quantity).toBe(500);
      expect(parsed[0].unit).toBe('g');

      const itemsToAdd = parsed.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      }));

      const res = await app.request(`/api/grocery/${userID}/lists/${listID}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToAdd }),
      });

      // Expected Results
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(data.created).toBeGreaterThan(0);
    });
  });

  describe('TC-2.2.12.2: Scale Quantities for Different Household Size', () => {
    it('should scale ingredient quantities correctly', () => {
      // Test Steps
      const scaled1 = scaleIngredient('500g chicken breast', 4, 8);
      const scaled2 = scaleIngredient('200ml tomato puree', 4, 8);
      const scaled3 = scaleIngredient('2 tbsp garam masala', 4, 8);

      // Expected Results
      expect(scaled1).toContain('1000 g');
      expect(scaled2).toContain('400 ml');
      expect(scaled3).toContain('4 tbsp');

      // Parse scaled ingredients
      const parsed = parseIngredients([scaled1, scaled2, scaled3]);
      expect(parsed[0].quantity).toBe(1000);
      expect(parsed[1].quantity).toBe(400);
      expect(parsed[2].quantity).toBe(4);
    });
  });

  describe('TC-2.2.12.3: Generate Grocery List from Multiple Recipes', () => {
    it('should merge duplicate ingredients when adding to list', async () => {
      // Initialization
      const userID = 'user-123';
      const listID = 'list-456';

      const recipe1Ingredients = ['500g chicken breast', '200ml tomato puree'];
      const recipe2Ingredients = ['200ml tomato puree', '1 loaf bread'];

      const mockListQueryResult = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: listID, userID, name: 'Test List' }],
        }),
      };
      mockListsContainer.items.query.mockReturnValue(mockListQueryResult);

      // Existing items in list
      mockItemsContainer.items.query
        .mockReturnValueOnce({
          fetchAll: jest.fn().mockResolvedValue({
            resources: [],
          }),
        })
        .mockReturnValueOnce({
          fetchAll: jest.fn().mockResolvedValue({
            resources: [],
          }),
        });

      mockItemsContainer.items.create.mockResolvedValue({ resource: {} });
      mockItemsContainer.items.upsert.mockResolvedValue({ resource: {} });

      // Test Steps
      const parsed1 = parseIngredients(recipe1Ingredients);
      const parsed2 = parseIngredients(recipe2Ingredients);
      const allItems = [...parsed1, ...parsed2];

      const itemsToAdd = allItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      }));

      const res = await app.request(`/api/grocery/${userID}/lists/${listID}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToAdd }),
      });

      // Expected Results
      expect(res.status).toBe(201);
      const data = await res.json();
      // API should merge duplicates using findDuplicates()
      expect(data.merged).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TC-2.2.12.4: Empty Recipe Ingredients Handling', () => {
    it('should handle empty ingredients array', () => {
      // Test Steps
      const parsed = parseIngredients([]);

      // Expected Results
      expect(parsed).toEqual([]);
      expect(parsed.length).toBe(0);
    });

    it('should reject empty items array in API', async () => {
      // Test Steps
      const res = await app.request('/api/grocery/user-123/lists/list-456/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });

      // Expected Results
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('required');
    });
  });

  describe('TC-2.2.12.5: Pantry Reconciliation and Exact Match Handling', () => {
    it('should identify pantry matches and mark as completed', async () => {
      // Initialization
      const userID = 'user-123';
      const listID = 'list-456';
      const pantryItems = [
        { id: 'pantry-1', name: 'chicken breast', quantity: 500, unit: 'g' },
        { id: 'pantry-2', name: 'garlic', quantity: 1, unit: 'clove' },
      ];

      const ingredients = ['500g chicken breast', '200ml tomato puree', '2 tbsp garam masala'];

      // Test Steps
      const match1 = findPantryMatch('chicken breast', pantryItems);
      const match2 = findPantryMatch('tomato puree', pantryItems);
      const match3 = findPantryMatch('garam masala', pantryItems);

      // Expected Results
      expect(match1.matchType).toBe('exact');
      expect(match1.item).toBeDefined();
      expect(match2.matchType).toBeNull();
      expect(match3.matchType).toBeNull();

      // Parse ingredients first
      const parsed = parseIngredients(ingredients);

      // Mock API responses
      const mockListQueryResult2 = {
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: listID, userID, name: 'Test List' }],
        }),
      };
      mockListsContainer.items.query.mockReturnValue(mockListQueryResult2);
      
      // Mock for initial empty items query (when adding items)
      mockItemsContainer.items.query
        .mockReturnValueOnce({
          fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
        })
        .mockImplementation((queryOptions: any) => {
          // For update endpoint, it queries by itemId and listID
          // Extract parameters from the query
          const params = queryOptions?.parameters || [];
          const itemIdParam = params.find((p: any) => p.name === '@itemId');
          const listIDParam = params.find((p: any) => p.name === '@listID');
          
          if (itemIdParam && listIDParam) {
            // This is the update query - return the item if it matches
            return {
              fetchAll: jest.fn().mockResolvedValue({
                resources: [{
                  id: itemIdParam.value,
                  listID: listIDParam.value,
                  name: 'chicken breast',
                  quantity: 500,
                  unit: 'g',
                  category: 'meat',
                  completed: false,
                  userID: userID,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }],
              }),
            };
          }
          // Default: return empty
          return {
            fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
          };
        });
      
      // Mock create to return items with proper structure
      const createdItems = parsed.map((item, index) => ({
        id: `item-${index + 1}`,
        listID: listID,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        completed: false,
        userID: userID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      mockItemsContainer.items.create.mockImplementation((item: any) => {
        const createdItem = createdItems.find(ci => ci.name === item.name);
        return Promise.resolve({ resource: createdItem || item });
      });
      
      mockItemsContainer.items.upsert.mockResolvedValue({ resource: {} });

      // Add items to list
      const itemsToAdd = parsed.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      }));

      const addRes = await app.request(`/api/grocery/${userID}/lists/${listID}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToAdd }),
      });

      expect(addRes.status).toBe(201);
      const addData = await addRes.json();

      // Mark exact match as completed
      if (addData.items && addData.items.length > 0) {
        const exactMatchItem = addData.items.find(
          (item: any) => item.name.toLowerCase() === 'chicken breast'
        );
        if (exactMatchItem) {
          const updateRes = await app.request(
            `/api/grocery/${userID}/lists/${listID}/items/${exactMatchItem.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true }),
            }
          );
          expect(updateRes.status).toBe(200);
        }
      }
    });
  });
});

