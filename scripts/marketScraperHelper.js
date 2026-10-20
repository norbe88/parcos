import https from 'node:https';

export function cleanSlug(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeAutovitSlugs(brand, model) {
  let b = cleanSlug(brand);
  let m = cleanSlug(model);

  // Normalizare mărci cunoscute pe Autovit
  if (b === 'mercedes' || b === 'mercedesbenz' || b === 'mercedes-benz' || b.includes('mercedes') || b.includes('daimler')) {
    b = 'mercedes-benz';
  }
  if (b === 'vw' || b === 'volks-wagen') b = 'volkswagen';

  // Normalizare modele cunoscute
  if (b === 'bmw') {
    if (/^(seria-3|3\d{2}|3-er|3-series)/.test(m)) m = 'seria-3';
    else if (/^(seria-5|5\d{2}|5-er|5-series)/.test(m)) m = 'seria-5';
    else if (/^(seria-1|1\d{2}|1-er|1-series)/.test(m)) m = 'seria-1';
    else if (/^(seria-4|4\d{2}|4-er|4-series)/.test(m)) m = 'seria-4';
    else if (/^(seria-7|7\d{2}|7-er|7-series)/.test(m)) m = 'seria-7';
    else if (/^(x-1|x1)/.test(m)) m = 'x1';
    else if (/^(x-3|x3)/.test(m)) m = 'x3';
    else if (/^(x-5|x5)/.test(m)) m = 'x5';
    else if (/^(x-6|x6)/.test(m)) m = 'x6';
  }

  if (b === 'mercedes-benz') {
    if (/^(c$|c-|c\d|clasa-c|c-class|c-klasse)/.test(m) || /^(220|200|250)$/.test(m) || /^(220-cdi|200-cdi|220-d|200-d)/.test(m)) m = 'clasa-c';
    else if (/^(e$|e-|e\d|clasa-e|e-class|e-klasse)/.test(m)) m = 'clasa-e';
    else if (/^(a$|a-|a\d|clasa-a|a-class|a-klasse)/.test(m)) m = 'clasa-a';
    else if (/^(b$|b-|b\d|clasa-b|b-class|b-klasse)/.test(m)) m = 'clasa-b';
    else if (/^(s$|s-|s\d|clasa-s|s-class|s-klasse)/.test(m)) m = 'clasa-s';
    else if (/^(gla|clasa-gla)/.test(m)) m = 'clasa-gla';
    else if (/^(glb|clasa-glb)/.test(m)) m = 'glb';
    else if (/^(glc|clasa-glc)/.test(m)) m = 'glc';
    else if (/^(gle|clasa-gle)/.test(m)) m = 'gle';
    else if (/^(gls|clasa-gls)/.test(m)) m = 'gls';
    else if (/^(cla|clasa-cla)/.test(m)) m = 'cla';
    else if (/^(cls|clasa-cls)/.test(m)) m = 'cls';
    else if (/^(ml|clasa-m|clasa-ml)/.test(m)) m = 'clasa-m';
    else if (/^(v|v-class|clasa-v|v-klasse|vito|viano)/.test(m)) m = 'clasa-v';
    else if (/^(sprinter)/.test(m)) m = 'sprinter';
  }

  if (b === 'renault') {
    if (/kole[ao]s/.test(m)) m = 'koleos';
    else if (/megan[e]?/.test(m)) m = 'megane';
    else if (/captur/.test(m)) m = 'captur';
    else if (/clio/.test(m)) m = 'clio';
    else if (/kadjar/.test(m)) m = 'kadjar';
    else if (/talisman/.test(m)) m = 'talisman';
    else if (/austral/.test(m)) m = 'austral';
    else if (/arkana/.test(m)) m = 'arkana';
    else if (/scenic/.test(m)) m = 'scenic';
  }

  if (b === 'audi') {
    if (/^(a-3|a3)/.test(m)) m = 'a3';
    else if (/^(a-4|a4)/.test(m)) m = 'a4';
    else if (/^(a-5|a5)/.test(m)) m = 'a5';
    else if (/^(a-6|a6)/.test(m)) m = 'a6';
    else if (/^(q-3|q3)/.test(m)) m = 'q3';
    else if (/^(q-5|q5)/.test(m)) m = 'q5';
    else if (/^(q-7|q7)/.test(m)) m = 'q7';
  }

  if (b === 'dacia') {
    if (/duster/.test(m)) m = 'duster';
    else if (/sandero/.test(m)) m = 'sandero';
    else if (/logan/.test(m)) m = 'logan';
    else if (/jogger/.test(m)) m = 'jogger';
    else if (/spring/.test(m)) m = 'spring';
  }

  if (b === 'volkswagen') {
    if (/golf/.test(m)) m = 'golf';
    else if (/passat/.test(m)) m = 'passat';
    else if (/tiguan/.test(m)) m = 'tiguan';
    else if (/touareg/.test(m)) m = 'touareg';
    else if (/polo/.test(m)) m = 'polo';
    else if (/arteon/.test(m)) m = 'arteon';
    else if (/t-roc/.test(m)) m = 't-roc';
  }

  return { brandSlug: b, modelSlug: m };
}

export function fetchAutovitLive(brand, model, year, mileageKm, customOptions = {}) {
  return new Promise((resolve) => {
    const { brandSlug, modelSlug } = normalizeAutovitSlugs(brand, model);
    if (!brandSlug || !modelSlug) {
      return resolve({ success: false, reason: 'invalid brand/model', ads: [] });
    }

    const yearNum = parseInt(year || '2015', 10);
    const minYear = customOptions.yearFrom !== undefined && !isNaN(customOptions.yearFrom)
      ? Math.max(1990, customOptions.yearFrom)
      : Math.max(1990, yearNum - 1);
    const maxYear = customOptions.yearTo !== undefined && !isNaN(customOptions.yearTo)
      ? customOptions.yearTo
      : yearNum + 1;
    const maxKm = customOptions.maxKm !== undefined && !isNaN(customOptions.maxKm)
      ? customOptions.maxKm
      : (mileageKm ? Math.round(mileageKm + 30000) : 260000);

    let url = `https://www.autovit.ro/autoturisme/${brandSlug}/${modelSlug}?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`;
    if (maxKm && maxKm > 0) {
      url += `&search%5Bfilter_float_mileage%3Ato%5D=${maxKm}`;
    }

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const nextDataMatch = data.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (!nextDataMatch) {
          return resolve({ success: false, reason: 'no __NEXT_DATA__', status: res.statusCode, ads: [] });
        }
        try {
          const parsed = JSON.parse(nextDataMatch[1]);
          const urql = parsed?.props?.pageProps?.urqlState;
          if (!urql) return resolve({ success: false, reason: 'no urqlState', ads: [] });

          for (const k in urql) {
            try {
              const val = JSON.parse(urql[k].data);
              if (val.advertSearch && val.advertSearch.edges) {
                const rawAds = val.advertSearch.edges;
                const baseKm = mileageKm || 160000;
                const baseYear = yearNum;

                const filteredNodes = rawAds.filter((e) => {
                  const node = e.node;
                  if (!node) return false;
                  const paramsMap = {};
                  (node.parameters || []).forEach((p) => { paramsMap[p.key] = (p.value || '').toLowerCase(); });
                  const adModel = paramsMap.model || '';
                  const title = (node.title || '').toLowerCase();

                  // Filtrare strictă pe model pentru eliminarea reclamelor sponsorizate cross-model de la Autovit
                  if (brandSlug === 'mercedes-benz') {
                    if (modelSlug === 'clasa-c') return adModel === 'c' || title.includes(' c ') || /\bc[- ]?\d{3}\b/i.test(title);
                    if (modelSlug === 'clasa-e') return adModel === 'e' || title.includes(' e ') || /\be[- ]?\d{3}\b/i.test(title);
                    if (modelSlug === 'clasa-a') return adModel === 'a' || title.includes(' a ') || /\ba[- ]?\d{3}\b/i.test(title);
                    if (modelSlug === 'clasa-s') return adModel === 's' || title.includes(' s ') || /\bs[- ]?\d{3}\b/i.test(title);
                    if (modelSlug === 'clasa-gla') return adModel === 'gla' || title.includes('gla');
                    if (modelSlug === 'glc') return adModel === 'glc' || title.includes('glc');
                    if (modelSlug === 'gle') return adModel === 'gle' || title.includes('gle');
                    if (modelSlug === 'cla') return adModel === 'cla' || title.includes('cla');
                  }

                  if (adModel && modelSlug) {
                    const simplifiedSlug = modelSlug.replace(/^(clasa-|seria-)/, '');
                    if (adModel === simplifiedSlug || adModel === modelSlug || title.includes(simplifiedSlug)) {
                      return true;
                    }
                    return false;
                  }
                  return true;
                });

                const ads = (filteredNodes.length > 0 ? filteredNodes : rawAds)
                  .map((e) => {
                    const node = e.node;
                    const paramsMap = {};
                    (node.parameters || []).forEach((p) => { paramsMap[p.key] = p.value; });
                    const price = node.price?.amount?.units || 0;
                    const adYear = parseInt(paramsMap.year || '0', 10);
                    const adKm = parseInt(paramsMap.mileage || '0', 10);

                    // Calcul procent potrivire
                    const yearDiff = Math.abs(adYear - baseYear);
                    const kmDiff = Math.abs(adKm - baseKm);
                    let confidence = 96;
                    if (yearDiff === 0) confidence = 98;
                    else if (yearDiff === 1) confidence = 92;
                    else if (yearDiff > 1) confidence = 85;
                    if (kmDiff > 60000) confidence -= 8;
                    else if (kmDiff > 30000) confidence -= 4;
                    confidence = Math.max(70, Math.min(99, confidence));

                    return {
                      id: `autovit-${node.id}`,
                      title: node.title,
                      priceEur: price,
                      year: adYear || baseYear,
                      mileageKm: adKm || baseKm,
                      source: 'Autovit',
                      location: node.location?.city?.name || 'România',
                      url: node.url,
                      matchConfidencePct: confidence,
                      isDirectListing: true
                    };
                  })
                  .filter((ad) => ad.priceEur >= 1500 && (maxKm <= 0 || !ad.mileageKm || ad.mileageKm <= maxKm + 10000))
                  .slice(0, 6);

                return resolve({
                  success: true,
                  source: 'autovit_live',
                  totalFound: val.advertSearch.totalCount,
                  ads
                });
              }
            } catch (e) {}
          }
          resolve({ success: false, reason: 'no advertSearch', ads: [] });
        } catch (e) {
          resolve({ success: false, reason: e.message, ads: [] });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, reason: 'timeout', ads: [] });
    });

    req.on('error', (err) => resolve({ success: false, reason: err.message, ads: [] }));
  });
}
