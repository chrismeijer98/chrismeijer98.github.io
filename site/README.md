# House of Pilots — Career Portal

Een volledig lokale, statische webapp (HTML/CSS/JS) die het Pilot Career
Plan (PCP) en de 360° feedback samenbrengt. Alle data wordt opgeslagen in
de **localStorage** van de browser — geen server, geen database, geen
account nodig. Je opent gewoon `index.html`.

## Structuur

```
site/
├─ index.html            Landing + inloggen (naam + rol)
├─ portal.html           Dashboard · PCP · 360° Feedback hub
├─ feedback.html         Publieke feedback-pagina (respondent met code)
├─ report.html           Rapport + PDF-print
├─ css/style.css         Shared stylesheet
├─ js/
│  ├─ config.js          Lokale config (prefix voor localStorage keys)
│  ├─ api.js             localStorage-gebaseerde "backend" (CRUD)
│  ├─ data.js            Competenties + feedback thema's
│  ├─ utils.js           DOM-helpers, icons
│  ├─ portal.js          Portal logica (tabs, PCP, hub)
│  ├─ feedback.js        Respondent flow (identity → filling → done)
│  └─ report.js          Rapportopbouw + radar chart
└─ db/
   └─ schema.sql         Datamodel ter referentie (niet uitgevoerd)
```

## Starten

Dubbelklik op **`index.html`** — klaar. De site werkt volledig via `file://`.

Alle data blijft in de browser bewaard (localStorage). Wis je
browserdata, dan begin je opnieuw.

> Wil je het via een lokale server draaien (handig voor testen op andere
> apparaten op je netwerk)? Ieder static-file-servertje werkt, bv.
> `npx serve site/` of een VS Code "Live Server"-extensie.

## Gebruik

### Voor de piloot / coach (portal)

1. Open `index.html`, vul naam in en kies **Piloot** of **Coach**.
2. In het portal heb je drie tabs:
   - **Dashboard** — voortgang van je competentieprofiel en feedbacksessies.
   - **PCP — Competenties** — scoor kern-, primaire, persoonlijke en
     relationele competenties. Auto-save naar localStorage. Coach kan
     dezelfde competenties scoren; beide scores staan naast elkaar.
   - **360° Feedback** — maak een feedbacksessie aan met een unieke code,
     zie wie al heeft ingevuld, open het rapport.

### Voor feedbackgevers

1. Ontvangen een link of code van de piloot (bv. `ST-4F7K`).
2. Openen `feedback.html?code=ST-4F7K` (of voeren de code in op `feedback.html`).
3. Vullen naam + relatie in, doorlopen 11 thema's.
4. Klaar — piloot ziet direct in portal dat feedback is binnen.

> **Let op:** omdat alles lokaal in de browser staat, moeten feedbackgevers
> de site vanaf **dezelfde browser/machine** gebruiken als de piloot.
> Wil je dit echt op afstand doen, dan heb je een gedeelde backend nodig
> (zie "Naar een echte database" hieronder).

### Rapport

- Wanneer minimaal één zelfreflectie + enkele feedbackgevers ingevuld hebben,
  opent de piloot **"Rapport bekijken"** in de sessie-detailpagina.
- Dit rendert cover, overzicht, samenvattingsbalken, radar (situatieschets)
  en één pagina per thema.
- `Cmd/Ctrl + P` → opslaan als PDF. CSS `@media print` zorgt voor pagina-breaks.

## Datamodel

De app werkt met vier logische "tabellen", opgeslagen als JSON-arrays in
localStorage:

| localStorage key          | Velden (kern)                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `hop.users`               | id · full_name · email · role (`pilot`/`coach`)                                                                        |
| `hop.feedback_sessions`   | code (PK) · subject_name · subject_role · owner_id → users                                                             |
| `hop.feedback_responses`  | id · session_code → sessions · respondent_name · respondent_role · is_self · ratings · notes                           |
| `hop.pcp_scores`          | id · user_id → users · scored_by (`pilot`/`coach`) · competence_id · value 1-5 · note                                  |

`ratings` heeft als sleutels `{themaKey}_{stellingIndex}` (bv. `stabiliteit_0`).
`notes` heeft als sleutels themaKeys (bv. `leiderschap`).

Zie [`db/schema.sql`](db/schema.sql) voor het equivalente SQL-schema (als
referentie of vertrekpunt voor migratie).

## Data exporteren / importeren

Via de browser-console kun je bij alle data:

```js
// Alles exporteren als JSON:
copy(JSON.stringify(HopApi.exportAll(), null, 2));

// Eerder geëxporteerde data terugzetten:
HopApi.importAll(JSON.parse(theJsonString));

// Alles wissen:
HopApi.clearAll();
```

## Naar een echte database

Wil je later delen tussen meerdere browsers/gebruikers? Vervang dan alleen
`js/api.js` door een implementatie die dezelfde methodes (`findOrCreateUser`,
`createSession`, `listSessions`, `postResponse`, `patchResponse`, `listScores`,
`upsertScore`, etc.) aanroept op een echte backend. Het datamodel in
`db/schema.sql` is daarvoor direct bruikbaar.

## Licentie

Intern gebruik House of Pilots.
