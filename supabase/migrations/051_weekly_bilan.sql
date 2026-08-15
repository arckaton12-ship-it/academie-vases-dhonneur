-- 051_weekly_bilan.sql
-- Weekly self-assessment bilan for students

CREATE TABLE IF NOT EXISTS weekly_bilan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  -- Résumé
  resume_done BOOLEAN DEFAULT FALSE,
  -- Méditation
  meditation_status TEXT NOT NULL CHECK (meditation_status IN ('all_days', 'some_days', 'none')),
  meditation_days INTEGER DEFAULT 0,
  -- Évangélisation
  evangelisation_status TEXT NOT NULL CHECK (evangelisation_status IN ('soul_won', 'evangelized_no_soul', 'none')),
  contact_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, week_number)
);

ALTER TABLE weekly_bilan ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own bilan
CREATE POLICY "student own bilan" ON weekly_bilan
  FOR ALL USING (auth.uid() = student_id);

-- Admin full access
CREATE POLICY "admin full access bilan" ON weekly_bilan
  FOR ALL USING (public.is_admin());

-- Moderator can read bilan for students in their classes
CREATE POLICY "moderator read class bilan" ON weekly_bilan
  FOR SELECT USING (
    public.is_moderator()
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN moderator_classes mc ON mc.class_id = p.class_id
      WHERE mc.moderator_id = auth.uid()
      AND p.id = weekly_bilan.student_id
    )
  );
