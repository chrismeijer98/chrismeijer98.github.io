// ============================================================
// HOUSE OF PILOTS — ONTWIKKELASSESSMENT (250-vragen persoonlijkheidsinstrument)
// Config-driven, net als de PCP-catalogus in js/data.js: schalen en
// competenties staan hier, niet hardcoded in de scoring-logica.
// Meetmomenten: 6 en 12 maanden na de programma-startdatum
// (die de coach per piloot instelt). Zie renderAssessment* in js/portal.js.
// ============================================================

window.ASSESSMENT_WAVES = [
  { id: 'm6', months: 6, label: '6 maanden' },
  { id: 'm12', months: 12, label: '12 maanden' },
];

window.ASSESSMENT_SCALE_CFG = { min_answer: 1, max_answer: 5, norm_min: 1, norm_max: 9 };

window.ASSESSMENT_SCALE_LABELS = ['Helemaal mee oneens', 'Mee oneens', 'Neutraal', 'Mee eens', 'Helemaal mee eens'];

window.ASSESSMENT_INSTRUCTIONS = 'Geef aan in hoeverre je het eens bent met elke stelling (1 = helemaal mee oneens, 5 = helemaal mee eens).';

// 'number' is 1-based en moet blijven corresponderen met de itemnummers hieronder in ASSESSMENT_SCALES.
window.ASSESSMENT_QUESTIONS = [
  { number: 126, text: 'Ik kan een groep goed meenemen in mijn redenering.' },
  { number: 67, text: 'Ik ben competitief ingesteld.' },
  { number: 182, text: 'Ik vind het niet mijn taak om anderen te helpen.' },
  { number: 9, text: 'Tegenslagen maken me eerder vastberadener dan somberder.' },
  { number: 193, text: 'Ik houd rekening met de gevoelens van anderen.' },
  { number: 178, text: 'Ik deel mijn kennis graag met anderen.' },
  { number: 4, text: 'Een teleurstelling gooit me niet snel uit balans.' },
  { number: 26, text: 'Spanning voor een belangrijk moment hindert mijn concentratie.' },
  { number: 143, text: 'Ik vind het moeilijk om nee te zeggen.' },
  { number: 3, text: 'Ik blijf optimistisch, ook als iets tegenzit.' },
  { number: 220, text: 'Ik maak makkelijk contact met mensen die ik niet ken.' },
  { number: 245, text: 'Ik voel me het prettigst wanneer alles hetzelfde blijft.' },
  { number: 38, text: 'Ik zeg weleens dingen die ik achteraf beter had kunnen inhouden.' },
  { number: 37, text: 'Ik neem de tijd om een beslissing goed te overwegen.' },
  { number: 168, text: 'Ik werk het liefst mijn eigen plan af, los van de groep.' },
  { number: 79, text: 'Ik lever mijn werk het liefst foutloos af.' },
  { number: 152, text: 'Ik vind het lastig om voor mezelf op te komen.' },
  { number: 192, text: 'Ik heb moeite om te begrijpen waarom iemand ergens verdrietig van wordt.' },
  { number: 57, text: 'Ik zoek actief naar uitdagingen om mezelf te bewijzen.' },
  { number: 72, text: 'Ik maak vaak kleine slordigheidsfoutjes.' },
  { number: 240, text: 'Ik functioneer het best bij een vaste, voorspelbare dagindeling.' },
  { number: 82, text: 'Ik mis weleens iets omdat ik niet goed heb opgelet.' },
  { number: 180, text: 'Ik sta klaar voor anderen, ook als het me tijd kost.' },
  { number: 230, text: 'Ik ga graag het gesprek aan met mensen die ik voor het eerst ontmoet.' },
  { number: 207, text: 'Ik regel mijn werk het liefst op mijn eigen manier.' },
  { number: 85, text: 'Ik werk liever snel dan helemaal precies.' },
  { number: 28, text: 'Ik kan onder druk nog steeds duidelijk communiceren.' },
  { number: 239, text: 'Ik raak mijn focus kwijt bij taken die zich herhalen.' },
  { number: 105, text: 'Ik neem het initiatief als er een beslissing genomen moet worden.' },
  { number: 170, text: 'Ik vind samenwerking een van de fijnste onderdelen van werken.' },
  { number: 43, text: 'Ik koop weleens iets impulsiefs waar ik later spijt van heb.' },
  { number: 87, text: 'Ik geef niet snel op.' },
  { number: 89, text: 'Bij tegenslag stop ik liever dan door te zetten.' },
  { number: 99, text: 'Ik laat me makkelijk afleiden van mijn plannen.' },
  { number: 242, text: 'Ik geniet van de rust van een vaste routine.' },
  { number: 46, text: 'Ik kan mezelf goed afremmen als ik ergens te enthousiast over ben.' },
  { number: 200, text: 'Ik voel goed aan wanneer iemand steun nodig heeft.' },
  { number: 21, text: 'Ik kan goed omgaan met meerdere deadlines tegelijk.' },
  { number: 218, text: 'Ik voel me afhankelijk van goedkeuring van anderen om door te gaan.' },
  { number: 90, text: 'Ik houd vol, ook als een taak lang duurt.' },
  { number: 45, text: 'Ik neem liever een moment pauze dan meteen te handelen.' },
  { number: 156, text: 'Ik houd rekening met de mening van anderen in een groep.' },
  { number: 183, text: 'Ik bied mijn hulp actief aan, zonder dat het gevraagd wordt.' },
  { number: 241, text: 'Ik verveel me snel als ik lang hetzelfde moet doen.' },
  { number: 78, text: 'Ik dubbelcheck belangrijke informatie voordat ik verder ga.' },
  { number: 55, text: 'Ik vind het belangrijk om te winnen in een competitieve situatie.' },
  { number: 84, text: 'Ik ben zorgvuldig in alles wat ik doe.' },
  { number: 111, text: 'Ik neem snel de regie in onduidelijke situaties.' },
  { number: 32, text: 'Bij onverwachte tegenslag verlies ik snel mijn concentratie.' },
  { number: 198, text: 'Ik vind het moeilijk om mee te voelen met iemand anders.' },
  { number: 175, text: 'Ik spring graag bij als iemand het druk heeft.' },
  { number: 195, text: 'Ik sta niet zo stil bij hoe een ander zich voelt.' },
  { number: 161, text: 'Ik deel graag de eer met mijn teamgenoten.' },
  { number: 166, text: 'Ik stem mijn werk graag af met anderen.' },
  { number: 189, text: 'Ik merk snel als iemand zich niet prettig voelt.' },
  { number: 59, text: 'Ik vind het niet belangrijk om beter te presteren dan anderen.' },
  { number: 188, text: 'Ik kan me makkelijk inleven in de situatie van een ander.' },
  { number: 148, text: 'Ik durf kritiek te geven wanneer dat nodig is.' },
  { number: 162, text: 'Ik vind samenwerken vaak inefficiënt.' },
  { number: 2, text: 'Na een mislukking kijk ik al snel weer vooruit.' },
  { number: 130, text: 'Ik heb weinig invloed op de mening van anderen.' },
  { number: 121, text: 'Ik heb vertrouwen in mijn vermogen om mensen mee te krijgen.' },
  { number: 205, text: 'Ik voel me verantwoordelijk voor mijn eigen prestaties.' },
  { number: 75, text: 'Ik neem snel genoegen met \'goed genoeg\'.' },
  { number: 141, text: 'Ik zwijg liever dan dat ik tegen iemand inga.' },
  { number: 20, text: 'Ik raak niet snel in paniek bij onverwachte problemen.' },
  { number: 243, text: 'Ik hou van variatie in mijn dagelijkse werkzaamheden.' },
  { number: 74, text: 'Ik let sterk op details.' },
  { number: 93, text: 'Ik geef sneller op dan de meeste mensen om me heen.' },
  { number: 179, text: 'Ik help pas als iemand er expliciet om vraagt.' },
  { number: 210, text: 'Ik bepaal graag zelf hoe ik een taak aanpak.' },
  { number: 187, text: 'Ik voel goed aan hoe iemand zich voelt.' },
  { number: 113, text: 'Ik geef makkelijk richting aan anderen.' },
  { number: 98, text: 'Ik blijf consistent werken aan mijn doelen.' },
  { number: 165, text: 'Ik voel me het prettigst als ik zelfstandig kan werken, los van een team.' },
  { number: 120, text: 'Ik kan anderen goed overtuigen van mijn standpunt.' },
  { number: 13, text: 'Ik blijf geloven in mezelf, ook na kritiek.' },
  { number: 112, text: 'Ik blijf liever op de achtergrond in een groep.' },
  { number: 140, text: 'Ik stel duidelijk grenzen aan wat ik wel en niet accepteer.' },
  { number: 54, text: 'Ik ben gedreven om steeds beter te worden.' },
  { number: 208, text: 'Ik heb weinig sturing van anderen nodig om te presteren.' },
  { number: 114, text: 'Ik zoek uit mezelf naar een positie waarin ik kan sturen.' },
  { number: 27, text: 'Ik houd mijn hoofd koel in crisissituaties.' },
  { number: 229, text: 'Ik trek me liever terug in een groep onbekenden.' },
  { number: 153, text: 'Ik geef eerlijk mijn mening, ook aan mensen met meer ervaring.' },
  { number: 42, text: 'Ik houd mezelf in bedwang, ook als ik het ergens niet mee eens ben.' },
  { number: 226, text: 'Nieuwe sociale situaties kosten me duidelijk moeite.' },
  { number: 47, text: 'Ik onderbreek anderen sneller dan ik zou willen.' },
  { number: 5, text: 'Ik zie tegenslagen als iets om van te leren.' },
  { number: 106, text: 'Ik laat liever iemand anders de leiding nemen.' },
  { number: 101, text: 'Ik werk net zo hard door richting het einde als in het begin.' },
  { number: 176, text: 'Ik vind het vanzelfsprekend om anderen te ondersteunen.' },
  { number: 249, text: 'Ik vind afwisseling in taken motiverend.' },
  { number: 144, text: 'Ik blijf bij mijn standpunt, ook onder druk.' },
  { number: 97, text: 'Ik ben vasthoudend in wat ik onderneem.' },
  { number: 233, text: 'Ik voel me comfortabel in wisselende sociale situaties.' },
  { number: 124, text: 'Ik durf mijn idee te verdedigen, ook bij weerstand.' },
  { number: 133, text: 'Ik win discussies vaker dan dat ik ze verlies.' },
  { number: 83, text: 'Ik vind het belangrijk dat alles klopt tot in het kleinste detail.' },
  { number: 204, text: 'Ik maak graag mijn eigen beslissingen en plannen.' },
  { number: 234, text: 'Ik zoek actief het contact op met nieuwe mensen.' },
  { number: 232, text: 'Ik heb tijd nodig voordat ik me op mijn gemak voel bij onbekenden.' },
  { number: 95, text: 'Ik zet door, ook wanneer het even niet lukt.' },
  { number: 244, text: 'Ik wissel graag van taak om het interessant te houden.' },
  { number: 247, text: 'Steeds hetzelfde werk doen kost me moeite om vol te houden.' },
  { number: 1, text: 'Ik herstel snel van tegenslagen.' },
  { number: 235, text: 'Ik heb behoefte aan afwisseling in mijn werkzaamheden.' },
  { number: 39, text: 'Ik laat me niet snel meeslepen door een opwelling.' },
  { number: 219, text: 'Ik voel me snel op mijn gemak in nieuwe groepen.' },
  { number: 129, text: 'Ik breng mijn argumenten overtuigend over.' },
  { number: 224, text: 'Ik vind het spannend om met onbekenden te praten.' },
  { number: 201, text: 'Emoties van anderen zeggen me weinig.' },
  { number: 142, text: 'Ik laat merken wanneer ik het ergens niet mee eens ben.' },
  { number: 56, text: 'Ik ben tevreden met een gemiddelde prestatie.' },
  { number: 196, text: 'Ik merk het snel als iemand iets dwarszit, ook zonder dat diegene het zegt.' },
  { number: 132, text: 'Ik vind het lastig om mijn standpunt kracht bij te zetten.' },
  { number: 107, text: 'Ik neem graag verantwoordelijkheid voor een team.' },
  { number: 91, text: 'Ik verlies mijn motivatie zodra iets lastig wordt.' },
  { number: 154, text: 'Ik werk graag samen met anderen aan een gezamenlijk doel.' },
  { number: 238, text: 'Ik zoek graag nieuwe uitdagingen op, ook als het huidige werk goed gaat.' },
  { number: 53, text: 'Ik stel mezelf hoge doelen.' },
  { number: 24, text: 'Ik voel me al snel overweldigd bij drukte.' },
  { number: 40, text: 'Ik kan goed wachten op het juiste moment om te handelen.' },
  { number: 52, text: 'Ik wil graag uitblinken in wat ik doe.' },
  { number: 122, text: 'Ik vind het moeilijk om anderen te overtuigen.' },
  { number: 69, text: 'Ik werk nauwkeurig, ook bij simpele taken.' },
  { number: 60, text: 'Ik wil graag een van de besten zijn in mijn vakgebied.' },
  { number: 236, text: 'Herhaling van dezelfde taken verveelt me snel.' },
  { number: 104, text: 'Ik voel me op mijn plek in een leidinggevende rol.' },
  { number: 212, text: 'Ik heb liever duidelijke aansturing van iemand anders.' },
  { number: 215, text: 'Ik laat beslissingen liever aan een ander over.' },
  { number: 70, text: 'Ik controleer mijn werk voordat ik het afrond.' },
  { number: 31, text: 'Ik blijf effectief functioneren, ook als het spannend wordt.' },
  { number: 96, text: 'Ik stop weleens halverwege een taak als het tegenzit.' },
  { number: 18, text: 'Ik blijf helder nadenken in stressvolle situaties.' },
  { number: 171, text: 'Ik help anderen spontaan als dat nodig is.' },
  { number: 62, text: 'Ik heb weinig behoefte om mezelf te bewijzen.' },
  { number: 30, text: 'Ik herstel snel van een stressvolle gebeurtenis.' },
  { number: 155, text: 'Ik functioneer goed als lid van een team.' },
  { number: 51, text: 'Ik blijf beheerst, ook wanneer ik het ergens niet mee eens ben.' },
  { number: 115, text: 'Ik wacht liever af tot iemand anders de leiding neemt.' },
  { number: 225, text: 'Ik mix me graag met mensen die ik nog niet ken.' },
  { number: 191, text: 'Ik luister aandachtig als iemand zijn verhaal doet.' },
  { number: 41, text: 'Ik reageer vaak direct, zonder de gevolgen te overzien.' },
  { number: 158, text: 'Ik vind het prettig om samen naar een resultaat toe te werken.' },
  { number: 116, text: 'Ik durf knopen door te hakken namens een groep.' },
  { number: 94, text: 'Ik blijf gefocust op mijn doel, ook over een langere periode.' },
  { number: 7, text: 'Ik blijf lang malen over dingen die misgingen.' },
  { number: 172, text: 'Ik bied uit mezelf hulp aan wanneer ik zie dat iemand het nodig heeft.' },
  { number: 16, text: 'Ik heb een nuchtere kijk op tegenvallers.' },
  { number: 44, text: 'Ik blijf rustig reageren, ook als iemand me irriteert.' },
  { number: 29, text: 'Een hectische werkdag put me sneller uit dan anderen.' },
  { number: 131, text: 'Ik kan goed onderhandelen om mijn zin te krijgen.' },
  { number: 86, text: 'Ik maak mijn taken altijd af, ook als het moeilijk wordt.' },
  { number: 68, text: 'Ik blijf mezelf uitdagen om te groeien.' },
  { number: 88, text: 'Ik blijf doorgaan, ook als iets tegenvalt.' },
  { number: 36, text: 'Ik onderdruk de neiging om meteen te reageren als ik geïrriteerd ben.' },
  { number: 181, text: 'Ik voel me betrokken bij de problemen van anderen.' },
  { number: 221, text: 'Ik voel me op mijn gemak in een groep vreemden.' },
  { number: 15, text: 'Ik kijk terug op moeilijke periodes als leerzaam, niet als zwaar.' },
  { number: 92, text: 'Ik maak een project altijd af, ook als het saai wordt.' },
  { number: 160, text: 'Ik heb weinig behoefte aan samenwerking met anderen.' },
  { number: 127, text: 'Ik geef snel toe als iemand tegen mijn idee ingaat.' },
  { number: 217, text: 'Ik functioneer het best wanneer ik zelfstandig kan opereren.' },
  { number: 167, text: 'Ik vind het belangrijk dat het hele team slaagt, niet alleen ikzelf.' },
  { number: 246, text: 'Ik zoek uit mezelf naar nieuwe ervaringen in mijn werk.' },
  { number: 135, text: 'Ik krijg mensen makkelijk mee in een nieuw idee.' },
  { number: 163, text: 'Ik draag actief bij aan het groepsresultaat.' },
  { number: 139, text: 'Ik geef mijn mening ook als die niet populair is.' },
  { number: 213, text: 'Ik neem zelf de verantwoordelijkheid voor mijn resultaten.' },
  { number: 237, text: 'Ik vind vaste routines juist prettig.' },
  { number: 128, text: 'Ik weet mensen te overtuigen, ook als ze eerst sceptisch zijn.' },
  { number: 164, text: 'Ik ben een betrouwbaar teamlid.' },
  { number: 150, text: 'Ik laat me niet makkelijk overtuigen als ik ergens van overtuigd ben.' },
  { number: 134, text: 'Ik straal vertrouwen uit als ik iets voorstel.' },
  { number: 214, text: 'Ik voel me het prettigst als ik zelf de regie heb over mijn werk.' },
  { number: 222, text: 'Ik voel me ongemakkelijk in onbekende sociale situaties.' },
  { number: 66, text: 'Een gemiddeld resultaat is voor mij prima genoeg.' },
  { number: 231, text: 'Ik vind het prettig om mezelf voor te stellen aan nieuwe mensen.' },
  { number: 102, text: 'Ik blijf volhouden, ook zonder direct resultaat.' },
  { number: 119, text: 'Ik pak de regie als een groep richting mist.' },
  { number: 19, text: 'Onder tijdsdruk presteer ik nog steeds goed.' },
  { number: 174, text: 'Ik richt me liever op mijn eigen taken dan op die van anderen.' },
  { number: 138, text: 'Ik kom op voor mezelf, ook bij weerstand.' },
  { number: 209, text: 'Ik voel me onzeker als ik zelf beslissingen moet nemen.' },
  { number: 137, text: 'Ik spreek me uit als ik het ergens niet mee eens ben.' },
  { number: 228, text: 'Ik voel me al snel thuis in een nieuwe groep.' },
  { number: 100, text: 'Ik maak lange, veeleisende trajecten altijd af.' },
  { number: 25, text: 'Ik blijf kalm wanneer er iets misgaat.' },
  { number: 118, text: 'Ik neem liever geen leidende rol op me.' },
  { number: 110, text: 'Ik voel me vanzelfsprekend degene die de koers bepaalt.' },
  { number: 65, text: 'Ik vind carrière maken belangrijk.' },
  { number: 76, text: 'Ik werk het liefst secuur, ook als het meer tijd kost.' },
  { number: 159, text: 'Ik pas mijn aanpak makkelijk aan op wat het team nodig heeft.' },
  { number: 190, text: 'Emoties van anderen laten me koud.' },
  { number: 177, text: 'Ik laat anderen het liefst hun eigen problemen oplossen.' },
  { number: 8, text: 'Ik heb vertrouwen dat het uiteindelijk goed komt.' },
  { number: 145, text: 'Ik zeg wat ik denk, ook als dat ongemakkelijk is.' },
  { number: 185, text: 'Ik ben er snel bij als iemand hulp nodig heeft.' },
  { number: 206, text: 'Ik vertrouw liever op de aansturing van anderen dan op mezelf.' },
  { number: 146, text: 'Ik pas me liever aan dan dat ik tegenspreek.' },
  { number: 81, text: 'Ik werk volgens een vaste, geordende aanpak.' },
  { number: 71, text: 'Ik plan mijn taken zorgvuldig.' },
  { number: 157, text: 'Ik werk liever alleen dan in een team.' },
  { number: 173, text: 'Ik neem de tijd om een collega verder te helpen.' },
  { number: 80, text: 'Ik werk nogal chaotisch.' },
  { number: 50, text: 'Ik kan een verleiding goed weerstaan.' },
  { number: 184, text: 'Ik ondersteun collega\'s graag bij hun werk.' },
  { number: 49, text: 'Ik handel eerst en denk daarna pas na.' },
  { number: 117, text: 'Ik vind het vanzelfsprekend om verantwoordelijkheid te dragen voor anderen.' },
  { number: 169, text: 'Ik sta open voor de inbreng van teamgenoten.' },
  { number: 73, text: 'Ik houd mijn werk overzichtelijk en goed georganiseerd.' },
  { number: 202, text: 'Ik neem de tijd om te begrijpen wat een ander beweegt.' },
  { number: 103, text: 'Ik neem graag de leiding in een groep.' },
  { number: 151, text: 'Ik spreek mensen aan op gedrag dat me niet bevalt.' },
  { number: 125, text: 'Ik twijfel aan mezelf zodra iemand het niet met me eens is.' },
  { number: 12, text: 'Ik pak snel de draad weer op na een probleem.' },
  { number: 63, text: 'Ik voel me pas voldaan bij een topprestatie.' },
  { number: 109, text: 'Ik heb liever een uitvoerende rol dan een leidende.' },
  { number: 64, text: 'Ik zet net dat stapje extra om te slagen.' },
  { number: 203, text: 'Ik werk het liefst zelfstandig.' },
  { number: 149, text: 'Ik houd mijn mening liever voor me om conflict te vermijden.' },
  { number: 136, text: 'Anderen volgen mijn advies vaak op.' },
  { number: 22, text: 'Stress zorgt ervoor dat ik juist scherper ga werken.' },
  { number: 223, text: 'Ik leg makkelijk nieuwe contacten.' },
  { number: 17, text: 'Ik herpak me snel wanneer een plan mislukt.' },
  { number: 216, text: 'Ik kies liever mijn eigen aanpak dan een voorgeschreven aanpak te volgen.' },
  { number: 48, text: 'Ik overzie de gevolgen voordat ik iets zeg of doe.' },
  { number: 58, text: 'Succes van anderen motiveert mij om harder te werken.' },
  { number: 11, text: 'Een slechte dag beïnvloedt meteen mijn hele week.' },
  { number: 34, text: 'Ik blijf mijn taken nauwkeurig uitvoeren, zelfs onder grote druk.' },
  { number: 227, text: 'Ik sta open voor nieuwe mensen en ontmoetingen.' },
  { number: 123, text: 'Mensen laten zich makkelijk door mij overtuigen.' },
  { number: 194, text: 'Ik pas mijn toon aan op wat iemand op dat moment nodig heeft.' },
  { number: 10, text: 'Ik laat me niet snel ontmoedigen.' },
  { number: 147, text: 'Ik kom duidelijk voor mijn mening uit.' },
  { number: 197, text: 'Ik kan me goed verplaatsen in het perspectief van een ander.' },
  { number: 77, text: 'Kleine details vind ik niet belangrijk.' },
  { number: 186, text: 'Ik neem graag een taak van een ander over als dat nodig is.' },
  { number: 14, text: 'Bij een nederlaag verlies ik al snel mijn motivatie.' },
  { number: 35, text: 'Ik denk na voordat ik reageer.' },
  { number: 61, text: 'Ik werk hard om mijn doelen te bereiken.' },
  { number: 23, text: 'Bij veel druk maak ik sneller fouten.' },
  { number: 250, text: 'Ik verkies een gevarieerde werkdag boven een voorspelbare.' },
  { number: 199, text: 'Ik toon begrip, ook als ik het zelf anders zou aanpakken.' },
  { number: 211, text: 'Ik werk het liefst zonder dat iemand over mijn schouder meekijkt.' },
  { number: 248, text: 'Ik heb liever weinig verandering in mijn werk.' },
  { number: 33, text: 'Ik kan goed relativeren wanneer het spannend wordt.' },
  { number: 108, text: 'Ik vind het prettig om anderen aan te sturen.' },
  { number: 6, text: 'Ik kan me moeilijk weer oprichten na een grote fout.' },
];

