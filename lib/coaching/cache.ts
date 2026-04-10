/* ============================================
   BARRAX — Coaching cache helpers
   Thin convenience layer over the Dexie v2
   coachingScripts + coachingBlobs stores.

   Client-only. All functions assume window.
   ============================================ */

import { getOfflineDb, type CachedCoachingScript } from "@/lib/offline/db";
import type { CoachingScript } from "@/types";

export async function getCachedScript(
  workoutId: string,
): Promise<CachedCoachingScript | null> {
  try {
    const db = getOfflineDb();
    const row = await db.coachingScripts.get(workoutId);
    return row ?? null;
  } catch (err) {
    console.warn("[coaching/cache] getCachedScript failed:", err);
    return null;
  }
}

export async function putCachedScript(entry: CachedCoachingScript): Promise<void> {
  try {
    const db = getOfflineDb();
    await db.coachingScripts.put(entry);
  } catch (err) {
    console.warn("[coaching/cache] putCachedScript failed:", err);
  }
}

export async function getCachedBlob(
  workoutId: string,
  cueId: string,
): Promise<Blob | null> {
  try {
    const db = getOfflineDb();
    const row = await db.coachingBlobs.get(`${workoutId}:${cueId}`);
    return row?.blob ?? null;
  } catch (err) {
    console.warn("[coaching/cache] getCachedBlob failed:", err);
    return null;
  }
}

export async function putCachedBlob(
  workoutId: string,
  cueId: string,
  blob: Blob,
): Promise<void> {
  try {
    const db = getOfflineDb();
    await db.coachingBlobs.put({
      key: `${workoutId}:${cueId}`,
      workoutId,
      cueId,
      blob,
      created_at: Date.now(),
    });
  } catch (err) {
    console.warn("[coaching/cache] putCachedBlob failed:", err);
  }
}

/** Wipe the entire coaching cache. Used when the user changes voice. */
export async function clearCoachingCache(): Promise<void> {
  try {
    const db = getOfflineDb();
    await db.coachingScripts.clear();
    await db.coachingBlobs.clear();
  } catch (err) {
    console.warn("[coaching/cache] clearCoachingCache failed:", err);
  }
}

/** Delete cached data for a single workout. */
export async function evictWorkout(workoutId: string): Promise<void> {
  try {
    const db = getOfflineDb();
    await db.coachingScripts.delete(workoutId);
    const keys = await db.coachingBlobs
      .where("workoutId")
      .equals(workoutId)
      .primaryKeys();
    if (keys.length > 0) {
      await db.coachingBlobs.bulkDelete(keys);
    }
  } catch (err) {
    console.warn("[coaching/cache] evictWorkout failed:", err);
  }
}

/**
 * Compute sha256(JSON) in the browser using SubtleCrypto.
 * Used to produce a stable workout_hash that matches the server's hash.
 */
export async function hashWorkoutData(data: unknown): Promise<string> {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buf = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check whether a CoachingScript has an MP3 blob cached for every cue that
 * has an audioUrl. Used to decide whether to re-download.
 */
export async function hasAllBlobs(
  workoutId: string,
  script: CoachingScript,
): Promise<boolean> {
  try {
    const db = getOfflineDb();
    for (const cue of script.cues) {
      if (!cue.audioUrl) continue; // subtitle-only cue, no blob expected
      const key = `${workoutId}:${cue.id}`;
      const count = await db.coachingBlobs.where("key").equals(key).count();
      if (count === 0) return false;
    }
    return true;
  } catch {
    return false;
  }
}
