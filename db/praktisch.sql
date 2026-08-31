-- ============================================================
-- HOUSE OF PILOTS — PRAKTISCHE ZAKEN (forum + verlofaanvragen)
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Vereist een ingelogde gebruiker (Supabase Auth) — zie
-- db/security-lockdown.sql. Nog geen per-gebruiker scoping,
-- alleen een inlog-gate.
-- ============================================================

-- ---- 1. FORUM — algemene onderwerpen (vragen aan elkaar, klantpartners, etc.) ----
create table if not exists practical_threads (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists practical_posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references practical_threads(id) on delete cascade,
  author_id   uuid references users(id) on delete set null,
  body        text not null default '',
  created_at  timestamptz default now()
);

-- ---- 2. VERLOFAANVRAGEN ------------------------------------
create table if not exists leave_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  days         numeric,
  reason       text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by  uuid references users(id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz default now()
);

-- ---- INDICES -----------------------------------------------
create index if not exists practical_posts_thread_idx  on practical_posts(thread_id);
create index if not exists leave_requests_user_idx     on leave_requests(user_id);
create index if not exists leave_requests_status_idx   on leave_requests(status);

-- ---- ROW LEVEL SECURITY (ingelogd, geen open anon-toegang) ---
alter table practical_threads enable row level security;
alter table practical_posts   enable row level security;
alter table leave_requests    enable row level security;

drop policy if exists "anon full access" on practical_threads;
drop policy if exists "auth full practical_threads" on practical_threads;
create policy "auth full practical_threads" on practical_threads for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on practical_posts;
drop policy if exists "auth full practical_posts" on practical_posts;
create policy "auth full practical_posts" on practical_posts for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on leave_requests;
drop policy if exists "auth full leave_requests" on leave_requests;
create policy "auth full leave_requests" on leave_requests for all to authenticated using (true) with check (true);
