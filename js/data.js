// ============================================================
// HOUSE OF PILOTS — DATA
// Competentiecatalogus (PCP) + 360° feedback thema's
// ============================================================

// -------------------------------------------------------------
// Competentieprofiel (uit PCP document)
// -------------------------------------------------------------
window.COMPETENCE_CATEGORIES = [
  {
    id: 'core', number: '1', title: 'Kerncompetentie', accent: '#C8501E',
    competences: [{
      id: '1.1', title: 'Persoonlijke stabiliteit',
      description: 'De werknemer heeft een kalme, stabiele en zelfverzekerde persoonlijkheid. Neemt zonder aarzeling of twijfel en onder druk complexe beslissingen op basis van verschillende aspecten (veiligheid, efficiëntie, kosten, klanttevredenheid).',
      subcompetences: [
        { id: '1.1.a', title: 'Veerkracht', description: 'Het vermogen om tegenslagen te overwinnen. Heeft een nuchtere en optimistische persoonlijkheid.' },
        { id: '1.1.b', title: 'Stresstolerantie', description: 'Blijft adequaat omgaan met stressvolle situaties, door constant en effectief te blijven handelen.' },
        { id: '1.1.c', title: 'Controle over impulsen / afleiding', description: 'De wil en het vermogen om directe impulsen te onderdrukken, waardoor er tijd en ruimte ontstaat om tot een doordachte conclusie te komen.' },
      ],
    }],
  },
  {
    id: 'primary', number: '2', title: 'Primaire Competenties', accent: '#1E4A7A',
    competences: [
      {
        id: '2.1', title: 'Consciëntieus', subtitle: 'stipt, zorgvuldig, nauwgezet, gewetensvol, plichtsgetrouw',
        description: 'De bereidheid en volharding om nauwkeurig en betrouwbaar te zijn; gedreven om hoge resultaten te behalen door zorgvuldig en hard te werken.',
        subcompetences: [
          { id: '2.1.a', title: 'Ambitie', description: 'De innerlijke behoefte om goed te presteren en hoge resultaten te behalen, evenals een competitieve benadering.' },
          { id: '2.1.b', title: 'Nauwkeurigheid', description: 'De neiging om taken effectief te organiseren, te plannen en precies uit te voeren.' },
          { id: '2.1.c', title: 'Doorzettingsvermogen', description: 'De vastberadenheid en consistentie in de loop van de actie.' },
        ],
      },
      {
        id: '2.2', title: 'Leiderschap',
        description: 'De behoefte en het vermogen om initiatief te tonen, leiding te nemen en een regierol in een team te vervullen.',
        subcompetences: [
          { id: '2.2.a', title: 'Dominantie', description: 'De mate waarin er ambitie is om de leiding te nemen of een uitvoerende rol te vervullen.' },
          { id: '2.2.b', title: 'Overtuigingskracht', description: 'Vertrouwen in eigen kracht en kunnen, om anderen op overtuigende wijze te beïnvloeden.' },
          { id: '2.2.c', title: 'Assertiviteit', description: 'Het vermogen om grenzen te stellen en overtuigingen vast te houden bij weerstand.' },
        ],
      },
    ],
  },
  {
    id: 'personal', number: '3', title: 'Persoonlijke competenties', accent: '#C8501E',
    competences: [
      {
        id: '3.1', title: 'Evenwichtige leiderschapsstijl',
        description: 'De goede balans tussen nauwkeurigheid en empathie.',
        subcompetences: [
          { id: '3.1.a', title: 'Nauwkeurigheid', description: 'De mate van het effectief organiseren en plannen van taken.' },
          { id: '3.1.b', title: 'Empathie', description: 'Het vermogen om de gemoedstoestand en emoties van een ander aan te voelen.' },
        ],
      },
      {
        id: '3.2', title: 'Samenwerken',
        description: 'Een evenwichtig patroon tussen teamwork en autonomie.',
        subcompetences: [
          { id: '3.2.a', title: 'Teamwork', description: 'De bereidheid om als constructief lid van een groep te opereren.' },
          { id: '3.2.b', title: 'Autonomie', description: 'De voorkeurstijl om eigen beslissingen en plannen te maken.' },
        ],
      },
      {
        id: '3.3', title: 'Beslissingen nemen',
        description: 'Een evenwichtige combinatie van nauwkeurigheid en de behoefte aan afwisseling.',
        subcompetences: [
          { id: '3.3.a', title: 'Nauwkeurigheid', description: 'De mate van effectief organiseren en plannen van taken.' },
          { id: '3.3.b', title: 'Behoefte aan afwisseling', description: 'De mate van aanmoediging die iemand nodig heeft om gefocust en gemotiveerd te blijven.' },
        ],
      },
      {
        id: '3.4', title: 'Communicatie',
        description: 'Het evenwicht tussen assertiviteit en empathie.',
        subcompetences: [
          { id: '3.4.a', title: 'Assertiviteit', description: 'Het vermogen om grenzen te stellen en voor zichzelf op te komen.' },
          { id: '3.4.b', title: 'Empathie', description: 'Het vermogen om zich in de ander te verplaatsen.' },
        ],
      },
    ],
  },
  {
    id: 'relational', number: '4', title: 'Relationele competenties', accent: '#1E4A7A',
    competences: [
      {
        id: '4.1', title: 'Servicegerichtheid',
        description: 'Het vermogen om rekening te houden met de behoeften en wensen van andere mensen.',
        subcompetences: [
          { id: '4.1.a', title: 'Empathie', description: 'Het vermogen om zich in de ander te verplaatsen.' },
          { id: '4.1.b', title: 'Behulpzaamheid', description: 'De bereidheid om anderen te helpen wanneer dat nodig is.' },
        ],
      },
      {
        id: '4.2', title: 'Sociaal',
        description: 'Speelt in op de dynamiek en toont openheid naar verschillende mensen.',
        subcompetences: [
          { id: '4.2.a', title: 'Openheid', description: 'Een sociale extraverte manier van interactie en communicatie.' },
          { id: '4.2.b', title: 'Behoefte aan afwisseling', description: 'Blijft gefocust en gemotiveerd bij taken.' },
        ],
      },
    ],
  },
];

