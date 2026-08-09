-- =====================================================
-- 024 : Annonces (modérateur → étudiants de sa classe)
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Le modérateur peut CRUD sur ses annonces (scoped à ses classes)
CREATE POLICY "Moderator can manage own announcements for their classes"
  ON announcements FOR ALL
  USING (
    moderator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM moderator_classes mc
      WHERE mc.moderator_id = auth.uid()
      AND mc.class_id = announcements.class_id
    )
  );

-- L'admin peut tout voir et gérer
CREATE POLICY "Admin can manage all announcements"
  ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'));

-- Les étudiants lisent les annonces de leur classe
CREATE POLICY "Students can view announcements for their class"
  ON announcements FOR SELECT
  USING (
    class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_announcements_class ON announcements(class_id, created_at DESC);
