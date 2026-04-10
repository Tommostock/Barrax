CREATE TABLE IF NOT EXISTS challenge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INT NOT NULL,
  current_value INT DEFAULT 0,
  target_type TEXT NOT NULL CHECK (target_type IN ('workouts', 'runs', 'distance_km', 'xp', 'meals')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp_reward INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenge_events_user ON challenge_events(user_id);
ALTER TABLE challenge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_events_select" ON challenge_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "challenge_events_insert" ON challenge_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "challenge_events_update" ON challenge_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "challenge_events_delete" ON challenge_events FOR DELETE USING (auth.uid() = user_id);

-- Also add rating column to workouts table for post-workout difficulty rating
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS rating INT CHECK (rating BETWEEN 1 AND 5);
