/* ============================================
   BARRAX — TypeScript Type Definitions
   Central type definitions for the entire app.
   ============================================ */

// --- Training Schedule ---
// Defines what each day of the week should be: workout, rest, run,
// or a custom activity (e.g. football).  Stored in profiles.training_schedule.
export type DayType = "workout" | "rest" | "run" | "activity";

export interface ScheduleDay {
  type: DayType;
  activity_name?: string;      // Required when type is "activity" (e.g. "Football")
  duration_minutes?: number;   // Duration for activities (e.g. 60 for football)
}

export type TrainingSchedule = {
  [day in "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"]?: ScheduleDay;
};

// --- User Profile ---
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type UnitPreference = "metric" | "imperial";

export interface Profile {
  id: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  fitness_level: FitnessLevel;
  goals: string[];
  default_workout_minutes: number;
  calorie_target: number;
  unit_preference: UnitPreference;
  notification_settings: NotificationSettings;
  training_schedule: TrainingSchedule;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  morning_mission: boolean;
  missed_workout: boolean;
  streak_warning: boolean;
  water_reminder: boolean;
  weekly_programme: boolean;
  rank_up: boolean;
  personal_record: boolean;
  reminder_time: string; // e.g. "07:00"
  quiet_start: string;   // e.g. "22:00"
  quiet_end: string;     // e.g. "06:00"
}

// --- Food Preferences ---
export type FoodCategory = "no_go" | "maybe" | "approved";

export interface FoodPreference {
  id: string;
  user_id: string;
  food_name: string;
  category: FoodCategory;
  created_at: string;
}

// --- Weight & Body ---
export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  logged_at: string;
}

// --- Workouts ---
export type WorkoutStatus = "pending" | "in_progress" | "complete" | "skipped";
export type ExerciseCategory = "strength" | "cardio" | "hiit" | "recovery" | "core";

export interface WorkoutProgramme {
  id: string;
  user_id: string;
  week_start: string;
  programme_data: ProgrammeDay[];
  created_at: string;
}

export interface ProgrammeDay {
  day: string; // "monday", "tuesday", etc.
  type: string; // "upper_push", "cardio", "rest", etc.
  workout_name: string;
  duration_minutes: number;
  is_rest_day: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  programme_id: string | null;
  workout_data: WorkoutData;
  status: WorkoutStatus;
  scheduled_date: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  xp_earned: number;
}

export interface WorkoutData {
  name: string;
  type: string;
  duration_minutes: number;
  focus?: string;
  warmup: WorkoutExercise[];
  exercises: WorkoutExercise[];
  cooldown: WorkoutExercise[];
  xp_value: number;
  // Activity-only fields (set by generate-programme for custom activities)
  is_activity?: boolean;
  estimated_calories?: number;
}

export interface WorkoutExercise {
  name: string;
  description: string;
  form_cue: string;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
  difficulty: number;
  muscles: string[];
}

export interface WorkoutExerciseLog {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number | null;
  duration_seconds: number | null;
  skipped: boolean;
  order_index: number;
}

// --- Exercise Library ---
export interface Exercise {
  id: string;
  name: string;
  description: string;
  form_cue: string;
  muscles: string[];
  difficulty: number;
  category: ExerciseCategory;
  min_rank: number;
  is_favourite: boolean;
  user_id: string;
}

// --- Runs ---
export interface Run {
  id: string;
  user_id: string;
  workout_id: string | null;
  route_data: GpsPoint[];
  distance_metres: number;
  duration_seconds: number;
  avg_pace_seconds_per_km: number;
  best_pace_seconds_per_km: number;
  elevation_gain_metres: number | null;
  splits: RunSplit[];
  started_at: string;
  completed_at: string;
  xp_earned: number;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude: number | null;
  speed: number | null;
}

export interface RunSplit {
  distance_km: number;
  pace_seconds_per_km: number;
  elapsed_seconds: number;
}

// --- Nutrition ---
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlan {
  id: string;
  user_id: string;
  week_start: string;
  plan_data: MealPlanDay[];
  shopping_list: ShoppingItem[];
  created_at: string;
}

export interface MealPlanDay {
  day: string;
  meals: Meal[];
}

export interface Meal {
  meal_type: MealType;
  name: string;
  ingredients: MealIngredient[];
  method: string[];
  prep_time_minutes: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_maybe_food: boolean; // true if contains a MAYBE list food
}

export interface MealIngredient {
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  section: "produce" | "meat" | "dairy" | "pantry" | "frozen";
  checked: boolean;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_plan_id: string;
  day: string;
  meal_type: MealType;
  eaten: boolean;
  logged_at: string;
}

export interface FavouriteMeal {
  id: string;
  user_id: string;
  meal_data: Meal;
  created_at: string;
}

// --- Water ---
export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

// --- Gamification ---
export interface Rank {
  id: string;
  user_id: string;
  current_rank: number;
  total_xp: number;
  rank_history: RankEvent[];
}

export interface RankEvent {
  rank: number;
  title: string;
  achieved_at: string;
  total_xp: number;
}

// All 12 military ranks with XP thresholds
export const RANK_THRESHOLDS = [
  { rank: 1, title: "Recruit", xp: 0, unlocks: "Basic exercises, basic meals" },
  { rank: 2, title: "Private", xp: 200, unlocks: "Challenge missions unlock" },
  { rank: 3, title: "Lance Corporal", xp: 500, unlocks: "Intermediate exercise variations" },
  { rank: 4, title: "Corporal", xp: 1000, unlocks: "HIIT workout type unlocks" },
  { rank: 5, title: "Sergeant", xp: 2000, unlocks: "Run programmes unlock" },
  { rank: 6, title: "Staff Sergeant", xp: 3500, unlocks: "Advanced exercise variations" },
  { rank: 7, title: "Warrant Officer", xp: 5500, unlocks: "Custom workout builder" },
  { rank: 8, title: "Lieutenant", xp: 8000, unlocks: "Meal plan customisation options" },
  { rank: 9, title: "Captain", xp: 12000, unlocks: "Elite exercise variations" },
  { rank: 10, title: "Major", xp: 17000, unlocks: "All features unlocked" },
  { rank: 11, title: "Colonel", xp: 24000, unlocks: "Prestige badge" },
  { rank: 12, title: "General", xp: 33000, unlocks: "Full prestige, all badges" },
] as const;

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  freeze_used_this_week: boolean;
  streak_history: StreakEvent[];
}

export interface StreakEvent {
  date: string;
  type: "active" | "freeze" | "break";
}

export interface Badge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  category: string;
  value: number;
  unit: string;
  achieved_at: string;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_data: ChallengeData;
  date: string;
  accepted: boolean;
  completed: boolean;
  xp_value: number;
}

export interface ChallengeData {
  title: string;
  description: string;
  target: number;
  unit: string;
  type: string;
}

// --- Onboarding State ---
export interface OnboardingData {
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: FitnessLevel;
  goals: string[];
  default_workout_minutes: number;
  food_preferences: {
    no_go: string[];
    maybe: string[];
    approved: string[];
  };
  calorie_target: number;
  unit_preference: UnitPreference;
  notification_settings: NotificationSettings;
}

// --- Food Diary ---
export type FoodSource = "manual" | "barcode" | "meal_plan" | "search";

export interface FoodDiaryEntry {
  id: string;
  user_id: string;
  food_name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string | null;
  meal_type: MealType;
  source: FoodSource;
  logged_at: string;
}

export interface FoodLookupResult {
  food_name: string;
  brand: string;
  barcode: string;
  image_url: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  salt_g: number;
}
