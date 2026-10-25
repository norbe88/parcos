/**
 * src/utils/olxBookmarkletGenerator.ts
 * Generator de Smart Bookmarklet (1-Click) pentru publicare pe OLX fără instalare de extensii
 */

/**
 * Codul core de execuție injectat pe olx.ro/adding/
 */
export function getOlxInjectorScriptSource(): string {
  return `
(async function() {
  console.log('[ParcOS OLX Bookmarklet] Pornire completare automată...');

  // 1. Preluare payload din localStorage sau clipboard / prompt
  let data = null;
  try {
    const raw = localStorage.getItem('parcos_olx_pending_car');
    if (raw) data = JSON.parse(raw);
  } catch(e){}

  if (!data) {
    try {
      const clipText = await navigator.clipboard.readText();
      const parsed = JSON.parse(clipText);
      if (parsed && (parsed.title || parsed.brand)) data = parsed;
    } catch(e){}
  }

  if (!data) {
    const pasted = prompt('Lipește datele JSON ale mașinii exportate din ParcOS (sau apasă Cancel):');
    if (!pasted) return;
    try { data = JSON.parse(pasted); } catch(e){ alert('Date JSON invalide!'); return; }
  }

  // Helper set input value cu evenimente React
  function setVal(el, val) {
    if (!el) return;
    el.focus();
    const proto = Object.getPrototypeOf(el);
    const set = Object.getOwnPropertyDescriptor(proto, 'value')?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (set) {
      set.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    el.blur();
  }

  function clickChip(sel) {
    const el = document.querySelector(sel);
    if (el) {
      el.click();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }

  // Banner status
  const badge = document.createElement('div');
  badge.id = 'parcos-olx-status-badge';
  badge.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999999;background:#111114;border:1px solid #f59e0b;color:#f59e0b;font-weight:bold;font-family:sans-serif;padding:12px 18px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.6);display:flex;align-items:center;gap:8px;font-size:13px;';
  badge.innerHTML = '<span>⚡ ParcOS: Se completează formularul... (' + (data.brand || '') + ' ' + (data.model || '') + ')</span>';
  document.body.appendChild(badge);

  // 2. Setare Titlu (cu selecție dinamică pentru ecranul nou OLX)
  const titleSelectors = [
    'input[data-testid="add-title-input"]',
    'input[data-testid="title"]',
    'input[name="title"]',
    'input#title',
    'input[placeholder*="Barista"]',
    'input[placeholder*="titlu" i]',
    'input[maxlength="150"]',
    'main input[type="text"]',
    'form input[type="text"]'
  ];

  let titleInput = null;
  for (const s of titleSelectors) {
    const el = document.querySelector(s);
    if (el && el.offsetParent !== null) { titleInput = el; break; }
  }

  if (titleInput && data.title) {
    setVal(titleInput, data.title);
    await new Promise(r => setTimeout(r, 600));

    // Clic pe butonul Continuă
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'));
    const continueBtn = buttons.find(b => {
      const txt = (b.textContent || b.value || '').trim().toLowerCase();
      return (txt.includes('continuă') || txt.includes('continua')) && b.offsetParent !== null;
    });
    if (continueBtn) {
      continueBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Căutare card/chip categorie Autoturisme
  for (let c = 0; c < 5; c++) {
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a, li, span, h6, p'));
    const catChip = candidates.find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'autoturisme' || t === 'auto, moto si ambarcatiuni' || (t.includes('autoturisme') && t.length < 35);
    });
    if (catChip) {
      catChip.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // Așteptare apariție formular detaliat (max 6 secunde)
  for (let w = 0; w < 12; w++) {
    if (document.querySelector('input[data-testid="price-input"]') || document.querySelector('textarea#description') || document.querySelector('input[name="price"]')) break;
    await new Promise(r => setTimeout(r, 500));
  }

  // 3. Preț și Monedă
  const priceInput = document.querySelector('input[data-testid="price-input"]') || document.querySelector('input[name="price"]') || document.querySelector('#price');
  if (priceInput && data.price) {
    setVal(priceInput, String(data.price));
  }

  // Monedă (€ vs lei)
  if (data.currency) {
    const currBtn = document.querySelector('[data-cy="title-field-wrapper"] .n-referenceinput-button') || document.querySelector('.n-referenceinput-button');
    if (currBtn) {
      currBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const targetText = data.currency === '€' ? '€' : 'lei';
      const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(o => o.textContent && o.textContent.trim() === targetText);
      if (opt) opt.click();
    }
  }

  if (data.negotiable) {
    const neg = document.querySelector('#nexus-input') || document.querySelector('input[name*="negotiable"]');
    if (neg && !neg.checked) neg.click();
  }

  // 4. Descriere Comercială
  const descEl = document.querySelector('textarea#description') || document.querySelector('textarea[data-testid="description"]') || document.querySelector('textarea[name="description"]') || document.querySelector('textarea');
  if (descEl && data.description) {
    setVal(descEl, data.description);
  }

  // 5. Parametri Tehnici (Inputs)
  const inputsMap = {
    'parameters.year': data.year,
    'parameters.rulaj_pana': data.mileageKm,
    'parameters.enginesize': data.engineCc,
    'parameters.engine_power': data.powerHp,
    'parameters.vin': data.vin
  };

  for (const [key, val] of Object.entries(inputsMap)) {
    if (!val) continue;
    const inp = document.querySelector('input[data-testid="' + key + '"]') || document.querySelector('input[name="' + key + '"]');
    if (inp) setVal(inp, String(val));
  }

  // 6. Chip-uri (Cutie, Stare, Volan, Înmatriculare, Firmă)
  if (data.gearbox === 'automat') {
    clickChip('[data-cy="parameters.gearbox_automatic"]');
  } else {
    clickChip('[data-cy="parameters.gearbox_manual"]');
  }
  clickChip('[data-cy="parameters.state_used"]');
  clickChip('[data-cy="parameters.steering_wheel_lhd"]');
  clickChip('[data-cy="parameters.registration_state_registered"]');
  clickChip('[data-cy="private_business_business"]');

  // 7. Contact & Telefon & Localitate
  const personInput = document.querySelector('#person') || document.querySelector('input[name="person"]');
  if (personInput && data.contactPerson) setVal(personInput, data.contactPerson);

  const phoneInput = document.querySelector('#phone') || document.querySelector('input[name="phone"]');
  if (phoneInput && data.contactPhone) setVal(phoneInput, data.contactPhone);

  const locInput = document.querySelector('#autosuggest-location-input') || document.querySelector('input[name="location"]');
  if (locInput && data.location) {
    setVal(locInput, data.location);
    await new Promise(r => setTimeout(r, 900));
    const firstSug = document.querySelector('[role="option"], .autosuggest-item');
    if (firstSug) firstSug.click();
  }

  // 8. Upload Fotografii (max 8)
  const fileInput = document.querySelector('input[data-cy="attach-photos-input"]') || document.querySelector('input[type="file"]');
  if (fileInput && Array.isArray(data.photos) && data.photos.length > 0) {
    badge.innerHTML = '<span>📸 ParcOS: Se descarcă și încarcă cele ' + data.photos.slice(0, 8).length + ' fotografii...</span>';
    try {
      const dt = new DataTransfer();
      for (let i = 0; i < Math.min(data.photos.length, 8); i++) {
        const photoUrl = data.photos[i];
        try {
          const resp = await fetch(photoUrl);
          const blob = await resp.blob();
          const file = new File([blob], 'parcos_foto_' + (i + 1) + '.webp', { type: blob.type || 'image/webp' });
          dt.items.add(file);
        } catch(err) {
          console.warn('[ParcOS] Eroare la poza ' + i, err);
        }
      }
      if (dt.files.length > 0) {
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch(err) {
      console.error('[ParcOS] Eroare upload foto', err);
    }
  }

  badge.style.background = '#22c55e';
  badge.style.color = '#000';
  badge.style.borderColor = '#16a34a';
  badge.innerHTML = '<span>✅ Formular completat cu succes de ParcOS! Verifică și apasă [Publică-mi anunțul].</span>';
  setTimeout(() => { badge.remove(); }, 12000);
})();
  `.trim();
}

/**
 * Generează URL-ul bookmarklet minificat `javascript:...`
 */
export function generateOlxBookmarkletUrl(): string {
  const code = getOlxInjectorScriptSource()
    .replace(/\/\/.*/g, '') // elimină comentarii
    .replace(/\s+/g, ' '); // compactare spații
  return `javascript:${encodeURIComponent(code)}`;
}
