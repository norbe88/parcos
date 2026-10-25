// =========================================================================
// RXM AUTOMOBILE — Google Gemini Vision OCR cu Rotație Chei API (AutoLicit Engine)
// Recunoaștere documente auto europene & internaționale (DE, RO, FR, IT, NL, BE, US)
// =========================================================================

import { ParsedVehicleDocument, DocOriginCountry, convertKwToHp, maskVinString, sanitizeVin, isValidVin } from './documentOcrParser';
import { getAdminAuthHeaders } from './adminAuth';

// Modele rapide multimodale Gemini (cu fallback în cascadă pe server)
export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

/**
 * Returnează lista de chei disponibile (deprecat: securizat exclusiv pe server)
 */
export function getGeminiKeyPool(): string[] {
  return [];
}

/**
 * Obține o cheie prin rotație (deprecat: securizat exclusiv pe server)
 */
export function getNextGeminiKey(): string {
  return '';
}

const VEHICLE_DOC_PROMPT = `You are an expert automotive document analyst specializing in European and International vehicle registration documents:
- Romania: CIV (Cartea de Identitate a Vehiculului — CIV RAR) & Talon (Certificat de Înmatriculare)
- Germany: Zulassungsbescheinigung Teil I (Fahrzeugschein) & Teil II (Fahrzeugbrief)
- Austria: Zulassungsbescheinigung Teil I (Zulassungsschein) & Teil II (Typenschein / Einzelgenehmigung / KFG 1967)
- France: Certificat d'immatriculation (Carte Grise)
- Italy: Carta di Circolazione / Documento Unico
- Netherlands / Belgium: Kentekenbewijs (RDW) / Inschrijvingsbewijs
- USA: Certificate of Title

Analyze the document image (which may be a 1-page document, a multi-page composite, or an unfolded multi-panel certificate such as the Austrian Zulassungsbescheinigung).
Extract all technical, identification and registration data into a strict JSON object (NO markdown fences, NO explanatory text):
{
  "docOriginCountry": "AT", // One of: "RO", "DE", "AT", "FR", "IT", "NL", "BE", "US", "OTHER"
  "docType": "Zulassungsbescheinigung Teil I", // or "Cartea de Identitate a Vehiculului (CIV)", "Talon Auto", "Zulassungsschein"
  "brand": "Nissan", // Exact brand (field D.1 or 2. Marcă on CIV, e.g. Dacia, Nissan, BMW, Volkswagen, Audi)
  "model": "Qashqai", // Commercial model name without brand prefix (field D.3 or 3. Tipul/Varianta, e.g. Qashqai, Duster, Golf, 520d)
  "versionTrim": "1.5 dCi J11", // Commercial trim level, version, or engine designation (field D.2)
  "vin": "SJNFAAJ11U1120210", // 17-character VIN (field E or E FIN on Austrian/German brief, field 1 on CIV)
  "year": 2015, // 4-digit manufacturing/registration year (field B: Erstmalige Zulassung am)
  "registrationDate": "09.04.2015", // Full date of first registration (field B)
  "powerKw": 81, // Net power in kW from field P.2 (Leistung)
  "powerHp": 110, // Power in HP calculated as round(powerKw * 1.35962)
  "engineCc": 1461, // Displacement in cm3 from field P.1 (Hubraum)
  "fuelType": "Diesel", // One of: "Diesel", "Benzină", "Hibrid", "Electric" (from P.3 Antriebsart/Kraftstoff)
  "color": "Alb", // Color in Romanian: Alb (Weiß), Negru Metalizat (Schwarz), Gri (Grau), Albastru (Blau), Roșu (Rot)
  "bodyType": "SUV", // One of: "SUV" (Mehrzweckfahrzeug / M1G / Teren), "Sedan", "Break" (Kombi), "Hatchback", "Coupe"
  "drivetrain": "Față", // One of: "4x4 / AWD", "Față", "Spate"
  "transmission": "Manuală", // One of: "Automată", "Manuală"
  "civNumber": "AT-202676", // National code or document number (field A7 Nationaler Code on Austria, or Seria CIV on RO)
  "plateNumber": "JO-268HK", // License plate number if visible (field A Kennzeichen)
  "euroNorm": "Euro 5", // Euro pollution norm from field V.9 (e.g. Euro 5b -> Euro 5)
  "confidenceScore": 98 // Float/int confidence 0-100
}

Strict Rules:
1. Brand MUST be the actual brand (Nissan is Nissan, BMW is BMW, etc.). Model MUST NOT repeat brand (e.g. "Qashqai", NOT "Nissan Qashqai").
2. VIN MUST be exactly 17 alphanumeric characters (no letters I, O, Q). On Austrian documents, field is labeled "E FIN" or "FIN".
3. For Austria ("AT"):
   - Country is "AT" (Republik Österreich / KFG 1967).
   - Field B "Erstmalige Zulassung am" gives first registration date and year.
   - Field P.1 "Hubraum" gives displacement in cm3 (e.g. 1461 ccm).
   - Field P.2 "Leistung" gives kW (e.g. 81 kW -> 110 HP).
   - Field P.3 "Antriebsart" gives fuel (Diesel -> Diesel, Benzin -> Benzină).
   - Field A8 "Aufbau: Mehrzweckfahrzeug" maps to bodyType "SUV".
   - Field R "Farbe: Weiß" maps to color "Alb".
   - Field A7 "Nationaler Code" or field A "Kennzeichen" gives document/registration reference.
4. If multiple pages (Front + Back or unfolded panels) are present in the image, combine fields from all sections.
5. Do NOT invent data — return null for unreadable fields.`;

