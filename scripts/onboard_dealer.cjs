#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🏢 CARVANA SRL / RXM AUTOMOBILE — DEALER PARK ONBOARDING CLI
 * ════════════════════════════════════════════════════════════════════════════════
 * Master CLI automation tool to provision, configure, and onboard new dealer partners.
 * Invariante Strict Verificate:
 *  - TVA Strict 21% (VAT_RATE = 0.21; Net = Gross / 1.21)
 *  - Terminologie: "Cont de Garanție" & "Garanție de Rezervare/Participare" (BT)
 *  - Hosting: Netcup VPS (152.53.158.65)
 *  - Verificare din oficiu: is_verified_dealer = true, is_vip = true
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEALER_CONFIG_PATH = path.join(ROOT_DIR, 'staged_imports', 'dealers_config.json');
const DEALER_TS_PATH = path.join(ROOT_DIR, 'src', 'db', 'dealer.ts');

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
  white: '\x1b[38;2;255;255;255m',
};

const VALID_THEMES = [
  'obsidian_gold',
  'clean_white',
  'midnight_blue',
  'carbon_red',
  'emerald_prestige',
];

function printBanner() {
  console.log(`${C.amber}${C.bold}╔════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.amber}${C.bold}║           🏢 CARVANA SRL — DEALER ONBOARDING & PROVISIONING ENGINE         ║${C.reset}`);
  console.log(`${C.amber}${C.bold}║   Master CLI: Înrolare Showroom, Scaffolding, ANAF & Invariante Hosting    ║${C.reset}`);
  console.log(`${C.amber}${C.bold}╚════════════════════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}• Găzduire Invariantă: Netcup VPS (152.53.158.65) | TVA: 21% Strict | Garanție BT${C.reset}\n`);
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const parts = arg.substring(2).split('=');
      const key = parts[0];
      const val = parts.length > 1 ? parts.slice(1).join('=') : true;
      options[key] = val;
    }
  });

  return options;
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
  if (!cuiStr) return { valid: false, message: 'CUI-ul lipsește.' };
  const clean = cuiStr.toUpperCase().replace(/^RO/, '').trim();
  if (!/^\d{2,10}$/.test(clean)) return { valid: false, message: 'CUI invalid (2-10 cifre).' };

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
    cleanNumber: parseInt(clean, 10),
  };
}

async function fetchAnafCompany(cuiRaw) {
  const cleanCui = parseInt(cuiRaw.toString().replace(/\D/g, ''), 10);
  if (!cleanCui) return { success: false, error: 'CUI invalid' };
  const today = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: cleanCui, data: today }]),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (!data.found || data.found.length === 0) {
      return { success: false, error: 'CUI negăsit în registrul ANAF' };
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
      statusRoFactura: Boolean(gen.statusRO_e_Factura),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeSlug(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

function normalizeRoPhone(phoneStr) {
  const cleaned = String(phoneStr || '').replace(/\D/g, '');
  let whatsapp = cleaned;
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    whatsapp = '40' + cleaned.slice(1);
  } else if (cleaned.startsWith('40') && cleaned.length === 11) {
    whatsapp = cleaned;
  }
  return {
    display: phoneStr ? phoneStr.trim() : '0700 000 000',
    whatsapp: whatsapp || '40700000000',
  };
}

function scaffoldDirectories(slug) {
  const dirs = [
    path.join(ROOT_DIR, 'staged_imports', slug, 'raw_photos'),
    path.join(ROOT_DIR, 'staged_imports', slug, 'ready_for_upload'),
    path.join(ROOT_DIR, 'public', 'images', 'dealers', slug),
  ];

  dirs.forEach((d) => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, '.gitkeep'), '', 'utf8');
    }
  });

  return dirs;
}

function updateDealersConfigFile(dealerEntry) {
  let existing = {};
  if (fs.existsSync(DEALER_CONFIG_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(DEALER_CONFIG_PATH, 'utf8'));
    } catch {
      existing = {};
    }
  }

  existing[dealerEntry.key] = dealerEntry;
  fs.writeFileSync(DEALER_CONFIG_PATH, JSON.stringify(existing, null, 2), 'utf8');
}

