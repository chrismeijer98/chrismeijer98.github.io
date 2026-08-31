-- ============================================================
-- HOUSE OF PILOTS — FEEDBACK: code-scoped toegang i.p.v. bulk anon
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor NA db/security-lockdown.sql.
-- Idempotent: veilig om opnieuw te draaien.
--
-- PROBLEEM: feedback_sessions/feedback_responses stonden open voor
-- anon met "using (true)". Dat betekent dat je met alleen de
-- publieke anon-key ALLE sessies en ALLE feedback-antwoorden van
-- IEDEREEN kon uitlezen — niet alleen die van één code die je toevallig
-- kent. Externe 360°-feedbackgevers loggen bewust niet in (toegang via
-- een gedeelde code), dus "authenticated" alleen is hier geen oplossing.
--
-- FIX: directe tabeltoegang tot feedback_responses helemaal dicht
-- (voor zowel anon als authenticated), en vervangen door 4 functies
-- die de sessiecode als verplichte parameter eisen. Zonder de exacte
-- code krijg je niets terug — geen enumeratie meer mogelijk.
-- feedback_sessions blijft voor authenticated (coach/pilot beheert
-- eigen sessies via portal.html), maar anon verliest directe toegang.
-- ============================================================

revoke all on feedback_sessions  from anon;
revoke all on feedback_responses from anon, authenticated;

drop policy if exists "anon full access" on feedback_sessions;
drop policy if exists "auth full feedback_sessions" on feedback_sessions;
create policy "auth full feedback_sessions" on feedback_sessions
  for all to authenticated using (true) with check (true);

drop policy if exists "anon full access" on feedback_responses;
-- Bewust geen policy meer op feedback_responses: alle toegang (ook
-- voor ingelogde coaches/piloten die hun eigen rapport bekijken) loopt
-- via de security-definer functies hieronder.

-- ---- 1. Sessie opzoeken op code -------------------------------
create or replace function fb_get_session(p_code text)
  returns setof feedback_sessions
  language sql stable security definer set search_path = public
as $$
  select * from feedback_sessions where code = p_code
$$;

-- ---- 2. Reacties opzoeken op sessiecode ------------------------
create or replace function fb_list_responses(p_code text)
  returns setof feedback_responses
  language sql stable security definer set search_path = public
as $$
  select * from feedback_responses where session_code = p_code
$$;

-- ---- 3. Reactie indienen (met zelfreflectie-vervang-logica) ----
create or replace function fb_submit_response(
  p_session_code   text,
  p_respondent_name text,
  p_respondent_role text,
  p_is_self        boolean,
  p_ratings        jsonb,
  p_notes          jsonb
) returns feedback_responses
  language plpgsql security definer set search_path = public
as $$
declare
  result feedback_responses;
begin
  if not exists (select 1 from feedback_sessions where code = p_session_code) then
    raise exception 'Onbekende sessiecode';
  end if;

  if p_is_self then
    delete from feedback_responses where session_code = p_session_code and is_self = true;
  end if;

  insert into feedback_responses (session_code, respondent_name, respondent_role, is_self, ratings, notes)
  values (p_session_code, p_respondent_name, p_respondent_role, coalesce(p_is_self, false),
          coalesce(p_ratings, '{}'::jsonb), coalesce(p_notes, '{}'::jsonb))
  returning * into result;

  return result;
end;
$$;

-- ---- 4. Eigen reactie bijwerken (bv. zelfreflectie aanpassen) --
-- p_session_code moet overeenkomen met de rij die p_id heeft — zo kan
-- iemand nooit een reactie van een andere sessie raken, zelfs niet
-- met een geraden/gelekt id.
create or replace function fb_update_response(
  p_id             uuid,
  p_session_code   text,
  p_respondent_name text,
  p_respondent_role text,
  p_ratings        jsonb,
  p_notes          jsonb
) returns feedback_responses
  language plpgsql security definer set search_path = public
as $$
declare
  result feedback_responses;
begin
  update feedback_responses
    set respondent_name = coalesce(p_respondent_name, respondent_name),
        respondent_role = coalesce(p_respondent_role, respondent_role),
        ratings         = coalesce(p_ratings, ratings),
        notes           = coalesce(p_notes, notes)
    where id = p_id and session_code = p_session_code
    returning * into result;

  if result is null then
    raise exception 'Reactie niet gevonden voor deze code';
  end if;
  return result;
end;
$$;

grant execute on function fb_get_session(text) to anon, authenticated;
grant execute on function fb_list_responses(text) to anon, authenticated;
grant execute on function fb_submit_response(text, text, text, boolean, jsonb, jsonb) to anon, authenticated;
grant execute on function fb_update_response(uuid, text, text, text, jsonb, jsonb) to anon, authenticated;
