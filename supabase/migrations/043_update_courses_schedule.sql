-- Section 6: Update courses with real schedule + moderator_assigned + scheduled_date
-- Also update course descriptions with objectives

-- 1. Add new columns
alter table public.courses add column if not exists moderator_assigned text;
alter table public.courses add column if not exists scheduled_date date;

-- 2. Clear existing courses and reseed with real schedule
DELETE FROM public.assignments WHERE course_id IN (SELECT id FROM public.courses);
DELETE FROM public.courses;

-- CLASS 1 — Connaître & Servir Christ (level 1)
INSERT INTO public.courses (class_id, title, week, description, moderator_assigned, scheduled_date)
SELECT c.id, v.title, v.week, v.description, v.moderator, v.scheduled::date
FROM public.classes c
JOIN (VALUES
  ('La vision Vases d''Honneur', 1, 'Prise de contact, présentation de la vision de l''Académie.', 'ÉQUIPE ADMINISTRATION', '2025-08-09'),
  ('La Vision de Vases d''Honneur', 2, 'Comprendre la vision complète de l''Académie Vases d''Honneur.', 'Pasteur Mike', '2025-08-16'),
  ('La méditation et Bible', 3, 'Apprendre à méditer et acquérir une vie de méditation. Sous-points : qu''est-ce que la méditation, les avantages de la méditation dans la vie d''un chrétien, comment méditer, quels sont les outils de la méditation. Présenter la Bible, la découvrir et l''utiliser efficacement.', 'AP Alvine', '2025-08-23'),
  ('Servir Dieu', 4, 'Travailler pour Dieu, pour les intérêts de Dieu, l''honneur de servir Dieu. Sous-points : définition, quel est le but de la création, les séductions liées au service de Dieu, les avantages de servir Dieu, qu''est-ce que le service de Dieu.', 'AP Joël', '2025-08-30'),
  ('Évangélisation', 5, 'Gagner des âmes. L''évangélisation comme cœur du service chrétien.', 'AP Arnauld', '2025-09-06'),
  ('La croix 1 & 2', 6, 'Comprendre l''œuvre de la croix. Sous-points : les aspects de la croix, les avantages de la croix.', 'AP Joël', '2025-09-13'),
  ('La Nouvelle Création', 7, 'Découvrir et marcher selon notre identité en Christ. Sous-points : que suis-je devenu en Christ, définition de la nouvelle création, quels sont les avantages de la nouvelle création.', 'AP Arnauld', '2025-09-20'),
  ('Le salut', 8, 'Comprendre la mission de Jésus : le salut. Sous-points : mission de Jésus, quel lien existe-t-il entre le péché et la mort, que procure le salut, comment obtient-on le salut, peut-on perdre le salut.', 'Pasteur Mike', '2025-09-27'),
  ('Le péché et ses conséquences', 9, 'Identifier le péché et ses conséquences. Sous-points : définition, comment le péché agit-il en l''homme, les conséquences du péché.', 'AP Alvine', '2025-10-04'),
  ('La vie de sanctification (partie I)', 10, 'Connaître la sanctification et mener une vie de sanctification. Sous-points : définition, pourquoi vivre la sanctification.', 'AP Rebecca', '2025-10-11'),
  ('La Trinité et le Saint-Esprit', 11, 'Comprendre la trinité. Sous-points : Père est Dieu, Jésus est Dieu, Saint-Esprit est Dieu, que signifie faire les choses "au nom de". Connaître le Saint-Esprit et savoir ce qu''il apporte à un enfant de Dieu : qui est le Saint-Esprit et les preuves qu''il est Dieu, quelles sont les représentations du Saint-Esprit, les péchés contre le Saint-Esprit.', 'AM Suzy', '2025-10-18'),
  ('Rattrapage des devoirs hebdomadaires', 12, 'Session de rattrapage pour les devoirs non rendus.', 'ÉQUIPE ADMINISTRATION', '2025-10-25'),
  ('Veillée finale & Exposés', 13, 'Veillée de prière et présentation des exposés de fin de session.', 'ÉQUIPE ADMINISTRATION', '2025-11-01'),
  ('Examen Final', 14, 'Examen final couvrant l''ensemble du programme.', 'ÉQUIPE ADMINISTRATION', '2025-11-06'),
  ('Agapè, remise des bulletins, fin de session', 15, 'Cérémonie de clôture, agapè fraternelle et remise des bulletins.', 'ÉQUIPE ADMINISTRATION', '2025-11-08')
) AS v(title, week, description, moderator, scheduled)
ON TRUE
WHERE c.level = 1;

