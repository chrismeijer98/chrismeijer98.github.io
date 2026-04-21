# House of Pilots — Career Portal

Een statische webapp (HTML/CSS/JS) voor het Pilot Career Plan (PCP) en 360°
feedback. Data wordt opgeslagen in **Supabase** (PostgreSQL) en de site wordt
gehost via **GitHub Pages** — geen eigen server nodig.

## Structuur

```
├─ index.html            Login (naam + wachtwoord)
├─ portal.html           Dashboard · PCP · 360° Feedback hub
├─ feedback.html         Publieke feedback-pagina (respondent met code)
├─ report.html           Rapport + PDF-print
├─ admin.html            Beheerportaal (gebruikers + wachtwoorden beheren)
├─ css/style.css         Shared stylesheet
├─ js/
│  ├─ config.js          Supabase URL + anon-sleutel
│  ├─ api.js             Supabase-gebaseerde backend (CRUD + auth)
│  ├─ data.js            Competenties + feedback thema's
│  ├─ utils.js           DOM-helpers, icons
│  ├─ portal.js          Portal logica (tabs, PCP, feedback hub)
│  ├─ feedback.js        Respondent flow (identity → filling → done)
│  └─ report.js          Rapportopbouw + radar chart
└─ db/
   └─ schema.sql         PostgreSQL schema voor Supabase
```

## Instellen (eenmalig)

### 1. Supabase database aanmaken

1. Maak een project aan op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor → New query**, plak de inhoud van [`db/schema.sql`](db/schema.sql) en voer het uit.
3. Kopieer je **Project URL** en **Publishable (anon) key** via **Project Settings → API**.

### 2. Verbinding instellen

Vul de gegevens in in [`js/config.js`](js/config.js):

```js
window.HOP_CONFIG = {
  SUPABASE_URL:      'https://jouw-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'jouw-anon-sleutel',
};
```

### 3. Eerste gebruiker aanmaken

1. Open `admin.html` (of de live GitHub Pages URL + `/admin.html`).
2. Log in met `admin` / `admin`.
3. Maak de eerste piloot- en coachaccounts aan via het beheerportaal.

## Gebruik

### Beheerder (`admin.html`)

- Inloggen: gebruikersnaam `admin`, wachtwoord `admin`.
- **Gebruikers aanmaken** — naam, rol (Piloot / Coach) en wachtwoord instellen.
- **Wachtwoord wijzigen** — klik op de sleutelknop naast een gebruiker.
- **Gebruiker verwijderen** — via de verwijderknop in de lijst.

### Piloot / Coach (`index.html` → `portal.html`)

1. Open `index.html`, vul naam en wachtwoord in (aangemaakt door beheerder).
2. In het portal zijn drie tabs:
   - **Dashboard** — voortgang competentieprofiel en feedbacksessies.
   - **PCP — Competenties** — scoor kern-, primaire, persoonlijke en relationele
     competenties. Auto-save. Coach en piloot scoren onafhankelijk; beide scores
     staan naast elkaar.
   - **360° Feedback** — maak een feedbacksessie aan met unieke code, deel die
     met feedbackgevers, bekijk wie heeft ingevuld, open het rapport.

### Feedbackgevers (`feedback.html`)

1. Ontvang een link of code van de piloot (bv. `ST-4F7K`).
2. Open `feedback.html?code=ST-4F7K` of voer de code in op `feedback.html`.
3. Vul naam + relatie in en doorloop de 11 feedback-thema's.
4. Na verzenden ziet de piloot direct in het portal dat de feedback is binnen.

### Rapport (`report.html`)

- Open via **"Rapport bekijken"** in de sessie-detailpagina (minimaal 1
  zelfreflectie + enkele feedbackgevers aanbevolen).
- Bevat: cover, overzicht, samenvattingsbalken, radar (situatieschets) en een
  pagina per thema.
- `Cmd/Ctrl + P` → opslaan als PDF.

## Datamodel

Vier tabellen in Supabase (PostgreSQL):

| Tabel                   | Kernvelden                                                                                          |
|-------------------------|-----------------------------------------------------------------------------------------------------|
| `users`                 | id · full_name · role (`pilot`/`coach`) · password_hash · created_at                               |
| `feedback_sessions`     | code (PK) · subject_name · subject_role · owner_id → users                                         |
| `feedback_responses`    | id · session_code → sessions · respondent_name · respondent_role · is_self · ratings (jsonb) · notes (jsonb) |
| `pcp_scores`            | id · user_id → users · scored_by · competence_id · value 1–5 · note                                |

Wachtwoorden worden opgeslagen als SHA-256 hash (via Web Crypto API, client-side).

## Beveiliging

- De Supabase **anon-sleutel** zit in de client-side code — dit is bedoeld voor
  publieke sleutels. Row Level Security (RLS) staat aan voor alle tabellen met
  open anon-policies, passend bij dit interne tool.
- Admin-login (`admin` / `admin`) is hardcoded in `admin.html`. Wijzig dit voor
  gebruik in productie.

## Licentie

Intern gebruik House of Pilots.
