-- ============================================================
-- HOUSE OF PILOTS — SECURITY LOCKDOWN
-- ============================================================
-- Voer dit eenmalig uit in de Supabase SQL-editor:
--   supabase.com → jouw project → SQL Editor → New query
-- Idempotent: veilig om opnieuw te draaien.
--
-- WAAROM: elke tabel had een policy "for all to anon using (true)".
-- Dat betekent dat de publieke anon-key (die vanzelfsprekend zichtbaar
-- is in de paginabron — dat hoort bij Supabase) volledige lees-/
-- schrijftoegang gaf tot de HELE database, zonder in te loggen.
-- Dit script sluit dat voor alle tabellen af tot "authenticated".
--
-- LET OP — dit vereist dat de app een ECHTE Supabase Auth-sessie
-- opzet via supabase.auth.signInWithPassword() (zie js/api.js).
-- De oude naam+wachtwoord-check die rechtstreeks de open users-tabel
-- bevroeg, werkt hierna niet meer — vandaar de losse migratie van
-- bestaande accounts (zie het bootstrap-script dat hierbij hoort).
-- ============================================================

-- ---- 1. auth_id koppeling + helperfuncties (idempotent) ------
alter table users add column if not exists auth_id uuid;
create unique index if not exists users_auth_id_key on users(auth_id);

create or replace function app_uid()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select id from public.users where auth_id = auth.uid()
$$;

create or replace function app_role()
  returns text
  language sql
  stable
  security definer
  set search_path = public
as $$
  select role from public.users where auth_id = auth.uid()
$$;

grant execute on function app_uid() to anon, authenticated;
grant execute on function app_role() to anon, authenticated;

-- ---- 2. users: alleen ingelogd mag lezen ----------------------
-- Schrijven (aanmaken/wijzigen/verwijderen) loopt voortaan via de
-- Edge Function admin-users (service-role, omzeilt RLS met een
-- eigen coach-check) — dus geen insert/update/delete-policy nodig.
drop policy if exists "anon full access" on users;
drop policy if exists "auth read users" on users;
create policy "auth read users" on users
  for select to authenticated using (true);

-- ---- 3. Alle overige tabellen: anon -> authenticated ----------
-- Fase 1: sluit de database af voor niet-ingelogde bezoekers.
-- Nog GEEN per-gebruiker scoping (iedere ingelogde gebruiker kan nog
-- steeds bij elkaars coachingnotities/verlofaanvragen/PCP-scores) —
-- dat is een bewuste, aparte vervolgstap (zie chat), niet in dit
-- noodpatch omdat dat per tabel losse, geteste policies vergt.
do $$
declare t text;
begin
  foreach t in array array[
    'pcp_scores','lab_assignments','lab_assignment_members',
    'coaching_relations','coaching_sessions','coaching_notes',
    'coaching_actions','coaching_advice',
    'practical_threads','practical_posts','leave_requests',
    'lab_groups','lab_group_members','lab_group_files','lab_group_tasks',
    'lab_group_threads','lab_group_posts','lab_group_minutes','lab_group_messages',
    'assessment_responses','events','event_signups',
    'exercise_unlocks','exercise_scores'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon full access" on %I', t);
    execute format('drop policy if exists "auth full %s" on %I', t, t);
    execute format('create policy "auth full %s" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---- 4. feedback_sessions / feedback_responses: bewust anon ---
-- Externe 360-feedbackgevers loggen niet in; toegang loopt via een
-- gedeelde code. BEKEND RESTRISICO (niet in dit patch opgelost):
-- met alleen de anon-key kun je nog steeds ALLE sessies/reacties in
-- bulk uitlezen i.p.v. alleen die van een code die je kent — dat
-- vergt een eigen ontwerp-aanpassing (bv. scoping via een security-
-- definer functie op code), geen quick fix.

-- ---- 5. Storage lab-docs: van anon naar ingelogd --------------
drop policy if exists "lab-docs anon read"   on storage.objects;
drop policy if exists "lab-docs anon insert" on storage.objects;
drop policy if exists "lab-docs anon update" on storage.objects;
drop policy if exists "lab-docs anon delete" on storage.objects;
drop policy if exists "lab-docs auth read"   on storage.objects;
drop policy if exists "lab-docs auth insert" on storage.objects;
drop policy if exists "lab-docs auth update" on storage.objects;
drop policy if exists "lab-docs auth delete" on storage.objects;

create policy "lab-docs auth read" on storage.objects
  for select to authenticated using (bucket_id = 'lab-docs');
create policy "lab-docs auth insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'lab-docs');
create policy "lab-docs auth update" on storage.objects
  for update to authenticated using (bucket_id = 'lab-docs') with check (bucket_id = 'lab-docs');
create policy "lab-docs auth delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lab-docs');
