/**
 * extensions/parcos-olx-publisher/content_olx.js
 * Content script pentru completarea automată a formularului de adăugare anunț pe OLX România (olx.ro/adding/)
 * 
 * Arhitectură adaptivă multi-step pentru redesignul OLX România (2026):
 * 1. Preluare resilientă cu retry din background storage sau clipboard
 * 2. Dock UI interactiv permanent cu asistent de completare
 * 3. Detecție dinamică a inputului de titlu pe ecranul inițial "Ce vrei să publici?"
 * 4. Navigare automată prin selecția categoriei "Autoturisme"
 * 5. Așteptare dinamică (polling + MutationObserver) pentru apariția câmpurilor formularului complet
 * 6. Injectare completă a specificațiilor tehnice, descrierii, contactului și a celor 8 fotografii
 */

(async function() {
  console.log('[ParcOS OLX] Extensie activată pe pagina OLX.');

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

  // 1. Obținere payload din extensie cu mecanism de retry (evită race conditions)
  async function fetchPendingCarWithRetry(maxAttempts = 8, delayMs = 300) {
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
      if (i < maxAttempts - 1) await sleep(delayMs);
    }

    // Fallback secundar: localStorage pe domeniul curent (dacă a fost setat)
    try {
      const raw = localStorage.getItem('parcos_olx_pending_car');
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
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
        <div id="step-specs">⏳ 2. Parametri tehnici & Preț</div>
        <div id="step-desc">⏳ 3. Descriere comercială certificată</div>
        <div id="step-contact">⏳ 4. Contact & Localitate dealer</div>
        <div id="step-photos">⏳ 5. Fotografii profesionale (${(car.photos || []).length}/8)</div>
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

  // 3. Helper Căutare Selectori Dinamici

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
    // Fallback extrem: primul input de tip text vizibil pe pagină
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

  function findCategoryChip() {
    // Căutare card sau buton cu "Autoturisme" sau "Auto, moto"
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a, li, span, h6, p'));
    return candidates.find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'autoturisme' || t === 'auto, moto si ambarcatiuni' || (t.includes('autoturisme') && t.length < 35);
    });
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

  // 4. Execuție Secvență de Completare

  let isRunning = false;

  async function runAutofillSequence() {
    if (!car || isRunning) return;
    isRunning = true;

    try {
      // ETAPA 1: Titlu și Categorie
      updateStatus('Setare titlu autoturism...');
      const titleInput = findTitleInput();

      if (titleInput && car.title) {
        console.log('[ParcOS OLX] Câmp de titlu identificat:', titleInput);
        setReactInputValue(titleInput, car.title);
        await sleep(600);

        // Așteptăm activarea butonului Continuă
        const continueBtn = findContinueButton();
        if (continueBtn) {
          console.log('[ParcOS OLX] Buton Continuă identificat:', continueBtn);
          clickElement(continueBtn);
          await sleep(1000);
        }
      }

      // Verificăm dacă OLX afișează sugestia de categorie "Autoturisme"
      for (let i = 0; i < 6; i++) {
        const catChip = findCategoryChip();
        if (catChip) {
          console.log('[ParcOS OLX] Categorie Autoturisme identificată, clic automat:', catChip);
          clickElement(catChip);
          await sleep(800);
          break;
        }
        await sleep(400);
      }

      markStepDone('step-title', 'Titlu & Categorie confirmate');

      // ETAPA 2: Așteptare Formular Complet (Parametri, Preț, Descriere)
      updateStatus('Așteptare încărcare specificații complete...');
      let formReady = false;
      for (let waitIdx = 0; waitIdx < 15; waitIdx++) {
        if (hasFullFormRendered()) {
          formReady = true;
          break;
        }
        await sleep(500);
      }

      if (!formReady) {
        updateStatus('Selectează categoria de pe ecran dacă OLX o solicită.');
        console.log('[ParcOS OLX] Formularul extins încă nu s-a randat, configurăm observator DOM...');
      }

      // ETAPA 3: Preț, Monedă și Negociabil
      updateStatus('Setare preț și monedă...');
      const priceInput = document.querySelector('input[data-testid="price-input"]') || 
        document.querySelector('input[name="price"]') || 
        document.querySelector('#price') || 
        document.querySelector('input[data-cy="price-input"]');

      if (priceInput && car.price) {
        setReactInputValue(priceInput, String(car.price));
      }

      if (car.currency) {
        const currBtn = document.querySelector('[data-cy="title-field-wrapper"] .n-referenceinput-button') ||
          document.querySelector('.n-referenceinput-button');
        if (currBtn) {
          currBtn.click();
          await sleep(350);
          const targetSymbol = car.currency === '€' ? '€' : 'lei';
          const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(
            (o) => o.textContent && o.textContent.trim() === targetSymbol
          );
          if (opt) clickElement(opt);
        }
      }

      if (car.negotiable) {
        const negBox = document.querySelector('#nexus-input') || document.querySelector('input[name*="negotiable"]');
        if (negBox && !negBox.checked) clickElement(negBox);
      }

      // ETAPA 4: Parametri Tehnici (An, Km, Motor, Putere, VIN)
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

      // Chip-uri de opțiuni
      const clickChip = (selector) => {
        const el = document.querySelector(selector);
        if (el) clickElement(el);
      };

      if (car.gearbox === 'automat') {
        clickChip('[data-cy="parameters.gearbox_automatic"]');
      } else {
        clickChip('[data-cy="parameters.gearbox_manual"]');
      }
      clickChip('[data-cy="parameters.state_used"]');
      clickChip('[data-cy="parameters.steering_wheel_lhd"]');
      clickChip('[data-cy="parameters.registration_state_registered"]');
      clickChip('[data-cy="private_business_business"]');

      // Dropdown Caroserie (dacă există)
      if (car.carBody) {
        const bodyBtn = document.querySelector('[data-cy="parameters.car_body"]');
        if (bodyBtn) {
          bodyBtn.click();
          await sleep(250);
          const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(
            (o) => o.textContent && o.textContent.trim().toLowerCase().includes(car.carBody.toLowerCase())
          );
          if (opt) clickElement(opt);
        }
      }

      // Dropdown Culoare (dacă există)
      if (car.color) {
        const colorBtn = document.querySelector('[data-cy="parameters.color"]');
        if (colorBtn) {
          colorBtn.click();
          await sleep(250);
          const opt = Array.from(document.querySelectorAll('[role="option"], li, span')).find(
            (o) => o.textContent && o.textContent.trim().toLowerCase().includes(car.color.toLowerCase())
          );
          if (opt) clickElement(opt);
        }
      }

      markStepDone('step-specs', 'Parametri tehnici & Preț completați');

      // ETAPA 5: Descriere comercială
      updateStatus('Setare descriere certificată...');
      const descEl = document.querySelector('textarea#description') || 
        document.querySelector('textarea[data-testid="description"]') || 
        document.querySelector('textarea[name="description"]') || 
        document.querySelector('textarea');

      if (descEl && car.description) {
        setReactInputValue(descEl, car.description);
      }
      markStepDone('step-desc', 'Descriere comercială injectată');

      // ETAPA 6: Contact & Localitate
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

      // Asigurare Autoprelungire conform opțiunii dealerului
      const autoExtInput = document.querySelector('input#auto-extension');
      if (autoExtInput) {
        if (car.autoExtension && !autoExtInput.checked) {
          autoExtInput.click();
        } else if (!car.autoExtension && autoExtInput.checked) {
          autoExtInput.click();
        }
      }
      markStepDone('step-contact', 'Contact & Localitate setate');

      // ETAPA 7: Fotografii (Upload până la 8 cadre)
      const fileInput = document.querySelector('input[data-cy="attach-photos-input"]') || document.querySelector('input[type="file"]');
      const photosToUpload = (car.photos || []).slice(0, 8);

      if (fileInput && photosToUpload.length > 0) {
        updateStatus(`Descărcare și încărcare cele ${photosToUpload.length} fotografii...`);
        try {
          const dt = new DataTransfer();
          for (let i = 0; i < photosToUpload.length; i++) {
            const photoUrl = photosToUpload[i];
            try {
              const resp = await fetch(photoUrl);
              const blob = await resp.blob();
              const file = new File([blob], `parcos_olx_${i + 1}.webp`, { type: blob.type || 'image/webp' });
              dt.items.add(file);
            } catch (fetchErr) {
              console.warn('[ParcOS OLX] Eroare la descărcare poză:', photoUrl, fetchErr);
            }
          }

          if (dt.files.length > 0) {
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(1500);
          }
        } catch (err) {
          console.error('[ParcOS OLX] Eroare la atașarea fișierelor foto', err);
        }
      }
      markStepDone('step-photos', `${photosToUpload.length} fotografii încărcate`);

      // FINALIZARE
      updateStatus('Completat cu succes! Gata de publicare.', true);

      // Notificare finală în dock
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
    }
  }

  // Pornire automată dacă mașina este disponibilă
  if (car) {
    runAutofillSequence();
  }

  // Observator de mutații: dacă utilizatorul selectează categoria manual, completăm restul
  const observer = new MutationObserver(() => {
    if (car && !isRunning && hasFullFormRendered()) {
      const priceInput = document.querySelector('input[data-testid="price-input"]') || document.querySelector('input[name="price"]');
      if (priceInput && !priceInput.value) {
        console.log('[ParcOS OLX] Formularul extins a apărut prin mutație DOM, reluăm completarea...');
        runAutofillSequence();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