window.MAIN_SCALE = [
  { value: 1, label: '(bijna) niet aanwezig', color: '#B91C1C' },
  { value: 2, label: 'behoeft ondersteuning',   color: '#D97706' },
  { value: 3, label: 'zelfstandig inzetbaar',   color: '#15803D' },
];
window.SUB_SCALE = [
  { value: 1, label: '(bijna) nooit',    color: '#B91C1C' },
  { value: 2, label: 'soms',             color: '#DC2626' },
  { value: 3, label: 'regelmatig',       color: '#D97706' },
  { value: 4, label: 'vaak',             color: '#65A30D' },
  { value: 5, label: '(bijna) altijd',   color: '#15803D' },
];

// -------------------------------------------------------------
// 360° Feedback thema's (identiek aan originele 360 tool)
// -------------------------------------------------------------
window.FEEDBACK_THEMES = [
  { key: 'stabiliteit', label: 'Persoonlijke stabiliteit', shortLabel: 'Persoonlijke stabiliteit',
    def: 'De pilotencompetentie Persoonlijke Stabiliteit geeft de mate van een kalme, stabiele en zelfverzekerde persoonlijkheid aan. Piloten moeten zonder aarzeling of twijfel en onder druk complexe beslissingen kunnen nemen op basis van verschillende aspecten (bijv. veiligheid, efficiëntie, kosten, klanttevredenheid).',
    stmts: [
      'In hoeverre heb je Veerkracht? Hoe is je emotionele stabiliteit en het vermogen om tegenslagen te overwinnen?',
      'In hoeverre ben je Stresstolerant? Dit vraagt van jou om mentale stabiliteit, in het bijzonder het vermogen om adequaat om te gaan met stressvolle situaties om constant en effectief te blijven acteren.',
      'In hoeverre heb je controle over impulsen? Dit geeft de wil en het vermogen aan om je directe impulsen te onderdrukken, waardoor jij tijd en ruimte krijgt om na te denken en tot een goed doordachte, logische en weloverwogen conclusie te komen.',
    ],
    note: 'Geef een voorbeeld van een situatie waarbij persoonlijke stabiliteit werd getest.' },

  { key: 'conscientieus', label: 'Consciëntieus', shortLabel: 'Consciëntieus',
    def: 'Consciëntieus geeft de bereidheid en volharding aan om nauwkeurig en betrouwbaar te zijn in alle benodigde acties; gedreven door de noodzaak om hoge resultaten te behalen door zorgvuldig, goed georganiseerd, nauwkeurig en hard te werken.',
    stmts: [
      'In hoeverre ben jij Ambitieus? Dit is de innerlijke behoefte om goed te presteren en hoge resultaten te behalen, evenals een competitieve benadering.',
      'In hoeverre ben jij nauwkeurig? Dit persoonlijkheidskenmerk verwijst naar de neiging om taken effectief te organiseren en te plannen en om precies en nauwkeurig te werken.',
      'In hoeverre heb jij doorzettingsvermogen? Dit verwijst naar de aanwezigheid van vastberadenheid en consistentie in de loop van de actie.',
    ],
    note: 'Geef een voorbeeld van een moment waarop je je ambitie of nauwkeurigheid liet zien.' },

  { key: 'leiderschap', label: 'Leiderschap', shortLabel: 'Leiderschap',
    def: 'Bij de pilotencompetentie Leiderschap wordt er gekeken naar de behoefte en het vermogen om initiatief te tonen, leiding te nemen en een regierol in een team te vervullen.',
    stmts: [
      'In welke mate kan jij Dominant zijn? Hiermee wordt bedoeld de mate waarin jij de ambitie hebt om de leiding te nemen.',
      'In hoeverre heb jij Overtuigingskracht? Hiermee wordt bedoeld het geloof/vertrouwen in je eigen kracht en kwaliteit om anderen op overtuigende wijze te beïnvloeden.',
      'In hoeverre ben jij Assertief? Het vermogen om grenzen te stellen, overtuigingen vast te houden bij weerstand en voor jezelf op te komen.',
      'In welke mate heb jij een voorkeur voor een uitvoerende rol/functie? Hiermee wordt bedoeld of je een voorkeur hebt voor een uitvoerende functie i.p.v. een leidinggevende functie.',
    ],
    note: 'Beschrijf een moment waarop je de leiding nam of bewust koos voor een uitvoerende rol.' },

  { key: 'leidstijl', label: 'Evenwichtige Leiderschapsstijl', shortLabel: 'Evenwichtige Leiderschapsstijl',
    def: 'De pilotencompetentie Evenwichtige Leiderschapsstijl geeft de mate van evenwicht tussen nauwkeurigheid en empathie aan.',
    stmts: [
      'In welke mate ben jij Nauwkeurig? Kan je taken effectief organiseren en plannen en deze precies uitvoeren?',
      'In welke mate ben jij Empathisch? Je hebt het vermogen om de gemoedstoestand en emoties van een ander aan te voelen en te begrijpen door jezelf in hun positie te verplaatsen.',
    ],
    note: 'Geef een voorbeeld waarbij je zowel nauwkeurigheid als empathie moest inzetten.' },

  { key: 'samenwerken', label: 'Samenwerken', shortLabel: 'Samenwerken',
    def: 'Bij de pilotencompetentie Samenwerken wordt er gekeken naar het evenwicht tussen teamwork en autonomie/autonoom werken.',
    stmts: [
      'Jij hebt een voorkeur om als constructief lid bij een groep te horen.',
      'Jij kunt in een groep als constructief lid goed functioneren.',
      'Je werkt bij voorkeur autonoom. Je hebt de voorkeur om eigen beslissingen en plannen te maken en verantwoordelijk te worden gehouden voor eigen prestaties.',
    ],
    note: 'Beschrijf een situatie waarbij samenwerken of zelfstandig werken een sleutelrol speelde.' },

  { key: 'beslissing', label: 'Beslissing nemen', shortLabel: 'Beslissing nemen',
    def: 'De pilotencompetentie Beslissing nemen verwijst naar de combinatie van nauwkeurigheid en de behoefte aan afwisseling.',
    stmts: [
      'In welke mate ben jij Nauwkeurig? Je kunt taken effectief organiseren en plannen en deze precies uitvoeren.',
      'In hoeverre heb jij behoefte aan afwisseling? Je hebt geen aanmoediging nodig en bent toegewijd om gefocust en gemotiveerd bezig te blijven.',
    ],
    note: 'Geef een voorbeeld van een belangrijke beslissing die je onder druk moest nemen.' },

  { key: 'communicatie', label: 'Communicatie', shortLabel: 'Communicatie',
    def: 'De pilotencompetentie Communicatie verwijst naar het evenwicht tussen assertiviteit en empathie.',
    stmts: [
      'In hoeverre ben jij Assertief? Dit verwijst naar het vermogen om grenzen te stellen en voor jezelf op te komen.',
      'In welke mate ben jij Empathisch? Je hebt het vermogen om de gemoedstoestand en emoties van een ander aan te voelen.',
    ],
    note: 'Beschrijf hoe jij communiceert in een moeilijke of conflictueuze situatie.' },

  { key: 'service', label: 'Servicegerichtheid', shortLabel: 'Servicegerichtheid',
    def: 'De pilotencompetentie Servicegerichtheid geeft het vermogen weer waarin jij rekening kan houden met de behoeften en wensen van anderen.',
    stmts: [
      'In welke mate ben jij Empathisch? Je hebt het vermogen om de gemoedstoestand van een ander aan te voelen.',
      'In hoeverre ben jij behulpzaam? Je bent bereid anderen te helpen wanneer dat nodig is.',
    ],
    note: 'Geef een voorbeeld van een moment waarop je iemand hielp zonder dat dit gevraagd werd.' },

  { key: 'sociaal', label: 'Sociaal', shortLabel: 'Sociaal',
    def: 'Bij de pilotencompetentie Sociaal wordt er gekeken naar de dynamiek en openheid naar anderen in verschillende situaties.',
    stmts: [
      'Je bent een open persoonlijkheid. Binnen een groep vreemden voel jij jezelf prettig en ben jij bereid je te mixen met anderen.',
      'In hoeverre heb jij behoefte aan afwisseling? Je hebt geen aanmoediging nodig en bent toegewijd om gefocust en gemotiveerd bezig te blijven.',
    ],
    note: 'Beschrijf een situatie waarbij je spontaan contact maakte met nieuwe mensen.' },

  { key: 'doorzetting', label: 'Doorzettingsvermogen', shortLabel: 'Doorzettingsvermogen',
    def: 'Het programma waar je mee wilt starten vergt extra motivatie en doorzettingsvermogen.',
    stmts: [
      'Jij hebt de motivatie om de gehele 4 jaar tijdens het House of Pilots programma inclusief je pilotenopleiding bij EPST je maximaal in te blijven zetten.',
      'Jij hebt het doorzettingsvermogen om in de laatste ruim anderhalf jaar gemiddeld 55 uur per week (32 uur werken + 23 uur studie incl. les) te blijven presteren.',
    ],
    note: 'Beschrijf een situatie waarbij jouw doorzettingsvermogen echt op de proef werd gesteld.' },

  { key: 'flexibiliteit', label: 'Flexibiliteit', shortLabel: 'Flexibiliteit',
    def: 'Je past je aan aan een nieuwe situatie op het moment dat House of Pilots of de klantpartner dat van je verwacht.',
    stmts: [
      'Het programma kan anders verlopen dan we op voorhand bedacht hebben. Je blijft je inzetten voor je eigen verdienvermogen en verantwoordelijkheid.',
      'Op het moment dat de omstandigheden wijzigen kun jij je voegen naar deze omstandigheden, ook als ze niet de meest wenselijke zijn.',
    ],
    note: 'Geef een voorbeeld van een situatie waarbij omstandigheden wijzigden en hoe jij daarmee omging.' },
];

window.FB_SCALE_LABELS = ['(Bijna) nooit', 'Soms', 'Regelmatig', 'Vaak', '(Bijna) altijd'];