// Elke schaal = 1 persoonlijkheidstrek. 'items' zijn vraagnummers (1-based).
// 'reverse_items' zijn vraagnummers binnen deze schaal die omgekeerd gescoord worden.
window.ASSESSMENT_SCALES = {
  veerkracht: { label: 'Veerkracht', items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], reverse_items: [6, 7, 11, 14] },
  stressbestendigheid: { label: 'Stressbestendigheid', items: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34], reverse_items: [23, 24, 26, 29, 32] },
  impulsbeheersing: { label: 'Impulsbeheersing', items: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51], reverse_items: [38, 41, 43, 47, 49] },
  ambitie: { label: 'Ambitie', items: [52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68], reverse_items: [56, 59, 62, 66] },
  nauwkeurigheid: { label: 'Nauwkeurigheid', items: [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85], reverse_items: [72, 75, 77, 80, 82, 85] },
  doorzettingsvermogen: { label: 'Doorzettingsvermogen', items: [86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102], reverse_items: [89, 91, 93, 96, 99] },
  dominantie: { label: 'Dominantie', items: [103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119], reverse_items: [106, 109, 112, 115, 118] },
  overtuigingskracht: { label: 'Overtuigingskracht', items: [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136], reverse_items: [122, 125, 127, 130, 132] },
  assertiviteit: { label: 'Assertiviteit', items: [137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153], reverse_items: [141, 143, 146, 149, 152] },
  teamgerichtheid: { label: 'Teamgerichtheid', items: [154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170], reverse_items: [157, 160, 162, 165, 168] },
  hulpvaardigheid: { label: 'Hulpvaardigheid', items: [171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186], reverse_items: [174, 177, 179, 182] },
  empathie: { label: 'Empathie', items: [187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202], reverse_items: [190, 192, 195, 198, 201] },
  autonomie: { label: 'Autonomie', items: [203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218], reverse_items: [206, 209, 212, 215, 218] },
  openheid: { label: 'Openheid', items: [219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234], reverse_items: [222, 224, 226, 229, 232] },
  behoefte_aan_afwisseling: { label: 'Behoefte aan afwisseling', items: [235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250], reverse_items: [237, 240, 242, 245, 248] },
};

