import { VehicleItem, DealerProfile, SEED_DEALER } from '../db/seed';

/**
 * Escapes a single CSV value according to RFC 4180:
 * - If value contains commas, quotes, or newlines, wrap in double quotes
 * - Double quotes inside are escaped as two double quotes ("")
 */
function escapeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Resolves full canonical URL for a vehicle asset or page
 */
function resolveCanonicalUrl(path: string, baseUrl?: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const host = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://rxmautomobile.ro');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${host}${cleanPath}`;
}

/**
 * Normalizes fuel type to standard Meta format
 */
function normalizeMetaFuelType(fuelType: string): string {
  const lower = (fuelType || '').toLowerCase();
  if (lower.includes('benzin')) return 'petrol';
  if (lower.includes('diesel')) return 'diesel';
  if (lower.includes('hibrid') || lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('electr')) return 'electric';
  return 'petrol';
}

/**
 * Normalizes transmission to standard Meta format
 */
function normalizeMetaTransmission(transmission: string): string {
  const lower = (transmission || '').toLowerCase();
  if (lower.includes('automa')) return 'automatic';
  return 'manual';
}

/**
 * Normalizes body style to standard Meta format
 */
function normalizeMetaBodyStyle(bodyType: string): string {
  const lower = (bodyType || '').toLowerCase();
  if (lower.includes('suv')) return 'suv';
  if (lower.includes('sedan') || lower.includes('berlin')) return 'sedan';
  if (lower.includes('coupe') || lower.includes('cup')) return 'coupe';
  if (lower.includes('break') || lower.includes('combi') || lower.includes('wagon')) return 'wagon';
  if (lower.includes('hatch')) return 'hatchback';
  if (lower.includes('cabrio')) return 'convertible';
  return 'other';
}

/**
 * 1. GENERATOR FEED CSV FACEBOOK MARKETPLACE / META COMMERCE MANAGER
 * Standard: Meta Catalog Vehicle Inventory Feed Specification
 */
