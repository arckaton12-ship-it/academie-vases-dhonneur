-- =====================================================
-- Académie Vases d'Honneur — migration 007 : note de méditation
-- =====================================================
alter table profiles add column if not exists meditation_grade numeric(4,2);
