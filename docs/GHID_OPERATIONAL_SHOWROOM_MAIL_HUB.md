# 📖 GHID OPERAȚIONAL — ParcOS Mail Hub & Showroom Routing
> **Platformă:** RXM Automobile & DealerOS (CARVANA SRL)  
> **Modul:** Mail Hub & Speed-to-Lead Pool (`PMH-301` — `PMH-304`)  
> **Target:** Manageri Showroom, Consilieri Vânzări, Agenți Finanțare  
> **Invariante:** Strict 21% TVA • Garanție de Rezervare (Banca Transilvania) • Netcup VPS

---

## 1. Concepte de Bază: Cum Funcționează Rutarea în Showroom

ParcOS Mail Hub rezolvă două probleme critice din parcurile auto:
1. **Speed-to-Lead (Viteza de Reacție):** Primul minut în care un client cere detalii despre o mașină determină 70% din șansele de închidere.
2. **Prevenirea Coliziunilor:** Într-un parc cu mai mulți consilieri (ex. 5-6 băieți la **MPI Auto** sau Mădălina & Robert la **RXM Automobile**), sistemul împiedică situația penibilă în care doi colegi contactează același client în același timp.

---

## 2. Profiluri de Agenți Showroom & Identitate Activă

Fiecare membru al echipei are o căsuță internă dedicată și un profil cu rol specific:

| Rol | Titulatură în Consolă | Descriere & Atribuții |
|---|---|---|
| **ADMIN** | 👑 Director Parc / Administrator | Vizibilitate completă, poate adăuga agenți, reatribui orice lead și emite acorduri. |
| **SALES** | 💼 Consilier Vânzări (Lead Closer) | Preluare apeluri/e-mailuri clienți, negociere, trimitere oferte de preț. |
| **FINANCE** | 💰 Consilier Credite & Leasing | Întocmire dosare TBI Bank / BT Leasing, calcul rate lunare cu TVA 21%. |
| **MECHANIC** | 🔧 Inspecție Tehnică / Service | Note de inspecție, verificare istoric CIV/Talon, atașare fișe de diagnoză. |
| **SUPPORT** | 🎧 Relații Clienți & Asistență | Preluare solicitări generale, triere primară în Pool. |

---

## 3. Cum se Adaugă Consilieri / Agenți Noi în Showroom

Există două modalități garantate pentru crearea de agenți noi:

### Metoda A: Direct din Interfața Vizuală (1-Click UI)
1. Deschide **Admin Portal ➔ ParcOS Mail Hub**.
2. În coloana din stânga, la secțiunea **„Consilieri Înregistrați”**, apasă butonul **`+ Agent`**.
3. Se deschide fereastra **„Adaugă Consilier Showroom”**:
   - **Nume și Prenume:** Numele complet care va apărea în semnătura e-mailurilor (ex: `Dan Morar`).
   - **Adresă E-mail Showroom:** E-mailul profesional (ex: `dan@mpiauto.ro` sau `dan@rxmautomobile.ro`).
   - **Rol în Parc:** Alege dintre `SALES`, `ADMIN`, `FINANCE`, `MECHANIC`, `SUPPORT`.
4. Apasă **„Salvează Agentul”**.
   - Agentul apare **instantaneu** în selectorul din stânga sus și în dropdown-urile de reasignare.
   - Datele sunt sincronizate în baza de date PostgreSQL și în cache-ul securizat al parcului.

### Metoda B: Prin API Automatizat (`POST /api/mail/accounts`)
Pentru integrări sau importuri în masă:
```bash
curl -X POST http://localhost:3001/api/mail/accounts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <ADMIN_API_KEY>" \
  -d '{
    "displayName": "Alexandru Pop",
    "email": "alex@rxmautomobile.ro",
    "role": "SALES",
    "dealerId": "rxm"
  }'
```

---

## 4. De ce Mădălina și Robert sunt Impliciți pentru RXM?

