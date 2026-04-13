/* ============================================
   Daily Supplement Stack
   Single-tap logger for the user's daily creatine
   + whey isolate stack. Drops two rows into
   food_diary under the new "supplement" meal
   category and awards a small XP reward. Refreshes
   every day so the HQ button resets overnight.
   ============================================ */

"use client";

import { createClient } from "@/lib/supabase/client";

// A fixed daily target that the HQ button fires.
// Creatine monohydrate is calorically negligible, so the macros
// here are zero — the row is logged purely as a record of intake.
export const CREATINE_SERVING = {
  food_name: "Creatine Monohydrate",
  brand: null as string | null,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  serving_size: "5 g",
};

// Fallback macros for My Protein Impact Whey Isolate at a 25 g
// serving. Used only if we can't find a matching entry in the
// user's saved_foods table at log time — the real row takes
// priority so the user's own brand/label wins.
const WHEY_FALLBACK = {
  food_name: "Impact Whey Isolate",
  brand: "My Protein",
  calories: 102,
  protein_g: 23,
  carbs_g: 1,
  fat_g: 0.5,
  serving_size: "25 g",
};

// Source string written into food_diary so we can tell these
// rows apart from normal food entries later (e.g. to check if
// today's stack has already been logged on the HQ button).
export const SUPPS_SOURCE = "supps_button";

// XP awarded for a full daily supps log — deliberately small so
// it doesn't outweigh workouts and runs. Single tap daily.
export const SUPPS_XP = 5;

// Compute the start/end of today in ISO format so we can query
// "rows logged today" in the user's local timezone.
function todayBounds(): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Has the user already tapped the HQ supps button today?
 * We check for a food_diary row with our dedicated source tag
 * logged within today's local boundaries. Returns false on
 * auth failure or DB error so the button still works.
 */
export async function hasLoggedSuppsToday(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { start, end } = todayBounds();

  const { data, error } = await supabase
    .from("food_diary")
    .select("id")
    .eq("user_id", user.id)
    .eq("source", SUPPS_SOURCE)
    .gte("logged_at", start)
    .lte("logged_at", end)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/**
 * Look up the user's Impact Whey Isolate in saved_foods.
 * Matches by fuzzy food_name containing "whey isolate" or just
 * "whey" as a fallback. Returns null if nothing matches.
 */
async function findWheyInSavedFoods(userId: string) {
  const supabase = createClient();

  // First try for a tighter match so we skip "Whey Gainer" etc.
  const isolate = await supabase
    .from("saved_foods")
    .select("food_name, brand, calories, protein_g, carbs_g, fat_g, serving_size")
    .eq("user_id", userId)
    .ilike("food_name", "%whey isolate%")
    .limit(1)
    .maybeSingle();

  if (isolate.data) return isolate.data;

  // Fallback — any whey entry in the library
  const anyWhey = await supabase
    .from("saved_foods")
    .select("food_name, brand, calories, protein_g, carbs_g, fat_g, serving_size")
    .eq("user_id", userId)
    .ilike("food_name", "%whey%")
    .limit(1)
    .maybeSingle();

  return anyWhey.data ?? null;
}

/**
 * Log today's supplement stack (creatine + whey) into the
 * food diary under the "supplement" meal category. Returns
 * `true` on success, `false` otherwise (e.g. offline). The
 * caller awards XP separately once this resolves.
 */
export async function logSuppsStack(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Prefer the user's own saved Impact Whey entry (their real
  // macros, their brand); fall back to a sensible default if
  // they haven't saved one yet.
  const savedWhey = await findWheyInSavedFoods(user.id);
  const whey = savedWhey ?? WHEY_FALLBACK;

  const loggedAt = new Date().toISOString();

  // Insert both rows in one round trip
  const { error } = await supabase.from("food_diary").insert([
    {
      user_id: user.id,
      food_name: CREATINE_SERVING.food_name,
      brand: CREATINE_SERVING.brand,
      calories: CREATINE_SERVING.calories,
      protein_g: CREATINE_SERVING.protein_g,
      carbs_g: CREATINE_SERVING.carbs_g,
      fat_g: CREATINE_SERVING.fat_g,
      serving_size: CREATINE_SERVING.serving_size,
      meal_type: "supplement",
      source: SUPPS_SOURCE,
      logged_at: loggedAt,
    },
    {
      user_id: user.id,
      food_name: whey.food_name,
      brand: whey.brand ?? null,
      calories: whey.calories ?? 0,
      protein_g: whey.protein_g ?? 0,
      carbs_g: whey.carbs_g ?? 0,
      fat_g: whey.fat_g ?? 0,
      serving_size: whey.serving_size ?? "25 g",
      meal_type: "supplement",
      source: SUPPS_SOURCE,
      logged_at: loggedAt,
    },
  ]);

  return !error;
}
