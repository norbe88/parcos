# 📘 Ghid Operațional & Protocol de Replicare Dealer OS
> **Data & Versiune:** 2026-10-15 • v2.0 (Dual-Theme & Multi-Platform Sync)  
> **Arhitectură:** Single-Tenant Dedicated Instance per Parc Auto  
> **Target:** Holding Carvana SRL • AutoLicit Ecosystem  

---

## 1. Filosofia Arhitecturii: De ce Instanțe Dedicated?

Fiecare parc auto partener înrolat în ecosistem primește **propria sa instanță autonomă** (Showroom Suite).
- **Date Izolate:** Stocul, prețurile reale de achiziție, marjele comerciale, contractele de vânzare și contactele clienților sunt 100% confidențiale și accesibile doar dealerului respectiv.
- **Brand & Domeniu Propriu:** Fiecare parc rulează pe domeniul său (ex: `rxmautomobile.ro`, `mpiauto.ro`), cu sigla proprie, adresa fizică din contracte și conturile bancare proprii (IBAN RON / EUR).
- **Conectare în Amonte:** Toate suitele pot transmite opțional stocul către marketplace-ul central **AutoLicit.ro** și generează feed-uri automate pentru **Meta (Facebook/Instagram)** și **OLX / Autovit**.

---

## 2. Checklist Replicare Suită pentru un Dealer Nou (15 Minute)

Când semnăm cu un nou parc auto, parcurge următorii 6 pași standardizați:

```
[Pas 1: Clonare Repo] ➔ [Pas 2: Configurare dealer.ts] ➔ [Pas 3: Siglă & Branding] ➔ 
[Pas 4: Inventar Inițial] ➔ [Pas 5: Conectare Feed-uri] ➔ [Pas 6: Deploy VPS]
```

### Pasul 1: Clonare Repository
```bash
# Clonează repo-ul de bază într-un director nou dedicat dealerului
git clone https://github.com/norbe88/rxm-automobile.git dealer-nume-parc
cd dealer-nume-parc
npm install
```

