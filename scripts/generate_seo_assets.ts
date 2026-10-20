import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_DEALER } from '../src/db/dealer';
import { SEED_VEHICLES } from '../src/db/vehicles';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const BASE_URL = 'https://rxmautomobile.ro';
const today = new Date().toISOString().split('T')[0];

console.log(`🚀 [SEO Generator] Starting generation for ${SEED_VEHICLES.length} vehicles...`);

// ==========================================
// 1. GENERATE public/sitemap.xml
// ==========================================
const staticPages = [
  { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
  { loc: `${BASE_URL}/#catalog`, priority: '0.9', changefreq: 'daily', lastmod: today },
  { loc: `${BASE_URL}/#finantare`, priority: '0.85', changefreq: 'weekly', lastmod: today },
  { loc: `${BASE_URL}/#buyback`, priority: '0.8', changefreq: 'weekly', lastmod: today },
  { loc: `${BASE_URL}/#comanda`, priority: '0.8', changefreq: 'weekly', lastmod: today },
  { loc: `${BASE_URL}/#contact`, priority: '0.8', changefreq: 'monthly', lastmod: today },
  { loc: `${BASE_URL}/livrare`, priority: '0.7', changefreq: 'monthly', lastmod: today },
  { loc: `${BASE_URL}/termeni-si-conditii`, priority: '0.5', changefreq: 'monthly', lastmod: today },
  { loc: `${BASE_URL}/politica-de-cookies`, priority: '0.5', changefreq: 'monthly', lastmod: today },
];

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

// Add static pages
for (const page of staticPages) {
  sitemapXml += `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
}

// Add vehicle detail pages
for (const car of SEED_VEHICLES) {
  const carUrl = `${BASE_URL}/?car=${encodeURIComponent(car.id)}`;
  const carLastMod = car.lastOlxSyncAt ? car.lastOlxSyncAt.split('T')[0] : today;
  
  sitemapXml += `  <url>
    <loc>${escapeXml(carUrl)}</loc>
    <lastmod>${carLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>\n`;

  // Include top images for Googlebot-Image & Multimodal AI indexing
  if (car.images && car.images.length > 0) {
    const topImages = car.images.slice(0, 3);
    for (const img of topImages) {
      // Normalize absolute image URL
      const cleanImgPath = img.split('?')[0];
      const fullImgUrl = cleanImgPath.startsWith('http') ? cleanImgPath : `${BASE_URL}${cleanImgPath}`;
      const imgTitle = `${car.brand} ${car.model} ${car.year} - RXM Automobile Cluj-Napoca`;
      
      sitemapXml += `    <image:image>
      <image:loc>${escapeXml(fullImgUrl)}</image:loc>
      <image:title>${escapeXml(imgTitle)}</image:title>
    </image:image>\n`;
    }
  }

  sitemapXml += `  </url>\n`;
}

sitemapXml += `</urlset>\n`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`✅ [SEO Generator] Created public/sitemap.xml (${staticPages.length + SEED_VEHICLES.length} URLs)`);

// ==========================================
// 2. GENERATE public/llms.txt (Standard AI Agent Context)
// ==========================================
const brandsInStock = Array.from(new Set(SEED_VEHICLES.map(v => v.brand))).sort();
const minPrice = Math.min(...SEED_VEHICLES.map(v => v.priceEur));
const maxPrice = Math.max(...SEED_VEHICLES.map(v => v.priceEur));

const llmsTxt = `# RXM AUTO MOBILE Cluj-Napoca
> Dealer autorizat autovehicule rulate premium și compacte, garanție 12-24 luni, finanțare rapidă cu 0% avans și numere roșii pe loc în Cluj-Napoca.

## Despre RXM Automobile
RXM AUTO MOBILE S.R.L. este un parc auto profesionist din Cluj-Napoca (${SEED_DEALER.showroomAddress}). Compania este specializată în comercializarea autovehiculelor rulate atent verificate tehnic în peste 150 de puncte, provenite din import european certificat.

Fiecare vehicul este livrat cu:
- Garanție extinsă 12-24 luni (motor și cutie de viteze)
- Rulaj kilometric garantat contractual pe factură
- Revizie gratuită completă efectuată la livrare (ulei + filtre)
- Raport istoric daune / carVertical transparent
- Eliberare numere roșii provizorii pe loc (30-90 zile)
- Posibilitate livrare pe platformă la ușa clientului oriunde în România

## Stoc Vehicule Disponibil
- **Număr Vehicule Active:** ${SEED_VEHICLES.length} autoturisme în showroom
- **Mărci în Stoc:** ${brandsInStock.join(', ')}
- **Plajă Prețuri:** de la ${minPrice.toLocaleString()} € până la ${maxPrice.toLocaleString()} €
- **Categorii:** SUV, Break / Combi, Berlina / Sedan, Hatchback, Compacte de oraș

## Servicii Financiare & Facilități
- **Finanțare Rate Fixe 0% Avans:** Parteneriate oficiale cu TBI Bank, Banca Transilvania (BT Direct), UniCredit Consumer Financing, CreditFix.
- **Criterii Finanțare:** Persoane fizice (salariați cu minim 3 luni vechime, pensionari), persoane juridice (SRL / PFA), contracte de muncă în străinătate (Germania, Italia, etc.) sau persoane înregistrate în Biroul de Credit.
- **Sistem Buy-Back:** Evaluare corectă pe loc a vechii mașini pentru a constitui avansul sau plata completă a noii mașini.
- **Comandă Personalizată:** Aducem pe comandă orice model dorit din licitații și parcuri partenere din Germania și Olanda.

## Contact Showroom & Locație Fizică
- **Website Oficial:** ${BASE_URL}
- **Adresă Showroom:** ${SEED_DEALER.showroomAddress}
- **Telefon Vânzări & Showroom:** ${SEED_DEALER.phonePrimary} (Robert)
- **Telefon Finanțare & Rate:** ${SEED_DEALER.phoneFinance} (Mădălina)
- **WhatsApp Vânzări:** https://wa.me/${SEED_DEALER.whatsappNumber}
- **Email:** ${SEED_DEALER.email}
- **Program Lucru:** ${SEED_DEALER.openingHours}
- **Google Maps:** ${SEED_DEALER.googleMapsUrl}
- **TikTok Oficial:** ${SEED_DEALER.tiktokUrl}

## Resurse Detaliate pentru Agenți AI (LLMs)
- [Catalog Complet Mașini Detaliat (llms-full.txt)](${BASE_URL}/llms-full.txt): Fișier complet cu date tehnice, prețuri și specificații pentru toate mașinile din stoc.
- [Sitemap Oficial XML](${BASE_URL}/sitemap.xml): Index complet al tuturor URL-urilor pentru motoare de căutare.
- [Termeni și Condiții de Garanție](${BASE_URL}/termeni-si-conditii): Politica detaliată de garanție și retur.
- [Serviciu Livrare Națională](${BASE_URL}/livrare): Condițiile de transport și predare la domiciliu.
`;

fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
console.log(`✅ [SEO Generator] Created public/llms.txt (GEO summary for AI Agents)`);

// ==========================================
// 3. GENERATE public/llms-full.txt (Detailed per-car specifications)
// ==========================================
let llmsFullTxt = `# Catalog Detaliat Vehicule — RXM AUTO MOBILE Cluj-Napoca
> Actualizat la data de ${today} | Total: ${SEED_VEHICLES.length} vehicule în stoc
> Website: ${BASE_URL} | Showroom: ${SEED_DEALER.showroomAddress} | Tel: ${SEED_DEALER.phonePrimary}

---

`;

for (const car of SEED_VEHICLES) {
  const carUrl = `${BASE_URL}/?car=${car.id}`;
  llmsFullTxt += `### ${car.brand} ${car.model} (${car.year}) — ${car.priceEur.toLocaleString()} €
- **Cod Stoc:** ${car.stockNumber}
- **Link Direct:** ${carUrl}
- **Versiune / Echipare:** ${car.versionTrim || 'Standard'}
- **Preț:** ${car.priceEur.toLocaleString()} € (TVA ${car.vatDeductible ? 'deductibil inclus' : 'nedeductibil'})
- **Rulaj:** ${car.mileageKm.toLocaleString()} km (certificat pe factură)
- **Combustibil:** ${car.fuelType}
- **Transmisie:** ${car.transmission}
- **Motorizare:** ${car.engineCc ? `${car.engineCc} cm³` : '-'} / ${car.powerHp ? `${car.powerHp} CP` : '-'}
- **Caroserie:** ${car.bodyType} | **Tracțiune:** ${car.drivetrain}
- **Culoare:** ${car.color}
- **Garanție Inclusă:** ${car.warrantyMonths} Luni (motor & cutie)
- **Numere Roșii:** ${car.hasRedPlates ? 'Disponibile' : 'Eliberabile pe loc'}
`;

  if (car.features) {
    const allFeatures = [
      ...(car.features.safety || []),
      ...(car.features.comfort || []),
      ...(car.features.multimedia || [])
    ];
    if (allFeatures.length > 0) {
      llmsFullTxt += `- **Dotări Notabile:** ${allFeatures.slice(0, 8).join(', ')}\n`;
    }
  }

  if (car.description) {
    llmsFullTxt += `- **Descriere:** ${car.description.replace(/\n+/g, ' ').trim()}\n`;
  }

  llmsFullTxt += `\n---\n\n`;
}

fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
console.log(`✅ [SEO Generator] Created public/llms-full.txt (Detailed inventory for AI Agents)`);

console.log(`🎉 [SEO Generator] All SEO and GEO assets generated successfully!`);
