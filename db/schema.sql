-- ============================================================
-- HOUSE OF PILOTS — SUPABASE SCHEMA
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor:
--   supabase.com → jouw project → SQL Editor → New query
-- ============================================================

-- ---- 1. USERS (piloten + coaches) --------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text,
  full_name     text not null,
  role          text not null check (role in ('pilot','coach')),
  password_hash text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Migratie: kolommen toevoegen als de tabel al bestaat
alter table users add column if not exists password_hash text;
alter table feedback_responses add column if not exists submitted_at timestamptz default now();

-- ---- 2. FEEDBACK SESSIONS ----------------------------------
create table if not exists feedback_sessions (
  code          text primary key,
  subject_name  text not null,
  subject_role  text,
  owner_id      uuid references users(id),
  created_at    timestamptz default now()
);

-- ---- 3. FEEDBACK RESPONSES ---------------------------------
create table if not exists feedback_responses (
  id                uuid primary key default gen_random_uuid(),
  session_code      text not null references feedback_sessions(code) on delete cascade,
  respondent_name   text not null,
  respondent_role   text,
  is_self           boolean not null default false,
  ratings           jsonb not null default '{}',
  notes             jsonb not null default '{}',
  submitted_at      timestamptz default now()
);

-- ---- 4. PCP SCORES -----------------------------------------
create table if not exists pcp_scores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id),
  scored_by      text not null check (scored_by in ('pilot','coach')),
  competence_id  text not null,
  value          integer not null check (value between 1 and 5),
  note           text default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (user_id, scored_by, competence_id)
);

-- ---- INDICES -----------------------------------------------
create index if not exists feedback_responses_session_code_idx on feedback_responses(session_code);
create index if not exists pcp_scores_user_id_idx on pcp_scores(user_id);
create index if not exists feedback_sessions_owner_id_idx on feedback_sessions(owner_id);

-- ---- ROW LEVEL SECURITY ------------------------------------
-- De site gebruikt de publieke anon-sleutel (geen login).
-- Deze policies geven de anonieme rol volledige lees-/schrijftoegang.
alter table users enable row level security;
alter table feedback_sessions enable row level security;
alter table feedback_responses enable row level security;
alter table pcp_scores enable row level security;

create policy "anon full access" on users
  for all to anon using (true) with check (true);

create policy "anon full access" on feedback_sessions
  for all to anon using (true) with check (true);

create policy "anon full access" on feedback_responses
  for all to anon using (true) with check (true);

create policy "anon full access" on pcp_scores
  for all to anon using (true) with check (true);