Pentru a garanta funcționarea showroom-ului chiar dacă baza de date este proaspăt inițializată sau dacă un coleg intră offline:
- Sistemul are configurat un mecanism de **Garanție Duală (Fallback & Auto-seeding)**:
  - La pornire, dacă nu există conturi create, sistemul injectează automat:
    1. **Mădălina (Finanțare & Admin)** — Rol `ADMIN` (`contact@rxmautomobile.ro`)
    2. **Robert (Showroom & Vânzări)** — Rol `SALES` (`robert@rxmautomobile.ro`)
  - Dacă un manager adaugă consilieri suplimentari, aceștia se adaugă lângă Mădălina și Robert, persistând automat în memoria parcului.

---

## 5. Ghid de Lucru Pas-cu-Pas pentru Consilieri (Rutina Zilnică)

### Pasul 1: Selectarea Identității la Începutul Turei
- La deschiderea laptopului sau tabletei în showroom, consilierul verifică selectorul **„Agent Showroom”** (stânga-sus).
- Selectează propriul profil de consilier.
- De acum înainte, toate acțiunile și ofertele trimise vor purta semnătura sa oficială.

> 💡 **Notă de Arhitectură & Scalare:**  
> - **Mod Showroom Compact (RXM Automobile):** Selector rapid tip dropdown pe dispozitive partajate în birou/curte (zero fricțiune de re-autentificare).  
> - **Mod Enterprise (Parcuri Mari cu 5-10 Agenți — ex. MPI Auto):** În faza extinsă, fiecare consilier va avea cont individual (Username & Parolă / sesiune JWT izolată), blocând automat identitatea fără selector manual.

### Pasul 2: Urmărirea Folderului `🔥 Pool Showroom`
- În folderul `🔥 Pool Showroom` ajung toate lead-urile noi intrate prin formularul de contact sau pe adresa showroom-ului.
- Un badge auriu pulsant arată numărul de lead-uri proaspete nepreluate.

### Pasul 3: Preluarea Lead-ului („1-Click Claim”)
- Consilierul deschide conversația și apasă butonul auriu:  
  **`⚡ Preia Leadul`**
- **Ce se întâmplă în sistem:**
  - Butonul devine instant `✅ Preluat de tine` pentru acel consilier.
  - În lista de mesaje apare eticheta verde `Tu`.
  - **Pentru toți ceilalți colegi**, pe ecran apare blocat cu:  
    `🔒 Preluat de: [Nume Consilier] (SALES)`
  - Astfel, niciun alt coleg nu va apela clientul în paralel.

### Pasul 4: Consultarea Fișei Vehiculului & Compunerea Ofertei
- Dacă clientul întreabă de o mașină din stoc, consilierul apasă **`Panou Vehicul`** (slide-over din dreapta).
- Acolo vede instant: galeria foto, kilometrajul real, seria VIN, prețul net și calculul cu **strict 21% TVA deductibil** (sau regim de marjă).
- Apasă **`Compune Ofertă`** (PMH-303):
  - Generează oferta oficială cu un click.
  - O trimite direct pe e-mail clientului via AWS SES.

### Pasul 5: Transferul sau Reasignarea Lead-ului
- Dacă clientul vrea o simulare de credit sau leasing:
  - Consilierul de vânzări deschide dropdown-ul din dreapta sus și alege:  
    `→ Mădălina (Finanțare & Admin)`.
  - Conversația se mută automat în folderul Mădălinei (`📥 Preluat de Mine`).
- Dacă un consilier intră în concediu:
  - Din dropdown se alege `⚡ Înapoi în Pool Showroom` sau se reasignează direct altui coleg de tură.

### Pasul 6: Dezactivarea unui Consilier la Plecarea din Firmă
- Când un angajat părăsește parcul auto, administratorul apasă pe iconița de coș de gunoi (`🗑️`) din dreptul numelui său.
- Sistemul solicită confirmarea și **reasignează automat toate lead-urile active către Administrator**, prevenind pierderea oricărui client.

---

## 6. Rezumat Taste & Comenzi Rapide

- **Reîmprospătare Inbox:** Click pe pictograma circulară de refresh `🔄`.
- **Filtrare rapidă după mașină sau VIN:** Bara de căutare din antetul coloanei 2.
- **Asociere manuală vehicul:** Dropdown-ul din panoul lateral dreapta dacă clientul a menționat o mașină care nu are VIN-ul în titlu.
