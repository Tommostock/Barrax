-- ============================================
-- BARRAX -- Progress Photos
-- Stores photo metadata. Actual images go in
-- Supabase Storage bucket "progress-photos".
-- Run this in your Supabase SQL Editor.
-- ============================================

CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  note TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_photos_user ON progress_photos(user_id);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_photos_select" ON progress_photos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_photos_insert" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_photos_delete" ON progress_photos
  FOR DELETE USING (auth.uid() = user_id);

-- IMPORTANT: You also need to create a Storage bucket in your
-- Supabase dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: "progress-photos"
-- 3. Public: OFF (private bucket)
-- 4. Add policy: Allow authenticated users to upload/read/delete
--    their own files (use auth.uid() in the path)
