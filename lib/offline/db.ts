/* ============================================
   Offline DB — IndexedDB storage via Dexie
   Stores mutations that failed (or were made while offline) so they
   can be replayed against Supabase when the connection returns.

   Read-side caching of regular Supabase rows (food diary, workouts)
   is NOT handled here — pages still fetch live.
   ============================================ */

import Dexie, { type Table } from "dexie";

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

class BarraxOfflineDB extends Dexie {
  queue!: Table<QueuedMutation, number>;

  constructor() {
    super("barrax_offline");
    // Schema v1 — just the mutation queue.
    this.version(1).stores({
      queue: "++id, table, created_at",
    });
    // Schema v2 — historical: added coaching cache stores. Kept in the
    // version chain so existing user databases upgrade cleanly.
    this.version(2).stores({
      queue: "++id, table, created_at",
      coachingScripts: "workoutId, created_at",
      coachingBlobs: "key, workoutId",
    });
    // Schema v3 — coach removed. Drop the coaching stores so existing
    // installs reclaim the space. Passing `null` to Dexie deletes a store.
    this.version(3).stores({
      queue: "++id, table, created_at",
      coachingScripts: null,
      coachingBlobs: null,
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
