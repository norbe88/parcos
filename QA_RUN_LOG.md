# QA AGENTIC TEAM RUN LOG — RXM AUTOMOBILE

> **Sesiune QA:** 2026-10-14 08:12:00
> **Lead QA Architect (Orchi):** Claude Sonnet 4.6 (Thinking)
> **Worker Pool (Worky):** WorkyOne (Static Inspection), WorkyTwo (Test Suite), WorkyThree (Patch Integrator), WorkyFour (Invariants Auditor)
> **Platformă Țintă:** HP ZBook Workstation (Zety / `zbook-norby`)

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
