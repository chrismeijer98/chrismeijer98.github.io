-- ============================================================
-- HOUSE OF PILOTS — FASE 2: per-gebruiker afscherming
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor NA db/security-lockdown.sql
-- en db/feedback-lockdown.sql. Idempotent: veilig om opnieuw te draaien.
--
-- Fase 1 (security-lockdown.sql) sloot de database af voor niet-
-- ingelogde bezoekers, maar gaf elke INGELOGDE gebruiker nog toegang
-- tot ALLE rijen ("authenticated using (true)"). Deze fase voegt
-- echte per-gebruiker scoping toe.
--
-- ONTWERPKEUZE (gebaseerd op hoe de app dit al gebruikt, zie
-- js/portal.js "COACH: deelnemers koppelen" — daar kan een coach ELKE
-- coach aan een piloot koppelen, niet alleen zichzelf):
--   * Een coach ziet/beheert alle operationele data van alle piloten
--     (PCP-scores, verlofaanvragen, assessments, oefenscores,
--     coach-piloot-koppelingen, coachgesprekken/actiepunten/adviezen).
--     Coaches zijn hier dus staf met organisatiebreed overzicht, geen
--     onderling afgeschermde 1-op-1-relaties.
--   * Een piloot ziet ALLEEN zijn/haar eigen data.
--   * Uitzondering: coaching_notes (notities VAN de piloot) blijven
--     privé van de piloot tenzij de piloot ze zelf op shared=true zet
--     — dat stond al zo in het datamodel bedoeld, maar werd nooit
--     afgedwongen (iedereen die was ingelogd kon alles lezen).
--   * users (naam/rol-overzicht), events/event_signups (gedeelde
--     agenda) en practical_threads/posts (intern forum) blijven zoals
--     ze waren: zichtbaar voor iedereen die is ingelogd — dat lijkt
--     bewust gedeeld, niet privé per persoon.
-- ============================================================

-- ---- Helper: zit ik in deze coach-piloot-koppeling? ------------
create or replace function in_coaching_relation(p_relation_id uuid)
  returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from coaching_relations
    where id = p_relation_id and (coach_id = app_uid() or pilot_id = app_uid())
  )
$$;
grant execute on function in_coaching_relation(uuid) to authenticated;

-- ---- Helper: ben ik lid van deze lab-groep? --------------------
create or replace function is_lab_group_member(p_group_id uuid)
  returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (select 1 from lab_group_members where group_id = p_group_id and user_id = app_uid())
$$;
grant execute on function is_lab_group_member(uuid) to authenticated;

-- ---- Helper: ben ik lid van deze lab-opdracht? -----------------
create or replace function is_lab_assignment_member(p_assignment_id uuid)
  returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (select 1 from lab_assignment_members where assignment_id = p_assignment_id and user_id = app_uid())
$$;
grant execute on function is_lab_assignment_member(uuid) to authenticated;

-- ---- pcp_scores: coach ziet alles, piloot alleen eigen scores --
drop policy if exists "auth full pcp_scores" on pcp_scores;
drop policy if exists "scoped pcp_scores" on pcp_scores;
create policy "scoped pcp_scores" on pcp_scores
  for all to authenticated
  using (app_role() = 'coach' or user_id = app_uid())
  with check (app_role() = 'coach' or user_id = app_uid());

-- ---- assessment_responses: idem -------------------------------
drop policy if exists "auth full assessment_responses" on assessment_responses;
drop policy if exists "scoped assessment_responses" on assessment_responses;
create policy "scoped assessment_responses" on assessment_responses
  for all to authenticated
  using (app_role() = 'coach' or user_id = app_uid())
  with check (app_role() = 'coach' or user_id = app_uid());

-- ---- exercise_unlocks / exercise_scores: idem (candidate_id) ---
drop policy if exists "auth full exercise_unlocks" on exercise_unlocks;
drop policy if exists "scoped exercise_unlocks" on exercise_unlocks;
create policy "scoped exercise_unlocks" on exercise_unlocks
  for all to authenticated
  using (app_role() = 'coach' or candidate_id = app_uid())
  with check (app_role() = 'coach' or candidate_id = app_uid());

drop policy if exists "auth full exercise_scores" on exercise_scores;
drop policy if exists "scoped exercise_scores" on exercise_scores;
create policy "scoped exercise_scores" on exercise_scores
  for all to authenticated
  using (app_role() = 'coach' or candidate_id = app_uid())
  with check (app_role() = 'coach' or candidate_id = app_uid());

-- ---- leave_requests: coach ziet alles, piloot alleen eigen -----
drop policy if exists "auth full leave_requests" on leave_requests;
drop policy if exists "scoped leave_requests" on leave_requests;
create policy "scoped leave_requests" on leave_requests
  for all to authenticated
  using (app_role() = 'coach' or user_id = app_uid())
  with check (app_role() = 'coach' or user_id = app_uid());

-- ---- coaching_relations: coach ziet/beheert alles, piloot alleen
--      de koppeling(en) waar hij/zij zelf in voorkomt ------------
drop policy if exists "auth full coaching_relations" on coaching_relations;
drop policy if exists "scoped coaching_relations" on coaching_relations;
create policy "scoped coaching_relations" on coaching_relations
  for all to authenticated
  using (app_role() = 'coach' or pilot_id = app_uid())
  with check (app_role() = 'coach' or pilot_id = app_uid());