/**
 * Convertește un Blob sau File într-un șir Base64 curat
 */
export async function blobToBase64(blob: Blob): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Format DataURL invalid pentru conversie Base64.'));
        return;
      }
      const mimeMatch = dataUrl.slice(0, commaIndex).match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = dataUrl.slice(commaIndex + 1);
      resolve({ base64Data, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Tranzacție securizată către Gemini Vision:
 * 1. Încearcă mai întâi proxy-ul Nginx / Vite (/api/ocr/gemini/...) cu sesiune admin
 * 2. Fallback pe microserviciul OCR server-side (/api/demo/ocr-scan) cu pool-ul resilient
 * 3. Fallback direct cu rotație dacă există chei client configurate
 */
export async function executeGeminiVisionInference(
  model: string,
  promptText: string,
  base64Data: string,
  mimeType: string,
  onProgress?: (progress: number, message: string) => void
): Promise<any> {
  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { text: promptText },
          { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64Data } }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json'
    }
  });

  // 1. Încercare securizată via Gateway Micro-API (/api/ocr/gemini/) — Protejat cu sesiune admin & Zero chei în client
  try {
    const proxyUrl = `/api/ocr/gemini/models/${model}:generateContent`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const proxyRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      signal: controller.signal,
      body: requestBody
    });

    clearTimeout(timeout);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        return JSON.parse(cleaned);
      }
    } else {
      let errDetail = '';
      try {
        const errJson = await proxyRes.json();
        errDetail = errJson.error || errJson.message || '';
      } catch (_) {}
      console.warn(`[Document OCR Gateway] Backend gateway a returnat HTTP ${proxyRes.status}:`, errDetail);
    }
  } catch (err: any) {
    console.info('[Document OCR Gateway] Serviciu proxy backend indisponibil:', err.message);
  }

  // 1b. Fallback pe microserviciul OCR server-side (/api/demo/ocr-scan) cu pool-ul resilient de chei
  try {
    const demoRes = await fetch('/api/demo/ocr-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: mimeType || 'image/jpeg',
      }),
    });
    if (demoRes.ok) {
      const demoData = await demoRes.json();
      if (demoData?.success && demoData?.vehicleData) {
        return demoData.vehicleData;
      }
    }
  } catch (demoErr: any) {
    console.warn('[Document OCR Gateway] Fallback /api/demo/ocr-scan indisponibil:', demoErr.message);
  }

  // 2. Încheiere sigură: Niciun apel direct din browser către API-ul extern Google
  throw new Error('Serviciul de procesare automată a documentelor este temporar indisponibil. Vă rugăm să asigurați o fotografie clară, bine focalizată și iluminată.');
}

/**
 * Apelează motorul de recunoaștere documente cu rutare securizată
 */
