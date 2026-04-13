/* ============================================
   Daily Protein Target XP
   Idempotent end-of-day protein check. Called
   after any food diary insert to see if today's
   logged protein has crossed the user's target.
   Awards a small XP bonus once per day, backed
   by an xp_events lookup so repeat calls never
   double-count.
   ============================================ */

"use client";

import { createClient } from "@/lib/supabase/client";
import { awardXPAndNotify } from "@/lib/award-and-notify";
import { calculateMacroTargets } from "@/lib/macros";
import { showNotification } from "@/lib/notifications";

// Single-source XP reward so it's easy to tune. Deliberately
// smaller than a workout — this is a "staying on target" bonus,
// not the main event.
export const PROTEIN_XP_REWARD = 20;

// xp_events source value used to track whether today's reward
// has already been paid out. Matches the convention used by
// other rewards like "workout_complete" and "water_goal_hit".
const PROTEIN_XP_SOURCE = "protein_target_hit";

function todayBounds(): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Check whether the user has already been awarded the protein
 * XP bonus today. We just look for an xp_events row with the
 * expected source logged within today's bounds.
 */
async function alreadyAwardedToday(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { start, end } = todayBounds();

  const { data, error } = await supabase
    .from("xp_events")
    .select("id")
    .eq("user_id", userId)
    .eq("source", PROTEIN_XP_SOURCE)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .limit(1);

  if (error) return true; // fail-safe: don't double-award on error
  return (data?.length ?? 0) > 0;
}

/**
 * Tally total protein logged today across every food diary row.
 */
async function totalProteinToday(userId: string): Promise<number> {
  const supabase = createClient();
  const { start, end } = todayBounds();

  const { data, error } = await supabase
    .from("food_diary")
    .select("protein_g")
    .eq("user_id", userId)
    .gte("logged_at", start)
    .lte("logged_at", end);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + Number(row.protein_g ?? 0), 0);
}

/**
 * Check today's protein intake against the user's daily target
 * and, if they've crossed it for the first time today, award a
 * small XP bonus. Safe to call after every food log — the
 * xp_events lookup prevents double-counting.
 *
 * Returns `true` if XP was awarded on this call, `false` otherwise.
 */
export async function awardProteinTargetIfHit(): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Short-circuit if today's reward is already in the bag
  if (await alreadyAwardedToday(user.id)) return false;

  // Load the user's daily calorie goal and protein split so we
  // can derive the gram target with the same formula the diary
  // uses.
  const { data: profile } = await supabase
    .from("profiles")
    .select("calorie_target, protein_pct, carb_pct, fat_pct")
    .eq("id", user.id)
    .single();

  if (!profile?.calorie_target) return false;

  const targets = calculateMacroTargets(
    profile.calorie_target,
    profile.protein_pct ?? 30,
    profile.carb_pct ?? 40,
    profile.fat_pct ?? 30,
  );
  const proteinTargetG = targets.protein;
  if (proteinTargetG <= 0) return false;

  // Total protein logged today (across all meal types)
  const todayProtein = await totalProteinToday(user.id);
  if (todayProtein < proteinTargetG) return false;

  // Target cleared and not yet awarded — pay out the bonus and
  // fire a subtle notification so the user knows it landed.
  const result = await awardXPAndNotify(PROTEIN_XP_REWARD, PROTEIN_XP_SOURCE);
  if (!result) return false;

  showNotification(
    "PROTEIN TARGET HIT",
    `+${PROTEIN_XP_REWARD} XP. ${proteinTargetG}g daily protein smashed.`,
    "protein-target-hit",
    "/rations/diary",
  );

  return true;
}
