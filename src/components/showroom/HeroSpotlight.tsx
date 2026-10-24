import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowRight, Truck, Play, Pause, Shield, 
  Calculator, CheckCircle2, Car, ExternalLink, ChevronLeft, ChevronRight, Volume2
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { parseTikTokUrl, isTikTokVideoUrl, initializeTikTokVolume, sendTikTokPlayerVolume, formatMileage, normalizeCarImageUrl } from '../../utils/helpers';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { ShowroomFacilitiesReel } from './ShowroomFacilitiesReel';
import { MobileTikTokPlayerModal } from '../modals/MobileTikTokPlayerModal';

interface HeroSpotlightProps {
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem) => void;
  dealer?: DealerProfile;
  isRevealed?: boolean;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  cars,
  onSelectCar,
  dealer = SEED_DEALER,
  isRevealed = true
}) => {
  const [spotlightCarIndex, setSpotlightCarIndex] = useState<number>(0);
  const [isSpotlightPlaying, setIsSpotlightPlaying] = useState<boolean>(false);
  const [isMobileTikTokModalOpen, setIsMobileTikTokModalOpen] = useState<boolean>(false);
  const spotlightIframeRef = useRef<HTMLIFrameElement>(null);

  // Inițializare automată volum 60% și sunet activ la pornirea redării în Hero Spotlight
  useEffect(() => {
    if (isSpotlightPlaying && spotlightIframeRef.current) {
      const cleanup = initializeTikTokVolume(spotlightIframeRef.current, 60, true);
      return cleanup;
    }
  }, [isSpotlightPlaying, spotlightCarIndex]);

  // Lista vehiculelor Hero Spotlight: Pinned first (ordonate după heroOrder), urmate de Dinamice (cele mai noi cu clip)
  const tiktokFeaturedCars = useMemo(() => {
    const pinned = cars
      .filter(c => c.isHeroPinned)
      .sort((a, b) => (a.heroOrder || 999) - (b.heroOrder || 999));

    const dynamicWithVideo = cars
      .filter(c => !c.isHeroPinned && isTikTokVideoUrl(c.tiktokUrl))
      .sort((a, b) => b.year - a.year);

    const remaining = cars
      .filter(c => !c.isHeroPinned && !isTikTokVideoUrl(c.tiktokUrl))
      .sort((a, b) => b.year - a.year);

    const combined = [...pinned, ...dynamicWithVideo, ...remaining];
    return combined.slice(0, Math.max(6, pinned.length));
  }, [cars]);

  const currentSpotlightCar = tiktokFeaturedCars[spotlightCarIndex % tiktokFeaturedCars.length] || cars[0];
  const currentSpotlightTt = parseTikTokUrl(currentSpotlightCar?.tiktokUrl);

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 px-4 sm:px-8 border-b border-white/[0.08]">
      {/* Ambient Background Radial Glow — Efect cinematic de adâncime cu zoom-in fin */}
      <div 
        className={`absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-1200 ease-out will-change-transform ${
          isRevealed ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
        }`} 
      />
      <div 
        className={`absolute bottom-0 left-10 w-80 h-80 bg-[#fe2c55]/05 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-1200 ease-out delay-150 will-change-transform ${
          isRevealed ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
        }`} 
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        
        {/* STÂNGA: Titlu Editorial Luxury & Informații Brand (Cols 1-7) — Apariție fluidă din spate (Staggered Rise) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Pill Badge — ascuns pe mobil (înlocuit de Slot Machine Turner), păstrat pe desktop */}
          <a
            href="#catalog"
            className={`hidden lg:inline-flex group items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-white/20 backdrop-blur-md text-xs mb-4 sm:mb-6 w-fit transition-all duration-300 shadow-sm cursor-pointer ease-[cubic-bezier(0.16,1,0.3,1)] delay-[100ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <span className="flex items-center gap-1.5 text-zinc-200 font-medium tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] shrink-0" />
              Autovehicule Rulate Verificate
            </span>
            <span className="w-px h-3 bg-white/15 shrink-0" />
            <span className="text-zinc-400 font-normal group-hover:text-zinc-300 transition-colors">
              Garanție până la 36 Luni
            </span>
          </a>
          
          <h1 
            className={`text-[clamp(1.45rem,5.8vw,2.25rem)] sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-[1.14] transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[200ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97]'
            }`}
          >
            <span className="block">Mașina potrivită nu se vinde.</span>
            <span className="block italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-300 pr-2 pb-3 sm:pb-4 -mb-3 sm:-mb-4 mt-1 sm:mt-1.5">
              Se alege cu încredere.
            </span>
          </h1>
          
          <p 
            className={`hidden lg:block mt-4 sm:mt-5 text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-2xl transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[320ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            La {dealer.name} eliminăm promisiunile grăbite. Îți prezentăm fiecare mașină transparent în format video pe TikTok, cu rulaj garantat pe factură fiscală, consultanță gratuită pentru înmatriculare și garanție scrisă până la 36 luni în {dealer.address || 'România'}.
          </p>

          {/* Subtitle mobil — compact, direct pe stoc */}
          <p 
            className={`lg:hidden mt-2 text-xs text-zinc-400 font-normal leading-relaxed transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[320ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {dealer.showroomAddress || dealer.address || 'Parc auto verificat'} · Km garantat pe factură · Garanție scrisă
          </p>

          {/* 🎰 Slot Machine Turner — Facilități Showroom */}
          <ShowroomFacilitiesReel onTriggerTikTokModal={() => setIsMobileTikTokModalOpen(true)} />

          {/* Butoane Acțiune Primară */}
          <div 
            className={`flex items-center gap-2.5 sm:gap-3.5 mt-4 sm:mt-8 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[440ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <a 
              href="#catalog"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold h-12 px-4 sm:px-6 rounded-xl shadow-lg shadow-amber-500/25 transition-all text-xs sm:text-sm touch-manipulation active:scale-[0.98]"
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>Explorează Stocul ({cars.length})</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>

            {/* Buton Video TikTok pe mobil (deschide Pop-out) */}
            <button
              type="button"
              onClick={() => setIsMobileTikTokModalOpen(true)}
              className="lg:hidden inline-flex items-center justify-center gap-1.5 px-3 h-12 rounded-xl bg-black/60 active:bg-black/90 border border-[#fe2c55]/40 text-white font-semibold text-xs touch-manipulation shadow-md shadow-[#fe2c55]/15 shrink-0"
              aria-label="Deschide Prezentare Video TikTok"
            >
              <Play className="w-3.5 h-3.5 fill-[#fe2c55] text-[#fe2c55]" />
              <span>TikTok Video</span>
            </button>

            <a 
              href="#comanda"
              className="hidden lg:inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium h-12 px-5 rounded-xl transition-all text-sm touch-manipulation active:scale-[0.98]"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Mașini la Comandă</span>
            </a>

            <a 
              href={dealer.tiktokUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center justify-center gap-2 px-4 h-12 rounded-xl bg-black/40 hover:bg-[#fe2c55]/20 border border-white/10 hover:border-[#fe2c55]/40 text-zinc-300 hover:text-white transition-all text-sm group touch-manipulation active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-[#fe2c55] text-[#fe2c55]" />
              <span className="text-xs font-semibold">Canal Oficial TikTok</span>
            </a>
          </div>

          {/* 4 Carduri de Încredere Compacte — ascunse pe mobil (banner compact în catalog) */}
          <div 
            className={`hidden lg:grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 pt-8 border-t border-white/[0.08] transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[560ms] will-change-transform ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="p-3 rounded-xl bg-[#121215]/80 border border-white/[0.06]">
              <Shield className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="font-bold text-white text-xs">Garanție până la 36 Luni</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">12L inclus + extindere</p>
            </div>

            <div className="p-3 rounded-xl bg-[#121215]/80 border border-white/[0.06]">
              <Calculator className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="font-bold text-white text-xs">Finanțare Rapidă</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">De la 7.9% prin TBI / BT</p>
            </div>

            <div className="p-3 rounded-xl bg-[#121215]/80 border border-white/[0.06]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1.5" />
              <div className="font-bold text-white text-xs">Km Certificați</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Pe factură fiscală</p>
            </div>

            <div className="p-3 rounded-xl bg-[#121215]/80 border border-white/[0.06]">
              <Car className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="font-bold text-white text-xs">Test Drive {dealer.serviceLocation || 'Showroom'}</div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{dealer.showroomAddress || dealer.address || 'Showroom Auto'}</p>
            </div>
          </div>
        </div>

        {/* DREAPTA: HLK-Style Spotlight Reel Smartphone Card (Cols 8-12) — Tranziție 3D profundă „Venind din Spate” */}
        <div className="hidden lg:flex lg:col-span-5 flex-col items-center">
          <div 
            className={`w-full max-w-[340px] sm:max-w-[360px] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[180ms] will-change-transform ${
              isRevealed 
                ? 'opacity-100 translate-x-0 translate-y-0 scale-100 [transform:perspective(1200px)_rotateY(0deg)_rotateX(0deg)] filter-none' 
                : 'opacity-0 translate-x-10 translate-y-8 scale-[0.84] [transform:perspective(1200px)_rotateY(-10deg)_rotateX(6deg)] blur-[6px]'
            }`}
          >
            
            {/* Ambient Halo Glow dinamic în spatele smartphone-ului */}
            <div 
              className={`absolute -inset-4 bg-gradient-to-tr from-amber-500/25 via-[#fe2c55]/20 to-transparent rounded-[48px] blur-2xl pointer-events-none -z-10 transition-all duration-1200 delay-300 will-change-transform ${
                isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
            />

            {/* Smartphone Frame Outer Shell */}
            <div className="relative aspect-[9/16] rounded-[38px] p-2 bg-gradient-to-b from-zinc-700/50 via-zinc-900 to-black border border-white/20 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden group">
              
              {/* Inner OLED Screen */}
              <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-black flex flex-col justify-between">
                
                {/* Top Floating Header HUD */}
                <div className="absolute top-0 inset-x-0 z-30 p-3.5 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent">
                  <a 
                    href={dealer.tiktokUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-white text-xs font-semibold hover:border-[#fe2c55] transition-colors"
                  >
                    <Play className="w-3 h-3 fill-[#fe2c55] text-[#fe2c55]" />
                    <span className="font-mono text-[11px]">{dealer.tiktokHandle}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    {/* Buton Asigurare / Reset Volum 60% când rulează */}
                    {isSpotlightPlaying && (
                      <button
                        type="button"
                        onClick={() => sendTikTokPlayerVolume(spotlightIframeRef.current, 60, true)}
                        className="px-2 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                        title="Setează sau reactivează sunetul la 60% volum"
                      >
                        <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                        <span>60%</span>
                      </button>
                    )}

                    <a
                      href={currentSpotlightCar?.tiktokUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border border-white/15 transition-all flex items-center gap-1"
                      title="Deschide în TikTok"
                    >
                      <span>TikTok</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    
                    <button
                      type="button"
                      onClick={() => setIsSpotlightPlaying(!isSpotlightPlaying)}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition-all"
                      title={isSpotlightPlaying ? "Oprește redarea" : "Redă videoclip"}
                    >
                      {isSpotlightPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Main Video or Poster Frame */}
                {isSpotlightPlaying && currentSpotlightTt.videoId ? (
                  <div className="w-full h-full bg-black pt-12 pb-2 px-1">
                    <iframe 
                      ref={spotlightIframeRef}
                      src={`https://www.tiktok.com/player/v1/${currentSpotlightTt.videoId}?embed_from=oembed&autoplay=1&music_info=1&description=1&volume_control=1`}
                      title={`TikTok RXM Automobile - ${currentSpotlightCar?.brand} ${currentSpotlightCar?.model}`}
                      className="w-full h-full border-0 rounded-[24px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        initializeTikTokVolume(spotlightIframeRef.current, 60, true);
                      }}
                    />
                  </div>
                ) : currentSpotlightCar ? (
                  <div className="relative w-full h-full flex flex-col justify-end">
                    {/* Poster High-Res Car Photo — Zoom-in cinematic venind din spate */}
                    <img 
                      src={normalizeCarImageUrl(currentSpotlightCar.images[0])} 
                      alt={`${currentSpotlightCar.brand} ${currentSpotlightCar.model}`}
                      width={360}
                      height={640}
                      loading="eager"
                      {...({ fetchpriority: "high" } as any)}
                      decoding="async"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('/rxm/cars/')) {
                          target.src = target.src.replace('/rxm/cars/', '/cars/');
                        }
                      }}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-1200 ease-out will-change-transform pointer-events-none select-none ${
                        isRevealed ? 'scale-100 brightness-100' : 'scale-120 brightness-75'
                      } group-hover:scale-105`}
                    />

                    {/* Watermark Oficial RXM Cluj */}
                    <WatermarkOverlay variant="banner" />
                    
                    {/* Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />

                    {/* Pulsing Play Button in Center */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <button
                        type="button"
                        onClick={() => setIsSpotlightPlaying(true)}
                        aria-label={`Redă prezentarea TikTok pentru ${currentSpotlightCar.brand} ${currentSpotlightCar.model}`}
                        className="w-16 h-16 rounded-full bg-[#fe2c55]/95 hover:bg-[#fe2c55] text-white flex items-center justify-center shadow-2xl shadow-[#fe2c55]/50 transition-all hover:scale-110 group/btn ring-4 ring-white/10"
                        title="Apasă pentru redarea prezentării TikTok"
                      >
                        <Play className="w-7 h-7 fill-white ml-1 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>

                    {/* Bottom HUD Metadata */}
                    <div className="relative z-20 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {currentSpotlightCar.status === 'reserved' && (
                            <span className="text-[10px] font-bold uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40">
                              Rezervat 🟡
                            </span>
                          )}
                          {currentSpotlightCar.status === 'sold' && (
                            <span className="text-[10px] font-bold uppercase text-rose-300 bg-rose-600/30 px-2 py-0.5 rounded-md border border-rose-500/40">
                              Vândut 🔴
                            </span>
                          )}
                          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-300 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                            {currentSpotlightCar.year} • {currentSpotlightCar.fuelType.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-base font-black text-amber-400 font-mono drop-shadow-md whitespace-nowrap">
                          {currentSpotlightCar.priceEur.toLocaleString('ro-RO')} €
                        </span>
                      </div>

                      <h2 className="font-serif text-xl font-bold text-white leading-tight">
                        {currentSpotlightCar.brand} {currentSpotlightCar.model}
                      </h2>
                      <p className="text-[11px] text-zinc-300 line-clamp-1">
                        {currentSpotlightCar.versionTrim}
                      </p>

                      {/* Spec Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/10 text-[10px] text-zinc-200">
                          {currentSpotlightCar.transmission}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/10 text-[10px] text-zinc-200">
                          {currentSpotlightCar.powerHp} CP
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/10 text-[10px] text-zinc-200">
                          {formatMileage(currentSpotlightCar.mileageKm)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/30 border border-rose-500/40 text-[10px] text-rose-300 font-semibold">
                          Garanție {currentSpotlightCar.warrantyMonths}L
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onSelectCar(currentSpotlightCar)}
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all text-center touch-manipulation active:scale-[0.98]"
                        >
                          Vezi în stoc →
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSpotlightPlaying(true)}
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#e0264b] hover:brightness-110 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#fe2c55]/30 touch-manipulation active:scale-[0.98]"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Redă TikTok</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 🎬 RXM VIDEO LOUNGE — Selector Walkaround Reels (Apariție fluidă din spate) */}
            <div 
              className={`mt-3.5 w-full p-3 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-2xl transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[350ms] will-change-transform ${
                isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="flex items-center justify-between text-xs px-1 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe2c55] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fe2c55]"></span>
                  </span>
                  <span className="font-serif font-bold text-white tracking-wide text-xs">
                    RXM Video Lounge
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                    Walkarounds 4K
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] text-zinc-400">
                    0{spotlightCarIndex + 1} / 0{tiktokFeaturedCars.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSpotlightPlaying(false);
                        setSpotlightCarIndex((prev) => (prev > 0 ? prev - 1 : tiktokFeaturedCars.length - 1));
                      }}
                      className="min-w-[36px] min-h-[36px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors touch-manipulation active:scale-95"
                      aria-label="Modelul anterior"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSpotlightPlaying(false);
                        setSpotlightCarIndex((prev) => (prev + 1) % tiktokFeaturedCars.length);
                      }}
                      className="min-w-[36px] min-h-[36px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors touch-manipulation active:scale-95"
                      aria-label="Modelul următor"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Strip 6 Carduri Interactive — Modele Pinned & Recente */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {tiktokFeaturedCars.map((c, idx) => {
                  const isSelected = spotlightCarIndex === idx;
                  const isPinned = !!c.isHeroPinned;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setIsSpotlightPlaying(false);
                        setSpotlightCarIndex(idx);
                      }}
                      className={`group/thumb relative rounded-xl overflow-hidden flex flex-col text-left transition-all border p-1 touch-manipulation ${
                        isSelected 
                          ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10 shadow-lg shadow-amber-500/15' 
                          : 'border-white/10 bg-zinc-900/80 hover:border-white/30 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 mb-1" onContextMenu={(e) => e.preventDefault()}>
                        <img 
                          src={c.images[0]} 
                          alt={`${c.brand} ${c.model}`} 
                          width={96}
                          height={54}
                          loading="lazy"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200 pointer-events-none select-none" 
                        />
                        <span className={`absolute top-0.5 left-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          c.status === 'reserved'
                            ? 'bg-amber-300 text-black font-black shadow-sm'
                            : c.status === 'sold'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : isPinned ? 'bg-amber-300 text-black font-black shadow-sm' : 'bg-black/90 text-white font-bold'
                        }`}>
                          {c.status === 'reserved' ? 'Rezervat' : c.status === 'sold' ? 'Vândut' : isPinned ? '★ Pinned' : 'Nou'}
                        </span>
                        <span className="absolute bottom-0.5 right-0.5 font-mono text-[8px] font-bold text-white bg-black/80 px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-white truncate leading-tight">
                        {c.model}
                      </div>
                      <div className="text-[9px] text-amber-400 font-mono font-medium">
                        {c.priceEur.toLocaleString('ro-RO')} €
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 📱 Pop-Out Modal TikTok (Mobile & On-Demand) */}
      <MobileTikTokPlayerModal
        isOpen={isMobileTikTokModalOpen}
        onClose={() => setIsMobileTikTokModalOpen(false)}
        car={currentSpotlightCar}
        videoId={currentSpotlightTt.videoId}
        dealer={dealer}
        onSelectCar={onSelectCar}
      />
    </section>
  );
};
