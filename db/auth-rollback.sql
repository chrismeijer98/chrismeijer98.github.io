-- ============================================================
-- HOUSE OF PILOTS — ROLLBACK van de Auth-migratie
-- ============================================================
-- Draai dit ALLEEN als je eerder db/auth-migration.sql hebt
-- uitgevoerd en terug wilt naar de simpele (anon) login.
-- Veilig om altijd te draaien: als de migratie nooit liep,
-- herstelt dit gewoon de originele open policies.
--
-- Het laat users.auth_id en de functies app_uid()/app_role()
-- staan (onschadelijk); die kun je later hergebruiken als je
-- alsnog naar echte auth wilt.
-- ============================================================

-- ---- users: terug naar anon full access ----
drop policy if exists "auth read users" on users;
drop policy if exists "anon full access" on users;
create policy "anon full access" on users
  for all to anon using (true) with check (true);

-- ---- pcp_scores ----
drop policy if exists "auth full pcp" on pcp_scores;
drop policy if exists "anon full access" on pcp_scores;
create policy "anon full access" on pcp_scores
  for all to anon using (true) with check (true);

-- ---- lab_assignments ----
drop policy if exists "auth full lab_assignments" on lab_assignments;
drop policy if exists "anon full access" on lab_assignments;
create policy "anon full access" on lab_assignments
  for all to anon using (true) with check (true);

-- ---- lab_assignment_members ----
drop policy if exists "auth full lab_members" on lab_assignment_members;
drop policy if exists "anon full access" on lab_assignment_members;
create policy "anon full access" on lab_assignment_members
  for all to anon using (true) with check (true);

-- ---- Storage lab-docs: terug naar anon ----
drop policy if exists "lab-docs auth read"   on storage.objects;
drop policy if exists "lab-docs auth insert" on storage.objects;
drop policy if exists "lab-docs auth update" on storage.objects;
drop policy if exists "lab-docs auth delete" on storage.objects;

drop policy if exists "lab-docs anon read" on storage.objects;
create policy "lab-docs anon read" on storage.objects
  for select to anon using (bucket_id = 'lab-docs');

drop policy if exists "lab-docs anon insert" on storage.objects;
create policy "lab-docs anon insert" on storage.objects
  for insert to anon with check (bucket_id = 'lab-docs');

drop policy if exists "lab-docs anon update" on storage.objects;
create policy "lab-docs anon update" on storage.objects
  for update to anon using (bucket_id = 'lab-docs') with check (bucket_id = 'lab-docs');

drop policy if exists "lab-docs anon delete" on storage.objects;
create policy "lab-docs anon delete" on storage.objects
  for delete to anon using (bucket_id = 'lab-docs');
