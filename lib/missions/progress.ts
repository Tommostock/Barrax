/* ============================================
   Mission Progress Engine
   Single file that powers daily contract + monthly op progress.

   Architecture: "push trigger, pull logic."
   - Every workout/meal/run finish calls updateMissionsProgress().
   - That helper re-reads the source tables (workout_exercises /
     food_diary / runs / water_logs) for the relevant period and
     writes the aggregate back to daily_contracts.current_value
     and classified_ops.current_value.
   - Idempotent: if completed=true already, early-return before the
     XP award branch. Parallel hook calls can't double-award.
   - Drift-proof: on HQ mount the engine is also called, so a
     missed hook self-heals on next app open.

   Progress keys handled here MUST match the ones used in the
   contract-pool and op-pool.
   ============================================ */

"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyContract, ClassifiedOp, ProgressKey } from "@/types/missions";
import { queueOrExecute } from "@/lib/offline/queue";
import { todayLocalISO, monthStartLocalISO, monthEndLocalISO, dayBoundsISO } from "@/lib/missions/date";

// ---------------------------------------------------------------------------
// computeProgress -- pure read, returns a number for a given progress_key
// over a [start, end] local-date period.
// ---------------------------------------------------------------------------
export async function computeProgress(
  supabase: SupabaseClient,
  userId: string,
  key: ProgressKey,
  startISO: string,
  endISO: string,
): Promise<number> {
  const { startTs, endTs } = dayBoundsISO(startISO, endISO);

  // ---- reps for a specific exercise (case-insensitive substring) ----
  if (key.startsWith("reps_exercise:")) {
    const name = key.split(":")[1] ?? "";
    // Convert snake_case key to loose pattern, e.g. "push_up" -> "%push%up%"
    const pattern = `%${name.replace(/_/g, "%")}%`;
    const { data } = await supabase
      .from("workout_exercises")
      .select("reps_completed, workouts!inner(completed_at, user_id, status)")
      .ilike("exercise_name", pattern)
      .eq("workouts.user_id", userId)
      .eq("workouts.status", "complete")
      .gte("workouts.completed_at", startTs)
      .lte("workouts.completed_at", endTs);
    return sumInt(data ?? [], (r) => r.reps_completed ?? 0);
  }

  switch (key) {
    case "reps_any": {
      const { data } = await supabase
        .from("workout_exercises")
        .select("reps_completed, workouts!inner(completed_at, user_id, status)")
        .eq("workouts.user_id", userId)
        .eq("workouts.status", "complete")
        .gte("workouts.completed_at", startTs)
        .lte("workouts.completed_at", endTs);
      return sumInt(data ?? [], (r) => r.reps_completed ?? 0);
    }

    case "workout_complete_count": {
      const { count } = await supabase
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "complete")
        .gte("completed_at", startTs)
        .lte("completed_at", endTs);
      return count ?? 0;
    }

    case "run_distance_m": {
      const { data } = await supabase
        .from("runs")
        .select("distance_metres")
        .eq("user_id", userId)
        .gte("completed_at", startTs)
        .lte("completed_at", endTs);
      return Math.round(sumInt(data ?? [], (r) => r.distance_metres ?? 0));
    }

    case "meals_logged": {
      const { count } = await supabase
        .from("food_diary")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_at", startTs)
        .lte("logged_at", endTs);
      return count ?? 0;
    }

    case "protein_g": {
      const { data } = await supabase
        .from("food_diary")
        .select("protein_g, quantity")
        .eq("user_id", userId)
        .gte("logged_at", startTs)
        .lte("logged_at", endTs);
      return Math.round(
        (data ?? []).reduce((s, r) => s + (r.protein_g ?? 0) * (r.quantity ?? 1), 0),
      );
    }

    case "water_ml": {
      const { data } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", userId)
        .gte("logged_at", startTs)
        .lte("logged_at", endTs);
      return sumInt(data ?? [], (r) => r.amount_ml ?? 0);
    }

    case "calories_hit_target_day": {
      const [{ data: diary }, { data: profile }] = await Promise.all([
        supabase
          .from("food_diary")
          .select("calories, logged_at")
          .eq("user_id", userId)
          .gte("logged_at", startTs)
          .lte("logged_at", endTs),
        supabase
          .from("profiles")
          .select("calorie_target")
          .eq("id", userId)
          .single(),
      ]);
      const target = profile?.calorie_target ?? 2000;
      const byDay = new Map<string, number>();
      for (const row of diary ?? []) {
        const day = (row.logged_at as string).slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + (row.calories ?? 0));
      }
      let hits = 0;
      for (const cals of byDay.values()) {
        if (Math.abs(cals - target) <= 200) hits++;
      }
      return hits;
    }

    case "new_exercise_logged": {
      const [{ data: inPeriod }, { data: priorEver }] = await Promise.all([
        supabase
          .from("workout_exercises")
          .select("exercise_name, workouts!inner(completed_at, user_id, status)")
          .eq("workouts.user_id", userId)
          .eq("workouts.status", "complete")
          .gte("workouts.completed_at", startTs)
          .lte("workouts.completed_at", endTs),
        supabase
          .from("workout_exercises")
          .select("exercise_name, workouts!inner(completed_at, user_id, status)")
          .eq("workouts.user_id", userId)
          .eq("workouts.status", "complete")
          .lt("workouts.completed_at", startTs),
      ]);
      const priorSet = new Set(
        (priorEver ?? []).map((r) => (r.exercise_name as string).toLowerCase()),
      );
      const foundNew = (inPeriod ?? []).some(
        (r) => !priorSet.has((r.exercise_name as string).toLowerCase()),
      );
      return foundNew ? 1 : 0;
    }

    case "unique_exercises_logged": {
      const { data } = await supabase
        .from("workout_exercises")
        .select("exercise_name, workouts!inner(completed_at, user_id, status)")
        .eq("workouts.user_id", userId)
        .eq("workouts.status", "complete")
        .gte("workouts.completed_at", startTs)
        .lte("workouts.completed_at", endTs);
      return new Set((data ?? []).map((r) => (r.exercise_name as string).toLowerCase())).size;
    }
  }

  return 0;
}

