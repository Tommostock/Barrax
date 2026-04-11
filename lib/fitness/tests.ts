/* ============================================
   Physical Fitness Test library.
   Single-entry write + read helpers for the PFT hub.

   recordTestResult
     - inserts into fitness_test_results (append-only history)
     - also upserts personal_records for "best ever" so the records
       screen stays in sync
     - returns { isPR } so the UI can fire a fanfare toast

   loadFitnessTestSummaries
     - loads the 3 most recent summaries for a user
     - each summary bundles best, latest, and the last 20 history
       rows so the hub can draw a trajectory sparkline without
       separate round-trips
   ============================================ */

"use client";

import { createClient } from "@/lib/supabase/client";
import { checkPersonalRecord } from "@/lib/records";
import {
  FITNESS_TEST_META,
  type FitnessTestResult,
  type FitnessTestSummary,
  type FitnessTestType,
  type FitnessTestUnit,
} from "@/types/fitness";

const ALL_TEST_TYPES: FitnessTestType[] = ["push_up_max", "plank_hold", "run_1500m"];

/** Write a test result, update personal_records, and report whether it was a PR. */
export async function recordTestResult(args: {
  userId: string;
  testType: FitnessTestType;
  value: number;
  unit: FitnessTestUnit;
  sourceRunId?: string;
}): Promise<{ isPR: boolean }> {
  const supabase = createClient();

  // 1. Append-only history row
  const { error: insertError } = await supabase.from("fitness_test_results").insert({
    user_id: args.userId,
    test_type: args.testType,
    value: args.value,
    unit: args.unit,
    source_run_id: args.sourceRunId ?? null,
  });

  if (insertError) {
    console.error("[fitness] failed to insert test result:", insertError);
    return { isPR: false };
  }

  // 2. Mirror to personal_records for the records screen.
  //    checkPersonalRecord handles "fastest_*" categories automatically
  //    (lower value wins). For fastest_1500m we pass the duration in
  //    seconds; the run tracker already uses the same unit.
  const meta = FITNESS_TEST_META[args.testType];
  const isPR = await checkPersonalRecord(args.userId, {
    category: meta.personalRecordCategory,
    value: args.value,
    unit: args.unit,
  });

  return { isPR };
}

/** Load all 3 PFT summaries for the hub screen in a single round trip. */
export async function loadFitnessTestSummaries(
  userId: string,
): Promise<Record<FitnessTestType, FitnessTestSummary>> {
  const supabase = createClient();

  // One query fetches the last 20 rows per test type (60 total).
  // Supabase JS doesn't support PARTITION BY so we pull all rows
  // in the relevant window and bucket them client-side. Fine at
  // single-user scale — a user will have dozens at most.
  const { data, error } = await supabase
    .from("fitness_test_results")
    .select("*")
    .eq("user_id", userId)
    .in("test_type", ALL_TEST_TYPES)
    .order("measured_at", { ascending: false })
    .limit(60);

  const summaries: Record<FitnessTestType, FitnessTestSummary> = {
    push_up_max: emptySummary("push_up_max"),
    plank_hold: emptySummary("plank_hold"),
    run_1500m: emptySummary("run_1500m"),
  };

  if (error || !data) {
    if (error) console.error("[fitness] failed to load test summaries:", error);
    return summaries;
  }

  for (const type of ALL_TEST_TYPES) {
    const meta = FITNESS_TEST_META[type];
    const rows = (data as FitnessTestResult[]).filter((r) => r.test_type === type);
    if (rows.length === 0) continue;

    // rows are newest-first because of the order clause above
    const latest = rows[0];
    const best = meta.lowerIsBetter
      ? rows.reduce((b, r) => (r.value < b.value ? r : b), rows[0])
      : rows.reduce((b, r) => (r.value > b.value ? r : b), rows[0]);

    // history for the sparkline: oldest-first, up to 20 rows
    const history = [...rows].reverse().slice(-20);

    const daysSince = Math.floor(
      (Date.now() - new Date(latest.measured_at).getTime()) / (24 * 60 * 60 * 1000),
    );

    summaries[type] = {
      test_type: type,
      best,
      latest,
      history,
      days_since_latest: daysSince,
    };
  }

  return summaries;
}

function emptySummary(type: FitnessTestType): FitnessTestSummary {
  return {
    test_type: type,
    best: null,
    latest: null,
    history: [],
    days_since_latest: null,
  };
}

/**
 * Helper for formatting a test value for display. Duration tests
 * show mm:ss, reps show as a bare integer.
 */
export function formatTestValue(value: number, unit: FitnessTestUnit): string {
  if (unit === "reps") return String(value);
  // seconds → mm:ss
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Is any test "overdue" (≥ 90 days since last attempt, or never taken)?
 * Used to paint the hub header with an OVERDUE tag.
 */
export function hasOverdueTest(
  summaries: Record<FitnessTestType, FitnessTestSummary>,
): boolean {
  return ALL_TEST_TYPES.some((type) => {
    const s = summaries[type];
    if (!s.latest) return true;
    return (s.days_since_latest ?? 0) >= 90;
  });
}
