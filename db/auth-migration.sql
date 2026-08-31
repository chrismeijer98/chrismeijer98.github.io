-- ============================================================
-- HOUSE OF PILOTS — MIGRATIE NAAR SUPABASE AUTH + RLS
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor NA db/schema.sql.
-- Idempotent: veilig om opnieuw te draaien.
--
-- Status: db/schema.sql en de losse feature-bestanden maken hun
-- policies inmiddels al direct als "authenticated" aan, dus op een
-- vers project is dit bestand overbodig (maar onschadelijk om alsnog
-- te draaien). Bewaard voor een bestaand project dat nog op de
-- oorspronkelijke open anon-policies draait — zie ook de bredere
-- db/security-lockdown.sql, die dezelfde stap voor ALLE tabellen zet.
--
-- Aanpak: de bestaande `users`-tabel blijft het profiel/identiteits-
-- record van de app (alle foreign keys naar users.id blijven werken).
-- We koppelen elke gebruiker via users.auth_id aan een Supabase
-- Auth-account (auth.users). Inloggen gebeurt voortaan via Supabase
-- Auth; de app leest het profiel op via auth_id.
-- ============================================================

-- ---- 1. Koppelkolom naar auth.users ------------------------
alter table users add column if not exists auth_id uuid;

-- unieke koppeling (één auth-account per profiel)
create unique index if not exists users_auth_id_key on users(auth_id);

-- ---- 2. Helperfuncties: huidige app-gebruiker & rol --------
-- security definer zodat de functie users mag lezen zonder dat de
-- RLS-policies van users zichzelf recursief aanroepen.
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

-- ============================================================
-- 3. RLS HERZIEN
-- ============================================================
-- Uitgangspunt nu (foundation-fase):
--   * users / pcp_scores / lab_* : alleen voor INGELOGDE gebruikers
--     (echte auth-gate). Per-gebruiker dichttimmeren doen we later
--     per feature (o.a. de Coaching-module krijgt strikte policies).
--   * feedback_sessions / feedback_responses : BLIJVEN anon, want
--     externe 360°-feedbackgevers zijn niet ingelogd (code-based).
--   * Gebruikers AANMAKEN/WIJZIGEN/VERWIJDEREN loopt via de Edge
--     Function met de service-role (omzeilt RLS) — dus geen
--     schrijf-policy voor clients op users nodig.
-- ============================================================

-- ---- users: ingelogd mag lezen; schrijven via service-role ----
drop policy if exists "anon full access" on users;
drop policy if exists "auth read users" on users;
create policy "auth read users" on users
  for select to authenticated using (true);

-- ---- pcp_scores: alleen ingelogd ----
drop policy if exists "anon full access" on pcp_scores;
drop policy if exists "auth full pcp" on pcp_scores;
create policy "auth full pcp" on pcp_scores
  for all to authenticated using (true) with check (true);

-- ---- lab_assignments / members: alleen ingelogd ----
drop policy if exists "anon full access" on lab_assignments;
drop policy if exists "auth full lab_assignments" on lab_assignments;
create policy "auth full lab_assignments" on lab_assignments
  for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on lab_assignment_members;
drop policy if exists "auth full lab_members" on lab_assignment_members;
create policy "auth full lab_members" on lab_assignment_members
  for all to authenticated using (true) with check (true);

-- ---- feedback_*: bewust anon laten (externe responders) ----
-- (we laten de bestaande "anon full access"-policies hier staan)

-- ---- Storage lab-docs: van anon naar ingelogd ----
drop policy if exists "lab-docs anon read"   on storage.objects;
drop policy if exists "lab-docs anon insert" on storage.objects;
drop policy if exists "lab-docs anon update" on storage.objects;
drop policy if exists "lab-docs anon delete" on storage.objects;

drop policy if exists "lab-docs auth read" on storage.objects;
create policy "lab-docs auth read" on storage.objects
  for select to authenticated using (bucket_id = 'lab-docs');

drop policy if exists "lab-docs auth insert" on storage.objects;
create policy "lab-docs auth insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'lab-docs');

drop policy if exists "lab-docs auth update" on storage.objects;
create policy "lab-docs auth update" on storage.objects
  for update to authenticated using (bucket_id = 'lab-docs') with check (bucket_id = 'lab-docs');

drop policy if exists "lab-docs auth delete" on storage.objects;
create policy "lab-docs auth delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lab-docs');
