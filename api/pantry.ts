import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { getContainer, isCosmosAvailable, generateId } from '../lib/cosmos';
import type { PantryItem } from '../../packages/shared/src/types/pantry';

const app = new Hono();

/**
 * Health check for pantry route
 * GET /pantry
 */
app.get('/', async (c) => {
  return c.json({ status: 'ok', service: 'pantry' });
});

/**
 * Get all pantry items for a user
 * GET /pantry/:userID
 */
app.get('/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Pantry service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const container = getContainer('pantries');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Query all pantry items for this user
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    // Sort by category, then name
    const sortedItems = (resources || []).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return c.json({ items: sortedItems });
  } catch (error: any) {
    console.error('Error fetching pantry items:', error);
    
    // If container doesn't exist, return empty array instead of error
    if (error?.code === 404 || error?.statusCode === 404 || error?.message?.includes('NotFound')) {
      console.log('Pantry container does not exist yet - returning empty array');
      return c.json({ items: [] });
    }
    
    return c.json({ 
      error: 'Failed to fetch pantry items',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Add one or more pantry items
 * POST /pantry/:userID
 * Body: { items: Array<{ name: string, category: string, quantity?: number, unit?: string }> }
 */
app.post('/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Pantry service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const body = await c.req.json<{ items: Array<Omit<PantryItem, 'id' | 'userID' | 'createdAt' | 'updatedAt'>> }>();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required and cannot be empty' }, 400);
    }

    const container = getContainer('pantries');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const now = new Date().toISOString();
    const pantryItems: PantryItem[] = items.map(item => ({
      id: generateId('pantry'),
      userID,
      name: item.name.trim(),
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      createdAt: now,
      updatedAt: now,
    }));

    // Check for duplicates (same name and user) before adding
    const { resources: existingItems } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    const existingNames = new Set(existingItems.map(item => item.name.toLowerCase()));
    const newItems: PantryItem[] = [];
    const duplicates: string[] = [];

    pantryItems.forEach(item => {
      if (existingNames.has(item.name.toLowerCase())) {
        duplicates.push(item.name);
      } else {
        newItems.push(item);
      }
    });

    // Insert new items
    if (newItems.length > 0) {
      await Promise.all(newItems.map(item => container.items.create(item)));
    }

    return c.json({
      items: newItems,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      message: duplicates.length > 0 
        ? `Added ${newItems.length} item(s). ${duplicates.length} duplicate(s) skipped.`
        : `Added ${newItems.length} item(s) successfully.`
    }, 201);
  } catch (error: any) {
    console.error('Error adding pantry items:', error);
    
    // Provide more detailed error message
    const errorMessage = error?.message || 'Unknown error';
    if (errorMessage.includes('NotFound') || error?.code === 404) {
      return c.json({ 
        error: 'Pantry container does not exist. Please create the "pantries" container in Cosmos DB with partition key /userID.',
        details: errorMessage
      }, 503);
    }
    
    return c.json({ 
      error: 'Failed to add pantry items',
      details: errorMessage
    }, 500);
  }
});

/**
 * Update a pantry item
 * PUT /pantry/:userID/:itemId
 */
app.put('/:userID/:itemId', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Pantry service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const itemId = c.req.param('itemId');
    const body = await c.req.json<Partial<Omit<PantryItem, 'id' | 'userID' | 'createdAt'>>>();
    
    const container = getContainer('pantries');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get existing item to verify ownership
    let existingItem: PantryItem;
    try {
      const { resource } = await container.item(itemId, userID).read<PantryItem>();
      if (!resource) {
        return c.json({ error: 'Pantry item not found' }, 404);
      }
      existingItem = resource;
    } catch (error: any) {
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Pantry item not found' }, 404);
      }
      throw error;
    }

    // Verify ownership
    if (existingItem.userID !== userID) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update item
    const updatedItem: PantryItem = {
      ...existingItem,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await container.items.upsert(updatedItem);

    return c.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    return c.json({ error: 'Failed to update pantry item' }, 500);
  }
});

/**
 * Delete a pantry item
 * DELETE /pantry/:userID/:itemId
 */
app.delete('/:userID/:itemId', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Pantry service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const itemId = c.req.param('itemId');
    
    const container = getContainer('pantries');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify ownership before deleting
    try {
      const { resource } = await container.item(itemId, userID).read<PantryItem>();
      if (!resource) {
        return c.json({ error: 'Pantry item not found' }, 404);
      }
      if (resource.userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Pantry item not found' }, 404);
      }
      throw error;
    }

    await container.item(itemId, userID).delete();

    return c.json({ message: 'Pantry item deleted successfully' });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    return c.json({ error: 'Failed to delete pantry item' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

