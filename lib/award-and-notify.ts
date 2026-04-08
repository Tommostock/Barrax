/* ============================================
   Award XP + Auto-Notify
   Wraps the /api/award-xp call and automatically
   fires local notifications for rank-ups and
   other events. Use this instead of calling
   /api/award-xp directly from client components.
   ============================================ */

"use client";

import {
  notifyRankUp,
  notifyWorkoutComplete,
  notifyRunComplete,
  notifyChallengeComplete,
  notifyWaterGoalHit,
  notifyStreakMilestone,
} from "@/lib/notifications";

interface AwardResult {
  newTotalXP: number;
  xpAwarded: number;
  previousRank: number;
  newRank: number;
  rankedUp: boolean;
  rankTitle?: string;
}

// Award XP and fire notifications for rank-ups
export async function awardXPAndNotify(
  amount: number,
  source: string
): Promise<AwardResult | null> {
  try {
    const response = await fetch("/api/award-xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, source }),
    });

    if (!response.ok) return null;

    const result: AwardResult = await response.json();

    // Fire rank-up notification if promoted
    if (result.rankedUp && result.rankTitle) {
      notifyRankUp(result.rankTitle);
    }

    return result;
  } catch {
    return null;
  }
}

// Convenience wrappers for specific events that also fire their own notifications

export async function completeWorkoutAndNotify(xp: number, durationSeconds: number) {
  notifyWorkoutComplete(xp, durationSeconds);
  return awardXPAndNotify(xp, "workout_complete");
}

export async function completeRunAndNotify(xp: number, distanceKm: string) {
  notifyRunComplete(distanceKm, xp);
  return awardXPAndNotify(xp, "run_complete");
}

export async function completeChallengeAndNotify(xp: number) {
  notifyChallengeComplete(xp);
  return awardXPAndNotify(xp, "daily_challenge");
}

export async function hitWaterGoalAndNotify() {
  notifyWaterGoalHit();
  return awardXPAndNotify(10, "water_goal_hit");
}

export async function hitStreakMilestoneAndNotify(days: number, bonusXP: number) {
  notifyStreakMilestone(days);
  if (bonusXP > 0) {
    return awardXPAndNotify(bonusXP, "streak_milestone");
  }
  return null;
}
