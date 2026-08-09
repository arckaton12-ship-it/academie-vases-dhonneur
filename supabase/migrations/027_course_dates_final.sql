-- Migration 027: Dates réelles + objectifs pédagogiques (Session 9 août → 8 nov 2026)
-- Classes: 980b1f42 (Classe 1), 193612cc (Classe 2), 3174c6f6 (Classe 3)

-- ===== TRONC COMMUN (toutes les classes) =====
-- "La vision des églises Vases d'Honneur" → 16 août (9 août = prise de contact, pas de cours vidéo)

UPDATE courses SET session_date = '2026-08-16',
  description = 'Découvrir la vision de l''Académie Vases d''Honneur : pourquoi existons-nous, quelle est notre mission. Objectif : chaque étudiant s''approprie la vision et s''engage.'
WHERE title = 'La vision des églises Vases d''Honneur';

-- ===== CLASSE 1 : Connaître & Servir Christ (980b1f42) =====

UPDATE courses SET session_date = '2026-08-23',
  description = 'Le service chrétien : servir Dieu et servir les autres avec excellence. Objectif : identifier son domaine de service et s''y engager concrettement.'
WHERE title = 'Servir Dieu' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-08-30',
  description = 'Techniques de méditation biblique et discipline du temps personnel avec Dieu. Objectif : établir une habitude quotidienne de méditation.'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-09-06',
  description = 'Principes de l''évangélisation effective : témoigner de sa foi avec amour et respect. Objectif : pouvoir partager son témoignage en 2 minutes.'
WHERE title = 'L''Évangélisation' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-09-13',
  description = 'Signification de la croix : sacrifice, rédemption, identité en Christ. Objectif : comprendre et expliquer le message de la croix à autrui.'
WHERE title = 'La Croix 1 & 2' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-09-20',
  description = 'La nouvelle création en Christ : transformation de l''identité et du mode de vie. Objectif : vivre en nouvelle création au quotidien.'
WHERE title = 'La Nouvelle Création' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-09-27',
  description = 'Le salut par la grâce : comprendre le plan de salut et le vivre pleinement. Objectif : être capable d''expliquer le salut à quelqu''un.'
WHERE title = 'Le Salut' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-10-04',
  description = 'Nature du péché, ses conséquences sur l''homme et la création. Objectif : identifier les pièges du péché et en sortir.'
WHERE title = 'Le péché et ses conséquences' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-10-11',
  description = 'La sanctification au quotidien : séparation du monde, consécration à Dieu. Objectif : établir des routines de vie sainte.'
WHERE title = 'La vie de sanctification - Niveau 1' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

UPDATE courses SET session_date = '2026-10-18',
  description = 'La doctrine de la Trinité et l''œuvre du Saint-Esprit dans la vie du croyant. Objectif : reconnaître et répondre à la direction du Saint-Esprit.'
WHERE title = 'La Trinité & le Saint-Esprit' AND class_id = '980b1f42-0cf1-4990-9ec1-685240ccc396';

-- ===== CLASSE 2 : Croître avec Jésus (193612cc) =====

UPDATE courses SET session_date = '2026-08-23',
  description = 'Approfondir la méditation biblique : méthodes avancées, étude contextuelle. Objectif : maîtriser 3 méthodes de méditation différentes.'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-08-30',
  description = 'Servir avec maturité : leadership servant, responsabilité dans l''église. Objectif : identifier et exercer son don de service.'
WHERE title = 'Servir Dieu' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-09-06',
  description = 'L''évangélisation dans le monde moderne : approches adaptées à différentes cultures. Objectif : adapter son message à son public cible.'
WHERE title = 'L''Évangélisation' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-09-13',
  description = 'Discerner les fausses prophéties et les fausses doctrines. Objectif : tester toute doctrine à la lumière de la Bible.'
WHERE title = 'Les fausses prophéties et les fausses doctrines' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-09-20',
  description = 'La prière comme mode de vie : types de prière, persévérance, intercession. Objectif : développer une vie de prière structurée.'
WHERE title = 'La vie de prière' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-09-27',
  description = 'L''amour chrétien : agapé, fraternité, pardon. Objectif : vivre l''amour concret dans les relations quotidiennes.'
WHERE title = 'L''Amour - Niveau 1' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-10-04',
  description = 'Principe biblique des dîmes et offrandes : générosité, fidélité financière. Objectif : comprendre et appliquer le principe de la dîme.'
WHERE title = 'Les dîmes et les offrandes' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-10-11',
  description = 'La loi de l''honneur : vivre avec intégrité, respect, excellence. Objectif : appliquer la loi de l''honneur dans chaque domaine de vie.'
WHERE title = 'La loi de l''honneur' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

UPDATE courses SET session_date = '2026-10-18',
  description = 'L''éternité : le destin de l''homme au-delà de cette vie. Objectif : avoir une vision claire de l''éternité et en témoigner.'
WHERE title = 'L''Éternité' AND class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29';

-- ===== CLASSE 3 : Consécration (3174c6f6) =====

UPDATE courses SET session_date = '2026-08-23',
  description = 'Méditation biblique avancée pour le ministère. Objectif : devenir un médiateur de la Parole pour les autres.'
WHERE title = 'La méditation de la Bible & la Bible' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-08-30',
  description = 'L''évangélisation comme style de vie pour le leader consacré. Objectif : former d''autres évangélistes.'
WHERE title = 'L''Évangélisation' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-09-06',
  description = 'La sanctification profonde : niveau 2. Objectif : atteindre un niveau de consécration qui inspire les autres.'
WHERE title = 'La Sanctification - Niveau 2' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-09-13',
  description = 'L''amour au niveau 2 : amour sacrificial, amour des ennemis. Objectif : aimer comme Jésus a aimé.'
WHERE title = 'L''Amour - Niveau 2' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-09-20',
  description = 'La communion fraternelle : unité dans le corps de Christ. Objectif : construire et maintenir l''unité dans la communauté.'
WHERE title = 'La communion fraternelle' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-09-27',
  description = 'La foi active : marcher par la foi et non par la vue. Objectif : développer une foi inébranlable pour le ministère.'
WHERE title = 'La Foi' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';

UPDATE courses SET session_date = '2026-10-04',
  description = 'L''Étoile du Matin : méditation profonde sur la Parole comme guide pour la vie quotidienne.'
WHERE title = 'L''Étoile du Matin' AND class_id = '3174c6f6-e80f-43b8-bce7-8b2483fa79e7';
