-- ============================================================
-- HOUSE OF PILOTS — LAB-GROEPEN (groepsomgevingen)
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Vereist een ingelogde gebruiker (Supabase Auth) — zie
-- db/security-lockdown.sql. Nog geen per-groep scoping, alleen
-- een inlog-gate. Bestanden gaan naar de bestaande storage-bucket
-- 'lab-docs'.
-- ============================================================

-- ---- 1. GROEPEN --------------------------------------------
create table if not exists lab_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  self_enroll  boolean not null default false,   -- mogen deelnemers zichzelf inschrijven?
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now()
);

-- ---- 2. GROEPSLEDEN ----------------------------------------
create table if not exists lab_group_members (
  group_id   uuid not null references lab_groups(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ---- 3. BESTANDEN (metadata; blob in storage 'lab-docs') ---
create table if not exists lab_group_files (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references lab_groups(id) on delete cascade,
  name        text not null,
  path        text not null,
  size        bigint,
  uploaded_by uuid references users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ---- 4. TAKEN ----------------------------------------------
create table if not exists lab_group_tasks (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references lab_groups(id) on delete cascade,
  title        text not null,
  assignee_id  uuid references users(id) on delete set null,
  status       text not null default 'open' check (status in ('open','in_progress','done')),
  priority     text not null default 'normal' check (priority in ('low','normal','high')),
  due_date     date,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---- 5. FORUM: THREADS + POSTS -----------------------------
create table if not exists lab_group_threads (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references lab_groups(id) on delete cascade,
  title       text not null,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now()
);
create table if not exists lab_group_posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references lab_group_threads(id) on delete cascade,
  group_id    uuid not null references lab_groups(id) on delete cascade,
  author_id   uuid references users(id) on delete set null,
  body        text not null default '',
  created_at  timestamptz default now()
);

-- ---- 6. NOTULEN --------------------------------------------
create table if not exists lab_group_minutes (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references lab_groups(id) on delete cascade,
  title        text not null,
  body         text not null default '',
  meeting_date date,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now()
);

-- ---- 7. CHAT -----------------------------------------------
create table if not exists lab_group_messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references lab_groups(id) on delete cascade,
  author_id   uuid references users(id) on delete set null,
  body        text not null default '',
  created_at  timestamptz default now()
);

-- ---- INDICES -----------------------------------------------
create index if not exists lab_group_members_user_idx  on lab_group_members(user_id);
create index if not exists lab_group_files_group_idx    on lab_group_files(group_id);
create index if not exists lab_group_tasks_group_idx    on lab_group_tasks(group_id);
create index if not exists lab_group_threads_group_idx  on lab_group_threads(group_id);
create index if not exists lab_group_posts_thread_idx   on lab_group_posts(thread_id);
create index if not exists lab_group_minutes_group_idx  on lab_group_minutes(group_id);
create index if not exists lab_group_messages_group_idx on lab_group_messages(group_id, created_at);

-- ---- ROW LEVEL SECURITY (ingelogd, geen open anon-toegang) ---
do $$
declare t text;
begin
  foreach t in array array[
    'lab_groups','lab_group_members','lab_group_files','lab_group_tasks',
    'lab_group_threads','lab_group_posts','lab_group_minutes','lab_group_messages'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon full access" on %I', t);
    execute format('drop policy if exists "auth full %s" on %I', t, t);
    execute format('create policy "auth full %s" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---- REALTIME voor de chat ---------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lab_group_messages'
  ) then
    alter publication supabase_realtime add table lab_group_messages;
  end if;
end $$;
