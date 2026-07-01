-- ============================================================
-- HOUSE OF PILOTS — OEFENINGEN (individueel oefenplatform)
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor (na db/schema.sql).
-- Simpel model: open (anon) toegang, consistent met de rest.
--
-- candidate = pilot; category_id/type_id verwijzen naar de
-- catalogus in js/data.js + js/oefendata.js.
-- ============================================================

-- ---- 1. VRIJGEGEVEN CATEGORIEËN (per kandidaat) ------------
create table if not exists exercise_unlocks (
  candidate_id uuid not null references users(id) on delete cascade,
  category_id  text not null,
  unlocked_by  uuid references users(id) on delete set null,
  created_at   timestamptz default now(),
  primary key (candidate_id, category_id)
);

-- ---- 2. SCORES ---------------------------------------------
create table if not exists exercise_scores (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references users(id) on delete cascade,
  category_id  text not null,
  type_id      text not null,
  score        numeric not null,             -- 0-100 of ms
  scale_type   text not null default 'percentage' check (scale_type in ('percentage','milliseconds')),
  created_at   timestamptz default now()
);

-- ---- INDICES -----------------------------------------------
create index if not exists exercise_unlocks_candidate_idx on exercise_unlocks(candidate_id);
create index if not exists exercise_scores_candidate_idx on exercise_scores(candidate_id);
create index if not exists exercise_scores_cat_idx on exercise_scores(candidate_id, category_id);

-- ---- ROW LEVEL SECURITY (open, simpel model) ---------------
alter table exercise_unlocks enable row level security;
alter table exercise_scores  enable row level security;

drop policy if exists "anon full access" on exercise_unlocks;
create policy "anon full access" on exercise_unlocks for all using (true) with check (true);

drop policy if exists "anon full access" on exercise_scores;
create policy "anon full access" on exercise_scores for all using (true) with check (true);
