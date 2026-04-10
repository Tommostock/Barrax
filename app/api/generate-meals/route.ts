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
          "description": string,
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
- Generate the days requested in the user prompt (usually a full 7-day week, but sometimes only a partial week from a given day onwards)
- Each day has exactly 4 meals: breakfast, lunch, dinner, snack
- Keep meals SIMPLE — familiar comfort foods made healthier, not fancy restaurant dishes
- Meals should be family-friendly and can feed multiple people
- Use the APPROVED foods list as preferred ingredients
- NEVER include ANY ingredient from the NO GO list — these are hard exclusions
- Include at most 1 meal per week from the MAYBE list, clearly marked with is_maybe_food: true
- All other meals should have is_maybe_food: false
- Consolidate the shopping list — combine quantities for the same ingredient across meals
- Organise the shopping list by supermarket section
- Calorie estimates should be reasonable and per serving

RECIPE QUALITY — this is critical:
- "description" should be 1-2 sentences describing the dish and what makes it good (e.g. "A hearty one-pot chicken and rice dish with peppers and a smoky paprika kick. Great for batch cooking.")
- "ingredients" must include EVERYTHING needed: oil, butter, salt, pepper, herbs, spices, sauces, stock cubes — not just the main ingredients. Be specific with quantities (e.g. "1 tbsp olive oil", "1 tsp smoked paprika", "pinch of salt and pepper")
- "method" must be proper step-by-step cooking instructions, typically 4-8 steps. Each step should be a clear, actionable sentence. Include cooking temperatures, times, and useful tips (e.g. "Heat 1 tbsp olive oil in a large frying pan over medium-high heat", "Cook for 3-4 minutes until golden brown", "Season to taste with salt and pepper")
- Do NOT write vague steps like "cook the chicken" — say HOW to cook it, for how long, and at what heat`;

interface GenerateMealsRequest {
  noGoFoods: string[];
  approvedFoods: string[];
  maybeFoods: string[];
  calorieTarget: number;
  householdSize?: number;
  favourites?: string[];
  dietaryRequirements?: string[];
  // Partial rebuild — regenerate only from `fromDay` through Sunday and
  // merge into the existing plan row. All three must be provided together.
  fromDay?: string;
  existingPlanId?: string;
  existingPlanData?: Array<{
    day: string;
    meals: Array<{
      meal_type: string;
      name: string;
      description?: string;
      ingredients: { name: string; quantity: string; checked?: boolean }[];
      method: string[];
      prep_time_minutes: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      is_maybe_food: boolean;
    }>;
  }>;
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateMealsRequest = await request.json();

    // Decide which days to generate. Full rebuild = all 7 days. Partial
    // rebuild = from `fromDay` through Sunday (merged into the existing plan).
    const isPartial = !!(body.fromDay && body.existingPlanId && body.existingPlanData);
    let daysToGenerate = DAY_ORDER;
    if (isPartial) {
      const fromIdx = DAY_ORDER.indexOf((body.fromDay as string).toLowerCase());
      if (fromIdx === -1) {
        return NextResponse.json({ error: "Invalid fromDay" }, { status: 400 });
      }
      daysToGenerate = DAY_ORDER.slice(fromIdx);
    }

    const dayListForPrompt = daysToGenerate.join(", ");
    const header = isPartial
      ? `Generate meals for ONLY these specific days: ${dayListForPrompt}. Return exactly ${daysToGenerate.length} day entries — one for each listed day, in that order. Each day must have exactly 4 meals: breakfast, lunch, dinner, snack. The "day" field in each entry must match one of the listed day names (lowercase).`
      : `Generate a 7-day meal plan with these requirements:`;

    const userPrompt = `${header}

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
          description: string;
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

    // Validate response — must match the number of days we asked for
    if (!mealPlan.days || mealPlan.days.length !== daysToGenerate.length) {
      throw new Error(
        `Meal plan must have exactly ${daysToGenerate.length} day${daysToGenerate.length === 1 ? "" : "s"}`
      );
    }

    // Calculate week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Add checked: false to shopping items and ingredients
    const newShoppingList = (mealPlan.shopping_list || []).map((item) => ({
      ...item,
      checked: false,
    }));

    const newDays = mealPlan.days.map((day) => ({
      ...day,
      day: day.day.toLowerCase(), // normalise so merge lookups work
      meals: day.meals.map((meal) => ({
        ...meal,
        ingredients: meal.ingredients.map((ing) => ({ ...ing, checked: false })),
      })),
    }));

    let saved;
    if (isPartial && body.existingPlanData && body.existingPlanId) {
      // Merge: keep days BEFORE fromDay from the existing plan, replace
      // fromDay→Sunday with the freshly generated days.
      const regeneratedDays = new Set(daysToGenerate);
      const keptDays = body.existingPlanData.filter(
        (d) => !regeneratedDays.has(d.day.toLowerCase())
      );
      const mergedDays = [...keptDays, ...newDays].sort(
        (a, b) => DAY_ORDER.indexOf(a.day.toLowerCase()) - DAY_ORDER.indexOf(b.day.toLowerCase())
      );

      const { data: updated, error: updateError } = await supabase
        .from("meal_plans")
        .update({
          plan_data: mergedDays,
          shopping_list: newShoppingList, // replace with the new shopping items
        })
        .eq("id", body.existingPlanId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      saved = updated;
    } else {
      // Full rebuild — insert a new plan row for this week
      const { data: inserted, error: saveError } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          week_start: weekStartStr,
          plan_data: newDays,
          shopping_list: newShoppingList,
        })
        .select()
        .single();

      if (saveError) throw saveError;
      saved = inserted;
    }

    return NextResponse.json({
      mealPlan: saved,
      message: isPartial
        ? `Rebuilt meals from ${body.fromDay} onwards.`
        : "Meal plan generated successfully.",
    });

  } catch (error) {
    console.error("Generate meals error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
