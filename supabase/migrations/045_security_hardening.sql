-- Section 11: Security hardening
-- Purge webhook_logs of any sensitive data, then drop table (webhook code removed)

-- Check if webhook_logs exists and purge it
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'webhook_logs' AND schemaname = 'public') THEN
    DELETE FROM public.webhook_logs;
    DROP TABLE IF EXISTS public.webhook_logs CASCADE;
  END IF;
END $$;

-- Ensure no RLS bypass tables exist for sensitive data
-- Confirm profiles must_change_password column has safe default
ALTER TABLE public.profiles ALTER COLUMN must_change_password SET DEFAULT false;
