# QA AGENTIC TEAM RUN LOG — RXM AUTOMOBILE & PARCOS CLOUD

> **Sesiune QA:** 2026-10-29 15:52:00
> **Target:** Dealer Onboarding & Parcos Landing Bypass Routing
> **Lead QA Architect (Orchi):** Claude Sonnet 4.6 (Thinking)
> **Worker Pool (Worky):** WorkyOne (Codebase Inspector), WorkyTwo (Test Suite Generator), WorkyThree (Patch Integrator), WorkyFour (Invariants Auditor)
> **Platformă Țintă:** HP ZBook Workstation (Zety / `zbook-norby`)

---

## 0. Sesiune: Wave 2 — Vehicle Views Telemetry Backend

> **Sesiune QA:** 2026-10-30 00:43:00  
> **Target:** PostgreSQL `vehicle_views`, Contor Atomic `views_count`, Rute Ingestie/Agregare și Client Showroom Beacon  
> **Suita Automată:** `scripts/qa_vehicle_views_telemetry_suite.cjs`  
> **Status General:** 🟢 **PASS (8/8 — 100%)**

| Tier | Domeniu Testat | Scenarii Executate | Status |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Database Layer** | `server/db.mjs`: Tabela `vehicle_views`, indexuri `dealer_slug`, `vehicle_id`, `(vehicle_id, session_hash, viewed_at DESC)`, `recordVehicleView` cu fereastră de debounce de 30 minute, contor atomic `views_count` | **PASS (100%)** |
| **Tier 2** | **Backend Telemetry API** | `server/api.mjs`: `POST /api/telemetry/vehicle-view` (suport dual JSON & `sendBeacon` text/plain), calcul `session_hash` SHA-256 (IP + UA + Salt zilnic, zero PII în clar), `GET /api/dealers/:slug/analytics/top-viewed` agregare orizonturi temporale | **PASS (100%)** |
| **Tier 3** | **Showroom Frontend & Types** | `src/services/telemetryService.ts` (`navigator.sendBeacon` cu fallback `fetch keepalive: true`, `sessionStorage` guard), `src/components/modals/VehicleDetailModal.tsx` montare pe `selectedCar.id`, excludere `viewMode === 'admin'`, tip `viewsCount?: number` pe `VehicleItem` | **PASS (100%)** |

### Test Execution Trace (`qa_vehicle_views_telemetry_suite.cjs`)
- [ PASS ] Funcțiile repository `recordVehicleView` și `getTopViewedVehicles` sunt exportate din `server/db.mjs`.
- [ PASS ] Validare parametri de intrare: respinge apelurile fără `vehicleId` sau `sessionHash`.
- [ PASS ] Generarea `session_hash` SHA-256 este deterministă, izolată și conformă GDPR.
- [ PASS ] Tipul `VehicleItem` din `src/db/types.ts` include câmpul `viewsCount?: number`.
- [ PASS ] `telemetryService.ts` implementează `sendBeacon`, `sessionStorage` guard și fallback `fetch`.
- [ PASS ] `VehicleDetailModal.tsx` integrează `sendVehicleViewBeacon` exclusiv pentru vizitatori (non-admin).
- [ PASS ] `server/api.mjs` conține rutele `POST /api/telemetry/vehicle-view` și `GET top-viewed`.
- [ PASS ] Invariante holding respectate (21% TVA, Cont de Garanție, Netcup VPS `152.53.158.65`).

---

## 1. Sesiune anterioară: Dealer Onboarding & Parcos Landing Bypass