// Elke competentie combineert 1+ schalen. mean = gemiddelde (1-9 score).
// balance = verschil tussen twee schalen -> categorie op basis van threshold.
window.ASSESSMENT_COMPETENCIES = {
  mean: {
    persoonlijke_stabiliteit: { label: 'Persoonlijke stabiliteit', scales: ['veerkracht', 'stressbestendigheid', 'impulsbeheersing'] },
    consciëntieusheid:        { label: 'Consciëntieusheid',        scales: ['nauwkeurigheid', 'doorzettingsvermogen', 'ambitie'] },
    leiderschap:              { label: 'Leiderschap',               scales: ['dominantie', 'assertiviteit', 'overtuigingskracht'] },
    dienstverlening:          { label: 'Dienstverlening',           scales: ['empathie', 'hulpvaardigheid'] },
    sociabiliteit:            { label: 'Sociabiliteit',             scales: ['openheid', 'behoefte_aan_afwisseling'] },
  },
  balance: {
    team_orientatie: {
      label: 'Team-oriëntatie', scale_a: 'teamgerichtheid', scale_b: 'autonomie', threshold: 1.0,
      low_label: 'neiging tot te onafhankelijk opereren', mid_label: 'in balans', high_label: 'neiging tot te afhankelijk opereren',
    },
    communicatie: {
      label: 'Communicatie', scale_a: 'assertiviteit', scale_b: 'empathie', threshold: 1.0,
      low_label: 'neiging tot terughoudendheid', mid_label: 'in balans', high_label: 'neiging tot te directief/ongevoelig',
    },
  },
  level_thresholds: { laag_tot: 3, gemiddeld_tot: 6 },
};

