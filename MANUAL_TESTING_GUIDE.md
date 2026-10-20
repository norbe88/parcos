# 📋 GHID DE TESTARE MANUALĂ & MULTI-DEVICE QUALITY ASSURANCE
## Platforma Showroom & Gestiune Flotă — RXM Automobile / AutoLicit.RO
> **Versiune Document:** 1.0.0 · Octombrie 2026  
> **Status Build:** `npx tsc --noEmit` **PASSED (0 erori)**  
> **Target Devices:** Desktop Full HD, Laptopuri Parc Auto (1366×768 / 1280×720), Tablete & Smartphone-uri Touch  
> **Parolă Acces Panou Admin:** `Luna.RXM`

---

## 🏆 1. REZULTATE AUDIT TEHNIC, LIGHTHOUSE & ALINIERE MULTI-DEVICE

Înainte de redactarea scenariilor de testare, platforma a fost auditată automat pe mașina de calcul **Zety** prin **Lighthouse Audit** și **Chrome DevTools MCP** pentru a garanta performanța și ergonomia pe orice ecran:

### 📊 Scoruri Lighthouse Obținute:
| Categorie | Scor | Status | Observații |
| :--- | :---: | :---: | :--- |
| **SEO** | **100 / 100** | 🟢 Maxim | Meta-taguri, sitemap dinamic, OpenGraph, JSON-LD schema complete |
| **Agentic Browsing** | **100 / 100** | 🟢 Maxim | Identificatori unici semantic HTML pentru roboți & asistenți AI |
| **Accessibility (WCAG AA)** | **97 / 100** | 🟢 Excelent | Contraste conforme, etichete vocale armonizate conform WCAG 2.5.3 |
| **Best Practices** | **96 / 100** | 🟢 Excelent | Zero erori de consolă (`fetchpriority` curățat pe imagini LCP) |

---

### 💻 Optimizări Speciale pentru Laptopurile Vechi din Parcul Auto:
Pentru colegii din parcul auto care operează pe laptopuri cu rezoluții joase (**1366×768**, **1280×720** sau monitoare cu scalare Windows setată la 125%–150%):

1. **Coloană de Acțiuni STICKY RIGHT în Tabelul Admin:**
   - La rezoluții înguste, tabelul poate fi derulat orizontal, dar coloana **`Toate Acțiunile`** rămâne **fixată și blocată pe marginea din dreapta** (`sticky right-0 bg-[#121215] z-10 border-l border-white/10`).
   - Operatorul **nu trebuie să caute butoanele prin scroll orizontal** — butoanele de *Detalii*, *Ofertă*, *Parbriz*, *Acte*, *Audit* și *Arhivare* sunt mereu vizibile!
2. **Comutator Rapid de Vizualizare:**
   - **Vedere Carduri Executive:** Ideală pentru vizualizare foto, recunoaștere rapidă din teren și ecrane tactile.
   - **Vedere Tabel Compact:** Densitate maximă de informație pe ecrane de laptop de 14" sau 15.6".
3. **Plafonare Înălțime Modale & Scroll Intern:**
   - Toate ferestrele de dialog și sertarele (Drawers) au `max-h-[85dvh]` și `overflow-y-auto`. Conținutul nu este tăiat de bara de Start a Windows-ului și nu iese din ecran.
4. **Touch & Click Targets Generoase (Min. 44×44px):**
   - Butoanele de status, selecție și închidere au zone de atingere ample (`min-h-[36px]` până la `min-h-[44px] touch-manipulation`) pentru a preveni click-urile greșite cu touchpad-ul sau mouse-ul de birou.

---

## 🧪 2. SCENARII DE TESTARE MANUALĂ PAS-CU-PAS

### 📍 Pasul 0: Pornirea Aplicației pe Laptop / Desktop
1. Deschide un terminal în directorul proiectului și rulează:
   ```powershell
   npm run dev
   ```
2. Deschide în Google Chrome sau Microsoft Edge adresa locală indicată în terminal:
   - Showroom Public: `http://localhost:3001/` (sau `http://localhost:5173/`)
   - Panou Gestiune Parc: `http://localhost:3001/#admin`

---

### 🔑 Testul 1: Autentificarea în Portalul de Gestiune (Admin Gate)
* **Obiectiv:** Verificarea protecției criptografice a datelor confidențiale de parc (prețuri de achiziție, cheltuieli, marje, note).
* **Pași de urmat:**
  1. Accesează `http://localhost:3001/#admin` (sau derulează în footerul showroom-ului și apasă pe copyright).
  2. Apare ecranul întunecat cu lacăt: *„Zonă Securizată • RXM AUTO MOBILE — Portal Gestiune Flotă”*.
  3. Încearcă o parolă greșită (ex: `1234`) -> apare eroarea: *„Parolă incorectă. Accesul este restricționat...”*.
  4. Tastează parola autorizată: **`Luna.RXM`** (respectă majusculele și punctul).
  5. Apasă `Autentificare în Panou` (sau tasta `Enter`).
