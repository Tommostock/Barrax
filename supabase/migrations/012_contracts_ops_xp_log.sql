-- ============================================================================
-- BARRAX -- Two-Tier Mission System (Contracts + Classified Ops + XP Log)
--
-- Three new tables:
--   1. daily_contracts   -- one per user per day, Bounty/Scavenger/Recon
--   2. classified_ops    -- one per user per calendar month, tiered objectives
--   3. xp_events         -- append-only audit log of every XP gain
--
-- All machine-verifiable: the client-side progress engine in
-- lib/missions/progress.ts re-reads workout_exercises / food_diary / runs
-- for the period and writes the aggregate back to current_value.
-- AI is only used to generate flavour text (title, description, briefing).
--
-- Legacy daily_challenges + challenge_events tables are intentionally
-- untouched -- historical data stays queryable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. daily_contracts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_contracts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          date        NOT NULL,                                 -- local YYYY-MM-DD

  contract_type text        NOT NULL CHECK (contract_type IN ('bounty','scavenger','recon')),
  difficulty    text        NOT NULL CHECK (difficulty    IN ('easy','medium','hard')),
  title         text        NOT NULL,                                 -- AI-generated, tactical flavour
  description   text        NOT NULL,                                 -- AI-generated, 1-2 sentences
  codename      text,                                                 -- optional nickname

  -- Progress tracking (hand-curated from the template pool, machine-verifiable)
  progress_key  text        NOT NULL,                                 -- see lib/missions/progress.ts
  target_value  int         NOT NULL CHECK (target_value > 0),
  current_value int         NOT NULL DEFAULT 0,
  unit          text        NOT NULL,                                 -- "reps","seconds","meals",...

  xp_value      int         NOT NULL CHECK (xp_value BETWEEN 25 AND 100),

  completed     boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_contracts_user_date
  ON daily_contracts(user_id, date DESC);

ALTER TABLE daily_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_contracts_select" ON daily_contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_contracts_insert" ON daily_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_contracts_update" ON daily_contracts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_contracts_delete" ON daily_contracts
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. classified_ops
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classified_ops (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start   date        NOT NULL,                                 -- always day 01 of month (local)

  tier          text        NOT NULL CHECK (tier     IN ('standard','hard','elite')),
  category      text        NOT NULL CHECK (category IN ('physical','nutrition','combined')),
  codename      text        NOT NULL,                                 -- "Operation Iron Wall"
  briefing      text        NOT NULL,                                 -- 80-150 word AI prose

  progress_key  text        NOT NULL,
  target_value  int         NOT NULL CHECK (target_value > 0),
  current_value int         NOT NULL DEFAULT 0,
  unit          text        NOT NULL,

  xp_value      int         NOT NULL CHECK (xp_value IN (500, 1000, 1500)),

  completed     boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_classified_ops_user_month
  ON classified_ops(user_id, month_start DESC);

ALTER TABLE classified_ops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classified_ops_select" ON classified_ops
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "classified_ops_insert" ON classified_ops
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "classified_ops_update" ON classified_ops
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "classified_ops_delete" ON classified_ops
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. xp_events (append-only audit log)
--
-- Every XP gain flows through /api/award-xp, which inserts into this table.
-- reference_id is intentionally NOT a foreign key -- we want the audit log
-- to survive deletion of the source workout/contract/op.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  source        text        NOT NULL,                                 -- e.g. "workout_complete"
  amount        int         NOT NULL CHECK (amount > 0),
  reference_id  uuid,                                                 -- loose FK, nullable
  note          text,                                                 -- optional free-form context

  occurred_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_occurred
  ON xp_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_source
  ON xp_events(user_id, source);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_events_select" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_events_insert" ON xp_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- deliberately NO update/delete policies -- append-only audit log

NOTIFY pgrst, 'reload schema';
