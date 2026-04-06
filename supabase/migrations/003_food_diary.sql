-- ============================================
-- BARRAX — Food Diary Table
-- Tracks individual food entries from any source:
-- barcode scans, manual entry, search, or meal plan.
-- Run this in your Supabase SQL Editor.
-- ============================================

CREATE TABLE IF NOT EXISTS food_diary (
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
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'barcode', 'meal_plan', 'search')),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast diary queries
CREATE INDEX idx_food_diary_user ON food_diary(user_id);
CREATE INDEX idx_food_diary_date ON food_diary(logged_at);

-- Row Level Security — users only see their own entries
ALTER TABLE food_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_diary_select" ON food_diary
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_diary_insert" ON food_diary
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_diary_update" ON food_diary
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_diary_delete" ON food_diary
  FOR DELETE USING (auth.uid() = user_id);
