-- ============================================================================
-- 4. TRAINING SCHEDULE
-- ============================================================================
-- Adds a training_schedule column to profiles so users can define what type
-- of activity each day of the week should be: workout, rest, run, or a
-- custom activity like football.  The programme generator reads these rules
-- and builds the week around them.
--
-- Format: JSONB object keyed by day name, e.g.
-- {
--   "monday":    { "type": "workout" },
--   "tuesday":   { "type": "activity", "activity_name": "Football", "duration_minutes": 60 },
--   "wednesday": { "type": "rest" },
--   "thursday":  { "type": "workout" },
--   "friday":    { "type": "workout" },
--   "saturday":  { "type": "rest" },
--   "sunday":    { "type": "run" }
-- }
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN training_schedule jsonb DEFAULT '{}';
