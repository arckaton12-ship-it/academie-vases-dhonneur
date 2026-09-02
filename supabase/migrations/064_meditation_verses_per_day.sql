-- =====================================================
-- 064 : Versets méditation par jour + renommage Série → Méditation
-- =====================================================

-- Ajout de la colonne day_of_week aux versets (1=Lundi, 7=Dimanche)
ALTER TABLE meditation_verses
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7);

-- Index pour recherche rapide par jour
CREATE INDEX IF NOT EXISTS idx_meditation_verses_day
  ON meditation_verses(class_id, day_of_week)
  WHERE active = true;

-- RPC mis à jour : verset du jour pour une classe (par jour de la semaine)
CREATE OR REPLACE FUNCTION get_daily_verse(p_class_id UUID)
RETURNS TABLE (verse_text TEXT, verse_reference TEXT)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT mv.verse_text, mv.verse_reference
  FROM meditation_verses mv
  WHERE mv.class_id = p_class_id
    AND mv.active = true
    AND (mv.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1
         OR mv.day_of_week IS NULL)
  ORDER BY
    CASE WHEN mv.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1
         THEN 0 ELSE 1 END,
    mv.created_at DESC
  LIMIT 1;
$$;

-- RPC pour ajouter un verset avec jour optionnel
CREATE OR REPLACE FUNCTION add_verse(
  p_class_id UUID,
  p_verse_text TEXT,
  p_verse_reference TEXT,
  p_day_of_week INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
SET search_path TO 'public'
AS $$
  INSERT INTO meditation_verses (class_id, verse_text, verse_reference, added_by, day_of_week)
  VALUES (p_class_id, p_verse_text, p_verse_reference, auth.uid(),
          CASE WHEN p_day_of_week BETWEEN 1 AND 7 THEN p_day_of_week ELSE NULL END)
  RETURNING id;
$$;

-- RPC pour assigner un jour à un verset existant
CREATE OR REPLACE FUNCTION set_verse_day(p_verse_id UUID, p_day_of_week INTEGER)
RETURNS VOID
LANGUAGE sql
SET search_path TO 'public'
AS $$
  UPDATE meditation_verses
  SET day_of_week = CASE WHEN p_day_of_week BETWEEN 1 AND 7 THEN p_day_of_week ELSE NULL END
  WHERE id = p_verse_id;
$$;

-- RPC pour lister les versets avec jour (pour l'admin)
CREATE OR REPLACE FUNCTION get_class_verses(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  verse_text TEXT,
  verse_reference TEXT,
  active BOOLEAN,
  day_of_week INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT mv.id, mv.verse_text, mv.verse_reference, mv.active, mv.day_of_week, mv.created_at
  FROM meditation_verses mv
  WHERE mv.class_id = p_class_id
  ORDER BY
    CASE WHEN mv.day_of_week IS NULL THEN 8 ELSE mv.day_of_week END,
    mv.created_at DESC;
$$;
