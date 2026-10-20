#!/usr/bin/env node
/**
 * ============================================================================
 * 🏢 CARVANA SRL — DEALER OS INSTANCE & SHOWCASE WIZARD (ADMIN INTERNAL)
 * ============================================================================
 * Instrument intern de inginerie & pitching demonstrativ pe ZBook (Zeti).
 * Cuplat direct cu API-ul oficial ANAF v9 (autocompletare CUI instant) și
 * selector de teme (Obsidian Gold, Clean White, Midnight Blue, Carbon Red, Emerald).
 * 
 * Restricționat: Utilizabil exclusiv de către Norbert / Mao (Holding Architect).
 * 
 * Comenzi rapide:
 *   node scripts/create_dealer_instance.cjs --list
 *   node scripts/create_dealer_instance.cjs --pitch=mpi_auto
 *   node scripts/create_dealer_instance.cjs --mode=showcase
 *   node scripts/create_dealer_instance.cjs --cui=RO43460100 --theme=clean_white
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEALER_FILE = path.join(ROOT_DIR, 'src', 'db', 'dealer.ts');

// Culori ANSI consolă
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  amber: '\x1b[38;2;245;158;11m',
  emerald: '\x1b[38;2;16;185;129m',
  cyan: '\x1b[38;2;6;182;212m',
  purple: '\x1b[38;2;168;85;247m',
  rose: '\x1b[38;2;244;63;94m',
  blue: '\x1b[38;2;59;130;246m',
  white: '\x1b[38;2;255;255;255m'
};

const THEMES = [
  { id: 'obsidian_gold', label: 'Obsidian Amber / Gold (Stil RXM Classic — Dark Luxury)', color: C.amber },
  { id: 'clean_white', label: 'Clean White Luxury / Nordic (Stil Polestar / Porsche Studio — Pearl Minimalist)', color: C.white },
  { id: 'midnight_blue', label: 'Midnight Sapphire / Blue (Stil BMW / Mercedes — Corporate Tech)', color: C.blue },
  { id: 'carbon_red', label: 'Carbon Crimson / Red (Stil Audi S-Line / Cupra — Sport Dinamic)', color: C.rose },
  { id: 'emerald_prestige', label: 'Emerald Prestige / Green (Stil British Racing Green / Alpina — Eco Luxury)', color: C.emerald }
];

function banner() {
  console.clear();
  console.log(`${C.amber}${C.bold}╔════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.amber}${C.bold}║           🏢 CARVANA SRL — DEALER OS INSTANCE & SHOWCASE ENGINE            ║${C.reset}`);
  console.log(`${C.amber}${C.bold}║   Sistem Intern Replicare Showroom Autonom & Scenarii Pitch Live (ZBook)   ║${C.reset}`);
  console.log(`${C.amber}${C.bold}╚════════════════════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}• Data: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} | Nod: Zety (zbook-norby) | Operator: Norbert (Admin)${C.reset}\n`);
}

function promptAsync(rl, query, defaultVal = '') {
  return new Promise((resolve) => {
    const hint = defaultVal ? ` ${C.dim}[${defaultVal}]${C.reset}` : '';
    rl.question(`${C.cyan}?${C.reset} ${query}${hint}: `, (answer) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

function validateRomanianCui(cuiStr) {
  const clean = cuiStr.toUpperCase().replace(/^RO/, '').trim();
  if (!/^\d{2,10}$/.test(clean)) return { valid: false, message: 'CUI-ul trebuie să conțină între 2 și 10 cifre.' };
  
  const testKey = [7, 5, 3, 2, 1, 7, 5, 3, 2];
  const digits = clean.split('').map(Number);
  const checkDigit = digits.pop();
  while (digits.length < 9) digits.unshift(0);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * testKey[i];
  }
  let calcCheck = (sum * 10) % 11;
  if (calcCheck === 10) calcCheck = 0;

  return {
    valid: calcCheck === checkDigit,
    formatted: `RO${clean}`,
    cleanNumber: parseInt(clean, 10)
  };
}

/**
 * Interogare oficială serviciu web ANAF v9 (PlatitorTvaRest)
 */