### Pasul 2: Configurare Date Firmă (`src/db/dealer.ts`)
Deschide [`src/db/dealer.ts`](file:///src/db/dealer.ts) și actualizează obiectul `SEED_DEALER` cu datele reale ale noului partener:

```typescript
export const SEED_DEALER: DealerProfile = {
  name: "NUME PARC AUTO S.R.L.",
  cui: "RO12345678",
  regCom: "J12/1234/2021",
  shareCapital: "500 RON",
  legalAddress: "Mun. Cluj-Napoca, str. Exemplu nr. 10, jud. Cluj",
  showroomAddress: "Calea Turzii nr. 150, Cluj-Napoca, jud. Cluj",
  serviceLocation: "jud. Cluj, loc. Cluj-Napoca",
  bankName: "Banca Transilvania", // sau BCR, ING, etc.
  ibanRon: "RO00 BTRL 0000 0000 0000 0000", // Cont de Garanție & Facturare RON
  ibanEur: "RO00 BTRL 0000 0000 0000 0001", // Cont EUR
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: "0740 000 000", // Număr apeluri vânzări
  phoneFinance: "0740 000 001", // Număr rate & finanțare
  whatsappNumber: "40740000000", // Fără semnul plus (+), cu prefix 40
  email: "contact@dealer.ro",
  googleMapsUrl: "https://maps.google.com/...",
  wazeUrl: "https://waze.com/ul?...",
  openingHours: "Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00",
  financingPartners: ["TBI Bank", "Banca Transilvania (BT Direct)", "Mogo"]
};
```

### Pasul 3: Identitate Vizuală (Logo & Meta Taguri)
1. Pune sigla dealerului în `public/images/logo.png` (format PNG transparent sau SVG).
2. În `index.html`:
   - Modifică `<title>` cu denumirea noului parc (ex: *MPI Auto — Autovehicule Rulate Cluj*).
   - Actualizează meta-descrierea și datele OpenGraph pentru previzualizările WhatsApp/Facebook.

### Pasul 4: Populare Inventar Inițial (`src/db/vehicles.ts`)
Există 3 modalități rapide:
- **Varianta A (Manuală cu Scanner CIV în Admin):** Angajatul parcului intră în `/admin`, apasă *„Adaugă Mașină Nouă”* și scanează CIV-ul sau cartea tehnică cu camera telefonului.
- **Varianta B (Import Automat din OLX/Site existent):** Rulează scriptul de import masiv:
  ```bash
  node scripts/dealers_bulk_scraper.cjs --dealer=<slug_dealer>
  ```
- **Varianta C (Editare Directă):** Populează fișierul `src/db/vehicles.ts` cu lista de mașini.

### Pasul 5: Conectare Canale Externe (OLX / Facebook)
1. Deschide Panoul Admin ➔ Apasă butonul albastru **„Feed-uri Stoc (Meta / Autovit)”**.
2. Copiază link-ul feed-ului XML: `https://<domeniu-dealer>/api/feeds/autovit-stock.xml` și lipește-l în contul de **OLX Pro / Autovit Pro** al dealerului (secțiunea *Import Automat*).
3. Copiază link-ul feed-ului CSV: `https://<domeniu-dealer>/api/feeds/meta-vehicles.csv` și adaugă-l în **Meta Business Commerce Manager** pentru catalogul Facebook/Instagram.

### Pasul 6: Verificare Strictă & Deploy
```bash
# 1. Verificare compilare și tipuri (obligatoriu 0 erori)
npx tsc --noEmit

# 2. Rulare suită QA automată
node scripts/qa_suite_verifier.cjs

# 3. Build producție
npm run build
```

---

## 3. Ghid de Utilizare Showroom (Pentru Echipa Dealerului)

Transmite acest mic ghid echipei de vânzări și contabilitate a dealerului:

### 🔑 Acces Panou Gestiune
- **URL Admin:** `https://<domeniu-dealer>/?dealer=<slug>#admin`
- **Parolă:** Codul PIN criptografic stabilit la predare.

### 📄 Scanner Buletine OCR & Emitere Acte de Vânzare (1-Click)
La finalizarea unei vânzări sau acordarea unui avans:
1. Din tabelul de mașini sau din cardul de Lead, apasă butonul **„Acte Vânzare”**.
2. Fă o poză buletinului clientului cu camera telefonului sau încarcă poza buletinului.
3. **Inteligența artificială completează instant:** Nume, CNP (validat cu cheie matematică oficială RO), Serie/Număr CI, Adresă completă, Județ și Oraș.
4. **Selectează documentul dorit:**
   - **Factură Proformă / Fiscală:** Comută între *Regimul Marjei (Art. 312)* sau *TVA 21% Deductibil*, respectiv *Avans Rezervare (500 €)* sau *Preț Integral*.
   - **Proces-Verbal de Predare-Primire:** Bifează numărul de chei predate și accesoriile fizice (trusă, roată de rezervă, CIV original).
   - **Certificat de Garanție:** Emite certificatul oficial de 1 An / 10.000 KM cu clauza obligatorie a reviziei în 7 zile la service autorizat RAR.
   - **Notă de Calcul Marjă:** Document justificativ intern pentru contabilitate (calculează automat TVA pe marjă conform Codului Fiscal).
5. Apasă **„Tipărește Document”** sau **„Exportă PDF”** — documentul iese perfect aliniat pe format A4.

### 🚗 Conducta CRM Lead Kanban
- Mutați lead-urile primite prin cele 5 stadii:  
  `1. Contact Nou` ➔ `2. Test-Drive Programat` ➔ `3. Dosar Finanțare` ➔ `4. Proformă Avans Emisă` ➔ `5. Vândut & Livrat`.
- Când mutați un lead la **Proformă Avans**, panoul vă întreabă dacă doriți să marcați mașina ca **„Rezervat”** în showroom printr-un singur click.
- Când mutați la **Vândut & Livrat**, mașina trece automat în arhiva de vehicule vândute.

### 💬 Punte Vânzări WhatsApp
- Pe fiecare rând de mașină din tabel, butonul verde de WhatsApp generează un mesaj complet cu titlul mașinii, prețul în euro, kilometrajul și linkul direct către fișa tehnică din showroom.

### 🪟 Fișe de Parbriz A4 cu QR Code Offline
- Pentru mașinile parcate în curtea showroom-ului, apasă pictograma de **QR Code** pe mașină.
- Generează o fișă A4 elegantă de pus în parbriz (Portrait sau Landscape) cu dotările mașinii și un QR code mare. Vizitatorii din parcare îl scanează cu telefonul duminica sau în afara orelor de program și văd instant galeria foto completă și calculatorul de rate.

---

## 4. Invariante Tehnice Obligatorii (CARVANA SRL Standard)

Orice suită replicată trebuie să respecte cu strictețe aceste 4 reguli:
1. **Strict 21% TVA:** În România, cota standard de TVA pentru vânzările auto este `VAT_RATE = 0.21` (Net = Brut / 1.21). Nu se folosește 19% sau alte cote vechi.
2. **Regimul Marjei (Art. 312):** Mașinile second-hand revândute fără TVA deductibil folosesc clauza oficială: *„Regimul marjei - bunuri second-hand”*. Pe factura fiscală este interzisă evidențierea separată a TVA-ului.
3. **Terminologie Garanții:** Se folosește exclusiv termenul **„Cont de Garanție”** sau **„Garanție de Rezervare”** (niciodată termenul englezesc „escrow”).
4. **Verificare Pre-Commit:** Niciun commit nu se livrează fără verificare `npx tsc --noEmit` curată.
