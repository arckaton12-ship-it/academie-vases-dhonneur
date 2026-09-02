-- =============================================================
-- MIGRATION 088: FIX DATABASE - MERGE DUPLICATES + DATES
-- Copier-coller dans Supabase Dashboard > SQL Editor
-- =============================================================

BEGIN;

-- 1. ADD MISSING COLUMNS
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_graduation boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_tronc_commun boolean DEFAULT false;

-- 2. MERGE DUPLICATES: copy audio from orphan row to scheduled row

-- Classe 1 - W1 (La Vision)
UPDATE courses SET audio_parts = '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view","video":"https://www.youtube.com/watch?v=P0gXkvAr08c"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view","video":"https://www.youtube.com/watch?v=e8rBopM00OA"},{"nom":"Objectifs & Héritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]'::jsonb WHERE id = 'c0925244-4435-450d-82ca-d4b134eca1bd';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view' WHERE id = 'c0925244-4435-450d-82ca-d4b134eca1bd';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=plSLMiajkTg' WHERE id = 'c0925244-4435-450d-82ca-d4b134eca1bd';

-- Classe 1 - W2 (Servir Dieu)
UPDATE courses SET audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view","video":"https://www.youtube.com/watch?v=8LMaInr0ozc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view","video":"https://www.youtube.com/watch?v=eVwEl532Uqk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view","video":"https://www.youtube.com/watch?v=1Kt-zhkNTnk"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]'::jsonb WHERE id = '8a6b424a-91a0-4b5b-88f8-d0cabad9f5c4';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view' WHERE id = '8a6b424a-91a0-4b5b-88f8-d0cabad9f5c4';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=jHQjNi2G_OQ' WHERE id = '8a6b424a-91a0-4b5b-88f8-d0cabad9f5c4';

-- Classe 1 - W3 (Méditation Bible)
UPDATE courses SET audio_parts = '[{"nom":"La Méditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]'::jsonb WHERE id = 'adbf25bb-11fe-4027-8e9c-702b0c3adfa6';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view' WHERE id = 'adbf25bb-11fe-4027-8e9c-702b0c3adfa6';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=0HplIYNz5vg' WHERE id = 'adbf25bb-11fe-4027-8e9c-702b0c3adfa6';

-- Classe 1 - W4 (Évangélisation)
UPDATE courses SET audio_parts = '[{"nom":"L''évangélisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]'::jsonb WHERE id = '253d1982-7a0c-4029-9c1f-80e6f92f250f';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view' WHERE id = '253d1982-7a0c-4029-9c1f-80e6f92f250f';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=mG8wX-w4Nz4' WHERE id = '253d1982-7a0c-4029-9c1f-80e6f92f250f';

-- Classe 2 - W1
UPDATE courses SET audio_parts = '[{"nom":"Introduction","audio":"https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view","video":"https://www.youtube.com/watch?v=P0gXkvAr08c"},{"nom":"Mission & Vision","audio":"https://drive.google.com/file/d/1p3fJG-M4QIQtbVKT1YCyp7oXO_3MrDsS/view","video":"https://www.youtube.com/watch?v=e8rBopM00OA"},{"nom":"Objectifs & Héritage","audio":"https://drive.google.com/file/d/1nmnjrm6brgEVrkWvSK1cH7Rs_6zYlqyz/view"}]'::jsonb WHERE id = '6029df33-7272-40c9-ac2f-03171e91b777';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1x5_tAySk_PIYAEX3DOMvawO6TQFdvCCE/view' WHERE id = '6029df33-7272-40c9-ac2f-03171e91b777';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=plSLMiajkTg' WHERE id = '6029df33-7272-40c9-ac2f-03171e91b777';

-- Classe 2 - W2
UPDATE courses SET audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view","video":"https://www.youtube.com/watch?v=8LMaInr0ozc"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/10yAzXoDE6GlnqzbIIohVc590_I7_MVTf/view","video":"https://www.youtube.com/watch?v=eVwEl532Uqk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1_Be1aQ5dfF2XMbmR74PJ5uRW301fEJTQ/view","video":"https://www.youtube.com/watch?v=1Kt-zhkNTnk"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1UXdTwPiGg9UKwvJ3pNE4OtLsDCTlbv7_/view"}]'::jsonb WHERE id = '66830bc6-21c9-4258-a57c-2bfc5e368586';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1cP3FPWsRB5g37lhg1GVZDV8epD0MtTIf/view' WHERE id = '66830bc6-21c9-4258-a57c-2bfc5e368586';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=jHQjNi2G_OQ' WHERE id = '66830bc6-21c9-4258-a57c-2bfc5e368586';

-- Classe 2 - W3
UPDATE courses SET audio_parts = '[{"nom":"La Méditation de la Bible","audio":"https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view"},{"nom":"La Bible - Partie 1","audio":"https://drive.google.com/file/d/1SBxIU0xLLpiZX_333T2YEX381GVre-sJ/view"},{"nom":"La Bible - Partie 2","audio":"https://drive.google.com/file/d/1guEogL-mGWYpVH_O-6BzC6LoL0UHPBAj/view"}]'::jsonb WHERE id = 'cd8c1c6b-2a07-4a59-b8ed-a90a22345ca6';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1MjpBK0LqnrBvvHhMLV_d3rsVoR2htGdv/view' WHERE id = 'cd8c1c6b-2a07-4a59-b8ed-a90a22345ca6';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=0HplIYNz5vg' WHERE id = 'cd8c1c6b-2a07-4a59-b8ed-a90a22345ca6';

