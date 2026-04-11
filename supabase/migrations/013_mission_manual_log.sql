-- ============================================================================
-- BARRAX -- Mission Manual Log
-- Append-only table for user-entered progress toward rep-based contracts
-- and classified ops. Lets the user tap "LOG PROGRESS" on a card and
-- record something like "25 push-ups" without having to start a full
-- workout in the player.
--
-- This table is ONLY read by lib/missions/progress.ts -- it does not
-- feed workout history, personal records, or XP. It's a lightweight
-- progress-only tally.
-- ============================================================================

CREATE TABLE IF NOT EXISTS mission_manual_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_key text        NOT NULL,                -- matches ProgressKey in types/missions.ts
  amount       int         NOT NULL CHECK (amount > 0),
  logged_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_manual_log_user_logged
  ON mission_manual_log(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_manual_log_user_key
  ON mission_manual_log(user_id, progress_key);

ALTER TABLE mission_manual_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_manual_log_select" ON mission_manual_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mission_manual_log_insert" ON mission_manual_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Deliberately NO update/delete policies -- append-only, same pattern
-- as xp_events. Mistakes are offset with a new row rather than edited.

NOTIFY pgrst, 'reload schema';
