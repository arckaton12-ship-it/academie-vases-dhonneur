-- =============================================================
-- MIGRATION 088: UPSERT COURSES FROM OFFICIAL PLANNING
-- NE SUPPRIME PAS LES DONNEES ETUDIANTS (quiz, notes, submissions)
-- Appliquer via Supabase Dashboard > SQL Editor
-- =============================================================

BEGIN;

-- 1. Ensure all needed columns exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS week integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS session_date date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS audio_parts jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_graduation boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_tronc_commun boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_short text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 120;

-- 2. Supprimer les doublons (class_id, week) en gardant la plus ancienne ligne
-- Ceci ne supprime que les lignes courses en double, PAS les donnees etudiants
WITH to_delete AS (
  SELECT ctid FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY class_id, week ORDER BY created_at ASC, id ASC) AS rn
    FROM courses WHERE week IS NOT NULL
  ) sub WHERE rn > 1
)
DELETE FROM courses WHERE ctid IN (SELECT ctid FROM to_delete);

-- 3. Supprimer les doublons ou week est NULL (garder la plus recente)
WITH to_delete AS (
  SELECT ctid FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY created_at DESC, id DESC) AS rn
    FROM courses WHERE week IS NULL
  ) sub WHERE rn > 1
)
DELETE FROM courses WHERE ctid IN (SELECT ctid FROM to_delete);

-- 4. Ajouter la contrainte unique (plus de doublons maintenant)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_class_id_week_key;
ALTER TABLE courses ADD CONSTRAINT courses_class_id_week_key UNIQUE (class_id, week);

-- 3. Seed classes (UPSERT - ne supprime rien)
INSERT INTO classes (id, name, start_date) VALUES
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 'Classe 1 - Eaux Paisibles', '2026-08-09'),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 'Classe 2 - Eaux Paisibles', '2026-08-09'),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 'Classe 3 - Eaux Paisibles', '2026-08-09'),
  ('a0e92a70-b22e-4a26-a710-cf18d89cf201', 'Graduation', '2026-11-08')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, start_date = EXCLUDED.start_date;

