# 🔬 RAPORT DE CERCETARE: AUTOMATIZARE POSTARE ANUNȚURI OLX & AUTOVIT PENTRU PARCOS
> **Data & Ora:** 2026-10-22 23:45:00  
> **Modul:** ParcOS SaaS — Modul Integrări & Multi-Listing Auto  
> **NotebookLM Brain:** `[CARVANA] RXM Automobile Showroom Brain` (`86c800a6-9429-46c4-a9a9-894d205df501`)  
> **Target:** Arhitectură Tehnică & Fezabilitate: Postare Automată OLX din ParcOS

---

## 🧭 1. REZUMAT EXECUTIV: ESTE FEZABIL? A MAI FĂCUT CINEVA ASTA?

**RĂSPUNS DIRECT:** **DA, este 100% fezabil**, iar ideea preluării sarcinii **în browserul local al dealerului (cache + sesiune activă)** este exact abordarea optimă („the sweet spot”) pentru a ocoli toate blocajele Cloudflare, CAPTCHA și 2FA care ucid roboții server-side.

În industria auto și a platformelor de clasificate, există **3 arhitecturi reale** utilizate în producție:

```mermaid
graph TD
    A[Dealer adaugă mașina în ParcOS] --> B{Metoda de Publicare OLX}
    
    B -->|Abordarea 1: Oficial Enterprise| C[OLX Partner API v2 & Autovit Feed]
    B -->|Abordarea 2: Hibrid Browser-Local| D[ParcOS Chrome Extension / Content Script]
    B -->|Abordarea 3: Agentic Local / MCP| E[Local MCP Tool via Chrome Debugging Port]

    C --> C1[Necesită aprobare OLX/Autovit, OAuth 2.0, costuri B2B]
    D --> D1[Recomandată: Zero blocaje, folosește cookie-urile dealerului, 1-Click Autofill]
    E --> E1[Pentru power-users: rulează headless local via CDP/Playwright]
```

---

## 📊 2. ANALIZA CELOR 3 METODE TEHNICE

### 🥇 METODA A: Extensia Chrome „ParcOS Auto-Poster” (Local Browser Cache & Session Injection)
> **Verdict:** **Cea mai fezabilă, rapidă de implementat și 100% imună la anti-bot / Cloudflare.**

#### Cum funcționează:
1. Dealerul instalează o extensie de Chrome lightweight (`ParcOS Publisher`).
2. Pe panoul de administrare ParcOS (`/admin/inventory`), lângă fiecare mașină sau la salvarea unei mașini noi, apare butonul: **`[🚀 Trimite pe OLX]`**.
3. Când dă click, ParcOS emite datele mașinii (JSON structurat: Marcă, Model, An, Km, VIN, Motorizare, Preț, Descriere curățată și link-uri CDN către poze).
4. Datele sunt transmise extensiei (prin `window.postMessage` sau `chrome.storage.local`).
5. Extensia deschide automat un tab nou: `https://www.olx.ro/ad/new/`.
6. Deoarece tab-ul se deschide în **Chrome-ul personal al dealerului**:
   - Dealerul este **deja logat pe OLX** (cookie-urile de sesiune sunt prezente).
   - IP-ul este IP-ul rezidențial / birou al dealerului (Digi, RDS, Vodafone) — Cloudflare Turnstile nu declanșează alarme anti-bot.
   - Amprenta TLS și Canvas Fingerprint sunt cele ale unui utilizator real uman.
7. Un **Content Script** al extensiei preia datele din cache și rulează secvența de completare automată (cu delay-uri naturale de 150-300ms între pași):
   - Selectează Categoria: *Auto, moto si ambarcatiuni ➔ Autoturisme*.
   - Populează dropdown-urile cascadă (Marcă ➔ așteaptă încărcarea modelelor ➔ Model ➔ An ➔ Combustibil ➔ Caroserie).
   - Descarcă pozele din ParcOS CDN ca `Blob`-uri în memorie și le injectează în `<input type="file">` folosind API-ul nativ `DataTransfer`:
     ```javascript
     const dt = new DataTransfer();
     for (const url of car.images) {
       const res = await fetch(url);
       const blob = await res.blob();
       dt.items.add(new File([blob], "car_photo.jpg", { type: blob.type }));
     }
     fileInput.files = dt.files;
     fileInput.dispatchEvent(new Event('change', { bubbles: true }));
     ```
   - Completează câmpul de Descriere formatat curat, cu toate dotările și contactul parcului.
   - Completează Prețul în Euro / RON și bifează „Preț negociabil” / „TVA deductibil”.
8. **Finalizare:** Formularul ajunge la pasul final. Extensia poate fie:
   - Să lase ecranul deschis cu butonul verde activ: *„Verifică și confirmă publicarea”* (dealerul dă un singur click — evită greșelile de credit).
   - Să declanșeze automat click pe `[Publică Anunțul]` dacă dealerul a bifat opțiunea de auto-submit.

