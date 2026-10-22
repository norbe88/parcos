import fs from 'node:fs';
import path from 'node:path';

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&icirc;/g, 'î')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&acirc;/g, 'â')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&abreve;/g, 'ă')
    .replace(/&Abreve;/g, 'Ă')
    .replace(/&scedil;/g, 'ș')
    .replace(/&Scedil;/g, 'Ș')
    .replace(/&tcedil;/g, 'ț')
    .replace(/&Tcedil;/g, 'Ț');
}

function deepClean(obj) {
  if (typeof obj === 'string') {
    return decodeHtmlEntities(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClean);
  }
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const k of Object.keys(obj)) {
      res[k] = deepClean(obj[k]);
    }
    return res;
  }
  return obj;
}

const rawArticles = JSON.parse(fs.readFileSync('audit-baseline/ghid-auto/extracted-articles.json', 'utf8'));
const articles = deepClean(rawArticles);

const categories = [
  {
    slug: 'inmatriculare-transcriere',
    name: 'Înmatriculare & Transcriere',
    icon: '🚗',
    accentColor: '#2563eb',
    description: 'Înmatriculare, transcriere, schimbare proprietar, radiere și numere de înmatriculare.'
  },
  {
    slug: 'asigurari-rca-casco',
    name: 'Asigurări RCA & CASCO',
    icon: '🛡️',
    accentColor: '#0891b2',
    description: 'Polițe RCA și CASCO, despăgubiri, constatare amiabilă și transfer bonus-malus.'
  },
  {
    slug: 'permis-de-conducere',
    name: 'Permis de conducere',
    icon: '🪪',
    accentColor: '#7c3aed',
    description: 'Obținere, preschimbare, duplicat, suspendare și școli de șoferi.'
  },
  {
    slug: 'itp-rar',
    name: 'ITP & RAR',
    icon: '🔧',
    accentColor: '#ea580c',
    description: 'Inspecția tehnică periodică, omologări RAR și modificări în acte.'
  },
  {
    slug: 'rovinieta',
    name: 'Rovinietă',
    icon: '🎫',
    accentColor: '#16a34a',
    description: 'Prețuri, valabilitate, verificare online și amenzi rovinietă.'
  },
  {
    slug: 'transport-autorizatii',
    name: 'Transport & Autorizații',
    icon: '🚕',
    accentColor: '#dc2626',
    description: 'Taxi, ridesharing (Uber, Bolt), licențe și atestate transport.'
  },
  {
    slug: 'impozite-taxe-auto',
    name: 'Impozite & Taxe auto',
    icon: '💰',
    accentColor: '#ca8a04',
    description: 'Impozit auto la primărie, fiscalizare, scutiri și Programul Rabla.'
  }
];

// Add article counts
for (const cat of categories) {
  cat.articlesCount = articles.filter(a => a.category.slug === cat.slug).length;
}

const fileContent = `// 📘 Ghid Auto ParcOS — Baza de date oficială proceduri auto România 2026
// Generat și verificat conform standardelor de calitate ParcOS

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
}

export const GHID_CATEGORIES: GhidCategory[] = ${JSON.stringify(categories, null, 2)};

export const GHID_ARTICLES: GhidArticle[] = ${JSON.stringify(articles, null, 2)};

export function getAllArticles(): GhidArticle[] {
  return GHID_ARTICLES;
}

export function getArticleBySlug(slug: string): GhidArticle | undefined {
  return GHID_ARTICLES.find(a => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): GhidArticle[] {
  return GHID_ARTICLES.filter(a => a.category.slug === categorySlug);
}

export function getFeaturedArticles(): GhidArticle[] {
  // Top căutate proceduri în 2026
  const featuredSlugs = [
    'inmatriculare-auto',
    'program-rabla-inscriere-acte-2026',
    'itp-expirat',
    'permis-pierdut',
    'rca-pentru-masina-nou-cumparata',
    'rovinieta-12-luni-autoturism'
  ];
  const list = featuredSlugs.map(slug => getArticleBySlug(slug)).filter(Boolean) as GhidArticle[];
  return list.length > 0 ? list : GHID_ARTICLES.slice(0, 6);
}

export function getPopularArticles(): GhidArticle[] {
  const popularSlugs = [
    'inmatriculare-auto',
    'schimbare-talon-auto-la-schimbare-domiciliu',
    'inmatriculare-auto-din-afara-ue',
    'program-rabla-inscriere-acte-2026',
    'duplicat-certificat-de-inmatriculare',
    'recuperare-permis-suspendat'
  ];
  const list = popularSlugs.map(slug => getArticleBySlug(slug)).filter(Boolean) as GhidArticle[];
  return list.length > 0 ? list : GHID_ARTICLES.slice(0, 6);
}

export function searchArticles(query: string): GhidArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GHID_ARTICLES.filter(a => 
    a.title.toLowerCase().includes(q) ||
    a.quickAnswer.toLowerCase().includes(q) ||
    a.category.name.toLowerCase().includes(q) ||
    a.docs.some(d => d.toLowerCase().includes(q))
  );
}
`;

const targetDir = path.resolve('src/data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
fs.writeFileSync(path.join(targetDir, 'ghidAutoData.ts'), fileContent, 'utf8');
console.log('Successfully written src/data/ghidAutoData.ts with', articles.length, 'articles');
