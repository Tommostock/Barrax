-- ============================================
-- BARRAX -- Workout Difficulty Rating
-- Stores the user's 1-5 difficulty rating after
-- each workout. Used by the AI programme generator
-- to adjust future intensity.
-- Run this in your Supabase SQL Editor.
-- ============================================

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS difficulty_rating INT CHECK (difficulty_rating BETWEEN 1 AND 5);
