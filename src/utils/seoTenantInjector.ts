/**
 * SEO & GEO Runtime Injector for Multi-Tenant ParcOS
 * Injects and updates <head> tags dynamically per dealer tenant:
 * - document.title (with special pages protection)
 * - meta[name="description"]
 * - OpenGraph (og:title, og:description, og:url, og:image, og:site_name)
 * - Twitter Cards (twitter:card, twitter:title, twitter:description, twitter:image)
 * - link[rel="canonical"]
 * - Schema.org JSON-LD @type: "AutoDealer"
 */

import { useEffect } from 'react';
import { DealerProfile } from '../db/types';

/**
 * Extrage orașul de reședință sau showroom din adresa dealerului
 */
export function extractDealerCity(tenant: DealerProfile): string {
  const addr = (tenant.address || tenant.showroomAddress || tenant.legalAddress || '').toLowerCase();
  
  const knownCities: [string, string][] = [
    ['cluj-napoca', 'Cluj-Napoca'],
    ['cluj', 'Cluj-Napoca'],
    ['floresti', 'Florești, Cluj'],
    ['florești', 'Florești, Cluj'],
    ['bucuresti', 'București'],
    ['bucurești', 'București'],
    ['ilfov', 'Ilfov'],
    ['timisoara', 'Timișoara'],
    ['timișoara', 'Timișoara'],
    ['iasi', 'Iași'],
    ['iași', 'Iași'],
    ['brasov', 'Brașov'],
    ['brașov', 'Brașov'],
    ['constanta', 'Constanța'],
    ['constanța', 'Constanța'],
    ['craiova', 'Craiova'],
    ['oradea', 'Oradea'],
    ['sibiu', 'Sibiu'],
    ['arad', 'Arad'],
    ['ploiesti', 'Ploiești'],
    ['ploiești', 'Ploiești'],
    ['pitesti', 'Pitești'],
    ['pitești', 'Pitești'],
    ['bacau', 'Bacău'],
    ['bacău', 'Bacău'],
    ['baia mare', 'Baia Mare'],
    ['targu mures', 'Târgu Mureș'],
    ['târgu mureș', 'Târgu Mureș'],
    ['suceava', 'Suceava'],
    ['alba iulia', 'Alba Iulia'],
  ];

  for (const [needle, formatted] of knownCities) {
    if (addr.includes(needle)) {
      return formatted;
    }
  }

  return 'Cluj-Napoca';
}

/**
 * Rezolvă URL-ul canonical al dealerului
 * Invariantă CARVANA & ParcOS: rxmautomobile.ro rămâne https://rxmautomobile.ro/
 */
