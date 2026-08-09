-- =====================================================
-- 029 : Fixes messagerie - client_id, reply_to, type
-- =====================================================

-- Add client_id for optimistic dedup
ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Add reply_to_id for proper quoting
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Add index for client_id dedup lookups
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id) WHERE client_id IS NOT NULL;

-- Add index for reply_to lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Fix conversation type: add 'DIRECT' option
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check CHECK (type IN ('DIRECT', 'MODERATEUR_ETUDIANT', 'MODERATEUR_MODERATEUR'));

-- Update existing conversations to use correct types
UPDATE conversations SET type = 'DIRECT' WHERE type = 'MODERATEUR_MODERATEUR';

-- Rate limit: ensure only authenticated users can send
-- (RLS already handles this, but let's be explicit in the policy)
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = (select auth.uid())
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = (select auth.uid()) OR participant_2 = (select auth.uid())
    )
  );
