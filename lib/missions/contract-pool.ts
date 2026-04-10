/* ============================================
   Contract Template Pool
   Hand-curated daily-contract templates. Mechanics-only --
   target_value, progress_key, unit, xp_value are all fixed
   here so the progress engine can verify completion. AI
   generates title/description at generation time using the
   flavour_hint as context.

   Difficulty tiers:
     easy   -> 25 XP
     medium -> 50 XP
     hard   -> 75 XP

   Types:
     bounty    -> hit a specific measurable target
     scavenger -> log / track everything across the day
     recon     -> try something new or unusual

   Every progress_key used here MUST have a case in
   lib/missions/progress.ts::computeProgress.
   ============================================ */

import type { ContractTemplate } from "@/types/missions";

export const CONTRACT_POOL: ContractTemplate[] = [
  // ---- BOUNTY -------------------------------------------------------------
  {
    type: "bounty",
    difficulty: "easy",
    progress_key: "reps_exercise:push_up",
    target_value: 25,
    unit: "reps",
    xp_value: 25,
    flavour_hint: "25 push-ups today, any time, any way",
  },
  {
    type: "bounty",
    difficulty: "medium",
    progress_key: "reps_exercise:push_up",
    target_value: 75,
    unit: "reps",
    xp_value: 50,
    flavour_hint: "75 push-ups today, split how you like",
  },
  {
    type: "bounty",
    difficulty: "hard",
    progress_key: "reps_exercise:push_up",
    target_value: 150,
    unit: "reps",
    xp_value: 75,
    flavour_hint: "150 push-ups today -- volume target, break them up",
  },
  {
    type: "bounty",
    difficulty: "medium",
    progress_key: "reps_exercise:squat",
    target_value: 100,
    unit: "reps",
    xp_value: 50,
    flavour_hint: "100 bodyweight squats today",
  },
  {
    type: "bounty",
    difficulty: "hard",
    progress_key: "reps_exercise:burpee",
    target_value: 50,
    unit: "reps",
    xp_value: 75,
    flavour_hint: "50 burpees today -- the ultimate test",
  },
  {
    type: "bounty",
    difficulty: "hard",
    progress_key: "run_distance_m",
    target_value: 5000,
    unit: "metres",
    xp_value: 75,
    flavour_hint: "5 km run, recorded in the run tracker",
    fits: ({ rank }) => rank >= 5,
  },
  {
    type: "bounty",
    difficulty: "medium",
    progress_key: "workout_complete_count",
    target_value: 1,
    unit: "workouts",
    xp_value: 50,
    flavour_hint: "complete today's scheduled workout",
    fits: ({ trainingDayType }) => trainingDayType === "workout",
  },

  // ---- SCAVENGER ----------------------------------------------------------
  {
    type: "scavenger",
    difficulty: "easy",
    progress_key: "meals_logged",
    target_value: 3,
    unit: "entries",
    xp_value: 25,
    flavour_hint: "log 3 meals in the food diary",
  },
  {
    type: "scavenger",
    difficulty: "medium",
    progress_key: "meals_logged",
    target_value: 5,
    unit: "entries",
    xp_value: 50,
    flavour_hint: "log 3 meals and 2 snacks -- total 5 entries",
  },
  {
    type: "scavenger",
    difficulty: "hard",
    progress_key: "protein_g",
    target_value: 150,
    unit: "grams",
    xp_value: 75,
    flavour_hint: "hit 150 grams of protein today",
  },
  {
    type: "scavenger",
    difficulty: "easy",
    progress_key: "water_ml",
    target_value: 2000,
    unit: "ml",
    xp_value: 25,
    flavour_hint: "drink 2 litres of water today",
  },

  // ---- RECON --------------------------------------------------------------
  {
    type: "recon",
    difficulty: "medium",
    progress_key: "new_exercise_logged",
    target_value: 1,
    unit: "exercise",
    xp_value: 50,
    flavour_hint: "log an exercise you have never done before",
  },
  {
    type: "recon",
    difficulty: "hard",
    progress_key: "unique_exercises_logged",
    target_value: 3,
    unit: "exercises",
    xp_value: 75,
    flavour_hint: "three different exercises today",
  },
];
