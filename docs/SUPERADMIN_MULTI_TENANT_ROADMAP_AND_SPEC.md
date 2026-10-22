# 🗺️ Master Roadmap & Arhitectură: ParcOS SuperAdmin & Multi-Tenant Management
> **Data:** 22 Octombrie 2026  
> **Platform Persona:** Mao (Holding Distributed Architect & AI Pair Programmer)  
> **Target:** ParcOS (parcos.ro) • SuperAdmin Master Control Plane & Portaluri Dealeri Parteneri  
> **Hosting Node:** Netcup VPS (`152.53.158.65`) • PostgreSQL 18 Multi-Tenant  
> **Invariante Holding:** Strict 21% TVA (`VAT_RATE = 0.21`), Terminologie „Cont de Garanție”, Propagare Instantanee (Single Deploy)

---

## 1. Principiul Arhitectural Suveran: Propagare Instantanee (Single-Engine Multi-Tenancy)

Pentru ca orice funcționalitate nouă dezvoltată în ParcOS (de exemplu: conectarea FGO, scanner buletin, contracte DITL, generator TikTok) să fie **instantaneu propagabilă pe toți chiriașii (tenants)** fără a rescrie cod sau a crea baze de date separate:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARHITECTURA DE PROPAGARE                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. SINGLE CODEBASE: Același container Nginx + Node.js deservește       │
│    atât parcos.ro, cât și rxmautomobile.ro, mpiauto.ro etc.            │
│ 2. REZOLUȚIE DINAMICĂ: Identifică parcul din antetul HTTP Host:        │
│    sau din parametrul ?dealer=slug.                                    │
│ 3. FEATURE REGISTRY CENTRAL: Toate modulele sunt definite ca tokeni    │
│    în TenantFeatures (ex: fgoInvoicing, ocrCivTalon, salesDocsEngine). │
│ 4. CONFIG JSONB: Salvează setările specifice în dealers.config fără    │
│    migrări DDL de tabele.                                              │
│ 5. 1-CLICK GLOBAL ROLLOUT: Buton în SuperAdmin care propagă noul        │
│    modul activ pe toți clienții printr-o singură tranzacție!           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Structura pe Sprinturi & Tickete

### 🏁 SPRINT SA-1: SuperAdmin Control Plane & Ergonomic Sidebar (LIVRAT)
* **Ticket SA-01 — Componentă `SuperAdminSidebar.tsx`:**
  - Sidebar persistent pe desktop (lățime 288px) și drawer glisant pe mobil.
  - Selector rapid de parc auto (Tenant Switcher) cu filtrare live și afișare badge pachet (`ENTERPRISE`, `PRO`, `STARTER`).
  - Grupuri ergonomice de navigație: Ecosistem Parcuri, Configurare Parc Activ, Hub Integrări, Propagare & Infrastructură.
* **Ticket SA-02 — Masquerade Engine (1-Click DMS Impersonation):**
  - Buton direct de intrare în modul de lucru al dealerului ca SuperAdmin fără a cere parola acestuia.
* **Ticket SA-03 — Asistent Înrolare Showroom Nou (ANAF v9):**
  - Preluare instantanee a datelor de firmă după CUI direct din serverul fiscal ANAF.
* **Ticket SA-04 (ENV-01) — RXM Sandbox Clone 1:1 & Database Snapshot Isolation:**
  - **Obiectiv:** Mediu de test identic 1:1 cu RXM Automobile (`rxm_sandbox`), complet izolat pentru verificarea feature-urilor noi înainte de propagarea în producție.
  - **Izolare Totală a Datelor:** Folosește `dealer_slug = 'rxm_sandbox'` (sau schemă / container PostgreSQL dedicat), garantând că mașinile de test, modificările de stoc și ștergerile NU ating baza de producție reală a clienților RXM.
  - **Analiză & Consum Resurse (Netcup VPS `152.53.158.65`):**
    - Consum măsurat: **sub 35 MB RAM** (0.6% din cei ~5.46 GB RAM liberi pe server) și sub 50 MB NVMe.
    - **Recomandare:** Poate rula liniștit **24/7 non-stop** fără nicio degradare de performanță.
    - **Opțiune de economisire:** Comutator dedicat în SuperAdmin: `[ Activ 24/7 ]` ⇄ `[ Standby / Hibernare ]` pentru pornire și oprire la nevoie.
  - **Re-Sync 1-Click din Producție (Snapshot Engine):**
    - Buton în SuperAdmin care clonează instantaneu stocul curent din `rxm` în `rxm_sandbox`.
  - **Paravane de Securitate Automate:**
    - FGO API este forțat strict pe **Test UAT** (`https://api-testuat.fgo.ro/v2`) cu serii `TEST` / `SANDBOX`.
    - Trimiterea în SPV ANAF este **strict interzisă / blocată** pe mediul sandbox.
    - Banner vizual fluorescent în antet: `⚠️ MEDIU SANDBOX DE TEST — PRODUCȚIA RXM ESTE PROTEJATĂ`.
