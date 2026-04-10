-- ============================================
-- BARRAX — Custom macro split
--
-- Adds protein_pct / carb_pct / fat_pct columns to profiles so
-- users can override the default 30/40/30 target ratio. Presets
-- (BALANCED, HIGH-PROTEIN, LOW-CARB, KETO) are handled in the
-- app layer; this migration just creates the storage.
--
-- Values sum to 100 — enforced in the UI (Postgres CHECK
-- constraints can't cleanly validate cross-column sums, and we
-- don't want to complicate INSERT logic).
--
-- Run this in your Supabase SQL Editor.
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS protein_pct INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS carb_pct    INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS fat_pct     INTEGER DEFAULT 30;

-- Backfill existing rows to the defaults in case any pre-existing
-- NULLs slipped through.
UPDATE profiles SET protein_pct = 30 WHERE protein_pct IS NULL;
UPDATE profiles SET carb_pct    = 40 WHERE carb_pct    IS NULL;
UPDATE profiles SET fat_pct     = 30 WHERE fat_pct     IS NULL;

NOTIFY pgrst, 'reload schema';
