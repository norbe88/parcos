// 📘 Ghid Auto ParcOS — Baza de date oficială proceduri auto România 2026
// Generat și verificat conform standardelor de calitate ParcOS

export interface GhidCategory {
  slug: string;
  name: string;
  icon: string;
  accentColor: string;
  description: string;
  articlesCount?: number;
}

export interface GhidStep {
  num: number;
  title: string;
  description: string;
}

export interface GhidCost {
  item: string;
  note?: string;
  value: string;
}

export interface GhidFaq {
  question: string;
  answer: string;
}

export interface GhidOfficialLink {
  label: string;
  url: string;
}

export interface GhidArticle {
  slug: string;
  url: string;
  title: string;
  category: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  metaDescription: string;
  updateDate: string;
  readTime: string;
  quickAnswer: string;
  docs: string[];
  steps: GhidStep[];
  costs: GhidCost[];
  proseHtml: string;
  faq: GhidFaq[];
  officialLinks: GhidOfficialLink[];
}

export const GHID_CATEGORIES: GhidCategory[] = [
  {
    "slug": "inmatriculare-transcriere",
    "name": "Înmatriculare & Transcriere",
    "icon": "🚗",
    "accentColor": "#2563eb",
    "description": "Înmatriculare, transcriere, schimbare proprietar, radiere și numere de înmatriculare.",
    "articlesCount": 21
  },
  {
    "slug": "asigurari-rca-casco",
    "name": "Asigurări RCA & CASCO",
    "icon": "🛡️",
    "accentColor": "#0891b2",
    "description": "Polițe RCA și CASCO, despăgubiri, constatare amiabilă și transfer bonus-malus.",
    "articlesCount": 17
  },
  {
    "slug": "permis-de-conducere",
    "name": "Permis de conducere",
    "icon": "🪪",
    "accentColor": "#7c3aed",
    "description": "Obținere, preschimbare, duplicat, suspendare și școli de șoferi.",
    "articlesCount": 13
  },
  {
    "slug": "itp-rar",
    "name": "ITP & RAR",
    "icon": "🔧",
    "accentColor": "#ea580c",
    "description": "Inspecția tehnică periodică, omologări RAR și modificări în acte.",
    "articlesCount": 7
  },
  {
    "slug": "rovinieta",
    "name": "Rovinietă",
    "icon": "🎫",
    "accentColor": "#16a34a",
    "description": "Prețuri, valabilitate, verificare online și amenzi rovinietă.",
    "articlesCount": 7
  },
  {
    "slug": "transport-autorizatii",
    "name": "Transport & Autorizații",
    "icon": "🚕",
    "accentColor": "#dc2626",
    "description": "Taxi, ridesharing (Uber, Bolt), licențe și atestate transport.",
    "articlesCount": 6
  },
  {
    "slug": "impozite-taxe-auto",
    "name": "Impozite & Taxe auto",
    "icon": "💰",
    "accentColor": "#ca8a04",
    "description": "Impozit auto la primărie, fiscalizare, scutiri și Programul Rabla.",
    "articlesCount": 5
  }
];

export const GHID_ARTICLES: GhidArticle[] = [
  {
    "slug": "scoatere-fiscal-masina-auto",
    "url": "/ghid-auto/scoatere-fiscal-masina-auto/",
    "title": "Scoatere fiscal mașină / auto – acte necesare și procedură",
    "category": {
      "slug": "impozite-taxe-auto",
      "name": "Impozite & Taxe auto",
      "color": "#ca8a04",
      "icon": "💰"
    },
    "metaDescription": "Scoatere fiscal mașină în 2026: cum radiezi autoturismul din evidența primăriei după vânzare, ce acte îți trebuie (ITL-016) și în cât timp o faci.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Scoaterea din fiscal (radierea fiscală) înseamnă eliminarea mașinii din evidența Direcției de Impozite și Taxe Locale, după înstrăinare, casare sau export. Se face la primăria de domiciliu, în termen de 30 de zile de la data actului de înstrăinare (la casare sau export, de la data radierii din circulație), prin depunerea declarației ITL-016 și a actului de înstrăinare. La vânzare îți trebuie și certificatele de atestare fiscală (al tău și al cumpărătorului), gratuite din 25.02.2026. Procedura este, de regulă, gratuită și oprește obligația de plată a impozitului.",
    "docs": [
      "Declarația tip de scoatere din evidență a mijlocului de transport (model ITL-016)",
      "Actul de înstrăinare (contract de vânzare-cumpărare, certificat de distrugere, certificat de moștenitor sau hotărâre judecătorească definitivă, după caz). Numărul de exemplare cerut variază de la o primărie la alta: unele DITL cer originalul + o copie, altele cer mai multe exemplare (de ex. DITL Sector 5 București cere actul de înstrăinare în 5 exemplare). Verifică cerința concretă a DITL-ului de care aparții.",
      "Certificatul de înmatriculare (talonul), cu mențiunea „Înstrăinat către...” completată",
      "Cartea de identitate a vehiculului (CIV), în copie, dacă e cazul",
      "Actul de identitate al fostului proprietar, în copie; certificatul de atestare fiscală fără datorii al cumpărătorului, emis de primăria de domiciliu a acestuia (sau verificarea electronică a situației lui fiscale), obligatoriu din 25.02.2026",
      "Certificatul de distrugere / adeverința de la REMAT sau dezmembrări, la casare",
      "Împuternicire, dacă radierea este depusă de o altă persoană"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Completează mențiunea pe talon",
        "description": "La vânzare, înscrie pe certificatul de înmatriculare (talon) mențiunea „Înstrăinat către...”, cu numele cumpărătorului și data. Este obligația legală a vânzătorului și protejează ambele părți."
      },
      {
        "num": 2,
        "title": "Pregătește actul de înstrăinare",
        "description": "Ai nevoie de contractul de vânzare-cumpărare, factura sau actul de donație. La casare, îți trebuie certificatul de distrugere emis de un operator autorizat (REMAT / dezmembrări)."
      },
      {
        "num": 3,
        "title": "Completează declarația ITL-016",
        "description": "Ridică de la ghișeu sau descarcă formularul de scoatere din evidență și completează datele mașinii și ale noului deținător sau motivul radierii (casare, export)."
      },
      {
        "num": 4,
        "title": "Depune dosarul în 30 de zile",
        "description": "Depune declarația și actul de înstrăinare la Direcția de Impozite și Taxe Locale a primăriei tale, în termen de 30 de zile de la data înstrăinării. Multe primării acceptă și depunerea online."
      },
      {
        "num": 5,
        "title": "Verifică oprirea impozitului",
        "description": "Cere confirmarea că mașina a fost scoasă din evidență. Impozitul încetează, de regulă, de la 1 ianuarie a anului următor înstrăinării."
      }
    ],
    "costs": [
      {
        "item": "Scoaterea din evidența fiscală",
        "note": "de regulă nu există taxă de stat; unele primării pot percepe taxe administrative mici",
        "value": "Gratuit"
      },
      {
        "item": "Certificat de atestare fiscală al vânzătorului și al cumpărătorului (obligatorii)",
        "note": "variază pe primării; verifică valoarea locală",
        "value": "Gratuit"
      },
      {
        "item": "Certificat de distrugere la casare",
        "note": "eliberat de operatorul REMAT / dezmembrări autorizat",
        "value": "de regulă gratuit"
      }
    ],
    "proseHtml": "<h2>Ce este scoaterea din fiscal și de ce contează</h2><p>Scoaterea din fiscal, numită și radiere fiscală, presupune eliminarea mașinii din evidența Direcției de Impozite și Taxe Locale (DITL) a primăriei tale, după ce ai înstrăinat-o, ai casat-o sau ai exportat-o. Este un pas esențial: dacă nu o faci, mașina rămâne pe numele tău în evidența fiscală și continui să datorezi impozit pentru un vehicul pe care nu îl mai deții. Mulți proprietari descoperă abia după ani că au acumulat impozite și majorări pentru o mașină vândută demult.</p><h2>Termenul legal de 30 de zile</h2><p>Radierea fiscală se depune în termen de <strong>30 de zile</strong> de la data <a href=\"https://ditl5.ro/persoane-fizice/\" target=\"_blank\" rel=\"noopener\">actului de înstrăinare</a>. Recomandarea de aur este să nu predai mașina din curte înainte de a viza contractul la fisc și de a-ți face demersul de scoatere din evidență. Depășirea termenului este contravenție, iar întârzierea îți lasă mașina pe rol până când depui documentele.</p><h2>Radiere fiscală vs. radiere din circulație</h2><p>Sunt două proceduri diferite, care nu se înlocuiesc reciproc:</p><ul><li><strong>Radierea fiscală</strong> se face la primărie (DITL) și oprește impozitul local.</li><li><strong>Radierea din circulație</strong> se face la DGPCI și scoate mașina din registrul de înmatriculare (obligatorie la casare, export sau scoatere definitivă din uz).</li></ul><p>La o vânzare obișnuită între persoane fizice, vânzătorul face radierea fiscală, iar cumpărătorul transcrie mașina pe numele lui; radierea din circulație intervine mai ales la casare sau export.</p><h2>Când se oprește efectiv impozitul</h2><p>Chiar dacă vinzi mașina în cursul anului, regula generală este că proprietarul care figura la 1 ianuarie datorează impozitul pentru tot anul respectiv, iar legea îți cere să-l achiți integral înainte de vânzare (altfel nu obții certificatul de atestare fiscală). Excepție: dacă ai cumpărat, înmatriculat și vândut mașina în același an, datorezi impozit pentru acel an, cu termen de plată la data vânzării. Obligația ta încetează, de regulă, de la <strong>1 ianuarie a anului următor</strong> înstrăinării, cu condiția să fi depus la timp declarația de scoatere din evidență. De aceea, chiar dacă ai vândut în februarie, este important să depui radierea imediat, ca să nu rămâi în evidență și în anul următor.</p><p>Sfat: păstrează dovada depunerii (numărul de înregistrare) și confirmarea scoaterii din evidență, pentru orice eventuală neconcordanță ulterioară.</p>",
    "faq": [
      {
        "question": "Am vândut mașina, dar am uitat să o scot din fiscal. Ce fac?",
        "answer": "Depune cât mai repede declarația de scoatere din evidență, împreună cu contractul de vânzare-cumpărare. Radierea se poate opera pe baza datei reale a înstrăinării din contract, iar impozitul calculat greșit după acea dată poate fi corectat de primărie."
      },
      {
        "question": "Scoaterea din fiscal este gratuită?",
        "answer": "De regulă da, nu există o taxă de stat pentru radierea fiscală. La vânzare, legea cere certificatul de atestare fiscală al vânzătorului (cu toate datoriile achitate, inclusiv impozitul pe anul vânzării) și pe cel al cumpărătorului; ambele se eliberează gratuit din 25.02.2026 și pot fi înlocuite de verificarea electronică a situației fiscale."
      },
      {
        "question": "Trebuie să fac și radierea din circulație la DGPCI?",
        "answer": "Nu întotdeauna. La o vânzare obișnuită, cumpărătorul transcrie mașina, iar tu doar o scoți din fiscal. Radierea din circulație la DGPCI este obligatorie la casare, export sau scoatere definitivă din uz."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/171282",
        "label": "Legea nr. 227/2015 privind Codul fiscal (art. 471 – impozitul pe mijloacele de transport) – legislatie.just.ro ↗"
      },
      {
        "url": "http://www.dpfbl.mdrap.ro/tipizate_itl.html",
        "label": "Formulare tipizate ITL (inclusiv ITL-016 – declarație de scoatere din evidență) – Ministerul Dezvoltării ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata și verificarea taxelor locale online ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – radiere din circulație a vehiculelor ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=85",
        "label": "Radierea unui vehicul din circulație – HUB Servicii MAI (DGPCI) ↗"
      },
      {
        "url": "https://ditl5.ro/persoane-fizice/",
        "label": "Acte necesare scoatere din evidență mijloace de transport (persoane fizice) — DITL Sector 5 ↗"
      }
    ]
  },
  {
    "slug": "introducere-fiscal-masina-auto",
    "url": "/ghid-auto/introducere-fiscal-masina-auto/",
    "title": "Introducere fiscal mașină / auto – acte necesare și procedură",
    "category": {
      "slug": "impozite-taxe-auto",
      "name": "Impozite & Taxe auto",
      "color": "#ca8a04",
      "icon": "💰"
    },
    "metaDescription": "Introducere fiscal mașină în 2026: cum iei autoturismul în evidența primăriei pe numele tău, ce acte îți trebuie și în cât timp trebuie să declari.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Introducerea în fiscal înseamnă luarea autoturismului în evidența Direcției de Impozite și Taxe Locale, pe numele noului proprietar. Se face la primăria de domiciliu, în termen de 30 de zile de la data contractului de vânzare-cumpărare, prin depunerea declarației de impunere ITL-005 și a actelor de proprietate. Este o procedură gratuită, dar obligatorie, care condiționează și înmatricularea mașinii pe numele tău.",
    "docs": [
      "Declarația fiscală de impunere (model ITL-005)",
      "Contractul de vânzare-cumpărare, în original și copii (de regulă în 3 exemplare)",
      "Certificatul de atestare fiscală al vânzătorului, care atestă că are taxele plătite la zi, și certificatul tău de atestare fiscală (fără datorii la primăria de domiciliu) – ambele obligatorii din 25.02.2026, gratuite; pot fi înlocuite de verificarea electronică a situației fiscale",
      "Cartea de identitate a vehiculului (CIV), în copie",
      "Certificatul de înmatriculare (talonul), cu mențiunea de înstrăinare făcută de vânzător",
      "Actul de identitate al cumpărătorului, în copie",
      "Împuternicire, dacă introducerea în fiscal este făcută de altcineva"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Cere vânzătorului certificatul de atestare fiscală",
        "description": "Înainte de a semna, vânzătorul trebuie să scoată de la primăria lui certificatul de atestare fiscală, care dovedește că nu are impozite restante pe mașină. Fără acest document nu poți lua mașina în evidență."
      },
      {
        "num": 2,
        "title": "Semnați și înregistrați contractul",
        "description": "Încheiați contractul de vânzare-cumpărare în mai multe exemplare. Un exemplar se vizează/înregistrează la fiscul vânzătorului, iar tu păstrezi un exemplar pentru introducerea în evidența ta."
      },
      {
        "num": 3,
        "title": "Completează declarația ITL-005",
        "description": "La primăria ta de domiciliu completează declarația de impunere pentru stabilirea impozitului pe mijloacele de transport, cu datele autoturismului: capacitate cilindrică, norma Euro, an fabricație."
      },
      {
        "num": 4,
        "title": "Depune dosarul în 30 de zile",
        "description": "Depune declarația și copiile actelor la Direcția de Impozite și Taxe Locale a primăriei de domiciliu, în termen de 30 de zile de la data dobândirii."
      },
      {
        "num": 5,
        "title": "Ridică decizia de impunere",
        "description": "Primești decizia de impunere pe numele tău. Cu contractul înregistrat la fiscul tău faci apoi transcrierea dreptului de proprietate la DGPCI, obligatorie în cel mult 90 de zile de la cumpărare, indiferent dacă păstrezi sau schimbi numerele."
      }
    ],
    "costs": [
      {
        "item": "Introducerea în evidența fiscală",
        "note": "nu se percepe taxă pentru luarea în evidență",
        "value": "Gratuit"
      },
      {
        "item": "Certificat de atestare fiscală (obținut de vânzător)",
        "note": "gratuit prin lege din 25.02.2026 (OUG 7/2026); necesar atât vânzătorului, cât și cumpărătorului",
        "value": "Gratuit"
      },
      {
        "item": "Impozit anual autoturism",
        "note": "datorat de la 1 ianuarie anul următor; calculat pe grupe de 200 cmc și norma Euro",
        "value": "variabil"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă introducerea în fiscal</h2><p>A introduce mașina în fiscal înseamnă a o lua în evidența Direcției de Impozite și Taxe Locale (DITL) a primăriei tale, pe numele tău, ca proprietar. Este pasul prin care autoritatea locală știe că tu ești noul deținător și îți stabilește impozitul pe mijloacele de transport. Procedura nu se confundă cu înmatricularea la DGPCI: introducerea în fiscal privește evidența fiscală locală, în timp ce înmatricularea privește circulația și numerele de înmatriculare.</p><h2>Legătura cu vânzătorul: certificatul de atestare fiscală</h2><p>Cheia procedurii este certificatul de atestare fiscală al vânzătorului. Acesta dovedește că mașina nu are impozite restante și că vânzătorul și-a plătit dările la zi. Fără el, nici tu nu poți lua legal mașina în evidență, nici vânzătorul nu o poate scoate din fiscal. Regula practică este simplă: nu preda banii și nu ridica mașina înainte ca vânzătorul să prezinte certificatul de atestare fiscală și să vizeze contractul la primăria lui. Din 25 februarie 2026 (OUG 7/2026), și tu, cumpărătorul, trebuie să ai achitate toate datoriile la bugetul local de la domiciliul tău și să prezinți propriul certificat de atestare fiscală (sau să accepți verificarea electronică); contractul încheiat fără aceste certificate este nul de drept. Certificatul se eliberează gratuit, în cel mult două zile lucrătoare, și e valabil 30 de zile.</p><h2>Termenul de 30 de zile și ce se întâmplă dacă îl depășești</h2><p>Ai la dispoziție <strong>30 de zile</strong> de la data contractului pentru a depune declarația de impunere. Depășirea termenului este contravenție și se poate sancționa cu amendă. În plus, dacă amâni, rămâne o neconcordanță în evidențe: mașina figurează încă pe vechiul proprietar, ceea ce poate bloca înmatricularea și poate genera confuzii la plata impozitului.</p><h2>Când începi să plătești impozitul</h2><p>Deși introduci mașina în fiscal imediat după cumpărare, impozitul propriu-zis îl datorezi abia de la <strong>1 ianuarie a anului următor</strong>. Pentru anul în curs, impozitul rămâne, de regulă, în sarcina proprietarului care figura la 1 ianuarie (vânzătorul trebuie să-l achite integral înainte de vânzare). Excepție: dacă mașina e cumpărată, înmatriculată și vândută în același an calendaristic, se stabilește impozit pentru acel an, cu termen de plată la data înstrăinării. Din 2026, impozitul se calculează în funcție de capacitatea cilindrică (grupe de 200 cmc) și de norma de poluare Euro, iar autovehiculele 100% electrice plătesc un impozit fix de <a href=\"https://ditl5.ro/noutati/informare-cu-privire-la-facilitatile-de-plata-scutiri-reduceri-acordate-persoanelor-fizice-la-plata-impozitului-pe-mijloacele-de-transport-in-anul-2026/\" target=\"_blank\" rel=\"noopener\">40 de lei pe an</a> (nu mai beneficiază de scutirea totală valabilă până în 2025).</p><p>Sfat: verifică pe decizia de impunere dacă norma Euro și capacitatea cilindrică au fost preluate corect din cartea de identitate a vehiculului, pentru că orice eroare îți poate mări nejustificat impozitul.</p>",
    "faq": [
      {
        "question": "Care este diferența dintre introducerea în fiscal și înmatriculare?",
        "answer": "Introducerea în fiscal se face la primărie și privește evidența fiscală locală și impozitul. ��nmatricularea se face la DGPCI și privește dreptul de a circula pe drumurile publice, respectiv numerele de înmatriculare. Sunt proceduri separate."
      },
      {
        "question": "Pot introduce mașina în fiscal fără certificatul de atestare fiscală al vânzătorului?",
        "answer": "Nu. Certificatul de atestare fiscală al vânzătorului este obligatoriu (poate fi înlocuit doar de verificarea electronică a situației fiscale de către primărie); el dovedește că vânzătorul are impozitele plătite la zi, inclusiv pe anul vânzării. Din 25.02.2026 este obligatoriu și certificatul tău de atestare fiscală, de la primăria de domiciliu; fără ele, contractul este nul de drept."
      },
      {
        "question": "Ce se întâmplă dacă vânzătorul nu a scos mașina din evidența lui?",
        "answer": "Vânzătorul are obligația proprie de a face radierea fiscală. Introducerea mașinii pe numele tău și radierea vânzătorului se corelează pe baza aceluiași contract; de aceea contractul se face în mai multe exemplare și se vizează la fisc."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/305208",
        "label": "Legea nr. 239/2025 – Portal Legislativ (legislatie.just.ro) ↗"
      },
      {
        "url": "https://ditl5.ro/noutati/informare-cu-privire-la-facilitatile-de-plata-scutiri-reduceri-acordate-persoanelor-fizice-la-plata-impozitului-pe-mijloacele-de-transport-in-anul-2026/",
        "label": "Impozit auto electrice (40 lei/an) și facilități/scutiri din 2026 — DITL Sector 5 (informare oficială) ↗"
      },
      {
        "url": "https://www.impozitelocale2.ro/acte/pf/",
        "label": "DGITL Sector 2 – Acte necesare persoane fizice (mijloace de transport) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxelor locale online ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "scutire-impozit-pentru-masina-electrica",
    "url": "/ghid-auto/scutire-impozit-pentru-masina-electrica/",
    "title": "Scutire impozit pentru mașină electrică – condiții și acte",
    "category": {
      "slug": "impozite-taxe-auto",
      "name": "Impozite & Taxe auto",
      "color": "#ca8a04",
      "icon": "💰"
    },
    "metaDescription": "Scutire impozit mașină electrică în 2026: ce s-a schimbat, cât plătesc acum electricele (cca 40 lei/an) și ce reduceri pot acorda consiliile locale.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Începând cu 2026, autovehiculele electrice nu mai sunt scutite integral de impozitul pe mijloacele de transport, așa cum erau până în 2025. Ele plătesc un impozit fix de 40 de lei pe an, stabilit prin Codul fiscal. Codul fiscal nu mai prevede nicio scutire sau reducere specifică pentru mașinile electrice; un consiliu local poate acorda facilități doar în condițiile generale ale art. 489^1 (analiză cost-beneficiu, criterii stabilite prin hotărâre, maximum 2 ani fiscali). Hibridele (în practică, de regulă plug-in) cu emisii de cel mult 50 g/km CO2 pot beneficia de o reducere de până la 30%, dacă primăria decide astfel prin hotărâre de consiliu local.",
    "docs": [
      "Declarația fiscală de impunere pentru mijloacele de transport (model ITL-005)",
      "Cartea de identitate a vehiculului (CIV), din care rezultă sursa de energie (electrică / hibridă)",
      "Actul de identitate al proprietarului, în copie",
      "Actul de dobândire (contract de vânzare-cumpărare sau factură)",
      "Cerere pentru acordarea reducerii/scutirii locale, dacă primăria oferă o astfel de facilitate",
      "Hotărârea de consiliu local aplicabilă, pentru a verifica facilitatea disponibilă"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Declară mașina la primărie",
        "description": "Ca la orice autovehicul, depune declarația de impunere ITL-005 la Direcția de Impozite și Taxe Locale, în 30 de zile de la dobândire. Pentru electrice, impozitul se stabilește la suma fixă prevăzută de lege."
      },
      {
        "num": 2,
        "title": "Verifică hotărârea de consiliu local",
        "description": "Consultă hotărârea de consiliu local pe anul în curs sau întreabă la ghișeu dacă municipiul tău acordă reduceri ori scutiri pentru mașini electrice sau hibride plug-in."
      },
      {
        "num": 3,
        "title": "Depune o cerere de reducere, dacă există facilitatea",
        "description": "Dacă primăria oferă o facilitate prin HCL, depune o cerere însoțită de copia CIV, din care să rezulte propulsia electrică sau emisiile hibridului."
      },
      {
        "num": 4,
        "title": "Plătește impozitul rezidual",
        "description": "Achită suma stabilită. Pentru o mașină 100% electrică (40 lei/an), impozitul se plătește integral până la 31 martie, fiind sub pragul de 50 de lei. Pentru celelalte mașini, plata se face în două rate (31 martie, 30 septembrie), iar plata integrală până la 31 martie poate aduce bonificație de până la 10%. Plata la termen evită majorările de întârziere de 1% pe lună."
      }
    ],
    "costs": [
      {
        "item": "Impozit anual mașină 100% electrică",
        "note": "sumă fixă din 2026; nu mai există scutire integrală",
        "value": "40 lei/an"
      },
      {
        "item": "Hibrid (de regulă plug-in) cu emisii ≤ 50 g/km CO2",
        "note": "doar dacă este prevăzută prin hotărâre de consiliu local",
        "value": "reducere de până la 30%"
      },
      {
        "item": "Hibrid full / mild",
        "note": "calculat pe grupe de 200 cmc, pe o coloană dedicată hibridelor cu emisii de CO2 peste 50 g/km (valori ușor sub cele pentru Euro 6), indiferent de norma Euro",
        "value": "impozit apropiat de al mașinilor termice"
      },
      {
        "item": "Bonificație plată integrală până la 31 martie",
        "note": "procentul e stabilit de fiecare primărie",
        "value": "până la 10%"
      }
    ],
    "proseHtml": "<h2>Ce s-a schimbat pentru mașinile electrice în 2026</h2><p>Până la finalul lui 2025, autovehiculele acționate electric erau scutite integral de impozitul pe mijloacele de transport, conform Codului Fiscal. Din 2026, prin reforma fiscală (Legea 239/2025 și <a href=\"https://legislatie.just.ro/Public/DetaliiDocumentAfis/305617\" target=\"_blank\" rel=\"noopener\">OUG 78/2025</a>), această scutire automată a fost eliminată. Mașinile 100% electrice plătesc acum un impozit fix, simbolic, de <strong>40 de lei pe an</strong> (art. 470 alin. (3^1) Cod fiscal). Fiind sub 50 de lei, suma se plătește integral până la 31 martie. Chiar dacă suma este mult mai mică decât la o mașină termică echivalentă, obligația de plată există și trebuie declarată la primărie.</p><h2>Cum sunt taxate hibridele</h2><p>Reforma a schimbat radical și regimul hibridelor. Regula de bază este:</p><ul><li><strong>Hibridele cu emisii de CO2 peste 50 g/km</strong> (în practică, hibridele full și mild) nu mai beneficiază de facilitatea generoasă de altădată: se impozitează pe grupe de 200 cmc, după o coloană dedicată din tabelul de la art. 470 alin. (2) Cod Fiscal, cu valori apropiate de cele ale mașinilor termice (ușor sub nivelul Euro 6).</li><li><strong>Hibridele cu emisii de CO2 de cel mult 50 g/km</strong> (în practică, de regulă hibridele plug-in – PHEV) pot primi o reducere de până la <strong>30%</strong> din valoarea din coloana pentru hibride a tabelului de la art. 470 alin. (2), dar numai dacă acest lucru este prevăzut printr-o hotărâre de consiliu local. Legea (art. 470 alin. (3)) nu condiționează facilitatea de tipul plug-in, ci doar de nivelul emisiilor.</li></ul><p>Practic, un hibrid mic care aproape că nu plătea impozit până în 2025 poate ajunge acum la o sumă comparabilă cu a unei mașini pe benzină cu aceeași cilindree.</p><h2>Rolul consiliilor locale</h2><p>Un aspect esențial al noilor reguli este că decizia privind scutirile și reducerile pentru vehicule ecologice a trecut aproape integral la consiliile locale. Statul nu mai garantează o scutire prin lege, ci lasă fiecărei primării libertatea de a acorda sau nu facilități, prin hotărâre de consiliu local. De aceea, situația poate diferi semnificativ de la un oraș la altul: în unele localități poți obține o reducere pentru electric sau hibrid plug-in, în altele nu.</p><h2>Sfaturi practice pentru proprietarii de mașini verzi</h2><p>Chiar dacă impozitul pe o mașină electrică este mic, nu ignora obligația de declarare în 30 de zile de la dobândire, pentru a evita amenda contravențională. Verifică anual hotărârea de consiliu local, pentru că facilitățile se pot modifica de la un an la altul. Reține că impozitul local este separat de alte avantaje pentru mașinile electrice, cum ar fi programele de tip Rabla sau eventualele facilități locale la parcare ori acces în zone cu restricții de poluare, care nu au legătură cu impozitul auto.</p>",
    "faq": [
      {
        "question": "Mai sunt scutite mașinile electrice de impozit în 2026?",
        "answer": "Nu integral. Scutirea automată prevăzută anterior de Codul Fiscal a fost eliminată din 2026. Mașinile electrice plătesc acum un impozit fix de 40 de lei pe an, stabilit prin Codul fiscal. Legea nu mai prevede nicio scutire sau reducere specifică pentru electrice; un consiliu local poate acorda facilități doar în condițiile generale ale art. 489^1 Cod fiscal (pe bază de analiză cost-beneficiu și criterii stabilite prin hotărâre)."
      },
      {
        "question": "Ce reducere primesc pentru un hibrid plug-in?",
        "answer": "Hibridele cu emisii de cel mult 50 g/km CO2 (în practică, de regulă hibridele plug-in) pot beneficia de o reducere de până la 30% din impozit, însă numai dacă primăria ta a prevăzut această facilitate printr-o hotărâre de consiliu local. Verifică la Direcția de Impozite și Taxe Locale."
      },
      {
        "question": "Trebuie să declar mașina electrică dacă impozitul e doar 40 de lei?",
        "answer": "Da. Obligația de declarare în 30 de zile de la dobândire există indiferent de valoarea impozitului. Nedepunerea declarației se sancționează cu amendă, chiar dacă suma de plată este mică."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxelor locale online ↗"
      },
      {
        "url": "https://mfinante.gov.ro/",
        "label": "Ministerul Finanțelor ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/305208",
        "label": "Legea nr. 239/2025 – Portal Legislativ ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocumentAfis/305617",
        "label": "OUG nr. 78/2025 – Portal Legislativ ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/171282",
        "label": "Codul Fiscal (Legea nr. 227/2015) – Portal Legislativ ↗"
      }
    ]
  },
  {
    "slug": "declarare-impozit-auto-la-primarie",
    "url": "/ghid-auto/declarare-impozit-auto-la-primarie/",
    "title": "Declarare impozit auto la primărie – acte necesare și termen legal",
    "category": {
      "slug": "impozite-taxe-auto",
      "name": "Impozite & Taxe auto",
      "color": "#ca8a04",
      "icon": "💰"
    },
    "metaDescription": "Declararea impozitului auto la primărie în 2026: acte necesare, formularul ITL-005, termenul de 30 de zile și termenele de plată. Ghid pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Orice proprietar de autovehicul trebuie să depună o declarație de impunere la primăria de domiciliu în termen de 30 de zile de la dobândire; pentru mașinile cumpărate din străinătate, termenul de 30 de zile curge de la data eliberării cărții de identitate a vehiculului (CIV) de către RAR. Impozitul pe mijloacele de transport se datorează începând cu 1 ianuarie a anului următor și se plătește în două rate egale, până la 31 martie și 30 septembrie. Nedepunerea declarației la termen se sancționează cu amendă contravențională.",
    "docs": [
      "Declarația fiscală tip pentru stabilirea impozitului pe mijloacele de transport (model ITL-005)",
      "Actul de identitate al proprietarului, în copie",
      "Cartea de identitate a vehiculului (CIV), în copie",
      "Certificatul de înmatriculare, în copie, dacă mașina este deja înmatriculată",
      "Actul de dobândire: contract de vânzare-cumpărare, factură sau contract de leasing",
      "Certificatul de atestare fiscală al vânzătorului și certificatul tău de atestare fiscală (fără debite la primăria de domiciliu) – ambele obligatorii din 25.02.2026, gratuite; pot fi înlocuite de verificarea electronică a situației fiscale, dacă primăria o face",
      "Împuternicire, dacă declarația este depusă de o altă persoană"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Adună actele de proprietate",
        "description": "Pregătește contractul de vânzare-cumpărare sau factura, cartea de identitate a vehiculului și actul tău de identitate. La mașinile second-hand îți trebuie și certificatul de atestare fiscală al vânzătorului, iar din 25.02.2026 și propriul tău certificat de atestare fiscală (fără datorii la primăria de domiciliu); ambele sunt gratuite și pot fi înlocuite de verificarea electronică."
      },
      {
        "num": 2,
        "title": "Completează declarația de impunere",
        "description": "Descarcă sau ridică de la ghișeu formularul ITL-005 și completează datele despre proprietar și despre autovehicul (serie CIV, capacitate cilindrică, norma de poluare Euro)."
      },
      {
        "num": 3,
        "title": "Depune dosarul în 30 de zile",
        "description": "Depune declarația și copiile actelor la Direcția de Impozite și Taxe Locale a primăriei unde ai domiciliul, personal, prin poștă sau online, dacă municipiul oferă această opțiune."
      },
      {
        "num": 4,
        "title": "Primește decizia de impunere",
        "description": "Funcționarul stabilește impozitul anual și emite decizia de impunere. Verifică datele înscrise, în special capacitatea cilindrică și norma Euro, de care depinde suma."
      },
      {
        "num": 5,
        "title": "Plătește impozitul la termen",
        "description": "Achită impozitul în cele două rate anuale sau integral până la 31 martie, pentru a beneficia de bonificația de până la 10%."
      }
    ],
    "costs": [
      {
        "item": "Depunerea declarației de impunere",
        "note": "nu există taxă de stat pentru înregistrare",
        "value": "Gratuit"
      },
      {
        "item": "Impozit anual autoturism",
        "note": "se calculează pe grupe de 200 cmc și pe norma Euro; suma exactă e stabilită prin hotărâre de consiliu local",
        "value": "de la câteva zeci de lei"
      },
      {
        "item": "Autovehicul electric",
        "note": "sumă fixă prevăzută de lege; din 2026 electricele nu mai sunt scutite",
        "value": "40 lei/an"
      },
      {
        "item": "Bonificație plată integrală până la 31 martie",
        "note": "procentul e stabilit de fiecare primărie",
        "value": "până la 10% reducere"
      }
    ],
    "proseHtml": "<h2>Cine trebuie să declare mașina și în cât timp</h2><p>Obligația de a declara un mijloc de transport la primărie revine oricărei persoane, fizice sau juridice, care dobândește un autovehicul prin cumpărare, donație, moștenire, leasing sau prin înmatriculare în România. Conform <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/171282\" target=\"_blank\" rel=\"noopener\">Codului Fiscal (Legea 227/2015)</a>, declarația de impunere se depune la organul fiscal local în a cărui rază teritorială ai domiciliul, sediul sau punctul de lucru, în termen de <strong>30 de zile</strong> de la data dobândirii; pentru mașinile cumpărate din străinătate, termenul curge de la data eliberării cărții de identitate a vehiculului (CIV) de către RAR.</p><p>Chiar dacă plătești impozitul abia din anul următor, declararea în termen este obligatorie. Depunerea peste cele 30 de zile se sancționează cu amendă contravențională, de regulă între câteva zeci și câteva sute de lei, în funcție de decizia inspectorului.</p><h2>Când se datorează efectiv impozitul</h2><p>Impozitul pe mijloacele de transport se datorează începând cu data de <strong>1 ianuarie a anului următor</strong> celui în care ai dobândit mașina. Cu alte cuvinte, dacă îți cumperi mașina în cursul anului, pentru anul curent nu mai plătești impozit la noul domiciliu; obligația începe din 1 ianuarie. Excepție (din 25.02.2026): dacă mașina este cumpărată, înmatriculată și vândută în același an calendaristic, se stabilește impozit pentru anul respectiv, cu termen de plată la data înstrăinării. Regula de bază este că proprietarul înregistrat la 1 ianuarie datorează impozitul pentru tot anul respectiv, indiferent dacă vinde mașina ulterior.</p><h2>Cum se calculează suma în 2026</h2><p>Din 2026, prin reforma fiscală (Legea 239/2025 și OUG 78/2025), impozitul se calculează înmulțind numărul de grupe de 200 cmc (orice fracțiune se rotunjește în sus la o grupă întreagă) cu un tarif care depinde acum și de norma de poluare Euro a mașinii. Sumele pe grupa de 200 cmc sunt stabilite direct în Codul fiscal (art. 470 alin. (2)) și nu se mai indexează anual, dar consiliul local poate adăuga cote adiționale de până la 100% față de nivelurile din cod. Mașinile mici, sub 1.600 cmc, plătesc semnificativ mai mult decât în 2025; suma finală pentru localitatea ta rezultă din hotărârea consiliului local privind cotele adiționale.</p><h2>Termene de plată și sfaturi practice</h2><p>Impozitul se plătește anual, în două rate egale, până la <strong>31 martie</strong> și <strong>30 septembrie</strong>. Dacă achiți integral suma până la 31 martie, poți primi o bonificație de până la 10%. Plata se poate face la casieria primăriei, prin transfer bancar sau online prin Ghișeul.ro.</p><ul><li>Verifică pe decizia de impunere capacitatea cilindrică și norma Euro, pentru că influențează direct suma.</li><li>Păstrează o copie a declarației depuse, cu număr de înregistrare.</li><li>Neplata la termen atrage majorări de întârziere de 1% pe lună sau fracțiune de lună.</li></ul>",
    "faq": [
      {
        "question": "Trebuie să declar mașina chiar dacă nu plătesc impozit anul acesta?",
        "answer": "Da. Declarația se depune în 30 de zile de la dobândire, chiar dacă impozitul propriu-zis se datorează abia de la 1 ianuarie anul următor. Termenul de declarare este independent de termenul de plată."
      },
      {
        "question": "Ce se întâmplă dacă depun declarația mai târziu de 30 de zile?",
        "answer": "Depunerea peste termen este contravenție și se sancționează cu amendă. Recomandarea este să depui cât mai repede, chiar dacă ai depășit termenul, pentru a limita riscul de sancțiune."
      },
      {
        "question": "Unde depun declarația dacă am domiciliul în alt oraș decât cel în care circul cu mașina?",
        "answer": "Declarația se depune întotdeauna la primăria de domiciliu (pentru persoane fizice) sau de sediu/punct de lucru (pentru firme), nu în funcție de locul unde circulă mașina."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/171282",
        "label": "Legea 227/2015 – Codul Fiscal (Titlul IX, art. 468–472, impozitul pe mijloacele de transport) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/305208",
        "label": "Legea 239/2025 – reforma fiscală aplicabilă din 2026 ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/172697",
        "label": "Legea 207/2015 – Codul de procedură fiscală (art. 159, art. 183) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxelor locale online ↗"
      },
      {
        "url": "https://www.anaf.ro/",
        "label": "ANAF ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "inscriere-in-platforma-bolt",
    "url": "/ghid-auto/inscriere-in-platforma-bolt/",
    "title": "Înscriere în platforma Bolt – acte necesare",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Înscriere în platforma Bolt 2026: acte necesare pentru șofer și mașină, autorizația ARR, pașii de înregistrare și cum te afiliezi la o flotă.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Ca să te înscrii pe Bolt trebuie să ai cel puțin 21 de ani, permis categoria B de minimum 2 ani, certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere (ARR), aviz medical și psihologic, cazier judiciar recent și o mașină cu ITP făcut la 6 luni, RCA, asigurare pentru persoane și bagaje, copie conformă ARR și ecusoane. Poți intra fie afiliindu-te la o flotă existentă, fie înființând propriul PFA/SRL cu autorizație de transport alternativ. Documentele se încarcă în contul Bolt, iar activarea vine după verificare.",
    "docs": [
      "Act de identitate (CI, pașaport sau permis de ședere)",
      "Permis de conducere categoria B, obținut de minimum 2 ani",
      "Certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere (ARR)",
      "Cazier judiciar (nu mai vechi de 6 luni) și aviz medical și psihologic",
      "Fotografie de profil clară",
      "Certificat de înmatriculare cu ITP valabil",
      "Asigurare RCA valabilă și asigurare pentru persoane și bagaje (călătorie și bagaje)",
      "Copie conformă ARR pentru mașină și ecusoane",
      "Documente firmă (pentru operator propriu): certificat ORC, cod CAEN de transport"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege forma de colaborare",
        "description": "Te afiliezi la o flotă (operator partener) care se ocupă de acte, sau îți înființezi propriul PFA/SRL și devii operator de transport alternativ."
      },
      {
        "num": 2,
        "title": "Obține autorizarea ARR",
        "description": "Ca operator, îți trebuie autorizația de transport alternativ și copia conformă pentru mașină; ca șofer afiliat la o flotă, aceasta le pune la dispoziție."
      },
      {
        "num": 3,
        "title": "Pregătește documentele șoferului",
        "description": "Ai nevoie de permis, certificatul de atestare profesională pentru transport persoane și cazier judiciar recent."
      },
      {
        "num": 4,
        "title": "Creează contul pe Bolt",
        "description": "Te înregistrezi pe portalul Bolt pentru șoferi sau prin flotă și încarci toate documentele cerute."
      },
      {
        "num": 5,
        "title": "Așteaptă verificarea și activează-te",
        "description": "Bolt verifică documentele. După aprobare, contul se activează și poți primi curse."
      }
    ],
    "costs": [
      {
        "item": "Autorizație de transport alternativ (operator)",
        "note": "valabilă 3 ani, doar dacă ești operator propriu",
        "value": "300 lei"
      },
      {
        "item": "Copie conformă ARR (per mașină)",
        "note": "vehicul sub 15 ani",
        "value": "100 lei/an"
      },
      {
        "item": "Comision Bolt",
        "note": "reținut automat de platformă",
        "value": "procent din cursă"
      }
    ],
    "proseHtml": "<h2>Două căi de a intra pe Bolt</h2><p>Înscrierea pe Bolt se poate face în două moduri. Cel mai simplu este să te afiliezi la o flotă, adică la un operator de transport alternativ care are deja autorizația și copiile conforme de la ARR; flota se ocupă de partea birocratică și de plăți, iar tu conduci. A doua variantă este să devii propriul operator, prin înființarea unui PFA sau SRL cu obiect de activitate de transport, caz în care obții singur autorizația de transport alternativ și copia conformă.</p><p>Pentru mulți șoferi noi, afilierea la o flotă este calea rapidă de start, pentru că elimină pașii de autorizare la ARR și gestionarea contabilității.</p><h2>Ce documente îți trebuie ca șofer</h2><p>Indiferent de calea aleasă, ca șofer trebuie să ai cel puțin 21 de ani și ai nevoie de un act de identitate, permis categoria B obținut de cel puțin 2 ani, certificatul de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere, aviz medical și psihologic „apt” și un cazier judiciar recent (nu mai vechi de 6 luni). Bolt cere și o fotografie de profil clară, cu fața vizibilă. Certificatul de atestare profesională este obligatoriu prin lege și se obține de la ARR - fără el nu poți fi activat.</p><h2>Condiții pentru mașină</h2><p>Autovehiculul folosit trebuie să aibă ITP efectuat la fiecare 6 luni, asigurare RCA și asigurare pentru persoane și bunurile acestora (călătorie și bagaje). Pentru a fi folosit legal pe platformă, mașina trebuie să aibă copia conformă ARR și ecusoanele de transport alternativ aplicate pe parbriz și lunetă. Mașina trebuie să aibă mai puțin de 15 ani de la fabricație la data expirării copiei conforme.</p><h2>Pașii de înregistrare și activare</h2><p>După ce ai actele pregătite, îți creezi contul pe portalul Bolt pentru șoferi (sau ești adăugat de flotă) și încarci documentele scanate. Bolt verifică fiecare document, iar dacă totul este în regulă, contul se activează și poți începe să primești curse. Dacă un document este expirat sau ilizibil, activarea se blochează până îl reîncarci corect.</p><p>Un sfat practic: verifică termenele de valabilitate ale cazierului, ITP-ului, RCA-ului și copiei conforme înainte de a le încărca, ca să eviți respingerea și întârzierile.</p>",
    "faq": [
      {
        "question": "Trebuie să am firmă ca să conduc pe Bolt?",
        "answer": "Nu neapărat. Te poți afilia la o flotă (operator) care are deja autorizarea. Firma proprie e necesară doar dacă vrei să fii tu operatorul."
      },
      {
        "question": "Ce atestat îmi trebuie pentru Bolt?",
        "answer": "Certificatul de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere, eliberat de ARR după curs și test-grilă. Este obligatoriu pentru activare."
      },
      {
        "question": "Cât de vechi poate fi cazierul judiciar?",
        "answer": "Bolt cere un cazier judiciar care să nu fie mai vechi de 6 luni."
      },
      {
        "question": "Ce mașină pot folosi?",
        "answer": "Un autoturism cu maximum 9 locuri, ITP făcut la fiecare 6 luni, RCA, asigurare pentru persoane și bagaje, copie conformă ARR și ecusoane, cu vechime sub 15 ani la expirarea copiei conforme."
      }
    ],
    "officialLinks": [
      {
        "url": "https://bolt.eu/ro-ro/driver/guide/registration-requirements/",
        "label": "Bolt - cerințe de înregistrare ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) ↗"
      }
    ]
  },
  {
    "slug": "licenta-comunitara-transport",
    "url": "/ghid-auto/licenta-comunitara-transport/",
    "title": "Licență comunitară transport – acte necesare",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Licență comunitară transport 2026: cele 4 condiții de acces, acte necesare, tarife ARR (1.000 lei licența, 360 lei copia conformă) și valabilitate.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Licența comunitară este documentul emis de ARR care atestă dreptul unei firme de a efectua transport rutier contra cost, valabil 10 ani și recunoscut în toată UE. Pentru fiecare vehicul se eliberează o copie conformă valabilă 1 an, care se ține la bord. Firma trebuie să îndeplinească patru condiții: sediu stabil, bună reputație, capacitate financiară și competență profesională (manager cu certificat).",
    "docs": [
      "Cerere pe formular tip ARR",
      "Certificat de înregistrare la Registrul Comerțului și act constitutiv",
      "Certificat constatator (nu mai vechi de 30 de zile)",
      "Document care atestă sediul real și stabil (proprietate/închiriere)",
      "Copii ale actelor de identitate (administrator și manager de transport)",
      "Certificat de competență profesională al managerului de transport",
      "Contract de muncă/colaborare al managerului (dacă nu e administrator)",
      "Cazierul judiciar al managerului de transport și cazierul judiciar al firmei (persoană juridică), însoțite de declarații pe propria răspundere privind onorabilitatea, în original",
      "Documente privind capacitatea financiară (bilanț, garanție bancară sau asigurare)",
      "Cărți de identitate și certificate de înmatriculare ale vehiculelor, cu inspecția tehnică periodică valabilă, plus dovada asigurării întreținerii tehnice a vehiculelor"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică cele 4 condiții",
        "description": "Asigură-te că firma are sediu real, cazier curat (onorabilitate), capacitatea financiară cerută și un manager cu certificat de competență profesională."
      },
      {
        "num": 2,
        "title": "Pregătește dosarul",
        "description": "Aduni actele firmei, dovezile de capacitate financiară, certificatul managerului și documentele vehiculelor."
      },
      {
        "num": 3,
        "title": "Depune dosarul la ARR",
        "description": "Dosarul se depune la agenția teritorială ARR din județul sediului firmei."
      },
      {
        "num": 4,
        "title": "Achită tarifele",
        "description": "Plătești licența comunitară și copiile conforme în contul ARR."
      },
      {
        "num": 5,
        "title": "Ridică licența și copiile conforme",
        "description": "Primești licența comunitară (valabilă 10 ani) și câte o copie conformă pentru fiecare vehicul (valabilă 1 an), care rămâne permanent la bord."
      }
    ],
    "costs": [
      {
        "item": "Licență comunitară",
        "note": "valabilă 10 ani; tarif din 30 decembrie 2025",
        "value": "1.000 lei"
      },
      {
        "item": "Copie conformă (per vehicul)",
        "note": "valabilă 1 an",
        "value": "360 lei/an"
      },
      {
        "item": "Capacitate financiară vehicule >3,5 t",
        "note": "primul vehicul / fiecare vehicul suplimentar",
        "value": "9.000 € / 5.000 €"
      },
      {
        "item": "Capacitate financiară vehicule 2,5-3,5 t",
        "note": "primul vehicul / fiecare vehicul suplimentar",
        "value": "1.800 € / 900 €"
      }
    ],
    "proseHtml": "<h2>Ce este licența comunitară</h2><p><a href=\"https://legislatie.just.ro/Public/DetaliiDocument/131203\" target=\"_blank\" rel=\"noopener\">Licența comunitară</a> este documentul, emis de Autoritatea Rutieră Română (ARR), care atestă dreptul unei întreprinderi de a efectua transport rutier contra cost. Licența comunitară acoperă transportul rutier contra cost de mărfuri și de persoane, atât în trafic național, cât și internațional, și nu se limitează la vehiculele de peste 3,5 tone: obligația de licențiere se aplică inclusiv vehiculelor cu masă maximă autorizată între 2,5 și 3,5 tone. Documentul este recunoscut în toate statele membre ale Uniunii Europene. Licența se eliberează pe numele firmei și este valabilă 10 ani.</p><p>Separat de licența în sine, pentru fiecare vehicul din parc se eliberează o <a href=\"https://www.arr.ro/instructiuni-eliberare-documente_doc_737_licentiere_pg_0.htm\" target=\"_blank\" rel=\"noopener\">copie conformă</a>, valabilă 1 an (fără a depăși valabilitatea licenței), care trebuie să se afle permanent în vehicul și se prezintă la controalele în trafic.</p><h2>Cele patru condiții de acces la profesie</h2><p>Conform Regulamentului (CE) nr. 1071/2009, pentru a obține licența firma trebuie să îndeplinească, cumulativ, patru condiții:</p><ul><li><strong>Sediu real și stabil</strong> în România, cu documente administrative și operaționale la sediu;</li><li><strong>Bună reputație (onorabilitate)</strong> - fără condamnări sau sancțiuni grave;</li><li><strong>Capacitate financiară</strong> - rezerve dovedite în funcție de categoria vehiculelor: 9.000 € pentru primul vehicul de peste 3,5 tone și 5.000 € pentru fiecare vehicul suplimentar; pentru utilitarele de 2,5-3,5 tone, 1.800 € pentru primul și 900 € pentru fiecare vehicul suplimentar;</li><li><strong>Competență profesională</strong> - firma trebuie să aibă un manager de transport care deține certificat de competență profesională valabil.</li></ul><h2>Costuri și unde se depune dosarul</h2><p>Începând cu 30 decembrie 2025, tariful pentru licența comunitară (valabilă 10 ani) este de 1.000 lei, iar copia conformă pentru fiecare vehicul costă 360 lei pe an. La acestea se pot adăuga cheltuieli cu garanția bancară sau asigurarea pentru dovada capacității financiare, caziere și eventuală consultanță. Dosarul se depune la agenția teritorială ARR din județul unde firma are sediul; documentele se pot depune și online, pe platforma licentiereARR.ro.</p><h2>Noutăți 2026 pentru utilitarele ușoare</h2><p>Un aspect important pentru firmele care operează utilitare de 2,5-3,5 tone: din 1 iulie 2026, aceste vehicule folosite în transportul internațional sau în cabotaj în UE trebuie să fie echipate cu tahograf inteligent de generația a doua (G2V2). Este o obligație suplimentară față de licențiere, care ține de dotarea vehiculului, dar de care trebuie ținut cont în planificarea flotei.</p>",
    "faq": [
      {
        "question": "Care e diferența dintre licența comunitară și copia conformă?",
        "answer": "Licența comunitară se emite pe firmă și e valabilă 10 ani. Copia conformă se emite pentru fiecare vehicul, e valabilă 1 an și se ține permanent la bord."
      },
      {
        "question": "Ce capacitate financiară trebuie să dovedesc?",
        "answer": "9.000 € pentru primul vehicul de peste 3,5 t și 5.000 € pentru fiecare vehicul suplimentar; pentru 2,5-3,5 t, 1.800 € și respectiv 900 €."
      },
      {
        "question": "Cât costă licența comunitară în 2026?",
        "answer": "1.000 lei licența comunitară (10 ani) ��i 360 lei pe an pentru fiecare copie conformă, tarife aplicabile din 30 decembrie 2025."
      },
      {
        "question": "Unde depun dosarul?",
        "answer": "La agenția teritorială ARR din județul în care firma are sediul. Solicitările ulterioare se pot face și online, cu semnătură electronică."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) ↗"
      },
      {
        "url": "https://www.arr.ro/instructiuni-eliberare-documente_doc_737_licentiere_pg_0.htm",
        "label": "ARR – Licențiere (licența comunitară și copii conforme) ↗"
      },
      {
        "url": "https://www.arr.ro/arr_doc_1307_tarife-pentru-prestatiile-specifice-realizate-de-autoritatea-rutiera-romana-arr-incepand-cu-data-de-30-decembrie-2025_pg_0.htm",
        "label": "ARR – Tarife în vigoare de la 30 decembrie 2025 (OMTI nr. 2.274/2025) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/131203",
        "label": "OG 27/2011 privind transporturile rutiere – Portal Legislativ ↗"
      }
    ]
  },
  {
    "slug": "atestat-operator-transport-rutier",
    "url": "/ghid-auto/atestat-operator-transport-rutier/",
    "title": "Atestat operator transport rutier – acte necesare",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Atestat operator transport rutier: certificatul de competență al managerului de transport, acte necesare, curs și examen ARR, valabilitate în 2026.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru a fi operator de transport rutier de marfă sau persoane ai nevoie de un manager de transport care deține Certificatul de Competență Profesională (CPC), obținut după un curs de pregătire și un examen la ARR. Acest atestat este condiția de competență profesională cerută pentru licența de transport și, la transportul general de marfă/persoane, nu expiră, dar trebuie însoțit de pregătire periodică cu evaluare la cel mult 10 ani.",
    "docs": [
      "Cerere de înscriere (formular tip)",
      "Copie act de identitate",
      "Actul de studii care atestă absolvirea liceului (diplomă de absolvire a liceului sau diplomă de bacalaureat) — în copie certificată de tine „conform cu originalul” (declarație pe propria răspundere și semnătură); nu este necesară copia legalizată.",
      "Contract de pregătire profesională cu furnizorul de curs",
      "Dovada reședinței normale în România (condiție de acces la pregătire, conform Regulamentului (CE) nr. 1071/2009); cazierul judiciar se cere ulterior, la dosarul de licențiere al firmei, nu pentru certificat",
      "Dovada plății taxelor de curs și examen",
      "Dovada achitării tarifului de eliberare a certificatului (200 lei)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică condițiile de acces",
        "description": "Trebuie să fii absolvent de liceu și să ai reședința normală în România; buna reputație (onorabilitatea) se verifică la desemnarea ta ca manager în dosarul de licențiere al firmei."
      },
      {
        "num": 2,
        "title": "Înscrie-te la un curs autorizat",
        "description": "Alegi un furnizor de formare autorizat pentru pregătirea managerului de transport marfă sau persoane."
      },
      {
        "num": 3,
        "title": "Parcurge cursul",
        "description": "Cursul acoperă legislație, management, siguranță rutieră, fiscalitate și dreptul transporturilor, teorie și aplicații practice."
      },
      {
        "num": 4,
        "title": "Susține examenul la ARR",
        "description": "Examenul constă din două probe scrise: o probă de 2 ore cu un test grilă de 100 de întrebări cu 4 variante de răspuns (o singură variantă corectă) și o probă de 2 ore cu un studiu de caz de 20 de întrebări. Promovezi dacă obții minimum 60% din punctajul total al celor două probe, cu cel puțin 50% la fiecare probă."
      },
      {
        "num": 5,
        "title": "Ridică certificatul",
        "description": "După promovare, ARR eliberează Certificatul de Competență Profesională, recunoscut la nivelul Uniunii Europene."
      }
    ],
    "costs": [
      {
        "item": "Curs de pregătire manager de transport",
        "note": "variază în funcție de furnizor; verifică oferta",
        "value": "~800-1.800 lei"
      },
      {
        "item": "Taxă examen și eliberare certificat ARR",
        "note": "se achită în contul Agenției Teritoriale ARR",
        "value": "200 lei examinare (100 lei/probă, 2 probe) + 200 lei eliberare certificat"
      }
    ],
    "proseHtml": "<h2>Ce este de fapt acest atestat</h2><p>Când vorbim despre atestatul necesar unui operator de transport rutier, ne referim la Certificatul de Competență Profesională (CPC) al managerului de transport. Conform Regulamentului (CE) nr. 1071/2009, orice întreprindere care vrea să efectueze transport rutier contra cost trebuie să desemneze un manager de transport care deține acest certificat. Fără el, nu poți obține licența de transport și nu poți funcționa legal ca operator.</p><p>Este important să nu confunzi acest atestat cu atestatele profesionale ale conducătorilor auto (Cod 95, ADR, transport marfă sau persoane). Acelea se referă la șoferi, în timp ce CPC-ul managerului de transport se referă la persoana care conduce activitatea de transport a firmei.</p><h2>Condiții și pregătire</h2><p>Pentru a deveni manager de transport trebuie să îndeplinești condiții de studii, să ai un cazier judiciar curat (condiția de onorabilitate) și să parcurgi un curs de pregătire într-un centru de pregătire autorizat de Ministerul Transporturilor; la examen te poți prezenta în cel mult 12 luni de la absolvirea cursului. Cursul acoperă module de drept civil și comercial, dreptul muncii, fiscalitate, management financiar, acces pe piață, standarde tehnice și siguranță rutieră.</p><p>Programul de pregătire se desfășoară pe parcursul mai multor zile și combină teoria cu aplicații practice, iar la final urmează examenul organizat de ARR.</p><h2>Examenul la ARR</h2><p>Examenul este de tip grilă și verifică cunoștințele din toate modulele. <a href=\"https://www.arr.ro/arr_doc_1298_calendarul-de-examinare-teoretica-pentru-perioada-01-01-2026-31-12-2026_pg_0.htm\" target=\"_blank\" rel=\"noopener\">Se organizează periodic la centrele ARR</a>, iar pentru promovare trebuie să obții <a href=\"https://legislatie.just.ro/Public/DetaliiDocumentAfis/225689\" target=\"_blank\" rel=\"noopener\">cel puțin 60% din totalul punctelor acordate per total la cele două probe</a>, fără ca procentajul punctelor obținute la fiecare probă să fie mai mic de 50% din punctele posibile. După promovare, <a href=\"https://www.arr.ro/instructiuni-eliberare-documente_doc_741_atestare-si-certificare_pg_0.htm\" target=\"_blank\" rel=\"noopener\">ARR eliberează certificatul</a>, valabil în toate statele membre UE.</p><h2>Valabilitate și diferențe pe tipuri de transport</h2><p>Pentru transportul rutier general de marfă și de persoane, Certificatul de Competență Profesională al managerului de transport nu are o dată de expirare, dar, pentru a-l folosi, managerul trebuie să urmeze cursuri de pregătire periodică încheiate cu evaluare la cel mult 10 ani (sau înainte de reluarea activității după o pauză mai lungă de 5 ani) și să își păstreze buna reputație. În schimb, pentru transportul de persoane în regim de taxi și în regim de închiriere, certificatul managerului se eliberează cu valabilitate limitată (10 ani), cu obligația reînnoirii.</p><p>Ține cont că un manager de transport poate coordona activitatea unui număr limitat de vehicule și de întreprinderi în același timp, conform reglementărilor europene.</p>",
    "faq": [
      {
        "question": "Am nevoie de acest atestat dacă vreau să deschid o firmă de transport?",
        "answer": "Da. Firma trebuie să aibă un manager de transport cu Certificat de Competență Profesională, altfel nu obține licența de transport."
      },
      {
        "question": "Atestatul de manager de transport expiră?",
        "answer": "Pentru transportul general de marfă și persoane certificatul nu expiră, dar managerul trebuie să facă pregătire periodică cu evaluare cel puțin o dată la 10 ani, ca să își păstreze dreptul de a-l folosi. Pentru regimul taxi și închiriere se eliberează pe 10 ani."
      },
      {
        "question": "Cine eliberează certificatul?",
        "answer": "Autoritatea Rutieră Română (ARR), după promovarea examenului susținut în urma unui curs autorizat."
      },
      {
        "question": "Managerul de transport trebuie să fie și șofer?",
        "answer": "Nu. Managerul de transport coordonează activitatea firmei; el are un certificat distinct de atestatele profesionale ale conducătorilor auto."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocumentAfis/225689",
        "label": "Normele privind pregătirea și atestarea profesională a managerilor de transport (OMT 1214/2015) – legislatie.just.ro ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/184250",
        "label": "Normele privind pregătirea și atestarea managerilor de transport în regim de taxi și închiriere (HG 879/2016) – legislatie.just.ro ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) ↗"
      },
      {
        "url": "https://www.arr.ro/instructiuni-eliberare-documente_doc_741_atestare-si-certificare_pg_0.htm",
        "label": "ARR – atestare și certificare (instrucțiuni eliberare documente) ↗"
      },
      {
        "url": "https://www.arr.ro/arr_doc_1298_calendarul-de-examinare-teoretica-pentru-perioada-01-01-2026-31-12-2026_pg_0.htm",
        "label": "ARR – Calendarul examinărilor teoretice 2026 ↗"
      }
    ]
  },
  {
    "slug": "autorizatie-transport-taxi",
    "url": "/ghid-auto/autorizatie-transport-taxi/",
    "title": "Autorizație transport taxi – acte necesare",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Autorizație transport taxi 2026: autorizația de la primărie, autorizația taxi pe mașină, acte necesare, atestatul șoferului și condiții vehicul.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru a face taxi ai nevoie de o autorizație de transport în regim de taxi (eliberată de primărie transportatorului, pe durată nedeterminată, valabilă cu condiția vizării la fiecare 5 ani) și de o autorizație taxi pentru fiecare mașină. Șoferul trebuie să aibă atestat profesional de conducător auto de taxi, iar vehiculul trebuie dotat cu aparat de taxat fiscal, lampă TAXI și ecuson. Cerințele diferă de la o localitate la alta.",
    "docs": [
      "Cerere tip către primărie",
      "Copie certificat de înregistrare la Registrul Comerțului (PFA sau SRL)",
      "Certificat de competență profesională al managerului de transport în regim de taxi (SRL/asociație familială) sau certificat de pregătire profesională (PFA)",
      "Cazier judiciar",
      "Aviz medical și aviz psihologic",
      "Cazier fiscal al transportatorului (dacă este operator economic)",
      "Declarații pe propria răspundere (spații de parcare, dotarea vehiculelor, perioade anterioare de activitate)",
      "Atestatul profesional al conducătorului auto de taxi",
      "Certificat de înmatriculare și carte de identitate a vehiculului"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Obține atestatul de taxi",
        "description": "Conducătorul auto susține examenul la ARR și obține atestatul profesional de conducător auto de taxi."
      },
      {
        "num": 2,
        "title": "Depune dosarul la primărie",
        "description": "Ceri autorizația de transport în regim de taxi la primăria localității în care vrei să activezi. Aceasta se eliberează pe durată nedeterminată și este valabilă cu condiția vizării la fiecare 5 ani."
      },
      {
        "num": 3,
        "title": "Pregătește mașina",
        "description": "Montezi aparatul de taxat fiscal cu aviz, lampa TAXI și celelalte dotări obligatorii; unele localități impun și o anumită culoare."
      },
      {
        "num": 4,
        "title": "Obține autorizația taxi pe vehicul",
        "description": "Pentru fiecare mașină primești o autorizație taxi, în limita numărului de autorizații disponibile în localitate."
      },
      {
        "num": 5,
        "title": "Începe activitatea",
        "description": "Cu autorizația de transport, autorizația taxi și atestatul șoferului la bord, poți transporta pasageri legal."
      }
    ],
    "costs": [
      {
        "item": "Taxe locale de autorizare",
        "note": "diferă de la o localitate la alta",
        "value": "stabilite de consiliul local"
      },
      {
        "item": "Atestat profesional conducător auto taxi (ARR)",
        "note": "curs + examen",
        "value": "200 lei eliberarea/vizarea certificatului + taxa de testare ARR"
      },
      {
        "item": "Aparat de taxat fiscal",
        "note": "achiziție și fiscalizare la un distribuitor avizat",
        "value": "cost separat"
      }
    ],
    "proseHtml": "<h2>Cele două autorizații de care ai nevoie</h2><p>Transportul în regim de taxi este reglementat de <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/41461\" target=\"_blank\" rel=\"noopener\">Legea 38/2003</a> și, spre deosebire de transportul alternativ (Bolt/Uber), este autorizat în principal de administrația locală, nu de ARR. Practic, ai nevoie de două documente distincte: autorizația de transport în regim de taxi, eliberată transportatorului (firma sau PFA-ul) de primărie pe durată nedeterminată, valabilă cu condiția vizării la fiecare 5 ani, și autorizația taxi, eliberată pentru fiecare vehicul.</p><p>Numărul de autorizații taxi este limitat la nivelul fiecărei localități, printr-o hotărâre de consiliu local. De aceea, în orașele mari, obținerea unei autorizații taxi noi poate depinde de locurile disponibile.</p><h2>Acte pentru transportator</h2><p>Dosarul depus la primărie diferă ușor în funcție de forma juridică. Pentru persoane fizice autorizate (PFA) se cere certificatul de pregătire profesională, iar pentru societăți sau asociații familiale, certificatul de competență profesională al managerului de transport în regim de taxi. La acestea se adaugă cazierul judiciar, avizul medical și psihologic, cazierul fiscal și mai multe declarații pe propria răspundere (privind spațiile de parcare, capacitatea de a deține vehiculele și eventualele perioade anterioare de activitate).</p><h2>Condiții pentru șofer și vehicul</h2><p>Conducătorul auto de taxi trebuie să aibă cel puțin 21 de ani, permis categoria B obținut de cel puțin 2 ani, certificat de atestare a pregătirii profesionale (atestatul de taxi, obținut prin test-grilă la ARR după un curs și vizat la fiecare 5 ani), aviz medical și psihologic și cazier judiciar fără anumite condamnări. Vehiculul trebuie echipat cu aparat de taxat fiscal avizat, lampă TAXI, ecuson și, în multe localități, o anumită culoare a caroseriei. Limitele de vechime sunt stabilite prin lege la nivel național: autorizația taxi se atribuie pentru prima dată numai pentru autoturisme cu vechime de cel mult 5 ani de la data fabricației și se poate prelungi, la cerere, pentru încă 5 ani dacă autoturismul nu depășește 10 ani vechime. Regulamentele locale pot impune condiții suplimentare (de exemplu culoarea caroseriei).</p><h2>Sfaturi și capcane frecvente</h2><p>Pentru că regulile de detaliu (culoare, vechime maximă, tarife locale, disponibilitatea autorizațiilor) se stabilesc prin hotărâri de consiliu local, cel mai sigur este să ceri lista actualizată de la primăria localității unde vrei să activezi înainte de a investi în mașină sau echipamente.</p><ul><li>Fiscalizează aparatul de taxat la un distribuitor avizat și păstrează documentele.</li><li>Reține că autorizațiile se vizează periodic; nu lăsa termenele să expire.</li><li>Nu confunda regimul de taxi cu transportul alternativ (Bolt) - sunt reglementate diferit, cu autorizații distincte.</li></ul>",
    "faq": [
      {
        "question": "Cine eliberează autorizația de taxi?",
        "answer": "Primăria (administrația publică locală) eliberează atât autorizația de transport în regim de taxi, cât și autorizația taxi pe vehicul. Atestatul șoferului se obține de la ARR."
      },
      {
        "question": "Cât e valabilă autorizația de transport în regim de taxi?",
        "answer": "Autorizația de transport se eliberează pe durată nedeterminată și este valabilă cu condiția vizării la fiecare 5 ani. Autorizația taxi pe vehicul se atribuie pentru 5 ani și poate fi prelungită, la cerere, pentru încă 5 ani."
      },
      {
        "question": "Ce vechime poate avea mașina de taxi?",
        "answer": "Limita este stabilită prin Legea 38/2003, la nivel național: la prima atribuire a autorizației taxi mașina poate avea cel mult 5 ani de la data fabricației, iar autorizația se poate prelungi pentru încă 5 ani doar dacă mașina nu depășește 10 ani vechime. Consiliile locale pot adăuga condiții suplimentare prin regulamentul local."
      },
      {
        "question": "Am nevoie de atestat pentru a conduce un taxi?",
        "answer": "Da. Șoferul trebuie să aibă certificatul de atestare a pregătirii profesionale pentru taxi, obținut după un curs și un test-grilă la ARR; certificatul se eliberează pe durată nedeterminată, dar trebuie vizat la fiecare 5 ani. În plus, trebuie să aibă minimum 21 de ani și permis B de cel puțin 2 ani."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/41461",
        "label": "Legea 38/2003 privind transportul în regim de taxi — durata autorizației, vizare la 5 ani, vechime mașină (legislatie.just.ro) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/87470",
        "label": "Ordinul MIRA nr. 356/2007 — Normele metodologice de aplicare a Legii 38/2003 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocumentAfis/84150",
        "label": "Legea 265/2007 — modificarea Legii 38/2003 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) — site oficial ↗"
      },
      {
        "url": "https://testare.arr.ro/464",
        "label": "ARR — Atestat conducător auto TAXI / viză TAXI (testare online) ↗"
      }
    ]
  },
  {
    "slug": "autorizatie-transport-persoane-bolt",
    "url": "/ghid-auto/autorizatie-transport-persoane-bolt/",
    "title": "Autorizație transport persoane Bolt – acte necesare",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Autorizație transport persoane Bolt 2026: autorizația de transport alternativ și copia conformă ARR, acte necesare, tarife (300 lei / 100 lei) și pași.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru a transporta persoane pe Bolt ai nevoie de o autorizație de transport alternativ (valabilă 3 ani, tarif 300 lei) și de o copie conformă a acesteia pentru fiecare mașină (100 lei pe an, doar pentru vehicule sub 15 ani), ambele emise de ARR. Șoferul trebuie să aibă certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere (eliberat de ARR), permis categoria B cu o vechime de cel puțin 2 ani și cazier judiciar fără condamnările prevăzute de lege.",
    "docs": [
      "Cerere tip la ARR",
      "Certificat de înregistrare la Registrul Comerțului (PFA sau SRL) cu obiect de activitate transport",
      "Certificat constatator",
      "Certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere, eliberat de Autoritatea Rutieră Română – A.R.R. (atestatul cerut de art. 23 lit. b din OUG 49/2019 pentru șoferii de transport alternativ)",
      "Certificat de competență profesională al managerului de transport (pentru SRL)",
      "Cazier judiciar pentru conducătorul auto și pentru manager",
      "Aviz medical și aviz psihologic",
      "Certificat de înmatriculare și carte de identitate a autoturismului",
      "Dovada deținerii mașinii: proprietate, leasing, contract de închiriere sau contract de comodat în formă autentificată",
      "Contract de afiliere cu platforma Bolt (pentru ecuson); la bord: RCA și asigurare pentru persoane și bunurile acestora"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Înființează sau folosește o firmă",
        "description": "Ai nevoie de o formă legală (PFA sau SRL) cu obiect de activitate de transport pentru a fi operator de transport alternativ."
      },
      {
        "num": 2,
        "title": "Obține autorizația de transport alternativ",
        "description": "Depui dosarul la agenția teritorială ARR și plătești tariful de 300 lei. Autorizația se eliberează în maximum 15 zile lucrătoare și este valabilă 3 ani."
      },
      {
        "num": 3,
        "title": "Solicită copia conformă pentru mașină",
        "description": "Pentru fiecare autoturism folosit obții o copie conformă (1, 2 sau 3 ani), 100 lei pe an, doar dacă mașina are sub 15 ani la expirarea copiei."
      },
      {
        "num": 4,
        "title": "Ridică ecusoanele",
        "description": "După ce prezinți contractul de afiliere cu Bolt, ARR eliberează ecusoanele care se aplică pe parbriz și lunetă (10x10 cm)."
      },
      {
        "num": 5,
        "title": "Activează-te pe platformă",
        "description": "Încarci documentele în contul Bolt și, după verificare, poți începe cursele."
      }
    ],
    "costs": [
      {
        "item": "Autorizație de transport alternativ",
        "note": "valabilă 3 ani",
        "value": "300 lei"
      },
      {
        "item": "Copie conformă (per mașină)",
        "note": "1, 2 sau 3 ani; vehicul sub 15 ani",
        "value": "100 lei/an"
      },
      {
        "item": "Ecusoane transport alternativ",
        "note": "tarif ARR pentru un autoturism, aplicate pe parbriz și lunetă",
        "value": "8 lei / set de 2 buc."
      }
    ],
    "proseHtml": "<h2>Ce autorizație îți trebuie pentru Bolt</h2><p>Activitatea de tip Bolt sau Uber se numește legal transport alternativ și este reglementată de <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/215598\" target=\"_blank\" rel=\"noopener\">OUG 49/2019</a>. Ca să transporți persoane contra cost prin platformă, îți trebuie două documente de la ARR: autorizația de transport alternativ, care se eliberează operatorului (PFA sau SRL), și copia conformă a autorizației, care se eliberează pentru fiecare mașină folosită. Fără copia conformă valabilă în mașină nu poți efectua nicio cursă.</p><p>Autorizația de transport alternativ este valabilă 3 ani și costă 300 lei. Copia conformă se poate elibera pe 1, 2 sau 3 ani, cu un tarif de 100 lei pentru fiecare an, dar numai pentru autoturisme care au sub 15 ani vechime la data expirării copiei.</p><h2>Condiții pentru șofer</h2><p>Conducătorul auto trebuie să îndeplinească, cumulativ, mai multe condiții: să aibă minimum 21 de ani, permis categoria B obținut de cel puțin 2 ani, <a href=\"https://www.arr.ro/arr_doc_736_intrebari-si-raspunsuri-transport-alternativ_pg_0.htm\" target=\"_blank\" rel=\"noopener\">certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere</a>, eliberat de ARR (același atestat este valabil pentru transportul alternativ), cazier judiciar fără condamnări pentru infracțiuni contra siguranței pe drumurile publice, privind traficul și consumul de droguri, contra vieții, sănătății și integrității corporale, traficul și exploatarea persoanelor vulnerabile, contra libertății și integrității sexuale sau contra patrimoniului, aviz medical și psihologic valabile și să nu fi avut permisul suspendat în ultimul an pentru alcool sau droguri ori să nu fi provocat din culpă accidente soldate cu decese sau vătămări grave.</p><p>Certificatul de atestare profesională se obține tot prin ARR și este obligatoriu; fără el nu poți fi înregistrat ca șofer pe platformă.</p><h2>Condiții pentru mașină și ecusoane</h2><p>Autoturismul trebuie să aibă maximum 9 locuri (inclusiv șoferul), ITP efectuat la fiecare 6 luni și mai puțin de 15 ani vechime de la fabricație la data expirării copiei conforme. Pe parbriz și pe lunetă se aplică ecusoanele de transport alternativ, cu dimensiunea de 10x10 cm, care semnalează că mașina prestează legal acest tip de serviciu. Ecusoanele se eliberează de ARR abia după ce prezinți contractul de afiliere cu o platformă avizată tehnic, cum este <a href=\"https://bolt.eu/ro-ro/driver/guide/driver-requirements/\" target=\"_blank\" rel=\"noopener\">Bolt</a>.</p><h2>Unde depui dosarul și în cât timp</h2><p>Dosarul se depune la agenția teritorială ARR din județul în care este înregistrat operatorul. Cu mașina pentru care ai copie conformă poți lucra permanent în localitatea în care operatorul își are sediul sau domiciliul (ori în regiunea București-Ilfov) și doar ocazional cu plecare de acolo spre alte localități. Pentru vehiculele în leasing, copia se eliberează indiferent unde sunt înmatriculate. Termenul de soluționare este de maximum 15 zile lucrătoare de la depunerea dosarului complet.</p>",
    "faq": [
      {
        "question": "Pot conduce pe Bolt fără firmă?",
        "answer": "Nu direct. Fie îți înființezi PFA/SRL și devii operator, fie te afiliezi la o flotă (operator) care deține deja autorizația de transport alternativ."
      },
      {
        "question": "Cât costă și cât e valabilă autorizația de transport alternativ?",
        "answer": "Tariful este de 300 lei, iar autorizația este valabilă 3 ani. Copia conformă pentru mașină costă 100 lei pe an."
      },
      {
        "question": "Ce vechime maximă poate avea mașina?",
        "answer": "Autoturismul trebuie să aibă mai puțin de 15 ani de la data fabricației la data expirării copiei conforme."
      },
      {
        "question": "În cât timp primesc autorizația?",
        "answer": "ARR o eliberează în maximum 15 zile lucrătoare de la depunerea dosarului complet la agenția teritorială."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/215598",
        "label": "OUG 49/2019 privind transportul alternativ – text consolidat (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) – pagina oficială ↗"
      },
      {
        "url": "https://www.arr.ro/noutati_doc_619_informare-autorizare-transport-alternativ_pg_0.htm",
        "label": "Autorizare transport alternativ – informare oficială (ARR) ↗"
      },
      {
        "url": "https://www.arr.ro/noutati_doc_631_referitor-autorizare-transport-alternativ-pentru-persoane-fizice-autorizate-intreprinderi-familiale-si-persoane-juridice_pg_0.htm",
        "label": "Autorizare transport alternativ pentru PFA, întreprinderi familiale și persoane juridice (ARR) ↗"
      },
      {
        "url": "https://www.arr.ro/arr_doc_736_intrebari-si-raspunsuri-transport-alternativ_pg_0.htm",
        "label": "Întrebări și răspunsuri transport alternativ – tarife ecusoane și atestat (ARR) ↗"
      },
      {
        "url": "https://bolt.eu/ro-ro/driver/guide/driver-requirements/",
        "label": "Cerințe pentru șoferi Bolt – pagina oficială Bolt ↗"
      }
    ]
  },
  {
    "slug": "amenda-rovinieta",
    "url": "/ghid-auto/amenda-rovinieta/",
    "title": "Amendă rovinietă 2026 – cât este și ce faci dacă ai primit proces-verbal",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Amendă rovinietă 2026: cât este pentru autoturism după regulile noi din 1 octombrie, cum plătești jumătate în 15 zile și cum contești procesul-verbal CNAIR/CESTRIN.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru un autoturism (categoria A), amenda pentru lipsa rovinietei este, pentru faptele de după 1 octombrie 2026, între dublul și de patru ori prețul rovinietei pe 12 luni (art. 18 din Legea nr. 226/2023) – circa 456–1.320 lei, în funcție de norma EURO. Pentru faptele dinainte de această dată rămâne amenda de 500-1.000 lei din Anexa nr. 2 la OG 15/2002, între timp abrogată. Nu se mai percepe niciun tarif de despăgubire — acesta a fost eliminat prin Legea nr. 144/2012, care a abrogat prevederile art. 8 privind tariful de despăgubire la 27 iulie 2012. Dacă plătești în 15 zile de la comunicarea procesului-verbal, achiți jumătate din minim (pentru faptele de după 1 octombrie 2026, cât o rovinietă pe 12 luni, adică 228–330 lei; pentru cele anterioare, 250 lei). Procesul-verbal este emis de CNAIR (prin structura CESTRIN) pe baza camerelor ANPR și comunicat prin poștă.",
    "docs": [
      "Procesul-verbal de contravenție primit prin poștă",
      "Certificatul de înmatriculare (talonul) vehiculului",
      "Actul de identitate al proprietarului",
      "Dovada plății amenzii (chitanța), pentru a o trimite la CESTRIN"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Citește procesul-verbal",
        "description": "Verifică data comunicării, cuantumul amenzii și termenele. De la data comunicării curg cele 15 zile pentru plata redusă și pentru contestare."
      },
      {
        "num": 2,
        "title": "Decide: plătești sau contești",
        "description": "Dacă amenda este corectă, o poți plăti la jumătatea minimului în 15 zile. Dacă o consideri greșită (aveai rovinietă valabilă), o poți contesta în instanță."
      },
      {
        "num": 3,
        "title": "Plătește amenda",
        "description": "Plata se face pe ghiseul.ro, prin internet banking sau la trezorerie. Amenda pentru persoane fizice se face venit la bugetul local."
      },
      {
        "num": 4,
        "title": "Trimite dovada plății la CESTRIN",
        "description": "După plată, transmite chitanța la adresa chitanta@cestrin.ro, ca să se închidă dosarul."
      },
      {
        "num": 5,
        "title": "Cumpără rovinietă valabilă",
        "description": "Plata amenzii nu te scutește de obligația de a avea rovinietă. Cumpără una imediat, ca să nu primești o nouă sancțiune."
      }
    ],
    "costs": [
      {
        "item": "Amendă autoturism (categoria A)",
        "note": "Între dublul și de 4 ori rovinieta pe 12 luni (art. 18 din Legea nr. 226/2023), pentru fapte de după 1.10.2026; pentru fapte anterioare, 500–1.000 RON (OG 15/2002)",
        "value": "~456 - 1.320 RON"
      },
      {
        "item": "Plată în 15 zile (jumătate din minim)",
        "note": "Doar dacă achiți în 15 zile de la comunicarea PV",
        "value": "~228 - 330 RON (250 RON pentru fapte dinainte de 1.10.2026)"
      }
    ],
    "proseHtml": "<h2>Cât este amenda în 2026</h2><p>De la 1 octombrie 2026, OG 15/2002 este abrogată, iar amenda pentru circulația fără rovinietă valabilă se stabilește după <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/272230\" target=\"_blank\" rel=\"noopener\">Legea nr. 226/2023</a>: între dublul și de patru ori prețul rovinietei pe 12 luni. Pentru un autoturism, la tarifele de 228–330 lei pe an, asta înseamnă circa 456–1.320 lei, în funcție de norma EURO. Pentru faptele săvârșite înainte de 1 octombrie 2026 se aplică vechiul cuantum de 500-1.000 lei. Camioanele de peste 3,5 tone nu mai plătesc rovinietă, ci TollRo, cu reguli proprii.</p><p>Un aspect important: lipsa rovinietei este considerată contravenție continuă, iar plata amenzii nu elimină obligația de a cumpăra rovinietă. Practic, achiți amenda și, separat, îți iei rovinietă valabilă.</p><h2>Cum se emite și cum ajunge la tine</h2><p>Rețeaua de camere ANPR administrată de CESTRIN, o structură specializată din <a href=\"https://www.cnadnr.ro/\" target=\"_blank\" rel=\"noopener\">CNAIR</a>, detectează automat vehiculele fără taxă de drum valabilă. Procesul-verbal este întocmit de CESTRIN și comunicat prin poștă, la adresa proprietarului din certificatul de înmatriculare. Amenda trebuie aplicată în cel mult 4 luni de la data faptei, iar procesul-verbal se comunică proprietarului în cel mult 2 luni de la aplicarea sancțiunii, așa că este posibil să primești sancțiunea la o oarecare distanță de momentul în care ai circulat fără rovinietă.</p><h2>Plata cu reducere în 15 zile</h2><p>Dacă achiți amenda în 15 zile calendaristice de la primirea procesului-verbal, plătești jumătate din minimul special prevăzut – pentru faptele de după 1 octombrie 2026, cât prețul unei roviniete pe 12 luni (228–330 lei la autoturisme, după norma EURO), iar pentru faptele anterioare 250 lei. Plata se face pe ghiseul.ro, prin internet banking sau la trezorerie, iar amenda pentru persoane fizice se face venit la bugetul local. După plată, trimite dovada (chitanța) la CESTRIN, pe adresa de email indicată în comunicare, ca să se închidă corect dosarul.</p><h2>Cum contești procesul-verbal</h2><p>Dacă ești convins că sancțiunea este greșită - de exemplu aveai rovinietă valabilă în perioada respectivă - o poți contesta în 15 zile de la comunicare, prin plângere contravențională depusă la judecătoria în a cărei rază ai domiciliul. Verifică mai întâi în sistemul CNAIR dacă rovinieta figurează ca validă pentru numărul tău în intervalul din proces-verbal; o captură sau dovada achiziției este utilă la dosar. Contestarea suspendă executarea până la soluționare.</p>",
    "faq": [
      {
        "question": "Dacă plătesc amenda, mai trebuie să cumpăr rovinietă?",
        "answer": "Da. Lipsa rovinietei este contravenție continuă, iar plata amenzii nu te scutește de obligația de a avea rovinietă valabilă. Cumpără una imediat."
      },
      {
        "question": "În cât timp pot plăti jumătate din amendă?",
        "answer": "În 15 zile calendaristice de la comunicarea procesului-verbal poți achita jumătate din minimul special, adică, pentru un autoturism, cât prețul rovinietei pe 12 luni (228–330 lei, după norma EURO) la faptele de după 1 octombrie 2026, respectiv 250 lei la cele anterioare."
      },
      {
        "question": "Cum contest o amendă de rovinietă primită greșit?",
        "answer": "Depui plângere contravențională la judecătorie, în 15 zile de la comunicare. Verifică întâi în sistemul CNAIR dacă rovinieta figurează validă în perioada respectivă."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/33836",
        "label": "OG 15/2002 (abrogată de la 1.10.2026) – amenda de 500–1.000 lei, aplicabilă doar faptelor anterioare; tariful de despăgubire abrogat prin Legea 144/2012 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro — portalul oficial CNAIR de emitere, plată și verificare rovinietă ↗"
      },
      {
        "url": "https://www.cnadnr.ro/",
        "label": "CNAIR — site oficial (Compania Națională de Administrare a Infrastructurii Rutiere) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/ro/puncte-de-distributie",
        "label": "CNAIR — Puncte de distribuție și procesator plăți rovinietă (cnadnr.ro) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/ro/roviniete/intrebari-si-raspunsuri-privind-amenzi-pentru-lipsa-rovinieta",
        "label": "CNAIR — Întrebări și răspunsuri privind amenzile pentru lipsa rovinietei ↗"
      },
      {
        "url": "https://portal.etoll.ro/web/guest/rovinieta",
        "label": "CNAIR — Tarife rovinietă (portal.etoll.ro) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro — plata amenzilor ↗"
      }
    ]
  },
  {
    "slug": "verificare-rovinieta-dupa-numar-auto",
    "url": "/ghid-auto/verificare-rovinieta-dupa-numar-auto/",
    "title": "Verificare rovinietă după număr auto 2026 – online și gratuit",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Verificare rovinietă după număr auto 2026: cum vezi gratuit și online, în câteva secunde, dacă mașina are rovinietă valabilă și până când expiră.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Poți verifica gratuit rovinieta pe portalul oficial CNAIR portal.etoll.ro, în secțiunea Verificare Rovinietă (adresa veche www.erovinieta.ro redirecționează automat aici). Introduci numărul de înmatriculare, eventual seria de șasiu, iar sistemul îți arată instant dacă rovinieta este valabilă și data la care expiră. Nu ai nevoie de cont sau de plată.",
    "docs": [
      "Numărul de înmatriculare al vehiculului",
      "Seria de șasiu (VIN) - solicitată pe formularul oficial CNAIR"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Accesează site-ul oficial",
        "description": "Intră pe portalul oficial CNAIR portal.etoll.ro, secțiunea Verificare Rovinietă (adresa veche erovinieta.ro redirecționează aici) — sursa oficială a datelor CNAIR."
      },
      {
        "num": 2,
        "title": "Introdu numărul de înmatriculare",
        "description": "Scrie numărul fără spații și, dacă ți se cere, seria de șasiu (VIN) din certificatul de înmatriculare."
      },
      {
        "num": 3,
        "title": "Confirmă că nu ești robot",
        "description": "Bifează caseta reCAPTCHA și apasă butonul de căutare."
      },
      {
        "num": 4,
        "title": "Citește rezultatul",
        "description": "Sistemul afișează instant dacă există rovinietă valabilă, tipul acesteia și data expirării."
      }
    ],
    "costs": [
      {
        "item": "Verificare rovinietă online",
        "note": "pe canalele oficiale",
        "value": "Gratuit"
      }
    ],
    "proseHtml": "<h2>Unde verifici oficial rovinieta</h2><p>Rovinieta este electronică, deci singura modalitate sigură de a ști dacă e valabilă este verificarea în baza de date a <a href=\"https://www.cnadnr.ro/\" target=\"_blank\" rel=\"noopener\">CNAIR</a>. Sursa oficială este <a href=\"https://portal.etoll.ro/web/guest/verificare-rovinieta\" target=\"_blank\" rel=\"noopener\">portal.etoll.ro</a>, portalul oficial al CNAIR pentru Rovinietă și TollRo (fostul www.erovinieta.ro redirecționează aici), unde găsești secțiunea Verificare Rovinietă; site-ul <a href=\"https://www.cnadnr.ro/\" target=\"_blank\" rel=\"noopener\">cnadnr.ro</a> trimite tot către etoll.ro pentru cumpărare și verificare. Rezultatul provine direct din sistemul care este consultat și de camerele de pe drumuri.</p><p>Există și numeroase site-uri private care oferă verificare doar după număr, fără serie de șasiu. Acestea sunt utile pentru o verificare rapidă, dar pentru certitudine folosește sursa oficială.</p><h2>Cum funcționează și de ce e util</h2><p>Verificarea durează câteva secunde și este complet gratuită, fără cont și fără date personale. Îți arată dacă vehiculul are rovinietă valabilă și până la ce dată, astfel încât să știi exact când trebuie reînnoită.</p><p>Verificarea este deosebit de utilă în câteva situații: când cumperi o mașină la mâna a doua și vrei să vezi dacă vine cu rovinietă, când ai schimbat numărul de înmatriculare, sau pur și simplu când nu mai ții minte data expirării.</p><h2>Atenție la momentul verificării</h2><p>Dacă tocmai ai plătit o rovinietă nouă, aceasta poate să nu apară imediat în sistem. Activarea durează de obicei câteva minute, dar în unele cazuri poate dura până la o-două ore. De aceea, verifică valabilitatea înainte de a pleca la drum, mai ales dacă ai cumpărat rovinieta cu puțin timp înainte.</p><p>Un alt caz frecvent: dacă ai circulat fără rovinietă valabilă, poți achita rovinieta pentru ziua respectivă până la ora 24:00 a zilei următoare (doar pentru vehiculele înmatriculate în România), ca să eviți amenda.</p><h2>Ce faci dacă rovinieta a expirat</h2><p>Dacă la verificare vezi că rovinieta nu mai e valabilă, cumperi imediat una nouă de pe canalele oficiale, apoi refaci verificarea pentru a confirma activarea. Nu circula până nu vezi rovinieta activă în sistem, pentru că detectarea prin camere este automată și permanentă.</p>",
    "faq": [
      {
        "question": "Pot verifica rovinieta doar cu numărul de înmatriculare?",
        "answer": "Pe multe portaluri da, iar pe formularul oficial CNAIR ți se poate cere și seria de șasiu (VIN) pentru o verificare exactă."
      },
      {
        "question": "Verificarea costă ceva?",
        "answer": "Nu. Verificarea valabilității rovinietei este gratuită pe canalele oficiale și pe majoritatea portalurilor."
      },
      {
        "question": "Am plătit rovinieta, dar nu apare la verificare. De ce?",
        "answer": "Activarea poate dura de la câteva minute până la o-două ore. Reîncearcă verificarea după un timp scurt."
      },
      {
        "question": "Verificarea online e valabilă și pentru amenzi?",
        "answer": "Verificarea îți arată doar valabilitatea rovinietei. Amenzile se comunică separat, prin proces-verbal trimis prin poștă."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/272230",
        "label": "Legea nr. 226/2023 privind aplicarea unor tarife rutiere (legislatie.just.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/web/guest/verificare-rovinieta",
        "label": "Verificare rovinietă – portalul oficial CNAIR (portal.etoll.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro – portalul oficial CNAIR (Rovinietă/TollRo) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/",
        "label": "CNAIR – Compania Națională de Administrare a Infrastructurii Rutiere (cnadnr.ro) ↗"
      }
    ]
  },
  {
    "slug": "rovinieta-pentru-autoutilitara",
    "url": "/ghid-auto/rovinieta-pentru-autoutilitara/",
    "title": "Rovinietă pentru autoutilitară 2026 – preț, categorii și valabilitate",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Rovinietă autoutilitară 2026: ce categorie ți se aplică, prețuri pe perioade (zi, lună, an), diferența față de autoturisme și cum o cumperi corect.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "O autoutilitară de marfă cu masa totală de până la 3,5 tone se încadrează la categoria B, mai scumpă decât autoturismele. De la 1 octombrie 2026, rovinieta pentru categoria B costă, în funcție de norma EURO, între 521 și 752 de lei pe 12 luni (521 lei electric, 579 lei EURO VI, 665 lei EURO V-IV, 752 lei EURO III-0) și între 46 și 67 de lei pe 1 zi. Vehiculele de marfă peste 3,5 tone nu mai plătesc rovinietă, ci tariful TollRo, calculat în funcție de distanța parcursă.",
    "docs": [
      "Numărul de înmatriculare al autoutilitarei",
      "Seria de șasiu (VIN) pentru unele canale de plată",
      "Masa totală maximă autorizată din certificatul de înmatriculare",
      "Norma de poluare (Euro) a vehiculului"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Stabilește categoria",
        "description": "Verifică în certificatul de înmatriculare masa totală maximă autorizată. Până la 3,5 tone intri la categoria B; peste 3,5 tone nu mai plătești rovinietă, ci TollRo."
      },
      {
        "num": 2,
        "title": "Alege perioada",
        "description": "Pentru categoria B ai variante de 1 zi, 10 zile, 30 zile, 60 zile și 12 luni, în funcție de cât de des folosești mașina."
      },
      {
        "num": 3,
        "title": "Cumpără rovinieta",
        "description": "Achită online pe portalul oficial CNAIR portal.etoll.ro, în aplicația TollRo, prin SMS ori la distribuitori autorizați, introducând numărul de înmatriculare. Evită portalurile neautorizate de CNAIR."
      },
      {
        "num": 4,
        "title": "Verifică activarea",
        "description": "Rovinieta se activează aproape imediat, dar poate dura până la o-două ore. Verifică valabilitatea înainte de a pleca la drum."
      }
    ],
    "costs": [
      {
        "item": "Categoria B – 1 zi",
        "note": "din 1 octombrie 2026: 46 lei electric, 52 lei EURO VI, 59 lei EURO V-IV, 67 lei EURO III-0",
        "value": "46–67 lei"
      },
      {
        "item": "Categoria B – 30 zile",
        "note": "din 1 octombrie 2026: 98 lei electric, 110 lei EURO VI, 126 lei EURO V-IV, 142 lei EURO III-0",
        "value": "98–142 lei"
      },
      {
        "item": "Categoria B – 60 zile",
        "note": "din 1 octombrie 2026: 156 lei electric, 173 lei EURO VI, 199 lei EURO V-IV, 225 lei EURO III-0",
        "value": "156–225 lei"
      },
      {
        "item": "Categoria B – 12 luni",
        "note": "din 1 octombrie 2026: 521 lei electric, 579 lei EURO VI, 665 lei EURO V-IV, 752 lei EURO III-0",
        "value": "521–752 lei"
      }
    ],
    "proseHtml": "<h2>Ce categorie de rovinietă are o autoutilitară</h2><p>Încadrarea nu se face după cum arată mașina, ci după masa totală maximă autorizată (MTMA) trecută în certificatul de înmatriculare. O autoutilitară destinată transportului de marfă, cu MTMA de până la 3,5 tone, intră la categoria B. Aici se regăsesc dubele și furgonetele obișnuite, chiar dacă la exterior seamănă cu un autoturism break.</p><p>Este important de reținut că unele SUV-uri sau vehicule omologate ca N1 (transport marfă) pot intra tot la categoria B, deși sunt folosite personal. Verifică rândul cu categoria vehiculului și masa maximă înainte de a plăti, ca să nu cumperi o rovinietă de categorie greșită.</p><h2>De ce e mai scumpă decât la autoturisme</h2><p>Rovinieta pentru categoria B costă de câteva ori mai mult decât cea pentru un autoturism (categoria A). Motivul este uzura mai mare pe care vehiculele de marfă o produc asupra infrastructurii. Pe 12 luni, diferența devine semnificativă: în timp ce un autoturism plătește 228–330 lei, o autoutilitară de categoria B plătește <a href=\"https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf\" target=\"_blank\" rel=\"noopener\">521–752 lei</a> pe 12 luni, în funcție de norma EURO, conform tarifelor aplicabile de la 1 octombrie 2026.</p><p>De la 1 octombrie 2026, tarifele sunt stabilite direct în lei, cu TVA inclus (Ordinul MTI nr. 888/2026), și se actualizează o dată pe an cu inflația, de la 1 ianuarie.</p><h2>Vehicule peste 3,5 tone</h2><p>Dacă autoutilitara depășește 3,5 tone MTMA, nu mai cumperi rovinietă: din 1 octombrie 2026, vehiculele de marfă de peste 3,5 tone plătesc tariful TollRo, calculat în funcție de distanța parcursă pe drumurile naționale (prin aplicația TollRo, dispozitiv de bord sau tichet de rută). Categoriile C și D de rovinietă sunt pentru microbuze și autocare. În plus, pentru transportul comercial de marfă pot fi necesare licența de transport și copia conformă de la ARR, care sunt documente separate de rovinietă.</p><h2>Sfaturi și capcane frecvente</h2><p>Pentru cei care folosesc autoutilitara sporadic, rovinieta pe 1, 10, 30 sau 60 de zile este mai rentabilă decât cea anuală (nu există rovinietă de 7 zile). În schimb, dacă circuli des, varianta pe 12 luni scade costul pe zi la câțiva bani.</p><ul><li>Cumpără rovinieta doar de pe canale oficiale – portalul CNAIR <a href=\"https://portal.etoll.ro/\" target=\"_blank\" rel=\"noopener\">portal.etoll.ro</a>, aplicația TollRo, SMS sau alți <a href=\"https://cnadnr.ro/ro/node/10728\" target=\"_blank\" rel=\"noopener\">distribuitori autorizați</a> – ca să eviți portalurile neautorizate care adaugă comisioane.</li><li>Ține cont că, de la 1 octombrie 2026, tariful depinde de norma de poluare EURO, iar dacă nu există date despre clasa EURO, vehiculul este încadrat la Euro 0 (cel mai scump); verifică valoarea exactă pe portalul oficial înainte de plată.</li><li>Verifică activarea rovinietei înainte de a porni, mai ales dacă ai plătit-o cu puțin timp înainte de plecare.</li></ul>",
    "faq": [
      {
        "question": "Autoutilitara mea are sub 3,5 tone. Ce categorie de rovinietă cumpăr?",
        "answer": "Categoria B. Aceasta acoperă vehiculele de transport marfă cu masa totală maximă autorizată de până la 3,5 tone."
      },
      {
        "question": "De ce plătesc mai mult decât vecinul care are un autoturism?",
        "answer": "Autoturismele sunt categoria A, cea mai ieftină. Autoutilitarele de marfă intră la categoria B, cu tarife de peste două ori mai mari (de exemplu 579 lei față de 254 lei pe 12 luni, la EURO VI)."
      },
      {
        "question": "Un SUV omologat ca marfă (N1) are nevoie de rovinietă de categoria B?",
        "answer": "De regulă da, dacă în certificatul de înmatriculare este trecut ca vehicul de transport marfă. Verifică rândul cu categoria și masa maximă."
      },
      {
        "question": "Pot lua rovinietă pe câteva zile pentru autoutilitară?",
        "answer": "Da, categoria B are variante de 1 zi, 10 zile, 30 și 60 de zile, pe lângă cea de 12 luni."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/public/DetaliiDocument/272230",
        "label": "Legea nr. 226/2023 privind aplicarea unor tarife rutiere pe rețeaua de drumuri naționale din România — Portal Legislativ (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/",
        "label": "CNAIR – Compania Națională de Administrare a Infrastructurii Rutiere (site oficial) ↗"
      },
      {
        "url": "https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf",
        "label": "Tarife rovinietă de la 1 octombrie 2026, toate categoriile (Ordinul MTI nr. 888/2026, MO nr. 818/2026) — PDF ↗"
      },
      {
        "url": "https://cnadnr.ro/ro/node/10728",
        "label": "Cum și de unde cumperi rovinieta legal (canale și distribuitori autorizați) — CNAIR (cnadnr.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro – portalul oficial CNAIR de plată și verificare a rovinietei ↗"
      },
      {
        "url": "https://www.roviniete.ro/",
        "label": "Roviniete.ro – distribuitor autorizat ↗"
      }
    ]
  },
  {
    "slug": "rovinieta-7-zile-autoturism",
    "url": "/ghid-auto/rovinieta-7-zile-autoturism/",
    "title": "Rovinietă 7 zile autoturism 2026 – nu există: ce alegi în loc",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Rovinietă 7 zile autoturism 2026: de fapt nu există opțiunea de 7 zile. Vezi perioadele reale (1 zi, 10 zile) și prețurile ca să alegi corect.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru autoturisme (categoria A) nu există o rovinietă de 7 zile. Perioadele disponibile în 2026 sunt: 1 zi, 10 zile, 30 zile, 60 zile și 12 luni. Pentru o călătorie de aproximativ o săptămână, opțiunea potrivită este rovinieta de 10 zile (27 lei pentru mașinile electrice, 30 lei pentru EURO VI), iar pentru o singură zi de drum poți lua rovinieta de 1 zi (20 lei electric, 22 lei EURO VI).",
    "docs": [
      "Numărul de înmatriculare al vehiculului",
      "Norma de poluare EURO a mașinii (pentru tariful corect)",
      "Un card bancar (pentru achiziția online)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege perioada reală potrivită",
        "description": "Pentru o săptămână de circulație, cea mai apropiată opțiune este rovinieta de 10 zile. Pentru o singură zi, ia rovinieta de 1 zi."
      },
      {
        "num": 2,
        "title": "Deschide un canal de vânzare",
        "description": "Cumpără online pe portal.etoll.ro (portalul oficial CNAIR), în aplicația TollRo, prin SMS sau la distribuitorii autorizați CNAIR."
      },
      {
        "num": 3,
        "title": "Introdu numărul de înmatriculare și norma EURO",
        "description": "Selectezi categoria autoturism, apoi perioada dorită (1 zi sau 10 zile). Tariful depinde de norma de poluare."
      },
      {
        "num": 4,
        "title": "Stabilește data de început și plătește",
        "description": "Alegi data de la care începe valabilitatea (ora 0:00 a acelei zile sau, pentru ziua în curs, momentul plății), plătești cu cardul, iar rovinieta se înregistrează electronic în baza CNAIR."
      }
    ],
    "costs": [
      {
        "item": "Rovinietă 1 zi - electric / EURO VI",
        "note": "EURO V-IV 26 RON; EURO III-0 29 RON (din 1 octombrie 2026)",
        "value": "20 RON (electric) / 22 RON (EURO VI)"
      },
      {
        "item": "Rovinietă 10 zile - electric / EURO VI",
        "note": "EURO V-IV 35 RON; EURO III-0 39 RON (din 1 octombrie 2026)",
        "value": "27 RON (electric) / 30 RON (EURO VI)"
      }
    ],
    "proseHtml": "<h2>De ce nu găsești rovinietă de 7 zile</h2><p>Mulți șoferi caută rovinieta de 7 zile din obișnuință, pentru că, în trecut, exista o astfel de perioadă. În sistemul actual, pentru autoturisme (categoria A) nu mai există opțiunea de 7 zile. Vechea perioadă a fost înlocuită de rovinieta de 10 zile, așa că, dacă ai nevoie de acoperire pentru aproximativ o săptămână, aceasta este alegerea corectă.</p><p>Nu încerca să obții o rovinietă de 7 zile de la distribuitori neoficiali - nu există și riști să plătești pentru ceva ce nu îți oferă acoperire legală.</p><h2>Ce perioade sunt disponibile în 2026</h2><p>Pentru autoturisme, rovinieta se poate cumpăra pe una dintre următoarele perioade:</p><ul><li>1 zi;</li><li>10 zile;</li><li>30 de zile;</li><li>60 de zile;</li><li>12 luni.</li></ul><p>Pentru un weekend prelungit sau o excursie scurtă, alegi între 1 zi și 10 zile, în funcție de câte zile chiar circuli pe drumurile naționale și autostrăzi.</p><h2>Cât costă opțiunile scurte în 2026</h2><p>De la 1 octombrie 2026, tarifele sunt diferențiate în funcție de norma de poluare EURO (Ordinul MTI nr. 888/2026). Rovinieta de 1 zi costă 20 lei pentru mașinile electrice, 22 lei la EURO VI, 26 lei la EURO V-IV și 29 lei la EURO III-0. Rovinieta de 10 zile costă 27 lei (electric), 30 lei (EURO VI), 35 lei (EURO V-IV) și 39 lei (EURO III-0). Verifică prețul exact la achiziție, întrucât tarifele pot fi ajustate.</p><h2>Cum o cumperi</h2><p>Rovinieta este electronică și legată de numărul de înmatriculare, deci nu mai primești abțibild pe parbriz. O poți cumpăra online, pe portal.etoll.ro (portalul oficial <a href=\"https://www.cnadnr.ro/\" target=\"_blank\" rel=\"noopener\">CNAIR</a>), în aplicația TollRo, prin SMS sau la distribuitorii autorizați CNAIR. După plată, apare imediat în baza de date CNAIR, iar verificarea se face automat prin camerele ANPR. Ai grijă să introduci corect numărul de înmatriculare și să alegi data de început potrivită (o poți plăti cu cel mult 30 de zile înainte), ca să nu circuli fără acoperire.</p>",
    "faq": [
      {
        "question": "Există totuși o rovinietă de 7 zile pentru autoturisme?",
        "answer": "Nu. Pentru autoturisme, perioadele disponibile sunt 1 zi, 10 zile, 30 zile, 60 zile și 12 luni. Cea mai apropiată de o săptămână este rovinieta de 10 zile."
      },
      {
        "question": "Ce iau pentru o excursie de câteva zile?",
        "answer": "Dacă circuli mai multe zile la rând, rovinieta de 10 zile este cea mai potrivită. Pentru o singură zi de drum, ia rovinieta de 1 zi."
      },
      {
        "question": "De ce prețul diferă între mașini?",
        "answer": "Din 1 octombrie 2026 tarifele sunt diferențiate pe norma de poluare EURO: mașinile electrice plătesc cel mai puțin, urmate de cele EURO VI, iar cele EURO III-0 cel mai mult. Dacă nu există date despre clasa EURO, vehiculul este încadrat la Euro 0."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/272230",
        "label": "Legea nr. 226/2023 privind aplicarea unor tarife rutiere (rovinietă, TollRo), text consolidat — Portal Legislativ (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf",
        "label": "Tarife rovinietă de la 1 octombrie 2026 — Ordinul MTI nr. 888/2026 (text publicat în MO nr. 818/2026, PDF) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro — portalul oficial CNAIR de cumpărare/verificare a rovinietei ↗"
      },
      {
        "url": "https://www.cnadnr.ro/",
        "label": "CNAIR — Compania Națională de Administrare a Infrastructurii Rutiere (cnadnr.ro) ↗"
      },
      {
        "url": "https://www.roviniete.ro/",
        "label": "Roviniete.ro — distribuitor autorizat CNAIR (Scala Assistance) ↗"
      }
    ]
  },
  {
    "slug": "rovinieta-30-zile-autoturism",
    "url": "/ghid-auto/rovinieta-30-zile-autoturism/",
    "title": "Rovinietă 30 zile autoturism 2026 – preț, valabilitate și cum o cumperi",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Rovinietă 30 zile autoturism 2026: preț (43–62 lei de la 1 octombrie 2026, după norma EURO), valabilitate și cum o cumperi online în câteva minute.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Rovinieta de 30 de zile pentru un autoturism (categoria A) costă, de la 1 octombrie 2026, între 43 și 62 de lei, în funcție de norma de poluare EURO: 43 lei (electric), 48 lei (EURO VI), 55 lei (EURO V-IV) sau 62 lei (EURO III-0). Tarifele sunt stabilite direct în lei, cu TVA inclus (Ordinul MTI nr. 888/2026). Este electronică, legată de numărul de înmatriculare, și se cumpără pe portalul oficial CNAIR portal.etoll.ro, în aplicația TollRo, prin SMS sau la distribuitorii autorizați.",
    "docs": [
      "Numărul de înmatriculare al vehiculului",
      "Un card bancar (pentru achiziția online)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege canalul de cumpărare",
        "description": "Poți cumpăra pe portalul oficial CNAIR portal.etoll.ro, în aplicația TollRo, prin SMS sau la distribuitorii autorizați CNAIR."
      },
      {
        "num": 2,
        "title": "Introdu numărul de înmatriculare și norma EURO",
        "description": "Selectezi categoria (autoturism) și perioada de 30 de zile. De la 1 octombrie 2026 tariful depinde de categoria vehiculului, de perioadă și de clasa de emisii EURO."
      },
      {
        "num": 3,
        "title": "Alege data de început",
        "description": "Poți seta data de la care începe valabilitatea, inclusiv o dată viitoare, cel mult cu 30 de zile înainte."
      },
      {
        "num": 4,
        "title": "Plătește și primești confirmarea",
        "description": "Achiți cu cardul, iar rovinieta este activată electronic în baza de date CNAIR, fără abțibild pe parbriz."
      }
    ],
    "costs": [
      {
        "item": "Rovinietă 30 zile - autoturism (categoria A)",
        "note": "De la 1 octombrie 2026: 43 lei electric, 48 lei EURO VI, 55 lei EURO V-IV, 62 lei EURO III-0; tarif fix în lei, TVA inclus",
        "value": "43–62 lei (în funcție de norma EURO)"
      }
    ],
    "proseHtml": "<h2>Cât costă rovinieta de 30 de zile în 2026</h2><p>De la 1 octombrie 2026, rovinieta are tarife fixe în lei, cu TVA inclus, diferențiate după norma de poluare EURO. Pentru un autoturism (categoria A), rovinieta de 30 de zile costă <a href=\"https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf\" target=\"_blank\" rel=\"noopener\">43 lei (electric), 48 lei (EURO VI), 55 lei (EURO V-IV) sau 62 lei (EURO III-0)</a>, conform Ordinului MTI nr. 888/2026. Sistemul de tarifare diferențiată pe clase de emisii EURO (<a href=\"https://legislatie.just.ro/public/DetaliiDocument/272230\" target=\"_blank\" rel=\"noopener\">Legea nr. 226/2023</a>) se aplică de la 1 octombrie 2026, după ce termenul a fost prorogat prin Legea nr. 103/2026. Cu cât mașina este mai poluantă, cu atât tariful este mai mare, iar mașinile electrice plătesc cel mai puțin. Dacă nu există date despre clasa EURO a vehiculului, acesta este încadrat la Euro 0. Rovinietele cumpărate înainte de 1 octombrie 2026 rămân valabile până la expirare.</p><p>Fiindcă tarifele se pot ajusta, verifică suma exactă în momentul cumpărării. Tarifele sunt stabilite prin ordin al ministrului transporturilor, direct în lei, și se actualizează anual cu inflația, de la 1 ianuarie.</p><h2>Ce înseamnă valabilitatea de 30 de zile</h2><p>Rovinieta de 30 de zile acoperă circulația pe drumurile naționale și pe autostrăzi timp de 30 de zile calendaristice consecutive. Poți alege data de la care începe valabilitatea, inclusiv o dată din viitor (cel mult 30 de zile înainte); valabilitatea începe la ora 0:00 a acelei zile sau, dacă o cumperi pentru ziua în curs, din momentul înregistrării plății. La final, valabilitatea expiră automat; dacă mai circuli, ai nevoie de o rovinietă nouă.</p><p>Este o opțiune potrivită pentru cine călătorește ocazional sau are un vehicul folosit doar câteva săptămâni pe lună - mai ieftină decât rovinieta anuală, dar acoperind o perioadă suficient de lungă cât să nu te încurce cu reînnoiri dese.</p><h2>Cum o cumperi și de ce nu mai există abțibild</h2><p>Rovinieta este complet electronică și este legată de numărul de înmatriculare, nu de un sticker pe parbriz. O poți cumpăra:</p><ul><li>online, pe portalul oficial CNAIR portal.etoll.ro sau în aplicația TollRo;</li><li>prin SMS și la distribuitorii autorizați CNAIR;</li><li>la punctele de vânzare CNAIR și la punctele de trecere a frontierei.</li></ul><p>După achiziție, rovinieta apare imediat în baza de date CNAIR, iar controlul se face automat, prin camerele ANPR.</p><h2>Sfaturi ca să eviți problemele</h2><p>Verifică atent numărul de înmatriculare introdus: o singură cifră greșită înseamnă rovinietă activă pe alt vehicul și amendă pentru al tău. Păstrează dovada de plată (email sau bon) și, dacă ai dubii, folosește serviciul CNAIR de verificare a valabilității rovinietei după numărul de înmatriculare.</p>",
    "faq": [
      {
        "question": "De la ce dată începe rovinieta de 30 de zile?",
        "answer": "De la data pe care o alegi la cumpărare (ora 0:00 a acelei zile sau, pentru ziua în curs, din momentul plății). Poți seta și o dată viitoare, iar valabilitatea de 30 de zile curge consecutiv de la acel moment."
      },
      {
        "question": "De ce prețul rovinietei diferă de la o mașină la alta?",
        "answer": "De la 1 octombrie 2026, tariful depinde de norma de poluare EURO (Legea nr. 226/2023 și Ordinul MTI nr. 888/2026). Pentru 30 de zile, un autoturism electric plătește 43 lei, unul EURO VI 48 lei, EURO V-IV 55 lei, iar EURO III-0 62 lei."
      },
      {
        "question": "Mai primesc un abțibild pentru parbriz?",
        "answer": "Nu. Rovinieta este electronică, legată de numărul de înmatriculare, și se verifică automat prin camerele ANPR ale CNAIR."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/public/DetaliiDocument/272230",
        "label": "Legea nr. 226/2023 privind aplicarea unor tarife rutiere (tarifarea diferențiată pe norme EURO) — Portal Legislativ ↗"
      },
      {
        "url": "https://portal.etoll.ro/web/guest/rovinieta",
        "label": "Tarife rovinietă – portalul oficial CNAIR (portal.etoll.ro) ↗"
      },
      {
        "url": "https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf",
        "label": "Ordinul MTI nr. 888/2026 – tarife rovinietă de la 1 octombrie 2026 (autoturism 30 zile: 43–62 lei), text publicat în MO nr. 818/2026 (PDF) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/",
        "label": "CNAIR — site oficial (cnadnr.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro — portalul oficial CNAIR (cumpărare și verificare rovinietă) ↗"
      },
      {
        "url": "https://www.roviniete.ro/",
        "label": "Roviniete.ro — distribuitor autorizat CNAIR (Scala Assistance SRL) ↗"
      }
    ]
  },
  {
    "slug": "rovinieta-expirata",
    "url": "/ghid-auto/rovinieta-expirata/",
    "title": "Rovinietă expirată 2026 – amendă, verificare și ce trebuie să faci",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Rovinietă expirată în 2026: cât e amenda după regulile noi din 1 octombrie 2026, cum te prind camerele CNAIR, cum eviți sancțiunea plătind până a doua zi și cum contești.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Dacă circuli cu rovinieta expirată, riști o amendă între dublul și de patru ori prețul rovinietei pe 12 luni – pentru autoturisme, circa 456–1.320 lei, în funcție de norma EURO (regula din Legea nr. 226/2023, aplicabilă de la 1 octombrie 2026) – și sume mai mari pentru autoutilitare și autocare. Camerele CNAIR te detectează automat, dar dacă achiți o rovinietă valabilă până la ora 24:00 a zilei următoare depistării, amenda nu se mai aplică.",
    "docs": [
      "Certificatul de înmatriculare al vehiculului (pentru date corecte)",
      "Numărul de înmatriculare",
      "Dovada plății noii roviniete",
      "Procesul-verbal de contravenție (dacă a fost deja emis)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică valabilitatea",
        "description": "Intră pe portalul oficial CNAIR portal.etoll.ro, secțiunea Verificare Rovinietă (adresa veche erovinieta.ro redirecționează aici), și verifică dacă rovinieta a expirat sau mai e valabilă."
      },
      {
        "num": 2,
        "title": "Cumpără imediat o rovinietă nouă",
        "description": "Achită pe portal.etoll.ro, în aplicația TollRo, prin SMS sau la distribuitorii autorizați CNAIR. Rovinieta electronică devine activă aproape imediat după confirmare."
      },
      {
        "num": 3,
        "title": "Folosește fereastra de o zi",
        "description": "Dacă ai fost depistat de o cameră fără rovinietă, ai timp să cumperi una valabilă până la ora 24:00 a zilei următoare pentru a evita amenda."
      },
      {
        "num": 4,
        "title": "Verifică dacă ai primit proces-verbal",
        "description": "Procesul-verbal se comunică prin poștă la adresa din certificatul de înmatriculare. Urmărește corespondența pentru a nu rata termenele."
      },
      {
        "num": 5,
        "title": "Plătește sau contestă la timp",
        "description": "Ai 15 zile pentru plata redusă la jumătate sau pentru a depune contestație la judecătorie."
      }
    ],
    "costs": [
      {
        "item": "Amendă autoturism (categoria A)",
        "note": "jumătate din minim (≈228–330 lei, după norma EURO) dacă plătești în 15 zile; pentru fapte dinainte de 1.10.2026 rămâne 500–1.000 lei (OG 15/2002)",
        "value": "~456–1.320 lei (între dublul și de 4 ori rovinieta pe 12 luni)"
      },
      {
        "item": "Amendă autoutilitară până la 3,5 t (categoria B)",
        "note": "valoare orientativă, verifică în procesul-verbal",
        "value": "~1.042–3.008 lei (între dublul și de 4 ori rovinieta pe 12 luni pentru categoria B, 521–752 lei)"
      },
      {
        "item": "Amendă autobuze și autocare (categoriile C și D); camioanele peste 3,5 t plătesc TollRo, nu rovinietă",
        "note": "depinde de numărul de locuri și de norma EURO",
        "value": "până la circa 25.000 lei (de 4 ori rovinieta anuală de 6.249 lei, categoria D, EURO III-0)"
      },
      {
        "item": "Rovinietă nouă autoturism (12 luni)",
        "note": "tarif fix în lei din 1 octombrie 2026, după norma EURO: 228 lei electric, 254 lei EURO VI, 292 lei EURO V-IV, 330 lei EURO III-0",
        "value": "228–330 lei"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă rovinietă expirată</h2><p>Rovinieta este taxa de utilizare a rețelei de drumuri naționale din România, obligatorie pentru aproape toate vehiculele înmatriculate. Din momentul în care perioada de valabilitate s-a încheiat, ești considerat că folosești drumurile fără drept, iar riscul unei amenzi este permanent, indiferent dacă circuli zilnic sau doar ocazional.</p><p>Rovinieta este electronică, așa că nu există niciun autocolant pe parbriz care să îți amintească de expirare. Din acest motiv, mulți șoferi află că rovinieta a expirat abia când primesc procesul-verbal prin poștă.</p><h2>Cum ești depistat de camere</h2><p>Sistemul de camere ANPR al CNAIR citește automat plăcuțele de înmatriculare și le compară cu baza de date a rovinietelor valabile. Când un vehicul fără rovinietă valabilă este identificat, dosarul ajunge la CESTRIN, structura care întocmește procesul-verbal.</p><p>Procesul-verbal se comunică prin poștă, cu confirmare de primire, la adresa proprietarului din certificatul de înmatriculare. Legea prevede termene stricte: aplicarea amenzii se prescrie în 4 luni de la data faptei, iar procesul-verbal întocmit pe baza camerelor se comunică proprietarului în cel mult 2 luni de la aplicarea sancțiunii. Se aplică o singură amendă până la comunicarea acesteia.</p><h2>Cum eviți amenda dacă ai fost prins</h2><p>Legislația (art. 5 alin. (2^1) din Legea nr. 226/2023, introdus prin <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/290429\" target=\"_blank\" rel=\"noopener\">Legea nr. 275/2024</a>) prevede că utilizatorii vehiculelor înmatriculate în România pot achita rovinieta pentru ziua în curs până cel târziu la ora 24:00 a zilei următoare, astfel încât sancțiunea nu se mai aplică. Este cea mai simplă cale de a scăpa de amendă, cu condiția să acționezi rapid.</p><p>Atenție: rovinieta trebuie să acopere ziua în care ai fost depistat. O rovinietă cumpărată cu valabilitate începând de mâine nu te scutește de fapta constatată azi.</p><h2>Cum plătești sau contești amenda</h2><p>Dacă totuși ai primit procesul-verbal, ai la dispoziție 15 zile de la comunicare pentru a plăti jumătate din minimul amenzii – pentru faptele de după 1 octombrie 2026, asta înseamnă valoarea unei roviniete pe 12 luni (de exemplu 254 lei pentru un autoturism EURO VI); pentru faptele mai vechi rămâne 250 lei. Plata se poate face prin transfer bancar, pe Ghișeul.ro sau la trezorerie, iar dovada plății se trimite la CESTRIN.</p><p>Dacă ești convins că rovinieta era valabilă sau că vehiculul nu îți mai aparținea, poți depune contestație (plângere) la judecătoria competentă în termen de 15 zile de la comunicare. Este util să atașezi dovada plății rovinietei sau contractul de vânzare-cumpărare.</p>",
    "faq": [
      {
        "question": "Cât timp am la dispoziție să plătesc rovinieta după ce m-a prins camera?",
        "answer": "Poți cumpăra o rovinietă valabilă până la ora 24:00 a zilei următoare depistării, iar în acest caz amenda nu se mai aplică."
      },
      {
        "question": "Primesc mai multe amenzi dacă circul mai multe zile cu rovinieta expirată?",
        "answer": "Nu. Până la comunicarea procesului-verbal se aplică o singură amendă, indiferent de câte ori te înregistrează camerele în intervalul respectiv."
      },
      {
        "question": "Cum verific dacă rovinieta mea a expirat?",
        "answer": "Intri gratuit pe portal.etoll.ro (portalul oficial CNAIR), secțiunea Verificare Rovinietă, și introduci datele vehiculului. Sistemul îți arată dacă ai rovinietă valabilă și până când."
      },
      {
        "question": "Pot contesta amenda pentru rovinietă?",
        "answer": "Da, depui plângere la judecătorie în 15 zile de la comunicare, cu dovezi (rovinietă valabilă, contract de vânzare dacă ai vândut mașina)."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/290429",
        "label": "Legea nr. 275/2024 – plata rovinietei până la ora 24:00 a zilei următoare (legislatie.just.ro) ↗"
      },
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro – portalul oficial CNAIR (Rovinietă/TollRo) ↗"
      },
      {
        "url": "https://www.cnadnr.ro/ro/verificare-rovinieta",
        "label": "Verificare rovinietă după numărul de înmatriculare — pagina oficială CNAIR (cnadnr.ro) ↗"
      },
      {
        "url": "https://www.untrr.ro/media/wysiwyg/Tarife_Roviniete_1_oct_2026.pdf",
        "label": "Ordinul MTI nr. 888/2026 – tarife rovinietă de la 1 octombrie 2026, în lei, pe norme EURO (textul publicat în MO nr. 818/2026) ↗"
      },
      {
        "url": "https://portal.etoll.ro/web/guest/rovinieta",
        "label": "CNAIR – Tarife rovinietă (portal.etoll.ro) ↗"
      },
      {
        "url": "https://www.cnair.ro/",
        "label": "CNAIR ↗"
      }
    ]
  },
  {
    "slug": "carte-de-identitate-vehicul-pierduta",
    "url": "/ghid-auto/carte-de-identitate-vehicul-pierduta/",
    "title": "Carte de identitate vehicul pierdută 2026 – cum obții un duplicat CIV",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Ai pierdut cartea de identitate a vehiculului? Vezi cum obții un duplicat CIV la RAR în 2026: acte necesare, cost și pași reali.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Duplicatul cărții de identitate a vehiculului (CIV) se obține exclusiv de la Registrul Auto Român (RAR), pe bază de programare. Trebuie să depui o cerere, actul de identitate, dovada că ești deținătorul legal și, obligatoriu din 2018, să prezinți vehiculul pentru identificare. De regulă duplicatul se eliberează în 1-3 zile lucrătoare.",
    "docs": [
      "Cerere de eliberare a duplicatului CIV (formular RAR, completat olograf și semnat în fața angajatului RAR, prin care declari pe propria răspundere pierderea, furtul sau distrugerea CIV)",
      "Actul de identitate al solicitantului (original și copie)",
      "Documente care atestă calitatea de deținător legal (certificat de înmatriculare, contract de vânzare-cumpărare sau factură)",
      "Dovada plății tarifului RAR",
      "Împuternicire notarială, dacă cererea este depusă de altă persoană decât proprietarul"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Anunță pierderea sau furtul",
        "description": "Dacă documentul a fost furat, sesizează cea mai apropiată secție de poliție și păstrează dovada. Pentru pierdere sau distrugere este suficientă o declarație pe proprie răspundere."
      },
      {
        "num": 2,
        "title": "Fă o programare la RAR",
        "description": "Solicită programarea prin call-center-ul RAR sau prin platforma online de pe rarom.ro. Poți alege orice reprezentanță, indiferent de domiciliu."
      },
      {
        "num": 3,
        "title": "Pregătește dosarul",
        "description": "Completează cererea și adună actul de identitate plus documentele care dovedesc că ești proprietarul vehiculului."
      },
      {
        "num": 4,
        "title": "Prezintă vehiculul pentru identificare",
        "description": "Începând din 16.07.2018, prezentarea fizică a mașinii la RAR este obligatorie pentru eliberarea duplicatului CIV, în vederea verificării seriilor."
      },
      {
        "num": 5,
        "title": "Achită tariful și ridică duplicatul",
        "description": "După validarea dosarului plătești tariful, iar duplicatul se eliberează de regulă în 1-3 zile lucrătoare."
      }
    ],
    "costs": [
      {
        "item": "Tarif RAR eliberare duplicat CIV",
        "note": "variază în funcție de reprezentanță și de eventualele servicii; verifică tariful exact pe rarom.ro",
        "value": "aprox. 60-200 RON"
      }
    ],
    "proseHtml": "<h2>Ce este CIV și de ce contează</h2><p>Cartea de identitate a vehiculului (CIV) este documentul emis de Registrul Auto Român care atestă caracteristicile tehnice ale mașinii și lanțul proprietarilor. Fără ea nu poți vinde, transcrie sau radia vehiculul, motiv pentru care duplicatul devine urgent atunci când originalul dispare.</p><p>Spre deosebire de certificatul de înmatriculare (talonul), care se eliberează de serviciul de înmatriculări din cadrul MAI, CIV-ul este de competența exclusivă a RAR. Multe persoane confundă cele două documente și pierd timp la ghișeul greșit.</p><h2>Când ai nevoie de duplicat</h2><p>Duplicatul se emite în trei situații: pierdere, furt sau distrugere/deteriorare a CIV. În cazul furtului este recomandat să ai o dovadă de la poliție, iar pentru pierdere sau distrugere este suficientă o <a href=\"https://www.rarom.ro/?p=656\" target=\"_blank\" rel=\"noopener\">declarație pe proprie răspundere</a> dată în fața funcționarului RAR.</p><p>Dacă la momentul solicitării vrei să vinzi mașina, ține cont că fără CIV valid contractul de vânzare-cumpărare nu poate fi înregistrat, așa că duplicatul trebuie obținut înainte de tranzacție.</p><h2>Prezentarea vehiculului la RAR</h2><p>Cea mai importantă condiție, ignorată frecvent, este obligativitatea de a aduce mașina la reprezentanța RAR pentru identificare. Inspectorul verifică seria de șasiu și celelalte elemente de identificare pentru a preveni emiterea de duplicate pe vehicule furate sau modificate. Programează-te din timp, pentru că deplasarea cu vehiculul este esențială.</p><h2>Termene și sfaturi practice</h2><p>Dacă dosarul este complet, duplicatul se eliberează de obicei în 1-3 zile lucrătoare. Verifică din timp datele de pe vechiul CIV (serie șasiu, an fabricație) pentru a corela informațiile și evita respingerea cererii. Reține că poți circula legal cât timp ai certificat de înmatriculare și RCA valabile; lipsa CIV nu te împiedică să circuli, dar blochează nu doar vânzarea, transcrierea sau radierea, ci și eliberarea unui talon nou (de exemplu la schimbarea domiciliului) sau a unui duplicat de talon.</p>",
    "faq": [
      {
        "question": "Pot obține duplicatul CIV la orice reprezentanță RAR?",
        "answer": "Da, poți depune cererea la orice reprezentanță RAR din țară, indiferent de județul de domiciliu, pe bază de programare."
      },
      {
        "question": "Trebuie neapărat să aduc mașina?",
        "answer": "Da. Din 2018 prezentarea vehiculului pentru identificare este obligatorie pentru eliberarea duplicatului CIV."
      },
      {
        "question": "Pot circula fără cartea de identitate a vehiculului?",
        "answer": "Da, pentru circulația în trafic sunt suficiente certificatul de înmatriculare și RCA valabil. CIV este necesar însă pentru vânzare, transcriere, radiere, precum și pentru eliberarea unui talon nou după modificarea datelor (de exemplu schimbarea domiciliului) sau a unui duplicat de talon."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=656",
        "label": "Procedura pierdere/furt/distrugere CIV și duplicatul — RAR (pagină oficială) ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=254",
        "label": "RAR – Programări online ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/64364",
        "label": "OG 78/2000 privind omologarea și eliberarea cărții de identitate a vehiculelor (legislatie.just.ro) ↗"
      }
    ]
  },
  {
    "slug": "schimbare-culoare-masina-in-acte",
    "url": "/ghid-auto/schimbare-culoare-masina-in-acte/",
    "title": "Schimbare culoare mașină în acte 2026 – acte necesare și RAR",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Schimbare culoare mașină în acte 2026: când e obligatorie, acte necesare la RAR, taxe și cum obții talonul nou la DGPCI cu noua culoare înscrisă.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Trebuie să actualizezi actele doar dacă se schimbă culoarea dominantă a mașinii, prin vopsire sau prin colantare integrală. Depui dosarul la o reprezentanță RAR pentru înscrierea noii culori în cartea de identitate a vehiculului (CIV), apoi mergi la DGPCI pentru un certificat de înmatriculare (talon) nou. Colantările parțiale și elementele decorative care nu schimbă culoarea dominantă nu impun modificarea actelor.",
    "docs": [
      "Cartea de identitate a vehiculului (CIV) în original",
      "Actul de identitate al proprietarului (original și copie)",
      "Cererea de activitate RAR (se completează la ghișeu)",
      "Procura notarială, dacă nu ești proprietarul mașinii (pentru persoane juridice, delegație). Ai grijă să ai și RCA valabil: legea cere dovada RCA la modificarea CIV și a talonului (verificată de regulă electronic).",
      "Certificatul de înmatriculare (talon) - pentru pasul de la DGPCI (fostul DRPCIV)",
      "Cererea pentru eliberarea unui nou certificat de înmatriculare"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică dacă se schimbă culoarea dominantă",
        "description": "Actualizarea actelor este necesară doar dacă vopsirea sau colantarea integrală schimbă culoarea predominantă a vehiculului."
      },
      {
        "num": 2,
        "title": "Fă programare la RAR",
        "description": "Programează-te online prin secțiunea Programări Online de pe rarom.ro (sistemul portal.rarom.ro/rar-public/appointment), alegând activitatea de modificare a datelor din CIV pentru reprezentanța RAR dorită, sau telefonic la 021 9672."
      },
      {
        "num": 3,
        "title": "Prezintă mașina la RAR",
        "description": "Inspectorul verifică vehiculul și înscrie noua culoare în cartea de identitate a vehiculului (CIV)."
      },
      {
        "num": 4,
        "title": "Mergi la DGPCI pentru talon nou",
        "description": "Cu CIV actualizat, depui la Serviciul de Înmatriculări cererea pentru un certificat de înmatriculare nou, cu noua culoare."
      },
      {
        "num": 5,
        "title": "Plătește taxa și ridică talonul",
        "description": "Achiți taxa de 76 lei (tarif în vigoare de la 15.09.2026; plățile făcute anterior la tariful vechi nu mai sunt acceptate), pe ghiseul.ro, și primești certificatul de înmatriculare actualizat."
      }
    ],
    "costs": [
      {
        "item": "Modificare culoare în CIV (RAR)",
        "note": "Verifică tariful exact pe rarom.ro",
        "value": "~200 - 250 RON"
      },
      {
        "item": "Certificat de înmatriculare (talon) nou",
        "note": "Se achită pe ghiseul.ro",
        "value": "76 RON (de la 15.09.2026)"
      }
    ],
    "proseHtml": "<h2>Când trebuie să schimbi culoarea în acte</h2><p>Regula esențială este culoarea dominantă. Dacă vopsești integral mașina sau o colantezi complet într-o altă culoare, iar culoarea predominantă înscrisă în acte nu mai corespunde, ești obligat să actualizezi cartea de identitate a vehiculului și certificatul de înmatriculare. Dacă însă aplici doar elemente decorative, dungi, autocolante sau o colantare parțială care nu modifică culoarea dominantă, actele rămân neschimbate.</p><p>Practic, dacă la un control în trafic culoarea reală a mașinii nu se potrivește cu cea din talon, poți primi sancțiune pentru documente neconforme. De aceea, colantarea integrală care schimbă aspectul general se tratează la fel ca o revopsire.</p><h2>Procedura în doi pași: RAR și DGPCI</h2><p>Modificarea se face în două etape. Prima este la RAR, unde se înscrie noua culoare în CIV pe baza <a href=\"https://www.rarom.ro/?page_id=254\" target=\"_blank\" rel=\"noopener\">cererii de activitate</a> și a verificării vehiculului. A doua este la <a href=\"https://dgpci.mai.gov.ro/\" target=\"_blank\" rel=\"noopener\">DGPCI</a> (Serviciul de Înmatriculări), unde, pe baza CIV actualizat, se eliberează un certificat de înmatriculare nou. Nu poți sări peste pasul de la RAR: talonul nou se emite doar după ce culoarea apare corect în cartea de identitate a vehiculului.</p><h2>Costuri și termene</h2><p>Costurile sunt reduse comparativ cu lucrarea de vopsire sau colantare în sine: o taxă la RAR pentru modificarea în CIV și taxa pentru noul talon la DGPCI, achitabilă pe ghiseul.ro. Legea îți dă un termen clar: ai la dispoziție cel mult 30 de zile de la schimbarea culorii pentru a cere noul certificat de înmatriculare, așa că programează-te la RAR imediat după vopsire sau colantare.</p><h2>Capcane frecvente</h2><p>Cea mai frecventă neînțelegere este legată de colantare: mulți cred că nu trebuie schimbat nimic în acte pentru că vopseaua originală rămâne dedesubt. RAR privește însă culoarea vizibilă a vehiculului, nu stratul de sub folie, așa că o colantare integrală care schimbă culoarea dominantă necesită actualizarea documentelor exact ca o revopsire.</p>",
    "faq": [
      {
        "question": "Trebuie să schimb actele dacă doar am colantat parțial mașina?",
        "answer": "Nu, dacă culoarea dominantă rămâne aceeași. Elementele decorative, dungile sau colantarea parțială care nu schimbă culoarea predominantă nu impun modificarea actelor."
      },
      {
        "question": "Pot merge direct la DGPCI pentru talon nou?",
        "answer": "Nu. Întâi mergi la RAR ca să înscrii noua culoare în CIV, apoi la DGPCI pentru certificatul de înmatriculare actualizat."
      },
      {
        "question": "Am nevoie de o dovadă de la vopsitorie?",
        "answer": "Documentul de bază este CIV, actul de identitate și cererea de activitate la RAR. Verificarea culorii se face pe vehiculul prezentat la inspecție."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=254",
        "label": "Programări online RAR ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI - Înmatriculări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plata taxelor ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=668",
        "label": "RAR – Cum să procedez dacă am schimbat culoarea vehiculului? ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/document-details/inmatriculari/673dac1b78b3ca04620e1dae",
        "label": "DGPCI – Documente necesare pentru certificatul de înmatriculare ↗"
      }
    ]
  },
  {
    "slug": "verificare-serie-sasiu-rar",
    "url": "/ghid-auto/verificare-serie-sasiu-rar/",
    "title": "Verificare serie șasiu RAR 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Verificare serie șasiu RAR 2026: unde găsești VIN-ul, cum compari seria ștanțată cu actele și cum ceri identificarea fizică la RAR.",
    "updateDate": "🗓 Actualizat 23 Iulie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Seria de șasiu (VIN) are 17 caractere și se verifică comparând seria ștanțată pe caroserie cu cea din certificatul de înmatriculare (talon) și din CIV. Dacă seria este greu lizibilă, corodată sau apar neconcordanțe, poți cere identificarea vehiculului la o reprezentanță RAR, unde inspectorul verifică efectiv seria ștanțată și corespondența cu documentele. Verificarea este esențială înainte de a cumpăra o mașină second-hand, ca să detectezi kilometraj modificat, documente falsificate sau vehicule furate.",
    "docs": [
      "Seria de șasiu / VIN-ul vehiculului (17 caractere)",
      "Certificatul de înmatriculare și CIV (pentru comparație cu seria de pe caroserie)",
      "Actul de identitate al solicitantului (pentru verificarea fizică la RAR)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Găsește seria de șasiu (VIN)",
        "description": "VIN-ul are 17 caractere și se află pe caroserie (ex. în compartimentul motor, pe montantul ușii sau sub parbriz), dar și în talon și în CIV."
      },
      {
        "num": 2,
        "title": "Compară seria ștanțată cu actele mașinii",
        "description": "Verifică dacă seria de pe caroserie coincide, caracter cu caracter, cu cea din talon și din CIV, și dacă zona ștanțării nu are urme de intervenție."
      },
      {
        "num": 3,
        "title": "Programează-te la o reprezentanță RAR (dacă e cazul)",
        "description": "Dacă apar neconcordanțe sau seria e greu lizibilă/corodată, fă o programare pe portalul oficial RAR (portal.rarom.ro) sau direct la reprezentanță, pentru identificarea vehiculului."
      },
      {
        "num": 4,
        "title": "Prezintă vehiculul pentru identificarea fizică",
        "description": "Vino cu mașina, cu certificatul de înmatriculare, CIV-ul și actul tău de identitate; inspectorul RAR verifică seria ștanțată și corespondența cu documentele, iar tariful se verifică pe rarom.ro."
      }
    ],
    "costs": [
      {
        "item": "Verificare / identificare fizică la RAR",
        "note": "Parte a serviciului de identificare a vehiculului",
        "value": "verifică pe rarom.ro"
      }
    ],
    "proseHtml": "<h2>De ce verifici seria de șasiu</h2><p>Seria de șasiu, cunoscută și ca VIN (Vehicle Identification Number), este codul unic de 17 caractere atribuit de producător fiecărui vehicul. Este cel mai sigur reper de identificare, mult mai greu de falsificat decât numărul de înmatriculare. Verificarea ei este importantă mai ales înainte de a cumpăra o mașină second-hand: dacă seria de pe caroserie nu coincide cu cea din acte, poate fi semn de fraudă - documente falsificate, kilometraj modificat sau chiar vehicul furat.</p><h2>Unde găsești seria de șasiu și cum o compari cu actele</h2><p>VIN-ul este ștanțat pe caroserie - de obicei în compartimentul motor, pe montantul ușii șoferului sau vizibil sub parbriz - și apare, de asemenea, în certificatul de înmatriculare (talon) și în cartea de identitate a vehiculului (CIV). Notează seria din toate cele trei surse și compară-le caracter cu caracter: aici începe orice verificare serioasă. Un singur caracter diferit, o ștanțare neuniformă sau urme de intervenție în zona seriei sunt motive suficiente ca să nu mergi mai departe fără o verificare oficială.</p><h2>Verificarea fizică la reprezentanța RAR</h2><p>Compară întotdeauna seria fizică de pe mașină cu cea din talon și din CIV. Când seria este greu lizibilă, corodată sau există suspiciuni, poți solicita la o <a href=\"https://www.rarom.ro/?page_id=254\" target=\"_blank\" rel=\"noopener\">reprezentanță RAR</a> identificarea vehiculului, în cadrul căreia inspectorul verifică efectiv seria ștanțată și corespondența cu documentele. Acest pas este necesar și în situații de înmatriculare când identitatea trebuie confirmată oficial. Programarea se face pe <a href=\"https://portal.rarom.ro/rar-public/appointment\" target=\"_blank\" rel=\"noopener\">portalul oficial de programări RAR</a> sau direct la reprezentanță, iar la prezentare ai nevoie de vehicul, de certificatul de înmatriculare și CIV, plus actul tău de identitate. Identificarea fizică face parte din serviciul de identificare a vehiculului, așa că tariful se verifică pe rarom.ro înainte de programare.</p><h2>Capcane frecvente la mașinile SH</h2><p>Nu te baza doar pe kilometrajul afișat la bord: valorile succesive ale kilometrajului sunt transmise de stațiile ITP și de unitățile autorizate către registrul electronic al istoricului vehiculelor, introdus prin <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/270745\" target=\"_blank\" rel=\"noopener\">Legea nr. 142/2023</a>, iar o scădere între două înregistrări indică un kilometraj dat înapoi. Datele de istoric ale unui vehicul se obțin de la RAR; ce anume poate fi eliberat și în ce condiții se verifică direct pe rarom.ro. Verifică și dacă VIN-ul din anunț coincide cu cel de pe mașină și din acte, și fii precaut la vehiculele fără CIV valabil sau cu ITP expirat de mult. O neconcordanță de o singură cifră între seria de pe caroserie și cea din acte este suficientă ca să renunți la achiziție până la clarificare.</p>",
    "faq": [
      {
        "question": "Unde găsesc seria de șasiu (VIN) pe mașină?",
        "answer": "Pe caroserie - de obicei în compartimentul motor, pe montantul ușii șoferului sau vizibil sub parbriz - dar și înscrisă în talon și în cartea de identitate a vehiculului."
      },
      {
        "question": "Ce fac dacă seria de pe mașină nu coincide cu cea din acte?",
        "answer": "Nu finaliza tranzacția. O neconcordanță poate indica fraudă. Solicită o verificare de identitate la o reprezentanță RAR înainte de a cumpăra."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/270745",
        "label": "Legea nr. 142/2023 – registrul electronic al istoricului vehiculelor (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) – site oficial ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=254",
        "label": "RAR – Programări și informații (pagina oficială Registrul Auto Român) ↗"
      },
      {
        "url": "https://portal.rarom.ro/rar-public/appointment",
        "label": "Programări online RAR – portalul oficial de programare ↗"
      }
    ]
  },
  {
    "slug": "certificat-de-autenticitate-rar",
    "url": "/ghid-auto/certificat-de-autenticitate-rar/",
    "title": "Certificat de autenticitate RAR 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Certificat de autenticitate RAR 2026: ce este, când e necesar, acte necesare, costuri estimative, valabilitate și cum programezi verificarea vehiculului.",
    "updateDate": "🗓 Actualizat 23 Iulie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Certificatul de autenticitate RAR este documentul prin care Registrul Auto Român confirmă că seria de șasiu și elementele de identificare ale vehiculului corespund actelor și nu au fost modificate. Verificarea autenticității este obligatorie la prima înmatriculare în România a unui vehicul rulat (inclusiv din UE); pentru vehiculele deja înmatriculate nu mai este obligatorie la schimbarea proprietarului, dar rămâne recomandată. Programarea se face online pe platforma oficială RAR de programări (portal.rarom.ro/rar-public/appointment, accesibilă din secțiunea Programări de pe rarom.ro), iar vehiculul trebuie prezentat fizic la reprezentanța RAR.",
    "docs": [
      "Actul de identitate al proprietarului (original și copie)",
      "Documentul de înmatriculare din țara de origine (pentru vehicule importate)",
      "Dovada proprietății (contract de vânzare-cumpărare, factură sau talon)",
      "Cererea tip (completată la sediul RAR)",
      "Dovada plății tarifului RAR",
      "Împuternicire notarială (dacă nu se prezintă proprietarul din acte)",
      "Vehiculul prezentat fizic pentru identificare"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Programează-te online",
        "description": "Faci programare pe platforma oficială de programări RAR (portal.rarom.ro/rar-public/appointment, link disponibil pe rarom.ro la secțiunea Programări) la o reprezentanță RAR din apropiere. Programările telefonice se fac numai la 021 9672."
      },
      {
        "num": 2,
        "title": "Pregătește actele și vehiculul",
        "description": "Aduni documentele de proprietate și de proveniență și te asiguri că vehiculul poate fi prezentat pentru inspecție."
      },
      {
        "num": 3,
        "title": "Prezintă vehiculul la RAR",
        "description": "Te prezinți la data programată; inspectorul RAR verifică fizic seria de șasiu și elementele de identificare, comparându-le cu actele."
      },
      {
        "num": 4,
        "title": "Primești certificatul",
        "description": "Dacă totul corespunde, RAR eliberează certificatul de autenticitate, valabil pentru o singură înmatriculare, dar nu mai mult de 60 de zile calendaristice de la data eliberării."
      },
      {
        "num": 5,
        "title": "Folosește-l la înmatriculare",
        "description": "Depui certificatul, împreună cu celelalte documente, la dosarul de înmatriculare, în termenul de valabilitate."
      }
    ],
    "costs": [
      {
        "item": "Certificat de autenticitate (vehicul înmatriculat în RO)",
        "note": "Tarif estimativ; verifică valoarea exactă pe rarom.ro",
        "value": "~200 lei"
      },
      {
        "item": "Verificare autenticitate vehicul importat",
        "note": "De regulă inclusă în pachetul de primă înmatriculare",
        "value": "~450 lei"
      },
      {
        "item": "Pachet primă înmatriculare (verificare + CIV + ITP)",
        "note": "Variază după categoria și masa vehiculului",
        "value": "~540-850 lei"
      }
    ],
    "proseHtml": "<h2>Ce este și ce confirmă</h2><p>Certificatul de autenticitate este documentul emis de Registrul Auto Român (RAR) care atestă că vehiculul corespunde datelor de identificare din acte: seria de șasiu este originală, elementele de identificare nu au fost modificate, iar mașina se potrivește cu documentele prezentate. Verificarea se face fizic, la reprezentanțele RAR, de către un inspector.</p><h2>Când este obligatoriu și când este doar recomandat</h2><p>Verificarea autenticității este obligatorie la prima înmatriculare în România a unui vehicul rulat, inclusiv a celor aduse din Uniunea Europeană. În schimb, pentru vehiculele deja înmatriculate în România, certificatul nu mai este obligatoriu la schimbarea proprietarului. Cu toate acestea, RAR îl recomandă înainte de orice achiziție second-hand, tocmai pentru a evita surprizele legate de identitatea reală a mașinii.</p><h2>Cum decurge procedura</h2><p>Procedura începe cu o programare online pe platforma oficială de programări RAR (<a href=\"https://portal.rarom.ro/rar-public/appointment\" target=\"_blank\" rel=\"noopener\">portal.rarom.ro/rar-public/appointment</a>) și plata tarifului. La data stabilită, prezinți vehiculul la reprezentanța RAR, unde inspectorul verifică seria de șasiu și celelalte elemente de identificare. Dacă totul corespunde, primești certificatul. Este esențial ca vehiculul să fie prezent fizic - fără el, verificarea nu poate fi făcută.</p><h2>Costuri și valabilitate</h2><p>Tarifele RAR variază în funcție de categoria și masa vehiculului. Pentru un vehicul deja înmatriculat în România, certificatul de autenticitate costă în jur de <a href=\"https://www.rarom.ro/?p=8211\" target=\"_blank\" rel=\"noopener\">200 lei</a> (conform RAR, \"aproximativ 200 lei\"), iar pentru vehiculele importate verificarea este mai amplă și de regulă face parte dintr-un pachet de primă înmatriculare de aproximativ 540-850 lei, care include și cartea de identitate a vehiculului (CIV) și, uneori, ITP. Certificatul este valabil pentru o singură înmatriculare, dar nu mai mult de <a href=\"https://www.rarom.ro/?page_id=619\" target=\"_blank\" rel=\"noopener\">60 de zile calendaristice</a> de la data eliberării, interval în care trebuie finalizată înmatricularea. Verifică valorile exacte pe site-ul oficial rarom.ro.</p><h2>Capcane frecvente</h2><ul><li>Nu depăși termenul de valabilitate de 60 de zile calendaristice, altfel va trebui să reiei verificarea.</li><li>Dacă nu ești proprietarul din acte, ai nevoie de o împuternicire notarială pentru a prezenta vehiculul.</li></ul>",
    "faq": [
      {
        "question": "Certificatul de autenticitate RAR este obligatoriu?",
        "answer": "Este obligatoriu la prima înmatriculare în România a unui vehicul rulat, inclusiv din UE. Pentru vehiculele deja înmatriculate nu mai este obligatoriu la schimbarea proprietarului, dar rămâne recomandat."
      },
      {
        "question": "Cât costă certificatul de autenticitate?",
        "answer": "Pentru un vehicul înmatriculat în România, în jur de 200 lei (RAR indică \"aproximativ 200 lei\"); pentru cele importate, verificarea face parte de regulă din pachetul de primă înmatriculare. Verifică tariful exact pe rarom.ro."
      },
      {
        "question": "Cât este valabil certificatul?",
        "answer": "Certificatul este valabil pentru o singură înmatriculare, dar nu mai mult de 60 de zile calendaristice de la data eliberării, interval în care trebuie finalizată înmatricularea vehiculului."
      },
      {
        "question": "Trebuie să aduc mașina la RAR?",
        "answer": "Da. Vehiculul se prezintă fizic pentru ca inspectorul RAR să verifice seria de șasiu și elementele de identificare."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) — site oficial ↗"
      },
      {
        "url": "https://portal.rarom.ro/rar-public/appointment",
        "label": "Programare online RAR — portal oficial de programări (portal.rarom.ro) ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=619",
        "label": "Certificarea autenticității vehiculelor rutiere (valabilitate certificat) — RAR ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=254",
        "label": "Programări RAR — informații oficiale (platforma de programări) — RAR ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=8211",
        "label": "Ce trebuie să știu când achiziționez un vehicul utilizat (tarif ~200 lei) — RAR ↗"
      }
    ]
  },
  {
    "slug": "montare-carlig-remorcare-si-omologare",
    "url": "/ghid-auto/montare-carlig-remorcare-si-omologare/",
    "title": "Montare cârlig remorcare și omologare 2026 – acte necesare și RAR",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Montare cârlig remorcare și omologare 2026: trebuie omologat la RAR sau trecut în talon? Ce marcaj de omologare cauți, costuri de montaj și reguli legale.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Cârligul de remorcare standard, omologat de producător (marcaj conform Regulamentului CEE-ONU nr. 55 sau Directivei 94/20/CE), nu are nevoie de o omologare individuală. Din iunie 2023, RAR poate însă înscrie dispozitivul de cuplare în cartea de identitate a vehiculului, dacă prezinți mașina cu cârligul montat și documentele de montaj de la atelierul autorizat. Mașina trebuie să aibă trecută în certificatul de înmatriculare masa remorcabilă (rubricile O.1/O.2). Condiția esențială este să cumperi un cârlig original, cu marca de omologare vizibilă (conform reglementărilor UE privind dispozitivele de cuplare), și să îl montezi profesionist, într-un service autorizat.",
    "docs": [
      "Factura de achiziție a cârligului (dovada că este produs original, omologat)",
      "Certificatul / eticheta de omologare a cârligului (cu marca de tip vizibilă)",
      "Documentul de la service-ul care a efectuat montajul (recomandat, ca dovadă a instalării corecte)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege un cârlig omologat și compatibil",
        "description": "Verifică întâi în certificatul de înmatriculare că mașina are o masă remorcabilă omologată (rubricile O.1/O.2), apoi cumpără un produs original, dintr-o sursă autorizată, dedicat modelului tău de mașină. Verifică prezența mărcii de omologare aplicate vizibil pe dispozitiv."
      },
      {
        "num": 2,
        "title": "Programează montajul la un service autorizat",
        "description": "Montajul cârligului și al instalației electrice (priza pentru semnalizare) trebuie făcut profesionist, pentru a nu afecta siguranța și structura mașinii."
      },
      {
        "num": 3,
        "title": "Verifică instalația electrică",
        "description": "Priza cu 7 sau 13 pini trebuie conectată corect, astfel încât luminile remorcii (stopuri, semnalizare, frână) să funcționeze sincron cu cele ale mașinii."
      },
      {
        "num": 4,
        "title": "Păstrează documentele",
        "description": "Păstrează factura și certificatul de omologare al cârligului. Pentru un cârlig standard omologat nu e nevoie de omologare individuală; dacă vrei ca dispozitivul să apară în cartea de identitate a vehiculului, RAR îl poate înscrie pe baza documentelor de montaj și a inspecției mașinii cu cârligul montat."
      }
    ],
    "costs": [
      {
        "item": "Cârlig de remorcare (dispozitiv)",
        "note": "Variază în funcție de marca mașinii și tipul cârligului (fix, detașabil, rabatabil)",
        "value": "~300 - 2.500 RON"
      },
      {
        "item": "Manoperă montaj",
        "note": "Depinde de complexitatea instalației electrice și a montajului",
        "value": "~150 - 750 RON"
      },
      {
        "item": "Omologare RAR",
        "note": "Nu este necesară pentru un cârlig standard, omologat de producător",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Trebuie omologat cârligul la RAR?</h2><p>Este întrebarea cea mai frecventă și răspunsul, valabil și în 2026, este nu - pentru un cârlig de remorcare standard. Deși regula generală spune că orice modificare adusă unui vehicul trebuie omologată la RAR, cârligele de remorcare fac excepție: ele sunt deja omologate de producător. Prin urmare, nu ai nevoie de o omologare individuală la RAR. Din iunie 2023, RAR poate înscrie cârligul în cartea de identitate a vehiculului (CIV, documentul RAR, diferit de talon), dacă prezinți mașina cu dispozitivul montat complet și documentele de montaj de la un atelier autorizat. Verifică și ca mașina să aibă trecută masa remorcabilă în certificatul de înmatriculare (rubricile O.1/O.2): fără ea nu poți tracta legal.</p><p>Condiția obligatorie este ca dispozitivul să fie omologat corespunzător și să aibă marca de omologare aplicată vizibil, conform reglementărilor europene privind dispozitivele mecanice de cuplare. De aceea trebuie să eviți cârligele artizanale sau fără marcaj.</p><h2>De ce contează originalitatea și marcajul</h2><p>Un cârlig omologat are un număr de serie și o marcă de tip care pot fi verificate. Acest marcaj atestă că dispozitivul a fost testat pentru rezistență și pentru sarcina maximă pe care o poate tracta. Un cârlig neomologat sau montat prost nu doar că este periculos, dar te poate pune în situația de a fi tras la răspundere dacă provoacă un accident prin cedare. Nu cumpăra cârlige la mâna a doua, la care uzura și defectele ascunse nu pot fi evaluate.</p><h2>Montajul: de ce trebuie făcut profesionist</h2><p>Montarea cârligului implică fixarea pe structura de rezistență a mașinii și conectarea unei instalații electrice pentru priza remorcii (cu 7 sau 13 pini). Un montaj neprofesionist poate slăbi caroseria sau poate provoca scurtcircuite. La un service autorizat, luminile remorcii - poziție, semnalizare, frână - vor funcționa sincronizat cu cele ale mașinii, iar unele autovehicule moderne necesită și codare electronică pentru recunoașterea remorcii.</p><h2>Reguli de circulație și situații speciale</h2><p>Nu există amendă pentru simplul fapt de a avea un cârlig montat, chiar și atunci când nu tractezi nimic. Totuși, ai grijă ca un cârlig detașabil sau rabatabil să nu acopere plăcuța de înmatriculare atunci când nu tractezi. Pentru vehicule mai vechi, modificate substanțial sau la care ai dubii privind compatibilitatea, este prudent să verifici direct cu RAR dacă situația ta necesită o evaluare specială. Reține și că, pentru a tracta o remorcă grea, contează categoria de permis (B, B96 sau BE), în funcție de masa ansamblului.</p>",
    "faq": [
      {
        "question": "Trebuie trecut cârligul de remorcare în talon?",
        "answer": "Pentru un cârlig standard omologat de producător nu e nevoie de omologare individuală la RAR. Din iunie 2023, RAR poate însă înscrie dispozitivul de cuplare în cartea de identitate a vehiculului (CIV), dacă prezinți mașina cu cârligul montat și documentele de montaj de la un atelier autorizat. Talonul (certificatul de înmatriculare) trebuie să conțină masa remorcabilă (O.1/O.2)."
      },
      {
        "question": "Se dă amendă dacă am cârlig montat, dar nu tractez nimic?",
        "answer": "Nu. Este legal să circuli cu cârligul montat fără remorcă. Ai grijă doar ca un cârlig detașabil să nu acopere plăcuța de înmatriculare."
      },
      {
        "question": "Ce marcaj trebuie să aibă un cârlig omologat?",
        "answer": "Trebuie să aibă marca de omologare aplicată vizibil, conform reglementărilor europene pentru dispozitive de cuplare, plus un număr de serie verificabil."
      },
      {
        "question": "Pot monta singur cârligul?",
        "answer": "Nu este recomandat. Montajul afectează structura mașinii și instalația electrică, așa că trebuie făcut într-un service autorizat, pentru siguranță și funcționarea corectă a luminilor remorcii."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.rarom.ro/",
        "label": "RAR - Registrul Auto Român ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "montare-gpl-si-omologare",
    "url": "/ghid-auto/montare-gpl-si-omologare/",
    "title": "Montare GPL și omologare 2026 – acte necesare, costuri și procedură RAR",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Montare GPL și omologare RAR în 2026: acte necesare, costuri, pași și cum înscrii instalația în CIV pentru a circula legal cu talonul actualizat.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Ca să circuli legal cu GPL, instalația trebuie montată într-un service autorizat RAR, cu componente certificate, apoi omologată la o reprezentanță RAR și înscrisă în cartea de identitate a vehiculului (CIV). Ulterior soliciți la DGPCI un certificat de înmatriculare (talon) nou, care menționează alimentarea bicarburant (benzină + GPL).",
    "docs": [
      "Actul de identitate al proprietarului (original și copie)",
      "Cartea de identitate a vehiculului (CIV) în original",
      "Certificatul de înmatriculare (talon) în original",
      "Certificatul de garanție al instalației GPL montate",
      "Declarația de conformitate emisă de unitatea care a făcut montajul",
      "Manualul de utilizare / instrucțiunile instalației GPL",
      "Cererea de activitate RAR (se completează la ghișeu)",
      "Procura notarială, dacă nu ești proprietarul vehiculului (pentru persoane juridice, delegație). Ai grijă să ai și RCA valabil: legea cere dovada RCA la modificarea CIV (verificată de regulă electronic)."
    ],
    "steps": [
      {
        "num": 1,
        "title": "Montează instalația la un service autorizat RAR",
        "description": "Alege o unitate autorizată de Registrul Auto Român și componente omologate/certificate RAR. Montajul improvizat sau în ateliere neautorizate nu este acceptat la omologare."
      },
      {
        "num": 2,
        "title": "Primește documentele de la montator",
        "description": "La finalul lucrării ceri certificatul de garanție al instalației, declarația de conformitate și manualul de utilizare, toate cu datele mașinii și ale instalației."
      },
      {
        "num": 3,
        "title": "Fă programare la RAR",
        "description": "Programează-te online pe portalul oficial RAR, https://portal.rarom.ro/rar-public/appointment (sau telefonic la 021/9672), selectând activitatea de modificări CIV, pentru reprezentanța RAR dorită."
      },
      {
        "num": 4,
        "title": "Prezintă mașina la reprezentanța RAR",
        "description": "Inspectorul verifică montajul, siguranța instalației și emisiile în ambele moduri de alimentare (benzină și GPL)."
      },
      {
        "num": 5,
        "title": "Înscrie instalația în CIV",
        "description": "Dacă totul este conform, RAR înscrie instalația GPL și modul de alimentare bicarburant în cartea de identitate a vehiculului."
      },
      {
        "num": 6,
        "title": "Schimbă talonul la DGPCI",
        "description": "Cu CIV actualizat, soliciți la Serviciul de Înmatriculări, în cel mult 30 de zile de la modificare, un certificat de înmatriculare nou care menționează GPL-ul. Taxa (76 lei de la 15.09.2026) se poate plăti pe ghiseul.ro."
      }
    ],
    "costs": [
      {
        "item": "Instalația GPL + montaj",
        "note": "Variază după numărul de cilindri și tipul motorului (injecție directă = mai scump)",
        "value": "3.500 - 10.000+ RON"
      },
      {
        "item": "Omologare RAR și modificare CIV",
        "note": "Verifică tariful exact pe rarom.ro",
        "value": "~200 - 300 RON"
      },
      {
        "item": "Certificat de înmatriculare (talon) nou",
        "note": "Se achită pe ghiseul.ro",
        "value": "76 RON (de la 15.09.2026)"
      }
    ],
    "proseHtml": "<h2>De ce este obligatorie omologarea GPL</h2><p>Montarea unei instalații GPL este o modificare tehnică majoră a autovehiculului. Legea nu interzice GPL-ul, dar impune ca sistemul să fie montat corect și înscris în actele mașinii. Fără înscrierea instalației în cartea de identitate a vehiculului (CIV), mașina este considerată neconformă cu configurația omologată, iar la un control în trafic riști amendă și reținerea certificatului de înmatriculare.</p><p>În practică, cea mai frecventă greșeală este să montezi instalația și să amâni pasul de la RAR. Chiar dacă mașina merge, din punct de vedere legal circuli neregulamentar până când modificarea apare în CIV și în talon.</p><h2>Condiții pe care trebuie să le respecți</h2><p>RAR acceptă la omologare doar instalațiile ai căror producători au obținut certificarea și numai dacă montajul s-a făcut într-o unitate autorizată de Registrul Auto Român. Componentele improvizate, buteliile fără certificare sau montajul într-un service neautorizat duc la respingerea dosarului.</p><ul><li>Componentele instalației trebuie să fie omologate și compatibile cu vehiculul tău.</li><li>Montajul se face exclusiv la un service autorizat RAR.</li><li>La inspecție se verifică etanșeitatea, siguranța și emisiile poluante.</li></ul><h2>Rezervorul și verificările periodice</h2><p>Rezervorul (butelia) de GPL are o durată de viață limitată, în general 10 ani de la fabricație, după care trebuie înlocuit integral, nu doar verificat. Ține cont de acest termen când cumperi o mașină cu GPL deja montat: dacă rezervorul este aproape de limită, vei avea un cost suplimentar.</p><p>La inspecția tehnică periodică (ITP), instalația GPL este verificată suplimentar, așa că trebuie să fie funcțională și fără scurgeri.</p><h2>Merită financiar?</h2><p>GPL-ul costă în jur de jumătate din prețul benzinei, iar amortizarea investiției apare de obicei după 20.000 - 30.000 km, în funcție de consum și de prețul instalației. Pentru cine rulează mult, economia este reală; pentru un rulaj mic, perioada de amortizare se prelungește considerabil.</p>",
    "faq": [
      {
        "question": "Pot monta GPL-ul singur sau la orice service?",
        "answer": "Nu, dacă vrei să omologhezi legal instalația. Montajul trebuie făcut la un service autorizat RAR, cu componente certificate, altfel dosarul este respins la omologare."
      },
      {
        "question": "Ce se întâmplă dacă nu înscriu GPL-ul în acte?",
        "answer": "Mașina circulă neconform cu configurația omologată. La control riști amendă și reținerea certificatului de înmatriculare până la punerea în regulă a documentelor."
      },
      {
        "question": "Trebuie schimbat talonul după montarea GPL?",
        "answer": "Da. După ce RAR trece modificarea în CIV, mergi la DGPCI pentru un certificat de înmatriculare nou care menționează alimentarea bicarburant."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://portal.rarom.ro/rar-public/appointment",
        "label": "Programări online RAR (portal.rarom.ro) ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=254",
        "label": "RAR – Programări: pagina oficială (informații și acces la programare, rarom.ro) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI - Înmatriculări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plata taxelor ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=8973",
        "label": "RAR – Cum procedez dacă am montat o instalație GPL sau GNC? (FAQ oficial) ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=295166",
        "label": "RAR – Autovehicule cu instalații de GPL: legislație și siguranța în exploatare ↗"
      },
      {
        "url": "https://www.rarom.ro/?page_id=891",
        "label": "RAR – Ateliere autorizate montare/reparare/revizie instalații GPL și GNC ↗"
      }
    ]
  },
  {
    "slug": "omologare-individuala-rar",
    "url": "/ghid-auto/omologare-individuala-rar/",
    "title": "Omologare individuală RAR 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Omologare individuală RAR 2026: când e necesară, ce acte îți trebuie, costuri (de la ~1.200 RON) și pașii până la eliberarea CIV.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Omologarea individuală la RAR se face pentru vehiculele care nu au o omologare de tip (CE) valabilă sau care au fost modificate față de configurația omologată. Este o procedură mai amplă decât eliberarea directă a CIV: prezinți mașina la o reprezentanță RAR, se verifică tehnic și de identitate, iar în unele cazuri se fac probe dinamice, după care se emite cartea de identitate a vehiculului necesară înmatriculării.",
    "docs": [
      "Cererea de activitate RAR (se completează la ghișeu)",
      "Actul de identitate al solicitantului (original și copie)",
      "Documentele vehiculului din țara de origine (ex. Brief - Germania, Carte Grise - Franța)",
      "Certificatul de conformitate (COC), dacă există",
      "Dovada de proveniență (factură sau contract de vânzare-cumpărare)",
      "Dovada plății tarifelor RAR",
      "Documente pentru modificările efectuate (dacă vehiculul a fost modificat)",
      "Procura notarială, dacă depui dosarul pentru altcineva"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică dacă ai nevoie de omologare individuală",
        "description": "Dacă vehiculul are omologare CE valabilă și este nemodificat, RAR eliberează CIV direct. Omologarea individuală apare când lipsește omologarea de tip sau vehiculul a fost modificat."
      },
      {
        "num": 2,
        "title": "Fă programare la RAR",
        "description": "Programează-te online pe portalul oficial RAR (portal.rarom.ro/rar-public/appointment) sau telefonic la 021 9672, la categoria potrivită (omologare / modificări CIV), pentru reprezentanța RAR aleasă."
      },
      {
        "num": 3,
        "title": "Prezintă vehiculul la reprezentanță",
        "description": "La inspecție se face identificarea vehiculului (serie șasiu, date tehnice) și verificarea conformității cu cerințele tehnice și de siguranță."
      },
      {
        "num": 4,
        "title": "Efectuează probele necesare",
        "description": "În cazurile complexe (modificări majore, motor schimbat, vehicul unicat) se pot cere probe dinamice suplimentare, care cresc durata și costul."
      },
      {
        "num": 5,
        "title": "Primește CIV",
        "description": "Dacă vehiculul îndeplinește condițiile, RAR emite cartea de identitate a vehiculului, document obligatoriu pentru înmatriculare la DGPCI."
      }
    ],
    "costs": [
      {
        "item": "Omologare individuală (caz simplu)",
        "note": "Poate depăși 3.000 RON în funcție de verificări",
        "value": "de la ~1.200 RON"
      },
      {
        "item": "Omologare cu probe dinamice",
        "note": "Depinde de complexitatea probelor și de norma de poluare",
        "value": "~4.000 - 6.000 RON"
      },
      {
        "item": "Eliberare carte de identitate (CIV)",
        "note": "Tarif separat de cel al omologării",
        "value": "verifică pe rarom.ro"
      }
    ],
    "proseHtml": "<h2>Ce este omologarea individuală</h2><p>Omologarea este procesul prin care RAR verifică dacă un vehicul respectă cerințele tehnice și de siguranță impuse pentru a circula legal în România. Pentru majoritatea mașinilor din UE, care au deja o omologare de tip (CE) valabilă și nu au fost modificate, RAR eliberează direct cartea de identitate a vehiculului (CIV). Omologarea individuală intervine atunci când această cale simplă nu este disponibilă.</p><h2>Când ai nevoie de omologare individuală</h2><p>Procedura individuală se aplică, de regulă, în situații ca:</p><ul><li>vehicule aduse din afara UE, care nu au omologare de tip recunoscută;</li><li>vehicule modificate față de configurația omologată (motor înlocuit, caroserie modificată, instalație GPL, tuning tehnic);</li><li>vehicule unicat, reconstruite sau asamblate;</li><li>cazuri în care documentele de omologare lipsesc sau nu pot fi validate.</li></ul><p>Fiind o verificare pe vehiculul concret, procedura este mai lungă și mai costisitoare decât eliberarea CIV pe baza omologării de tip.</p><h2>Cum decurge inspecția</h2><p>La reprezentanța RAR se face mai întâi identificarea vehiculului: se compară seria de șasiu ștanțată pe caroserie cu documentele și se verifică datele tehnice. Urmează verificarea conformității pe capitolele de siguranță, frânare, iluminare, emisii și zgomot. În funcție de caz, inspectorul poate solicita probe dinamice, care presupun testarea vehiculului în mișcare și care influențează direct costul final.</p><h2>Sfaturi și capcane frecvente</h2><p>Adu documentele originale din țara de origine, în special cartea vehiculului (Brief, Carte Grise), pentru că fără ele identificarea este dificilă. Dacă mașina a fost modificată, pregătește documentele care atestă modificarea (de exemplu, certificatul service-ului pentru înlocuirea motorului). Verifică din timp pe rarom.ro tarifele actualizate, deoarece costul poate crește semnificativ când sunt necesare probe dinamice sau când vehiculul are o normă de poluare veche.</p>",
    "faq": [
      {
        "question": "Orice mașină din UE trece prin omologare individuală?",
        "answer": "Nu. Dacă vehiculul are omologare de tip (CE) valabilă și este nemodificat, RAR eliberează CIV direct, fără omologare individuală."
      },
      {
        "question": "Cât durează omologarea individuală?",
        "answer": "Depinde de caz. Un dosar simplu se poate finaliza rapid, dar când sunt necesare probe dinamice sau documente suplimentare, procedura se prelungește."
      },
      {
        "question": "Ce fac după ce primesc CIV?",
        "answer": "Cu cartea de identitate a vehiculului emisă de RAR mergi la DGPCI pentru înmatriculare și obținerea certificatului de înmatriculare și a plăcuțelor."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://portal.rarom.ro/rar-public/appointment",
        "label": "Programări online RAR ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI - Înmatriculări ↗"
      }
    ]
  },
  {
    "slug": "programare-itp",
    "url": "/ghid-auto/programare-itp/",
    "title": "Programare ITP – cum faci și ce acte sunt necesare",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "Programare ITP 2026: cum te programezi online sau telefonic, ce acte îți trebuie (talon, CIV, RCA, act identitate) și fiecare cât timp faci inspecția.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Programarea la ITP se face online sau telefonic, direct la o stație autorizată RAR. Îți trebuie certificatul de înmatriculare (talonul), cartea de identitate a vehiculului (CIV) în original și actul de identitate al persoanei care prezintă mașina. Potrivit Legii nr. 132/2017, la ITP este obligatorie dovada existenței unei polițe RCA valabile (în practică stația o verifică de regulă electronic), iar RCA este oricum obligatorie ca să circuli legal până la stație. Pentru autoturisme, ITP se face o dată la 2 ani, dar anual pentru cele cu o vechime de cel puțin 12 ani; autoturismele noi fac prima ITP la 3 ani de la prima înmatriculare.",
    "docs": [
      "Certificatul de înmatriculare (talon) în original",
      "Cartea de identitate a vehiculului (CIV) în original",
      "Actul de identitate al persoanei care prezintă mașina"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică valabilitatea RCA și a ITP-ului curent",
        "description": "Verifică data expirării ITP-ului actual ca să te programezi din timp (o poți verifica online, prin serviciul RAR de verificare a valabilității ITP). Asigură-te că ai RCA valabil: legea cere dovada existenței contractului RCA la efectuarea ITP (se verifică de regulă electronic), iar fără RCA nu ai voie să circuli pe drumurile publice până la stație."
      },
      {
        "num": 2,
        "title": "Alege o stație ITP autorizată RAR",
        "description": "Caută o stație autorizată din apropiere. Poți alege în funcție de program, preț și disponibilitate."
      },
      {
        "num": 3,
        "title": "Fă programarea online sau telefonic",
        "description": "Multe stații permit programare online, cu selectarea zilei și a intervalului orar. Vii direct la ora stabilită, fără să aștepți la coadă."
      },
      {
        "num": 4,
        "title": "Pregătește documentele și mașina",
        "description": "Ai la tine talonul, CIV și actul de identitate. Mașina trebuie să fie funcțională și fără defecte evidente."
      },
      {
        "num": 5,
        "title": "Efectuează inspecția",
        "description": "După verificări, primești rezultatul, iar valabilitatea ITP este înregistrată electronic în baza de date RAR."
      }
    ],
    "costs": [
      {
        "item": "ITP autoturism",
        "note": "Variază după categoria vehiculului, combustibil și stație",
        "value": "~100 - 200 RON"
      }
    ],
    "proseHtml": "<h2>Unde și cum te programezi</h2><p>Inspecția tehnică periodică se face la stații autorizate de Registrul Auto Român, care pot fi private sau ale RAR. Cele mai multe stații permit programare online, prin formular pe site sau prin telefon. Programarea nu este întotdeauna obligatorie, dar îți economisește timp: vii la ora stabilită și eviți cozile, mai ales la final de lună, când cererea crește.</p><p>Reglementările RAR pentru ITP (<a href=\"https://www.rarom.ro/cs-uploads/RNTR%201.pdf\" target=\"_blank\" rel=\"noopener\">RNTR 1</a>) enumeră ca documente talonul și CIV, însă Legea nr. 132/2017 (art. 27) prevede că la efectuarea inspecției tehnice periodice este obligatorie dovada existenței contractului RCA. În practică, existența poliței se verifică de regulă electronic, așa că asigură-te că ai RCA valabil înainte de programare. RCA este oricum obligatoriu pentru a circula legal pe drumurile publice până la stație.</p><h2>La ce interval se face ITP</h2><p>Pentru autoturisme, ITP-ul se face <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/24006\" target=\"_blank\" rel=\"noopener\">o dată la 2 ani, dar anual dacă mașina are o vechime de cel puțin 12 ani</a>. Autoturismele noi fac prima ITP la 3 ani de la prima înmatriculare. Având în vedere vechimea medie a parcului auto din România, pentru multe mașini ITP-ul este de fapt anual. Pentru taxiuri și mașinile rent-a-car ITP-ul se face la 6 luni, la fel ca pentru autobuzele și microbuzele cu peste 8 locuri; mașinile de școală, autoutilitarele și vehiculele de marfă fac ITP anual. Verifică pe talon sau în raportul ITP anterior data exactă la care expiră inspecția, ca să nu circuli cu ITP-ul expirat.</p><h2>Cazuri speciale la programare</h2><p><a href=\"https://www.rarom.ro/?p=666\" target=\"_blank\" rel=\"noopener\">Vehiculul poate fi prezentat la ITP de orice persoană, doar cu actul său de identitate</a> — nu este nevoie de împuternicire (nici simplă, nici notarială) și nici de copia actului de identitate al proprietarului. Pentru mașinile în leasing se acceptă, în locul CIV în original, o copie conformă pusă la dispoziție de societatea de leasing.</p><h2>Sfaturi ca să treci din prima</h2><p>Verifică înainte de programare elementele care pică frecvent la ITP: funcționarea tuturor luminilor, uzura anvelopelor, starea ștergătoarelor, nivelul emisiilor și eventualele scurgeri. O mașină prezentată curată și cu defectele evidente remediate reduce riscul de a fi respinsă și de a plăti o a doua verificare.</p>",
    "faq": [
      {
        "question": "Este obligatorie programarea la ITP?",
        "answer": "Nu întotdeauna, dar este recomandată. Programarea online sau telefonică îți garantează un interval orar și îți economisește timpul de așteptare la stație."
      },
      {
        "question": "Pot merge la ITP cu mașina altcuiva?",
        "answer": "Da. Potrivit RAR, vehiculul poate fi prezentat la ITP de orice persoană, cu actul său de identitate — nu este necesară nicio împuternicire și nici copia actului de identitate al proprietarului."
      },
      {
        "question": "Ce se întâmplă dacă pic ITP-ul?",
        "answer": "Primești un termen pentru remedierea defectelor și revii la reinspecție. Rezolvă defectele semnalate înainte de a reveni, ca să eviți costuri suplimentare."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/24006",
        "label": "Periodicitatea ITP (2 ani / anual la 12 ani / 3 ani auto nou) — OG 81/2000, formă consolidată (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.rarom.ro/cs-uploads/RNTR%201.pdf",
        "label": "RCA nu e document cerut la ITP — RNTR 1, Reglementări ITP (Ordinul MTCT 2133/2005, formă consolidată) — PDF oficial RAR ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) — site oficial ↗"
      },
      {
        "url": "https://www.rarom.ro/?p=666",
        "label": "Documente necesare la ITP; prezentarea vehiculului de orice persoană — RAR (pagină oficială) ↗"
      },
      {
        "url": "https://prog.rarom.ro/rarpol/rarpol.asp",
        "label": "Verificare online valabilitate ITP — serviciu oficial RAR ↗"
      }
    ]
  },
  {
    "slug": "schimbare-categorie-permis-auto",
    "url": "/ghid-auto/schimbare-categorie-permis-auto/",
    "title": "Schimbare categorie permis auto 2026 – acte necesare și condiții",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Schimbare categorie permis auto 2026: cum adaugi o nouă categorie (C, D, BE etc.), acte necesare, condiții de vârstă, examen și costuri.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru a adăuga o nouă categorie pe permis (de exemplu C, D, BE) trebuie să urmezi cursurile unei școli autorizate pentru acea categorie, să treci examenul teoretic și practic la DGPCI și să prezinți o fișă medicală care atestă că ești apt pentru categoria respectivă. Contravaloarea permisului (139 lei din 15 septembrie 2026) se plătește înainte de examen, iar dovada plății intră în dosarul de examinare; după promovare, permisul se reeliberează cu noua categorie.",
    "docs": [
      "Actul de identitate (original și copie)",
      "Permisul de conducere actual",
      "Fișa medicală auto pentru noua categorie solicitată",
      "Avizul psihologic valabil",
      "Dosarul de școlarizare pentru noua categorie",
      "Dovada plății contravalorii permisului (139 lei)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică condițiile de vârstă și de vechime",
        "description": "Fiecare categorie are o vârstă minimă și, uneori, o vechime necesară în altă categorie (de exemplu, D presupune de regulă deținerea prealabilă a categoriei B)."
      },
      {
        "num": 2,
        "title": "Fă fișa medicală și avizul psihologic",
        "description": "Obții o fișă medicală care confirmă că ești apt pentru categoria dorită și un aviz psihologic valabil, de la unități autorizate."
      },
      {
        "num": 3,
        "title": "Înscrie-te la o școală autorizată",
        "description": "Urmezi orele de pregătire teoretică și practică specifice noii categorii. Școala îți întocmește dosarul."
      },
      {
        "num": 4,
        "title": "Programează-te și susține examenul",
        "description": "Te programezi pe portalul DGPCI și susții proba teoretică și proba practică pentru noua categorie."
      },
      {
        "num": 5,
        "title": "Reeliberează permisul",
        "description": "După promovare primești un permis nou pe care apare categoria adăugată. Contravaloarea lui (139 lei din 15 septembrie 2026) se achită înainte de examen, iar dovada plății face parte din dosarul de examinare."
      }
    ],
    "costs": [
      {
        "item": "Contravaloarea permisului de conducere",
        "note": "Se achită înainte de examen; dovada plății intră în dosarul de examinare",
        "value": "139 lei"
      },
      {
        "item": "Curs școală de șoferi (nouă categorie)",
        "note": "Variază mult în funcție de categorie și de școală",
        "value": "1.500-4.000 lei"
      },
      {
        "item": "Fișă medicală auto",
        "note": "Pentru categoria solicitată",
        "value": "100-200 lei"
      },
      {
        "item": "Aviz psihologic",
        "note": "Cabinet autorizat",
        "value": "~100 lei"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă schimbarea categoriei</h2><p>În limbaj uzual, „schimbarea categoriei” înseamnă, cel mai adesea, adăugarea unei noi categorii pe permis - de exemplu trecerea de la B la BE (remorcă), C (camion), D (autobuz) sau A (motocicletă). Nu este o simplă preschimbare administrativă: presupune pregătire, examen și o fișă medicală care să ateste că ești apt pentru vehiculele din categoria respectivă.</p><h2>Condiții de vârstă și vechime</h2><p>Fiecare categorie are cerințe proprii. Categoriile grele (C, D) au vârste minime mai mari și, în multe cazuri, presupun deținerea prealabilă a categoriei B. Pentru transportul de persoane sau marfă în interes comercial pot fi necesare și atestate profesionale suplimentare (CPC), obținute separat. Verifică din timp ce condiții se aplică situației tale.</p><h2>Fișa medicală și avizul psihologic</h2><p>Fișa medicală trebuie emisă pentru categoria nouă, întrucât cerințele medicale diferă (de exemplu, categoriile de transport persoane au criterii mai stricte). Avizul psihologic trebuie să fie valabil. Ambele au termene de valabilitate, așa că programează examenul înainte de expirarea lor.</p><h2>Examenul și reeliberarea permisului</h2><p>După absolvirea cursurilor la o școală autorizată pentru categoria dorită, te programezi la examen pe portalul oficial. Susții proba teoretică (specifică noii categorii) și proba practică. La promovare, permisul se reeliberează cu toate categoriile deținute, inclusiv cea nouă; contravaloarea lui (139 lei din 15 septembrie 2026) se achită înainte de examen, iar dovada plății se depune la dosar.</p><h2>Sfaturi și capcane</h2><ul><li>Nu confunda categoria de permis cu atestatul profesional - transportul comercial cere documente suplimentare.</li><li>Verifică valabilitatea permisului actual: la reeliberare, data de expirare poate fi recalculată pentru categoriile cu valabilitate mai scurtă.</li><li>Costurile școlii variază semnificativ; cere din start o ofertă completă, cu numărul de ore incluse.</li></ul>",
    "faq": [
      {
        "question": "Pot adăuga o categorie fără să merg la școală?",
        "answer": "Nu. Pentru o categorie nouă trebuie să urmezi cursurile unei școli autorizate și să promovezi examenul pentru acea categorie. Există însă excepții de la proba teoretică: de exemplu, la trecerea de la A1 la A2 sau de la A2 la A după minimum 2 ani de experiență, ori pentru cei care aveau deja permis B la 27 decembrie 2025 și absolvă cursurile pentru A sau A2 — aceștia susțin doar proba practică."
      },
      {
        "question": "Am nevoie de o fișă medicală nouă?",
        "answer": "Da, fișa medicală trebuie emisă pentru categoria solicitată, deoarece cerințele medicale diferă între categorii."
      },
      {
        "question": "Cât costă reeliberarea permisului cu noua categorie?",
        "answer": "Contravaloarea permisului este 139 lei (tarif valabil din 15 septembrie 2026) și se achită înainte de examen. La aceasta se adaugă costul școlii, al fișei medicale și al avizului psihologic."
      },
      {
        "question": "Categoria D presupune să am deja categoria B?",
        "answer": "De regulă, da. Categoriile grele de transport persoane necesită deținerea prealabilă a categoriei B și îndeplinirea unor condiții de vârstă mai mari."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/74028",
        "label": "OUG 195/2002 republicată (Codul rutier) – Portal Legislativ (legislatie.just.ro) ↗"
      },
      {
        "url": "https://gr.prefectura.mai.gov.ro/nu-mai-este-necesara-prezentarea-cazierului-judiciar-la-depunerea-documentelor-pentru-obtinerea-permisului-de-conducere/",
        "label": "Cazierul judiciar nu mai este necesar la dosarul de permis (din 10 martie 2026) — Instituția Prefectului Județul Giurgiu (MAI) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Portal DGPCI (MAI) – Direcția Generală Permise de Conducere și Înmatriculări ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=37",
        "label": "Obținerea permisului de conducere – HUB Servicii MAI ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/dgpci/programari/harta",
        "label": "Programare online examinare / permise (HUB MAI) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxelor (permis 139 lei) ↗"
      }
    ]
  },
  {
    "slug": "scoala-de-soferi-categoria-a",
    "url": "/ghid-auto/scoala-de-soferi-categoria-a/",
    "title": "Școala de șoferi categoria A – acte necesare și înscriere",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Școala de șoferi categoria A 2026: acte necesare pentru înscriere, subcategoriile A/A1/A2/AM, vârsta minimă, costuri și pașii pentru permisul de moto.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru a te înscrie la școala de șoferi categoria A (motocicletă) ai nevoie de actul de identitate, fișa medicală auto și avizul psihologic. Cazierul judiciar nu mai trebuie prezentat: verificarea se face automat de serviciul de permise. Categoria A are mai multe subcategorii (AM, A1, A2, A), fiecare cu o vârstă minimă diferită. Costul cursului pornește, de regulă, de la circa 2.000 lei și poate depăși 4.000 lei.",
    "docs": [
      "Cartea de identitate (original și copie)",
      "Fișa medicală auto de la o unitate autorizată",
      "Avizul psihologic de la un cabinet autorizat",
      "Nu mai este necesar cazierul judiciar (verificarea se face automat de DGPCI, pe baza consimțământului din cererea-tip)",
      "Două fotografii tip legitimație (3x4 cm)",
      "Dosar plic"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege subcategoria potrivită",
        "description": "Stabilește dacă vrei AM (moped), A1, A2 sau A, în funcție de vârstă și de motocicleta pe care vrei să o conduci."
      },
      {
        "num": 2,
        "title": "Obține fișa medicală și avizul psihologic",
        "description": "Faci fișa medicală auto la o unitate acreditată și avizul psihologic la un cabinet autorizat de Colegiul Psihologilor."
      },
      {
        "num": 3,
        "title": "Cazierul judiciar nu mai trebuie depus",
        "description": "Nu mai trebuie să obții cazierul judiciar: din 2026, serviciul de permise verifică automat situația juridică, pe baza consimțământului exprimat în cererea-tip."
      },
      {
        "num": 4,
        "title": "Înscrie-te la o școală autorizată",
        "description": "Depui dosarul, semnezi contractul și urmezi orele de legislație și de conducere specifice motocicletei."
      },
      {
        "num": 5,
        "title": "Susține examenul la DGPCI",
        "description": "După absolvire, te programezi la proba teoretică și la cea practică (manevre și traseu) pentru categoria dorită."
      }
    ],
    "costs": [
      {
        "item": "Curs școală de șoferi categoria A",
        "note": "Variază după subcategorie și școală; verifică oferta exactă",
        "value": "2.000-4.500 lei"
      },
      {
        "item": "Fișă medicală auto",
        "note": "Unitate autorizată",
        "value": "100-200 lei"
      },
      {
        "item": "Aviz psihologic",
        "note": "Cabinet autorizat",
        "value": "~100 lei"
      },
      {
        "item": "Contravaloarea permisului",
        "note": "Se achită înainte de examen; dovada plății intră în dosarul de examinare",
        "value": "139 lei"
      }
    ],
    "proseHtml": "<h2>Subcategoriile categoriei A</h2><p>Categoria A pentru motociclete nu este una singură, ci un grup de subcategorii, fiecare cu limite de putere și cu o vârstă minimă proprie. AM permite conducerea mopedelor de la 16 ani, A1 acoperă motocicletele mici (până la 125 cmc) tot de la 16 ani, A2 este pentru motociclete de putere medie de la 18 ani, iar categoria A completă, fără restricții de putere, se obține de la 24 de ani sau de la 20 de ani dacă ai deja cel puțin 2 ani de experiență pe A2. Alege subcategoria în funcție de motocicleta pe care vrei să o conduci.</p><p>Dacă urci treptat (A1 → A2 → A) și ai cel puțin 2 ani de experiență pe subcategoria deținută, nu mai susții proba teoretică, ci doar pe cea practică. Tot fără proba teoretică trec și cei care aveau deja permis categoria B la 27 decembrie 2025 și absolvă cursurile pentru A sau A2.</p><h2>Actele pentru înscriere</h2><p>Dosarul de înscriere include actul de identitate, fișa medicală auto (de la o unitate acreditată), avizul psihologic (de la un cabinet autorizat de Colegiul Psihologilor). Cazierul judiciar nu mai este necesar: din 2026, serviciul de permise verifică automat situația juridică, pe baza consimțământului exprimat în cerere. Fișa medicală atestă că ești apt pentru conducerea motocicletei și are termen de valabilitate, așa că nu o face prea devreme.</p><h2>Cum arată pregătirea și examenul</h2><p>Pregătirea cuprinde ore de legislație rutieră și ore practice pe motocicletă. Examenul are o probă teoretică (grilă) și una practică, iar la moto proba practică include manevre specifice (slalom, opriri, echilibru la viteză mică) pe lângă traseul în trafic. Echipamentul de protecție (cască omologată, mănuși, echipament adecvat) este obligatoriu la orele practice și la examen.</p><h2>Cât costă și cât durează</h2><p>Cursul pentru categoria A pornește de regulă de la circa 2.000 lei și poate depăși 4.000-4.500 lei, în funcție de subcategorie, de numărul de ore și de școală. Multe școli permit plata în rate. Durata este, în medie, de aproximativ o lună, dar depinde de disponibilitatea ta și de programul instructorului.</p><h2>Sfaturi practice</h2><ul><li>Cere din start o ofertă completă, cu numărul de ore de conducere incluse și costul orelor suplimentare.</li><li>Investește într-un echipament de protecție bun - îl vei folosi și după obținerea permisului.</li><li>Verifică valabilitatea fișei medicale și a avizului psihologic înainte de programarea la examen.</li></ul>",
    "faq": [
      {
        "question": "De la ce vârstă pot da examenul pentru categoria A?",
        "answer": "Depinde de subcategorie: AM și A1 de la 16 ani, A2 de la 18 ani, iar categoria A completă de la 24 de ani (sau 20 de ani cu 2 ani de experiență pe A2)."
      },
      {
        "question": "Ce acte îmi trebuie pentru înscriere?",
        "answer": "Actul de identitate, fișa medicală auto și avizul psihologic, plus fotografii tip legitimație. Cazierul judiciar nu mai este necesar, verificarea se face automat de serviciul de permise."
      },
      {
        "question": "Cât costă școala de moto în 2026?",
        "answer": "De regulă între 2.000 și 4.500 lei, în funcție de subcategorie și de școală. Verifică oferta exactă și dacă orele suplimentare se plătesc separat."
      },
      {
        "question": "Este obligatoriu echipamentul de protecție la examen?",
        "answer": "Da, casca omologată și echipamentul adecvat sunt obligatorii atât la orele practice, cât și la proba de examen."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Portal DGPCI (MAI) ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "Autoritatea Rutieră Română (ARR) ↗"
      }
    ]
  },
  {
    "slug": "scoala-de-soferi-categoria-b",
    "url": "/ghid-auto/scoala-de-soferi-categoria-b/",
    "title": "Școala de șoferi categoria B – acte necesare și înscriere",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Școala de șoferi categoria B 2026: acte necesare pentru înscriere, vârsta minimă, orele de pregătire, costuri și pașii până la permisul auto.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru categoria B te poți înscrie la școala de șoferi de la 17 ani și 9 luni, dar examenul îl poți da doar după împlinirea vârstei de 18 ani. Ai nevoie de actul de identitate, fișa medicală auto și avizul psihologic. Cazierul judiciar nu mai trebuie prezentat: verificarea se face automat de serviciul de permise, pe baza consimțământului tău. Costul complet este, de regulă, între 3.000 și 5.000 lei, incluzând cursul, orele de conducere și taxele conexe.",
    "docs": [
      "Cartea de identitate valabilă (original și copie)",
      "Fișa medicală auto de la o unitate autorizată",
      "Avizul psihologic de la un cabinet autorizat",
      "Nu mai este necesar cazierul judiciar (verificarea se face automat de DGPCI, pe baza consimțământului din cererea-tip)",
      "Două fotografii tip legitimație (3x4 cm)",
      "Dosar plic"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică vârsta",
        "description": "Te poți înscrie de la 17 ani și 9 luni, însă examenul se susține doar după împlinirea a 18 ani."
      },
      {
        "num": 2,
        "title": "Fă fișa medicală și avizul psihologic",
        "description": "Obții fișa medicală auto la o unitate acreditată și avizul psihologic la un cabinet autorizat de Colegiul Psihologilor."
      },
      {
        "num": 3,
        "title": "Cazierul judiciar nu mai trebuie depus",
        "description": "Nu mai trebuie să obții cazierul judiciar: din 2026, serviciul de permise verifică automat situația juridică, pe baza consimțământului exprimat în cererea-tip."
      },
      {
        "num": 4,
        "title": "Înscrie-te și urmează cursurile",
        "description": "Depui dosarul la o școală autorizată, faci orele de legislație și minimum 30 de ore de conducere practică."
      },
      {
        "num": 5,
        "title": "Susține examenul la DGPCI",
        "description": "După absolvire, te programezi la proba teoretică (26 întrebări) și la proba practică pe traseu."
      }
    ],
    "costs": [
      {
        "item": "Curs școală de șoferi categoria B",
        "note": "Include legislație și orele minime de conducere; verifică oferta exactă",
        "value": "2.500-3.500 lei"
      },
      {
        "item": "Cost total estimativ (cu taxe conexe)",
        "note": "Include fișă medicală, aviz psihologic, permis, eventuale ore suplimentare",
        "value": "3.000-5.000 lei"
      },
      {
        "item": "Fișă medicală auto",
        "note": "Unitate autorizată",
        "value": "100-200 lei"
      },
      {
        "item": "Aviz psihologic",
        "note": "Cabinet autorizat",
        "value": "~100 lei"
      },
      {
        "item": "Oră suplimentară de conducere",
        "note": "Peste orele incluse în pachet",
        "value": "60-100 lei"
      },
      {
        "item": "Contravaloarea permisului",
        "note": "Se achită înainte de examen; dovada plății intră în dosarul de examinare",
        "value": "139 lei"
      }
    ],
    "proseHtml": "<h2>Vârsta minimă și condițiile de înscriere</h2><p>Pentru categoria B te poți înscrie la școala de șoferi de la 17 ani și 9 luni, astfel încât să termini pregătirea aproape de majorat. Examenul, atât proba teoretică, cât și cea practică, poate fi susținut doar după împlinirea vârstei de 18 ani. Această diferență îți permite să faci orele de conducere înainte de a putea da examenul.</p><h2>Actele necesare</h2><p>Dosarul de înscriere cuprinde actul de identitate valabil, fișa medicală auto (de la o unitate acreditată de Direcția de Sănătate Publică), avizul psihologic (de la un cabinet autorizat de Colegiul Psihologilor). Cazierul judiciar nu mai este necesar: din 2026, serviciul de permise verifică automat situația juridică, pe baza consimțământului exprimat în cerere. Adaugi și fotografii tip legitimație. Fișa medicală are termen de valabilitate, deci corelează programarea cu data examenului.</p><h2>Cum arată pregătirea</h2><p>Cursul include ore de legislație rutieră și minimum 30 de ore de conducere practică efectivă. Proba teoretică are 26 de întrebări, iar pentru promovare trebuie să răspunzi corect la minimum 22 dintre ele, în 30 de minute. Proba practică se desfășoară pe traseu, în trafic real, și durează în jur de 25-30 de minute.</p><h2>Cât costă și în cât timp obții permisul</h2><p>În 2026, cursul pentru categoria B costă de regulă între 2.500 și 3.500 lei, dar costul total, cu toate taxele conexe (fișă medicală, aviz psihologic, permis, eventuale ore suplimentare), poate ajunge la 3.000-5.000 lei. Multe școli permit plata în rate. Durata întregului proces este, în medie, de 2-3 luni, în funcție de disponibilitatea ta și de locurile la examen.</p><h2>Capcane frecvente</h2><ul><li>Verifică din start dacă orele de conducere incluse în pachet sunt suficiente sau vei plăti ore suplimentare.</li><li>Nu lăsa fișa medicală și avizul psihologic să expire înainte de examen.</li><li>Dosarul de școlarizare are un termen de valabilitate; dacă nu susții examenul la timp, poate fi nevoie de reînnoire.</li></ul>",
    "faq": [
      {
        "question": "De la ce vârstă mă pot înscrie la categoria B?",
        "answer": "Te poți înscrie de la 17 ani și 9 luni, dar examenul îl poți susține doar după împlinirea vârstei de 18 ani."
      },
      {
        "question": "Câte ore de conducere sunt obligatorii?",
        "answer": "Minimum 30 de ore de conducere practică efectivă, la care se adaugă orele de legislație rutieră."
      },
      {
        "question": "Cât costă școala de șoferi categoria B în 2026?",
        "answer": "Cursul costă de regulă 2.500-3.500 lei, iar costul total, cu taxele conexe, ajunge de obicei la 3.000-5.000 lei."
      },
      {
        "question": "Câte întrebări are examenul teoretic?",
        "answer": "Proba teoretică are 26 de întrebări, iar pentru promovare trebuie să răspunzi corect la minimum 22, în 30 de minute."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Portal DGPCI (MAI) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      }
    ]
  },
  {
    "slug": "verificare-puncte-penalizare-permis",
    "url": "/ghid-auto/verificare-puncte-penalizare-permis/",
    "title": "Verificare puncte penalizare permis – acte necesare",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Verificare puncte de penalizare permis: cum afli online câte puncte ai, prin ghiseul.ro și hub.mai.gov.ro, reguli, valabilitate și suspendare.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Punctele de penalizare le poți verifica online prin secțiunea „Istoric rutier” de pe ghiseul.ro sau prin platforma Hub a MAI (hub.mai.gov.ro), autentificându-te cu datele din actul de identitate. Punctele rămân active 6 luni de la data sancțiunii, iar la acumularea a 15 puncte permisul se suspendă 30 de zile, moment în care toate punctele se anulează.",
    "docs": [
      "Cont pe ghiseul.ro sau pe platforma Hub a MAI (creat cu datele din actul de identitate)",
      "Datele permisului de conducere (serie/număr), unde sunt solicitate"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege platforma oficială",
        "description": "Cel mai simplu este prin ghiseul.ro (secțiunea „Istoric rutier”) sau prin platforma Hub a MAI (hub.mai.gov.ro)."
      },
      {
        "num": 2,
        "title": "Creează cont sau autentifică-te",
        "description": "Îți faci cont cu datele din buletin și cu o adresă de email validă, apoi te autentifici."
      },
      {
        "num": 3,
        "title": "Accesează istoricul rutier",
        "description": "Din cont, deschizi secțiunea dedicată și vizualizezi punctele de penalizare active și eventualele amenzi."
      },
      {
        "num": 4,
        "title": "Verifică detaliile fiecărei sancțiuni",
        "description": "Poți vedea data aplicării și, implicit, când expiră punctele (după 6 luni de la sancțiune)."
      }
    ],
    "costs": [
      {
        "item": "Verificare online puncte",
        "note": "Pe portalurile oficiale",
        "value": "gratuit"
      }
    ],
    "proseHtml": "<h2>Unde verifici punctele de penalizare</h2><p>Cea mai simplă cale este online, prin platformele oficiale. Pe ghiseul.ro găsești secțiunea „Istoric rutier”, care îți arată punctele active și amenzile. Platforma oficială este Hub-ul Ministerului Afacerilor Interne (hub.mai.gov.ro): din 6 martie 2026, în secțiunea „Șoferi și vehicule” – „Istoricul sancțiunilor rutiere”, generezi gratuit, în câteva secunde, un document care arată punctele de penalizare și dacă dreptul de a conduce este suspendat. Ai nevoie de un cont de utilizator autentificat. Ambele metode presupun autentificarea cu datele tale personale.</p><h2>Metoda tradițională</h2><p>Dacă preferi varianta clasică, poți trimite o solicitare scrisă către Poliția Rutieră, iar răspunsul vine, de regulă, în termen de până la 15 zile. Te poți prezenta și personal la sediu, cu actul de identitate și permisul de conducere. Această cale este utilă când ai nevoie de un document oficial pentru diverse proceduri.</p><h2>Cum funcționează punctele de penalizare</h2><p>Fiecare abatere aduce un număr fix de puncte: de exemplu, 2 puncte pentru neutilizarea centurii de siguranță sau depășirea vitezei cu 10-20 km/h, 3 puncte pentru depășirea cu 21-30 km/h, 4 puncte pentru folosirea telefonului mobil fără sistem „mâini libere” sau depășirea cu 31-40 km/h și 6 puncte pentru depășirea cu 41-50 km/h. Punctele se cumulează pe măsură ce primești sancțiuni.</p><h2>Valabilitate și suspendare</h2><p>Punctele de penalizare se anulează automat la împlinirea a 6 luni de la data constatării contravenției, dacă nu ai atins pragul critic. Dacă ai contestat în instanță procesul-verbal, termenul de 6 luni se suspendă pe durata procesului. La acumularea a 15 puncte de penalizare, permisul se suspendă pentru 30 de zile, iar în acel moment toate punctele acumulate se anulează. Dacă aduni din nou cel puțin 15 puncte în cele 12 luni de după expirarea suspendării, suspendarea este de 60 de zile. Poliția are obligația de a te înștiința în scris despre aplicarea ultimelor puncte, de regulă în termen de 15 zile.</p><h2>Sfaturi utile</h2><ul><li>Verifică periodic istoricul, mai ales dacă ai primit recent o amendă, ca să știi câte puncte ai acumulat.</li><li>Nu confunda punctele de penalizare cu punctele-amendă (unitatea de calcul a amenzii) - sunt lucruri diferite.</li><li>Achitarea amenzii nu șterge automat punctele de penalizare; acestea au propriul termen de valabilitate.</li></ul>",
    "faq": [
      {
        "question": "Cum verific gratuit punctele de penalizare?",
        "answer": "Prin secțiunea „Istoric rutier” de pe ghiseul.ro sau prin platforma Hub a MAI (hub.mai.gov.ro), după ce te autentifici cu datele din actul de identitate."
      },
      {
        "question": "Cât timp rămân valabile punctele de penalizare?",
        "answer": "Punctele rămân active 6 luni de la data sancțiunii, apoi se anulează automat dacă nu ai atins pragul de suspendare."
      },
      {
        "question": "La câte puncte se suspendă permisul?",
        "answer": "La acumularea a 15 puncte de penalizare, permisul se suspendă 30 de zile, iar toate punctele se anulează în acel moment. Dacă aduni din nou 15 puncte în următoarele 12 luni de la expirarea suspendării, suspendarea crește la 60 de zile."
      },
      {
        "question": "Achitarea amenzii îmi șterge punctele?",
        "answer": "Nu. Punctele de penalizare au propriul termen de valabilitate de 6 luni, independent de plata amenzii."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (Istoric rutier) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Hub MAI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "programare-drpciv-pentru-permis-de-conducere",
    "url": "/ghid-auto/programare-drpciv-pentru-permis-de-conducere/",
    "title": "Programare DGPCI pentru permis de conducere – pașii și actele",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Programare DGPCI pentru examenul de permis de conducere în 2026: pași online, acte necesare, taxe și sfaturi ca să prinzi loc rapid.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Programarea la examenul de permis se face online pe portalul oficial DGPCI (dgpci.mai.gov.ro), de regulă prin școala de conducători auto, care depune dosarul complet. Alegi județul, serviciul și data disponibilă, apoi te prezinți la sediu cu actele în original. Examenele teoretic și practic sunt gratuite; plătești doar contravaloarea permisului (139 lei din 15 septembrie 2026), iar dovada plății trebuie să facă parte din dosarul de examinare, deci o achiți înainte de proba teoretică.",
    "docs": [
      "Cartea de identitate (original și copie)",
      "Dosarul de școlarizare de la școala de conducători auto (cu numărul de ore efectuate)",
      "Fișa de școlarizare emisă de școala auto, în care este consemnat avizul medical „apt” pentru categoria solicitată (documentul medical original rămâne la școala de conducători auto)",
      "Avizul psihologic se obține înainte de începerea cursurilor și rămâne la școala auto; nu se depune separat la serviciul de permise",
      "Nu mai depui cazier și nici declarație separată: consimțământul pentru verificarea cazierului judiciar este inclus în cererea-tip generată la ghișeu, iar verificarea se face automat de DGPCI",
      "Dovada plății contravalorii permisului (139 lei), care se depune la dosarul de examinare, înainte de proba teoretică"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Finalizează pregătirea la școala auto",
        "description": "Efectuează orele de legislație și cele minime de conducere. Școala îți întocmește dosarul și îl transmite la DGPCI (fostul DRPCIV)."
      },
      {
        "num": 2,
        "title": "Accesează portalul de programare",
        "description": "Intri pe dgpci.mai.gov.ro / dgpci.mai.gov.ro, îți creezi cont sau te autentifici și selectezi județul unde vrei să susții proba teoretică (poate fi orice județ; proba practică se dă doar în județul de domiciliu sau reședință)."
      },
      {
        "num": 3,
        "title": "Alege serviciul și data",
        "description": "Selectezi tipul de examen (teoretic sau practic) și o dată/oră liberă. Locurile noi apar de obicei luni dimineața, deci verifică periodic."
      },
      {
        "num": 4,
        "title": "Confirmă și salvează programarea",
        "description": "Confirmi datele personale și CNP-ul, primești confirmarea pe email și o poți printa pentru a o avea la tine."
      },
      {
        "num": 5,
        "title": "Prezintă-te la sediu cu actele",
        "description": "Ajungi cu 15 minute înainte, cu actul de identitate în original și documentele solicitate. Susții proba teoretică (26 întrebări) și, ulterior, proba practică."
      },
      {
        "num": 6,
        "title": "Achită contravaloarea permisului",
        "description": "Contravaloarea permisului (139 lei din 15 septembrie 2026) se plătește online sau la bancă înainte de prezentarea la examen, iar dovada intră în dosar. După ce promovezi ambele probe, permisul se emite și îl primești prin curier sau îl ridici de la ghișeu."
      }
    ],
    "costs": [
      {
        "item": "Examen teoretic și practic",
        "note": "Examinarea DGPCI este gratuită",
        "value": "0 lei"
      },
      {
        "item": "Contravaloarea permisului de conducere",
        "note": "Se achită înainte de examen; dovada plății face parte din dosarul de examinare",
        "value": "139 lei"
      },
      {
        "item": "Fișă medicală auto",
        "note": "Variază în funcție de clinică",
        "value": "100-200 lei"
      },
      {
        "item": "Aviz psihologic",
        "note": "Cabinet autorizat",
        "value": "~100 lei"
      }
    ],
    "proseHtml": "<h2>Cine face programarea la examen</h2><p>Pentru primul examen, școala de conducători auto îți eliberează fișa de școlarizare și poate transmite electronic solicitarea ta către DGPCI (Direcția Generală Permise de Conducere și Înmatriculări, fosta DRPCIV); în acest caz trebuie să te prezinți personal la ghișeu cu dosarul în cel mult 3 zile lucrătoare. Altfel, îți faci singur programarea online pentru depunerea dosarului, iar proba teoretică o susții în aceeași zi. După promovare, te autoprogramezi la proba practică direct pe terminalul din sala de examen sau prin școală. Candidatul poate verifica online statusul programării și poate gestiona reprogramările în contul de pe portalul oficial.</p><p>Dacă susții o reexaminare sau te afli într-o situație specială (de exemplu preschimbarea unui permis străin), programarea se face direct pe portal, alegând județul și serviciul dorit.</p><h2>Ce probe susții</h2><p>Examenul are două etape: proba teoretică, cu <a href=\"https://legislatie.just.ro/Public/DetaliiDocumentAfis/124490\" target=\"_blank\" rel=\"noopener\">26 de întrebări</a> din legislația rutieră (trebuie să răspunzi corect la minimum 22, în 30 de minute), și proba practică pe traseu. Proba practică se poate programa doar după promovarea celei teoretice, iar proba practică trebuie susținută în perioada de valabilitate a cursului de pregătire, adică în cel mult un an de la absolvirea școlii; după acest termen trebuie refăcut cursul.</p><h2>Termene și valabilitatea documentelor</h2><p>Fișa medicală și avizul psihologic au termene de valabilitate (fișa medicală, de regulă un an), deci depune dosarul înainte să expire. Dacă nu promovezi din prima, ai dreptul la reexaminări, dar numai după cel puțin 15 zile de la respingere; dacă ai picat proba practică, trebuie să faci și minimum 6 ore suplimentare de pregătire practică la școala auto.</p><h2>Sfaturi ca să prinzi loc mai repede</h2><ul><li>Verifică portalul luni dimineața, când se deblochează cel mai des locuri noi.</li><li>Proba teoretică o poți susține în orice județ, dacă acolo sunt locuri mai devreme; proba practică și eliberarea permisului se fac însă doar la serviciul din județul de domiciliu sau reședință.</li><li>Ai la tine actul de identitate în original; fără el nu poți intra în examen.</li></ul><h2>Capcane frecvente</h2><p>Nu confunda taxa permisului (139 lei, achitată înainte de examen) cu vreo „taxă de examinare\" - examinarea în sine este gratuită. De asemenea, prezentarea cu întârziere sau cu documente expirate duce la pierderea programării, așa că verifică din timp datele și termenele.</p>",
    "faq": [
      {
        "question": "Cât costă examenul de permis la DGPCI?",
        "answer": "Examinarea teoretică și practică este gratuită. Plătești doar contravaloarea permisului de conducere, 139 lei (din 15 septembrie 2026), iar dovada plății se depune la dosarul de examinare, înainte de proba teoretică."
      },
      {
        "question": "Pot să mă programez singur la examen?",
        "answer": "Da. Te poți programa singur online pentru depunerea dosarului, sau școala auto poate transmite solicitarea în locul tău (caz în care te prezinți la ghișeu în cel mult 3 zile lucrătoare). Programarea la proba practică se face după promovarea probei teoretice, direct pe terminalul din sala de examen sau prin școală."
      },
      {
        "question": "Când apar locuri libere pe portal?",
        "answer": "Cele mai multe locuri noi se deblochează luni dimineața, în jurul orei 08:00. Merită să verifici portalul frecvent."
      },
      {
        "question": "Ce documente iau cu mine în ziua examenului?",
        "answer": "Actul de identitate în original este obligatoriu. Prezintă-te cu 15 minute înainte de ora programată."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocumentAfis/124490",
        "label": "Procedura de examinare pentru permis (structura probelor, documente necesare) — Ordin MAI nr. 268/2010 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI - Programare online (booking) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=37",
        "label": "MAI Hub - Obtinerea permisului de conducere ↗"
      }
    ]
  },
  {
    "slug": "schimbare-adresa-in-permis",
    "url": "/ghid-auto/schimbare-adresa-in-permis/",
    "title": "Schimbare adresă în permis 2026 – acte necesare și procedură",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Schimbare adresă în permis 2026: nu e obligatorie la mutarea domiciliului, dar iată acte necesare, pași și cost pentru preschimbarea permisului auto.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Schimbarea adresei de domiciliu nu obligă, prin lege, la preschimbarea permisului de conducere - permisul rămâne valabil până la expirare. Permisele în format european eliberate în România nu au înscrisă adresa titularului, așa că de regulă nu ai ce actualiza; doar dacă ai un permis de model vechi pe care apare adresa și vrei un document nou, depui o cerere la serviciul de permise (DGPCI) cu actul de identitate nou și permisul vechi, fără fișă medicală, deoarece valabilitatea nu se prelungește. Plătești doar contravaloarea noului document (139 lei, tarif valabil din 15 septembrie 2026).",
    "docs": [
      "Actul de identitate cu noua adresă (original și copie)",
      "Permisul de conducere vechi",
      "Cerere tip (completată la ghișeu sau online)",
      "Dovada plății contravalorii permisului (139 lei)",
      "O fotografie tip legitimație (dacă este solicitată de serviciul de permise)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică dacă ai nevoie de preschimbare",
        "description": "Schimbarea adresei nu este, în sine, obligatorie pentru permis. Decizi dacă vrei un document cu adresa actualizată sau păstrezi permisul valabil."
      },
      {
        "num": 2,
        "title": "Actualizează întâi buletinul",
        "description": "Obții cartea de identitate cu noua adresă la Serviciul de Evidență a Persoanelor. Aceasta este baza pentru orice actualizare a permisului."
      },
      {
        "num": 3,
        "title": "Faci programare online",
        "description": "Te programezi pe portalul DGPCI (dgpci.mai.gov.ro) la serviciul de permise, la orice județ, indiferent de domiciliu."
      },
      {
        "num": 4,
        "title": "Achiți taxa",
        "description": "Plătești contravaloarea permisului (139 lei, din 15 septembrie 2026) online pe ghiseul.ro sau la bancă și păstrezi dovada. Atenție: o plată făcută la vechiul tarif de 89 lei înainte de 15.09.2026 nu mai poate fi folosită."
      },
      {
        "num": 5,
        "title": "Depui dosarul și ridici permisul",
        "description": "Te prezinți la ghișeu cu actele, depui cererea și primești/ridici noul permis, cu aceeași dată de expirare ca cel vechi."
      }
    ],
    "costs": [
      {
        "item": "Contravaloarea permisului de conducere",
        "note": "Fără fișă medicală, valabilitatea nu se prelungește",
        "value": "139 lei"
      },
      {
        "item": "Fotografie tip legitimație",
        "note": "Dacă este solicitată",
        "value": "10-20 lei"
      }
    ],
    "proseHtml": "<h2>Este obligatorie schimbarea adresei în permis?</h2><p>Contrar unei impresii răspândite, schimbarea adresei de domiciliu nu obligă, prin lege, la preschimbarea permisului de conducere. Permisul rămâne valabil până la data de expirare înscrisă pe el, chiar dacă adresa din buletin s-a schimbat. Practic, poți circula liniștit cu permisul vechi.</p><p>Permisele în format european eliberate în România nu au înscrisă adresa de domiciliu, deci după mutare nu ai, de regulă, nimic de actualizat pe permis. Un document nou are sens doar dacă ai un permis de model vechi pe care apare adresa sau dacă, odată cu mutarea, îți expiră oricum permisul și îl reînnoiești.</p><h2>De ce nu ai nevoie de fișă medicală</h2><p>Spre deosebire de reînnoirea la expirare, în cazul actualizării adresei nu se prelungește valabilitatea permisului. Noul document primește aceeași dată de expirare ca cel vechi, motiv pentru care nu ți se cere fișă medicală sau aviz psihologic. Astfel, procedura este mai simplă și mai ieftină.</p><h2>Unde și cum depui dosarul</h2><p>Poți depune actele la orice serviciu de permise din țară, indiferent de județul de domiciliu din buletin, după o programare online pe portalul oficial. Cererea tip este de obicei precompletată la ghișeu, iar tu doar o verifici și o semnezi.</p><h2>Diferența față de schimbarea numelui</h2><p>Dacă odată cu adresa ți se schimbă și numele (de exemplu, după căsătorie sau divorț), atunci actualizarea permisului este recomandată, iar la dosar trebuie să adaugi documentul doveditor (certificat de căsătorie ori hotărâre de divorț) în original. Și în acest caz, dacă valabilitatea nu se prelungește, fișa medicală nu este necesară.</p><h2>Capcane frecvente</h2><ul><li>Nu confunda actualizarea adresei cu reînnoirea la expirare - a doua necesită fișă medicală.</li><li>Actualizează întâi buletinul; fără adresa nouă în actul de identitate, permisul nu poate fi modificat.</li><li>Verifică pe portalul oficial dacă în cazul tău se cere sau nu o fotografie recentă.</li></ul>",
    "faq": [
      {
        "question": "Trebuie să îmi schimb permisul dacă m-am mutat?",
        "answer": "Nu este obligatoriu. Permisul rămâne valabil până la expirare chiar dacă ai o adresă nouă în buletin. Preschimbarea este opțională."
      },
      {
        "question": "Am nevoie de fișă medicală pentru actualizarea adresei?",
        "answer": "Nu. Pentru că valabilitatea permisului nu se prelungește, nu se cere fișă medicală sau aviz psihologic."
      },
      {
        "question": "Cât costă preschimbarea permisului pentru adresă nouă?",
        "answer": "Plătești doar contravaloarea noului permis, 139 lei (tarif valabil din 15 septembrie 2026), plus eventual o fotografie tip legitimație."
      },
      {
        "question": "Pot depune dosarul în alt județ decât cel de domiciliu?",
        "answer": "Da, actele se pot depune la orice serviciu de permise din țară, după o programare online."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Portal DGPCI (MAI) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      }
    ]
  },
  {
    "slug": "fisa-medicala-permis-auto",
    "url": "/ghid-auto/fisa-medicala-permis-auto/",
    "title": "Fișă medicală permis auto 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Fișă medicală permis auto 2026: ce specialiști trebuie să vezi, cost 200-350 lei, valabilitate 12 luni și procedura la unitatea medicală autorizată.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Fișa medicală pentru permis auto se obține de la o unitate medicală autorizată de Ministerul Sănătății și confirmă că ești apt să conduci. Pentru categoriile uzuale (B) presupune evaluări la șase specialități: medicină internă, oftalmologie, ORL, neurologie, psihiatrie și ortopedie. Costă în general 200-350 lei și este valabilă 12 luni de la emitere. Avizul psihologic este un document separat.",
    "docs": [
      "Actul de identitate (buletin/carte de identitate)",
      "Adeverință de la medicul de familie privind afecțiunile cronice",
      "Fotografie tip legitimație (dacă o cere clinica)",
      "Adeverință medicală/foaie matricolă (la prima obținere a permisului)",
      "Scrisoare medicală de la specialist, pentru afecțiuni preexistente (ex. diabet)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege o unitate autorizată",
        "description": "Mergi la o clinică autorizată de Ministerul Sănătății. Lista este disponibilă pe site-ul DSP din județul tău."
      },
      {
        "num": 2,
        "title": "Prezintă actele",
        "description": "Adu buletinul și adeverința de la medicul de familie. La prima obținere, adaugă foaia matricolă/adeverința școlară."
      },
      {
        "num": 3,
        "title": "Efectuează consultațiile",
        "description": "Treci pe la cei șase specialiști: medicină internă, oftalmologie, ORL, neurologie, psihiatrie și ortopedie."
      },
      {
        "num": 4,
        "title": "Primești fișa completată",
        "description": "În clinicile moderne fișa este gata în 60-90 de minute, cu concluzia „apt/inapt\" pentru categoria solicitată."
      },
      {
        "num": 5,
        "title": "Fă separat avizul psihologic",
        "description": "Dacă e cazul, obții avizul psihologic la un laborator autorizat, ca document distinct de fișa medicală."
      }
    ],
    "costs": [
      {
        "item": "Fișa medicală completă (categoria B)",
        "note": "variază în funcție de clinică; verifică prețul exact",
        "value": "~200-350 lei"
      },
      {
        "item": "Aviz psihologic (separat)",
        "note": "document distinct, când este necesar",
        "value": "~100-150 lei"
      }
    ],
    "proseHtml": "<h2>Ce este fișa medicală auto și când îți trebuie</h2><p>Fișa medicală este documentul care confirmă că ești apt din punct de vedere medical să conduci vehicule din categoria de permis solicitată. Este obligatorie la prima obținere a permisului, la preschimbarea unui permis expirat și atunci când titularul dorește ca noul permis să aibă o nouă perioadă de valabilitate. Poate fi eliberată doar de unitățile medicale autorizate de Ministerul Sănătății; lista lor se găsește pe site-ul Direcției de Sănătate Publică (DSP) din fiecare județ.</p><h2>Ce investigații include</h2><p>Pentru categoriile uzuale (de exemplu categoria B), fișa presupune evaluări la șase specialități medicale:</p><ul><li>Medicină internă</li><li>Oftalmologie (vederea)</li><li>ORL (auz și echilibru)</li><li>Neurologie</li><li>Psihiatrie</li><li>Ortopedie</li></ul><p>Pentru categoriile profesionale (C, D) sau pentru afecțiuni preexistente, pot fi cerute investigații suplimentare. Este util să vii cu o adeverință de la medicul de familie privind eventualele boli cronice, iar pentru afecțiuni precum diabetul, cu o scrisoare de la specialist care confirmă aptitudinea de a conduce.</p><h2>Cât costă și cât este valabilă</h2><p>Costul unei fișe complete este de regulă între 200 și 350 lei, în funcție de clinică și de categoria de permis; unele clinici au oferte promoționale. Prețul poate varia, așa că verifică suma exactă la clinica aleasă. Fișa medicală are o valabilitate de 12 luni de la data emiterii. Atenție: la depunerea dosarului la serviciul permise, fișa trebuie să fie încă în termen. Dacă nu ai obținut sau reînnoit permisul în acest interval, va trebui să refaci toate testele medicale.</p><h2>Fișa medicală vs. avizul psihologic</h2><p>Multă lume le confundă, dar sunt două documente distincte. Fișa medicală acoperă cele șase specialități de mai sus, în timp ce avizul psihologic (testul psihologic) se obține separat, la un laborator de psihologie autorizat, și evaluează aptitudinile psihologice pentru condus. Avizul psihologic este necesar mai ales la prima obținere a permisului și în anumite situații reglementate. Cele două se plătesc și se eliberează separat.</p>",
    "faq": [
      {
        "question": "Cât costă fișa medicală pentru permis auto?",
        "answer": "În general 200-350 lei pentru categoria B, în funcție de clinică. Avizul psihologic, când este necesar, se plătește separat (aproximativ 100-150 lei)."
      },
      {
        "question": "Cât este valabilă fișa medicală?",
        "answer": "12 luni de la data emiterii. La depunerea dosarului trebuie să fie încă în termen, altfel trebuie refăcute toate testele."
      },
      {
        "question": "Ce specialiști trebuie să văd?",
        "answer": "Pentru categoria B: medicină internă, oftalmologie, ORL, neurologie, psihiatrie și ortopedie. Categoriile profesionale pot necesita investigații suplimentare."
      },
      {
        "question": "Fișa medicală include și testul psihologic?",
        "answer": "Nu. Avizul psihologic este un document separat, obținut la un laborator autorizat, distinct de fișa medicală."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Direcția Generală Permise de Conducere și Înmatriculări ↗"
      },
      {
        "url": "https://www.ms.ro/",
        "label": "Ministerul Sănătății ↗"
      }
    ]
  },
  {
    "slug": "recuperare-permis-suspendat",
    "url": "/ghid-auto/recuperare-permis-suspendat/",
    "title": "Recuperare permis suspendat 2026 – acte necesare, condiții și procedură",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Recuperare permis suspendat 2026: acte necesare, condiții pentru reducerea perioadei, testul 13 din 15 și unde depui cererea la Poliția Rutieră.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Permisul suspendat se recuperează de la poliția rutieră, nu de la DGPCI: după expirarea termenului de contestare, permisul reținut pentru o contravenție este trimis și păstrat la serviciul rutier al județului care te are în evidență (de regulă cel de domiciliu sau reședință); doar în cazurile penale sau ale accidentelor cu victime rămâne la serviciul rutier unde s-a constatat fapta. Prezinți actul de identitate și dovada înlocuitoare a permisului, după ce a expirat perioada de suspendare. Poți reduce suspendarea cu o treime dacă promovezi testul de cunoaștere a legislației (13 din 15) și îndeplinești condițiile legale.",
    "docs": [
      "Dovada înlocuitoare a permisului (primită de la poliție la reținerea permisului)",
      "Actul de identitate (original și copie)",
      "Dovada achitării tuturor amenzilor de circulație datorate bugetului local (necesară pentru reducerea perioadei de suspendare)",
      "Cerere tip de restituire a permisului",
      "Dovada promovării testului 13 din 15 (dacă soliciți reducerea perioadei)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică perioada de suspendare",
        "description": "Află durata exactă a suspendării din procesul-verbal sau din dovada înlocuitoare. Permisul nu se restituie automat la finalul perioadei."
      },
      {
        "num": 2,
        "title": "Achită integral amenda",
        "description": "Plătește amenzile și păstrează chitanța sau dovada de pe Ghișeul.ro. Plata tuturor amenzilor de circulație datorate bugetului local este condiție pentru reducerea perioadei; în plus, din 27 martie 2026, dacă primăria a dispus suspendarea dreptului de a conduce pentru neplata amenzilor, permisul nu îți este restituit până la încetarea acelei suspendări."
      },
      {
        "num": 3,
        "title": "Susține testul 13 din 15 (opțional/obligatoriu)",
        "description": "Pentru reducerea perioadei sau în cazurile obligatorii (alcool, anumite accidente, suspendare de 180 de zile), susține și promovează testul de cunoaștere a legislației rutiere. Din 1 iulie 2026 testul se dă la orice serviciu public comunitar regim permise (SPCRPCÎV) din țară, nu la poliție; modul de programare diferă de la județ la județ. Cererea de reducere se depune în primele două treimi ale perioadei de suspendare."
      },
      {
        "num": 4,
        "title": "Depune cererea la Poliția Rutieră",
        "description": "Te prezinți la serviciul rutier care are permisul în păstrare (de regulă cel din județul de domiciliu sau reședință; doar în cazurile penale sau de accident cu victime, cel unde s-a constatat fapta) și depui cererea-tip de restituire, împreună cu documentele."
      },
      {
        "num": 5,
        "title": "Ridică permisul la data aprobată",
        "description": "Revii personal la Serviciul Rutier cu actul de identitate și dovada înlocuitoare pentru a-ți primi permisul înapoi."
      }
    ],
    "costs": [
      {
        "item": "Test 13 din 15 (susținere)",
        "note": "Din 1 iulie 2026 testul se susține la SPCRPCÎV; verifică acolo programarea",
        "value": "gratuit"
      },
      {
        "item": "Amenda contravențională",
        "note": "Trebuie achitată integral",
        "value": "variabilă"
      }
    ],
    "proseHtml": "<h2>Unde se depune cererea</h2><p>Contrar unei confuzii frecvente, permisul suspendat nu se recuperează la DGPCI (serviciul de permise și înmatriculări), ci de la poliția rutieră: după expirarea termenului de contestare a procesului-verbal, permisul reținut pentru o contravenție se păstrează la serviciul rutier al județului care te are în evidență (de regulă cel de domiciliu sau reședință). Doar în cazurile penale sau ale accidentelor cu victime permisul rămâne la serviciul rutier pe raza căruia s-a constatat fapta. Acolo depui cererea-tip de restituire și prezinți documentele. Permisul nu îți este returnat automat la expirarea suspendării - trebuie să te prezinți fizic pentru a-l ridica.</p><h2>Condiții pentru reducerea perioadei de suspendare</h2><p>Poți solicita <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/74028\" target=\"_blank\" rel=\"noopener\">reducerea suspendării cu o treime</a> dacă îndeplinești simultan toate condițiile: promovezi testul de cunoaștere a legislației rutiere (13 răspunsuri corecte din 15), ai deținut permisul de cel puțin un an înainte de abatere, ai achitat toate amenzile de circulație datorate bugetului local de la domiciliu (nu doar amenda care a dus la suspendare) și nu ai re-cumulat cel puțin 15 puncte de penalizare în cele 12 luni de la expirarea ultimei perioade de suspendare.</p><h2>Cine NU poate beneficia de reducere</h2><p>Reducerea perioadei nu se aplică șoferilor sancționați pentru conducere sub influența alcoolului, celor suspendați 120 de zile pentru fapte grave (de exemplu depășirea cu peste 70 km/h a vitezei legale sau neoprirea la calea ferată cu barierele coborâte), celor cărora perioada de suspendare le-a fost majorată sau cumulată cu una dintre aceste fapte, respectiv celor care au re-cumulat cel puțin 15 puncte de penalizare în cele 12 luni de la expirarea ultimei perioade de suspendare. Conducerea sub influența drogurilor este infracțiune, nu contravenție, și nu intră în acest mecanism. În cazul alcoolului, testul 13 din 15 devine obligatoriu, iar nepromovarea sau neprezentarea adaugă 30 de zile la suspendare.</p><h2>Termene importante</h2><p>Cererea de restituire, respectiv de reducere, se depune în intervalul stabilit de lege (de regulă în primele două treimi ale perioadei de suspendare pentru reducere). Pentru simpla restituire, te poți prezenta după expirarea suspendării. Ridică permisul în termenul comunicat, ca să eviți proceduri suplimentare.</p><h2>Sfaturi practice</h2><ul><li>Păstrează cu grijă dovada înlocuitoare a permisului - fără ea recuperarea se complică.</li><li>Verifică din timp dacă în cazul tău testul 13 din 15 este obligatoriu sau doar opțional.</li><li>Confirmă la Poliția Rutieră programul de depunere a cererilor. Din 1 iulie 2026, testul 13 din 15 nu se mai susține la poliție, ci la orice serviciu public comunitar regim permise (SPCRPCÎV) din țară; verifică modul de programare în județul tău.</li></ul>",
    "faq": [
      {
        "question": "Permisul suspendat se recuperează de la DGPCI?",
        "answer": "Nu. Permisul se restituie de poliția rutieră, nu de serviciul de permise (DGPCI). Pentru contravenții, permisul este păstrat de serviciul rutier al județului care te are în evidență (de regulă cel de domiciliu), unde depui cererea de restituire; cererea de reducere a suspendării se soluționează însă de poliția rutieră din județul unde ai săvârșit fapta."
      },
      {
        "question": "Cum reduc perioada de suspendare?",
        "answer": "Poți obține o reducere de o treime din perioada de suspendare dacă promovezi testul 13 din 15, ai permisul de peste un an, ai achitat toate amenzile de circulație datorate bugetului local de la domiciliu și nu ai re-cumulat cel puțin 15 puncte de penalizare în cele 12 luni de la expirarea ultimei perioade de suspendare."
      },
      {
        "question": "Îmi primesc permisul automat după ce expiră suspendarea?",
        "answer": "Nu, trebuie să te prezinți personal la Serviciul Rutier cu actul de identitate și dovada înlocuitoare pentru a-l ridica."
      },
      {
        "question": "Ce se întâmplă dacă am fost suspendat pentru alcool?",
        "answer": "În acest caz testul 13 din 15 este obligatoriu, iar perioada de suspendare nu poate fi redusă, indiferent de rezultatul testului."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/74028",
        "label": "Reducerea suspendării cu o treime + testul 13 din 15 — art. 104 OUG 195/2002 (Codul rutier), legislatie.just.ro ↗"
      },
      {
        "url": "https://vs.politiaromana.ro/ro/utile/sustinerea-testului-de-cunoastere-a-regulilor-de-circulatie",
        "label": "Susținerea testului de cunoaștere a regulilor de circulație (13 din 15) — procedura veche, la poliție (din 1 iulie 2026 testul se dă la SPCRPCÎV) ↗"
      },
      {
        "url": "https://www.politiaromana.ro/",
        "label": "Poliția Română — site oficial ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (Direcția Generală Permise de Conducere și Înmatriculări) — MAI ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro — plata online a amenzilor ↗"
      }
    ]
  },
  {
    "slug": "permis-international-de-conducere",
    "url": "/ghid-auto/permis-international-de-conducere/",
    "title": "Permis internațional de conducere 2026 – acte necesare și costuri",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Permis internațional de conducere 2026: acte necesare, taxa de 46 lei, valabilitate 3 ani și unde îl obții. DGPCI îl emite direct prin HUB MAI.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Permisul internațional de conducere este traducerea oficială a permisului național și îți este necesar pentru a conduce în anumite state din afara UE/SEE. Din octombrie 2024 îl emite și DGPCI, la o taxă fixă de 46 lei, cu valabilitate de 3 ani (dar nu mai mult decât permisul național); ACR continuă să îl elibereze, la tarife proprii, mult mai mari. Cererea se depune online prin HUB MAI sau la ghișeul oricărui serviciu public comunitar regim permise (SPCRPCÎV); trebuie să ai un permis românesc valabil și dreptul de a conduce nesuspendat.",
    "docs": [
      "Cererea generată în HUB MAI (pentru conturile validate nu mai trebuie tipărită și semnată); condiție: permis românesc valabil și drept de a conduce nesuspendat",
      "Cerere completată (online sau la ghișeu)",
      "Actul de identitate valabil",
      "Dovada plății taxei de 46 lei"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică valabilitatea permisului național",
        "description": "Permisul internațional se emite doar pe baza unui permis românesc valabil și nu poate depăși valabilitatea acestuia."
      },
      {
        "num": 2,
        "title": "Plătește taxa",
        "description": "Achită taxa fixă de 46 lei online pe ghiseul.ro sau dgpci.mai.gov.ro."
      },
      {
        "num": 3,
        "title": "Depune cererea",
        "description": "Completează cererea online prin HUB MAI (secțiunea „Cerere permis internațional\") sau depune-o fizic la ghișeul oricărui serviciu public comunitar regim permise (SPCRPCÎV)."
      },
      {
        "num": 4,
        "title": "Așteaptă emiterea",
        "description": "Timpul mediu de livrare este de circa 30 de zile calendaristice de la înregistrarea cererii."
      },
      {
        "num": 5,
        "title": "Ridică documentul",
        "description": "Permisul internațional îți este trimis prin Poșta Română la adresa indicată sau îl ridici de la SPCRPCÎV ales în cerere; îl porți întotdeauna împreună cu permisul național când conduci în străinătate."
      }
    ],
    "costs": [
      {
        "item": "Taxa permis internațional de conducere",
        "note": "tarif fix DGPCI, mult redus față de vechiul sistem ACR",
        "value": "46 lei"
      }
    ],
    "proseHtml": "<h2>Ce este permisul internațional de conducere</h2><p>Permisul internațional de conducere (IDP) nu este un permis de sine stătător, ci o traducere oficială, standardizată, a permisului tău național. El nu are valoare fără permisul românesc și trebuie purtat întotdeauna împreună cu acesta. Documentul îți este util în statele din afara Uniunii Europene care îl solicită la închirierea unei mașini sau la un control rutier, în baza convențiilor internaționale privind circulația rutieră.</p><h2>Cine îl emite și cât costă în 2026</h2><p>Aici este cea mai importantă schimbare recentă: din octombrie 2024, permisul internațional poate fi obținut și de la DGPCI (Direcția Generală Permise de Conducere și Înmatriculări), nu doar de la Automobil Clubul Român (ACR), care rămâne emitent autorizat. Taxa fixă este de doar 46 lei, o reducere masivă față de vechiul sistem, unde costul total putea ajunge la peste 1.000 lei. Verifică totuși valoarea taxei la momentul depunerii, direct pe site-ul oficial.</p><h2>Cum îl obții și în cât timp</h2><p>Cererea se poate depune online, prin platforma HUB MAI (hub.mai.gov.ro, <a href=\"https://hub.mai.gov.ro/serviciu/view?id=194\" target=\"_blank\" rel=\"noopener\">secțiunea „Cerere permis internațional\"</a>), sau fizic la ghișeul oricărui serviciu public comunitar regim permise (SPCRPCÎV). Ai nevoie de cererea completată, actul de identitate valabil și dovada plății taxei; permisul românesc trebuie să fie valabil, iar dreptul de a conduce să nu fie suspendat. Timpul mediu de livrare este de circa 30 de zile calendaristice de la înregistrarea cererii, așa că nu îl lăsa pe ultima sută de metri înainte de plecarea în străinătate.</p><h2>Valabilitate și în ce țări îți trebuie</h2><p>Permisul internațional este valabil 3 ani de la emitere, dar nu poate depăși data de expirare a permisului național românesc; dacă acesta expiră mai devreme, valabilitatea IDP se oprește odată cu el. În interiorul UE/SEE nu ai nevoie de permis internațional, permisul românesc fiind recunoscut direct. Documentul devine relevant pentru state din afara UE. Recomandarea practică este să verifici cerințele exacte ale țării de destinație înainte de a călători, pentru că unele state cer IDP, iar altele nu.</p>",
    "faq": [
      {
        "question": "Cât costă permisul internațional de conducere în 2026?",
        "answer": "Taxa fixă este de 46 lei dacă îl obții de la DGPCI (posibil din octombrie 2024). ACR îl eliberează în continuare, dar la un cost mult mai mare."
      },
      {
        "question": "Cât este valabil permisul internațional?",
        "answer": "3 ani de la emitere, dar nu mai mult decât permisul național românesc. Dacă permisul național expiră mai devreme, expiră și cel internațional."
      },
      {
        "question": "Am nevoie de permis internațional în UE?",
        "answer": "Nu. În Uniunea Europeană și SEE permisul românesc este recunoscut direct. Permisul internațional îți trebuie pentru anumite state din afara UE."
      },
      {
        "question": "Unde depun cererea?",
        "answer": "Online prin HUB MAI (hub.mai.gov.ro), la secțiunea cerere permis internațional, sau fizic la ghișeul oricărui SPCRPCÎV. Timpul mediu de livrare este de circa 30 de zile calendaristice."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Direcția Generală Permise de Conducere și Înmatriculări ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "HUB MAI – cerere permis internațional ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxei ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=194",
        "label": "Acte necesare + procedura (traseul DGPCI/HUB MAI) — Permis de conducere internațional, serviciul oficial (hub.mai.gov.ro) ↗"
      }
    ]
  },
  {
    "slug": "preschimbare-permis-strain-cu-permis-romanesc",
    "url": "/ghid-auto/preschimbare-permis-strain-cu-permis-romanesc/",
    "title": "Preschimbare permis străin cu permis românesc 2026 – acte și condiții",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Preschimbare permis străin cu permis românesc 2026: acte necesare, condiții pentru state UE, non-UE și UK, cu sau fără examen. Unde depui dosarul.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Preschimbarea unui permis străin în permis românesc se adresează persoanelor cu domiciliul sau reședința în România care dețin un permis valabil emis de alt stat. Permisele din UE/SEE și cele din statele enumerate în anexele Ordinului MAI nr. 163/2011 (între care Regatul Unit, numeroase state ale Convenției de la Viena, precum și SUA, Canada, Japonia, Coreea de Sud sau Turcia) se preschimbă fără examen. Permisele din statele care nu figurează în anexele ordinului nu se preschimbă: titularii pot obține permis românesc doar prin examen, făcând dovada că sunt apți medical. Dacă există suspiciuni privind autenticitatea, preschimbarea se face după confirmarea autorității emitente, ceea ce poate prelungi termenul. Dosarul se depune la serviciul permise competent pentru domiciliu/reședință.",
    "docs": [
      "Permisul de conducere străin valabil (original)",
      "Traducere legalizată în română a permisului (în cazurile în care se cere)",
      "Actul de identitate al solicitantului (cu domiciliu/reședință în România)",
      "Cerere-tip completată",
      "Fișa medicală, în cazurile prevăzute de lege",
      "Dovada plății taxei de 139 lei",
      "Pentru permisele britanice: documentul „driving record” cu cod de verificare, emis online de autoritățile din Regatul Unit"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică eligibilitatea",
        "description": "Trebuie să ai domiciliul sau reședința în România și un permis străin valabil (neexpirat, nesuspendat). Verifică regimul aplicabil țării emitente."
      },
      {
        "num": 2,
        "title": "Pregătește traducerea",
        "description": "Pentru multe permise se cere o traducere legalizată în română. Verifică dacă este necesară în cazul tău."
      },
      {
        "num": 3,
        "title": "Plătește taxa",
        "description": "Achită taxa de 139 lei online pe ghiseul.ro sau dgpci.mai.gov.ro."
      },
      {
        "num": 4,
        "title": "Depune dosarul",
        "description": "Depui cererea la serviciul public comunitar regim permise competent pentru zona ta de domiciliu sau reședință."
      },
      {
        "num": 5,
        "title": "Așteaptă verificarea",
        "description": "Pentru state non-UE, autenticitatea permisului se verifică la autoritatea emitentă, ceea ce poate dura 30-90 de zile."
      }
    ],
    "costs": [
      {
        "item": "Taxa pentru permis de conducere românesc",
        "note": "plata online pe ghiseul.ro sau dgpci.mai.gov.ro",
        "value": "139 lei"
      },
      {
        "item": "Traducere legalizată permis",
        "note": "orientativ, doar când este cerută; verifică la traducător",
        "value": "~50-150 lei"
      },
      {
        "item": "Fișa medicală (când e cazul)",
        "note": "în situațiile prevăzute de lege",
        "value": "~200-350 lei"
      }
    ],
    "proseHtml": "<h2>Cine poate preschimba un permis străin</h2><p>Procedura este destinată persoanelor care au domiciliul sau reședința în România și dețin un permis de conducere valabil emis de un alt stat. Regulile diferă semnificativ în funcție de statul emitent, de categoria permisului și de acordurile internaționale aplicabile. Un permis expirat, pierdut, furat sau suspendat, de regulă, nu poate fi preschimbat, cu excepția anumitor situații (de exemplu permise UE expirate sau state cu acorduri bilaterale).</p><h2>Permise din state UE/SEE</h2><p>Permisele emise de statele membre UE și SEE beneficiază de recunoaștere directă și se preschimbă fără examen. Legislația europeană interzice deținerea simultană a două permise emise de state UE/SEE, așa că permisul vechi este retras și anulat sau trimis autorității emitente. Practic, primești un permis românesc echivalent, fără a mai da teste teoretice sau practice.</p><h2>Marea Britanie și alte state ale Convenției de la Viena</h2><p>Deși Regatul Unit nu mai face parte din UE, permisele britanice se preschimbă în continuare FĂRĂ EXAMEN, Regatul Unit fiind inclus în lista statelor din Ordinul MAI nr. 163/2011. Pe lângă permis și traducerea legalizată, se cere documentul „driving record” (cu codul de verificare), obținut online de pe site-ul guvernului britanic. Condiția esențială este ca permisul britanic să fie valabil (neexpirat și nesuspendat) în momentul depunerii cererii. Același regim favorabil se aplică multor state semnatare ale convenției.</p><h2>Permise din state non-UE și pași practici</h2><p>Permisele emise de state care nu figurează în anexele Ordinului MAI nr. 163/2011 nu pot fi preschimbate: titularii se pot prezenta la examen pentru obținerea permisului românesc, făcând dovada că sunt apți medical (art. 83 alin. (3^1) din OUG nr. 195/2002). Și pentru statele din anexe, dacă există suspiciuni privind autenticitatea, preschimbarea se face doar după confirmarea autorității emitente, ceea ce poate prelungi termenul. În multe cazuri se cere și o traducere legalizată în română a permisului. Dosarul se depune la serviciul public comunitar regim permise competent pentru zona ta de domiciliu sau reședință, iar taxa pentru permisul românesc este de <a href=\"https://hub.mai.gov.ro/serviciu/view?id=73\" target=\"_blank\" rel=\"noopener\">139 lei</a> (tarif în vigoare din 15.09.2026).</p><ul><li>Verifică din timp dacă statul tău emitent are acord cu România și dacă este necesar examen.</li><li>Începe demersurile devreme, mai ales pentru state non-UE, din cauza verificărilor de autenticitate.</li><li>Asigură-te că permisul străin este încă valabil la data depunerii cererii.</li></ul>",
    "faq": [
      {
        "question": "Trebuie să dau examen pentru a preschimba un permis străin?",
        "answer": "Nu pentru permisele din UE/SEE și din statele enumerate în anexele Ordinului MAI nr. 163/2011 (inclusiv Regatul Unit). Permisele din statele care nu sunt în aceste liste nu se preschimbă; titularii pot obține permis românesc doar prin examen."
      },
      {
        "question": "Pot preschimba un permis britanic după Brexit?",
        "answer": "Da. Regatul Unit figurează în lista statelor din Ordinul MAI nr. 163/2011, iar permisul britanic se preschimbă fără examen. Pe lângă permis și traducerea legalizată, ai nevoie de documentul „driving record” cu cod de verificare, emis online de autoritățile britanice."
      },
      {
        "question": "Cât durează preschimbarea pentru un permis non-UE?",
        "answer": "Verificarea autenticității la autoritatea emitentă poate dura între 30 și 90 de zile, în funcție de stat."
      },
      {
        "question": "Ce fac dacă permisul străin este expirat?",
        "answer": "De regulă, un permis expirat, pierdut sau furat nu poate fi preschimbat, cu excepția unor cazuri (permise UE expirate sau state cu acorduri bilaterale). Verifică situația la serviciul permise."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – portal oficial permise de conducere (dgpci.mai.gov.ro) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=73",
        "label": "Preschimbarea permisului de conducere străin cu document similar românesc — DGPCI (hub.mai.gov.ro) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata online a taxei de preschimbare ↗"
      }
    ]
  },
  {
    "slug": "permis-deteriorat",
    "url": "/ghid-auto/permis-deteriorat/",
    "title": "Permis deteriorat 2026 – acte necesare pentru înlocuire și procedură",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Permis de conducere deteriorat 2026: cum obții un duplicat, acte necesare, taxa de 139 lei și procedura pas cu pas. Fișa medicală nu e obligatorie.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Dacă permisul de conducere este deteriorat sau a devenit ilizibil, soliciți un duplicat la orice serviciu permise (SPCRPCÎV/DGPCI), prezentând documentul vechi (personalul îi taie colțul și ți-l restituie pe loc). Taxa este de 139 lei (din 15.09.2026), iar duplicatul păstrează aceeași perioadă de valabilitate. Fișa medicală NU este obligatorie dacă nu ceri o nouă valabilitate. Dosarul se poate depune și online prin HUB MAI.",
    "docs": [
      "Cerere-tip (completată la ghișeu sau online)",
      "Actul de identitate valabil (original)",
      "Permisul de conducere deteriorat (se prezintă la ghișeu; i se taie colțul și ți se restituie pe loc)",
      "Dovada plății taxei de 139 lei",
      "Fișa medicală – doar dacă soliciți o nouă perioadă de valabilitate"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Plătește taxa",
        "description": "Achită 139 lei online pe ghiseul.ro sau dgpci.mai.gov.ro. Pentru plata prin bancă sau SelfPay, păstrează dovada."
      },
      {
        "num": 2,
        "title": "Completează cererea",
        "description": "Depune cererea online prin HUB MAI (hub.mai.gov.ro) sau completează formularul direct la ghișeu."
      },
      {
        "num": 3,
        "title": "Prezintă permisul deteriorat",
        "description": "La depunere, prezinți documentul deteriorat împreună cu actul de identitate; personalul îi taie colțul din stânga sus și ți-l restituie pe loc."
      },
      {
        "num": 4,
        "title": "Verificare și personalizare",
        "description": "Se face verificarea automată, apoi permisul nou este personalizat la sediul central DGPCI."
      },
      {
        "num": 5,
        "title": "Primești noul permis",
        "description": "Documentul se livrează prin Poșta Română la adresă sau se ridică de la ghișeu; statusul se urmărește online."
      }
    ],
    "costs": [
      {
        "item": "Taxa pentru duplicat permis deteriorat",
        "note": "aceeași taxă ca pentru pierdere sau furt",
        "value": "139 lei"
      },
      {
        "item": "Fișa medicală (opțională)",
        "note": "doar dacă ceri o nouă perioadă de valabilitate",
        "value": "~200-350 lei"
      }
    ],
    "proseHtml": "<h2>Când se consideră permisul deteriorat</h2><p>Un permis de conducere este considerat deteriorat atunci când s-a rupt, s-a îndoit, s-a decolorat sau a devenit ilizibil, iar datele ori fotografia nu mai pot fi citite corect. Într-o astfel de situație ești obligat să îl înlocuiești, pentru că un document deteriorat poate fi respins la un control rutier sau la traversarea frontierei. Procedura este, în esență, aceeași cu cea pentru un duplicat în caz de pierdere sau furt.</p><h2>Ce acte îți trebuie</h2><p>Conform reglementărilor în vigoare (Ordinul MAI 82/2024), pentru înlocuirea unui permis deteriorat cu aceeași valabilitate ai nevoie doar de actul de identitate, permisul deteriorat (pe care îl prezinți la ghișeu; personalul îi taie colțul din stânga sus și ți-l restituie pe loc), cererea-tip și dovada plății taxei de 139 lei (tarif în vigoare din 15.09.2026). Spre deosebire de pierdere sau furt, aici nu este necesară o declarație pe propria răspundere, pentru că prezinți fizic documentul. Fișa medicală NU este obligatorie, cu excepția cazului în care ceri o nouă perioadă de valabilitate.</p><h2>Procedura și taxa în 2026</h2><p>Taxa este de 139 lei (din 15.09.2026; plățile de 89 lei făcute anterior și neutilizate nu mai sunt acceptate), identică cu cea pentru orice duplicat. Nu se mai achită cu numerar la ghișeu; o plătești online pe ghiseul.ro sau dgpci.mai.gov.ro (caz în care nu mai trebuie dovada plății) ori prin bancă/SelfPay (unde păstrezi dovada). Dosarul se depune la orice serviciu permise din țară, indiferent de domiciliu, fizic sau online prin HUB MAI. După verificarea automată, permisul este personalizat la sediul central și livrat prin poștă sau ridicat de la ghișeu.</p><h2>Sfaturi și capcane frecvente</h2><ul><li>Nu aștepta ca permisul să devină complet ilizibil; înlocuiește-l la primele semne de deteriorare gravă.</li><li>Dacă permisul se apropie oricum de expirare, poate fi mai eficient să faci direct reînnoirea cu fișă medicală și o nouă valabilitate.</li><li>Verifică datele din cererea online înainte de trimitere, ca să eviți întârzieri la personalizare.</li><li>Poți urmări statusul noului permis online, pe site-ul DGPCI.</li><li>După înregistrarea cererii, permisul vechi își pierde valabilitatea; la cerere primești o dovadă înlocuitoare, valabilă până la emiterea noului permis, dar nu mai mult de 30 de zile.</li></ul>",
    "faq": [
      {
        "question": "Cât costă înlocuirea unui permis deteriorat?",
        "answer": "Taxa este de 139 lei (din 15.09.2026), aceeași ca pentru un duplicat în caz de pierdere sau furt. Se plătește online pe ghiseul.ro sau dgpci.mai.gov.ro."
      },
      {
        "question": "Am nevoie de fișă medicală pentru un permis deteriorat?",
        "answer": "Nu, dacă păstrezi aceeași valabilitate. Fișa medicală este necesară doar dacă soliciți o nouă perioadă de valabilitate."
      },
      {
        "question": "Trebuie să predau permisul vechi?",
        "answer": "Îl prezinți la depunerea dosarului: personalul îi taie colțul din stânga sus (îl anulează) și ți-l restituie pe loc. În caz de pierdere sau furt, faptul se declară direct în cererea-tip, fără declarație separată."
      },
      {
        "question": "Pot depune cererea online?",
        "answer": "Da, prin platforma HUB MAI (hub.mai.gov.ro), sau fizic la orice serviciu permise din țară, indiferent de județul de domiciliu."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Direcția Generală Permise de Conducere și Înmatriculări ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "HUB MAI – depunere cerere online ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxei ↗"
      }
    ]
  },
  {
    "slug": "eliberare-duplicat-permis-de-conducere",
    "url": "/ghid-auto/eliberare-duplicat-permis-de-conducere/",
    "title": "Eliberare duplicat permis de conducere 2026 – acte necesare și taxă",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Duplicat permis de conducere 2026: acte necesare, taxă 139 lei și procedura pas cu pas în caz de pierdere, furt sau deteriorare. Depui online sau la ghișeu.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Duplicatul permisului de conducere se solicită la orice serviciu public comunitar regim permise (SPCRPCÎV/DGPCI), în caz de pierdere, furt sau deteriorare. Taxa este de 139 lei (din 15.09.2026), iar dosarul se poate depune și online prin aplicația DGPCI / HUB MAI. Certificatul medical NU este obligatoriu dacă păstrezi aceeași valabilitate; devine necesar doar dacă ceri o nouă perioadă de valabilitate. Permisul se livrează prin poștă sau se ridică de la ghișeu.",
    "docs": [
      "Cerere-tip (se completează la ghișeu sau online)",
      "Actul de identitate valabil (original)",
      "Dovada plății taxei de 139 lei (nu e necesară dacă plătești prin ghiseul.ro)",
      "Permisul de conducere original, dacă îl ai (personalul îi taie colțul din stânga sus și ți-l restituie pe loc)",
      "Pierderea sau furtul se declară prin completarea corespunzătoare a cererii-tip (nu e nevoie de o declarație separată)",
      "Fișa medicală – doar dacă soliciți o nouă perioadă de valabilitate"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Plătește taxa",
        "description": "Achită taxa de 139 lei online pe ghiseul.ro sau pe dgpci.mai.gov.ro. Pentru plata prin bancă/SelfPay, păstrează dovada plății."
      },
      {
        "num": 2,
        "title": "Completează cererea",
        "description": "Depune cererea online prin HUB MAI (hub.mai.gov.ro) sau completează formularul la ghișeu."
      },
      {
        "num": 3,
        "title": "Depune dosarul",
        "description": "Prezintă actele la orice serviciu permise din țară, indiferent de județul de domiciliu, sau transmite dosarul electronic."
      },
      {
        "num": 4,
        "title": "Verificarea și personalizarea",
        "description": "Se face verificarea automată, apoi permisul este personalizat la sediul central DGPCI."
      },
      {
        "num": 5,
        "title": "Primești permisul",
        "description": "Documentul este livrat prin Poșta Română la adresă sau poate fi ridicat de la ghișeu. Poți urmări statusul online."
      }
    ],
    "costs": [
      {
        "item": "Taxa pentru duplicat permis de conducere",
        "note": "aceeași taxă indiferent de motiv (pierdere, furt, deteriorare)",
        "value": "139 lei"
      },
      {
        "item": "Fișa medicală (opțională)",
        "note": "doar dacă soliciți o nouă perioadă de valabilitate",
        "value": "~200-350 lei"
      }
    ],
    "proseHtml": "<h2>Când soliciți un duplicat de permis</h2><p>Poți cere un duplicat al permisului de conducere în trei situații: pierdere, furt sau deteriorare a documentului. Duplicatul păstrează, de regulă, aceeași perioadă de valabilitate administrativă ca permisul înlocuit, așa că nu este vorba de o reînnoire, ci de refacerea documentului fizic. Instituția care emite permisele este DGPCI (Direcția Generală Permise de Conducere și Înmatriculări).</p><h2>Acte și taxa în 2026</h2><p>Conform reglementărilor în vigoare (Ordinul MAI 82/2024), pentru un duplicat cu aceeași valabilitate ai nevoie doar de cererea-tip (în care declari, după caz, pierderea sau furtul), actul de identitate, permisul (dacă îl ai – personalul îi taie colțul și ți-l restituie pe loc) și dovada plății taxei de 139 lei (tarif în vigoare din 15.09.2026). Fișa medicală NU este necesară în acest caz. Ea devine obligatorie doar dacă vrei ca noul permis să aibă o nouă perioadă de valabilitate.</p><h2>Cum și unde depui dosarul</h2><p>Un avantaj important este că poți depune dosarul la orice serviciu public comunitar regim permise din țară, indiferent de județul tău de domiciliu. Depunerea se poate face fizic, la ghișeu, sau online prin platforma HUB MAI (hub.mai.gov.ro). După verificarea automată, permisul este personalizat la sediul central și livrat prin Poșta Română la adresa indicată sau ridicat de la ghișeu.</p><h2>Cum plătești taxa și verifici statusul</h2><p>Taxa de 139 lei (din 15.09.2026; plățile de 89 lei făcute anterior și neutilizate nu mai sunt acceptate) nu se mai achită cu numerar la ghișeu. O poți plăti online pe ghiseul.ro sau pe dgpci.mai.gov.ro, caz în care dovada plății nu mai este necesară. Dacă plătești prin bancă (BCR, CEC Bank) sau prin stațiile SelfPay, trebuie să păstrezi și să prezinți dovada plății. După depunere, poți urmări online statusul permisului tău pe site-ul DGPCI.</p><ul><li>Dacă permisul a fost furat, este util să anunți și poliția pentru o eventuală evidență.</li><li>Verifică datele din cerere înainte de a o trimite, ca să eviți întârzieri la personalizare.</li><li>Odată înregistrată cererea, permisul vechi își pierde valabilitatea; la cerere primești o dovadă înlocuitoare, valabilă până la emiterea noului permis, dar nu mai mult de 30 de zile.</li></ul>",
    "faq": [
      {
        "question": "Cât costă un duplicat de permis în 2026?",
        "answer": "Taxa este de 139 lei (din 15.09.2026), aceeași indiferent dacă permisul a fost pierdut, furat sau deteriorat. Se plătește online pe ghiseul.ro sau dgpci.mai.gov.ro."
      },
      {
        "question": "Am nevoie de fișă medicală pentru duplicat?",
        "answer": "Nu, dacă păstrezi aceeași valabilitate. Fișa medicală devine obligatorie doar dacă soliciți o nouă perioadă de valabilitate pentru permis."
      },
      {
        "question": "Pot depune dosarul în alt județ decât cel de domiciliu?",
        "answer": "Da. Din prezent poți depune cererea la orice serviciu permise din țară, indiferent de județul de domiciliu."
      },
      {
        "question": "Cum primesc noul permis?",
        "answer": "Permisul este livrat prin Poșta Română la adresa indicată sau poate fi ridicat de la ghișeu. Statusul poate fi urmărit online pe site-ul DGPCI."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Direcția Generală Permise de Conducere și Înmatriculări ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "HUB MAI – depunere cerere online ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro – plata taxei ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      }
    ]
  },
  {
    "slug": "casco-cu-plata-in-rate",
    "url": "/ghid-auto/casco-cu-plata-in-rate/",
    "title": "CASCO cu plata în rate 2026 – condiții, acte necesare și procedură",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "CASCO cu plata în rate 2026: condiții, câte rate fără dobândă, procedura și ce se întâmplă dacă nu plătești o rată la timp.",
    "updateDate": "🗓 Actualizat 23 Iulie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "CASCO se poate plăti în rate, de regulă fără dobândă. Direct la asigurător poți împărți prima în 2-4 rate, iar cu un card de cumpărături poți ajunge la 12 rate lunare. Prima rată se achită la emiterea poliței, restul conform scadențarului, iar neplata unei rate poate duce la suspendarea sau rezilierea acoperirii.",
    "docs": [
      "Actul de identitate al proprietarului (sau CUI, pentru persoane juridice)",
      "Certificatul de înmatriculare (talonul) sau factura, pentru mașini noi",
      "Cartea de identitate a vehiculului (CIV)",
      "Raportul inspecției de risc (pentru mașini rulate)",
      "Cardul de cumpărături (opțional, dacă vrei mai multe rate fără dobândă)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege pachetul CASCO",
        "description": "Stabilește acoperirea, valoarea asigurată și franșiza. Prima totală anuală este baza pe care se împarte în rate."
      },
      {
        "num": 2,
        "title": "Alege numărul de rate",
        "description": "Direct la asigurător se oferă de obicei plata în 2 sau 4 rate. Cu un card de cumpărături poți ajunge până la 12 rate lunare."
      },
      {
        "num": 3,
        "title": "Verifică dobânda și scadențarul",
        "description": "În majoritatea cazurilor ratele sunt egale și fără dobândă. Confirmă în contract termenele scadente și modalitatea de plată."
      },
      {
        "num": 4,
        "title": "Plătește prima rată la emitere",
        "description": "Polița intră în vigoare după plata primei rate. Restul se achită eșalonat, în lunile următoare."
      },
      {
        "num": 5,
        "title": "Respectă scadențarul",
        "description": "Plătește fiecare rată la timp pentru a menține acoperirea neîntreruptă pe toată durata poliței."
      }
    ],
    "costs": [
      {
        "item": "Plată în rate directe la asigurător",
        "note": "de regulă fără dobândă",
        "value": "2-4 rate"
      },
      {
        "item": "Plată cu card de cumpărături",
        "note": "fără dobândă, în rețeaua partenerilor",
        "value": "până la 12 rate lunare"
      },
      {
        "item": "Prima rată",
        "note": "polița intră în vigoare după plata ei",
        "value": "la emiterea poliței"
      }
    ],
    "proseHtml": "<h2>CASCO se poate plăti eșalonat</h2><p>Prima CASCO este mai mare decât cea a RCA-ului, așa că majoritatea asigurătorilor permit plata în rate. Astfel, în loc să achiți toată suma la început, împarți prima anuală în tranșe egale. În cele mai multe cazuri, plata în rate nu presupune dobândă sau costuri suplimentare, spre deosebire de un credit clasic de consum.</p><h2>Câte rate poți alege</h2><p>Există două variante uzuale. Prima este eșalonarea directă la asigurător, de regulă în 2 rate (semestrial) sau 4 rate (trimestrial), inclusă în contractul de asigurare. A doua variantă este plata cu un card de cumpărături, care permite împărțirea primei în până la 12 rate lunare fără dobândă, în rețeaua de parteneri. Cardul nu este obligatoriu, dar oferă mai multă flexibilitate.</p><h2>Cum funcționează scadențarul</h2><p>Prima rată se achită la emiterea poliței, care intră în vigoare din acel moment. Restul ratelor se plătesc la datele stabilite în scadențar, în lunile următoare. Este important să reții aceste termene, pentru că acoperirea depinde de plata la timp a fiecărei rate.</p><h2>Ce se întâmplă dacă întârzii o rată</h2><p>Neplata unei rate la scadență poate duce, în funcție de condițiile contractuale, la suspendarea temporară a acoperirii sau chiar la rezilierea poliței. În caz de daună într-o perioadă cu rate neachitate, despăgubirea poate fi redusă sau refuzată. Dacă anticipezi o problemă de plată, contactează asigurătorul din timp pentru a evita pierderea acoperirii.</p><h2>Sfaturi utile</h2><p>Compară costul total în varianta cu plata integrală față de cea în rate; uneori plata integrală vine cu un mic discount. Verifică modalitatea de plată acceptată (card, transfer, direct debit) și setează-ți memento-uri pentru scadențe. Citește cu atenție clauza privind consecințele neplății, pentru că diferă de la un asigurător la altul.</p>",
    "faq": [
      {
        "question": "În câte rate pot plăti CASCO?",
        "answer": "Direct la asigurător, de obicei în 2 sau 4 rate. Cu un card de cumpărături poți ajunge la până la 12 rate lunare, în general fără dobândă."
      },
      {
        "question": "Plata CASCO în rate are dobândă?",
        "answer": "În majoritatea cazurilor nu. Ratele sunt egale și fără dobândă, spre deosebire de un credit de consum. Confirmă totuși condițiile în contractul de asigurare."
      },
      {
        "question": "Ce se întâmplă dacă nu plătesc o rată la timp?",
        "answer": "Poți pierde acoperirea: în funcție de contract, polița se poate suspenda sau rezilia, iar despăgubirea pentru o daună din acea perioadă poate fi redusă sau refuzată."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "fransiza-casco-explicata",
    "url": "/ghid-auto/fransiza-casco-explicata/",
    "title": "Franșiză CASCO explicată 2026 – ce înseamnă și cum influențează prețul",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Franșiză CASCO explicată 2026: ce înseamnă, tipurile de franșiză, cum se aplică la despăgubire și de ce o franșiză mai mare reduce prețul poliței.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Franșiza CASCO este partea din daună pe care o suporți tu, din buzunar, la fiecare eveniment; restul îl plătește asigurătorul. Poate fi o sumă fixă sau un procent din valoarea reparației. Cu cât franșiza e mai mare, cu atât prima anuală e mai mică - o poliță cu franșiză de 1000 RON poate fi cu 30-50% mai ieftină decât una fără franșiză.",
    "docs": [],
    "steps": [],
    "costs": [
      {
        "item": "Franșiză uzuală CASCO",
        "note": "Sumă fixă reținută la fiecare daună; poate fi și procentuală",
        "value": "100 - 500 EUR"
      },
      {
        "item": "Franșiză pentru daună totală",
        "note": "Se aplică separat, la daunele totale; variază pe contract",
        "value": "de regulă 10-20% din valoare"
      },
      {
        "item": "Reducere de primă cu franșiză",
        "note": "O franșiză mai mare scade semnificativ prima anuală față de o poliță fără franșiză",
        "value": "~30-50%"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă franșiza la CASCO</h2><p>Franșiza este suma pe care o suporți tu la fiecare daună, înainte ca asigurătorul să plătească restul. Practic, este o împărțire a costurilor: dacă ai franșiză de 200 EUR și repararea costă 1000 EUR, tu plătești 200 EUR, iar asigurătorul acoperă diferența de 800 EUR. Rolul franșizei este să te responsabilizeze și să descurajeze dosarele pentru pagube foarte mici, ceea ce permite asigurătorului să îți ofere o primă mai ieftină.</p><h2>Tipuri de franșiză</h2><p>La CASCO întâlnești mai multe forme de franșiză:</p><ul><li><strong>Fixă</strong> - plătești aceeași sumă la fiecare daună, indiferent de gravitate (ex. 150 EUR).</li><li><strong>Procentuală</strong> - se calculează ca procent din valoarea pagubei sau din suma asigurată.</li><li><strong>Deductibilă (absolută) sau simplă (atinsă)</strong> - franșiza deductibilă se scade din fiecare despăgubire, în timp ce franșiza simplă te împiedică doar să ceri despăgubire pentru pagube sub prag; dacă paguba îl depășește, se plătește integral.</li><li><strong>Progresivă</strong> - suma crește dacă înregistrezi mai multe daune într-un interval de timp.</li><li><strong>Franșiză pentru daună totală</strong> - un procent separat (frecvent 10-20%) aplicat când mașina este declarată daună totală sau furată.</li></ul><p>Multe polițe combină o franșiză mică pe daună parțială cu o franșiză mai mare pe daună totală, așa că citește cu atenție condițiile.</p><h2>Cum influențează franșiza prețul</h2><p>Regula este simplă: cu cât franșiza e mai mare, cu atât prima anuală e mai mică. O poliță cu franșiză de 1000 RON poate fi cu 30-50% mai ieftină decât una fără franșiză, tocmai pentru că îți asumi tu o parte din risc. În schimb, la fiecare daună vei plăti mai mult din buzunar. Pentru orientare, o poliță CASCO costă în general între 2% și 7% din valoarea mașinii pe an, iar franșiza este unul dintre parametrii cu cel mai mare impact asupra acestui cost.</p><h2>Cum alegi franșiza potrivită și când NU o plătești</h2><p>Alegerea depinde de bugetul tău, de valoarea mașinii și de cât de des conduci. Pentru mașini noi sau scumpe, o franșiză mică protejează mai bine investiția; pentru mașini mai vechi sau dacă vrei o primă mică, o franșiză mare este mai economică. Regula de aur: alege o franșiză pe care o poți acoperi realist din propriul buzunar în orice moment.</p><p>Un aspect important: dacă dauna nu este din vina ta, iar vinovatul este identificat și are RCA valabil, franșiza CASCO reținută se poate recupera de la asigurătorul acestuia. Așadar, franșiza te afectează financiar mai ales la accidentele în care ești vinovat sau când autorul rămâne necunoscut.</p>",
    "faq": [
      {
        "question": "Merită o poliță CASCO fără franșiză?",
        "answer": "Depinde. Fără franșiză nu plătești nimic la daună, dar prima e mai scumpă cu până la 30-50%. Merită pentru mașini noi sau dacă vrei liniște totală; altfel o franșiză mică-medie e mai economică."
      },
      {
        "question": "Franșiza se aplică la fiecare daună?",
        "answer": "De regulă, da. La majoritatea polițelor franșiza se reține la fiecare eveniment despăgubit, nu o singură dată pe an, însă unele polițe o aplică doar pentru anumite riscuri sau renunță la ea când vinovatul are RCA - verifică în condițiile poliței. Dacă ai mai multe daune, o plătești de fiecare dată."
      },
      {
        "question": "Îmi recuperez franșiza dacă nu sunt vinovat?",
        "answer": "Da, dacă vinovatul este identificat și are RCA valabil, poți recupera franșiza de la asigurătorul lui. Dacă ești vinovat sau autorul e necunoscut, franșiza rămâne în sarcina ta."
      },
      {
        "question": "Ce este franșiza pentru daună totală?",
        "answer": "Este un procent separat (frecvent 10-20% din valoare) reținut atunci când mașina este declarată daună totală sau furată, diferit de franșiza pentru daune parțiale."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://www.asfromania.ro/ro/c/46/consumatori",
        "label": "ASF - informare consumatori asigurări ↗"
      },
      {
        "url": "https://www.asfromania.ro/ro/c/122/ghiduri-asigurari",
        "label": "ASF - Ghiduri Asigurări ↗"
      }
    ]
  },
  {
    "slug": "despagubire-casco-dupa-accident",
    "url": "/ghid-auto/despagubire-casco-dupa-accident/",
    "title": "Despăgubire CASCO după accident 2026 – acte necesare și termen",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Despăgubire CASCO după accident 2026: acte necesare, cum deschizi dosarul de daună, termenul de notificare și cât durează până primești banii.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru despăgubirea CASCO după accident anunți asigurătorul imediat (de regulă în 24-48 de ore, conform contractului), deschizi dosarul de daună și aștepți constatarea pagubei înainte de a repara mașina. Depui actele complete (poliță, talon, permis, dovada evenimentului), iar despăgubirea se acordă prin reparație în service sau în bani, de obicei în 10-15 zile de la constatare și devizul acceptat.",
    "docs": [
      "Polița CASCO și, după caz, RCA",
      "Certificatul de înmatriculare (talonul) al vehiculului",
      "Permisul de conducere al conducătorului din momentul accidentului",
      "Actul de identitate al proprietarului",
      "Dovada evenimentului: constatare amiabilă, proces-verbal de la poliție sau notă de constatare (pompieri/primărie pentru evenimente naturale)",
      "Descrierea împrejurărilor și fotografii cu avariile",
      "Devizul de reparație (dacă repararea se face în service partener nu este necesar)",
      "Coordonatele contului bancar (pentru despăgubirea în bani)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Anunță asigurătorul imediat",
        "description": "Notifică dauna în termenul din contract, de regulă 24-48 de ore de la eveniment. Întârzierea poate duce la refuzul despăgubirii dacă, din cauza ei, asigurătorul nu mai poate stabili cauza evenimentului și întinderea pagubei."
      },
      {
        "num": 2,
        "title": "Nu repara mașina înainte de constatare",
        "description": "Așteaptă inspectorul de daune sau expertiza. Dacă repari înainte, asigurătorul poate refuza plata pentru că nu mai poate evalua pagubele."
      },
      {
        "num": 3,
        "title": "Deschide dosarul de daună",
        "description": "Prezintă actele mașinii și dovada evenimentului. Inspectorul întocmește procesul-verbal de constatare cu avariile identificate."
      },
      {
        "num": 4,
        "title": "Depune documentele complete",
        "description": "Predă toate actele solicitate. Majoritatea asigurătorilor cer dosarul complet în 15-30 de zile de la raportarea daunei."
      },
      {
        "num": 5,
        "title": "Alege modul de despăgubire",
        "description": "Optezi pentru reparație în service-ul agreat (asigurătorul plătește direct atelierul) sau pentru despăgubire în bani, pe baza devizului acceptat."
      },
      {
        "num": 6,
        "title": "Primești despăgubirea",
        "description": "După acceptarea devizului, plata sau finalizarea reparației se face de regulă în 10-15 zile. Din despăgubire se scade franșiza, dacă polița are una."
      }
    ],
    "costs": [
      {
        "item": "Franșiză reținută la daună",
        "note": "Se scade din despăgubire; depinde de tipul de poliță (cu sau fără franșiză)",
        "value": "de la 0 la câteva sute de euro"
      },
      {
        "item": "Deschidere dosar de daună",
        "note": "Constatarea și deschiderea dosarului nu se taxează",
        "value": "Gratuit"
      }
    ],
    "proseHtml": "<h2>Ce acoperă CASCO și cum funcționează despăgubirea</h2><p>Spre deosebire de RCA, care acoperă pagubele produse altora, CASCO este o asigurare facultativă care îți despăgubește propria mașină, indiferent dacă ești sau nu vinovat de accident. Acoperă coliziuni, răsturnări, vandalism, furt, incendiu și, de multe ori, evenimente naturale (grindină, furtună, inundații). Regulile exacte, franșiza și excluderile sunt stabilite în condițiile de asigurare ale poliței tale.</p><h2>Primul lucru după accident: notificarea și constatarea</h2><p>Cel mai important pas este să anunți asigurătorul cât mai repede, în termenul prevăzut în contract (frecvent 24-48 de ore). A doua regulă de aur: nu repara și nu interveni asupra mașinii înainte ca inspectorul de daune să facă constatarea. Fără acest proces-verbal, compania poate refuza plata, pentru că nu mai poate stabili ce avarii provin din evenimentul declarat.</p><p>Pentru anumite evenimente ai nevoie de un document oficial: constatare amiabilă sau proces-verbal de la poliție în cazul coliziunilor cu alt vehicul, respectiv notă de constatare de la pompieri sau primărie pentru fenomene naturale sau incendii. Dacă în accident a fost avariată doar mașina ta și ai CASCO, legea nu te obligă să mergi la poliție - avizezi direct asigurătorul (verifică totuși ce cere polița ta).</p><h2>Termenele de soluționare și plată (stabilite prin contract)</h2><p>Spre deosebire de RCA, la CASCO legea nu fixează termene de soluționare: ele sunt cele din condițiile poliței tale. După deschiderea dosarului și constatare, asigurătorul evaluează dauna și emite o ofertă. Dacă nu sunteți de acord asupra sumei, partea necontestată trebuie plătită înainte de soluționarea neînțelegerii. Documentele complete se depun de obicei în 15-30 de zile de la raportare. În practică, un dosar CASCO se soluționează în medie în 25-30 de zile, iar plata efectivă sau finalizarea reparației în service se face de regulă în 10-15 zile de la acceptarea devizului. Pentru cazuri suspecte, asigurătorul poate deschide o investigație, care prelungește termenul.</p><h2>Reparație în service sau despăgubire în bani</h2><p>Ai două variante. Prin reparație în service agreat, asigurătorul plătește direct atelierul, iar tu achiți doar franșiza (dacă există). Prin despăgubire în bani, primești suma stabilită prin deviz în cont și te ocupi singur de reparație. La mașinile în garanție, verifică în condițiile poliței dacă reparația se face în service autorizat al mărcii; multe polițe CASCO pentru mașini noi prevăd acest lucru, iar o reparație corectă, cu piese de calitate echivalentă, nu ar trebui în sine să anuleze garanția. Dacă dauna depășește un anumit prag din valoarea mașinii (frecvent 75%), asigurătorul o declară daună totală și te despăgubește cu valoarea de piață minus resturile valorificabile.</p>",
    "faq": [
      {
        "question": "Pot repara mașina înainte de constatarea daunei?",
        "answer": "Nu este recomandat. Fără procesul-verbal de constatare al inspectorului, asigurătorul poate refuza despăgubirea, pentru că nu mai poate verifica avariile."
      },
      {
        "question": "Se reține franșiza dacă nu sunt eu vinovat?",
        "answer": "Dacă vinovatul este identificat și are RCA valabil, franșiza CASCO se poate recupera de la asigurătorul acestuia. Dacă ești vinovat sau autorul e necunoscut, franșiza rămâne în sarcina ta."
      },
      {
        "question": "Cât durează până primesc banii sau reparația?",
        "answer": "În medie 25-30 de zile de la deschiderea dosarului, iar plata efectivă sau finalizarea reparației se face de obicei în 10-15 zile de la acceptarea devizului."
      },
      {
        "question": "Îmi crește prima CASCO după o daună?",
        "answer": "De regulă da, la reînnoire, mai ales dacă ai avut mai multe daune. Unele polițe au și clauze de tip bonus-malus proprii pentru CASCO."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://asfromania.ro/ro/c/46/consumatori",
        "label": "ASF - portal petiții și informare consumatori ↗"
      },
      {
        "url": "https://asfromania.ro/ro/c/120/depunere-petiții",
        "label": "ASF - Depunere petiții (formular online) ↗"
      },
      {
        "url": "https://salfin.ro/",
        "label": "SAL-Fin - soluționarea alternativă a litigiilor financiare ↗"
      }
    ]
  },
  {
    "slug": "asigurare-casco-pentru-masina-second-hand",
    "url": "/ghid-auto/asigurare-casco-pentru-masina-second-hand/",
    "title": "Asigurare CASCO pentru mașina second hand 2026 – acte și condiții",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Asigurare CASCO pentru mașina second hand 2026: condiții, limită de vârstă, inspecția cu poze, cum se stabilește valoarea și acte necesare.",
    "updateDate": "🗓 Actualizat 23 Iulie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "CASCO se poate încheia și pentru o mașină second hand, dacă vehiculul este în stare bună, are ITP valabil și se încadrează în limita de vârstă acceptată de asigurător (frecvent până la 12-15 ani, iar la unele produse până la 20 de ani). Polița se emite după o inspecție de risc cu fotografii, iar valoarea asigurată se stabilește la valoarea de piață.",
    "docs": [
      "Actul de identitate al proprietarului (sau CUI, pentru persoane juridice)",
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV)",
      "ITP valabil",
      "Raportul inspecției de risc cu fotografii ale mașinii",
      "Datele tehnice ale mașinii (serie șasiu, rulaj, motorizare, dotări)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică eligibilitatea mașinii",
        "description": "Confirmă că vehiculul se încadrează în limita de vârstă a asigurătorului, are ITP valabil și este într-o stare tehnică bună, fără avarii majore."
      },
      {
        "num": 2,
        "title": "Programează inspecția de risc",
        "description": "Un reprezentant al asigurătorului fotografiază mașina, notează modificările și avariile existente, care nu vor fi despăgubite ulterior."
      },
      {
        "num": 3,
        "title": "Stabilește valoarea asigurată",
        "description": "Pentru o mașină rulată, valoarea se determină pe baza cataloagelor de specialitate și a stării reale, ținând cont de depreciere."
      },
      {
        "num": 4,
        "title": "Alege pachetul și franșiza",
        "description": "Pentru mașini mai vechi, unele produse au franșiză fixă sau limite de despăgubire mai mici, dar și prime mai accesibile."
      },
      {
        "num": 5,
        "title": "Plătește prima și primești polița",
        "description": "Poți plăti integral sau în rate. Verifică din contract cum se aplică deprecierea și eventualele restricții pe vârsta șoferului."
      }
    ],
    "costs": [
      {
        "item": "Primă CASCO anuală (orientativ)",
        "note": "depinde de valoare, vârstă, rulaj, istoric daune",
        "value": "individualizată"
      },
      {
        "item": "Valoare asigurată maximă la produse pentru mașini vechi",
        "note": "variază pe produs; verifică la asigurător",
        "value": "7.500-30.000 RON / până la 10.000 EUR"
      },
      {
        "item": "Franșiză",
        "note": "unele produse au franșiză fixă pe eveniment",
        "value": "0-10% sau sumă fixă"
      }
    ],
    "proseHtml": "<h2>Se poate face CASCO la o mașină rulată</h2><p>Contrar unei idei răspândite, CASCO nu este rezervat mașinilor noi. Poți asigura și un autovehicul second hand, atâta timp cât este funcțional, are ITP valabil și se încadrează în condițiile asigurătorului. Diferența față de o mașină nouă stă în modul de stabilire a valorii și în verificările suplimentare cerute înainte de emitere.</p><h2>Limita de vârstă acceptată</h2><p>Fiecare companie are propriile praguri. În general, mașinile pot fi asigurate până la circa 12-15 ani, iar la unele produse specializate limita ajunge chiar la 20 de ani. Există și restricții la reînnoire: unii asigurători acceptă continuarea unei polițe CASCO doar până la o anumită vârstă a mașinii. De aceea merită să compari mai multe oferte, mai ales pentru vehicule mai vechi.</p><h2>Inspecția de risc cu fotografii</h2><p>Spre deosebire de o mașină 0 km, o mașină rulată necesită aproape întotdeauna o inspecție de risc. Reprezentantul asigurătorului fotografiază mașina, notează dotările și eventualele modificări și întocmește un proces-verbal semnat de ambele părți. Avariile existente la momentul inspecției nu vor fi despăgubite ulterior, așa că este important ca raportul să fie corect.</p><h2>Cum se stabilește valoarea</h2><p>La o mașină second hand, valoarea asigurată se calculează pe baza cataloagelor de specialitate și a stării reale a vehiculului, ținând cont de rulaj, uzură și disponibilitatea pieselor. Cu cât mașina este mai veche, cu atât valoarea asigurată scade, chiar dacă rata primei poate rămâne relativ ridicată. Verifică din contract cum se aplică deprecierea în timp asupra sumei despăgubite.</p><h2>Merită CASCO la o mașină veche?</h2><p>Decizia ține de valoarea de piață rămasă și de costul primei. Pentru o mașină care încă are o valoare semnificativă, CASCO poate fi justificat, mai ales împotriva furtului și a daunelor din fenomene naturale. Pentru vehicule cu valoare mică, uneori o poliță de furt sau un pachet minim de riscuri este mai rentabil decât un full CASCO.</p>",
    "faq": [
      {
        "question": "Ce vârstă maximă acceptă asigurătorii pentru CASCO?",
        "answer": "Depinde de companie. În general, limita este de circa 12-15 ani, dar există produse specializate care asigură mașini până la 20 de ani. La reînnoire, unele companii impun praguri mai stricte."
      },
      {
        "question": "Este obligatorie inspecția pentru o mașină second hand?",
        "answer": "Aproape întotdeauna, da. Asigurătorul face o inspecție de risc cu fotografii și notează avariile existente, care nu vor fi despăgubite ulterior."
      },
      {
        "question": "Cum se stabilește valoarea asigurată la o mașină rulată?",
        "answer": "Pe baza cataloagelor de specialitate și a stării reale a mașinii, ținând cont de an, rulaj și uzură. Valoarea scade odată cu vechimea și se poate diminua în timp prin depreciere."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "asigurare-casco-pentru-masina-noua",
    "url": "/ghid-auto/asigurare-casco-pentru-masina-noua/",
    "title": "Asigurare CASCO pentru mașina nouă 2026 – acte necesare și acoperire",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Asigurare CASCO pentru mașina nouă 2026: ce acoperă, acte necesare, cum se stabilește valoarea, franșiza și de ce e obligatorie în leasing sau credit.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "CASCO pentru o mașină nouă acoperă propriul autovehicul în caz de accident, furt, vandalism, incendiu sau fenomene naturale. Valoarea asigurată se stabilește pe baza facturii de achiziție, iar pentru mașinile 0 km de regulă nu este nevoie de inspecție de risc. În leasing sau credit auto, CASCO este de regulă cerut prin contractul de finanțare.",
    "docs": [
      "Actul de identitate al proprietarului (sau CUI, pentru persoane juridice)",
      "Factura de achiziție a mașinii noi",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare (dacă mașina este deja înmatriculată)",
      "Contractul de leasing sau de credit (dacă este cazul)",
      "Datele tehnice ale mașinii (serie șasiu, motorizare, dotări)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Stabilește valoarea asigurată",
        "description": "Pentru o mașină nouă, valoarea se ia din factura de achiziție. Aceasta este suma maximă pe care o poți primi în caz de daună totală sau furt."
      },
      {
        "num": 2,
        "title": "Alege pachetul și franșiza",
        "description": "Decide între CASCO de bază și full CASCO și alege nivelul franșizei. O franșiză mai mare scade prima, dar crește suma pe care o plătești tu la daună."
      },
      {
        "num": 3,
        "title": "Compară ofertele mai multor asigurători",
        "description": "Prima nu are grilă fixă, deci diferă mult între companii. Compară acoperirea, nu doar prețul."
      },
      {
        "num": 4,
        "title": "Furnizează actele și datele mașinii",
        "description": "Pentru o mașină 0 km, factura ține de regulă loc de inspecție de risc, deci polița se poate emite rapid."
      },
      {
        "num": 5,
        "title": "Plătește prima și primești polița",
        "description": "Poți plăti integral sau în rate. Polița intră în vigoare la data agreată și rămâne valabilă, de obicei, 12 luni."
      }
    ],
    "costs": [
      {
        "item": "Primă CASCO anuală (orientativ)",
        "note": "variază mult, cere oferte personalizate",
        "value": "2-5% din valoarea mașinii"
      },
      {
        "item": "Exemplu mașină ~25.000 EUR",
        "note": "orientativ, șofer 35 ani, București, fără franșiză",
        "value": "2.800-5.040 RON/an"
      },
      {
        "item": "Franșiză la daună",
        "note": "aleasă de tine; scade prima dacă e mai mare",
        "value": "0-10% din daună"
      }
    ],
    "proseHtml": "<h2>De ce merită CASCO la o mașină nouă</h2><p>O mașină nouă are cea mai mare valoare de piață și, implicit, cel mai mare risc financiar în caz de daună. RCA acoperă doar pagubele produse altora, nu și mașina ta. CASCO completează această lacună și îți despăgubește propriul autovehicul în caz de accident din vina ta, furt, vandalism, grindină sau incendiu.</p><h2>Cum se stabilește valoarea asigurată</h2><p>Pentru o mașină nouă, asigurătorul folosește valoarea din factura de achiziție. Aceasta reprezintă plafonul maxim de despăgubire. Pe parcursul anului, valoarea asigurată se poate diminua prin depreciere, în funcție de condițiile poliței, așa că merită să citești cum se aplică deprecierea în contract.</p><h2>Obligatorie în leasing și credit</h2><p>Deși CASCO este o asigurare facultativă, aproape toate companiile de leasing și băncile o impun ca obligație contractuală pe toată durata finanțării. De regulă, instituția finanțatoare este trecută ca beneficiar al despăgubirii pentru dauna totală sau furt. Verifică în contractul de leasing pachetul minim de acoperire cerut.</p><h2>Franșiza și opțiunile utile</h2><p>Franșiza este suma pe care o suporți tu la fiecare daună. O franșiză mai mare înseamnă o primă mai mică, dar costuri mai mari când ai un eveniment. La mașinile noi este utilă și asigurarea GAP, care acoperă diferența dintre valoarea de achiziție și cea de piață în caz de daună totală, precum și clauze pentru mașină la schimb sau reparație exclusiv în service-ul mărcii.</p><h2>Atenție la excluderi</h2><p>Majoritatea polițelor CASCO exclud de la despăgubire situațiile în care șoferul a condus fără permis valabil, sub influența alcoolului sau a drogurilor, a participat la competiții sau a părăsit locul accidentului - lista exactă diferă de la un asigurător la altul, pentru că excluderile sunt stabilite prin contract, nu prin lege. Cheile sau talonul lăsate în mașină pot duce la refuzul despăgubirii în caz de furt. Citește lista de excluderi înainte de a semna.</p>",
    "faq": [
      {
        "question": "Trebuie inspecție de risc pentru o mașină nouă?",
        "answer": "De regulă nu. Pentru o mașină 0 km, factura de achiziție ține loc de inspecție, iar polița se poate emite rapid, chiar din ziua achiziției."
      },
      {
        "question": "Este CASCO obligatoriu dacă iau mașina în leasing sau credit?",
        "answer": "Da, prin contract. Aproape toate companiile de leasing și băncile impun CASCO valabil pe toată perioada finanțării, cu finanțatorul ca beneficiar al despăgubirii."
      },
      {
        "question": "Cât costă CASCO pentru o mașină nouă?",
        "answer": "Nu există un preț fix. Orientativ, prima anuală reprezintă câteva procente din valoarea mașinii și depinde de model, șofer, localitate și franșiză. Cere oferte personalizate de la mai mulți asigurători."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "comparatie-rca-vs-casco",
    "url": "/ghid-auto/comparatie-rca-vs-casco/",
    "title": "Comparație RCA vs CASCO 2026 – diferențe, avantaje și ce alegi",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Comparație RCA vs CASCO 2026: diferențe, ce acoperă fiecare, obligatoriu vs facultativ, costuri și cum alegi asigurarea potrivită pentru mașina ta.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "RCA este obligatorie și acoperă doar daunele produse altor persoane în accidentele din vina ta. CASCO este facultativă și acoperă propriul autovehicul în caz de accident, furt, vandalism sau fenomene naturale, indiferent de vinovăție. Cele două se completează: RCA este minimul legal, iar CASCO adaugă protecția mașinii tale.",
    "docs": [],
    "steps": [],
    "costs": [
      {
        "item": "RCA",
        "note": "prima depinde de mașină, șofer, clasa bonus-malus",
        "value": "obligatorie"
      },
      {
        "item": "CASCO",
        "note": "de regulă mai scumpă, câteva procente din valoarea mașinii/an",
        "value": "facultativă"
      }
    ],
    "proseHtml": "<h2>Diferența de bază: cine plătește pentru ce</h2><p>RCA (Răspundere Civilă Auto) este asigurarea obligatorie pentru orice vehicul înmatriculat în România, chiar dacă nu circulă; obligația se suspendă doar dacă suspenzi înmatricularea și ții mașina într-un spațiu privat. Ea acoperă doar pagubele pe care le produci altor participanți la trafic. Cu alte cuvinte, dacă ești vinovat de un accident, RCA-ul tău plătește reparațiile celuilalt, dar mașina ta rămâne problema ta. CASCO este o asigurare facultativă care îți protejează propriul autovehicul, indiferent de cine este vinovat.</p><h2>Ce acoperă fiecare</h2><p>RCA acoperă daunele materiale și vătămările corporale produse terților în accidentele din vina ta. CASCO acoperă propria mașină în caz de accident (inclusiv din vina ta), furt sau tentativă de furt, vandalism, incendiu și fenomene naturale precum grindina, inundațiile sau copacii căzuți.</p><ul><li><strong>RCA</strong> - obligatorie, protejează terții, cu limite minime legale de 6.434.740 lei pentru daune materiale și 31.926.210 lei pentru vătămări corporale și decese, pe accident.</li><li><strong>CASCO</strong> - facultativă, protejează mașina ta, acoperire aleasă de tine.</li></ul><h2>Obligatoriu vs. facultativ</h2><p>Fără RCA valabil nu ai voie să circuli: riști o amendă de 1.000-2.000 lei și reținerea certificatului de înmatriculare până prezinți o poliță RCA valabilă. CASCO nu este impusă de lege, dar aproape toate companiile de leasing și băncile o cer prin contract pe durata finanțării. Practic, dacă ai mașina în leasing sau credit, CASCO devine obligatorie contractual.</p><h2>Cât costă și de ce diferă</h2><p>RCA are un preț calculat pe baza mașinii, a profilului șoferului și a clasei bonus-malus. CASCO este de regulă mai scumpă, deoarece acoperă riscuri mult mai largi și valoarea propriei mașini; prima reprezintă câteva procente din valoarea vehiculului pe an și se calculează individual. În 2026, tot mai mulți șoferi aleg și CASCO, pe fondul creșterii costurilor pieselor și reparațiilor.</p><h2>Cum alegi: RCA, CASCO sau ambele</h2><p>RCA este minimul legal, deci pornești mereu de la ea. CASCO merită mai ales dacă mașina este nouă sau are o valoare de piață semnificativă, dacă o ții în leasing/credit sau dacă vrei liniște în caz de furt și fenomene naturale. Pentru o mașină veche, cu valoare mică, un full CASCO poate să nu fie rentabil; în schimb, la o mașină scumpă, combinația RCA plus CASCO oferă cea mai completă protecție.</p>",
    "faq": [
      {
        "question": "Este CASCO obligatoriu?",
        "answer": "Nu. Doar RCA este obligatorie prin lege. CASCO este facultativă, însă devine obligatorie prin contract dacă ai mașina în leasing sau credit."
      },
      {
        "question": "CASCO acoperă dacă sunt eu vinovat de accident?",
        "answer": "Da. Spre deosebire de RCA, care plătește doar pagubele celuilalt, CASCO acoperă propria mașină inclusiv atunci când tu ești vinovatul accidentului."
      },
      {
        "question": "Am nevoie de ambele asigurări?",
        "answer": "RCA este obligatorie oricum. CASCO se adaugă peste RCA și este recomandată pentru mașini noi sau valoroase, ori ținute în leasing. Ele se completează, nu se înlocuiesc."
      },
      {
        "question": "De ce este CASCO mai scumpă decât RCA?",
        "answer": "Pentru că acoperă o gamă mult mai largă de riscuri și valoarea propriei tale mașini, nu doar pagubele produse altora. Prima se calculează individual, în funcție de mașină, șofer și acoperirea aleasă."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "constatare-amiabila-rca",
    "url": "/ghid-auto/constatare-amiabila-rca/",
    "title": "Constatare amiabilă RCA 2026 – cum se completează și acte necesare",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Constatare amiabilă RCA 2026: când o poți folosi, cum completezi corect formularul, acte necesare și termenul de 5 zile pentru notificarea asigurătorului.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Constatarea amiabilă este formularul prin care doi șoferi implicați într-un accident ușor, fără răniți, declară împreună cum s-a produs coliziunea, fără a chema poliția. Se poate folosi doar dacă sunt implicate două vehicule, ambele au RCA valabil, există doar pagube materiale și șoferii sunt de acord asupra modului în care s-a produs accidentul și semnează amândoi formularul. Vinovăția o stabilește apoi asigurătorul, pe baza circumstanțelor declarate. Asigurătorul trebuie notificat în cel mult 5 zile lucrătoare de la eveniment.",
    "docs": [
      "Formularul de constatare amiabilă completat și semnat de ambii șoferi",
      "Actul de identitate al fiecărui conducător",
      "Permisul de conducere al fiecărui șofer",
      "Certificatele de înmatriculare (talonul) ambelor vehicule",
      "Polițele RCA valabile ale ambelor mașini",
      "Fotografii de la locul accidentului (poziția mașinilor, avarii, plăcuțe) - recomandat"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică dacă poți folosi amiabila",
        "description": "Asigură-te că sunt implicate maximum două vehicule, nu există răniți, ambele mașini au RCA valabil și amândoi șoferii sunt de acord cu modul în care s-a produs accidentul."
      },
      {
        "num": 2,
        "title": "Completați un singur formular împreună",
        "description": "Cei doi conducători folosesc un singur formular. Scrieți cu pix albastru sau negru, cu majuscule, apăsând bine pentru a se imprima pe ambele exemplare."
      },
      {
        "num": 3,
        "title": "Bifați circumstanțele și desenați schița",
        "description": "În rubrica centrală bifați căsuțele care descriu manevrele fiecăruia și desenați clar poziția mașinilor, direcția de mers și punctul de impact."
      },
      {
        "num": 4,
        "title": "Verificați datele și semnați",
        "description": "Verificați toate datele, circumstanțele bifate și schița, apoi semnați amândoi. Formularul nu este o recunoaștere a vinovăției: asigurătorul stabilește cine răspunde pe baza circumstanțelor declarate. După semnare nu se mai pot face modificări."
      },
      {
        "num": 5,
        "title": "Notifică asigurătorul în 5 zile lucrătoare",
        "description": "Fiecare șofer păstrează un exemplar. Partea prejudiciată depune formularul la asigurătorul vinovatului (sau la propriul asigurător, prin decontare directă) pentru deschiderea dosarului de daună."
      }
    ],
    "costs": [
      {
        "item": "Formular constatare amiabilă",
        "note": "Se primește la încheierea RCA sau se descarcă de pe site-urile asigurătorilor/BAAR",
        "value": "Gratuit"
      },
      {
        "item": "Aplicația digitală Amiabila",
        "note": "Alternativă la formularul pe hârtie, cu aceeași valoare juridică",
        "value": "Gratuit"
      }
    ],
    "proseHtml": "<h2>Ce este constatarea amiabilă și când o poți folosi</h2><p>Constatarea amiabilă de accident este un document cu valoare juridică prin care doi șoferi implicați într-o coliziune ușoară declară împreună cum s-a produs evenimentul, fără a mai chema poliția. Este recunoscut de toți asigurătorii ca bază pentru deschiderea dosarului de daună RCA.</p><p>O poți folosi numai dacă sunt îndeplinite simultan patru condiții: sunt implicate două vehicule, nu există victime sau răniți (doar pagube materiale), ambele mașini au RCA valabil, iar cei doi conducători sunt de acord asupra circumstanțelor și semnează amândoi formularul. Semnarea nu înseamnă recunoașterea vinovăției: asigurătorul stabilește răspunderea pe baza circumstanțelor bifate și a schiței. Dacă oricare condiție nu este îndeplinită, chemi poliția și se întocmește proces-verbal.</p><h2>Cum se completează corect formularul</h2><p>Formularul se completează pe loc, imediat după accident, cât timp ambele părți sunt prezente. Folosiți un singur exemplar comun, scris cu pix (albastru sau negru), cu litere majuscule, apăsând ferm pentru ca textul să se copieze pe foaia autocopiativă.</p><p>Zona cea mai importantă este rubrica de circumstanțe, unde fiecare șofer bifează manevrele efectuate, și schița accidentului, unde cele mai multe greșeli apar. Desenează carosabilul, poziția mașinilor la impact, direcțiile de deplasare, marcajele și semnele de circulație. Notează și eventualii martori.</p><h2>Termenul legal și depunerea dosarului</h2><p>Conform <a href=\"https://legislatie.just.ro/Public/DetaliiDocumentAfis/190029\" target=\"_blank\" rel=\"noopener\">Legii nr. 132/2017</a>, asiguratul are obligația să-și notifice asigurătorul RCA în cel mult 5 zile lucrătoare de la data accidentului (cu excepția cazurilor în care dovedește că nu a putut face acest lucru). Întârzierea vinovatului nu afectează însă dreptul păgubitului de a fi despăgubit. Partea prejudiciată depune formularul la asigurătorul RCA al vinovatului sau, prin sistemul de decontare directă, la propriul asigurător, dacă are activată această opțiune.</p><p>Din ce în ce mai mulți șoferi folosesc <a href=\"https://www.baar.ro/lansare-amiabila/\" target=\"_blank\" rel=\"noopener\">aplicația Amiabila</a>, pusă la dispoziție de asigurătorii RCA împreună cu BAAR, care permite completarea digitală a constatării amiabile, cu funcție GPS pentru localizare și fotografii, având aceeași valoare juridică ca varianta pe hârtie.</p><h2>Capcane frecvente și impactul asupra bonus-malus</h2><p>Cele mai dese erori sunt: semnarea unui formular incomplet, schița neclară, confundarea vehiculului A cu B și lipsa fotografiilor. Verifică toate rubricile înainte de a semna, pentru că modificările ulterioare nu mai sunt acceptate.</p><p>Atenție: dacă ești declarat vinovat, evenimentul îți afectează clasa bonus-malus la reînnoirea RCA, la fel ca un accident constatat de poliție. Partea nevinovată nu este penalizată. Nu completa niciodată o amiabilă în care îți asumi o vină care nu îți aparține doar pentru a rezolva rapid situația.</p>",
    "faq": [
      {
        "question": "Câte constatări amiabile pot folosi într-un an?",
        "answer": "Nu există o limită legală a numărului de formulare pe care le poți completa, însă fiecare eveniment în care ești vinovat îți poate afecta clasa bonus-malus la reînnoirea poliței RCA."
      },
      {
        "question": "Ce fac dacă celălalt șofer nu are RCA valabil?",
        "answer": "Nu poți folosi constatarea amiabilă. Cheamă poliția, care întocmește proces-verbal, iar despăgubirea o vei recupera de la BAAR (Biroul Asigurătorilor Auto din România), care o achită din „Fondul național de protecție” pe care îl constituie și îl administrează pentru victimele accidentelor produse de vehicule neasigurate RCA. (Atenție: „Fondul de garantare a asiguraților” – FGA, administrat de ASF – este o entitate diferită, care despăgubește doar când un asigurător intră în faliment, nu în cazul lipsei RCA.)"
      },
      {
        "question": "Trebuie să chem poliția dacă avem doar avarii mici?",
        "answer": "Nu, dacă nu există răniți, sunt implicate două mașini, ambele cu RCA valabil, și sunteți de acord asupra modului în care s-a produs accidentul. În orice altă situație (dezacord, suspiciune de alcool, victime) este obligatorie prezența poliției."
      },
      {
        "question": "Cât durează până primesc despăgubirea după constatarea amiabilă?",
        "answer": "După depunerea dosarului, asigurătorul are 30 de zile să facă o ofertă de despăgubire sau să o respingă motivat, iar plata se face în 10 zile de la acceptarea ofertei."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.baar.ro/",
        "label": "BAAR - Biroul Asigurătorilor de Autovehicule din România ↗"
      },
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocumentAfis/190029",
        "label": "Legea nr. 132/2017 privind RCA (Portal Legislativ) ↗"
      },
      {
        "url": "https://www.baar.ro/lansare-amiabila/",
        "label": "BAAR – Aplicația digitală Amiabila ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/191950",
        "label": "Norma ASF nr. 20/2017 privind asigurările RCA ↗"
      }
    ]
  },
  {
    "slug": "despagubire-rca-dupa-accident",
    "url": "/ghid-auto/despagubire-rca-dupa-accident/",
    "title": "Despăgubire RCA după accident 2026 – acte necesare și termen",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Despăgubire RCA după accident 2026: acte necesare, cum deschizi dosarul de daună, termenul de 30 de zile pentru ofertă și 10 zile pentru plată, penalizări.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Ca parte prejudiciată, deschizi dosarul de daună la asigurătorul RCA al vinovatului (sau la propriul asigurător prin decontare directă), pe baza constatării amiabile sau a procesului-verbal de la poliție. Conform Legii 132/2017, asigurătorul are 30 de zile să îți facă o ofertă de despăgubire justificată sau să o respingă motivat, iar plata se face în 10 zile de la acceptarea ofertei.",
    "docs": [
      "Cererea de despăgubire",
      "Constatarea amiabilă sau procesul-verbal / autorizația de reparație de la poliție",
      "Certificatul de înmatriculare (talonul) al mașinii avariate",
      "Permisul de conducere al conducătorului auto",
      "Actul de identitate al proprietarului păgubit",
      "Polița RCA a vinovatului (seria/numărul) și datele de contact ale acestuia",
      "Fotografii cu avariile și de la locul accidentului",
      "Coordonatele contului bancar pentru plata despăgubirii"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Documentează accidentul",
        "description": "Obține constatarea amiabilă semnată de ambele părți sau procesul-verbal de la poliție. Fă fotografii cu poziția mașinilor, avariile și plăcuțele de înmatriculare."
      },
      {
        "num": 2,
        "title": "Deschide dosarul de daună",
        "description": "Depune cererea la asigurătorul RCA al vinovatului. Dacă ai cumpărat clauza de decontare directă la polița ta RCA, poți deschide dosarul direct la propriul asigurător - doar pentru accidente în România, între două mașini înmatriculate în România, ambele cu RCA valabil, și numai pentru pagube materiale ale vehiculelor."
      },
      {
        "num": 3,
        "title": "Așteaptă constatarea pagubei",
        "description": "Un inspector de daune evaluează avariile și întocmește procesul-verbal de constatare. Nu repara mașina înainte de această etapă."
      },
      {
        "num": 4,
        "title": "Depune actele complete",
        "description": "Predă toate documentele solicitate în scris de asigurător. Termenul legal de 30 de zile în care asigurătorul trebuie să răspundă curge de la data depunerii cererii de despăgubire, așa că păstrează dovada înregistrării ei."
      },
      {
        "num": 5,
        "title": "Acceptă oferta și primești banii",
        "description": "Dacă oferta de despăgubire este corectă, o accepți, iar plata se face în 10 zile. Poți repara mașina în orice service autorizat ales de tine (nu doar într-unul agreat de asigurător), cu plata directă către service, sau poți primi banii în cont."
      }
    ],
    "costs": [
      {
        "item": "Deschidere dosar de daună RCA",
        "note": "Constatarea și deschiderea dosarului nu se taxează",
        "value": "Gratuit"
      },
      {
        "item": "Penalizare de întârziere",
        "note": "Se aplică la suma datorată dacă asigurătorul depășește termenele legale de ofertă/plată",
        "value": "0,2% pe zi"
      }
    ],
    "proseHtml": "<h2>Cine plătește și unde deschizi dosarul</h2><p>La un accident, pagubele mașinii tale sunt acoperite de asigurarea RCA a șoferului vinovat. Poți deschide dosarul de daună în două moduri: la asigurătorul RCA al vinovatului sau, prin sistemul de decontare directă, la propriul asigurător, dacă ai activată această opțiune - varianta mai comodă, pentru că lucrezi cu compania ta. Baza dosarului este constatarea amiabilă (la accidente ușoare, fără răniți) sau procesul-verbal de la poliție.</p><h2>Termenele legale din Legea 132/2017</h2><p><a href=\"https://legislatie.just.ro/Public/DetaliiDocument/190029\" target=\"_blank\" rel=\"noopener\">Legea nr. 132/2017</a> stabilește reguli stricte de termen. În 30 de zile de la data depunerii cererii de despăgubire, asigurătorul RCA este obligat fie să îți transmită în scris o ofertă de despăgubire justificată, fie să îți comunice motivat de ce respinge pretențiile. Dacă în acest interval nu face niciuna dintre acestea, este obligat la plata despăgubirii.</p><p>După ce accepți oferta, despăgubirea se plătește în cel mult 10 zile. Dacă asigurătorul depășește aceste termene, datorează o penalizare de întârziere de 0,2% pe zi, calculată la suma datorată sau la diferența neplătită.</p><h2>Investigația și situațiile speciale</h2><p>Asigurătorul poate deschide o investigație dacă există indicii temeinice privind împrejurările accidentului, dar trebuie să te notifice în scris în 5 zile lucrătoare de la deschiderea dosarului. Dacă nu respectă acest termen de notificare, pierde dreptul de a mai investiga și rămâne obligat la plată. Dacă vinovatul a fost identificat, dar nu are RCA valabil, despăgubirea se cere de la <a href=\"https://www.baar.ro/fpvs/organism-de-plata-a-despagubirilor/\" target=\"_blank\" rel=\"noopener\">BAAR</a>, ca organism de plată a despăgubirilor. Dacă vinovatul a fugit, dar mașina lui este identificată și asigurată, plătește asigurătorul RCA al acelei mașini. Dacă mașina vinovatului rămâne neidentificată, BAAR plătește vătămările corporale, iar pagubele materiale doar dacă accidentul a produs un deces sau o vătămare care necesită peste 60 de zile de îngrijiri medicale, cu o franșiză de 500 de euro. Dacă ai CASCO, paguba mașinii se despăgubește din CASCO, nu de la BAAR.</p><h2>Ce faci dacă oferta e prea mică sau plata întârzie</h2><p>Nu ești obligat să accepți o ofertă pe care o consideri subevaluată. Poți contesta cuantumul, poți solicita o expertiză tehnică independentă și poți depune petiție la <a href=\"https://asfromania.ro/\" target=\"_blank\" rel=\"noopener\">ASF</a> (Autoritatea de Supraveghere Financiară). Ca alternativă la instanță, poți apela la entitatea de soluționare alternativă a litigiilor (<a href=\"https://salfin.ro/\" target=\"_blank\" rel=\"noopener\">SAL-Fin</a>). Păstrează dovada depunerii cererii de despăgubire (număr de înregistrare, confirmare de primire), pentru că de la acea dată curge termenul legal de 30 de zile, iar termenul de plată de 10 zile curge de la acceptarea ofertei.</p>",
    "faq": [
      {
        "question": "În cât timp trebuie să primesc despăgubirea RCA?",
        "answer": "Asigurătorul are 30 de zile de la depunerea cererii de despăgubire să facă ofertă sau respingere motivată, iar plata se face în 10 zile de la acceptarea ofertei. Peste aceste termene se aplică penalizări de 0,2% pe zi."
      },
      {
        "question": "Pot deschide dosarul la propriul asigurător?",
        "answer": "Da, dacă ai activat sistemul de decontare directă. Compania ta te despăgubește și apoi recuperează banii de la asigurătorul vinovatului."
      },
      {
        "question": "Ce fac dacă vinovatul nu are RCA valabil?",
        "answer": "Despăgubirea se recuperează de la BAAR, ca organism de plată a despăgubirilor, pe baza acelorași documente ale accidentului. Atenție: dacă ai CASCO, paguba mașinii se despăgubește din CASCO; iar dacă mașina vinovatului rămâne neidentificată, BAAR plătește pagubele materiale doar în cazul unui deces sau al unor vătămări care necesită peste 60 de zile de îngrijiri medicale, cu o franșiză de 500 de euro."
      },
      {
        "question": "Pot alege reparația în service în loc de bani?",
        "answer": "Da. Poți repara mașina în orice service auto autorizat ales de tine - legea interzice asigurătorului RCA să te restricționeze la service-urile lui agreate -, cu plata directă către service, sau poți opta pentru despăgubire în bani pe baza devizului."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/190029",
        "label": "Termenele de despăgubire RCA (30/10 zile, penalizări 0,2%/zi) — Legea nr. 132/2017 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://asfromania.ro/",
        "label": "Petiții și supraveghere asigurători — ASF, Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://www.baar.ro/fpvs/organism-de-plata-a-despagubirilor/",
        "label": "Vinovat neasigurat/neidentificat: cine plătește — BAAR, Organism de plată a despăgubirilor ↗"
      },
      {
        "url": "https://salfin.ro/",
        "label": "Soluționarea alternativă a litigiilor (alternativă la instanță) — SAL-Fin (sub ASF) ↗"
      }
    ]
  },
  {
    "slug": "transfer-bonus-malus-intre-polite-rca",
    "url": "/ghid-auto/transfer-bonus-malus-intre-polite-rca/",
    "title": "Transfer bonus-malus între polițe RCA – acte necesare",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Transfer bonus-malus între polițe RCA 2026: se face automat prin baza AIDA, fără acte speciale. Vezi clasele B0-B8, M1-M8 și cum îți păstrezi reducerea.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Transferul bonus-malus între polițe RCA se face automat prin baza națională AIDA, fără acte speciale sau cereri separate. Când ceri o ofertă nouă, asigurătorul îți interoghează CNP-ul și preia clasa actuală de bonus-malus. Pentru persoane fizice bonusul este legat de șofer (CNP), nu de mașină, așa că te urmează când schimbi vehiculul sau asigurătorul.",
    "docs": [
      "Actul de identitate al asiguratului (pentru CNP)",
      "Certificatul de înmatriculare (talonul) al vehiculului",
      "Datele poliței RCA anterioare (opțional, pentru verificare)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Cere o ofertă nouă",
        "description": "Contactează noul asigurător sau folosește un comparator și furnizează CNP-ul, seria actului de identitate și numărul de înmatriculare."
      },
      {
        "num": 2,
        "title": "Interogarea AIDA",
        "description": "Sistemul asigurătorului comunică automat cu baza AIDA și returnează istoricul: clasa curentă de bonus-malus și daunele din ultimii ani."
      },
      {
        "num": 3,
        "title": "Aplicarea clasei",
        "description": "Asigurătorul aplică automat clasa ta la calculul primei. Nu trebuie să prezinți polițele vechi sau să ceri explicit transferul."
      },
      {
        "num": 4,
        "title": "Verifică prima",
        "description": "Confirmă în ofertă că reducerea corespunde clasei tale (ex. B8 = -50%). Dacă apare o clasă greșită, semnalează asigurătorului."
      },
      {
        "num": 5,
        "title": "Emiterea poliței",
        "description": "Semnezi contractul cu prima calculată pe baza clasei transferate, iar noua poliță se înregistrează în AIDA."
      }
    ],
    "costs": [
      {
        "item": "Transfer bonus-malus",
        "note": "procesul este gratuit și automat",
        "value": "0 lei"
      }
    ],
    "proseHtml": "<h2>Cum funcționează sistemul bonus-malus</h2><p>Bonus-malus este un mecanism prin care istoricul tău de daune influențează prețul RCA. Sistemul are o clasă de bază (B0), 8 clase de bonus (B1-B8) cu reduceri de la -5% până la -50%, și 8 clase de malus (M1-M8) cu majorări de la +10% până la +80%. Fiecare an fără daună plătită te urcă o clasă (mai multă reducere), iar o daună despăgubită te coboară automat cu două clase.</p><h2>Transferul se face automat, fără acte speciale</h2><p>Cel mai important lucru de știut este că nu trebuie să faci nimic special pentru a-ți transfera bonusul când schimbi asigurătorul. Sistemul are portabilitate completă prin baza națională AIDA (fostă CEDAM), administrată de BAAR. Când ceri o ofertă, noul asigurător introduce datele tale (CNP, serie act de identitate, număr de înmatriculare) și primește instant istoricul complet, aplicând clasa corectă la calculul primei.</p><p>Nu ai nevoie să prezinți polițele vechi, adeverințe sau cereri de transfer. Tot procesul este electronic și gratuit.</p><h2>Bonusul urmează șoferul, nu mașina</h2><p>Pentru persoanele fizice, clasa bonus-malus este legată de CNP și se aplică uniform tuturor vehiculelor deținute de aceeași persoană. Astfel, bonusul te urmează când schimbi mașina, asigurătorul sau chiar după o pauză de asigurare. Pentru persoanele juridice (firme), sistemul se aplică separat pentru fiecare vehicul. Când firma înlocuiește un vehicul, transferul clasei pe vehiculul nou nu este automat: se face pe baza unei solicitări scrise, însoțite de documente privind înstrăinarea sau radierea vehiculului vechi și achiziția celui nou.</p><h2>Capcane frecvente și verificări</h2><p>Deși transferul este automat, merită să verifici câteva lucruri:</p><ul><li>Confirmă în ofertă că apare clasa corectă; erorile de sistem sunt rare, dar posibile.</li><li>Dacă deții mai multe vehicule ca persoană fizică, ai aceeași clasă bonus-malus pentru toate. Regula „celei mai favorabile clase” a fost doar o prevedere de tranziție, la intrarea în vigoare a normei ASF din 2017.</li><li>O daună recentă poate să nu fie încă reflectată în AIDA; asigurătorul o poate actualiza ulterior.</li><li>Verificarea instant, gratuită și publică de pe aida.info.ro după numărul de înmatriculare sau VIN privește doar valabilitatea poliței RCA (asigurător, serie poliță, data emiterii și expirării) — nu afișează clasa bonus-malus. Ca să-ți afli singur clasa B/M și istoricul de daune trebuie să soliciți un <a href=\"https://www.baar.ro/info-certificat-de-daunalitate/\" target=\"_blank\" rel=\"noopener\">certificat de daunalitate</a>: gratuit prin aplicația mobilă AIDA.info (emis în câteva minute după o înregistrare unică, max. 1 certificat / 30 de zile) sau prin BAAR pe e-mail/poștă/personal (în termen de max. 15 zile de la înregistrarea solicitării). Certificatul conține clasa bonus-malus aferentă și daunele din ultimii 5 ani. Alternativ, clasa ți-o comunică asigurătorul la momentul ofertei, fiind stabilită automat pe baza datelor din AIDA.</li></ul>",
    "faq": [
      {
        "question": "Trebuie să depun acte pentru a transfera bonusul la alt asigurător?",
        "answer": "Nu. Transferul se face automat prin baza AIDA pe baza CNP-ului. Nu ai nevoie de cereri sau documente speciale."
      },
      {
        "question": "Bonusul este legat de mașină sau de mine?",
        "answer": "Pentru persoane fizice, bonus-malusul este legat de șofer (CNP) și te urmează la orice mașină sau asigurător. Pentru firme, se aplică pe fiecare vehicul, iar transferul clasei pe un vehicul nou-dobândit se face doar pe baza unei cereri scrise, însoțite de documentele de înstrăinare sau radiere și de achiziție."
      },
      {
        "question": "Îmi pierd bonusul dacă fac o pauză de asigurare?",
        "answer": "Bonusul acumulat te urmează și după o pauză de asigurare, fiind stocat în baza AIDA. O daună plătită este cea care îl reduce, coborându-te două clase."
      },
      {
        "question": "Cum verific ce clasă de bonus-malus am?",
        "answer": "Lookup-ul public gratuit de pe aida.info.ro după numărul de înmatriculare sau VIN arată doar valabilitatea poliței RCA, nu clasa bonus-malus. Ca să afli clasa, soliciți un certificat de daunalitate — gratuit prin aplicația mobilă AIDA.info (emis în câteva minute) sau prin BAAR (în max. 15 zile, pe e-mail/poștă/personal) — care conține clasa bonus-malus și daunele din ultimii 5 ani. În plus, asigurătorul îți poate confirma clasa la momentul ofertei, aceasta fiind stabilită automat pe baza datelor din AIDA."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.baar.ro/",
        "label": "BAAR – administrează baza AIDA ↗"
      },
      {
        "url": "https://aida.info.ro/",
        "label": "Verificare istoric în baza AIDA ↗"
      },
      {
        "url": "https://asfromania.ro/",
        "label": "ASF – Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://www.baar.ro/info-certificat-de-daunalitate/",
        "label": "Certificatul de daunalitate – BAAR ↗"
      },
      {
        "url": "https://www.baar.ro/aida/",
        "label": "AIDA – noua bază de date privind polițele RCA – BAAR ↗"
      },
      {
        "url": "https://www.baar.ro/intrebari-si-raspunsuri-legate-de-certificatele-de-daunalitate-si-clasa-b-m/",
        "label": "Întrebări și răspunsuri clasa B/M și certificate de daunalitate – BAAR ↗"
      }
    ]
  },
  {
    "slug": "verificare-asigurare-rca-dupa-numar-auto",
    "url": "/ghid-auto/verificare-asigurare-rca-dupa-numar-auto/",
    "title": "Verificare asigurare RCA după număr auto 2026 – online și gratuit",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Verificare asigurare RCA după numărul auto în 2026: gratuit și online în baza oficială AIDA (fostă CEDAM). Vezi cum afli dacă o mașină are RCA valabil.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Poți verifica gratuit dacă un vehicul are RCA valabil în baza oficială AIDA (fostă CEDAM), administrată de BAAR, la adresa aida.info.ro. Introduci numărul de înmatriculare sau seria de șasiu (VIN) și afli pe loc dacă există poliță validă, ce asigurător a emis-o și până când este valabilă. Nu ai nevoie de cont sau aplicație, iar verificarea este publică.",
    "docs": [],
    "steps": [
      {
        "num": 1,
        "title": "Accesează baza AIDA",
        "description": "Intră pe site-ul oficial aida.info.ro. Verificarea este publică și nu necesită cont sau înregistrare."
      },
      {
        "num": 2,
        "title": "Alege criteriul de căutare",
        "description": "Selectează căutarea după numărul de înmatriculare (ex. B100BAR, fără spații) sau după seria de șasiu (VIN)."
      },
      {
        "num": 3,
        "title": "Introdu datele",
        "description": "Completează numărul de înmatriculare sau VIN-ul, bifează acordul GDPR și rezolvă verificarea reCAPTCHA."
      },
      {
        "num": 4,
        "title": "Citește rezultatul",
        "description": "Vezi instant dacă există RCA valabil, numele asigurătorului, seria poliței și data de expirare."
      }
    ],
    "costs": [
      {
        "item": "Verificare RCA în baza AIDA",
        "note": "serviciu public, fără cont",
        "value": "Gratuit"
      }
    ],
    "proseHtml": "<h2>Ce este baza AIDA (fostă CEDAM)</h2><p>AIDA este baza națională de date a asigurărilor RCA din România, administrată de BAAR (Biroul Asigurătorilor de Autovehicule din România). <a href=\"https://www.baar.ro/aida/\" target=\"_blank\" rel=\"noopener\">Până în septembrie 2018 s-a numit CEDAM</a> (și era administrată de ASF), iar mulți șoferi încă folosesc denumirea veche. În această bază sunt înregistrate toate polițele RCA emise, ceea ce permite verificarea rapidă a valabilității unei asigurări pentru orice vehicul înmatriculat în România.</p><h2>Cum verifici RCA după numărul de înmatriculare</h2><p>Verificarea este simplă și complet gratuită. Accesezi aida.info.ro, alegi să cauți după numărul de înmatriculare sau după VIN, introduci datele, accepți prelucrarea GDPR și rezolvi codul reCAPTCHA. Rezultatul apare instant și îți arată dacă vehiculul are o poliță RCA validă, ce companie a emis-o și până la ce dată este valabilă.</p><p>Poți verifica atât propria mașină, cât și un vehicul pe care vrei să îl cumperi second-hand, ca să te asiguri că are acoperire RCA valabilă înainte de a-l prelua.</p><h2>Cât durează până apare o poliță nouă în AIDA</h2><p>Este important de reținut că o poliță RCA nou încheiată nu apare instant în baza AIDA. De regulă, intră în sistem în aproximativ 1-14 zile de la emitere. Până atunci, contractul tău este valabil de la data de început înscrisă pe poliță, chiar dacă încă nu figurează online. Dacă tocmai ai încheiat RCA și nu apare încă în AIDA, nu te îngrijora, atâta timp cât ai documentul poliței.</p><h2>La ce îți folosește verificarea</h2><ul><li>Confirmi că propria poliță este activă și înregistrată corect.</li><li>Verifici o mașină second-hand înainte de cumpărare.</li><li>În caz de accident, poți afla asigurătorul RCA al celuilalt vehicul implicat pentru a depune cererea de despăgubire.</li><li>Eviți amenzile: circulația fără RCA valabil se sancționează cu amendă de la 1.000 la 2.000 lei și cu reținerea certificatului de înmatriculare până la prezentarea dovezii de asigurare.</li></ul>",
    "faq": [
      {
        "question": "Este gratuită verificarea RCA online?",
        "answer": "Da. Verificarea în baza AIDA la aida.info.ro este publică și gratuită. Nu ai nevoie de cont, aplicație sau plată."
      },
      {
        "question": "Ce date îmi trebuie ca să verific?",
        "answer": "Este suficient numărul de înmatriculare al vehiculului sau seria de șasiu (VIN). Nu ai nevoie de acte personale."
      },
      {
        "question": "De ce nu apare polița mea nou încheiată în AIDA?",
        "answer": "O poliță nouă intră în baza AIDA în circa 1-14 zile de la emitere. Până atunci este valabilă de la data de start înscrisă pe contract."
      },
      {
        "question": "Ce înseamnă CEDAM?",
        "answer": "CEDAM a fost denumirea anterioară a bazei naționale de asigurări RCA, preluată de BAAR de la ASF și redenumită AIDA în 2018 (transferul efectiv, migrarea datelor și punerea în funcțiune a noii aplicații au avut loc în ultimul weekend din septembrie 2018). Este aceeași bază, administrată acum de BAAR."
      }
    ],
    "officialLinks": [
      {
        "url": "https://aida.info.ro/",
        "label": "AIDA – verificare RCA online ↗"
      },
      {
        "url": "https://www.baar.ro/",
        "label": "BAAR – administratorul bazei AIDA ↗"
      },
      {
        "url": "https://www.baar.ro/aida/",
        "label": "BAAR – Despre baza de date AIDA (fostă CEDAM) ↗"
      }
    ]
  },
  {
    "slug": "cumparare-rca-online",
    "url": "/ghid-auto/cumparare-rca-online/",
    "title": "Cumpărare RCA online 2026 – preț, acte necesare și procedură",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Cumpărare RCA online 2026: ce acte îți trebuie, cum compari prețurile pe calculatorul RCA, cum plătești și în cât timp primești polița pe email.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "RCA online se cumpără în câțiva pași: introduci datele mașinii și ale proprietarului într-un calculator RCA, compari ofertele tuturor asigurătorilor, alegi prețul și perioada, plătești cu cardul și primești polița pe email, de regulă în câteva minute până la 30 de minute. Ai nevoie doar de certificatul de înmatriculare (talonul) și de actul de identitate al proprietarului.",
    "docs": [
      "Certificatul de înmatriculare (talonul) sau cartea de identitate a vehiculului (CIV) pentru mașini noi",
      "Actul de identitate al proprietarului (CI)",
      "Permisul de conducere al utilizatorului principal",
      "Contractul de vânzare-cumpărare sau factura proformă (pentru mașini neînmatriculate încă)",
      "Adresa de email valabilă pentru primirea poliței",
      "Decizia de clasă bonus-malus (opțional, se preia automat din baza de date)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Pregătește actele mașinii",
        "description": "Ai la îndemână talonul (sau CIV-ul pentru mașini noi) și cartea de identitate a proprietarului, de unde vei prelua datele cerute."
      },
      {
        "num": 2,
        "title": "Introdu datele în calculatorul RCA",
        "description": "Completează seria de șasiu, numărul de înmatriculare, datele proprietarului și ale utilizatorului principal. Sistemul preia automat clasa bonus-malus."
      },
      {
        "num": 3,
        "title": "Compară ofertele asigurătorilor",
        "description": "Calculatorul afișează prețurile tuturor companiilor. Compară nu doar prețul, ci și perioada (orice durată între 1 și 12 luni) și eventualele clauze suplimentare."
      },
      {
        "num": 4,
        "title": "Alege oferta și modalitatea de plată",
        "description": "Selectează compania și perioada dorite, apoi plătește cu cardul online. Poți opta și pentru plata în rate, dacă asigurătorul permite."
      },
      {
        "num": 5,
        "title": "Primești polița pe email",
        "description": "După plată primești un email de confirmare, iar polița RCA valabilă sosește de regulă în câteva minute, maximum 30 de minute în timpul programului de lucru."
      }
    ],
    "costs": [
      {
        "item": "Poliță RCA autoturism",
        "note": "Variază mult în funcție de vârsta șoferului, oraș, capacitate cilindrică și clasă bonus-malus; verifică prețul exact în calculator",
        "value": "de la ~500 la peste 2.500 RON/an"
      },
      {
        "item": "Comision cumpărare online",
        "note": "Comisionul intermediarului este inclus în prima totală afișată (oferta îl arată separat) și nu se adaugă peste aceasta; prima totală poate diferi între canale",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>De ce merită să cumperi RCA online</h2><p>Cumpărarea RCA online a devenit standardul în 2026, pentru că îți oferă două avantaje clare: rapiditate (polița ajunge pe email în câteva minute) și comparație transparentă a tuturor ofertelor, fără drumuri la sediul asigurătorului. Prima netă de cheltuieli de distribuție este aceeași pe orice canal, dar prima totală include cheltuielile de distribuție ale canalului ales (comisionul intermediarului sau costul vânzării directe), deci poate diferi între online și ghișeu. Polița electronică are aceeași valoare juridică precum cea tipărită.</p><p>Prețurile RCA se actualizează zilnic, așa că merită să faci o simulare nouă chiar dacă ai mai comparat luna trecută. Diferențele dintre asigurători pot fi de sute de lei pentru exact aceleași date.</p><h2>Ce acte îți trebuie de fapt</h2><p>Pentru o simulare rapidă sunt suficiente talonul mașinii și actul de identitate al proprietarului. Pentru mașinile noi, neînmatriculate încă, folosești cartea de identitate a vehiculului (CIV) și factura proformă. Sistemul preia automat clasa bonus-malus din baza de date centralizată, deci nu trebuie să o cauți manual.</p><h2>Cum se stabilește prețul poliței</h2><p>Tariful RCA depinde de mai mulți factori: vârsta și experiența proprietarului, localitatea de domiciliu, capacitatea cilindrică și puterea motorului, clasa bonus-malus (istoricul de daune) și perioada aleasă. Șoferii tineri din orașele mari și mașinile cu motoare mari plătesc cel mai mult, în timp ce un istoric fără daune și o clasă bonus bună reduc semnificativ prima.</p><h2>Verificarea și valabilitatea poliței</h2><p>După cumpărare, verifică pe polița primită corectitudinea datelor: numărul de înmatriculare, seria de șasiu, numele proprietarului și perioada de valabilitate. Orice greșeală trebuie corectată imediat cu asigurătorul. Polița devine activă de la data de început aleasă, nu neapărat din momentul plății, așa că fii atent să nu rămâi neasigurat între două polițe.</p><p>Poți circula legal cu polița RCA în format electronic (pe telefon sau tipărită). Polița este înregistrată automat în <a href=\"https://www.baar.ro/aida/\" target=\"_blank\" rel=\"noopener\">baza de date națională AIDA (Administrare Istoric Date Asigurați)</a>, care din 2018 a preluat rolul fostei baze CEDAM și este administrată de BAAR (Biroul Asigurătorilor de Autovehicule din România). Valabilitatea poliței poate fi verificată gratuit online pe aida.info.ro, precum și de autoritățile abilitate (Poliția). Asigurătorul îți stabilește automat clasa bonus-malus pe baza istoricului din AIDA, unde asigurătorii raportează polițele, daunele și clasa.</p>",
    "faq": [
      {
        "question": "Pot circula cu polița RCA doar în format electronic?",
        "answer": "Da. RCA-ul cumpărat online este valabil în format electronic, iar înregistrarea sa în baza de date națională poate fi verificată de poliție. Nu ești obligat să o tipărești."
      },
      {
        "question": "În cât timp primesc polița după plată?",
        "answer": "De obicei în câteva minute, iar în cazuri excepționale în maximum 30 de minute în timpul programului de lucru. Vei primi mai întâi un email de confirmare a comenzii."
      },
      {
        "question": "Pot plăti RCA în rate?",
        "answer": "Da, pentru polițele anuale majoritatea asigurătorilor permit plata în două sau mai multe rate. Dacă nu plătești o rată la scadență, contractul RCA continuă să producă efecte p��nă când asigurătorul își exercită dreptul de reziliere, iar contractul este titlu executoriu pentru ratele neachitate."
      },
      {
        "question": "Ce se întâmplă dacă greșesc o dată la completare?",
        "answer": "O poliță cu date eronate poate fi considerată nevalidă. Contactează imediat asigurătorul sau brokerul pentru corectarea poliței înainte de a o folosi."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://www.baar.ro/",
        "label": "BAAR - Biroul Asigurătorilor de Autovehicule din România ↗"
      },
      {
        "url": "https://www.baar.ro/aida/",
        "label": "Înregistrarea automată a poliței RCA în AIDA – baza de date națională (a înlocuit CEDAM din 2018) — BAAR ↗"
      },
      {
        "url": "https://www.aida.info.ro/",
        "label": "Verificare valabilitate poliță RCA — portalul AIDA (BAAR) ↗"
      }
    ]
  },
  {
    "slug": "asigurare-rca-la-schimbare-proprietar",
    "url": "/ghid-auto/asigurare-rca-la-schimbare-proprietar/",
    "title": "Asigurare RCA la schimbare proprietar – ce trebuie făcut",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "RCA la schimbare proprietar: polița nu se transferă. Vânzătorul reziliază și primește diferența, iar noul proprietar face RCA nou pe numele lui.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "RCA nu se transferă la schimbarea proprietarului. Contractul RCA al vânzătorului încetează la data la care acesta notifică asigurătorul despre vânzare, cu documente justificative, așa că vânzătorul trebuie să anunțe cât mai repede. El recuperează prima pentru perioada rămasă dacă nu s-au plătit și nu se datorează despăgubiri din poliță. Noul proprietar este obligat să încheie o poliță RCA nouă pe numele său, necesară la transcrierea de la DGPCI.",
    "docs": [
      "Cererea de reziliere a poliței RCA (completată de vânzător)",
      "Contractul de vânzare-cumpărare (documentul justificativ al vânzării)",
      "Actul de identitate al vânzătorului",
      "Copia poliței RCA existente",
      "Datele contului bancar pentru restituirea diferenței de primă",
      "Pentru cumpărător: talon/CIV și act de identitate, pentru RCA-ul nou"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Vânzătorul notifică asigurătorul imediat după vânzare",
        "description": "Contractul RCA încetează la data la care proprietarul notifică asigurătorul despre vânzare, cu documente justificative. Până atunci polița rămâne activă, iar daunele produse de cumpărător i-ar afecta vânzătorului clasa bonus-malus, așa că notificarea trebuie făcută imediat."
      },
      {
        "num": 2,
        "title": "Vânzătorul depune cererea de reziliere",
        "description": "Împreună cu contractul de vânzare-cumpărare și copia poliței, se solicită încetarea contractului și restituirea primei rămase."
      },
      {
        "num": 3,
        "title": "Vânzătorul primește diferența de primă",
        "description": "Asigurătorul restituie proporțional suma aferentă perioadei rămase până la expirarea poliței, în contul indicat, dacă nu s-au plătit și nu se datorează despăgubiri din poliță."
      },
      {
        "num": 4,
        "title": "Cumpărătorul încheie RCA nou",
        "description": "Noul proprietar face o poliță RCA pe numele său la orice asigurător autorizat. Răspunderea asigurătorului începe din ziua următoare încheierii, așa că polița trebuie făcută cu cel puțin o zi înainte de prima deplasare."
      },
      {
        "num": 5,
        "title": "Cumpărătorul folosește RCA la transcriere",
        "description": "Polița RCA pe numele noului proprietar este obligatorie în dosarul de transcriere depus la DGPCI."
      }
    ],
    "costs": [
      {
        "item": "Reziliere poliță RCA",
        "note": "gratuită",
        "value": "0 RON"
      },
      {
        "item": "Restituire primă rămasă",
        "note": "pentru perioada neexpirată, în contul vânzătorului",
        "value": "proporțională"
      },
      {
        "item": "RCA nou (cumpărător)",
        "note": "depinde de mașină, șofer și clasa bonus-malus",
        "value": "în funcție de ofertă"
      }
    ],
    "proseHtml": "<h2>RCA nu se transferă odată cu mașina</h2><p>Una dintre cele mai frecvente confuzii la vânzarea unei mașini este că RCA-ul ar rămâne valabil pentru noul proprietar. Legal, acest lucru nu este posibil: polița RCA este legată de proprietarul care a încheiat-o, iar la schimbarea proprietarului nu se poate transfera pe altă persoană. Fiecare proprietar trebuie să aibă propria poliță pe numele său.</p><h2>Ce face vânzătorul</h2><p>Contractul RCA al vânzătorului încetează la data la care acesta notifică asigurătorul despre transmiterea proprietății, cu documente justificative, așa că e în interesul lui să o facă imediat după vânzare. Odată cu notificarea, poate cere restituirea primei aferente perioadei rămase. Pentru asta trebuie să prezinte cererea de reziliere, contractul de vânzare-cumpărare (documentul justificativ al transmiterii proprietății; unii asigurători pot cere și dovada scoaterii din evidența fiscală), copia poliței și datele bancare pentru restituire.</p><p>Dacă vânzătorul nu anunță asigurătorul și noul proprietar produce un accident înainte să își facă propriul RCA, vechiul proprietar riscă să fie afectat pe clasa bonus-malus și să plătească mai mult la viitoarele polițe.</p><h2>Ce face cumpărătorul</h2><p>Noul proprietar este obligat să încheie o poliță RCA pe numele său. Atenție la data de început: dacă nu aveai RCA pe acel vehicul, răspunderea asigurătorului începe din ziua următoare încheierii poliței, așa că încheie-o cu cel puțin o zi înainte de prima deplasare. Polița este cerută obligatoriu și la transcrierea de la DGPCI. Fără RCA valabil pe numele cumpărătorului, mașina nu poate fi trecută legal pe numele său și nu poate circula.</p><h2>Restituirea banilor pe primă</h2><p>Când contractul încetează după vânzare, asigurătorul îți restituie proporțional partea de primă aferentă perioadei neexpirate, dacă nu s-au plătit și nu se datorează despăgubiri pentru evenimente din perioada de valabilitate. De exemplu, dacă mai aveai șase luni de acoperire, primești aproximativ jumătate din prima plătită, în funcție de condițiile contractuale. Rezilierea în sine este gratuită.</p>",
    "faq": [
      {
        "question": "Se transferă RCA-ul noului proprietar al mașinii?",
        "answer": "Nu. Polița RCA nu se poate transfera. Noul proprietar este obligat să încheie o poliță RCA nouă pe numele său, necesară la transcrierea de la DGPCI."
      },
      {
        "question": "Primesc banii înapoi pe RCA după ce vând mașina?",
        "answer": "Da, dacă nu s-au plătit și nu se datorează despăgubiri din poliță. Contractul încetează când anunți asigurătorul despre vânzare, iar prima aferentă perioadei rămase îți este restituită proporțional. Ai nevoie de contractul de vânzare-cumpărare ca document justificativ."
      },
      {
        "question": "În cât timp trebuie să anunț asigurătorul că am vândut mașina?",
        "answer": "Cât mai repede: legea nu fixează un termen, dar contractul RCA încetează abia la data la care îl notifici, cu documente justificative. Dacă nu notifici și noul proprietar produce un accident, riști consecințe pe propria clasă bonus-malus."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "rca-pentru-sofer-tanar",
    "url": "/ghid-auto/rca-pentru-sofer-tanar/",
    "title": "RCA pentru șofer tânăr 2026 – preț, acte necesare și cea mai bună ofertă",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "RCA șofer tânăr 2026: de ce plătești mai mult sub 30 de ani, prețuri orientative, acte necesare și trucuri prin care obții cea mai bună ofertă.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Șoferii sub 30 de ani au cele mai mari tarife de referință RCA, pentru că statistic produc mai multe daune. În 2026 o poliță pentru un tânăr din București poate depăși 3.900 lei/an (tarif de referință ~3.974 lei), în timp ce în restul țării pornește de la aproximativ 2.360 lei. Prețul scade dacă aduni ani fără accidente (bonus-malus) și dacă compari mai multe oferte înainte de a semna.",
    "docs": [
      "Certificatul de înmatriculare (talonul) sau cartea de identitate a vehiculului (CIV) pentru mașinile noi",
      "Actul de identitate al proprietarului / asiguratului",
      "Permisul de conducere al șoferului tânăr",
      "Codul numeric personal (CNP) pentru interogarea bonus-malus",
      "Polița RCA anterioară (dacă există), pentru continuitatea bonusului"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Adună datele mașinii",
        "description": "Pregătește talonul și datele tehnice (putere în kW, capacitate cilindrică, an fabricație). Ele determină încadrarea tarifară."
      },
      {
        "num": 2,
        "title": "Cere mai multe oferte",
        "description": "Solicită cotații de la cel puțin 3-4 asigurători sau folosește un comparator online. Diferențele pentru șoferii tineri pot fi de sute de lei."
      },
      {
        "num": 3,
        "title": "Verifică bonus-malus",
        "description": "Asigurătorul interoghează automat baza AIDA după CNP. Clasa bonus-malus aparține asiguratului (persoana pe numele căreia e polița), nu șoferilor care au condus mașina. Dacă ai condus doar pe polița părinților, ca asigurat nou pornești de regulă din clasa B0; unii asigurători pot lua în calcul istoricul tău de șofer prin coeficienți proprii, așa că întreabă la ofertă."
      },
      {
        "num": 4,
        "title": "Alege durata și plata",
        "description": "Polița pe 12 luni este de regulă mai avantajoasă pe lună decât cea pe 1, 3 sau 6 luni."
      },
      {
        "num": 5,
        "title": "Semnează și verifică AIDA",
        "description": "După emitere, polița este valabilă de la data de start. Verifică apariția ei în baza AIDA în 1-14 zile."
      }
    ],
    "costs": [
      {
        "item": "RCA orientativ tânăr sub 30 ani, motor ≤50 kW – București/Ilfov",
        "note": "tarif de referință ASF; prima efectivă poate diferi",
        "value": "~3.974 lei/an"
      },
      {
        "item": "RCA orientativ tânăr sub 30 ani, motor ≤50 kW – restul țării",
        "note": "verifică valoarea exactă la momentul ofertei",
        "value": "~2.361 lei/an"
      },
      {
        "item": "Diferență medie față de grupa 31-40 ani",
        "note": "riscul mai mare al tinerilor scumpește polița",
        "value": "poate fi aproape dublu"
      }
    ],
    "proseHtml": "<h2>De ce plătesc șoferii tineri mai mult la RCA</h2><p>Asigurătorii stabilesc primele RCA pe baza probabilității de daună. Statistic, șoferii sub 30 de ani produc mai multe accidente și daune mai mari, așa că sunt încadrați în categoria de risc ridicat. De aceea, în <a href=\"https://asfromania.ro/ro/a/3489/tarife-de-referinta-rca-2026\" target=\"_blank\" rel=\"noopener\">grila de tarife de referință publicată de ASF</a>, categoria „până în 30 de ani\" are cel mai mare preț dintre toate grupele de vârstă, uneori aproape dublu față de un șofer de 31-40 de ani cu aceeași mașină.</p><p>Vârsta nu este singurul factor: contează și puterea motorului (kW), capacitatea cilindrică și zona de înmatriculare. Un tânăr din București sau Ilfov plătește semnificativ mai mult decât unul din restul județelor pentru un vehicul identic.</p><h2>Cât costă RCA pentru un tânăr în 2026</h2><p>În 2026, după eliminarea plafonării tarifelor, prețurile RCA au crescut în medie cu aproximativ 12% la autoturisme față de anul anterior (între circa 5% și 12% în funcție de categoria de vârstă). Pentru un șofer tânăr cu o mașină de putere mică, tariful de referință pornește de la circa 2.361 lei/an în provincie și poate ajunge la 3.974 lei/an în București/Ilfov. Acestea sunt tarife orientative de referință; prima efectivă a fiecărui asigurător poate fi mai mică sau mai mare, așa că verifică valoarea exactă în ofertă.</p><h2>Cum obții cea mai bună ofertă</h2><p>Cel mai eficient mod de a reduce costul este să compari oferte de la mai mulți asigurători înainte de a semna. Diferențele pentru aceeași mașină și același șofer pot fi de câteva sute de lei. Alege plata pe 12 luni dacă îți permite bugetul, pentru că fracționarea (1, 3, 6 luni) crește costul total.</p><ul><li>Construiește-ți istoricul: fiecare an fără daună te urcă o clasă de bonus, ducând în timp la reducere de până la 50%.</li><li>Condu prudent: o daună plătită te coboară două clase și scumpește polițele următoare.</li><li>Verifică acoperirea, nu doar prețul: clauzele și serviciile de asistență diferă între asigurători.</li></ul><h2>Ce faci dacă nu găsești ofertă rezonabilă</h2><p>Dacă din cauza vârstei nu găsești RCA la un preț rezonabil pe piața liberă, poți apela la mecanismul BAAR. Biroul Asigurătorilor de Autovehicule din România îți alocă un asigurător RCA dacă te încadrezi ca asigurat cu risc ridicat: ai cel puțin 3 oferte pe 12 luni de la asigurători diferiți, fiecare mai mare decât tariful de referință ASF × factorul N (1,36) × coeficientul tău bonus-malus. BAAR calculează o primă recomandată, dar nu stabilește un tarif reglementat, iar cererea se soluționează în 20 de zile lucrătoare.</p>",
    "faq": [
      {
        "question": "De ce este RCA mai scump sub 25-30 de ani?",
        "answer": "Pentru că șoferii tineri au statistic mai multe accidente, deci un risc de daună mai mare. Asigurătorii compensează acest risc prin prime mai mari, conform grilelor de tarife de referință ASF."
      },
      {
        "question": "Cum pot plăti mai puțin la RCA ca șofer tânăr?",
        "answer": "Compară cel puțin 3-4 oferte, alege plata pe 12 luni, evită daunele pentru a acumula bonus și construiește-ți istoricul de conducere responsabilă."
      },
      {
        "question": "Pot folosi bonusul acumulat pe mașina părinților?",
        "answer": "Nu direct. Clasa bonus-malus aparține asiguratului, adică persoanei pe numele căreia a fost încheiată polița, deci bonusul părinților rămâne al lor. Dacă tu ai fost asigurat pe altă mașină, clasa ta te urmează; dacă ai fost doar șofer pe polița părinților, pornești de regulă din B0, iar unii asigurători pot ține cont de istoricul tău de șofer prin coeficienți proprii."
      },
      {
        "question": "Ce fac dacă niciun asigurător nu îmi dă o ofertă acceptabilă?",
        "answer": "Poți apela la mecanismul BAAR pentru asigurații cu risc ridicat, dacă ai cel puțin 3 oferte pe 12 luni de la asigurători diferiți, toate peste tariful de referință ASF × 1,36 × coeficientul tău bonus-malus. BAAR îți alocă un asigurător și calculează o primă recomandată; nu e un preț fix reglementat."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF – Autoritatea de Supraveghere Financiară ↗"
      },
      {
        "url": "https://asfromania.ro/ro/a/3489/tarife-de-referinta-rca-2026",
        "label": "Tarife de referință RCA (inclusiv șoferi sub 30 ani) — ASF, grilă publicată 29 mai 2026, în vigoare iulie 2026 ↗"
      },
      {
        "url": "https://www.baar.ro/",
        "label": "BAAR – Biroul Asigurătorilor de Autovehicule din România ↗"
      },
      {
        "url": "https://www.baar.ro/asigurati-cu-risc-ridicat/",
        "label": "Asigurați RCA cu risc ridicat (alocare asigurător obligat) — BAAR ↗"
      },
      {
        "url": "https://aida.info.ro/",
        "label": "Verificare valabilitate poliță RCA în baza de date AIDA ↗"
      }
    ]
  },
  {
    "slug": "rca-pentru-masina-second-hand",
    "url": "/ghid-auto/rca-pentru-masina-second-hand/",
    "title": "RCA pentru mașina second hand 2026 – acte necesare și când se face",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "RCA pentru mașina second hand 2026: când se face după cumpărare, ce acte îți trebuie și de ce nu te poți baza pe RCA-ul vechiului proprietar.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "După ce cumperi o mașină second hand, ai nevoie de o poliță RCA nouă pe numele tău înainte de a circula, pentru că RCA-ul este legat de proprietar și nu se transferă odată cu mașina. Polița fostului proprietar rămâne în vigoare doar până când acesta anunță asigurătorul despre vânzare, deci nu te poți baza pe ea, iar legea te obligă oricum să ai propria poliță. O poți face online în câteva minute, având nevoie doar de talon, actul de identitate și permisul de conducere. Transcrierea la DGPCI se cere în cel mult 90 de zile de la data dobândirii mașinii.",
    "docs": [
      "Certificatul de înmatriculare (talonul) al mașinii cumpărate",
      "Actul de identitate al noului proprietar (CI)",
      "Permisul de conducere al utilizatorului principal",
      "Contractul de vânzare-cumpărare (dovada schimbării proprietarului)",
      "Cartea de identitate a vehiculului (CIV), pentru verificarea datelor tehnice"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Semnează contractul de vânzare-cumpărare",
        "description": "Data contractului marchează transferul de proprietate. De aici curg cele 90 de zile pentru transcrierea mașinii la DGPCI."
      },
      {
        "num": 2,
        "title": "Cere fostului proprietar să-și rezilieze RCA-ul",
        "description": "Contractul RCA al vânzătorului încetează la data la care acesta notifică asigurătorul despre vânzare, cu contractul de vânzare ca document justificativ. Vânzătorul primește prima pentru perioada rămasă doar dacă nu s-au plătit și nu se datorează despăgubiri din acea poliță. Polița lui nu îți este de folos ție."
      },
      {
        "num": 3,
        "title": "Fă imediat RCA pe numele tău",
        "description": "Încheie o poliță RCA nouă pe numele tău cu cel puțin o zi înainte de a conduce mașina: dacă nu aveai RCA pe ea, acoperirea începe din ziua următoare încheierii. Se face online în 5-10 minute, cu talonul și actul de identitate la îndemână."
      },
      {
        "num": 4,
        "title": "Verifică actele înainte de a circula",
        "description": "Asigură-te că ai RCA valabil, ITP în termen și documentele mașinii. Fără RCA propriu, riști amendă de 1.000–2.000 lei și reținerea certificatului de înmatriculare, iar în caz de accident despăgubirea plătită victimelor poate fi recuperată de la tine."
      },
      {
        "num": 5,
        "title": "Transcrie mașina la DGPCI în 90 de zile",
        "description": "Depui dosarul de transcriere (înmatriculare pe numele tău) la SPCRPCIV din județul de domiciliu, în termenul legal de 90 de zile de la dobândire."
      }
    ],
    "costs": [
      {
        "item": "Poliță RCA autoturism",
        "note": "Variază după vârstă, oraș, motorizare și clasa bonus-malus; compară în calculatorul RCA",
        "value": "de la ~500 la peste 2.500 RON/an"
      },
      {
        "item": "Restituire primă RCA (vânzător)",
        "note": "Fostul proprietar recuperează prima pentru perioada neutilizată după ce anunță vânzarea, dacă nu s-au plătit și nu se datorează despăgubiri din poliță",
        "value": "proporțional cu perioada rămasă"
      }
    ],
    "proseHtml": "<h2>De ce nu poți folosi RCA-ul fostului proprietar</h2><p>Cea mai importantă regulă: polița RCA este legată de proprietar, nu de mașină. Când cumperi o mașină second hand, RCA-ul vânzătorului nu se transferă pe numele tău. Contractul lui încetează la data la care vânzătorul anunță asigurătorul despre vânzare, deci poate înceta oricând fără să afli, iar o daună produsă de tine pe polița lui i-ar afecta lui clasa bonus-malus. Ca nou proprietar, ești obligat prin lege să ai propria poliță, cerută și la transcriere. De aceea, recomandarea fermă este să încheii o poliță RCA nouă pe numele tău înainte de a pune mașina în mișcare pe drumurile publice.</p><h2>Când și cum faci noul RCA</h2><p>RCA-ul trebuie făcut imediat, înainte de prima deplasare cu mașina cumpărată. Cel mai simplu îl încheii online, în 5-10 minute, având la îndemână talonul mașinii, actul tău de identitate și permisul de conducere. Poți face o simulare de preț în calculatorul RCA pentru a compara ofertele tuturor asigurătorilor și a alege perioada (orice durată între 1 și 12 luni) și prețul potrivite. Atenție: dacă mașina nu are deja RCA pe numele tău, răspunderea asigurătorului începe din ziua următoare încheierii poliței, așa că încheie-o cu cel puțin o zi înainte de prima deplasare.</p><h2>Cum funcționează bonus-malus la schimbarea mașinii</h2><p>Clasa bonus-malus este a ta ca șofer, nu a mașinii. Astfel, istoricul tău fără daune te avantajează și pe mașina nou cumpărată, reducând prima. Dacă este prima poliță RCA pe numele tău (nu ai mai deținut mașină), pornești de la clasa de bază B0. Nu preiei clasa bonus-malus a fostului proprietar - fiecare șofer are propriul istoric în baza de date centralizată.</p><h2>Termene, transcriere și greșeli de evitat</h2><p>După cumpărare, ai la dispoziție 90 de zile de la data dobândirii pentru a transcrie mașina (a o înmatricula pe numele tău) la DGPCI. Dacă depășești termenul, înmatricularea se suspendă de drept până la transcriere, iar dacă circuli cu mașina în această situație riști amendă și reținerea certificatului de înmatriculare. Atenție la o confuzie frecventă: cele 90 de zile se referă la termenul de transcriere, nu la un drept de a circula fără RCA propriu. RCA este obligatoriu în orice moment în care mașina se află pe drumurile publice. Sfat util: cere-i vânzătorului să anunțe asigurătorul despre vânzare; contractul lui încetează la data notificării, iar el își recuperează prima aferentă perioadei rămase dacă nu s-au plătit și nu se datorează despăgubiri. Așa evitați neînțelegerile ulterioare.</p>",
    "faq": [
      {
        "question": "Pot circula cu RCA-ul fostului proprietar timp de 30 de zile?",
        "answer": "Nu te baza pe el. Polița lui rămâne activă doar până când vânzătorul anunță asigurătorul despre vânzare, deci poate înceta oricând, iar o daună produsă de tine i-ar strica lui clasa bonus-malus. În plus, legea te obligă ca nou proprietar să ai propriul RCA, cerut și la transcriere. Fă imediat RCA pe numele tău înainte de a conduce."
      },
      {
        "question": "Când trebuie să fac RCA după ce cumpăr mașina?",
        "answer": "Imediat, înainte de prima deplasare pe drumurile publice. RCA-ul este obligatoriu în permanență și nu se transferă de la vechiul proprietar."
      },
      {
        "question": "Îmi pierd bonusul dacă schimb mașina?",
        "answer": "Nu. Clasa bonus-malus este personală și te urmează ca șofer pe noua mașină, indiferent de vehiculul deținut anterior."
      },
      {
        "question": "Ce acte îmi trebuie pentru RCA la o mașină second hand?",
        "answer": "De regulă talonul (certificatul de înmatriculare), actul tău de identitate și permisul de conducere. Contractul de vânzare-cumpărare dovedește că ești noul proprietar."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://asfromania.ro/",
        "label": "ASF - Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "costuri-schimbare-proprietar-auto",
    "url": "/ghid-auto/costuri-schimbare-proprietar-auto/",
    "title": "Costuri schimbare proprietar auto în 2026 – taxe, acte și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Costuri schimbare proprietar auto 2026: taxe DGPCI, certificat de înmatriculare 76 RON, plăcuțe și acte necesare pentru transcrierea mașinii.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Schimbarea proprietarului (transcrierea) unei mașini în 2026 costă în taxe oficiale 76 RON pentru certificatul de înmatriculare (tarif în vigoare din 15 septembrie 2026), plus 52 RON pentru plăcuțe dacă se schimbă numărul sau 97 RON pentru un număr preferențial cu plăcuțe. Certificatul de atestare fiscală este gratuit prin lege, iar termenul legal de transcriere este de 90 de zile.",
    "docs": [
      "Cererea de înmatriculare/transcriere completată",
      "Contractul de vânzare-cumpărare (mai multe exemplare)",
      "Certificatul de înmatriculare vechi, cu mențiunile vânzătorului",
      "Cartea de identitate a vehiculului (CIV)",
      "Actul de identitate al noului proprietar (original și copie)",
      "Confirmarea lipsei datoriilor la bugetul local pentru vânzător și, din 25.02.2026, pentru cumpărător (pe contractul tipizat, prin certificat de atestare fiscală sau verificare electronică); contractul înregistrat la direcția de taxe locale a cumpărătorului",
      "Asigurare RCA valabilă pe numele noului proprietar",
      "Dovada ITP valabil și dovezile de plată a taxelor"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Achită impozitul și obține viza fiscală",
        "description": "Vânzătorul plătește impozitul auto pe anul în curs și obține certificatul de atestare fiscală; cumpărătorul verifică să nu aibă la rândul lui datorii locale."
      },
      {
        "num": 2,
        "title": "Fă asigurarea RCA și verifică ITP-ul",
        "description": "RCA trebuie încheiat pe numele noului proprietar, iar ITP-ul să fie valabil la data depunerii dosarului."
      },
      {
        "num": 3,
        "title": "Plătește taxele de înmatriculare",
        "description": "Achită certificatul de înmatriculare (76 RON) prin Ghișeul.ro, internet banking la Trezorerie sau la stațiile SelfPay, plus plăcuțele dacă schimbi numărul."
      },
      {
        "num": 4,
        "title": "Depune dosarul la DGPCI",
        "description": "Cu programare online, depui dosarul complet la serviciul de înmatriculări și primești noul certificat de înmatriculare pe numele tău."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare (talon)",
        "note": "tarif în vigoare din 15.09.2026",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe standard",
        "note": "doar dacă schimbi numărul de înmatriculare / județul",
        "value": "52 RON"
      },
      {
        "item": "Plăcuțe cu număr preferențial",
        "note": "opțional, include taxa de preferință",
        "value": "97 RON (45 RON + 52 RON plăcuțe)"
      },
      {
        "item": "Certificat de atestare fiscală",
        "note": "gratuit prin lege din 25.02.2026 (OUG 7/2026)",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Cât costă, de fapt, schimbarea proprietarului</h2><p>Vestea bună este că taxele oficiale de transcriere sunt mici. Dacă numărul trece automat pe tine (ai domiciliul în același județ cu vânzătorul, iar acesta nu a cerut păstrarea combinației), plătești practic doar certificatul de înmatriculare de 76 RON (din 15 septembrie 2026). Certificatul de atestare fiscală de la primărie este gratuit prin lege din 25 februarie 2026.</p><p>Costurile cresc dacă alegi să schimbi numărul: setul de plăcuțe standard costă 52 RON, iar un număr preferențial costă 45 RON plus plăcuțele, adică 97 RON. La un transfer între județe diferite, schimbarea plăcuțelor devine obligatorie.</p><h2>Cheltuieli conexe de care să ții cont</h2><p>Peste taxele de la ghișeu apar cheltuieli conexe: asigurarea RCA obligatorie pe numele tău, eventual un ITP nou dacă cel existent este aproape expirat și, dacă apelezi la un birou specializat, un comision de intermediere. Impozitul auto pe anul în curs trebuie achitat de vânzător înainte de tranzacție, altfel mașina nu poate fi radiată de pe numele lui.</p><h2>Termenul legal de 90 de zile</h2><p>Conform OUG 195/2002 (art. 11 alin. (4), în forma introdusă prin OG 14/2017), noul proprietar are la dispoziție 90 de zile de la data dobândirii pentru a solicita transcrierea. Dacă depășești acest termen, înmatricularea se suspendă de drept, iar circulația cu mașina neînscrisă pe numele tău atrage amenzi și reținerea certificatului de înmatriculare.</p><p>Atenție și la valabilitatea documentelor: certificatul de atestare fiscală este valabil 30 de zile de la emitere, iar declararea mașinii la direcția de taxe locale trebuie făcută în 30 de zile de la cumpărare, așa că este recomandat să finalizezi formalitățile în prima lună după cumpărare.</p><h2>Noutăți fiscale în 2026</h2><p>Din 25 februarie 2026, OUG 7/2026 extinde obligația și asupra cumpărătorului: nici el nu trebuie să aibă datorii la bugetul local de la domiciliul său. Verificarea se face direct pe contractul tipizat de către direcția fiscală, prin certificat de atestare fiscală sau electronic, iar un contract încheiat fără ea este nul de drept. Practic, dacă ai datorii la bugetul local, cumpărarea și transcrierea sunt blocate. Verifică situația ta fiscală înainte de tranzacție și confirmă cerințele exacte la direcția de taxe locale, deoarece pot exista diferențe procedurale de la o primărie la alta.</p>",
    "faq": [
      {
        "question": "Cât costă în total transcrierea unei mașini în 2026?",
        "answer": "Dacă numărul trece automat pe tine, plătești doar certificatul de înmatriculare, adică 76 RON în taxe oficiale (din 15 septembrie 2026). Cu plăcuțe noi se adaugă 52 RON, iar pentru un număr preferențial 97 RON."
      },
      {
        "question": "Cine plătește taxele de transcriere?",
        "answer": "Cumpărătorul suportă taxele de înmatriculare și plăcuțele. Vânzătorul plătește impozitul pe tot anul vânzării și trebuie să nu aibă datorii la bugetul local; din 2026, nici cumpărătorul nu trebuie să aibă datorii la bugetul local."
      },
      {
        "question": "Este obligatoriu să schimb numărul de înmatriculare?",
        "answer": "Nu, dacă mașina rămâne în același județ poți păstra numărul. Schimbarea plăcuțelor devine obligatorie doar la mutarea între județe."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Direcția Generală Permise de Conducere și Înmatriculări (DGPCI) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      }
    ]
  },
  {
    "slug": "contract-de-vanzare-cumparare-auto",
    "url": "/ghid-auto/contract-de-vanzare-cumparare-auto/",
    "title": "Contract de vânzare-cumpărare auto – acte necesare",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Contract de vânzare-cumpărare auto 2026: model oficial ITL 054, acte necesare, câte exemplare și cum obții viza fiscală de la primărie.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Contractul de vânzare-cumpărare auto se întocmește pe formularul tipizat „Model 2026 ITL 054” (un original și patru copii), semnat de ambele părți. Din 25 februarie 2026 (OUG 7/2026), atât vânzătorul, cât și cumpărătorul trebuie să nu aibă datorii la bugetul local: direcțiile de taxe locale ale celor doi certifică acest lucru direct pe contract, fără un certificat de atestare fiscală separat, iar contractul folosește apoi la transcrierea mașinii pe noul proprietar.",
    "docs": [
      "Formularul de contract „Model 2026 ITL 054”, completat și semnat",
      "Actele de identitate ale vânzătorului și cumpărătorului (original și copie)",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare (talonul)",
      "Confirmarea lipsei datoriilor la bugetul local pentru vânzător și pentru cumpărător (cartușele fiscale de pe contract, certificat de atestare fiscală sau verificare electronică)",
      "Dovada ITP valabil",
      "Asigurare RCA valabilă"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică actele mașinii",
        "description": "Confruntă seria de șasiu de pe CIV cu cea reală, verifică talonul, ITP-ul valabil și eventualele restricții (leasing, gaj, popriri)."
      },
      {
        "num": 2,
        "title": "Obține viza fiscală",
        "description": "Vânzătorul își achită datoriile și impozitul pe tot anul vânzării; direcția de taxe locale a vânzătorului certifică pe contract că nu are datorii. Din 2026, și direcția de taxe locale a cumpărătorului certifică același lucru pentru cumpărător. Fără aceste verificări, contractul este nul de drept."
      },
      {
        "num": 3,
        "title": "Completează contractul în mai multe exemplare",
        "description": "Se folosește formularul „Model 2026 ITL 054” (un original și patru copii certificate), cu datele complete ale părților și ale vehiculului."
      },
      {
        "num": 4,
        "title": "Semnați contractul",
        "description": "Ambele părți semnează toate exemplarele. Contractul poate fi vizat/înregistrat la direcția fiscală, care aplică mențiunea de radiere din rolul vânzătorului."
      },
      {
        "num": 5,
        "title": "Predarea mașinii și a documentelor",
        "description": "Vânzătorul predă cumpărătorului CIV-ul, talonul, cheile și un exemplar de contract; păstrează la rândul lui un exemplar semnat."
      }
    ],
    "costs": [
      {
        "item": "Certificat de atestare fiscală (viză fiscală)",
        "note": "gratuit prin lege din 25.02.2026 (OUG 7/2026); valabil 30 de zile",
        "value": "0 RON"
      },
      {
        "item": "Tehnoredactare / completare contract (opțional)",
        "note": "doar dacă apelezi la un serviciu specializat",
        "value": "aprox. 50-70 RON"
      }
    ],
    "proseHtml": "<h2>Ce este contractul de vânzare-cumpărare auto</h2><p>Contractul de vânzare-cumpărare este documentul care transferă legal dreptul de proprietate asupra unei mașini de la vânzător la cumpărător. În România se folosește un model standardizat, formularul „Model 2026 ITL 054” (aprobat prin Ordinul comun nr. 772/966/123/2026, publicat în Monitorul Oficial din 17 august 2026), identic pe tot teritoriul țării, ceea ce înseamnă că nu trebuie să inventezi o formă proprie de contract.</p><p>Deși nu este obligatorie autentificarea la notar, mulți cumpărători aleg totuși varianta notarială pentru siguranță suplimentară, mai ales la sume mari sau la tranzacții între persoane care nu se cunosc.</p><h2>Câte exemplare și cum se completează</h2><p>Formularul se completează într-un exemplar original, care rămâne la cumpărător, și patru copii certificate „conform cu originalul”: pentru vânzător, pentru direcțiile fiscale ale vânzătorului și cumpărătorului și pentru dosarul de transcriere. Toate rubricile trebuie completate corect: datele de identificare ale părților, datele vehiculului (marcă, serie șasiu, număr de înmatriculare), prețul și data.</p><p>Greșelile de completare (serie șasiu greșită, date lipsă, ștersături) sunt motivul frecvent pentru care serviciul de înmatriculări respinge dosarul, așa că verifică fiecare rubrică înainte de semnare.</p><h2>Viza fiscală și certificatul de atestare fiscală</h2><p>Vânzătorul trebuie să nu aibă datorii la bugetul local și să plătească impozitul pe mașină pe tot anul vânzării. Dacă folosiți formularul tipizat, direcția de taxe locale a vânzătorului certifică acest lucru direct pe contract, fără certificat de atestare fiscală separat; altfel se cere certificatul (gratuit, valabil 30 de zile) sau verificarea electronică.</p><p>Din 25 februarie 2026 (OUG 7/2026, art. 159 alin. (5^2) din Codul de procedură fiscală) și cumpărătorul trebuie să nu aibă datorii la bugetul local de la domiciliul său. Verificarea se face de direcția fiscală a cumpărătorului direct pe contract (formularul tipizat), prin certificat de atestare fiscală sau electronic. Un contract încheiat fără aceste verificări este nul de drept.</p><h2>Documente conexe</h2><p>În contract se trec data expirării ITP-ului și numărul CIV. Cumpărătorul trebuie să declare mașina la direcția de taxe locale în 30 de zile și are la dispoziție 90 de zile pentru transcriere, pentru care are nevoie de ITP valabil și RCA pe numele său.</p>",
    "faq": [
      {
        "question": "Contractul auto trebuie autentificat la notar?",
        "answer": "Nu este obligatoriu. Contractul pe formularul „Model 2026 ITL 054”, semnat de ambele părți și înregistrat la direcția de taxe locale a cumpărătorului (cu verificarea fiscală a ambelor părți), este suficient pentru transcriere. Autentificarea notarială este opțională, pentru siguranță."
      },
      {
        "question": "Câte exemplare de contract sunt necesare?",
        "answer": "Formularul are un exemplar original (pentru cumpărător) și patru copii certificate: pentru vânzător, direcțiile fiscale ale celor două părți și dosarul de înmatriculare."
      },
      {
        "question": "Ce se întâmplă dacă vânzătorul are datorii la primărie?",
        "answer": "Direcția fiscală nu certifică lipsa datoriilor, iar un contract încheiat fără această verificare este nul de drept. Din 2026 regula se aplică și cumpărătorului: dacă are datorii la bugetul local de la domiciliul său, vânzarea nu poate fi finalizată până la achitarea lor."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – înmatriculare / transcriere ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.anaf.ro/",
        "label": "ANAF ↗"
      }
    ]
  },
  {
    "slug": "schimbare-talon-auto-la-schimbare-domiciliu",
    "url": "/ghid-auto/schimbare-talon-auto-la-schimbare-domiciliu/",
    "title": "Schimbare talon auto la schimbare domiciliu 2026 – acte necesare și costuri",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Schimbare talon auto la schimbare domiciliu 2026: acte necesare, certificatul de atestare fiscală (obligatoriu și în același județ), taxa de 76 lei și termenul de 30 de zile.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Orice schimbare de domiciliu, chiar și în același oraș sau în același bloc, te obligă să ceri un nou certificat de înmatriculare în cel mult 30 de zile. Înainte de DGPCI mergi la Direcția de Taxe și Impozite Locale de la noua adresă: la ghișeu ți se cere dovada înregistrării fiscale cu noua adresă (în practică, certificatul de atestare fiscală), indiferent dacă rămâi sau nu în același județ. Mai depui talonul vechi, actul de identitate cu noua adresă și dovada plății taxei de 76 lei (tarif în vigoare din 15 septembrie 2026).",
    "docs": [
      "Cerere-tip pentru eliberarea unui nou certificat de înmatriculare",
      "Actul de identitate cu noua adresă (original și copie)",
      "Dovada înregistrării fiscale cu noua adresă (certificat de atestare fiscală de la taxele locale), la orice schimbare de domiciliu, inclusiv în același județ",
      "Certificatul de înmatriculare vechi (talonul)",
      "Cartea de identitate a vehiculului (CIV)",
      "Poliță RCA valabilă",
      "Dovada plății contravalorii noului certificat de înmatriculare",
      "Plăcuțele vechi (doar dacă alegi să schimbi numărul)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Actualizează adresa în buletin",
        "description": "Mai întâi îți schimbi domiciliul la Serviciul de Evidență a Persoanelor și primești noul act de identitate cu adresa actualizată."
      },
      {
        "num": 2,
        "title": "Mergi la taxele locale de la noua adresă",
        "description": "La orice mutare, chiar și în același oraș, actualizezi datele la Direcția de Taxe și Impozite Locale și obții certificatul de atestare fiscală. Dacă te-ai mutat în altă localitate sau alt sector, scoți mai întâi mașina din evidența vechii primării și o declari la cea nouă."
      },
      {
        "num": 3,
        "title": "Plătește taxa pentru noul certificat",
        "description": "Achită contravaloarea noului certificat de înmatriculare (76 lei) prin Ghișeul.ro, SelfPay sau la bancă."
      },
      {
        "num": 4,
        "title": "Fă programare online la DGPCI",
        "description": "Rezervă o dată pe portalul oficial. Dacă depui cererea prin platforma online DGPCI, dovada fiscală se verifică electronic și nu mai trebuie atașată."
      },
      {
        "num": 5,
        "title": "Depune dosarul și ridică noul talon",
        "description": "Predai actele și primești noul certificat de înmatriculare; dacă optezi pentru livrarea prin curier, primești o dovadă înlocuitoare, valabilă cel mult 30 de zile, cu care poți circula până la sosirea talonului."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare nou",
        "note": "verifică valoarea exactă pe site-ul oficial",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe noi (opțional)",
        "note": "doar dacă vrei alt număr la mutarea în alt județ",
        "value": "52 RON/set (97 RON cu număr preferențial)"
      },
      {
        "item": "Certificat de atestare fiscală",
        "note": "necesar la orice schimbare de domiciliu; taxa variază după primărie",
        "value": "0-30 RON"
      }
    ],
    "proseHtml": "<h2>De ce ești obligat să schimbi talonul</h2><p>Datele din certificatul de înmatriculare trebuie să corespundă cu cele din actul de identitate. Conform Ordinului MAI nr. 181/2024 (art. 3 alin. 2), proprietarul trebuie să ceară un nou certificat de înmatriculare în cel mult 30 de zile de la data la care s-au modificat datele înscrise în el. Regula se aplică la <strong>orice</strong> schimbare de domiciliu: alt județ, alt oraș, altă stradă sau chiar apartamentul vecin.</p><h2>Dovada fiscală: obligatorie la orice mutare, nu doar la schimbarea județului</h2><p>Pentru eliberarea noului talon, art. 14 alin. (1) lit. a) din Ordinul MAI nr. 181/2024 cere <strong>dovada înregistrării în evidențele organului fiscal local</strong>, care să conțină noile date de identificare, ori de câte ori se schimbă domiciliul solicitantului. Legea nu face nicio excepție pentru mutările în același județ sau în aceeași localitate. În practică, Direcția de Taxe și Impozite Locale de la noua adresă îți actualizează datele și îți eliberează un <strong>certificat de atestare fiscală</strong>, pe care îl duci la DGPCI.</p><p>Singura excepție prevăzută de ordin: dacă depui cererea prin platforma online a DGPCI, dovada fiscală nu mai trebuie atașată, pentru că verificarea se face electronic.</p><h2>Mutare în altă localitate sau alt sector</h2><p>Dacă noul domiciliu ține de altă primărie (alt oraș, altă comună sau alt sector din București), mai întâi scoți mașina din evidența fiscală a vechii primării, apoi o declari la noua primărie, care îți eliberează certificatul de atestare fiscală. Dacă rămâi în aceeași localitate, mergi doar la taxele locale de acolo, care îți actualizează adresa și îți eliberează certificatul.</p><p>La mutarea în alt județ nu ești obligat să schimbi plăcuțele; poți păstra numărul actual. Dacă vrei totuși plăcuțe cu indicativul noului județ, plătești separat pentru ele.</p><h2>Termen, amenzi și circulația între timp</h2><p>Nerespectarea termenului de 30 de zile poate atrage amendă contravențională. Dacă ceri ca noul talon să-ți fie trimis prin curier, primești o dovadă înlocuitoare, valabilă până la emiterea certificatului, dar cel mult 30 de zile, cu care poți circula legal.</p><h2>Sfaturi practice</h2><p>Începe cu taxele locale, nu cu DGPCI: fără dovada fiscală dosarul de la ghișeu este respins. Verifică din timp că polița RCA este valabilă și că ai cartea de identitate a vehiculului (CIV), pentru că sunt verificate la eliberarea noului talon; ITP-ul nu este o condiție pentru această operațiune. Fă programarea online cât mai devreme și păstrează copii după toate documentele și dovezile de plată. Cerințele locale pot diferi ușor, așa că sună la serviciul de înmatriculări din județul tău înainte să mergi.</p>",
    "faq": [
      {
        "question": "Trebuie să schimb talonul dacă m-am mutat în același oraș?",
        "answer": "Da. Orice modificare a adresei din buletin, chiar și în același bloc, te obligă să ceri un nou certificat de înmatriculare în cel mult 30 de zile."
      },
      {
        "question": "Am nevoie de certificat de atestare fiscală dacă nu schimb județul?",
        "answer": "Da. Ordinul MAI nr. 181/2024 cere dovada înregistrării fiscale cu noua adresă la orice schimbare de domiciliu, fără excepție pentru mutările în același județ sau oraș. O obții de la taxele locale de la noua adresă. Nu trebuie atașată doar dacă depui cererea prin platforma online DGPCI."
      },
      {
        "question": "Trebuie să schimb și numerele dacă mă mut în alt județ?",
        "answer": "Nu este obligatoriu. Poți păstra numărul actual chiar dacă te muți în alt județ. Plăcuțe noi iei doar dacă îți dorești indicativul noului județ, contra cost."
      },
      {
        "question": "Pot conduce mașina până primesc noul talon?",
        "answer": "Dacă alegi livrarea noului talon prin curier, primești o dovadă înlocuitoare, valabilă până la emiterea certificatului, dar cel mult 30 de zile, cu care poți circula legal."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/290993",
        "label": "Ordinul MAI nr. 181/2024 (art. 3 și art. 14) ↗"
      }
    ]
  },
  {
    "slug": "programare-inmatriculare-auto-cluj-napoca",
    "url": "/ghid-auto/programare-inmatriculare-auto-cluj-napoca/",
    "title": "Programare înmatriculare auto 2026 Cluj-Napoca – acte necesare și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Programare înmatriculare auto Cluj-Napoca 2026: cum faci programarea online la SPCRPCIV, adresa de pe str. Traian Vuia, acte necesare și taxe.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "În Cluj-Napoca, programarea la înmatriculare auto se face online, pe platforma DGPCI (hub.mai.gov.ro), și este obligatorie. Serviciul SPCRPCIV Cluj funcționează pe str. Traian Vuia nr. 157. Înainte de programare trebuie să înregistrezi vehiculul la Direcția de Impozite și Taxe Locale Cluj, apoi rezervi online un interval, cu VIN-ul completat, și te prezinți cu dosarul complet.",
    "docs": [
      "Cererea de înmatriculare completată",
      "Cartea de identitate a vehiculului (CIV)",
      "Documentul de proprietate (contract, factură)",
      "Actul de identitate al proprietarului",
      "Documentul de proprietate înregistrat la taxele locale de la domiciliu (DITL Cluj-Napoca sau primăria localității tale); certificatul de atestare fiscală al cumpărătorului se cere din martie 2026 la încheierea actului de vânzare-cumpărare",
      "Nu mai există fișa de înmatriculare: cererea se completează electronic la ghișeu (elementul trebuie eliminat din listă)",
      "Polița RCA valabilă",
      "Dovada plății certificatului de înmatriculare și a plăcuțelor"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Înregistrează vehiculul la fisc",
        "description": "Depune actele la Direcția de Impozite și Taxe Locale Cluj pentru a lua vehiculul în evidență și a înregistra documentul de proprietate (contract sau factură)."
      },
      {
        "num": 2,
        "title": "Accesează platforma de programare",
        "description": "Intră pe hub.mai.gov.ro sau site-ul DGPCI și alege programarea la ghișeu pentru județul Cluj."
      },
      {
        "num": 3,
        "title": "Selectează serviciul și completează VIN-ul",
        "description": "Alege operațiunea de înmatriculare și introdu seria de șasiu a vehiculului, obligatorie la programare."
      },
      {
        "num": 4,
        "title": "Alege data și ora",
        "description": "Rezervă un interval liber din calendar și confirmă programarea, urmărind e-mailul de confirmare."
      },
      {
        "num": 5,
        "title": "Achită taxele online",
        "description": "Plătește certificatul de înmatriculare și plăcuțele pe ghiseul.ro înainte de a te prezenta."
      },
      {
        "num": 6,
        "title": "Prezintă-te la sediul din str. Traian Vuia",
        "description": "Vino la ora programată la SPCRPCIV Cluj, str. Traian Vuia nr. 157, cu dosarul complet."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare",
        "note": "se achită pe ghiseul.ro",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe cu numere standard",
        "note": "",
        "value": "52 RON"
      },
      {
        "item": "Plăcuțe cu număr preferențial",
        "note": "opțional, la cerere",
        "value": "97 RON"
      },
      {
        "item": "Programarea online",
        "note": "gratuită",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Programarea online, obligatorie și la Cluj</h2><p>Ca în tot restul țării, în Cluj-Napoca înmatricularea auto se face doar pe bază de programare online, prin platforma DGPCI (denumirea actuală a fostului DGPCI), accesibilă și prin hub.mai.gov.ro. Accesul în sediul serviciului este permis, ca regulă, doar titularilor sau persoanelor mandatate, în baza programării. Fără o rezervare validă, dosarul nu se preia.</p><p>Sediul serviciului public comunitar de înmatriculări din Cluj-Napoca (SPCRPCIV) se află pe <strong>str. Traian Vuia nr. 157</strong>, cu program prelungit în timpul săptămânii pentru depunerea dosarelor.</p><h2>Pasul obligatoriu la Direcția de Taxe Locale</h2><p>Înainte de a depune dosarul de înmatriculare, este obligatorie înregistrarea fiscală a vehiculului la Direcția de Impozite și Taxe Locale Cluj. Contractul sau factura trebuie înregistrate la fisc (la taxele locale de la domiciliu), altfel dosarul este incomplet. Este un pas care se face separat, deci planifică-l înainte de programarea propriu-zisă la ghișeu.</p><h2>Cum prinzi un loc liber</h2><p>La Cluj, ca oraș cu trafic mare de dosare, locurile se ocupă repede. Verifică platforma dimineața devreme, când calendarul se actualizează cu intervale noi, și reîncearcă periodic. Atenție: la Cluj programările nu mai pot fi anulate (din 14.02.2025). În schimb, dacă nu poți ajunge la ora stabilită, programarea rămâne valabilă încă 2 zile lucrătoare, în care poți reveni fără o nouă programare. Pentru situații urgente, prefectura ține o listă de așteptare pentru înmatriculare, transcriere și autorizare provizorie, la adresa programariurgente@prefecturacluj.ro (trimiți numele, CNP/CUI, seria de șasiu, telefonul și preferința dimineață/după-amiază), în limita locurilor disponibile.</p><h2>La ghișeu: punctualitate și dosar complet</h2><p>Prezintă-te la ora programării; dacă totuși nu ajungi, la Cluj programarea rămâne valabilă încă 2 zile lucrătoare. Adu dosarul complet, cu documentul de proprietate înregistrat la fisc, CIV, RCA valabil și dovada plății taxelor. Recomandarea practică este să achiți taxele pe ghiseul.ro înainte, astfel încât la ghișeu să rămână doar verificarea documentelor și eliberarea plăcuțelor.</p>",
    "faq": [
      {
        "question": "Unde este serviciul de înmatriculări din Cluj-Napoca?",
        "answer": "SPCRPCIV Cluj funcționează pe str. Traian Vuia nr. 157, în Cluj-Napoca. Programul și datele de contact sunt publicate pe site-ul Prefecturii Cluj."
      },
      {
        "question": "Trebuie să merg la Taxe Locale înainte de înmatriculare?",
        "answer": "Da. Este obligatoriu să înregistrezi vehiculul la Direcția de Impozite și Taxe Locale Cluj și să înregistrezi la fisc documentul de proprietate înainte de a depune dosarul."
      },
      {
        "question": "Pot face programarea în alt județ decât Cluj?",
        "answer": "Nu pentru înmatriculare. Aceasta se face în județul de domiciliu sau reședință; doar operațiunile pe permise pot fi programate în alt județ."
      },
      {
        "question": "Cât costă programarea?",
        "answer": "Programarea online este gratuită. Plătești doar taxele de înmatriculare, respectiv certificatul (76 lei, din 15 septembrie 2026) și plăcuțele."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Servicii MAI - hub programări ↗"
      },
      {
        "url": "https://cj.prefectura.mai.gov.ro/permise-auto-si-inmatriculari/",
        "label": "SPCRPCIV Cluj - Prefectura Cluj ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "programare-inmatriculare-auto",
    "url": "/ghid-auto/programare-inmatriculare-auto/",
    "title": "Programare înmatriculare auto 2026 București – acte necesare și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Programare înmatriculare auto București 2026: cum faci programarea online la DGPCI (fost DRPCIV), acte necesare, taxe și reguli la ghișeu.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "În București, programarea online la înmatriculare auto nu este obligatorie și nu este singura cale: cererea de înmatriculare se poate depune fie pe baza programării online făcute pe platforma DGPCI (fost DRPCIV), accesibilă prin hub.mai.gov.ro, fie pe baza unui bon de ordine luat de la aparatele de bonuri de la parterul sediului SPCRPCIV București din Șos. Pipera nr. 49, sector 2. Alegi județul, serviciul de înmatriculare, completezi VIN-ul vehiculului și rezervi data și ora. Programarea online este doar recomandată, pentru a evita cozile; dacă totuși ai o programare, prezintă-te la timp, fiindcă o întârziere de câteva minute poate duce la respingerea automată.",
    "docs": [
      "Cererea de înmatriculare completată",
      "Cartea de identitate a vehiculului (CIV)",
      "Documentul de proprietate (contract, factură)",
      "Actul de identitate al proprietarului",
      "Documentul de proprietate înregistrat la Direcția de Taxe și Impozite Locale de la domiciliu (certificatul de atestare fiscală al cumpărătorului se cere din martie 2026 la încheierea actului de vânzare-cumpărare)",
      "Nu mai există fișa de înmatriculare: cererea se completează electronic la ghișeu (elementul trebuie eliminat din listă)",
      "Polița RCA valabilă",
      "Dovada plății certificatului de înmatriculare și a plăcuțelor"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Intră pe platforma oficială",
        "description": "Accesează hub.mai.gov.ro sau site-ul DGPCI și mergi la secțiunea de programare la ghișeu pentru înmatriculări."
      },
      {
        "num": 2,
        "title": "Alege județul și serviciul",
        "description": "Selectează municipiul București și tipul de operațiune: înmatriculare vehicul. Nu greși categoria, altfel programarea nu este validă."
      },
      {
        "num": 3,
        "title": "Completează datele vehiculului",
        "description": "Pentru înmatriculare, introducerea seriei de șasiu (VIN) este obligatorie la programare."
      },
      {
        "num": 4,
        "title": "Alege data și ora",
        "description": "Selectează din calendar un interval liber și confirmă programarea, de regulă prin e-mail, în scurt timp."
      },
      {
        "num": 5,
        "title": "Plătește taxele înainte",
        "description": "Achită certificatul de înmatriculare și plăcuțele pe ghiseul.ro, ca să eviți întârzierile la ghișeu."
      },
      {
        "num": 6,
        "title": "Prezintă-te la timp cu dosarul",
        "description": "Vino la ora exactă a programării, cu toate actele; întârzierea sau lipsa unui document duce la respingere."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare",
        "note": "se achită pe ghiseul.ro",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe cu numere standard",
        "note": "",
        "value": "52 RON"
      },
      {
        "item": "Plăcuțe cu număr preferențial",
        "note": "45 lei combinație preferențială + 52 lei perechea de plăcuțe tip A; opțional, la cerere",
        "value": "97 RON"
      },
      {
        "item": "Programarea online",
        "note": "gratuită",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Programarea online, recomandată în București</h2><p>În 2026, în București te poți prezenta la ghișeu pentru înmatriculare și fără o programare online, pe baza unui bon de ordine luat de la <a href=\"https://b.prefectura.mai.gov.ro/23011-2/\" target=\"_blank\" rel=\"noopener\">aparatele de bonuri de la parterul sediului din Șos. Pipera nr. 49, sector 2</a>; pe un bon poți depune cel mult două cereri. Sistemul a fost unificat la nivel național pe platforma DGPCI (denumirea actuală a fostei DRPCIV), accesibilă și prin hub.mai.gov.ro. Regula practică este simplă: programarea online este recomandată pentru a evita cozile, dar depunerea dosarului este posibilă și pe baza bonului de ordine.</p><p>Serviciul de înmatriculări din Capitală primește cereri atât pe bază de programare online (intervale orare rezervate în prealabil), cât și pe bază de bon de ordine; cu programare, formalitățile la ghișeu durează, potrivit prefecturii, cel mult 10 minute.</p><h2>Cum găsești un loc liber</h2><p>Locurile se eliberează în valuri, așa că merită să verifici calendarul dimineața devreme, când sistemul se actualizează, și să reîncerci periodic. Dacă renunți la o programare, anuleaz-o - eliberezi astfel un loc și eviți o absență înregistrată. Reține că înmatricularea se poate face doar în județul de domiciliu sau reședință, spre deosebire de operațiunile pe permise, care pot fi programate în orice județ.</p><h2>Reguli stricte la ghișeu</h2><p>Prezentarea la ora exactă a programării este esențială. O întârziere de câteva minute poate duce la respingerea automată și la reprogramare. Vino cu dosarul complet: lipsa dovezii că documentul de proprietate a fost înregistrat la taxele locale, a RCA-ului sau a dovezii de plată a taxelor înseamnă întoarcere acasă. Recomandarea practică este să plătești taxele pe ghiseul.ro înainte de a te prezenta.</p><h2>Pregătește dosarul din timp</h2><p>Înainte de programare, asigură-te că ai luat vehiculul în evidența fiscală la Direcția de Taxe și Impozite Locale de sector, pentru că documentul de proprietate (contractul sau factura) trebuie înregistrat la fiscul local de la domiciliul tău. Verifică valabilitatea ITP și a poliței RCA. Un dosar ordonat și complet transformă vizita la ghișeu într-o formalitate de câteva minute.</p>",
    "faq": [
      {
        "question": "Pot merge la înmatriculare fără programare în București?",
        "answer": "Da. Te poți prezenta și fără programare online, pe baza unui bon de ordine luat de la aparatele de bonuri de la parterul sediului din Șos. Pipera nr. 49, sector 2. Programarea online este doar recomandată, nu obligatorie."
      },
      {
        "question": "Ce date îmi trebuie pentru programare?",
        "answer": "Datele de identificare și, obligatoriu, seria de șasiu (VIN) a vehiculului pe care vrei să îl înmatriculezi."
      },
      {
        "question": "Ce se întâmplă dacă întârzii la programare?",
        "answer": "O întârziere de câteva minute poate duce la respingerea automată a programării și la necesitatea de a rezerva un nou interval."
      },
      {
        "question": "Programarea costă ceva?",
        "answer": "Nu, programarea online este gratuită. Plătești doar taxele de înmatriculare: certificatul (76 lei, din 15 septembrie 2026) și plăcuțele."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://b.prefectura.mai.gov.ro/permise-auto-si-inmatriculari/",
        "label": "Programare, acte și tarife înmatriculare în București — Prefectura Municipiului București (Permise auto și înmatriculări) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Platforma națională de programări înmatriculări/permise — DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Hub servicii MAI — programări online (hub.mai.gov.ro) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Plata online a taxelor de înmatriculare — Ghișeul.ro ↗"
      }
    ]
  },
  {
    "slug": "numere-rosii-auto",
    "url": "/ghid-auto/numere-rosii-auto/",
    "title": "Numere roșii auto 2026 – autorizație provizorie, acte necesare și taxe",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Numere roșii auto 2026: acte necesare pentru autorizația provizorie de circulație, taxe (77 lei + RCA), valabilitate și unde le obții la DGPCI.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Numerele roșii, adică autorizația provizorie de circulație, îți permit să circuli legal cu un vehicul neînmatriculat definitiv. Se obțin la serviciul de înmatriculări DGPCI (fost DRPCIV) din județul de domiciliu, costă în total 77 lei (25 lei autorizația, din 15 septembrie 2026, + 52 lei perechea de plăcuțe), la care se adaugă RCA obligatoriu, și se pot elibera direct pentru maximum 90 de zile (sau pentru perioade mai scurte care, cumulat, nu depășesc 90 de zile).",
    "docs": [
      "Cererea tip pentru autorizația provizorie de circula��ie",
      "Actul de identitate al solicitantului (original și copie)",
      "Documentul de proprietate asupra vehiculului (original și copie)",
      "Documentele de înmatriculare emise de autoritățile străine (original și copie), pentru vehiculele înmatriculate anterior în alt stat",
      "Nu mai este necesară fișa de înmatriculare: cererea este completată electronic la ghișeu (elementul trebuie eliminat din listă)",
      "Polița RCA valabilă",
      "Dovada plății taxei de autorizație și a contravalorii plăcuțelor"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Încheie asigurarea RCA",
        "description": "Fără o poliță RCA valabilă pe perioada solicitată, autorizația provizorie nu poate fi eliberată."
      },
      {
        "num": 2,
        "title": "Achită taxele",
        "description": "Plătește taxa de autorizație (25 lei, din 15 septembrie 2026) și contravaloarea plăcuțelor roșii (52 lei perechea), de preferat online pe ghiseul.ro."
      },
      {
        "num": 3,
        "title": "Fă programarea online",
        "description": "Rezervă un loc la ghișeu pe platforma DGPCI, la categoria autorizație provizorie de circulație."
      },
      {
        "num": 4,
        "title": "Depune dosarul",
        "description": "Prezintă la ghișeu actul de identitate, documentul de proprietate, actele de înmatriculare străine (pentru mașinile aduse din alt stat) și dovezile de plată; RCA-ul se verifică electronic."
      },
      {
        "num": 5,
        "title": "Ridică autorizația și plăcuțele",
        "description": "Dacă dosarul este complet, primești pe loc autorizația și plăcuțele roșii, pe care le montezi imediat."
      }
    ],
    "costs": [
      {
        "item": "Autorizație provizorie de circulație",
        "note": "",
        "value": "25 RON"
      },
      {
        "item": "Plăcuțe roșii (provizorii)",
        "note": "",
        "value": "52 RON"
      },
      {
        "item": "Total taxe DGPCI",
        "note": "fără RCA",
        "value": "77 RON"
      },
      {
        "item": "Asigurare RCA",
        "note": "obligatorie, cost separat",
        "value": "variabil"
      }
    ],
    "proseHtml": "<h2>Ce sunt numerele roșii și când ai nevoie de ele</h2><p>Autorizația provizorie de circulație, cunoscută popular drept \"numere roșii\", este o soluție legală temporară care permite deplasarea pe drumurile publice a unui vehicul care nu are încă înmatriculare definitivă. Este utilă atunci când tocmai ai cumpărat o mașină și încă nu ai finalizat dosarul de înmatriculare, când duci vehiculul la ITP sau la RAR, când îl transporți către cumpărător ori când îl duci la cumpărător în România. Pentru scoaterea din țară în vederea înmatriculării în alt stat nu se folosesc numere roșii, ci înmatricularea temporară (numere temporare, maximum 30 de zile).</p><p>Spre deosebire de plăcuțele definitive, cele roșii au un termen de valabilitate limitat și un scop clar: să acopere perioada de tranziție dintre proprietate și înmatriculare.</p><h2>Cât timp poți circula legal</h2><p>Conform Ordinului MAI nr. 181/2024, autorizația se emite pentru <strong>maximum 90 de zile</strong> sau pentru perioade mai scurte care, cumulat, nu pot depăși <strong>90 de zile</strong>. Excepție: pentru un vehicul înmatriculat anterior în alt stat, fără actele de înmatriculare străine, autorizația se dă pentru cel mult 5 zile. Depășirea termenului sau circulația cu autorizația expirată atrage sancțiuni și riscul de a rămâne fără drept de circulație.</p><h2>Costuri și unde se depune dosarul</h2><p>Taxele sunt mici: 25 de lei pentru autorizație (din 15 septembrie 2026) și 52 de lei pentru perechea de plăcuțe, în total 77 de lei, la care se adaugă costul RCA. Dosarul se depune la serviciul de înmatriculări DGPCI din județul de domiciliu, pe bază de programare online. Necesitatea programării o stabilește fiecare prefectură: în multe județe este obligatorie, dar de exemplu în București poți depune cererea și pe bază de bon de ordine.</p><h2>Greșeli de evitat</h2><p>Cea mai frecventă greșeală este RCA-ul cu valabilitate mai scurtă decât perioada cerută pentru autorizație - sistemul respinge cererea. Verifică și ca seria de șasiu din programare și din documentul de proprietate să corespundă exact cu cea a vehiculului. Atenție: numerele roșii sunt valabile doar pe teritoriul României; pentru scoaterea vehiculului din țară în vederea înmatriculării în alt stat se face o înmatriculare temporară, valabilă cel mult 30 de zile.</p>",
    "faq": [
      {
        "question": "Câte zile sunt valabile numerele roșii?",
        "answer": "Până la 90 de zile: autorizația se poate emite direct pentru maximum 90 de zile sau pentru perioade mai scurte care, cumulat, nu depășesc 90 de zile."
      },
      {
        "question": "Pot circula cu numere roșii în străinătate?",
        "answer": "Nu, numerele roșii obișnuite sunt valabile doar în România. Pentru scoaterea vehiculului din țară în vederea înmatriculării în alt stat se face o înmatriculare temporară (numere temporare), valabilă cel mult 30 de zile."
      },
      {
        "question": "Am nevoie de RCA pentru numere roșii?",
        "answer": "Da, asigurarea RCA valabilă este obligatorie și trebuie să acopere toată perioada pentru care ceri autorizația provizorie."
      },
      {
        "question": "Cât costă numerele roșii în 2026?",
        "answer": "77 de lei la ghișeu (25 de lei autorizația, din 15 septembrie 2026, și 52 de lei perechea de plăcuțe), plus costul poliței RCA."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Servicii MAI - hub programări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "schimbare-numar-inmatriculare-auto",
    "url": "/ghid-auto/schimbare-numar-inmatriculare-auto/",
    "title": "Schimbare număr înmatriculare auto 2026 – acte necesare și costuri",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Schimbare număr înmatriculare auto 2026: când e obligatorie, acte necesare, costuri (plăcuțe 52-97 lei, certificat 76 lei) și procedura la DGPCI.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Schimbarea numărului de înmatriculare devine necesară când pierzi sau ți se fură plăcuțele, când acestea sunt deteriorate, când vrei un număr preferențial sau, opțional, când te muți în alt județ și vrei indicativul noului județ. Se face la serviciul de înmatriculări DGPCI (fost DRPCIV), pe bază de programare online. Plăcuțele standard costă 52 lei perechea (26 lei/bucată), iar un număr preferențial 97 lei (45 lei tariful combinației + 52 lei plăcuțele); dacă se schimbă combinația se plătește și un certificat de înmatriculare nou (76 lei, din 15 septembrie 2026).",
    "docs": [
      "Cererea tip de eliberare a plăcuțelor / atribuire număr",
      "Actul de identitate al proprietarului (original și copie)",
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV)",
      "Polița RCA valabilă",
      "Plăcuțele vechi (dacă există)",
      "Dovada plății plăcuțelor și, după caz, a certificatului nou",
      "Dovada înregistrării fiscale cu noua adresă (la orice schimbare de domiciliu)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Stabilește motivul schimbării",
        "description": "Verifică dacă este vorba de pierdere, furt, deteriorare, mutare în alt județ sau alegerea unui număr preferențial - de asta depind actele."
      },
      {
        "num": 2,
        "title": "Declară furtul la poliție (dacă e cazul)",
        "description": "Dacă plăcuțele au fost furate, trebuie mai întâi să declari furtul la poliție, înainte de a cere înlocuirea."
      },
      {
        "num": 3,
        "title": "Achită taxele",
        "description": "Plătește contravaloarea plăcuțelor (52 lei perechea standard sau 97 lei cu număr preferențial) și, dacă se schimbă numărul, certificatul de înmatriculare (76 lei)."
      },
      {
        "num": 4,
        "title": "Fă programarea online",
        "description": "Dacă prefectura din județul tău cere programare, rezervă un interval pe platforma DGPCI (sau pe hub.mai.gov.ro), la categoria corespunzătoare operațiunii; pentru plăcuțe pierdute, furate sau deteriorate unele județe nu cer programare."
      },
      {
        "num": 5,
        "title": "Depune dosarul și predă plăcuțele vechi",
        "description": "La ghișeu prezinți actele și predai plăcuțele vechi; primești plăcuțele noi pe loc."
      }
    ],
    "costs": [
      {
        "item": "Plăcuțe cu numere standard",
        "note": "",
        "value": "52 RON"
      },
      {
        "item": "Plăcuțe cu număr preferențial",
        "note": "45 lei taxă + 52 lei plăcuțe",
        "value": "97 RON"
      },
      {
        "item": "Certificat de înmatriculare nou",
        "note": "dacă se schimbă combinația sau județul",
        "value": "76 RON"
      },
      {
        "item": "Programarea online",
        "note": "gratuită",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Când trebuie să schimbi numărul de înmatriculare</h2><p>Schimbarea plăcuțelor sau a numărului de înmatriculare nu este mereu o alegere - uneori este obligatorie. Situațiile tipice sunt: ai <strong>pierdut</strong> una sau ambele plăcuțe, ți-au fost <strong>furate</strong>, sunt <strong>deteriorate sau ilizibile</strong> ori pur și simplu vrei un <strong>număr preferențial</strong>. La mutarea în alt județ nu ești obligat să schimbi numărul: poți păstra combinația actuală sau poți cere una cu indicativul noului județ. În ambele cazuri schimbi talonul, iar la ghișeu ai nevoie de dovada înregistrării fiscale cu noua adresă.</p><h2>Diferența dintre plăcuțe standard și număr preferențial</h2><p>Dacă vrei doar înlocuirea unor plăcuțe deteriorate, păstrând aceeași combinație (când e posibil), plătești doar contravaloarea plăcuțelor - 52 de lei perechea (26 de lei bucata). Pentru un număr preferențial (combinația aleasă de tine, contra unei taxe suplimentare de 45 de lei), costul urcă la 97 de lei. Când se schimbă efectiv combinația sau județul, se emite și un certificat de înmatriculare nou, taxat cu 76 de lei (din 15 septembrie 2026).</p><h2>Procedura la ghișeu</h2><p>Regulile de programare le stabilește fiecare prefectură: pentru schimbarea combinației sau a datelor din talon programarea online pe platforma DGPCI (fostul DRPCIV) este de regulă necesară sau recomandată, însă pentru plăcuțe pierdute, furate sau deteriorate unele județe (de exemplu Cluj) nu cer programare, iar în București poți veni și cu bon de ordine. La ghișeu prezinți actul de identitate, talonul, CIV-ul, RCA-ul valabil și dovezile de plată. Un detaliu important: la eliberarea plăcuțelor noi, funcționarul îți va cere să predai plăcuțele vechi de pe vehicul. Depunerea durează, în general, 10-20 de minute, iar plăcuțele se ridică pe loc.</p><h2>Atenție la furt și la deteriorare</h2><p>Dacă plăcuțele au fost furate, ordinea corectă este să declari mai întâi furtul la poliție și abia apoi să soliciți înlocuirea - altfel dosarul poate fi blocat. Nu circula cu plăcuțe lipsă, îndoite sau ilizibile: reprezintă contravenție și poate atrage sancțiuni. Verifică întotdeauna ca noua poliță RCA să fie emisă pe numărul corect, dacă acesta se schimbă.</p>",
    "faq": [
      {
        "question": "Cât costă schimbarea numărului de înmatriculare?",
        "answer": "Plăcuțele standard costă 52 lei perechea, iar un număr preferențial 97 lei (45 lei tariful + 52 lei plăcuțele). Dacă se schimbă combinația sau județul, se adaugă certificatul de înmatriculare nou, 76 lei (din 15 septembrie 2026)."
      },
      {
        "question": "Trebuie să predau plăcuțele vechi?",
        "answer": "Da. La eliberarea plăcuțelor noi, funcționarul îți cere să predai plăcuțele vechi de pe vehicul."
      },
      {
        "question": "Ce fac dacă mi-au fost furate plăcuțele?",
        "answer": "Declari mai întâi furtul la poliție, apoi soliciți la DGPCI eliberarea unor plăcuțe noi, pe baza dovezii de la poliție."
      },
      {
        "question": "Îmi schimb numărul dacă mă mut în alt județ?",
        "answer": "Nu este obligatoriu. La schimbarea județului de domiciliu primești un certificat de înmatriculare nou, cu adresa actualizată, dar poți păstra numărul actual. Un număr cu indicativul noului județ primești doar dacă îl ceri, plătind plăcuțele noi."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Servicii MAI - hub programări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "duplicat-certificat-de-inmatriculare",
    "url": "/ghid-auto/duplicat-certificat-de-inmatriculare/",
    "title": "Duplicat certificat de înmatriculare – acte necesare și procedura oficială",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Duplicat certificat de înmatriculare 2026: acte necesare, taxa de 76 RON și procedura oficială la DGPCI pentru talon pierdut, furat sau deteriorat.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Duplicatul certificatului de înmatriculare (talonul) se obține de la serviciul public comunitar regim permise de conducere și înmatriculare a vehiculelor (SPCRPCIV) care a efectuat înmatricularea, pe bază de programare sau, unde prefectura permite, fără programare (de exemplu cu bon de ordine în București; în Cluj duplicatele nu necesită programare). Ai nevoie de o cerere, actul de identitate, cartea de identitate a vehiculului și dovada plății contravalorii certificatului, de 76 RON (tarif în vigoare din 15 septembrie 2026). Nu este nevoie să duci mașina la RAR: Ordinul MAI nr. 181/2024 nu cere identificarea vehiculului și nici ITP valabil pentru duplicatul certificatului de înmatriculare, ci doar o carte de identitate a vehiculului valabilă.",
    "docs": [
      "Cererea pentru eliberarea duplicatului certificatului de înmatriculare",
      "Actul de identitate al proprietarului (original și copie)",
      "Cartea de identitate a vehiculului (CIV) - original și copie",
      "Declarație privind pierderea, furtul sau deteriorarea talonului",
      "Certificatul de înmatriculare deteriorat (dacă este cazul)",
      "Dovada plății contravalorii certificatului (76 RON)",
      "Nu este necesară dovada ITP: Ordinul MAI nr. 181/2024 (art. 13) nu o cere pentru duplicat (elementul trebuie eliminat din listă)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Anunță pierderea sau furtul",
        "description": "În caz de furt, sesizează poliția. Pentru pierdere sau deteriorare, dai o declarație pe proprie răspundere la depunerea dosarului."
      },
      {
        "num": 2,
        "title": "Achită taxa de 76 RON",
        "description": "Plătește contravaloarea certificatului prin Ghișeul.ro, internet banking în contul Trezoreriei sau la stațiile SelfPay și păstrează dovada."
      },
      {
        "num": 3,
        "title": "Programează-te online",
        "description": "Verifică pe site-ul prefecturii dacă pentru duplicat e nevoie de programare: unele județe (de exemplu Cluj) eliberează duplicatele fără programare, iar în București poți depune și pe bază de bon de ordine. Unde e necesară, programarea se face gratuit pe platforma DGPCI."
      },
      {
        "num": 4,
        "title": "Depune dosarul",
        "description": "Prezintă cererea, actul de identitate, CIV-ul și dovada plății. Nu este necesară aducerea mașinii și nici dovada ITP."
      },
      {
        "num": 5,
        "title": "Ridică duplicatul",
        "description": "Noul certificat de înmatriculare se eliberează, de regulă, în câteva zile lucrătoare."
      }
    ],
    "costs": [
      {
        "item": "Contravaloare certificat de înmatriculare",
        "note": "tarif în vigoare din 15 septembrie 2026 (anterior 49 RON)",
        "value": "76 RON"
      }
    ],
    "proseHtml": "<h2>Talon pierdut: primul pas</h2><p>Certificatul de înmatriculare, cunoscut popular ca talon, este documentul obligatoriu pe care trebuie să îl ai la tine în trafic. Dacă l-ai pierdut sau ți-a fost furat, legal nu mai ai voie să circuli cu mașina până nu obții duplicatul, deoarece nu poți face dovada înmatriculării.</p><p>De aceea, procedura de duplicat trebuie tratată prompt. Spre deosebire de cartea de identitate a vehiculului (CIV), care se eliberează de RAR, talonul se emite de serviciul public comunitar de înmatriculări din cadrul MAI.</p><h2>De ce nu este nevoie de RAR</h2><p>O confuzie frecventă este că oamenii cred că trebuie să ducă mașina la RAR pentru identificare. În cazul duplicatului de certificat de înmatriculare pentru pierdere, furt sau deteriorare, identificarea vehiculului la RAR NU este necesară, iar Ordinul MAI nr. 181/2024 nu condiționează eliberarea duplicatului de un ITP valabil; se verifică doar existența unei cărți de identitate a vehiculului valabile. Aceasta simplifică mult procedura față de duplicatul de CIV.</p><h2>Programare: verifică regula din județul tău</h2><p>Necesitatea programării online o stabilește fiecare prefectură. În multe județe programarea este recomandată, însă pentru duplicate regulile diferă: în Cluj, eliberarea duplicatelor de certificat de înmatriculare nu necesită programare, iar în București cererea se poate depune și pe bază de bon de ordine. Verifică pe site-ul prefecturii înainte să mergi. Ai grijă să achiți contravaloarea certificatului, de 76 RON (din 15 septembrie 2026), înainte și să aduci dovada plății, alături de actul de identitate și CIV.</p><h2>Sfaturi și capcane frecvente</h2><p>Verifică datele de pe noul certificat imediat ce îl primești, pentru a corecta eventualele erori pe loc. Dacă ești mandatar (nu proprietarul), ai nevoie de împuternicire. În cazul persoanelor juridice, cererea se depune cu delegație și documentele firmei. Nu circula cu mașina în perioada în care nu ai talon valabil - amenda și reținerea documentelor sunt riscuri reale.</p>",
    "faq": [
      {
        "question": "Cât costă duplicatul talonului în 2026?",
        "answer": "Taxa oficială pentru certificatul de înmatriculare este de 76 RON (din 15 septembrie 2026; anterior 49 RON), plătibilă prin Ghișeul.ro, internet banking sau la stațiile SelfPay."
      },
      {
        "question": "Trebuie să duc mașina la RAR pentru duplicatul talonului?",
        "answer": "Nu. Pentru pierdere, furt sau deteriorare nu este necesară identificarea la RAR, iar ITP-ul nu este o condiție pentru duplicat; se verifică doar ca mașina să aibă o carte de identitate a vehiculului valabilă."
      },
      {
        "question": "Pot circula cu mașina dacă am pierdut talonul?",
        "answer": "Nu, legal nu ai voie să circuli fără certificatul de înmatriculare valabil. Obține duplicatul înainte de a folosi mașina."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      }
    ]
  },
  {
    "slug": "radiere-auto-pentru-export",
    "url": "/ghid-auto/radiere-auto-pentru-export/",
    "title": "Radiere auto pentru export 2026 – acte necesare și pașii de urmat",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Radiere auto pentru export 2026: acte necesare, contract de vânzare extern, termen de 30 de zile de la scoaterea din țară și pașii la Primărie și DGPCI. Ghid complet.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Radierea pentru export se solicită atunci când vinzi sau scoți definitiv mașina din România. Depui dosarul la serviciul de înmatriculări DGPCI (fost DRPCIV) din județul unde e înmatriculat vehiculul, cu dovada că mașina a fost scoasă din țară în vederea înmatriculării în alt stat (de regulă dovada înmatriculării în statul de destinație, plus contractul de vânzare tradus autorizat) și certificatul de atestare fiscală. Radierea este gratuită, iar termenul de depunere este de 30 de zile de la scoaterea mașinii din România. Dacă mașina a fost deja înmatriculată permanent în alt stat, DGPCI o poate radia și din oficiu, la notificarea autorității străine.",
    "docs": [
      "Cererea de radiere completată",
      "Actul de identitate al proprietarului (original și copie)",
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV) – nu este cerută de Ordinul MAI 181/2024 la radiere; în cazul exportului ea însoțește de regulă mașina la cumpărător",
      "Plăcuțele cu numărul de înmatriculare",
      "Contractul de vânzare-cumpărare extern (cu traducere autorizată dacă e în altă limbă)",
      "Dovada scoaterii din țară în vederea înmatriculării în alt stat (de regulă dovada înmatriculării în statul de destinație)",
      "Certificatul de atestare fiscală de la Primărie"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Încheie tranzacția de export",
        "description": "Semnează contractul de vânzare-cumpărare cu cumpărătorul din străinătate și, dacă e cazul, obține traducerea autorizată a acestuia."
      },
      {
        "num": 2,
        "title": "Scoate vehiculul din evidența fiscală",
        "description": "Mergi la Primărie cu documentele de înstrăinare, achită toate datoriile la bugetul local (inclusiv impozitul pe tot anul vânzării) și obține certificatul de atestare fiscală, gratuit și valabil 30 de zile."
      },
      {
        "num": 3,
        "title": "Fă programarea la DGPCI",
        "description": "Rezervă online un interval pentru radiere la serviciul de înmatriculări din județul unde e înmatriculat vehiculul."
      },
      {
        "num": 4,
        "title": "Depune dosarul de radiere",
        "description": "Prezintă cererea, talonul, CIV-ul, plăcuțele, contractul de export tradus și certificatul fiscal. Predai plăcuțele și talonul."
      },
      {
        "num": 5,
        "title": "Ridică certificatul de radiere",
        "description": "Dosarul complet se soluționează de obicei în aceeași zi, iar vehiculul este scos din evidența DGPCI."
      }
    ],
    "costs": [
      {
        "item": "Radiere la DGPCI",
        "note": "gratuită",
        "value": "0 RON"
      },
      {
        "item": "Scoatere din evidență la Primărie",
        "note": "gratuită; trebuie achitate toate obligațiile la bugetul local",
        "value": "0 RON"
      },
      {
        "item": "Traducere autorizată a contractului",
        "note": "dacă e necesară",
        "value": "cca. 50-150 RON"
      },
      {
        "item": "Înmatriculare temporară pentru export (opțional)",
        "note": "dacă mașina iese din țară pe roți; o face, de regulă, cumpărătorul, pe numele său, pentru maximum 30 de zile",
        "value": "76 RON certificat + 52 RON plăcuțe"
      }
    ],
    "proseHtml": "<h2>Când e nevoie de radierea pentru export</h2><p>Radierea pentru export se aplică atunci când vinzi mașina unui cumpărător din altă țară sau când o scoți definitiv din România. Scopul este să elimini vehiculul din evidența autorităților române, astfel încât să nu mai figureze pe numele tău și să nu mai generezi obligații fiscale sau răspundere pentru un autoturism care nu mai este în țară. Este un pas pe care mulți vânzători îl amână și îl regretă când primesc amenzi sau impozit pentru o mașină pe care nu o mai dețin.</p><h2>Documentul justificativ, piesa centrală</h2><p>Față de dosarul standard de radiere, pentru export elementul specific este documentul care atestă înstrăinarea în afara țării: de regulă <strong>contractul de vânzare-cumpărare extern</strong>. Dacă acesta este redactat într-o altă limbă, ai nevoie de o traducere autorizată. Dovada înmatriculării permanente în statul de destinație este documentul pe baza căruia radierea poate fi cerută și de ultimul proprietar înscris în talon; tot pe baza notificării privind înmatricularea în alt stat, DGPCI poate radia mașina și din oficiu.</p><h2>Termenul de 30 de zile și sancțiunile</h2><p>Legea impune depunerea cererii de radiere în <strong>30 de zile</strong> de la data scoaterii mașinii din România în vederea înmatriculării în alt stat. Nerespectarea termenului poate atrage amenzi (în practică, sancțiuni de ordinul sutelor de lei), pe lângă riscul de a rămâne cu impozitul curgând. Verifică valorile exacte ale amenzilor pe surse oficiale, întrucât se pot actualiza.</p><h2>Sfaturi practice</h2><p>Rezolvă întâi partea fiscală la Primărie, apoi mergi la DGPCI. La depunere predai plăcuțele și certificatul de înmatriculare. Dacă mașina pleacă din țară pe propriile roți, nu o radia înainte de plecare: radierea se cere în 30 de zile de la scoaterea din țară. Alternativ, cumpărătorul poate solicita înmatricularea temporară pentru export, valabilă cel mult 30 de zile. Autorizația de circulație provizorie („numerele roșii”) este valabilă doar pe teritoriul României. Păstrează o copie după contractul de export și după certificatul de radiere - sunt utile în relația cu fiscul și cu asiguratorul.</p>",
    "faq": [
      {
        "question": "Cât costă radierea pentru export?",
        "answer": "Radierea în sine este gratuită. Pot apărea costuri doar pentru traducerea autorizată a contractului sau, dacă mașina iese din țară pe roți, pentru înmatricularea temporară pentru export (certificat 76 lei + plăcuțe 52 lei)."
      },
      {
        "question": "În cât timp trebuie să radiez mașina după vânzarea la export?",
        "answer": "În 30 de zile de la scoaterea mașinii din România în vederea înmatriculării în alt stat. Depășirea termenului poate atrage amenzi și menținerea obligațiilor fiscale."
      },
      {
        "question": "Am nevoie de traducere autorizată a contractului?",
        "answer": "Da, dacă contractul de vânzare-cumpărare este redactat într-o altă limbă decât româna, este necesară traducerea autorizată."
      },
      {
        "question": "Cum scot mașina din țară dacă am predat plăcuțele?",
        "answer": "Nu preda plăcuțele înainte ca mașina să iasă din țară: radierea pentru export se cere în 30 de zile de la scoaterea din România. Alternativ, cumpărătorul poate face o înmatriculare temporară pentru export, valabilă cel mult 30 de zile. Autorizația de circulație provizorie este valabilă numai pe teritoriul României, deci nu poate fi folosită pentru drumul în străinătate."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Servicii MAI - hub programări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "radiere-auto-pentru-dezmembrare",
    "url": "/ghid-auto/radiere-auto-pentru-dezmembrare/",
    "title": "Radiere auto pentru dezmembrare 2026 – certificat de distrugere și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Radiere auto pentru dezmembrare 2026: cum obții certificatul de distrugere, ce depui la Primărie și DGPCI, costuri și termene. Ghid pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru dezmembrare, mașina se predă la un operator autorizat (tip REMAT), care preia vehiculul și eliberează gratuit certificatul de distrugere. Cu acest certificat și cu certificatul de atestare fiscală (toate datoriile la bugetul local achitate) ceri radierea la DGPCI (fost DRPCIV) în 30 de zile de la predare, iar apoi depui declarația de radiere la Primărie în 30 de zile. Certificatul de distrugere trebuie emis de un operator autorizat (autorizație de mediu și, pentru dezmembrare, autorizație tehnică RAR), altfel radierea este blocată.",
    "docs": [
      "Certificatul de distrugere emis de operatorul autorizat",
      "Cererea de radiere / de scoatere din evidență",
      "Actul de identitate al proprietarului (original și copie)",
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV) – nu este cerută de Ordinul MAI 181/2024 la radiere; la operatorul de dezmembrare se prezintă în original și copie",
      "Plăcuțele cu numărul de înmatriculare",
      "Certificatul de atestare fiscală de la Primărie"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Predă mașina la un operator autorizat",
        "description": "Duci vehiculul la o unitate autorizată pentru colectarea și tratarea vehiculelor scoase din uz (tip REMAT), cu CIV-ul (original și copie) și actul de identitate. Din acest moment curge termenul de 30 de zile pentru radiere."
      },
      {
        "num": 2,
        "title": "Primește certificatul de distrugere",
        "description": "Operatorul îți eliberează, gratuit, certificatul de distrugere în original - documentul-cheie al întregii proceduri."
      },
      {
        "num": 3,
        "title": "Scoate vehiculul din evidența fiscală",
        "description": "Achiți la Primărie toate datoriile la bugetul local și obții certificatul de atestare fiscală (gratuit, valabil 30 de zile). După radiere, depui la Primărie declarația de radiere, în 30 de zile."
      },
      {
        "num": 4,
        "title": "Depune dosarul la DGPCI",
        "description": "Faci programare online și depui la serviciul de înmatriculări cererea de radiere, certificatul de distrugere, certificatul de atestare fiscală, actul de identitate, talonul și plăcuțele (dacă nu le-a preluat operatorul)."
      },
      {
        "num": 5,
        "title": "Obții radierea din circulație",
        "description": "Dosarul complet se soluționează, de regulă, în aceeași zi, iar vehiculul este scos definitiv din evidența DGPCI."
      }
    ],
    "costs": [
      {
        "item": "Certificat de distrugere (operator autorizat)",
        "note": "gratuit pentru proprietar",
        "value": "0 RON"
      },
      {
        "item": "Radiere la DGPCI",
        "note": "gratuită",
        "value": "0 RON"
      },
      {
        "item": "Scoatere din evidență la Primărie",
        "note": "gratuită; trebuie achitate toate obligațiile la bugetul local",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Certificatul de distrugere, documentul-cheie</h2><p>Radierea pentru dezmembrare pornește de la un singur document esențial: <strong>certificatul de distrugere</strong>. Acesta atestă că vehiculul a fost preluat de o unitate autorizată de colectare și tratare a vehiculelor scoase din uz și că a intrat în procesul de dezmembrare. Fără el, mașina nu poate fi radiată pentru casare. Foarte important: certificatul trebuie emis de un operator autorizat pentru colectarea și tratarea vehiculelor scoase din uz (autorizație de mediu și, pentru dezmembrare, autorizație tehnică RAR) - un document venit de la o firmă neautorizată nu este recunoscut de DGPCI și blochează procedura.</p><h2>Cine sunt actorii procedurii</h2><p>Procesul implică trei instituții: <strong>operatorul de dezmembrare</strong> (de tip REMAT), care preia mașina și emite certificatul de distrugere; <strong>Primăria</strong> (Direcția de Taxe și Impozite Locale), care scoate vehiculul din evidența fiscală; și <strong>DGPCI</strong> (fostul DRPCIV), care operează radierea din circulație. La predare prezinți CIV-ul (original și copie) și actul de identitate. Plăcuțele și talonul se predau la radiere, la DGPCI, cu excepția cazului în care operatorul face radierea în numele tău. Radierea se cere în 30 de zile de la predarea mașinii; în plus, DGPCI poate radia mașina și din oficiu, la notificarea operatorului care a emis certificatul de distrugere.</p><h2>Cât costă și cât durează</h2><p>Pentru proprietar, atât certificatul de distrugere, cât și certificatul de atestare fiscală și radierea la DGPCI sunt gratuite, cu condiția să ai achitate toate obligațiile la bugetul local. Impozitul se datorează pe tot anul radierii și încetează de la 1 ianuarie a anului următor. Odată ce ai certificatul de distrugere și certificatul fiscal, dosarul de radiere la DGPCI se rezolvă de obicei în aceeași zi. Atenție: radierea trebuie cerută în 30 de zile de la predarea mașinii la dezmembrare.</p><h2>Programul Rabla și greșeli de evitat</h2><p>Dacă vrei să caseze mașina în cadrul programului Rabla gestionat de Administrația Fondului pentru Mediu, casarea la un operator autorizat și certificatul de distrugere sunt condiții obligatorii pentru a obține voucherul. Verifică pe site-ul AFM condițiile ediției curente. Cea mai frecventă greșeală rămâne alegerea unui dezmembrator neautorizat: verifică din start acreditarea, altfel rămâi cu mașina în evidență și cu impozitul curgând.</p>",
    "faq": [
      {
        "question": "Cine emite certificatul de distrugere?",
        "answer": "Un operator autorizat pentru colectarea și tratarea vehiculelor scoase din uz (autorizație de mediu; dezmembratorii au și autorizație tehnică RAR), de tip REMAT; un simplu centru de colectare îl emite în numele unității de tratare cu care are contract. Un certificat de la o firmă neautorizată nu este acceptat de DGPCI."
      },
      {
        "question": "Cât costă predarea mașinii la dezmembrare?",
        "answer": "Preluarea vehiculului scos din uz și eliberarea certificatului de distrugere sunt gratuite pentru proprietar."
      },
      {
        "question": "Trebuie să duc plăcuțele la dezmembrator?",
        "answer": "Legea cere la predare doar CIV-ul (original și copie) și actul de identitate. Plăcuțele și talonul se predau la radiere, la DGPCI; unii operatori le preiau dacă fac ei radierea în numele tău, așa că întreabă înainte."
      },
      {
        "question": "Pot casa mașina prin programul Rabla?",
        "answer": "Da, dacă îndeplinești condițiile ediției curente. Casarea la un operator autorizat și certificatul de distrugere sunt obligatorii pentru voucher - detalii pe afm.ro."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.afm.ro/",
        "label": "Administrația Fondului pentru Mediu (AFM) - Rabla ↗"
      }
    ]
  },
  {
    "slug": "radiere-auto-din-circulatie",
    "url": "/ghid-auto/radiere-auto-din-circulatie/",
    "title": "Radiere auto din circulație 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Radiere auto din circulație 2026: acte necesare, procedura în două etape (Primărie și DGPCI), costuri și termene. Ghid complet pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Radierea auto din circulație se face la cerere, la serviciul de înmatriculări DGPCI (fost DRPCIV). Mai întâi achiți toate datoriile la bugetul local și obții certificatul de atestare fiscală (gratuit, valabil 30 de zile), apoi depui dosarul de radiere, iar în 30 de zile de la radiere depui declarația de radiere la Primărie. Radierea în sine este gratuită, iar pentru dezmembrare, export sau furt cererea trebuie depusă în 30 de zile de la eveniment (radierea pentru depozitare este opțională).",
    "docs": [
      "Cererea de radiere completată",
      "Actul de identitate al proprietarului (original și copie)",
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV) – nu este cerută de Ordinul MAI 181/2024 la radiere, dar e bine s-o ai la tine",
      "Plăcuțele cu numărul de înmatriculare",
      "Certificatul de atestare fiscală de la Primărie",
      "Documentul justificativ pentru motivul radierii (certificat de distrugere, dovada scoaterii din țară/înmatriculării în alt stat, dovada depozitării, dovada declarării furtului)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Scoate vehiculul din evidența fiscală",
        "description": "Achită la Primărie (Direcția de Taxe și Impozite Locale) toate datoriile la bugetul local și obține certificatul de atestare fiscală (gratuit, valabil 30 de zile). Declarația de radiere o depui la Primărie după radiere, în 30 de zile."
      },
      {
        "num": 2,
        "title": "Pregătește documentul justificativ",
        "description": "În funcție de motiv, adaugă certificatul de distrugere (casare), dovada scoaterii din țară în vederea înmatriculării în alt stat sau dovada depozitării într-un spațiu adecvat deținut legal."
      },
      {
        "num": 3,
        "title": "Fă programarea la DGPCI",
        "description": "Rezervă online un interval pentru radiere la serviciul de înmatriculări din județul unde e înmatriculat vehiculul."
      },
      {
        "num": 4,
        "title": "Depune dosarul de radiere",
        "description": "Prezintă cererea, talonul, CIV-ul, plăcuțele, certificatul fiscal și documentul justificativ. Predai plăcuțele și talonul."
      },
      {
        "num": 5,
        "title": "Primește certificatul de radiere",
        "description": "Dacă dosarul este complet, radierea se operează, de regulă, în aceeași zi și primești confirmarea scoaterii din circulație."
      }
    ],
    "costs": [
      {
        "item": "Radiere la DGPCI",
        "note": "gratuită",
        "value": "0 RON"
      },
      {
        "item": "Scoatere din evidență la Primărie",
        "note": "gratuită; trebuie achitate toate obligațiile la bugetul local",
        "value": "0 RON"
      },
      {
        "item": "Documente auxiliare (copii, traduceri)",
        "note": "doar dacă sunt necesare",
        "value": "variabil"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă radierea din circulație</h2><p>Radierea este procedura prin care un vehicul este scos definitiv din evidența autorităților și își pierde dreptul de circulație pe drumurile publice. Nu o confunda cu simpla anulare a asigurării sau cu lăsarea mașinii în curte - atât timp cât vehiculul figurează înmatriculat, obligațiile rămân active. Radierea presupune pași la două instituții: la DGPCI, unde vehiculul este scos din circulație (cu certificatul de atestare fiscală care arată că ai achitat toate datoriile la bugetul local), și la Primărie, unde depui declarația de radiere în 30 de zile de la radiere. Impozitul se datorează pe tot anul în care ai radiat mașina și încetează de la 1 ianuarie a anului următor.</p><h2>Motivele pentru care se radiază o mașină</h2><p>Radierea se solicită, cel mai frecvent, în trei situații: <strong>casarea/dezmembrarea</strong> vehiculului (pe baza certificatului de distrugere emis de un operator autorizat), <strong>exportul</strong> sau vânzarea în afara României, <strong>furtul</strong> și <strong>depozitarea într-un spațiu adecvat deținut legal</strong> (proprietate, închiriere etc.), când nu mai vrei să circuli cu mașina. Fiecare motiv cere un document justificativ specific, care se adaugă la dosarul de bază.</p><h2>Costuri și termene</h2><p>Vestea bună este că radierea propriu-zisă este gratuită, atât la DGPCI, cât și la Primărie, cu condiția să ai achitate toate obligațiile la bugetul local (impozite, taxe, amenzi). Pot apărea costuri doar pentru documente auxiliare, precum copii sau traduceri autorizate. Pentru dezmembrare, export sau furt, cererea de radiere trebuie depusă în 30 de zile de la data dezmembrării, a scoaterii mașinii din țară, respectiv a declarării furtului. Radierea pentru depozitare nu are termen, fiind opțională.</p><h2>Sfaturi practice</h2><p>Ordinea corectă este importantă: achită mai întâi toate datoriile la Primărie și obține certificatul de atestare fiscală, mergi apoi la DGPCI, iar după radiere depune declarația de radiere la Primărie în 30 de zile. La depunere vei preda plăcuțele și certificatul de înmatriculare. În 2026 procedura a fost simplificată prin extinderea serviciilor digitale, iar depunerea se poate face pe bază de programare online. Păstrează dovada radierii - îți poate fi cerută ulterior de fisc sau de asigurator.</p>",
    "faq": [
      {
        "question": "Cât costă radierea unei mașini în 2026?",
        "answer": "Radierea este gratuită atât la DGPCI, cât și la Primărie, iar certificatul de atestare fiscală este și el gratuit prin lege. Condiția este să ai achitate toate obligațiile la bugetul local. Pot apărea costuri doar pentru copii sau traduceri."
      },
      {
        "question": "Trebuie să merg mai întâi la Primărie sau la DGPCI?",
        "answer": "Mai întâi la Primărie, pentru achitarea datoriilor și certificatul de atestare fiscală, apoi la DGPCI pentru radierea din circulație, iar în 30 de zile de la radiere din nou la Primărie, cu declarația de radiere."
      },
      {
        "question": "Ce fac cu plăcuțele la radiere?",
        "answer": "Plăcuțele cu numărul de înmatriculare se predau la depunerea dosarului de radiere, împreună cu certificatul de înmatriculare."
      },
      {
        "question": "Mai plătesc impozit după radiere?",
        "answer": "Da, pentru anul în care radiezi mașina impozitul se datorează integral; obligația încetează începând cu 1 ianuarie a anului următor radierii (Codul fiscal, art. 471). Dacă reînmatriculezi mașina în anul următor, datorezi impozit pe tot acel an."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/",
        "label": "Servicii MAI - hub programări ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "schimbare-proprietar-auto-in-familie",
    "url": "/ghid-auto/schimbare-proprietar-auto-in-familie/",
    "title": "Schimbare proprietar auto în familie 2026 – acte necesare și costuri",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Schimbare proprietar auto în familie 2026: acte necesare, pași, taxe și termenul de 90 de zile pentru transcriere între rude (donație, vânzare, moștenire).",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Trecerea mașinii pe numele unei rude se face prin transcrierea dreptului de proprietate la DGPCI, exact ca la orice vânzare. Ai nevoie de un act de înstrăinare (contract de vânzare-cumpărare, act de donație sau certificat de moștenitor), actul înregistrat la direcția de taxe locale a noului proprietar (din 2026, primăria verifică lipsa datoriilor la bugetul local atât pentru cel care cedează, cât și pentru cel care primește mașina), ITP valabil și RCA pe numele noului proprietar, în termen de 90 de zile.",
    "docs": [
      "Cerere-tip de transcriere a dreptului de proprietate",
      "Actul de identitate al noului proprietar (original și copie)",
      "Actul de înstrăinare-dobândire: contract de vânzare-cumpărare, act de donație sau certificat de moștenitor",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare vechi (talonul)",
      "Actul de înstrăinare înregistrat la Taxe și Impozite Locale de la domiciliul noului proprietar (lipsa datoriilor ambelor părți se atestă pe contractul tipizat sau prin certificat de atestare fiscală; la cererea online se încarcă certificatul de atestare fiscală)",
      "Poliță RCA valabilă pe numele noului proprietar",
      "Dovada plății contravalorii certificatului de înmatriculare (și a plăcuțelor, dacă se schimbă)",
      "Plăcuțele de înmatriculare vechi (doar dacă se schimbă numărul sau județul)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Încheiați actul de înstrăinare",
        "description": "Semnați contractul de vânzare-cumpărare, actul de donație sau, în caz de deces, obțineți certificatul de moștenitor. Pentru donație este recomandată forma autentică la notar."
      },
      {
        "num": 2,
        "title": "Obțineți certificatul de atestare fiscală",
        "description": "Din 25 februarie 2026, atât vechiul, cât și noul proprietar trebuie să nu aibă datorii la bugetul local. Pe contractul tipizat „Model 2026 ITL 054” primăria certifică acest lucru direct, fără un certificat separat; pentru donație sau alte acte se cere certificatul de atestare fiscală (gratuit, valabil 30 de zile) sau verificarea electronică."
      },
      {
        "num": 3,
        "title": "Reglați situația fiscală la primărie",
        "description": "Vechiul proprietar scoate mașina din evidența fiscală, iar noul proprietar o declară pe numele său la primăria de domiciliu în termen de 30 de zile de la dobândire."
      },
      {
        "num": 4,
        "title": "Încheiați RCA pe numele noului proprietar",
        "description": "Fără RCA valabil pe numele dobânditorului, dosarul de transcriere nu este acceptat."
      },
      {
        "num": 5,
        "title": "Faceți programare online la DGPCI",
        "description": "Programarea se face pe portalul oficial, dar depunerea dosarului se face personal la ghișeu."
      },
      {
        "num": 6,
        "title": "Depuneți dosarul și ridicați noul talon",
        "description": "Plătiți taxele, depuneți actele și primiți noul certificat de înmatriculare, de regulă în câteva zile lucrătoare."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare nou",
        "note": "verifică valoarea exactă pe site-ul oficial",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe de înmatriculare noi (opțional)",
        "note": "doar dacă schimbi numărul sau județul",
        "value": "52 RON/set"
      },
      {
        "item": "Certificat de atestare fiscală",
        "note": "gratuit prin lege din 25.02.2026 (OUG 7/2026)",
        "value": "0 RON"
      },
      {
        "item": "Act de donație la notar (opțional)",
        "note": "depinde de valoarea mașinii și onorariul notarului",
        "value": "variabil"
      }
    ],
    "proseHtml": "<h2>Transferul în familie se face tot prin transcriere</h2><p>Mulți proprietari cred că trecerea mașinii pe numele unui părinte, copil, soț/soție sau frate se face printr-o procedură simplificată. În realitate, indiferent de gradul de rudenie, este obligatorie aceeași procedură de transcriere a dreptului de proprietate ca la orice schimbare de proprietar. Diferența ține doar de tipul actului de înstrăinare pe care îl alegeți.</p><h2>Vânzare, donație sau moștenire</h2><p>Între rude, mașina poate fi transferată prin contract de vânzare-cumpărare (cea mai simplă variantă, cu formularul tipizat), prin act de donație sau, în cazul decesului proprietarului, pe baza certificatului de moștenitor eliberat de notar.</p><p>Pentru donație, Codul civil cere forma autentică (notarială), sub sancțiunea nulității absolute; doar o mașină cu o valoare de până la 25.000 lei poate fi dată ca dar manual. Ca să evitați respingerea dosarului, verificați cu notarul forma corectă. La moștenire, transcrierea se poate face după dezbaterea succesiunii, pe baza certificatului de moștenitor sau, în lipsa acestuia, a hotărârii judecătorești.</p><h2>Aspecte fiscale între rude</h2><p>Donația unui autovehicul nu generează impozit pe venit pentru dobânditor, indiferent de gradul de rudenie. La vânzarea unei mașini personale, persoana fizică nu datorează de regulă impozit pe venit. În schimb, vechiul proprietar plătește impozitul local pe tot anul transferului, iar noul proprietar declar�� mașina la primărie în 30 de zile și datorează impozit din 1 ianuarie a anului următor. Din 25 februarie 2026 (OUG 7/2026), primăria verifică pe contract că niciunul dintre ei nu are datorii la bugetul local; altfel actul este nul de drept.</p><h2>Termenul de 30 de zile și capcane frecvente</h2><p>Aveți la dispoziție 90 de zile de la data dobândirii pentru a depune dosarul de transcriere. Dacă depășiți termenul, înmatricularea se suspendă de drept până la transcriere, iar circulația cu mașina se amendează.</p><p>Cele mai frecvente motive de respingere sunt: actul de înstrăinare neînregistrat la direcția de taxe locale a noului proprietar, ITP expirat, RCA încheiat pe numele fostului proprietar și erori în contractul de înstrăinare. Numărul de înmatriculare poate fi păstrat gratuit dacă mașina rămâne în același județ.</p>",
    "faq": [
      {
        "question": "Se plătește impozit la donația mașinii între rude?",
        "answer": "Nu. Donația unui autovehicul nu generează impozit pe venit pentru cel care primește mașina. Atenție însă la formă: donația se face obligatoriu la notar (act autentic), cu excepția darului manual pentru mașini cu valoare de până la 25.000 lei."
      },
      {
        "question": "Pot păstra numărul de înmatriculare la transferul în familie?",
        "answer": "Da, dacă noul proprietar are domiciliul în același județ și fostul proprietar nu a cerut păstrarea combinației, numărul și plăcuțele trec automat și gratuit. Schimbarea plăcuțelor este opțională și presupune o taxă suplimentară."
      },
      {
        "question": "Este obligatoriu notarul pentru transferul în familie?",
        "answer": "Nu întotdeauna. Pentru un contract de vânzare-cumpărare se poate folosi formularul tipizat, fără notar. Pentru donație, forma autentică la notar este obligatorie (excepție: darul manual pentru o mașină de până la 25.000 lei), iar la moștenire este necesar certificatul de moștenitor sau hotărârea judecătorească."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Direcția Generală Permise de Conducere și Înmatriculări ↗"
      }
    ]
  },
  {
    "slug": "transcriere-drept-de-proprietate-auto",
    "url": "/ghid-auto/transcriere-drept-de-proprietate-auto/",
    "title": "Transcriere drept de proprietate auto 2026 – acte necesare și costuri",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Transcriere drept de proprietate auto 2026: acte necesare, pași la DGPCI, taxe, certificat fiscal și termenul obligatoriu de 90 de zile de la cumpărare.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Transcrierea dreptului de proprietate este procedura prin care mașina cumpărată trece pe numele tău. Se depune la DGPCI în termen de 90 de zile de la data dobândirii, cu contractul de vânzare-cumpărare înregistrat la direcția de taxe locale de la domiciliul tău, ITP valabil, RCA pe numele tău și dovada plății taxelor. Din 2026, atât vânzătorul, cât și cumpărătorul trebuie să nu aibă datorii la bugetul local (verificare făcută de primărie pe contract sau prin certificat de atestare fiscală).",
    "docs": [
      "Cerere-tip de transcriere a transmiterii dreptului de proprietate",
      "Actul de identitate al dobânditorului (original și copie)",
      "Contractul de vânzare-cumpărare (exemplarul cumpărătorului)",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare vechi (talonul)",
      "Contractul înregistrat la direcția de taxe locale a cumpărătorului (cu cartușele fiscale completate pentru vânzător și cumpărător); la transcrierea online, certificat de atestare fiscală",
      "Poliță RCA valabilă pe numele noului proprietar",
      "Dovada plății contravalorii certificatului de înmatriculare (și a plăcuțelor, dacă se schimbă)",
      "Plăcuțele de înmatriculare vechi (dacă se schimbă numărul)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Semnați contractul de vânzare-cumpărare",
        "description": "Completați corect toate exemplarele contractului. Verificați datele mașinii și ale părților, pentru că erorile duc la respingerea dosarului."
      },
      {
        "num": 2,
        "title": "Reglați situația fiscală",
        "description": "Vânzătorul scoate mașina din evidența fiscală, iar cumpărătorul o declară pe numele său la primăria de domiciliu în 30 de zile. Din 2026, primăria verifică pe contract că nici vânzătorul, nici cumpărătorul nu au datorii la bugetul local."
      },
      {
        "num": 3,
        "title": "Încheiați RCA pe numele noului proprietar",
        "description": "Polița RCA trebuie să fie valabilă și pe numele dobânditorului chiar din ziua achiziției; fără ea, transcrierea nu poate fi făcută."
      },
      {
        "num": 4,
        "title": "Faceți programare online la DGPCI",
        "description": "Rezervați o dată pe portalul oficial. În orașele mari, faceți programarea cât mai devreme după cumpărare."
      },
      {
        "num": 5,
        "title": "Plătiți taxele și depuneți dosarul",
        "description": "Achitați contravaloarea certificatului de înmatriculare (și a plăcuțelor, dacă e cazul) și depuneți personal dosarul complet la ghișeu."
      },
      {
        "num": 6,
        "title": "Ridicați noul certificat de înmatriculare",
        "description": "Cererea se soluționează în cel mult 20 de zile lucrătoare. Dacă ați cerut trimiterea talonului prin curier, primiți o dovadă înlocuitoare, valabilă până la emiterea lui, dar nu mai mult de 30 de zile."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare nou",
        "note": "verifică valoarea exactă pe site-ul oficial",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe de înmatriculare noi (dacă se schimbă)",
        "note": "opțional dacă rămâi în același județ",
        "value": "52 RON/set"
      },
      {
        "item": "Păstrarea combinației de număr",
        "note": "plătită de vânzător, dacă vrea să păstreze combinația; rezervarea unei combinații noi costă 125 RON",
        "value": "60 RON"
      },
      {
        "item": "Număr preferențial",
        "note": "opțional",
        "value": "45 RON + 52 RON plăcuțele"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă transcrierea dreptului de proprietate</h2><p>Transcrierea este procedura prin care o mașină deja înmatriculată în România trece pe numele noului proprietar, în urma vânzării, donației sau moștenirii. Nu este o reînmatriculare completă, ci actualizarea proprietarului în evidențele DGPCI. Este obligatorie și cade în sarcina cumpărătorului.</p><h2>Termenul de 90 de zile</h2><p>Ai la dispoziție 90 de zile de la data dobândirii pentru a solicita transcrierea. Dacă depășești acest termen, înmatricularea mașinii se suspendă de drept până la transcriere, iar conducerea ei cu înmatricularea suspendată se sancționează cu amendă. Pentru vânzător, transcrierea la timp este importantă pentru că, până când mașina figurează pe numele cumpărătorului, amenzile și impozitul pot rămâne pe numele său.</p><h2>Partea fiscală, adesea uitată</h2><p>Înainte de a merge la DGPCI, situația fiscală trebuie reglată la primărie. Vânzătorul scoate mașina din evidența fiscală, iar cumpărătorul o declară la direcția de taxe locale de la domiciliul său în 30 de zile de la cumpărare. Din 25 februarie 2026 (OUG 7/2026), nici vânzătorul, nici cumpărătorul nu trebuie să aibă datorii la bugetul local: pe contractul tipizat „Model 2026 ITL 054” primăria certifică acest lucru direct în cartușele dedicate, fără un certificat separat; altfel se cere certificat de atestare fiscală (gratuit, valabil 30 de zile) sau verificare electronică. Un contract încheiat fără această verificare este nul de drept. La ghișeul DGPCI contează ca contractul să fie înregistrat în evidența fiscală a cumpărătorului; pentru transcrierea online se încarcă certificatul de atestare fiscală.</p><h2>Numărul de înmatriculare și plăcuțele</h2><p>Dacă ai domiciliul în același județ cu vânzătorul și acesta nu a cerut păstrarea combinației, numărul și plăcuțele trec automat și gratuit pe numele tău. Poți opta și pentru un număr preferențial (45 lei, plus 52 lei pentru setul de plăcuțe). Reține că nu mai exist�� taxa de mediu / timbrul de mediu, deci nu plătești nicio taxă auto la transcriere în afara celor administrative.</p><h2>Cele mai frecvente motive de respingere</h2><p>Dosarele sunt respinse cel mai des din cauza contractului neînregistrat la direcția de taxe locale a cumpărătorului, a ITP-ului expirat, a RCA-ului încheiat pe numele fostului proprietar, a erorilor din contract sau a documentelor incomplete. Verifică fiecare act înainte de programare, ca să nu pierzi termenul de 90 de zile.</p>",
    "faq": [
      {
        "question": "În cât timp trebuie să transcriu mașina cumpărată?",
        "answer": "În 90 de zile de la data dobândirii. Dacă depășești termenul, înmatricularea se suspendă de drept până la transcriere, iar circulația cu mașina în această perioadă se amendează."
      },
      {
        "question": "Mai există taxă de mediu la transcriere?",
        "answer": "Nu. Taxa de mediu (timbrul de mediu) a fost eliminată, așa că la transcriere plătești doar taxele administrative pentru certificatul de înmatriculare și, opțional, pentru plăcuțe."
      },
      {
        "question": "Pot circula cu mașina înainte de transcriere?",
        "answer": "Da, în cele 90 de zile poți circula cu contractul de vânzare-cumpărare, talonul existent, ITP valabil și RCA pe numele tău. După 90 de zile fără transcriere, înmatricularea se suspendă de drept."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "Direcția Generală Permise de Conducere și Înmatriculări ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-remorca",
    "url": "/ghid-auto/inmatriculare-remorca/",
    "title": "Înmatriculare remorcă 2026 – acte necesare, taxe și procedură DGPCI",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "Înmatriculare remorcă 2026: acte necesare, taxe (CIV RAR, plăcuțe, certificat), pași la DGPCI, RCA, ITP și ce permis îți trebuie pentru a o tracta.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Pentru înmatricularea unei remorci ai nevoie de cartea de identitate a vehiculului (CIV) emisă de RAR, dovada de proprietate, RCA pe remorcă, ITP valid (pentru remorcile care au mai fost în circulație; la o remorcă nouă nu se cere la înmatriculare) și actul tău de identitate. Dosarul se depune la Serviciul Public Comunitar de Înmatriculări (SPCRPCIV/DGPCI) din județul de domiciliu. Costurile principale sunt CIV-ul de la RAR, plăcuțele și certificatul de înmatriculare, taxa auto de mediu fiind eliminată.",
    "docs": [
      "Cererea-tip de înmatriculare",
      "Actul de identitate al proprietarului (CI sau, pentru firme, certificatul de înregistrare)",
      "Cartea de identitate a vehiculului (CIV) emisă de RAR",
      "Documentul de proprietate (factură sau contract de vânzare-cumpărare), înregistrat în evidențele organului fiscal local de la domiciliu; din 04.03.2026 se verifică și certificatul de atestare fiscală (OUG 7/2026)",
      "Poliță RCA valabilă pe remorcă",
      "Certificatul de inspecție tehnică periodică (ITP) valid, pentru remorcile care au mai fost în circulație (nu se cere la o remorcă nouă)",
      "Pentru o remorcă deja înmatriculată în România pe alt proprietar: certificatul de înmatriculare anterior și plăcuța/plăcuțele emise anterior (operațiunea este transcriere, nu înmatriculare nouă); pentru o remorcă înmatriculată în alt stat: documentele de înmatriculare străine și plăcuțele",
      "Dovada plății contravalorii plăcuțelor și a certificatului de înmatriculare"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Omologarea și CIV la RAR",
        "description": "Prezinți remorca la RAR pentru omologare individuală (dacă nu are omologare CE) și pentru emiterea cărții de identitate a vehiculului. Aici se verifică frânarea, iluminarea și masele."
      },
      {
        "num": 2,
        "title": "Fă ITP-ul remorcii",
        "description": "Inspecția tehnică periodică este obligatorie pentru remorcile înmatriculate. ITP-ul valid este cerut la înmatricularea remorcilor care au mai fost în circulație; la o remorcă nouă prima inspecție periodică nu este necesară la înmatriculare."
      },
      {
        "num": 3,
        "title": "Încheie RCA pe remorcă",
        "description": "Remorca cu număr propriu de înmatriculare are nevoie de poliță RCA distinctă. O poți cumpăra online sau la broker."
      },
      {
        "num": 4,
        "title": "Înregistrează remorca la taxe locale",
        "description": "Declari remorca la direcția de taxe și impozite locale de la domiciliu: documentul de proprietate trebuie înregistrat în evidențele fiscale indiferent de masa remorcii. De la 04.03.2026 (OUG 7/2026), la înmatriculare se verifică și certificatul de atestare fiscală privind plata obligațiilor la bugetul local."
      },
      {
        "num": 5,
        "title": "Plătește taxele și depune dosarul la DGPCI",
        "description": "Achită plăcuțele și certificatul de înmatriculare (prin Ghișeul.ro, SelfPay sau transfer), apoi depui dosarul complet la SPCRPCIV din județul tău."
      },
      {
        "num": 6,
        "title": "Ridică documentele și plăcuțele",
        "description": "În 1-10 zile lucrătoare primești certificatul de înmatriculare și plăcuțele. De regulă poți lua plăcuțele imediat, iar talonul ulterior prin poștă sau de la ghișeu."
      }
    ],
    "costs": [
      {
        "item": "CIV / omologare RAR remorcă",
        "note": "Depinde de masă și de existența omologării CE; remorcile grele fără omologare europeană costă mai mult. Verifică tariful exact pe rarom.ro",
        "value": "~500 - 1.700 RON"
      },
      {
        "item": "Plăcuțe de înmatriculare",
        "note": "Verifică valoarea exactă; plăcuțe cu combinație preferată costă mai mult",
        "value": "26 RON / plăcuță (52 RON perechea)"
      },
      {
        "item": "Certificat de înmatriculare",
        "note": "Se achită separat prin Ghișeul.ro sau SelfPay",
        "value": "76 RON"
      },
      {
        "item": "ITP remorcă",
        "note": "Variază în funcție de stație și categorie",
        "value": "~150 RON"
      },
      {
        "item": "Taxă auto / timbru de mediu",
        "note": "Nu se mai percepe nicio taxă de primă înmatriculare",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Ce remorci trebuie înmatriculate</h2><p>Remorcile se clasifică după masa maximă autorizată (MMA): cele ușoare, sub 750 kg (categoria O1), și cele peste 750 kg (O2 și superioare). Practic, orice remorcă destinată circulației pe drumurile publice trebuie înmatriculată și primește propriul număr, indiferent de masă. Excepție fac unele remorci agricole sau tehnologice, care se înregistrează la primărie, nu la DGPCI.</p><h2>Rolul RAR: omologarea și cartea de identitate</h2><p>Înainte de înmatriculare, remorca trebuie să aibă carte de identitate a vehiculului (CIV) emisă de RAR. Dacă remorca are omologare de tip europeană (CE), procedura este simplă; dacă este construită artizanal sau nu are omologare, RAR face o omologare individuală, verificând sistemul de frânare (obligatoriu peste 750 kg), instalația de iluminat, dispozitivul de cuplare și masele. Fără CIV nu se poate emite certificatul de înmatriculare.</p><h2>RCA și ITP pentru remorcă</h2><p>Remorca înmatriculată, cu număr propriu, are nevoie de poliță RCA distinctă, indiferent de masă. Atenție însă: cât timp remorca este cuplată, daunele produse de ansamblu se despăgubesc din RCA-ul mașinii care o tractează; RCA-ul remorcii acoperă evenimentele produse când aceasta nu este atașată unui vehicul tractor. De asemenea, inspecția tehnică periodică (ITP) este obligatorie și pentru remorci, cu o periodicitate ce depinde de categorie și de masă. RCA-ul trebuie să fie valabil la depunerea dosarului, iar ITP-ul este cerut, după caz, pentru remorcile care au mai fost în circulație (verificarea se face informatic).</p><h2>Ce permis îți trebuie ca să o tractezi</h2><p>Categoria de permis necesară depinde de masele implicate. Cu permis categoria B poți tracta o remorcă a cărei MMA nu depășește 750 kg; peste acest prag, poți tracta tot cu permis B dacă masa maximă autorizată a ansamblului nu depășește 3.500 kg; între 3.500 și 4.250 kg ai nevoie de codul B96 (obținut după un curs de formare la o școală autorizată), iar pentru ansambluri mai grele de categoria BE (cu remorcă de cel mult 3.500 kg). Verifică întotdeauna masa maximă a ansamblului, nu doar a remorcii, pentru a nu circula ilegal. Costurile totale variază în funcție de tipul remorcii și de județ, așa că verifică tarifele actualizate pe site-urile RAR și DGPCI înainte de a începe procedura.</p>",
    "faq": [
      {
        "question": "Remorca are nevoie de RCA separat?",
        "answer": "Da. O remorcă înmatriculată cu număr propriu are nevoie de poliță RCA distinctă, indiferent de masă. Când remorca este cuplată, daunele produse în trafic se plătesc din RCA-ul mașinii care o tractează; RCA-ul remorcii acoperă situațiile în care aceasta nu este atașată unui vehicul tractor."
      },
      {
        "question": "Ce permis îmi trebuie pentru a tracta o remorcă?",
        "answer": "Cu categoria B poți tracta orice remorcă de până la 750 kg, precum și o remorcă mai grea dacă masa maximă autorizată a ansamblului nu depășește 3.500 kg. Pentru ansambluri între 3.500 și 4.250 kg ai nevoie de codul B96, iar peste 4.250 kg de categoria BE."
      },
      {
        "question": "Trebuie ITP pentru remorcă?",
        "answer": "Da, inspecția tehnică periodică este obligatorie pentru toate remorcile înmatriculate, cu o periodicitate stabilită în funcție de categorie și masă."
      },
      {
        "question": "Mai plătesc vreo taxă de înmatriculare de mediu?",
        "answer": "Nu. Taxa auto (timbrul de mediu) a fost eliminată. Plătești doar contravaloarea CIV/omologării la RAR, plăcuțele și certificatul de înmatriculare."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "RAR - Registrul Auto Român ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plata taxelor ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-scuter",
    "url": "/ghid-auto/inmatriculare-scuter/",
    "title": "Înmatriculare scuter 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare scuter 2026: unde se înregistrează mopedul, ce acte îți trebuie, taxe și procedura la Primărie sau DGPCI (fost DRPCIV).",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 2 min citire",
    "quickAnswer": "Un scuter tip moped, cu capacitate până la 50 cmc și viteză maximă de 45 km/h, se înregistrează la primăria de domiciliu (compartimentul de specialitate al primarului), nu la DGPCI. Scuterele și motocicletele peste 50 cmc sau care depășesc 45 km/h se înmatriculează ca orice vehicul, la DGPCI (fostul DRPCIV), cu ITP, RCA și, în cazul importului, omologare la RAR.",
    "docs": [
      "Actul de identitate al proprietarului (original și copie)",
      "Documentul de proprietate (factură sau contract de vânzare-cumpărare)",
      "Cartea de identitate a vehiculului (CIV) emisă/vizată de RAR",
      "Cererea de înmatriculare (completată electronic la ghișeul DGPCI) sau cererea de înregistrare a mopedului la primărie (model din anexa nr. 3 la Ordinul MAI 181/2024)",
      "Dovada asigurării RCA valabile și dovada ITP valabil (obligatorie și pentru mopedele înregistrate la primărie)",
      "Dovada plății taxelor (plăcuțe, certificat)",
      "Certificatul de atestare fiscală de la Primărie (pentru moped)",
      "Certificatul de înregistrare fiscală la Direcția de Impozite și Taxe Locale"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Stabilește categoria",
        "description": "Verifică în documentele scuterului capacitatea cilindrică și viteza maximă. Cel mult 50 cmc (sau cel mult 4 kW la motor electric) și viteză maximă constructivă de cel mult 45 km/h înseamnă moped (merge la primărie); peste aceste limite, se înmatriculează la DGPCI."
      },
      {
        "num": 2,
        "title": "Omologare RAR (dacă e din import)",
        "description": "Pentru scutere aduse din străinătate, prezintă vehiculul la RAR pentru identificare și emiterea cărții de identitate (CIV)."
      },
      {
        "num": 3,
        "title": "Declară proprietatea la fisc",
        "description": "Depune actul de proprietate la Direcția de Impozite și Taxe Locale, pentru a lua în evidență vehiculul și a-ți calcula impozitul."
      },
      {
        "num": 4,
        "title": "Încheie asigurarea RCA",
        "description": "Fără o poliță RCA valabilă nu poți circula legal și nu se finalizează înregistrarea sau înmatricularea."
      },
      {
        "num": 5,
        "title": "Depune dosarul",
        "description": "Pentru moped, depui dosarul la Primărie și primești certificatul de înregistrare și plăcuța; pentru scuter peste 50 cmc, faci programare la DGPCI."
      },
      {
        "num": 6,
        "title": "Montează plăcuțele",
        "description": "Ridici certificatul și plăcuța/plăcuțele și le montezi înainte de a circula pe drumurile publice."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare (scuter peste 50 cmc)",
        "note": "se achită pe ghiseul.ro",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe cu numere (înmatriculare DGPCI)",
        "note": "o singură plăcuță (spate), tip C",
        "value": "22 RON"
      },
      {
        "item": "Plăcuță + certificat de înregistrare moped (Primărie)",
        "note": "variază pe localitate - verifică la Primăria ta",
        "value": "cca. 40-90 RON"
      },
      {
        "item": "Omologare și CIV la RAR (import)",
        "note": "verifică tariful exact pe rarom.ro",
        "value": "de la ~150 RON"
      }
    ],
    "proseHtml": "<h2>Moped sau motocicletă? De asta depinde totul</h2><p>Cea mai importantă întrebare la înmatricularea unui scuter în 2026 este încadrarea lui legală. Un scuter considerat <strong>moped</strong> - cu o capacitate cilindrică de cel mult 50 cmc și o viteză maximă constructivă de 45 km/h - nu se înmatriculează la DGPCI (fostul DRPCIV), ci se <strong>înregistrează la Primărie</strong>, la fel ca un cvadriciclu ușor (ATV mic, categoria L6e). Trotinetele electrice nu se înmatriculează și nu se înregistrează. În schimb, orice scuter sau motocicletă cu peste 50 cmc ori care depășește 45 km/h intră în regim normal de înmatriculare, la serviciul de înmatriculări.</p><p>Confuzia este frecventă, iar o încadrare greșită te poate lăsa fără drept de circulație. Citește cu atenție rubrica din factură sau din cartea de identitate a vehiculului înainte de a depune dosarul.</p><h2>Înregistrarea unui moped la Primărie</h2><p>Pentru mopeduri, procedura este mai simplă și mai ieftină. Mai întâi declari proprietatea la Direcția de Impozite și Taxe Locale, care vizează factura sau contractul. Abia apoi depui dosarul la primărie (compartimentul de specialitate al primarului), care emite un <strong>certificat de înregistrare</strong> și o plăcuță de înregistrare. Costurile sunt stabilite local, așa că pot diferi de la un oraș la altul.</p><h2>Înmatricularea unui scuter peste 50 cmc</h2><p>Aici procedura este identică cu cea a unei mașini: ai nevoie de o programare online pe platforma DGPCI, de RCA, de ITP valabil și, dacă vehiculul este adus din import, de omologarea și cartea de identitate emise de RAR. Certificatul de înmatriculare costă 76 lei, iar plăcuța – una singură, montată în spate (tip C) – costă 22 lei.</p><h2>Capcane frecvente și sfaturi</h2><p>Pentru scuterele second-hand din străinătate, verifică din start dacă există documentul de proprietate și dovada de radiere din țara de origine - lipsa lor blochează dosarul. Nu circula niciodată cu scuterul neînregistrat: amenzile și reținerea vehiculului sunt reale. Dacă ai un scuter electric, informează-te la Primărie despre scutirile de impozit aplicabile vehiculelor electrice.</p>",
    "faq": [
      {
        "question": "Scuterul de 50 cmc trebuie înmatriculat la DGPCI?",
        "answer": "Nu. Dacă are cel mult 50 cmc și viteză maximă de 45 km/h, se încadrează la moped și se înregistrează la Primărie, nu la DGPCI."
      },
      {
        "question": "Am nevoie de permis pentru a conduce un scuter?",
        "answer": "Da. Pentru moped ai nevoie de permis categoria AM sau de permis pentru orice altă categorie (de exemplu B), care este valabil și pentru AM; pentru scutere mai puternice ai nevoie de categoria A1, A2 sau A, în funcție de cilindree și putere."
      },
      {
        "question": "Trebuie ITP pentru un moped înregistrat la Primărie?",
        "answer": "Da. Și mopedele înregistrate la primărie trebuie să aibă inspecție tehnică periodică valabilă, atât la înregistrare, cât și pentru a circula; pentru scuterele înmatriculate la DGPCI, ITP-ul este de asemenea obligatoriu, la fel ca la orice motocicletă."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI (fost DRPCIV) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro - plăți taxe ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-motocicleta",
    "url": "/ghid-auto/inmatriculare-motocicleta/",
    "title": "Înmatriculare motocicletă 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare motocicletă 2026: acte necesare, taxe DGPCI, certificat de înmatriculare 76 RON, plăcuță moto, ITP și RCA. Ghid pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Motocicleta se înmatriculează la serviciul de înmatriculări (DGPCI), cu aceleași documente ca la auto: dovada proprietății înregistrată la direcția de taxe locale de la domiciliu, CIV, act de identitate, ITP valabil, RCA și dovada plății taxelor. Certificatul de înmatriculare costă 76 RON, iar motocicleta primește o singură plăcuță (spate). Ca să conduci ai nevoie de permis categoria AM, A1, A2 sau A, în funcție de cilindree și putere.",
    "docs": [
      "Cererea de înmatriculare completată",
      "Dovada dreptului de proprietate (factură, contract sau certificat de moștenitor), înregistrată în evidențele direcției de taxe locale de la domiciliu",
      "Actul de identitate al proprietarului (original și copie)",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare vechi și plăcuța veche, dacă numărul nu se transferă automat (la second-hand din România), sau documentele de înmatriculare și plăcuța din străinătate (la import)",
      "Dovada ITP valabil pentru motocicletă",
      "Asigurare RCA valabilă",
      "Dovada plății certificatului de înmatriculare și a plăcuței"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică actele și starea motocicletei",
        "description": "Confruntă seria de șasiu cu CIV-ul, verifică talonul, ITP-ul valabil și, la second-hand, cere certificatul de atestare fiscală al vânzătorului (obligatoriu la vânzare) și asigură-te că ai și tu achitate obligațiile la bugetul local (din martie 2026 se cere și cumpărătorului)."
      },
      {
        "num": 2,
        "title": "Fă ITP-ul și RCA",
        "description": "Motocicleta trebuie să aibă inspecția tehnică periodică valabilă și asigurare RCA încheiată pe numele noului proprietar."
      },
      {
        "num": 3,
        "title": "Achită taxele",
        "description": "Plătește certificatul de înmatriculare (76 RON) și plăcuța (22 RON) prin Ghișeul.ro, internet banking la Trezorerie sau la stațiile SelfPay."
      },
      {
        "num": 4,
        "title": "Programează-te online",
        "description": "Fă o programare la serviciul de înmatriculări (DGPCI), deoarece dosarele se depun pe bază de programare."
      },
      {
        "num": 5,
        "title": "Depune dosarul și ridică plăcuța",
        "description": "Depui dosarul complet, iar după validare primești certificatul de înmatriculare și plăcuța de spate."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare (talon)",
        "note": "tarif în vigoare din 15.09.2026, identic cu cel auto",
        "value": "76 RON"
      },
      {
        "item": "Plăcuță de înmatriculare moto",
        "note": "o singură plăcuță (spate); verifică tariful la ghișeu",
        "value": "22 lei"
      },
      {
        "item": "ITP motocicletă",
        "note": "variază în funcție de stație",
        "value": "aprox. 50-120 RON"
      }
    ],
    "proseHtml": "<h2>Ce diferă față de înmatricularea unui autoturism</h2><p>În esență, procedura de înmatriculare a unei motociclete este aceeași ca la un autoturism: dosarul se depune la serviciul de înmatriculări (DGPCI), pe bază de programare, cu aceleași categorii de documente. Există însă câteva particularități. Motocicleta primește o singură plăcuță de înmatriculare, montată la spate, iar dimensiunea și tariful acesteia diferă de plăcuțele auto.</p><p>Ca și în cazul mașinilor, sursa vehiculului contează: o motocicletă second-hand din România se transcrie, una din UE necesită certificat de conformitate și CIV de la RAR, iar una din afara UE trebuie vămuită și omologată.</p><h2>Permisul de care ai nevoie</h2><p>Înmatricularea nu este condiționată de deținerea permisului, dar pentru a circula ai nevoie de categoria corespunzătoare: AM pentru mopede (până la 50 cmc, 45 km/h), A1 pentru motociclete de până la 125 cmc și 11 kW, A2 pentru cele de până la 35 kW, respectiv A fără restricție de putere. Alege motocicleta în funcție de permisul pe care îl deții, ca să o poți folosi legal.</p><h2>ITP și RCA</h2><p>Motocicleta trebuie să aibă ITP valabil și RCA încheiat pe numele proprietarului. La achiziția unei motociclete second-hand deja înmatriculate în România nu se mai cere niciun certificat RAR la transcriere. Verifică din timp valabilitatea acestor documente, pentru că un ITP expirat sau lipsa RCA blochează depunerea dosarului.</p><h2>Capcane frecvente și termenul legal</h2><p>Înainte de a plăti pentru o motocicletă, cere seria de șasiu, CIV-ul, certificatul de înmatriculare, contractul completat corect și dovada că vânzătorul poate radia motocicleta din evidența fiscală. Cea mai frecventă greșeală este achiziția fără verificarea prealabilă a actelor, care poate genera complicații costisitoare. Reține că, la fel ca la auto, ai un termen legal de 90 de zile pentru transcriere, iar depășirea lui atrage suspendarea înmatriculării.</p>",
    "faq": [
      {
        "question": "Motocicleta are una sau două plăcuțe?",
        "answer": "O singură plăcuță, montată la spate. Tariful este de regulă mai mic decât la o pereche de plăcuțe auto."
      },
      {
        "question": "Am nevoie de permis ca să înmatriculez o motocicletă?",
        "answer": "Nu pentru înmatricularea în sine, dar pentru a o conduce legal ai nevoie de permis categoria AM, A1, A2 sau A, în funcție de cilindree și putere."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/faq/taxe",
        "label": "DGPCI – Taxe (contravaloare certificat și plăcuțe; plăcuță moto tip C 22 lei) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/documents-and-forms/inmatriculari",
        "label": "DGPCI – Documente și formulare (înmatriculări) ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-auto-second-hand-romania",
    "url": "/ghid-auto/inmatriculare-auto-second-hand-romania/",
    "title": "Înmatriculare auto second hand România 2026 – acte necesare și costuri",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare auto second hand România 2026: acte necesare pentru transcriere, taxe DGPCI și termenul legal de 90 de zile.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru o mașină second hand cumpărată din România faci transcrierea (schimbarea proprietarului) la serviciul de înmatriculări (DGPCI). Ai nevoie de contractul de vânzare-cumpărare înregistrat la direcția de taxe locale de la domiciliul tău, CIV, talonul vechi (și plăcuțele, dacă numărul nu trece automat pe numele tău), certificatele de atestare fiscală (al vânzătorului și, din martie 2026, al tău), RCA pe numele tău și ITP valabil. Taxa pentru noul certificat de înmatriculare este 76 RON, iar termenul legal de transcriere este 90 de zile.",
    "docs": [
      "Cererea de înmatriculare/transcriere completată",
      "Contractul de vânzare-cumpărare (mai multe exemplare), înregistrat în evidențele direcției de taxe locale de la domiciliul cumpărătorului",
      "Certificatul de înmatriculare vechi, cu mențiunile vânzătorului pe verso",
      "Cartea de identitate a vehiculului (CIV)",
      "Actul de identitate al noului proprietar (original și copie)",
      "Certificatul de atestare fiscală al vânzătorului și, din martie 2026, al cumpărătorului (se prezintă la direcția de taxe locale; la ghișeul DGPCI nu se mai depun separat dacă contractul e înregistrat fiscal, dar sunt obligatorii pentru transcrierea cerută online)",
      "Asigurare RCA valabilă pe numele noului proprietar",
      "Dovada ITP valabil, dovezile de plată a taxelor și plăcuțele vechi, dacă numărul nu se transferă automat noului proprietar"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică istoricul și actele mașinii",
        "description": "Confruntă seria de șasiu, verifică ITP-ul și existența CIV-ului."
      },
      {
        "num": 2,
        "title": "Obțineți certificatele fiscale, semnați contractul și înregistrați-l la taxe locale",
        "description": "Înainte de semnare, vânzătorul obține de la direcția de taxe locale certificatul de atestare fiscală (după ce a achitat toate datoriile, inclusiv impozitul pe mașină pentru anul vânzării), iar din martie 2026 și cumpărătorul trebuie să nu aibă datorii la bugetul local. Apoi completați contractul pe modelul oficial și îl înregistrați la direcția de taxe locale de la domiciliul cumpărătorului."
      },
      {
        "num": 3,
        "title": "Fă RCA pe numele tău",
        "description": "Asigurarea RCA a fostului proprietar nu te acoperă; trebuie încheiată una nouă pe numele cumpărătorului înainte de a circula."
      },
      {
        "num": 4,
        "title": "Plătește taxele de înmatriculare",
        "description": "Achită certificatul de înmatriculare (76 RON) și, dacă schimbi numărul, plăcuțele, prin Ghișeul.ro, internet banking sau SelfPay."
      },
      {
        "num": 5,
        "title": "Depune dosarul la DGPCI",
        "description": "Pe bază de programare online, depui dosarul complet și primești noul talon pe numele tău, plus plăcuțele dacă e cazul."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare (talon)",
        "note": "tarif în vigoare din 15.09.2026 (anterior 49 RON)",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe standard",
        "note": "doar dacă se atribuie un număr nou (alt județ sau vânzătorul păstrează numărul)",
        "value": "52 RON"
      },
      {
        "item": "Plăcuțe preferențiale",
        "note": "opțional",
        "value": "97 RON (52 RON plăcuțe + 45 RON tarif de atribuire)"
      },
      {
        "item": "Certificat de atestare fiscală",
        "note": "gratuit dacă nu există datorii la bugetul local",
        "value": "0 RON"
      }
    ],
    "proseHtml": "<h2>Transcriere, nu prima înmatriculare</h2><p>Când cumperi o mașină deja înmatriculată în România, nu faci o primă înmatriculare, ci o transcriere - adică o schimbare de proprietar. Vehiculul are deja carte de identitate (CIV) și certificat de înmatriculare, iar tu doar treci proprietatea pe numele tău. Procedura este mai simplă și mai ieftină decât un import, pentru că nu implică RAR pentru omologare.</p><h2>Atenție la asigurare și la datorii</h2><p>O capcană frecventă este circulația cu vechea asigurare: RCA-ul fostului proprietar NU te acoperă după cumpărare. Trebuie să închei o poliță nouă pe numele tău încă din prima zi. De asemenea, cere certificatul de atestare fiscală al vânzătorului, care atestă că a achitat toate obligațiile la bugetul local, inclusiv impozitul pe mașină pentru tot anul vânzării; fără el, contractul de vânzare este nul de drept. Din 2026, certificatul fiscal se cere și pentru cumpărător, așa că asigură-te că nu ai tu însuți datorii la bugetul local.</p><h2>Termenul legal și consecințe</h2><p>Ai la dispoziție 90 de zile de la data contractului pentru a finaliza transcrierea, conform OUG 195/2002. Dacă depășești termenul, înmatricularea se suspendă de drept, iar dacă circuli cu mașina neînscrisă pe numele tău riști amenzi consistente și reținerea certificatului de înmatriculare. Recomandarea practică este să nu amâni: certificatul fiscal are valabilitate limitată, deci finalizează dosarul cât mai repede.</p>",
    "faq": [
      {
        "question": "Cât timp am la dispoziție să transcriu mașina?",
        "answer": "90 de zile de la data dobândirii, conform OUG 195/2002. După acest termen, înmatricularea se suspendă de drept."
      },
      {
        "question": "Pot circula cu RCA-ul fostului proprietar?",
        "answer": "Nu. Trebuie să închei o asigurare RCA nouă pe numele tău înainte de a circula cu mașina cumpărată."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.ghiseul.ro/",
        "label": "Ghișeul.ro (plată taxe) ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-auto-din-afara-ue",
    "url": "/ghid-auto/inmatriculare-auto-din-afara-ue/",
    "title": "Înmatriculare auto din afara UE 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare auto din afara UE 2026: taxe vamale, TVA 21%, declarație vamală, omologare RAR și acte necesare pentru mașini din SUA, UK sau Japonia.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru o mașină din afara UE trebuie mai întâi să o vămuiești, plătind taxe vamale (aprox. 10% pentru autoturisme) și TVA de 21%, apoi să obții declarația vamală de import. Urmează omologarea și cartea de identitate a vehiculului (CIV) la RAR, adesea prin omologare individuală, iar la final depui dosarul la serviciul de înmatriculări. Mașinile cu volan pe dreapta din afara UE nu se mai pot înmatricula fără modificarea postului de conducere.",
    "docs": [
      "Documentul de înmatriculare/titlul de proprietate din țara de origine (original) și plăcuțele cu numărul de înmatriculare străin, dacă vehiculul a fost înmatriculat",
      "Factura de cumpărare (original), înregistrată în evidențele direcției de taxe locale de la domiciliu (din martie 2026, cu obligațiile la bugetul local achitate – certificat de atestare fiscală sau verificare electronică)",
      "Documentul de transport (CMR sau Bill of Lading)",
      "Declarația vamală de import (dovada vămuirii)",
      "Cartea de identitate a vehiculului (CIV) eliberată de RAR",
      "Certificatul de autenticitate RAR",
      "Dovada ITP valabil",
      "Asigurare RCA valabilă",
      "Dovada plății certificatului de înmatriculare și a plăcuțelor",
      "Actul de identitate al solicitantului"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Vămuiește vehiculul",
        "description": "La intrarea în UE prin România, prezinți la vamă factura, titlul de proprietate, documentul de transport și actul de identitate, apoi achiți taxele vamale și TVA."
      },
      {
        "num": 2,
        "title": "Obține declarația vamală de import",
        "description": "Este dovada că vehiculul a fost pus în liberă circulație în UE și este obligatorie la înmatriculare."
      },
      {
        "num": 3,
        "title": "Programează-te la RAR pentru omologare",
        "description": "RAR verifică conformitatea tehnică. Pentru mașini din SUA, UK sau Japonia este adesea necesară omologarea individuală, cu eventuale modificări la faruri și semnalizare."
      },
      {
        "num": 4,
        "title": "Obține CIV și certificatul de autenticitate",
        "description": "După verificări, RAR emite cartea de identitate a vehiculului și certificatul de autenticitate, valabil pentru o singură înmatriculare."
      },
      {
        "num": 5,
        "title": "Depune dosarul la serviciul de înmatriculări",
        "description": "Înregistrezi factura la direcția de taxe locale de la domiciliu, apoi, cu ITP, RCA, dovezile de plată și programare online, depui dosarul complet la DGPCI; primești numerele, iar talonul se eliberează în cel mult 20 de zile lucrătoare (în multe județe se trimite prin poștă)."
      }
    ],
    "costs": [
      {
        "item": "Taxe vamale (autoturisme)",
        "note": "procentul poate diferi în funcție de tipul vehiculului; verifică la vamă/ANAF",
        "value": "aprox. 10% din valoarea în vamă"
      },
      {
        "item": "TVA",
        "note": "aplicat la valoarea în vamă plus taxele vamale (cotă standard din august 2025)",
        "value": "21%"
      },
      {
        "item": "Taxe RAR (omologare, CIV, verificări)",
        "note": "cresc mult la omologare individuală; verifică pe rarom.ro",
        "value": "aprox. 500-800 RON"
      },
      {
        "item": "Certificat de înmatriculare",
        "note": "la depunerea dosarului",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe de înmatriculare",
        "note": "standard sau preferențiale",
        "value": "52 RON (standard) / 97 RON (număr preferențial: 45 RON + 52 RON plăcuțe)"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă import din afara UE</h2><p>Spre deosebire de o mașină adusă dintr-un stat membru UE, un vehicul provenit dintr-o țară din afara Uniunii (SUA, Marea Britanie post-Brexit, Japonia, Elveția în anumite cazuri) trebuie mai întâi vămuit. Vămuirea presupune plata de taxe vamale și TVA, iar fără declarația vamală de import mașina nu poate fi înmatriculată.</p><p>Ordinea corectă este întotdeauna: vamă, apoi RAR, apoi înregistrarea mașinii la direcția de taxe locale de la domiciliu, apoi serviciul de înmatriculări. Sărirea peste etapa vamală face dosarul incomplet și blochează întreaga procedură.</p><h2>Taxe vamale și TVA</h2><p>Pentru autoturisme, taxa vamală este de regulă aproximativ 10% din valoarea în vamă (prețul mașinii plus transport și asigurare), iar TVA de 21% se aplică la suma dintre valoarea în vamă și taxa vamală. La un vehicul de 20.000 de euro, taxele cumulate pot depăși ușor 5.000 de euro, motiv pentru care importul din afara UE este considerabil mai scump decât cel din UE. Accizele nu se aplică, de regulă, autoturismelor obișnuite, dar verifică situația pentru cazuri speciale.</p><h2>Omologarea la RAR</h2><p>Vehiculele din afara UE nu au omologare europeană de tip, așa că RAR verifică individual dacă respectă normele tehnice și de poluare europene. Pentru mașinile din SUA, procedura este mai complexă și mai scumpă, pentru că farurile și semnalizarea trebuie adaptate la standardele europene (fascicul asimetric orientat spre dreapta). Această omologare individuală poate dura și poate presupune modificări la vehicul.</p><h2>Restricția pentru volanul pe dreapta</h2><p>Din 1 ianuarie 2021, mașinile cu volanul pe dreapta importate din afara UE nu mai pot fi înmatriculate în România decât după mutarea postului de conducere pe stânga, la un atelier autorizat. Excepție fac vehiculele care au fost înmatriculate definitiv într-un stat membru UE înainte de această dată. Înainte să cumperi o mașină din UK, verifică atent acest aspect, pentru că modificarea este costisitoare și nu întotdeauna fezabilă.</p>",
    "faq": [
      {
        "question": "Ce taxe plătesc pentru o mașină din SUA?",
        "answer": "Taxă vamală de aproximativ 10% din valoarea în vamă și TVA de 21% aplicat la valoarea în vamă plus taxa vamală, la care se adaugă taxele RAR și de înmatriculare."
      },
      {
        "question": "Pot înmatricula o mașină cu volan pe dreapta din UK?",
        "answer": "Doar dacă a fost înmatriculată definitiv într-un stat UE înainte de 1 ianuarie 2021 sau dacă muți postul de conducere pe stânga la un atelier autorizat."
      },
      {
        "question": "De ce este importul non-UE mai scump?",
        "answer": "Pentru că, spre deosebire de importul din UE, se adaugă taxele vamale, TVA la vămuire și, adesea, o omologare individuală mai complexă la RAR."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.anaf.ro/",
        "label": "ANAF (TVA și fiscalitate; vămuirea este gestionată de Autoritatea Vamală Română) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-auto-din-ue",
    "url": "/ghid-auto/inmatriculare-auto-din-ue/",
    "title": "Înmatriculare auto din UE 2026 – acte necesare, costuri și procedură",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare auto din UE 2026: acte necesare, certificat de conformitate (CoC), CIV la RAR, declarația ANAF pentru TVA și costuri la DGPCI.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "O mașină adusă din UE nu se vămuiește, dar necesită certificatul de conformitate (CoC), cartea de identitate a vehiculului (CIV) și certificatul de autenticitate de la RAR, plus o declarație la ANAF pentru achiziția intracomunitară. TVA se datorează în România doar pentru vehiculele considerate noi; pentru cele rulate nu se plătește TVA la înmatriculare. Dosarul final se depune la serviciul de înmatriculări (DGPCI).",
    "docs": [
      "Documentul de înmatriculare din țara de origine (original) și plăcuțele cu numărul de înmatriculare străin",
      "Certificatul de conformitate (CoC) sau, în lipsă, omologare la RAR",
      "Contractul de achiziție/factura intracomunitară, înregistrate în evidențele direcției de taxe locale de la domiciliu (din martie 2026, cu obligațiile la bugetul local achitate – certificat de atestare fiscală sau verificare electronică)",
      "Cartea de identitate a vehiculului (CIV) eliberată de RAR",
      "Certificatul de autenticitate RAR",
      "Documentul ANAF privind situația TVA pentru achiziția intracomunitară",
      "Dovada ITP valabil",
      "Asigurare RCA valabilă",
      "Dovada plății certificatului de înmatriculare și a plăcuțelor",
      "Actul de identitate al solicitantului"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Obține certificatul de conformitate (CoC)",
        "description": "Îl ceri de la producător/dealer. Dacă mașina are omologare UE și CoC, procedura la RAR este mult mai rapidă."
      },
      {
        "num": 2,
        "title": "Rezolvă situația TVA la ANAF",
        "description": "Depui o declarație de achiziție intracomunitară. Pentru mașini rulate (peste 6 luni și peste 6.000 km) nu datorezi TVA, dar ai nevoie de dovada eliberată de ANAF."
      },
      {
        "num": 3,
        "title": "Programează-te la RAR",
        "description": "RAR verifică vehiculul și, pe baza CoC, emite cartea de identitate a vehiculului (CIV) și certificatul de autenticitate."
      },
      {
        "num": 4,
        "title": "Fă ITP-ul și RCA",
        "description": "Treci inspecția tehnică periodică în România și încheie asigurarea RCA pe numele tău."
      },
      {
        "num": 5,
        "title": "Depune dosarul la DGPCI",
        "description": "Înainte de programare, înregistrează contractul/factura la direcția de taxe și impozite locale de la domiciliu. Apoi, cu programare online, depui dosarul complet (inclusiv documentul de înmatriculare și plăcuțele străine) și dovezile de plată; primești plăcuțele, iar certificatul de înmatriculare se eliberează în cel mult 20 de zile lucrătoare (în multe județe se trimite prin poștă)."
      }
    ],
    "costs": [
      {
        "item": "Certificat de conformitate (CoC)",
        "note": "tarif variabil în funcție de producător; se plătește către marcă/dealer",
        "value": "aprox. 50-250 EUR"
      },
      {
        "item": "Taxe RAR (CIV, certificat autenticitate)",
        "note": "cresc dacă este nevoie de omologare individuală; verifică pe rarom.ro",
        "value": "aprox. 400-700 RON"
      },
      {
        "item": "Certificat de înmatriculare",
        "note": "tarif în vigoare din 15.09.2026 (anterior 49 RON)",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe de înmatriculare",
        "note": "standard sau preferențiale",
        "value": "52 RON (standard) / 97 RON (număr preferențial: 45 RON + 52 RON plăcuțe)"
      },
      {
        "item": "TVA",
        "note": "0 pentru mașini rulate; 21% doar pentru vehicule considerate noi fiscal",
        "value": "0 sau 21%"
      }
    ],
    "proseHtml": "<h2>De ce importul din UE este mai simplu</h2><p>Pentru că România și țara de origine fac parte din piața unică europeană, o mașină adusă dintr-un stat membru UE nu trebuie vămuită și nu se plătesc taxe vamale. Aceasta reduce semnificativ costurile și timpul față de un import din afara UE. Marea majoritate a mașinilor second-hand aduse în România provin din Germania, Franța, Italia sau Belgia tocmai din acest motiv.</p><h2>Certificatul de conformitate (CoC)</h2><p>Cel mai important document este certificatul de conformitate, cunoscut ca CoC (Certificate of Conformity). El atestă că vehiculul are omologare europeană de tip și respectă normele tehnice și de emisii. Cu un CoC valid, RAR eliberează rapid cartea de identitate a vehiculului. Pentru mașini foarte vechi (pre-2000) sau modificate, CoC-ul poate lipsi din arhiva producătorului, caz în care este necesară o omologare individuală la RAR, un proces mai lung și mai costisitor.</p><h2>TVA și declarația la ANAF</h2><p>Un aspect esențial ține de TVA. În scop fiscal, un vehicul este considerat nou dacă are sub 6 luni de la prima înmatriculare sau sub 6.000 km rulați; în acest caz se datorează TVA de 21% în România. Pentru mașinile rulate (peste ambele praguri) nu se plătește TVA la înmatriculare. Chiar și așa, la ANAF se depune o declarație privind achiziția intracomunitară, iar dovada eliberată intră în dosarul de înmatriculare.</p><h2>Ordinea pașilor și termenul legal</h2><p>Ordinea corectă este: mai întâi RAR (pentru CIV și certificatul de autenticitate), apoi ITP și RCA, înregistrarea mașinii la direcția de taxe locale de la domiciliu (contractul/factura, cu obligațiile la bugetul local achitate), iar la final serviciul de înmatriculări. Ai grijă să respecți termenul legal de înmatriculare pentru a evita amenzile. Un sfat practic: cere CoC-ul de la vânzător înainte de a cumpăra mașina, pentru că obținerea lui ulterioară, de la producător, poate dura săptămâni și costa sensibil mai mult.</p>",
    "faq": [
      {
        "question": "Plătesc TVA pentru o mașină second-hand din Germania?",
        "answer": "Nu, dacă vehiculul este rulat (peste 6 luni și peste 6.000 km). TVA de 21% se datorează doar pentru mașinile considerate noi din punct de vedere fiscal."
      },
      {
        "question": "Ce fac dacă mașina nu are certificat de conformitate?",
        "answer": "Poți solicita CoC de la producător sau, în lipsa lui, treci printr-o omologare individuală la RAR, procedură mai lungă și mai scumpă."
      },
      {
        "question": "Trebuie să vămuiesc o mașină din UE?",
        "answer": "Nu. Pentru vehiculele din statele membre UE nu se face vămuire și nu se plătesc taxe vamale, fiind vorba de o achiziție intracomunitară."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "Registrul Auto Român (RAR) ↗"
      },
      {
        "url": "https://www.anaf.ro/",
        "label": "ANAF ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI ↗"
      }
    ]
  },
  {
    "slug": "program-rabla-inscriere-acte-2026",
    "url": "/ghid-auto/program-rabla-inscriere-acte-2026/",
    "title": "Program Rabla 2026 – înscriere, acte necesare și procedură completă",
    "category": {
      "slug": "impozite-taxe-auto",
      "name": "Impozite & Taxe auto",
      "color": "#ca8a04",
      "icon": "💰"
    },
    "metaDescription": "Program Rabla 2026: cum te înscrii, ce voucher primești, actele necesare și pașii pentru casare și mașină nouă. Ghid complet.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Programul Rabla 2026 oferă un ecotichet pentru casarea mașinii vechi și achiziția uneia noi, mai puțin poluante. Te înscrii singur, online, în aplicația AFM (inscrierionline.afm.ro); sesiunea pentru persoane fizice a început la 20 iulie 2026 și e deschisă până la 31 decembrie 2026 sau până la epuizarea bugetului. În 10 zile de la înscriere completezi seria de șasiu a mașinii vechi, încarci documentele și alegi un producător/dealer validat. Valoarea ecotichetului (10.000–18.500 lei, în funcție de tipul mașinii noi) se scade din prețul mașinii noi, iar mașina veche se predă la casare.",
    "docs": [
      "Actul de identitate al proprietarului",
      "Certificatul de înmatriculare al mașinii vechi",
      "Cartea de identitate a vehiculului vechi",
      "Certificatul de distrugere de la colectorul autorizat",
      "Certificatul de radiere din circulație"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege un dealer validat",
        "description": "Programul este administrat de AFM: persoana fizică se înscrie online, apoi alege unul dintre producătorii/dealerii validați de AFM, de la care cumpără mașina nouă."
      },
      {
        "num": 2,
        "title": "Rezervă ecotichetul",
        "description": "Te înscrii online în aplicația AFM (inscrierionline.afm.ro); aplicația îți rezervă automat valoarea ecotichetului. În 10 zile completezi seria de șasiu a mașinii vechi, încarci documentele cerute de Ghidul de finanțare și selectezi un producător validat."
      },
      {
        "num": 3,
        "title": "Casează mașina veche",
        "description": "Predă mașina la un colector autorizat și obține certificatul de distrugere."
      },
      {
        "num": 4,
        "title": "Radiază mașina veche",
        "description": "Cu certificatul de distrugere, radiază vehiculul din circulație la DGPCI."
      },
      {
        "num": 5,
        "title": "Cumpără mașina nouă",
        "description": "Prima de casare se scade din prețul mașinii noi, la momentul achiziției."
      }
    ],
    "costs": [
      {
        "item": "Prima de casare Rabla Clasic",
        "note": "Se scade din prețul mașinii noi",
        "value": "10.000 lei (mașină termică/GPL/GNC sau motocicletă); 12.000 lei pentru hibrid; 15.000 lei pentru plug-in hibrid"
      },
      {
        "item": "Ecobonus mașină electrică",
        "note": "Rabla Auto 2026 – 18.500 lei pentru mașină 100% electrică sau cu hidrogen",
        "value": "până la 18.500 lei"
      }
    ],
    "proseHtml": "<h2>Ce ecotichete oferă Rabla Auto 2026</h2><p>În 2026, persoanele fizice au un singur program, Rabla Auto, cu ecotichete diferențiate după tipul mașinii noi: 18.500 lei pentru mașini 100% electrice sau cu hidrogen, 15.000 lei pentru plug-in hibrid sau motocicletă electrică, 12.000 lei pentru hibrid și 10.000 lei pentru mașini termice (inclusiv GPL/GNC) sau motociclete. Mașinile diesel nu sunt finanțate. Sesiunea a început la 20 iulie 2026, cu un buget de 300 de milioane de lei, și rămâne deschisă până la 31 decembrie 2026 sau până la epuizarea fondurilor (sumele rămase au fost redistribuite din 25 august 2026).</p><h2>Cine poate participa</h2><p>Sesiunea Rabla Auto 2026 descrisă aici este destinată persoanelor fizice, care se înscriu online pe site-ul AFM. Condițiile exacte de eligibilitate (inclusiv pentru mașina veche care se casează) și documentele necesare sunt stabilite în Ghidul de finanțare publicat pe afm.ro.</p>",
    "faq": [
      {
        "question": "Cât este prima de casare în 2026?",
        "answer": "În Rabla Auto 2026 pentru persoane fizice, ecotichetul este de 10.000 lei pentru mașini termice (inclusiv GPL/GNC) sau motociclete, 12.000 lei pentru hibride, 15.000 lei pentru plug-in hibride sau motociclete electrice și 18.500 lei pentru mașini 100% electrice sau cu hidrogen. Mașinile diesel nu sunt finanțate."
      },
      {
        "question": "Pot lua mașina veche înapoi după înscriere?",
        "answer": "Nu. După predarea la colectorul autorizat și emiterea certificatului de distrugere, mașina este casată definitiv."
      }
    ],
    "officialLinks": [
      {
        "url": "https://www.afm.ro/media_comunicat_presa-2026_07_07.php",
        "label": "Ecobonus si prima de casare Rabla 2026 (10.000 lei termic / 18.500 lei electric) — Ghidul de finantare, Ministerul Mediului ↗"
      },
      {
        "url": "https://www.afm.ro/",
        "label": "AFM – Administrația Fondului pentru Mediu ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Directia Generala Permise de Conducere si Inmatriculari ↗"
      }
    ]
  },
  {
    "slug": "autorizatie-transport-persoane-uber-2026",
    "url": "/ghid-auto/autorizatie-transport-persoane-uber-2026/",
    "title": "Autorizație transport persoane Uber 2026 – acte necesare, atestat și procedură",
    "category": {
      "slug": "transport-autorizatii",
      "name": "Transport & Autorizații",
      "color": "#dc2626",
      "icon": "🚕"
    },
    "metaDescription": "Autorizație Uber 2026: certificat de atestare ARR, autorizație și copie conformă, acte necesare, condiții pentru șofer și mașină și pașii pentru transportul alternativ. Ghid complet.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru a conduce pe Uber trebuie să ai cel puțin 21 de ani, permis categoria B mai vechi de 2 ani, certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere (eliberat de ARR), cazier judiciar fără condamnările prevăzute de lege și aviz medical și psihologic. Operatorul (PFA/SRL sau flota) are nevoie de autorizație de transport alternativ, iar fiecare mașină de copie conformă și ecusoane; mașina trebuie să aibă sub 15 ani vechime la data expirării copiei conforme.",
    "docs": [
      "Permis de conducere categoria B (vechime minimă 2 ani)",
      "Certificat de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere, eliberat de ARR (nu există un „atestat de transport alternativ” separat)",
      "Cazier judiciar",
      "Aviz medical și aviz psihologic",
      "Copie conformă a autorizației pentru transport alternativ",
      "Asigurare RCA și asigurare pentru persoane și bunurile acestora (obligatorie la bord); CASCO este opțional"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Verifică cerințele pentru șofer",
        "description": "Trebuie să ai cel puțin 21 de ani, permis categoria B mai vechi de 2 ani, cazier judiciar fără condamnările prevăzute de lege și aviz medical și psihologic."
      },
      {
        "num": 2,
        "title": "Obține atestatul de la ARR",
        "description": "Urmează cursul și susține testul la ARR pentru certificatul de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere (valabil și pentru transportul alternativ)."
      },
      {
        "num": 3,
        "title": "Obține autorizația de operator și copia conformă pentru vehicul",
        "description": "Operatorul (PFA/SRL propriu sau flota) obține de la ARR autorizația de transport alternativ (300 lei, 3 ani), apoi copia conformă pentru mașină (100 lei/an) și ecusoanele. Mașina trebuie să aibă sub 15 ani vechime la data expirării copiei conforme, maximum 9 locuri și ITP făcut la fiecare 6 luni."
      },
      {
        "num": 4,
        "title": "Înscrie-te pe platformă",
        "description": "Încarcă documentele în aplicația Uber pentru validare și începe să primești curse."
      }
    ],
    "costs": [
      {
        "item": "Atestat transport alternativ ARR",
        "note": "Curs + examen",
        "value": "~450 RON"
      },
      {
        "item": "Aviz medical + psihologic",
        "note": "",
        "value": "150 – 250 RON"
      },
      {
        "item": "Copie conformă autorizație",
        "note": "",
        "value": "100 RON pe an (pentru 1, 2 sau 3 ani)"
      }
    ],
    "proseHtml": "<h2>Cadrul legal pentru transportul alternativ</h2><p>Transportul prin platforme precum Uber și Bolt este reglementat ca „transport alternativ” prin OUG 49/2019 și necesită autorizație de transport alternativ de la ARR pentru operator, copie conformă și ecusoane pentru fiecare mașină și certificat de atestare profesională pentru șofer; spre deosebire de taxi, autorizarea nu se face la primărie.</p><h2>Condiții pentru mașină</h2><p><a href=\"https://legislatie.just.ro/Public/DetaliiDocument/215598\" target=\"_blank\" rel=\"noopener\">OUG 49/2019</a> impune o limită de vechime: copia conformă se eliberează (art. 13 alin. (5)) doar pentru autoturismele care au, la data expirării copiei, mai puțin de 15 ani de la fabricație. Legea cere ca vehiculul să aibă maximum 9 locuri (inclusiv locul conducătorului auto), inspecția tehnică periodică (ITP) realizată la fiecare 6 luni, să corespundă la momentul cursei normelor tehnice privind siguranța circulației rutiere, protecția mediului și utilizarea conform destinației și să dețină copia conformă a autorizației de transport alternativ. Pe lângă limita legală de sub 15 ani, platformele pot impune cerințe comerciale proprii (de exemplu pentru anumite categorii de servicii).</p>",
    "faq": [
      {
        "question": "Ce atestat îmi trebuie pentru Uber?",
        "answer": "Ai nevoie de certificatul de atestare a pregătirii profesionale pentru transportul de persoane în regim de închiriere, eliberat de ARR după un curs și un test-grilă; același certificat este cerut de lege pentru transportul alternativ."
      },
      {
        "question": "Ce vechime maximă poate avea mașina pentru Uber?",
        "answer": "Potrivit OUG 49/2019, autoturismul trebuie să aibă mai puțin de 15 ani de la data fabricației la data expirării copiei conforme. Platforma poate avea cerințe comerciale suplimentare."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/215598",
        "label": "OUG 49/2019 privind transportul alternativ cu autoturism și conducător auto — text integral (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.arr.ro/transport_doc_610_transport-alternativ_pg_0.htm",
        "label": "Autorizații de transport alternativ și copii conforme — ARR (arr.ro) ↗"
      },
      {
        "url": "https://www.arr.ro/servicii_doc_164_eliberare-atestate_pg_0.htm",
        "label": "Eliberare atestate/certificate de pregătire profesională — ARR (arr.ro) ↗"
      },
      {
        "url": "https://www.arr.ro/",
        "label": "ARR – Autoritatea Rutieră Română (pagina oficială) ↗"
      }
    ]
  },
  {
    "slug": "rovinieta-12-luni-autoturism",
    "url": "/ghid-auto/rovinieta-12-luni-autoturism/",
    "title": "Rovinietă 12 luni autoturism 2026 – preț, valabilitate și cum o cumperi online",
    "category": {
      "slug": "rovinieta",
      "name": "Rovinietă",
      "color": "#16a34a",
      "icon": "🎫"
    },
    "metaDescription": "Rovinietă 12 luni autoturism 2026: între 228 și 330 lei de la 1 octombrie, după norma EURO, valabilitate și cum o cumperi online rapid. Verificare gratuită după număr.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Rovinieta pe 12 luni pentru un autoturism (categoria A) costă, de la 1 octombrie 2026, între 228 și 330 de lei, în funcție de norma de poluare EURO (228 lei electric, 254 lei EURO VI, 292 lei EURO V-IV, 330 lei EURO III-0). Tarifele sunt stabilite direct în lei, cu TVA inclus, și se plătesc pe portalul oficial CNAIR portal.etoll.ro, în aplicația TollRo sau la distribuitorii autorizați. Valabilitatea începe de la data selectată și se verifică gratuit după numărul de înmatriculare.",
    "docs": [
      "Numărul de înmatriculare al vehiculului",
      "Certificatul de înmatriculare (pentru categoria vehiculului și norma de poluare EURO, care determină tariful)",
      "Un card bancar pentru plata online"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Alege platforma",
        "description": "Accesează portal.etoll.ro (portalul oficial CNAIR; adresa veche erovinieta.ro redirecționează aici), aplicația oficială TollRo sau un distribuitor autorizat."
      },
      {
        "num": 2,
        "title": "Introdu numărul de înmatriculare",
        "description": "Selectează categoria vehiculului și perioada de 12 luni. Tariful depinde și de norma de poluare EURO; dacă nu există date despre clasa EURO, vehiculul este încadrat la Euro 0 (cel mai scump tarif)."
      },
      {
        "num": 3,
        "title": "Alege data de început",
        "description": "Poți programa rovinieta să înceapă la o dată viitoare, dar cel mult cu 30 de zile înainte de data de început a valabilității."
      },
      {
        "num": 4,
        "title": "Plătește online",
        "description": "După plată, rovinieta este activă și înregistrată electronic. Nu mai este nevoie de sticker."
      }
    ],
    "costs": [
      {
        "item": "Rovinietă 12 luni, autoturism (cat. A)",
        "note": "Tarif fix în lei, TVA inclus, din 1 octombrie 2026 (Ordinul MTI nr. 888/2026): 228 lei electric, 254 lei EURO VI, 292 lei EURO V-IV, 330 lei EURO III-0",
        "value": "228–330 lei (în funcție de norma EURO)"
      },
      {
        "item": "Rovinietă 12 luni, autoutilitară",
        "note": "Categoria B (marfă, MTMA ≤ 3,5 t): 521 lei electric, 579 lei EURO VI, 665 lei EURO V-IV, 752 lei EURO III-0",
        "value": "521–752 lei (în funcție de norma EURO)"
      }
    ],
    "proseHtml": "<h2>Ce este rovinieta</h2><p>Rovinieta este taxa de utilizare a rețelei de drumuri naționale din România. Este obligatorie pentru aproape toate vehiculele care circulă pe drumurile naționale și autostrăzi.</p><h2>Rovinieta este electronică</h2><p>Din 2010 rovinieta este complet electronică. Nu mai există sticker; valabilitatea este verificată automat de camerele CNAIR după numărul de înmatriculare.</p>",
    "faq": [
      {
        "question": "Cât costă rovinieta pe un an pentru o mașină?",
        "answer": "Pentru un autoturism (categoria A), rovinieta pe 12 luni costă, de la 1 octombrie 2026, între 228 și 330 de lei, în funcție de norma EURO: 228 lei (electric), 254 lei (EURO VI), 292 lei (EURO V-IV) și 330 lei (EURO III-0)."
      },
      {
        "question": "Cum verific dacă am rovinietă valabilă?",
        "answer": "Poți verifica gratuit pe portalul oficial CNAIR portal.etoll.ro (secțiunea Verificare Rovinietă), introducând datele vehiculului."
      }
    ],
    "officialLinks": [
      {
        "url": "https://portal.etoll.ro/",
        "label": "portal.etoll.ro – portalul oficial CNAIR (TollRo/Rovinieta): cumpărare și verificare rovinietă ↗"
      },
      {
        "url": "https://www.roviniete.ro/",
        "label": "roviniete.ro – distribuitor privat autorizat CNAIR (nu portalul oficial) ↗"
      }
    ]
  },
  {
    "slug": "itp-expirat",
    "url": "/ghid-auto/itp-expirat/",
    "title": "ITP expirat 2026 – ce faci și care sunt pașii legali",
    "category": {
      "slug": "itp-rar",
      "name": "ITP & RAR",
      "color": "#ea580c",
      "icon": "🔧"
    },
    "metaDescription": "ITP expirat 2026: ce amendă riști, cum programezi o nouă inspecție tehnică și ce acte îți trebuie. Ghid rapid.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Dacă ai ITP-ul expirat nu ai voie să circuli pe drumurile publice, iar amenda poate ajunge la mii de lei (aproximativ 1.946 – 4.325 lei) plus reținerea certificatului de înmatriculare. Trebuie să programezi o nouă inspecție la o stație autorizată RAR, cu talonul și cartea de identitate a vehiculului.",
    "docs": [
      "Certificatul de înmatriculare (talonul)",
      "Cartea de identitate a vehiculului (CIV)",
      "Actul de identitate al persoanei care prezintă mașina la inspecție (nu trebuie să fie proprietarul)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Nu circula pe drumurile publice",
        "description": "Cu ITP expirat riști amendă și reținerea talonului. Transportă mașina la stația ITP pe platformă dacă e cazul."
      },
      {
        "num": 2,
        "title": "Alege o stație autorizată",
        "description": "Verifică pe site-ul RAR stațiile autorizate din zona ta și programează o inspecție. Atenție: dacă poliția ți-a reținut deja certificatul de înmatriculare pentru ITP expirat, inspecția completă se face obligatoriu la o reprezentanță RAR, nu la o stație ITP privată."
      },
      {
        "num": 3,
        "title": "Prezintă mașina la inspecție",
        "description": "Inspectorul verifică sistemele de frânare, direcție, iluminat, emisii și starea generală."
      },
      {
        "num": 4,
        "title": "Primești noul ITP",
        "description": "Dacă mașina trece inspecția, primești certificatul de inspecție tehnică periodică, noua dată-limită se trece în anexa la talon (cu element de securizare), iar ecusonul ITP se aplică pe placa de înmatriculare din față. Inspecția se înregistrează și în baza de date RAR."
      }
    ],
    "costs": [
      {
        "item": "ITP autoturism",
        "note": "Variază după stație",
        "value": "120 – 200 RON"
      },
      {
        "item": "Amendă ITP expirat",
        "note": "Plus reținerea talonului",
        "value": "1.946,25 – 4.325 RON"
      }
    ],
    "proseHtml": "<h2>Cât de gravă este circulația cu ITP expirat</h2><p>Circulația cu ITP-ul expirat este sancționată cu amendă din clasa a IV-a (9–20 puncte-amendă, adică 1.946,25–4.325 lei de la 1 iulie 2026) și cu <a href=\"https://legislatie.just.ro/Public/DetaliiDocument/74028\" target=\"_blank\" rel=\"noopener\">reținerea certificatului de înmatriculare</a>. De la data expirării ITP, înmatricularea mașinii este suspendată de drept până la o nouă inspecție, iar dacă suspendarea durează neîntrerupt 3 ani, vehiculul se radiază din oficiu. În plus, în caz de accident, asigurătorul poate refuza plata daunelor.</p><h2>Cât de des se face ITP</h2><p>Pentru autoturisme (cel mult 8 locuri pe scaune în afara șoferului), ITP-ul se face la 2 ani, iar anual dacă mașina are o vechime de cel puțin 12 ani. Autoturismele înmatriculate noi în România fac prima ITP la 3 ani; taxiurile și mașinile de închiriat (rent-a-car) fac ITP la 6 luni. Verifică data următoarei inspecții în anexa la certificatul de înmatriculare (talon), pe certificatul ITP sau online, pe site-ul RAR.</p>",
    "faq": [
      {
        "question": "Pot circula până la stația ITP cu inspecția expirată?",
        "answer": "Legal nu ai voie să circuli cu ITP expirat. Recomandarea este transportul pe platformă."
      },
      {
        "question": "La cât timp se face ITP-ul?",
        "answer": "La 2 ani pentru autoturismele cu o vechime sub 12 ani și anual pentru cele cu o vechime de cel puțin 12 ani. Autoturismele înmatriculate noi fac prima ITP la 3 ani, iar taxiurile și mașinile rent-a-car la fiecare 6 luni."
      }
    ],
    "officialLinks": [
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/74028",
        "label": "OUG 195/2002 – Codul Rutier (art. 10-11, circulația cu ITP expirat) (legislatie.just.ro) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/24006",
        "label": "OG 81/2000 – periodicitatea inspecției tehnice periodice (legislatie.just.ro) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/308231",
        "label": "Salariul de bază minim brut 4.325 lei (bază de calcul a amenzilor) de la 1 iulie 2026 — HG 146/2026 (legislatie.just.ro) ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "RAR – stații ITP autorizate ↗"
      },
      {
        "url": "https://prog.rarom.ro/rarpol/rarpol.asp",
        "label": "RAR – Verificare valabilitate ITP online ↗"
      }
    ]
  },
  {
    "slug": "permis-pierdut",
    "url": "/ghid-auto/permis-pierdut/",
    "title": "Permis pierdut 2026 – ce trebuie să faci și cum obții un duplicat",
    "category": {
      "slug": "permis-de-conducere",
      "name": "Permis de conducere",
      "color": "#7c3aed",
      "icon": "🪪"
    },
    "metaDescription": "Permis pierdut 2026: cum obții un duplicat, ce acte îți trebuie, taxa de 139 RON și pașii la DGPCI. Ghid actualizat.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Dacă ți-ai pierdut permisul, poți solicita un duplicat la DGPCI. Ai nevoie de cererea-tip (în care declari pierderea), actul de identitate și dovada plății contravalorii permisului de conducere de 139 RON (tarif în vigoare din 15.09.2026). Nu mai este obligatorie declararea pierderii la poliție. Duplicatul se eliberează în câteva zile lucrătoare.",
    "docs": [
      "Cererea tip pentru eliberarea duplicatului",
      "Actul de identitate (original și copie)",
      "Dovada plății contravalorii permisului de conducere de 139 RON (online prin procesatorul de pe dgpci.mai.gov.ro / ghiseul.ro sau la Trezorerie).",
      "Fișa medicală (dacă permisul a expirat)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Programează-te online",
        "description": "Accesează portalul DGPCI și fă o programare pentru preschimbarea/eliberarea permisului."
      },
      {
        "num": 2,
        "title": "Plătește taxa",
        "description": "Achită taxa de 139 RON pentru duplicat (tarif în vigoare din 15.09.2026), online sau la Trezorerie. Plățile de 89 RON făcute înainte de 15.09.2026 și neutilizate nu mai sunt acceptate."
      },
      {
        "num": 3,
        "title": "Depune dosarul",
        "description": "Prezintă-te la programare cu actul de identitate și dovada plății (sau trimite cererea online prin aplicația de pe dgpci.mai.gov.ro). Pierderea se declară direct în cerere, fără declarație la poliție; la cerere primești o dovadă înlocuitoare valabilă cel mult 30 de zile."
      },
      {
        "num": 4,
        "title": "Ridică duplicatul",
        "description": "Permisul duplicat se eliberează, de regulă, în câteva zile lucrătoare."
      }
    ],
    "costs": [
      {
        "item": "Contravaloarea permisului de conducere (duplicat)",
        "note": "",
        "value": "139 RON"
      },
      {
        "item": "Fișă medicală",
        "note": "Doar dacă permisul a expirat",
        "value": "100 – 150 RON"
      }
    ],
    "proseHtml": "<h2>Ce faci imediat ce ai pierdut permisul</h2><p>Nu este necesară declararea pierderii la poliție sau publicarea în Monitorul Oficial: potrivit Ordinului MAI nr. 82/2024 (în vigoare din 30 mai 2024), pierderea sau furtul se declară direct în cererea de duplicat. Poți solicita direct <a href=\"https://www.mai.gov.ro/emiterea-duplicatului-permisului-de-conducere-disponibila-si-online/\" target=\"_blank\" rel=\"noopener\">un duplicat</a> la orice serviciu DGPCI.</p><h2>Poți conduce cu permisul pierdut?</h2><p>La depunerea cererii poți solicita o dovadă înlocuitoare a permisului de conducere, valabilă până la emiterea duplicatului, dar nu mai mult de 30 de zile. Fără această dovadă nu ai un document care să ateste dreptul de a conduce, așa că cere-o la ghișeu dacă ai nevoie să conduci până primești noul permis.</p>",
    "faq": [
      {
        "question": "Mai trebuie să anunț poliția dacă mi-am pierdut permisul?",
        "answer": "Nu. Din 30 mai 2024 (Ordinul MAI nr. 82/2024), pierderea sau furtul se declară direct în cererea de duplicat, fără declarație la poliție."
      },
      {
        "question": "Cât costă duplicatul permisului?",
        "answer": "Contravaloarea permisului (duplicat) este 139 RON (tarif în vigoare din 15.09.2026). Dacă permisul a expirat, se adaugă costul unei noi fișe medicale."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – Direcția Generală Permise de Conducere și Înmatriculări (portal oficial) ↗"
      },
      {
        "url": "https://www.mai.gov.ro/emiterea-duplicatului-permisului-de-conducere-disponibila-si-online/",
        "label": "Procedura online pentru duplicatul permisului — MAI (comunicat oficial, 2024) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/index.php/serviciu/view?id=72",
        "label": "Acte necesare duplicat + dovada plății contravalorii permisului — hub.mai.gov.ro (serviciu oficial) ↗"
      }
    ]
  },
  {
    "slug": "rca-pentru-masina-nou-cumparata",
    "url": "/ghid-auto/rca-pentru-masina-nou-cumparata/",
    "title": "RCA pentru mașina nou cumpărată 2026 – acte necesare și când se face",
    "category": {
      "slug": "asigurari-rca-casco",
      "name": "Asigurări RCA & CASCO",
      "color": "#0891b2",
      "icon": "🛡️"
    },
    "metaDescription": "RCA pentru mașina nou cumpărată în 2026: când se face, ce acte îți trebuie și cum obții cel mai bun preț. Ghid complet.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "RCA pentru o mașină nou cumpărată trebuie încheiată înainte de a circula pe drumurile publice. Atenție la data de început: dacă mașina nu avea RCA pe numele tău, acoperirea începe din ziua următoare încheierii poliței, iar la o mașină nouă care urmează să fie înmatriculată începe la emitere, dar nu mai devreme de autorizația provizorie sau de înmatriculare. Ai nevoie de talon (sau de CIV, dacă mașina nu e încă înmatriculată), documentul de proprietate (contract de vânzare-cumpărare sau factură, pentru o mașină nouă de la dealer) și cartea de identitate. Prețul depinde de clasa bonus-malus a proprietarului.",
    "docs": [
      "Cartea de identitate a vehiculului (CIV) sau talonul",
      "Documentul de proprietate (contractul de vânzare-cumpărare sau, pentru o mașină nouă de la dealer, factura)",
      "Actul de identitate al proprietarului",
      "Permisul de conducere al utilizatorului principal",
      "Istoricul bonus-malus (se verifică automat în baza AIDA)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Adună datele mașinii",
        "description": "Ai nevoie de seria de șasiu, capacitatea cilindrică și puterea din CIV."
      },
      {
        "num": 2,
        "title": "Compară ofertele",
        "description": "Solicită oferte de la mai mulți asigurători sau folosește un broker online pentru a compara prețurile."
      },
      {
        "num": 3,
        "title": "Alege perioada",
        "description": "Poți încheia RCA pe orice perioadă între 1 și 12 luni (în luni întregi). Polița pe 12 luni are de regulă cel mai bun preț pe lună."
      },
      {
        "num": 4,
        "title": "Plătește și primești polița",
        "description": "După plată primești polița electronică pe e-mail. Atenție la data de început: dacă mașina nu avea RCA pe numele tău, răspunderea asigurătorului începe din ziua următoare încheierii poliței; la o mașină nouă care urmează să fie înmatriculată, începe la emitere, dar nu mai devreme de data autorizației provizorii sau a înmatriculării."
      }
    ],
    "costs": [
      {
        "item": "RCA autoturism, clasă B0",
        "note": "Variază după oraș și vârstă",
        "value": "700 – 1.500 RON / an"
      },
      {
        "item": "RCA șofer tânăr",
        "note": "Sub 30 de ani (grupa de vârstă din tarifele de referință ASF)",
        "value": "~2.400 – 4.000+ RON / an"
      }
    ],
    "proseHtml": "<h2>Este obligatorie RCA de la momentul cumpărării?</h2><p>Da. Nicio mașină nu poate circula legal pe drumurile publice fără o poliță RCA valabilă. RCA acoperă daunele produse terților în caz de accident.</p><h2>Cum reduci prețul RCA</h2><p>Clasa bonus-malus este principalul factor: cu cât ai mai mulți ani fără daune, cu atât primești o reducere mai mare. Compararea ofertelor între asigurători poate aduce diferențe de câteva sute de lei.</p>",
    "faq": [
      {
        "question": "Pot circula fără RCA imediat după cumpărare?",
        "answer": "Nu. Trebuie să ai RCA valabilă înainte de a circula, chiar și pentru a duce mașina acasă. Dacă mașina nu avea RCA pe numele tău, acoperirea începe abia din ziua următoare încheierii poliței, așa că încheie polița cu cel puțin o zi înainte de drum."
      },
      {
        "question": "Se transferă RCA de la vechiul proprietar?",
        "answer": "Nu. Polița RCA nu se transferă noului proprietar. Contractul vânzătorului încetează la data la care acesta anunță asigurătorul despre vânzare, iar vânzătorul primește înapoi prima pentru perioada rămasă dacă nu s-au plătit și nu se datorează despăgubiri. Noul proprietar este obligat să încheie o poliță nouă pe numele său, cerută și la transcriere."
      }
    ],
    "officialLinks": [
      {
        "url": "https://asfromania.ro/",
        "label": "ASF – Autoritatea de Supraveghere Financiară ↗"
      }
    ]
  },
  {
    "slug": "schimbare-proprietar-auto",
    "url": "/ghid-auto/schimbare-proprietar-auto/",
    "title": "Schimbare proprietar auto 2026 – acte necesare și procedura oficială",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Schimbare proprietar auto 2026: contract vânzare-cumpărare, viză fiscală, transcriere la DGPCI, acte necesare și costuri. Ghid pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Schimbarea proprietarului auto presupune obținerea certificatelor de atestare fiscală (de către vânzător pentru mașina vândută și, din martie 2026, de către cumpărător pentru propriile obligații la bugetul local), încheierea contractului de vânzare-cumpărare, scoaterea din evidența fiscală de către vânzător, luarea în evidență de către cumpărător și transcrierea dreptului de proprietate la DGPCI. Costul transcrierii este de 76 RON pentru noul certificat de înmatriculare, plus 52 RON pentru plăcuțe dacă se atribuie un număr nou.",
    "docs": [
      "Contractul de vânzare-cumpărare (minim 3 exemplare)",
      "Cartea de identitate a vehiculului (CIV)",
      "Certificatul de înmatriculare (talonul) vechi și plăcuțele vechi, dacă numărul nu se transferă automat noului proprietar",
      "Contractul de vânzare-cumpărare înregistrat în evidențele direcției de taxe locale de la domiciliul cumpărătorului",
      "Certificatele de atestare fiscală ale vânzătorului și, din martie 2026, ale cumpărătorului (se prezintă la direcția de taxe locale la vânzare și la luarea în evidență; la ghișeul DGPCI nu se mai depun separat dacă contractul este înregistrat fiscal, dar sunt obligatorii pentru transcrierea cerută online)",
      "RCA valabil pe numele noului proprietar, ITP valabil și dovada plății certificatului de înmatriculare (76 RON) și, după caz, a plăcuțelor",
      "Actul de identitate al cumpărătorului (solicitantul transcrierii), în original"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Semnați contractul de vânzare-cumpărare",
        "description": "Completați contractul în minim 3 exemplare, cu datele complete ale vehiculului și ale părților."
      },
      {
        "num": 2,
        "title": "Vânzătorul scoate mașina din evidența fiscală",
        "description": "Înainte de semnarea contractului, vânzătorul obține de la direcția de taxe locale certificatul de atestare fiscală, după ce a achitat toate obligațiile la bugetul local, inclusiv impozitul pe mașină pentru tot anul în care o vinde. După vânzare, depune contractul pentru scoaterea mașinii din evidența fiscală."
      },
      {
        "num": 3,
        "title": "Cumpărătorul ia mașina în evidență",
        "description": "Noul proprietar înregistrează contractul la DITL din localitatea de domiciliu, pentru luarea mașinii în evidență. Din martie 2026 trebuie să aibă achitate și propriile obligații la bugetul local (certificat de atestare fiscală sau verificare electronică)."
      },
      {
        "num": 4,
        "title": "Depuneți dosarul de transcriere la DGPCI",
        "description": "Cu dosarul complet și RCA pe numele nou, depuneți cererea de transcriere a dreptului de proprietate."
      },
      {
        "num": 5,
        "title": "Ridicați noul certificat de înmatriculare",
        "description": "Primiți certificatul de înmatriculare pe numele noului proprietar. Numărul și plăcuțele se transferă automat doar dacă ai domiciliul în același județ cu vânzătorul și acesta nu a optat să păstreze combinația de număr; altfel primești un număr nou și plăcuțe noi."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare nou",
        "note": "",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe noi",
        "note": "La schimbare de județ sau dacă vânzătorul păstrează numărul (2 × 26 RON/placă)",
        "value": "52 RON"
      },
      {
        "item": "Contract de vânzare-cumpărare",
        "note": "Formular tip ANAF",
        "value": "Gratuit"
      }
    ],
    "proseHtml": "<h2>Ce înseamnă transcrierea dreptului de proprietate</h2><p>Transcrierea este operațiunea prin care noul proprietar este înscris în evidențele DGPCI. Fără transcriere, amenzile și obligațiile fiscale rămân pe numele vechiului proprietar.</p><h2>Termenele legale</h2><p>Atât vânzătorul (pentru scoaterea din evidența fiscală), cât și cumpărătorul (pentru luarea în evidență) au obligații la direcția de taxe locale. Transcrierea la serviciul de înmatriculări trebuie cerută de cumpărător în cel mult 90 de zile de la data dobândirii; după acest termen, înmatricularea se suspendă de drept până la transcriere. Recomandăm totuși finalizarea tuturor pașilor cât mai repede.</p>",
    "faq": [
      {
        "question": "Cine plătește transcrierea, vânzătorul sau cumpărătorul?",
        "answer": "Costurile de transcriere și noul certificat de înmatriculare sunt suportate, de regulă, de cumpărător."
      },
      {
        "question": "Trebuie să schimb plăcuțele la schimbarea proprietarului?",
        "answer": "Doar dacă se schimbă județul sau dacă vânzătorul a optat să păstreze combinația de număr. Dacă locuiești în același județ cu vânzătorul și acesta nu păstrează numărul, numărul și plăcuțele trec automat și gratuit pe numele tău."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://legislatie.just.ro/public/detaliidocument/74028",
        "label": "OUG 195/2002 privind circulatia pe drumurile publice (legislatie.just.ro) ↗"
      },
      {
        "url": "https://hub.mai.gov.ro/serviciu/view?id=75",
        "label": "Transcrierea dreptului de proprietate - serviciu oficial DGPCI/MAI (hub.mai.gov.ro) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI - inmatriculari si transcriere vehicule (portal oficial) ↗"
      },
      {
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/290993",
        "label": "Ordinul MAI 181/2024 – procedura înmatriculării și transcrierii (legislatie.just.ro) ↗"
      }
    ]
  },
  {
    "slug": "inmatriculare-auto",
    "url": "/ghid-auto/inmatriculare-auto/",
    "title": "Înmatriculare auto 2026 – acte necesare, costuri și pașii exacți",
    "category": {
      "slug": "inmatriculare-transcriere",
      "name": "Înmatriculare & Transcriere",
      "color": "#2563eb",
      "icon": "🚗"
    },
    "metaDescription": "Înmatriculare auto 2026: acte necesare, costuri (certificat 76 RON, plăcuțe 52 RON) și cei 6 pași la DGPCI. Ghid actualizat pas cu pas.",
    "updateDate": "🗓 Actualizat 18 Octombrie 2026",
    "readTime": "⏱ 1 min citire",
    "quickAnswer": "Pentru a înmatricula o mașină în 2026 ai nevoie de cartea de identitate a vehiculului (CIV), contractul de vânzare-cumpărare sau factura înregistrate la direcția de taxe locale de la domiciliu (din martie 2026 trebuie să ai achitate și toate obligațiile la bugetul local – certificat de atestare fiscală sau verificare electronică), RCA pe numele tău, ITP valabil și, pentru o mașină rulată adusă din străinătate, certificatul de autenticitate RAR; dosarul se depune la DGPCI. Costul total pornește de la aproximativ 128 RON (76 RON certificatul de înmatriculare + 52 RON perechea de plăcuțe, fără RCA), iar certificatul de înmatriculare se eliberează în cel mult 20 de zile lucrătoare (în multe județe se trimite prin poștă la domiciliu).",
    "docs": [
      "Cererea de înmatriculare (completată electronic de lucrătorul de la ghișeu și pusă gratuit la dispoziție; o semnezi la depunere)",
      "Cartea de identitate a vehiculului (CIV)",
      "Contractul de vânzare-cumpărare / factura",
      "Contractul de vânzare-cumpărare / factura înregistrate în evidențele Direcției de Taxe și Impozite Locale de la domiciliu (luarea în evidență fiscală)",
      "Certificatul de asigurare RCA valabil pe numele noului proprietar; ITP valabil (verificat de regulă electronic); certificatul de autenticitate RAR, la prima înmatriculare în România a unui vehicul rulat adus din străinătate",
      "Dovada plății contravalorii certificatului de înmatriculare (76 RON)",
      "Dovada plății plăcuțelor cu numărul de înmatriculare (52 RON perechea standard)",
      "Actul de identitate al proprietarului, în original (se restituie pe loc)"
    ],
    "steps": [
      {
        "num": 1,
        "title": "Înregistrează mașina la taxe locale",
        "description": "Înregistrează contractul sau factura la Direcția de Taxe și Impozite Locale (DITL) de la domiciliu, pentru a lua în evidență mașina. Din martie 2026 trebuie să ai achitate toate obligațiile la bugetul local: prezinți certificatul de atestare fiscală sau DITL îți verifică electronic situația fiscală."
      },
      {
        "num": 2,
        "title": "Încheie asigurarea RCA",
        "description": "Cumpără o poliță RCA pe numele tău. Este obligatorie pentru depunerea dosarului de înmatriculare."
      },
      {
        "num": 3,
        "title": "Plătește taxele",
        "description": "Achită contravaloarea certificatului de înmatriculare (76 RON) și a plăcuțelor (52 RON perechea standard). Plata se poate face online sau prin Trezorerie."
      },
      {
        "num": 4,
        "title": "Completează cererea DGPCI",
        "description": "Nu mai trebuie să descarci formularul: cererea de înmatriculare este completată electronic de lucrătorul de la ghișeu și îți este pusă gratuit la dispoziție, iar tu doar o semnezi. Alternativ, cererea poate fi transmisă online prin platforma DGPCI, acolo unde serviciul este disponibil."
      },
      {
        "num": 5,
        "title": "Depune dosarul la DGPCI",
        "description": "Programează-te online și depune dosarul complet la Serviciul Public Comunitar Regim Permise de Conducere și Înmatriculare a Vehiculelor din județul de domiciliu."
      },
      {
        "num": 6,
        "title": "Ridică certificatul și plăcuțele",
        "description": "După verificarea dosarului primești plăcuțele, iar certificatul de înmatriculare se eliberează în cel mult 20 de zile lucrătoare; în multe județe se trimite prin poștă la domiciliu, iar până atunci poți cere o dovadă înlocuitoare."
      }
    ],
    "costs": [
      {
        "item": "Certificat de înmatriculare",
        "note": "Taxă fixă",
        "value": "76 RON"
      },
      {
        "item": "Plăcuțe cu numere",
        "note": "Obligatorii la prima înmatriculare (2 × 26 RON)",
        "value": "52 RON"
      },
      {
        "item": "Asigurare RCA",
        "note": "Variază în funcție de vehicul și șofer",
        "value": "600 – 1.800 RON / an"
      }
    ],
    "proseHtml": "<h2>Cine trebuie să înmatriculeze o mașină</h2><p>Orice proprietar de vehicul care circulă pe drumurile publice din România are obligația să îl înmatriculeze pe numele său. Înmatricularea se face la serviciul DGPCI din județul de domiciliu, iar vehiculul nu poate fi pus în circulație înainte de înmatriculare. Termenul de 90 de zile de la data dobândirii se aplică transcrierii, adică atunci când cumperi o mașină deja înmatriculată în România; după depășirea lui, înmatricularea se suspendă de drept până la transcriere.</p><h2>Cât durează înmatricularea</h2><p>Dosarul se depune în ziua programării, iar certificatul de înmatriculare se eliberează în cel mult 20 de zile lucrătoare; în multe județe el se trimite prin poștă la domiciliu (în medie în aproximativ 5 zile lucrătoare), iar plăcuțele se ridică de la ghișeu. Programarea online reduce semnificativ timpul de așteptare la ghișeu.</p><h2>Diferențe pentru mașinile aduse din străinătate</h2><p>Pentru un autovehicul adus din Uniunea Europeană sau din afara UE se adaugă certificatul de autenticitate RAR și, după caz, dovada plății taxelor vamale. Verifică întotdeauna dacă vehiculul are nevoie de omologare individuală RAR înainte de a depune dosarul.</p>",
    "faq": [
      {
        "question": "Cât costă înmatricularea unei mașini în 2026?",
        "answer": "Taxele fixe sunt 76 RON pentru certificatul de înmatriculare (tarif în vigoare din 15 septembrie 2026; anterior 49 RON) și 52 RON pentru perechea de plăcuțe standard, obligatorii la prima înmatriculare. La acestea se adaugă RCA, care variază între 600 și 1.800 RON pe an."
      },
      {
        "question": "În cât timp trebuie să înmatriculez mașina după cumpărare?",
        "answer": "Dacă ai cumpărat o mașină deja înmatriculată în România, ai 90 de zile de la data dobândirii ca să ceri transcrierea. Depășirea termenului nu se sancționează direct cu amendă, dar înmatricularea se suspendă de drept, iar conducerea unui vehicul cu înmatricularea suspendată este contravenție. O mașină neînmatriculată (de exemplu, adusă din străinătate) nu are voie să circule până la înmatriculare decât cu numere provizorii."
      },
      {
        "question": "Pot înmatricula mașina fără RCA?",
        "answer": "Nu. Polița RCA valabilă pe numele noului proprietar este obligatorie pentru depunerea dosarului de înmatriculare."
      }
    ],
    "officialLinks": [
      {
        "url": "https://dgpci.mai.gov.ro/drpciv-booking/",
        "label": "DGPCI – programare online (înmatriculări și permise) ↗"
      },
      {
        "url": "https://dgpci.mai.gov.ro/",
        "label": "DGPCI – programări și formulare ↗"
      },
      {
        "url": "https://www.rarom.ro/",
        "label": "RAR – Registrul Auto Român ↗"
      }
    ]
  }
];

export function getAllArticles(): GhidArticle[] {
  return GHID_ARTICLES;
}

export function getArticleBySlug(slug: string): GhidArticle | undefined {
  return GHID_ARTICLES.find(a => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): GhidArticle[] {
  return GHID_ARTICLES.filter(a => a.category.slug === categorySlug);
}

export function getFeaturedArticles(): GhidArticle[] {
  // Top căutate proceduri în 2026
  const featuredSlugs = [
    'inmatriculare-auto',
    'program-rabla-inscriere-acte-2026',
    'itp-expirat',
    'permis-pierdut',
    'rca-pentru-masina-nou-cumparata',
    'rovinieta-12-luni-autoturism'
  ];
  const list = featuredSlugs.map(slug => getArticleBySlug(slug)).filter(Boolean) as GhidArticle[];
  return list.length > 0 ? list : GHID_ARTICLES.slice(0, 6);
}

export function getPopularArticles(): GhidArticle[] {
  const popularSlugs = [
    'inmatriculare-auto',
    'schimbare-talon-auto-la-schimbare-domiciliu',
    'inmatriculare-auto-din-afara-ue',
    'program-rabla-inscriere-acte-2026',
    'duplicat-certificat-de-inmatriculare',
    'recuperare-permis-suspendat'
  ];
  const list = popularSlugs.map(slug => getArticleBySlug(slug)).filter(Boolean) as GhidArticle[];
  return list.length > 0 ? list : GHID_ARTICLES.slice(0, 6);
}

export function searchArticles(query: string): GhidArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GHID_ARTICLES.filter(a => 
    a.title.toLowerCase().includes(q) ||
    a.quickAnswer.toLowerCase().includes(q) ||
    a.category.name.toLowerCase().includes(q) ||
    a.docs.some(d => d.toLowerCase().includes(q))
  );
}
