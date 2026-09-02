-- Rollback: retire les policies ADMIN_CLASSE sur soul_tracking (erreur)

DROP POLICY IF EXISTS "admin_classe read soul_tracking" ON public.soul_tracking;
DROP POLICY IF EXISTS "admin_classe upsert soul_tracking" ON public.soul_tracking;
DROP POLICY IF EXISTS "admin_classe update soul_tracking" ON public.soul_tracking;

SELECT pg_notify('pgrst', 'reload schema');
