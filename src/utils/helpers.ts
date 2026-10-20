// =========================================================================
// RXM AUTO MOBILE — Utilitare & Helperi Video & Finanțare
// Invariantă TVA: 21% (VAT_RATE = 0.21; Net = Gross / 1.21)
// =========================================================================

import { VehicleItem, VehicleExpenseCategory } from '../db/types';
import { resolveMediaUrl } from './mediaVaultDb';

export const VAT_RATE = 0.21;

/**
 * Helper Extragere ID și URL Embed TikTok (Player v1 API)
 */
export function parseTikTokUrl(url?: string): { videoId: string | null; embedUrl: string | null; isTikTok: boolean } {
  if (!url) return { videoId: null, embedUrl: null, isTikTok: false };
  const trimmed = url.trim();
  const isTikTok = trimmed.includes('tiktok.com') || trimmed.includes('vm.tiktok.com') || trimmed.includes('vt.tiktok.com');
  const match = trimmed.match(/\/video\/(\d+)/);
  if (match && match[1]) {
    return {
      videoId: match[1],
      embedUrl: `https://www.tiktok.com/player/v1/${match[1]}?embed_from=oembed&autoplay=1&music_info=1&description=1&volume_control=1`,
      isTikTok: true,
    };
  }
  if (trimmed.includes('/player/v1/')) {
    const hasParams = trimmed.includes('?');
    const finalUrl = hasParams ? `${trimmed}&volume_control=1` : `${trimmed}?volume_control=1`;
    return { videoId: null, embedUrl: finalUrl, isTikTok: true };
  }
  if (trimmed.includes('/embed/v2/')) {
    const v2Match = trimmed.match(/\/embed\/v2\/(\d+)/);
    if (v2Match && v2Match[1]) {
      return {
        videoId: v2Match[1],
        embedUrl: `https://www.tiktok.com/player/v1/${v2Match[1]}?embed_from=oembed&autoplay=1&music_info=1&description=1&volume_control=1`,
        isTikTok: true,
      };
    }
  }
  return { videoId: null, embedUrl: null, isTikTok };
}

/**
 * Verifică dacă un string este un URL valid către un clip video TikTok individual
 * (exclude link-urile către profile/canale de dealer, de ex. https://www.tiktok.com/@rxm.automobile).
 */
export function isTikTokVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Excludem link-uri generice către profile (care conțin /@ fără /video/) sau homepage
  if (trimmed.includes('/@') && !trimmed.includes('/video/')) return false;
  if (/^https?:\/\/(www\.)?tiktok\.com\/?(@[a-zA-Z0-9_.-]+)?\/?$/i.test(trimmed)) return false;

  const parsed = parseTikTokUrl(trimmed);
  return (
    parsed.isTikTok &&
    (!!parsed.videoId || !!parsed.embedUrl || trimmed.includes('/video/') || trimmed.includes('vm.tiktok.com') || trimmed.includes('vt.tiktok.com'))
  );
}


/**
 * Trimite comanda de volum și deblocare audio către TikTok Embed Player v1 prin postMessage API
 * @param iframe - Elementul HTMLIFrameElement
 * @param volumePercent - Nivelul volumului între 0 și 100 (implicit 60)
 * @param unmute - Dacă să deblocheze sunetul (implicit true)
 */
export function sendTikTokPlayerVolume(
  iframe: HTMLIFrameElement | null,
  volumePercent: number = 60,
  unmute: boolean = true
): void {
  if (!iframe || !iframe.contentWindow) return;

  const targetOrigin = '*';
  const clampedVolume = Math.min(100, Math.max(0, volumePercent));

  try {
    // 1. Schimbare nivel volum (0 - 100)
    iframe.contentWindow.postMessage(
      {
        'x-tiktok-player': true,
        type: 'changeVolume',
        value: clampedVolume,
      },
      targetOrigin
    );

    // 2. Activare sunet (unMute)
    if (unmute) {
      iframe.contentWindow.postMessage(
        {
          'x-tiktok-player': true,
          type: 'unMute',
        },
        targetOrigin
      );
    }
  } catch {
    // Evitare crash în medii cu sandbox restrictiv
  }
}