-- CLASS 2 — Croître avec Jésus (level 2)
INSERT INTO public.courses (class_id, title, week, description, moderator_assigned, scheduled_date)
SELECT c.id, v.title, v.week, v.description, v.moderator, v.scheduled::date
FROM public.classes c
JOIN (VALUES
  ('Prise de contact', 1, 'Accueil et présentation de la session.', 'ÉQUIPE ADMINISTRATION', '2025-08-09'),
  ('La vision Vases d''Honneur', 2, 'Comprendre la vision de l''Académie.', 'Pasteur Mike', '2025-08-16'),
  ('La méditation et Bible', 3, 'Apprendre à méditer et acquérir une vie de méditation.', 'AP Alvine', '2025-08-16'),
  ('Servir Dieu', 4, 'Travailler pour Dieu, pour les intérêts de Dieu, l''honneur de servir Dieu.', 'AP Joël', '2025-08-23'),
  ('Évangélisation', 5, 'Gagner des âmes.', 'AP Arnauld', '2025-09-13'),
  ('Les fausses prophéties et les fausses doctrines', 6, 'Discerner les faux prophètes et docteurs, discerner les fausses prophéties et les fausses doctrines.', 'AP Rebecca', '2025-09-20'),
  ('La prière', 7, 'Savoir prier et rendre la prière efficace.', 'AM Suzy', '2025-09-27'),
  ('L''amour', 8, 'Manifester l''amour envers Dieu et les hommes.', 'AP Joël', '2025-10-04'),
  ('Les dîmes et offrandes', 9, 'Distinguer les dîmes des offrandes, savoir qu''est-ce qu''on doit offrir au Seigneur.', 'AM Suzy', '2025-10-11'),
  ('La loi de l''honneur', 10, 'Honorer les autorités et les personnes établies sur nous.', 'Pasteur Mike', '2025-10-18'),
  ('L''éternité', 11, 'Comprendre l''éternité.', 'AP Arnauld', '2025-10-25'),
  ('Rattrapage des devoirs hebdomadaires', 12, 'Session de rattrapage pour les devoirs non rendus.', 'ÉQUIPE ADMINISTRATION', '2025-11-01'),
  ('Examen Final et Exposé sur un fait de société', 13, 'Examen final et exposé sur un fait de société.', 'ÉQUIPE ADMINISTRATION', '2025-11-08'),
  ('Agapè, remise des bulletins, fin de session', 14, 'Cérémonie de clôture et remise des bulletins.', 'ÉQUIPE ADMINISTRATION', '2025-11-15')
) AS v(title, week, description, moderator, scheduled)
ON TRUE
WHERE c.level = 2;

-- CLASS 3 — Consécration (level 3)
INSERT INTO public.courses (class_id, title, week, description, moderator_assigned, scheduled_date)
SELECT c.id, v.title, v.week, v.description, v.moderator, v.scheduled::date
FROM public.classes c
JOIN (VALUES
  ('Prise de contact', 1, 'Accueil et présentation de la session.', 'ÉQUIPE ADMINISTRATION', '2025-08-09'),
  ('La vision Vases d''Honneur', 2, 'Comprendre la vision de l''Académie.', 'Pasteur Mike', '2025-08-16'),
  ('La méditation et Bible', 3, 'Apprendre à méditer et acquérir une vie de méditation.', 'AP Alvine', '2025-08-16'),
  ('Servir Dieu', 4, 'Travailler pour Dieu, pour les intérêts de Dieu, l''honneur de servir Dieu.', 'AP Joël', '2025-08-30'),
  ('La sanctification Niveau 2 et Préparation Graduation Décembre 2026', 5, 'Comprendre pourquoi le Seigneur Jésus a lavé les pieds de ses disciples. Sous-points : comment est-ce qu''on se lave les pieds, que représentent les pieds spirituels, qu''est-ce qui souille les pieds, comment conserver les pieds lavés.', 'Pasteur Mike', '2025-09-06'),
  ('L''amour niveau 2 (partie I et II)', 6, 'Comment véritablement aimer Dieu et les hommes. Sous-point : connaître l''amour.', 'AP Joël', '2025-09-13'),
  ('La Communion fraternelle', 7, 'La communion, force vitale de l''église. Sous-points : définition, conditions de base, bénéfices, obstacles.', 'AP Rebecca', '2025-09-20'),
  ('La Foi - Partie 1', 8, 'Comment avoir une foi qui déplace les montagnes ? Sous-points : apprendre à manifester la foi, 5 étapes pour manifester la foi.', 'AP Arnauld', '2025-09-27'),
  ('La Foi - Partie 2', 9, 'L''importance de la foi, comment marcher avec la foi.', 'AP Arnauld', '2025-10-04'),
  ('Préparation Graduation Décembre 2026', 10, 'Préparation de la cérémonie de graduation.', 'ÉQUIPE ADMINISTRATION', '2025-10-11'),
  ('Préparation Graduation Décembre 2026', 11, 'Suite de la préparation de la graduation.', 'ÉQUIPE ADMINISTRATION', '2025-10-18'),
  ('Examen Final', 12, 'Examen final couvrant l''ensemble du programme.', 'ÉQUIPE ADMINISTRATION', '2025-10-25'),
  ('Cérémonie de Graduation', 13, 'Cérémonie officielle de remise des diplômes.', 'ÉQUIPE ADMINISTRATION', '2025-11-08')
) AS v(title, week, description, moderator, scheduled)
ON TRUE
WHERE c.level = 3;
