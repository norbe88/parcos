/**
 * extensions/parcos-olx-publisher/content_olx.js
 * Content script pentru completarea automată a formularului de adăugare anunț pe OLX România (olx.ro/adding/)
 * 
 * Arhitectură adaptivă multi-step pentru redesignul OLX România:
 * 1. Preluare resilientă din background storage sau clipboard / localStorage
 * 2. Dock UI interactiv permanent (Dark Luxury) cu status în timp real per fiecare pas
 * 3. Detecție dinamică a inputului de titlu pe ecranul inițial "Ce vrei să publici?"
 * 4. Navigare automată prin selecția categoriei "Autoturisme"
 * 5. Selecție robustă Marcă & Model prin combobox și popup de căutare (ex: Renault Clio)
 * 6. Selecție atribute tehnice: Caroserie (Hatchback/Berlina/SUV), Combustibil (Benzină/Diesel), Culoare, Uși (4/5)
 * 7. Chip-uri de opțiuni: Cutie Manuală/Automată, Volan stânga, Stare utilizat, Firmă, Înmatriculat
 * 8. Preț, monedă (€ / lei) și descriere comercială certificată (21% TVA & Cont de Garanție)
 * 9. Descărcare și atașare a celor 8 fotografii HD prin DataTransfer
 */

