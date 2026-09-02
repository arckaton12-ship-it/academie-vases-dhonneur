-- =====================================================
-- MAP AUDIO URLs FROM media_cours_academie.json TO COURSES
-- Migration 087
-- =====================================================

-- TRONC COMMUN audios (all 3 classes)

-- Cours 1: La vision des églises Vases d'Honneur
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view'
WHERE title ILIKE '%vision%vases%' AND week = 2;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view'
WHERE title ILIKE '%vision%vases%' AND week = 2 AND audio_url IS NULL;

-- Cours 2: Servir Dieu
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view'
WHERE title ILIKE '%servir%dieu%' AND week = 4;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view'
WHERE title ILIKE '%servir%dieu%' AND week = 4 AND audio_url IS NULL;

-- Cours 3: La méditation de la Bible
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view'
WHERE title ILIKE '%méditation%' AND week = 3;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view'
WHERE title ILIKE '%méditation%' AND week = 3 AND audio_url IS NULL;

-- Cours 4: L'Évangélisation
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view'
WHERE title ILIKE '%vangélisation%' AND week = 5;

-- CLASSE 1 audios

-- Cours 5: La Croix
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1IHLIcfzLug19bB_1fM-GsAfg9nzWfIxo/view'
WHERE title ILIKE '%croix%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 1);
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1mvBYr1sMMPqp2uGeOlb5yvZAHgYh5b_D/view'
WHERE title ILIKE '%croix%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 1) AND audio_url IS NULL;

-- Cours 6: La Nouvelle Création
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1Mo94nGHFogCj-fuaiJUnT2rrgwd3bpAO/view'
WHERE title ILIKE '%nouvelle%création%' AND week = 7;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1nkJ2lxwkBSDbjeONkACaarWe-kwcCVD3/view'
WHERE title ILIKE '%nouvelle%création%' AND week = 7 AND audio_url IS NULL;

-- Cours 7: Le Salut
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1tT0L1psPA1fovfJe23itsbAxYgN2MHVZ/view'
WHERE title ILIKE '%salut%' AND week = 8;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1DZOEYJnsW8vzgD4MlGXgrUHPeO0Nde7R/view'
WHERE title ILIKE '%salut%' AND week = 8 AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/10ZzuLBOz4oZpzavajuHaSv4tg2phqoaD/view'
WHERE title ILIKE '%salut%' AND week = 8 AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1n48jFZ2HO4yE1icm-G_9Wpp9mSKuEFI_/view'
WHERE title ILIKE '%salut%' AND week = 8 AND audio_url IS NULL;

-- Cours 8: Le péché et ses conséquences
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1NactvCjKLg_8OGGqiJyHtQGZmiBQhQlc/view'
WHERE title ILIKE '%péché%' AND week = 9;

-- Cours 9: La vie de sanctification - Niveau 1
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1nPZxYdLUZwcj8XaLi-Qdj-8bw1tQ1QGI/view'
WHERE title ILIKE '%sanctification%' AND week = 10 AND class_id = (SELECT id FROM public.classes WHERE level = 1);
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/15PPjLQLtjnO2UiEqbuveFbuOPEoL0svQ/view'
WHERE title ILIKE '%sanctification%' AND week = 10 AND class_id = (SELECT id FROM public.classes WHERE level = 1) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1ntaUq-CO0a_jTlyAIY1d0rAqz3EgaiWs/view'
WHERE title ILIKE '%sanctification%' AND week = 10 AND class_id = (SELECT id FROM public.classes WHERE level = 1) AND audio_url IS NULL;

-- Cours 10: La Trinité & le Saint-Esprit
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1kspeoU8c6u14AcSMuCF41AzKJvgefhV5/view'
WHERE title ILIKE '%trinité%' AND week = 11;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1yYDq40-EOZoa9lWgRD_hEWlDYBapm1ja/view'
WHERE title ILIKE '%trinité%' AND week = 11 AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1fknpfq53a8IjZeH3AgtpTHnNQaK8mYzz/view'
WHERE title ILIKE '%trinité%' AND week = 11 AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1rXYJqhCLEgiiPPDdcn4Zaec1j8XvfryO/view'
WHERE title ILIKE '%trinité%' AND week = 11 AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1b2NOnzlNSubDOdUrirGpswxHiEjTVhM3/view'
WHERE title ILIKE '%trinité%' AND week = 11 AND audio_url IS NULL;

-- CLASSE 3 audios

-- Cours 5: La Sanctification - Niveau 2
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view'
WHERE title ILIKE '%sanctification%' AND week = 5 AND class_id = (SELECT id FROM public.classes WHERE level = 3);
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1IpLWb1wxVHGir-LsercdVSm1J0ykUMqb/view'
WHERE title ILIKE '%sanctification%' AND week = 5 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;

-- Cours 6: L'Amour - Niveau 2
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view'
WHERE title ILIKE '%amour%2%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 3);
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1AekJUxowd0Q1J7D4TCzKIn-jqT1s0CqF/view'
WHERE title ILIKE '%amour%2%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1zNK73p_p42v3Dn2EpcQE0niqq86dm_CQ/view'
WHERE title ILIKE '%amour%2%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;

-- Cours 7: La communion fraternelle
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view'
WHERE title ILIKE '%communion%' AND week = 7 AND class_id = (SELECT id FROM public.classes WHERE level = 3);

-- Cours 8: La Foi
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3);
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/18rCg9EfYHY5WKdQnFSALJiJ_eig47bFJ/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1Yg0oB1ePvqqe6wlMUpPVx7m7zo5t4KCH/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1FsvAzQGdue2wrus_ZWf7NWBtWsQQ11iJ/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1ECfSFMD9N93mwGO1p6QD9UUBI1nwqy_0/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1xVVIShonXfWSAO_AopqO9b35jGpwraga/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;
UPDATE public.courses SET audio_url = 'https://drive.google.com/file/d/1efmWaax5Aic1vW7jY3s9DQ36VpHwmjym/view'
WHERE title ILIKE '%foi%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 3) AND audio_url IS NULL;

SELECT pg_notify('pgrst', 'reload schema');