* **Rezultat Așteptat:**
  - Apare notificarea toast aurie: *„🔓 Autentificare reușită! Bine ați venit în panoul de gestiune.”*
  - Se încarcă instant consola cu cele două tab-uri superioare: **Vehicule în Parc** și **Sumar Financiar**.

---

### ⏱ Testul 2: Perioada de Grație de 10s la Vânzare (10s Undo Grace)
* **Obiectiv:** Prevenirea mutării accidentale a unei mașini în arhivă dacă operatorul apasă greșit pe statusul `Vândut`.
* **Pași de urmat:**
  1. În lista de mașini active, alege orice mașină aflată `În Stoc`.
  2. Apasă pe butonul sau pastila de status **`Vândut`**.
  3. **Verificare vizuală imediată:**
     - Pe cardul/rândul mașinii se activează overlay-ul negru-auriu cu animație.
     - Cronometrul numără descrescător de la `10s` către `0s` cu o bară de progres continuă.
     - Apare mesajul: *„Marcat ca Vândut • Se mută în Arhivă în Xs”*.
  4. **Scenariul 2.A (Anulare / Undo):**
     - Înainte de expirarea celor 10 secunde, apasă butonul **`✕ Anulează (Undo)`**.
     - *Rezultat:* Overlay-ul dispare instant, mașina rămâne în stoc cu statusul neschimbat, iar toast-ul confirmă: *„✓ Modificarea a fost anulată. Mașina rămâne în stoc.”*
  5. **Scenariul 2.B (Confirmare Imediată):**
     - Apasă din nou pe `Vândut`, dar de această dată apasă butonul auriu **`Confirmă Acum ➔`**.
     - *Rezultat:* Mașina este mutată instant în secțiunea de Arhivă de la baza paginii, fără să mai aștepți cele 10 secunde.

---

### 📁 Testul 3: Arhiva Autovehiculelor Vândute & Reactivare în Stoc
* **Obiectiv:** Asigurarea trasabilității financiare a mașinilor livrate și posibilitatea repunerii rapide în stoc (ex: contract căzut, refuz leasing).
* **Pași de urmat:**
  1. În Portalul de Gestiune, derulează în josul paginii până la secțiunea **`📁 Arhivă Autovehicule Vândute`**.
  2. Dă click pe antetul arhivei pentru a o extinde dacă este pliată.
  3. **Verificare Panou Financiar Arhivă:**
     - *Cifră de Afaceri Totală:* Suma prețurilor de vânzare încasate.
     - *Cost Total Achiziții:* Totalul prețurilor de cumpărare.
     - *Cheltuieli Service & Regie:* Suma cheltuielilor înregistrate.
     - *Profit Net Realizat (TVA 21%):* Calculat corect conform regulii fiscale de 21%.
  4. Găsește mașina mutată la Testul 2.
  5. Pe rândul ei, apasă butonul verde **`Reactivează`**.
* **Rezultat Așteptat:**
  - Mașina dispare din tabelul de arhivă.
  - Reapare sus în lista de stoc activ cu statusul `În Stoc`.
  - Toast-ul afișează: *„✓ Mașina [Marcă Model] a fost reactivată și repusă în stoc!”*

---

### ⏳ Testul 4: Indicatori de Vechime (Aging Badges) & Sortare Stoc
* **Obiectiv:** Identificarea vizuală instantanee a mașinilor care stau de mult timp în parc și necesită promoții sau reduceri de preț.
* **Pași de urmat:**
  1. Observă badge-urile de lângă codul de stoc (`#CVN-XXXXX`) pe fiecare mașină:
     - 🟢 **Proaspăt (0-14 zile):** Culoare verde deschis.
     - 🔵 **Activ (15-45 zile):** Culoare albastră.
     - 🟡 **Stoc Lent (46-90 zile):** Culoare galben/portocaliu.
     - 🔴 **Stoc Blocat (>90 zile):** Culoare roșie cu efect de clipire pulsantă (`animate-pulse`).
  2. Mergi în bara superioară la dropdown-ul de sortare (lângă căutare):
     - Selectează **`⏳ Vechime: Stoc Lent (Aging ↓)`**.
     - *Rezultat:* Mașinile cu cele mai multe zile în stoc sunt afișate primele.
     - Selectează **`✨ Vechime: Recente (Aging ↑)`**.
     - *Rezultat:* Mașinile intrate recent în parc urcă primele în listă.

---

### 🛡️ Testul 5: Filtrele Rapide de Guvernanță Dealer (1-Click)
* **Obiectiv:** Alertarea administratorului cu privire la probleme operaționale și birocratice.
* **Pași de urmat:**
  1. În bara de sus, sub rândul de căutare, observă cele 4 butoane cu iconița de scut **`Guvernanță:`**:
     - **`Numere Roșii Expiră <7z`:** Click -> filtrează exclusiv mașinile ale căror numere provizorii expiră în mai puțin de o săptămână (previne amenzi rutiere la probe de drum).
     - **`Fără Preț Achiziție`:** Click -> listează mașinile unde nu a fost introdus costul de intrare (pentru a putea calcula marja).
     - **`Discrepanță OLX`:** Click -> listează mașinile vândute în parc dar care au rămas active pe OLX sau invers.
     - **`Stoc Lent >45z`:** Click -> filtrează instant vehiculele ce depășesc 45 de zile pe stoc.
  2. Apasă pe butonul **`✕ Resetează`** din dreapta filtrelor.