async function fetchAnafCompany(cuiRaw) {
  const cleanCui = parseInt(cuiRaw.toString().replace(/\D/g, ''), 10);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: cleanCui, data: today }])
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!data.found || data.found.length === 0) {
      return { success: false, error: 'CUI negăsit în baza de date ANAF.' };
    }

    const c = data.found[0];
    const gen = c.date_generale || {};
    const tva = c.inregistrare_scop_Tva || {};
    const inactiv = c.stare_inactiv || {};

    return {
      success: true,
      cui: `RO${cleanCui}`,
      rawCui: cleanCui,
      name: gen.denumire || '',
      regCom: gen.nrRegCom || '',
      legalAddress: gen.adresa || '',
      phone: gen.telefon || '',
      postalCode: gen.codPostal || '',
      isVatPayer: Boolean(tva.scpTVA),
      isInactive: Boolean(inactiv.statusInactivi),
      statusRoFactura: Boolean(gen.statusRO_e_Factura)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeRoPhone(phoneStr) {
  const cleaned = phoneStr.replace(/\D/g, '');
  let whatsapp = cleaned;
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    whatsapp = '40' + cleaned.slice(1);
  } else if (cleaned.startsWith('40') && cleaned.length === 11) {
    whatsapp = cleaned;
  }
  return {
    display: phoneStr.trim(),
    whatsapp
  };
}

function printDealersList() {
  banner();
  console.log(`${C.bold}📋 PARCURI AUTO ÎNREGISTRATE ÎN ECOSISTEM:${C.reset}\n`);

  const dealers = [
    {
      id: 'rxm',
      name: 'RXM AUTO MOBILE S.R.L.',
      status: '🟢 CLIENT ACTIV (Partener Fondator #1)',
      location: 'Colonia Hodaie, Cluj-Napoca',
      cui: 'RO48482214',
      phone: '0748 892 937',
      theme: '🌟 Obsidian Amber / Gold (Dark Luxury)',
      url: 'http://localhost:3000/?dealer=rxm'
    },
    {
      id: 'mpi_auto',
      name: 'MPI AUTO CLA S.R.L.',
      status: '🟣 SHOWCASE DEMO (Target Pitch Cluj)',
      location: 'Centura Apahida, jud. Cluj',
      cui: 'RO43460100',
      phone: '0759 757 858',
      theme: '⚪ Clean White Luxury / Nordic (Pearl Minimalist)',
      url: 'http://localhost:3000/?dealer=mpi_auto'
    },
    {
      id: 'top_auto',
      name: 'TOP AUTO TRANSILVANIA S.R.L.',
      status: '🟡 SHOWCASE DEMO',
      location: 'B-dul Muncii nr. 18, Cluj-Napoca',
      cui: 'RO41920199',
      phone: '0740 987 654',
      theme: '💎 Midnight Sapphire / Blue (Corporate Tech)',
      url: 'http://localhost:3000/?dealer=top_auto'
    }
  ];

  dealers.forEach((d, idx) => {
    console.log(`${C.bold}${idx + 1}. ${d.name}${C.reset}  ${C.dim}[ID: ${d.id}]${C.reset}`);
    console.log(`   Stare:     ${d.status}`);
    console.log(`   Locație:   ${d.location}`);
    console.log(`   CUI:       ${d.cui} | Tel: ${d.phone}`);
    console.log(`   Temă:      ${d.theme}`);
    console.log(`   ${C.amber}Showcase:${C.reset}  ${C.cyan}${d.url}${C.reset}`);
    console.log('');
  });

  console.log(`${C.dim}Tip: Deschide oricare din link-urile de mai sus pe ZBook pentru previzualizare live.${C.reset}\n`);
}

