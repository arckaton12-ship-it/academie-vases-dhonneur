CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
BEGIN
  SELECT CASE
    WHEN participant_1 = NEW.sender_id THEN participant_2
    ELSE participant_1
  END INTO v_recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, title, body, type)
  VALUES (
    v_recipient_id,
    'Nouveau message',
    LEFT(NEW.content, 80),
    'message'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

SELECT pg_notify('pgrst', 'reload schema');