* **Rezultat Așteptat:** Lista revine imediat la afișarea completă a parcului auto.

---

### 📜 Testul 6: Drawer Lateral de Audit & Note Administrative Interne
* **Obiectiv:** Păstrarea istoricului tehnic/operațional intern fără a expune vreodată aceste date publicului sau clienților (Conformitate GDPR & Secret Comercial).
* **Pași de urmat:**
  1. Pe oricare vehicul din tabel sau carduri, apasă butonul **`Audit`** (sau `Audit & Note`).
  2. Din partea dreaptă se deschide un sertar lateral (*VehicleAuditDrawer*).
  3. În secțiunea **Note Administrative Interne**:
     - Scrie o notă de test (ex: *„Schimbat plăcuțe frână și curea accesorii pe 15 Octombrie. Clientul Popescu interesat.”*).
     - Apasă butonul auriu **`Salvează Nota`**.
     - Toast-ul confirmă salvarea.
  4. Închide sertarul apăsând pe `✕` sau pe fundalul întunecat.
  5. Redeschide sertarul pentru aceeași mașină -> nota este salvată și textul este intact.
  6. **Verificare Secret Comercial (Pen-test & GDPR Check):**
     - Deschide un tab nou în modul incognito pe `http://localhost:3001/` (fără a te autentifica ca admin).
     - Deschide aceeași mașină din showroom-ul public.
     - *Verificare:* Câmpul de note interne, registrul de cheltuieli, marjele și jurnalul de audit **NU există în DOM și nu sunt expuse nicăieri** clienților.

---

### 📄 Testul 7: Acte Vânzare, Contracte & Scaner OCR Buletin
* **Obiectiv:** Automatizarea întocmirii contractului de vânzare-cumpărare și a procesului-verbal de predare-primire.
* **Pași de urmat:**
  1. Pe rândul oricărei mașini, apasă butonul **`Acte`** (sau `Acte PDF`).
  2. Se deschide fereastra modală cu contractele oficiale RXM Automobile.
  3. **Verificare Garanție 10.000 KM:**
     - Mergi la tab-ul *Certificat de Garanție* sau *Proces-Verbal*.
     - Verifică clauza de garanție: este setată strict la **10.000 km** (sau 12 luni).
  4. **Testare Scaner OCR Buletin:**
     - Apasă pe funcția de scanare/încărcare buletin client.
     - Încarcă o fotografie clară cu o carte de identitate românească.
     - *Rezultat:* Sistemul extrage automat Nume, Prenume, CNP, Serie/Număr și Domiciliu, completând automat toate câmpurile cumpărătorului fără tastare manuală.
  5. Apasă pe butonul de descărcare/printare PDF -> documentul A4 se generează curat și aliniat.

---

### 🏷️ Testul 8: Fișă de Parbriz A4 cu Cod QR (Window Sticker)
* **Obiectiv:** Pregătirea rapidă a afișului A4 pentru mașina expusă fizic în curte.
* **Pași de urmat:**
  1. Apasă pe butonul **`Parbriz`** din rândul mașinii.
  2. Se deschide fișa de parbriz gata de printat:
     - Verifică prețul mare cu TVA inclus.
     - Verifică cele 6 specificații esențiale (An, Km, Motorizare, Transmisie etc.).
     - Verifică dacă codul QR este generat și trimite pe telefonul mobil direct pe pagina mașinii.
  3. Apasă `Printează Fișa A4` -> dialogul de print al browserului se deschide pre-formatat pentru o singură pagină A4 portrait.

---

## 💡 3. SFATURI UTILE PENTRU PERSONALUL DIN PARCUL AUTO (LAPTOPURI VECHI)

1. **Ajustare Nivel de Zoom:**
   - Dacă laptopul are un ecran mic (14") și elementele par prea mari din cauza scalării Windows-ului la 125%, apasă tastele:
     - `Ctrl` și `-` (Minus) pentru a seta zoom-ul browserului la **90%** sau **80%**.
     - `Ctrl` și `0` (Zero) pentru a reveni la zoom-ul standard de 100%.
2. **Comutarea pe Tabel vs. Carduri:**
   - Când verifici multe mașini rapid (prețuri, status, expirare numere roșii), folosește **`Tabel`**.
   - Când încarci poze sau prezinți mașina unui client în showroom, comută pe **`Carduri`**.
3. **Căutare după orice detaliu:**
   - Bara de căutare găsește mașina instant după ultimele 6 cifre din VIN, codul de stoc (ex: `12`), marcă sau model.
