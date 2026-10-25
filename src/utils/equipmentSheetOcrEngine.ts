// =========================================================================
// RXM AUTOMOBILE — Motor Dedicat OCR Fișe de Dotări & Echipare din Fabrică
// Analiză optică avansată pentru Window Stickers, Fișe Dealer & Liste Opționale
// (Mazda, BMW, Mercedes-Benz, Audi, Volkswagen, Renault, etc.)
// =========================================================================

import { preprocessDocumentImage } from './documentOcrEngine';
import { 
  blobToBase64, GEMINI_MODELS, executeGeminiVisionInference 
} from './geminiVisionEngine';
import { isInvalidCorruptedFeature } from './featuresCatalogService';

export interface ExtractedOptionalFeature {
  code?: string;
  name: string;
  priceEurNoVat?: number;
  priceEurWithVat?: number;
}

export interface ExtractedVehicleSheetHeader {
  brand?: string;
  model?: string;
  engine?: string;
  powerHp?: number;
  versionTrim?: string;
  transmission?: string;
}

export interface EquipmentSheetScanResult {
  header: ExtractedVehicleSheetHeader;
  rawText: string;
  heroHighlights: string[];      // Top 8-12 dotări cu impact maxim de vânzare
  standardFeatures: string[];    // Toate dotările standard din fișă (curățate)
  optionalFeatures: ExtractedOptionalFeature[]; // Opționale cu cost suplimentar
  summaryText: string;           // Text lizibil formatat pentru descriere sau preview
  executionTimeMs: number;
}

/**
 * Cuvinte cheie și șabloane de zgomot / dotări standard banale (Baseline Noise)
 * Acestea NU trebuie să ajungă niciodată ca Hero Highlights sau în descrierea de showroom.
 */
export const NOISE_FEATURE_PATTERNS = [
  /muf[aă]\s*12v/i,
  /mufe?\s*aux/i,
  /torpedou\s*iluminat/i,
  /suport\s*pahare/i,
  /anten[aă]\s*tip\s*rechin/i,
  /semnalizare\s*lateral[aă]\s*integrat[aă]/i,
  /geamuri\s*reglabile\s*electric/i,
  /banchet[aă]\s*rabatabil[aă]/i,
  /set\s*repara[tț]ie\s*pneuri/i,
  /imobilizator/i,
  /lumini\s*led\s*pl[aă]cu[tț]e/i,
  /manere\s*u[sș]i\s*[iî]n\s*culoarea/i,
  /oglind[aă]\s*curtoazie/i,
  /oglinzi\s*[sș]i\s*manere/i,
  /polita\s*portbagaj/i,
  /spatar\s*reglabil\s*manual/i,
  /scaune\s*fata\s*reglabile\s*manual/i,
  /suport\s*lombar.*reglabil\s*manual/i,
  /buton\s*pornire/i,
  /computer\s*de\s*bord/i,
  /dimensiuni\s*pneuri/i,
  /inchidere\s*centralizata/i,
  /inchidere\s*automata\s*usi/i,
  /radio\s*am\/fm/i,
  /volan\s*ajustabil/i
];

/**
 * Verifică dacă o dotare reprezintă zgomot banal de fond
 */
export function isTrivialNoiseFeature(featureName: string): boolean {
  if (!featureName || typeof featureName !== 'string') return true;
  const trimmed = featureName.trim();
  if (trimmed.length < 4) return true;
  return NOISE_FEATURE_PATTERNS.some(rx => rx.test(trimmed));
}

/**
 * Prompt strict pentru Gemini Vision dedicat extragerii de fișe de dotări
 */