---

### 🥈 METODA B: Calea Oficială OLX Partner API & Autovit Cross-Posting
> **Verdict:** **Standardul pe care îl folosesc Carmatik și ERP-urile mari, dar necesită cont de dealer plătitor.**

#### Cum funcționează pe piața românească:
1. **Grupul OLX deține și Autovit.ro:**
   - Orice dealer auto mediu/mare din România are deja abonament pe **Autovit.ro**.
   - În pachetele Standard, Premium și Max de la Autovit, **exportul pe OLX este nativ și inclus automat**!
   - Când dealerul publică prin Autovit (sau printr-un feed XML/API trimis către `api@autovit.ro`), mașina apare instant și pe OLX.ro în secțiunea Auto, cu link către Autovit și sincronizare de stoc.
2. **OLX Developer API (developer.olx.ro):**
   - OLX România oferă Partner API v2 (`POST /adverts`).
   - Autentificarea necesită OAuth 2.0 cu `grant_type=authorization_code` (nu merge cu token de backend anonim, trebuie autorizat contul real al dealerului).
   - Este limitat la pachete profesionale de business (Auto - Categoria 5).

---

### 🥉 METODA C: Local MCP Server / Playwright Agent
> **Verdict:** **Puternic pentru Antigravity IDE / Zety, dar prea complex pentru dealerii clasici fără cunoștințe IT.**

- Rulează un script Playwright conectat la Chrome-ul local (`--remote-debugging-port=9222`).
- Poate fi apelat ca un tool MCP: `publish_car_to_olx({ carId: "..." })`.
- Ideal pentru teste sau pentru parcul propriu (RXM Automobile administrat de Zety), dar nepractic de distribuit ca SaaS către 50 de dealeri externi din țară.

---

## 🧩 3. CE AU FĂCUT ALȚII PÂNĂ ACUM? (BENCHMARKS & PRECEDENTE)

1. **Carmatik.ro (România):**
   - Folosește un hibrid între exportul prin feed oficial Autovit (care împinge pe OLX) și Meta Catalog API (pentru Facebook Marketplace & Instagram).
2. **Soluții internaționale de Multi-Listing (List-It, Crosslist, Vendoo, AutoPost):**
   - În SUA și UK, platforme precum *Crosslist* sau *List-It* sincronizează mașini și produse între Facebook Marketplace, Craigslist, eBay și Gumtree folosind **exact o extensie Chrome de autofill cu browser session injection**!
   - Utilizatorul are contul deschis în tab, dă click în softul principal pe „List to Craigslist/FB”, extensia preia datele din memorie și simulează tastarea umană.
3. **Auto-postere neautorizate (Python/Selenium server-side):**
   - Toate proiectele de pe GitHub care încearcă să ruleze Selenium pe VPS împotriva OLX România eșuează rapid: primesc ban de IP de la Cloudflare sau le este cerut cod SMS la fiecare login.
   - De aceea, **soluția extensiei locale de browser este singura robustă fără parteneriat API direct**.

---

## ⚠️ 4. CAPCANE ȘI CONSTRÂNGERI SPECIFICE OLX ROMÂNIA

1. **Pachete de Anunțuri & Limite Gratuite:**
   - Pe OLX România, categoria *Auto* nu mai permite anunțuri gratuite nelimitate. Dealerul trebuie să aibă un pachet activ de anunțuri sau credite în cont.
   - Dacă nu are credite, formularul se va opri la ultimul pas cerând introducerea cardului bancar.
2. **Dropdown-uri Asincrone (React Hydration):**
   - OLX folosește interfață React/Next.js. Când selectezi „BMW”, trebuie așteptat răspunsul la `GET /api/v1/categories/.../models` înainte de a injecta modelul „Seria 3”.
3. **Validări de Câmpuri:**
   - Titlul: strict între 5 și 70 caractere, fără numere de telefon sau emailuri în titlu.
   - Descrierea: minim 80 de caractere.
   - Număr de telefon: preluat automat din profilul de dealer logat.

---

## 🛠️ 5. PLAN DE IMPLEMENTARE RECOMANDAT PENTRU PARCOS

| Faza | Obiectiv | Livrabil |
| :--- | :--- | :--- |
| **Faza 1 (Imediat)** | **Extensie Chrome ParcOS Publisher (PoC)** | Manifest V3 + Content Script care injectează datele unei mașini în formularul `olx.ro/ad/new/`. |
| **Faza 2 (UI ParcOS)** | **Buton 1-Click în Admin Stoc** | Buton `[Publică pe OLX]` în modalul de mașină sau în tabelul de inventar ParcOS. |
| **Faza 3 (Scalare B2B)** | **Integrare Feed Autovit/OLX API** | Pentru dealeri mari cu abonament Autovit Pro, sincronizare directă din backend. |
