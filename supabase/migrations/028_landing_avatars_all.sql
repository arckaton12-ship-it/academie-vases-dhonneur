-- Migration 028: get_landing_avatars retourne TOUS les étudiants
DROP FUNCTION IF EXISTS get_landing_avatars();

CREATE FUNCTION get_landing_avatars()
RETURNS TABLE (avatar_url text, first_name text)
LANGUAGE sql STABLE
AS $$
  SELECT p.avatar_url, p.first_name
  FROM public.profiles p
  WHERE p.active = true
    AND p.role = 'ETUDIANT'
  ORDER BY p.created_at
  LIMIT 16;
$$;
