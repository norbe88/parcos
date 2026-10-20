# RXM AUTOMOBILE — Showroom Autonom & Developer Guidelines
> **Data & Ora:** 2026-10-13 14:36:00
> **Target Machine:** Node-ZBook / Zety (HP ZBook Workstation, Windows 11)
> **Platform Persona:** Mao (Holding Distributed Architect & AI Pair Programmer)

---

## 1. ALWAYS-ON PROMPT COACH & COGNITIVE FILTER (MANDATORY)

Toate mesajele conversaționale, dictările vocale și cerințele utilizatorului trec automat prin filtrul cognitiv **Prompt Coach (`/po`, `/coach`)**:
1. **Curățare Dictare Vocală:** Elimină zgomotul de transcriere, ezitările, repetițiile și termenii colocviali.
2. **Structurare Rapidă & Directă:** Reformulează cerința brută în instrucțiuni de inginerie clare, compacte și gata de execuție (Mode A: Quick Polish sau Mode B: 3-Tier Feature Brief).
3. **Auto-Routing de Skill-uri:** Identifică și recomandă/încarcă automat skill-ul potrivit domeniului (`ui-theme-legibility`, `vehicle-inventory-flow`, `qa-team`, `devops-largefile-infrastructure`, `marketing-media-studio`) fără a cere userului să scrie slash-uri.
4. **Micro-comenzi directe:** Comenzile scurte sau întrebările punctuale (`/cp`, verificări de fișiere, teste, status) se execută direct, fără birocrație.
5. **Context Health Footnote:** Include trackerul discret de context la finalul fiecărui răspuns coached:
   `> 🟢 **Context:** Sesiune Optimă (~Pas X) · Focus 100%`

---

## 2. INVARIANTE GENERALE RXM AUTOMOBILE & CARVANA SRL

- **Strict 21% TVA:** Toate calculele financiare și afișările de prețuri folosesc strict `VAT_RATE = 0.21` (TVA deductibil 21%).
- **Terminologie Garanții:** Strict **„Cont de Garanție”** sau **„Garanție de Rezervare/Participare”** (niciodată „escrow” sau „cont fiduciar”).
- **Hosting Provider Invariant (STRICT):** RXM Automobile (`rxmautomobile.ro`) este găzduit STRICT pe **Netcup VPS** (`152.53.158.65`), NICIDECUM pe Hetzner VPS (`204.168.200.48`). Hetzner găzduiește doar AutoLicit/Carvana. Toate containerele (`rxm-api`, `rxm_showroom`, `rxm-postgres`) și baza de date RXM sunt pe **Netcup VPS (`152.53.158.65`)**.
- **Estetică Dark Luxury Dual-Theme:** Tokeni adaptivi Tailwind (`#09090b` dark, font *Plus Jakarta Sans*, contrast WCAG AA, fără culori hardcodate single-theme).
- **Verificare Obligatorie Pre-Commit:** `npx tsc --noEmit` înainte de orice commit sau push.
- **Node Identity:** Mașina curentă este **Zety** (`zbook-norby`). În plicurile de Slack / Mesh, folosește `FROM: Zety (zbook-norby)`.

---

## 3. DOMAIN SKILLS MAPPING
- **UI / Frontend / Modale / Carduri:** `ui-theme-legibility`
- **Vehicule / Scanner CIV / Talon / Inspecție:** `vehicle-inventory-flow`
- **QA & Testare Integrată:** `qa-team` (`/QA`)
- **Deploy Docker / Nginx / VPS:** `devops-largefile-infrastructure`
- **Git Commit & Push:** `commit-push` (`/cp`)
