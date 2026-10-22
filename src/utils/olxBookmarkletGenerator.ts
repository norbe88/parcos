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

  // 1. Preluare payload din localStorage sau fallback prompt
  let raw = localStorage.getItem('parcos_olx_pending_car');
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch(e){}
  }

  if (!data) {
    const pasted = prompt('Lipește datele JSON exportate din ParcOS (sau apasă Cancel):');
    if (!pasted) return;
    try { data = JSON.parse(pasted); } catch(e){ alert('Date invalide!'); return; }
  }

  // Helper set input value cu evenimente React
  function setVal(el, val) {
    if (!el) return;
    el.focus();
    const proto = Object.getPrototypeOf(el);
    const set = Object.getOwnPropertyDescriptor(proto, 'value')?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (set) {
      set.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  function clickChip(sel) {
    const el = document.querySelector(sel);
    if (el) {
      el.click();
      el.dispatchEvent(new Event('click', { bubbles: true }));
    }
  }

  // Creează banner de status
  const badge = document.createElement('div');
  badge.id = 'parcos-olx-status-badge';
  badge.style.cssText = 'position:fixed;top:16px;right:16px;z-index:999999;background:#10b981;color:#000;font-weight:bold;font-family:sans-serif;padding:12px 18px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;font-size:14px;';
  badge.innerHTML = '<span>⚡ ParcOS: Se completează formularul...</span>';
  document.body.appendChild(badge);

  // 2. Setare Titlu
  const titleInput = document.querySelector('input[data-testid="title"]') || document.querySelector('#title');
  if (titleInput && data.title) {
    setVal(titleInput, data.title);
  }

  // 3. Click buton Continuă categorie dacă e prezent
  await new Promise(r => setTimeout(r, 600));
  const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continuă'));
  if (continueBtn) {
    continueBtn.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // 4. Preț și Monedă
  const priceInput = document.querySelector('input[data-testid="price-input"]');
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

  // 5. Descriere
  const descEl = document.querySelector('textarea#description') || document.querySelector('textarea[data-testid="description"]');
  if (descEl && data.description) {
    setVal(descEl, data.description);
  }

  // 6. Parametri Tehnici (Inputs)
  const inputsMap = {
    'parameters.year': data.year,
    'parameters.rulaj_pana': data.mileageKm,
    'parameters.enginesize': data.engineCc,
    'parameters.engine_power': data.powerHp,
    'parameters.vin': data.vin
  };

  for (const [key, val] of Object.entries(inputsMap)) {
    if (!val) continue;
    const inp = document.querySelector('input[data-testid="' + key + '"]');
    if (inp) setVal(inp, String(val));
  }

  // 7. Chip-uri (Cutie, Stare, Volan, Înmatriculare, Firmă)
  if (data.gearbox === 'automat') {
    clickChip('[data-cy="parameters.gearbox_automatic"]');
  } else {
    clickChip('[data-cy="parameters.gearbox_manual"]');
  }
  clickChip('[data-cy="parameters.state_used"]');
  clickChip('[data-cy="parameters.steering_wheel_lhd"]');
  clickChip('[data-cy="parameters.registration_state_registered"]');
  clickChip('[data-cy="private_business_business"]');

  // 8. Contact & Telefon & Localitate
  const personInput = document.querySelector('#person');
  if (personInput && data.contactPerson) setVal(personInput, data.contactPerson);

  const phoneInput = document.querySelector('#phone');
  if (phoneInput && data.contactPhone) setVal(phoneInput, data.contactPhone);

  const locInput = document.querySelector('#autosuggest-location-input');
  if (locInput && data.location) {
    setVal(locInput, data.location);
    await new Promise(r => setTimeout(r, 1000));
    const firstSug = document.querySelector('[role="option"]');
    if (firstSug) firstSug.click();
  }

  // 9. Upload Fotografii (max 8)
  const fileInput = document.querySelector('input[data-cy="attach-photos-input"]');
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
  badge.innerHTML = '<span>✅ Formular completat cu succes de ParcOS! Verifică și apasă [Publică-mi anunțul].</span>';
  setTimeout(() => { badge.remove(); }, 8000);
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
