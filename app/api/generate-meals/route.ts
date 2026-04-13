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
const MEAL_TYPES_REQUIRED = ["breakfast", "lunch", "dinner", "snack"] as const;

// Shape of one day in the AI response / existing plan. Loose so we
// can pass it around during normalisation without tripping TS.
type RawMeal = {
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
};
type RawDay = { day: string; meals: RawMeal[] };

// Placeholder meal used only when the AI skipped a meal_type for a
// day AND we have no existing day to fall back to. Deliberately
// bland so the user can see it needs attention.
function placeholderMeal(meal_type: string): RawMeal {
  const label = meal_type.charAt(0).toUpperCase() + meal_type.slice(1);
  return {
    meal_type,
    name: `${label} — tap REBUILD to try again`,
    description: "The AI didn't return a meal for this slot. Tap REBUILD at the top of the page to regenerate.",
    ingredients: [],
    method: [],
    prep_time_minutes: 0,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    is_maybe_food: false,
  };
}

// Ensure a day has exactly the four required meal types. Pads any
// missing ones from the existing plan (if we have one) or with a
// placeholder. Drops unexpected meal types.
function normaliseDayMeals(day: RawDay, fallbackDay?: RawDay): RawDay {
  const mealsByType = new Map<string, RawMeal>();
  for (const meal of day.meals ?? []) {
    const type = String(meal?.meal_type ?? "").toLowerCase().trim();
    if ((MEAL_TYPES_REQUIRED as readonly string[]).includes(type)) {
      mealsByType.set(type, { ...meal, meal_type: type });
    }
  }

  const fallbackByType = new Map<string, RawMeal>();
  for (const meal of fallbackDay?.meals ?? []) {
    const type = String(meal?.meal_type ?? "").toLowerCase().trim();
    fallbackByType.set(type, { ...meal, meal_type: type });
  }

  const filled: RawMeal[] = MEAL_TYPES_REQUIRED.map(
    (type) => mealsByType.get(type) ?? fallbackByType.get(type) ?? placeholderMeal(type),
  );

  return { day: day.day, meals: filled };
}

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

    // Normalise the AI response. Gemini is inconsistent about day
    // counts and ordering, so instead of throwing when the shape
    // doesn't match we build the final day list ourselves:
    //
    //   1. Index whatever the AI returned by lowercased day name.
    //   2. For each day we ASKED for, prefer the AI's version,
    //      then fall back to the existing plan for partial rebuilds,
    //      then fall back to a placeholder so the UI never 500s.
    //   3. Ensure every day has exactly breakfast/lunch/dinner/snack,
    //      padding any missing meal types from the existing plan.
    //
    // This makes the endpoint resilient to the "Meal plan must have
    // exactly N days" error that used to surface whenever the AI
    // returned 6 or 8 days instead of 7.
    const aiDaysByName = new Map<string, RawDay>();
    for (const d of (mealPlan.days ?? [])) {
      const key = String(d?.day ?? "").toLowerCase().trim();
      if (DAY_ORDER.includes(key)) {
        aiDaysByName.set(key, { day: key, meals: d.meals ?? [] });
      }
    }

    const existingByName = new Map<string, RawDay>();
    if (isPartial && body.existingPlanData) {
      for (const d of body.existingPlanData) {
        const key = String(d?.day ?? "").toLowerCase().trim();
        existingByName.set(key, { day: key, meals: (d.meals ?? []) as RawMeal[] });
      }
    }

    const normalisedDays: RawDay[] = daysToGenerate.map((dayName) => {
      const aiDay = aiDaysByName.get(dayName);
      const existingDay = existingByName.get(dayName);

      if (aiDay && (aiDay.meals?.length ?? 0) > 0) {
        // AI gave us something for this day — normalise its meal count
        // and pad any missing slots from the existing plan.
        return normaliseDayMeals(aiDay, existingDay);
      }

      if (existingDay && (existingDay.meals?.length ?? 0) > 0) {
        // AI skipped this day but we're doing a partial rebuild and
        // already have a version of it — keep that one untouched.
        return normaliseDayMeals(existingDay);
      }

      // Neither AI nor existing — emit a placeholder day so the
      // plan structure stays intact. The user will see tap-to-retry
      // prompts and can hit REBUILD again.
      return normaliseDayMeals({ day: dayName, meals: [] });
    });

    // Last-ditch sanity check: we must have AT LEAST one real meal
    // in the final result, otherwise something went catastrophically
    // wrong and the user should see an actionable error.
    const hasAnyRealMeal = normalisedDays.some((d) =>
      d.meals.some((m) => m.name && !m.name.includes("tap REBUILD")),
    );
    if (!hasAnyRealMeal) {
      throw new Error("The AI didn't return any usable meals. Please try again.");
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

    const newDays = normalisedDays.map((day) => ({
      ...day,
      day: day.day.toLowerCase(), // normalise so merge lookups work
      meals: day.meals.map((meal) => ({
        ...meal,
        ingredients: (meal.ingredients ?? []).map((ing) => ({ ...ing, checked: false })),
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
