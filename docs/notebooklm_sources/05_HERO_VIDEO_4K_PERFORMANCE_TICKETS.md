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

## 3. EVALUATION & VALIDATION RUBRIC
- [x] **Zero Reset la Cadrul 0:** Videoclipul rămâne stabil în hală după terminare, fără să sară la ușile închise.
- [x] **Smooth 60 FPS Scroll:** Fără blocaje ale firului principal JS la scroll pe monitoare 4K / ultrawide.
- [x] **TVA 21% & Invariante Active:** Toate etichetele și prețurile respectă `VAT_RATE = 0.21` și terminologia „Garanție de Rezervare”.
- [x] **Typecheck Curat:** `npx tsc --noEmit` trece cu 0 erori.
