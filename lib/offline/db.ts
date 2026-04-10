/* ============================================
   Offline DB — IndexedDB storage via Dexie
   Stores a queue of mutations that failed (or were
   made while offline) so they can be replayed when
   the connection returns.

   MVP scope: food_diary inserts + workout completion
   inserts/updates. Read-side caching is NOT handled
   here — pages still fetch live from Supabase.
   ============================================ */

import Dexie, { type Table } from "dexie";

/** A single mutation waiting to be replayed against Supabase. */
export interface QueuedMutation {
  id?: number;
  /** Which Supabase table this mutation targets. */
  table: "food_diary" | "workout_exercises" | "workouts";
  /** Insert is the common case; update is only used for workouts status flip. */
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
    // Schema v1 — if we ever need to add fields, bump to .version(2)
    // and add a migration (Dexie handles the upgrade).
    this.version(1).stores({
      // ++id = auto-increment primary key
      // table, created_at = secondary indexes for FIFO draining + UI count
      queue: "++id, table, created_at",
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
