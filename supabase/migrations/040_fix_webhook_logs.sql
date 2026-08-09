-- Fix: Lock webhook_logs INSERT policy
-- Currently "Anyone can insert webhook_logs" allows unauthenticated inserts (security risk)
DROP POLICY IF EXISTS "Anyone can insert webhook_logs" ON webhook_logs;
CREATE POLICY "Authenticated users can insert webhook_logs"
  ON webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
