# Data-schema — `/data/*.json`

Elk categoriebestand volgt deze structuur:

```jsonc
{
  "categoryId": "cognitief",           // slug, gebruikt in URLs en unlockedCategoryIds
  "categoryNumber": 1,
  "name": "Cognitieve Vaardigheid",
  "description": "Meet hoe scherp, snel en nauwkeurig iemands denkvermogen is...",
  "types": [
    {
      "typeId": "matrixredeneren",
      "name": "Matrixredeneren",
      "description": "Een 3x3 of 4x4 raster met figuren. Eén vakje ontbreekt...",
      "levels": [
        { "level": 1, "description": "Één eigenschap verandert — bijv. alleen kleur" },
        { "level": 2, "description": "Twee eigenschappen veranderen tegelijk — kleur + vorm" },
        { "level": 3, "description": "Drie eigenschappen + een afleidende regel die niet opgaat" }
      ],
      "refreshLogic": "Varieer het aantal elementen (1-6), vormen ... Nieuwe vragen genereer je door één eigenschap te vervangen terwijl de onderliggende regel gelijk blijft.",
      "questions": [
        {
          "id": "V1",
          "level": 1,
          "questionType": "multiple_choice",   // "multiple_choice" | "open" | "sequence" | "interactive"
          "question": "Rij 1: cirkel klein zwart / cirkel klein grijs / cirkel klein wit ...",
          "options": null,                      // array van strings bij multiple_choice, anders null
          "answer": "Driehoek groot wit",
          "explanation": "Patroon: vorm verandert per rij, grootte verandert per rij, kleur loopt van zwart naar grijs naar wit."
        }
      ]
    }
  ]
}
```

## Veldbetekenis

| Veld | Type | Uitleg |
|---|---|---|
| `categoryId` | string (slug) | Unieke sleutel, wordt gebruikt in `unlockedCategoryIds` van een kandidaat. |
| `types[].typeId` | string (slug) | Subtype binnen een categorie (bijv. "matrixredeneren", "verbaal-redeneren"). |
| `types[].levels` | array | Niveau-beschrijvingen (meestal 1–3), gebruikt om moeilijkheid te tonen/filteren. |
| `types[].refreshLogic` | string | Vrije tekst — instructie voor de vraaggenerator (laag 3, zie README §3). |
| `questions[].questionType` | enum | Bepaalt welk UI-component de vraag rendert. |
| `questions[].options` | string[] \| null | Alleen gevuld bij `multiple_choice`. De letter (A/B/C/D) staat vooraan in elke optie-string. |
| `questions[].answer` | string | Correcte antwoord (bij multiple_choice: "B) Operatiekamer" etc.). |
| `questions[].explanation` | string | Toelichting, getoond na beantwoording. |

## Afwijkingen per categorie

- **Categorie 2 (Coördinatie):** geen `questions`-array met vaste vragen —
  in plaats daarvan een `exercises`-array met interactieve
  parameter-configuratie (zie `data/2-coordinatie.json`).
- **Categorie 3, oefening 3 (Multitasking-simulatie):** ook
  parameter-configuratie i.p.v. losse vragen (zie `data/3-compass.json`,
  `typeId: "multitasking-simulatie"`).
- **Categorie 4 (SJT/CRM):** `questionType: "sjt"`, met een
  `options`-array waarbij elke optie een `points` (1–4) heeft in plaats van
  één correct antwoord. Zie `docs/scoring-sjt.md`.
- **Categorie 6 (Engels):** deels scenario-oefeningen zonder vaste
  multiple-choice vorm (clearance/readback-oefeningen). Deze staan als
  `questionType: "open"` of `"interactive"` met `question`, `context` en
  `answer` (het model-antwoord/de correcte readback).
