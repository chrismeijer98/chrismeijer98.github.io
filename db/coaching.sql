-- ============================================================
-- HOUSE OF PILOTS — COACHING MODULE
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Vereist een ingelogde gebruiker (Supabase Auth) — zie
-- db/security-lockdown.sql. Nog geen per-coach/pilot scoping,
-- alleen een inlog-gate.
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

-- ---- ROW LEVEL SECURITY (ingelogd, geen open anon-toegang) ---
alter table coaching_relations enable row level security;
alter table coaching_sessions  enable row level security;
alter table coaching_notes     enable row level security;
alter table coaching_actions   enable row level security;
alter table coaching_advice    enable row level security;

drop policy if exists "anon full access" on coaching_relations;
drop policy if exists "auth full coaching_relations" on coaching_relations;
create policy "auth full coaching_relations" on coaching_relations for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on coaching_sessions;
drop policy if exists "auth full coaching_sessions" on coaching_sessions;
create policy "auth full coaching_sessions" on coaching_sessions for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on coaching_notes;
drop policy if exists "auth full coaching_notes" on coaching_notes;
create policy "auth full coaching_notes" on coaching_notes for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on coaching_actions;
drop policy if exists "auth full coaching_actions" on coaching_actions;
create policy "auth full coaching_actions" on coaching_actions for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on coaching_advice;
drop policy if exists "auth full coaching_advice" on coaching_advice;
create policy "auth full coaching_advice" on coaching_advice for all to authenticated using (true) with check (true);
nu