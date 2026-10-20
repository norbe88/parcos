# 📘 Documentație Strategică & Arhitecturală: Turnkey Dealer OS
> **Data:** 19 Octombrie 2026 • 00:30  
> **Platform Persona:** Mao (Holding Distributed Architect & AI Pair Programmer)  
> **Target:** RXM Automobile & Rețeaua Națională de Dealeri Parteneri CARVANA SRL  
> **Hosting Node:** Netcup VPS (`152.53.158.65`) • AMD EPYC Genoa (4 vCPU, 8 GB RAM, 251 GB NVMe)

---

## 1. Context & Telemetrie Reală Hardware (Netcup VPS)

În sesiunea din această noapte am interogat telemetria live a serverului **Netcup VPS (`152.53.158.65`)**:
* **CPU:** 4 vCPU AMD EPYC-Genoa Processor (G11).
* **RAM:** 8 GB DDR5 total (7.76 GiB) — ~2.48 GB ocupat de stack-ul holdingului, **~5.46 GB RAM disponibil**.
* **NVMe SSD:** 251 GB total — 28 GB utilizat, **214 GB liberi (88% liber)**.
* **Consum Măsurat per Instanță Showroom:**
  * Frontend Nginx (`nginx:alpine`): **~7.3 MiB RAM**
  * Micro-API Node.js (`node:20-alpine`): **~20.1 MiB RAM**
  * Bază de date PostgreSQL (pe instanța comună `postgres:18`): **~5 - 8 MiB RAM per dealer**
  * **Total per Showroom:** Sub 35 MB RAM.

### Capacitate Reală de Găzduire Simultană pe același VPS:
* **Varianta B (Semi-izolat: Nginx + API dedicat per dealer, PG comun):** **~100 - 120 showroom-uri**.
* **Varianta C (Multi-Tenant Nativ: 1 motor Nginx + 1 API Node + 1 PG comun):** **Peste 300 - 500 showroom-uri**.

---

## 2. Decizia de Arhitectură: Multi-Tenant Nativ & Personalizare Totală

Am agreat că **Varianta C (Multi-Tenant Nativ)** este modelul optim de business și tehnic:
* **Același motor de cod** deservește toate domeniile (`rxmautomobile.ro`, `mpiauto.ro`, etc.) identificând dealerul din header-ul HTTP `Host:`.
* **Propagare Instantanee de Funcționalități:** Orice feature nou dezvoltat (e-Factura, e-Transport, RCA, etc.) devine activ instantaneu pentru toți dealerii printr-un singur deploy.
* **Fiecare dealer își păstrează 100% identitatea proprie:**
  1. **Date proprii:** Stoc izolat, CUI, Reg. Com., adrese, WhatsApp, telefoane, cont IBAN de **Cont de Garanție**.
  2. **Design Tokens Dinamice:** Paletă completă de culori CSS Variables (`obsidian_gold`, `clean_white`, `midnight_blue`, `carbon_red`, `emerald_prestige` sau coduri Hex din siglă).
  3. **Component Registry:** Ordinea secțiunilor din pagină este dinamică per dealer (ex: Hero Video ➔ Filtre ➔ Grilă ➔ Calculator Rate).
  4. **Intro-uri & Animații:** Intro Splash configurabil (Reveal Logo cu neon, Video buclă din dronă, sau intrare directă în stoc).

---

## 3. Master Roadmap & Structura pe Sprinturi (2026)

Pentru a evolua de la un simplu showroom la **Sistemul de Operare Auto complet (Turnkey Dealer OS)**, am structurat dezvoltarea pe 4 Sprinturi de lucru:

```
[Sprint 1: Multi-Tenant Core] ➔ [Sprint 2: Finanțe & ANAF] ➔ [Sprint 3: Asigurări & Logistică] ➔ [Sprint 4: Media & Marketing]
```

### 🏁 SPRINT 1: Multi-Tenant Core & Dynamic Engine (Tichetele 01-05)
* Extindere tabelă PostgreSQL `dealers` cu coloanele `domain` (VARCHAR UNIQUE) și `config` (JSONB).
* Middleware de rezoluție dinamică în Node API bazat pe antetul `Host:` și parametrul `?dealer=`.
* Dynamic CSS Variables & Section Registry în React (`TenantContext.tsx` & `App.tsx`).
* Script CLI dintr-o singură linie pentru onboarding instantaneu (`scripts/onboard_dealer.cjs`).
* Modal vizual SuperAdmin pentru lansare de showroom nou cu 1-click.

