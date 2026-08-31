-- ============================================================
-- HOUSE OF PILOTS — ONTWIKKELASSESSMENT (persoonlijkheid, 6/12 mnd)
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Vereist een ingelogde gebruiker (Supabase Auth) — zie
-- db/security-lockdown.sql. Nog geen per-gebruiker scoping,
-- alleen een inlog-gate.
-- ============================================================

-- ---- Programma-startdatum per piloot (coach vult in) --------
-- Referentiepunt waarvanaf de 6- en 12-maanden meetmomenten
-- ontgrendeld worden (zie js/portal.js: assessmentWaveState()).
alter table users add column if not exists program_start_date date;

-- ---- Antwoorden + berekend rapport per meetmoment ------------
create table if not exists assessment_responses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  wave          text not null check (wave in ('m6','m12')),
  answers       jsonb not null default '[]',
  scores        jsonb not null default '{}',
  report        jsonb not null default '{}',
  submitted_at  timestamptz default now(),
  unique (user_id, wave)
);

create index if not exists assessment_responses_user_idx on assessment_responses(user_id);

alter table assessment_responses enable row level security;
drop policy if exists "anon full access" on assessment_responses;
drop policy if exists "auth full assessment_responses" on assessment_responses;
create policy "auth full assessment_responses" on assessment_responses for all to authenticated using (true) with check (true);
