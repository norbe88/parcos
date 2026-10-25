# CARVANA SRL — Holding AI Keys Pool & DLP Architecture
> **Data & Ora:** 2026-10-25 12:15:00 EEST  
> **Noduri Țintă:** Toate nodurile holdingului (Desy, Zety, Lapy) // Modul ParcOS & RXM Showroom  
> **Status:** 🟢 Activ & Validat 100% (GDPR DPA Tier 1 Paid)

---

## 1. Context & Standard de Conformitate GDPR Tier 1

În urma suspendării conturilor personale de dezvoltare de către Google Trust & Safety, infrastructura centrală CARVANA SRL a trecut exclusiv pe **conturi oficiale de holding pe Tier 1 Plătit**:
- **Acord DPA (Data Processing Addendum):** Activ.
- **Zero Antrenare pe Date Clienți:** Google Cloud AI nu reține și nu antrenează modele pe datele transmise (documente auto, acte de identitate, buletine).
- **Proiecte Active în Pool:**
  1. `AutoLicit-2`
  2. `silentx2z`

---

## 2. Pooling de Chei & Load Balancing Automat (T01)

### 2.1. Configurare Mediu (`.env`)
Cheile nu sunt hardcodate în codul sursă. În fișierul `.env` al fiecărui nod de calcul, se configurează pool-ul de chei sub formă de listă separată prin virgulă:

```env
GEMINI_API_KEY="<HOLDING_KEY_PROJECT_1>,<HOLDING_KEY_PROJECT_2>"
```

### 2.2. Algoritmul de Load-Balancing (Round-Robin)
În `server/api.mjs` și `vite.config.ts`, funcția `getResolvedGeminiKeys()` / `getDevGeminiKeys()` implementează rotația circulară la fiecare cerere:
- Cererea *N*: începe cu cheia `AutoLicit-2`.
- Cererea *N+1*: începe cu cheia `silentx2z`.
- În cazul în care o cheie întâmpină `HTTP 429` (Quota temporară), motorul trece automat pe următoarea cheie din pool (Failover Transparent).

---

## 3. Regula „Backend-as-a-Proxy” (Zero Direct Key Exposure) (T02)

Niciun client (browser, aplicație mobilă, script de dealer sau utilizator extern) nu are acces direct la cheia Google Gemini API.

### Canale Autorizate ParcOS:
1. **Scanare Talon / Carte RAR (CIV):**
   `POST /api/parcos/vehicles/scan-civ`
2. **Scanare Buletin / Act de Identitate Românesc:**
   `POST /api/parcos/clients/scan-id`
3. **Curățare & Sanitize Descriere Comercială Stoc:**
   `POST /api/parcos/ai/sanitize-description`

Fiecare rută:
- Validează sesiunea și apartenența la tenant (`X-Tenant-Id` + antet de autentificare).
- Înregistrează consumul în cota tenantului.
- Interoghează modelul primar `gemini-3.8-flash`.
- Livrează un răspuns JSON strict către client.

---

## 4. Circuit-Breaker & Rate Limiting per Tenant (T03)

### 4.1. Limite Stricte per Tenant:
- **Fereastră 1 Minut:** Maximum **15 cereri / minut** per tenant.
- **Fereastră 24 Ore:** Maximum **100 cereri / zi** per tenant.
- **Răspuns la depășire:** `HTTP 429 Too Many Requests` însoțit de antetele `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0` și flagul `manualFallback: true`.

### 4.2. Circuit-Breaker Anti-Flooding:
- La **3 erori consecutive de server (5xx sau erori de rețea)** de la Google, circuitul trece automat în starea `OPEN` pentru **30 de secunde**.
- În starea `OPEN`, toate cererile ulterioare sunt respinse local cu `HTTP 503 Service Unavailable` (`circuitOpen: true`), protejând resursele holdingului.
- După cooldown, prima cerere de probă (`HALF_OPEN`) decide restabilirea stării `CLOSED`.

---

## 5. Garda DLP Pre-Push Obligatorie (T04)

Înainte de orice operațiune de push pe Git (`git push` sau `/cp`), se rulează obligatoriu verificatorul DLP:

```bash
node scripts/security/verify_holding_secrets.cjs
```

### Verificări executate:
1. `.gitignore` conține regulile stricte de ignorare pentru `.env`, `.env.*`, `logs/`, `*.jsonl`, `transcripts/`.
2. Zero apariții de chei active sau compromise în fișierele de cod sursă (`src/`, `server/`, `scripts/`, `docs/`, `infra/`).
3. Zero apeluri directe către `generativelanguage.googleapis.com` sau antete `x-goog-api-key` în fișierele client din `src/`.
4. Git diff nu conține nicio cheie adăugată.

Dacă guard-ul returnează `exit code 1`, commit-ul sau push-ul este strict blocat până la remedierea cauzei.

---

## 6. Invariante Holding CARVANA SRL

1. **Strict 21% TVA:** `VAT_RATE = 0.21` în toate calculele și afișările.
2. **Terminologie Garanții:** Strict **„Cont de Garanție”** sau **„Garanție de Rezervare/Participare”** (interzis „escrow” sau „cont fiduciar”).
3. **Găzduire RXM Automobile:** Strict pe **Netcup VPS (`152.53.158.65`)**.
