# AUDIT DE BAZĂ & ANALIZĂ COMPLETĂ: CARMATIK.RO
> **Document:** `BASELINE_REPORT.md`  
> **Auditor:** Website Baseline & State Auditor (`/www`, `/audit-web`, `/baseline`)  
> **Target Machine:** Node-ZBook / Zeti (`zbook-norby`)  
> **Data & Ora:** 2026-10-18 23:35:00 EEST  
> **Cont Test Dealer:** `silentx2z@gmail.com` (Ion Pop)  
> **Directoriu Screenshots:** `audit-baseline/screenshots/` (Oglindit pe Google Drive: `08_PROJECT_PARCOS/03_Cercetare_Piata_si_Competitori/carmatik_baseline/screenshots/`)

---

## 1. REZUMAT EXECUTIV

**Carmatik** (`carmatik.ro` + `dealer.carmatik.ro`) reprezintă în prezent cel mai vizibil produs românesc de tip „Dealer OS / Angajat Digital” dedicat parcurilor auto rulate din România (operat de compania CARMATIK S.R.L., CUI 47268302).

Auditul exhaustiv a fost realizat în regim **autentificat complet**, traversând portalul dealerului, fluxurile de citire documente (OCR), dosarele de achiziție, integrările de publicare multi-canal, simulatoarele financiare, conformitatea ANAF (e-Factura / e-Transport UIT) și CRM-ul de contacte.

### Constatări Cheie:
1. **Arhitectură Tehnologică Învechită:** Portalul dealer (`dealer.carmatik.ro`) este construit pe o stivă **Java Spring Boot monolitică** (cu template-uri server-side rendering tip Thymeleaf / JSP și Bootstrap 4/5). Nu folosește o arhitectură modernă SPA/PWA sau edge-rendered (Next.js/React).
2. **Performanță Mobilă Deficitară:** Pe storefront-urile generate pentru dealeri, scorurile Google Lighthouse variază între **32 și 64/100**, cu LCP (Largest Contentful Paint) între **2.3s și 14.1s** și un payload de rețea masiv (7.6 MB – 17.2 MB per pagină din cauza imaginilor neoptimizate servite direct din fișiere brute).
3. **Mecanismul OCR:** Soluția OCR Carmatik folosește o schemă hibridă: desktop-ul afișează un QR code de împerechere cu telefonul; dealerul fotografiază documentul pe mobil, iar datele sunt trimise prin streaming WebSocket în formularul desktop deschis.
4. **Fragilitate Financiară a Competitorului:** Conform datelor de la Ministerul Finanțelor (analizate via CUI 47268302), Carmatik S.R.L. a încheiat anul 2025 cu o **pierdere netă de ~242.000 lei** și **capitaluri proprii negative de -543.000 lei**, operând cu doar 4 angajați. Prețurile cerute dealerilor (150 – 500 €/lună) sunt greu de susținut în fața costurilor de dezvoltare pe un monolit Java.
5. **Oportunitatea Masivă ParcOS:** ParcOS (`parcos.ro`, `parcos.app`, `getparcos.com`) deține toate premisele pentru a deveni liderul pieței printr-o viteză de încărcare sub 1 secundă, cameră OCR direct din PWA (fără pași suplimentari de QR), sincronizare instantă cu OLX S9, Dark Luxury UX și TVA strict 21% integrat nativ.

---

## 2. ARHITECTURA DE RUTARE & HARTĂ SISTEM

Următorul tabel sintetizează cele 13 ecrane auditate și documentate cu capturi de ecran:

