/* ============================================
   Classified Op Template Pool
   Hand-curated monthly operation templates. Same pattern
   as the contract pool: mechanics-only, AI fills in the
   codename and briefing prose at generation time.

   Tiers:
     standard -> 500 XP  (consistent habit)
     hard     -> 1000 XP (cumulative volume)
     elite    -> 1500 XP (demanding)

   Categories rotate month-to-month:
     physical -> nutrition -> combined -> physical -> ...

   Every progress_key here MUST have a case in
   lib/missions/progress.ts::computeProgress.
   ============================================ */

import type { OpTemplate } from "@/types/missions";

export const OP_POOL: OpTemplate[] = [
  // ---- STANDARD (500 XP) --------------------------------------------------
  {
    tier: "standard",
    category: "physical",
    progress_key: "workout_complete_count",
    target_value: 15,
    unit: "workouts",
    xp_value: 500,
    flavour_hint: "15 total workouts this month, steady drumbeat of training",
  },
  {
    tier: "standard",
    category: "physical",
    progress_key: "reps_exercise:push_up",
    target_value: 1000,
    unit: "reps",
    xp_value: 500,
    flavour_hint: "1000 push-ups accumulated across the month",
  },
  {
    tier: "standard",
    category: "nutrition",
    progress_key: "meals_logged",
    target_value: 60,
    unit: "entries",
    xp_value: 500,
    flavour_hint: "60 logged meals -- discipline of the fork",
  },
  {
    tier: "standard",
    category: "combined",
    progress_key: "unique_exercises_logged",
    target_value: 10,
    unit: "exercises",
    xp_value: 500,
    flavour_hint: "10 distinct exercises explored this month",
  },
  {
    tier: "standard",
    category: "nutrition",
    progress_key: "calories_hit_target_day",
    target_value: 20,
    unit: "days",
    xp_value: 500,
    flavour_hint: "hit your calorie target on 20 days this month",
  },

  // ---- HARD (1000 XP) -----------------------------------------------------
  {
    tier: "hard",
    category: "physical",
    progress_key: "run_distance_m",
    target_value: 50000,
    unit: "metres",
    xp_value: 1000,
    flavour_hint: "50 km total distance covered this month",
  },
  {
    tier: "hard",
    category: "physical",
    progress_key: "reps_exercise:burpee",
    target_value: 500,
    unit: "reps",
    xp_value: 1000,
    flavour_hint: "500 burpees through the month -- the hardest currency",
  },
  {
    tier: "hard",
    category: "nutrition",
    progress_key: "meals_logged",
    target_value: 90,
    unit: "entries",
    xp_value: 1000,
    flavour_hint: "90 logged meals -- a month of total tracking discipline",
  },

  // ---- ELITE (1500 XP) ----------------------------------------------------
  {
    tier: "elite",
    category: "physical",
    progress_key: "reps_exercise:squat",
    target_value: 2500,
    unit: "reps",
    xp_value: 1500,
    flavour_hint: "2500 squats this month -- the iron wall",
  },
  {
    tier: "elite",
    category: "physical",
    progress_key: "reps_any",
    target_value: 5000,
    unit: "reps",
    xp_value: 1500,
    flavour_hint: "5000 total reps of any exercise -- maximum volume",
  },
  {
    tier: "elite",
    category: "nutrition",
    progress_key: "protein_g",
    target_value: 4500,
    unit: "grams",
    xp_value: 1500,
    flavour_hint: "4500 grams of protein this month -- relentless fuel",
  },
];
