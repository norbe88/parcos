# ParcOS — Turnkey Multi-Tenant Dealership Operating System
> **Version:** 2.4-Production • **Holding Platform:** CARVANA SRL  
> **Infrastructure:** Coolify Self-Hosted • Port 3000 • Netcup VPS (`152.53.158.65`)

---

## 🚀 Overview

**ParcOS** este platforma software completă (SaaS) dedicată parcurilor auto din România, proiectată pentru a transforma orice parc fizic într-un **Showroom Autonom de Ultimă Generație**.

Fiecare dealer partener beneficiază de un spațiu dedicat și izolat, cu showroom web propriu (temă customizată, logo, stoc dedicat), unelte de scanare acte cu AI și automatizări pentru vânzări rapide.

### 🌟 Funcționalități Cheie:
1. **Showroom Autonom Multi-Tenant:**
   - Rutare inteligentă pe bază de domeniu/subdomeniu (`rxmautomobile.ro`, `mpiauto.ro`, `topautotransilvania.ro` sau `*.parcos.ro`).
   - Teme dinamice adaptate specificului fiecărui parc:
     - 👑 **Obsidian Gold** — Dark luxury pentru parcuri sport și premium (RXM Automobile Flagship).
     - ⚪ **Clean White** — Estetică aerisită, modernă și luminoasă (MPI Auto Cluj).
     - 🔵 **Midnight Blue** — Albastru metalizat pentru dealeri corporate și flote (Top Auto).
   - Ordine modulară configurabilă a secțiunilor (Hero Spotlight, Catalog, Finanțare, Buy-Back, Comandă, Recenzii).
2. **Scanner Inteligent CIV & Talon (OCR AI):**
   - Fotografiezi actele mașinii direct de pe telefon.
   - Extragere automată: VIN (Serie Șasiu), An Fabricație, Cilindree (cmc), Putere (kW/CP), Normă Poluare (Euro 6 etc.).
3. **Oferte WhatsApp & Cont de Garanție:**
   - Compunere instantanee a ofertelor pentru clienți în format text/PDF.
   - Opțiune integrată pentru **Garanție de Rezervare / Participare** la Banca Transilvania.
4. **Sincronizare Delta cu Marketplace-uri (OLX & Autovit):**
   - Monitorizează automat anunțurile active și semnalează discrepanțele de preț sau mașinile vândute.
5. **Showroom Mail Hub & Lead Pool:**
   - Inbox partajat cu preluare a lead-urilor la 1-click pentru consilieri (Robert, Mădălina etc.).
   - Suport PWA și notificări Web Push.
6. **Onboarding Instant prin CUI ANAF v9:**
   - Interogare automată a bazei de date ANAF pentru autofill-ul datelor fiscale ale parcului.

---

## 🏛️ Invariante de Sistem (Holding Rules)

- **Strict 21% TVA:** Toate calculele financiare și afișările de prețuri folosesc strict `VAT_RATE = 0.21` (TVA deductibil 21%).
- **Terminologie Garanții:** Strict **„Cont de Garanție”** sau **„Garanție de Rezervare/Participare”** la Banca Transilvania (niciodată „escrow”).
- **Verificare carVertical:** Strict formularea **„Verificare carVertical disponibilă în platformă”** (fără afirmații false de gratuitate).
- **Integritate Hosting:** Găzduit pe Netcup VPS (`152.53.158.65`), containerizat sub Coolify (Port 3000).

---

## 🚢 Structură & Deploy în Coolify

Aplicația este împachetată într-un singur container Docker ultra-eficient (multi-stage Node 20 Alpine):
- **Stage 1 (Builder):** Compilează TypeScript și bundle-ul Vite (`dist/`).
- **Stage 2 (Runner):** Server nativ Node.js HTTP (`server/api.mjs`) care servește:
  - Rutele `/api/*` (dealers, vehicles, tenant config, ANAF lookup)
  - Fișierele statice din `dist/` (JS, CSS, imagini) cu caching optimizat
  - Fallback SPA pe `dist/index.html` pentru rutele publice și administrative.

### Configurare Coolify:
- **Build pack:** `Dockerfile`
- **Ports Exposes:** `3000`
- **Domain:** `app.parcos.ro`, `parcos.ro`, `*.parcos.ro`
- **Deploy:** Automat prin Webhook la fiecare `git push origin main`.

### Variabile de Mediu Principale (`.env`):
```ini
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://parcos_admin:parola@parcos-db:5432/parcos_production
ADMIN_API_KEY=cheie_securizata_minim_32_caractere
GEMINI_API_KEY=cheie_gemini_pentru_ocr_si_descrieri
MEDIA_STORAGE_PATH=/data/parcos/cars
```

---

## 🛠️ Comenzi de Dezvoltare Locală

```bash
# Instalare dependențe
npm install

# Verificare compilare TypeScript (0 erori obligatoriu)
npx tsc --noEmit

# Rulare Frontend (Vite)
npm run dev

# Rulare Backend API (Node.js)
npm run api:dev

# Build de Producție
npm run build

# Onboarding Dealer Nou via CLI
node scripts/onboard_dealer.cjs --slug mpi_auto --name "MPI Auto Cluj" --domain mpiauto.ro --theme clean_white

# Import Stoc Auto în Lot (Bulk)
node scripts/bulk_inventory_importer.cjs --dealer mpi_auto --input staged_imports/mpi_auto/raw_inventory.json
```

---

## 📄 Licență & Proprietate
Proprietatea intelectuală aparține exclusiv **CARVANA SRL Holding**. Toate drepturile rezervate.