| ID Ecran | URL / Rută | Modul Funcțional | Screenshot Dovadă |
| :--- | :--- | :--- | :--- |
| **01** | `/myaccount` | Panou de Control & KPI Dealer | [01-carmatik-dashboard.png](screenshots/01-carmatik-dashboard.png) |
| **02** | `/myaccount/ocr` | Hub Scanare Documente (CIV, Talon, CI) | [02-carmatik-ocr.png](screenshots/02-carmatik-ocr.png) |
| **03** | `/myaccount/project/create` | Wizard Înregistrare Mașină (6 Pași) | [03-carmatik-vehicle-wizard.png](screenshots/03-carmatik-vehicle-wizard.png) |
| **04** | `/myaccount/integrations` | Hub Integrări & Canale (10 Marketplace-uri) | [04-carmatik-integrations.png](screenshots/04-carmatik-integrations.png) |
| **05** | `/myaccount/system` | Setări Sistem, Locații & Companie | [05-carmatik-settings.png](screenshots/05-carmatik-settings.png) |
| **06** | `/myaccount/documents/bank-credits/simulator` | Simulator Financiar & Leasing | [06-carmatik-leasing-simulator.png](screenshots/06-carmatik-leasing-simulator.png) |
| **07** | `/myaccount/transport_detail/see_etransport` | Declarații e-Transport ANAF & Cod UIT | [07-carmatik-etransport.png](screenshots/07-carmatik-etransport.png) |
| **08** | `/myaccount/contacts/list` | CRM Contacte, Lead-uri & Pipeline | [08-carmatik-crm-contacts.png](screenshots/08-carmatik-crm-contacts.png) |
| **09** | `/myaccount/facebook-configuration` | Șabloane & Automatizări Social Media | [09-carmatik-social-templates.png](screenshots/09-carmatik-social-templates.png) |
| **10** | `/myaccount/project/see_projects` | Gestionare Dosare & Export V-C | [10-carmatik-dossiers.png](screenshots/10-carmatik-dossiers.png) |
| **11** | `/myaccount/my-cars/make-search` | Catalog Stoc Vehicule & Statusuri | [11-carmatik-cars-list.png](screenshots/11-carmatik-cars-list.png) |
| **12** | `https://carmatik.ro` | Marketplace Public B2C | [12-carmatik-public-marketplace.png](screenshots/12-carmatik-public-marketplace.png) |
| **13** | `/solutii-digitale-pentru-dealerii-auto` | Pagină B2B Prezentare „Matik” | [13-carmatik-b2b-landing.png](screenshots/13-carmatik-b2b-landing.png) |

---

## 3. ANALIZĂ DETALIATĂ PE MODULE

### Modulul 1: Scanerul OCR de Documente Auto (`/myaccount/ocr`)
- **Documente Suportate:**
  - Carte de Identitate a Vehiculului (CIV România - format vechi și nou)
  - Certificat de Înmatriculare (Talon Auto - România & Germania / UE)
  - Carte de Identitate Românească (CI / Buletin pentru contracte)
- **Mecanismul de Interacțiune:**
  - Utilizatorul este instruit: *„Deschide formularul de adăugare mașină pe desktop, apoi deschide pe telefon link-ul sau scanează QR-ul pentru a fotografia documentul.”*
  - Odată fotografiat, documentul este procesat server-side, iar valorile sunt trimise în timp real în câmpurile active din formularul de pe desktop.
- **Dezavantaj Carmatik:** Pasul de „împerechere dispozitiv” este greoi. Dealerii care se află pe teren sau direct lângă mașină preferă să folosească direct telefonul ca aplicație PWA fără a avea un ecran de desktop deschis în paralel.

### Modulul 2: Wizard-ul de Înregistrare Vehicul (`/myaccount/project/create`)
Procesul de adăugare a unei mașini este structurat în **6 pași (Dosar Proiect)**:
1. **Pasul 1 — Dosar:** Selectarea tipului de dosar (*Achiziție proprie*, *Consignație*, *Buy-back*, *Consignație internă*), selectarea punctului de lucru / locației, a datei de intrare și a agentului responsabil.
2. **Pasul 2 — Mașină:** Introducere VIN (cu decodare automată parțială), Marcă, Model, An, Kilometraj, Culoare, Combustibil, Transmisie, Putere (CP/KW), Cilindree, Normă Euro.
3. **Pasul 3 — Furnizor / Proprietar:** Date vânzător (Persoană Fizică cu CNP / Persoană Juridică cu CUI, adresă, cont bancar).
4. **Pasul 4 — Recepție & Stare Tehnică:** Fișă intrare în stoc, checklist de dotări, anvelope (iarnă/vară, profil mm), număr chei, defecte optice sau mecanice raportate.
5. **Pasul 5 — Financiar & Calcul Marjă:** Preț achiziție, costuri transport, costuri cosmetizare/reparații, TVA (deductibil sau la marjă), preț final de vânzare.
6. **Pasul 6 — Rezumat & Publicare:** Generare contract de intrare în consignație / achiziție, descărcare PDF fișă recepție și trimitere în stocul activ.

