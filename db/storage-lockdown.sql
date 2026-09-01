-- ============================================================
-- HOUSE OF PILOTS — opslag (lab-docs) echt afsluiten
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor NA db/per-user-scoping.sql.
-- Idempotent: veilig om opnieuw te draaien.
--
-- PROBLEEM: de bucket 'lab-docs' staat sinds het begin op "public".
-- Dat betekent dat elk geüpload bestand via zijn directe link door
-- IEDEREEN op internet is te openen, zonder in te loggen — helemaal
-- los van alle RLS-policies die we op de tabellen hebben gezet. De
-- policies op storage.objects golden alleen voor de "gewone" API,
-- niet voor de publieke bestands-URL's die de app zelf gebruikt
-- (js/api.js documentUrl() riep getPublicUrl() aan).
--
-- FIX: de bucket op privé zetten, en toegang per bestand afhankelijk
-- maken van lidmaatschap van de bijbehorende lab-groep of -opdracht
-- (op basis van het pad: "groups/<group_id>/..." of
-- "<assignment_id>/..." — zie js/api.js uploadGroupFile/
-- uploadAssignmentDocument). js/api.js is aangepast om voortaan
-- tijdelijke, ondertekende links te vragen (createSignedUrl) i.p.v.
-- permanente publieke links.
-- ============================================================

update storage.buckets set public = false where id = 'lab-docs';

create or replace function can_access_lab_doc(p_path text)
  returns boolean
  language plpgsql stable security definer set search_path = public
as $$
declare
  seg1 text;
  seg2 text;
  aid uuid;
  gid uuid;
begin
  if app_role() = 'coach' then
    return true;
  end if;

  seg1 := (storage.foldername(p_path))[1];
  seg2 := (storage.foldername(p_path))[2];

  -- pad "groups/<group_id>/..." -> lab_group_files
  if seg1 = 'groups' and seg2 is not null then
    begin
      gid := seg2::uuid;
    exception when others then
      return false;
    end;
    return is_lab_group_member(gid);
  end if;

  -- anders: pad "<assignment_id>/..." -> lab_assignments-document
  begin
    aid := seg1::uuid;
  exception when others then
    return false;
  end;

  return is_lab_assignment_member(aid)
    or exists (select 1 from lab_assignments where id = aid and created_by = app_uid());
end;
$$;
grant execute on function can_access_lab_doc(text) to authenticated;

drop policy if exists "lab-docs anon read"     on storage.objects;
drop policy if exists "lab-docs anon insert"   on storage.objects;
drop policy if exists "lab-docs anon update"   on storage.objects;
drop policy if exists "lab-docs anon delete"   on storage.objects;
drop policy if exists "lab-docs auth read"     on storage.objects;
drop policy if exists "lab-docs auth insert"   on storage.objects;
drop policy if exists "lab-docs auth update"   on storage.objects;
drop policy if exists "lab-docs auth delete"   on storage.objects;
drop policy if exists "lab-docs scoped read"   on storage.objects;
drop policy if exists "lab-docs scoped insert" on storage.objects;
drop policy if exists "lab-docs scoped update" on storage.objects;
drop policy if exists "lab-docs scoped delete" on storage.objects;

create policy "lab-docs scoped read" on storage.objects
  for select to authenticated
  using (bucket_id = 'lab-docs' and can_access_lab_doc(name));

create policy "lab-docs scoped insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lab-docs' and can_access_lab_doc(name));

create policy "lab-docs scoped update" on storage.objects
  for update to authenticated
  using (bucket_id = 'lab-docs' and can_access_lab_doc(name))
  with check (bucket_id = 'lab-docs' and can_access_lab_doc(name));

create policy "lab-docs scoped delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lab-docs' and can_access_lab_doc(name));
