import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Car,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RotateCcw,
  FileText,
  MessageSquare,
  Scan,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

export interface ShowroomVideoIntroProps {
  /** Calea către clipul video 4K (ex: "/videos/parcos-showroom-intro.mp4") */
  videoSrc?: string;
  /** Imaginea de poster afișată ca fallback sau înainte de redare */
  posterSrc?: string;
  /** Imaginea de cadru final (showroom deschis cu cele 4 vehicule) afișată după terminare */
  lastFrameSrc?: string;
  /** ID-ul secțiunii din pagină către care derulează butonul CTA */
  targetSectionId?: string;
  /** Callback la apăsarea butonului principal CTA */
  onExploreClick?: () => void;
  /** Timestamp opțional de început scanare */
  scanStartTimestampSec?: number;
  /** Timestamp opțional de spawn */
  spawnStartTimestampSec?: number;
  /** Forțare afișare intro */
  forceShowIntro?: boolean;
}

interface ShowroomVehicle {
  id: string;
  shortName: string;
  vehicleName: string;
  trim: string;
  priceGross: string;
  statusBadge: string;
  statusColor: 'emerald' | 'amber' | 'sky';
  imageUrl: string;
  anchorX: string;
  anchorY: string;
  featureTitle: string;
  featureSub: string;
  Icon: React.ComponentType<{ className?: string }>;
  telemetry: { label: string; value: string }[];
}

/**
 * Cele 4 vehicule reprezentate în showroom (aliniate exact cu modelele din video-ul din hală):
 * - Card 0: Porsche Cayenne GTS Coupé (Flanc Stâng Față / Top-Left)
 * - Card 1: Mercedes-AMG GT Coupé (Flanc Stâng Mijloc / Top-Right)
 * - Card 2: Audi RS7 Sportback (Flanc Drept Mijloc / Bottom-Left)
 * - Card 3: Audi R8 V10 Performance (Flanc Drept Față / Bottom-Right)
 *
 * * Toate prețurile includ TVA 21% deductibil și sunt marcate cu * pentru a indica date demonstrative (mock data).
 * * Design Tokeni: Dark Luxury (#09090b canvas, #121215 card glass, text-white, WCAG AAA 18:1 contrast).
 */
