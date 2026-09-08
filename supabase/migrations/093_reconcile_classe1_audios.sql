-- =====================================================
-- 093: RECONCILE Classe 1 AUDIOS (réalignement par titre)
-- Problème : la base a été renumerotée (ajout de la semaine
-- "Rentrée" en w1, insertion de "L'Evangélisation" en w5, etc.)
-- sans resynchroniser audio_url / audio_parts / video_url.
-- Résultat : chaque cours de la Classe 1 (w5→w11) liste l'audio
-- du cours SUIVANT (décalage +1 semaine).
-- Ce fichier réaligne par TITRE (la leçon est la vérité) en
-- reprenant les valeurs autoritaires de la migration 087.
-- =====================================================

-- Classe 1 w5 — L'Evangélisation (audio manquant : doit avoir l'audio de la migration "L'Évangélisation" w4)
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=mG8wX-w4Nz4',
  audio_url = 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view',
  audio_parts = '[{"nom":"L''evangelisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]'::jsonb
WHERE id = 'd5516ece-0232-4b21-af66-25afaecf004f';

-- Classe 1 w6 — La croix 1 & 2 (avait l'audio de "La Nouvelle Création" ; doit avoir l'audio "La Croix")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=FMjghc0lTSY',
  audio_url = 'https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view',
  audio_parts = '[{"nom":"La Croix - Partie 1","audio":"https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view","video":"https://www.youtube.com/watch?v=-Ve378589ck"},{"nom":"La Croix - Partie 2","audio":"https://drive.google.com/file/d/1mvBYr1sMMPqp2uGeOlb5yvZAHgYh5b_D/view"}]'::jsonb
WHERE id = '8a7b827a-1356-4fd0-8c75-4e30e00f96e8';

-- Classe 1 w7 — La Nouvelle Création (avait l'audio de "Le Salut" ; doit avoir l'audio "La Nouvelle Création")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=6IM_s_n7GU8',
  audio_url = 'https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view',
  audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view","video":"https://www.youtube.com/watch?v=Y2uHmbLqHuQ"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1nkJ2lxwkBSDbjeONkACaarWe-kwcCVD3/view"}]'::jsonb
WHERE id = '1c2b0c29-f737-410d-bf38-558eafc97165';

-- Classe 1 w8 — Le salut (avait l'audio de "Le péché" ; doit avoir l'audio "Le Salut")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=5-KjVUFVH18',
  audio_url = 'https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view',
  audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view","video":"https://www.youtube.com/watch?v=_iHTtnnURIE"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1DZOEYJnsW8vzgD4MlGXgrUHPeO0Nde7R/view","video":"https://www.youtube.com/watch?v=rjNjudcbJhc"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/10ZzuLBOz4oZpzavajuHaSv4tg2phqoaD/view","video":"https://www.youtube.com/watch?v=p2lu3ZAvFIs"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1n48jFZ2HO4yE1icm-G_9Wpp9mSKuEFI_/view"}]'::jsonb
WHERE id = '838187ae-060f-47b1-939f-1ad64f616586';

-- Classe 1 w9 — Le péché et ses conséquences (avait l'audio de "La vie de sanctification" ; doit avoir l'audio "Le péché")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=G2VuVRbvpw4',
  audio_url = 'https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view',
  audio_parts = '[{"nom":"Le peche et ses consequences","audio":"https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view"}]'::jsonb
WHERE id = '61c0d5ee-af2b-43ad-acc2-25df8f52b625';

-- Classe 1 w10 — La vie de sanctification (partie I) (avait l'audio de "La Trinité" ; doit avoir l'audio "La vie de sanctification")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=yU6JipfABMQ',
  audio_url = 'https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view',
  audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view","video":"https://www.youtube.com/watch?v=r8E6aEw6LIc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/15PPjLQLtjnO2UiEqbuveFbuOPEoL0svQ/view","video":"https://www.youtube.com/watch?v=zE7SK8zwKK8"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1ntaUq-CO0a_jTlyAIY1d0rAqz3EgaiWs/view"}]'::jsonb
WHERE id = '56d93363-7c57-4f1a-b7f6-01ef22906e86';

-- Classe 1 w11 — La Trinité et le Saint-Esprit (audio manquant ; doit avoir l'audio "La Trinité")
UPDATE courses SET
  video_url = 'https://www.youtube.com/watch?v=LTAnt60Rl2s',
  audio_url = 'https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view',
  audio_parts = '[{"nom":"La Trinité","audio":"https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view"},{"nom":"Marcher par le Saint-Esprit - Partie 1","audio":"https://drive.google.com/file/d/1yYDq40-EOZoa9lWgRD_hEWlDYBapm1ja/view"},{"nom":"Marcher par le Saint-Esprit - Partie 2","audio":"https://drive.google.com/file/d/1fknpfq53a8IjZeH3AgtpTHnNQaK8mYzz/view"},{"nom":"Marcher par le Saint-Esprit - Partie 3","audio":"https://drive.google.com/file/d/1rXYJqhCLEgiiPPDdcn4Zaec1j8XvfryO/view"},{"nom":"Marcher par le Saint-Esprit - Partie 4","audio":"https://drive.google.com/file/d/1b2NOnzlNSubDOdUrirGpswxHiEjTVhM3/view"}]'::jsonb
WHERE id = '7f9110b6-53a2-457a-8a93-08787b5e36be';

SELECT pg_notify('pgrst', 'reload schema');