const EQUIPMENT_SHEET_VISION_PROMPT = `You are an expert automotive equipment analyst specializing in factory specification sheets, dealer equipment sheets (Fișe de Dotări / Echipare), and manufacturer option lists (Mazda, BMW, Audi, Mercedes, VW, Renault, etc.).

Analyze the document image (which typically contains columns of STANDARD EQUIPMENT / "DOTARI STANDARD", OPTIONAL EQUIPMENT / "DOTARI OPTIONALE", and a header with vehicle model and trim level):

Extract the information into a strict JSON object (NO markdown fences, NO explanatory text):
{
  "header": {
    "brand": "Mazda", // e.g. Mazda, BMW, Mercedes-Benz, Audi, Volkswagen
    "model": "CX-5", // e.g. CX-5, Seria 5, A4, Golf, Duster
    "engine": "2.0l", // e.g. 2.0l, 2.0 TDI, 1.5 dCi
    "powerHp": 165, // e.g. 165
    "versionTrim": "Revolution", // trim level if visible, e.g. Revolution, M-Sport, S-Line, Takumi, Exclusive
    "transmission": "Automată" // "Automată" or "Manuală"
  },
  "standardFeatures": [
    // List of every clean standard feature line found under "DOTARI STANDARD" / Standard Equipment.
    // Clean bullet points (strip '•', '-', '*', '–'). Keep the natural Romanian or original language.
    // e.g. "10 difuzoare", "Faruri LED Matrix adaptive", "Sistem audio BOSE", "Head Up display proiectat pe parbriz", "Pilot automat adaptiv", "Hayon electric", "Scaune fata incalzite", "Volan incalzit", "Sistem monitorizare 360", etc.
  ],
  "optionalFeatures": [
    // Any paid options listed in tables such as "DOTARI OPTIONALE INCLUSE IN PRET" or "Optionale"
    {
      "code": "41W",
      "name": "NEGRU JET",
      "priceEurNoVat": 428.57,
      "priceEurWithVat": 510.00
    }
  ],
  "heroHighlights": [
    // The top 6-10 highest-value, most attractive showroom selling points extracted from this specific car (e.g. BOSE, Matrix LED, Head-Up Display, 360 Camera, Distronic/ACC, Electric Tailgate, Heated Seats/Steering Wheel, Blind Spot Monitoring, 19" Alloys, Apple CarPlay/Android Auto).
    // DO NOT include trivial items like "Mufa 12V", "Torpedou iluminat", "Suport pahare", "Antena rechin" here!
  ]
}

Strict Rules:
1. DO NOT return vehicle registration schema fields (no "docOriginCountry", "civNumber", "vin").
2. Standard features MUST be extracted as an array of human-readable feature strings, NEVER as raw JSON key-value dumps.
3. Distinguish clearly between standard equipment and paid optional equipment.
4. If optional prices with 21% VAT are listed, extract both without-VAT and with-VAT amounts.`;

/**
 * Procesează optic o foaie / fișă de dotări sau etichetă PR-Codes
 */