function updateFrontendDealerTs(profile) {
  if (!fs.existsSync(DEALER_TS_PATH)) return false;

  let content = fs.readFileSync(DEALER_TS_PATH, 'utf8');
  const constName = `DEALER_${profile.slug.toUpperCase()}`;

  // Dacă există deja definit dealer-ul, nu duplicăm
  if (content.includes(`export const ${constName}: DealerProfile`)) {
    console.log(`${C.dim}• Profilul ${constName} există deja în src/db/dealer.ts (skip adăugare constantă)${C.reset}`);
    return true;
  }

  const newConstBlock = `
export const ${constName}: DealerProfile = {
  name: ${JSON.stringify(profile.name)},
  cui: ${JSON.stringify(profile.vatNumber)},
  regCom: ${JSON.stringify(profile.regCom || 'J12/1000/2024')},
  shareCapital: "500 RON",
  legalAddress: ${JSON.stringify(profile.addressStreet)},
  showroomAddress: ${JSON.stringify(profile.addressStreet)},
  serviceLocation: ${JSON.stringify(profile.city ? `jud. Cluj, loc. ${profile.city}` : 'jud. Cluj')},
  bankName: ${JSON.stringify(profile.config?.bank?.name || 'Banca Transilvania')},
  ibanRon: ${JSON.stringify(profile.ibanRon || 'RO00 BTRL 0000 0000 0000 0000')},
  ibanEur: "RO00 BTRL 0000 0000 0000 0001",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: ${JSON.stringify(profile.phonePrimary)},
  phoneSecondary: ${JSON.stringify(profile.phoneSecondary || profile.phonePrimary)},
  phoneFinance: ${JSON.stringify(profile.phoneSecondary || profile.phonePrimary)},
  whatsappNumber: ${JSON.stringify(profile.whatsappNumber)},
  whatsappFinance: ${JSON.stringify(profile.whatsappNumber)},
  financeContactName: "Consilier Finanțare",
  generalContactName: "Consilier Vânzări",
  email: ${JSON.stringify(profile.email)},
  tiktokHandle: "@${profile.slug}",
  tiktokUrl: "https://www.tiktok.com",
  facebookUrl: "https://www.facebook.com",
  instagramUrl: "https://www.instagram.com",
  address: ${JSON.stringify(profile.addressStreet)},
  openingHours: "Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00",
  financingPartners: ["Banca Transilvania (BT Direct)", "TBI Bank", "UniCredit Consumer Financing"],
  themePreset: ${JSON.stringify(profile.config?.themePreset || 'obsidian_gold')}
};
`;

  if (content.includes('export const TENANT_DEALERS: Record<string, DealerProfile> = {')) {
    content = content.replace(
      'export const TENANT_DEALERS: Record<string, DealerProfile> = {',
      `${newConstBlock}\nexport const TENANT_DEALERS: Record<string, DealerProfile> = {\n  ${profile.slug}: ${constName},`
    );
    fs.writeFileSync(DEALER_TS_PATH, content, 'utf8');
    return true;
  }

  return false;
}

function printDnsInstructions(domain, slug) {
  console.log(`\n${C.bold}🌐 INSTRUCȚIUNI CONFIGURARE DNS & CLOUDFLARE:${C.reset}`);
  console.log(`• Domeniu: ${C.cyan}${domain || `${slug}.ro`}${C.reset}`);
  console.log(`• Găzduire (Netcup VPS Invariant): ${C.emerald}152.53.158.65${C.reset}`);
  console.log(`\n  În panoul Cloudflare DNS, adăugați înregistrările:`);
  console.log(`  ┌───────┬──────────────────────────┬────────────────────────────┬──────────┐`);
  console.log(`  │ Tip   │ Nume                     │ Țintă / Valoare             │ Proxy    │`);
  console.log(`  ├───────┼──────────────────────────┼────────────────────────────┼──────────┤`);
  console.log(`  │ A     │ @                        │ 152.53.158.65              │ Proxied  │`);
  console.log(`  │ CNAME │ www                      │ @                          │ Proxied  │`);
  console.log(`  └───────┴──────────────────────────┴────────────────────────────┴──────────┘`);
  console.log(`\n  Configurare Nginx Nativă pe Netcup VPS (/etc/nginx/sites-available/${slug}.conf):`);
  console.log(`${C.dim}  server {
    listen 80;
    server_name ${domain || `${slug}.ro`} www.${domain || `${slug}.ro`};
    return 301 https://$host$request_uri;
  }
  server {
    listen 443 ssl http2;
    server_name ${domain || `${slug}.ro`} www.${domain || `${slug}.ro`};
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Host $host;
      proxy_set_header X-Dealer-Slug "${slug}";
    }
  }${C.reset}\n`);
}