export function generateFacebookMarketplaceCsv(
  cars: VehicleItem[], 
  dealer: DealerProfile = SEED_DEALER,
  baseUrl?: string
): string {
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'additional_image_link',
    'brand',
    'model',
    'year',
    'mileage.value',
    'mileage.unit',
    'vin',
    'body_style',
    'transmission',
    'fuel_type',
    'state_of_vehicle',
    'exterior_color',
    'dealer_name',
    'dealer_phone',
    'dealer_city'
  ];

  const activeCars = cars.filter(c => c.status !== 'sold');

  const rows = activeCars.map(car => {
    const title = `${car.brand} ${car.model} ${car.versionTrim || ''} (${car.year})`.replace(/\s+/g, ' ').trim();
    const cleanDesc = (car.description || `${title} - Autoturism verificat în showroom ${dealer.name}. Garanție 12 luni, kilometraj certificat.`)
      .replace(/[\r\n]+/g, ' ')
      .trim();

    const availability = car.status === 'in_stock' ? 'in_stock' : (car.status === 'reserved' ? 'pending' : 'out_of_stock');
    const priceFormatted = `${car.priceEur} EUR`;
    const carLink = `${resolveCanonicalUrl(`/?car=${car.id}#inventory`, baseUrl)}`;
    
    // Imagini principale și adiționale
    const mainImage = car.images && car.images.length > 0 
      ? resolveCanonicalUrl(car.images[0], baseUrl)
      : resolveCanonicalUrl('/images/cars/default.webp', baseUrl);

    const additionalImages = car.images && car.images.length > 1
      ? car.images.slice(1, 10).map(img => resolveCanonicalUrl(img, baseUrl)).join(',')
      : '';

    return [
      escapeCsvValue(car.id),
      escapeCsvValue(title),
      escapeCsvValue(cleanDesc),
      escapeCsvValue(availability),
      escapeCsvValue('used'),
      escapeCsvValue(priceFormatted),
      escapeCsvValue(carLink),
      escapeCsvValue(mainImage),
      escapeCsvValue(additionalImages),
      escapeCsvValue(car.brand),
      escapeCsvValue(car.model),
      escapeCsvValue(car.year),
      escapeCsvValue(car.mileageKm),
      escapeCsvValue('KM'),
      escapeCsvValue(car.vin),
      escapeCsvValue(normalizeMetaBodyStyle(car.bodyType)),
      escapeCsvValue(normalizeMetaTransmission(car.transmission)),
      escapeCsvValue(normalizeMetaFuelType(car.fuelType)),
      escapeCsvValue('used'),
      escapeCsvValue(car.color || 'Gri Metalizat'),
      escapeCsvValue(dealer.name),
      escapeCsvValue(dealer.phonePrimary || dealer.phoneSecondary || '0748892937'),
      escapeCsvValue('Cluj-Napoca')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 2. GENERATOR FEED XML AUTOVIT / OLX PRO DEALER
 * Standard: Ro-Dealer XML Specification compatibil cu importul în bloc pe Autovit.ro și OLX.ro
 */
export function generateAutovitXml(
  cars: VehicleItem[], 
  dealer: DealerProfile = SEED_DEALER,
  baseUrl?: string
): string {
  const activeCars = cars.filter(c => c.status !== 'sold');
  const nowIso = new Date().toISOString();

  const xmlEntries = activeCars.map(car => {
    const title = `${car.brand} ${car.model} ${car.versionTrim || ''}`.replace(/\s+/g, ' ').trim();
    const cleanDesc = (car.description || `${title} - Autoturism certificat în showroom ${dealer.name}. Garanție 12 luni, istoric verificat carVertical, test dinamic complet.`)
      .trim();

    const carUrl = resolveCanonicalUrl(`/?car=${car.id}#inventory`, baseUrl);

    // Lista caracteristici tehnice
    const allFeatures: string[] = [
      ...(car.features?.safety || []),
      ...(car.features?.comfort || []),
      ...(car.features?.multimedia || [])
    ];

    const featuresXml = allFeatures.length > 0
      ? `\n      <features>\n${allFeatures.map(f => `        <feature><![CDATA[${f}]]></feature>`).join('\n')}\n      </features>`
      : '';

    const imagesXml = car.images && car.images.length > 0
      ? `\n      <images>\n${car.images.map(img => `        <image><![CDATA[${resolveCanonicalUrl(img, baseUrl)}]]></image>`).join('\n')}\n      </images>`
      : '';

    return `    <vehicle>
      <id>${car.id}</id>
      <stock_number>${car.stockNumber || car.vin.slice(-4).toUpperCase()}</stock_number>
      <vin>${car.vin}</vin>
      <category>Autoturisme</category>
      <brand><![CDATA[${car.brand}]]></brand>
      <model><![CDATA[${car.model}]]></model>
      <version><![CDATA[${car.versionTrim || ''}]]></version>
      <year>${car.year}</year>
      <mileage unit="km">${car.mileageKm}</mileage>
      <engine_capacity unit="cm3">${car.engineCc || 1998}</engine_capacity>
      <power unit="hp">${car.powerHp || 150}</power>
      <fuel_type>${car.fuelType || 'Diesel'}</fuel_type>
      <transmission>${car.transmission || 'Manuală'}</transmission>
      <body_type>${car.bodyType || 'Sedan'}</body_type>
      <color><![CDATA[${car.color || 'Vopsea Originală'}]]></color>
      <price currency="EUR" vat_deductible="${car.vatDeductible ? 'true' : 'false'}">${car.priceEur}</price>
      <vat_rate>0.21</vat_rate>
      <warranty_months>${car.warrantyMonths || 12}</warranty_months>
      <status>${car.status}</status>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${cleanDesc}]]></description>
      <url><![CDATA[${carUrl}]]></url>${imagesXml}${featuresXml}
    </vehicle>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<vehicles version="1.0" generated_at="${nowIso}" dealer="${dealer.name}" cui="${dealer.cui}">
  <dealer_info>
    <name><![CDATA[${dealer.name}]]></name>
    <cui>${dealer.cui}</cui>
    <phone>${dealer.phonePrimary || dealer.phoneSecondary || '0748892937'}</phone>
    <email>${dealer.email}</email>
    <city>Cluj-Napoca</city>
    <address><![CDATA[${dealer.showroomAddress || dealer.address}]]></address>
  </dealer_info>
  <inventory total_active="${activeCars.length}">
${xmlEntries}
  </inventory>
</vehicles>`;
}

/**
 * 3. GENERATOR FEED JSON (REST API / Partner Webhook)
 */
export function generateStockJsonFeed(
  cars: VehicleItem[],
  dealer: DealerProfile = SEED_DEALER,
  baseUrl?: string
): string {
  const activeCars = cars.filter(c => c.status !== 'sold').map(car => ({
    id: car.id,
    stockNumber: car.stockNumber,
    vin: car.vin,
    brand: car.brand,
    model: car.model,
    versionTrim: car.versionTrim,
    year: car.year,
    mileageKm: car.mileageKm,
    priceEur: car.priceEur,
    vatDeductible: car.vatDeductible,
    vatRate: 0.21,
    fuelType: car.fuelType,
    transmission: car.transmission,
    powerHp: car.powerHp,
    engineCc: car.engineCc,
    bodyType: car.bodyType,
    color: car.color,
    status: car.status,
    warrantyMonths: car.warrantyMonths,
    directUrl: resolveCanonicalUrl(`/?car=${car.id}#inventory`, baseUrl),
    images: car.images.map(img => resolveCanonicalUrl(img, baseUrl)),
    description: car.description
  }));

  const payload = {
    dealer: {
      name: dealer.name,
      cui: dealer.cui,
      phone: dealer.phonePrimary || dealer.phoneSecondary || '0748892937',
      email: dealer.email,
      showroomAddress: dealer.showroomAddress || dealer.address
    },
    generatedAt: new Date().toISOString(),
    totalActiveVehicles: activeCars.length,
    vehicles: activeCars
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Utilitar pentru descărcare directă fișier text (CSV/XML/JSON) în browser
 */
export function downloadFeedFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
