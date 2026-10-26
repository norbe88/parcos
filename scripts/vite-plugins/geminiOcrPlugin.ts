import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

let devGeminiKeyRoundRobinIndex = 0;
function getDevGeminiKeys(): string[] {
  let envKeyStr = process.env.GEMINI_API_KEY || '';
  if (!envKeyStr) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
        if (match && match[1]) {
          envKeyStr = match[1].trim();
        }
      }
    } catch {}
  }
  const parsed = envKeyStr.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  if (parsed.length <= 1) return parsed;
  const offset = devGeminiKeyRoundRobinIndex % parsed.length;
  devGeminiKeyRoundRobinIndex = (devGeminiKeyRoundRobinIndex + 1) % parsed.length;
  return [...parsed.slice(offset), ...parsed.slice(0, offset)];
}

export async function handleGeminiOcrProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/ocr/gemini/') && !req.url.startsWith('/api/admin/ocr/gemini/'))) return false;

  try {
    const subpath = req.url.replace(/^\/api\/(?:admin\/)?ocr\/gemini\//, '');
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const availableKeys = getDevGeminiKeys();
    if (availableKeys.length === 0) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Serviciul de procesare automată a documentelor nu este disponibil.' }));
      return true;
    }

    let lastStatus = 500;
    let lastText = '';

    for (const apiKey of availableKeys) {
      try {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${subpath}`;
        const upstreamRes = await fetch(targetUrl, {
          method: req.method || 'POST',
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'x-goog-api-key': apiKey
          },
          body: bodyBuffer.length > 0 ? bodyBuffer : undefined
        });

        lastStatus = upstreamRes.status;
        lastText = await upstreamRes.text();

        if (upstreamRes.ok) {
          res.statusCode = 200;
          res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
          res.end(lastText);
          return true;
        }

        if (upstreamRes.status === 429) {
          continue; // rotație pe cheia următoare
        }
        break;
      } catch (_) {}
    }

    res.statusCode = lastStatus;
    res.setHeader('Content-Type', 'application/json');
    res.end(lastText || JSON.stringify({ error: 'Eroare la procesarea internă a documentului.' }));
    return true;
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Eroare la procesarea internă a documentului.' }));
    return true;
  }
}

const DEV_DEMO_MAX_SCANS = 3;
const devDemoScanMap = new Map<string, { count: number; resetAt: number }>();

async function handleDemoOcrProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/demo/ocr-scan') && !req.url.startsWith('/api/demo/ocr-quota'))) {
    return false;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  // GET /api/demo/ocr-quota
  if (req.method === 'GET' && req.url.startsWith('/api/demo/ocr-quota')) {
    const urlObj = new URL(req.url, 'http://localhost');
    const clientToken = urlObj.searchParams.get('clientToken') || (req.headers['x-client-token'] as string) || '';
    
    let maxUsed = 0;
    const now = Date.now();
    for (const key of [clientIp, clientToken].filter(Boolean)) {
      const entry = devDemoScanMap.get(key);
      if (entry && now < entry.resetAt) {
        maxUsed = Math.max(maxUsed, entry.count);
      }
    }
    const remaining = Math.max(0, DEV_DEMO_MAX_SCANS - maxUsed);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      remainingScans: remaining,
      limitReached: remaining <= 0,
      maxAllowed: DEV_DEMO_MAX_SCANS
    }));
    return true;
  }

  // POST /api/demo/ocr-scan
  if (req.method === 'POST' && req.url.startsWith('/api/demo/ocr-scan')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    let parsed: any = {};
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'JSON invalid' }));
      return true;
    }

    const clientToken = parsed.clientToken || (req.headers['x-client-token'] as string) || '';
    let maxUsed = 0;
    const now = Date.now();
    for (const key of [clientIp, clientToken].filter(Boolean)) {
      const entry = devDemoScanMap.get(key);
      if (entry && now < entry.resetAt) {
        maxUsed = Math.max(maxUsed, entry.count);
      }
    }

    if (maxUsed >= DEV_DEMO_MAX_SCANS) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        limitReached: true,
        remainingScans: 0,
        error: 'Ați atins limita de 3 scanări gratuite pentru test.',
        message: 'Ai testat puterea scannerului ParcOS AI pe 3 documente reale. Pentru scanări nelimitate, integrare automată în contracte și acces complet la platformă, solicită un cont dealer sau programează un demo live.'
      }));
      return true;
    }

    const { imageBase64, mimeType = 'image/jpeg' } = parsed;
    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă imageBase64' }));
      return true;
    }

    const availableKeys = getDevGeminiKeys();

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
    const promptText = `You are an expert automotive document analyst specializing in European vehicle registration documents:
- Romania: CIV & Talon
- Germany: Zulassungsbescheinigung Teil I & II
- Austria: Zulassungsbescheinigung Teil I (Zulassungsschein) & Typenschein (KFG 1967).
- France: Carte Grise
- Italy: Carta di Circolazione
Analyze the document image. Extract strict JSON:
{
  "docOriginCountry": "AT", // "RO", "DE", "AT", "FR", "IT", "OTHER"
  "docType": "Zulassungsbescheinigung Teil I",
  "brand": "VOLKSWAGEN",
  "model": "Passat",
  "versionTrim": "",
  "vin": "WVWZZZ...",
  "year": 2018,
  "registrationDate": "14.05.2018",
  "powerKw": 110,
  "powerHp": 150,
  "engineCc": 1968,
  "fuelType": "Diesel",
  "color": "Negru",
  "bodyType": "Break",
  "civNumber": "",
  "plateNumber": "",
  "euroNorm": "Euro 6",
  "co2": "108 g/km",
  "confidenceScore": 99
}
Strict Rules:
1. Brand is actual brand, model must NOT repeat brand.
2. VIN must be exactly 17 alphanumeric characters (field E or FIN).
3. For Austria: Field B gives Erstmalige Zulassung, P.1 Hubraum, P.2 Leistung (kW), P.3 Antriebsart.
4. Return null for unreadable fields. Strictly output JSON with no fences.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let extracted: any = null;

    try {
      for (const model of candidateModels) {
        if (extracted) break;
        for (const devKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${devKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: cleanedBase64 } }] }],
                generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
              })
            });

            if (!upstreamRes.ok) {
              continue;
            }

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extracted = JSON.parse(cleanJsonText);
              break;
            }
          } catch (_) {}
        }
      }

      if (!extracted) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          error: 'Documentul nu a putut fi citit automat. Vă rugăm să folosiți o fotografie clară, bine focalizată a documentului.'
        }));
        return true;
      }

      // increment usage
      const resetAt = now + 24 * 60 * 60 * 1000;
      let newCount = 1;
      for (const key of [clientIp, clientToken].filter(Boolean)) {
        const entry = devDemoScanMap.get(key);
        if (!entry || now > entry.resetAt) {
          devDemoScanMap.set(key, { count: 1, resetAt });
        } else {
          entry.count += 1;
          newCount = Math.max(newCount, entry.count);
        }
      }

      const remaining = Math.max(0, DEV_DEMO_MAX_SCANS - newCount);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        remainingScans: remaining,
        limitReached: remaining <= 0,
        vehicleData: extracted
      }));
      return true;
    } catch (_) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Documentul nu a putut fi citit automat. Vă rugăm să folosiți o fotografie clară, bine iluminată și focalizată.'
      }));
      return true;
    }
  }

  return false;
}

