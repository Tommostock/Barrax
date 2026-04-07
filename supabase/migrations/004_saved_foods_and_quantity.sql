-- ============================================
-- BARRAX — Saved Foods + Quantity Support
-- 1. New saved_foods table for personal food library
-- 2. Add quantity column to food_diary
-- Run this in your Supabase SQL Editor.
-- ============================================

-- Personal food library — foods you save for quick re-use
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  calories DECIMAL NOT NULL DEFAULT 0,
  protein_g DECIMAL NOT NULL DEFAULT 0,
  carbs_g DECIMAL NOT NULL DEFAULT 0,
  fat_g DECIMAL NOT NULL DEFAULT 0,
  serving_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_foods_user ON saved_foods(user_id);

ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_foods_select" ON saved_foods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_foods_insert" ON saved_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_foods_update" ON saved_foods
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_foods_delete" ON saved_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Add quantity column to food_diary (default 1)
ALTER TABLE food_diary ADD COLUMN IF NOT EXISTS quantity DECIMAL NOT NULL DEFAULT 1;
