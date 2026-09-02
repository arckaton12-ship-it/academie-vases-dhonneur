-- =====================================================
-- UPSERT CLASSES + COURSES WITH ALL AUDIO URLS
-- Migration 087 — SAFE VERSION (no DELETE)
-- =====================================================

-- Upsert classes
INSERT INTO classes (id, name, level) VALUES
  ('980b1f42-0cf1-4990-9ec1-685240ccc396', 'Classe 1', 1),
  ('193612cc-dec7-43fe-8f8b-70e1ee6eec29', 'Classe 2', 2),
  ('3174c6f6-e80f-43b8-bce7-8b2483fa79e7', 'Classe 3', 3),
  ('a0e92a70-b22e-4a26-a710-cf18d89cf201', 'Graduation', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level;

-- Add audio_parts JSONB column
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS audio_parts jsonb;

-- Helper function: upsert a course safely (preserves session_date on update, calculates on insert)
CREATE OR REPLACE FUNCTION _upsert_course(
  p_class_id uuid, p_title text, p_week int,
  p_video_url text, p_audio_url text, p_audio_parts jsonb, p_description text
) RETURNS void AS $$
DECLARE
  v_start_date date;
  v_session_date date;
BEGIN
  IF EXISTS (SELECT 1 FROM courses WHERE class_id = p_class_id AND title = p_title AND week = p_week) THEN
    UPDATE courses
    SET video_url = p_video_url, audio_url = p_audio_url, audio_parts = p_audio_parts, description = p_description
    WHERE class_id = p_class_id AND title = p_title AND week = p_week;
  ELSE
    SELECT start_date INTO v_start_date FROM classes WHERE id = p_class_id;
    IF v_start_date IS NOT NULL THEN
      v_session_date := v_start_date + ((p_week - 1) * interval '7 days')::interval;
    END IF;
    INSERT INTO courses (class_id, title, week, video_url, audio_url, audio_parts, description, session_date)
    VALUES (p_class_id, p_title, p_week, p_video_url, p_audio_url, p_audio_parts, p_description, v_session_date);
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  c1 uuid := '980b1f42-0cf1-4990-9ec1-685240ccc396';
  c2 uuid := '193612cc-dec7-43fe-8f8b-70e1ee6eec29';
  c3 uuid := '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';
BEGIN

  -- TRONC COMMUN (all 3 classes)

  PERFORM _upsert_course(c1, 'La vision des églises Vases d''Honneur', 1,
    'https://www.youtube.com/watch?v=plSLMiajkTg',
    'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view',
    '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view","video":"https://www.youtube.com/watch?v=P0gXkvAr08c"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view","video":"https://www.youtube.com/watch?v=e8rBopM00OA"},{"nom":"Objectifs & Héritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]',
    'Partie 1: Introduction | Partie 2: Mission & Vision | Partie 3: Objectifs & Héritage');
  PERFORM _upsert_course(c2, 'La vision des églises Vases d''Honneur', 1,
    'https://www.youtube.com/watch?v=plSLMiajkTg',
    'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view',
    '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view","video":"https://www.youtube.com/watch?v=P0gXkvAr08c"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view","video":"https://www.youtube.com/watch?v=e8rBopM00OA"},{"nom":"Objectifs & Héritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]',
    'Partie 1: Introduction | Partie 2: Mission & Vision | Partie 3: Objectifs & Héritage');
  PERFORM _upsert_course(c3, 'La vision des églises Vases d''Honneur', 1,
    'https://www.youtube.com/watch?v=plSLMiajkTg',
    'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view',
    '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view","video":"https://www.youtube.com/watch?v=P0gXkvAr08c"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view","video":"https://www.youtube.com/watch?v=e8rBopM00OA"},{"nom":"Objectifs & Héritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]',
    'Partie 1: Introduction | Partie 2: Mission & Vision | Partie 3: Objectifs & Héritage');

  PERFORM _upsert_course(c1, 'Servir Dieu', 2,
    'https://www.youtube.com/watch?v=jHQjNi2G_OQ',
    'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view","video":"https://www.youtube.com/watch?v=8LMaInr0ozc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view","video":"https://www.youtube.com/watch?v=eVwEl532Uqk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view","video":"https://www.youtube.com/watch?v=1Kt-zhkNTnk"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]',
    'Partie 1 | Partie 2 | Partie 3 | Partie 4');
  PERFORM _upsert_course(c2, 'Servir Dieu', 2,
    'https://www.youtube.com/watch?v=jHQjNi2G_OQ',
    'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view","video":"https://www.youtube.com/watch?v=8LMaInr0ozc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view","video":"https://www.youtube.com/watch?v=eVwEl532Uqk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view","video":"https://www.youtube.com/watch?v=1Kt-zhkNTnk"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]',
    'Partie 1 | Partie 2 | Partie 3 | Partie 4');
  PERFORM _upsert_course(c3, 'Servir Dieu', 2,
    'https://www.youtube.com/watch?v=jHQjNi2G_OQ',
    'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view","video":"https://www.youtube.com/watch?v=8LMaInr0ozc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view","video":"https://www.youtube.com/watch?v=eVwEl532Uqk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view","video":"https://www.youtube.com/watch?v=1Kt-zhkNTnk"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]',
    'Partie 1 | Partie 2 | Partie 3 | Partie 4');

  PERFORM _upsert_course(c1, 'La méditation de la Bible & la Bible', 3,
    'https://www.youtube.com/watch?v=0HplIYNz5vg',
    'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view',
    '[{"nom":"La Méditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]',
    'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');
  PERFORM _upsert_course(c2, 'La méditation de la Bible & la Bible', 3,
    'https://www.youtube.com/watch?v=0HplIYNz5vg',
    'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view',
    '[{"nom":"La Méditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]',
    'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');
  PERFORM _upsert_course(c3, 'La méditation de la Bible & la Bible', 3,
    'https://www.youtube.com/watch?v=0HplIYNz5vg',
    'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view',
    '[{"nom":"La Méditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]',
    'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');

  PERFORM _upsert_course(c1, 'L''Évangélisation', 4,
    'https://www.youtube.com/watch?v=mG8wX-w4Nz4',
    'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view',
    '[{"nom":"L''évangélisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]',
    'L''évangélisation');
  PERFORM _upsert_course(c2, 'L''Évangélisation', 4,
    'https://www.youtube.com/watch?v=mG8wX-w4Nz4',
    'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view',
    '[{"nom":"L''évangélisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]',
    'L''évangélisation');
  PERFORM _upsert_course(c3, 'L''Évangélisation', 4,
    'https://www.youtube.com/watch?v=mG8wX-w4Nz4',
    'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view',
    '[{"nom":"L''évangélisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]',
    'L''évangélisation');

  -- CLASSE 1 SPECIFIQUE (weeks 5-10)

  PERFORM _upsert_course(c1, 'La Croix 1 & 2', 5,
    'https://www.youtube.com/watch?v=FMjghc0lTSY',
    'https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view',
    '[{"nom":"La Croix - Partie 1","audio":"https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view","video":"https://www.youtube.com/watch?v=-Ve378589ck"},{"nom":"La Croix - Partie 2","audio":"https://drive.google.com/file/d/1mvBYr1sMMPqp2uGeOlb5yvZAHgYh5b_D/view"}]',
    'Partie 1 | Partie 2');

  PERFORM _upsert_course(c1, 'La Nouvelle Création', 6,
    'https://www.youtube.com/watch?v=6IM_s_n7GU8',
    'https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view","video":"https://www.youtube.com/watch?v=Y2uHmbLqHuQ"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1nkJ2lxwkBSDbjeONkACaarWe-kwcCVD3/view"}]',
    'Partie 1 | Partie 2');

  PERFORM _upsert_course(c1, 'Le Salut', 7,
    'https://www.youtube.com/watch?v=5-KjVUFVH18',
    'https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view","video":"https://www.youtube.com/watch?v=_iHTtnnURIE"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1DZOEYJnsW8vzgD4MlGXgrUHPeO0Nde7R/view","video":"https://www.youtube.com/watch?v=rjNjudcbJhc"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/10ZzuLBOz4oZpzavajuHaSv4tg2phqoaD/view","video":"https://www.youtube.com/watch?v=p2lu3ZAvFIs"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1n48jFZ2HO4yE1icm-G_9Wpp9mSKuEFI_/view"}]',
    'Partie 1 | Partie 2 | Partie 3 | Partie 4');

  PERFORM _upsert_course(c1, 'Le péché et ses conséquences', 8,
    'https://www.youtube.com/watch?v=G2VuVRbvpw4',
    'https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view',
    '[{"nom":"Le péché et ses conséquences","audio":"https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view"}]',
    'Le péché et ses conséquences');

  PERFORM _upsert_course(c1, 'La vie de sanctification - Niveau 1', 9,
    'https://www.youtube.com/watch?v=yU6JipfABMQ',
    'https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view","video":"https://www.youtube.com/watch?v=r8E6aEw6LIc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/15PPjLQLtjnO2UiEqbuveFbuOPEoL0svQ/view","video":"https://www.youtube.com/watch?v=zE7SK8zwKK8"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1ntaUq-CO0a_jTlyAIY1d0rAqz3EgaiWs/view"}]',
    'Partie 1 | Partie 2 | Partie 3');

  PERFORM _upsert_course(c1, 'La Trinité & le Saint-Esprit', 10,
    'https://www.youtube.com/watch?v=LTAnt60Rl2s',
    'https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view',
    '[{"nom":"La Trinité","audio":"https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view"},{"nom":"Marcher par le Saint-Esprit - Partie 1","audio":"https://drive.google.com/file/d/1yYDq40-EOZoa9lWgRD_hEWlDYBapm1ja/view"},{"nom":"Marcher par le Saint-Esprit - Partie 2","audio":"https://drive.google.com/file/d/1fknpfq53a8IjZeH3AgtpTHnNQaK8mYzz/view"},{"nom":"Marcher par le Saint-Esprit - Partie 3","audio":"https://drive.google.com/file/d/1rXYJqhCLEgiiPPDdcn4Zaec1j8XvfryO/view"},{"nom":"Marcher par le Saint-Esprit - Partie 4","audio":"https://drive.google.com/file/d/1b2NOnzlNSubDOdUrirGpswxHiEjTVhM3/view"}]',
    'La Trinité | Marcher par le Saint-Esprit (4 parties)');

  -- CLASSE 2 SPECIFIQUE (weeks 5-10)

  PERFORM _upsert_course(c2, 'Les fausses prophéties et les fausses doctrines', 5,
    'https://www.youtube.com/watch?v=2UvhiGy4XQE', NULL, NULL, 'Partie 1-9');

  PERFORM _upsert_course(c2, 'La vie de prière', 6,
    'https://www.youtube.com/watch?v=IEwu7DExxS4', NULL, NULL, 'La vie de prière');

  PERFORM _upsert_course(c2, 'L''Amour - Niveau 1', 7,
    'https://www.youtube.com/watch?v=q559A0aFybQ', NULL, NULL, 'L''Amour - Niveau 1');

  PERFORM _upsert_course(c2, 'Les dîmes et les offrandes', 8,
    'https://www.youtube.com/watch?v=dH7548qIRkI', NULL, NULL, 'Les dîmes et les offrandes');

  PERFORM _upsert_course(c2, 'La loi de l''honneur', 9,
    'https://www.youtube.com/watch?v=TtoS2fzkHCM', NULL, NULL, 'La loi de l''honneur');

  PERFORM _upsert_course(c2, 'L''Éternité', 10,
    'https://www.youtube.com/watch?v=ocxaZKbbi_E', NULL, NULL, 'L''Éternité');

  -- CLASSE 3 SPECIFIQUE (weeks 5-8)

  PERFORM _upsert_course(c3, 'La Sanctification - Niveau 2', 5,
    'https://www.youtube.com/watch?v=XsKO_Lsux_s',
    'https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view","video":"https://www.youtube.com/watch?v=h2rQgikip20"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1IpLWb1wxVHGir-LsercdVSm1J0ykUMqb/view"}]',
    'Partie 1 | Partie 2');

  PERFORM _upsert_course(c3, 'L''Amour - Niveau 2', 6,
    'https://www.youtube.com/watch?v=fTYfItmGxxU',
    'https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view","video":"https://www.youtube.com/watch?v=vsRjyG7oHCM"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1AekJUxowd0Q1J7D4TCzKIn-jqT1s0CqF/view","video":"https://www.youtube.com/watch?v=tcd-Zb4Iyjo"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1zNK73p_p42v3Dn2EpcQE0niqq86dm_CQ/view"}]',
    'Partie 1 | Partie 2 | Partie 3');

  PERFORM _upsert_course(c3, 'La communion fraternelle', 7,
    'https://www.youtube.com/watch?v=7Zoof_AEy1A',
    'https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view',
    '[{"nom":"La communion fraternelle","audio":"https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view"}]',
    'La communion fraternelle');

  PERFORM _upsert_course(c3, 'La Foi', 8,
    'https://www.youtube.com/watch?v=0XHzdOKbdzw',
    'https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view',
    '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view","video":"https://www.youtube.com/watch?v=PwDWl6ScOcI"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/18rCg9EfYHY5WKdQnFSALJiJ_eig47bFJ/view","video":"https://www.youtube.com/watch?v=hBOfjfLXiEk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1Yg0oB1ePvqqe6wlMUpPVx7m7zo5t4KCH/view","video":"https://www.youtube.com/watch?v=lU0bf1rKw8A"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1FsvAzQGdue2wrus_ZWf7NWBtWsQQ11iJ/view","video":"https://www.youtube.com/watch?v=ynNai8korY4"},{"nom":"Partie 5","audio":"https://drive.google.com/file/d/1ECfSFMD9N93mwGO1p6QD9UUBI1nwqy_0/view","video":"https://www.youtube.com/watch?v=KQCLFlNWR-I"},{"nom":"Partie 6","audio":"https://drive.google.com/file/d/1xVVIShonXfWSAO_AopqO9b35jGpwraga/view","video":"https://www.youtube.com/watch?v=acoUUR9P42Y"},{"nom":"Partie 7","audio":"https://drive.google.com/file/d/1efmWaax5Aic1vW7jY3s9DQ36VpHwmjym/view"}]',
    'Partie 1 | Partie 2 | Partie 3 | Partie 4 | Partie 5 | Partie 6 | Partie 7');

END $$;

-- Cleanup helper function
DROP FUNCTION IF EXISTS _upsert_course(uuid, text, int, text, text, jsonb, text);

SELECT pg_notify('pgrst', 'reload schema');
