-- ============================================================
-- HOUSE OF PILOTS — AGENDA & EVENTS
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Simpel model: open (anon) toegang, consistent met de rest.
--
-- category verwijst naar EVENT_CATEGORIES in js/data.js.
-- ============================================================

-- ---- 1. EVENEMENTEN ----------------------------------------
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text,
  description  text,
  location     text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  capacity     integer,                 -- null = onbeperkt
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---- 2. AAN-/AFMELDINGEN + WACHTLIJST ----------------------
create table if not exists event_signups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  status      text not null default 'registered'
                check (status in ('registered','waitlist')),
  created_at  timestamptz default now(),
  unique (event_id, user_id)
);

-- ---- INDICES -----------------------------------------------
create index if not exists events_starts_at_idx on events(starts_at);
create index if not exists event_signups_event_idx on event_signups(event_id);
create index if not exists event_signups_user_idx on event_signups(user_id);

-- ---- ROW LEVEL SECURITY (open, simpel model) ---------------
alter table events        enable row level security;
alter table event_signups enable row level security;

drop policy if exists "anon full access" on events;
create policy "anon full access" on events for all using (true) with check (true);

drop policy if exists "anon full access" on event_signups;
create policy "anon full access" on event_signups for all using (true) with check (true);