| Tier | Domeniu Testat | Scenarii Executate | Status |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Frontend Routing** | `App.tsx` `checkIsSaasPath`: suport dinamic pentru orice dealer (`?dealer=mpiauto`, `mpi_auto`, `top_auto`), eliminare hardcoding `dealer=rxm` | **PASS (100%)** |
| **Tier 2** | **Tenant Context** | `TenantContext.tsx`: `detectInitialTenant` & `initialTenantBoot` permit query pe `isShowcaseEnvironment()` / `parcos.ro`, URL sync | **PASS (100%)** |
| **Tier 3** | **Backend Multi-Tenant** | `server/api.mjs`: `resolveTenant` suportă `isPlatformHost` (`parcos.ro`), rezoluție dinamică slug dealer din query, Netcup 21% TVA | **PASS (100%)** |

### Test Execution Trace (`qa_dealer_onboarding_and_parcos_landing_bypass.cjs`)
- [ PASS ] [WorkyOne] Host: parcos.ro cu ?dealer=mpiauto rezolvă mpi_auto (NU parcos) — 15:52:01Z
- [ PASS ] [WorkyOne] Host: parcos.ro cu ?dealer=mpi rezolvă alias-ul mpi_auto — 15:52:01Z
- [ PASS ] [WorkyTwo] Host: parcos.ro cu ?dealer=top_auto rezolvă top_auto (midnight_blue) — 15:52:01Z
- [ PASS ] [WorkyTwo] Host: parcos.ro FĂRĂ parametru ?dealer returnează corect platforma parcos — 15:52:01Z
- [ PASS ] [WorkyTwo] Host: parcos.ro cu ?dealer=parcos returnează platforma parcos — 15:52:01Z
- [ PASS ] [WorkyThree] POST /api/superadmin/tenants cu overwrite=true înrolează/actualizează fără 409 — 15:52:01Z
- [ PASS ] [WorkyFour] Invariante Holding: 21% TVA, Cont de Garanție și Netcup VPS (152.53.158.65) — 15:52:01Z

---

## 1. Executive Summary & Verification Matrix

| Tier | Domeniu Testat | Scenarii Executate | Status |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Frontend UI / UX** | Multi-photo upload, Cover badge, Rearrange, Drag-and-Drop, PDF Page Thumbnail Preview | **PASS (100%)** |
| **Tier 2** | **Engine / OCR Pipeline** | `convertPdfToImage` (2.0x scale), Multi-page composite (Față+Spate CIV), Gemini Vision payload format, Tesseract fallback | **PASS (100%)** |
| **Tier 3** | **Process Logic & Invariants** | Directiva 1999/37/CE (kW ➔ CP), Mascare VIN ISO 3779, Regex CIV RAR (Dacia, Seria CIV, An, Cilindree), TVA 21%, Cont de Garanție | **PASS (100%)** |

---

## 2. Test Execution Trace (`qa_civ_media_suite.ts`)

