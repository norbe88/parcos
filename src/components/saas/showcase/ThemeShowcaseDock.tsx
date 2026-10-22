import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Car, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Check, 
  Eye, 
  SlidersHorizontal, 
  Sparkles, 
  Search, 
  ArrowRight,
  GripVertical,
  CheckCircle2,
  Lock,
  Globe,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Film,
  Zap,
  Server
} from 'lucide-react';

export type ThemePresetKey = 'obsidian_gold' | 'mpi_auto' | 'top_auto';

export interface ThemeConfig {
  key: ThemePresetKey;
  name: string;
  tagline: string;
  domain: string;
  badge: string;
  accentColor: string;
  accentSecondary: string;
  surfaceClass: string;
  cardClass: string;
  textClass: string;
  mutedTextClass: string;
  borderClass: string;
  previewVideoMp4?: string;
  previewVideoWebm?: string;
  previewPoster?: string;
  isRealProduction?: boolean;
  videoHighlights?: Array<{ label: string; value: string; desc: string }>;
  previewHeroCar: {
    brand: string;
    model: string;
    year: number;
    priceEur: number;
    vatType: string;
    fuel: string;
    hp: number;
    km: number;
    tag: string;
  };
  sampleStock: Array<{
    brand: string;
    model: string;
    year: number;
    priceEur: number;
    km: number;
    tag: string;
  }>;
}

const THEME_PRESETS: Record<ThemePresetKey, ThemeConfig> = {
  obsidian_gold: {
    key: 'obsidian_gold',
    name: 'RXM Automobile (Obsidian Gold)',
    tagline: 'Dark luxury cu accente aurii — Showroom pilot live creat cu ParcOS',
    domain: 'rxmautomobile.ro',
    badge: 'PRODUCȚIE REALĂ',
    accentColor: '#d4af37',
    accentSecondary: '#f59e0b',
    surfaceClass: 'bg-[#09090b]',
    cardClass: 'bg-[#121215] border-white/10',
    textClass: 'text-zinc-100',
    mutedTextClass: 'text-zinc-400',
    borderClass: 'border-white/10',
    previewVideoMp4: '/videos/rxm-preview.mp4',
    previewVideoWebm: '/videos/rxm-preview.webm',
    previewPoster: '/videos/rxm-poster.webp',
    isRealProduction: true,
    videoHighlights: [
      { label: 'Showroom Live', value: 'rxmautomobile.ro', desc: 'Domeniu propriu client, găzduit pe Netcup VPS dedicat' },
      { label: 'Procesare Foto AI', value: 'YOLOv8 + WebP', desc: 'Estompare automată a numerelor și comprimare -65%' },
      { label: 'Video Lounge', value: 'TikTok Integrat', desc: 'Prezentare video cinematică și walkaround pentru fiecare mașină' },
      { label: 'Garanție & Siguranță', value: 'carVertical + SPV', desc: 'Rapoarte tehnice complete și facturare e-Factura SPV' }
    ],
    previewHeroCar: {
      brand: 'AUDI',
      model: 'RS6 Avant V8 Biturbo',
      year: 2021,
      priceEur: 89900,
      vatType: 'TVA Deductibil inclus',
      fuel: 'Benzină V8',
      hp: 600,
      km: 48500,
      tag: 'Garanție 24 Luni • carVertical OK'
    },
    sampleStock: [
      { brand: 'BMW', model: 'M4 Competition Coupé', year: 2022, priceEur: 74900, km: 32000, tag: 'Garanție 24 Luni' },
      { brand: 'Porsche', model: 'Taycan 4S Cross Turismo', year: 2021, priceEur: 82500, km: 41000, tag: 'TVA Deductibil' },
      { brand: 'Mercedes-Benz', model: 'GLE 400d 4MATIC AMG', year: 2020, priceEur: 61900, km: 69000, tag: 'Stoc Verificat' }
    ]
  },
  mpi_auto: {
    key: 'mpi_auto',
    name: 'MPI Auto Cluj (Clean White)',
    tagline: 'Light modern, curat și transparent pentru parcuri de familie & navetiști',
    domain: 'mpiauto.ro',
    badge: 'LIGHT MODERN',
    accentColor: '#2563eb',
    accentSecondary: '#1d4ed8',
    surfaceClass: 'bg-[#f8fafc]',
    cardClass: 'bg-white border-zinc-200 shadow-sm',
    textClass: 'text-zinc-900',
    mutedTextClass: 'text-zinc-600',
    borderClass: 'border-zinc-200',
    previewHeroCar: {
      brand: 'VOLKSWAGEN',
      model: 'Passat Variant 2.0 TDI Highline',
      year: 2018,
      priceEur: 14850,
      vatType: 'Regim Marjă Art. 312',
      fuel: 'Motorină',
      hp: 150,
      km: 178000,
      tag: 'Garanție 12 Luni • Istoric RAR'
    },
    sampleStock: [
      { brand: 'Skoda', model: 'Octavia Combi 2.0 TDI DSG', year: 2019, priceEur: 13900, km: 165000, tag: 'Garanție 12 Luni' },
      { brand: 'Ford', model: 'Focus Titanium EcoBoost', year: 2018, priceEur: 10500, km: 142000, tag: '0% Avans Rate' },
      { brand: 'Dacia', model: 'Duster 1.5 dCi 4x4 Prestige', year: 2020, priceEur: 15400, km: 92000, tag: 'TVA Deductibil' }
    ]
  },
  top_auto: {
    key: 'top_auto',
    name: 'ALD Autoland (Midnight Blue)',
    tagline: 'Albastru profund metalizat pentru dealeri de flote corporate și importuri',
    domain: 'aldautoland.ro',
    badge: 'CORPORATE FLEET',
    accentColor: '#38bdf8',
    accentSecondary: '#0284c7',
    surfaceClass: 'bg-[#030712]',
    cardClass: 'bg-[#0b1329] border-sky-900/30',
    textClass: 'text-slate-100',
    mutedTextClass: 'text-slate-400',
    borderClass: 'border-sky-900/40',
    previewHeroCar: {
      brand: 'BMW',
      model: '530d xDrive M Sport Touring',
      year: 2021,
      priceEur: 38900,
      vatType: 'TVA Deductibil inclus',
      fuel: 'Diesel Hybrid (48V)',
      hp: 286,
      km: 84000,
      tag: 'Verificare carVertical • Flotă Certificată'
    },
    sampleStock: [
      { brand: 'Audi', model: 'A6 40 TDI S-Tronic Matrix', year: 2020, priceEur: 31900, km: 98000, tag: 'TVA Deductibil' },
      { brand: 'Volvo', model: 'XC60 B4 AWD Inscription', year: 2021, priceEur: 35500, km: 76000, tag: 'Garanție 12 Luni' },
      { brand: 'Mercedes-Benz', model: 'C 220 d Avantgarde', year: 2020, priceEur: 27900, km: 112000, tag: 'Buy-Back Rapid' }
    ]
  }
};

