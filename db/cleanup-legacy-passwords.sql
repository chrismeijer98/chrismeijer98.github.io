-- ============================================================
-- HOUSE OF PILOTS — oude wachtwoord-hashes opruimen
-- ============================================================
-- Voer dit uit in de Supabase SQL-editor, na de wachtwoord-reset-
-- ronde (stap 5 van de runbook) voor alle gebruikers.
--
-- password_hash werd gebruikt door de oude, inmiddels vervangen
-- inlogmethode (zie js/api.js) en staat nergens meer in de code.
-- De waarden die er nu nog in staan zijn de WACHTWOORDEN VAN VÓÓR
-- HET LEK — die zijn al eerder buitgemaakt door wie het lek meldde.
-- Ze doen niets meer (login gebruikt nu Supabase Auth), maar zonder
-- reden bewaren van al-gecompromitteerde hashes is onnodig risico
-- bij een eventueel toekomstig lek. Vandaar: leegmaken.
-- ============================================================

update users set password_hash = null where password_hash is not null;
