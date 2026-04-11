/* ============================================
   Physical Fitness Test (PFT) types.
   Backed by the fitness_test_results table (migration 014).

   Three quarterly benchmark tests:
   - push_up_max  (count-based, unit "reps")
   - plank_hold   (timer-based, unit "seconds")
   - run_1500m    (2,414 m / 1.5 mile GPS run, unit "seconds")
   ============================================ */

export type FitnessTestType = "push_up_max" | "plank_hold" | "run_1500m";
export type FitnessTestUnit = "reps" | "seconds";

/** One row in fitness_test_results. */
export interface FitnessTestResult {
  id: string;
  user_id: string;
  test_type: FitnessTestType;
  value: number;
  unit: FitnessTestUnit;
  /** For run_1500m: points at the runs.id row that captured this result. */
  source_run_id: string | null;
  measured_at: string;
}

/**
 * Aggregated summary for a single test type, used by the PFT hub screen.
 * `best` is the all-time best (lowest duration for run_1500m, highest
 * value for the others). `history` is oldest-first so recharts can
 * plot a trajectory line without an extra reverse().
 */
export interface FitnessTestSummary {
  test_type: FitnessTestType;
  best: FitnessTestResult | null;
  latest: FitnessTestResult | null;
  history: FitnessTestResult[];
  days_since_latest: number | null;
}

/** Static metadata for rendering each test in the hub. */
export interface FitnessTestMeta {
  type: FitnessTestType;
  label: string;             // e.g. "Push-Up Max"
  unit: FitnessTestUnit;
  lowerIsBetter: boolean;    // true for run_1500m, false for the others
  personalRecordCategory: string; // key in personal_records table
}

export const FITNESS_TEST_META: Record<FitnessTestType, FitnessTestMeta> = {
  push_up_max: {
    type: "push_up_max",
    label: "Push-Up Max",
    unit: "reps",
    lowerIsBetter: false,
    personalRecordCategory: "most_pushups",
  },
  plank_hold: {
    type: "plank_hold",
    label: "Plank Hold",
    unit: "seconds",
    lowerIsBetter: false,
    personalRecordCategory: "longest_plank",
  },
  run_1500m: {
    type: "run_1500m",
    label: "1.5-Mile Run",
    unit: "seconds",
    lowerIsBetter: true,
    personalRecordCategory: "fastest_1500m",
  },
};