interface ThemeShowcaseDockProps {
  onSwitchToDealer?: (slug: string) => void;
}

export const ThemeShowcaseDock: React.FC<ThemeShowcaseDockProps> = ({
  onSwitchToDealer
}) => {
  const [activeThemeKey, setActiveThemeKey] = useState<ThemePresetKey>('obsidian_gold');
  const [viewMode, setViewMode] = useState<'video' | 'mockup'>('video');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSections, setActiveSections] = useState<string[]>([
    'Hero Spotlight',
    'Catalog Stoc Live',
    'Calculator Rate Finanțare',
    'Evaluare Buy-Back',
    'Recenzii & Încredere'
  ]);

  const currentTheme = THEME_PRESETS[activeThemeKey];

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  return (
    <div className="w-full">
      {/* Header Description */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs text-blue-900 font-bold mb-3">
          <Palette className="w-3.5 h-3.5 text-blue-600" />
          <span>SITE-UL TĂU PROPRIU • FĂRĂ CONCURENȚĂ</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight">
          Aspect personalizat cu sigla și culorile parcului tău
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Spre deosebire de site-urile unde mașinile tale apar lângă cele ale concurenței, cu ParcOS ai 
          <strong> propriul tău site oficial</strong> (ex: <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold">numeparc.ro</code>), 
          cu sigla ta, culorile tale și doar mașinile tale.
        </p>
      </div>

      {/* Theme Switching Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mb-8">
        {(Object.keys(THEME_PRESETS) as ThemePresetKey[]).map((key) => {
          const preset = THEME_PRESETS[key];
          const isSelected = activeThemeKey === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveThemeKey(key);
                if (key === 'obsidian_gold') {
                  setViewMode('video');
                }
              }}
              className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all touch-manipulation flex items-center justify-between group cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/80 shadow-md ring-1 ring-amber-500 scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-slate-300" 
                  style={{ backgroundColor: preset.accentColor }} 
                />
                <div>
                  <div className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                    <span>{preset.name.split(' (')[0]}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 font-medium">
                    {preset.domain}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                isSelected ? 'bg-amber-100 text-amber-900 border-amber-300' : 'text-slate-600 bg-slate-100 border-slate-200'
              }`}>
                {preset.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Browser Mockup Viewport */}
      <div className="rounded-3xl border border-slate-300 bg-black/95 p-2 sm:p-4 shadow-2xl max-w-5xl mx-auto">
        
        {/* Browser Chrome Bar */}
        <div className="px-4 py-2.5 bg-zinc-900/90 rounded-2xl border border-white/10 mb-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Traffic Lights & Device Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-zinc-400 ml-2 hidden sm:inline">
              LIVE MULTI-TENANT VIEWPORT
            </span>
          </div>

          {/* Browser Omnibar / URL */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="px-3.5 py-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono flex items-center justify-between text-zinc-300">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 font-medium">https://</span>
                <span className="text-white font-bold">{currentTheme.domain}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold px-1 rounded bg-emerald-400/10">SSL</span>
            </div>
          </div>

          {/* Controls: Mode Switcher & Direct Launch Real Showroom Button */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher (only when theme has real video) */}
            {currentTheme.previewVideoMp4 && (
              <div className="flex items-center gap-0.5 bg-black/70 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('video')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'video'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Vezi filmarea reală cu showroom-ul în producție"
                >
                  <Film className="w-3 h-3" />
                  <span>Video Real</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mockup')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'mockup'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Inspectează structura modulară de componente"
                >
                  <Layers className="w-3 h-3" />
                  <span className="hidden md:inline">Inspector Teme</span>
                </button>
              </div>
            )}

            {currentTheme.domain === 'rxmautomobile.ro' ? (
              <a
                href="https://rxmautomobile.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 transition-all touch-manipulation active:scale-[0.98]"
                title="Deschide site-ul oficial RXM Automobile dezvoltat pe ParcOS"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Vizitează rxmautomobile.ro</span>
              </a>
            ) : (
              <button
                onClick={() => onSwitchToDealer?.(currentTheme.key)}
                className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 transition-all touch-manipulation active:scale-[0.98]"
                title={`Lansează Showroom-ul ${currentTheme.name}`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lansează Live</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewport Interior: Either Real Video or The Dynamic Showroom Engine */}
        {currentTheme.previewVideoMp4 && viewMode === 'video' ? (
          <div className="flex flex-col gap-4">
            {/* 16:9 Cinema Container with real video presentation */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl group">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                poster={currentTheme.previewPoster}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                {currentTheme.previewVideoWebm && (
                  <source src={currentTheme.previewVideoWebm} type="video/webm" />
                )}
                <source src={currentTheme.previewVideoMp4} type="video/mp4" />
              </video>

              {/* Top Floating Badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap items-center gap-2 pointer-events-none z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/40 text-[11px] font-mono font-bold text-amber-300 shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SHOWROOM LIVE ÎN PRODUCȚIE</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-300">
                  <Server className="w-3 h-3 text-amber-400 mr-1" />
                  Găzduit pe Netcup VPS • rxmautomobile.ro
                </span>
              </div>

              {/* Video Control Bar Overlay */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 z-10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title={isPlaying ? "Pauză" : "Redare"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title={isMuted ? "Activează Sunetul" : "Dezactivează Sunetul"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hidden sm:inline-flex"
                    title="Reia de la început"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-zinc-300 ml-1 hidden sm:inline">
                    Prezentare Walkaround & Stoc Real
                  </span>
                </div>

                <a
                  href="https://rxmautomobile.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                >
                  <span>Explorează rxmautomobile.ro</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Production Highlights Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentTheme.videoHighlights?.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{item.label}</span>
                    </div>
                    <div className="font-bold text-sm text-white">
                      {item.value}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center text-[11px] text-zinc-400 font-mono py-1">
              * Înregistrare live din producție a showroom-ului pilot creat și administrat prin ParcOS.
            </div>
          </div>
        ) : (
          <div 
            className={`rounded-2xl p-4 sm:p-8 transition-colors duration-300 ${currentTheme.surfaceClass} border ${currentTheme.borderClass} overflow-hidden`}
          >
            {/* Mini Showroom Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'rgba(128,128,128,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-md"
                  style={{ backgroundColor: currentTheme.accentColor, color: currentTheme.key === 'mpi_auto' ? '#ffffff' : '#000000' }}
                >
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className={`font-display font-extrabold text-sm sm:text-base tracking-tight ${currentTheme.textClass}`}>
                    {currentTheme.name.split(' (')[0]}
                  </span>
                  <span className={`block text-[10px] font-mono ${currentTheme.mutedTextClass}`}>
                    Showroom Auto Autorizat
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs font-medium" style={{ color: currentTheme.accentColor }}>
                <span>Parc Auto</span>
                <span>Finanțare 0% Avans</span>
                <span>Garanție</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Mini Showroom Hero Spotlight Vehicle */}
            <div className={`p-4 sm:p-6 rounded-2xl border mb-6 transition-all ${currentTheme.cardClass}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold mb-2"
                    style={{ backgroundColor: `${currentTheme.accentColor}15`, color: currentTheme.accentColor, border: `1px solid ${currentTheme.accentColor}30` }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>VEHICULUL SĂPTĂMÂNII</span>
                  </div>
                  <h3 className={`font-display font-black text-lg sm:text-2xl tracking-tight ${currentTheme.textClass}`}>
                    {currentTheme.previewHeroCar.brand} {currentTheme.previewHeroCar.model}
                  </h3>
                  <div className={`flex flex-wrap items-center gap-2 text-xs font-mono mt-1 ${currentTheme.mutedTextClass}`}>
                    <span>An: {currentTheme.previewHeroCar.year}</span>
                    <span>•</span>
                    <span>{currentTheme.previewHeroCar.km.toLocaleString('ro-RO')} km</span>
                    <span>•</span>
                    <span>{currentTheme.previewHeroCar.fuel}</span>
                    <span>•</span>
                    <span>{currentTheme.previewHeroCar.hp} CP</span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-500 mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{currentTheme.previewHeroCar.tag}</span>
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${currentTheme.textClass}`}>
                    {currentTheme.previewHeroCar.priceEur.toLocaleString('ro-RO')} €
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${currentTheme.mutedTextClass}`}>
                    {currentTheme.previewHeroCar.vatType}
                  </div>
                  <button
                    onClick={() => onSwitchToDealer?.(currentTheme.key)}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-[0.98] flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: currentTheme.accentColor, 
                      color: currentTheme.key === 'mpi_auto' ? '#ffffff' : '#000000' 
                    }}
                  >
                    <span>Vezi Detalii Showroom</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mini Showroom Stock Grid (3 Sample Cars) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.mutedTextClass}`}>
                  Stoc Recent Adăugat (32 autoturisme disponibile)
                </span>
                <span className="text-xs font-mono" style={{ color: currentTheme.accentColor }}>
                  Vezi Tot Stocul ↗
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentTheme.sampleStock.map((car, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border ${currentTheme.cardClass}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono ${currentTheme.mutedTextClass}`}>{car.year}</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-semibold">{car.tag}</span>
                    </div>
                    <div className={`font-bold text-sm truncate ${currentTheme.textClass}`}>
                      {car.brand} {car.model}
                    </div>
                    <div className={`text-[11px] font-mono mt-1 ${currentTheme.mutedTextClass}`}>
                      {car.km.toLocaleString('ro-RO')} km
                    </div>
                    <div className={`text-base font-extrabold font-mono mt-2 ${currentTheme.textClass}`}>
                      {car.priceEur.toLocaleString('ro-RO')} €
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modular Section Reorder Preview Bar */}
            <div className="pt-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs" style={{ borderColor: 'rgba(128,128,128,0.15)' }}>
              <div className="flex items-center gap-2 text-zinc-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">Ordine Secțiuni Showroom (Modular Drag & Drop):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSections.map((sec, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/10 text-zinc-200"
                  >
                    <GripVertical className="w-2.5 h-2.5 text-zinc-400" />
                    {sec}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

