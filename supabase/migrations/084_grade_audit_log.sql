CREATE TABLE IF NOT EXISTS grade_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id),
  graded_by uuid NOT NULL REFERENCES profiles(id),
  grade_type text NOT NULL, -- 'devoir', 'resume', 'meditation', 'service'
  ref_id uuid, -- submission_id, resume_id, etc.
  old_grade numeric,
  new_grade numeric,
  old_feedback text,
  new_feedback text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grade_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grade_audit_admin_read" ON grade_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE'))
  );

CREATE POLICY "grade_audit_admin_insert" ON grade_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR', 'ADMIN_CLASSE'))
  );

SELECT pg_notify('pgrst', 'reload schema');
