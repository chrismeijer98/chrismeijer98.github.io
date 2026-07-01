-- ============================================================
-- HOUSE OF PILOTS — COACHING MODULE
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Simpel model: open (anon) toegang, consistent met de rest.
--
-- Rolmapping in de app: coach = coach/teamcoach, pilot = deelnemer.
-- ============================================================

-- ---- 1. KOPPELING coach <-> deelnemer ----------------------
create table if not exists coaching_relations (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references users(id) on delete cascade,
  pilot_id    uuid not null references users(id) on delete cascade,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now(),
  unique (coach_id, pilot_id)
);

-- ---- 2. COACHGESPREKKEN -------------------------------------
create table if not exists coaching_sessions (
  id                 uuid primary key default gen_random_uuid(),
  relation_id        uuid not null references coaching_relations(id) on delete cascade,
  title              text,
  scheduled_at       timestamptz,
  status             text not null default 'planned'
                       check (status in ('planned','done','cancelled')),
  coach_feedback     text,
  coach_feedback_at  timestamptz,
  created_by         uuid references users(id) on delete set null,
  created_at         timestamptz default now()
);

-- ---- 3. NOTITIES (van de deelnemer; optioneel gedeeld) ------
create table if not exists coaching_notes (
  id           uuid primary key default gen_random_uuid(),
  relation_id  uuid not null references coaching_relations(id) on delete cascade,
  session_id   uuid references coaching_sessions(id) on delete set null,
  author_id    uuid references users(id) on delete set null,
  body         text not null default '',
  shared       boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---- 4. ACTIEPUNTEN -----------------------------------------
create table if not exists coaching_actions (
  id           uuid primary key default gen_random_uuid(),
  relation_id  uuid not null references coaching_relations(id) on delete cascade,
  session_id   uuid references coaching_sessions(id) on delete set null,
  title        text not null,
  status       text not null default 'open' check (status in ('open','done')),
  due_date     date,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---- 5. ONTWIKKELADVIEZEN (van de coach) --------------------
create table if not exists coaching_advice (
  id           uuid primary key default gen_random_uuid(),
  relation_id  uuid not null references coaching_relations(id) on delete cascade,
  coach_id     uuid references users(id) on delete set null,
  body         text not null default '',
  created_at   timestamptz default now()
);

-- ---- INDICES -----------------------------------------------
create index if not exists coaching_relations_coach_idx on coaching_relations(coach_id);
create index if not exists coaching_relations_pilot_idx on coaching_relations(pilot_id);
create index if not exists coaching_sessions_relation_idx on coaching_sessions(relation_id);
create index if not exists coaching_notes_relation_idx on coaching_notes(relation_id);
create index if not exists coaching_actions_relation_idx on coaching_actions(relation_id);
create index if not exists coaching_advice_relation_idx on coaching_advice(relation_id);

-- ---- ROW LEVEL SECURITY (open, simpel model) ---------------
alter table coaching_relations enable row level security;
alter table coaching_sessions  enable row level security;
alter table coaching_notes     enable row level security;
alter table coaching_actions   enable row level security;
alter table coaching_advice    enable row level security;

drop policy if exists "anon full access" on coaching_relations;
create policy "anon full access" on coaching_relations for all using (true) with check (true);

drop policy if exists "anon full access" on coaching_sessions;
create policy "anon full access" on coaching_sessions for all using (true) with check (true);

drop policy if exists "anon full access" on coaching_notes;
create policy "anon full access" on coaching_notes for all using (true) with check (true);

drop policy if exists "anon full access" on coaching_actions;
create policy "anon full access" on coaching_actions for all using (true) with check (true);

drop policy if exists "anon full access" on coaching_advice;
create policy "anon full access" on coaching_advice for all using (true) with check (true);
nu