const VEHICLES: ShowroomVehicle[] = [
  {
    id: 'porsche-cayenne-01',
    shortName: 'Porsche Cayenne',
    vehicleName: 'Porsche Cayenne GTS Coupé',
    trim: 'Sport Chrono • V8 4.0 Biturbo • 2023 • 38.000 km',
    priceGross: '108.900 € (TVA inclus)*',
    statusBadge: 'În Stoc • Livrare Imediată',
    statusColor: 'sky',
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    anchorX: '20%',
    anchorY: '74%',
    featureTitle: 'CIV Scanat cu AI (1.8s) • e-Factura SPV',
    featureSub: '19/19 câmpuri RAR extrase instant în sistem',
    Icon: Scan,
    telemetry: [
      { label: 'CIV RAR', value: '19/19 Validate' },
      { label: 'ANAF e-Factura', value: 'XML SPV' },
      { label: 'Garanție Rezervare', value: '1.000 €' },
    ],
  },
  {
    id: 'merc-amg-gt-02',
    shortName: 'Mercedes-AMG GT',
    vehicleName: 'Mercedes-AMG GT Coupé V8',
    trim: 'Night Package • Burmester • 2022 • 29.500 km',
    priceGross: '119.500 € (TVA inclus)*',
    statusBadge: 'Rezervare Online • WhatsApp',
    statusColor: 'emerald',
    imageUrl:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
    anchorX: '34%',
    anchorY: '64%',
    featureTitle: 'Ofertă Trimisă • Plată Stripe Link',
    featureSub: 'Garanție de Rezervare confirmată prin Apple Pay (Stripe)',
    Icon: MessageSquare,
    telemetry: [
      { label: 'Plată Stripe', value: '1.500 € Încasat' },
      { label: 'Dosar WhatsApp', value: 'PDF Auto' },
      { label: 'Status Rezervare', value: 'Blocat 48h' },
    ],
  },
  {
    id: 'audi-rs7-03',
    shortName: 'Audi RS7 Sportback',
    vehicleName: 'Audi RS7 Sportback 4.0 TFSI',
    trim: 'HD Matrix Laser • Ceramic • 2023 • 24.000 km',
    priceGross: '114.900 € (TVA inclus)*',
    statusBadge: 'Verificat Tehnic • Raport RAR',
    statusColor: 'amber',
    imageUrl:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80',
    anchorX: '72%',
    anchorY: '65%',
    featureTitle: 'Contract Vânzare & Înstrăinare DRPCIV',
    featureSub: 'Fișă înstrăinare DRPCIV + Proces Verbal predare',
    Icon: FileText,
    telemetry: [
      { label: 'Contract Vânzare', value: 'PDF Auto' },
      { label: 'Înstrăinare DRPCIV', value: 'Anexa 2' },
      { label: 'Regim Fiscal', value: 'TVA Deductibil' },
    ],
  },
  {
    id: 'audi-r8-04',
    shortName: 'Audi R8 V10',
    vehicleName: 'Audi R8 V10 Performance Quattro',
    trim: 'Carbon Aerokit • Laser Light • 2022 • 18.200 km',
    priceGross: '139.900 € (TVA inclus)*',
    statusBadge: 'Sincronizat Live • Multi-Canal',
    statusColor: 'emerald',
    imageUrl:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80',
    anchorX: '82%',
    anchorY: '74%',
    featureTitle: 'Sincronizat pe marile portaluri în 0.42s',
    featureSub: 'Protecție activă împotriva dublei vânzări',
    Icon: Zap,
    telemetry: [
      { label: 'Sincronizare', value: 'Portaluri Auto & Clasificate' },
      { label: 'Timp Replicare', value: '0.42s' },
      { label: 'Alertă Stoc', value: 'Activă 24/7' },
    ],
  },
];