// -------------------------------------------------------------
// Scoring + rapport (poort van scoring.py / report.py)
// -------------------------------------------------------------
(function () {
  function reverseScore(value, min, max) { return min + max - value; }

  function normalize(rawMean, minA, maxA, normMin, normMax) {
    return ((rawMean - minA) / (maxA - minA)) * (normMax - normMin) + normMin;
  }

  function scoreScale(answers, items, reverseItems, minA, maxA) {
    const values = items.map((num) => {
      const raw = Number(answers[num - 1]);
      return reverseItems.includes(num) ? reverseScore(raw, minA, maxA) : raw;
    });
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  function calculateScores(answers) {
    const { min_answer, max_answer, norm_min, norm_max } = window.ASSESSMENT_SCALE_CFG;
    const results = {};
    Object.entries(window.ASSESSMENT_SCALES).forEach(([key, def]) => {
      const rawMean = scoreScale(answers, def.items, def.reverse_items || [], min_answer, max_answer);
      results[key] = Math.round(normalize(rawMean, min_answer, max_answer, norm_min, norm_max) * 100) / 100;
    });
    return results;
  }

  function level(score, thresholds) {
    if (score < thresholds.laag_tot) return 'laag';
    if (score < thresholds.gemiddeld_tot) return 'gemiddeld';
    return 'hoog';
  }

  function balanceLabel(diff, threshold, low, mid, high) {
    if (diff < -threshold) return low;
    if (diff > threshold) return high;
    return mid;
  }

  function generateReport(scores) {
    const cfg = window.ASSESSMENT_COMPETENCIES;
    const competencies = {};
    Object.entries(cfg.mean).forEach(([key, def]) => {
      const vals = def.scales.map((s) => scores[s]);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      competencies[key] = { label: def.label, score: Math.round(avg * 100) / 100, level: level(avg, cfg.level_thresholds) };
    });

    const balances = {};
    Object.entries(cfg.balance).forEach(([key, def]) => {
      const diff = scores[def.scale_a] - scores[def.scale_b];
      balances[key] = {
        label: def.label,
        difference: Math.round(diff * 100) / 100,
        outcome: balanceLabel(diff, def.threshold, def.low_label, def.mid_label, def.high_label),
      };
    });

    return { scales: scores, competencies, balances };
  }

  function validateAnswers(answers) {
    if (!Array.isArray(answers) || answers.length !== window.ASSESSMENT_QUESTIONS.length) return false;
    const { min_answer, max_answer } = window.ASSESSMENT_SCALE_CFG;
    return answers.every((v) => Number.isFinite(v) && v >= min_answer && v <= max_answer);
  }

  window.HopAssessment = { calculateScores, generateReport, validateAnswers };
})();