### 🏛️ SPRINT 2: Fiscalitate & Conformitate ANAF (România-Specific Moat)
* **e-Factura SPV ANAF:** Generare automată UBL 2.1 XML conform standardului național `RO_CIUS_1.0.1`.
  * Suport strict pentru **Regimul Marjei (Art. 312 Cod Fiscal)** — fără TVA evidențiat separat.
  * Suport pentru **TVA 21% Deductibil** pentru vehicule achiziționate pe firmă.
* **e-Transport & Cod UIT:** Generare cerere și fișier XML pentru declararea mașinilor transportate pe platformă (bunuri cu risc fiscal ridicat conform OUG 41/2022).
* **Semnătură Digitală pe Tabletă/Telefon:** Semnare cu degetul direct în birou pentru Procesul-Verbal de predare-primire și Certificatul de Garanție (1 An / 10.000 KM).

### 🚚 SPRINT 3: Logistică, Bursa de Tractări & Asigurări RCA
* **Bursa de Tractări & Estimator Transport:**
  * Calculator intern de distanță și cost platformă per km (ex: DE München ➔ RO Cluj, sau intern Arad ➔ Cluj).
  * Modul dispatch pentru cerere de ofertă automată către transportatori auto.
  * Generare automată CMR și aviz de expediție.
* **Generator Oferte RCA & Asigurări Provizorii:**
  * Datele tehnice se pre-completează instant din CIV/Talon prin OCR-ul existent (serie CIV, serie șasiu, masă, kw, capacitate).
  * Formular de comparare și emitere poliță RCA la predarea mașinii.
* **Dosar Numere Roșii:** Generare 1-click a dosarului de înmatriculare provizorie (cerere poliție, împuternicire, cerere taxă autorizație circulație).

### 📢 SPRINT 4: Social Media Auto-Share & Omnichannel Engine
* **Feed-uri Automate:** Endpoint XML live pentru **Autovit Pro / OLX Pro** și CSV pentru **Meta Catalog** (Facebook/Instagram Shop).
* **Studio Social Reels & Watermark:** Generator imagini 4:5 și clipuri 9:16 cu preț în euro, kilometraj și sigla dealerului. Ștergere numere vechi și aplicare watermark automat pe plăcuțe.
* **Trade-In / Buy-Back Estimator:** Formular client pe site pentru evaluarea mașinii la schimb pe baza scraperului comparativ Autovit existent.

---

## 4. Reguli de Aur Anti-Cookie-Cutter (Diversitate Vizuală)

Pentru a garanta că showroom-urile nu devin clone generice:
1. **3 Arhetipuri de Layout:**
   * *The Minimalist Boutique (Stil Polestar / Porsche Studio):* Aerisit, galerii 16:9, fonturi fine, fără bannere agresive.
   * *The High-Velocity Dealership (Stil Carvana US / AutoHero):* Filtre dense, căutare instantanee, calculator de rate direct pe cardul mașinii.
   * *The Performance & Dark Carbon (Stil Brabus / Cupra Garage):* Linii ascuțite, accente roșii/crimson sau neon, texturi de carbon, video intro.
2. **Typography Pairing Engine:**
   * *Luxury Heritage:* Cinzel + Plus Jakarta Sans
   * *Modern High-Tech:* Space Grotesk + Inter
   * *Sport Dynamic:* Syne / Clash Display + Manrope
   * *Clean Nordic:* Outfit + Geist Sans
3. **Micro-interacțiuni unice:** Hover cu swipe orizontal în grilă vs. zoom lent vs. 3D tilt.

---

## 5. Starea Proiectului & Următorul Pas la Reluare

* Tichetele de execuție pentru **Sprintul 1** sunt deja redactate și salvate în:
  [`.scratch/turnkey-multi-tenant-engine/issues/`](file:///C:/Projects/rxm-automobile/.scratch/turnkey-multi-tenant-engine/issues/)
* Verificarea `npx tsc --noEmit` este curată (0 erori).
* La reluare dimineață, avem de tranșat cele 2 detalii de integrare (e-Factura direct SPV vs. wrapper API SmartBill/Oblio, și parteneriatul de brokeraj RCA), apoi putem demara direct implementarea primului tichet.
