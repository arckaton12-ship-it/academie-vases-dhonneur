CREATE TABLE IF NOT EXISTS bilan_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES profiles(id),
  bilan_days integer[] NOT NULL DEFAULT '{2,4,6}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bilan_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bilan_prefs_own" ON bilan_preferences
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "bilan_prefs_admin" ON bilan_preferences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE'))
  );

ALTER TABLE weekly_bilan ADD COLUMN IF NOT EXISTS bilan_day integer;
ALTER TABLE weekly_bilan ADD COLUMN IF NOT EXISTS sent_to_sheets boolean DEFAULT false;

SELECT pg_notify('pgrst', 'reload schema');
