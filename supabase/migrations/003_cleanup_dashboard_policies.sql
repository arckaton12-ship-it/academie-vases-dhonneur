-- =====================================================
-- Académie Vases d'Honneur — correctif 003
-- Remplace les policies dashboard récursives par la
-- fonction security definer is_admin_or_moderator()
-- =====================================================

-- ---- Profiles ----
drop policy if exists "Admins can delete any profile" on profiles;
drop policy if exists "Admins can insert any profile" on profiles;
drop policy if exists "Admins can update any profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Moderators can view profiles of students in their class" on profiles;

create policy "Admins can view all profiles" on profiles for select using (public.is_admin_or_moderator());
create policy "Admins can insert any profile" on profiles for insert with check (public.is_admin_or_moderator());
create policy "Admins can update any profile" on profiles for update using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
create policy "Admins can delete any profile" on profiles for delete using (public.is_admin_or_moderator());

-- ---- Classes ----
drop policy if exists "Admins can delete classes" on classes;
drop policy if exists "Admins can insert classes" on classes;
drop policy if exists "Admins can update classes" on classes;
drop policy if exists "Admins can view all classes" on classes;
drop policy if exists "Users can view their own class" on classes;

create policy "Admins can view all classes" on classes for select using (public.is_admin_or_moderator());
create policy "Admins can insert classes" on classes for insert with check (public.is_admin_or_moderator());
create policy "Admins can update classes" on classes for update using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
create policy "Admins can delete classes" on classes for delete using (public.is_admin_or_moderator());

-- ---- Courses ----
drop policy if exists "Admins can delete courses" on courses;
drop policy if exists "Admins can insert courses" on courses;
drop policy if exists "Admins can update courses" on courses;
drop policy if exists "Admins can view all courses" on courses;
drop policy if exists "Moderators can delete courses for their class" on courses;
drop policy if exists "Moderators can insert courses for their class" on courses;
drop policy if exists "Moderators can update courses for their class" on courses;
drop policy if exists "Users can view courses of their class" on courses;

create policy "Admins can view all courses" on courses for select using (public.is_admin_or_moderator());
create policy "Admins can insert courses" on courses for insert with check (public.is_admin_or_moderator());
create policy "Admins can update courses" on courses for update using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
create policy "Admins can delete courses" on courses for delete using (public.is_admin_or_moderator());