-- Classe 2 - W4
UPDATE courses SET audio_parts = '[{"nom":"L''évangélisation","audio":"https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view"}]'::jsonb WHERE id = '155cd2c9-33b2-4559-8c6a-46fe2c67bdb3';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1vl2QuUbxWWJgny9thy5ExZdQDsrUBz_I/view' WHERE id = '155cd2c9-33b2-4559-8c6a-46fe2c67bdb3';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=mG8wX-w4Nz4' WHERE id = '155cd2c9-33b2-4559-8c6a-46fe2c67bdb3';

-- Classe 3 - W5 (Sanctification N2)
UPDATE courses SET audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view","video":"https://www.youtube.com/watch?v=h2rQgikip20"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1IpLWb1wxVHGir-LsercdVSm1J0ykUMqb/view"}]'::jsonb WHERE id = '1434b042-ae91-4978-b054-4293e3c7eeba';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1thgs2XNXOxMflgILBQBhm5oToyLviPZQ/view' WHERE id = '1434b042-ae91-4978-b054-4293e3c7eeba';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=XsKO_Lsux_s' WHERE id = '1434b042-ae91-4978-b054-4293e3c7eeba';

-- Classe 3 - W6 (Amour N2)
UPDATE courses SET audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view","video":"https://www.youtube.com/watch?v=vsRjyG7oHCM"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/1AekJUxowd0Q1J7D4TCzKIn-jqT1s0CqF/view","video":"https://www.youtube.com/watch?v=tcd-Zb4Iyjo"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1zNK73p_p42v3Dn2EpcQE0niqq86dm_CQ/view"}]'::jsonb WHERE id = '1eb942ff-d183-4d6f-9e6c-a29d9c3507e6';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1vk3FChtmsVpLmbJLCNnCdhDdjx9Ng823/view' WHERE id = '1eb942ff-d183-4d6f-9e6c-a29d9c3507e6';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=fTYfItmGxxU' WHERE id = '1eb942ff-d183-4d6f-9e6c-a29d9c3507e6';

-- Classe 3 - W7 (Communion fraternelle)
UPDATE courses SET audio_parts = '[{"nom":"La communion fraternelle","audio":"https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view"}]'::jsonb WHERE id = '49b08b0d-0478-4e24-8e4d-31d457a024e6';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/163_W26xHAKrdinbp2xOUdEYgd_0nO_tV/view' WHERE id = '49b08b0d-0478-4e24-8e4d-31d457a024e6';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=7Zoof_AEy1A' WHERE id = '49b08b0d-0478-4e24-8e4d-31d457a024e6';

-- Classe 3 - W8 (La Foi)
UPDATE courses SET audio_parts = '[{"nom":"Partie 1","audio":"https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view","video":"https://www.youtube.com/watch?v=PwDWl6ScOcI"},{"nom":"Partie 2","audio":"https://drive.google.com/file/d/18rCg9EfYHY5WKdQnFSALJiJ_eig47bFJ/view","video":"https://www.youtube.com/watch?v=hBOfjfLXiEk"},{"nom":"Partie 3","audio":"https://drive.google.com/file/d/1Yg0oB1ePvqqe6wlMUpPVx7m7zo5t4KCH/view","video":"https://www.youtube.com/watch?v=lU0bf1rKw8A"},{"nom":"Partie 4","audio":"https://drive.google.com/file/d/1FsvAzQGdue2wrus_ZWf7NWBtWsQQ11iJ/view","video":"https://www.youtube.com/watch?v=ynNai8korY4"},{"nom":"Partie 5","audio":"https://drive.google.com/file/d/1ECfSFMD9N93mwGO1p6QD9UUBI1nwqy_0/view","video":"https://www.youtube.com/watch?v=KQCLFlNWR-I"},{"nom":"Partie 6","audio":"https://drive.google.com/file/d/1xVVIShonXfWSAO_AopqO9b35jGpwraga/view","video":"https://www.youtube.com/watch?v=acoUUR9P42Y"},{"nom":"Partie 7","audio":"https://drive.google.com/file/d/1efmWaax5Aic1vW7jY3s9DQ36VpHwmjym/view"}]'::jsonb WHERE id = 'dd963929-d0d1-4dbb-9b23-0bfc382477f9';
UPDATE courses SET audio_url = 'https://drive.google.com/file/d/1m1Tc-0vObdh_Sc0bTf_x-ULM8wNuzCtD/view' WHERE id = 'dd963929-d0d1-4dbb-9b23-0bfc382477f9';
UPDATE courses SET video_url = 'https://www.youtube.com/watch?v=0XHzdOKbdzw' WHERE id = 'dd963929-d0d1-4dbb-9b23-0bfc382477f9';

