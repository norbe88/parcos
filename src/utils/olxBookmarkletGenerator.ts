/**
 * src/utils/olxBookmarkletGenerator.ts
 * Generator de Smart Bookmarklet (1-Click) pentru publicare pe OLX fără instalare de extensii
 * Folosește motorul unificat din olxFormInjectorCore.ts
 */

import { getUnifiedOlxInjectorSourceCode } from './olxFormInjectorCore';

/**
 * Codul core de execuție injectat pe olx.ro/adding/
 */
export function getOlxInjectorScriptSource(): string {
  return getUnifiedOlxInjectorSourceCode();
}

/**
 * Generează URL-ul bookmarklet minificat `javascript:...`
 */
export function generateOlxBookmarkletUrl(): string {
  const code = getOlxInjectorScriptSource()
    .replace(/\/\/.*/g, '') // elimină comentarii pe o linie
    .replace(/\s+/g, ' '); // compactare spații albe
  return `javascript:${encodeURIComponent(code)}`;
}
