/**
 * Scraper & Importer pentru stocul MPI Auto (mpiauto.ro -> ParcOS)
 * Extrage anunțurile din WordPress REST API și media attachments la rezoluție maximă.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://mpiauto.ro/wp-json/wp/v2';
const USER_AGENT = 'ParcOS-import/1.0';
const DATA_DIR = path.resolve(__dirname, '../../data/import/mpi');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

// Asigură directoarele necesare
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function requestHttp(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, */*',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
      // Urmărim redirectările 301/302
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        return resolve(requestHttp(redirectUrl, options));
      }

      if (options.stream) {
        return resolve({ res, statusCode: res.statusCode, headers: res.headers });
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout la cererea ${url}`));
    });
    req.end();
  });
}

async function fetchJson(url) {
  await sleep(550); // Rată politicoasă: ~1.8 cereri/secundă (sub limita de 2 req/s)
  const res = await requestHttp(url);
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode} la ${url}: ${res.data.slice(0, 200)}`);
  }
  return JSON.parse(res.data);
}

// Curăță sufixul -scaled sau rezoluțiile intermediare din URL-urile WordPress
function getOriginalImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url;
  // Ex: imagine-scaled.jpg -> imagine.jpg
  clean = clean.replace(/-scaled\.(jpe?g|png|webp)$/i, '.$1');
  // Ex: imagine-1536x1536.jpg -> imagine.jpg
  clean = clean.replace(/-\d+x\d+\.(jpe?g|png|webp)$/i, '.$1');
  return clean;
}

// Normalizare tip combustibil
function normalizeFuel(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s.includes('diesel')) return 'Diesel';
  if (s.includes('hibrid') || s.includes('hybrid')) return 'Hibrid';
  if (s.includes('electric')) return 'Electric';
  if (s.includes('benz')) return 'Benzină';
  return 'Benzină';
}

// Normalizare cutie viteze
function normalizeTransmission(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s.includes('aut') || s.includes('steptronic') || s.includes('dsg') || s.includes('s-tronic')) return 'Automată';
  return 'Manuală';
}

// Normalizare caroserie
function normalizeBodyType(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s.includes('suv') || s.includes('crossover')) return 'SUV';
  if (s.includes('sedan') || s.includes('berlina')) return 'Sedan';
  if (s.includes('break') || s.includes('combi') || s.includes('touring') || s.includes('avant')) return 'Break';
  if (s.includes('coupe') || s.includes('cabrio')) return 'Coupe';
  if (s.includes('hatch')) return 'Hatchback';
  return 'SUV';
}

// Normalizare tracțiune
function normalizeDrivetrain(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s.includes('4x4') || s.includes('awd') || s.includes('4wd') || s.includes('integrala')) return '4x4 / AWD';
  if (s.includes('spate') || s.includes('rwd')) return 'Spate';
  return 'Față';
}

// Normalizare marcă
function normalizeBrandName(raw) {
  let b = String(raw || '').trim();
  if (!b) return 'ParcOS';
  const u = b.toUpperCase();
  if (u.includes('MERCEDES')) return 'Mercedes-Benz';
  if (u.includes('BMW')) return 'BMW';
  if (u.includes('AUDI')) return 'Audi';
  if (u.includes('VOLKSWAGEN') || u === 'VW') return 'Volkswagen';
  if (u.includes('SKODA')) return 'Skoda';
  if (u.includes('DACIA')) return 'Dacia';
  if (u.includes('RENAULT')) return 'Renault';
  if (u.includes('FORD')) return 'Ford';
  if (u.includes('HYUNDAI')) return 'Hyundai';
  if (u.includes('KIA')) return 'Kia';
  if (u.includes('PEUGEOT')) return 'Peugeot';
  if (u.includes('NISSAN')) return 'Nissan';
  if (u.includes('TOYOTA')) return 'Toyota';
  if (u.includes('VOLVO')) return 'Volvo';
  if (u.includes('SEAT')) return 'Seat';
  if (u.includes('OPEL')) return 'Opel';
  if (u.includes('MAZDA')) return 'Mazda';
  if (u.includes('JEEP')) return 'Jeep';
  if (u.includes('LAND ROVER')) return 'Land Rover';
  if (u.includes('PORSCHE')) return 'Porsche';
  return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
}

