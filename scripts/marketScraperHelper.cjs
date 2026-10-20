const https = require('https');

function cleanSlug(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeAutovitSlugs(brand, model) {
  let b = cleanSlug(brand);
  let m = cleanSlug(model);

  // Normalizare mărci cunoscute pe Autovit
  if (b === 'mercedes' || b === 'mercedesbenz') b = 'mercedes-benz';
  if (b === 'vw') b = 'volkswagen';

  // Normalizare modele cunoscute
  if (b === 'bmw') {
    if (/^(seria-3|3\d{2}|3-er)/.test(m)) m = 'seria-3';
    else if (/^(seria-5|5\d{2}|5-er)/.test(m)) m = 'seria-5';
    else if (/^(seria-1|1\d{2}|1-er)/.test(m)) m = 'seria-1';
    else if (/^(seria-4|4\d{2}|4-er)/.test(m)) m = 'seria-4';
    else if (/^(seria-7|7\d{2}|7-er)/.test(m)) m = 'seria-7';
    else if (/^(x-1|x1)/.test(m)) m = 'x1';
    else if (/^(x-3|x3)/.test(m)) m = 'x3';
    else if (/^(x-5|x5)/.test(m)) m = 'x5';
  }

  if (b === 'mercedes-benz') {
    if (/^(c|c-class|clasa-c)/.test(m)) m = 'clasa-c';
    else if (/^(e|e-class|clasa-e)/.test(m)) m = 'clasa-e';
    else if (/^(a|a-class|clasa-a)/.test(m)) m = 'clasa-a';
    else if (/^(s|s-class|clasa-s)/.test(m)) m = 'clasa-s';
    else if (/^(gla)/.test(m)) m = 'clasa-gla';
    else if (/^(glc)/.test(m)) m = 'glc';
    else if (/^(gle)/.test(m)) m = 'gle';
    else if (/^(cla)/.test(m)) m = 'cla';
  }

  return { brandSlug: b, modelSlug: m };
}

function fetchAutovitLive(brand, model, year, mileageKm, customOptions = {}) {
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

                const ads = rawAds
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
                    if (yearDiff === 1) confidence -= 4;
                    else if (yearDiff > 1) confidence -= 10;
                    if (kmDiff > 60000) confidence -= 8;
                    else if (kmDiff > 30000) confidence -= 4;
                    confidence = Math.max(75, Math.min(99, confidence));

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
                  .filter((ad) => ad.priceEur >= 1500) // elimină mașini pentru dezmembrări sau anomalii
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

module.exports = {
  cleanSlug,
  normalizeAutovitSlugs,
  fetchAutovitLive
};
