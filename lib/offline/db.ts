/* ============================================
   Offline DB — IndexedDB storage via Dexie
   Two purposes:
   1. QUEUE — mutations that failed (or were made while offline) so they
      can be replayed against Supabase when the connection returns.
   2. COACHING CACHE — AI coaching script manifests + per-cue MP3 blobs
      so a workout can be replayed without hitting the network.

   Read-side caching of regular Supabase rows (food diary, workouts)
   is NOT handled here — pages still fetch live.
   ============================================ */

import Dexie, { type Table } from "dexie";
import type { CoachingScript } from "@/types";

/** A single mutation waiting to be replayed against Supabase. */
export interface QueuedMutation {
  id?: number;
  /** Which Supabase table this mutation targets. */
  table:
    | "food_diary"
    | "workout_exercises"
    | "workouts"
    | "daily_contracts"
    | "classified_ops";
  /** Insert for new rows, update for progress ticks and status flips. */
  operation: "insert" | "update";
  /** The row or rows to insert / the columns to update. */
  payload: Record<string, unknown> | Record<string, unknown>[];
  /** For updates only — the WHERE clause (e.g. { id: "abc" }). */
  filter?: Record<string, unknown>;
  /** Unix ms the entry was queued. Drains FIFO. */
  created_at: number;
}

/** A cached coaching script manifest, keyed by workoutId. */
export interface CachedCoachingScript {
  workoutId: string;
  manifest: CoachingScript;
  voice: string;
  /** sha256 of workoutData JSON — invalidates if the workout is regenerated. */
  workout_hash: string;
  created_at: number;
}

/** A cached MP3 blob for a single cue, keyed by `${workoutId}:${cueId}`. */
export interface CachedCoachingBlob {
  key: string;
  workoutId: string;
  cueId: string;
  blob: Blob;
  created_at: number;
}

class BarraxOfflineDB extends Dexie {
  queue!: Table<QueuedMutation, number>;
  coachingScripts!: Table<CachedCoachingScript, string>;
  coachingBlobs!: Table<CachedCoachingBlob, string>;

  constructor() {
    super("barrax_offline");
    // Schema v1 — just the mutation queue.
    this.version(1).stores({
      queue: "++id, table, created_at",
    });
    // Schema v2 — add coaching cache stores. Dexie handles the upgrade.
    this.version(2).stores({
      queue: "++id, table, created_at",
      coachingScripts: "workoutId, created_at",
      coachingBlobs: "key, workoutId",
    });
  }
}

/**
 * Lazy singleton — Dexie touches `indexedDB`, which doesn't exist in
 * Node. Next.js will try to evaluate the module at build time for
 * static pages, so we gate the instance behind a function that only
 * runs on the client.
 */
let _db: BarraxOfflineDB | null = null;

export function getOfflineDb(): BarraxOfflineDB {
  if (typeof window === "undefined") {
    throw new Error("getOfflineDb() called on the server");
  }
  if (!_db) _db = new BarraxOfflineDB();
  return _db;
}
