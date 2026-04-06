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
  durationSeconds: number,
  exerciseCount: number
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

// Check run records after a completed run
export async function checkRunRecords(
  userId: string,
  distanceMetres: number,
  durationSeconds: number,
  avgPaceSecsPerKm: number
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

  // Fastest 5km (only if run was at least 5km)
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

  return newPRs;
}