- [ PASS ] [WorkyOne] Detectează extensie .pdf din string — 08:12:20Z
- [ PASS ] [WorkyOne] Detectează extensie .PDF uppercase — 08:12:20Z
- [ PASS ] [WorkyOne] Detectează data URL application/pdf — 08:12:20Z
- [ PASS ] [WorkyOne] Respinge fișiere non-PDF (JPG) — 08:12:20Z
- [ PASS ] [WorkyOne] Gestionează string gol în siguranță — 08:12:20Z
- [ PASS ] [WorkyOne] Gestionează null în siguranță — 08:12:20Z
- [ PASS ] [WorkyOne] Gestionează undefined în siguranță — 08:12:20Z
- [ PASS ] [WorkyOne] Sanitizează litere O -> 0 și normalizează uppercase — 08:12:20Z
- [ PASS ] [WorkyOne] Validare VIN Dacia conform ISO 3779 (17 caractere) — 08:12:20Z
- [ PASS ] [WorkyOne] Respinge VIN mai scurt de 17 caractere — 08:12:20Z
- [ PASS ] [WorkyFour] Mască anti-fraudă VIN corectă (primele 3 + ultimele 4) — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie Dacia 80 kW ➔ 109 CP (rotunjit conform 1.35962) — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie BMW 140 kW ➔ 190 CP — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie MINI 141 kW ➔ 192 CP — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie Volvo 145 kW ➔ 197 CP — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie Jeep 184 kW ➔ 250 CP — 08:12:20Z
- [ PASS ] [WorkyFour] Conversie US Title: 45.000 Mile ➔ 72.420 Km — 08:12:20Z
- [ PASS ] [WorkyTwo] Identifică originea România a documentului CIV — 08:12:21Z
- [ PASS ] [WorkyTwo] Recunoaște marca autohtona DACIA — 08:12:21Z
- [ PASS ] [WorkyTwo] Recunoaște modelul Duster — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage seria VIN corectă din CIV (17 caractere) — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage anul fabricației 2018 din câmpul 7 CIV — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage cilindreea 1461 cmc din câmpul P.1 — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage puterea 80 kW din câmpul P.2 — 08:12:21Z
- [ PASS ] [WorkyTwo] Calculează automat 109 CP din puterea kW — 08:12:21Z
- [ PASS ] [WorkyTwo] Identifică MOTORINĂ ca Diesel — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage Seria C.I.V. (M-789012) din antet — 08:12:21Z
- [ PASS ] [WorkyTwo] Flag isVinValid este true — 08:12:21Z
- [ PASS ] [WorkyTwo] Scor de încredere ridicat (>80%) — 08:12:21Z
- [ PASS ] [WorkyTwo] Identifică Germania din antetul documentului — 08:12:21Z
- [ PASS ] [WorkyTwo] Recunoaște marca BMW din codul D.1 — 08:12:21Z
- [ PASS ] [WorkyTwo] Recunoaște modelul 520d din codul D.3 — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage VIN BMW din codul E — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage anul 2019 din codul B — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage cilindreea 1995 cmc din codul P.1 — 08:12:21Z
- [ PASS ] [WorkyTwo] Extrage puterea 140 kW din codul P.2 — 08:12:21Z
- [ PASS ] [WorkyTwo] Calculează 190 CP din 140 kW — 08:12:21Z

---

## 3. Discovered Vulnerabilities & Patches Applied

1. **Vulnerabilitate: Regex Prefix-Overlap la Câmpul P.3 (Combustibil)**
   - *Problemă:* La linia `P.3 Combustibilul: MOTORINĂ`, regex-ul captura cuvântul `Combustibilul` ca valoare în loc de `MOTORINĂ`.
   - *Patch (`WorkyThree`):* S-a grupat prefixul tehnic `(P.3)` împreună cu eticheta opțională `(?:COMBUSTIBILUL?|...)` urmată de două puncte, permițând extragerea corectă a valorii `MOTORINĂ` cu suport pentru diacritice românești (`ă, î, â, ș, ț`).
2. **Vulnerabilitate: Normalizare Denumiri Modele Dacia**
   - *Problemă:* Câmpul `3. Tipul / Varianta` din CIV include adesea coduri interne (`DUSTER HSDACG`).
   - *Patch (`WorkyThree`):* Normalizare automată a modelelor comerciale Dacia (`Duster`, `Logan`, `Sandero`, `Jogger`, `Spring`) în format TitleCase.
3. **Vulnerabilitate: Gemini Vision Inline PDF 400 Bad Request**
   - *Problemă:* Trimiterea fișierului PDF brut prin `inline_data` către API-ul REST Gemini eșua.
   - *Patch (`WorkyThree`):* Conversie client-side automată prin `convertPdfToImage` pe Canvas la scară 2.0x și trimiterea strict a imaginii JPEG preprocesate.

---

## 4. Invariants Audit (`WorkyFour`)

- **Strict 21% TVA:** Confirmat prin `VAT_RATE = 0.21` în `src/utils/helpers.ts`, schema Drizzle și calculatorul financiar.
- **Terminologie Garanții:** Strict „Cont de Garanție” / „Garanție de Rezervare”. 0 apariții ale termenilor interziși („escrow”, „cont fiduciar”).
- **Verificare Typecheck:** `npx tsc --noEmit` rulează cu 0 erori.
- **Verificare Build Producție:** `npm run build` finalizează în 14.94s cu exit code 0.

