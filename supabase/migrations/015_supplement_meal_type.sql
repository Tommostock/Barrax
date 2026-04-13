-- ============================================
-- BARRAX — Supplement Meal Type
--
-- Adds a new 'supplement' value to the meal_type CHECK
-- constraint on food_diary so daily stacks (creatine,
-- whey, etc.) can be logged in their own diary section
-- alongside breakfast / lunch / dinner / snack.
--
-- PostgreSQL doesn't allow altering a CHECK constraint
-- in place, so we drop the old one and re-add it with
-- the extra value.
-- ============================================

-- Drop the existing CHECK on meal_type. The constraint was
-- auto-named by Postgres when the table was created (migration
-- 003), so we look it up dynamically instead of hard-coding.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
    INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel    ON rel.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid  = rel.relnamespace
  WHERE rel.relname = 'food_diary'
    AND ns.nspname  = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%meal_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE food_diary DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Re-add the CHECK with the new 'supplement' value allowed.
ALTER TABLE food_diary
  ADD CONSTRAINT food_diary_meal_type_check
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'supplement'));

-- --------------------------------------------------------------------------
-- Same treatment for the `source` CHECK so HQ-button supplement logs can
-- write their own source tag ("supps_button") without being rejected.
-- Looks the constraint up dynamically because migration 003 let Postgres
-- auto-name it.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  source_constraint_name TEXT;
BEGIN
  SELECT con.conname
    INTO source_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel    ON rel.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid  = rel.relnamespace
  WHERE rel.relname = 'food_diary'
    AND ns.nspname  = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%source%';

  IF source_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE food_diary DROP CONSTRAINT %I', source_constraint_name);
  END IF;
END $$;

ALTER TABLE food_diary
  ADD CONSTRAINT food_diary_source_check
  CHECK (source IN ('manual', 'barcode', 'meal_plan', 'search', 'supps_button'));

NOTIFY pgrst, 'reload schema';
