/* ============================================
   Macro target calculation
   Shared helper so every page (dashboard, rations,
   diary) derives gram targets the same way from the
   user's calorie goal + their chosen P/C/F split.
   ============================================ */

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroSplit {
  protein: number; // % of calories
  carbs: number;   // % of calories
  fat: number;     // % of calories
}

/**
 * Turn a daily calorie goal + a macro split into gram targets.
 * Protein and carbs = 4 kcal/g, fat = 9 kcal/g.
 *
 * Percentages default to the balanced 30/40/30 split when no
 * profile override is present (new users or pre-migration rows).
 */
export function calculateMacroTargets(
  calorieTarget: number,
  proteinPct: number = 30,
  carbPct: number = 40,
  fatPct: number = 30,
): MacroTargets {
  return {
    calories: calorieTarget,
    protein: Math.round((calorieTarget * proteinPct) / 100 / 4),
    carbs:   Math.round((calorieTarget * carbPct)    / 100 / 4),
    fat:     Math.round((calorieTarget * fatPct)     / 100 / 9),
  };
}

/** Preset ratios users can tap to load without typing numbers. */
export const MACRO_PRESETS: Array<{
  name: string;
  description: string;
  protein: number;
  carbs: number;
  fat: number;
}> = [
  {
    name: "BALANCED",
    description: "Standard split for general fitness",
    protein: 30,
    carbs: 40,
    fat: 30,
  },
  {
    name: "HIGH-PROTEIN",
    description: "Muscle building & recomposition",
    protein: 40,
    carbs: 35,
    fat: 25,
  },
  {
    name: "LOW-CARB",
    description: "Fat loss, moderate carbs",
    protein: 35,
    carbs: 20,
    fat: 45,
  },
  {
    name: "KETO",
    description: "Very low carb, high fat",
    protein: 25,
    carbs: 5,
    fat: 70,
  },
];

/** Returns true when the three percentages are a valid split. */
export function isValidMacroSplit(
  protein: number,
  carbs: number,
  fat: number,
): boolean {
  return (
    Number.isInteger(protein) &&
    Number.isInteger(carbs) &&
    Number.isInteger(fat) &&
    protein >= 0 &&
    carbs >= 0 &&
    fat >= 0 &&
    protein + carbs + fat === 100
  );
}