---

## 5. QA Run — 2026-10-27T19:07:00Z (Orchestrator: Orchi)
### Modul Țintă: OLX Auto-Link, Smart Inventory Signature & Reconciler Engine (`scripts/qa_olx_reconciler_suite.ts`)

### Matrice Verificare (51 Scenarii — 100% PASS):
- [ PASS ] [WorkyOne] Signature conține tagul corect de inventar #RXM-7412 — 19:07:16Z
- [ PASS ] [WorkyOne] Signature conține seria VIN curățată — 19:07:16Z
- [ PASS ] [WorkyOne] Signature respectă politica OLX (fără linii decorative de separare) — 19:07:16Z
- [ PASS ] [WorkyOne] Formatează număr 10 cifre în format 0748_892_937 — 19:07:16Z
- [ PASS ] [WorkyOne] Formatează număr internațional +40 în 0748_892_937 — 19:07:16Z
- [ PASS ] [WorkyOne] Formatează prefix 0040 în 0748_892_937 — 19:07:16Z
- [ PASS ] [WorkyOne] Convertește cm³ în cmc conform regulilor OLX — 19:07:16Z
- [ PASS ] [WorkyOne] Elimină linkurile web externe (interzise pe OLX) — 19:07:16Z
- [ PASS ] [WorkyOne] Formatează numărul de telefon în formatul aprobat OLX — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Sedan -> Berlina — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Touring -> Break — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Crossover -> SUV — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Negru Metalizat -> Negru — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Gri Daytona -> Gri — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Diesel corect — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Hybrid -> Hibrid — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Automata -> automat — 19:07:16Z
- [ PASS ] [WorkyTwo] Mapează Manuala -> manual — 19:07:16Z
- [ PASS ] [WorkyTwo] Descrierea completă OLX conține amprenta de inventar — 19:07:16Z
- [ PASS ] [WorkyTwo] Lungimea descrierii respectă limita maximă OLX de 9000 caractere — 19:07:16Z
- [ PASS ] [WorkyTwo] Extrage stockNumber standard RXM-7412 — 19:07:17Z
- [ PASS ] [WorkyTwo] Extrage VIN standard WBA5D31080D741216 — 19:07:17Z
- [ PASS ] [WorkyTwo] Extrage stockNumber cu diacritice românești (ID Referință) — 19:07:17Z
- [ PASS ] [WorkyTwo] Extrage VIN cu diacritice (Serie Șasiu) — 19:07:17Z
- [ PASS ] [WorkyTwo] Extrage tag inline #RXM-8890 din text liber — 19:07:17Z
- [ PASS ] [WorkyTwo] Extrage VIN fără etichetă completă — 19:07:17Z
- [ PASS ] [WorkyTwo] Nu extrage stockNumber pe text fără legătură (zero false-positives) — 19:07:17Z
- [ PASS ] [WorkyTwo] Nu extrage VIN pe text fără legătură — 19:07:17Z
- [ PASS ] [WorkyThree] Extrage OLX ID din URL standard web — 19:07:17Z
- [ PASS ] [WorkyThree] Extrage OLX ID din URL mobil — 19:07:17Z
- [ PASS ] [WorkyThree] Extrage OLX ID numeric cu prefix cratimă — 19:07:17Z
- [ PASS ] [WorkyThree] Prioritate 1: Potrivire deterministă după Stock Number — 19:07:17Z
- [ PASS ] [WorkyThree] Mașina identificată corect după Stock Number — 19:07:17Z
- [ PASS ] [WorkyThree] Prioritate 2: Potrivire după VIN când tagul lipsește — 19:07:17Z
- [ PASS ] [WorkyThree] Mașina identificată corect după VIN — 19:07:17Z
- [ PASS ] [WorkyThree] Prioritate 3: Potrivire după OLX ID deja înregistrat — 19:07:17Z
- [ PASS ] [WorkyThree] Mașina Audi asociată corect prin OLX ID — 19:07:17Z
- [ PASS ] [WorkyThree] Respinge anunțuri fără identificator comun (matchType: none) — 19:07:17Z
- [ PASS ] [WorkyThree] matchedCar este null pe anunț extern — 19:07:17Z
- [ PASS ] [WorkyFour] Reconcilierea în lot identifică exact cele 2 mașini din parc — 19:07:17Z
- [ PASS ] [WorkyFour] Setează corect flagul wasUnlinked pentru mașina legată nou — 19:07:17Z
- [ PASS ] [WorkyFour] Detectează discrepanță critică: Vândută în showroom dar activă pe OLX — 19:07:18Z
- [ PASS ] [WorkyFour] Detectează discrepanță: În stoc fizic dar expirată pe OLX — 19:07:18Z
- [ PASS ] [WorkyFour] Nicio discrepanță când mașina în stoc este activă pe OLX — 19:07:18Z
- [ PASS ] [WorkyFour] Nicio discrepanță falsă când mașina nu este încă legată la OLX — 19:07:18Z
- [ PASS ] [WorkyFour] Cooldown Guard activ în perioada de așteptare — 19:07:18Z
- [ PASS ] [WorkyFour] Calculează corect minutele rămase din cooldown — 19:07:18Z
- [ PASS ] [WorkyFour] Invariant TVA 21%: Mențiune clară de TVA deductibil 21% — 19:07:18Z
- [ PASS ] [WorkyFour] Invariant Terminologie: Strict „Cont de Garantie” (prezent în descriere) — 19:07:18Z
- [ PASS ] [WorkyFour] Invariant Securitate: Eliminare completă a termenului „escrow” — 19:07:18Z
- [ PASS ] [WorkyFour] Invariant Securitate: Fără „cont fiduciar” — 19:07:18Z

