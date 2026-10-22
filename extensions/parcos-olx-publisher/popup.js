document.addEventListener('DOMContentLoaded', () => {
  const carContent = document.getElementById('car-content');
  const btnOpenOlx = document.getElementById('btn-open-olx');
  const btnClear = document.getElementById('btn-clear');

  // Citire date mașină
  chrome.storage.local.get(['pendingCar', 'lastUpdated'], (result) => {
    if (result.pendingCar) {
      const car = result.pendingCar;
      carContent.innerHTML = `
        <div class="car-name">${car.title || `${car.brand} ${car.model}`}</div>
        <div class="car-meta">Preț: <strong>${car.price} ${car.currency}</strong> · ${car.photos?.length || 0} poze</div>
        <div class="car-meta">Localitate: ${car.location} · Contact: ${car.contactPerson}</div>
      `;
    }
  });

  btnOpenOlx.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.olx.ro/adding/' });
    window.close();
  });

  btnClear.addEventListener('click', () => {
    chrome.storage.local.remove(['pendingCar', 'lastUpdated'], () => {
      carContent.innerHTML = `
        <div class="empty-state">Datele au fost curățate.</div>
      `;
    });
  });
});
