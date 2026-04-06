/* ============================================
   Calorie Burn Estimation
   Estimates calories burned during bodyweight
   workouts based on exercise type and duration.
   Uses MET (Metabolic Equivalent of Task) values.
   ============================================ */

// MET values for different exercise categories
// MET = calories burned per kg of body weight per hour
const MET_VALUES: Record<string, number> = {
  strength: 5.0,     // Bodyweight strength training
  upper_push: 5.0,
  upper_pull: 5.0,
  lower_body: 5.5,
  core: 4.0,
  cardio: 7.0,       // Running, high knees, etc.
  hiit: 8.0,         // High intensity interval training
  full_body: 6.0,
  recovery: 2.5,     // Stretching, yoga
};

// Default body weight to use if user hasn't logged any (70kg)
const DEFAULT_WEIGHT_KG = 70;

/* Calculate estimated calories burned.
   Formula: Calories = MET × weight(kg) × duration(hours)
   This is a rough estimate — real calorie burn varies by
   individual fitness level, body composition, and effort. */
export function estimateCaloriesBurned(
  workoutType: string,
  durationSeconds: number,
  bodyWeightKg?: number
): number {
  const met = MET_VALUES[workoutType] ?? MET_VALUES.strength;
  const weight = bodyWeightKg ?? DEFAULT_WEIGHT_KG;
  const hours = durationSeconds / 3600;

  return Math.round(met * weight * hours);
}

/* Get a description of the calorie estimate accuracy */
export function getCalorieEstimateLabel(workoutType: string): string {
  const met = MET_VALUES[workoutType] ?? 5.0;
  if (met >= 7) return "HIGH BURN";
  if (met >= 5) return "MODERATE BURN";
  return "LOW BURN";
}
