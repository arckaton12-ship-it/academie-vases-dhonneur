-- =====================================================
-- 025 : Messagerie instantanée (conversations + messages)
-- =====================================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('MODERATEUR_ETUDIANT', 'MODERATEUR_MODERATEUR')),
  participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (participant_1, participant_2)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Conversations : un utilisateur ne voit que ses conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    participant_1 = auth.uid() OR participant_2 = auth.uid()
  );

-- Créer une conversation : modérateur avec un étudiant de ses classes, ou modérateur-modérateur
CREATE POLICY "Moderators can create conversations with their students or other moderators"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1
    AND (
      -- Modérateur ↔ Étudiant : l'étudiant doit être dans une classe du modérateur
      (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MODERATEUR')
        AND EXISTS (SELECT 1 FROM profiles WHERE id = participant_2 AND role = 'ETUDIANT')
        AND EXISTS (
          SELECT 1 FROM moderator_classes mc
          JOIN profiles p ON p.class_id = mc.class_id
          WHERE mc.moderator_id = auth.uid() AND p.id = participant_2
        )
      )
      OR
      -- Modérateur ↔ Modérateur : les deux sont modérateurs
      (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MODERATEUR')
        AND EXISTS (SELECT 1 FROM profiles WHERE id = participant_2 AND role = 'MODERATEUR')
      )
      OR
      -- Admin peut créer avec n'importe qui
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR')
    )
  );

-- RLS Messages : lecture seule pour les participants
CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- Envoyer un message : l'expéditeur doit être participant de la conversation
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- Marquer comme lu : le participant peut mettre read_at
CREATE POLICY "Participants can mark messages as read"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, sent_at ASC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id) WHERE read_at IS NULL;

-- Activer Realtime sur la table messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
