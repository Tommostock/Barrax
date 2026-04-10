/* ============================================
   Offline Queue — mutation wrapper + flush
   ============================================

   The pattern:
   1. Caller wraps a Supabase mutation in queueOrExecute(). The caller
      provides BOTH a function that runs the mutation directly (if
      online) AND a fallback descriptor that can replay it later.
   2. If navigator.onLine is true and the mutation succeeds, we're done.
   3. If offline, or the request throws/errors, we enqueue the fallback
      descriptor in IndexedDB and return { queued: true }.
   4. flushQueue() is called on the `online` event — it drains the
      queue in FIFO order, replaying each mutation against Supabase.
      Stops on first failure so we can retry on the next online blip.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { getOfflineDb, type QueuedMutation } from "./db";

export interface QueueResult {
  success: boolean;
  queued: boolean;
}

/**
 * Try to run `executeFn` directly; if offline or it fails, persist
 * `fallback` to the IndexedDB queue for later replay.
 *
 * The caller should optimistically update local UI state BEFORE
 * awaiting this, so the food entry / workout feels instant even
 * when we're going to queue it.
 */
export async function queueOrExecute(
  executeFn: () => Promise<{ error: unknown }>,
  fallback: Omit<QueuedMutation, "id" | "created_at">,
): Promise<QueueResult> {
  // Try network first when online. We still run the try/catch so that
  // a transient 5xx or DNS error falls through to queuing instead of
  // throwing out of the caller.
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const result = await executeFn();
      if (!result.error) {
        return { success: true, queued: false };
      }
      // Supabase returned an error object — fall through to queue.
      console.warn("[offline] mutation failed online, queuing:", result.error);
    } catch (err) {
      console.warn("[offline] mutation threw online, queuing:", err);
    }
  }

  // Queue for later replay.
  try {
    const db = getOfflineDb();
    await db.queue.add({ ...fallback, created_at: Date.now() });
    return { success: true, queued: true };
  } catch (err) {
    // If even IndexedDB is unavailable (private browsing, quota, etc.)
    // return failure so the caller can show an error to the user.
    console.error("[offline] failed to enqueue mutation:", err);
    return { success: false, queued: false };
  }
}

/**
 * Drain the offline queue, replaying each mutation against Supabase.
 * Stops on the first failure — the remaining entries will be retried
 * on the next `online` event.
 *
 * Returns the number of successfully flushed entries.
 */
export async function flushQueue(supabase: SupabaseClient): Promise<number> {
  if (typeof window === "undefined") return 0;

  const db = getOfflineDb();
  const pending = await db.queue.orderBy("created_at").toArray();
  if (pending.length === 0) return 0;

  let flushed = 0;

  for (const item of pending) {
    try {
      let error: unknown = null;

      if (item.operation === "insert") {
        const res = await supabase
          .from(item.table)
          .insert(item.payload as Record<string, unknown>);
        error = res.error;
      } else if (item.operation === "update" && item.filter) {
        const res = await supabase
          .from(item.table)
          .update(item.payload as Record<string, unknown>)
          .match(item.filter);
        error = res.error;
      } else {
        // Malformed entry — drop it rather than loop forever.
        console.warn("[offline] dropping malformed queue entry:", item);
        if (item.id !== undefined) await db.queue.delete(item.id);
        continue;
      }

      if (error) {
        console.warn("[offline] flush failed, will retry later:", error);
        break;
      }

      if (item.id !== undefined) await db.queue.delete(item.id);
      flushed++;
    } catch (err) {
      console.warn("[offline] flush threw, will retry later:", err);
      break;
    }
  }

  return flushed;
}

/** How many mutations are waiting to sync. Used by the header badge. */
export async function getQueueCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const db = getOfflineDb();
    return await db.queue.count();
  } catch {
    return 0;
  }
}
