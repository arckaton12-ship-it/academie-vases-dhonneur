-- =====================================================
-- MAP MEDIA FROM media_cours_academie.json TO COURSES
-- Migration 048
-- =====================================================

-- TRONC COMMUN (all 3 classes)
UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=plSLMiajkTg'
WHERE title ILIKE '%vision%vases%' AND week = 2;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=0HplIYNz5vg'
WHERE title ILIKE '%méditation%' AND week = 3;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=jHQjNi2G_OQ'
WHERE title ILIKE '%servir%dieu%' AND week = 4;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=mG8wX-w4Nz4'
WHERE title ILIKE '%vangélisation%' AND week = 5;

-- CLASSE 1 SPECIFIC (level = 1)
UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=FMjghc0lTSY'
WHERE title ILIKE '%croix%' AND week = 6 AND class_id = (SELECT id FROM public.classes WHERE level = 1);

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=6IM_s_n7GU8'
WHERE title ILIKE '%nouvelle%création%' AND week = 7;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=5-KjVUFVH18'
WHERE title ILIKE '%salut' AND week = 8;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=G2VuVRbvpw4'
WHERE title ILIKE '%péché%' AND week = 9;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=yU6JipfABMQ'
WHERE title ILIKE '%sanctification%' AND week = 10;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=LTAnt60Rl2s'
WHERE title ILIKE '%trinité%' AND week = 11;

-- CLASSE 2 SPECIFIC (level = 2)
UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=2UvhiGy4XQE'
WHERE title ILIKE '%fausses%prophéties%' AND week = 6;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=IEwu7DExxS4'
WHERE title ILIKE '%prière' AND week = 7;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=q559A0aFybQ'
WHERE title ILIKE '%amour%' AND week = 8 AND class_id = (SELECT id FROM public.classes WHERE level = 2);

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=dH7548qIRkI'
WHERE title ILIKE '%dîmes%' AND week = 9;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=TtoS2fzkHCM'
WHERE title ILIKE '%loi%honneur%' AND week = 10;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=ocxaZKbbi_E'
WHERE title ILIKE '%ternité%' AND week = 11;

-- CLASSE 3 SPECIFIC (level = 3)
UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=XsKO_Lsux_s'
WHERE title ILIKE '%sanctification%' AND week = 5;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=fTYfItmGxxU'
WHERE title ILIKE '%amour%niveau%2%partie%' AND week = 6;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=7Zoof_AEy1A'
WHERE title ILIKE '%communion%' AND week = 7;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=0XHzdOKbdzw'
WHERE title ILIKE '%foi%' AND week = 8;

UPDATE public.courses SET video_url = 'https://www.youtube.com/watch?v=0XHzdOKbdzw'
WHERE title ILIKE '%foi%partie%2' AND week = 9;
