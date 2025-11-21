import Anthropic from '@anthropic-ai/sdk';
import type { RecipeData, IngredientSubstitution } from '../types/recipe';
import type { FoodProfile } from '../types/user';

/**
 * Detect if any ingredients in the recipe match user's allergens or restrictions
 */
export function detectDisallowedIngredients(
  recipeData: RecipeData,
  profile: FoodProfile
): { ingredient: string; reason: string }[] {
  const disallowed: { ingredient: string; reason: string }[] = [];
  const allergens = (profile.allergens || []).map(a => a.toLowerCase());
  const restrictions = (profile.restrictions || []).map(r => r.toLowerCase());

  // Check each ingredient against allergens and restrictions
  for (const ingredient of recipeData.ingredients) {
    const ingredientLower = ingredient.toLowerCase();
    
    // Check against allergens
    for (const allergen of allergens) {
      if (ingredientLower.includes(allergen.toLowerCase())) {
        disallowed.push({
          ingredient,
          reason: `allergy: ${allergen}`
        });
        break; // Only add once per ingredient
      }
    }

    // Check against restrictions (if not already flagged as allergen)
    if (!disallowed.some(d => d.ingredient === ingredient)) {
      for (const restriction of restrictions) {
        if (ingredientLower.includes(restriction.toLowerCase())) {
          disallowed.push({
            ingredient,
            reason: `restriction: ${restriction}`
          });
          break;
        }
      }
    }
  }

  return disallowed;
}

/**
 * Substitute disallowed ingredients using AI
 * Returns modified recipe data with substitution metadata
 */
export async function substituteIngredients(
  recipeData: RecipeData,
  profile: FoodProfile
): Promise<{ recipeData: RecipeData; substitutions: IngredientSubstitution[] }> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const disallowed = detectDisallowedIngredients(recipeData, profile);
  
  if (disallowed.length === 0) {
    // No substitutions needed
    return { recipeData, substitutions: [] };
  }

  console.log(`🔄 Detected ${disallowed.length} disallowed ingredient(s), requesting substitutions...`);

  // Build context about allergens/restrictions
  const allergensList = (profile.allergens || []).join(', ');
  const restrictionsList = (profile.restrictions || []).join(', ');
  
  const prompt = `You are a culinary expert helping to make a recipe safe for someone with dietary restrictions.

RECIPE:
Title: ${recipeData.title}
Description: ${recipeData.description}

Ingredients:
${recipeData.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Instructions:
${recipeData.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

USER'S DIETARY RESTRICTIONS:
${allergensList ? `Allergens (MUST AVOID): ${allergensList}` : ''}
${restrictionsList ? `Restrictions (MUST AVOID): ${restrictionsList}` : ''}

DETECTED DISALLOWED INGREDIENTS:
${disallowed.map((d, i) => `${i + 1}. "${d.ingredient}" - ${d.reason}`).join('\n')}

TASK:
For each disallowed ingredient, suggest a safe substitute that:
1. Maintains similar texture, flavor, or function in the recipe
2. Is appropriate for the dish type and cuisine
3. Does NOT contain any of the user's allergens or restrictions
4. Preserves the recipe's integrity and taste profile

IMPORTANT RULES:
- For allergies (especially severe ones like peanuts, shellfish), choose substitutes that are completely safe
- Maintain quantities and measurements where possible
- Consider the ingredient's role (binding, flavoring, texture, etc.)
- If an ingredient is essential and no safe substitute exists, note this

Return a JSON object with this EXACT structure:
{
  "substitutions": [
    {
      "original": "peanuts",
      "substituted": "almonds",
      "reason": "allergy: peanuts",
      "originalIngredient": "1 cup crushed peanuts",
      "substitutedIngredient": "1 cup crushed almonds"
    }
  ],
  "modifiedIngredients": ["modified ingredient 1", "modified ingredient 2", ...],
  "modifiedInstructions": ["modified step 1", "modified step 2", ...]
}

The "modifiedIngredients" array should be the FULL ingredients list with substitutions applied.
The "modifiedInstructions" array should be the FULL instructions list with any ingredient name references updated.

Return ONLY the JSON object, no other text.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    // Extract JSON from response
    let resultText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        resultText += block.text;
      }
    }

    // Parse response
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    const substitutionResult = JSON.parse(cleanedText);

    // Validate response structure
    if (!substitutionResult.substitutions || !Array.isArray(substitutionResult.substitutions)) {
      throw new Error('Invalid substitution response: missing substitutions array');
    }
    if (!substitutionResult.modifiedIngredients || !Array.isArray(substitutionResult.modifiedIngredients)) {
      throw new Error('Invalid substitution response: missing modifiedIngredients array');
    }
    if (!substitutionResult.modifiedInstructions || !Array.isArray(substitutionResult.modifiedInstructions)) {
      throw new Error('Invalid substitution response: missing modifiedInstructions array');
    }

    // Validate that all disallowed ingredients were addressed
    const substitutedOriginals = substitutionResult.substitutions.map((s: any) => s.original.toLowerCase());
    for (const disallowedItem of disallowed) {
      const originalName = disallowedItem.ingredient.toLowerCase();
      const wasSubstituted = substitutedOriginals.some((sub: string) => 
        originalName.includes(sub) || sub.includes(originalName.split(' ')[0])
      );
      if (!wasSubstituted) {
        console.warn(`⚠️ Warning: Disallowed ingredient "${disallowedItem.ingredient}" may not have been properly substituted`);
      }
    }

    // Create substitution metadata
    const substitutions: IngredientSubstitution[] = substitutionResult.substitutions.map((sub: any) => ({
      original: sub.original,
      substituted: sub.substituted,
      reason: sub.reason,
      originalIngredient: sub.originalIngredient,
      substitutedIngredient: sub.substitutedIngredient
    }));

    // Create modified recipe data
    const modifiedRecipeData: RecipeData = {
      ...recipeData,
      ingredients: substitutionResult.modifiedIngredients,
      instructions: substitutionResult.modifiedInstructions,
      substitutions
    };

    console.log(`✅ Successfully substituted ${substitutions.length} ingredient(s)`);
    
    return {
      recipeData: modifiedRecipeData,
      substitutions
    };

  } catch (error) {
    console.error('❌ Failed to substitute ingredients:', error);
    throw new Error(`Failed to substitute ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


