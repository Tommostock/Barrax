/* ============================================
   Badge & Achievement System
   Defines all badges and checks if conditions
   are met after relevant actions.
   ============================================ */

import { createClient } from "@/lib/supabase/client";

// All badge definitions — key, name, description, and check function context
export const BADGE_DEFINITIONS = [
  // Workout count badges
  { key: "workout_1", name: "First Blood", description: "Complete first workout", category: "workout", threshold: 1 },
  { key: "workout_10", name: "Getting Started", description: "Complete 10 workouts", category: "workout", threshold: 10 },
  { key: "workout_50", name: "Dedicated", description: "Complete 50 workouts", category: "workout", threshold: 50 },
  { key: "workout_100", name: "Centurion", description: "Complete 100 workouts", category: "workout", threshold: 100 },
  { key: "workout_250", name: "Iron Body", description: "Complete 250 workouts", category: "workout", threshold: 250 },
  { key: "workout_500", name: "Legend", description: "Complete 500 workouts", category: "workout", threshold: 500 },

  // Run badges
  { key: "run_first", name: "First Klick", description: "Complete first run", category: "run", threshold: 1 },
  { key: "run_5k", name: "5K Cleared", description: "Run 5km in a single run", category: "run_distance", threshold: 5000 },
  { key: "run_10k", name: "10K Cleared", description: "Run 10km in a single run", category: "run_distance", threshold: 10000 },
  { key: "run_total_50", name: "50km Total", description: "Run 50km total distance", category: "run_total", threshold: 50000 },
  { key: "run_total_100", name: "100km Total", description: "Run 100km total distance", category: "run_total", threshold: 100000 },
  { key: "run_total_500", name: "500km Total", description: "Run 500km total distance", category: "run_total", threshold: 500000 },

  // Nutrition badges
  { key: "nutrition_week", name: "Ration Discipline", description: "Follow meal plan for a full week", category: "nutrition", threshold: 7 },
  { key: "nutrition_30", name: "Mess Hall Regular", description: "Track meals for 30 days", category: "nutrition", threshold: 30 },
  { key: "nutrition_tried_10", name: "Open Palate", description: "Try 10 new MAYBE foods", category: "nutrition_try", threshold: 10 },

  // Special badges
  { key: "dawn_patrol", name: "Dawn Patrol", description: "Complete a workout before 07:00", category: "special", threshold: 0 },
  { key: "night_ops", name: "Night Ops", description: "Complete a workout after 21:00", category: "special", threshold: 0 },
  { key: "iron_will", name: "Iron Will", description: "Work out on a scheduled rest day", category: "special", threshold: 0 },
  { key: "double_time", name: "Double Time", description: "Complete two workouts in one day", category: "special", threshold: 0 },
  { key: "clean_sweep", name: "Clean Sweep", description: "Perfect week: all workouts and meals", category: "special", threshold: 0 },
] as const;

export type BadgeKey = typeof BADGE_DEFINITIONS[number]["key"];

// Check and award a badge if not already earned.
// Returns the badge info if newly awarded, null if already had it.
export async function checkAndAwardBadge(
  userId: string,
  badgeKey: BadgeKey
): Promise<{ badge_name: string; badge_description: string } | null> {
  const supabase = createClient();

  // Check if already earned
  const { data: existing } = await supabase
    .from("badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_key", badgeKey)
    .single();

  if (existing) return null; // Already earned

  // Find the badge definition
  const badge = BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
  if (!badge) return null;

  // Award the badge
  const { error } = await supabase.from("badges").insert({
    user_id: userId,
    badge_key: badge.key,
    badge_name: badge.name,
    badge_description: badge.description,
  });

  if (error) return null;

  return { badge_name: badge.name, badge_description: badge.description };
}

// Check workout count badges
export async function checkWorkoutBadges(userId: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "complete");

  if (!count) return [];

  const workoutBadges = BADGE_DEFINITIONS.filter((b) => b.category === "workout");
  const awarded: string[] = [];

  for (const badge of workoutBadges) {
    if (count >= badge.threshold) {
      const result = await checkAndAwardBadge(userId, badge.key);
      if (result) awarded.push(result.badge_name);
    }
  }

  return awarded;
}

// Check run badges (single run distance + total distance)
export async function checkRunBadges(userId: string, singleRunMetres?: number) {
  const supabase = createClient();
  const awarded: string[] = [];

  // Single run distance badges
  if (singleRunMetres) {
    const distBadges = BADGE_DEFINITIONS.filter((b) => b.category === "run_distance");
    for (const badge of distBadges) {
      if (singleRunMetres >= badge.threshold) {
        const result = await checkAndAwardBadge(userId, badge.key);
        if (result) awarded.push(result.badge_name);
      }
    }
  }

  // Run count badge
  const { count: runCount } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (runCount && runCount >= 1) {
    const result = await checkAndAwardBadge(userId, "run_first");
    if (result) awarded.push(result.badge_name);
  }

  // Total distance badges
  const { data: runs } = await supabase
    .from("runs")
    .select("distance_metres")
    .eq("user_id", userId);

  const totalDist = runs?.reduce((sum, r) => sum + (r.distance_metres || 0), 0) ?? 0;
  const totalBadges = BADGE_DEFINITIONS.filter((b) => b.category === "run_total");
  for (const badge of totalBadges) {
    if (totalDist >= badge.threshold) {
      const result = await checkAndAwardBadge(userId, badge.key);
      if (result) awarded.push(result.badge_name);
    }
  }

  return awarded;
}

// Check time-of-day special badges
export async function checkTimeBadges(userId: string, completedAt: Date) {
  const hour = completedAt.getHours();
  const awarded: string[] = [];

  if (hour < 7) {
    const result = await checkAndAwardBadge(userId, "dawn_patrol");
    if (result) awarded.push(result.badge_name);
  }
  if (hour >= 21) {
    const result = await checkAndAwardBadge(userId, "night_ops");
    if (result) awarded.push(result.badge_name);
  }

  return awarded;
}
