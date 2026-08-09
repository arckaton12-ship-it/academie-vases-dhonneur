-- =====================================================
-- 031 : Systeme de notifications complet
-- Table already exists, add link column + RPCs
-- =====================================================

-- Add link column if not exists
DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- RPC: create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notif_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link)
  RETURNING id INTO notif_id;
  RETURN notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: mark all as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications SET read = true
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT count(*) FROM notifications WHERE user_id = p_user_id AND read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