export const ShowroomVideoIntro: React.FC<ShowroomVideoIntroProps> = ({
  videoSrc = '/videos/parcos-showroom-intro.mp4',
  posterSrc = '/images/parcos-showroom-hall.jpg',
  lastFrameSrc = '/images/parcos-showroom-hall-lastframe.jpg',
  targetSectionId = 'demo-ocr',
  onExploreClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentPhaseRef = useRef<-1 | 0 | 1 | 2 | 3>(-1);
  const isHeroBannerRevealedRef = useRef<boolean>(false);
  const isVideoEndedRef = useRef<boolean>(false);

  // Cuantificare pe 5 faze discrete (-1, 0, 1, 2, 3) pentru eliminarea completă a re-randărilor continue la scroll
  const [scrollPhase, setScrollPhase] = useState<-1 | 0 | 1 | 2 | 3>(-1);
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [isHeroBannerRevealed, setIsHeroBannerRevealed] = useState<boolean>(false);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);

  // Stare pentru selecția manuală a cardului activ pe mobil în cele 2 sloturi
  const [manualSlotA, setManualSlotA] = useState<0 | 2 | null>(null);
  const [manualSlotB, setManualSlotB] = useState<1 | 3 | null>(null);

  // Monitorizare scroll nativ cuantificată pe cele 5 milestone-uri discrete (-1, 0, 1, 2, 3)
  // Elimină complet re-randările sub-pixel pe monitoare 4K (reduce re-randările cu >99%)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) {
            ticking = false;
            return;
          }
          const rect = containerRef.current.getBoundingClientRect();
          const totalScrollable = rect.height - window.innerHeight;
          if (totalScrollable > 0) {
            const currentScroll = -rect.top;
            const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));

            // Revelare banner intro la derulare minimă
            if (progress > 0.04 && !isHeroBannerRevealedRef.current) {
              isHeroBannerRevealedRef.current = true;
              setIsHeroBannerRevealed(true);
            }

            // Calcul praguri discrete:
            // -1: Hero Extins (0 .. 0.08)
            //  0: Porsche Cayenne GTS (0.08 .. 0.30)
            //  1: Mercedes-AMG GT (0.30 .. 0.53)
            //  2: Audi RS7 Sportback (0.53 .. 0.76)
            //  3: Audi R8 V10 (>= 0.76)
            let newPhase: -1 | 0 | 1 | 2 | 3 = -1;
            if (progress >= 0.76) {
              newPhase = 3;
            } else if (progress >= 0.53) {
              newPhase = 2;
            } else if (progress >= 0.30) {
              newPhase = 1;
            } else if (progress >= 0.08) {
              newPhase = 0;
            }

            if (newPhase !== currentPhaseRef.current) {
              currentPhaseRef.current = newPhase;
              setScrollPhase(newPhase);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pornire automată a clipului video (autonome & muted conform politicilor WebKit/Blink)
  useEffect(() => {
    const vid = videoRef.current;
    if (vid && !videoLoadError) {
      vid.defaultMuted = true;
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [videoLoadError]);

  // IntersectionObserver: Pune pe pauză videoclipul când e derulat în afara ecranului (>230vh)
  // pentru a elibera resursele GPU/VRAM pe monitoare 4K, fără a reseta poziția cadrului.
  useEffect(() => {
    const vid = videoRef.current;
    const container = containerRef.current;
    if (!vid || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Dacă s-a reîntors în ecran și videoclipul nu a atins finalul, reluăm redarea
            if (!isVideoEndedRef.current && vid.paused && !vid.ended) {
              const playPromise = vid.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          } else {
            // A părăsit ecranul: pauză pentru a economisi pipeline-ul GPU pe 4K
            if (!vid.paused) {
              vid.pause();
            }
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Apariția cardului de sus după câteva secunde (la ~2.6s când s-au deschis ușile și camera a pătruns în hală)
  const handleTimeUpdate = useCallback(() => {
    if (isHeroBannerRevealedRef.current) return;
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.currentTime >= 2.6) {
      isHeroBannerRevealedRef.current = true;
      setIsHeroBannerRevealed(true);
    }
  }, []);

  // Siguranță: dacă utilizatorul nu așteaptă sau video-ul nu emite timeupdate, revelăm bannerul după max 3s
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isHeroBannerRevealedRef.current) {
        isHeroBannerRevealedRef.current = true;
        setIsHeroBannerRevealed(true);
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  // Finalizare video: pauză curată și ancorare pe imaginea cadrului final fără seek periculos
  const handleVideoEnded = useCallback(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.pause();
    }
    isVideoEndedRef.current = true;
    setIsVideoEnded(true);
  }, []);

  // =========================================================================
  // LOGICĂ SCROLLYTELLING: CALCULE DE PRIM-PLAN ȘI CAMERA PAN (COMPACT 230vh)
  // =========================================================================
  const isHeroActive = scrollPhase < 0;
  const isCompactHeader = !isHeroActive;
  const primPlanIndex = scrollPhase;

  let cameraPan = 'translate3d(0, 0, 0) scale(1)';
  if (scrollPhase === 0) {
    cameraPan = 'translate3d(2.5vw, -1vh, 0) scale(1.04)';
  } else if (scrollPhase === 1) {
    cameraPan = 'translate3d(-2.5vw, -1vh, 0) scale(1.04)';
  } else if (scrollPhase === 2) {
    cameraPan = 'translate3d(2.5vw, 1.5vh, 0) scale(1.05)';
  } else if (scrollPhase === 3) {
    cameraPan = 'translate3d(-2.5vw, 1.5vh, 0) scale(1.05)';
  }

  // Calcul mașină activă în Slot A (Card 0 / Card 2) și Slot B (Card 1 / Card 3) pe mobil
  const activeSlotACar: 0 | 2 = manualSlotA ?? (scrollPhase >= 2 ? 2 : 0);
  const activeSlotBCar: 1 | 3 = manualSlotB ?? (scrollPhase >= 3 ? 3 : 1);

  // Derulare lină către un vehicul specific
  const scrollToVehicle = (index: number) => {
    if (index === 0 || index === 2) setManualSlotA(index as 0 | 2);
    if (index === 1 || index === 3) setManualSlotB(index as 1 | 3);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const total = rect.height - window.innerHeight;
    const milestones = [0.16, 0.38, 0.61, 0.84];
    const targetProgress = milestones[index] ?? 0;
    window.scrollTo({
      top: containerTop + total * targetProgress,
      behavior: 'smooth',
    });
  };

  const handleExploreDMS = useCallback(() => {
    onExploreClick?.();
    if (typeof document !== 'undefined') {
      const el = document.getElementById(targetSectionId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [onExploreClick, targetSectionId]);

  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top, behavior: 'smooth' });
    }
    const vid = videoRef.current;
    if (vid) {
      isVideoEndedRef.current = false;
      setIsVideoEnded(false);
      vid.currentTime = 0;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  // Helper pentru randarea unui card în cadranul său dedicat (Desktop sau Mobil)
  // Contrast WCAG AAA Garantat: Carduri Dark Luxury cu text alb pur și accente aurii
  const renderVehicleQuadrantCard = (
    vehicleIndex: number,
    quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    isMobileSlot = false
  ) => {
    const vehicle = VEHICLES[vehicleIndex];
    if (!vehicle) return null;

    const isVisible = isMobileSlot ? true : scrollPhase >= vehicleIndex;
    const isPrimPlan = primPlanIndex === vehicleIndex;
    const isLeft = quadrant.includes('left');
    const isBottom = quadrant.includes('bottom');

    // ─── Status-color token map ────────────────────────────────────────────────
    // Calculat O SINGURĂ DATĂ per render; elimină 4 ternare repetate în JSX.
    // backdrop-blur-md EXCLUSIV pe cardul activ (isPrimPlan) — economisire GPU
    // compositor pe 4K per TICKET-VID-03.
    const statusStyles = isPrimPlan
      ? ({
          emerald: {
            card: 'opacity-100 scale-100 translate-x-0 translate-y-0 bg-[#141418]/95 backdrop-blur-md border-emerald-500/90 ring-2 ring-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.25)] z-30',
            text: 'text-emerald-400',
            dot:  'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]',
          },
          sky: {
            card: 'opacity-100 scale-100 translate-x-0 translate-y-0 bg-[#141418]/95 backdrop-blur-md border-sky-500/90 ring-2 ring-sky-500/30 shadow-[0_0_35px_rgba(14,165,233,0.25)] z-30',
            text: 'text-sky-400',
            dot:  'bg-sky-400 animate-pulse shadow-[0_0_10px_#38bdf8]',
          },
          amber: {
            card: 'opacity-100 scale-100 translate-x-0 translate-y-0 bg-[#141418]/95 backdrop-blur-md border-amber-500/90 ring-2 ring-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.25)] z-30',
            text: 'text-amber-400',
            dot:  'bg-amber-400 animate-pulse shadow-[0_0_10px_#fbbf24]',
          },
        } as const)[vehicle.statusColor]
      : {
          card: 'opacity-90 scale-[0.98] translate-x-0 translate-y-0 bg-[#121215]/95 border-white/15 shadow-xl z-20 hover:opacity-100 hover:scale-[0.99] hover:border-white/30',
          text: 'text-zinc-300',
          dot:  'bg-zinc-500',
        };

    // ─── Visibility entry-animation classes ───────────────────────────────────
    const visibilityClasses = !isVisible
      ? `opacity-0 pointer-events-none scale-95 ${isLeft ? '-translate-x-10' : 'translate-x-10'} ${isBottom ? 'translate-y-5' : '-translate-y-4'}`
      : statusStyles.card;

    return (
      <div
        key={vehicle.id}
        onClick={() => isPrimPlan ? handleExploreDMS() : scrollToVehicle(vehicleIndex)}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          transition: 'transform 550ms cubic-bezier(0.16,1,0.3,1), opacity 450ms cubic-bezier(0.16,1,0.3,1), box-shadow 350ms ease-out, border-color 250ms ease-out',
        }}
        className={`group relative rounded-2xl cursor-pointer border shadow-2xl ${
          isMobileSlot ? 'p-2.5 sm:p-3' : 'p-3 sm:p-3.5'
        } ${visibilityClasses}`}
      >
        {/* Header Card: Status & Preț cu indicator Mock Data * (Alb pur pe fundal Dark Luxury) */}
        <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-white/10">
          <span className={`flex items-center gap-1.5 font-bold ${statusStyles.text}`}>
            <span className={`h-2 w-2 rounded-full ${statusStyles.dot}`} />
            {vehicle.statusBadge}
          </span>
          <span className="text-white font-mono font-black text-xs sm:text-sm tracking-tight drop-shadow-sm">
            {vehicle.priceGross}
          </span>
        </div>

        {/* Corp Card Orizontal: Fotografie Realistă + Detalii Funcționalitate */}
        <div className="flex flex-row gap-2.5 sm:gap-3 items-center">
          {/* Fotografie Mașină */}
          <div className="relative w-20 sm:w-24 aspect-[16/10] shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 group-hover:border-amber-400/60 transition-colors">
            <img
              src={vehicle.imageUrl}
              alt={vehicle.vehicleName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Informații & Titlu Funcționalitate DMS */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-amber-400 transition-colors drop-shadow-sm">
              {vehicle.vehicleName}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate mb-1">
              {vehicle.trim}
            </div>

            {/* Inset Tile Întunecat de Mare Contrast pentru Funcționalitate DMS */}
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-300">
                {React.createElement(vehicle.Icon, { className: 'h-3.5 w-3.5 text-amber-400 shrink-0' })}
                <span className="truncate">{vehicle.featureTitle}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-300 mt-0.5 truncate leading-tight">
                {vehicle.featureSub}
              </div>
            </div>
          </div>
        </div>

        {/* Subsol Card: Telemetrie & Link DMS */}
        <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-1">
          <div className="flex flex-wrap gap-1 text-[9px] sm:text-[10px] font-mono">
            {vehicle.telemetry.slice(0, isMobileSlot ? 2 : 3).map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-200 flex items-center gap-1"
              >
                <span className="text-zinc-400 font-semibold">{t.label}:</span>
                <span className="font-extrabold text-white">{t.value}</span>
              </span>
            ))}
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold transition-colors ${
              isPrimPlan ? 'text-amber-400 group-hover:text-amber-300' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <span>{isPrimPlan ? 'Vezi în DMS' : 'Alege Vehicul'}</span>
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={containerRef}
      id="showroom-video-intro"
      aria-label="ParcOS Showroom Digital Autonom"
      className="relative w-full bg-[#09090b] text-white select-none font-sans"
      style={{ height: '230vh' }}
    >
      {/* Cadrul STICKY care rămâne fixat pe ecran pe durata derulării */}
      <div 
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between"
        style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      >
        
        {/* =====================================================================
            LAYER 1: CLIPUL VIDEO 4K CU EFECT DE CAMERA PAN STANGA / DREAPTA
            - Izolare pe strat GPU dedicat (translate3d, backface-visibility: hidden)
            - Crossfade fără cusur către cadrul final când videoclipul se termină
            - Zero seek destructiv la final (elimină riscul de reset la uși închise)
           ===================================================================== */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            transform: cameraPan,
            transition: 'transform 850ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {!videoLoadError ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                preload="auto"
                poster={posterSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                onError={() => {
                  setVideoLoadError(true);
                  setIsHeroBannerRevealed(true);
                }}
                className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                  isVideoEnded ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>

              {/* Cadru final de siguranță: devine vizibil la terminarea video-ului,
                  asigurând că pe monitoare mari 4K browserul nu resetează niciodată la frame 0 */}
              <img
                src={lastFrameSrc}
                alt="ParcOS Showroom Digital"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
                  isVideoEnded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
              />
            </>
          ) : (
            <div className="relative h-full w-full">
              <img
                src={lastFrameSrc || posterSrc}
                alt="ParcOS Showroom Pavilion"
                className="h-full w-full object-cover object-center"
              />
            </div>
          )}

          {/* Gradient atmosferic aerisit pentru lizibilitate optimă și reflexie daylight */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40" />
        </div>

        {/* =====================================================================
            LAYER 1.5: FASCICULE HOLOGRAFICE DISCRETE PE CAROSERIA VEHICULELOR
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {VEHICLES.map((vehicle, index) => {
            const isVisibleOnScreen = scrollPhase >= index;
            const isPrimPlan = primPlanIndex === index;

            if (!isVisibleOnScreen) return null;

            return (
              <div
                key={vehicle.id}
                style={{
                  left: vehicle.anchorX,
                  top: vehicle.anchorY,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute transition-all duration-700 ${
                  isPrimPlan ? 'opacity-100 scale-100' : 'opacity-40 scale-75'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 border-white/80 ${
                    vehicle.statusColor === 'emerald'
                      ? 'bg-emerald-400 shadow-[0_0_20px_#34d399]'
                      : vehicle.statusColor === 'sky'
                      ? 'bg-sky-400 shadow-[0_0_20px_#38bdf8]'
                      : 'bg-amber-400 shadow-[0_0_20px_#fbbf24]'
                  } animate-ping`}
                />
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    vehicle.statusColor === 'emerald'
                      ? 'bg-emerald-400'
                      : vehicle.statusColor === 'sky'
                      ? 'bg-sky-400'
                      : 'bg-amber-400'
                  } absolute inset-0 m-auto`}
                />
                {isPrimPlan && (
                  <div
                    className="absolute -top-16 left-1/2 w-0.5 h-16 bg-gradient-to-t from-amber-400/80 to-transparent"
                    style={{ transform: 'translateX(-50%)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* =====================================================================
            LAYER 2: CARDUL PRINCIPAL RESTRÂNS + SLIDER SELECTOR VEHICULE
            - Cardul principal NU dispare la scroll, ci se micșorează elegant.
            - Sliderul selector de vehicule apare direct sub cardul principal.
            - Contrast maxim Dark Luxury: text-white pe suprafață sticlă #121215.
           ===================================================================== */}
        <div className="relative z-30 pt-2 sm:pt-3 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full transition-all duration-500">
          
          {/* CARDUL PRINCIPAL */}
          <div
            style={{
              opacity: isHeroBannerRevealed ? 1 : 0,
              transform: !isHeroBannerRevealed
                ? 'translateY(-20px) scale(0.96)'
                : 'translateY(0) scale(1)',
              transition:
                'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), max-width 500ms cubic-bezier(0.16, 1, 0.3, 1), padding 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
            }}
            className={`mx-auto bg-[#121215]/95 backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isCompactHeader
                ? 'rounded-2xl px-3 py-2 sm:px-5 sm:py-2.5 max-w-4xl shadow-xl'
                : 'rounded-3xl px-4 py-3.5 sm:px-8 sm:py-5 max-w-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] text-center'
            }`}
          >
            {!isCompactHeader ? (
              /* STAREA HERO EXTINSĂ (La începutul paginii) */
              <div className="transition-all duration-400 ease-out">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/15 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-zinc-200 mb-2 sm:mb-2.5">
                  <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-400" />
                  <span>Showroom Digital Autonom • ParcOS Cloud DMS</span>
                </div>

                <h1 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  „Nu mai pierde clienți în mesageria platformelor auto.{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                    Transformă-ți parcul într-un showroom digital autonom.”
                  </span>
                </h1>

                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                  De la scanarea CIV în 1.8 secunde și e-Factura în SPV, până la contract generat
                  și încasarea garanției de rezervare prin Stripe direct pe WhatsApp.
                </p>

                <div className="mt-3 sm:mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleExploreDMS}
                    className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  >
                    <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950" />
                    <span>Explorează Sistemul DMS</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReplay}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-400" />
                    <span>Reia Animația</span>
                  </button>
                </div>

                {/* Indicator discret de scroll */}
                <div className="mt-2.5 sm:mt-3.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-400 font-mono font-medium animate-bounce">
                  <span>Derulează pentru a explora mașinile din showroom</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            ) : (
              /* STAREA RESTRÂNSĂ: Cardul rămâne pe ecran, micșorat și elegant */
              <div className="flex items-center justify-between gap-3 transition-all duration-400 ease-out">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-amber-300 shrink-0">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span className="hidden sm:inline">ParcOS Showroom</span>
                    <span className="sm:hidden">ParcOS</span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-white truncate drop-shadow-sm">
                      „Transformă-ți parcul într-un showroom digital autonom”
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium truncate hidden md:block">
                      Scanare CIV 1.8s • e-Factura SPV • Garanție Rezervare Stripe
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExploreDMS}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-950 font-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Explorează DMS</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReplay}
                    title="Reia de la început"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/15 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SLIDER SELECTOR SUB CARDUL PRINCIPAL (apare lin când cardul principal este restrâns) */}
          <div
            style={{
              opacity: isCompactHeader ? 1 : 0,
              transform: isCompactHeader ? 'translateY(0)' : 'translateY(-8px)',
              maxHeight: isCompactHeader ? '60px' : '0px',
              transition:
                'opacity 450ms ease-out, transform 450ms ease-out, max-height 450ms ease-out',
              willChange: 'transform, opacity',
            }}
            className={`mt-1.5 sm:mt-2 mx-auto max-w-4xl overflow-hidden pointer-events-auto ${
              !isCompactHeader ? 'pointer-events-none' : ''
            }`}
          >
            <div className="bg-[#121215]/95 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 shadow-xl flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="hidden sm:inline text-zinc-400">Selector Showroom:</span>
              </div>

              {/* Slider selector cu butoane directe către cele 4 mașini */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {VEHICLES.map((v, idx) => {
                  const isCurrent = (primPlanIndex >= 0 ? primPlanIndex : 0) === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => scrollToVehicle(idx)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black ring-2 ring-amber-400'
                          : 'bg-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.12] border border-white/10'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isCurrent ? 'bg-slate-950' : 'bg-zinc-400'
                        }`}
                      />
                      <span>{v.shortName}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[10px] text-zinc-400 font-mono hidden lg:inline shrink-0">
                Click pentru focalizare
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            LAYER 3: RANDARE CARDURI VEHICULE
            - Desktop (lg:grid): 4 cadrane distincte în grilă 2x2 fără suprapunere.
            - Mobil (lg:hidden): 2 sloturi suprapuse (Slot A: Card 0 + 2; Slot B: Card 1 + 3)
              cu selector dedicat și poziționare fixă la scroll.
           ===================================================================== */}
        <div className="relative z-30 max-w-[1560px] mx-auto w-full px-3 sm:px-6 lg:px-8 pb-3 flex-1 flex flex-col justify-between">
          
          <div className="w-full flex-1 flex flex-col justify-center my-auto py-1 sm:py-2">
            {/* 🖥️ VARIANTA A: DESKTOP (lg:grid) — 4 CADRANE SEPARATE */}
            <div
              className={`hidden lg:grid w-full grid-cols-2 gap-3.5 lg:gap-x-12 xl:gap-x-20 2xl:gap-x-28 lg:gap-y-3.5 items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                !isCompactHeader
                  ? 'opacity-0 translate-y-10 pointer-events-none scale-[0.97]'
                  : 'opacity-100 translate-y-0 pointer-events-auto scale-100'
              }`}
            >
              {/* 1. Sus în Stânga: Porsche Cayenne GTS Coupé */}
              <div className="col-start-1 row-start-1 w-full">
                {renderVehicleQuadrantCard(0, 'top-left')}
              </div>

              {/* 2. Sus în Dreapta: Mercedes-AMG GT Coupé */}
              <div className="col-start-2 row-start-1 w-full">
                {renderVehicleQuadrantCard(1, 'top-right')}
              </div>

              {/* 3. Sub cel din stânga sus: Audi RS7 Sportback */}
              <div className="col-start-1 row-start-2 w-full">
                {renderVehicleQuadrantCard(2, 'bottom-left')}
              </div>

              {/* 4. În Dreapta Jos: Audi R8 V10 Performance */}
              <div className="col-start-2 row-start-2 w-full">
                {renderVehicleQuadrantCard(3, 'bottom-right')}
              </div>
            </div>

            {/* 📱 VARIANTA B: MOBIL / TABLETĂ (< lg) — 2 SLOTURI SUPRAPUSE CU COMUTARE */}
            <div
              className={`grid lg:hidden w-full grid-cols-1 gap-2.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                !isCompactHeader
                  ? 'opacity-0 translate-y-10 pointer-events-none scale-[0.97]'
                  : 'opacity-100 translate-y-0 pointer-events-auto scale-100'
              }`}
            >
              {/* SLOTUL A (Card 0: Porsche Cayenne & Card 2: Audi RS7) */}
              <div
                style={{
                  transition: 'opacity 500ms ease, transform 500ms ease',
                }}
                className={`w-full transition-all duration-500 ${
                  !isCompactHeader
                    ? 'opacity-0 pointer-events-none translate-y-3'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {/* Micro-Selector Slot A pe Mobil */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-mono text-zinc-300 bg-[#121215]/95 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/15 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-zinc-400">Flanc Stâng:</span>
                    <strong className="text-white font-black">{VEHICLES[activeSlotACar]?.shortName}</strong>
                  </span>
                  <div className="flex items-center gap-1 bg-[#121215]/95 backdrop-blur-sm border border-white/15 p-0.5 rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualSlotA(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeSlotACar === 0
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {VEHICLES[0].shortName}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualSlotA(2);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeSlotACar === 2
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {VEHICLES[2].shortName}
                    </button>
                  </div>
                </div>

                {/* Randare Card Activ în Slotul A */}
                {renderVehicleQuadrantCard(activeSlotACar, 'top-left', true)}
              </div>

              {/* SLOTUL B (Card 1: Mercedes-AMG & Card 3: Audi R8) */}
              <div
                style={{
                  transition: 'opacity 500ms ease, transform 500ms ease',
                }}
                className={`w-full transition-all duration-500 ${
                  scrollPhase < 1
                    ? 'opacity-0 pointer-events-none translate-y-3'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {/* Micro-Selector Slot B pe Mobil */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-mono text-zinc-300 bg-[#121215]/95 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/15 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-zinc-400">Flanc Drept:</span>
                    <strong className="text-white font-black">{VEHICLES[activeSlotBCar]?.shortName}</strong>
                  </span>
                  <div className="flex items-center gap-1 bg-[#121215]/95 backdrop-blur-sm border border-white/15 p-0.5 rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualSlotB(1);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeSlotBCar === 1
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {VEHICLES[1].shortName}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualSlotB(3);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeSlotBCar === 3
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {VEHICLES[3].shortName}
                    </button>
                  </div>
                </div>

                {/* Randare Card Activ în Slotul B */}
                {renderVehicleQuadrantCard(activeSlotBCar, 'top-right', true)}
              </div>

            </div>
          </div>

          {/* ================= SUBSOL CONFORMITATE FISCALĂ & PREZENTARE DEMO ================= */}
          <div className="mt-1.5 rounded-xl bg-[#121215]/95 border border-white/15 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md shadow-2xl flex flex-col gap-1 text-[11px] sm:text-xs text-zinc-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                <span>
                  Conformitate Fiscală România: <strong className="text-white font-bold">TVA Deductibil / Marjă Art. 312</strong> •{' '}
                  <strong className="text-white font-bold">Garanție de Rezervare Stripe</strong> •{' '}
                  <strong className="text-white font-bold">ANAF e-Factura SPV</strong>
                </span>
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-400 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                <span className="font-semibold text-zinc-200">4 Vehicule Sincronizate în Hală</span>
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-white/10 pt-1 leading-snug">
              * Modelele, fotografiile și prețurile afișate reprezintă date demonstrative (mock data) pentru simularea showroom-ului digital autonom. ParcOS este furnizat exclusiv ca platformă software Cloud DMS + Showroom Digital Autonom pentru dealeri și parcuri auto.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ShowroomVideoIntro;
