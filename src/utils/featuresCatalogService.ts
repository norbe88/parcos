/**
 * RXM AUTOMOBILE — Persistent Features Catalog Service
 * Gestiune centralizată și persistentă a dotărilor auto (catalog implicit + dotări adăugate manual sau detectate optic).
 * 
 * Invariante:
 * - Persistență permanentă în localStorage (cheia: 'rxm_custom_features')
 * - Deduplicare case-insensitive și diacritic-friendly
 * - Fallback în memorie în medii fără DOM/SSR
 * - Eveniment de sincronizare 'rxm_features_updated' pentru reactivitate multi-componentă
 */

export const RXM_CUSTOM_FEATURES_KEY = 'rxm_custom_features';

export const DEFAULT_SHOWROOM_FEATURES: readonly string[] = [
  'Faruri Full LED',
  'Faruri Bi-Xenon Adaptive',
  'Plafon Panoramic',
  'Trapă Electrică',
  'Scaune Încălzite',
  'Ventilație Scaune',
  'Scaune Electrice cu Memorie',
  'Masaj Scaune',
  'Climatronic 2 Zone',
  'Climatronic 3 Zone',
  'Virtual Cockpit',
  'Head-Up Display (HUD)',
  'Distronic ACC',
  'Lane Assist',
  'Asistent Unghi Mort (BSM)',
  'Camere 360°',
  'Senzori Parcare F/S',
  'Apple CarPlay & Android Auto',
  'Sistem Audio Premium (Bose/Logic 7)',
  'Keyless Entry & Start',
  'Portbagaj Electric',
  'Volan Încălzit',
  'Pachet M-Sport / S-Line / R-Line',
  'Cârlig Remorcare',
  'Jante Aliaj R18 / R19'
];

/**
 * Dicționar de normalizare pentru chei brute/slug-uri extrase din platforme externe (WordPress, OLX, scrapere)
 */
export const RAW_FEATURE_DISPLAY_MAP: Record<string, string> = {
  // Siguranță & Asistență la condus
  'senzor_ploaie': 'Senzori de ploaie cu acționare automată',
  'senzor_lumini': 'Senzori de lumină (aprindere automată faruri)',
  'senzoriparcarefata': 'Senzori de parcare față',
  'senzoriparcarespate': 'Senzori de parcare spate',
  'parktronic': 'Sistem asistență parcare Parktronic (față/spate)',
  'parcarea': 'Asistent parcare automată (Park Assist)',
  'farurixenon': 'Faruri Bi-Xenon / Xenon adaptive',
  'spalatoarefar': 'Spălătoare faruri telescopice',
  'cameramarsarier': 'Cameră video marșarier',
  'adaptivecruisecontrol': 'Pilot automat adaptiv (Adaptive Cruise Control)',
  'speed warning': 'Avertizare depășire viteză (Speed Warning)',
  'stopuri led': 'Stopuri spate cu tehnologie LED',
  'lumini de zi led': 'Lumini de zi LED (Daylight)',
  'laneassist': 'Lane Assist (Asistent activ menținere bandă)',
  'semne': 'Sign Assist (Recunoaștere indicatoare rutiere)',
  'frontassis': 'Front Assist cu frânare autonomă de urgență',
  'driveralert': 'Driver Alert (Sistem detectare oboseală șofer)',
  'asistentiesireparcare': 'Rear Traffic Alert (Asistent ieșire parcare)',
  'blindsportassist': 'Blind Spot Assist (Asistent monitorizare unghi mort)',
  'asistent faza lunga': 'Asistent fază lungă automată (High Beam Assist)',
  'roata de rezerva': 'Roată de rezervă completă',

  // Confort & Interior
  'servo_directie': 'Servodirecție asistată electronic',
  'clima': 'Climatizare automată Climatronic',
  'geamuri_electrice': 'Geamuri electrice față / spate',
  'computer_bord': 'Computer de bord multifuncțional',
  'incalzire_scaune': 'Scaune față încălzite cu reglaj termic',
  'incalzire_oglinzi': 'Oglinzi exterioare încălzite și reglabile electric',
  'oglinzirabatabileelectric': 'Oglinzi exterioare rabatabile electric',
  'interior_piele': 'Tapițerie interior piele de înaltă calitate',
  'keyless entry': 'Keyless Entry (Acces fără cheie)',
  'keyless go': 'Keyless GO (Pornire motor la buton)',
  'moduri de condus': 'Selector moduri de condus (Drive Mode Select)',
  'carlig': 'Cârlig de remorcare omologat',
  'carlig_copy': 'Cârlig de remorcare omologat',
  'haionelectric': 'Portbagaj / Haion acționat electric',
  'trapapanoramica': 'Plafon panoramic din sticlă',
  'trapa': 'Trapă electrică rabatabilă',
  'volansport': 'Volan sport multifuncțional îmbrăcat în piele',
  'incalzireinvolan': 'Volan încălzit cu reglaj termic',
  'scaune sport': 'Scaune sport ergonomice cu suport lateral',
  'incalzirebancheta': 'Banchetă spate încălzită',
  'incalzireinparbriz': 'Parbriz cu degivrare termică încălzit',
  'set complet roti de iarna/vara extra': 'Set complet roți suplimentare (Iarnă / Vară)',
  'webasto': 'Încălzire auxiliară programabilă (Webasto)',
  'scaunemasaj': 'Scaune ergonomice cu funcție de masaj',
  'cruise_control': 'Pilot automat (Cruise Control / Tempomat)',

  // Tehnologie & Multimedia
  'usbaux': 'Conexiune multimedia USB & AUX-In',
  'bluethooth': 'Conectivitate Bluetooth Audio & Handsfree',
  'navigatie_gps': 'Sistem de navigație GPS profesional',
  'applecarplay': 'Conectivitate Apple CarPlay',
  'androidauto': 'Conectivitate Android Auto',
  'sistemsonorizarepremium': 'Sistem sonorizare audio premium',
  'bordvirtual': 'Ceasuri de bord digitale (Virtual Cockpit)',
  'wirelesstel': 'Încărcare telefon prin inducție (Wireless Charging)'
};

