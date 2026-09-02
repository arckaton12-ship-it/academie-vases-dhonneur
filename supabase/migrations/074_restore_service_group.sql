-- Migration 074: Restore SERVICE_GROUP conversation type
-- Allows students to message their department group (same class + department)

-- 1. Update CHECK constraint to include SERVICE_GROUP
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('DIRECT', 'MODERATEUR_ETUDIANT', 'MODERATEUR_MODERATEUR', 'SERVICE_GROUP'));

-- 2. Helper: check if user belongs to a service group conversation
CREATE OR REPLACE FUNCTION public.user_in_service_group(p_conv_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversations c
    JOIN profiles p ON p.id = p_user_id
    WHERE c.id = p_conv_id
      AND c.type = 'SERVICE_GROUP'
      AND c.service_group_key = p.class_id || ':' || COALESCE(p.department, '')
      AND c.service_group_key IS NOT NULL
      AND p.department IS NOT NULL
  );
$$;

-- 3. Update conversations SELECT policy to include SERVICE_GROUP visibility
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    participant_1 = auth.uid()
    OR participant_2 = auth.uid()
    OR user_in_service_group(id, auth.uid())
  );

-- 4. Update student INSERT policy to allow SERVICE_GROUP creation
DROP POLICY IF EXISTS "student create conversations" ON public.conversations;

CREATE POLICY "student create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_1
  AND user_role_is(auth.uid(), 'ETUDIANT')
  AND (
    -- Normal conversations with moderators/admins
    user_role_is(participant_2, 'ADMINISTRATEUR')
    OR user_role_is(participant_2, 'MODERATEUR')
    OR user_role_is(participant_2, 'ADMIN_CLASSE')
    -- SERVICE_GROUP: student creates for themselves
    OR (
      type = 'SERVICE_GROUP'
      AND participant_2 = auth.uid()
      AND service_group_key IS NOT NULL
    )
  )
);

-- 5. Update messages SELECT policy to include SERVICE_GROUP conversations
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;

CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
    OR user_in_service_group(conversation_id, auth.uid())
  );

-- 6. Update messages INSERT policy to include SERVICE_GROUP conversations
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      conversation_id IN (
        SELECT id FROM conversations
        WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
      )
      OR user_in_service_group(conversation_id, auth.uid())
    )
  );

-- 7. Update messages UPDATE (read_at) policy for SERVICE_GROUP
DROP POLICY IF EXISTS "Participants can mark messages as read" ON public.messages;

CREATE POLICY "Participants can mark messages as read"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
    OR user_in_service_group(conversation_id, auth.uid())
  );

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
