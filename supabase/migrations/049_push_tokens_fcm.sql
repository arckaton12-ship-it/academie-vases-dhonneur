-- Table push_tokens (Firebase Cloud Messaging)
-- Exécute dans le SQL Editor du dashboard Supabase

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own push tokens' AND tablename = 'push_tokens'
  ) THEN
    CREATE POLICY "Users can manage own push tokens"
      ON push_tokens FOR ALL
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