function sumInt<T>(rows: T[], getter: (row: T) => number): number {
  let total = 0;
  for (const r of rows) total += getter(r);
  return total;
}

// ---------------------------------------------------------------------------
// updateContractProgress -- recompute today's contract current_value.
// Fires notification + XP award + custom event on completion transition.
// Idempotent: returns early if contract is already completed.
// ---------------------------------------------------------------------------
export async function updateContractProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<DailyContract | null> {
  if (!userId) return null;

  const today = todayLocalISO();
  const { data: contract } = await supabase
    .from("daily_contracts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (!contract) return null;
  if (contract.completed) return contract as DailyContract;

  const current = await computeProgress(
    supabase,
    userId,
    contract.progress_key as ProgressKey,
    today,
    today,
  );
  const hit = current >= contract.target_value;

  const updates: Record<string, unknown> = { current_value: current };
  if (hit) {
    updates.completed = true;
    updates.completed_at = new Date().toISOString();
  }

  // Queue-aware write so progress still ticks offline.
  await queueOrExecute(
    async () => {
      const { error } = await supabase
        .from("daily_contracts")
        .update(updates)
        .eq("id", contract.id);
      return { error };
    },
    {
      table: "daily_contracts",
      operation: "update",
      payload: updates,
      filter: { id: contract.id },
    },
  );

  // Fire completion side-effects only on the transition incomplete -> complete
  if (hit && !contract.completed) {
    try {
      const [{ completeContractAndNotify }, { notifyContractComplete }] = await Promise.all([
        import("@/lib/award-and-notify"),
        import("@/lib/notifications"),
      ]);
      notifyContractComplete(contract.xp_value, contract.title);
      await completeContractAndNotify(contract.xp_value, contract.id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("contract-complete", {
            detail: { title: contract.title, xp: contract.xp_value },
          }),
        );
      }
    } catch (err) {
      console.warn("[missions] contract-complete side effects failed:", err);
    }
  }

  return { ...(contract as DailyContract), ...updates };
}

// ---------------------------------------------------------------------------
// updateOpProgress -- recompute current month's op current_value.
// Same shape as contract progress.
// ---------------------------------------------------------------------------
export async function updateOpProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClassifiedOp | null> {
  if (!userId) return null;

  const monthStart = monthStartLocalISO();
  const monthEnd = monthEndLocalISO(monthStart);

  const { data: op } = await supabase
    .from("classified_ops")
    .select("*")
    .eq("user_id", userId)
    .eq("month_start", monthStart)
    .maybeSingle();

  if (!op) return null;
  if (op.completed) return op as ClassifiedOp;

  const current = await computeProgress(
    supabase,
    userId,
    op.progress_key as ProgressKey,
    monthStart,
    monthEnd,
  );
  const hit = current >= op.target_value;

  const updates: Record<string, unknown> = { current_value: current };
  if (hit) {
    updates.completed = true;
    updates.completed_at = new Date().toISOString();
  }

  await queueOrExecute(
    async () => {
      const { error } = await supabase
        .from("classified_ops")
        .update(updates)
        .eq("id", op.id);
      return { error };
    },
    {
      table: "classified_ops",
      operation: "update",
      payload: updates,
      filter: { id: op.id },
    },
  );

  if (hit && !op.completed) {
    try {
      const [{ completeClassifiedOpAndNotify }, { notifyClassifiedOpComplete }] = await Promise.all([
        import("@/lib/award-and-notify"),
        import("@/lib/notifications"),
      ]);
      notifyClassifiedOpComplete(op.xp_value, op.codename);
      await completeClassifiedOpAndNotify(op.xp_value, op.id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("classified-op-complete", {
            detail: { codename: op.codename, xp: op.xp_value },
          }),
        );
      }
    } catch (err) {
      console.warn("[missions] classified-op-complete side effects failed:", err);
    }
  }

  return { ...(op as ClassifiedOp), ...updates };
}

// ---------------------------------------------------------------------------
// updateMissionsProgress -- shared entry point for hook points.
// Fire-and-forget: do not await the return of this from the
// calling completion handler, but internally run both updates
// in parallel since they're independent.
// ---------------------------------------------------------------------------
export async function updateMissionsProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  if (!userId) return;
  try {
    await Promise.all([
      updateContractProgress(supabase, userId),
      updateOpProgress(supabase, userId),
    ]);
  } catch (err) {
    console.warn("[missions] progress recompute failed:", err);
  }
}
