-- =====================================================
-- 065 : Rappels samedi matin via pg_cron
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction SQL qui envoie les rappels samedi matin
CREATE OR REPLACE FUNCTION send_saturday_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today_dow INTEGER;
  already_sent BOOLEAN;
  rec RECORD;
  student RECORD;
  greeting TEXT;
BEGIN
  -- Vérifier que c'est bien samedi (6 en ISO, mais pg_cron est 0-indexed)
  today_dow := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER; -- 0=Dimanche, 6=Samedi
  IF today_dow != 6 THEN
    RETURN;
  END IF;

  -- Vérifier qu'on n'a pas déjà envoyé aujourd'hui
  SELECT EXISTS(
    SELECT 1 FROM announcements
    WHERE title = 'Rappel — Résumé du cours'
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
  ) INTO already_sent;

  IF already_sent THEN
    RETURN;
  END IF;

  -- Créer les annonces pour chaque classe
  FOR rec IN SELECT id FROM classes LOOP
    -- Rappel résumé
    INSERT INTO announcements (moderator_id, class_id, title, content)
    SELECT
      (SELECT id FROM profiles WHERE role = 'ADMINISTRATEUR' LIMIT 1),
      rec.id,
      'Rappel — Résumé du cours',
      'Ton résumé du cours de la semaine est attendu aujourd''hui au plus tard à 22H59.' || CHR(10) ||
      'Tu peux l''envoyer à l''adresse E-mail suivante : vhassembleeeauxpaisibles@gmail.com' || CHR(10) ||
      'Ou directement dans l''application (onglet Cours → Résumé).' || CHR(10) || CHR(10) ||
      'L''administration.';

    -- Rappel cours demain
    INSERT INTO announcements (moderator_id, class_id, title, content)
    SELECT
      (SELECT id FROM profiles WHERE role = 'ADMINISTRATEUR' LIMIT 1),
      rec.id,
      'Rappel — Cours de demain',
      'Ton prochain cours de l''académie c''est demain à 11h en présentiel à l''église.' || CHR(10) ||
      'Bien vouloir te munir de :' || CHR(10) ||
      '• Ton cahier de méditation' || CHR(10) ||
      '• Ton résumé imprimé' || CHR(10) ||
      'à remettre aux admins de ta classe avant le début du cours.' || CHR(10) || CHR(10) ||
      'L''administration.';
  END LOOP;

  -- Envoyer les notifications in-app pour chaque étudiant
  FOR student IN
    SELECT p.id, p.first_name, p.class_id
    FROM profiles p
    WHERE p.role = 'ETUDIANT' AND p.active = true AND p.class_id IS NOT NULL
  LOOP
    greeting := CASE WHEN student.first_name IS NOT NULL AND student.first_name != '' THEN 'Bonjour ' || student.first_name || ', ' ELSE '' END;

    INSERT INTO notifications (user_id, type, title, body, read)
    VALUES (
      student.id,
      'announcement',
      'Rappel — Résumé du cours',
      greeting || 'ton résumé du cours est attendu aujourd''hui à 22H59.',
      false
    );

    INSERT INTO notifications (user_id, type, title, body, read)
    VALUES (
      student.id,
      'announcement',
      'Rappel — Cours de demain',
      greeting || 'ton prochain cours c''est demain à 11h en présentiel. Munis-toi de ton cahier et résumé.',
      false
    );
  END LOOP;
END;
$$;

-- Planifier : tous les samedis à 08:00 UTC (09:00 heure Cameroun)
SELECT cron.schedule(
  'saturday-reminders',
  '0 8 * * 6',
  $$SELECT send_saturday_reminders()$$
);