async function main() {
  printBanner();
  const cli = parseCliArgs();

  let slug = normalizeSlug(cli.slug);
  let name = cli.name || '';
  let domain = cli.domain ? cli.domain.toLowerCase().trim() : '';
  let rawCui = cli.cui || '';
  let theme = cli.theme || 'clean_white';
  let phone = cli.phone || '';
  let phone2 = cli.phone2 || '';
  let email = cli.email || '';
  let city = cli.city || 'Cluj-Napoca';
  let address = cli.address || '';
  let iban = cli.iban || 'RO00 BTRL 0000 0000 0000 0000';
  let discount = parseInt(cli.discount, 10) || 20;
  let isDryRun = Boolean(cli.dryRun || cli['dry-run']);

  // Mod interactiv dacă nu sunt specificați parametri suficienți
  if (!slug || !name || !rawCui) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`${C.bold}Introduceți datele noului parc auto partener:${C.reset}\n`);

    if (!rawCui) {
      rawCui = await promptAsync(rl, 'CUI / Cod Fiscal ANAF (ex: RO43460100)');
    }

    if (rawCui) {
      console.log(`${C.dim}⏳ Interogare automată serviciu web ANAF v9...${C.reset}`);
      const anafRes = await fetchAnafCompany(rawCui);
      if (anafRes && anafRes.success) {
        console.log(`${C.emerald}✓ Date ANAF validate:${C.reset} ${anafRes.name} (${anafRes.cui})`);
        if (!name) name = anafRes.name;
        if (!address) address = anafRes.legalAddress;
        if (!phone && anafRes.phone) phone = anafRes.phone;
      } else {
        console.log(`${C.rose}⚠️ Interogare ANAF indisponibilă: ${anafRes?.error || 'offline'}${C.reset}`);
      }
    }

    if (!name) name = await promptAsync(rl, 'Denumire Societate', 'NOU AUTO S.R.L.');
    if (!slug) {
      const defaultSlug = normalizeSlug(name);
      slug = await promptAsync(rl, 'Slug Showroom (identificator)', defaultSlug);
    }
    if (!domain) {
      domain = await promptAsync(rl, 'Domeniu Web Showroom (ex: numeparc.ro)', `${slug}.ro`);
    }
    if (!phone) {
      phone = await promptAsync(rl, 'Telefon Vânzări Showroom', '0740 000 000');
    }
    if (!email) {
      email = await promptAsync(rl, 'Email contact', `contact@${domain}`);
    }
    if (!address) {
      address = await promptAsync(rl, 'Adresă Showroom', 'Cluj-Napoca, jud. Cluj');
    }

    console.log(`\nTeme disponibile: ${VALID_THEMES.join(', ')}`);
    theme = await promptAsync(rl, 'Temă Showroom', theme);

    rl.close();
  }

  // Validare CUI
  const cuiCheck = validateRomanianCui(rawCui);
  const formattedCui = cuiCheck.valid ? cuiCheck.formatted : (rawCui.toUpperCase().startsWith('RO') ? rawCui.toUpperCase() : `RO${rawCui}`);

  // Normalizare telefoane
  const normPhone = normalizeRoPhone(phone);
  const normPhone2 = normalizeRoPhone(phone2 || phone);

  if (!VALID_THEMES.includes(theme)) {
    console.log(`${C.rose}Temă invalidă: ${theme}. Se folosește 'obsidian_gold'.${C.reset}`);
    theme = 'obsidian_gold';
  }

  const dealerProfile = {
    name,
    slug,
    domain: domain || `${slug}.ro`,
    phonePrimary: normPhone.display,
    phoneSecondary: normPhone2.display,
    whatsappNumber: normPhone.whatsapp,
    email: email || `contact@${domain || `${slug}.ro`}`,
    addressStreet: address || 'Cluj-Napoca, jud. Cluj',
    city,
    county: 'Cluj',
    vatNumber: formattedCui,
    openingHours: 'Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00',
    isActive: true,
    ibanRon: iban,
    config: {
      themePreset: theme,
      vatRate: 0.21, // Invariant strict 21%
      discountPercent: discount,
      partnerTier: 'FOUNDER_VIP',
      isVip: true,
      freeListing: true,
      freeRelist: true,
      autoRelist: true,
      bank: {
        name: 'Banca Transilvania',
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare',
      },
    },
  };

  const dealerConfigEntry = {
    key: slug,
    name,
    sellerEmail: dealerProfile.email,
    companyName: name,
    companyCui: formattedCui,
    partnerTier: 'FOUNDER_VIP',
    isVip: true,
    freeListing: true,
    freeRelist: true,
    autoRelist: true,
    location: `${city}, Cluj`,
    pickupAddress: dealerProfile.addressStreet,
    domain: dealerProfile.domain,
    discountPercent: discount,
    themePreset: theme,
    vatRate: 0.21,
    notes: `Partener B2B înrolat automat prin CLI Onboarding la ${new Date().toISOString()}`,
  };

  console.log(`\n${C.emerald}${C.bold}📋 PROFIL DEALER ÎNROLAT:${C.reset}`);
  console.log(`• Slug:        ${C.bold}${slug}${C.reset}`);
  console.log(`• Nume:        ${name}`);
  console.log(`• CUI:         ${formattedCui}`);
  console.log(`• Domeniu:     ${dealerProfile.domain}`);
  console.log(`• Temă:        ${theme}`);
  console.log(`• TVA Invariant: ${C.emerald}21% Strict (VAT_RATE = 0.21)${C.reset}`);
  console.log(`• Garanție:    ${C.emerald}Cont de Garanție (Banca Transilvania)${C.reset}`);
  console.log(`• Găzduire:    ${C.emerald}Netcup VPS (152.53.158.65)${C.reset}`);
  console.log(`• Discount:    -${discount}%`);

  if (isDryRun) {
    console.log(`\n${C.amber}[DRY-RUN] Nicio modificare nu a fost scrisă pe disc sau în baza de date.${C.reset}`);
    printDnsInstructions(dealerProfile.domain, slug);
    return;
  }

  // 1. Scaffolding directoare stocare
  const createdDirs = scaffoldDirectories(slug);
  console.log(`\n${C.emerald}✓ Directoare create:${C.reset}`);
  createdDirs.forEach((d) => console.log(`  📁 ${path.relative(ROOT_DIR, d)}`));

  // 2. Actualizare staged_imports/dealers_config.json
  updateDealersConfigFile(dealerConfigEntry);
  console.log(`${C.emerald}✓ Registru central actualizat: staged_imports/dealers_config.json${C.reset}`);

  // 3. Actualizare src/db/dealer.ts (Frontend / TS definitions)
  const tsUpdated = updateFrontendDealerTs(dealerProfile);
  if (tsUpdated) {
    console.log(`${C.emerald}✓ Definiții TypeScript actualizate: src/db/dealer.ts${C.reset}`);
  }

  // 4. Salvare în PostgreSQL (dacă serverul API este activ)
  try {
    const apiRes = await fetch('http://127.0.0.1:4050/api/dealers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer admin-local-dev-bypass',
      },
      body: JSON.stringify(dealerProfile),
    });
    if (apiRes.ok) {
      console.log(`${C.emerald}✓ Dealer sincronizat în baza de date PostgreSQL via API /api/dealers${C.reset}`);
    }
  } catch {
    console.log(`${C.dim}• Serverul local API (port 4050) este inactiv; dealerul este salvat în configurarea de fallback.${C.reset}`);
  }

  // 5. Generare instrucțiuni DNS
  printDnsInstructions(dealerProfile.domain, slug);

  console.log(`${C.emerald}${C.bold}🎉 ONBOARDING FINALIZAT CU SUCCES PENTRU ${slug.toUpperCase()}!${C.reset}\n`);
}

main().catch((err) => {
  console.error(`${C.rose}Eroare critică onboarding:${C.reset}`, err.message);
  process.exit(1);
});
