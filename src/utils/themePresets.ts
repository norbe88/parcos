import { DealerThemePreset } from '../db/types';

export interface ThemeConfig {
  id: DealerThemePreset;
  label: string;
  description: string;
  accentColor: string;
  accentHoverColor: string;
  accentTextColor: string;
  accentBadgeBg: string;
  accentBorder: string;
  ringClass: string;
  previewBg: string;
  previewCard: string;
  isLightMode?: boolean;
}

export const THEME_PRESETS: Record<DealerThemePreset, ThemeConfig> = {
  obsidian_gold: {
    id: 'obsidian_gold',
    label: 'Obsidian Amber / Gold',
    description: 'Estetică Dark Luxury caldă, tonuri de chihlimbar și bronz satinat (Stil RXM Classic)',
    accentColor: '#f59e0b',
    accentHoverColor: '#d97706',
    accentTextColor: '#fbbf24',
    accentBadgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentBorder: 'border-amber-500/40',
    ringClass: 'ring-amber-500/50',
    previewBg: '#09090b',
    previewCard: '#121215'
  },
  clean_white: {
    id: 'clean_white',
    label: 'Clean White Luxury / Nordic',
    description: 'Stil luminos minimalist, suprafețe albe aerisite, contrast ridicat și accente moderne de azur (Stil Polestar / Porsche Studio)',
    accentColor: '#2563eb',
    accentHoverColor: '#1d4ed8',
    accentTextColor: '#ffffff',
    accentBadgeBg: 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs',
    accentBorder: 'border-blue-500/30',
    ringClass: 'ring-blue-500/40',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    isLightMode: true
  },
  midnight_blue: {
    id: 'midnight_blue',
    label: 'Midnight Sapphire / Blue',
    description: 'Design corporativ de înaltă precizie, albastru safir metalizat (Stil BMW / Mercedes)',
    accentColor: '#3b82f6',
    accentHoverColor: '#2563eb',
    accentTextColor: '#60a5fa',
    accentBadgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    accentBorder: 'border-blue-500/40',
    ringClass: 'ring-blue-500/50',
    previewBg: '#080c14',
    previewCard: '#0f172a'
  },
  carbon_red: {
    id: 'carbon_red',
    label: 'Carbon Crimson / Red',
    description: 'Aspect sportiv, fibră de carbon și roșu dinamic (Stil Audi S-Line / Cupra)',
    accentColor: '#ef4444',
    accentHoverColor: '#dc2626',
    accentTextColor: '#f87171',
    accentBadgeBg: 'bg-red-500/15 text-red-300 border-red-500/30',
    accentBorder: 'border-red-500/40',
    ringClass: 'ring-red-500/50',
    previewBg: '#0c0a09',
    previewCard: '#1c1917'
  },
  emerald_prestige: {
    id: 'emerald_prestige',
    label: 'Emerald Prestige / Green',
    description: 'Lux ecologic, tonuri regale de smarald (Stil British Racing Green / Aston Martin)',
    accentColor: '#10b981',
    accentHoverColor: '#059669',
    accentTextColor: '#34d399',
    accentBadgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentBorder: 'border-emerald-500/40',
    ringClass: 'ring-emerald-500/50',
    previewBg: '#060d0a',
    previewCard: '#062016'
  },
  mpi_signature: {
    id: 'mpi_signature',
    label: 'MPI Signature / Racing Crimson & Slate',
    description: 'Estetică Dark Luxury & Clean White duală, roșu atletic #D83333 și slate #2E3643 (Stil Oficial MPI Auto)',
    accentColor: '#D83333',
    accentHoverColor: '#C02828',
    accentTextColor: '#F04D4D',
    accentBadgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    accentBorder: 'border-[#D83333]/40',
    ringClass: 'ring-[#D83333]/50',
    previewBg: '#0B0F16',
    previewCard: '#131A24',
    isLightMode: false
  }
};

export const getThemeConfig = (preset?: DealerThemePreset, mode?: 'dark' | 'light'): ThemeConfig => {
  const base = (preset && THEME_PRESETS[preset]) ? THEME_PRESETS[preset] : THEME_PRESETS.obsidian_gold;
  if (base.id === 'mpi_signature' && mode === 'light') {
    return {
      ...base,
      accentTextColor: '#C42B2B',
      isLightMode: true,
      previewBg: '#F7F8FA',
      previewCard: '#FFFFFF'
    };
  }
  return base;
};