async function handleParcosMultiTenantProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/parcos/vehicles/scan-civ') && !req.url.startsWith('/api/parcos/ai/sanitize-description') && !req.url.startsWith('/api/parcos/clients/scan-id'))) {
    return false;
  }

  // 1. POST /api/parcos/vehicles/scan-civ
  if (req.method === 'POST' && req.url.startsWith('/api/parcos/vehicles/scan-civ')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    let parsed: any = {};
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'JSON invalid' }));
      return true;
    }

    const { imageBase64, mimeType = 'image/jpeg', countryHint = 'AUTO', tenantId = 'rxm' } = parsed;
    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă imageBase64' }));
      return true;
    }

    const availableKeys = getDevGeminiKeys();
    if (availableKeys.length === 0) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă chei Gemini în .env' }));
      return true;
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
    const promptText = `You are an expert automotive document analyst specializing in European and International vehicle registration documents:
- Romania: CIV & Talon
- Germany: Zulassungsbescheinigung Teil I & II
- Austria: Zulassungsbescheinigung Teil I (Zulassungsschein) & Typenschein (KFG 1967).
- France: Carte Grise
- Italy: Carta di Circolazione
Extract strict JSON:
{
  "docOriginCountry": "RO",
  "docType": "Cartea de Identitate a Vehiculului (CIV)",
  "brand": "VOLKSWAGEN",
  "model": "Passat",
  "versionTrim": "",
  "vin": "WVWZZZ3CZWE123456",
  "year": 2018,
  "registrationDate": "15.03.2018",
  "powerKw": 110,
  "powerHp": 150,
  "engineCc": 1968,
  "fuelType": "Diesel",
  "color": "Negru",
  "bodyType": "Break",
  "civNumber": "X-123456",
  "plateNumber": "CJ-01-RXM",
  "euroNorm": "Euro 6",
  "confidenceScore": 99
}
Strict Rules:
1. Brand is actual brand, model must NOT repeat brand.
2. VIN must be exactly 17 alphanumeric characters.
3. Return null for unreadable fields. Strictly output JSON with no fences.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let extracted: any = null;

    try {
      for (const model of candidateModels) {
        if (extracted) break;
        for (const devKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${devKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: cleanedBase64 } }] }],
                generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
              })
            });

            if (!upstreamRes.ok) continue;

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extracted = JSON.parse(cleanJsonText);
              break;
            }
          } catch (_) {}
        }
      }

      if (!extracted) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Documentul nu a putut fi citit optic.' }));
        return true;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, tenantId, vehicleData: extracted }));
      return true;
    } catch (_) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Eroare la procesarea internă a documentului.' }));
      return true;
    }
  }

  // 2. POST /api/parcos/ai/sanitize-description
  if (req.method === 'POST' && req.url.startsWith('/api/parcos/ai/sanitize-description')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    let parsed: any = {};
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'JSON invalid' }));
      return true;
    }

    const { brand = '', model = '', year = 2020, specs = '', rawDescription = '', tenantId = 'rxm' } = parsed;
    const availableKeys = getDevGeminiKeys();
    if (availableKeys.length === 0) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă chei Gemini în .env' }));
      return true;
    }

    const promptText = `Ești copywriter auto de elită pentru showroom-uri din rețeaua ParcOS / CARVANA SRL.
