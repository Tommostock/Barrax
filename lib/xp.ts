/* ============================================
   XP System
   Central utility for awarding XP, checking rank
   thresholds, and triggering rank-ups.
   ============================================ */

import { createClient } from "@/lib/supabase/client";
import { RANK_THRESHOLDS } from "@/types";

// XP values for different actions
export const XP_VALUES = {
  WORKOUT_SHORT: 30,     // < 15 minutes
  WORKOUT_MEDIUM: 50,    // 15-30 minutes
  WORKOUT_LONG: 80,      // 30+ minutes
  RUN_BASE: 40,          // Base run XP
  RUN_PER_KM: 12,        // Additional XP per km
  RUN_MAX: 100,          // Max run XP
  MEAL_PLAN_FOLLOWED: 20,
  WEIGHT_LOGGED: 10,
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_MAX: 50,
  DAILY_CHALLENGE_MIN: 50,
  DAILY_CHALLENGE_MAX: 150,
  WEEKLY_PROGRAMME_COMPLETE: 200,
  MAYBE_FOOD_APPROVED: 25,
  WATER_GOAL_HIT: 10,
  PERSONAL_RECORD: 50,
} as const;

// Calculate workout XP based on duration in seconds
export function getWorkoutXP(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  if (minutes < 15) return XP_VALUES.WORKOUT_SHORT;
  if (minutes <= 30) return XP_VALUES.WORKOUT_MEDIUM;
  return XP_VALUES.WORKOUT_LONG;
}

// Calculate run XP based on distance in metres
export function getRunXP(distanceMetres: number): number {
  const km = distanceMetres / 1000;
  const xp = XP_VALUES.RUN_BASE + Math.floor(km * XP_VALUES.RUN_PER_KM);
  return Math.min(xp, XP_VALUES.RUN_MAX);
}

// Calculate streak bonus XP
export function getStreakBonus(currentStreak: number): number {
  return Math.min(currentStreak * XP_VALUES.STREAK_BONUS_PER_DAY, XP_VALUES.STREAK_BONUS_MAX);
}

// Determine rank from total XP
export function getRankFromXP(totalXP: number): number {
  let rank = 1;
  for (const threshold of RANK_THRESHOLDS) {
    if (totalXP >= threshold.xp) {
      rank = threshold.rank;
    } else {
      break;
    }
  }
  return rank;
}

// Award XP to a user and check for rank-up
// Returns { newTotalXP, previousRank, newRank, rankedUp }
export async function awardXP(
  userId: string,
  amount: number,
  source: string
): Promise<{
  newTotalXP: number;
  previousRank: number;
  newRank: number;
  rankedUp: boolean;
}> {
  const supabase = createClient();

  // Get current rank data
  const { data: rankData, error: fetchError } = await supabase
    .from("ranks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !rankData) {
    throw new Error("Could not fetch rank data");
  }

  const previousRank = rankData.current_rank;
  const previousXP = rankData.total_xp;
  const newTotalXP = previousXP + amount;
  const newRank = getRankFromXP(newTotalXP);
  const rankedUp = newRank > previousRank;

  // Build the updated rank history if ranked up
  const rankHistory = rankData.rank_history || [];
  if (rankedUp) {
    const rankInfo = RANK_THRESHOLDS[newRank - 1];
    rankHistory.push({
      rank: newRank,
      title: rankInfo.title,
      achieved_at: new Date().toISOString(),
      total_xp: newTotalXP,
    });
  }

  // Update the rank record
  const { error: updateError } = await supabase
    .from("ranks")
    .update({
      total_xp: newTotalXP,
      current_rank: newRank,
      rank_history: rankHistory,
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error("Could not update rank data");
  }

  return { newTotalXP, previousRank, newRank, rankedUp };
}