async function scrapeAll() {
  console.log('🚗 Începem extragerea stocului MPI Auto de pe mpiauto.ro...');
  let page = 1;
  let allPosts = [];

  while (true) {
    const url = `${BASE_URL}/anunturi?per_page=10&page=${page}&_embed=wp:term,wp:featuredmedia`;
    console.log(`📡 Preluare pagina ${page}...`);
    try {
      const posts = await fetchJson(url);
      if (!Array.isArray(posts) || posts.length === 0) {
        console.log(`🏁 Pagina ${page} este goală. Sfârșit paginare.`);
        break;
      }
      allPosts = allPosts.concat(posts);
      console.log(`✅ Pagina ${page}: ${posts.length} anunțuri (Total colectate: ${allPosts.length})`);
      if (posts.length < 10) break;
      page++;
    } catch (err) {
      if (err.message.includes('400') || err.message.includes('404')) {
        console.log(`🏁 S-a atins ultima pagină (${page - 1}).`);
        break;
      }
      console.error(`❌ Eroare la pagina ${page}:`, err.message);
      break;
    }
  }

  console.log(`\n📦 Total anunțuri colectate: ${allPosts.length}`);

  // Colectare ID-uri media pentru batch query
  const allMediaIds = new Set();
  allPosts.forEach(post => {
    const poze = post.meta?.poze_anunt;
    if (Array.isArray(poze)) {
      poze.forEach(id => {
        if (id && String(id).trim()) allMediaIds.add(String(id).trim());
      });
    }
  });

  console.log(`📸 Total fotografii unice de rezolvat: ${allMediaIds.size}`);

  // Fetch batch pentru toate imaginile
  const mediaMap = new Map();
  const mediaIdList = Array.from(allMediaIds);
  const CHUNK_SIZE = 80;

  for (let i = 0; i < mediaIdList.length; i += CHUNK_SIZE) {
    const chunk = mediaIdList.slice(i, i + CHUNK_SIZE);
    const mediaUrl = `${BASE_URL}/media?include=${chunk.join(',')}&per_page=${chunk.length}`;
    console.log(`🖼️ Preluare metadate media ${i + 1}..${Math.min(i + CHUNK_SIZE, mediaIdList.length)} din ${mediaIdList.length}...`);
    try {
      const mediaItems = await fetchJson(mediaUrl);
      if (Array.isArray(mediaItems)) {
        mediaItems.forEach(item => {
          const originalUrl = getOriginalImageUrl(item.source_url || item.guid?.rendered);
          if (originalUrl) {
            mediaMap.set(String(item.id), originalUrl);
          }
        });
      }
    } catch (e) {
      console.warn(`⚠️ Warning la preluarea batch-ului media:`, e.message);
    }
  }

  console.log(`✅ Rezolvate ${mediaMap.size} adrese URL originale de imagini.`);

  // Normalizare vehicule
  const normalizedCars = [];
  let index = 0;

  for (const post of allPosts) {
    index++;
    const meta = post.meta || {};
    const titleRaw = (meta.titlu_masina || post.title?.rendered || '').trim();

    // Extrage marca, model, culoare din taxonomii _embedded
    let brand = '';
    let model = '';
    let color = '';

    if (post._embedded && post._embedded['wp:term']) {
      post._embedded['wp:term'].forEach(terms => {
        if (Array.isArray(terms)) {
          terms.forEach(t => {
            if (t.taxonomy === 'marca' && !brand) brand = t.name;
            if (t.taxonomy === 'model' && !model) model = t.name;
            if (t.taxonomy === 'culoare' && !color) color = t.name;
          });
        }
      });
    }

    if (!brand) {
      // Încercare deducere din titlu
      const parts = titleRaw.split(' ');
      // Primul cuvânt după an (dacă începe cu an, ex "2019 DACIA DUSTER")
      if (/^\d{4}$/.test(parts[0]) && parts.length > 1) {
        brand = parts[1];
        model = parts.slice(2, 4).join(' ');
      } else {
        brand = parts[0] || 'MPI';
        model = parts.slice(1, 3).join(' ') || 'Auto';
      }
    }

    brand = normalizeBrandName(brand);
    model = (model || '').toUpperCase().trim();

    // An fabricație
    let year = 2019;
    if (meta['anul-fabricatiei']) {
      const match = String(meta['anul-fabricatiei']).match(/\d{4}/);
      if (match) year = parseInt(match[0], 10);
    } else if (meta.data && /^\d{4}$/.test(meta.data)) {
      year = parseInt(meta.data, 10);
    } else {
      const titleYear = titleRaw.match(/\b(20\d\d|19\d\d)\b/);
      if (titleYear) year = parseInt(titleYear[0], 10);
    }

    // Preț
    const priceEur = parseFloat(meta.pret) || 0;
    const discount = parseFloat(meta.reducere2) || 0;
    const oldPriceEur = discount > 0 ? priceEur + discount : undefined;

    // TVA Deductibil
    const tvaText = String(meta.pret_tva || '').toLowerCase();
    const vatDeductible = tvaText.includes('deductibil') && !tvaText.includes('nedeductibil');

    // Kilometraj
    const mileageKm = parseInt(String(meta.km || '0').replace(/\D/g, ''), 10) || 0;

    // Putere CP din titlu sau conținut
    let powerHp = 0;
    const hpMatch = (titleRaw + ' ' + (post.content?.rendered || '')).match(/(\d{2,3})\s*(?:cp|hp|c\.p\.)/i);
    if (hpMatch) powerHp = parseInt(hpMatch[1], 10);

    // Cilindree
    const engineCc = parseInt(String(meta['capacitate-cilindrica'] || '0').replace(/\D/g, ''), 10) || 0;

    // Imagini asociate mașinii
    const carImageUrls = [];
    const pozeIds = Array.isArray(meta.poze_anunt) ? meta.poze_anunt : [];
    
    // Asigură că featured media este prima dacă nu e deja
    if (post.featured_media && mediaMap.has(String(post.featured_media))) {
      const featUrl = mediaMap.get(String(post.featured_media));
      carImageUrls.push(featUrl);
    }

    pozeIds.forEach(id => {
      const imgUrl = mediaMap.get(String(id));
      if (imgUrl && !carImageUrls.includes(imgUrl)) {
        carImageUrls.push(imgUrl);
      }
    });

    // Dacă nu a găsit niciuna din meta, verifică featured_media din _embedded
    if (carImageUrls.length === 0 && post._embedded && post._embedded['wp:featuredmedia']) {
      const feat = post._embedded['wp:featuredmedia'][0];
      if (feat && feat.source_url) {
        carImageUrls.push(getOriginalImageUrl(feat.source_url));
      }
    }

    // Dotări
    const rawDotari = Array.isArray(meta.dotari) ? meta.dotari : [];
    const safety = [];
    const comfort = [];
    const multimedia = [];

    rawDotari.forEach(dot => {
      const d = String(dot).trim();
      const lower = d.toLowerCase();
      if (lower.includes('blue') || lower.includes('usb') || lower.includes('audio') || lower.includes('navi') || lower.includes('radio')) {
        multimedia.push(d);
      } else if (lower.includes('airbag') || lower.includes('abs') || lower.includes('esp') || lower.includes('isofix') || lower.includes('senzor')) {
        safety.push(d);
      } else {
        comfort.push(d);
      }
    });

    // Număr stoc
    const stockNumber = `MPI-${String(index).padStart(3, '0')}`;
    const carId = `mpi-${post.id}-${post.slug}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 48);

    const vehicleItem = {
      id: carId,
      dealerSlug: 'mpi_auto',
      stockNumber,
      brand,
      model,
      versionTrim: titleRaw.replace(new RegExp(`^(\\d{4}\\s+)?${brand}\\s+${model}\\s*`, 'i'), '').trim() || '',
      year,
      mileageKm,
      priceEur,
      oldPriceEur,
      vatDeductible,
      fuelType: normalizeFuel(meta.combustibil),
      transmission: normalizeTransmission(meta.transmisie),
      powerHp,
      engineCc,
      bodyType: normalizeBodyType(meta.caroserie),
      drivetrain: normalizeDrivetrain(meta.tractiune),
      color: color || 'Negru',
      vin: (meta.vin && String(meta.vin).trim() !== '' && !String(meta.vin).includes('***')) ? String(meta.vin).trim() : '',
      isVinPublic: true,
      warrantyMonths: 12,
      status: 'in_stock',
      images: carImageUrls,
      sourceUrl: post.link,
      features: {
        safety,
        comfort,
        multimedia
      },
      equipmentSheetText: rawDotari.join(' • '),
      description: (post.content?.rendered || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      importNotes: `Importat automat din WordPress mpiauto.ro (Post ID: ${post.id})`
    };

    normalizedCars.push(vehicleItem);
  }

  // Salvare locală a fișierului de metadate
  const carsJsonPath = path.join(DATA_DIR, 'cars.json');
  fs.writeFileSync(carsJsonPath, JSON.stringify(normalizedCars, null, 2), 'utf8');
  console.log(`\n💾 Salvat ${normalizedCars.length} vehicule normalizate în ${carsJsonPath}`);

  return normalizedCars;
}

if (require.main === module) {
  scrapeAll().then(cars => {
    console.log(`🎉 Scraping finalizat cu succes! Total mașini: ${cars.length}`);
  }).catch(err => {
    console.error('💥 Eroare fatală la scraping:', err);
    process.exit(1);
  });
}

module.exports = { scrapeAll, getOriginalImageUrl };
