/**
 * RXM Automobile / ParcOS — Telemetry & Traffic Analytics Helpers
 * Mapare etichete prietenoase, iconițe, badge-uri și calcule de distribuție (Wave 3)
 */

export interface SourceDisplayConfig {
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  isPhysicalQr?: boolean;
}

export const SOURCE_CONFIGS: Record<string, SourceDisplayConfig> = {
  window_qr: {
    label: 'QR Parbriz Parc Auto (Fizic)',
    shortLabel: 'QR Parbriz',
    description: 'Cumpărători prezenți fizic în showroom care scanează afișul din mașină',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    barColor: 'bg-emerald-500',
    isPhysicalQr: true,
  },
  olx: {
    label: 'OLX România',
    shortLabel: 'OLX',
    description: 'Anunțuri publicate pe platforma OLX Auto',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    barColor: 'bg-blue-500',
  },
  autovit: {
    label: 'Autovit.ro',
    shortLabel: 'Autovit',
    description: 'Trafic venit din portalul Autovit.ro',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/30',
    barColor: 'bg-red-500',
  },
  google_organic: {
    label: 'Google Căutare Organică',
    shortLabel: 'Google SEO',
    description: 'Căutări de mașini și brand showroom pe motorul Google',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    barColor: 'bg-amber-500',
  },
  google: {
    label: 'Google Căutare Organică',
    shortLabel: 'Google',
    description: 'Căutări Google',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    barColor: 'bg-amber-500',
  },
  facebook: {
    label: 'Facebook Ads & Social',
    shortLabel: 'Facebook',
    description: 'Reclame și postări pe pagina oficială Facebook',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    barColor: 'bg-indigo-500',
  },
  instagram: {
    label: 'Instagram Showroom',
    shortLabel: 'Instagram',
    description: 'Trafic din Story, Reels și Bio Instagram',
    badgeBg: 'bg-fuchsia-500/15',
    badgeText: 'text-fuchsia-400',
    badgeBorder: 'border-fuchsia-500/30',
    barColor: 'bg-fuchsia-500',
  },
  tiktok: {
    label: 'TikTok Video Showroom',
    shortLabel: 'TikTok',
    description: 'Vizitatori din clipurile video de prezentare auto TikTok',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    barColor: 'bg-cyan-500',
  },
  direct: {
    label: 'Trafic Direct / Bookmark',
    shortLabel: 'Direct',
    description: 'Clienți fideli sau adrese tastate direct în browser',
    badgeBg: 'bg-zinc-500/15',
    badgeText: 'text-zinc-300',
    badgeBorder: 'border-zinc-500/30',
    barColor: 'bg-zinc-400',
  },
  showroom: {
    label: 'Trafic Direct Showroom',
    shortLabel: 'Showroom',
    description: 'Navigare directă pe site-ul showroom-ului',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    barColor: 'bg-amber-500',
  }
};

/**
 * Returnează configurația de afișare pentru un canal de achiziție
 */
export function getSourceDisplay(rawSource: string = 'direct'): SourceDisplayConfig {
  const clean = String(rawSource || 'direct').trim().toLowerCase();
  
  if (SOURCE_CONFIGS[clean]) {
    return SOURCE_CONFIGS[clean];
  }

  // Căutare parțială inteligentă
  if (clean.includes('qr')) return SOURCE_CONFIGS.window_qr;
  if (clean.includes('olx')) return SOURCE_CONFIGS.olx;
  if (clean.includes('autovit')) return SOURCE_CONFIGS.autovit;
  if (clean.includes('google')) return SOURCE_CONFIGS.google_organic;
  if (clean.includes('facebook') || clean.includes('fb')) return SOURCE_CONFIGS.facebook;
  if (clean.includes('instagram') || clean.includes('ig')) return SOURCE_CONFIGS.instagram;
  if (clean.includes('tiktok')) return SOURCE_CONFIGS.tiktok;

  return {
    label: clean.charAt(0).toUpperCase() + clean.slice(1),
    shortLabel: clean.slice(0, 12),
    description: `Trafic referit prin ${clean}`,
    badgeBg: 'bg-zinc-500/15',
    badgeText: 'text-zinc-300',
    badgeBorder: 'border-zinc-500/30',
    barColor: 'bg-zinc-400',
  };
}

/**
 * Calculează procentele exacte pentru distribuția dispozitivelor
 */
export function calculateDevicePercentages(devices: { mobile?: number; desktop?: number; tablet?: number }): {
  mobilePct: number;
  desktopPct: number;
  tabletPct: number;
  total: number;
  isMobileDominant: boolean;
} {
  const mobile = Math.max(0, devices?.mobile || 0);
  const desktop = Math.max(0, devices?.desktop || 0);
  const tablet = Math.max(0, devices?.tablet || 0);
  const total = mobile + desktop + tablet;

  if (total === 0) {
    return {
      mobilePct: 0,
      desktopPct: 0,
      tabletPct: 0,
      total: 0,
      isMobileDominant: false,
    };
  }

  const mobilePct = Math.round((mobile / total) * 100);
  const tabletPct = Math.round((tablet / total) * 100);
  const desktopPct = Math.max(0, 100 - (mobilePct + tabletPct));

  return {
    mobilePct,
    desktopPct,
    tabletPct,
    total,
    isMobileDominant: mobilePct >= 60,
  };
}

/**
 * Formatează numerele cu separator de mii
 */
export function formatTrafficNumber(num: number = 0): string {
  return Number(num || 0).toLocaleString('ro-RO');
}
