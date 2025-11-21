import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { getContainer, generateId, isCosmosAvailable } from '../lib/cosmos';
import { calculateMealNutrition } from '../utils/nutrition-parser';
import { getDateStringInTimezone, getTodayDateString } from '../utils/date-utils';
import type { MealTracking, DailyNutritionTotals } from '@plateful/shared';
import type { Recipe, FoodProfile } from '@plateful/shared';

const app = new Hono();

/**
 * Create or update tracked meal
 * POST /meal-tracking
 */
app.post('/', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Meal tracking service not available' }, 503);
  }

  try {
    const body = await c.req.json<{
      userID: string;
      recipeID: string;
      portions: number;
      date?: string; // Optional, defaults to today in user timezone
    }>();

    const { userID, recipeID, portions, date } = body;

    if (!userID || !recipeID || portions === undefined || portions <= 0) {
      return c.json({ error: 'userID, recipeID, and portions (> 0) are required' }, 400);
    }

    // Get user profile to get timezone
    const profileContainer = getContainer('userProfiles');
    if (!profileContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    let profile: FoodProfile | null = null;
    let userTimezone = 'America/New_York'; // Default
    try {
      const { resource } = await profileContainer.item(userID, userID).read<FoodProfile>();
      profile = resource || null;
      if (profile?.timezone) {
        userTimezone = profile.timezone;
      }
    } catch (error) {
      // Profile not found, use default timezone
      console.log(`ℹ️ Profile not found for user ${userID}, using default timezone`);
    }

    // Get recipe to extract nutrition
    const recipeContainer = getContainer('recipes');
    if (!recipeContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Find recipe by recipeID for this user
    const { resources: recipes } = await recipeContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID AND c.recipeID = @recipeID',
        parameters: [
          { name: '@userID', value: userID },
          { name: '@recipeID', value: recipeID },
        ],
      })
      .fetchAll();

    if (recipes.length === 0) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    const recipe = recipes[0] as Recipe;
    if (!recipe.recipeData.nutrition) {
      return c.json({ error: 'Recipe does not have nutrition data' }, 400);
    }

    // Calculate nutrition for the meal
    const nutrition = calculateMealNutrition(recipe.recipeData.nutrition, portions);

    // Determine date (use provided date or today in user's timezone)
    const mealDate = date || getTodayDateString(userTimezone);

    // Check if meal already exists for this recipe/date combination
    const mealContainer = getContainer('mealTracking');
    if (!mealContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: existingMeals } = await mealContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID AND c.recipeID = @recipeID AND c.date = @date',
        parameters: [
          { name: '@userID', value: userID },
          { name: '@recipeID', value: recipeID },
          { name: '@date', value: mealDate },
        ],
      })
      .fetchAll();

    const now = new Date().toISOString();
    let meal: MealTracking;

    if (existingMeals.length > 0) {
      // Update existing meal
      meal = {
        ...(existingMeals[0] as MealTracking),
        portions,
        nutrition,
        updatedAt: now,
      };
    } else {
      // Create new meal
      meal = {
        id: generateId('meal'),
        userID,
        recipeID,
        date: mealDate,
        portions,
        nutrition,
        createdAt: now,
        updatedAt: now,
      };
    }

    await mealContainer.items.upsert(meal);

    console.log(`✅ Meal tracked: ${meal.id} for user ${userID}, recipe ${recipeID}, date ${mealDate}`);
    return c.json({ meal }, existingMeals.length > 0 ? 200 : 201);
  } catch (error: any) {
    console.error('Error tracking meal:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      body: error.body,
    });
    return c.json({ 
      error: 'Failed to track meal',
      details: error.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Delete tracked meal (untrack)
 * DELETE /meal-tracking/:mealID
 */
app.delete('/:mealID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Meal tracking service not available' }, 503);
  }

  try {
    const mealID = c.req.param('mealID');
    const userID = c.req.query('userID');

    if (!userID) {
      return c.json({ error: 'userID query parameter is required' }, 400);
    }

    const mealContainer = getContainer('mealTracking');
    if (!mealContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify meal belongs to user
    try {
      const { resource: meal } = await mealContainer.item(mealID, userID).read<MealTracking>();
      if (!meal) {
        return c.json({ error: 'Meal not found' }, 404);
      }
      if (meal.userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      await mealContainer.item(mealID, userID).delete();
      console.log(`✅ Meal deleted: ${mealID} for user ${userID}`);
      return c.json({ success: true });
    } catch (error: any) {
      if (error?.code === 404) {
        return c.json({ error: 'Meal not found' }, 404);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
    return c.json({ error: 'Failed to delete meal' }, 500);
  }
});

/**
 * Get tracked meals for a user and date
 * GET /meal-tracking/user/:userID?date=YYYY-MM-DD
 */
app.get('/user/:userID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Meal tracking service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const dateParam = c.req.query('date');

    // Get user profile to get timezone
    const profileContainer = getContainer('userProfiles');
    let userTimezone = 'America/New_York';
    if (profileContainer) {
      try {
        const { resource: profile } = await profileContainer.item(userID, userID).read<FoodProfile>();
        if (profile?.timezone) {
          userTimezone = profile.timezone;
        }
      } catch (error) {
        // Use default
      }
    }

    const date = dateParam || getTodayDateString(userTimezone);

    const mealContainer = getContainer('mealTracking');
    if (!mealContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: meals } = await mealContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID AND c.date = @date',
        parameters: [
          { name: '@userID', value: userID },
          { name: '@date', value: date },
        ],
      })
      .fetchAll();
    
    // Sort by createdAt in application code (avoiding composite index requirement)
    (meals as MealTracking[]).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Aggregate totals
    const totals: DailyNutritionTotals = meals.reduce(
      (acc, meal) => {
        const m = meal as MealTracking;
        return {
          calories: acc.calories + m.nutrition.calories,
          protein: acc.protein + m.nutrition.protein,
          carbs: acc.carbs + m.nutrition.carbs,
          fat: acc.fat + m.nutrition.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return c.json({
      meals: meals as MealTracking[],
      totals,
      date,
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return c.json({ error: 'Failed to fetch meals' }, 500);
  }
});

/**
 * Get tracked meals for a user within a date range
 * GET /meal-tracking/user/:userID/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
app.get('/user/:userID/range', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Meal tracking service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    if (!startDate || !endDate) {
      return c.json({ error: 'startDate and endDate query parameters are required' }, 400);
    }

    const mealContainer = getContainer('mealTracking');
    if (!mealContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Query all meals in date range (using >= and <= for string comparison works for YYYY-MM-DD format)
    // Note: Removed ORDER BY to avoid composite index requirement - we'll sort in application code
    console.log(`[meal-tracking] Querying meals for user ${userID}, date range: ${startDate} to ${endDate}`);
    const { resources: meals } = await mealContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID AND c.date >= @startDate AND c.date <= @endDate',
        parameters: [
          { name: '@userID', value: userID },
          { name: '@startDate', value: startDate },
          { name: '@endDate', value: endDate },
        ],
      })
      .fetchAll();
    
    console.log(`[meal-tracking] Found ${meals.length} meals in date range`);
    
    // Sort meals by date and createdAt in application code
    (meals as MealTracking[]).sort((a, b) => {
      // First sort by date (YYYY-MM-DD format)
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Then by createdAt if dates are the same
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Group by date and aggregate
    const dailyData: Record<string, { meals: MealTracking[]; totals: DailyNutritionTotals }> = {};

    (meals as MealTracking[]).forEach((meal) => {
      if (!dailyData[meal.date]) {
        dailyData[meal.date] = {
          meals: [],
          totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        };
      }
      dailyData[meal.date].meals.push(meal);
      dailyData[meal.date].totals.calories += meal.nutrition.calories;
      dailyData[meal.date].totals.protein += meal.nutrition.protein;
      dailyData[meal.date].totals.carbs += meal.nutrition.carbs;
      dailyData[meal.date].totals.fat += meal.nutrition.fat;
    });

    // Log aggregation for debugging
    console.log(`[meal-tracking] Aggregated ${meals.length} meals into ${Object.keys(dailyData).length} days`);
    Object.entries(dailyData).forEach(([date, data]) => {
      console.log(`[meal-tracking] ${date}: ${data.meals.length} meals, totals:`, data.totals);
    });

    return c.json({
      dailyData,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error fetching meal range:', error);
    return c.json({ error: 'Failed to fetch meal range' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