/**
 * Formatează o dotare pentru afișarea estetică în UI:
 * Elimină caractere invizibile (\u2060), snake_case, typo-uri și mapează la denumiri curate.
 */
export function formatFeatureDisplay(feat: string): string {
  if (!feat || typeof feat !== 'string') return '';
  const cleanKey = feat.replace(/^[\u2060\u00a0\s]+|[\u2060\u00a0\s]+$/g, '').toLowerCase().trim();
  if (RAW_FEATURE_DISPLAY_MAP[cleanKey]) {
    return RAW_FEATURE_DISPLAY_MAP[cleanKey];
  }
  // Curățare fallback pentru snake_case sau caractere ciudate
  const deSnaked = feat.replace(/^[\u2060\u00a0\s]+/, '').replace(/_/g, ' ').trim();
  return deSnaked.charAt(0).toUpperCase() + deSnaked.slice(1);
}

/**
 * Curăță și deduplică textul fișei tehnice complete din fabrică
 */
export function formatEquipmentSheetText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  const parts = rawText
    .split(/[•,\n]/)
    .map(p => p.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const cleanParts: string[] = [];

  for (const part of parts) {
    const formatted = formatFeatureDisplay(part);
    const norm = formatted.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      cleanParts.push(formatted);
    }
  }

  return cleanParts.join(' • ');
}

let inMemoryCustomFeatures: string[] = [];

/**
 * Verifică disponibilitatea localStorage în mediul curent
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Verifică dacă un șir este un artefact corupt (e.g. fragmente JSON, proprietăți de sistem, null)
 */
export function isInvalidCorruptedFeature(feat: string): boolean {
  if (!feat || typeof feat !== 'string') return true;
  const trimmed = feat.trim();
  if (trimmed.length < 3 || trimmed.length > 70) return true;
  
  // Detectare fragmente JSON (ghilimele, două puncte, paranteze acolade, slash-uri)
  if (/["{}:\\;\[\]]/i.test(trimmed)) return true;

  // Detectare cuvinte cheie specifice proprietăților tehnice extrase greșit
  if (/^(docOriginCountry|brand|model|versionTrim|vin|year|registrationDate|powerKw|powerHp|engineCc|fuelType|color|bodyType|drivetrain|transmission|civNumber|plateNumber|confidenceScore|euroNorm|null|undefined)$/i.test(trimmed)) {
    return true;
  }

  // Detectare stringuri de tip `cheie: valoare` sau `null`
  if (/\b(null|undefined)\b/i.test(trimmed) && trimmed.length < 15) return true;

  return false;
}

/**
 * Returnează lista dotărilor custom stocate în localStorage, curățând automat orice intrare coruptă
 */
export function getCustomFeatures(): string[] {
  if (!isLocalStorageAvailable()) {
    return inMemoryCustomFeatures.filter(f => !isInvalidCorruptedFeature(f));
  }

  try {
    const raw = window.localStorage.getItem(RXM_CUSTOM_FEATURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(item => typeof item === 'string' && !isInvalidCorruptedFeature(item));
      
      // Auto-remediere: dacă am găsit elemente corupte în localStorage, suprascriem imediat cu lista curată
      if (valid.length !== parsed.length) {
        window.localStorage.setItem(RXM_CUSTOM_FEATURES_KEY, JSON.stringify(valid));
        inMemoryCustomFeatures = valid;
        console.info(`[featuresCatalogService] 🧹 Auto-curățat ${parsed.length - valid.length} intrări corupte din catalog.`);
      }
      
      return valid;
    }
  } catch (err) {
    console.warn('[featuresCatalogService] Eroare la citirea dotărilor custom din localStorage:', err);
  }
  return [];
}

/**
 * Salvează lista de dotări custom în localStorage și memorie (cu sanitizare strictă)
 */
export function saveCustomFeatures(features: string[]): void {
  const sanitized = Array.from(
    new Set(
      features
        .map(f => f.trim())
        .filter(f => Boolean(f) && !isInvalidCorruptedFeature(f))
    )
  );
  inMemoryCustomFeatures = sanitized;

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(RXM_CUSTOM_FEATURES_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('rxm_features_updated', { detail: { customFeatures: sanitized } }));
    } catch (err) {
      console.warn('[featuresCatalogService] Eroare la salvarea dotărilor custom în localStorage:', err);
    }
  }
}