export async function scanDocumentWithGeminiVision(
  imageBlob: Blob,
  onProgress?: (progress: number, message: string) => void
): Promise<ParsedVehicleDocument> {
  const { base64Data, mimeType } = await blobToBase64(imageBlob);

  onProgress?.(35, '✨ Conectare securizată la serviciul de procesare automată...');

  let parsed: any = null;
  let lastError: Error | null = null;

  // 1. Canal primar: Endpoint dedicat Parcos Multi-Tenant (/api/parcos/vehicles/scan-civ)
  try {
    const tenantId = (typeof window !== 'undefined' && (localStorage.getItem('rxm_tenant_id') || localStorage.getItem('parcos_tenant_id'))) || 'rxm';
    onProgress?.(45, '🔍 Transmitere securizată către gateway-ul ParcOS Multi-Tenant...');
    const parcosRes = await fetch('/api/parcos/vehicles/scan-civ', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: mimeType || 'image/jpeg',
        tenantId,
      }),
    });

    if (parcosRes.status === 429) {
      const errJson = await parcosRes.json().catch(() => ({}));
      throw new Error(errJson.error || 'Ați atins limita de procesare simultană a documentelor. Vă rugăm să așteptați câteva momente.');
    }
    if (parcosRes.status === 503) {
      const errJson = await parcosRes.json().catch(() => ({}));
      throw new Error(errJson.error || 'Serviciul inteligent este temporar indisponibil. Datele mașinii pot fi completate manual.');
    }

    if (parcosRes.ok) {
      const parcosData = await parcosRes.json();
      if (parcosData?.success && parcosData?.vehicleData) {
        parsed = parcosData.vehicleData;
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('limita') || err.message.includes('temporar indisponibil'))) {
      throw err;
    }
    console.info('[Parcos Multi-Tenant Proxy] Fallback pe canalul gateway standard:', err.message);
  }

  // 2. Canal secundar de rezervă: Gateway Micro-API
  if (!parsed) {
    for (const model of GEMINI_MODELS) {
      try {
        onProgress?.(55, '🔍 Analiză optică de înaltă rezoluție a documentului...');
        parsed = await executeGeminiVisionInference(model, VEHICLE_DOC_PROMPT, base64Data, mimeType, onProgress);
        if (parsed) break;
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  if (!parsed) {
    throw lastError || new Error('Procesarea automată a documentului auto a întâmpinat o eroare temporară.');
  }

  onProgress?.(90, '✅ Date structurate extrase cu succes din document!');

        // Normalizare și construcție obiect ParsedVehicleDocument
        const vinClean = sanitizeVin(parsed.vin || '');
        const powerKwNum = typeof parsed.powerKw === 'number' ? parsed.powerKw : 0;
        const powerHpNum = parsed.powerHp || convertKwToHp(powerKwNum);

        const brandResolved = parsed.brand || parsed.make || undefined;
        let modelResolved = parsed.model || parsed.commercialName || undefined;
        if (modelResolved && brandResolved) {
          modelResolved = modelResolved.replace(new RegExp(`^${brandResolved}\\s*`, 'i'), '').trim();
        }

        // Normalizare capacitate cilindrică
        const engineCcResolved = typeof parsed.engineCc === 'number'
          ? parsed.engineCc
          : typeof parsed.engineDisplacementCc === 'number'
          ? parsed.engineDisplacementCc
          : typeof parsed.engineDisplacement === 'number'
          ? parsed.engineDisplacement
          : undefined;

        // Normalizare Seria CIV (format X-123456)
        let civResolved = parsed.civNumber || undefined;
        if (civResolved && typeof civResolved === 'string') {
          const civMatch = civResolved.trim().toUpperCase().replace(/\s+/g, '').match(/^([A-Z])[-–]?(\d{6})$/i);
          if (civMatch) civResolved = `${civMatch[1].toUpperCase()}-${civMatch[2]}`;
        }

        // Normalizare Tip Caroserie (inclusiv Mehrzweckfahrzeug Austria)
        let bodyResolved: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback' = 'SUV';
        const rawCategory = (parsed.bodyType || parsed.category || '').toLowerCase();
        if (rawCategory.includes('suv') || rawCategory.includes('m1g') || rawCategory.includes('teren') || rawCategory.includes('mehrzweck')) {
          bodyResolved = 'SUV';
        } else if (rawCategory.includes('berlin') || rawCategory.includes('sedan') || rawCategory.includes('aa')) {
          bodyResolved = 'Sedan';
        } else if (rawCategory.includes('break') || rawCategory.includes('kombi') || rawCategory.includes('wagon') || rawCategory.includes('ac')) {
          bodyResolved = 'Break';
        } else if (rawCategory.includes('coup') || rawCategory.includes('ad')) {
          bodyResolved = 'Coupe';
        } else if (rawCategory.includes('hatch') || rawCategory.includes('af')) {
          bodyResolved = 'Hatchback';
        }

        // Normalizare Culoare (inclusiv Weiß Austria/Germania)
        let colorResolved = parsed.color || undefined;
        if (colorResolved) {
          const cLower = colorResolved.toLowerCase();
          if (cLower.includes('weiß') || cLower.includes('weiss') || cLower.includes('white')) colorResolved = 'Alb';
          else if (cLower.includes('schwarz') || cLower.includes('black')) colorResolved = 'Negru Metalizat';
          else if (cLower.includes('grau') || cLower.includes('grey') || cLower.includes('gris')) colorResolved = 'Gri';
          else if (cLower.includes('blau') || cLower.includes('blue')) colorResolved = 'Albastru';
          else if (cLower.includes('rot') || cLower.includes('red')) colorResolved = 'Roșu';
        }

        // Normalizare Combustibil
        let fuelResolved: 'Diesel' | 'Benzină' | 'Hibrid' | 'Electric' = 'Diesel';
        const rawFuel = (parsed.fuelType || '').toLowerCase();
        if (rawFuel.includes('hybrid') || rawFuel.includes('hibrid') || rawFuel.includes('phev')) {
          fuelResolved = 'Hibrid';
        } else if (rawFuel.includes('electric') || rawFuel.includes('bev')) {
          fuelResolved = 'Electric';
        } else if (rawFuel.includes('diesel') || rawFuel.includes('motorin')) {
          fuelResolved = 'Diesel';
        } else if (rawFuel.includes('benzin') || rawFuel.includes('petrol') || rawFuel.includes('gasoline')) {
          fuelResolved = 'Benzină';
        }

        const docResult: ParsedVehicleDocument = {
          vin: vinClean,
          isVinValid: isValidVin(vinClean),
          maskedVin: maskVinString(vinClean),
          civNumber: civResolved,
          docOriginCountry: (parsed.docOriginCountry as DocOriginCountry) || 'RO',
          brand: brandResolved,
          model: modelResolved,
          versionTrim: parsed.versionTrim || (modelResolved ? `${modelResolved} ${powerHpNum ? powerHpNum + ' CP' : ''}`.trim() : undefined),
          year: typeof parsed.year === 'number' ? parsed.year : undefined,
          registrationDate: parsed.registrationDate || undefined,
          engineCc: engineCcResolved,
          powerKw: powerKwNum > 0 ? powerKwNum : undefined,
          powerHp: powerHpNum > 0 ? powerHpNum : undefined,
          fuelType: fuelResolved,
          color: colorResolved || parsed.color || undefined,
          bodyType: bodyResolved,
          drivetrain: parsed.drivetrain || undefined,
          transmission: parsed.transmission || undefined,
          mileageKm: typeof parsed.mileageKm === 'number' ? parsed.mileageKm : undefined,
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 95,
          extractedCodes: {
            'D.1 Marcă': brandResolved || '',
            'D.3 Model': modelResolved || '',
            'E VIN': vinClean,
            'B Dată Înmatriculare': parsed.registrationDate || String(parsed.year || ''),
            'P.1 Cilindree': engineCcResolved ? `${engineCcResolved} cm³` : '',
            'P.2 Putere': powerKwNum ? `${powerKwNum} kW (${powerHpNum} CP)` : '',
            'P.3 Combustibil': fuelResolved || '',
            'R Culoare': colorResolved || parsed.color || '',
            'Seria CIV': civResolved || '',
            'Tip Document': parsed.docType || 'Cartea de Identitate a Vehiculului / Talon'
          },
          recognizedFieldsCount: Object.keys(parsed).filter(k => parsed[k] !== null && parsed[k] !== undefined).length,
          rawText: JSON.stringify(parsed, null, 2),
          warnings: []
        };

        return docResult;
}
