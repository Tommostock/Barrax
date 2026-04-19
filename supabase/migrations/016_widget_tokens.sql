-- ============================================================================
-- BARRAX -- Widget Tokens
--
-- Long-lived opaque tokens that let a home-screen widget (Scriptable on iOS)
-- read a compact summary of the user's BARRAX data without going through the
-- full Supabase cookie-based auth flow. Each user can mint one or more tokens,
-- label them ("iPhone 15 widget"), and revoke them later.
--
-- Security model:
--   * The token itself is never stored -- only a SHA-256 hash of it.
--     The user sees the raw token ONCE at mint time; losing it means
--     revoking + minting a new one.
--   * The /api/widget/summary route looks up a token by hash, bounces if it's
--     revoked, and then reads the owning user_id. Server-side code filters
--     every downstream query by that user_id.
--   * RLS is enabled so users can only see/mutate their own rows from the
--     Settings page. The widget endpoint itself bypasses RLS via the service
--     role key because the cookie auth isn't present.
-- ============================================================================

CREATE TABLE IF NOT EXISTS widget_tokens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- SHA-256 hex of the raw token string. 64 chars, always set.
  token_hash    text        NOT NULL UNIQUE,

  -- Human label shown in Settings so the user can tell tokens apart.
  label         text        NOT NULL DEFAULT 'Widget',

  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,

  -- When set, the token is dead. We keep the row so the Settings list
  -- can still show "revoked on ..." instead of silently disappearing.
  revoked_at    timestamptz
);

-- Fast lookup on the hash for the widget endpoint. Partial index so we
-- skip revoked rows entirely -- those are never a valid lookup target.
CREATE INDEX IF NOT EXISTS idx_widget_tokens_hash_active
  ON widget_tokens(token_hash)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_widget_tokens_user
  ON widget_tokens(user_id, created_at DESC);

ALTER TABLE widget_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see, mint, and revoke their own tokens via the Settings page
-- (cookie-authed Supabase client). The widget endpoint uses the service
-- role key and bypasses these policies.
CREATE POLICY "widget_tokens_select" ON widget_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "widget_tokens_insert" ON widget_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "widget_tokens_update" ON widget_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "widget_tokens_delete" ON widget_tokens
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
