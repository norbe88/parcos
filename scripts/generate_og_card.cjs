const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateOgCard() {
  console.log('🎨 [ParcOS OG Card] Generare banner social 1200x630 pentru Open Graph & WhatsApp...');

  const iconSource = path.resolve(__dirname, '..', 'public', 'brand', 'parcos-app-icon.png');
  const targetPng = path.resolve(__dirname, '..', 'public', 'brand', 'parcos-og-card.png');

  if (!fs.existsSync(iconSource)) {
    throw new Error(`Fișierul sursă ${iconSource} nu există!`);
  }

  // 1. Redimensionare icon la 280x280 cu colțuri rotunjite (squircle)
  const iconSize = 280;
  const cornerRadius = 60;
  const maskSvg = Buffer.from(
    `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${iconSize}" height="${iconSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff"/>
    </svg>`
  );

  const resizedIcon = await sharp(iconSource)
    .resize(iconSize, iconSize, { kernel: sharp.kernel.lanczos3 })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 2. Compoziție SVG grafică pentru fundal, lumini ambientale și tipografie
  const width = 1200;
  const height = 630;

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradients -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07090e" />
          <stop offset="60%" stop-color="#090a0f" />
          <stop offset="100%" stop-color="#0f141f" />
        </linearGradient>

        <radialGradient id="goldGlow" cx="24%" cy="50%" r="45%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.22" />
          <stop offset="50%" stop-color="#d97706" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="blueGlow" cx="85%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.6" />
          <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#d97706" stop-opacity="0.4" />
        </linearGradient>

        <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Background Base -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Ambient Glows -->
      <circle cx="270" cy="315" r="320" fill="url(#goldGlow)" />
      <circle cx="1000" cy="180" r="400" fill="url(#blueGlow)" />

      <!-- Sleek outer border with subtle gold accent -->
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="0" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
      <rect x="0" y="0" width="${width}" height="4" fill="url(#goldBorder)" />

      <!-- Typography & Layout -->
      <!-- Badge pill -->
      <g transform="translate(460, 115)">
        <rect width="320" height="34" rx="17" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.45)" stroke-width="1.2" />
        <circle cx="20" cy="17" r="4.5" fill="#f59e0b" />
        <text x="35" y="22" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" fill="#fbbf24" letter-spacing="1.5">DEALERSHIP OPERATING SYSTEM</text>
      </g>

      <!-- Main Title -->
      <text x="460" y="225" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="78" font-weight="800" fill="#ffffff" letter-spacing="-1.5">
        Parc<tspan fill="#f59e0b">OS</tspan>
      </text>

      <!-- Accent line under title -->
      <rect x="460" y="245" width="460" height="3" rx="1.5" fill="url(#accentLine)" />

      <!-- Tagline -->
      <text x="460" y="295" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="28" font-weight="600" fill="#f1f5f9">
        Program Complet pentru Parcuri Auto
      </text>

      <text x="460" y="335" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
        Showroom Digital Autonom • Scaner CIV/Talon • Gestiune Vânzări
      </text>

      <!-- Feature Badges Row -->
      <g transform="translate(460, 395)">
        <!-- Pill 1 -->
        <g transform="translate(0, 0)">
          <rect width="210" height="42" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
          <text x="16" y="26" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="13.5" font-weight="600" fill="#e2e8f0">✦ Scanare CIV &amp; Talon</text>
        </g>

        <!-- Pill 2 -->
        <g transform="translate(222, 0)">
          <rect width="215" height="42" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
          <text x="16" y="26" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="13.5" font-weight="600" fill="#e2e8f0">✦ Contracte DITL pe loc</text>
        </g>

        <!-- Pill 3 -->
        <g transform="translate(449, 0)">
          <rect width="200" height="42" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
          <text x="16" y="26" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="13.5" font-weight="600" fill="#e2e8f0">✦ Facturare FGO &amp; TVA</text>
        </g>
      </g>

      <!-- Footer Bar -->
      <g transform="translate(80, 560)">
        <text x="0" y="20" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="700" fill="#f59e0b" letter-spacing="0.5">
          parcos.ro
        </text>
        <text x="90" y="20" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="400" fill="#64748b">
          • Sistem de Management &amp; Vânzări Parcuri Auto Rulate
        </text>

        <text x="1040" y="20" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500" fill="#475569" text-anchor="end">
          Holding CARVANA SRL
        </text>
      </g>
    </svg>
  `);

  // 3. Randare compoziție banner 1200x630 cu Sharp
  await sharp(svgOverlay)
    .composite([
      {
        input: resizedIcon,
        left: 110,
        top: 155
      }
    ])
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(targetPng);

  console.log(`✅ [ParcOS OG Card] Banner creat cu succes la: ${targetPng}`);

  // 4. Generare Icon Pătrat 600x600 dedicat pentru WhatsApp, iMessage & Carduri compacte
  const targetSquarePng = path.resolve(__dirname, '..', 'public', 'brand', 'parcos-og-icon.png');
  const targetSquareJpg = path.resolve(__dirname, '..', 'public', 'brand', 'parcos-og-icon.jpg');

  await sharp(iconSource)
    .resize(600, 600, { kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.8, m1: 1.2, m2: 0.5 })
    .png({ quality: 85, compressionLevel: 9, palette: true })
    .toFile(targetSquarePng);

  await sharp(iconSource)
    .resize(600, 600, { kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.8, m1: 1.2, m2: 0.5 })
    .jpeg({ quality: 93, mozjpeg: true })
    .toFile(targetSquareJpg);

  console.log(`✅ [ParcOS OG Icon] Embleme 600x600 create cu succes (PNG & JPG): ${targetSquarePng}`);
}

generateOgCard().catch(err => {
  console.error('❌ Eroare la generarea cardului OG:', err);
  process.exit(1);
});

