# Antigravity Website Baseline Report — Ghid Auto Teardown & Reverse Engineering
> **Data & Ora:** 2026-10-23 01:05:00  
> **Auditor Skill:** Website Baseline & State Auditor (`/www`, `/audit-web`, `/baseline`)  
> **Target:** `https://carmatik.ro/ghid-auto-carmatik/`  
> **Output Baseline:** `./audit-baseline/ghid-auto/`  
> **Destinație:** ParcOS.ro (`src/components/ghid/`)

---

## 1. Executive Summary

A fost executat un audit complet și exhaustiv pe secțiunea de **Ghid Auto** a competitorului Carmatik (`carmatik.ro/ghid-auto-carmatik/`).
Sistemul a extras, analizat structural și sanizat complet întregul arbore de proceduri, categorii și instrumente interactive, eliminând 100% orice referință de brand Carmatik, numere de telefon WhatsApp, legături de descărcare aplicație mobilă și endpoint-uri terțe.

### Metrici Cheie Audit:
- **Total rute auditate:** 85 rute (1 Hub Principal, 7 Categorii, 1 Calculator Interactiv, 76 Articole Ghid pas cu pas)
- **Total articole extrase:** 76 articole complete în format JSON structurat
- **Status igienizare text:** 0 mențiuni Carmatik în baza de date finală
- **Timp total de parcurgere:** ~12 secunde (interogare batch respectuoasă, HTTP Keep-Alive)
- **Dimensiune date extrase:** 490.1 KB JSON structurat (`audit-baseline/ghid-auto/extracted-articles.json`)

---

## 2. Taxonomie & Inventar Categorii

| # | Categorie | Slug | Icon | Culoare Accent | Nr. Ghiduri | Descriere Tematică |
|---|-----------|------|------|----------------|-------------|---------------------|
| 1 | **Înmatriculare & Transcriere** | `inmatriculare-transcriere` | 🚗 | `#2563eb` | 21 | Înmatriculare, transcriere, schimbare proprietar, radiere și numere |
| 2 | **Asigurări RCA & CASCO** | `asigurari-rca-casco` | 🛡️ | `#0891b2` | 17 | Polițe RCA și CASCO, despăgubiri, constatare amiabilă și bonus-malus |
| 3 | **Permis de conducere** | `permis-de-conducere` | 🪪 | `#7c3aed` | 13 | Obținere, preschimbare, duplicat, suspendare și școli auto |
| 4 | **ITP & RAR** | `itp-rar` | 🔧 | `#ea580c` | 7 | Inspecția tehnică periodică, omologări RAR și modificări în acte |
| 5 | **Rovinietă** | `rovinieta` | 🎫 | `#16a34a` | 7 | Prețuri, valabilitate, verificare online și amenzi rovinietă |
| 6 | **Transport & Autorizații** | `transport-autorizatii` | 🚕 | `#dc2626` | 6 | Taxi, ridesharing (Uber, Bolt), licențe și atestate ARR |
| 7 | **Impozite & Taxe auto** | `impozite-taxe-auto` | 💰 | `#ca8a04` | 5 | Impozit auto la primărie, fiscalizare, scutiri și Programul Rabla |

---

## 3. Anatomia Structurală a unui Articol Ghid

Fiecare ghid din colecție folosește o structură de mare valoare informațională și SEO (schema.org `Article`, `HowTo`, `FAQPage`, `BreadcrumbList`):
1. **Header & Meta:** Titlu H1, badge categorie cu accent dinamic, dată actualizare la zi (2026), timp estimat de citire.
2. **Caseta „Pe scurt” (Quick Answer):** Rezumat la obiect de 2-3 fraze pentru răspuns instant și Google Featured Snippets.
3. **Checklist „Acte necesare”:** Listă neordonată cu bife clare pentru dosarul la ghișeu/online.
4. **Timeline „Pași de urmat”:** Pași numerotați consecutiv cu subtitlu și explicație detaliată.
5. **Tabel „Costuri”:** Tabel cu două coloane: Serviciu / taxă (cu notă explicativă) și Cost (RON).
6. **Secțiunea „Detalii”:** Conținut extins redactat pe H2-uri (proceduri speciale, import UE/non-UE, excepții).
7. **Acordeon „Întrebări frecvente” (FAQ):** Elemente `<details>`/`<summary>` cu răspunsuri concrete pentru cele mai frecvente dileme ale șoferilor.
8. **Lista „Surse oficiale”:** Linkuri externe verificate către DGPCI, RAR, Ghișeul.ro, Ministerul Finanțelor, ARR.
9. **Sidebar Sticky:** Cuprins (Table of Contents) cu Scroll-Spy activ pe bază de `IntersectionObserver`.
10. **Ghiduri similare (Related):** Recomandări din aceeași categorie pentru recircularea utilizatorilor.

---

## 4. Calculator Impozit Auto 2026 — Algoritm & Reguli Fiscale

Sistemul a decodificat formula din Art. 470 Codul fiscal modificat prin Legea nr. 239/2025 și OUG nr. 78/2025:
- **Fracțiuni cilindrice:** `Math.ceil(cmc / 200)`
- **Grilă tarife per 200 cmc** în funcție de norma Euro (Non-euro, Euro 4, Euro 5, Euro 6, Hibrid >50g CO2).
- **Vehicule electrice:** Sumă fixă 40 lei / an (scutirea totală a fost eliminată în 2026).
- **Cotă adițională a primăriei:** Slider / input 0% - 100% conform deciziei Consiliului Local.
- **Defalcare rate:** 2 rate egale (31 martie și 30 septembrie).
- **Bonificație plată anticipată:** 10% reducere la plata integrală până la 31 martie.

---

## 5. Măsuri de Sanizare & Conformitate ParcOS

1. **Brand Neutralization:** Toate instanțele „Carmatik” au fost înlocuite cu „ParcOS” sau eliminate unde era vorba de marketplace-ul lor specific.
2. **Fără CTA-uri WhatsApp Carmatik:** Butoanele care trimiteau la numărul `40730698659` au fost eliminate; pot fi conectate opțional la numărul oficial al parcului / ParcOS Concierge.
3. **Fără Badges App Store / Google Play Carmatik:** Au fost înlăturate referințele la aplicația mobilă Carmatik.
4. **Design Adaptat:** Transformare din stilul Bootstrap alb/gri al Carmatik într-o estetică ultra-premium **ParcOS Dark Luxury Dual-Theme** (text clar, contrast WCAG AA, font *Plus Jakarta Sans*, accente chihlimbar/auriu specifice ParcOS).
