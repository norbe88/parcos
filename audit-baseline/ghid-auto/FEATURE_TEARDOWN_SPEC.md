# Feature Teardown Spec — Ghid Auto ParcOS
> **Document:** Component Breakdown, Data Models & Architecture Plan  
> **Data:** 2026-10-23  

---

## 1. Arhitectura Tehnică Recomandată în ParcOS

```
src/
├── data/
│   ├── ghidAutoData.ts           # Baza de date structurată (categorii, articole, căutare)
│   └── ghidTaxRates.ts           # Tarifele fiscale oficiale 2026 pentru calculator
├── components/
│   └── ghid/
│       ├── GhidAutoHub.tsx       # Pagina principală a ghidului (Hero căutare, categorii, top ghiduri)
│       ├── GhidAutoCategory.tsx  # Filtrare pe categorie cu breadcrumbs și listă ghiduri
│       ├── GhidAutoArticleView.tsx # Vizualizare articol cu TOC sticky, checklist, timeline pași, tabel costuri, FAQ
│       ├── CalculatorImpozitAuto.tsx # Calculator fiscal interactiv 100% client-side instant
│       └── GhidAutoSearchModal.tsx # Căutare rapidă tip spotlight (Cmd+K / Caută o procedură)
```

---

## 2. Tipuri TypeScript (`src/types/ghid.ts` sau în `ghidAutoData.ts`)

```typescript
export interface GhidCategory {
  slug: string;
  name: string;
  icon: string;
  accentColor: string;
  description: string;
  articlesCount?: number;
}

export interface GhidStep {
  num: number;
  title: string;
  description: string;
}

export interface GhidCost {
  item: string;
  note?: string;
  value: string;
}

export interface GhidFaq {
  question: string;
  answer: string;
}

export interface GhidOfficialLink {
  label: string;
  url: string;
}

export interface GhidArticle {
  slug: string;
  url: string;
  title: string;
  category: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  metaDescription: string;
  updateDate: string;
  readTime: string;
  quickAnswer: string;
  docs: string[];
  steps: GhidStep[];
  costs: GhidCost[];
  proseHtml: string;
  faq: GhidFaq[];
  officialLinks: GhidOfficialLink[];
  relatedSlugs?: string[];
}
```

---

## 3. Strategia de Conversie și Lead Capture ParcOS

În loc de bannerele simple de la Carmatik:
1. **CTA Contextual ParcOS:**
   - La articolele de înmatriculare/transcriere: „Vrei să vinzi sau să cumperi fără bătăi de cap? Descoperă parcul nostru de mașini verificate cu istoric garantat!”
   - Pentru dealeri / parcuri auto: „Ești dealer auto? ParcOS automatizează generarea de contracte, fișe și anunțuri fără efort manual.”
2. **Direct WhatsApp Concierge:** Posibilitate de asistență rapidă prin WhatsApp-ul showroom-ului curent (`tenant.whatsappNumber`).
