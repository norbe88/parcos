import React, { useState, useEffect } from 'react';
import { 
  Film, Minimize2, LayoutGrid, Building2, Check, Sparkles, 
  Eye, EyeOff, Save, ExternalLink, Plus, X, Video, 
  Layers, Palette, Tag, CheckCircle2, AlertCircle, ArrowUpRight,
  Globe, Search, Share2, RefreshCw
} from 'lucide-react';
import { DirectMediaDropzone } from '../common/DirectMediaDropzone';
import { DealerProfile } from '../../db/seed';
import { 
  DealerLandingConfig, 
  DealerLandingSections, 
  DealerHeroType, 
  DealerLayoutVariant, 
  DealerThemePreset 
} from '../../db/types';
import { DEFAULT_LANDING_CONFIG } from '../../db/dealer';

interface LandingCustomizerHUDProps {
  tenant: DealerProfile;
  onSave: (landingConfig: DealerLandingConfig, themePreset?: DealerThemePreset) => void;
  showToast: (msg: string) => void;
  isSaving?: boolean;
}

const THEME_PRESETS: { id: DealerThemePreset; label: string; desc: string; badge: string; dot: string }[] = [
  { id: 'obsidian_gold', label: 'Obsidian Gold', desc: 'Dark Luxury #09090b & Amber', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  { id: 'clean_white', label: 'Clean White', desc: 'Nordic Clean & Minimalist', badge: 'bg-zinc-100/10 text-white border-white/20', dot: 'bg-white' },
  { id: 'midnight_blue', label: 'Midnight Blue', desc: 'Sapphire High-Tech', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  { id: 'carbon_red', label: 'Carbon Red', desc: 'Dynamic Sport Crimson', badge: 'bg-red-500/10 text-red-300 border-red-500/30', dot: 'bg-red-400' },
  { id: 'emerald_prestige', label: 'Emerald Prestige', desc: 'British Racing Green Eco', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
];

const LAYOUT_VARIANTS: { id: DealerLayoutVariant; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'luxury_cinematic', label: 'Cinematic Luxury', desc: 'Video 4K ambient, dynamic animations, atmosferă lux showroom', icon: Film },
  { id: 'nordic_clean', label: 'Nordic Clean', desc: 'Minimalist, spațiere generoasă, accent pe fotografii clare de studio', icon: Minimize2 },
  { id: 'compact_inventory', label: 'Compact Inventory', desc: 'Orientat spre viteză, catalog dens cu filtre rapide la primul scroll', icon: LayoutGrid },
  { id: 'corporate_fleet', label: 'Corporate Fleet', desc: 'Format sobru B2B, evidențiere TVA deductibil 21% și leasing firme', icon: Building2 },
];

const HERO_MODES: { id: DealerHeroType; label: string; desc: string }[] = [
  { id: 'video_loop', label: '4K Video Intro Loop', desc: 'Player video full-screen cu ambient sonor și teaser stoc' },
  { id: 'spotlight', label: 'Hero Spotlight', desc: 'Mașină vedetă pe piedestal interactiv cu badge-uri cheie' },
  { id: 'banner', label: 'Banner Compact', desc: 'Hero compact cu titlu, subtitlu și CTA direct spre catalog' },
];

const SECTIONS_CONFIG: { key: keyof DealerLandingSections; title: string; desc: string; anchor: string }[] = [
  { key: 'heroCinematic', title: 'Hero Principal & Intro', desc: 'Secțiunea superioară (Video 4K / Spotlight / Banner)', anchor: '#top' },
  { key: 'vehicleCatalog', title: 'Catalog Vehicule Disponibile', desc: 'Tabelul de stoc, carduri mașini, filtre și căutare avansată', anchor: '#stoc' },
  { key: 'whyChooseUs', title: 'De Ce Noi & Standarde Siguranță', desc: 'Garanție până la 36 luni, verificare pe 150 puncte, Cont de Garanție', anchor: '#why-us' },
  { key: 'financingSection', title: 'Calculator Rate & Finanțare', desc: 'Simulare leasing financiar și credit auto BT / TBI cu 0% avans', anchor: '#finantare' },
  { key: 'buyBackSection', title: 'Program Buy-Back & Trade-In', desc: 'Evaluare mașină veche și ofertă transparentă de schimb auto', anchor: '#buyback' },
  { key: 'customOrderSection', title: 'Comandă Specială Import', desc: 'Consultanță achiziție vehicule din licitații europene la cerere', anchor: '#comanda' },
  { key: 'googleReviewsSection', title: 'Recenzii Google & Testimoniale', desc: 'Păreri verificate ale clienților și reputație dealership', anchor: '#recenzii' },
];

const SUGGESTED_BADGES = [
  'Garanție 24 Luni',
  'TVA Deductibil 21%',
  'Livrare Națională Gratuită',
  '0% Avans Finanțare',
  'Verificare 150 Puncte',
  'Kilometraj Certificat',
  'Istoric CarVertical Inclus',
  'Cont de Garanție Protejat'
];

export const LandingCustomizerHUD: React.FC<LandingCustomizerHUDProps> = ({
  tenant,
  onSave,
  showToast,
  isSaving = false
}) => {
  // Configurația activă inițializată din tenant sau fallback default
  const baseConfig: DealerLandingConfig = tenant.landingConfig || DEFAULT_LANDING_CONFIG;

  const [selectedTheme, setSelectedTheme] = useState<DealerThemePreset>(tenant.themePreset || 'obsidian_gold');
  const [layoutVariant, setLayoutVariant] = useState<DealerLayoutVariant>(baseConfig.layoutVariant || 'luxury_cinematic');
  const [catalogDisplayMode, setCatalogDisplayMode] = useState<'progressive_batch' | 'show_all'>(baseConfig.catalogDisplayMode || 'progressive_batch');
  const [catalogInitialBatchDesktop, setCatalogInitialBatchDesktop] = useState<6 | 9 | 12 | 18>(baseConfig.catalogInitialBatchDesktop || 9);
  const [catalogInitialBatchMobile, setCatalogInitialBatchMobile] = useState<4 | 6 | 8>(baseConfig.catalogInitialBatchMobile || 6);
  const [heroType, setHeroType] = useState<DealerHeroType>(baseConfig.hero?.type || 'spotlight');
  const [heroHeadline, setHeroHeadline] = useState<string>(baseConfig.hero?.headline || '');
  const [heroSubheadline, setHeroSubheadline] = useState<string>(baseConfig.hero?.subheadline || '');
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(baseConfig.hero?.videoUrl || '');
  const [heroPosterUrl, setHeroPosterUrl] = useState<string>(baseConfig.hero?.posterUrl || '');
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState<string>(baseConfig.hero?.primaryCtaText || '');
  const [visibleSections, setVisibleSections] = useState<DealerLandingSections>({
    ...DEFAULT_LANDING_CONFIG.visibleSections,
    ...(baseConfig.visibleSections || {})
  });
  const [customBadges, setCustomBadges] = useState<string[]>(baseConfig.customBadges || []);
  const [newBadgeInput, setNewBadgeInput] = useState<string>('');
  
  // Stări SEO (Ticket 05)
  const [metaTitle, setMetaTitle] = useState<string>(baseConfig.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState<string>(baseConfig.seo?.metaDescription || '');
  const [canonicalUrl, setCanonicalUrl] = useState<string>(baseConfig.seo?.canonicalUrl || '');

  // Stări Media & Invariante
  const [showManualMediaUrls, setShowManualMediaUrls] = useState<boolean>(false);
  const isRxm = tenant.slug === 'rxm' || tenant.slug === 'rxmautomobile';

  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sincronizare la schimbarea tenantului selectat
  useEffect(() => {
    const fresh = tenant.landingConfig || DEFAULT_LANDING_CONFIG;
    setSelectedTheme(tenant.themePreset || 'obsidian_gold');
    setLayoutVariant(fresh.layoutVariant || 'luxury_cinematic');
    setCatalogDisplayMode(fresh.catalogDisplayMode || 'progressive_batch');
    setCatalogInitialBatchDesktop(fresh.catalogInitialBatchDesktop || 9);
    setCatalogInitialBatchMobile(fresh.catalogInitialBatchMobile || 6);
    setHeroType(fresh.hero?.type || 'spotlight');
    setHeroHeadline(fresh.hero?.headline || '');
    setHeroSubheadline(fresh.hero?.subheadline || '');
    setHeroVideoUrl(fresh.hero?.videoUrl || '');
    setHeroPosterUrl(fresh.hero?.posterUrl || '');
    setHeroPrimaryCtaText(fresh.hero?.primaryCtaText || '');
    setVisibleSections({
      ...DEFAULT_LANDING_CONFIG.visibleSections,
      ...(fresh.visibleSections || {})
    });
    setCustomBadges(fresh.customBadges || []);
    setMetaTitle(fresh.seo?.metaTitle || '');
    setMetaDescription(fresh.seo?.metaDescription || '');
    setCanonicalUrl(fresh.seo?.canonicalUrl || '');
    setShowManualMediaUrls(false);
    setIsDirty(false);
  }, [tenant]);

  const handleToggleSection = (key: keyof DealerLandingSections) => {
    setVisibleSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      setIsDirty(true);
      return next;
    });
  };

  const handleAddBadge = (textToAdd?: string) => {
    const badgeText = (textToAdd || newBadgeInput).trim();
    if (!badgeText) return;
    if (customBadges.length >= 5) {
      showToast('⚠️ Limită atinsă: maxim 5 badge-uri per dealer.');
      return;
    }
    if (badgeText.length > 40) {
      showToast('⚠️ Lungime maximă permisă: 40 caractere.');
      return;
    }
    if (customBadges.some(b => b.toLowerCase() === badgeText.toLowerCase())) {
      showToast('ℹ️ Acest badge există deja în listă.');
      return;
    }

    setCustomBadges(prev => [...prev, badgeText]);
    setNewBadgeInput('');
    setIsDirty(true);
  };

  const handleRemoveBadge = (index: number) => {
    setCustomBadges(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleSaveChanges = () => {
    const updatedConfig: DealerLandingConfig = {
      layoutVariant,
      catalogDisplayMode,
      catalogInitialBatchDesktop,
      catalogInitialBatchMobile,
      hero: {
        type: heroType,
        headline: heroHeadline.trim() || undefined,
        subheadline: heroSubheadline.trim() || undefined,
        videoUrl: heroType === 'video_loop' ? (heroVideoUrl.trim() || undefined) : undefined,
        posterUrl: heroPosterUrl.trim() || undefined,
        primaryCtaText: heroPrimaryCtaText.trim() || undefined,
      },
      visibleSections,
      customBadges,
      seo: {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
      }
    };

    onSave(updatedConfig, selectedTheme);
    setIsDirty(false);
    showToast(`✅ Configurație landing salvată pentru ${tenant.name}`);
  };

  const livePreviewUrl = `/?dealer=${encodeURIComponent(tenant.slug || 'rxm')}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* ─── Top Control Bar: Titlu & Acțiuni Rapide ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
              Personalizare No-Code
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Slug: {tenant.slug || 'rxm'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-400" />
            Landing Page & Showroom: {tenant.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Configurează experiența vizuală a clienților. Modificările se aplică instantaneu și sunt sincronizate securizat cu baza de date.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={livePreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            title="Deschide showroom-ul în tab nou pentru verificare"
          >
            <span>Live Showroom</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isDirty
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-95'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Se salvează...' : isDirty ? 'Salvează Modificările*' : 'Salvat'}</span>
          </button>
        </div>
      </div>

      {/* ─── SECȚIUNEA 1: TEMĂ CROMATICĂ & PRESET VIZUAL ─────────────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              1. Preset Cromatic & Tokeni Adaptivi Tailwind
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Garantează contrast strict WCAG AA și estetică Dark Luxury personalizată.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Dual-Theme Native</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isSelected = selectedTheme === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  setSelectedTheme(preset.id);
                  setIsDirty(true);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 select-none ${
                  isSelected
                    ? 'bg-white/[0.08] border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-[#18181c] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${preset.badge}`}>
                    {preset.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className={`w-4 h-4 rounded-full ${preset.dot} shadow-sm shrink-0`} />
                  <p className="text-[11px] text-zinc-400 leading-tight">{preset.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECȚIUNEA 2: VARIANTĂ DE LAYOUT LANDING ─────────────────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            2. Structură & Arhitectură Layout
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alege comportamentul general de navigare și aranjare al paginii de showroom.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {LAYOUT_VARIANTS.map((variant) => {
            const Icon = variant.icon;
            const isSelected = layoutVariant === variant.id;
            return (
              <div
                key={variant.id}
                onClick={() => {
                  setLayoutVariant(variant.id);
                  setIsDirty(true);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 select-none ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-[#18181c] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <span className="text-[10px] font-bold text-amber-400 font-mono">ACTIV</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{variant.label}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{variant.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECȚIUNEA 2.5: CONFIGURARE AFIȘARE STOC & BATCHING ──────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span>2.5. Afișare Stoc Showroom & Încărcare Progresivă (Batching)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Controlează câte mașini se randează inițial la deschiderea showroom-ului pentru viteză de top.
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 w-fit">
            {catalogDisplayMode === 'show_all' ? 'Toate (Fără limită)' : `${catalogInitialBatchDesktop} Desktop / ${catalogInitialBatchMobile} Mobil`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { id: 9, mob: 6 as const, label: '9 Desktop / 6 Mobil', badge: 'RECOMANDAT', desc: 'Matrice simetrică 3×3. LCP < 1.0s instant. Rata optimă de conversie.', rec: true },
            { id: 6, mob: 6 as const, label: '6 Desktop / 6 Mobil', badge: 'ULTRA-RAPID', desc: '2 rânduri de 3. Focus pe încărcare fulger și lead rapid.', rec: false },
            { id: 12, mob: 8 as const, label: '12 Desktop / 8 Mobil', badge: 'EXTINS', desc: '4 rânduri de 3. Pentru dealeri cu flotă mare disponibilă.', rec: false },
            { id: 18, mob: 8 as const, label: '18 Desktop (Plafon)', badge: 'MAXIM', desc: '6 rânduri. Limită superioară recomandată pentru viteză.', rec: false }
          ].map((preset) => {
            const isSelected = catalogDisplayMode === 'progressive_batch' && catalogInitialBatchDesktop === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  setCatalogDisplayMode('progressive_batch');
                  setCatalogInitialBatchDesktop(preset.id as any);
                  setCatalogInitialBatchMobile(preset.mob);
                  setIsDirty(true);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 select-none relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-[#18181c] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    preset.rec ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {preset.badge}
                  </span>
                  {isSelected && <span className="text-[10px] font-bold text-amber-400 font-mono">ACTIV</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{preset.label}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{preset.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle mod Fără Limită */}
        <div className="pt-2 flex items-center justify-between text-xs bg-[#18181c] p-3 rounded-xl border border-white/[0.06]">
          <span className="text-zinc-400">
            Mod clasic: Afișează toate autovehiculele din start (dezactivează încărcarea progresivă)
          </span>
          <button
            type="button"
            onClick={() => {
              const nextMode = catalogDisplayMode === 'show_all' ? 'progressive_batch' : 'show_all';
              setCatalogDisplayMode(nextMode);
              setIsDirty(true);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              catalogDisplayMode === 'show_all'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            {catalogDisplayMode === 'show_all' ? 'Dezactivează (Revin-o la Recomandat)' : 'Afișează Tot Stocul'}
          </button>
        </div>
      </section>

      {/* ─── SECȚIUNEA 3: CONFIGURARE HERO SHOWROOM ──────────────────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" />
            3. Modulul Hero Principal
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alege ce vor vedea utilizatorii la primul ecran când deschid showroom-ul.
          </p>
        </div>

        {/* Hero Type Radios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HERO_MODES.map((mode) => {
            const isSelected = heroType === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => {
                  setHeroType(mode.id);
                  setIsDirty(true);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 select-none ${
                  isSelected
                    ? 'bg-white/[0.08] border-amber-500 ring-1 ring-amber-500/40'
                    : 'bg-[#18181c] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{mode.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400">{mode.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Hero Contextual Fields */}
        <div className="p-4 rounded-xl bg-[#18181c] border border-white/[0.06] space-y-4">
          {heroType === 'video_loop' ? (
            <div className="space-y-4">
              {/* RXM Safety Invariant Guard */}
              {isRxm && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-200">Tenant Central RXM Automobile</p>
                    <p className="text-[11px] text-zinc-300">
                      Modificarea Hero Video-ului afectează direct showroom-ul oficial <code>rxmautomobile.ro</code>. Asigură-te că folosești materiale optimizate 1080p/4K sub 60MB.
                    </p>
                  </div>
                </div>
              )}

              {/* Uploader Direct Cloudflare R2: Video Showroom */}
              <DirectMediaDropzone
                tenantSlug={tenant.slug || 'rxm'}
                mediaType="landing"
                acceptedTypes="video/mp4,video/webm"
                maxSizeMb={60}
                label="Video Showroom (Direct Cloudflare R2)"
                hint="Format MP4 / WebM H.264 (Max 60MB) • Upload direct fără trafic prin serverul VPS"
                currentValue={heroVideoUrl}
                onUploadSuccess={(publicUrl) => {
                  setHeroVideoUrl(publicUrl);
                  setIsDirty(true);
                  showToast('✅ Hero Video încărcat cu succes în Cloudflare R2!');
                }}
              />

              {/* Uploader Direct Cloudflare R2: Poster Fallback */}
              <DirectMediaDropzone
                tenantSlug={tenant.slug || 'rxm'}
                mediaType="landing"
                acceptedTypes="image/webp,image/jpeg,image/png,image/avif"
                maxSizeMb={10}
                label="Imagine Poster Fallback (Afișată înainte de pornire)"
                hint="Format WebP, PNG sau JPG (Max 10MB) afișat până când videoclipul pornește redarea"
                currentValue={heroPosterUrl}
                onUploadSuccess={(publicUrl) => {
                  setHeroPosterUrl(publicUrl);
                  setIsDirty(true);
                  showToast('✅ Poster fallback încărcat cu succes în Cloudflare R2!');
                }}
              />

              {/* Acțiuni Rapide: Reset la Default & Toggle URL Manual */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowManualMediaUrls(prev => !prev)}
                  className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{showManualMediaUrls ? '▲ Ascunde câmpurile URL manuale' : '⚙️ Introducere sau editare manuală URL CDN'}</span>
                </button>

                {(heroVideoUrl || heroPosterUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isRxm) {
                        const confirmed = window.confirm('Ești pe tenantul oficial RXM Automobile. Sigur dorești să resetezi la videoclipul standard de showroom?');
                        if (!confirmed) return;
                      }
                      setHeroVideoUrl('');
                      setHeroPosterUrl('');
                      setIsDirty(true);
                      showToast('ℹ️ Materiale video resetate la valorile implicite ParcOS / RXM.');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Resetează la videoclipul standard de showroom"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resetează la videoclipul implicit ParcOS</span>
                  </button>
                )}
              </div>

              {/* Câmpuri Manuale Avansate (Collapsible) */}
              {showManualMediaUrls && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      URL Video CDN Manual (MP4 / WebM)
                    </label>
                    <input
                      type="url"
                      value={heroVideoUrl}
                      onChange={(e) => {
                        setHeroVideoUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="https://pub-...r2.dev/tenants/... (Lăsați gol pentru video implicit)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Poster Image Fallback URL Manual
                    </label>
                    <input
                      type="url"
                      value={heroPosterUrl}
                      onChange={(e) => {
                        setHeroPosterUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="/images/hero-poster.jpg sau https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Headline Principal Hero
                  </label>
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => {
                      setHeroHeadline(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Autovehicule Rulate Premium • Cluj-Napoca"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Text Buton CTA Principal
                  </label>
                  <input
                    type="text"
                    value={heroPrimaryCtaText}
                    onChange={(e) => {
                      setHeroPrimaryCtaText(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Explorează Stocul Disponibil"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Sub-headline / Descriere Suport
                </label>
                <input
                  type="text"
                  value={heroSubheadline}
                  onChange={(e) => {
                    setHeroSubheadline(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Garanție până la 36 luni, verificare pe 150 puncte, transparență totală a istoricului."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECȚIUNEA 4: TOGGLE VIZIBILITATE SECȚIUNI ──────────────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              4. Secțiuni Showroom Active & Meniu Dinamic
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dezactivarea unei secțiuni o elimină complet din showroom și din linkurile din Navbar.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {Object.values(visibleSections).filter(Boolean).length} din {SECTIONS_CONFIG.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS_CONFIG.map((sec) => {
            const isVisible = visibleSections[sec.key];
            return (
              <div
                key={sec.key}
                onClick={() => handleToggleSection(sec.key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                  isVisible
                    ? 'bg-[#18181c] border-white/[0.1] hover:border-white/20'
                    : 'bg-black/40 border-white/[0.04] opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{sec.title}</span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{sec.anchor}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{sec.desc}</p>
                </div>

                <div className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                  isVisible ? 'bg-amber-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}>
                  <div className={`w-4 h-4 rounded-full transition-transform ${
                    isVisible ? 'bg-black' : 'bg-zinc-400'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECȚIUNEA 5: BADGE-URI DE ÎNCREDERE & ATRIBUTE ─────────────────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            5. Badge-uri de Încredere & Atribute Cheie (Max 5)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Afișate proeminent în Hero, sub titlul showroom-ului și în cardurile de prezentare.
          </p>
        </div>

        {/* Current Badges List */}
        <div className="flex flex-wrap items-center gap-2">
          {customBadges.map((badge, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 group"
            >
              <span>{badge}</span>
              <button
                type="button"
                onClick={() => handleRemoveBadge(idx)}
                className="text-amber-400/60 hover:text-amber-200 transition-colors p-0.5 rounded cursor-pointer"
                title="Elimină badge"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {customBadges.length === 0 && (
            <p className="text-xs text-zinc-500 italic">Nu există badge-uri configurate.</p>
          )}
        </div>

        {/* Add Badge Input Form */}
        {customBadges.length < 5 && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              maxLength={40}
              value={newBadgeInput}
              onChange={(e) => setNewBadgeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBadge();
                }
              }}
              placeholder="Adaugă un badge nou (ex: Garanție 24 Luni)..."
              className="flex-1 max-w-md px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => handleAddBadge()}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adaugă</span>
            </button>
          </div>
        )}

        {/* Quick Suggested Badges */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Sugestii rapide (1-Click Add):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_BADGES.map((sug) => {
              const alreadyHas = customBadges.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={alreadyHas || customBadges.length >= 5}
                  onClick={() => handleAddBadge(sug)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    alreadyHas
                      ? 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed'
                      : 'bg-[#18181c] border-white/10 text-zinc-300 hover:text-white hover:border-amber-400/40'
                  }`}
                >
                  + {sug}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECȚIUNEA 6: OPTIMIZARE SEO, META TAGURI & SCHEMA AUTODEALER ─────── */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              6. Optimizare SEO, Social Cards & Schema.org AutoDealer
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Meta-tagurile sunt injectate dinamic la runtime și generează microdate JSON-LD pentru Google Rich Snippets.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AutoDealer Schema Activ
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Câmpuri Editabile */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  Meta Title (Titlu Tab & Google SERP)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {metaTitle.length || `${tenant.name} — Autovehicule Rulate Premium | Cluj-Napoca`.length} / 65 caractere
                </span>
              </div>
              <input
                type="text"
                maxLength={90}
                value={metaTitle}
                onChange={(e) => {
                  setMetaTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={`${tenant.name} — Autovehicule Rulate Premium | Cluj-Napoca`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Lăsați gol pentru valoarea generată automat cu orașul și brandul dealerului.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Meta Description (Snippet Rezultate Căutare)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {metaDescription.length || 145} / 160 caractere
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={metaDescription}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={`Parc auto ${tenant.name} — stoc verificat de autovehicule rulate, finanțare, livrare națională. ${tenant.openingHours || ''}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                URL Canonical (Domeniu Indexare Strict)
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => {
                  setCanonicalUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={tenant.slug === 'rxm' ? 'https://rxmautomobile.ro/' : `https://${tenant.domain || 'parcos.ro'}/`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Live SERP & Social Card Preview */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Previzualizare Live Google & WhatsApp:
            </p>

            {/* Google SERP Preview Card */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-1.5 font-sans">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {canonicalUrl || (tenant.slug === 'rxm' ? 'https://rxmautomobile.ro' : `https://${tenant.domain || 'parcos.ro'}`)}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {tenant.name} › Showroom
                  </p>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer pt-0.5 line-clamp-1">
                {metaTitle || `${tenant.name} — Autovehicule Rulate Premium | Cluj-Napoca`}
              </h4>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {metaDescription || `Parc auto ${tenant.name} — stoc verificat de autovehicule rulate, finanțare, livrare națională. ${tenant.openingHours || ''}`}
              </p>
            </div>

            {/* Social Share Card Preview */}
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-white/10 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Share2 className="w-6 h-6 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-amber-400/80 uppercase">OpenGraph / WhatsApp Card</span>
                <p className="text-xs font-bold text-white truncate">
                  {metaTitle || `${tenant.name} — Autovehicule Rulate Premium`}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {metaDescription || 'Parc auto rulate premium cu garanție și finanțare'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Floating Action Bar dacă există modificări nesalvate ─────── */}
      {isDirty && (
        <div className="sticky bottom-6 p-4 rounded-2xl bg-[#18181c]/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              Aveți modificări nesalvate în configurația showroom-ului.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const fresh = tenant.landingConfig || DEFAULT_LANDING_CONFIG;
                setLayoutVariant(fresh.layoutVariant || 'luxury_cinematic');
                setCatalogDisplayMode(fresh.catalogDisplayMode || 'progressive_batch');
                setCatalogInitialBatchDesktop(fresh.catalogInitialBatchDesktop || 9);
                setCatalogInitialBatchMobile(fresh.catalogInitialBatchMobile || 6);
                setHeroType(fresh.hero?.type || 'spotlight');
                setVisibleSections(fresh.visibleSections || DEFAULT_LANDING_CONFIG.visibleSections);
                setCustomBadges(fresh.customBadges || []);
                setIsDirty(false);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Se salvează...' : 'Salvează Acum'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