### Vulnerabilități Descoperite & Patch-uri Aplicate (`WorkyThree`):
1. **Sanitizare Linkuri Web Externe pe OLX:** Adăugat regex de curățare a URL-urilor `http://` și `www.` în `sanitizeForOlx` pentru conformitate strictă cu politicile anti-spam OLX.
2. **Extragere OLX ID Numeric cu cratimă:** Îmbunătățit regex-ul din `extractOlxId` (`src/utils/helpers.ts`) pentru a captura ID-urile numerice precedate de cratimă (ex: `-9182371.html`).


### Test Execution Trace (QA Agentic Team — Wave 2 Deep Audit)
- [ PASS ] [WorkyOne] telemetryService.ts API Surface — Toate cele 3 funcții cheie sunt exportate — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyTwo] Traffic Source Detection Matrix — QR window sticker, UTMs și Referrers acoperite — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyTwo] Session Storage Guard — Deduplicare tab client activă pentru prevenire spam pe re-render — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyOne] VehicleDetailModal Telemetry Seam — Invocare automată pe montare modal + filtrare sesiune admin — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyThree] PostgreSQL Schema & Composite Indexes — Tabelă time-series + contor atomic configurate — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyTwo] recordVehicleView Parameter Guard — Validare de frontieră sigură împotriva datelor corupte — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyTwo] getTopViewedVehicles Multi-Horizon Routing — Suport all, 7d, month, today fără excepții — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyThree] server/api.mjs Micro-API Dispatch — Ingestie debounced și endpoint de agregare active — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyFour] GDPR Anonymization Architecture — Zero IP-uri stocate în clar — conformitate strictă cu standardul holding — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyFour] Holding Core Compliance — 21% TVA, Cont de Garanție și Netcup VPS 152.53.158.65 validate — 2026-10-29 22:48:43Z
- [ PASS ] [WorkyOne] Vehicle Model & SWR Synchronization — Interfață TypeScript aliniată cu PostgreSQL ORM mapping — 2026-10-29 22:48:43Z

