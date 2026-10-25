document.addEventListener('DOMContentLoaded', () => {
  const carContent = document.getElementById('car-content');
  const btnOpenOlx = document.getElementById('btn-open-olx');
  const btnClear = document.getElementById('btn-clear');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');

  function renderCar(car) {
    if (!car) {
      carContent.innerHTML = `
        <div class="empty-state">Nicio mașină selectată recent.<br>Mergi în ParcOS și apasă pe [Exportă pe OLX].</div>
      `;
      return;
    }
    carContent.innerHTML = `
      <div class="car-name">${car.title || `${car.brand} ${car.model}`}</div>
      <div class="car-meta">Preț: <strong>${car.price} ${car.currency}</strong> · ${car.photos?.length || 0} poze</div>
      <div class="car-meta">Localitate: ${car.location} · Contact: ${car.contactPerson}</div>
    `;
  }

  // Citire date mașină
  chrome.storage.local.get(['pendingCar', 'lastUpdated'], (result) => {
    if (result.pendingCar) {
      renderCar(result.pendingCar);
    }
  });

  btnOpenOlx.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.olx.ro/adding/' });
    window.close();
  });

  btnPasteClipboard?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      if (parsed && (parsed.title || parsed.brand)) {
        chrome.storage.local.set({ pendingCar: parsed, lastUpdated: Date.now() }, () => {
          renderCar(parsed);
          alert('✓ Mașină încărcată cu succes din clipboard!');
        });
      } else {
        alert('Clipboard-ul nu conține date JSON valide de mașină.');
      }
    } catch (err) {
      const manual = prompt('Lipește datele JSON copiate din ParcOS:');
      if (manual) {
        try {
          const parsed = JSON.parse(manual);
          chrome.storage.local.set({ pendingCar: parsed, lastUpdated: Date.now() }, () => {
            renderCar(parsed);
          });
        } catch (e) {
          alert('Format JSON invalid.');
        }
      }
    }
  });

  btnClear.addEventListener('click', () => {
    chrome.storage.local.remove(['pendingCar', 'lastUpdated'], () => {
      renderCar(null);
    });
  });
});