export async function processEquipmentSheetOcr(
  imageSource: File | Blob | string,
  options: {
    rotation?: number;
    contrastBoost?: number;
    onProgress?: (progress: number, stepMessage: string) => void;
  } = {}
): Promise<EquipmentSheetScanResult> {
  const startTime = performance.now();
  const { onProgress, rotation = 0, contrastBoost = 1.25 } = options;

  onProgress?.(15, '📸 Calibrare optică & optimizare contrast foaie de dotări...');
  const { preprocessedBlob } = await preprocessDocumentImage(
    imageSource,
    rotation,
    contrastBoost
  );

  const { base64Data, mimeType } = await blobToBase64(preprocessedBlob);

  onProgress?.(30, '⚡ Declanșare analiză automată fișă de dotări...');

  let parsed: any = null;
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      onProgress?.(50, '🔍 Analiză dotări standard & pachete opționale din fabrică...');
      parsed = await executeGeminiVisionInference(
        model,
        EQUIPMENT_SHEET_VISION_PROMPT,
        base64Data,
        mimeType,
        onProgress
      );
      if (parsed) break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!parsed) {
    throw lastError || new Error('Documentul nu a putut fi analizat automat. Vă rugăm să reîncercați.');
  }

  onProgress?.(90, '✨ Structurare dotări, separare opționale cu cost și clasificare...');

        // 1. Curățare și validare Header
        const header: ExtractedVehicleSheetHeader = {
          brand: parsed.header?.brand || undefined,
          model: parsed.header?.model || undefined,
          engine: parsed.header?.engine || undefined,
          powerHp: typeof parsed.header?.powerHp === 'number' ? parsed.header.powerHp : undefined,
          versionTrim: parsed.header?.versionTrim || undefined,
          transmission: parsed.header?.transmission || undefined
        };

        // 2. Curățare și deduplicare Dotări Standard
        const rawStandard = Array.isArray(parsed.standardFeatures) ? parsed.standardFeatures : [];
        const cleanStandard: string[] = [];
        const seenStandard = new Set<string>();

        for (const item of rawStandard) {
          if (typeof item === 'string') {
            const trimmed = item
              .replace(/^[-•*–+]\s*/, '')
              .replace(/^[0-9A-Z]{3,5}\s+/, '')
              .trim();

            if (
              trimmed.length >= 3 && 
              trimmed.length <= 70 && 
              !isInvalidCorruptedFeature(trimmed)
            ) {
              const norm = trimmed.toLowerCase();
              if (!seenStandard.has(norm)) {
                seenStandard.add(norm);
                cleanStandard.push(trimmed);
              }
            }
          }
        }

        // 3. Curățare Opționale cu Plată (TVA 21%)
        const rawOptionals = Array.isArray(parsed.optionalFeatures) ? parsed.optionalFeatures : [];
        const cleanOptionals: ExtractedOptionalFeature[] = [];

        for (const opt of rawOptionals) {
          if (opt && typeof opt.name === 'string' && opt.name.trim().length > 0) {
            cleanOptionals.push({
              code: opt.code ? String(opt.code).trim() : undefined,
              name: opt.name.trim(),
              priceEurNoVat: typeof opt.priceEurNoVat === 'number' ? opt.priceEurNoVat : undefined,
              priceEurWithVat: typeof opt.priceEurWithVat === 'number' ? opt.priceEurWithVat : undefined
            });
          }
        }

        // 4. Hero Highlights (Dotări de Top)
        const rawHero = Array.isArray(parsed.heroHighlights) ? parsed.heroHighlights : [];
        let heroHighlights: string[] = [];
        const seenHero = new Set<string>();

        // Preia din heroHighlights propuse de AI (doar dacă nu sunt zgomot)
        for (const h of rawHero) {
          if (typeof h === 'string') {
            const trimmed = h.trim();
            if (
              trimmed.length >= 3 && 
              !isTrivialNoiseFeature(trimmed) && 
              !isInvalidCorruptedFeature(trimmed)
            ) {
              const norm = trimmed.toLowerCase();
              if (!seenHero.has(norm)) {
                seenHero.add(norm);
                heroHighlights.push(trimmed);
              }
            }
          }
        }

        // Dacă AI nu a returnat destule hero highlights, le căutăm noi cu regex în lista standard
        if (heroHighlights.length < 5) {
          const HIGH_VALUE_PATTERNS = [
            /bose|harman|burmester|bang\s*&\s*olufsen|audio\s*premium/i,
            /matrix|full\s*led|laser|adaptiv.*led/i,
            /head-?up|hud/i,
            /360|surround\s*view|area\s*view/i,
            /distronic|acc|pilot\s*automat\s*adaptiv/i,
            /hayon\s*electric|portbagaj\s*electric/i,
            /scaune.*[iî]nc[aă]lzite/i,
            /volan.*[iî]nc[aă]lzit/i,
            /unghi\s*mort|blind\s*spot|absm|rcta/i,
            /carplay|android\s*auto/i,
            /jante.*1[89]|jante.*20/i,
            /smart\s*key|keyless/i
          ];

          for (const item of cleanStandard) {
            if (HIGH_VALUE_PATTERNS.some(rx => rx.test(item))) {
              const norm = item.toLowerCase();
              if (!seenHero.has(norm) && !isTrivialNoiseFeature(item)) {
                seenHero.add(norm);
                heroHighlights.push(item);
                if (heroHighlights.length >= 10) break;
              }
            }
          }
        }

        // Construire rezumat lizibil pentru caseta din formular
        let summary = `📋 Fișă Echipare identificată: ${header.brand || ''} ${header.model || ''} ${header.versionTrim ? `(${header.versionTrim})` : ''}\n`;
        summary += `• Dotări standard detectate: ${cleanStandard.length}\n`;
        if (cleanOptionals.length > 0) {
          summary += `• Opționale incluse în preț: ${cleanOptionals.map(o => `${o.name} (${o.priceEurWithVat ? o.priceEurWithVat + ' € cu TVA 21%' : ''})`).join(', ')}\n`;
        }
        summary += `• Top Dotări Cheie: ${heroHighlights.slice(0, 8).join(' • ')}`;

        const executionTimeMs = Math.round(performance.now() - startTime);
        onProgress?.(100, `✅ Fișă procesată cu succes! (${cleanStandard.length} dotări standard, ${heroHighlights.length} cheie)`);

    return {
      header,
      rawText: cleanStandard.join('\n'),
      heroHighlights,
      standardFeatures: cleanStandard,
      optionalFeatures: cleanOptionals,
      summaryText: summary,
      executionTimeMs
    };
  }


