-- Migration 027: Ajout des dates réelles et objectifs pédagogiques aux cours
-- Session 9 août → 8 novembre 2026

-- ===== CLASSE 1 : Connaître & Servir Christ =====

UPDATE courses SET
  session_date = '2026-08-09',
  description = 'Prise de contact entre étudiants et formateurs. Présentation du programme, binômage, règlement intérieur. Objectif : créer un lien fraternel solide.'
WHERE title ILIKE '%prise de contact%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-16',
  description = 'Découvrir la vision de l''Académie Vases d''Honneur : pourquoi existons-nous, quelle est notre mission. Objectif : chaque étudiant comprend et s''approprie la vision.'
WHERE title ILIKE '%vision%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-23',
  description = 'Comprendre le service chrétien : servir Dieu et servir les autres avec excellence. Objectif : identifier son domaine de service et s''y engager.'
WHERE title ILIKE '%servir dieu%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-30',
  description = 'Techniques de méditation biblique et discipline du temps personnel avec Dieu. Objectif : établir une habitude quotidienne de méditation.'
WHERE title ILIKE '%méditation%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-06',
  description = 'Principes de l''évangélisation effective : témoigner de sa foi avec amour et respect. Objectif : pouvoir partager son témoignage en 2 minutes.'
WHERE title ILIKE '%vangélisation%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-13',
  description = 'Signification de la croix : sacrifice, rédemption, identité en Christ. Objectif : comprendre et expliquer le message de la croix.'
WHERE title ILIKE '%croix%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-20',
  description = 'Qu''est-ce que la nouvelle création en Christ ? Transformation de l''identité et du mode de vie. Objectif : vivre en nouvelle création au quotidien.'
WHERE title ILIKE '%nouvelle création%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-27',
  description = 'Le salut par la grâce : comprendre le plan de salut et le vivre pleinement. Objectif : être capable d''expliquer le salut à quelqu''un.'
WHERE title ILIKE '%salut%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-04',
  description = 'Nature du péché, ses conséquences sur l''homme et la création. Objectif : identifier les pièges du péché et développer une vie de sanctification.'
WHERE title ILIKE '%péché%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-11',
  description = 'Pratique de la sanctification au quotidien : séparation du monde, consécration à Dieu. Objectif : établir des routines de sanctification personnelle.'
WHERE title ILIKE '%sanctification%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-18',
  description = 'La doctrine de la Trinité et l''œuvre du Saint-Esprit dans la vie du croyant. Objectif : reconnaître et répondre à la direction du Saint-Esprit.'
WHERE title ILIKE '%trinité%' OR title ILIKE '%saint-esprit%' AND class_id = (SELECT id FROM classes WHERE name = 'Connaître & Servir Christ' LIMIT 1);

-- ===== CLASSE 2 : Croître avec Jésus =====

UPDATE courses SET
  session_date = '2026-08-09',
  description = 'Prise de contact et binômage. Objectif : créer un lien fraternel et découvrir son binôme.'
WHERE title ILIKE '%prise de contact%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-16',
  description = 'Rappel de la vision de l''Académie et engagement personnel. Objectif : réaffirmer sa vision pour cette session.'
WHERE title ILIKE '%vision%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-23',
  description = 'Approfondir la méditation biblique : méthodes avancées, étude contextuelle. Objectif : maîtriser 3 méthodes de méditation differentes.'
WHERE title ILIKE '%méditation%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-30',
  description = 'Servir avec maturité : leadership servant, responsabilité dans l''église. Objectif : identifier et exercer son don de service.'
WHERE title ILIKE '%servir dieu%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-06',
  description = 'L''évangélisation dans le monde moderne : approches adaptées à différentes cultures. Objectif : adapter son message à son public cible.'
WHERE title ILIKE '%vangélisation%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-13',
  description = 'Comment discerner les fausses prophéties et les fausses doctrines. Objectif : tester toute doctrine à la lumière de la Bible.'
WHERE title ILIKE '%fausses%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-20',
  description = 'La prière comme.mode de vie : types de prière, persévérance, intercession. Objectif : développer une vie de prière structurée.'
