-- ============================================================================
-- BARRAX -- Coaching Scripts (AI Audio Coach / "Battle Buddy")
-- One row per (workout, voice) pair. Stores the Gemini-generated cue script
-- plus pointers to per-cue MP3 files in the `coaching-audio` Storage bucket.
-- ============================================================================

CREATE TABLE IF NOT EXISTS workout_coaching_scripts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id    uuid        NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice         text        NOT NULL,
  workout_hash  text        NOT NULL,  -- sha256 of workout_data JSON; invalidates if workout regenerated
  manifest      jsonb       NOT NULL,  -- full CoachingScript with audioUrl per cue
  created_at    timestamptz DEFAULT now(),
  UNIQUE (workout_id, voice)
);

ALTER TABLE workout_coaching_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_scripts_select" ON workout_coaching_scripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "coaching_scripts_insert" ON workout_coaching_scripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coaching_scripts_update" ON workout_coaching_scripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "coaching_scripts_delete" ON workout_coaching_scripts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coaching_scripts_workout
  ON workout_coaching_scripts(workout_id);

CREATE INDEX IF NOT EXISTS idx_coaching_scripts_user
  ON workout_coaching_scripts(user_id);

-- ============================================================================
-- Storage bucket: `coaching-audio`
-- Must be created manually in the Supabase dashboard (Storage > New Bucket):
--   - Name: coaching-audio
--   - Public: OFF (private bucket)
--   - File size limit: 1 MB
--   - Allowed MIME types: audio/mpeg, audio/webm
-- Then run the policies below in the Supabase SQL editor.
-- Path structure: {user_id}/{workout_id}/{cue_id}.mp3
-- ============================================================================

-- Storage policies (apply via SQL editor AFTER creating the bucket):
--
-- CREATE POLICY "coaching_audio_insert" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'coaching-audio'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "coaching_audio_select" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'coaching-audio'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "coaching_audio_update" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'coaching-audio'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "coaching_audio_delete" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'coaching-audio'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

NOTIFY pgrst, 'reload schema';