function printMpiPitchBrief() {
  banner();
  console.log(`${C.bold}${C.purple}🎯 DOSAR STRATEGIC DE PITCH & OFERTĂ: MPI AUTO S.R.L. (CLUJ)${C.reset}\n`);

  console.log(`${C.bold}1. DATE IDENTIFICARE & FISCALITATE VERIFICATE ANAF:${C.reset}`);
  console.log(`   • Firmă Legală: ${C.bold}MPI AUTO CLA S.R.L.${C.reset}`);
  console.log(`   • Cod Fiscal:   ${C.emerald}RO43460100${C.reset} (RegCom: J12/4202/2020)`);
  console.log(`   • Sediu Social: Str. Scorțarilor nr. 5, Cluj-Napoca`);
  console.log(`   • Showroom:     ${C.emerald}Centura Apahida, jud. Cluj${C.reset} (lângă sensul giratoriu)`);
  console.log(`   • Statut TVA:   Plătitor TVA activ (Art. 312 / TVA 21%)`);
  console.log(`   • Telefoane:    0759 757 858 (Vânzări) / 0749 691 302 (Finanțare & Rate)`);
  console.log(`   • Temă Vizuală: ${C.white}${C.bold}Clean White Luxury / Nordic Look${C.reset}\n`);

  console.log(`${C.bold}2. CELE 3 MARI DURERI PE CARE LE ATINGI ÎN PRIME_LE 3 MINUTE:${C.reset}`);
  console.log(`   ① ${C.rose}Costurile uriașe pe Autovit/OLX:${C.reset} La 40 de mașini, plătesc 500€–900€/lună pe anunțuri fără să aibă propriul brand independent.`);
  console.log(`   ② ${C.rose}Apeluri pentru mașini deja date:${C.reset} Când vând o mașină sâmbătă pe centură, uită să o dezactiveze de pe Autovit/OLX și sună clienți luni dimineață.`);
  console.log(`   ③ ${C.rose}Hârtii la vânzare & garanție de mână:${C.reset} Pierd 30-40 minute la fiecare cumpărător să scrie contractul, proforma și certificatul de garanție de 12 luni.\n`);

  console.log(`${C.bold}3. DEMO PE ZBOOK (ORDINEA EXACTĂ A BUTOANELOR):${C.reset}`);
  console.log(`   1. Deschizi direct: ${C.cyan}http://localhost:3000/?dealer=mpi_auto${C.reset}`);
  console.log(`      ➔ Văd sigla MPI AUTO, adresa de pe Centura Apahida și telefoanele lor reale.`);
  console.log(`   2. Intri în ${C.amber}Portal Admin${C.reset} ➔ Secțiunea ${C.bold}Centru Acte Vânzare (1-Click OCR)${C.reset}:`);
  console.log(`      ➔ Faci o poză la un buletin sau încarci unul de test ➔ În 2 secunde iese Proforma și Certificatul de Garanție pe MPI AUTO.`);
  console.log(`   3. Deschizi ${C.bold}Fișe Parbriz A4 (QR Code)${C.reset}:`);
  console.log(`      ➔ Le arăți cum duminica, dacă parcul de pe centură e închis, clienții scanează parbrizul și văd galeria cu 25 poze HD.`);
  console.log(`   4. Arăți ${C.bold}Tab-ul S9 OLX Reconciler${C.reset}:`);
  console.log(`      ➔ Cum nodul mobil verifică automat anunțurile active vs stocul fizic.\n`);

  console.log(`${C.bold}4. STRUCTURA OFERTEI COMERCIALE PROPUSĂ:${C.reset}`);
  console.log(`   • ${C.bold}Setup & Design Showroom Clean White Luxury:${C.reset} ${C.emerald}0 € GRATUIT${C.reset} (Inclus în campania de parteneriat Cluj)`);
  console.log(`   • ${C.bold}Abonament Mentenanță, Găzduire & S9 Sync:${C.reset} ${C.amber}49 € + 21% TVA / lună${C.reset} (sau 39 € la plată anuală)`);
  console.log(`\n${C.dim}Dosar complet salvat în: docs/OFERTA_COMERCIALA_MPI_AUTO.md${C.reset}\n`);
}

