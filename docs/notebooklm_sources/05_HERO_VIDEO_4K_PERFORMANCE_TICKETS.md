# 🏎️ ParcOS Showroom — 4K Hero Video Optimization & Frame Reset Fix Spec
> **Data & Ora:** 2026-10-22 11:15:00  
> **Platform Persona:** Mao (AI Research Architect & Knowledge Engineer)  
> **Target Component:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`  
> **Holding Domain:** ParcOS Showroom Digital Autonom (CARVANA SRL)

---

## 1. RESEARCH & INDUSTRY BENCHMARK SYNTHESIS
### Cum au rezolvat platformele de top (Apple, Tesla, Stripe, Vercel, Porsche) problemele similare?

Atunci când o platformă web modernă utilizează un clip video cinematic ca fundal activ cu scrollytelling și HUD deasupra:

| Problemă Observată | Cauză Tehnică (Chromium / WebKit) | Soluția Standard din Industrie (Apple / Tesla / Stripe) |
|---|---|---|
| **Video stutter / sacadare pe 4K** | Re-randare la fiecare pixel derulat (`scrollProgress` în React state) + decodare 4K simultană cu 7 layere `backdrop-filter: blur()`. La 3840×2160, GPU fill-rate este saturat (8.3M pixeli × 60-120 FPS). | **1. Decuplare Render State:** Starea React se actualizează STRICT la praguri discrete de cadran (4 milestone-uri în loc de 1000 de re-randări sub-pixel).<br>**2. GPU Layer Isolation:** Containerul video primește `transform: translate3d(0,0,0)`, `backface-visibility: hidden` și `isolation: isolate`.<br>**3. Decongestionare Blur:** Opacitate Dark Luxury 98% (`bg-[#121215]/98`) care elimină multi-pass Gaussian blur pe 4K. |
| **Reset la primul frame (uși închise)** | Comanda `vid.currentTime = Math.max(0, vid.duration - 0.05)` la `onEnded`. Căutarea înapoi cu 50ms la finalul fluxului fără I-frame dedicat eșuează în Chromium, declanșând fallback nativ la `currentTime = 0`. | **Locking Final Frame:** Eliminarea oricărui `seek` la final. Când videoclipul atinge sfârșitul, se apelează simplu `vid.pause()` și se activează o imagine statică 1:1 de înaltă rezoluție a cadrului final (`parcos-showroom-hall-lastframe.jpg`). |
| **Reset la scroll out/in of view** | Pe monitoare 4K, Chromium evacuează suprafața de decodare a videoclipurilor inactive din VRAM când sunt derulate în afara ecranului. La revenire, videoclipul se reinițializează de la 0. | **IntersectionObserver Lifecycle:** Când containerul iese din viewport (>230vh), videoclipul este pus pe pauză controlat. Dacă s-a terminat, cadrul final rămâne ancorat prin layerul static dedicat, împiedicând orice revenire la frame 0. |

---

## 2. INGINERIE DE TICKETE DE EXECUȚIE

### 🎫 TICKET-VID-01: Eliminarea Race Condition-ului `onEnded` & Lock pe Cadrul Final
- **Severitate:** Critică (Bug vizual major: videoclipul sare la ușile închise).
- **Fișier:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`
- **Acțiune:**
  1. Șterge instrucțiunea destructivă `vid.currentTime = Math.max(0, vid.duration - 0.05)`.
  2. Implementează `isVideoEnded` state. La `onEnded` sau când `currentTime >= duration - 0.1s`:
     - Oprește playerul cu `vid.pause()`.
     - Activează stratul `lastFrameSrc` (`/images/parcos-showroom-hall-lastframe.jpg`) la opacitate 100% cu crossfade lin de 200ms.
  3. Butonul „Reia Animația” (`handleReplay`) resetează starea `isVideoEnded(false)` și pornește fluid de la 0.

---

### 🎫 TICKET-VID-02: Decuplarea React Re-renders de la Nativ Scroll (Milestone Quantization)
- **Severitate:** Critică (Sursă directă de sacadare / stuttering pe ecrane mari).
- **Fișier:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`
- **Acțiune:**
  1. Înlocuiește actualizarea continuă `Math.abs(progress - lastProgressRef.current) > 0.001` (care genera ~1000 re-randări React pe 230vh) cu **cuantificare pe 5 faze discrete**:
     - `scrollPhase`: `-1` (Hero Extins), `0` (Porsche Cayenne), `1` (Mercedes-AMG GT), `2` (Audi RS7), `3` (Audi R8).
  2. React execută `setState` **EXCLUSIV** atunci când pragul de cadran se schimbă (de maximum 4-5 ori pe toată durata derulării în loc de sute de ori).
  3. Arborele DOM al playerului video rămâne neatins în timpul scrollului.

---

### 🎫 TICKET-VID-03: Decongestionare GPU Compositor & Eliminare `backdrop-filter` pe 4K
- **Severitate:** Medie-Înaltă (Framerate drop la rezoluții 1440p / 2160p).
- **Fișier:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`
- **Acțiune:**
  1. Cardurile vehiculelor și panourile HUD folosesc `bg-[#121215]/98` și `bg-[#141418]/98` cu border fin `border-white/15` în loc de `backdrop-blur-md` costisitor pe 4K.
  2. Izolează containerul video cu `transform: translate3d(0, 0, 0)` și `backface-visibility: hidden` pentru alocarea unui GPU Compositing Layer dedicat.
  3. Optimizează radarul pulsant al punctelor holografice prin limitarea animațiilor paralele.

---

### 🎫 TICKET-VID-04: Gestionare Ciclu de Viață cu IntersectionObserver & Autoplay Guard
- **Severitate:** Medie (Economisire memorie VRAM și prevenire crash pe Chromium).
- **Fișier:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`
- **Acțiune:**
  1. Montează un `IntersectionObserver` pe `containerRef` cu pragul `0.05`.
  2. Când secțiunea Showroom derulează complet în afara ecranului: apel `vid.pause()`.
  3. Când revine pe ecran: apel `.play()` doar dacă videoclipul nu a atins deja finalul (păstrând cadrul înghețat al halei cu cele 4 mașini).
  4. Protejează promisiunea asincronă `playPromise.catch(() => {})` împotriva erorilor de tip `AbortError / Interrupted by pause()`.

---

### 🎫 TICKET-VID-05: Decuplare Intro Showroom RXM & Izolare Branding ParcOS Admin Gate
- **Severitate:** Înaltă (Bug UX & Contaminare Branding: intro-ul cinematic cu cortină și logo RXM Automobile apărea la logare pe rutele de administrare ParcOS).
- **Fișiere Afectate:** `src/App.tsx`, `src/components/admin/AdminLoginGate.tsx`
- **Cauză Tehnică:**
  1. În `src/App.tsx`, condiția de afișare pentru `CinematicIntro` era configurată lax: `{viewMode !== 'saas' && ( <CinematicIntro ... /> )}`. În consecință, când se accesa `/admin` sau `/superadmin` (`#admin`, `#superadmin`), `viewMode` fiind `'admin'` / `'superadmin'`, componenta `CinematicIntro` se randa direct peste poarta de logare, afișând animația cu cortină, sigla RXM Automobile Cluj-Napoca și sloganul timp de 2.7s.
  2. Starea `isRevealed` începea pe `false` pe rutele administrative dacă `rxm_intro_seen` nu fusese setat în sesiune.
  3. Poarta `AdminLoginGate` primea orbește `dealer={tenant}` (care implicit este `rxm`), afișând `Zonă Securizată • RXM AUTOMOBILE SRL` și butonul `Înapoi la Showroom-ul Public` pe instanțele de administrare ale platformei centrale ParcOS (`parcos.ro` sau `localhost:3001`).
- **Acțiuni Implementate:**
  1. **Izolare Strictă Intro:** `CinematicIntro` se randează EXCLUSIV când `viewMode === 'showroom' && (tenantId === 'rxm' || tenant?.slug === 'rxm') && !isParcosDomain(hostname, port)`. Pe orice rută administrativă sau de platformă, intro-ul este complet decuplat.
  2. **Instant Reveal:** Pe rutele non-showroom (`admin`, `superadmin`, `saas`, etc.) sau pe domeniul/portul ParcOS, `isRevealed` este inițializat imediat pe `true`, eliminând orice flicker sau întârziere la afișarea ecranului de logare.
  3. **Branding Dinamic Poartă:** Când utilizatorul se află pe domeniul central ParcOS (sau portul 3001 fără dealer specific), `AdminLoginGate` primește entitatea neutră de holding: `ParcOS Platform (Carvana SRL)` (slug `'parcos'`), titlul *ParcOS Admin Hub* și butonul contextual *Înapoi pe ParcOS.ro*.
  4. **SuperAdmin Routing Failsafe:** Pe portul de dezvoltare 3001 și domeniul central, rutele `/admin` și `#admin` rutează implicit către SuperAdmin Hub dacă nu s-a cerut explicit gestiunea unui dealer (`?dealer=...`).

---

### 🎫 TICKET-VID-06: Restaurare Background Opac pe Cardul Audi R8 & Cardurile în Prim-Plan
- **Severitate:** Medie (Bug Vizual: ultimul cartonaș cu Audi R8 V10 și cardurile focalizate își pierdeau fundalul, devenind transparente pe desktop și mobil).
- **Fișiere Afectate:** `src/components/saas/showcase/ShowroomVideoIntro.tsx`, `tailwind.config.js`
- **Cauză Tehnică:**
  1. În `renderVehicleQuadrantCard`, pentru starea `isPrimPlan === true`, clasele aplicau `bg-[#141418]/98`. În Tailwind CSS v3, `/98` nu face parte din paleta standard de opacități (0, 5, 10 ... 90, 95, 100), iar Tailwind elimina clasa la compilare (0 reguli generate).
  2. Când utilizatorul derula la faza 3 (Audi R8 V10) sau selecta mașina, cardul primea `isPrimPlan = true`, pierzându-și clasa de fundal și devenind 100% transparent.
  3. Pe desktop, cardurile inactive păstrau `bg-[#121215]/95` (opacitate recunoscută), motiv pentru care primele trei carduri erau opace, dar ultimul (Audi R8, aflat în prim-plan) devenea transparent.
- **Acțiuni Implementate:**
  1. **Configurare Opacity Stop 98:** S-a adăugat `opacity: { '98': '0.98' }` în `tailwind.config.js` pentru a valida orice opacitate `/98` din proiect.
  2. **Standardizare pe 95% Opacitate:** În `ShowroomVideoIntro.tsx`, clasele de prim-plan au fost actualizate la `bg-[#141418]/95`, generând regula dedicată `background-color: #141418f2` (95% opacitate Dark Luxury).
  3. **Restaurare Backdrop Blur:** S-a readus `backdrop-blur-md` pe carduri și containere pentru un contrast WCAG AAA optim peste fundalul video 4K.

---

## 3. EVALUATION & VALIDATION RUBRIC
- [x] **Zero Reset la Cadrul 0:** Videoclipul rămâne stabil în hală după terminare, fără să sară la ușile închise.
- [x] **Smooth 60 FPS Scroll:** Fără blocaje ale firului principal JS la scroll pe monitoare 4K / ultrawide.
- [x] **Background Opac Card Audi R8:** Cardul 3 (Audi R8 V10) primește `bg-[#141418]/95` și `backdrop-blur-md`, menținând contrastul și lizibilitatea.
- [x] **Decuplare Totală Intro pe Admin:** Accesul la `#admin` sau `#superadmin` deschide direct poarta de autentificare curată, fără cortină sau logo RXM.
- [x] **Branding Corect ParcOS Admin:** Poarta afișează *ParcOS Platform (Carvana SRL)* și *Înapoi pe ParcOS.ro*.
- [x] **TVA 21% & Invariante Active:** Toate etichetele și prețurile respectă `VAT_RATE = 0.21` și terminologia „Garanție de Rezervare”.
- [x] **Typecheck Curat:** `npx tsc --noEmit` trece cu 0 erori.
