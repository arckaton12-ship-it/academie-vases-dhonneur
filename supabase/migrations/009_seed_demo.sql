-- =====================================================
-- Académie Vases d'Honneur — migration 009 : données de démo
-- Affection des étudiants aux classes + cours + devoirs
-- =====================================================

-- ---- 1. Étudiants dans leurs classes ----
update profiles set class_id = (select id from classes where level = 1) where email = 'arckaton12@gmail.com';
update profiles set class_id = (select id from classes where level = 2) where email = 'novaspacecm1@gmail.com';

-- ---- 2. Cours (3 semaines par classe) ----
with new_courses as (
  insert into courses (class_id, title, week, description)
  select c.id, v.title, v.week, v.description
  from classes c
  join (values
    (1, 'La Semence qui donne la Vie', 1, 'La croissance de la foi comparée à la semence : le grain doit mourir pour porter du fruit. Réflexion sur Marc 4, 26-32.'),
    (1, 'La Vigne et les Sarments', 2, 'Jean 15 : demeurer en Christ pour porter du fruit. L''attachement quotidien à la Parole.'),
    (1, 'La Coupe de la Bénédiction', 3, '1 Corinthiens 10, 16 : la coupe de la communion et la reconnaissance dans la vie du disciple.'),
    (2, 'Le Vase d''Honneur', 1, '2 Timothée 2, 21 : se purifier pour être un vase utile à son Maître.'),
    (2, 'La Perle de Grand Prix', 2, 'Matthieu 13, 45-46 : le royaume vaut mieux que tout ce que nous possédons.'),
    (2, 'Le Trésor dans le Champ', 3, 'Matthieu 13, 44 : la joie de celui qui a trouvé le trésor caché.'),
    (3, 'L''Huile de l''Onction', 1, 'Psaume 133 : la bénédiction de l''unité qui coule comme l''huile précieuse.'),
    (3, 'La Moisson est Grande', 2, 'Matthieu 9, 37-38 : prier pour les ouvriers et entrer dans la moisson.'),
    (3, 'L''Étoile du Matin', 3, 'Apocalypse 22, 16 : marcher à la lumière de celui qui vient.')
  ) as v(level, title, week, description) on v.level = c.level
  returning *
)
select count(*) from new_courses;

-- ---- 3. Devoirs et exercices ----
insert into assignments (course_id, description, due_date, type)
select co.id, v.description, now() + (v.days || ' days')::interval, v.type
from (values
  (1, 1, 'DEVOIR', 'Rédige une méditation de dix lignes sur Jean 15, 5 : qu''est-ce que demeurer en Christ pour toi cette semaine ?', 7),
  (1, 2, 'EXERCICE', 'Apprends par cœur Jean 15, 5 et récite-le à voix haute trois fois.', 4),
  (2, 1, 'DEVOIR', 'Explique avec tes propres mots 2 Timothée 2, 21 : comment un vase devient-il utile à son Maître ?', 7),
  (2, 3, 'EXERCICE', 'Résume la parabole du trésor caché en cinq lignes et donne un exemple concret pour ta vie.', 4),
  (3, 2, 'DEVOIR', 'Méditation écrite : que signifie pour toi « la moisson est grande, mais il y a peu d''ouvriers » ?', 7)
) as v(level, week, type, description, days)
join classes c on c.level = v.level
join courses co on co.class_id = c.id and co.week = v.week;
