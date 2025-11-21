import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import Anthropic from '@anthropic-ai/sdk';

const app = new Hono();

// Initialize Anthropic client
const client = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});

app.post('/', async (c) => {
  try {
    const { dish } = await c.req.json();
    
    if (!dish) {
      return c.json({ error: 'Dish name is required' }, 400);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return c.json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    console.log(`Searching for ${dish} recipe...`);
    
    // Use the server-side web_search tool (same logic as your simple-recipe.ts)
    const response = await (client.messages.create as any)({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ],
      messages: [{
        role: "user",
        content: `Search for a ${dish} recipe on food52.com, find a real recipe, and provide it in markdown format with the source URL from food52.com.`
      }]
    });

    // Collect all text blocks and join them
    let recipeText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        recipeText += block.text;
      }
    }

    return c.json({ 
      recipe: recipeText,
      dish: dish 
    });

  } catch (error) {
    console.error('Recipe API error:', error);
    return c.json({ 
      error: 'Failed to fetch recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
