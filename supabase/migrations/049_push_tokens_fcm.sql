-- =====================================================
-- 049 : Push tokens (Firebase Cloud Messaging)
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- Index for lookup by token (used by Edge Function to find recipient)
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