Redactează descrierea comercială a vehiculului: ${brand} ${model} (${year}).
Specificații: ${specs}.
Text brut: ${rawDescription}.
Reguli: Română impecabilă, TVA deductibil 21% (dacă e cazul), termen obligatoriu 'Cont de Garanție', fără 'escrow'.
Returnează strict JSON: { "sanitizedDescription": "..." }`;

    let sanitizedDescription = '';
    for (const key of availableKeys) {
      try {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
        const upstreamRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.3, response_mime_type: 'application/json' }
          })
        });
        if (upstreamRes.ok) {
          const resJson = await upstreamRes.json();
          const raw = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            sanitizedDescription = JSON.parse(cleaned).sanitizedDescription || '';
            if (sanitizedDescription) break;
          }
        }
      } catch (_) {}
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, tenantId, description: sanitizedDescription || rawDescription }));
    return true;
  }

  // 3. POST /api/parcos/clients/scan-id
  if (req.method === 'POST' && req.url.startsWith('/api/parcos/clients/scan-id')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    let parsed: any = {};
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'JSON invalid' }));
      return true;
    }

    const { imageBase64, mimeType = 'image/jpeg', tenantId = 'rxm' } = parsed;
    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă imageBase64' }));
      return true;
    }

    const availableKeys = getDevGeminiKeys();
    if (availableKeys.length === 0) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă chei Gemini în .env' }));
      return true;
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
    const promptText = `You are a specialized European Identity Document OCR AI Analyst for Romanian Identity Cards (Cărți de Identitate). Extract strictly raw JSON:
{
  "fullName": "POPESCU MIHAI",
  "lastName": "POPESCU",
  "firstName": "MIHAI",
  "cnp": "1850412125890",
  "idSeries": "CJ",
  "idNumber": "874521",
  "address": "Str. Memorandumului nr. 12",
  "city": "Cluj-Napoca",
  "county": "Cluj",
  "issuingAuthority": "SPCLEP Cluj-Napoca",
  "expiryDate": "12.05.2030",
  "docTypeDetected": "CI_RO_CLASIC",
  "confidenceScore": 98
}
Return ONLY valid JSON with no markdown fences.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let extracted: any = null;

    try {
      for (const model of candidateModels) {
        if (extracted) break;
        for (const devKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${devKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: cleanedBase64 } }] }],
                generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
              })
            });

            if (!upstreamRes.ok) continue;

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extracted = JSON.parse(cleanJsonText);
              break;
            }
          } catch (_) {}
        }
      }

      if (!extracted) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Actul de identitate nu a putut fi citit optic.' }));
        return true;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, tenantId, idData: extracted }));
      return true;
    } catch (_) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Eroare la procesarea internă a actului de identitate.' }));
      return true;
    }
  }

  return false;
}

export function geminiOcrPlugin(): Plugin {
  return {
    name: 'parcos-gemini-ocr-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (await handleGeminiOcrProxy(req, res)) return;
        if (await handleDemoOcrProxy(req, res)) return;
        if (await handleParcosMultiTenantProxy(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (await handleGeminiOcrProxy(req, res)) return;
        if (await handleDemoOcrProxy(req, res)) return;
        if (await handleParcosMultiTenantProxy(req, res)) return;
        next();
      });
    },
  };
}