/**
 * Atașează un secvențiator de inițializare a volumului TikTok (la load și cu reîncercări succesive)
 * pentru a garanta recepția comenzii de către scriptul intern TikTok după montare.
 */
export function initializeTikTokVolume(
  iframe: HTMLIFrameElement | null,
  volumePercent: number = 60,
  unmute: boolean = true
): () => void {
  if (!iframe) return () => {};

  // Trimitere imediată
  sendTikTokPlayerVolume(iframe, volumePercent, unmute);

  // Reîncercări periodice eșalonate (playerul TikTok are o scurtă latență internă de bootstrapping)
  const timers = [
    setTimeout(() => sendTikTokPlayerVolume(iframe, volumePercent, unmute), 300),
    setTimeout(() => sendTikTokPlayerVolume(iframe, volumePercent, unmute), 800),
    setTimeout(() => sendTikTokPlayerVolume(iframe, volumePercent, unmute), 1600),
    setTimeout(() => sendTikTokPlayerVolume(iframe, volumePercent, unmute), 2500),
  ];

  // Ascultare evenimente emise de playerul TikTok (când raportează starea, îi reafirmăm comanda de 60%)
  const handleMessage = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data['x-tiktok-player']) {
        sendTikTokPlayerVolume(iframe, volumePercent, unmute);
      }
    } catch {
      // Ignoră mesajele din alte surse
    }
  };

  window.addEventListener('message', handleMessage);

  return () => {
    timers.forEach(clearTimeout);
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Calcul rată lunară credit/leasing auto (dobândă de la 7.9% anual)
 */
export function calculateRate(
  price: number, 
  advPct: number, 
  months: number, 
  annualInterestRatePct: number = 7.9
): number {
  if (!price || price <= 0 || !months || months <= 0) return 0;
  const loan = price * (1 - advPct / 100);
  const annualRate = (annualInterestRatePct > 0 ? annualInterestRatePct : 7.9) / 100;
  const monthlyRate = annualRate / 12;
  const payment = (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return Math.round(payment);
}

/**
 * Returnează codul de referință internă al vehiculului (ex: RXM-7412).
 * Dacă lipsește câmpul stockNumber, generează fallback din ultimele 4 caractere din VIN.
 */
export function getStockNumber(car?: { stockNumber?: string; vin?: string; id?: string }): string {
  if (!car) return 'RXM-AUTO';
  if (car.stockNumber && car.stockNumber.trim()) return car.stockNumber.trim().toUpperCase();
  if (car.vin && car.vin.length >= 4) {
    return `RXM-${car.vin.slice(-4).toUpperCase()}`;
  }
  return 'RXM-AUTO';
}

/**
 * Mascare confidențialitate serie șasiu (VIN Privacy-First).
 * Afișează primele 7 caractere (WMI + VDS), maschează 6 caractere centrale, afișează ultimele 4 caractere (ex: WBA5D31••••••7412).
 */
export function maskVin(vin?: string, isPublic: boolean = false): string {
  if (!vin) return 'N/A';
  if (isPublic) return vin.toUpperCase();
  const clean = vin.trim().toUpperCase();
  if (clean.length < 11) return clean;
  const start = clean.slice(0, 7);
  const end = clean.slice(-4);
  return `${start}••••••${end}`;
}

/**
 * URL WhatsApp pentru solicitare Serie Șasiu (VIN) & Raport Istoric
 */
export function getWhatsAppVinRequestUrl(
  car: { brand: string; model: string; year?: number; priceEur: number; stockNumber?: string; vin?: string },
  whatsappNumber: string
): string {
  const ref = getStockNumber(car);
  const text = `Bună ziua! Sunt interesat de autoturismul ${car.brand} ${car.model} [Ref: ${ref}, An: ${car.year || 'N/A'}, Preț: ${car.priceEur.toLocaleString('ro-RO')} €].\nVă rog să-mi transmiteți seria de șasiu (VIN) și raportul tehnic pentru verificare. Mulțumesc!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * URL WhatsApp pentru cerere detalii / ofertă vehicul cu referință unică
 */
export function getWhatsAppCarInquiryUrl(
  car: { brand: string; model: string; year?: number; priceEur: number; stockNumber?: string; vin?: string },
  whatsappNumber: string
): string {
  const ref = getStockNumber(car);
  const text = `Bună ziua! Sunt interesat de autoturismul: ${car.brand} ${car.model} [Ref: ${ref}, An: ${car.year || 'N/A'}, Preț: ${car.priceEur.toLocaleString('ro-RO')} €]. Mai este disponibil pentru vizionare și test drive (Str. Colonia Hodai F.N., Cluj-Napoca)?`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * URL WhatsApp pentru simulare finanțare / credit / leasing cu referință de stoc
 */
export function getWhatsAppFinanceUrl(
  car: { brand: string; model: string; priceEur: number; stockNumber?: string; vin?: string },
  whatsappNumber: string = '40758042979',
  advancePercent: number,
  periodMonths: number,
  partner: string = 'TBI Bank',
  estimatedRate?: number
): string {
  const ref = getStockNumber(car);
  const advEur = Math.round((car.priceEur * advancePercent) / 100);
  const rateEur = estimatedRate ?? calculateRate(car.priceEur, advancePercent, periodMonths);
  // Mesaj indirect și profesional pentru consultanță finanțare & rate
  const targetPhone = whatsappNumber && whatsappNumber !== '40748892937' ? whatsappNumber : '40758042979';
  const text = `Bună ziua! Doresc o simulare de finanțare prin ${partner} pentru autoturismul: ${car.brand} ${car.model} [Ref: ${ref}, Preț: ${car.priceEur.toLocaleString('ro-RO')} €]:\n- Avans: ${advancePercent}% (${advEur.toLocaleString('ro-RO')} €)\n- Perioadă: ${periodMonths} luni\n- Rată estimativă: ${rateEur} €/lună\nCare sunt actele necesare și pașii de aprobare? Mulțumesc!`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * URL WhatsApp pentru programare test drive cu referință de stoc
 */
export function getWhatsAppTestDriveUrl(
  car: { brand: string; model: string; stockNumber?: string; vin?: string },
  whatsappNumber: string,
  date: string,
  timeSlot: string,
  name: string,
  phone: string
): string {
  const ref = getStockNumber(car);
  const text = `Bună ziua! Doresc o programare pentru test drive cu autoturismul: ${car.brand} ${car.model} [Ref: ${ref}]:\n- Data: ${date}\n- Interval orar: ${timeSlot}\n- Solicitant: ${name}\n- Telefon contact: ${phone}\nVă rog să-mi confirmați disponibilitatea mașinii. Mulțumesc!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * URL WhatsApp pentru solicitare video walkaround cu referință de stoc
 */
export function getWhatsAppVideoUrl(
  car: { brand: string; model: string; year?: number; priceEur: number; stockNumber?: string; vin?: string },
  whatsappNumber: string
): string {
  const ref = getStockNumber(car);
  const text = `Bună ziua! Aș dori o filmare video detaliată (walkaround) pe WhatsApp cu autoturismul: ${car.brand} ${car.model} [Ref: ${ref}, Preț: ${car.priceEur.toLocaleString('ro-RO')} €]. Mulțumesc!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * URL WhatsApp pentru mașină vândută -> cerere model similar la comandă
 */
export function getWhatsAppSoldOrderUrl(
  car: { brand: string; model: string; stockNumber?: string; vin?: string },
  whatsappNumber: string
): string {
  const ref = getStockNumber(car);
  const text = `Bună ziua! Am văzut că s-a vândut autoturismul ${car.brand} ${car.model} [Ref: ${ref}]. Aș dori o ofertă pentru un model similar adus la comandă prin RXM Automobile!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Helper parsare interval orar (ex: "11:00 - 12:30") în format calendaristic (YYYYMMDDTHHmmSS)
 */
export function parseTimeSlotDates(dateStr: string, timeSlotStr: string): { startUtc: string; endUtc: string } {
  const parts = timeSlotStr.split('-').map(s => s.trim());
  const startHourMin = parts[0] || '10:00';
  const endHourMin = parts[1] || '11:00';

  const cleanDate = dateStr.replace(/-/g, '');
  const cleanStart = startHourMin.replace(/:/g, '') + '00';
  const cleanEnd = endHourMin.replace(/:/g, '') + '00';

  return {
    startUtc: `${cleanDate}T${cleanStart}`,
    endUtc: `${cleanDate}T${cleanEnd}`
  };
}

/**
 * Generează link direct Google Calendar (action=TEMPLATE) pentru programare Test Drive
 */
export function getGoogleCalendarTestDriveUrl(
  car: { brand: string; model: string; stockNumber?: string; vin?: string },
  dealer: { name: string; address: string; phonePrimary: string },
  date: string,
  timeSlot: string,
  clientName: string,
  clientPhone: string
): string {
  const ref = getStockNumber(car);
  const { startUtc, endUtc } = parseTimeSlotDates(date, timeSlot);
  const title = `Test Drive RXM: ${car.brand} ${car.model} [Ref: ${ref}]`;
  const location = `${dealer.name}, ${dealer.address}`;
  const details = `Programare Test Drive & Vizionare Showroom\n` +
    `Vehicul: ${car.brand} ${car.model} (Cod Stoc: ${ref})\n` +
    `Locație: ${dealer.address}\n` +
    `Dealer Contact: ${dealer.phonePrimary}\n` +
    `Client: ${clientName || 'Client Showroom'} (${clientPhone || 'N/A'})\n\n` +
    `Vă rugăm să aveți la dumneavoastră permisul de conducere valabil.`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

/**
 * Descarcă direct în browser fișierul iCalendar (.ics) pentru import în Outlook / Apple Calendar / dispozitive mobile
 */
export function downloadTestDriveIcsFile(
  car: { brand: string; model: string; stockNumber?: string; vin?: string },
  dealer: { name: string; address: string; phonePrimary: string },
  date: string,
  timeSlot: string,
  clientName: string,
  clientPhone: string
): void {
  const ref = getStockNumber(car);
  const { startUtc, endUtc } = parseTimeSlotDates(date, timeSlot);
  const summary = `Test Drive RXM: ${car.brand} ${car.model} [Ref: ${ref}]`;
  const location = `${dealer.name}, ${dealer.address}`;
  const description = `Test Drive cu ${car.brand} ${car.model} la showroom-ul RXM AUTO MOBILE Cluj-Napoca.\\nAdresă: ${dealer.address}\\nContact: ${dealer.phonePrimary}\\nClient: ${clientName || 'Client'} (${clientPhone || 'N/A'})`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RXM AUTO MOBILE//Test Drive Booking//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:rxm-td-${Date.now()}@rxmautomobile.ro`,
    `DTSTAMP:${startUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Memento Test Drive RXM peste 1 oră',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `test-drive-rxm-${ref.toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Extrage identificatorul unic OLX (ex: "kCF6U" sau numeric) dintr-un URL de anunț OLX
 */
export function extractOlxId(url?: string): string | null {
  if (!url) return null;
  // Caută modelul IDxxxx.html (format standard OLX RO)
  const idMatch = url.match(/-ID([a-zA-Z0-9]+)\.html/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  // Caută /oferta/... sau cifre la final
  const numMatch = url.match(/\/([0-9]{7,12})(?:\/|\.html|$)/);
  if (numMatch && numMatch[1]) {
    return numMatch[1];
  }
  return null;
}

/**
 * Formatează URL-ul complet al ofertei OLX
 */
export function formatOlxOfferUrl(idOrUrl?: string): string {
  if (!idOrUrl) return 'https://www.olx.ro/auto-masini-moto-ambarcatiuni/autoturisme/';
  if (idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) {
    return idOrUrl;
  }
  return `https://www.olx.ro/d/oferta/-ID${idOrUrl}.html`;
}

/**
 * Calculează discrepanța bidirecțională între stocul intern din showroom și starea pe OLX
 */
export function computeOlxDiscrepancy(
  showroomStatus: 'in_stock' | 'reserved' | 'sold' | 'preparing',
  olxStatus?: 'active' | 'expired' | 'unlinked'
): 'none' | 'sold_but_active_on_olx' | 'in_stock_but_gone_on_olx' {
  if (!olxStatus || olxStatus === 'unlinked') return 'none';

  // Caz Critic 1: Mașina este vândută fizic, dar anunțul OLX este încă activ (generează apeluri inutile)
  if (showroomStatus === 'sold' && olxStatus === 'active') {
    return 'sold_but_active_on_olx';
  }

  // Caz 2: Mașina figurează ca În Stoc, dar anunțul a fost șters / expirat de pe OLX
  if (showroomStatus === 'in_stock' && olxStatus === 'expired') {
    return 'in_stock_but_gone_on_olx';
  }

  return 'none';
}

/**
 * Returnează badge-ul vizual și culorile adaptate pentru starea conexiunii OLX
 */
export function getOlxStatusBadge(
  status?: 'active' | 'expired' | 'unlinked',
  discrepancy?: 'none' | 'sold_but_active_on_olx' | 'in_stock_but_gone_on_olx'
): { label: string; bg: string; text: string; border: string; alert?: string } {
  if (discrepancy === 'sold_but_active_on_olx') {
    return {
      label: 'Vândută, dar Activă pe OLX',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      alert: 'Dezactivează anunțul pe OLX pentru a opri apelurile inutile!'
    };
  }

  if (discrepancy === 'in_stock_but_gone_on_olx') {
    return {
      label: 'Dispărută de pe OLX',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      alert: 'Anunțul nu mai este activ pe OLX. Verifică dacă mașina este vândută.'
    };
  }

  switch (status) {
    case 'active':
      return {
        label: 'OLX Activ',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30'
      };
    case 'expired':
      return {
        label: 'OLX Expirat / Inactiv',
        bg: 'bg-zinc-500/15',
        text: 'text-zinc-400',
        border: 'border-zinc-500/30'
      };
    case 'unlinked':
    default:
      return {
        label: 'Fără Link OLX',
        bg: 'bg-white/5',
        text: 'text-zinc-400',
        border: 'border-white/10'
      };
  }
}

/**
 * Calculează bilanțul financiar complet al unui vehicul:
 * Total Investit = Preț Achiziție + Total Cheltuieli
 * Profit Brut/Net = Preț Vânzare (sau Sold) - Total Investit
 * Marjă % = Profit / Preț Vânzare * 100
 */
export function calculateVehicleFinancials(car?: VehicleItem): {
  purchasePriceEur: number;
  totalExpensesEur: number;
  totalInvestedEur: number;
  effectiveSalePriceEur: number;
  netProfitEur: number;
  profitMarginPct: number;
  isProfitable: boolean;
  expensesCount: number;
} {
  if (!car) {
    return {
      purchasePriceEur: 0,
      totalExpensesEur: 0,
      totalInvestedEur: 0,
      effectiveSalePriceEur: 0,
      netProfitEur: 0,
      profitMarginPct: 0,
      isProfitable: false,
      expensesCount: 0
    };
  }

  // Preț de achiziție fallback: estimat la ~82% din prețul curent dacă nu este setat explicit
  const purchasePrice = car.purchasePriceEur ?? Math.round(car.priceEur * 0.82);
  const expensesList = car.expenses || [];
  const totalExpenses = expensesList.reduce((acc, exp) => acc + (exp.amountEur || 0), 0);
  const totalInvested = purchasePrice + totalExpenses;
  
  // Preț de vânzare: dacă e vândută, prețul efectiv la vânzare, altfel prețul de listă curent
  const salePrice = car.status === 'sold' && car.soldPriceEur ? car.soldPriceEur : car.priceEur;
  const netProfit = salePrice - totalInvested;
  const profitMarginPct = salePrice > 0 ? Number(((netProfit / salePrice) * 100).toFixed(1)) : 0;

  return {
    purchasePriceEur: purchasePrice,
    totalExpensesEur: totalExpenses,
    totalInvestedEur: totalInvested,
    effectiveSalePriceEur: salePrice,
    netProfitEur: netProfit,
    profitMarginPct,
    isProfitable: netProfit >= 0,
    expensesCount: expensesList.length
  };
}

/**
 * Returnează eticheta, culoarea și denumirea categoriei de cheltuială în română
 */
export function getExpenseCategoryLabel(cat: VehicleExpenseCategory): {
  label: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (cat) {
    case 'purchase_transport':
      return { label: 'Transport / Platformă', badgeBg: 'bg-blue-500/15', badgeText: 'text-blue-300' };
    case 'rar_registration':
      return { label: 'RAR / Înmatriculare / CIV', badgeBg: 'bg-purple-500/15', badgeText: 'text-purple-300' };
    case 'mechanical_repairs':
      return { label: 'Reparații Mecanice', badgeBg: 'bg-amber-500/15', badgeText: 'text-amber-300' };
    case 'detailing_cleaning':
      return { label: 'Detailing / Polish / Spălare', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-300' };
    case 'bodywork_paint':
      return { label: 'Tinichigerie / Vopsitorie', badgeBg: 'bg-rose-500/15', badgeText: 'text-rose-300' };
    case 'marketing_ads':
      return { label: 'Promovare OLX / Ads', badgeBg: 'bg-cyan-500/15', badgeText: 'text-cyan-300' };
    case 'parts':
      return { label: 'Piese & Consumabile', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-300' };
    case 'other':
    default:
      return { label: 'Alte Cheltuieli', badgeBg: 'bg-zinc-500/15', badgeText: 'text-zinc-300' };
  }
}

/**
 * Formatează numărul de kilometri în format standard românesc cu punct ca separator de mii:
 * ex: 210000 -> "210.000 km"
 */
export function formatMileage(km?: number): string {
  if (km === undefined || km === null || isNaN(km)) return '0 km';
  return `${Math.round(km).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km`;
}

export type AgingTier = 'fresh' | 'active' | 'slow' | 'frozen';
export type VehicleAgingCategory = 'under_30' | 'mid_31_60' | 'over_60';

export interface VehicleAgingInfo {
  days: number;
  entryDateFormatted: string;
  tier: AgingTier;
  category: VehicleAgingCategory;
  categoryLabel: string;
  badgeBg: string;
  badgeText: string;
  isPulse: boolean;
  riskLevel: 'scăzut' | 'moderat' | 'ridicat';
  isAgingRisk: boolean; // >= 45 zile
}

export function getAgingDays(stockEntryDate?: string, fallbackCarId?: string): number {
  if (stockEntryDate) {
    try {
      const [y, m, d] = stockEntryDate.split('-').map(Number);
      const entryTime = new Date(y, m - 1, d).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((now - entryTime) / (1000 * 60 * 60 * 24)));
    } catch {
      return 14;
    }
  }
  if (fallbackCarId) {
    const hash = fallbackCarId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 68) + 7;
  }
  return 0;
}

export function getAgingTier(days: number): AgingTier {
  if (days <= 14) return 'fresh';
  if (days <= 45) return 'active';
  if (days <= 90) return 'slow';
  return 'frozen';
}

/**
 * Calculează vechimea exactă a unei mașini în parcul RXM Automobile
 * Zile în stoc = Data curentă - stockEntryDate (sau fallback determinist)
 */
export function getVehicleAgingInfo(car: VehicleItem): VehicleAgingInfo {
  let days = 14;
  let entryDate = car.stockEntryDate;

  if (entryDate) {
    try {
      const [y, m, d] = entryDate.split('-').map(Number);
      const entryTime = new Date(y, m - 1, d).getTime();
      const now = Date.now();
      days = Math.max(0, Math.floor((now - entryTime) / (1000 * 60 * 60 * 24)));
    } catch {
      days = 14;
    }
  } else {
    // Fallback determinist realist bazat pe hash-ul id-ului mașinii
    const hash = car.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    days = (hash % 68) + 7;
    const genDate = new Date();
    genDate.setDate(genDate.getDate() - days);
    entryDate = genDate.toISOString().split('T')[0];
  }

  const tier = getAgingTier(days);
  let category: VehicleAgingCategory = 'under_30';
  let categoryLabel = `Intrat Recent • ${days}z`;
  let badgeBg = 'bg-emerald-500/15';
  let badgeText = 'text-emerald-300 border-emerald-500/30';
  let isPulse = false;
  let riskLevel: 'scăzut' | 'moderat' | 'ridicat' = 'scăzut';

  if (tier === 'frozen') {
    category = 'over_60';
    categoryLabel = `Imobilizare Capital • ${days}z`;
    badgeBg = 'bg-rose-500/20';
    badgeText = 'text-rose-300 border-rose-500/40';
    isPulse = true;
    riskLevel = 'ridicat';
  } else if (tier === 'slow') {
    category = 'over_60';
    categoryLabel = `Stoc Lent • ${days}z`;
    badgeBg = 'bg-amber-500/15';
    badgeText = 'text-amber-300 border-amber-500/30';
    isPulse = false;
    riskLevel = 'moderat';
  } else if (tier === 'active') {
    category = 'mid_31_60';
    categoryLabel = `Stoc Activ • ${days}z`;
    badgeBg = 'bg-zinc-500/15';
    badgeText = 'text-zinc-300 border-zinc-500/30';
    isPulse = false;
    riskLevel = 'scăzut';
  }

  // Formatare prietenoasă în română (ex: 28 aug. 2026)
  let entryDateFormatted = entryDate;
  try {
    const [y, m, d] = entryDate.split('-').map(Number);
    entryDateFormatted = new Date(y, m - 1, d).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    // silence
  }

  return {
    days,
    entryDateFormatted,
    tier,
    category,
    categoryLabel,
    badgeBg,
    badgeText,
    isPulse,
    riskLevel,
    isAgingRisk: days >= 45
  };
}

export function getVehicleDaysInStock(car: VehicleItem): number {
  return getVehicleAgingInfo(car).days;
}

/**
 * Normalizează căile de imagini ale vehiculelor din catalog:
 * Asigură căile canonice /cars/ în locul prefixului moștenit /rxm/cars/
 */
export function normalizeCarImageUrl(url?: string): string {
  if (!url) return '';
  const resolved = resolveMediaUrl(url);
  return resolved.replace(/\/rxm\/cars\//g, '/cars/');
}

/**
 * Calculează numărul de zile rămase până la o dată țintă (ex: expirare numere roșii).
 */
export function daysUntil(dateStr?: string): number {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/**
 * Formatează o dată ISO în stilul jurnalului de audit (ex: 14 oct. 2026, 18:30)
 */
export function formatAuditDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return isoString;
  }
}



