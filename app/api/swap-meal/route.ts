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
      systemPrompt: `You are a nutritionist. Generate a single ${mealType} meal replacement. Respond ONLY in valid JSON matching this structure:
{
  "meal_type": "${mealType}",
  "name": string,
  "description": string (1-2 sentences about the dish),
  "ingredients": [{"name": string, "quantity": string}],
  "method": [string] (4-8 step-by-step cooking instructions with temps and times),
  "prep_time_minutes": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "is_maybe_food": false
}

Rules:
- UK supermarket ingredients only, budget-friendly, max 30 min prep
- Include ALL ingredients: oils, seasonings, spices, stock cubes
- Method steps must be clear and actionable with cooking times
- NEVER use these foods: ${(noGoFoods || []).join(", ") || "none"}
- Prefer these foods: ${(approvedFoods || []).join(", ") || "no preference"}`,
      userPrompt: `Replace this ${mealType}: "${currentMealName}". Generate a DIFFERENT meal for approximately ${targetCalories} calories. Must NOT be the same dish or a minor variation of it.`,
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
