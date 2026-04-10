/* ============================================
   Contract + Op Template Selection
   Pure functions that pick the right template given
   historical context and the user's current situation.
   No I/O -- the caller (generator routes) passes in
   all required inputs.
   ============================================ */

import type {
  ContractTemplate,
  OpTemplate,
  OpTier,
  OpCategory,
  ContractDifficulty,
  ContractType,
  TrainingSchedule,
  ScheduleDay,
} from "@/types";

// ----------- Contract selection -------------------------------------------

export interface ContractRecentRow {
  contract_type: ContractType;
  difficulty: ContractDifficulty;
  progress_key: string;
  date: string;
}

export interface PickContractArgs {
  pool: ContractTemplate[];
  recent: ContractRecentRow[];          // last 7 days, newest first
  trainingSchedule: TrainingSchedule;   // from profiles.training_schedule
  rank: number;
}

/**
 * Score-based selection so the system rotates types, avoids repeats
 * of the same progress_key, and respects template `fits` predicates.
 */
export function pickContractTemplate({
  pool,
  recent,
  trainingSchedule,
  rank,
}: PickContractArgs): ContractTemplate {
  const trainingDayType = getTrainingDayType(trainingSchedule);
  const recentTypes3 = new Set(recent.slice(0, 3).map((r) => r.contract_type));
  const recentKeys7 = new Set(recent.map((r) => r.progress_key));
  const yesterdayDifficulty = recent[0]?.difficulty;

  // 1. Apply `fits` predicates
  const filtered = pool.filter((t) => {
    if (!t.fits) return true;
    return t.fits({ trainingDayType, rank });
  });

  const candidates = filtered.length > 0 ? filtered : pool;

  // 2. Score each candidate
  const scored = candidates.map((t) => {
    let score = 0;
    if (recentTypes3.has(t.type)) score -= 5;
    if (recentKeys7.has(t.progress_key)) score -= 10;
    if (yesterdayDifficulty && t.difficulty === yesterdayDifficulty) score -= 2;
    score += Math.random();   // jitter so ties are broken randomly
    return { t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.t ?? pool[0];
}

function getTrainingDayType(
  schedule: TrainingSchedule,
): "workout" | "rest" | "run" | "activity" | "unknown" {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const today = days[new Date().getDay()];
  const entry: ScheduleDay | undefined = schedule?.[today];
  if (!entry) return "unknown";
  return entry.type;
}

// ----------- Classified Op selection --------------------------------------

export interface OpRecentRow {
  tier: OpTier;
  category: OpCategory;
  progress_key: string;
  completed: boolean;
  month_start: string;
}

export interface PickOpArgs {
  pool: OpTemplate[];
  recent: OpRecentRow[];   // last 3 months, newest first
  rank: number;
}

const CATEGORY_ORDER: OpCategory[] = ["physical", "nutrition", "combined"];

/**
 * Rotates category month-to-month, ramps tier over time (with compassion
 * for users who didn't finish the previous op), excludes recently-used
 * progress keys, and random-picks from the remainder.
 */
export function pickOpTemplate({ pool, recent, rank }: PickOpArgs): OpTemplate {
  // 1. Category rotation: pick next category after the previous one
  const previousCategory = recent[0]?.category;
  let targetCategory: OpCategory;
  if (!previousCategory) {
    targetCategory = "physical";
  } else {
    const idx = CATEGORY_ORDER.indexOf(previousCategory);
    targetCategory = CATEGORY_ORDER[(idx + 1) % CATEGORY_ORDER.length];
  }

  // 2. Tier ramp based on history count and completion of last op
  const monthsCount = recent.length;
  let targetTier: OpTier;
  if (monthsCount < 2) {
    targetTier = "standard";
  } else if (monthsCount === 2) {
    targetTier = "hard";
  } else {
    targetTier = rank >= 8 ? "elite" : "hard";
  }

  // Compassion: if the last op was incomplete, drop one tier
  if (recent[0] && !recent[0].completed) {
    if (targetTier === "elite") targetTier = "hard";
    else if (targetTier === "hard") targetTier = "standard";
  }

  // 3. Filter to tier + category, exclude recent progress keys
  const recentKeys = new Set(recent.map((r) => r.progress_key));
  let candidates = pool.filter(
    (t) => t.tier === targetTier && t.category === targetCategory && !recentKeys.has(t.progress_key),
  );

  // 4. Back off filters if nothing matches
  if (candidates.length === 0) {
    candidates = pool.filter((t) => t.tier === targetTier && t.category === targetCategory);
  }
  if (candidates.length === 0) {
    candidates = pool.filter((t) => t.category === targetCategory);
  }
  if (candidates.length === 0) {
    candidates = pool;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
