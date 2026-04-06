/* ============================================
   Generate Meal Plan API Route
   POST /api/generate-meals
   Calls Gemini to generate a weekly meal plan
   respecting the user's food preferences.
   ============================================ */

import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a nutritionist creating simple, healthy meal plans for a fussy eater in the UK. Meals must be budget-friendly, quick to prepare (30 minutes max unless slow cooker), and use ingredients available in standard UK supermarkets (Tesco, Asda, Aldi, Lidl).

Respond ONLY in valid JSON with no additional text.

The JSON must match this exact structure:
{
  "days": [
    {
      "day": "monday",
      "meals": [
        {
          "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
          "name": string,
          "ingredients": [
            { "name": string, "quantity": string }
          ],
          "method": [string],
          "prep_time_minutes": number,
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fat_g": number,
          "is_maybe_food": boolean
        }
      ]
    }
  ],
  "shopping_list": [
    {
      "name": string,
      "quantity": string,
      "section": "produce" | "meat" | "dairy" | "pantry" | "frozen"
    }
  ]
}

Rules:
- Generate exactly 7 days (Monday to Sunday)
- Each day has exactly 4 meals: breakfast, lunch, dinner, snack
- Keep meals SIMPLE. Familiar comfort foods made healthier. Not fancy restaurant dishes.
- Meals should be family-friendly and can feed multiple people
- Use the APPROVED foods list as preferred ingredients
- NEVER include ANY ingredient from the NO GO list — these are hard exclusions
- Include at most 1 meal per week from the MAYBE list, clearly marked with is_maybe_food: true
- All other meals should have is_maybe_food: false
- Consolidate the shopping list — combine quantities for the same ingredient across meals
- Organise the shopping list by supermarket section
- Calorie estimates should be reasonable and per serving`;

interface GenerateMealsRequest {
  noGoFoods: string[];
  approvedFoods: string[];
  maybeFoods: string[];
  calorieTarget: number;
  householdSize?: number;
  favourites?: string[];
  dietaryRequirements?: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateMealsRequest = await request.json();

    const userPrompt = `Generate a 7-day meal plan with these requirements:

NO GO FOODS (NEVER include these — hard exclusion):
${body.noGoFoods.length > 0 ? body.noGoFoods.join(", ") : "None specified"}

APPROVED FOODS (preferred ingredients — use these):
${body.approvedFoods.length > 0 ? body.approvedFoods.join(", ") : "No specific preferences"}

MAYBE FOODS (can include max 1 meal this week, mark with is_maybe_food: true):
${body.maybeFoods.length > 0 ? body.maybeFoods.join(", ") : "None"}

Daily calorie target: ${body.calorieTarget} kcal
Household size: ${body.householdSize ?? 1} people
${body.favourites && body.favourites.length > 0 ? `Include some of these favourite meals if possible: ${body.favourites.join(", ")}` : ""}
${body.dietaryRequirements && body.dietaryRequirements.length > 0 ? `Dietary requirements: ${body.dietaryRequirements.join(", ")}` : ""}

Remember: keep it simple. British comfort food. Nothing fancy.`;

    const mealPlan = await callGemini<{
      days: {
        day: string;
        meals: {
          meal_type: string;
          name: string;
          ingredients: { name: string; quantity: string }[];
          method: string[];
          prep_time_minutes: number;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          is_maybe_food: boolean;
        }[];
      }[];
      shopping_list: {
        name: string;
        quantity: string;
        section: string;
      }[];
    }>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // Validate response
    if (!mealPlan.days || mealPlan.days.length !== 7) {
      throw new Error("Meal plan must have exactly 7 days");
    }

    // Calculate week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Add checked: false to shopping items and ingredients
    const shoppingList = (mealPlan.shopping_list || []).map((item) => ({
      ...item,
      checked: false,
    }));

    const planData = mealPlan.days.map((day) => ({
      ...day,
      meals: day.meals.map((meal) => ({
        ...meal,
        ingredients: meal.ingredients.map((ing) => ({ ...ing, checked: false })),
      })),
    }));

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        week_start: weekStartStr,
        plan_data: planData,
        shopping_list: shoppingList,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      mealPlan: saved,
      message: "Meal plan generated successfully.",
    });

  } catch (error) {
    console.error("Generate meals error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