-- 3. DELETE ORPHAN ROWS (30 duplicates + audit tests)
DELETE FROM courses WHERE id IN ('78be5785-dc44-438a-9d1e-7231bc62143c', '051a98f5-2efb-48f4-9724-0ef0c4c073f2', '6e93b60f-6d87-42b1-baba-3862a43276dc', 'a43d1c28-f204-460b-a3ba-97949a7c89d9', 'e50600c4-447a-49a4-9469-7424ca94462d', '4aa018c5-ba65-4da3-98f4-546b8dfc4a5a', '491faf03-3430-448b-b38e-6d102f3ff274', 'f20dae6b-47a9-4d10-8bc7-301e32934d84', 'e3645b4b-110f-4ce0-beee-56d25d51c810', 'c7e17273-2ad2-47c8-b86a-08469ee816d0', '890828e1-ad4f-4186-b075-0025c367a21f', 'd6de9f17-6bba-429b-b858-384e1cd529d8', '7b9ed7b8-bb6f-4284-9e94-e5a347d03733', 'b8a53830-8093-47ca-a25b-da123dee489b', '3872d54e-2069-4496-a1bc-3a6ce1f1c9c3', '46f50807-ccc9-4b7e-99c3-c7a26108be8c', '4190a179-52ba-4a2b-ae3b-576271fb9b16', '546234a9-a22b-4039-bd3a-b9b54c2bac32', 'b38add78-141c-40e3-8f56-696bdcc4c2f6', '68f3ad08-c7a7-41bb-9467-e444a8383132');
DELETE FROM courses WHERE id IN ('432dbde6-5a52-4546-9788-25f2630e8570', 'afbe1072-8269-47c6-a84e-461e03915876', '3c432eb6-708b-41e1-80fe-55f433d691db', '3c44c6e4-ad4e-4be7-a5f1-f415488a60cd', '88da856c-be24-48e3-a9cf-3a73f8be81bd', '9bd7d9eb-1626-4744-a869-8e0c8e0d2eb7', 'c328957d-a1f2-4eea-9918-58d4ab4db8f4', 'a9af445d-b8c2-4f87-a36f-6b6159863cc0', 'fd586e1c-ff20-4527-8b26-2208c88d73f3', '9ba3497c-1a4a-4578-ba1d-b697fcb7367d');

-- 4. SET SESSION_DATES (planning officiel)
UPDATE courses SET session_date = '2026-08-09' WHERE week = 1 AND session_date IS DISTINCT FROM '2026-08-09';
UPDATE courses SET session_date = '2026-08-16' WHERE week = 2 AND session_date IS DISTINCT FROM '2026-08-16';
UPDATE courses SET session_date = '2026-08-23' WHERE week = 3 AND session_date IS DISTINCT FROM '2026-08-23';
UPDATE courses SET session_date = '2026-08-30' WHERE week = 4 AND session_date IS DISTINCT FROM '2026-08-30';
UPDATE courses SET session_date = '2026-09-06' WHERE week = 5 AND session_date IS DISTINCT FROM '2026-09-06';
UPDATE courses SET session_date = '2026-09-13' WHERE week = 6 AND session_date IS DISTINCT FROM '2026-09-13';
UPDATE courses SET session_date = '2026-09-20' WHERE week = 7 AND session_date IS DISTINCT FROM '2026-09-20';
UPDATE courses SET session_date = '2026-09-27' WHERE week = 8 AND session_date IS DISTINCT FROM '2026-09-27';
UPDATE courses SET session_date = '2026-10-04' WHERE week = 9 AND session_date IS DISTINCT FROM '2026-10-04';
UPDATE courses SET session_date = '2026-10-11' WHERE week = 10 AND session_date IS DISTINCT FROM '2026-10-11';
UPDATE courses SET session_date = '2026-10-18' WHERE week = 11 AND session_date IS DISTINCT FROM '2026-10-18';
UPDATE courses SET session_date = '2026-10-25' WHERE week = 12 AND session_date IS DISTINCT FROM '2026-10-25';
UPDATE courses SET session_date = '2026-11-01' WHERE week = 13 AND session_date IS DISTINCT FROM '2026-11-01';
UPDATE courses SET session_date = '2026-11-08' WHERE week = 14 AND session_date IS DISTINCT FROM '2026-11-08';
UPDATE courses SET session_date = '2026-11-15' WHERE week = 15 AND session_date IS DISTINCT FROM '2026-11-15';

-- 5. BACKFILL
UPDATE courses SET is_visible = true WHERE is_visible IS NULL;
UPDATE classes SET start_date = '2026-08-09' WHERE name LIKE '%Classe%';
UPDATE classes SET start_date = '2026-11-22' WHERE name = 'Graduation';

COMMIT;

-- 6. VERIFY: should show 1 course per (class, week), all with correct dates
SELECT c.name, co.week, co.title, co.session_date, CASE WHEN co.audio_parts IS NOT NULL THEN jsonb_array_length(co.audio_parts) ELSE 0 END as audio_count FROM courses co JOIN classes c ON co.class_id = c.id ORDER BY c.name, co.week;
