# Invariantă de Sistem: Invalidare Cache & Sincronizare Promoțională Stoc

> **Domeniu:** Persistență Locală (`localStorage`), Stoc Vehicule & Oferte Promoționale  
> **Fișiere critice:** `src/App.tsx`, `src/db/vehicles.ts`, `src/components/showroom/SpecialOffersCarousel.tsx`  
> **Verificare mecanică obligatorie:** `node scripts/qa_suite_verifier.cjs` (Suita 15)

---

## 1. Regula de Aur

Oricând se modifică:
1. Lista de vehicule din `src/db/vehicles.ts` (adăugare, ștergere, reordonare);
2. Atribute promoționale sau de featured: `isDealOfWeek`, `isPinnedToTop`, `oldPriceEur`, `dealBadgeText`;
3. Structura sau proprietățile modelului `VehicleItem`;

**ESTE STRICT OBLIGATORIU:**
- Să se incrementeze constanta `RXM_INVENTORY_VERSION` în `src/App.tsx` (cu prefix `vX_...` și data curentă).
- Să se asigure că funcția `ensureDealOfWeekActive` este apelată atât pe ramura de migrare (`savedVersion !== RXM_INVENTORY_VERSION`), cât și pe ramura de verificare a integrității (`savedVersion === RXM_INVENTORY_VERSION`).
- Să se execute `node scripts/qa_suite_verifier.cjs` și să treacă 100% verde [SUITE 15].

---

## 2. De ce este critic?

Utilizatorii și dealerii vizitează site-ul din browsere obișnuite unde `localStorage` păstrează stocul anterior. Dacă versiunea nu este incrementată și atributele promoționale nu sunt sincronizate explicit la nivel de mapare:
- Datele vechi din `localStorage` suprascriu modificările din cod;
- Secțiunea `SpecialOffersCarousel` se auto-ascunde (`cars.length === 0 ➔ return null`);
- Modificările devin vizibile doar în mod Incognito / Private Browsing, cauzând confuzie.

---

## 3. Comanda de Verificare Pre-Commit & Pre-Deploy

Înainte de orice `/cp`, `/cpd`, `/cpdp`, `/bye` sau `/goodnight`, este obligatorie rularea:
```bash
npx tsc --noEmit && node scripts/qa_suite_verifier.cjs
```
Dacă oricare dintre cele 80 de teste eșuează, comiterea este blocată.
