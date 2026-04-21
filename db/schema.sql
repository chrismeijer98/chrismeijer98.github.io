-- ============================================================
-- HOUSE OF PILOTS — DATAMODEL (referentie)
-- ============================================================
-- Deze site draait volledig lokaal in de browser: alle data
-- wordt opgeslagen in `localStorage` onder de keys hieronder.
-- Dit SQL-bestand is NIET nodig om de site te runnen — het
-- beschrijft alleen de structuur voor referentie en als
-- vertrekpunt als je later alsnog naar een echte database
-- (bv. Postgres, SQLite) wilt migreren.
--
-- localStorage keys (elk bevat een JSON-array):
--   hop.users                ↔ tabel `users`
--   hop.feedback_sessions    ↔ tabel `feedback_sessions`
--   hop.feedback_responses   ↔ tabel `feedback_responses`
--   hop.pcp_scores           ↔ tabel `pcp_scores`
-- ============================================================

-- ---- 1. USERS (piloten + coaches) --------------------------
create table users (
  id           text primary key,              -- uuid in app (crypto.randomUUID)
  email        text,
  full_name    text not null,
  role         text not null check (role in ('pilot','coach')),
  created_at   text                           -- ISO-timestamp
);

-- ---- 2. FEEDBACK SESSIONS ----------------------------------
create table feedback_sessions (
  code          text primary key,             -- bv. ST-4F7K
  subject_name  text not null,
  subject_role  text,
  owner_id      text,                         -- FK -> users.id
  created_at    text
);

-- ---- 3. FEEDBACK RESPONSES ---------------------------------
create table feedback_responses (
  id                text primary key,
  session_code      text not null,            -- FK -> feedback_sessions.code
  respondent_name   text not null,
  respondent_role   text,
  is_self           integer not null default 0,
  ratings           text not null default '{}',   -- JSON: { "stabiliteit_0": 4, ... }
  notes             text not null default '{}',   -- JSON: { "stabiliteit": "..." }
  submitted_at      text
);
-- Eén zelfreflectie per sessie:
--   unique (session_code) where is_self = 1

-- ---- 4. PCP SCORES (Pilot Career Plan competenties) --------
create table pcp_scores (
  id             text primary key,
  user_id        text not null,               -- FK -> users.id
  scored_by      text not null check (scored_by in ('pilot','coach')),
  competence_id  text not null,               -- bv. "1.1" of "1.1.a"
  value          integer not null check (value between 1 and 5),
  note           text default '',
  created_at     text,
  updated_at     text,
  unique (user_id, scored_by, competence_id)
);
