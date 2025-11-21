import Anthropic from '@anthropic-ai/sdk';
import type { RecipeSearchResult } from '@plateful/shared';

/**
 * Search for written cooking tutorial articles using Anthropic's web search
 * Similar to recipe search but focused on tutorial/guide content
 */
export async function searchWrittenTutorials(searchQuery: string): Promise<RecipeSearchResult[]> {
  const client = new Anthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY 
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  console.log(`Searching for written tutorial: ${searchQuery}`);

  const response = await (client.messages.create as any)({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        // Block problematic domains
        blocked_domains: [
          "thekitchn.com",
          "foodnetwork.com", 
          "tasty.co",
          "buzzfeed.com",
          "showmetheyummy.com",
          "tastesbetterfromscratch.com",
          "allrecipes.com",
          "food.com",
          "epicurious.com",
          "bonappetit.com",
          "thehealthyhunterblog.com",
          "youtube.com", // Block video sites
        ],
      }
    ],
    messages: [{
      role: "user",
      content: `Search for cooking tutorial articles about: ${searchQuery}

Find tutorial/guide articles that explain cooking techniques, methods, or skills. 
Look for articles with step-by-step instructions or detailed explanations.

IMPORTANT: Return a URL to a specific tutorial/guide article page (not a homepage or category page).

Return a JSON array with 3-5 different tutorial articles, each from a DIFFERENT website/domain.
Each tutorial should be a JSON object with this structure:
{
  "title": "Tutorial title",
  "url": "Full URL to the specific tutorial page",
  "snippet": "Brief description of what the tutorial covers"
}

Return ONLY the JSON array, no other text. Example:
[
  {"title": "How to Braise Meat", "url": "https://site1.com/tutorial/braise", "snippet": "Complete guide to braising"},
  {"title": "Knife Skills: How to Julienne", "url": "https://site2.com/julienne", "snippet": "Step-by-step julienne technique"},
  {"title": "Perfect Braising Method", "url": "https://site3.com/braising-guide", "snippet": "Master the art of braising"}
]`
    }]
  });

  // Extract the response text
  let resultText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      resultText += block.text;
    }
  }

  try {
    // Remove markdown code blocks if present
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    
    // Try to parse as JSON first
    const parsed = JSON.parse(cleanedText);
    
    // Handle both array and single object responses
    const results: RecipeSearchResult[] = Array.isArray(parsed) ? parsed : [parsed];
    
    // Validate each result
    const validResults = results.filter(r => r && r.url && r.title);
    
    if (validResults.length === 0) {
      throw new Error('No valid tutorial results found');
    }

    console.log(`✅ Found ${validResults.length} tutorial articles`);
    return validResults;
  } catch (parseError) {
    // Fallback: Try to extract URLs from text
    console.warn('Failed to parse search result as JSON, attempting URL extraction');
    
    const urlMatches = resultText.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g);
    if (urlMatches && urlMatches.length > 0) {
      return urlMatches.map(url => ({
        title: searchQuery,
        url: url,
        snippet: 'Tutorial found via web search'
      }));
    }

    throw new Error('No tutorial URL found in search results');
  }
}