### Modulul 3: Hub-ul de Integrări & Canale de Publicare (`/myaccount/integrations`)
Carmatik oferă integrări cu **10 platforme**:
1. **Autovit.ro:** Integrare API REST oficială. *Atenție:* Carmatik cere dealerului să dețină un abonament Autovit de nivel *Advanced* sau *Expert* pentru a primi credențialele API necesare.
2. **OLX.ro:** Publicare prin feed XML / protocol S9.
3. **Facebook Marketplace & Pagini:** Publicare automată de carusel foto + descriere generată automat.
4. **Instagram Shopping & Catalog:** Sincronizare produse în Meta Business Suite.
5. **TikTok Marketplace:** Export feed de produse pentru reclame și catalog dinamic.
6. **Publi24.ro & BestAuto.ro:** Feed XML automat actualizat la fiecare 1 oră.
7. **Lajumate.ro:** Export automat de anunțuri.
8. **Mogo Leasing:** Trimitere automată a lead-urilor de finanțare către partenerul bancar/IFN.

### Modulul 4: Modulul Financiar, Leasing & Facturare ANAF
- **Simulator de Leasing (`/documents/bank-credits/simulator`):**
  - Permite dealerului să genereze instant o ofertă de leasing pentru cumpărător.
  - Parametri de calcul: Dobândă standard (6.99%), Avans minim (20%), Analiză dosar (2.5%), Comision administrare lunar (0.5%), Valoare reziduală (1%), Costuri logistice (250 €), Perioadă (12 - 60 luni).
- **Facturare & e-Transport ANAF (`/transport_detail/see_etransport`):**
  - Modul integrat de emitere proforme și facturi fiscale.
  - Sincronizare cu sistemul RO e-Factura și declarare transporturi internaționale / de risc fiscal în RO e-Transport pentru obținerea automată a **Codului UIT**.

### Modulul 5: CRM, Contacte & Pipeline Vânzări (`/myaccount/contacts/list`)
- Structură pe roluri: `LEAD`, `CUSTOMER`, `SUPPLIER`, `LEASING_COMPANY`, `TRANSPORTATOR`.
- Urmărire canal de proveniență (Autovit, OLX, Facebook, Recomandare, Walk-in în parc).
- Alerte și memento-uri de follow-up pentru agenții de vânzări.

---

## 4. DEFICIENȚE, ANOMALII & LIMITĂRI ALE CARMATIK

În urma navigării directe și a analizei tehnice, au fost identificate următoarele slăbiciuni majore:
1. **Interfață Învechită (Bootstrap 2018):** UI-ul folosește culori pale, mult gri, tabele rigide și o densitate informațională scăzută. Nu există Dark Mode, iar interfața nu transmite sentimentul de produs tehnologic premium.
2. **Timp de Răspuns & Reîncărcare de Pagină:** Aplicația folosește navigare tradițională sincronă (fiecare clic reîncarcă întreaga pagină din serverul Java), ceea ce creează o senzație de latență în comparație cu o aplicație React / Next.js modernă.
3. **Vulnerabilitatea Politicii Autovit:** Carmatik depinde excesiv de API-ul Autovit, însă dealerii mici refuză să plătească miile de euro cerute de Autovit pentru pachetele Advanced/Expert. Carmatik nu oferă o alternativă viabilă de scraping sau sync hibrid pentru pachetele standard.
4. **Lipsa Instrumentelor AI Generative:** Carmatik se limitează la un template de text fix pentru Facebook (`{MARCA} {MODEL} la prețul de {PRET}`). Nu generează videoclipuri 9:16 pentru Reels / TikTok, nu optimizează titluri SEO prin AI și nu oferă asistență audio în limba română.

---

## 5. CONCLUZIE & IMPACT PENTRU PARCOS

Carmatik oferă o funcționalitate de bază completă (ERP auto), dar execuția este greoaie, lentă și costisitoare.  
**ParcOS** are oportunitatea de a prelua piața parcurilor auto din România oferind:
- **Design Dark Luxury:** O interfață spectaculoasă, cu contrast impecabil și fluiditate nativă.
- **Performanță < 1s:** Construcție pe Next.js 15 cu Netcup VPS dedicat și CDN Cloudflare.
- **AI Media Studio Integrat:** Generare de reels 9:16, descrieri persuasive și voce AI românească.
- **OCR Direct pe Mobil:** Scanare instantă CIV/Talon din browserul telefonului fără împerechere cu desktop.
- **Model de Preț Transparent & Fair:** Fără taxe ascunse și cu suport nativ pentru parcuri auto independente.
