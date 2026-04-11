-- ============================================================================
-- BARRAX -- Physical Fitness Test protocol + Challenge Runs
--
-- 1. fitness_test_results: append-only history of PFT attempts (push-up
--    max, plank hold, 1.5-mile run). Every attempt is recorded so we can
--    plot trajectory over time. The existing personal_records table is
--    still updated in parallel with the "best ever" value so the records
--    screen keeps working.
--
-- 2. runs.challenge_distance_m: optional column on the existing runs
--    table. When set, the run was a preset-distance benchmark (1 mi /
--    2.4 km / 1.5 mi / 5 km / 10 km) and the auto-stop kicked in at
--    exactly that distance. PRs per challenge are derived on-the-fly via
--    MIN(duration_seconds) grouped by challenge_distance_m, and also
--    copied into personal_records so the records UI reads from one place.
-- ============================================================================

-- 1.1 fitness_test_results ----------------------------------------------------
CREATE TABLE IF NOT EXISTS fitness_test_results (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  test_type   text        NOT NULL CHECK (test_type IN (
                            'push_up_max',
                            'plank_hold',
                            'run_1500m'
                          )),
  value       int         NOT NULL CHECK (value > 0),
  unit        text        NOT NULL,                    -- 'reps' | 'seconds'

  -- Optional: for run_1500m this links to the runs row that powered the result
  source_run_id uuid      REFERENCES runs(id) ON DELETE SET NULL,

  measured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fitness_test_results_user_type
  ON fitness_test_results(user_id, test_type, measured_at DESC);

ALTER TABLE fitness_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fitness_test_results_select" ON fitness_test_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fitness_test_results_insert" ON fitness_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- append-only: deliberately no update/delete policies, matches xp_events


-- 1.2 Extend runs with optional challenge distance ---------------------------
ALTER TABLE runs
  ADD COLUMN IF NOT EXISTS challenge_distance_m int;

-- Partial index so PR queries grouped by challenge_distance_m stay fast,
-- without paying indexing cost for the normal (free-run) rows where
-- challenge_distance_m is NULL.
CREATE INDEX IF NOT EXISTS idx_runs_user_challenge
  ON runs(user_id, challenge_distance_m)
  WHERE challenge_distance_m IS NOT NULL;

NOTIFY pgrst, 'reload schema';