WHERE title ILIKE '%prière%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-27',
  description = 'L''amour chrétien : agapé, fraternité, pardon. Objectif : vivre l''amour concret dans les relations quotidiennes.'
WHERE title ILIKE '%amour%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-04',
  description = 'Principe biblique des dîmes et offrandes : générosité, fidélité financière. Objectif : comprendre et appliquer le principe de la dîme.'
WHERE title ILIKE '%dîmes%' OR title ILIKE '%dimes%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-11',
  description = 'La loi de l''honneur : vivre avec intégrité, respect, excellence. Objectif : appliquer la loi de l''honneur dans chaque domaine de vie.'
WHERE title ILIKE '%honneur%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

UPDATE courses SET
  session_date = '2026-10-18',
  description = 'L''éternité : le destin de l''homme au-delà de cette vie. Objectif : avoir une vision claire de l''éternité et en témoigner.'
WHERE title ILIKE '%éternité%' OR title ILIKE '%eternite%' AND class_id = (SELECT id FROM classes WHERE name = 'Croître avec Jésus' LIMIT 1);

-- ===== CLASSE 3 : Consécration =====

UPDATE courses SET
  session_date = '2026-08-09',
  description = 'Prise de contact et binômage pour la classe de consécration. Objectif : entrer en relation fraternelle profonde.'
WHERE title ILIKE '%prise de contact%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-16',
  description = 'Vision de l''Académie pour les futurs leaders. Objectif : s''engager comme modèle pour les classes inférieures.'
WHERE title ILIKE '%vision%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-23',
  description = 'Méditation biblique avancée pour le ministère. Objectif : devenir un méditeur de la Parole pour les autres.'
WHERE title ILIKE '%méditation%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-08-30',
  description = 'L''évangélisation comme style de vie pour le leader consacré. Objectif : former d''autres évangélistes.'
WHERE title ILIKE '%vangélisation%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-06',
  description = 'La sanctification profonde : niveau 2. Objectif : atteindre un niveau de consécration qui inspire les autres.'
WHERE title ILIKE '%sanctification%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-13',
  description = 'L''amour au niveau 2 : amour sacrificial, amour des ennemis. Objectif : aimer comme Jésus a aimé.'
WHERE title ILIKE '%amour%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-20',
  description = 'La communion fraternelle : unité dans le corps de Christ. Objectif : construire et maintenir l''unité dans la communauté.'
WHERE title ILIKE '%communion%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

UPDATE courses SET
  session_date = '2026-09-27',
  description = 'La foi active : marcher par la foi et non par la vue. Objectif : développer une foi inébranlable pour le ministère.'
WHERE title ILIKE '%foi%' AND class_id = (SELECT id FROM classes WHERE name = 'Consécration' LIMIT 1);

-- Pas de cours pour rattrapage/examen/graduation (ils n'ont pas de vidéo)

-- ===== TRONC COMMUN (toutes les classes) =====

-- Les cours tronc commun ont les mêmes dates pour toutes les classes
-- Ils sont déjà assignés aux bonnes classes via class_id dans le seed 019
-- On ajoute juste les dates et objectifs

UPDATE courses SET
  session_date = '2026-08-09',
  description = 'Prise de contact et présentation du programme pour toutes les classes.'
WHERE title ILIKE '%prise de contact%' AND class_id IS NULL;

UPDATE courses SET
  session_date = '2026-08-16',
  description = 'La vision de l''Académie Vases d''Honneur : notre mission et nos valeurs communes.'
WHERE title ILIKE '%vision%' AND class_id IS NULL;

UPDATE courses SET
  session_date = '2026-08-23',
  description = 'La méditation biblique : discipline fondamentale pour tout chrétien.'
WHERE title ILIKE '%méditation%' AND class_id IS NULL;

UPDATE courses SET
  session_date = '2026-08-30',
  description = 'Servir Dieu et les autres : principe universel du service chrétien.'
WHERE title ILIKE '%servir dieu%' AND class_id IS NULL;

UPDATE courses SET
  session_date = '2026-09-06',
  description = 'L''évangélisation : partager sa foi avec assurance et amour.'
WHERE title ILIKE '%vangélisation%' AND class_id IS NULL;
