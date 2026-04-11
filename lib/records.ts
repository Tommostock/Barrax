/* ============================================
   Personal Records System
   Auto-detects new PRs and saves them.
   Returns newly broken records for notifications.
   ============================================ */

import { createClient } from "@/lib/supabase/client";

interface RecordCheck {
  category: string;
  value: number;
  unit: string;
}

// Check if a value is a new personal record.
// If it beats the existing record (or no record exists), save it.
// Returns true if a new PR was set.
export async function checkPersonalRecord(
  userId: string,
  record: RecordCheck
): Promise<boolean> {
  const supabase = createClient();

  // Get existing record for this category
  const { data: existing } = await supabase
    .from("personal_records")
    .select("value")
    .eq("user_id", userId)
    .eq("category", record.category)
    .single();

  // Determine if this is a new PR
  // For "fastest" records (pace), lower is better
  const isFastest = record.category.includes("fastest");
  let isNewPR = false;

  if (!existing) {
    isNewPR = true; // No existing record — this is the first
  } else if (isFastest) {
    isNewPR = record.value < existing.value; // Lower pace = faster
  } else {
    isNewPR = record.value > existing.value; // Higher = better
  }

  if (isNewPR) {
    // Upsert the record (insert or update)
    await supabase.from("personal_records").upsert(
      {
        user_id: userId,
        category: record.category,
        value: record.value,
        unit: record.unit,
        achieved_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category" }
    );
  }

  return isNewPR;
}

// Check multiple records at once after a workout
export async function checkWorkoutRecords(
  userId: string,
  durationSeconds: number
): Promise<string[]> {
  const newPRs: string[] = [];

  // Longest workout
  if (await checkPersonalRecord(userId, {
    category: "longest_workout",
    value: Math.round(durationSeconds / 60),
    unit: "min",
  })) {
    newPRs.push("Longest Workout");
  }

  return newPRs;
}

/** Map a challenge_distance_m value to its personal_records category + label. */
const CHALLENGE_PR_MAP: Record<number, { category: string; label: string }> = {
  1609: { category: "fastest_1mi", label: "Fastest 1 Mile" },
  2400: { category: "fastest_2p4km", label: "Fastest 2.4 km" },
  2414: { category: "fastest_1500m", label: "Fastest 1.5 Mile" },
  5000: { category: "fastest_5km_total", label: "Fastest 5 km (Total Time)" },
  10000: { category: "fastest_10km", label: "Fastest 10 km" },
};

// Check run records after a completed run. Optional challengeDistanceM
// lets the run tracker signal that the run targeted a preset benchmark
// distance, in which case we also check the per-challenge PR using
// total duration (not pace) so fastest_1mi etc. are comparable.
export async function checkRunRecords(
  userId: string,
  distanceMetres: number,
  durationSeconds: number,
  avgPaceSecsPerKm: number,
  challengeDistanceM?: number | null,
): Promise<string[]> {
  const newPRs: string[] = [];

  // Longest run
  if (await checkPersonalRecord(userId, {
    category: "longest_run",
    value: Math.round(distanceMetres) / 1000,
    unit: "km",
  })) {
    newPRs.push("Longest Run");
  }

  // Fastest 1km (only if run was at least 1km)
  if (distanceMetres >= 1000) {
    if (await checkPersonalRecord(userId, {
      category: "fastest_1km",
      value: avgPaceSecsPerKm,
      unit: "sec/km",
    })) {
      newPRs.push("Fastest 1km");
    }
  }

  // Fastest 5km (only if run was at least 5km) -- existing pace-based PR
  if (distanceMetres >= 5000) {
    const paceFor5k = Math.round((durationSeconds / distanceMetres) * 5000);
    if (await checkPersonalRecord(userId, {
      category: "fastest_5km",
      value: paceFor5k,
      unit: "sec",
    })) {
      newPRs.push("Fastest 5km");
    }
  }

  // Challenge-distance PR: only fires when the user ran a preset benchmark.
  // The value is the TOTAL duration in seconds -- lower is better. This lets
  // "fastest 5 km" mean fastest 5 km time, not fastest 5 km pace.
  if (challengeDistanceM && CHALLENGE_PR_MAP[challengeDistanceM]) {
    const { category, label } = CHALLENGE_PR_MAP[challengeDistanceM];
    if (await checkPersonalRecord(userId, {
      category,
      value: durationSeconds,
      unit: "sec",
    })) {
      newPRs.push(label);
    }
  }

  return newPRs;
}
