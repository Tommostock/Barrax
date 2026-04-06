/* ============================================
   Streak Tracking System
   A day counts as "active" if a workout is completed
   OR the meal plan is followed. Handles streak freeze
   (1 free rest day per week that doesn't break it).
   ============================================ */

import { createClient } from "@/lib/supabase/client";

// Check and update the user's streak. Call this after
// any action that could count as daily activity.
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  justBroke: boolean;
}> {
  const supabase = createClient();

  // Get current streak data
  const { data: streak, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !streak) {
    return { currentStreak: 0, longestStreak: 0, justBroke: false };
  }

  const today = new Date().toISOString().split("T")[0];
  const lastActive = streak.last_active_date;

  // Already logged today — no change needed
  if (lastActive === today) {
    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      justBroke: false,
    };
  }

  // Calculate how many days since last active
  let daysSinceActive = 0;
  if (lastActive) {
    const last = new Date(lastActive);
    const now = new Date(today);
    daysSinceActive = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  }

  let newStreak = streak.current_streak;
  let justBroke = false;

  if (daysSinceActive === 1) {
    // Consecutive day — extend the streak
    newStreak = streak.current_streak + 1;
  } else if (daysSinceActive === 2 && !streak.freeze_used_this_week) {
    // Missed one day but have a freeze available — use it
    newStreak = streak.current_streak + 1;
    await supabase
      .from("streaks")
      .update({ freeze_used_this_week: true })
      .eq("user_id", userId);
  } else if (daysSinceActive > 1) {
    // Streak broken
    newStreak = 1; // Today starts a new streak
    justBroke = streak.current_streak > 0;
  } else {
    // First ever activity
    newStreak = 1;
  }

  // Check if this is a new longest streak
  const newLongest = Math.max(newStreak, streak.longest_streak);

  // Build streak history entry
  const history = streak.streak_history || [];
  history.push({
    date: today,
    type: "active" as const,
  });

  // Update the database
  await supabase
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
      streak_history: history,
    })
    .eq("user_id", userId);

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    justBroke,
  };
}

// Reset the weekly freeze flag — call this on Mondays
export async function resetWeeklyFreeze(userId: string) {
  const supabase = createClient();
  await supabase
    .from("streaks")
    .update({ freeze_used_this_week: false })
    .eq("user_id", userId);
}

// Check streak milestone XP bonuses
// Returns bonus XP for milestones: 7, 14, 30, 60, 90 days
export function getStreakMilestoneXP(streak: number): number {
  const milestones: Record<number, number> = {
    7: 50,
    14: 100,
    30: 200,
    60: 300,
    90: 500,
    180: 750,
    365: 1000,
  };
  return milestones[streak] ?? 0;
}
