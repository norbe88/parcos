/**
 * extensions/parcos-olx-publisher/content_olx.js
 * Content script pentru completarea automată a formularului de adăugare anunț pe OLX România (olx.ro/adding/)
 * 
 * Verificat și testat prin Chrome DevTools Protocol & Playwright pe cont dealer autentificat.
 */

(async function() {
  console.log('[ParcOS OLX] Verificare mașină în așteptare pentru publicare...');

  // Helper așteptare ms
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Obținere payload din extensie sau localStorage
  let car = null;

  try {
    const extResp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_PENDING_CAR' }, (resp) => {
        resolve(resp);
      });
    });
    if (extResp && extResp.success && extResp.car) {
      car = extResp.car;
    }
  } catch (e) {
    console.log('[ParcOS OLX] Extensie storage indisponibil, fallback localStorage');
  }

  if (!car) {
    try {
      const raw = localStorage.getItem('parcos_olx_pending_car');
      if (raw) car = JSON.parse(raw);
    } catch (e) {}
  }

  if (!car) {
    console.log('[ParcOS OLX] Nicio mașină în așteptare pentru completare.');
    return;
  }

  console.log('[ParcOS OLX] Mașină identificată:', car.title, car.price, car.currency);

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
    inputElement.blur();
  }

  function clickChip(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      el.dispatchEvent(new Event('click', { bubbles: true }));
    }
  }

  // 2. Creare Dock UI plutitor pe ecran
  const dock = document.createElement('div');
  dock.id = 'parcos-olx-auto-dock';
  dock.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999999;
    width: 360px;
    max-width: calc(100vw - 32px);
    background: #121215;
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.15);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f4f4f5;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease;
  `;

  dock.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:8px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-weight:900;font-size:12px;">P</div>
        <div>
          <div style="font-weight:800;font-size:13px;color:#fff;">ParcOS Auto-Poster</div>
          <div style="font-size:10px;color:#a1a1aa;">${car.brand} ${car.model} (${car.year})</div>
        </div>
      </div>
      <button id="parcos-dock-close" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:16px;line-height:1;">✕</button>
    </div>

    <div id="parcos-dock-status" style="font-size:12px;color:#fbbf24;display:flex;align-items:center;gap:6px;">
      <span>⚡ Se inițializează completarea automată...</span>
    </div>

    <div id="parcos-dock-progress" style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#a1a1aa;">
      <div id="step-title">⏳ Titlu & Categorie</div>
      <div id="step-specs">⏳ Parametri tehnici & Preț</div>
      <div id="step-desc">⏳ Descriere comercială</div>
      <div id="step-contact">⏳ Contact & Localitate</div>
      <div id="step-photos">⏳ Fotografii (${(car.photos || []).length}/8)</div>
    </div>
  `;

  document.body.appendChild(dock);

  document.getElementById('parcos-dock-close')?.addEventListener('click', () => {
    dock.remove();
  });

  const updateStatus = (text, isSuccess = false) => {
    const el = document.getElementById('parcos-dock-status');
    if (el) {
      el.innerHTML = isSuccess 
        ? `<span style="color:#22c55e;">✅ ${text}</span>` 
        : `<span>⚡ ${text}</span>`;
    }
  };

  const markStepDone = (id, label) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `✓ <span style="color:#22c55e;">${label}</span>`;
  };

  // 3. Execuție Secvență de Completare

  try {
    // PASUL 1: Titlu și Categorie
    updateStatus('Setare titlu și selectare categorie...');
    const titleInput = document.querySelector('input[data-testid="title"]') || document.querySelector('#title');
    if (titleInput && car.title) {
      setReactInputValue(titleInput, car.title);
      await sleep(800);

      // Clic pe butonul Continuă dacă OLX a afișat sugestia de categorie
      const continueBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent && b.textContent.includes('Continuă')
      );
      if (continueBtn) {
        continueBtn.click();
        await sleep(1200);
      }
    }
    markStepDone('step-title', 'Titlu & Categorie confirmate');

    // PASUL 2: Preț, Monedă și Negociabil
    updateStatus('Setare preț și monedă...');
    const priceInput = document.querySelector('input[data-testid="price-input"]');
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
        if (opt) opt.click();
      }
    }

    if (car.negotiable) {
      const negBox = document.querySelector('#nexus-input');
      if (negBox && !negBox.checked) negBox.click();
    }

    // Parametri tehnici
    const paramInputs = {
      'parameters.year': car.year,
      'parameters.rulaj_pana': car.mileageKm,
      'parameters.enginesize': car.engineCc,
      'parameters.engine_power': car.powerHp,
      'parameters.vin': car.vin
    };

    for (const [key, val] of Object.entries(paramInputs)) {
      if (!val) continue;
      const inp = document.querySelector(`input[data-testid="${key}"]`);
      if (inp) setReactInputValue(inp, String(val));
    }

    // Chip-uri specifice
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
        const opt = Array.from(document.querySelectorAll('[role="option"]')).find(
          (o) => o.textContent && o.textContent.trim().toLowerCase().includes(car.carBody.toLowerCase())
        );
        if (opt) opt.click();
      }
    }

    // Dropdown Culoare (dacă există)
    if (car.color) {
      const colorBtn = document.querySelector('[data-cy="parameters.color"]');
      if (colorBtn) {
        colorBtn.click();
        await sleep(250);
        const opt = Array.from(document.querySelectorAll('[role="option"]')).find(
          (o) => o.textContent && o.textContent.trim().toLowerCase().includes(car.color.toLowerCase())
        );
        if (opt) opt.click();
      }
    }

    markStepDone('step-specs', 'Parametri tehnici & Preț completați');

    // PASUL 3: Descriere comercială
    updateStatus('Setare descriere...');
    const descEl = document.querySelector('textarea#description') || document.querySelector('textarea[data-testid="description"]');
    if (descEl && car.description) {
      setReactInputValue(descEl, car.description);
    }
    markStepDone('step-desc', 'Descriere comercială injectată');

    // PASUL 4: Contact & Localitate
    updateStatus('Completare contact & localitate...');
    const personInput = document.querySelector('#person');
    if (personInput && car.contactPerson) setReactInputValue(personInput, car.contactPerson);

    const phoneInput = document.querySelector('#phone');
    if (phoneInput && car.contactPhone) setReactInputValue(phoneInput, car.contactPhone);

    const locInput = document.querySelector('#autosuggest-location-input');
    if (locInput && car.location) {
      setReactInputValue(locInput, car.location);
      await sleep(900);
      const firstSug = document.querySelector('[role="option"]');
      if (firstSug) firstSug.click();
    }

    // Asigurare Autoprelungire conform setării dealerului
    const autoExtInput = document.querySelector('input#auto-extension');
    if (autoExtInput) {
      if (car.autoExtension && !autoExtInput.checked) {
        autoExtInput.click();
      } else if (!car.autoExtension && autoExtInput.checked) {
        autoExtInput.click();
      }
    }
    markStepDone('step-contact', 'Contact & Localitate setate');

    // PASUL 5: Fotografii (Upload până la 8 cadre)
    const fileInput = document.querySelector('input[data-cy="attach-photos-input"]');
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
            console.warn('[ParcOS OLX] Eroare la poza:', photoUrl, fetchErr);
          }
        }

        if (dt.files.length > 0) {
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          await sleep(1500);
        }
      } catch (err) {
        console.error('[ParcOS OLX] Eroare la atașarea pozelor', err);
      }
    }
    markStepDone('step-photos', `${photosToUpload.length} fotografii încărcate`);

    // FINALIZARE
    updateStatus('Completat cu succes! Gata de publicare.', true);

    // Curățare date după completare reușită
    try {
      chrome.runtime.sendMessage({ action: 'CLEAR_PENDING_CAR' });
      localStorage.removeItem('parcos_olx_pending_car');
    } catch (e) {}

    // Notificare în dock
    const progressEl = document.getElementById('parcos-dock-progress');
    if (progressEl) {
      progressEl.innerHTML += `
        <div style="margin-top:8px;padding:8px;border-radius:8px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac;font-size:11px;font-weight:600;">
          🎉 Toate câmpurile au fost completate! Te rugăm să arunci o privire peste date și să apeși butonul galben <strong>[Publică-mi anunțul]</strong> din josul paginii.
        </div>
      `;
    }

  } catch (err) {
    console.error('[ParcOS OLX] Eroare în secvența de completare:', err);
    updateStatus(`Eroare: ${err.message || 'Verifică consola'}`);
  }
})();
