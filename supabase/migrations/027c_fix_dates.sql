-- Migration 027c: Correction des dates (décalage d'une semaine, pas de cours "Prise de contact")

-- La vision = 16 août (pas 9, car le 9 est prise de contact sans vidéo)
UPDATE courses SET session_date = '2026-08-16'
WHERE title = 'La vision des églises Vases d''Honneur' AND session_date = '2026-08-09';

-- Servir Dieu Classe 1 = 23 août (pas 16)
UPDATE courses SET session_date = '2026-08-23'
WHERE title = 'Servir Dieu' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396' AND session_date = '2026-08-16';

-- Méditation Classe 1 = 30 août (pas 23)
UPDATE courses SET session_date = '2026-08-30'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396' AND session_date = '2026-08-23';

-- Évangélisation Classe 1 = 6 sept (pas 30 août)
UPDATE courses SET session_date = '2026-09-06'
WHERE title = 'L''Évangélisation' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396' AND session_date = '2026-08-30';

-- Croix 1&2 = 13 sept
UPDATE courses SET session_date = '2026-09-13'
WHERE title = 'La Croix 1 & 2' AND session_date = '2026-09-06';

-- Nouvelle Création = 20 sept
UPDATE courses SET session_date = '2026-09-20'
WHERE title = 'La Nouvelle Création' AND session_date = '2026-09-13';

-- Salut = 27 sept
UPDATE courses SET session_date = '2026-09-27'
WHERE title = 'Le Salut' AND session_date = '2026-09-20';

-- Péché = 4 oct
UPDATE courses SET session_date = '2026-10-04'
WHERE title = 'Le péché et ses conséquences' AND session_date = '2026-09-27';

-- Sanctification 1 = 11 oct
UPDATE courses SET session_date = '2026-10-11'
WHERE title = 'La vie de sanctification - Niveau 1' AND session_date = '2026-10-04';

-- Trinité = 18 oct
UPDATE courses SET session_date = '2026-10-18'
WHERE title = 'La Trinité & le Saint-Esprit' AND session_date = '2026-10-11';

-- Méditation Classe 2 = 23 août (pas 16)
UPDATE courses SET session_date = '2026-08-23'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29' AND session_date = '2026-08-16';

-- Servir Dieu Classe 2 = 30 août
UPDATE courses SET session_date = '2026-08-30'
WHERE title = 'Servir Dieu' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29' AND session_date = '2026-08-23';

-- Évangélisation Classe 2 = 6 sept
UPDATE courses SET session_date = '2026-09-06'
WHERE title = 'L''Évangélisation' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29' AND session_date = '2026-08-30';

-- Fausses prophéties = 13 sept
UPDATE courses SET session_date = '2026-09-13'
WHERE title = 'Les fausses prophéties et les fausses doctrines' AND session_date = '2026-09-06';

-- Prière = 20 sept
UPDATE courses SET session_date = '2026-09-20'
WHERE title = 'La vie de prière' AND session_date = '2026-09-13';

-- Amour 1 = 27 sept
UPDATE courses SET session_date = '2026-09-27'
WHERE title = 'L''Amour - Niveau 1' AND session_date = '2026-09-20';

-- Dîmes = 4 oct
UPDATE courses SET session_date = '2026-10-04'
WHERE title = 'Les dîmes et les offrandes' AND session_date = '2026-09-27';

-- Honneur = 11 oct
UPDATE courses SET session_date = '2026-10-11'
WHERE title = 'La loi de l''honneur' AND session_date = '2026-10-04';

-- Éternité = 18 oct
UPDATE courses SET session_date = '2026-10-18'
WHERE title = 'L''Éternité' AND session_date = '2026-10-11';

-- Méditation Classe 3 = 23 août
UPDATE courses SET session_date = '2026-08-23'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7' AND session_date = '2026-08-16';

-- Évangélisation Classe 3 = 30 août
UPDATE courses SET session_date = '2026-08-30'
WHERE title = 'L''Évangélisation' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7' AND session_date = '2026-08-23';

-- Sanctification 2 = 6 sept
UPDATE courses SET session_date = '2026-09-06'
WHERE title = 'La Sanctification - Niveau 2' AND session_date = '2026-08-30';

-- Amour 2 = 13 sept
UPDATE courses SET session_date = '2026-09-13'
WHERE title = 'L''Amour - Niveau 2' AND session_date = '2026-09-06';

-- Communion = 20 sept
UPDATE courses SET session_date = '2026-09-20'
WHERE title = 'La communion fraternelle' AND session_date = '2026-09-13';

-- Foi = 27 sept
UPDATE courses SET session_date = '2026-09-27'
WHERE title = 'La Foi' AND session_date = '2026-09-20';

-- Étoile du Matin = 4 oct (dernier cours avant rattrapage)
UPDATE courses SET session_date = '2026-10-04'
WHERE title = 'L''Étoile du Matin' AND session_date = '2026-09-27';
