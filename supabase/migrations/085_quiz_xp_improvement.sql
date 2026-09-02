UPDATE xp_actions SET xp_value = 20, description = 'Quiz réussi' WHERE action = 'quiz_passed';
UPDATE xp_actions SET xp_value = 40, description = 'Quiz parfait — note maximale' WHERE action = 'quiz_perfect';

INSERT INTO xp_actions (action, xp_value, description, daily_limit, unique_per_ref)
VALUES ('quiz_participation', 10, 'Participation à un quiz', NULL, true)
ON CONFLICT (action) DO NOTHING;

SELECT pg_notify('pgrst', 'reload schema');
