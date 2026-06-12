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

-- ---- 5. LAB: PROJECT-OPDRACHTEN ----------------------------
-- Een 'assignment' is één instantie van een vast projecttype
-- (project_id verwijst naar de catalogus in js/data.js, bv.
-- 'beurzen-evenementen'). De coach maakt instanties aan en hangt
-- piloten eraan. Status stuurt de workflow.
create table if not exists lab_assignments (
  id                   uuid primary key default gen_random_uuid(),
  project_id           text not null,
  label                text,
  status               text not null default 'open'
                         check (status in ('open','submitted','revision','completed')),
  -- huidige (laatst geüploade) document; werkkopie tot 'dien in'
  document_path        text,
  document_name        text,
  document_uploaded_by uuid references users(id) on delete set null,
  document_uploaded_at timestamptz,
  -- geschiedenis van coach-feedbackrondes (jsonb, zie js/api.js):
  -- [{ document_path, document_name, submitted_at, feedback,
  --    feedback_at, is_final }]
  rounds               jsonb not null default '[]',
  created_by           uuid references users(id) on delete set null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ---- 6. LAB: TEAMLEDEN (piloten per assignment) ------------
create table if not exists lab_assignment_members (
  assignment_id uuid not null references lab_assignments(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (assignment_id, user_id)
);

-- ---- INDICES -----------------------------------------------
create index if not exists feedback_responses_session_code_idx on feedback_responses(session_code);
create index if not exists pcp_scores_user_id_idx on pcp_scores(user_id);
create index if not exists feedback_sessions_owner_id_idx on feedback_sessions(owner_id);
create index if not exists lab_assignments_project_id_idx on lab_assignments(project_id);
create index if not exists lab_assignment_members_user_id_idx on lab_assignment_members(user_id);

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

alter table lab_assignments enable row level security;
alter table lab_assignment_members enable row level security;

-- drop-if-exists maakt dit blok veilig om opnieuw te draaien
drop policy if exists "anon full access" on lab_assignments;
create policy "anon full access" on lab_assignments
  for all to anon using (true) with check (true);

drop policy if exists "anon full access" on lab_assignment_members;
create policy "anon full access" on lab_assignment_members
  for all to anon using (true) with check (true);

-- ============================================================
-- STORAGE: bucket voor Lab-documenten (.docx)
-- ============================================================
-- Maakt een publieke bucket 'lab-docs' aan en geeft de anon-rol
-- upload-/lees-/verwijderrechten (consistent met de rest van de app).
insert into storage.buckets (id, name, public)
values ('lab-docs', 'lab-docs', true)
on conflict (id) do nothing;

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