async function interactiveShowcaseWizard() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  banner();
  console.log(`${C.bold}🛠️ ASISTENT AGENTIC ONBOARDING & SHOWCASE (ANAF AUTO-FILL)${C.reset}`);
  console.log(`${C.dim}Introduceți CUI-ul firmei pentru a prelua automat datele din registrul oficial ANAF.${C.reset}\n`);

  try {
    const rawCui = await promptAsync(rl, 'CUI / Cod Fiscal (ex: RO43460100 sau 48482214)');
    if (!rawCui) throw new Error('CUI-ul este obligatoriu.');

    console.log(`${C.dim}⏳ Interogare serviciu web ANAF v9...${C.reset}`);
    const anafData = await fetchAnafCompany(rawCui);

    let defaultName = '';
    let defaultRegCom = 'J12/1234/2024';
    let defaultLegalAddress = '';
    let defaultPhone = '';

    if (anafData && anafData.success) {
      console.log(`${C.emerald}${C.bold}✓ Date preluate cu succes de la ANAF:${C.reset}`);
      console.log(`  • Denumire:   ${C.bold}${anafData.name}${C.reset}`);
      console.log(`  • RegCom:     ${anafData.regCom}`);
      console.log(`  • Sediu:      ${anafData.legalAddress}`);
      console.log(`  • Plătitor TVA: ${anafData.isVatPayer ? 'DA (Cota 21%)' : 'NU (Regim Marjă Art. 312)'}`);
      console.log(`  • Stare:      ${anafData.isInactive ? C.rose + 'INACTIV' : C.emerald + 'ACTIV'}${C.reset}\n`);

      defaultName = anafData.name;
      defaultRegCom = anafData.regCom;
      defaultLegalAddress = anafData.legalAddress;
      defaultPhone = anafData.phone;
    } else {
      console.log(`${C.rose}⚠️ Nu s-au putut prelua automat datele (${anafData ? anafData.error : 'offline'}). Continuați manual.${C.reset}\n`);
    }

    const firmName = await promptAsync(rl, 'Denumire Societate', defaultName);
    const regCom = await promptAsync(rl, 'Număr Registrul Comerțului', defaultRegCom);
    const legalAddress = await promptAsync(rl, 'Adresă Sediu Social', defaultLegalAddress);
    const showroomAddress = await promptAsync(rl, 'Adresă Showroom / Parc Fizic', legalAddress);

    const rawSlugDefault = firmName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
    const slug = await promptAsync(rl, 'Slug URL intern showroom (ex: mpi_auto)', rawSlugDefault);

    const phone = await promptAsync(rl, 'Telefon Vânzări Showroom', defaultPhone || '0740 000 000');
    const phoneFinance = await promptAsync(rl, 'Telefon Finanțare / Rate', phone);
    const email = await promptAsync(rl, 'Email contact', `contact@${slug.replace(/_/g, '')}.ro`);
    const bankName = await promptAsync(rl, 'Bancă Parteneră', 'Banca Transilvania');
    const ibanRon = await promptAsync(rl, 'Cont IBAN RON (Cont de Garanție)', 'RO00 BTRL 0000 0000 0000 0000');

    // Selector Teme Predefinite
    console.log(`\n${C.bold}🎨 Alegeți Tema Vizuală Showroom:${C.reset}`);
    THEMES.forEach((t, i) => {
      console.log(`  [${i + 1}] ${t.color}${C.bold}${t.label}${C.reset}`);
    });
    const themeChoice = await promptAsync(rl, 'Opțiune Temă (1-5)', '2');
    const selectedTheme = THEMES[parseInt(themeChoice, 10) - 1] || THEMES[1]; // default Clean White

    const primaryNorm = normalizeRoPhone(phone);
    const financeNorm = normalizeRoPhone(phoneFinance);
    const cuiFormatted = anafData?.cui || (rawCui.toUpperCase().startsWith('RO') ? rawCui.toUpperCase() : `RO${rawCui}`);

    console.log(`\n${C.emerald}${C.bold}══════════════════════════════════════════════════════════════════${C.reset}`);
    console.log(`${C.bold}PROFIL GATA PENTRU SHOWCASE:${C.reset}`);
    console.log(`• Nume:         ${firmName}`);
    console.log(`• CUI:          ${cuiFormatted} (${regCom})`);
    console.log(`• Showroom:     ${showroomAddress}`);
    console.log(`• Telefoane:    ${primaryNorm.display} / WhatsApp: +${primaryNorm.whatsapp}`);
    console.log(`• Temă:         ${selectedTheme.color}${selectedTheme.label}${C.reset}`);
    console.log(`• Link ZBook:   ${C.cyan}http://localhost:3000/?dealer=${slug}${C.reset}`);
    console.log(`${C.emerald}${C.bold}══════════════════════════════════════════════════════════════════${C.reset}\n`);

    const confirm = await promptAsync(rl, 'Salvați profilul în src/db/dealer.ts? (da/nu)', 'da');
    if (confirm.toLowerCase() === 'da' || confirm.toLowerCase() === 'd' || confirm.toLowerCase() === 'y') {
      let content = fs.readFileSync(DEALER_FILE, 'utf8');

      const newDealerConst = `
export const DEALER_${slug.toUpperCase()}: DealerProfile = {
  name: ${JSON.stringify(firmName)},
  cui: ${JSON.stringify(cuiFormatted)},
  regCom: ${JSON.stringify(regCom)},
  shareCapital: "500 RON",
  legalAddress: ${JSON.stringify(legalAddress)},
  showroomAddress: ${JSON.stringify(showroomAddress)},
  serviceLocation: "jud. Cluj",
  bankName: ${JSON.stringify(bankName)},
  ibanRon: ${JSON.stringify(ibanRon)},
  ibanEur: "RO00 BTRL 0000 0000 0000 0001",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: ${JSON.stringify(primaryNorm.display)},
  phoneSecondary: ${JSON.stringify(financeNorm.display)},
  phoneFinance: ${JSON.stringify(financeNorm.display)},
  whatsappNumber: ${JSON.stringify(primaryNorm.whatsapp)},
  whatsappFinance: ${JSON.stringify(financeNorm.whatsapp)},
  financeContactName: "Consilier Finanțare",
  generalContactName: "Consilier Vânzări",
  email: ${JSON.stringify(email)},
  tiktokHandle: "@${slug}",
  tiktokUrl: "https://www.tiktok.com",
  facebookUrl: "https://www.facebook.com",
  instagramUrl: "https://www.instagram.com",
  address: ${JSON.stringify(showroomAddress)},
  openingHours: "Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00",
  financingPartners: ["Banca Transilvania (BT Direct)", "TBI Bank", "UniCredit Consumer Financing"],
  themePreset: ${JSON.stringify(selectedTheme.id)}
};
`;

      if (content.includes('export const TENANT_DEALERS: Record<string, DealerProfile> = {')) {
        content = content.replace(
          'export const TENANT_DEALERS: Record<string, DealerProfile> = {',
          `${newDealerConst}\nexport const TENANT_DEALERS: Record<string, DealerProfile> = {\n  ${slug}: DEALER_${slug.toUpperCase()},`
        );
        fs.writeFileSync(DEALER_FILE, content, 'utf8');
        console.log(`${C.emerald}✓ Fișierul src/db/dealer.ts a fost actualizat cu succes!${C.reset}`);
        console.log(`Deschide pe ZBook: ${C.cyan}http://localhost:3000/?dealer=${slug}${C.reset}\n`);
      }
    }
  } catch (err) {
    console.error(`${C.rose}Eroare:${C.reset}`, err.message);
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1];
  const pitchArg = args.find(a => a.startsWith('--pitch='))?.split('=')[1];
  const cuiArg = args.find(a => a.startsWith('--cui='))?.split('=')[1];
  const listArg = args.includes('--list');

  if (listArg) {
    printDealersList();
    return;
  }

  if (pitchArg === 'mpi_auto' || pitchArg === 'mpi' || args.includes('--mpi')) {
    printMpiPitchBrief();
    return;
  }

  if (cuiArg) {
    console.log(`Interogare directă CUI: ${cuiArg}...`);
    const data = await fetchAnafCompany(cuiArg);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (modeArg === 'showcase') {
    await interactiveShowcaseWizard();
    return;
  }

  banner();
  console.log(`${C.bold}Alegeți acțiunea dorită:${C.reset}`);
  console.log(`  ${C.amber}[1]${C.reset} Prezentare & Dosar Pitch pentru ${C.bold}MPI AUTO Cluj (Centura Apahida)${C.reset}`);
  console.log(`  ${C.amber}[2]${C.reset} Asistent Onboarding Dealer Nou cu ${C.emerald}${C.bold}Autocompletare CUI din ANAF v9${C.reset}`);
  console.log(`  ${C.amber}[3]${C.reset} Listează parcurile configurate și link-urile demonstrative`);
  console.log(`  ${C.amber}[4]${C.reset} Ieșire\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const choice = await promptAsync(rl, 'Opțiune (1-4)', '2');
  rl.close();

  if (choice === '1') {
    printMpiPitchBrief();
  } else if (choice === '2') {
    await interactiveShowcaseWizard();
  } else if (choice === '3') {
    printDealersList();
  } else {
    console.log('La revedere!');
  }
}

main().catch(console.error);
