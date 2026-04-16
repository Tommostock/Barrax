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
  notifyWaterGoalHit,
} from "@/lib/notifications";

interface AwardResult {
  newTotalXP: number;
  xpAwarded: number;
  previousRank: number;
  newRank: number;
  rankedUp: boolean;
  rankTitle?: string;
}

// Award XP and fire notifications for rank-ups. Optional referenceId
// lets callers correlate the XP event with its source row (workout,
// contract, classified op, etc.) in the xp_events audit log.
export async function awardXPAndNotify(
  amount: number,
  source: string,
  referenceId?: string,
  note?: string,
): Promise<AwardResult | null> {
  try {
    const response = await fetch("/api/award-xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        source,
        reference_id: referenceId,
        note,
      }),
    });

    if (!response.ok) return null;

    const result: AwardResult = await response.json();

    // Fire the XP popup — floats "+X XP" up the screen like a kill confirmation
    window.dispatchEvent(new CustomEvent("xp-awarded", {
      detail: { amount: result.xpAwarded, source },
    }));

    // Fire rank-up notification if promoted
    if (result.rankedUp && result.rankTitle) {
      notifyRankUp(result.rankTitle);
      window.dispatchEvent(new CustomEvent("rankup", {
        detail: { rank: result.newRank, xp: result.newTotalXP },
      }));
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

export async function hitWaterGoalAndNotify() {
  notifyWaterGoalHit();
  return awardXPAndNotify(10, "water_goal_hit");
}

// Contracts + Classified Ops -- the local notification is fired from
// inside updateContractProgress / updateOpProgress when the completion
// transition happens, so these wrappers only award XP.
export async function completeContractAndNotify(xp: number, contractId?: string) {
  return awardXPAndNotify(xp, "daily_contract", contractId);
}

export async function completeClassifiedOpAndNotify(xp: number, opId?: string) {
  return awardXPAndNotify(xp, "classified_op", opId);
}

