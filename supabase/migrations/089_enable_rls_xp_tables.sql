-- =====================================================================
-- CONSIGNE — RLS MANQUANT SUR xp_actions ET xp_levels
-- Envoyer ce bloc dans le SQL Editor de Supabase.
-- =====================================================================

-- (0) LINTER : lister toutes les tables public SANS RLS activé
--     Résultat attendu après correction : xp_actions et xp_levels n'apparaissent plus.
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- (1) ACTIVER RLS
ALTER TABLE public.xp_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_levels  ENABLE ROW LEVEL SECURITY;

-- (2) POLICY LECTURE SEULE pour les utilisateurs authentifiés
--     (pas de policy INSERT/UPDATE/DELETE : l'écriture directe restera bloquée)
DROP POLICY IF EXISTS "xp_actions read only auth" ON public.xp_actions;
CREATE POLICY "xp_actions read only auth"
ON public.xp_actions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "xp_levels read only auth" ON public.xp_levels;
CREATE POLICY "xp_levels read only auth"
ON public.xp_levels FOR SELECT TO authenticated USING (true);

-- (3a) TEST LECTURE — doit PASSER (2 résultats : 1 xp_actions, 1 xp_levels)
SET ROLE authenticated;
SELECT 'xp_actions' AS tablee, count(*) FROM public.xp_actions
UNION ALL
SELECT 'xp_levels' AS tablee, count(*) FROM public.xp_levels;
RESET ROLE;

-- (3b) TEST ECRITURE DIRECTE — doit ECHOUER avec une erreur RLS
--      (toute erreur est attendue ici)
SET ROLE authenticated;
INSERT INTO public.xp_actions (action, xp_value, description)
VALUES ('test_rls_ecriture', 0, 'test') RETURNING *;
RESET ROLE;

SET ROLE authenticated;
INSERT INTO public.xp_levels (level, name, label, min_xp, icon_emoji)
VALUES (9999, 'test', 'test', 999999, 'x') RETURNING *;
RESET ROLE;

-- (3c) VERIFICATION FINALE : les 2 tables ne doivent PLUS apparaître ci-dessous
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- Note : award_xp et get_xp_summary sont SECURITY DEFINER (propriétaire postgres) :
-- ils contournent RLS, le système XP continue donc de fonctionner normalement.