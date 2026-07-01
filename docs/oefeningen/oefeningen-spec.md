# Oefeningen-platform — Technische Spec

Dit document beschrijft **Onderdeel 2: Oefeningen** — het individuele
opleidingsgedeelte van het platform voor kandidaten die zich voorbereiden op
pilotenselecties (COMPASS, DLR, PILAPT). Elke kandidaat oefent op eigen tempo,
bouwt scores op en ziet exact waar hij staat. De coach beheert welke
categorieën toegankelijk zijn via een lock/unlock-systeem.

De vraagdata per categorie staat gestructureerd in `/data/*.json` (zie
`docs/data-schema.md` voor het formaat). Dit bestand beschrijft de
functionaliteit die daarop gebouwd moet worden.

---

## 1. Toegangsbeheer: lock / unlock-systeem

De coach heeft volledige controle over welke oefeningen een kandidaat kan
zien en doen.

| Actie | Wat het betekent |
|---|---|
| Categorieën locken | Kandidaat ziet het blok wel, maar kan er niet in. Zichtbaar als gesloten met de tekst: "Wordt vrijgegeven door je coach." |
| Categorieën unlocken | Coach geeft een categorie vrij op het moment dat de kandidaat er klaar voor is, bijv. na consistente scores in de basisoefeningen. |
| Individueel toewijzen | Coach wijst specifieke kandidaten toe aan specifieke categorieën — bijv. "deze groep start met COMPASS-voorbereiding, de andere nog niet." |
| Coach-dashboard | Coach ziet per kandidaat: welke oefeningen gedaan, scores, trends, wie klaar lijkt voor unlock. |
| Kandidaatweergave | Kandidaat ziet alleen unlocked oefeningen plus locked blokken als motivatie voor wat er nog aankomt. |

**Datamodel-implicaties:**
- `candidate` heeft een set `unlockedCategoryIds` (en evt. `unlockedExerciseIds`
  voor fijnmazigere controle per oefening binnen een categorie).
- `coach` kan per kandidaat of per groep (`cohort`) categorieën toewijzen.
- UI-component `LockedCategoryCard` toont het slot-icoon + de tekst
  "Wordt vrijgegeven door je coach." wanneer een categorie niet in
  `unlockedCategoryIds` zit.

---

## 2. Hoe scores werken

- Elke test geeft een score op een vaste schaal (0–100, of tijd in
  milliseconden voor reactietaken).
- Scores worden opgeslagen met datum → kandidaat ziet een grafiek van zijn
  voortgang over tijd.
- Per categorie: percentage voltooid en gemiddelde score zichtbaar.
- Zwakke gebieden worden automatisch gemarkeerd — systeem stelt voor om die
  vaker te oefenen.
- Coach kan scoredashboard van elke kandidaat inzien.
- Dagelijkse uitdaging: één korte oefening per dag, telt mee voor een
  streak-teller.
- Persoonlijk record per oefening zichtbaar — motivatie om jezelf te
  verbeteren.

**Datamodel-implicaties:**
```
ScoreEntry {
  candidateId
  categoryId
  exerciseId
  score        // 0–100 of ms, afhankelijk van scaleType
  scaleType    // "percentage" | "milliseconds"
  date
}
```
- Afgeleide velden (server- of clientside berekend): `completionPercentage`
  per categorie, `averageScore` per categorie, `personalBest` per oefening,
  `weakAreas` (categorieën/types onder een drempelwaarde), `streakCount`.

---

## 3. Verversingslogica van vragen (3 lagen)

Statische vragen zijn binnen een week verbruikt. Het systeem werkt daarom met
drie lagen:

| Laag | Wat het inhoudt |
|---|---|
| 1 — Vraagtemplates | Per categorie zijn er vraagtemplates: patronen waaruit oneindig veel varianten gegenereerd worden. Bijv. niet één brandstofsom, maar het patroon: `[afstand] / [snelheid] = [tijd]` met steeds andere getallen. |
| 2 — Voorbeeldvragen | Per categorie een volledige set direct bruikbare vragen uitgewerkt, met antwoord en scoringsrichtlijn. Dit zijn de vragen in `/data/*.json`. |
| 3 — Verversingslogica | Per categorie beschreven hoe je nieuwe vragen genereert: welke variabelen je aanpast, welke moeilijkheidsgraden je doorloopt, welke scenario's je roteert. Dit staat als `refreshLogic`-veld bij elk vraagtype in de JSON. |

Praktisch: bouw per vraagtype een **generatorfunctie** die de
`refreshLogic`-tekst als bouwinstructie gebruikt (parameters, waardebereiken,
rotatie van scenario's) om on-the-fly nieuwe variaties te genereren, zodat de
voorbeeldvragen in de JSON dienen als startset + testcases voor die
generator.

---

## 4. Categorieën — overzicht

| # | Categorie | Databestand | Doel |
|---|---|---|---|
| 1 | Cognitieve Vaardigheid | `data/1-cognitieve-vaardigheid.json` | Matrixredeneren, verbaal redeneren, numeriek redeneren, werkgeheugen |
| 2 | Hand-Voet-Oog Coördinatie | `data/2-coordinatie.json` | Tracking- en reactietaken via de browser |
| 3 | COMPASS-voorbereiding | `data/3-compass.json` | Ruimtelijke oriëntatie, instrumentlezen, multitasking |
| 4 | Situational Judgement & CRM | `data/4-sjt-crm.json` | Gedragsscenario's, geen goed/fout maar een gedragsprofiel |
| 5 | Luchtvaartkennis | `data/5-luchtvaartkennis.json` | Meteorologie, navigatie, regelgeving, vliegtuigkennis |
| 6 | Engels & Communicatie | `data/6-engels-communicatie.json` | ATC-clearances, readback, ICAO-alfabet, noodcommunicatie |

Zie `docs/data-schema.md` voor de exacte JSON-structuur en
`docs/scoring-sjt.md` voor de afwijkende scoringslogica van categorie 4
(puntenschaal 1–4 i.p.v. goed/fout).

---

## 5. Suggestie technische opzet

- **Frontend:** component per oefeningtype (bijv. `MatrixReasoningExercise`,
  `TrackingExercise`, `MultipleChoiceExercise`, `SJTExercise`,
  `ATCListeningExercise`) die allemaal dezelfde `Question`-datastructuur
  consumeren.
- **Coördinatie-oefeningen (categorie 2)** zijn interactief/tijdgebonden en
  hebben geen statische JSON-vragen nodig — daar staat alleen de
  parameter-config (snelheid, tijdsduur, toetsen) in de JSON.
- **State/opslag:** `ScoreEntry`-records per kandidaat, plus
  `unlockedCategoryIds` per kandidaat/cohort (zie sectie 1).
- **Vraaggenerator:** los module per categorie die `refreshLogic` gebruikt om
  nieuwe vragen te genereren zodra de voorbeeldset "op" is.
