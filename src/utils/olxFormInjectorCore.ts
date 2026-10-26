/**
 * src/utils/olxFormInjectorCore.ts
 * Motorul unificat de injectare și completare automată a formularului pe OLX România (olx.ro/adding/)
 * 
 * Punct Unic de Adevăr partajat între Smart Bookmarklet și Extensia Chrome ParcOS.
 * Asigură selecția robustă prin strategii de fallback redundante pentru:
 * - Marcă și Model (inclusiv combobox și popup de căutare pentru Renault Clio, Dacia, BMW etc.)
 * - Parametri tehnici tip dropdown/combobox (Caroserie, Combustibil, Culoare, Număr de uși)
 * - Chip-uri de opțiuni (Cutie Manuală/Automată, Volan stânga, Stare utilizat, Firmă, Înmatriculat)
 * - Preț, monedă (€ / lei) și descriere comercială certificată (21% TVA & Cont de Garanție)
 * - Încărcare automată a celor 8 fotografii HD prin DataTransfer și CORS liber
 */

export function getUnifiedOlxInjectorSourceCode(): string {
  return `
(async function() {
  console.log('[ParcOS OLX Engine] Inițializare motor unificat de completare...');

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Preluare date vehicul (din memorie extensie, localStorage sau clipboard)
  let car = null;

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const resp = await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ action: 'GET_PENDING_CAR' }, (r) => resolve(r));
        } catch(e) { resolve(null); }
      });
      if (resp && resp.success && resp.car) {
        car = resp.car;
      }
    }
  } catch(e){}

  if (!car) {
    try {
      const raw = localStorage.getItem('parcos_olx_pending_car');
      if (raw) car = JSON.parse(raw);
    } catch(e){}
  }

  if (!car) {
    try {
      const clipText = await navigator.clipboard.readText();
      const parsed = JSON.parse(clipText);
      if (parsed && (parsed.title || parsed.brand)) car = parsed;
    } catch(e){}
  }

  if (!car) {
    const pasted = prompt('Lipește datele JSON ale vehiculului exportate din ParcOS:');
    if (!pasted) return;
    try {
      car = JSON.parse(pasted);
    } catch(e) {
      alert('Format JSON invalid!');
      return;
    }
  }

  // 2. Banner HUD vizual (Dark Luxury)
  let badge = document.getElementById('parcos-olx-status-badge');
  if (badge) badge.remove();

  badge = document.createElement('div');
  badge.id = 'parcos-olx-status-badge';
  badge.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999999;
    background: #09090b;
    border: 1px solid rgba(245, 158, 11, 0.6);
    color: #f4f4f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 14px 18px;
    border-radius: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(245,158,11,0.2);
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    min-width: 290px;
    max-width: 360px;
    transition: all 0.3s ease;
  \`;

  badge.innerHTML = \`
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;">
      <div style="display:flex;align-items:center;gap:7px;font-weight:800;color:#f59e0b;font-size:13px;">
        <span style="background:#f59e0b;color:#000;border-radius:6px;padding:1px 6px;font-size:11px;">ParcOS</span>
        <span>Auto-Poster</span>
      </div>
      <span style="font-size:10px;color:#a1a1aa;">\${car.brand || ''} \${car.model || ''}</span>
    </div>
    <div id="parcos-status-text" style="color:#fbbf24;font-weight:600;">⚡ Inițializare formular...</div>
  \`;
  document.body.appendChild(badge);

  const updateHud = (text, isSuccess = false) => {
    const el = document.getElementById('parcos-status-text');
    if (el) {
      el.innerHTML = isSuccess ? \`<span style="color:#22c55e;">✓ \${text}</span>\` : \`⚡ \${text}\`;
    }
  };

  // 3. Utilitare DOM Synthetic Events (Compatibile React & CDK)
  function setVal(el, val) {
    if (!el) return;
    el.focus();
    const proto = Object.getPrototypeOf(el);
    const set = Object.getOwnPropertyDescriptor(proto, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (set) {
      set.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    el.blur();
  }

  function clickEl(el) {
    if (!el) return;
    el.focus?.();
    el.click();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  // Helper universal pentru selectare dropdown/combobox OLX (parameters.model, car_body, color, petrol, door_count)
  async function selectDropdownOption(triggerSelectors, candidateTexts, labelKeywords = [], fullCarModel = '', carTitle = '') {
    let triggerBtn = null;

    // 1. Căutare directă prin selectori de atribute
    for (const sel of triggerSelectors) {
      const el = document.querySelector(sel);
      if (el && (el as HTMLElement).offsetParent !== null) {
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'combobox' || el.getAttribute('role') === 'button') {
          triggerBtn = el;
          break;
        }
        const inner = el.querySelector('button, [role="combobox"], [role="button"], .n-referenceinput-button, [tabindex="0"], div[class*="button" i], div[class*="select" i]');
        if (inner && (inner as HTMLElement).offsetParent !== null) {
          triggerBtn = inner;
          break;
        }
        const selectChild = Array.from(el.querySelectorAll('*')).find(c => {
          const t = (c.textContent || '').trim().toLowerCase();
          return (t.includes('selecteaz') || t.includes('select')) && (c as HTMLElement).offsetParent !== null && c.children.length <= 2;
        });
        if (selectChild) {
          triggerBtn = selectChild;
          break;
        }
        triggerBtn = el;
        break;
      }
    }

    // 2. Căutare după Label (eticheta vizibilă pe ecran, ex: "Model *")
    if (!triggerBtn && labelKeywords.length > 0) {
      const allLabels = Array.from(document.querySelectorAll('label, p, span, div, h3, h4'));
      const matchedLabel = allLabels.find(l => {
        if ((l as HTMLElement).offsetParent === null) return false;
        if (l.children.length > 3) return false;
        const txt = (l.textContent || '').trim().toLowerCase();
        return labelKeywords.some(kw => txt === kw.toLowerCase() || txt.startsWith(kw.toLowerCase()));
      });

      if (matchedLabel) {
        const fieldWrapper = matchedLabel.closest('div[class*="wrapper" i], div[class*="field" i], div[data-testid], div[data-cy]') || matchedLabel.parentElement;
        if (fieldWrapper) {
          const interactive = fieldWrapper.querySelector('button, [role="combobox"], [role="button"], .n-referenceinput-button, [tabindex="0"], div[class*="select" i], div:has(> svg)');
          if (interactive && (interactive as HTMLElement).offsetParent !== null) {
            triggerBtn = interactive;
          } else {
            const selectBox = Array.from(fieldWrapper.querySelectorAll('*')).find(c => {
              const t = (c.textContent || '').trim().toLowerCase();
              return (t.includes('selecteaz') || t.includes('select')) && (c as HTMLElement).offsetParent !== null && c.children.length <= 2;
            });
            if (selectBox) triggerBtn = selectBox;
          }
        }
      }
    }

    // 3. Fallback: căutare buton care are deja textul selectat sau textul "Selectează"
    if (!triggerBtn) {
      const allButtons = Array.from(document.querySelectorAll('button, div[role="combobox"], div[role="button"], div[tabindex="0"]'));
      triggerBtn = allButtons.find(b => {
        if ((b as HTMLElement).offsetParent === null) return false;
        const txt = (b.textContent || '').trim().toLowerCase();
        if (txt.includes('schimbă categoria') || txt.includes('alege categoria') || txt.includes('editează categoria') || txt.includes('categorie')) return false;
        const testId = (b.getAttribute('data-testid') || '').toLowerCase();
        if (testId.includes('category') || testId.includes('modal')) return false;
        return candidateTexts.some(cand => txt.includes(cand.toLowerCase()));
      });
    }

    if (!triggerBtn) {
      console.warn('[ParcOS OLX] Nu s-a găsit trigger pentru candidații:', candidateTexts);
      return false;
    }

    console.log('[ParcOS OLX] Clic pe trigger dropdown:', triggerBtn.textContent?.trim());
    clickEl(triggerBtn);
    await sleep(450);

    // Verificăm dacă a apărut un câmp de căutare intern în popup (ex: la căutarea Modelului)
    const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="caut" i], input[placeholder*="model" i], input[placeholder*="marcă" i], input[placeholder*="marca" i], .n-combobox-input, [role="dialog"] input, [role="listbox"] input'));
    const activeSearch = searchInputs.find(i => (i as HTMLElement).offsetParent !== null);
    if (activeSearch && candidateTexts.length > 0) {
      const term = candidateTexts.find(c => c.length >= 2 && !c.includes(' ')) || candidateTexts[0];
      setVal(activeSearch, term);
      await sleep(400);
    }

    // Căutăm opțiunea printre [role="option"], li, div-uri din overlay
    const options = Array.from(document.querySelectorAll('[role="option"], li, div[data-testid*="option"], .n-select-option, [role="listbox"] > *, div[class*="option" i], [role="dialog"] li, [role="dialog"] button')).filter(o => (o as HTMLElement).offsetParent !== null && (o.textContent || '').trim().length > 0);

    const cleanOpt = (txt) => {
      return (txt || '').replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
    };

    let matchedOption = null;

    // Pas 1: Potrivire exactă case-insensitive
    matchedOption = options.find(o => {
      const optTxt = cleanOpt(o.textContent);
      return candidateTexts.some(c => optTxt === c.toLowerCase());
    });

    // Pas 2: Opțiunea este un cuvânt exact în modelul mașinii (ex: "Clio" în "Clio IV")
    if (!matchedOption && fullCarModel) {
      matchedOption = options.find(o => {
        const optTxt = cleanOpt(o.textContent);
        if (optTxt.length < 2) return false;
        const regex = new RegExp('(^|[\\\\s-_])' + optTxt + '([\\\\s-_]|$)', 'i');
        return regex.test(fullCarModel);
      });
    }

    // Pas 3: Opțiunea este un cuvânt exact în titlul mașinii
    if (!matchedOption && carTitle) {
      matchedOption = options.find(o => {
        const optTxt = cleanOpt(o.textContent);
        if (optTxt.length < 3) return false;
        const regex = new RegExp('(^|[\\\\s-_])' + optTxt + '([\\\\s-_]|$)', 'i');
        return regex.test(carTitle);
      });
    }

    // Pas 4: Potrivire parțială / substring (lungime >= 3)
    if (!matchedOption) {
      matchedOption = options.find(o => {
        const optTxt = cleanOpt(o.textContent);
        return optTxt.length >= 3 && candidateTexts.some(c => {
          const cLow = c.toLowerCase();
          return cLow.length >= 3 && (optTxt.includes(cLow) || cLow.includes(optTxt));
        });
      });
    }

    if (matchedOption) {
      console.log('[ParcOS OLX] Opțiune selectată:', matchedOption.textContent?.trim());
      const clickable = (matchedOption as HTMLElement).closest('[role="option"], li, button, [role="button"]') || matchedOption;
      clickEl(clickable);
      await sleep(300);
      return true;
    }

    // Închidem dropdown-ul dacă nu am găsit
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return false;
  }

  // Helper universal pentru chip-uri (cutie, stare, volan, etc.)
  function clickChipUniversal(cySelectors, candidateTexts) {
    for (const sel of cySelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const btn = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el;
        clickEl(btn);
        return true;
      }
    }
    // Fallback după text
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], label'));
    const match = buttons.find(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      return candidateTexts.some(cand => txt === cand.toLowerCase() || txt.includes(cand.toLowerCase()));
    });
    if (match) {
      clickEl(match);
      return true;
    }
    return false;
  }

  // Helper specializat pentru butoane segmented/chips OLX (Stare, Volan, Cutie de viteze, Înmatriculat)
  function selectSegmentedOption(fieldLabels, targetOptionTexts) {
    // 1. Căutăm eticheta secțiunii (ex: "Stare", "Volan", "Cutie de viteze", "Inmatriculat")
    const allLabels = Array.from(document.querySelectorAll('label, p, span, div, h3, h4'));
    const matchedLabel = allLabels.find(l => {
      if (l.offsetParent === null) return false;
      const rawTxt = (l.textContent || '').trim();
      if (rawTxt.length > 50) return false;
      const txt = rawTxt.toLowerCase();
      return fieldLabels.some(kw => {
        const k = kw.toLowerCase();
        return txt === k || txt.startsWith(k) || (txt.includes(k) && rawTxt.length < 35);
      });
    });

    let targetBtn = null;
    if (matchedLabel) {
      let curr = matchedLabel.parentElement;
      for (let depth = 0; depth < 5 && curr && curr !== document.body; depth++) {
        const candidates = Array.from(curr.querySelectorAll('button, div[role="button"], label, span[role="button"], [data-cy], [data-testid]'));
        const found = candidates.find(b => {
          if (b === matchedLabel || b.contains(matchedLabel)) return false;
          if (b.offsetParent === null) return false;
          const bTxt = (b.textContent || '').trim().toLowerCase();
          return targetOptionTexts.some(opt => {
            const o = opt.toLowerCase();
            return bTxt === o || bTxt.startsWith(o) || (bTxt.includes(o) && bTxt.length < o.length + 10);
          });
        });
        if (found) {
          targetBtn = found;
          break;
        }
        curr = curr.parentElement;
      }
    }

    // 2. Fallback căutare după text direct în toate butoanele/etichetele paginii
    if (!targetBtn) {
      const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], label, span[role="button"], [data-cy], [data-testid]'));
      targetBtn = allButtons.find(b => {
        if (b.offsetParent === null) return false;
        const bTxt = (b.textContent || '').trim().toLowerCase();
        return targetOptionTexts.some(opt => bTxt === opt.toLowerCase() || (bTxt.includes(opt.toLowerCase()) && bTxt.length < opt.length + 6));
      });
    }

    if (targetBtn) {
      console.log('[ParcOS OLX] Segmented selectat: "' + (targetBtn.textContent || '').trim() + '"');
      clickEl(targetBtn);
      return true;
    }

    return false;
  }

  // Curățare descriere conform validatorului OLX: "Scrie doar litere si cifre (fara caractere speciale)"
  function sanitizeForOlx(text) {
    if (!text) return '';
    let cleaned = text
      .replace(/cm³/gi, 'cmc')
      .replace(/m³/gi, 'm3')
      .replace(/³/g, '3')
      .replace(/²/g, '2')
      .replace(/[•●○◦‣⁃*]/g, '-')
      .replace(/[✔✓☑]/g, '-')
      .replace(/[—–~_]/g, '-')
      .replace(/[\[\{]/g, '(')
      .replace(/[\]\}]/g, ')')
      .replace(/[„”«»]/g, '"')
      .replace(/[''‚‛]/g, "'")
      .replace(/={2,}/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
      .replace(/[^\p{L}\p{N}\s.,:;!?()\-/%+&"']/gu, ' ')
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return cleaned;
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 1: Titlu și Categorie Autoturisme
  // ══════════════════════════════════════════════════════════════════
  updateHud('Setare titlu și categorie...');
  const titleSelectors = [
    'input[data-testid="add-title-input"]',
    'input[data-testid="title"]',
    'input[name="title"]',
    'input#title',
    'input[placeholder*="Barista"]',
    'input[placeholder*="titlu" i]',
    'input[placeholder*="Ce vrei" i]',
    'input[maxlength="150"]',
    'main input[type="text"]',
    'form input[type="text"]'
  ];

  let titleInput = null;
  for (const s of titleSelectors) {
    const el = document.querySelector(s);
    if (el && el.offsetParent !== null) { titleInput = el; break; }
  }

  if (titleInput && car.title) {
    setVal(titleInput, car.title);
    await sleep(600);

    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'));
    const continueBtn = buttons.find(b => {
      const txt = (b.textContent || b.value || '').trim().toLowerCase();
      return (txt.includes('continuă') || txt.includes('continua')) && b.offsetParent !== null;
    });
    if (continueBtn) {
      clickEl(continueBtn);
      await sleep(1000);
    }
  }

  // Helper universal pentru forțarea închiderii modalului "Alege categoria"
  function tryCloseCategoryModal() {
    const isCatModalVisible = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span, p')).some(el => {
      if (el.children.length > 2) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'alege categoria' || t.startsWith('noi sugerăm');
    });

    if (!isCatModalVisible) return false;

    console.log('[ParcOS OLX] Modal "Alege categoria" detectat pe ecran! Declanșare închidere forțată...');

    const explicitClose = document.querySelector(
      'button[data-testid="close-button"], ' +
      'button[data-testid*="close" i], ' +
      'button[data-testid*="dismiss" i], ' +
      'button[aria-label*="close" i], ' +
      'button[aria-label*="închide" i], ' +
      'button[aria-label*="inchide" i]'
    );
    if (explicitClose && (explicitClose as HTMLElement).offsetParent !== null) {
      clickEl(explicitClose);
      return true;
    }

    const titleEl = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span')).find(el => {
      if (el.children.length > 1) return false;
      return (el.textContent || '').trim().toLowerCase() === 'alege categoria';
    });

    if (titleEl) {
      const headerOrModal = titleEl.closest('[role="dialog"], [data-testid*="modal"], [class*="modal" i]') || 
        titleEl.parentElement?.parentElement || 
        titleEl.parentElement;

      if (headerOrModal) {
        const headerButtons = Array.from(headerOrModal.querySelectorAll('button, div[role="button"], span[role="button"]'));
        const xBtn = headerButtons.find(b => {
          if ((b as HTMLElement).offsetParent === null) return false;
          const txt = (b.textContent || '').trim();
          if (txt === '✕' || txt.toLowerCase() === 'x') return true;
          if (b.querySelector('svg')) {
            const bRect = b.getBoundingClientRect();
            const tRect = titleEl.getBoundingClientRect();
            if (Math.abs(bRect.top - tRect.top) < 60) return true;
          }
          return false;
        });

        if (xBtn) {
          clickEl(xBtn);
          return true;
        }
      }
    }

    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    } catch(e) {}

    const backdrop = document.querySelector('[data-testid*="backdrop"], [data-testid*="overlay"], div[class*="backdrop" i], div[class*="overlay" i]');
    if (backdrop && (backdrop as HTMLElement).offsetParent !== null) {
      clickEl(backdrop);
    }

    return true;
  }

  function hasFullFormRendered() {
    return Boolean(
      document.querySelector('input[data-testid="price-input"]') ||
      document.querySelector('textarea#description') ||
      document.querySelector('textarea[data-testid="description"]') ||
      document.querySelector('input[data-testid="parameters.year"]') ||
      document.querySelector('input[data-cy="attach-photos-input"]') ||
      document.querySelector('input[name="price"]')
    );
  }

  // Pornim Watchdog de fundal pentru închiderea automată a oricărui popup întârziat
  const modalJanitor = setInterval(() => {
    if (hasFullFormRendered()) {
      tryCloseCategoryModal();
    }
  }, 300);

  // Confirmare / dismiss modal "Alege categoria"
  for (let c = 0; c < 8; c++) {
    if (hasFullFormRendered()) {
      tryCloseCategoryModal();
      await sleep(250);
      const stillOpen = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, div')).some(
        el => (el as HTMLElement).offsetParent !== null && (el.textContent || '').trim().toLowerCase().includes('alege categoria')
      );
      if (!stillOpen) break;
    }

    const clickables = Array.from(document.querySelectorAll('button, div[role="button"], a, li, div[data-testid*="category"], [data-testid*="category-suggested"], [class*="suggestion"], [role="dialog"] div, [role="dialog"] button'));
    
    const suggestedCard = clickables.find(el => {
      if ((el as HTMLElement).offsetParent === null) return false;
      const txt = (el.textContent || '').trim().toLowerCase();
      const hasBrand = car.brand ? txt.includes(car.brand.toLowerCase()) : false;
      return hasBrand && (txt.includes('autoturisme') || txt.includes('auto, moto'));
    }) || clickables.find(el => {
      if ((el as HTMLElement).offsetParent === null) return false;
      const txt = (el.textContent || '').trim().toLowerCase();
      return txt.includes('autoturisme') && !txt.includes('alege alta') && !txt.includes('alege categoria');
    });

    if (suggestedCard) {
      console.log('[ParcOS OLX] Click pe categoria sugerată:', suggestedCard.textContent?.trim());
      clickEl(suggestedCard);
      await sleep(600);
      tryCloseCategoryModal();
    }

    if (hasFullFormRendered()) {
      tryCloseCategoryModal();
      await sleep(250);
      break;
    }
    await sleep(350);
  }

  // Așteptare apariție formular detaliat (până la 6 secunde)
  for (let w = 0; w < 12; w++) {
    if (document.querySelector('input[data-testid="price-input"]') || 
        document.querySelector('textarea#description') || 
        document.querySelector('input[data-testid="parameters.year"]') ||
        document.querySelector('input[data-cy="attach-photos-input"]') ||
        document.querySelector('input[name="price"]')) {
      break;
    }
    await sleep(500);
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 2: Preț, Monedă & Negociabil
  // ══════════════════════════════════════════════════════════════════
  updateHud('Setare preț și monedă...');
  const priceInput = document.querySelector('input[data-testid="price-input"]') || 
    document.querySelector('input[name="price"]') || 
    document.querySelector('#price') ||
    document.querySelector('input[data-cy="price-input"]');

  if (priceInput && car.price) {
    setVal(priceInput, String(car.price));
  }

  if (car.currency) {
    const priceWrapper = priceInput?.closest('div') || document.querySelector('[data-cy="title-field-wrapper"]');
    let currBtn = priceWrapper?.querySelector('button, [role="button"]') ||
      document.querySelector('[data-cy="currency-select"] button') ||
      document.querySelector('[data-testid="currency-select"]');
    if (currBtn) {
      const btnTxt = (currBtn.textContent || '').trim().toLowerCase();
      const isCurrencyBtn = btnTxt.includes('€') || btnTxt.includes('lei') || btnTxt.includes('ron') || btnTxt.includes('eur');
      if (!isCurrencyBtn) currBtn = null;
    }
    if (currBtn) {
      const btnTxt = (currBtn.textContent || '').trim();
      const targetSymbol = car.currency === '€' ? '€' : 'lei';
      if (!btnTxt.includes(targetSymbol)) {
        clickEl(currBtn);
        await sleep(300);
        const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(
          (o) => o.textContent && o.textContent.trim() === targetSymbol
        );
        if (opt) clickEl(opt);
      }
    }
  }

  if (car.negotiable) {
    const negBox = document.querySelector('#nexus-input') || document.querySelector('input[name*="negotiable"]') as HTMLInputElement;
    if (negBox && !negBox.checked) clickEl(negBox);
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 3: Marcă & Model (Dropdown / Combobox cu căutare)
  // ══════════════════════════════════════════════════════════════════
  updateHud('Selectare Marcă & Model...');
  if (car.brand) {
    await selectDropdownOption(
      [
        '[data-cy="parameters.make"]',
        '[data-testid="parameters.make"]',
        '[data-cy="parameters.make"] .n-referenceinput-button',
        '[data-cy="parameters.make"] button',
        '[data-testid*="make"]'
      ],
      [car.brand],
      ['marcă', 'marca'],
      car.brand,
      car.title
    );
  }

  if (car.model) {
    const cleanM = car.model.trim();
    const modelCandidates = [cleanM];

    if (car.brand && cleanM.toLowerCase().startsWith(car.brand.toLowerCase())) {
      const noB = cleanM.slice(car.brand.length).trim();
      if (noB && !modelCandidates.includes(noB)) modelCandidates.push(noB);
    }

    const firstW = cleanM.split(/[\s-]+/)[0];
    if (firstW && !modelCandidates.includes(firstW)) {
      modelCandidates.push(firstW);
    }

    const strippedM = cleanM
      .replace(/\b(i|ii|iii|iv|v|vi|vii|viii)\b/gi, '')
      .replace(/\b(\d+\.\d+)\b/g, '')
      .replace(/\b(tce|dci|tdi|tsi|cdi|hdi|tfsi|puretech|ecoboost)\b/gi, '')
      .replace(/\b(estate|combi|grandtour|touring|avant|break|sedan|hatchback|sw)\b/gi, '')
      .trim();
    if (strippedM && !modelCandidates.includes(strippedM)) {
      modelCandidates.push(strippedM);
    }

    const mLow = cleanM.toLowerCase();
    if (mLow.includes('seria 3') || mLow.includes('3 series') || mLow === '320' || mLow === '318') {
      modelCandidates.push('Seria 3', '3 Series');
    }
    if (mLow.includes('seria 5') || mLow.includes('5 series') || mLow === '520' || mLow === '530') {
      modelCandidates.push('Seria 5', '5 Series');
    }
    if (mLow.includes('seria 1') || mLow.includes('1 series') || mLow === '118' || mLow === '120') {
      modelCandidates.push('Seria 1', '1 Series');
    }
    if (mLow.includes('clasa c') || mLow.includes('c-class') || mLow === 'c200' || mLow === 'c220') {
      modelCandidates.push('Clasa C', 'C-Class');
    }
    if (mLow.includes('clasa e') || mLow.includes('e-class') || mLow === 'e200' || mLow === 'e220') {
      modelCandidates.push('Clasa E', 'E-Class');
    }
    if (mLow.includes('clasa a') || mLow.includes('a-class') || mLow === 'a180' || mLow === 'a200') {
      modelCandidates.push('Clasa A', 'A-Class');
    }

    console.log('[ParcOS OLX] Candidați căutare Model:', modelCandidates);

    const modelSelected = await selectDropdownOption(
      [
        '[data-cy="parameters.model"]',
        '[data-testid="parameters.model"]',
        '[data-cy="parameters.model"] .n-referenceinput-button',
        '[data-cy="parameters.model"] button',
        '[data-testid*="model"]',
        '[data-cy*="model"]'
      ],
      modelCandidates,
      ['model'],
      car.model,
      car.title
    );
    console.log('[ParcOS OLX] Rezultat selecție model:', cleanM, modelSelected);
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 4: Caroserie, Combustibil, Culoare, Uși
  // ══════════════════════════════════════════════════════════════════
  updateHud('Selectare Caroserie, Combustibil, Culoare...');

  // 4.1 Caroserie (Hatchback, Berlina, Break, SUV, etc.)
  if (car.carBody) {
    const bodyCandidates = [car.carBody];
    const b = car.carBody.toLowerCase();
    if (b.includes('hatch')) bodyCandidates.push('Hatchback');
    if (b.includes('berlin') || b.includes('sedan')) bodyCandidates.push('Berlina', 'Sedan');
    if (b.includes('break') || b.includes('combi')) bodyCandidates.push('Break', 'Combi');
    if (b.includes('suv')) bodyCandidates.push('SUV');
    if (b.includes('coupe')) bodyCandidates.push('Coupe', 'Coupé');
    if (b.includes('mono') || b.includes('van')) bodyCandidates.push('Monovolum');

    await selectDropdownOption(
      [
        '[data-cy="parameters.car_body"]',
        '[data-testid="parameters.car_body"]',
        '[data-cy="parameters.car_body"] .n-referenceinput-button',
        '[data-cy="parameters.car_body"] button',
        '[data-testid*="car_body"]',
        '[data-testid*="car_type"]'
      ],
      bodyCandidates,
      ['caroserie', 'tip caroserie']
    );
  }

  // 4.2 Combustibil (Benzină, Diesel, Hibrid, Electric, GPL)
  if (car.fuel) {
    const fuelCandidates = [car.fuel];
    const f = car.fuel.toLowerCase();
    if (f.includes('benz')) fuelCandidates.push('Benzina', 'Benzină');
    if (f.includes('dies')) fuelCandidates.push('Diesel');
    if (f.includes('hib') || f.includes('hyb')) fuelCandidates.push('Hibrid', 'Hybrid');
    if (f.includes('elec')) fuelCandidates.push('Electric');
    if (f.includes('gpl') || f.includes('lpg')) fuelCandidates.push('GPL');

    await selectDropdownOption(
      [
        '[data-cy="parameters.petrol"]',
        '[data-testid="parameters.petrol"]',
        '[data-cy="parameters.petrol"] .n-referenceinput-button',
        '[data-cy="parameters.petrol"] button',
        '[data-cy*="fuel"]',
        '[data-testid*="petrol"]',
        '[data-testid*="fuel"]'
      ],
      fuelCandidates,
      ['combustibil', 'carburant']
    );
  }

  // 4.3 Culoare (Alb, Negru, Gri, Argintiu, etc.)
  if (car.color) {
    const colorCandidates = [car.color];
    const c = car.color.toLowerCase();
    if (c.includes('alb') && !c.includes('astru')) colorCandidates.push('Alb');
    if (c.includes('neg')) colorCandidates.push('Negru');
    if (c.includes('gri') || c.includes('gray') || c.includes('grey')) colorCandidates.push('Gri');
    if (c.includes('arg')) colorCandidates.push('Argintiu');
    if (c.includes('albastr') || c.includes('blue')) colorCandidates.push('Albastru');
    if (c.includes('ros') || c.includes('roș')) colorCandidates.push('Rosu', 'Roșu');

    await selectDropdownOption(
      [
        '[data-cy="parameters.color"]',
        '[data-testid="parameters.color"]',
        '[data-cy="parameters.color"] .n-referenceinput-button',
        '[data-cy="parameters.color"] button',
        '[data-testid*="color"]'
      ],
      colorCandidates,
      ['culoare']
    );
  }

  // 4.4 Număr de uși (4 sau 5 vs 2 sau 3)
  const isCoupeOrCabrio = (car.carBody || '').toLowerCase().includes('coupe') || (car.carBody || '').toLowerCase().includes('cabrio');
  const doorCandidates = isCoupeOrCabrio 
    ? ['2 sau 3', '2 / 3', '2-3', '2', '3'] 
    : ['4 sau 5', '4 / 5', '4-5', '4', '5'];

  await selectDropdownOption(
    [
      '[data-cy="parameters.door_count"]',
      '[data-testid="parameters.door_count"]',
      '[data-cy="parameters.door_count"] .n-referenceinput-button',
      '[data-cy="parameters.door_count"] button',
      '[data-testid*="door_count"]'
    ],
    doorCandidates,
    ['număr uși', 'numar usi', 'uși', 'usi']
  );

  // ══════════════════════════════════════════════════════════════════
  // PASUL 5: Parametri Tehnici Text (An, Km, Motor, Putere, VIN)
  // ══════════════════════════════════════════════════════════════════
  updateHud('Completare specificații tehnice...');
  const textSpecs = {
    'parameters.year': car.year,
    'parameters.rulaj_pana': car.mileageKm,
    'parameters.enginesize': car.engineCc,
    'parameters.engine_power': car.powerHp,
    'parameters.vin': car.vin
  };

  for (const [key, val] of Object.entries(textSpecs)) {
    if (!val) continue;
    const inp = document.querySelector(\`input[data-testid="\${key}"]\`) || 
                document.querySelector(\`input[name="\${key}"]\`) ||
                document.querySelector(\`input[data-cy="\${key}"]\`);
    if (inp) setVal(inp, String(val));
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 6: Chip-uri (Cutie, Stare, Volan, Înmatriculare, Firmă)
  // ══════════════════════════════════════════════════════════════════
  // 1. Stare: Utilizat (by default)
  selectSegmentedOption(['stare', 'starea'], ['utilizat', 'second hand', 'folosit']);

  // 2. Volan: Partea stanga (by default)
  const isRhd = (car.steeringWheel === 'rhd') || (car.steeringWheel || '').toLowerCase().includes('dreapta');
  selectSegmentedOption(
    ['volan', 'partea volanului', 'poziție volan', 'pozitie volan'],
    isRhd ? ['partea dreapta', 'partea dreaptă', 'dreapta'] : ['partea stanga', 'partea stângă', 'pe stanga', 'pe stânga', 'stanga']
  );

  // 3. Cutie de viteze: în funcție de anunț
  const isAuto = (car.gearbox || car.transmission || '').toLowerCase().includes('auto') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('dsg') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('steptronic') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('tiptronic') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('s-tronic') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('stronic') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('edc') ||
    (car.gearbox || car.transmission || '').toLowerCase().includes('pdk') ||
    (car.title || '').toLowerCase().includes('automat') ||
    (car.title || '').toLowerCase().includes('dsg');

  selectSegmentedOption(
    ['cutie de viteze', 'cutie viteze', 'transmisie', 'cutie'],
    isAuto ? ['automata', 'automată', 'automatic'] : ['manuala', 'manuală', 'manual']
  );

  // 4. Înmatriculat / Neînmatriculat: Neînmatriculat (by default)
  const isRegistered = car.registration === 'registered';
  selectSegmentedOption(
    ['inmatriculat/neimatriculat', 'inmatriculat / neimatriculat', 'inmatriculat', 'înmatriculat', 'neimatriculat', 'neinmatriculat'],
    isRegistered ? ['inmatriculat', 'înmatriculat'] : ['neinmatriculat', 'neînmatriculat', 'neimatriculat']
  );

  // 5. Vânzător Firmă
  clickChipUniversal(['[data-cy="private_business_business"]'], ['Firmă', 'Firma', 'Companie']);

  // ══════════════════════════════════════════════════════════════════
  // PASUL 7: Descriere Comercială Certificată
  // ══════════════════════════════════════════════════════════════════
  updateHud('Injectare descriere comercială...');
  const descEl = document.querySelector('textarea#description') || 
                 document.querySelector('textarea[data-testid="description"]') || 
                 document.querySelector('textarea[name="description"]') || 
                 document.querySelector('textarea');
  if (descEl && car.description) {
    const cleanDesc = sanitizeForOlx(car.description);
    setVal(descEl, cleanDesc);
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 8: Contact, Telefon & Localitate
  // ══════════════════════════════════════════════════════════════════
  updateHud('Completare date de contact...');
  const personInput = document.querySelector('#person') || document.querySelector('input[name="person"]');
  if (personInput && car.contactPerson) setVal(personInput, car.contactPerson);

  const phoneInput = document.querySelector('#phone') || document.querySelector('input[name="phone"]');
  if (phoneInput && car.contactPhone) setVal(phoneInput, car.contactPhone);

  const locInput = document.querySelector('#autosuggest-location-input') || document.querySelector('input[name="location"]');
  if (locInput && car.location) {
    setVal(locInput, car.location);
    await sleep(900);
    const firstSug = document.querySelector('[role="option"], .autosuggest-item, li[data-testid*="location"]');
    if (firstSug) clickEl(firstSug);
  }

  // Autoprelungire (implicit false conform preferințelor dealerului)
  const autoExtInput = document.querySelector('input#auto-extension');
  if (autoExtInput) {
    if (car.autoExtension && !autoExtInput.checked) {
      clickEl(autoExtInput);
    } else if (!car.autoExtension && autoExtInput.checked) {
      clickEl(autoExtInput);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PASUL 9: Upload Fotografii (până la 8 imagini prin DataTransfer)
  // ══════════════════════════════════════════════════════════════════
  const fileInput = document.querySelector('input[data-cy="attach-photos-input"]') || 
    document.querySelector('input[type="file"]') ||
    document.querySelector('input[accept*="image"]');
  const photosToUpload = (car.photos || []).slice(0, 8);

  if (fileInput && photosToUpload.length > 0) {
    updateHud(\`Descărcare fotografii (0/\${photosToUpload.length})...\`);
    try {
      const dt = new DataTransfer();
      for (let i = 0; i < photosToUpload.length; i++) {
        let photoUrl = photosToUpload[i];
        if (photoUrl.startsWith('/') && car.origin) {
          photoUrl = \`\${car.origin}\${photoUrl}\`;
        }
        updateHud(\`Descărcare foto (\${i + 1}/\${photosToUpload.length})...\`);
        try {
          const resp = await fetch(photoUrl, { mode: 'cors' });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const blob = await resp.blob();
          const mimeType = blob.type || (photoUrl.endsWith('.png') ? 'image/png' : 'image/webp');
          const ext = mimeType.includes('png') ? '.png' : (mimeType.includes('jpeg') ? '.jpg' : '.webp');
          const file = new File([blob], \`parcos_olx_foto_\${i + 1}\${ext}\`, { type: mimeType });
          dt.items.add(file);
        } catch(fetchErr) {
          console.warn('[ParcOS OLX] Eroare descărcare imagine:', photoUrl, fetchErr);
        }
      }

      if (dt.files.length > 0) {
        (fileInput as HTMLInputElement).files = dt.files;
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        const dropTarget = fileInput.closest('[data-cy*="photo"], [data-testid*="photo"], [class*="upload" i], [class*="drop" i], div:has(> input[type="file"])') || fileInput.parentElement;
        if (dropTarget) {
          try {
            const dragEnter = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt });
            const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
            const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
            dropTarget.dispatchEvent(dragEnter);
            dropTarget.dispatchEvent(dragOver);
            dropTarget.dispatchEvent(dropEvent);
          } catch (e) {
            console.warn('[ParcOS OLX] DragEvent dispatch error:', e);
          }
        }

        await sleep(1500);
        console.log(\`[ParcOS OLX] S-au atașat \${dt.files.length} fotografii în galeria OLX.\`);
      }
    } catch(err) {
      console.error('[ParcOS OLX] Eroare la pipeline-ul de upload foto:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FINALIZARE CU SUCCES
  // ══════════════════════════════════════════════════════════════════
  updateHud('Formular completat! Gata de publicare.', true);
  badge.style.background = '#14532d';
  badge.style.borderColor = '#22c55e';
  badge.innerHTML = \`
    <div style="font-weight:800;color:#86efac;font-size:13px;display:flex;align-items:center;gap:6px;">
      <span>✓</span> <span>Completat cu succes de ParcOS!</span>
    </div>
    <div style="font-size:11px;color:#dcfce7;line-height:1.4;">
      Toate specificațiile pentru <strong>\${car.brand || ''} \${car.model || ''}</strong> au fost injectate.<br>
      Apasă butonul galben <strong>[Publică-mi anunțul]</strong> din josul paginii.
    </div>
  \`;
  setTimeout(() => { if (badge) badge.remove(); }, 14000);
  setTimeout(() => { clearInterval(modalJanitor); }, 6000);

})();
  `.trim();
}