/**
 * Returnează lista completă și unificată a dotărilor disponibile (Implicit + Custom)
 * Fără duplicate, respectând ordinea inițială urmată de dotările noi.
 */
export function getAllAvailableFeatures(): string[] {
  const custom = getCustomFeatures();
  const seenNormalized = new Set<string>();
  const unified: string[] = [];

  // 1. Adăugăm dotările implicite
  for (const feat of DEFAULT_SHOWROOM_FEATURES) {
    const norm = feat.trim().toLowerCase();
    if (!seenNormalized.has(norm)) {
      seenNormalized.add(norm);
      unified.push(feat);
    }
  }

  // 2. Adăugăm dotările custom
  for (const feat of custom) {
    const norm = feat.trim().toLowerCase();
    if (!seenNormalized.has(norm)) {
      seenNormalized.add(norm);
      unified.push(feat);
    }
  }

  return unified;
}

/**
 * Adaugă o dotare nouă în catalogul permanent
 * Dacă există deja (comparare case-insensitive), nu creează duplicat și returnează dotarea existentă.
 */
export function addCustomFeature(featureName: string): {
  success: boolean;
  isNew: boolean;
  feature: string;
  allFeatures: string[];
} {
  const trimmed = (featureName || '').trim();
  if (!trimmed || isInvalidCorruptedFeature(trimmed)) {
    return {
      success: false,
      isNew: false,
      feature: '',
      allFeatures: getAllAvailableFeatures()
    };
  }

  const norm = trimmed.toLowerCase();
  const allCurrent = getAllAvailableFeatures();
  const existingMatch = allCurrent.find(f => f.trim().toLowerCase() === norm);

  // Dacă există deja în catalogul implicit sau custom
  if (existingMatch) {
    return {
      success: true,
      isNew: false,
      feature: existingMatch,
      allFeatures: allCurrent
    };
  }

  // Formatare estetică: prima literă majusculă dacă utilizatorul a introdus cu minuscule
  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  const currentCustom = getCustomFeatures();
  const updatedCustom = [...currentCustom, formatted];
  saveCustomFeatures(updatedCustom);

  return {
    success: true,
    isNew: true,
    feature: formatted,
    allFeatures: getAllAvailableFeatures()
  };
}

/**
 * Elimină o dotare custom adăugată anterior
 * (Dotările din catalogul implicit nu pot fi șterse definitiv, doar cele custom).
 */
export function removeCustomFeature(featureName: string): {
  success: boolean;
  allFeatures: string[];
} {
  const trimmed = (featureName || '').trim();
  const norm = trimmed.toLowerCase();
  const currentCustom = getCustomFeatures();
  const filtered = currentCustom.filter(f => f.trim().toLowerCase() !== norm);

  if (filtered.length !== currentCustom.length) {
    saveCustomFeatures(filtered);
    return { success: true, allFeatures: getAllAvailableFeatures() };
  }

  return { success: false, allFeatures: getAllAvailableFeatures() };
}

/**
 * Verifică dacă o dotare este creată personalizat de utilizator (și poate fi ștearsă)
 */
export function isCustomFeature(featureName: string): boolean {
  const norm = (featureName || '').trim().toLowerCase();
  const isDefault = DEFAULT_SHOWROOM_FEATURES.some(f => f.trim().toLowerCase() === norm);
  return !isDefault;
}