### Test Execution Trace (QA Agentic Team — Wave 3 Deep Audit)
- [ PASS ] [WorkyOne] TopViewedVehiclesWidget Surface & API Binding — Componentă activă și conectată la serviciul de telemetrie — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyTwo] Legacy Mock Cleanse — Eliminare definitivă mock TikTok views din DealerAnalyticsDashboard — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyTwo] Timeframe Synchronization Engine — Sincronizare reactivă pe orizonturile today, 7d, 30d, all — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyThree] View-to-Lead Metric Formula — Rată de conversie calculată per mașină și agregată pe showroom — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyThree] Overpriced Stock Risk Engine — Detecție automată stoc blocat cu vizualizări multe și conversie zero — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyOne] DealPriceModal 1-Click Bridge — Deschidere directă a negociatorului de preț la apăsarea alertei — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyFour] Dual-Theme WCAG AA Compliance — Contrast ridicat pe font Plus Jakarta Sans și tokeni adaptivi — 2026-10-30 02:01:53Z
- [ PASS ] [WorkyFour] Holding Core Compliance — 21% TVA, Cont de Garanție și Netcup VPS 152.53.158.65 validate — 2026-10-30 02:01:53Z

### Test Execution Trace (QA Agentic Team — Wave 2 Deep Audit)
- [ PASS ] [WorkyOne] telemetryService.ts API Surface — Toate cele 3 funcții cheie sunt exportate — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] Traffic Source Detection Matrix — QR window sticker, UTMs și Referrers acoperite — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] Session Storage Guard — Deduplicare tab client activă pentru prevenire spam pe re-render — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyOne] VehicleDetailModal Telemetry Seam — Invocare automată pe montare modal + filtrare sesiune admin — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyThree] PostgreSQL Schema & Composite Indexes — Tabelă time-series + contor atomic configurate — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] recordVehicleView Parameter Guard — Validare de frontieră sigură împotriva datelor corupte — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] getTopViewedVehicles Multi-Horizon Routing — Suport all, 7d, month, today fără excepții — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyThree] server/api.mjs Micro-API Dispatch — Ingestie debounced și endpoint de agregare active — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyFour] GDPR Anonymization Architecture — Zero IP-uri stocate în clar — conformitate strictă cu standardul holding — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyFour] Holding Core Compliance — 21% TVA, Cont de Garanție și Netcup VPS 152.53.158.65 validate — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyOne] Vehicle Model & SWR Synchronization — Interfață TypeScript aliniată cu PostgreSQL ORM mapping — 2026-10-30 02:01:58Z

### Test Execution Trace (QA Agentic Team — Wave 3 Deep Audit)
- [ PASS ] [WorkyOne] TopViewedVehiclesWidget Surface & API Binding — Componentă activă și conectată la serviciul de telemetrie — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] Legacy Mock Cleanse — Eliminare definitivă mock TikTok views din DealerAnalyticsDashboard — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyTwo] Timeframe Synchronization Engine — Sincronizare reactivă pe orizonturile today, 7d, 30d, all — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyThree] View-to-Lead Metric Formula — Rată de conversie calculată per mașină și agregată pe showroom — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyThree] Overpriced Stock Risk Engine — Detecție automată stoc blocat cu vizualizări multe și conversie zero — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyOne] DealPriceModal 1-Click Bridge — Deschidere directă a negociatorului de preț la apăsarea alertei — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyFour] Dual-Theme WCAG AA Compliance — Contrast ridicat pe font Plus Jakarta Sans și tokeni adaptivi — 2026-10-30 02:01:58Z
- [ PASS ] [WorkyFour] Holding Core Compliance — 21% TVA, Cont de Garanție și Netcup VPS 152.53.158.65 validate — 2026-10-30 02:01:58Z
