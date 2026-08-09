-- Migration 019: Seed real courses from media_cours_academie.json
-- Deletes demo courses and inserts the 12 real courses with YouTube/Drive URLs

-- First, delete existing demo courses (from 009_seed_demo.sql)
DELETE FROM courses WHERE title IN (
  'La Semence qui donne la Vie',
  'La Vigne et les Sarments',
  'La Coupe de la Bénédiction',
  'Le Vase d''Honneur',
  'La Perle de Grand Prix',
  'Le Trésor dans le Champ',
  'L''Huile de l''Onction',
  'La Moisson est Grande',
  'L''Etoile du Matin'
);

-- Also delete any demo assignments linked to these courses
DELETE FROM assignments WHERE course_id NOT IN (SELECT id FROM courses);

DO $$
DECLARE
  c1_id uuid;
  c2_id uuid;
  c3_id uuid;
BEGIN
  SELECT id INTO c1_id FROM classes WHERE name = 'Classe 1';
  SELECT id INTO c2_id FROM classes WHERE name = 'Classe 2';
  SELECT id INTO c3_id FROM classes WHERE name = 'Classe 3';

  -- ============================================================
  -- TRONC COMMUN (shared by all 3 classes)
  -- ============================================================

  -- Cours 1: La vision des églises Vases d'Honneur
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La vision des églises Vases d''Honneur', 1, 'https://www.youtube.com/watch?v=plSLMiajkTg', 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view', 'Partie 1: Introduction - https://www.youtube.com/watch?v=P0gXkvAr08c | Partie 2: Mission & Vision - https://www.youtube.com/watch?v=e8rBopM00OA | Partie 3: Objectifs & Héritage');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'La vision des églises Vases d''Honneur', 1, 'https://www.youtube.com/watch?v=plSLMiajkTg', 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view', 'Partie 1: Introduction - https://www.youtube.com/watch?v=P0gXkvAr08c | Partie 2: Mission & Vision - https://www.youtube.com/watch?v=e8rBopM00OA | Partie 3: Objectifs & Héritage');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'La vision des églises Vases d''Honneur', 1, 'https://www.youtube.com/watch?v=plSLMiajkTg', 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view', 'Partie 1: Introduction - https://www.youtube.com/watch?v=P0gXkvAr08c | Partie 2: Mission & Vision - https://www.youtube.com/watch?v=e8rBopM00OA | Partie 3: Objectifs & Héritage');

  -- Cours 2: Servir Dieu
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'Servir Dieu', 2, 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view', 'Partie 1 - https://www.youtube.com/watch?v=8LMaInr0ozc | Partie 2 - https://www.youtube.com/watch?v=eVwEl532Uqk | Partie 3 - https://www.youtube.com/watch?v=1Kt-zhkNTnk');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'Servir Dieu', 2, 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view', 'Partie 1 - https://www.youtube.com/watch?v=8LMaInr0ozc | Partie 2 - https://www.youtube.com/watch?v=eVwEl532Uqk | Partie 3 - https://www.youtube.com/watch?v=1Kt-zhkNTnk');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'Servir Dieu', 2, 'https://www.youtube.com/watch?v=jHQjNi2G_OQ', 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view', 'Partie 1 - https://www.youtube.com/watch?v=8LMaInr0ozc | Partie 2 - https://www.youtube.com/watch?v=eVwEl532Uqk | Partie 3 - https://www.youtube.com/watch?v=1Kt-zhkNTnk');

  -- Cours 3: La méditation de la Bible & la Bible
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La méditation de la Bible & la Bible', 3, 'https://www.youtube.com/watch?v=0HplIYNz5vg', 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view', 'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'La méditation de la Bible & la Bible', 3, 'https://www.youtube.com/watch?v=0HplIYNz5vg', 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view', 'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'La méditation de la Bible & la Bible', 3, 'https://www.youtube.com/watch?v=0HplIYNz5vg', 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view', 'La Méditation de la Bible | La Bible Partie 1 | La Bible Partie 2');

  -- Cours 4: L'Évangélisation
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'L''Évangélisation', 4, 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view', 'L''évangélisation');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'L''Évangélisation', 4, 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view', 'L''évangélisation');
  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'L''Évangélisation', 4, 'https://www.youtube.com/watch?v=mG8wX-w4Nz4', 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view', 'L''évangélisation');

  -- ============================================================
  -- CLASSE 1 SPECIFIQUE (cours 5-10)
  -- ============================================================

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La Croix 1 & 2', 5, 'https://www.youtube.com/watch?v=FMjghc0lTSY', 'https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view', 'Partie 1: https://www.youtube.com/watch?v=-Ve378589ck | Partie 2');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La Nouvelle Création', 6, 'https://www.youtube.com/watch?v=6IM_s_n7GU8', 'https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view', 'Partie 1: https://www.youtube.com/watch?v=Y2uHmbLqHuQ | Partie 2');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'Le Salut', 7, 'https://www.youtube.com/watch?v=5-KjVUFVH18', 'https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view', 'Partie 1: https://www.youtube.com/watch?v=_iHTtnnURIE | Partie 2: https://www.youtube.com/watch?v=rjNjudcbJhc | Partie 3: https://www.youtube.com/watch?v=p2lu3ZAvFIs');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'Le péché et ses conséquences', 8, 'https://www.youtube.com/watch?v=G2VuVRbvpw4', 'https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view', 'Le péché et ses conséquences');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La vie de sanctification - Niveau 1', 9, 'https://www.youtube.com/watch?v=yU6JipfABMQ', 'https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view', 'Partie 1: https://www.youtube.com/watch?v=r8E6aEw6LIc | Partie 2: https://www.youtube.com/watch?v=zE7SK8zwKK8');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c1_id, 'La Trinité & le Saint-Esprit', 10, 'https://www.youtube.com/watch?v=LTAnt60Rl2s', 'https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view', 'La Trinité | Marcher par le Saint-Esprit (4 parties)');

  -- ============================================================
  -- CLASSE 2 SPECIFIQUE (cours 5-10)
  -- ============================================================

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'Les fausses prophéties et les fausses doctrines', 5, 'https://www.youtube.com/watch?v=2UvhiGy4XQE', NULL, 'Partie 1-9: https://www.youtube.com/watch?v=K5xmmVUHg_c et suite');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'La vie de prière', 6, 'https://www.youtube.com/watch?v=IEwu7DExxS4', NULL, 'La vie de prière');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'L''Amour - Niveau 1', 7, 'https://www.youtube.com/watch?v=q559A0aFybQ', NULL, 'L''Amour - Niveau 1');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'Les dîmes et les offrandes', 8, 'https://www.youtube.com/watch?v=dH7548qIRkI', NULL, 'Les dîmes et les offrandes');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'La loi de l''honneur', 9, 'https://www.youtube.com/watch?v=TtoS2fzkHCM', NULL, 'La loi de l''honneur');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c2_id, 'L''Éternité', 10, 'https://www.youtube.com/watch?v=ocxaZKbbi_E', NULL, 'Partie 1: https://www.youtube.com/watch?v=81bLcpfJ7hQ');

  -- ============================================================
  -- CLASSE 3 SPECIFIQUE (cours 5-10)
  -- ============================================================

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'La Sanctification - Niveau 2', 5, 'https://www.youtube.com/watch?v=XsKO_Lsux_s', 'https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view', 'Partie 1: https://www.youtube.com/watch?v=h2rQgikip20 | Partie 2');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'L''Amour - Niveau 2', 6, 'https://www.youtube.com/watch?v=fTYfItmGxxU', 'https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view', 'Partie 1: https://www.youtube.com/watch?v=vsRjyG7oHCM | Partie 2: https://www.youtube.com/watch?v=tcd-Zb4Iyjo');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'La communion fraternelle', 7, 'https://www.youtube.com/watch?v=7Zoof_AEy1A', 'https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view', 'La communion fraternelle');

  INSERT INTO courses (class_id, title, week, video_url, audio_url, description) VALUES
  (c3_id, 'La Foi', 8, 'https://www.youtube.com/watch?v=0XHzdOKbdzw', 'https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view', 'Partie 1: https://www.youtube.com/watch?v=PwDWl6ScOcI | Partie 2: https://www.youtube.com/watch?v=hBOfjfLXiEk | Partie 3: https://www.youtube.com/watch?v=lU0bf1rKw8A | Partie 4: https://www.youtube.com/watch?v=ynNai8korY4 | Partie 5: https://www.youtube.com/watch?v=KQCLFlNWR-I | Partie 6: https://www.youtube.com/watch?v=acoUUR9P42Y');

END $$;
