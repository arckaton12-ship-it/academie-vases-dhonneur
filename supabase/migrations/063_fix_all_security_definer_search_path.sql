-- Migration 063: Add SET search_path TO 'public' to ALL SECURITY DEFINER functions
-- that were missing it. Uses ALTER to not change function bodies.
-- Best practice: PostgreSQL docs + Supabase security guide recommend this for ALL
-- SECURITY DEFINER functions to prevent privilege escalation via search_path hijacking.

-- 1. admin_classe_can_access_student(uuid)
ALTER FUNCTION public.admin_classe_can_access_student(uuid) SET search_path TO 'public';

-- 2. cleanup_offline_users()
ALTER FUNCTION public.cleanup_offline_users() SET search_path TO 'public';

-- 3. create_notification(uuid, text, text, text, text)
ALTER FUNCTION public.create_notification(uuid, text, text, text, text) SET search_path TO 'public';

-- 4. create_quiz — 5-arg overload (uuid, text, text, integer, integer)
ALTER FUNCTION public.create_quiz(uuid, text, text, integer, integer) SET search_path TO 'public';

-- 5. create_quiz — 6-arg overload (uuid, text, text, integer, numeric, jsonb)
ALTER FUNCTION public.create_quiz(uuid, text, text, integer, numeric, jsonb) SET search_path TO 'public';

-- 6. delete_quiz(uuid)
ALTER FUNCTION public.delete_quiz(uuid) SET search_path TO 'public';

-- 7. delete_test_users()
ALTER FUNCTION public.delete_test_users() SET search_path TO 'public';

-- 8. get_admin_classe_list()
ALTER FUNCTION public.get_admin_classe_list() SET search_path TO 'public';

-- 9. get_course_quizzes(uuid)
ALTER FUNCTION public.get_course_quizzes(uuid) SET search_path TO 'public';

-- 10. get_daily_verse(uuid)
ALTER FUNCTION public.get_daily_verse(uuid) SET search_path TO 'public';

-- 11. get_profile_names(uuid[])
ALTER FUNCTION public.get_profile_names(uuid[]) SET search_path TO 'public';

-- 12. get_quiz_with_questions(uuid)
ALTER FUNCTION public.get_quiz_with_questions(uuid) SET search_path TO 'public';

-- 13. get_student_bulletin(uuid)
ALTER FUNCTION public.get_student_bulletin(uuid) SET search_path TO 'public';

-- 14. get_unread_notification_count(uuid)
ALTER FUNCTION public.get_unread_notification_count(uuid) SET search_path TO 'public';

-- 15. is_admin_classe()
ALTER FUNCTION public.is_admin_classe() SET search_path TO 'public';

-- 16. mark_all_notifications_read(uuid)
ALTER FUNCTION public.mark_all_notifications_read(uuid) SET search_path TO 'public';

-- 17. submit_quiz(uuid, jsonb)
ALTER FUNCTION public.submit_quiz(uuid, jsonb) SET search_path TO 'public';

-- 18. webhook_fire(text, jsonb)
ALTER FUNCTION public.webhook_fire(text, jsonb) SET search_path TO 'public';