-- ---- coaching_sessions / coaching_actions / coaching_advice: ---
-- coach ziet alles, piloot alleen als hij/zij in de gekoppelde
-- coaching_relations voorkomt.
drop policy if exists "auth full coaching_sessions" on coaching_sessions;
drop policy if exists "scoped coaching_sessions" on coaching_sessions;
create policy "scoped coaching_sessions" on coaching_sessions
  for all to authenticated
  using (app_role() = 'coach' or in_coaching_relation(relation_id))
  with check (app_role() = 'coach' or in_coaching_relation(relation_id));

drop policy if exists "auth full coaching_actions" on coaching_actions;
drop policy if exists "scoped coaching_actions" on coaching_actions;
create policy "scoped coaching_actions" on coaching_actions
  for all to authenticated
  using (app_role() = 'coach' or in_coaching_relation(relation_id))
  with check (app_role() = 'coach' or in_coaching_relation(relation_id));

drop policy if exists "auth full coaching_advice" on coaching_advice;
drop policy if exists "scoped coaching_advice" on coaching_advice;
create policy "scoped coaching_advice" on coaching_advice
  for all to authenticated
  using (app_role() = 'coach' or in_coaching_relation(relation_id))
  with check (app_role() = 'coach' or in_coaching_relation(relation_id));

-- ---- coaching_notes: privé van de piloot, tenzij shared=true ---
-- Dit is de enige tabel met per-commando policies i.p.v. één "for
-- all", omdat lezen en schrijven hier echt andere regels hebben.
drop policy if exists "auth full coaching_notes" on coaching_notes;
drop policy if exists "select coaching_notes" on coaching_notes;
drop policy if exists "insert coaching_notes" on coaching_notes;
drop policy if exists "update coaching_notes" on coaching_notes;
drop policy if exists "delete coaching_notes" on coaching_notes;

create policy "select coaching_notes" on coaching_notes
  for select to authenticated
  using (
    author_id = app_uid()
    or (shared = true and (app_role() = 'coach' or in_coaching_relation(relation_id)))
  );

create policy "insert coaching_notes" on coaching_notes
  for insert to authenticated
  with check (author_id = app_uid() and in_coaching_relation(relation_id));

create policy "update coaching_notes" on coaching_notes
  for update to authenticated
  using (author_id = app_uid())
  with check (author_id = app_uid());

create policy "delete coaching_notes" on coaching_notes
  for delete to authenticated
  using (author_id = app_uid());

-- ---- lab_groups: coach, gemaakt-door, lid, of self-enroll ------
drop policy if exists "auth full lab_groups" on lab_groups;
drop policy if exists "scoped lab_groups" on lab_groups;
create policy "scoped lab_groups" on lab_groups
  for all to authenticated
  using (app_role() = 'coach' or created_by = app_uid() or self_enroll = true or is_lab_group_member(id))
  with check (app_role() = 'coach' or created_by = app_uid());

-- ---- lab_group_members: coach, jezelf, of mede-lid -------------
drop policy if exists "auth full lab_group_members" on lab_group_members;
drop policy if exists "scoped lab_group_members" on lab_group_members;
create policy "scoped lab_group_members" on lab_group_members
  for all to authenticated
  using (app_role() = 'coach' or user_id = app_uid() or is_lab_group_member(group_id))
  with check (app_role() = 'coach' or user_id = app_uid());

-- ---- lab_group_files/tasks/threads/posts/minutes/messages: -----
-- coach of lid van de groep (allemaal hebben een group_id-kolom).
do $$
declare t text;
begin
  foreach t in array array[
    'lab_group_files','lab_group_tasks','lab_group_threads',
    'lab_group_posts','lab_group_minutes','lab_group_messages'
  ] loop
    execute format('drop policy if exists "auth full %s" on %I', t, t);
    execute format('drop policy if exists "scoped %s" on %I', t, t);
    execute format(
      'create policy "scoped %s" on %I for all to authenticated using (app_role() = ''coach'' or is_lab_group_member(group_id)) with check (app_role() = ''coach'' or is_lab_group_member(group_id))',
      t, t
    );
  end loop;
end $$;

-- ---- lab_assignments: coach, gemaakt-door, of teamlid ----------
drop policy if exists "auth full lab_assignments" on lab_assignments;
drop policy if exists "scoped lab_assignments" on lab_assignments;
create policy "scoped lab_assignments" on lab_assignments
  for all to authenticated
  using (app_role() = 'coach' or created_by = app_uid() or is_lab_assignment_member(id))
  with check (app_role() = 'coach' or created_by = app_uid());

-- ---- lab_assignment_members: coach, jezelf, of teamgenoot ------
drop policy if exists "auth full lab_assignment_members" on lab_assignment_members;
drop policy if exists "scoped lab_assignment_members" on lab_assignment_members;
create policy "scoped lab_assignment_members" on lab_assignment_members
  for all to authenticated
  using (app_role() = 'coach' or user_id = app_uid() or is_lab_assignment_member(assignment_id))
  with check (app_role() = 'coach' or user_id = app_uid());

-- ============================================================
-- NIET aangepast, bewust gedeeld voor alle ingelogde gebruikers:
--   - users (naam/rol-overzicht, nodig voor dropdowns/koppelingen)
--   - events / event_signups (gedeelde agenda)
--   - practical_threads / practical_posts (intern forum)
-- Zeg het als je een van deze ook per-gebruiker afgeschermd wilt
-- hebben — dat vergt een aparte, gerichte aanpassing per tabel.
-- ============================================================
