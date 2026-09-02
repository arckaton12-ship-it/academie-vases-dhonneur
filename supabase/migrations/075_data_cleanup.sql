-- Migration 075: Data cleanup — unify departments, tribes, trim names
-- All changes are idempotent (safe to re-run)

-- ========================================
-- 1. DEPARTMENTS: Trim whitespace
-- ========================================
UPDATE profiles SET department = TRIM(department) WHERE department != TRIM(department);

-- ========================================
-- 2. DEPARTMENTS: Normalize case (lowercase first letter, rest lowercase)
--    But keep proper nouns as-is (Chantres, Accueil, Communication, etc.)
-- ========================================
UPDATE profiles SET department = 'Chantres' WHERE department ILIKE 'chantre%';
UPDATE profiles SET department = 'Accueil' WHERE department ILIKE 'accueil%';
UPDATE profiles SET department = 'Communication' WHERE department ILIKE 'communication%';
UPDATE profiles SET department = 'Intercession' WHERE department ILIKE 'intercession%';
UPDATE profiles SET department = 'Portier' WHERE department ILIKE 'portier%';
UPDATE profiles SET department = 'Protocole' WHERE department ILIKE 'protocole%';
UPDATE profiles SET department = 'Enfant d''Honneur' WHERE department ILIKE 'enfant%d''honneur%';
UPDATE profiles SET department = 'Médecine d''Honneur' WHERE department ILIKE 'médecine%d''honneur%' OR department ILIKE 'medicine%d''honneur%';
UPDATE profiles SET department = 'Administration' WHERE department ILIKE 'administration%';
UPDATE profiles SET department = 'Comptabilité' WHERE department ILIKE 'comptabilit%';
UPDATE profiles SET department = 'Monitrice' WHERE department ILIKE 'monitrice%';

-- ========================================
-- 3. DEPARTMENTS: Set AUCUN/Aucun to NULL
-- ========================================
UPDATE profiles SET department = NULL WHERE department ILIKE 'aucun';

-- ========================================
-- 4. TRIBES: Trim whitespace
-- ========================================
UPDATE profiles SET tribe = TRIM(tribe) WHERE tribe != TRIM(tribe);

-- ========================================
-- 5. TRIBES: Normalize known variants
-- ========================================
UPDATE profiles SET tribe = 'Lévi' WHERE tribe ILIKE 'levy%' OR tribe ILIKE 'lévy%';
UPDATE profiles SET tribe = 'Siméon' WHERE tribe ILIKE 'siméon %';
UPDATE profiles SET tribe = 'Issachar' WHERE tribe ILIKE 'issacar%';
UPDATE profiles SET tribe = NULL WHERE tribe ILIKE 'aucune';

-- ========================================
-- 6. NAMES: Trim trailing/leading whitespace
-- ========================================
UPDATE profiles SET first_name = TRIM(first_name) WHERE first_name != TRIM(first_name);
UPDATE profiles SET last_name = TRIM(last_name) WHERE last_name != TRIM(last_name);

-- ========================================
-- 7. Log results
-- ========================================
DO $$
DECLARE
  dept_count integer;
  tribe_count integer;
  name_count integer;
BEGIN
  SELECT count(*) INTO dept_count FROM profiles WHERE role = 'ETUDIANT' AND department IS NOT NULL AND department != TRIM(department);
  SELECT count(*) INTO tribe_count FROM profiles WHERE role = 'ETUDIANT' AND tribe IS NOT NULL AND tribe != TRIM(tribe);
  SELECT count(*) INTO name_count FROM profiles WHERE role = 'ETUDIANT' AND (first_name != TRIM(first_name) OR last_name != TRIM(last_name));
  RAISE NOTICE 'After cleanup: % dirty depts, % dirty tribes, % dirty names (should all be 0)', dept_count, tribe_count, name_count;
END $$;

-- Notify PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');