export function resolveCanonicalUrl(tenant: DealerProfile): string {
  if (tenant.landingConfig?.seo?.canonicalUrl) {
    return tenant.landingConfig.seo.canonicalUrl;
  }

  const isRxm = tenant.slug === 'rxm' || tenant.name.toLowerCase().includes('rxm');
  if (isRxm) {
    return 'https://rxmautomobile.ro/';
  }

  if (tenant.domain) {
    const cleanDomain = tenant.domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${cleanDomain}/`;
  }

  const slug = tenant.slug || 'rxm';
  return `https://parcos.ro/?dealer=${encodeURIComponent(slug)}`;
}

/**
 * Rezolvă imaginea de preview social (og:image / twitter:image)
 */
export function resolveOgImage(tenant: DealerProfile, canonicalUrl: string): string {
  if (tenant.landingConfig?.seo?.ogImage) {
    return tenant.landingConfig.seo.ogImage;
  }

  const isRxm = tenant.slug === 'rxm' || tenant.name.toLowerCase().includes('rxm');
  if (isRxm) {
    return 'https://rxmautomobile.ro/brand/parcos-og-card.png';
  }

  return 'https://parcos.ro/brand/parcos-og-card.png';
}

/**
 * Helper idempotent pentru actualizarea sau adăugarea tagurilor <meta>
 */
function setMetaTag(selector: string, createAttrs: Record<string, string>, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(createAttrs).forEach(([k, v]) => tag!.setAttribute(k, v));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Helper idempotent pentru actualizarea sau adăugarea tagurilor <link>
 */
function setLinkTag(rel: string, href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Helper idempotent pentru injectarea schemei JSON-LD AutoDealer
 */
function injectAutoDealerJsonLd(tenant: DealerProfile, canonicalUrl: string, ogImage: string, city: string): void {
  if (typeof document === 'undefined') return;

  const SCRIPT_ID = 'dealer-schema-autodealer';
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const schemaData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: tenant.name,
    vatID: tenant.cui,
    address: {
      '@type': 'PostalAddress',
      streetAddress: tenant.address || tenant.showroomAddress || tenant.legalAddress || '',
      addressLocality: city,
      addressCountry: 'RO'
    },
    telephone: tenant.phonePrimary,
    openingHours: tenant.openingHours || 'Luni - Vineri: 09:00 - 18:00, Sambata: 09:00 - 14:00',
    url: canonicalUrl,
    image: ogImage
  };

  if (tenant.googleMapsUrl) {
    schemaData.hasMap = tenant.googleMapsUrl;
  }
  if (tenant.ibanRon) {
    schemaData.paymentAccepted = 'Transfer Bancar, Numerar, Finanțare Auto';
  }
  if (tenant.email) {
    schemaData.email = tenant.email;
  }

  script.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * Funcția principală de injectare și actualizare a meta-tagurilor SEO per Tenant.
 * Idempotentă și sigură pentru SSR / runtime.
 */
export function updateSeoMetadata(tenant: DealerProfile): void {
  if (typeof document === 'undefined' || !tenant) return;

  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const isSpecialPage = 
    path.startsWith('/ghid-auto') || hash.includes('ghid-auto') ||
    path.startsWith('/saas') || hash.includes('saas') ||
    path.startsWith('/termeni-si-conditii') || hash.includes('termeni-si-conditii') ||
    path.startsWith('/politica-cookie') || hash.includes('politica-cookie') ||
    path.startsWith('/livrare-nationala') || hash.includes('livrare-nationala');

  const city = extractDealerCity(tenant);
  const canonicalUrl = resolveCanonicalUrl(tenant);
  const ogImage = resolveOgImage(tenant, canonicalUrl);

  const defaultTitle = `${tenant.name} — Autovehicule Rulate Premium | ${city}`;
  const title = tenant.landingConfig?.seo?.metaTitle || defaultTitle;

  const defaultDesc = `Parc auto ${tenant.name} — stoc verificat de autovehicule rulate, finanțare, livrare națională.${tenant.openingHours ? ' ' + tenant.openingHours + '.' : ''}`;
  const description = tenant.landingConfig?.seo?.metaDescription || defaultDesc;

  // 1. Titlul documentului (protejează paginile dedicate ghid/saas/legal)
  if (!isSpecialPage) {
    document.title = title;
  }

  // 2. Meta description standard
  setMetaTag('meta[name="description"]', { name: 'description' }, description);

  // 3. Link Canonical
  setLinkTag('canonical', canonicalUrl);

  // 4. OpenGraph Social Cards
  setMetaTag('meta[property="og:type"]', { property: 'og:type' }, 'website');
  setMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, tenant.name);
  setMetaTag('meta[property="og:title"]', { property: 'og:title' }, title);
  setMetaTag('meta[property="og:description"]', { property: 'og:description' }, description);
  setMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
  setMetaTag('meta[property="og:image"]', { property: 'og:image' }, ogImage);
  setMetaTag('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, ogImage);

  // 5. Twitter / X Social Cards
  setMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  setMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  setMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, ogImage);

  // 6. Schema.org JSON-LD AutoDealer
  injectAutoDealerJsonLd(tenant, canonicalUrl, ogImage, city);
}

/**
 * Hook React utilitar pentru componente care doresc să asculte direct schimbarea profilului
 */
export function useDealerSEO(tenant: DealerProfile): void {
  useEffect(() => {
    updateSeoMetadata(tenant);
  }, [tenant]);
}