(async function() {
  console.log('[ParcOS OLX] Extensie activată pe pagina OLX România.');

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper setare valoare compatibilă cu starea internă React (SyntheticEvents)
  function setReactInputValue(inputElement, value) {
    if (!inputElement) return;
    inputElement.focus();
    const prototype = Object.getPrototypeOf(inputElement);
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

    if (valueSetter) {
      valueSetter.call(inputElement, value);
    } else {
      inputElement.value = value;
    }

    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    inputElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    inputElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    inputElement.blur();
  }

  function clickElement(el) {
    if (!el) return;
    el.focus?.();
    el.click();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  // Helper universal pentru selectare dropdown/combobox OLX (Marcă, Model, Caroserie, Combustibil, Culoare, Uși)
  async function selectDropdownOption(triggerSelectors, candidateTexts, labelKeywords = [], fullCarModel = '', carTitle = '') {
    let triggerBtn = null;

    // 1. Căutare directă prin selectori de atribute (data-cy, data-testid, etc.)
    for (const sel of triggerSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'combobox' || el.getAttribute('role') === 'button') {
          triggerBtn = el;
          break;
        }
        const inner = el.querySelector('button, [role="combobox"], [role="button"], .n-referenceinput-button, [tabindex="0"], div[class*="button" i], div[class*="select" i]');
        if (inner && inner.offsetParent !== null) {
          triggerBtn = inner;
          break;
        }
        const selectChild = Array.from(el.querySelectorAll('*')).find(c => {
          const t = (c.textContent || '').trim().toLowerCase();
          return (t.includes('selecteaz') || t.includes('select')) && c.offsetParent !== null && c.children.length <= 2;
        });
        if (selectChild) {
          triggerBtn = selectChild;
          break;
        }
        triggerBtn = el;
        break;
      }
    }

    // 2. Căutare după Label (eticheta vizibilă pe ecran, ex: "Model *", "Caroserie *", etc.)
    if (!triggerBtn && labelKeywords.length > 0) {
      const allLabels = Array.from(document.querySelectorAll('label, p, span, div, h3, h4'));
      const matchedLabel = allLabels.find(l => {
        if (l.offsetParent === null) return false;
        if (l.children.length > 3) return false;
        const txt = (l.textContent || '').trim().toLowerCase();
        return labelKeywords.some(kw => txt === kw.toLowerCase() || txt.startsWith(kw.toLowerCase()));
      });

      if (matchedLabel) {
        const fieldWrapper = matchedLabel.closest('div[class*="wrapper" i], div[class*="field" i], div[data-testid], div[data-cy]') || matchedLabel.parentElement;
        if (fieldWrapper) {
          const interactive = fieldWrapper.querySelector('button, [role="combobox"], [role="button"], .n-referenceinput-button, [tabindex="0"], div[class*="select" i], div:has(> svg)');
          if (interactive && interactive.offsetParent !== null) {
            triggerBtn = interactive;
          } else {
            const selectBox = Array.from(fieldWrapper.querySelectorAll('*')).find(c => {
              const t = (c.textContent || '').trim().toLowerCase();
              return (t.includes('selecteaz') || t.includes('select')) && c.offsetParent !== null && c.children.length <= 2;
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
        if (b.offsetParent === null) return false;
        const txt = (b.textContent || '').trim().toLowerCase();
        // Nu dăm niciodată click pe butoane de schimbat / ales categoria!
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
    clickElement(triggerBtn);
    await sleep(450);

    // Căutare input intern în popup/dropdown dacă există
    const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="caut" i], input[placeholder*="model" i], input[placeholder*="marcă" i], input[placeholder*="marca" i], .n-combobox-input, [role="dialog"] input, [role="listbox"] input'));
    const activeSearch = searchInputs.find(i => i.offsetParent !== null);
    if (activeSearch && candidateTexts.length > 0) {
      const term = candidateTexts.find(c => c.length >= 2 && !c.includes(' ')) || candidateTexts[0];
      console.log('[ParcOS OLX] Tastare în search input dropdown:', term);
      setReactInputValue(activeSearch, term);
      await sleep(400);
    }

    // Preluare opțiuni disponibile în meniu
    const options = Array.from(document.querySelectorAll('[role="option"], li, div[data-testid*="option"], .n-select-option, [role="listbox"] > *, div[class*="option" i], [role="dialog"] li, [role="dialog"] button')).filter(o => o.offsetParent !== null && (o.textContent || '').trim().length > 0);

    console.log(`[ParcOS OLX] S-au găsit ${options.length} opțiuni în meniul deschis.`);

    const cleanOpt = (txt) => {
      return (txt || '').replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
    };

    let matchedOption = null;

    // Nivelul 1: Potrivire exactă case-insensitive
    matchedOption = options.find(o => {
      const optTxt = cleanOpt(o.textContent);
      return candidateTexts.some(c => optTxt === c.toLowerCase());
    });

    // Nivelul 2: Opțiunea este un cuvânt exact în modelul mașinii (ex: "Clio" în "Clio IV")
    if (!matchedOption && fullCarModel) {
      matchedOption = options.find(o => {
        const optTxt = cleanOpt(o.textContent);
        if (optTxt.length < 2) return false;
        const regex = new RegExp(`(^|[\\s-_])${optTxt}([\\s-_]|$)`, 'i');
        return regex.test(fullCarModel);
      });
    }

    // Nivelul 3: Opțiunea este un cuvânt exact în titlul mașinii (ex: "Clio" în "Renault Clio 0.9 TCe 2018")
    if (!matchedOption && carTitle) {
      matchedOption = options.find(o => {
        const optTxt = cleanOpt(o.textContent);
        if (optTxt.length < 3) return false;
        const regex = new RegExp(`(^|[\\s-_])${optTxt}([\\s-_]|$)`, 'i');
        return regex.test(carTitle);
      });
    }

    // Nivelul 4: Potrivire parțială / substring (lungime >= 3)
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
      console.log('[ParcOS OLX] Opțiune potrivită și selectată:', matchedOption.textContent?.trim());
      const clickable = matchedOption.closest('[role="option"], li, button, [role="button"]') || matchedOption;
      clickElement(clickable);
      await sleep(300);
      return true;
    }

    console.warn('[ParcOS OLX] Nicio opțiune potrivită pentru candidații:', candidateTexts);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return false;
  }

  // Helper universal pentru chip-uri (cutie, stare, volan, firmă)
  function clickChipUniversal(cySelectors, candidateTexts) {
    for (const sel of cySelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const btn = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el;
        clickElement(btn);
        return true;
      }
    }
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], label'));
    const match = buttons.find(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      return candidateTexts.some(cand => txt === cand.toLowerCase() || txt.includes(cand.toLowerCase()));
    });
    if (match) {
      clickElement(match);
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
      console.log(`[ParcOS OLX] Segmented selectat: "${targetBtn.textContent?.trim()}" pentru "${matchedLabel?.textContent?.trim() || fieldLabels[0]}"`);
      clickElement(targetBtn);
      return true;
    }

    return false;
  }

  // Curățare descriere conform validatorului OLX: "Scrie doar litere si cifre (fara caractere speciale)"
  // Păstrează underscore-ul '_' pentru formatul numerelor de telefon (0748_892_937)
  function sanitizeForOlx(text) {
    if (!text) return '';
    let cleaned = text
      // 0. Formatare automată a numerelor de telefon în formatul cerut de OLX (07xx_xxx_xxx)
      .replace(/(?:(?:\+?40|0040)\s*|0)(7\d{2})[\s.\-_]?(\d{3})[\s.\-_]?(\d{3})\b/g, '0$1_$2_$3')
      .replace(/cm³/gi, 'cmc')
      .replace(/m³/gi, 'm3')
      .replace(/³/g, '3')
      .replace(/²/g, '2')
      .replace(/[•●○◦‣⁃*]/g, '-')
      .replace(/[✔✓☑]/g, '-')
      .replace(/[—–~]/g, '-')
      .replace(/[\[\{]/g, '(')
      .replace(/[\]\}]/g, ')')
      .replace(/[„”«»]/g, '"')
      .replace(/[''‚‛]/g, "'")
      .replace(/={2,}/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
      .replace(/[^\p{L}\p{N}\s.,:;!?()\-/%+&"'_]/gu, ' ')
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return cleaned;
  }

  // 1. Obținere payload din extensie cu mecanism de retry agresiv și auto-citire clipboard
  async function fetchPendingCarWithRetry(maxAttempts = 12, delayMs = 250) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'GET_PENDING_CAR' }, (r) => resolve(r));
        });
        if (resp && resp.success && resp.car) {
          console.log(`[ParcOS OLX] Mașină preluată din storage la încercarea ${i + 1}:`, resp.car.title);
          return resp.car;
        }
      } catch (e) {
        console.warn('[ParcOS OLX] Eroare comunicare background la încercarea', i + 1, e);
      }

      // Încercare automată de citire din clipboard dacă storage-ul întârzie
      if (i >= 2) {
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText.trim().startsWith('{')) {
            const parsed = JSON.parse(clipText);
            if (parsed && (parsed.title || parsed.brand)) {
              console.log('[ParcOS OLX] Mașină detectată și preluată automat din clipboard:', parsed.title);
              chrome.runtime.sendMessage({ action: 'SAVE_PENDING_CAR', payload: parsed });
              return parsed;
            }
          }
        } catch (clipErr) {}
      }

      if (i < maxAttempts - 1) await sleep(delayMs);
    }

    // Încercare finală din clipboard
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim().startsWith('{')) {
        const parsed = JSON.parse(clipText);
        if (parsed && (parsed.title || parsed.brand)) {
          console.log('[ParcOS OLX] Mașină preluată din clipboard la final:', parsed.title);
          chrome.runtime.sendMessage({ action: 'SAVE_PENDING_CAR', payload: parsed });
          return parsed;
        }
      }
    } catch (e) {}

    try {
      const raw = localStorage.getItem('parcos_olx_pending_car');
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
  }

  // Ascultare modificări în storage: dacă mașina sosește asincron după inițializarea tabului
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.pendingCar?.newValue && !car) {
        console.log('[ParcOS OLX] Mașină sosită prin storage event:', changes.pendingCar.newValue.title);
        car = changes.pendingCar.newValue;
        renderDock();
        runAutofillSequence();
      }
    });
  }

  let car = await fetchPendingCarWithRetry();

  // 2. Creare Dock UI plutitor pe ecran
  let dock = document.getElementById('parcos-olx-auto-dock');
  if (dock) dock.remove();

  dock = document.createElement('div');
  dock.id = 'parcos-olx-auto-dock';
  dock.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999999;
    width: 360px;
    max-width: calc(100vw - 32px);
    background: #111114;
    border: 1px solid rgba(245, 158, 11, 0.45);
    border-radius: 16px;
    box-shadow: 0 20px 45px rgba(0,0,0,0.7), 0 0 25px rgba(245, 158, 11, 0.18);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f4f4f5;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  function renderDock() {
    if (!car) {
      dock.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:28px;height:28px;border-radius:8px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-weight:900;font-size:12px;">P</div>
            <div>
              <div style="font-weight:800;font-size:13px;color:#fff;">ParcOS Auto-Poster</div>
              <div style="font-size:10px;color:#a1a1aa;">Extensie activă în browser</div>
            </div>
          </div>
          <button id="parcos-dock-close" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:16px;line-height:1;">✕</button>
        </div>

        <div style="font-size:12px;color:#e4e4e7;line-height:1.4;">
          ⚠️ <strong>Nicio mașină în așteptare.</strong><br>
          <span style="font-size:11px;color:#a1a1aa;">Dacă ai apăsat [Exportă pe OLX] în ParcOS, poți lipi datele din clipboard:</span>
        </div>

        <div style="display:flex;gap:8px;">
          <button id="btn-paste-clipboard" style="flex:1;background:#f59e0b;color:#000;border:none;border-radius:10px;padding:8px 12px;font-weight:800;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
            📋 Lipește din Clipboard
          </button>
          <button id="btn-retry-fetch" style="background:rgba(255,255,255,0.08);color:#d4d4d8;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:8px 12px;font-weight:700;font-size:11px;cursor:pointer;">
            🔄 Reîncearcă
          </button>
        </div>
      `;
      attachEmptyListeners();
      return;
    }

    dock.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-weight:900;font-size:12px;">P</div>
          <div>
            <div style="font-weight:800;font-size:13px;color:#fff;">ParcOS Auto-Poster</div>
            <div style="font-size:10px;color:#fbbf24;font-weight:600;">${car.brand} ${car.model} (${car.year}) · ${car.price} ${car.currency}</div>
          </div>
        </div>
        <button id="parcos-dock-close" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:16px;line-height:1;">✕</button>
      </div>

      <div id="parcos-dock-status" style="font-size:12px;color:#fbbf24;display:flex;align-items:center;gap:6px;">
        <span>⚡ Inițializare completare automată...</span>
      </div>

      <div id="parcos-dock-progress" style="display:flex;flex-direction:column;gap:5px;font-size:11px;color:#a1a1aa;background:rgba(255,255,255,0.03);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
        <div id="step-title">⏳ 1. Titlu & Categorie autoturism</div>
        <div id="step-model">⏳ 2. Marcă & Model (${car.brand} ${car.model})</div>
        <div id="step-specs">⏳ 3. Caroserie, Combustibil, Culoare, Uși</div>
        <div id="step-chips">⏳ 4. Cutie, Volan, Înmatriculare & Preț</div>
        <div id="step-desc">⏳ 5. Descriere comercială certificată</div>
        <div id="step-contact">⏳ 6. Contact & Localitate dealer</div>
        <div id="step-photos">⏳ 7. Fotografii profesionale (${(car.photos || []).length}/8)</div>
      </div>

      <div style="display:flex;gap:6px;margin-top:2px;">
        <button id="btn-manual-trigger" style="flex:1;background:linear-gradient(to right, #f59e0b, #fbbf24);color:#000;border:none;border-radius:10px;padding:8px 12px;font-weight:800;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:0 4px 12px rgba(245,158,11,0.25);">
          ⚡ Completează Acum
        </button>
        <button id="btn-clear-car" style="background:rgba(255,255,255,0.05);color:#a1a1aa;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 10px;font-weight:600;font-size:11px;cursor:pointer;" title="Curăță mașina din memorie">
          🗑️
        </button>
      </div>
    `;

    attachActiveListeners();
  }

  function attachEmptyListeners() {
    document.getElementById('parcos-dock-close')?.addEventListener('click', () => dock.remove());

    document.getElementById('btn-paste-clipboard')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const parsed = JSON.parse(text);
        if (parsed && (parsed.title || parsed.brand)) {
          car = parsed;
          chrome.runtime.sendMessage({ action: 'SAVE_PENDING_CAR', payload: car });
          renderDock();
          runAutofillSequence();
        } else {
          alert('Datele din clipboard nu conțin un format valid de mașină ParcOS.');
        }
      } catch (err) {
        const manualJson = prompt('Lipește datele JSON ale mașinii copiate din ParcOS:');
        if (manualJson) {
          try {
            car = JSON.parse(manualJson);
            chrome.runtime.sendMessage({ action: 'SAVE_PENDING_CAR', payload: car });
            renderDock();
            runAutofillSequence();
          } catch (e) {
            alert('Format JSON invalid.');
          }
        }
      }
    });

    document.getElementById('btn-retry-fetch')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-retry-fetch');
      if (btn) btn.textContent = 'Verificare...';
      car = await fetchPendingCarWithRetry(3, 300);
      renderDock();
      if (car) runAutofillSequence();
    });
  }

  function attachActiveListeners() {
    document.getElementById('parcos-dock-close')?.addEventListener('click', () => dock.remove());

    document.getElementById('btn-manual-trigger')?.addEventListener('click', () => {
      runAutofillSequence();
    });

    document.getElementById('btn-clear-car')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'CLEAR_PENDING_CAR' });
      localStorage.removeItem('parcos_olx_pending_car');
      car = null;
      renderDock();
    });
  }

  document.body.appendChild(dock);
  renderDock();

  const updateStatus = (text, isSuccess = false) => {
    const el = document.getElementById('parcos-dock-status');
    if (el) {
      el.innerHTML = isSuccess 
        ? `<span style="color:#22c55e;font-weight:700;">✅ ${text}</span>` 
        : `<span>⚡ ${text}</span>`;
    }
  };

  const markStepDone = (id, label) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `✓ <span style="color:#22c55e;font-weight:600;">${label}</span>`;
  };

  function findTitleInput() {
    const selectors = [
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
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    const allInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    return allInputs.find(i => i.offsetParent !== null && !i.id?.includes('search'));
  }

  function findContinueButton() {
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'));
    return buttons.find(b => {
      const txt = (b.textContent || b.value || '').trim().toLowerCase();
      return (txt.includes('continuă') || txt.includes('continua')) && b.offsetParent !== null;
    });
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

    // 1. Căutare buton explicit de închidere (X)
    const explicitClose = document.querySelector(
      'button[data-testid="close-button"], ' +
      'button[data-testid*="close" i], ' +
      'button[data-testid*="dismiss" i], ' +
      'button[aria-label*="close" i], ' +
      'button[aria-label*="închide" i], ' +
      'button[aria-label*="inchide" i]'
    );
    if (explicitClose && explicitClose.offsetParent !== null) {
      console.log('[ParcOS OLX] Click buton explicit de închidere modal:', explicitClose);
      clickElement(explicitClose);
      return true;
    }

    // 2. Căutare buton X din antetul modalului (lângă titlul "Alege categoria")
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
          if (b.offsetParent === null) return false;
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
          console.log('[ParcOS OLX] Click buton X din antet modal:', xBtn);
          clickElement(xBtn);
          return true;
        }
      }
    }

    // 3. Simulare tastă Escape (pe window și document)
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    } catch(e) {}

    // 4. Click pe backdrop/overlay dacă există
    const backdrop = document.querySelector('[data-testid*="backdrop"], [data-testid*="overlay"], div[class*="backdrop" i], div[class*="overlay" i]');
    if (backdrop && backdrop.offsetParent !== null) {
      clickElement(backdrop);
    }

    return true;
  }

  async function dismissCategoryModal(brand) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const hasForm = hasFullFormRendered();

      // Dacă formularul detaliat este deja randat în spate, modalul este redundant și trebuie DOAR închis!
      if (hasForm) {
        tryCloseCategoryModal();
        await sleep(250);
        const stillOpen = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, div')).some(
          el => el.offsetParent !== null && (el.textContent || '').trim().toLowerCase().includes('alege categoria')
        );
        if (!stillOpen) break;
      }

      // 1. Căutare card sugerat sub "Noi sugerăm această categorie..."
      const allElements = Array.from(document.querySelectorAll('button, div[role="button"], a, li, div, span'));
      
      const suggestedCard = allElements.find(el => {
        if (el.offsetParent === null) return false;
        const txt = (el.textContent || '').trim().toLowerCase();
        const matchesBrand = brand ? txt.includes(brand.toLowerCase()) : false;
        const hasCarCat = txt.includes('autoturisme') || txt.includes('auto, moto');
        if (!hasCarCat) return false;
        if (brand && !matchesBrand) return false;
        if (txt.includes('alege alta') || txt.includes('noi sugerăm') || txt.includes('dar tu poți') || txt.includes('alege categoria')) {
          return false;
        }
        return txt.length < 100;
      });

      if (suggestedCard) {
        console.log('[ParcOS OLX] Click pe cardul de categorie sugerat:', suggestedCard.textContent?.trim());
        const clickable = suggestedCard.closest('button, [role="button"], a, div[tabindex]') || suggestedCard;
        clickElement(clickable);
        await sleep(600);
        tryCloseCategoryModal();
      } else {
        // Fallback: Căutare categoria "Auto, moto si ambarcatiuni" din grilă
        const autoCatCard = allElements.find(el => {
          if (el.offsetParent === null) return false;
          const txt = (el.textContent || '').trim().toLowerCase();
          return (txt === 'auto, moto si ambarcatiuni' || txt === 'auto, moto și ambarcațiuni') && el.children.length <= 2;
        });
        if (autoCatCard) {
          console.log('[ParcOS OLX] Click pe categoria Auto, moto:', autoCatCard.textContent?.trim());
          clickElement(autoCatCard.closest('button, [role="button"], a, div[tabindex]') || autoCatCard);
          await sleep(500);

          const autoSubCat = Array.from(document.querySelectorAll('*')).find(el => {
            if (el.offsetParent === null) return false;
            const txt = (el.textContent || '').trim().toLowerCase();
            return txt === 'autoturisme' && el.children.length <= 1;
          });
          if (autoSubCat) {
            clickElement(autoSubCat.closest('button, [role="button"], a') || autoSubCat);
            await sleep(500);
          }
        }
      }

      // Verificăm și închidem modalul dacă formularul a apărut
      if (hasFullFormRendered()) {
        tryCloseCategoryModal();
        await sleep(250);
        break;
      }

      await sleep(350);
    }
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

  let isRunning = false;
  let hasCompletedOnce = false;

  async function runAutofillSequence() {
    if (!car || isRunning) return;
    isRunning = true;

    // Pornim Watchdog de fundal: dacă OLX declanșează asincron sugestia de categorie în timpul oricărui pas, o închidem instant!
    const modalJanitor = setInterval(() => {
      if (hasFullFormRendered()) {
        tryCloseCategoryModal();
      }
    }, 300);

    try {
      // 0. Dacă modalul "Alege categoria" este deja deschis pe ecran, îl confirmăm instant
      await dismissCategoryModal(car.brand);

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 1: Titlu și Categorie
      // ══════════════════════════════════════════════════════════════════
      updateStatus('Setare titlu autoturism...');
      const titleInput = findTitleInput();

      if (titleInput && car.title) {
        setReactInputValue(titleInput, car.title);
        await sleep(600);

        const continueBtn = findContinueButton();
        if (continueBtn) {
          clickElement(continueBtn);
          await sleep(1000);
        }
      }

      // Confirmare categorie dacă a apărut popup-ul OLX
      await dismissCategoryModal(car.brand);

      markStepDone('step-title', 'Titlu & Categorie confirmate');

      // Așteptare Formular Complet
      updateStatus('Așteptare încărcare specificații complete...');
      for (let waitIdx = 0; waitIdx < 15; waitIdx++) {
        if (hasFullFormRendered()) break;
        await sleep(500);
      }

      // Verificăm încă o dată dacă nu a rămas popup-ul peste formular
      await dismissCategoryModal(car.brand);

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 2: Marcă & Model (Dropdown / Combobox cu căutare)
      // ══════════════════════════════════════════════════════════════════
      updateStatus(`Selectare Marcă & Model (${car.brand} ${car.model})...`);
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

        // 1. Fără prefixul mărcii ("Renault Clio" -> "Clio")
        if (car.brand && cleanM.toLowerCase().startsWith(car.brand.toLowerCase())) {
          const noB = cleanM.slice(car.brand.length).trim();
          if (noB && !modelCandidates.includes(noB)) modelCandidates.push(noB);
        }

        // 2. Primul cuvânt (ex: "Clio" din "Clio IV Estate" sau "Golf" din "Golf 7")
        const firstW = cleanM.split(/[\s-]+/)[0];
        if (firstW && !modelCandidates.includes(firstW)) {
          modelCandidates.push(firstW);
        }

        // 3. Fără cifre romane și specificații de motor / caroserie
        const strippedM = cleanM
          .replace(/\b(i|ii|iii|iv|v|vi|vii|viii)\b/gi, '')
          .replace(/\b(\d+\.\d+)\b/g, '')
          .replace(/\b(tce|dci|tdi|tsi|cdi|hdi|tfsi|puretech|ecoboost)\b/gi, '')
          .replace(/\b(estate|combi|grandtour|touring|avant|break|sedan|hatchback|sw)\b/gi, '')
          .trim();
        if (strippedM && !modelCandidates.includes(strippedM)) {
          modelCandidates.push(strippedM);
        }

        // 4. Mapări comune modele România
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

        if (modelSelected) {
          markStepDone('step-model', `Marcă & Model (${car.brand} ${car.model})`);
        } else {
          const el = document.getElementById('step-model');
          if (el) el.innerHTML = `⚠️ <span style="color:#f59e0b;font-weight:600;">Model (${car.model}) - alege din lista deschisă</span>`;
        }
      }

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 3: Caroserie, Combustibil, Culoare, Uși
      // ══════════════════════════════════════════════════════════════════
      updateStatus('Selectare Caroserie, Combustibil, Culoare, Uși...');

      // Caroserie
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

      // Combustibil
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

      // Culoare
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

      // Număr de uși (4 sau 5 vs 2 sau 3)
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

      markStepDone('step-specs', 'Caroserie, Combustibil, Culoare, Uși');

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 4: Parametri Text, Chip-uri & Preț
      // ══════════════════════════════════════════════════════════════════
      updateStatus('Setare preț, monedă și specificații...');

      const priceInput = document.querySelector('input[data-testid="price-input"]') || 
        document.querySelector('input[name="price"]') || 
        document.querySelector('#price') || 
        document.querySelector('input[data-cy="price-input"]');

      if (priceInput && car.price) {
        setReactInputValue(priceInput, String(car.price));
      }

      if (car.currency) {
        const priceWrapper = priceInput?.closest('div') || document.querySelector('[data-cy="title-field-wrapper"]');
        let currBtn = priceWrapper?.querySelector('button, [role="button"]') ||
          document.querySelector('[data-cy="currency-select"] button') ||
          document.querySelector('[data-testid="currency-select"]');
        
        // Asigurare strictă: este buton de monedă (conține €, lei, ron sau eur)
        if (currBtn) {
          const btnTxt = (currBtn.textContent || '').trim().toLowerCase();
          const isCurrencyBtn = btnTxt.includes('€') || btnTxt.includes('lei') || btnTxt.includes('ron') || btnTxt.includes('eur');
          if (!isCurrencyBtn) currBtn = null;
        }

        if (currBtn) {
          const btnTxt = (currBtn.textContent || '').trim();
          const targetSymbol = car.currency === '€' ? '€' : 'lei';
          if (!btnTxt.includes(targetSymbol)) {
            clickElement(currBtn);
            await sleep(300);
            const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(
              (o) => o.textContent && o.textContent.trim() === targetSymbol
            );
            if (opt) clickElement(opt);
          }
        }
      }

      if (car.negotiable) {
        const negBox = document.querySelector('#nexus-input') || document.querySelector('input[name*="negotiable"]');
        if (negBox && !negBox.checked) clickElement(negBox);
      }

      const paramInputs = {
        'parameters.year': car.year,
        'parameters.rulaj_pana': car.mileageKm,
        'parameters.enginesize': car.engineCc,
        'parameters.engine_power': car.powerHp,
        'parameters.vin': car.vin
      };

      for (const [key, val] of Object.entries(paramInputs)) {
        if (!val) continue;
        const inp = document.querySelector(`input[data-testid="${key}"]`) || document.querySelector(`input[name="${key}"]`);
        if (inp) setReactInputValue(inp, String(val));
      }

      // 1. Stare: Utilizat (by default)
      selectSegmentedOption(['stare', 'starea'], ['utilizat', 'second hand', 'folosit']);

      // 2. Volan: Partea stanga (by default)
      const isRhd = (car.steeringWheel === 'rhd') || (car.steeringWheel || '').toLowerCase().includes('dreapta');
      selectSegmentedOption(
        ['volan', 'partea volanului', 'poziție volan'],
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

      // 5. Vânzător: Firmă (Companie)
      clickChipUniversal(['[data-cy="private_business_business"]'], ['Firmă', 'Firma', 'Companie']);

      markStepDone('step-chips', 'Cutie, Volan, Înmatriculare & Preț');

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 5: Descriere comercială
      // ══════════════════════════════════════════════════════════════════
      updateStatus('Setare descriere certificată...');
      const descEl = document.querySelector('textarea#description') || 
        document.querySelector('textarea[data-testid="description"]') || 
        document.querySelector('textarea[name="description"]') || 
        document.querySelector('textarea');

      if (descEl && car.description) {
        const cleanDesc = sanitizeForOlx(car.description);
        setReactInputValue(descEl, cleanDesc);
      }
      markStepDone('step-desc', 'Descriere comercială injectată');

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 6: Contact & Localitate
      // ══════════════════════════════════════════════════════════════════
      updateStatus('Completare contact & localitate...');
      const personInput = document.querySelector('#person') || document.querySelector('input[name="person"]');
      if (personInput && car.contactPerson) setReactInputValue(personInput, car.contactPerson);

      const phoneInput = document.querySelector('#phone') || document.querySelector('input[name="phone"]');
      if (phoneInput && car.contactPhone) setReactInputValue(phoneInput, car.contactPhone);

      const locInput = document.querySelector('#autosuggest-location-input') || document.querySelector('input[name="location"]');
      if (locInput && car.location) {
        setReactInputValue(locInput, car.location);
        await sleep(900);
        const firstSug = document.querySelector('[role="option"], .autosuggest-item');
        if (firstSug) clickElement(firstSug);
      }

      const autoExtInput = document.querySelector('input#auto-extension');
      if (autoExtInput) {
        if (car.autoExtension && !autoExtInput.checked) {
          autoExtInput.click();
        } else if (!car.autoExtension && autoExtInput.checked) {
          autoExtInput.click();
        }
      }
      markStepDone('step-contact', 'Contact & Localitate setate');

      // ══════════════════════════════════════════════════════════════════
      // ETAPA 7: Fotografii (Upload până la 8 cadre)
      // ══════════════════════════════════════════════════════════════════
      const fileInput = document.querySelector('input[data-cy="attach-photos-input"]') || 
        document.querySelector('input[type="file"]') ||
        document.querySelector('input[accept*="image"]');
      const photosToUpload = (car.photos || []).slice(0, 8);

      if (fileInput && photosToUpload.length > 0) {
        updateStatus(`Descărcare fotografii (0/${photosToUpload.length})...`);
        try {
          const dt = new DataTransfer();
          for (let i = 0; i < photosToUpload.length; i++) {
            let photoUrl = photosToUpload[i];
            if (photoUrl.startsWith('/') && car.origin) {
              photoUrl = `${car.origin}${photoUrl}`;
            }
            updateStatus(`Descărcare & atașare foto (${i + 1}/${photosToUpload.length})...`);
            try {
              let blob = null;

              // 1. DataURL direct
              if (photoUrl.startsWith('data:')) {
                const resp = await fetch(photoUrl);
                blob = await resp.blob();
              } 
              // 2. Fetch direct cu fallback
              else {
                try {
                  const resp = await fetch(photoUrl, { mode: 'cors' });
                  if (resp.ok) blob = await resp.blob();
                } catch (netErr) {
                  console.warn('[ParcOS OLX] Direct fetch eșuat (posibil CORS), apelăm background service worker...', netErr);
                }

                // 3. Fallback la service worker-ul extensiei
                if (!blob && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                  const bgResp = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ action: 'FETCH_IMAGE_AS_BASE64', url: photoUrl }, (r) => resolve(r));
                  });
                  if (bgResp && bgResp.success && bgResp.dataUrl) {
                    const resp = await fetch(bgResp.dataUrl);
                    blob = await resp.blob();
                  }
                }
              }

              if (blob) {
                const mimeType = blob.type || (photoUrl.endsWith('.png') ? 'image/png' : 'image/webp');
                const ext = mimeType.includes('png') ? '.png' : (mimeType.includes('jpeg') ? '.jpg' : '.webp');
                const file = new File([blob], `parcos_olx_foto_${i + 1}${ext}`, { type: mimeType });
                dt.items.add(file);
                console.log(`[ParcOS OLX] Poză ${i + 1} adăugată în DataTransfer (${blob.size} bytes).`);
              }
            } catch (fetchErr) {
              console.warn('[ParcOS OLX] Eroare la descărcare poză:', photoUrl, fetchErr);
            }
          }

          if (dt.files.length > 0) {
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('input', { bubbles: true }));
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Suplimentar: simulăm și evenimentul de Drop pe containerul de upload
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
            console.log(`[ParcOS OLX] S-au injectat ${dt.files.length} fișiere în formularul OLX.`);
          }
        } catch (err) {
          console.error('[ParcOS OLX] Eroare la atașarea fișierelor foto', err);
        }
      }
      markStepDone('step-photos', `${photosToUpload.length} fotografii procesate`);

      // FINALIZARE
      hasCompletedOnce = true;
      updateStatus('Completat cu succes! Gata de publicare.', true);

      const progressEl = document.getElementById('parcos-dock-progress');
      if (progressEl) {
        progressEl.innerHTML += `
          <div style="margin-top:8px;padding:8px;border-radius:8px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac;font-size:11px;font-weight:600;">
            🎉 Toate datele mașinii au fost injectate! Aruncă o privire peste câmpuri și apasă butonul galben <strong>[Publică-mi anunțul]</strong> din josul paginii.
          </div>
        `;
      }

    } catch (err) {
      console.error('[ParcOS OLX] Eroare în secvența de completare:', err);
      updateStatus(`Eroare: ${err.message || 'Verifică consola'}`);
    } finally {
      isRunning = false;
      // Menținem watchdog-ul încă 6 secunde pentru a prinde orice răspuns API asincron întârziat de la OLX
      setTimeout(() => {
        clearInterval(modalJanitor);
      }, 6000);
    }
  }

  if (car) {
    runAutofillSequence();
  }

  const observer = new MutationObserver(() => {
    if (car && !isRunning && !hasCompletedOnce && hasFullFormRendered()) {
      const priceInput = document.querySelector('input[data-testid="price-input"]') || document.querySelector('input[name="price"]');
      if (priceInput && !priceInput.value) {
        console.log('[ParcOS OLX] Formularul extins a apărut prin mutație DOM, reluăm completarea...');
        runAutofillSequence();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
