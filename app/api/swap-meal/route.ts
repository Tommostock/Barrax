/* ============================================
   Swap Meal API Route
   POST /api/swap-meal
   Calls Gemini server-side to generate a replacement
   meal matching the same meal type and calorie target.
   ============================================ */

import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealType, currentMealName, targetCalories, noGoFoods, approvedFoods } = body;

    // Meal-type-specific guidance — critical so snacks stay snack-sized
    // and breakfasts stay breakfast-style. Without this, Gemini happily
    // returns "Beef Wellington" labelled as a snack.
    const mealTypeGuidance: Record<string, string> = {
      breakfast: "MUST be a classic breakfast dish — porridge, eggs on toast, Greek yoghurt with fruit, overnight oats, a breakfast bowl, scrambled eggs, etc. NOT a lunch or dinner dish.",
      lunch: "MUST be a typical lunch — sandwich, wrap, salad, soup, grain bowl, leftovers-style plate. Usually lighter than dinner. NOT a breakfast dish.",
      dinner: "MUST be a proper evening meal — a plated main with protein, carbs, and vegetables. Examples: stir-fry, curry, roast, pasta bake, chicken and rice, stew. NOT a breakfast or snack.",
      snack: "MUST be a small, simple, single-item snack. Examples: a piece of fruit, a handful of nuts, Greek yoghurt with honey, rice cakes with peanut butter, a protein bar, hummus with carrot sticks, cottage cheese, a boiled egg. NOT a full plated meal. NO cooking required for most. Typically 100-300 kcal. Should be portable and eaten cold or at room temperature where possible.",
    };
    const guidance = mealTypeGuidance[mealType as string] ?? "";

    const newMeal = await callGemini<{
      meal_type: string;
      name: string;
      description?: string;
      ingredients: { name: string; quantity: string }[];
      method: string[];
      prep_time_minutes: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      is_maybe_food: boolean;
    }>({
      systemPrompt: `You are a nutritionist. Generate a single ${mealType} replacement. Respond ONLY in valid JSON matching this structure:
{
  "meal_type": "${mealType}",
  "name": string,
  "description": string (1-2 sentences about the dish),
  "ingredients": [{"name": string, "quantity": string}],
  "method": [string] (step-by-step instructions; snacks may have as few as 1-2 steps),
  "prep_time_minutes": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "is_maybe_food": false
}

MEAL TYPE RULES — CRITICAL:
${guidance}

General rules:
- UK supermarket ingredients only, budget-friendly, max 30 min prep
- Include ALL ingredients: oils, seasonings, spices, stock cubes (where relevant)
- Method steps must be clear and actionable
- Stay within ±20% of the target calorie count
- NEVER use these foods: ${(noGoFoods || []).join(", ") || "none"}
- Prefer these foods: ${(approvedFoods || []).join(", ") || "no preference"}`,
      userPrompt: `Replace this ${mealType}: "${currentMealName}". Generate a DIFFERENT ${mealType} (not the same dish or a minor variation) for approximately ${targetCalories} calories. Remember: it MUST genuinely be a ${mealType}, not any other meal type.`,
    });

    return NextResponse.json({ meal: newMeal });

  } catch (error) {
    console.error("Swap meal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to swap meal" },
      { status: 500 }
    );
  }
}
