import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function fetchUrl(url) {
  const normalized = url.replace('https://ghid.carmatik.ro/', 'https://www.carmatik.ro/');
  return new Promise((resolve, reject) => {
    https.get(normalized, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function cleanCarmatikText(text) {
  if (!text) return '';
  return text
    .replace(/Carmatik/gi, 'ParcOS')
    .replace(/carmatik\.ro/gi, 'parcos.ro')
    .replace(/ghid\.carmatik\.ro/gi, 'parcos.ro/ghid-auto')
    .replace(/Fă-ți polița pe Carmatik.*WhatsApp\./gi, '')
    .trim();
}

function parseArticle(html, url) {
  const slug = url.replace(/\/$/, '').split('/').pop();

  // Extract JSON-LD
  let articleJsonLd = null;
  let howToJsonLd = null;
  let faqJsonLd = null;

  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type'] === 'Article') articleJsonLd = parsed;
      if (parsed['@type'] === 'HowTo') howToJsonLd = parsed;
      if (parsed['@type'] === 'FAQPage') faqJsonLd = parsed;
    } catch (e) {}
  }

  // Title
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  title = cleanCarmatikText(title);

  // Category
  const catMatch = html.match(/<a class="article-cat"[^>]*href="([^"]*)"[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  let categorySlug = '';
  let categoryName = '';
  let categoryColor = '#2563eb';
  let categoryIcon = '🚗';
  if (catMatch) {
    const rawHref = catMatch[1];
    categorySlug = rawHref.replace(/\/$/, '').split('/').pop();
    const rawText = catMatch[3].replace(/<[^>]+>/g, '').trim();
    // e.g. "🚗 Înmatriculare & Transcriere"
    const iconMatch = rawText.match(/^([^\w\s\d]+|\p{Emoji})/u);
    if (iconMatch) {
      categoryIcon = iconMatch[1];
      categoryName = rawText.replace(iconMatch[1], '').trim();
    } else {
      categoryName = rawText;
    }
    const colorMatch = catMatch[2].match(/--accent:\s*([^;]+)/i);
    if (colorMatch) categoryColor = colorMatch[1].trim();
  }

  // Quick answer
  const qaMatch = html.match(/<div class="quick-answer"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/div>/i);
  let quickAnswer = qaMatch ? cleanCarmatikText(qaMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

  // Required docs
  const docs = [];
  const docsMatch = html.match(/<section class="block block-docs"[^>]*>[\s\S]*?<ul class="doc-checklist">([\s\S]*?)<\/ul>[\s\S]*?<\/section>/i);
  if (docsMatch) {
    const liMatches = [...docsMatch[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)];
    for (const li of liMatches) {
      docs.push(cleanCarmatikText(li[1].replace(/<[^>]+>/g, '').trim()));
    }
  }

  // Steps
  const steps = [];
  const stepsMatch = html.match(/<section class="block block-steps"[^>]*>[\s\S]*?<ol class="steps-timeline">([\s\S]*?)<\/ol>[\s\S]*?<\/section>/i);
  if (stepsMatch) {
    const stepLis = [...stepsMatch[1].matchAll(/<div class="step-num">(\d+)<\/div>[\s\S]*?<div class="step-body">[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/gi)];
    for (const s of stepLis) {
      steps.push({
        num: parseInt(s[1], 10),
        title: cleanCarmatikText(s[2].replace(/<[^>]+>/g, '').trim()),
        description: cleanCarmatikText(s[3].replace(/<[^>]+>/g, '').trim())
      });
    }
  }

  // Costs
  const costs = [];
  const costMatch = html.match(/<section class="block block-costs"[^>]*>[\s\S]*?<table class="cost-table">([\s\S]*?)<\/table>[\s\S]*?<\/section>/i);
  if (costMatch) {
    const trMatches = [...costMatch[1].matchAll(/<tr>\s*<td>([\s\S]*?)(?:<span class="cost-note">([\s\S]*?)<\/span>)?<\/td>\s*<td class="cost-value">([\s\S]*?)<\/td>\s*<\/tr>/gi)];
    for (const tr of trMatches) {
      const itemName = cleanCarmatikText(tr[1].replace(/<span[\s\S]*?<\/span>/gi, '').replace(/<[^>]+>/g, '').trim());
      const note = tr[2] ? cleanCarmatikText(tr[2].replace(/<[^>]+>/g, '').trim()) : '';
      const value = cleanCarmatikText(tr[3].replace(/<[^>]+>/g, '').trim());
      if (itemName) {
        costs.push({ item: itemName, note, value });
      }
    }
  }

  // Details prose
  const proseMatch = html.match(/<section class="block prose"[^>]*>([\s\S]*?)<\/section>/i);
  let proseHtml = '';
  if (proseMatch) {
    proseHtml = cleanCarmatikText(proseMatch[1].trim());
  }

  // FAQ
  const faq = [];
  const faqMatch = html.match(/<section class="block block-faq"[^>]*>([\s\S]*?)<\/section>/i);
  if (faqMatch) {
    const detailsMatches = [...faqMatch[1].matchAll(/<details[^>]*>([\s\S]*?)<\/details>/gi)];
    for (const d of detailsMatches) {
      const qMatch = d[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const aMatch = d[1].match(/<div class="faq-answer"[^>]*>([\s\S]*?)<\/div>/i);
      if (qMatch && aMatch) {
        faq.push({
          question: cleanCarmatikText(qMatch[1].replace(/<[^>]+>/g, '').trim()),
          answer: cleanCarmatikText(aMatch[1].replace(/<[^>]+>/g, '').trim())
        });
      }
    }
  }

  // Fallback to JSON-LD FAQPage if HTML didn't yield items
  if (faq.length === 0 && faqJsonLd && Array.isArray(faqJsonLd.mainEntity)) {
    for (const entity of faqJsonLd.mainEntity) {
      if (entity.name && entity.acceptedAnswer?.text) {
        faq.push({
          question: cleanCarmatikText(entity.name),
          answer: cleanCarmatikText(entity.acceptedAnswer.text)
        });
      }
    }
  }

  // Official links
  const officialLinks = [];
  const linksMatch = html.match(/<section class="block block-links"[^>]*>[\s\S]*?<ul class="official-links">([\s\S]*?)<\/ul>[\s\S]*?<\/section>/i);
  if (linksMatch) {
    const aMatches = [...linksMatch[1].matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const a of aMatches) {
      officialLinks.push({
        url: a[1].trim(),
        label: cleanCarmatikText(a[2].replace(/<[^>]+>/g, '').trim())
      });
    }
  }

  // Meta update date & read time
  let updateDate = '2026';
  let readTime = '2 min';
  const metaMatch = html.match(/<div class="article-meta">([\s\S]*?)<\/div>/i);
  if (metaMatch) {
    const spans = [...metaMatch[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map(s => s[1].replace(/<[^>]+>/g, '').trim());
    if (spans[0]) updateDate = spans[0];
    if (spans[1]) readTime = spans[1];
  }

  // Meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const metaDescription = descMatch ? cleanCarmatikText(descMatch[1]) : '';

  return {
    slug,
    url: `/ghid-auto/${slug}/`,
    title,
    category: {
      slug: categorySlug,
      name: categoryName,
      color: categoryColor,
      icon: categoryIcon
    },
    metaDescription,
    updateDate,
    readTime,
    quickAnswer,
    docs,
    steps,
    costs,
    proseHtml,
    faq,
    officialLinks
  };
}

async function scrapeAll() {
  const allUrls = JSON.parse(fs.readFileSync('audit-baseline/ghid-auto/all-urls.json', 'utf8'));
  console.log(`Starting extraction of ${allUrls.articles.length} articles...`);

  const results = [];
  const batchSize = 6;
  for (let i = 0; i < allUrls.articles.length; i += batchSize) {
    const batch = allUrls.articles.slice(i, i + batchSize);
    console.log(`Processing batch ${i + 1} to ${Math.min(i + batchSize, allUrls.articles.length)}...`);
    const promises = batch.map(async (url) => {
      try {
        const { status, body } = await fetchUrl(url);
        if (status === 200) {
          return parseArticle(body, url);
        } else {
          console.error(`Failed ${url}: status ${status}`);
          return null;
        }
      } catch (err) {
        console.error(`Error ${url}:`, err.message);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
    // slight delay
    await new Promise(res => setTimeout(res, 200));
  }

  console.log(`Successfully parsed ${results.length} articles.`);
  fs.writeFileSync('audit-baseline/ghid-auto/extracted-articles.json', JSON.stringify(results, null, 2));
  console.log('Saved to audit-baseline/ghid-auto/extracted-articles.json');
}

scrapeAll().catch(console.error);
