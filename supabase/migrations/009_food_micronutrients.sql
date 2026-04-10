-- ============================================
-- BARRAX — Add micronutrient columns to food_diary + saved_foods
--
-- Open Food Facts and the AddFoodSheet pass through fibre, sugar
-- and salt data per serving. Without these columns the inserts
-- fail with PostgREST schema-cache errors. Adding the columns is
-- the most robust fix — it makes the schema match the data model
-- and lets us display the extra nutrients in the diary later.
--
-- Run this in your Supabase SQL Editor.
-- ============================================

ALTER TABLE food_diary  ADD COLUMN IF NOT EXISTS fibre_g DECIMAL DEFAULT 0;
ALTER TABLE food_diary  ADD COLUMN IF NOT EXISTS sugar_g DECIMAL DEFAULT 0;
ALTER TABLE food_diary  ADD COLUMN IF NOT EXISTS salt_g  DECIMAL DEFAULT 0;

ALTER TABLE saved_foods ADD COLUMN IF NOT EXISTS fibre_g DECIMAL DEFAULT 0;
ALTER TABLE saved_foods ADD COLUMN IF NOT EXISTS sugar_g DECIMAL DEFAULT 0;
ALTER TABLE saved_foods ADD COLUMN IF NOT EXISTS salt_g  DECIMAL DEFAULT 0;

-- After adding columns you may need to refresh the PostgREST schema cache.
-- In Supabase SQL Editor run: NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
