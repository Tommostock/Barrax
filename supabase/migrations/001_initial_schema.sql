-- ============================================================================
-- BARRAX: Initial Database Schema
-- ============================================================================
-- This migration creates every table the app needs from scratch.
-- Each table has:
--   * Row Level Security (RLS) turned on so Supabase enforces per-user access
--   * Four policies (SELECT, INSERT, UPDATE, DELETE) that make sure a user can
--     only touch their own rows
--   * Indexes on columns we query often (user_id, dates, etc.)
--
-- At the bottom there is a trigger that fires whenever a new user signs up
-- through Supabase Auth.  It automatically creates starter rows in profiles,
-- ranks, and streaks so the app never has to worry about missing data.
-- ============================================================================


-- ============================================================================
-- 1. PROFILES
-- ============================================================================
-- Stores user settings and personal info.  The primary key is the same uuid
-- that Supabase Auth assigns, so profiles.id = auth.users.id.
-- ============================================================================

CREATE TABLE profiles (
  id                      uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name                    text,
  age                     int,
  height_cm               decimal,
  fitness_level           text        CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals                   text[],
  default_workout_minutes int         DEFAULT 30,
  calorie_target          int         DEFAULT 2000,
  unit_preference         text        CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric',
  notification_settings   jsonb       DEFAULT '{}',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Turn on RLS so no one can bypass the policies below
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only create their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only edit their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (auth.uid() = id);


-- ============================================================================
-- 2. WEIGHT LOGS
-- ============================================================================
-- One row per weigh-in so we can draw a weight-over-time chart.
-- ============================================================================

CREATE TABLE weight_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  weight_kg  decimal     NOT NULL,
  logged_at  timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_logs_select" ON weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "weight_logs_insert" ON weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weight_logs_update" ON weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "weight_logs_delete" ON weight_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Speed up "show my weight history" queries
CREATE INDEX idx_weight_logs_user_id   ON weight_logs (user_id);
CREATE INDEX idx_weight_logs_logged_at ON weight_logs (logged_at);


-- ============================================================================
-- 3. BODY MEASUREMENTS
-- ============================================================================
-- Tracks circumference measurements (chest, waist, arms, etc.) over time.
-- ============================================================================

CREATE TABLE body_measurements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  chest_cm       decimal,
  waist_cm       decimal,
  hips_cm        decimal,
  left_arm_cm    decimal,
  right_arm_cm   decimal,
  left_thigh_cm  decimal,
  right_thigh_cm decimal,
  logged_at      timestamptz DEFAULT now()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_measurements_select" ON body_measurements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "body_measurements_insert" ON body_measurements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "body_measurements_update" ON body_measurements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "body_measurements_delete" ON body_measurements
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_body_measurements_user_id ON body_measurements (user_id);


-- ============================================================================
-- 4. FOOD PREFERENCES
-- ============================================================================
-- Each user tags foods as "no_go", "maybe", or "approved" so the meal planner
-- can respect their choices.
-- ============================================================================

CREATE TABLE food_preferences (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_name  text        NOT NULL,
  category   text        NOT NULL CHECK (category IN ('no_go', 'maybe', 'approved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_preferences_select" ON food_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "food_preferences_insert" ON food_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "food_preferences_update" ON food_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "food_preferences_delete" ON food_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_food_preferences_user_id ON food_preferences (user_id);


-- ============================================================================
-- 5. WORKOUT PROGRAMMES
-- ============================================================================
-- A weekly workout programme generated by the AI.  programme_data is a JSON
-- blob containing the full schedule (which exercises on which days, etc.).
-- ============================================================================

CREATE TABLE workout_programmes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  week_start     date        NOT NULL,
  programme_data jsonb       NOT NULL,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE workout_programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_programmes_select" ON workout_programmes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "workout_programmes_insert" ON workout_programmes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_programmes_update" ON workout_programmes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "workout_programmes_delete" ON workout_programmes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_workout_programmes_user_id    ON workout_programmes (user_id);
CREATE INDEX idx_workout_programmes_week_start ON workout_programmes (week_start);


-- ============================================================================
-- 6. WORKOUTS
-- ============================================================================
-- A single workout session.  It might belong to a programme or be standalone.
-- status tracks whether it is still upcoming, in progress, done, or skipped.
-- ============================================================================

CREATE TABLE workouts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  programme_id     uuid        REFERENCES workout_programmes ON DELETE SET NULL,
  workout_data     jsonb       NOT NULL,
  status           text        CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped'))
                               DEFAULT 'pending',
  scheduled_date   date        NOT NULL,
  started_at       timestamptz,
  completed_at     timestamptz,
  duration_seconds int,
  xp_earned        int         DEFAULT 0
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts_select" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "workouts_insert" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_update" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "workouts_delete" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_workouts_user_id        ON workouts (user_id);
CREATE INDEX idx_workouts_scheduled_date ON workouts (scheduled_date);


-- ============================================================================
-- 7. WORKOUT EXERCISES
-- ============================================================================
-- Individual exercises within a workout.  order_index controls the display
-- order on-screen.
-- ============================================================================

CREATE TABLE workout_exercises (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id       uuid    NOT NULL REFERENCES workouts ON DELETE CASCADE,
  exercise_name    text    NOT NULL,
  sets_completed   int     DEFAULT 0,
  reps_completed   int,
  duration_seconds int,
  skipped          boolean DEFAULT false,
  order_index      int     NOT NULL
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- workout_exercises does not have a direct user_id column, so we join through
-- the parent workouts table to check ownership.
CREATE POLICY "workout_exercises_select" ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_insert" ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_update" ON workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_delete" ON workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  );

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises (workout_id);


-- ============================================================================
-- 8. EXERCISE LIBRARY
-- ============================================================================
-- A per-user catalogue of exercises.  Each exercise has form cues, target
-- muscles, a difficulty rating (1-5), and a category.
-- ============================================================================

CREATE TABLE exercise_library (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  description text    NOT NULL,
  form_cue    text    NOT NULL,
  muscles     text[]  NOT NULL,
  difficulty  int     NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  category    text    NOT NULL CHECK (category IN ('strength', 'cardio', 'hiit', 'recovery', 'core')),
  min_rank    int     DEFAULT 1,
  is_favourite boolean DEFAULT false,
  user_id     uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE
);

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_library_select" ON exercise_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "exercise_library_insert" ON exercise_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_library_update" ON exercise_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "exercise_library_delete" ON exercise_library
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_exercise_library_user_id ON exercise_library (user_id);


-- ============================================================================
-- 9. RUNS
-- ============================================================================
-- GPS-tracked running sessions.  route_data holds the polyline / coordinate
-- array, splits holds per-km timing data.
-- ============================================================================

CREATE TABLE runs (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workout_id                uuid        REFERENCES workouts ON DELETE SET NULL,
  route_data                jsonb       NOT NULL,
  distance_metres           decimal     NOT NULL,
  duration_seconds          int         NOT NULL,
  avg_pace_seconds_per_km   int         NOT NULL,
  best_pace_seconds_per_km  int         NOT NULL,
  elevation_gain_metres     decimal,
  splits                    jsonb,
  started_at                timestamptz NOT NULL,
  completed_at              timestamptz NOT NULL,
  xp_earned                 int         DEFAULT 0
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs_select" ON runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "runs_insert" ON runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runs_update" ON runs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "runs_delete" ON runs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_runs_user_id ON runs (user_id);


-- ============================================================================
-- 10. MEAL PLANS
-- ============================================================================
-- Weekly meal plans generated by the AI.  plan_data holds breakfast/lunch/
-- dinner/snack for each day.  shopping_list is an auto-generated grocery list.
-- ============================================================================

CREATE TABLE meal_plans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  week_start    date        NOT NULL,
  plan_data     jsonb       NOT NULL,
  shopping_list jsonb,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plans_select" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meal_plans_insert" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plans_update" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meal_plans_delete" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_meal_plans_user_id    ON meal_plans (user_id);
CREATE INDEX idx_meal_plans_week_start ON meal_plans (week_start);


-- ============================================================================
-- 11. MEAL LOGS
-- ============================================================================
-- Tracks whether the user actually ate the meals from their plan.
-- ============================================================================

CREATE TABLE meal_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  meal_plan_id uuid        NOT NULL REFERENCES meal_plans ON DELETE CASCADE,
  day          date        NOT NULL,
  meal_type    text        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten        boolean     DEFAULT false,
  logged_at    timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_logs_select" ON meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_insert" ON meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_update" ON meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_delete" ON meal_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_meal_logs_user_id ON meal_logs (user_id);


-- ============================================================================
-- 12. FAVOURITE MEALS
-- ============================================================================
-- Meals the user has bookmarked so they can quickly add them to future plans.
-- ============================================================================

CREATE TABLE favourite_meals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  meal_data  jsonb       NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favourite_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favourite_meals_select" ON favourite_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favourite_meals_insert" ON favourite_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favourite_meals_update" ON favourite_meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "favourite_meals_delete" ON favourite_meals
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_favourite_meals_user_id ON favourite_meals (user_id);


-- ============================================================================
-- 13. WATER LOGS
-- ============================================================================
-- Each row is one "drink" event — the user tapped "+250 ml" (or similar).
-- ============================================================================

CREATE TABLE water_logs (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount_ml int         NOT NULL,
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs_select" ON water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "water_logs_insert" ON water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "water_logs_update" ON water_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "water_logs_delete" ON water_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_water_logs_user_id   ON water_logs (user_id);
CREATE INDEX idx_water_logs_logged_at ON water_logs (logged_at);


-- ============================================================================
-- 14. RANKS
-- ============================================================================
-- Each user has exactly one rank row (enforced by UNIQUE on user_id).
-- total_xp accumulates across all activities; current_rank is derived from it.
-- rank_history keeps a JSON log of every time the user ranked up.
-- ============================================================================

CREATE TABLE ranks (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid  NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  current_rank int   DEFAULT 1,
  total_xp     int   DEFAULT 0,
  rank_history jsonb DEFAULT '[]'
);

ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranks_select" ON ranks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ranks_insert" ON ranks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ranks_update" ON ranks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ranks_delete" ON ranks
  FOR DELETE USING (auth.uid() = user_id);

-- The UNIQUE constraint on user_id already creates an implicit index, but we
-- list it here for clarity.  Postgres will reuse the unique index.
CREATE INDEX idx_ranks_user_id ON ranks (user_id);


-- ============================================================================
-- 15. STREAKS
-- ============================================================================
-- Tracks consecutive-day activity streaks.  One row per user (UNIQUE).
-- freeze_used_this_week lets the user skip one day without breaking the streak.
-- ============================================================================

CREATE TABLE streaks (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid    NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  current_streak        int     DEFAULT 0,
  longest_streak        int     DEFAULT 0,
  last_active_date      date,
  freeze_used_this_week boolean DEFAULT false,
  streak_history        jsonb   DEFAULT '[]'
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update" ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "streaks_delete" ON streaks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_streaks_user_id ON streaks (user_id);


-- ============================================================================
-- 16. BADGES
-- ============================================================================
-- Achievements / trophies.  badge_key is a unique code like "first_workout"
-- so the app can check "has this user already earned this badge?"
-- ============================================================================

CREATE TABLE badges (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge_key         text        NOT NULL,
  badge_name        text        NOT NULL,
  badge_description text        NOT NULL,
  earned_at         timestamptz DEFAULT now(),

  -- Each user can only earn a given badge once
  UNIQUE (user_id, badge_key)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select" ON badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "badges_insert" ON badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "badges_update" ON badges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "badges_delete" ON badges
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_badges_user_id   ON badges (user_id);
CREATE INDEX idx_badges_badge_key ON badges (badge_key);


-- ============================================================================
-- 17. PERSONAL RECORDS
-- ============================================================================
-- "Best ever" stats: heaviest deadlift, fastest 5 km, longest plank, etc.
-- category is a free-text key like "deadlift_1rm" or "5k_run".
-- ============================================================================

CREATE TABLE personal_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category    text        NOT NULL,
  value       decimal     NOT NULL,
  unit        text        NOT NULL,
  achieved_at timestamptz DEFAULT now(),

  -- One record per category per user
  UNIQUE (user_id, category)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_records_select" ON personal_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "personal_records_insert" ON personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "personal_records_update" ON personal_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "personal_records_delete" ON personal_records
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_personal_records_user_id ON personal_records (user_id);


-- ============================================================================
-- 18. DAILY CHALLENGES
-- ============================================================================
-- The app presents one challenge per day (e.g. "Do 50 push-ups").
-- challenge_data is a JSON object with the challenge details.
-- ============================================================================

CREATE TABLE daily_challenges (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  challenge_data jsonb   NOT NULL,
  date           date    NOT NULL,
  accepted       boolean DEFAULT false,
  completed      boolean DEFAULT false,
  xp_value       int     DEFAULT 0
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_challenges_select" ON daily_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_challenges_insert" ON daily_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_challenges_update" ON daily_challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "daily_challenges_delete" ON daily_challenges
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_daily_challenges_user_id ON daily_challenges (user_id);
CREATE INDEX idx_daily_challenges_date    ON daily_challenges (date);


-- ============================================================================
-- AUTO-CREATE PROFILE, RANK & STREAK ON SIGN-UP
-- ============================================================================
-- When Supabase Auth creates a new user, this trigger fires and inserts
-- starter rows into profiles, ranks, and streaks.  That way the app can
-- always assume those rows exist and never has to handle a "no profile yet"
-- edge case.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with table-owner privileges so it can bypass RLS
SET search_path = public  -- prevent search-path hijacking
AS $$
BEGIN
  -- Create a blank profile for the new user
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Create a starting rank row (rank 1, 0 XP)
  INSERT INTO public.ranks (user_id)
  VALUES (NEW.id);

  -- Create a starting streak row (0-day streak)
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Attach the function to auth.users so it fires on every new sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
