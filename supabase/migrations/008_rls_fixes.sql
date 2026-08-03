-- =====================================================
-- Académie Vases d'Honneur — migration 008 : corrections
-- Unicité service_records + policies d'écriture étudiant
-- (streaks, badges) nécessaires aux upserts côté app
-- =====================================================

alter table service_records
  drop constraint if exists service_records_student_id_key;
alter table service_records
  add constraint service_records_student_id_key unique (student_id);

drop policy if exists "self insert streaks" on streaks;
drop policy if exists "self update streaks" on streaks;
create policy "self insert streaks" on streaks for insert with check (auth.uid() = student_id);
create policy "self update streaks" on streaks for update using (auth.uid() = student_id);

drop policy if exists "self insert badges" on badges;
drop policy if exists "self update badges" on badges;
create policy "self insert badges" on badges for insert with check (auth.uid() = student_id);
create policy "self update badges" on badges for update using (auth.uid() = student_id);