* **Ticket SA-05 — Decuplare Intro Showroom & Izolare Branding ParcOS Admin Gate:**
  - **Problemă rezolvată:** La accesarea `/admin` sau `/superadmin` pe ParcOS, se declanșa intro-ul cinematic de showroom cu cortină, sigla RXM Automobile Cluj-Napoca și sloganul „Fiecare drum începe cu alegerea potrivită”, acoperind poarta de logare.
  - **Decuplare Intro:** `CinematicIntro` este restrâns strict pe showroom-ul public RXM (`viewMode === 'showroom' && tenantId === 'rxm' && !isParcosDomain`). Este 100% dezactivat pe orice ecran de login sau rută administrativă.
  - **Instant Reveal:** Rutele de administrare setează `isRevealed = true` instantaneu, fără delay sau ecran negru.
  - **Izolare Branding Poartă:** Pe domeniul/portul central ParcOS, poarta afișează neutrul *ParcOS Platform (Carvana SRL)*, titlul *ParcOS Admin Hub* și butonul *Înapoi pe ParcOS.ro*.

---

### 🧾 SPRINT SA-2: Hub Centralizat de Integrări (FGO, e-Factura, Portaluri)
* **Ticket INT-01 — Conector FGO API v2 (Model Bring-Your-Own-Key):**
  - Câmpuri securizate în SuperAdmin: Cheie API (Bearer), CUI firmă, Serie Factură Fiscală, Serie Proformă Garanție.
  - Selector de mediu: Producție Live (`api.fgo.ro`) vs Test UAT Gratuit (`api-testuat.fgo.ro`).
  - Simulator de test conexiune API cu feedback instantaneu în toast.
* **Ticket INT-02 — Regim Fiscal Auto & Invariante Holding:**
  - Suport nativ pentru **Regimul Marjei (Art. 312 Cod Fiscal)** — trimite cota 0% la FGO cu mențiunea legală obligatorie pe factură.
  - Suport pentru **TVA Deductibil 21% Strict** (`VAT_RATE = 0.21`).
* **Ticket INT-03 — Integrare RO e-Factura SPV:**
  - Comutator pentru trimitere automată în SPV ANAF la emiterea facturii din FGO.
* **Ticket INT-04 — Automatizare Feed-uri Portaluri (Autovit Pro / OLX / Meta Shop):**
  - Generare dinamică de URL-uri XML/CSV per dealer cu buton de copiere rapidă.

---

### ⚙️ SPRINT SA-3: Gestiune Granulară Setări per Parc & Branding
* **Ticket SET-01 — Management Date Juridice & Cont de Garanție:**
  - Formular centralizat în SuperAdmin pentru CUI, Nr. Reg. Com., Sediu Social, Telefoane și WhatsApp.
  - Câmp dedicat pentru **Cont de Garanție deschis la Banca Transilvania** (IBAN RON / EUR).
* **Ticket SET-02 — Selector Teme Dinamice & CSS Variables:**
  - Schimbare temă în timp real: *Obsidian Gold* (Dark Luxury), *Clean White*, *Midnight Blue*, *Carbon Red*, *Emerald Prestige*.
  - Contrast certificat WCAG AA pe toate temele.
* **Ticket SET-03 — Domenii Custom & DNS Cloudflare:**
  - Alocare domeniu propriu (ex: `rxmautomobile.ro`) cu proxy Cloudflare și SSL automat.

---

### 🚀 SPRINT SA-4: Feature Propagation & Instant Rollout Engine
* **Ticket PROP-01 — Matrice Interactivă de Module:**
  - Vizualizare tabulară a tuturor celor 9 module ParcOS per fiecare showroom activ.
* **Ticket PROP-02 — 1-Click Global Rollout:**
  - Buton master **„⚡ Propagă Global pe Toate Showroom-urile”** care activează instantaneu noile module pe toate instanțele active.
* **Ticket PROP-03 — Gestiune Cote Stoc & Pachete:**
  - Alocare limită mașini: Starter (25), Pro (60), Enterprise (Nelimitat).
  - Avertizări automate de depășire cotă stoc.

---

### 💳 SPRINT SA-5: Facturare Automată Abonamente SaaS ParcOS ➔ Dealeri
* **Ticket BIL-01 — Facturare Automată B2B (Carvana SRL ➔ Parcuri Contractate):**
  - Cron job lunar pe VPS-ul Netcup care generează factura de abonament SaaS ParcOS prin contul FGO central al holdingului.
* **Ticket BIL-02 — Notificare Plată & e-Factura:**
  - Trimitere automată a facturii pe emailul administratorului de parc și în SPV-ul acestuia.
* **Ticket BIL-03 — Grace Period & Auto-Suspendare:**
  - Trecere automată din starea `active` în `suspended` cu banner de atenționare dacă plata nu este confirmată în 14 zile.
