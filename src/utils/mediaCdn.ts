/**
 * ParcOS — Cloudflare R2 Media CDN Resolver
 * Livrare ultrarapidă cu 0$ egress din nodul Cloudflare R2 (București/EEUR)
 */

export const R2_PUBLIC_CDN_BASE = 
  (import.meta.env.VITE_MEDIA_CDN_URL || 'https://pub-5ced75b7fce64ed6b6a934bdc3a279c0.r2.dev')
    .replace(/\/$/, '');

/**
 * Rezolvă URL-ul unei resurse media (video, imagine, PDF):
 * - Dacă este deja un URL absolut (https://...), îl returnează neschimbat.
 * - Dacă este o cale relativă (/videos/..., /images/...), o direcționează către Cloudflare R2 CDN.
 */
export function getCdnMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
  return `${R2_PUBLIC_CDN_BASE}/${cleanPath}`;
}