-- 4. Recreate generate_course_dates function (sans restriction is_admin)
CREATE OR REPLACE FUNCTION public.generate_course_dates(
  p_class_id uuid,
  p_start_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated integer := 0;
  v_course record;
BEGIN
  UPDATE classes SET start_date = p_start_date WHERE id = p_class_id;
  FOR v_course IN SELECT id, week FROM courses WHERE class_id = p_class_id AND week IS NOT NULL LOOP
    UPDATE courses
    SET session_date = p_start_date + ((v_course.week - 1) * interval '7 days')
    WHERE id = v_course.id;
    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;

-- 5. Trigger: when start_date changes, auto-recalculate all session_dates
CREATE OR REPLACE FUNCTION public.auto_recalculate_session_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.start_date IS DISTINCT FROM OLD.start_date AND NEW.start_date IS NOT NULL THEN
    UPDATE courses
    SET session_date = NEW.start_date + ((courses.week - 1) * interval '7 days')
    WHERE class_id = NEW.id AND courses.week IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_session_dates ON classes;
CREATE TRIGGER trg_recalc_session_dates
  AFTER UPDATE OF start_date ON classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_recalculate_session_dates();

-- 6. Seed all 45 courses from official planning (UPSERT - ne supprime rien)
-- Si un cours (class_id, week) existe deja, il est MIS A JOUR
-- Si un cours (class_id, week) n'existe pas, il est AJOUTE
-- Les donnees etudiants (submissions, quizzes, notes) liees aux anciens cours ne sont PAS affectees
INSERT INTO courses (class_id, week, title, description, session_date, audio_url, audio_parts, video_url, is_visible, is_graduation, is_tronc_commun) VALUES
  -- WEEK 1: Prise de contact - 9 aout
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 1, 'Prise de contact', 'Faire connaissance avec les etudiants, presenter l''Academie', '2026-08-09', NULL, NULL, NULL, true, false, true),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 1, 'Prise de contact', 'Faire connaissance avec les etudiants, presenter l''Academie', '2026-08-09', NULL, NULL, NULL, true, false, true),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 1, 'Prise de contact', 'Faire connaissance avec les etudiants, presenter l''Academie', '2026-08-09', NULL, NULL, NULL, true, false, true),
  -- WEEK 2: La Vision - 16 aout
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 2, 'La Vision de Vases d''Honneur', 'Devenir un Vase d''honneur : comprendre l''esprit et la vision', '2026-08-16', 'https://www.youtube.com/watch?v=plSLMiajkTg', '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view"},{"nom":"Objectifs & Heritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]', 'https://www.youtube.com/watch?v=plSLMiajkTg', true, false, true),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 2, 'La Vision de Vases d''Honneur', 'Devenir un Vase d''honneur : comprendre l''esprit et la vision', '2026-08-16', 'https://www.youtube.com/watch?v=plSLMiajkTg', '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view"},{"nom":"Objectifs & Heritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]', 'https://www.youtube.com/watch?v=plSLMiajkTg', true, false, true),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 2, 'La Vision de Vases d''Honneur', 'Devenir un Vase d''honneur : comprendre l''esprit et la vision', '2026-08-16', 'https://www.youtube.com/watch?v=plSLMiajkTg', '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view"},{"nom":"Objectifs & Heritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]', 'https://www.youtube.com/watch?v=plSLMiajkTg', true, false, true),
  -- WEEK 3: Meditation et Bible - 23 aout
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 3, 'La meditation de la Bible', 'Apprendre a mediter et acquerir une vie de meditation', '2026-08-23', 'https://www.youtube.com/watch?v=0HplIYNz5vg', '[{"nom":"La Meditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]', 'https://www.youtube.com/watch?v=0HplIYNz5vg', true, false, true),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 3, 'La meditation de la Bible', 'Apprendre a mediter et acquerir une vie de meditation', '2026-08-23', 'https://www.youtube.com/watch?v=0HplIYNz5vg', '[{"nom":"La Meditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]', 'https://www.youtube.com/watch?v=0HplIYNz5vg', true, false, true),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 3, 'La meditation de la Bible', 'Apprendre a mediter et acquerir une vie de meditation', '2026-08-23', 'https://www.youtube.com/watch?v=0HplIYNz5vg', '[{"nom":"La Meditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]', 'https://www.youtube.com/watch?v=0HplIYNz5vg', true, false, true),
  -- WEEK 4: Servir Dieu - 30 aout
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 4, 'Servir Dieu', 'Travailler pour Dieu, l''honneur de servir DIEU', '2026-08-30', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', true, false, true),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 4, 'Servir Dieu', 'Travailler pour Dieu, l''honneur de servir DIEU', '2026-08-30', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', true, false, true),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 4, 'Servir Dieu', 'Travailler pour Dieu, l''honneur de servir DIEU', '2026-08-30', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]', 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', true, false, true),
  -- WEEK 5: 6 septembre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 5, 'L''Evangelisation', 'Gagner des ames', '2026-09-06', 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', '[{"nom":"L''evangelisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]', 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 5, 'L''Evangelisation', 'Gagner des ames', '2026-09-06', 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', '[{"nom":"L''evangelisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]', 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 5, 'La Sanctification Niveau 2', 'Comprendre pourquoi Jesus a lave les pieds de ses disciples', '2026-09-06', 'https://www.youtube.com/watch?v=XsKO_Lsux_s', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1IpLWb1wxVHGir-LsercdVSm1J0ykUMqb/view"}]', 'https://www.youtube.com/watch?v=XsKO_Lsux_s', true, false, false),
  -- WEEK 6: 13 septembre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 6, 'La Croix 1 & 2', 'Comprendre l''oeuvre de la croix', '2026-09-13', 'https://www.youtube.com/watch?v=FMjghc0lTSY', '[{"nom":"La Croix - Partie 1","audio":"https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view"},{"nom":"La Croix - Partie 2","audio":"https://drive.google.com/file/d/1mvBYr1sMMPqp2uGeOlb5yvZAHgYh5b_D/view"}]', 'https://www.youtube.com/watch?v=FMjghc0lTSY', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 6, 'Les fausses propheties et les fausses doctrines', 'Discerner les faux prophetes et docteurs', '2026-09-13', 'https://www.youtube.com/watch?v=2UvhiGy4XQE', NULL, 'https://www.youtube.com/watch?v=2UvhiGy4XQE', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 6, 'L''Amour Niveau 2 (partie I et II)', 'Comment veritablement aimer Dieu et les hommes', '2026-09-13', 'https://www.youtube.com/watch?v=fTYfItmGxxU', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1AekJUxowd0Q1J7D4TCzKIn-jqT1s0CqF/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1zNK73p_p42v3Dn2EpcQE0niqq86dm_CQ/view"}]', 'https://www.youtube.com/watch?v=fTYfItmGxxU', true, false, false),
  -- WEEK 7: 20 septembre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 7, 'La Nouvelle Creation', 'Decouvrir et marcher selon notre Identite en Christ', '2026-09-20', 'https://www.youtube.com/watch?v=6IM_s_n7GU8', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1nkJ2lxwkBSDbjeONkACaarWe-kwcCVD3/view"}]', 'https://www.youtube.com/watch?v=6IM_s_n7GU8', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 7, 'La Priere', 'Savoir prier et rendre la priere efficace', '2026-09-20', 'https://www.youtube.com/watch?v=IEwu7DExxS4', NULL, 'https://www.youtube.com/watch?v=IEwu7DExxS4', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 7, 'La Communion Fraternelle', 'La communion, force vitale de l''eglise', '2026-09-20', 'https://www.youtube.com/watch?v=7Zoof_AEy1A', '[{"nom":"La communion fraternelle","audio":"https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view"}]', 'https://www.youtube.com/watch?v=7Zoof_AEy1A', true, false, false),
  -- WEEK 8: 27 septembre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 8, 'Le Salut', 'Comprendre la mission de Jesus : le salut', '2026-09-27', 'https://www.youtube.com/watch?v=5-KjVUFVH18', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1DZOEYJnsW8vzgD4MlGXgrUHPeO0Nde7R/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/10ZzuLBOz4oZpzavajuHaSv4tg2phqoaD/view"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1n48jFZ2HO4yE1icm-G_9Wpp9mSKuEFI_/view"}]', 'https://www.youtube.com/watch?v=5-KjVUFVH18', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 8, 'L''Amour', 'Manifester l''amour', '2026-09-27', 'https://www.youtube.com/watch?v=q559A0aFybQ', NULL, 'https://www.youtube.com/watch?v=q559A0aFybQ', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 8, 'La Foi - Partie 1', 'Comment avoir une foi qui deplace les montagnes', '2026-09-27', 'https://www.youtube.com/watch?v=0XHzdOKbdzw', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/18rCg9EfYHY5WKdQnFSALJiJ_eig47bFJ/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1Yg0oB1ePvqqe6wlMUpPVx7m7zo5t4KCH/view"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1FsvAzQGdue2wrus_ZWf7NWBtWsQQ11iJ/view"}]', 'https://www.youtube.com/watch?v=0XHzdOKbdzw', true, false, false),
  -- WEEK 9: 4 octobre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 9, 'Le peche et ses consequences', 'Identifier le peche et ses consequences', '2026-10-04', 'https://www.youtube.com/watch?v=G2VuVRbvpw4', '[{"nom":"Le peche et ses consequences","audio":"https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view"}]', 'https://www.youtube.com/watch?v=G2VuVRbvpw4', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 9, 'Les Dimes et Offrandes', 'Distinguer les dimes des offrandes', '2026-10-04', 'https://www.youtube.com/watch?v=dH7548qIRkI', NULL, 'https://www.youtube.com/watch?v=dH7548qIRkI', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 9, 'La Foi - Partie 2', 'Comment avoir une foi qui deplace les montagnes', '2026-10-04', 'https://www.youtube.com/watch?v=0XHzdOKbdzw', '[{"nom":"Partie 5","audio":"https://drive.google.com/file/d/1ECfSFMD9N93mwGO1p6QD9UUBI1nwqy_0/view"},{"nom":"Partie 6","audio":"https://drive.google.com/file/d/1xVVIShonXfWSAO_AopqO9b35jGpwraga/view"},{"nom":"Partie 7","audio":"https://drive.google.com/file/d/1efmWaax5Aic1vW7jY3s9DQ36VpHwmjym/view"}]', 'https://www.youtube.com/watch?v=0XHzdOKbdzw', true, false, false),
  -- WEEK 10: 11 octobre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 10, 'La Vie de Sanctification (partie I)', 'Connaitre la sanctification et mener une vie de sanctification', '2026-10-11', 'https://www.youtube.com/watch?v=yU6JipfABMQ', '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/15PPjLQLtjnO2UiEqbuveFbuOPEoL0svQ/view"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1ntaUq-CO0a_jTlyAIY1d0rAqz3EgaiWs/view"}]', 'https://www.youtube.com/watch?v=yU6JipfABMQ', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 10, 'La Loi de l''Honneur', 'Honorer les autorites et les personnes etablies sur nous', '2026-10-11', 'https://www.youtube.com/watch?v=TtoS2fzkHCM', NULL, 'https://www.youtube.com/watch?v=TtoS2fzkHCM', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 10, 'Rattrapage des Devoirs Hebdomadaires', 'Faire des recherches pour son edification spirituelle', '2026-10-11', NULL, NULL, NULL, true, false, false),
  -- WEEK 11: 18 octobre
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 11, 'La Trinite et le Saint-Esprit', 'Comprendre la Trinite et le Saint-Esprit', '2026-10-18', 'https://www.youtube.com/watch?v=LTAnt60Rl2s', '[{"nom":"La Trinite","audio":"https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view"},{"nom":"Marcher par le Saint-Esprit - Partie 1","audio":"https://drive.google.com/file/d/1yYDq40-EOZoa9lWgRD_hEWlDYBapm1ja/view"},{"nom":"Marcher par le Saint-Esprit - Partie 2","audio":"https://drive.google.com/file/d/1fknpfq53a8IjZeH3AgtpTHnNQaK8mYzz/view"},{"nom":"Marcher par le Saint-Esprit - Partie 3","audio":"https://drive.google.com/file/d/1rXYJqhCLEgiiPPDdcn4Zaec1j8XvfryO/view"},{"nom":"Marcher par le Saint-Esprit - Partie 4","audio":"https://drive.google.com/file/d/1b2NOnzlNSubDOdUrirGpswxHiEjTVhM3/view"}]', 'https://www.youtube.com/watch?v=LTAnt60Rl2s', true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 11, 'L''Eternite', 'Comprendre l''eternite', '2026-10-18', 'https://www.youtube.com/watch?v=ocxaZKbbi_E', NULL, 'https://www.youtube.com/watch?v=ocxaZKbbi_E', true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 11, 'Rattrapage des Devoirs Hebdomadaires', 'Faire des recherches pour son edification spirituelle', '2026-10-18', NULL, NULL, NULL, true, false, false),
  -- WEEK 12: 25 octobre - Rattrapage tous
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 12, 'Rattrapage des Devoirs Hebdomadaires', 'Faire des recherches pour son edification spirituelle', '2026-10-25', NULL, NULL, NULL, true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 12, 'Rattrapage des Devoirs Hebdomadaires', 'Faire des recherches pour son edification spirituelle', '2026-10-25', NULL, NULL, NULL, true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 12, 'Rattrapage des Devoirs Hebdomadaires', 'Faire des recherches pour son edification spirituelle', '2026-10-25', NULL, NULL, NULL, true, false, false),
  -- WEEK 13: 1 novembre - Veillee
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 13, 'Veillee Finale & Exposes', 'Veillee de priere et exposes des etudiants', '2026-11-01', NULL, NULL, NULL, true, false, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 13, 'Veillee Finale & Exposes', 'Veillee de priere et exposes des etudiants', '2026-11-01', NULL, NULL, NULL, true, false, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 13, 'Veillee Finale & Exposes', 'Veillee de priere et exposes des etudiants', '2026-11-01', NULL, NULL, NULL, true, false, false),
  -- WEEK 14: 6 novembre - Examen
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 14, 'Examen Final', 'Examen final de la session', '2026-11-06', NULL, NULL, NULL, true, true, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 14, 'Examen Final', 'Examen final de la session', '2026-11-06', NULL, NULL, NULL, true, true, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 14, 'Examen Final', 'Examen final de la session', '2026-11-06', NULL, NULL, NULL, true, true, false),
  -- WEEK 15: 8 novembre - Agape
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 15, 'Agape, remise des bulletins', 'Vivre la communion fraternelle', '2026-11-08', NULL, NULL, NULL, true, true, false),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 15, 'Agape, remise des bulletins', 'Vivre la communion fraternelle', '2026-11-08', NULL, NULL, NULL, true, true, false),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 15, 'Agape, remise des bulletins', 'Vivre la communion fraternelle', '2026-11-08', NULL, NULL, NULL, true, true, false)
ON CONFLICT (class_id, week) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  session_date = EXCLUDED.session_date, audio_url = EXCLUDED.audio_url,
  audio_parts = EXCLUDED.audio_parts, video_url = EXCLUDED.video_url,
  is_visible = EXCLUDED.is_visible, is_graduation = EXCLUDED.is_graduation,
  is_tronc_commun = EXCLUDED.is_tronc_commun;

COMMIT;

-- =============================================================
-- Recharger le schema PostgREST pour que les fonctions soient visibles
-- =============================================================
SELECT pg_notify('pgrst', 'reload schema');

-- =============================================================
-- VERIFICATION: Affiche tous les cours avec le nombre d'audios
-- =============================================================
SELECT c.name as classe, co.week, co.title, co.session_date,
  CASE WHEN co.audio_parts IS NOT NULL THEN jsonb_array_length(co.audio_parts) ELSE 0 END as nb_audios,
  CASE WHEN co.video_url IS NOT NULL THEN 'OUI' ELSE 'NON' END as video,
  co.is_visible
FROM courses co
JOIN classes c ON co.class_id = c.id
ORDER BY c.name, co.week;
