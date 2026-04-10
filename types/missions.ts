/* ============================================
   BARRAX -- Two-Tier Mission System Types
   Contracts (daily), Classified Ops (monthly),
   XP audit log.
   ============================================ */

// ---------- Progress keys ----------
// A progress_key points at a SQL aggregation inside
// lib/missions/progress.ts::computeProgress. Every key that appears
// in the template pools MUST have a case in that switch.
export type ProgressKey =
  | `reps_exercise:${string}`         // reps_exercise:push_up, squat, burpee, ...
  | "reps_any"
  | "workout_complete_count"
  | "run_distance_m"
  | "meals_logged"
  | "calories_hit_target_day"
  | "protein_g"
  | "new_exercise_logged"
  | "unique_exercises_logged"
  | "water_ml";

// ---------- Contracts (daily) ----------
export type ContractType = "bounty" | "scavenger" | "recon";
export type ContractDifficulty = "easy" | "medium" | "hard";

export interface ContractFitContext {
  trainingDayType: "workout" | "rest" | "run" | "activity" | "unknown";
  rank: number;
}

/** Hand-curated template that defines the mechanics. AI fills in the flavour. */
export interface ContractTemplate {
  type: ContractType;
  difficulty: ContractDifficulty;
  progress_key: ProgressKey;
  target_value: number;
  unit: string;
  xp_value: 25 | 50 | 75;
  /** Hint given to the AI prompt to shape tone and wording. */
  flavour_hint: string;
  /** Optional predicate to drop templates that don't fit the user's current context. */
  fits?: (ctx: ContractFitContext) => boolean;
}

/** One row in the daily_contracts table. */
export interface DailyContract {
  id: string;
  user_id: string;
  date: string;                        // YYYY-MM-DD local
  contract_type: ContractType;
  difficulty: ContractDifficulty;
  title: string;                       // AI-generated
  description: string;                 // AI-generated
  codename: string | null;
  progress_key: ProgressKey;
  target_value: number;
  current_value: number;
  unit: string;
  xp_value: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// ---------- Classified Ops (monthly) ----------
export type OpTier = "standard" | "hard" | "elite";
export type OpCategory = "physical" | "nutrition" | "combined";

export interface OpTemplate {
  tier: OpTier;
  category: OpCategory;
  progress_key: ProgressKey;
  target_value: number;
  unit: string;
  xp_value: 500 | 1000 | 1500;
  /** Hint to the AI prompt for briefing prose. */
  flavour_hint: string;
}

/** One row in the classified_ops table. */
export interface ClassifiedOp {
  id: string;
  user_id: string;
  month_start: string;                 // YYYY-MM-01 local
  tier: OpTier;
  category: OpCategory;
  codename: string;                    // "Operation Iron Wall"
  briefing: string;                    // 80-150 word prose, supports \n\n paragraphs and **bold**
  progress_key: ProgressKey;
  target_value: number;
  current_value: number;
  unit: string;
  xp_value: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// ---------- Shared progress shape ----------
export interface ContractProgress {
  current_value: number;
  target_value: number;
  pct: number;                         // 0..1 clamped
  completed: boolean;
}

// ---------- XP events ----------
/** Known XP sources. Anything not in this union gets coerced to "other". */
export type XpSource =
  | "workout_complete"
  | "run_complete"
  | "daily_contract"
  | "classified_op"
  | "daily_challenge"                  // legacy -- kept so historical rows decode cleanly
  | "badge_earned"
  | "personal_record"
  | "water_goal_hit"
  | "weekly_summary_bonus"
  | "other";

export interface XpEvent {
  id: string;
  user_id: string;
  source: XpSource;
  amount: number;
  reference_id: string | null;
  note: string | null;
  occurred_at: string;
}
