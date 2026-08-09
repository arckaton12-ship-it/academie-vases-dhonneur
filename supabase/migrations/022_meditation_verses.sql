-- =====================================================
-- 022 : Versets à méditer par classe + attribution classes
-- =====================================================

-- Table des versets à méditer
CREATE TABLE IF NOT EXISTS meditation_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  verse_text TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  added_by UUID REFERENCES profiles(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meditation_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture versets pour les membres de la classe"
  ON meditation_verses FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );

CREATE POLICY "Admin/mod peuvent gérer les versets"
  ON meditation_verses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMINISTRATEUR', 'MODERATEUR')
    )
  );

-- RPC : verset du jour pour une classe (tourne chaque jour via md5)
CREATE OR REPLACE FUNCTION get_daily_verse(p_class_id UUID)
RETURNS TABLE (verse_text TEXT, verse_reference TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT mv.verse_text, mv.verse_reference
  FROM meditation_verses mv
  WHERE mv.class_id = p_class_id AND mv.active = true
  ORDER BY (length(mv.verse_text || CURRENT_DATE::text || mv.id))
  LIMIT 1;
$$;

-- RPC : lister les versets d'une classe
CREATE OR REPLACE FUNCTION get_class_verses(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  verse_text TEXT,
  verse_reference TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT mv.id, mv.verse_text, mv.verse_reference, mv.active, mv.created_at
  FROM meditation_verses mv
  WHERE mv.class_id = p_class_id
  ORDER BY mv.created_at DESC;
$$;

-- RPC : ajouter un verset
CREATE OR REPLACE FUNCTION add_verse(
  p_class_id UUID,
  p_verse_text TEXT,
  p_verse_reference TEXT
)
RETURNS UUID
LANGUAGE sql
AS $$
  INSERT INTO meditation_verses (class_id, verse_text, verse_reference, added_by)
  VALUES (p_class_id, p_verse_text, p_verse_reference, auth.uid())
  RETURNING id;
$$;

-- RPC : supprimer un verset
CREATE OR REPLACE FUNCTION remove_verse(p_verse_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  DELETE FROM meditation_verses WHERE id = p_verse_id;
$$;

-- RPC : toggler le statut actif d'un verset
CREATE OR REPLACE FUNCTION toggle_verse_active(p_verse_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
  UPDATE meditation_verses SET active = NOT active WHERE id = p_verse_id RETURNING active;
$$;

-- RPC : attribuer une classe à un étudiant
CREATE OR REPLACE FUNCTION set_student_class(
  p_student_id UUID,
  p_class_id UUID
)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE profiles SET class_id = p_class_id WHERE id = p_student_id;
$$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_meditation_verses_class ON meditation_verses(class_id) WHERE active = true;
