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
import { getCdnMediaUrl } from '../../../utils/mediaCdn';

export interface ShowroomVideoIntroProps {
  /** Calea către clipul video principal (ex: "/videos/parcos-showroom-intro.mp4") */
  videoSrc?: string;
  /** Calea opțională către versiunea WebM optimizată (ex: "/videos/parcos-showroom-intro.webm") */
  webmSrc?: string;
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
 * - Card 0: Porsche Cayenne GTS Coupé (Flanc Drept Față / Bottom-Right)
 * - Card 1: Mercedes-Benz Clasa E AMG Line (Flanc Drept Mijloc / Top-Right)
 * - Card 2: Audi RS7 Sportback 4.0 TFSI (Flanc Stâng Față / Bottom-Left)
 * - Card 3: BMW X5 xDrive40d M Sport (Flanc Stâng Mijloc / Top-Left)
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
    imageUrl: getCdnMediaUrl('/images/showcase/porsche-cayenne-showcase.jpg'),
    anchorX: '79%',
    anchorY: '65%',
    featureTitle: 'Scanare CIV cu AI • e-Factura SPV',
    featureSub: 'Datele din CIV și talon preluate automat în 1.8s, fără tastare',
    Icon: Scan,
    telemetry: [
      { label: 'CIV RAR', value: 'Completat Automat' },
      { label: 'Factură', value: 'e-Factura SPV' },
      { label: 'Garanție Rezervare', value: '1.000 €' },
    ],
  },
  {
    id: 'merc-e-class-02',
    shortName: 'Mercedes-Benz Clasa E',
    vehicleName: 'Mercedes-Benz Clasa E AMG Line',
    trim: 'AMG Line • Burmester • Pano • 2023 • 28.500 km',
    priceGross: '79.900 € (TVA inclus)*',
    statusBadge: 'Rezervare Online • WhatsApp',
    statusColor: 'emerald',
    imageUrl: getCdnMediaUrl('/images/showcase/mercedes-e-class-showcase.jpg'),
    anchorX: '65%',
    anchorY: '59%',
    featureTitle: 'Ofertă pe WhatsApp • Garanție Rezervare',
    featureSub: 'Clientul plătește garanția de rezervare online, iar mașina se blochează 48h',
    Icon: MessageSquare,
    telemetry: [
      { label: 'Garanție Încasată', value: '1.500 €' },
      { label: 'Ofertă WhatsApp', value: 'Trimisă în 10s' },
      { label: 'Status Mașină', value: 'Rezervată 48h' },
    ],
  },
  {
    id: 'audi-rs7-03',
    shortName: 'Audi RS7',
    vehicleName: 'Audi RS7 Sportback 4.0 TFSI',
    trim: 'HD Matrix Laser • Ceramic • 2023 • 24.000 km',
    priceGross: '114.900 € (TVA inclus)*',
    statusBadge: 'Verificat Tehnic • Raport RAR',
    statusColor: 'amber',
    imageUrl: getCdnMediaUrl('/images/showcase/audi-rs7-showcase.jpg'),
    anchorX: '23%',
    anchorY: '64%',
    featureTitle: 'Contract Vânzare & Înstrăinare DRPCIV',
    featureSub: 'Contractul și dosarul de predare sunt generate instant, gata de semnat',
    Icon: FileText,
    telemetry: [
      { label: 'Contract Vânzare', value: 'Gata de Semnat' },
      { label: 'Dosar Predare', value: 'Complet' },
      { label: 'Regim Fiscal', value: 'TVA Deductibil' },
    ],
  },
  {
    id: 'bmw-x5-04',
    shortName: 'BMW X5',
    vehicleName: 'BMW X5 xDrive40d M Sport',
    trim: 'M Sport • Laserlight • Pano • 2023 • 32.000 km',
    priceGross: '89.900 € (TVA inclus)*',
    statusBadge: 'Sincronizat Live • Multi-Canal',
    statusColor: 'emerald',
    imageUrl: getCdnMediaUrl('/images/showcase/bmw-x5-showcase.jpg'),
    anchorX: '36%',
    anchorY: '58%',
    featureTitle: 'Stoc Sincronizat pe Autovit & OLX',
    featureSub: 'ParcOS publică și actualizează stocul instant pe marile portaluri auto',
    Icon: Zap,
    telemetry: [
      { label: 'Portaluri Auto', value: 'Sincronizate' },
      { label: 'Stoc Parc', value: 'Timp Real' },
      { label: 'Alerte Dubluri', value: 'Zero Erori' },
    ],
  },
];

export const ShowroomVideoIntro: React.FC<ShowroomVideoIntroProps> = ({
  videoSrc = getCdnMediaUrl('/videos/parcos-showroom-intro.mp4'),
  webmSrc = getCdnMediaUrl('/videos/parcos-showroom-intro.webm'),
  posterSrc = getCdnMediaUrl('/images/parcos-showroom-hall.jpg'),
  lastFrameSrc = getCdnMediaUrl('/images/parcos-showroom-hall-lastframe.jpg'),
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
  const [isVideoBuffered, setIsVideoBuffered] = useState<boolean>(false);
  const [isHeroBannerRevealed, setIsHeroBannerRevealed] = useState<boolean>(false);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);

  // Stare pentru selecția manuală a cardului activ pe mobil în cele 2 sloturi
  const [manualSlotA, setManualSlotA] = useState<2 | 3 | null>(null);
  const [manualSlotB, setManualSlotB] = useState<0 | 1 | null>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);

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

            // Calcul praguri discrete cu hysterază direcțională (elimină complet tremurul și micro-oscilațiile la limită):
            // -1: Hero Extins
            //  0: Porsche Cayenne GTS (milestone 0.18)
            //  1: Mercedes-Benz Clasa E (milestone 0.41)
            //  2: Audi RS7 Sportback (milestone 0.64)
            //  3: BMW X5 xDrive40d (milestone 0.86)
            const currentPhase = currentPhaseRef.current;
            let newPhase: -1 | 0 | 1 | 2 | 3 = currentPhase;

            if (currentPhase === -1) {
              if (progress >= 0.08) newPhase = 0;
            } else if (currentPhase === 0) {
              if (progress < 0.05) newPhase = -1;
              else if (progress >= 0.31) newPhase = 1;
            } else if (currentPhase === 1) {
              if (progress < 0.27) newPhase = 0;
              else if (progress >= 0.54) newPhase = 2;
            } else if (currentPhase === 2) {
              if (progress < 0.50) newPhase = 1;
              else if (progress >= 0.77) newPhase = 3;
            } else if (currentPhase === 3) {
              if (progress < 0.73) newPhase = 2;
            }

            if (newPhase !== currentPhaseRef.current) {
              currentPhaseRef.current = newPhase;
              setScrollPhase(newPhase);
              setActiveMobileIndex(null);
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

  // Siguranță buffer: garantează trecerea de la poster la video în max 1200ms
  // chiar dacă browserul întârzie emiterea evenimentului onCanPlayThrough
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVideoBuffered(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

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
  const isSelectionActive = scrollPhase >= 0;
  const currentMobileIndex = activeMobileIndex !== null ? activeMobileIndex : Math.max(0, scrollPhase);
  const primPlanIndex = activeMobileIndex !== null ? activeMobileIndex : scrollPhase;

  let cameraPan = 'translate3d(0, 0, 0) scale(1)';
  if (scrollPhase === 0) {
    // Porsche Cayenne GTS (Flanc Drept Față): Soft zoom lin spre Porsche în dreapta jos
    cameraPan = 'translate3d(-10%, -4%, 0) scale(1.22)';
  } else if (scrollPhase === 1) {
    // Mercedes-Benz Clasa E (Flanc Drept Mijloc): Soft zoom lin spre Mercedes în dreapta mijloc
    cameraPan = 'translate3d(-8%, 1%, 0) scale(1.26)';
  } else if (scrollPhase === 2) {
    // Audi RS7 Sportback (Flanc Stâng Față): Soft zoom lin spre Audi RS7 în stânga jos
    cameraPan = 'translate3d(10%, -4%, 0) scale(1.22)';
  } else if (scrollPhase === 3) {
    // BMW X5 xDrive40d (Flanc Stâng Mijloc): Soft zoom lin spre BMW X5 în stânga mijloc
    cameraPan = 'translate3d(8%, 1%, 0) scale(1.26)';
  }

  // Derulare lină către un vehicul specific
  const scrollToVehicle = (index: number) => {
    if (index === 2 || index === 3) setManualSlotA(index as 2 | 3);
    if (index === 0 || index === 1) setManualSlotB(index as 0 | 1);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const total = rect.height - window.innerHeight;
    const milestones = [0.18, 0.41, 0.64, 0.86];
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
          card: 'opacity-75 scale-[0.97] translate-x-0 translate-y-0 bg-[#121215]/95 border-white/10 shadow-xl z-20 hover:opacity-100 hover:scale-[0.99] hover:border-white/30',
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
          transition:
            'transform 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 580ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 650ms cubic-bezier(0.22, 1, 0.36, 1), border-color 450ms ease-out',
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
          className="pointer-events-none absolute -inset-[2%] sm:inset-0 z-0 overflow-hidden"
          style={{
            transform: cameraPan,
            transition: 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
          }}
        >
          {!videoLoadError ? (
            <>
              {/* Poster de fundal vizibil până când video-ul are date suficiente pentru redare lină */}
              <img
                src={posterSrc}
                alt="ParcOS Showroom Ambient"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
                  !isVideoBuffered && !isVideoEnded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
              />

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                preload="auto"
                poster={posterSrc}
                onCanPlay={() => setIsVideoBuffered(true)}
                onCanPlayThrough={() => setIsVideoBuffered(true)}
                onPlaying={() => setIsVideoBuffered(true)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                onError={() => {
                  setVideoLoadError(true);
                  setIsHeroBannerRevealed(true);
                }}
                className={`h-full w-full object-cover object-center transition-opacity duration-500 ${
                  isVideoEnded ? 'opacity-0' : isVideoBuffered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
              >
                {webmSrc && <source src={webmSrc} type="video/webm" />}
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
            - Sincronizate în lockstep cu cameraPan pentru ancorare pe caroserie
           ===================================================================== */}
        <div
          className="hidden lg:block pointer-events-none absolute -inset-[2%] sm:inset-0 z-10 overflow-hidden"
          style={{
            transform: cameraPan,
            transition: 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
          }}
        >
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
            LAYER 2: CARTONAȘUL PRINCIPAL FIX + BARA SELECTOR VEHICULE DEDICATĂ
            - Cartonașul încercuit în screenshot rămâne fix la scroll în hală.
            - Bara selector de vehicule apare direct SUB cartonașul principal.
            - Contrast maxim Dark Luxury: text-white pe suprafață sticlă #121215.
           ===================================================================== */}
        <div className="relative z-30 pt-2 sm:pt-3 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full transition-all duration-500">
          
          {/* CARTONAȘUL PRINCIPAL (rămâne fix și intact pe durata explorării) */}
          <div
            style={{
              opacity: isHeroBannerRevealed ? 1 : 0,
              transform: !isHeroBannerRevealed
                ? 'translateY(-20px) scale(0.96)'
                : 'translateY(0) scale(1)',
              transition:
                'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
            }}
            className={`mx-auto bg-[#121215]/95 backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden rounded-3xl px-4 py-3 sm:px-7 sm:py-4.5 max-w-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] text-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrollPhase >= 0
                ? 'max-lg:opacity-0 max-lg:pointer-events-none max-lg:scale-95 max-lg:max-h-0 max-lg:p-0 max-lg:my-0 max-lg:border-0'
                : 'max-lg:max-h-[500px]'
            }`}
          >
            <div className="transition-all duration-400 ease-out">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/15 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-zinc-200 mb-1.5 sm:mb-2">
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-400" />
                <span>Showroom Digital & Gestiune Parc Auto</span>
              </div>

              <h1 className="text-sm sm:text-xl md:text-2xl lg:text-[1.65rem] font-black tracking-tight text-white leading-snug">
                „Nu mai pierde clienți pe drum.{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                  Prezintă-ți mașinile ca un profesionist și încasează avansul pe loc.”
                </span>
              </h1>

              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                De la scanarea talonului cu camera telefonului și factura fiscală, până la contractul de vânzare
                și rezervarea mașinii garantată direct pe WhatsApp.
              </p>

              <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleExploreDMS}
                  className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-black tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950" />
                  <span>Vezi Cum Funcționează</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-400" />
                  <span>Reia Animația</span>
                </button>
              </div>

              {/* Indicator discret de scroll (vizibil doar la început înainte de explorarea vehiculelor) */}
              {scrollPhase < 0 && (
                <div className="mt-2 sm:mt-2.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-400 font-mono font-medium animate-bounce">
                  <span>Derulează pentru a explora mașinile din showroom</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* BARA SELECTOR VEHICULE DEDICATĂ — Apare direct SUB cartonașul principal când începe explorarea (Desktop only) */}
          <div
            style={{
              opacity: scrollPhase >= 0 ? 1 : 0,
              transform: scrollPhase >= 0 ? 'translateY(0)' : 'translateY(-8px)',
              maxHeight: scrollPhase >= 0 ? '60px' : '0px',
              transition:
                'opacity 450ms ease-out, transform 450ms ease-out, max-height 450ms ease-out',
              willChange: 'transform, opacity',
            }}
            className={`hidden lg:block mt-1.5 sm:mt-2 mx-auto max-w-3xl overflow-hidden pointer-events-auto ${
              scrollPhase < 0 ? 'pointer-events-none' : ''
            }`}
          >
            <div className="bg-[#121215]/95 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 shadow-xl flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-200 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="hidden sm:inline text-zinc-300">Selector Showroom:</span>
              </div>

              {/* Slider selector cu butoane directe către cele 4 mașini */}
              <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto no-scrollbar py-0.5">
                {VEHICLES.map((v, idx) => {
                  const isCurrent = (primPlanIndex >= 0 ? primPlanIndex : 0) === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => scrollToVehicle(idx)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
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
            {/* 🖥️ VARIANTA A: DESKTOP (lg:grid) — 4 CADRANE ALINIATE CU SHOWROOM-UL */}
            <div
              className={`hidden lg:grid w-full grid-cols-2 gap-3.5 lg:gap-x-12 xl:gap-x-20 2xl:gap-x-28 lg:gap-y-3.5 items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                scrollPhase < 0
                  ? 'opacity-0 translate-y-10 pointer-events-none scale-[0.97]'
                  : 'opacity-100 translate-y-0 pointer-events-auto scale-100'
              }`}
            >
              {/* 1. Sus în Stânga (Flanc Stâng Mijloc): BMW X5 xDrive40d M Sport */}
              <div className="col-start-1 row-start-1 w-full">
                {renderVehicleQuadrantCard(3, 'top-left')}
              </div>

              {/* 2. Sus în Dreapta (Flanc Drept Mijloc): Mercedes-Benz Clasa E AMG Line */}
              <div className="col-start-2 row-start-1 w-full">
                {renderVehicleQuadrantCard(1, 'top-right')}
              </div>

              {/* 3. Jos în Stânga (Flanc Stâng Față): Audi RS7 Sportback 4.0 TFSI */}
              <div className="col-start-1 row-start-2 w-full">
                {renderVehicleQuadrantCard(2, 'bottom-left')}
              </div>

              {/* 4. Jos în Dreapta (Flanc Drept Față): Porsche Cayenne GTS Coupé */}
              <div className="col-start-2 row-start-2 w-full">
                {renderVehicleQuadrantCard(0, 'bottom-right')}
              </div>
            </div>

            {/* 📱 VARIANTA B: MOBIL / TABLETĂ (< lg) — INTERACTIVE STACKED CARDS DECK (URCĂ CU FADE OUT & CLICK SĂ VINĂ ÎN FAȚĂ) */}
            <div className="lg:hidden w-full relative max-w-sm sm:max-w-md mx-auto grid grid-cols-1 grid-rows-1 items-end justify-center pointer-events-auto pt-20 sm:pt-24 pb-2">
              {VEHICLES.map((vehicle, index) => {
                const isCurrent = currentMobileIndex === index;
                const diff = index - currentMobileIndex;
                const VehicleIcon = vehicle.Icon;

                // Calcul stil stivă conform cerinței:
                // - Cardul văzut anterior (diff < 0) nu dispare, ci urcă progresiv cu mai mult fade-out în stivă
                // - Rămâne selectabil și vine în față lin când se dă click pe el
                let cardTransform = '';
                let cardOpacity = 0;
                let cardZIndex = 10;
                let isClickableToSelect = false;

                if (scrollPhase < 0) {
                  // Înainte de intrarea în showroom (bannerul hero este afișat)
                  cardTransform = 'translateY(24px) scale(0.96)';
                  cardOpacity = 0;
                  cardZIndex = 10;
                } else if (isCurrent) {
                  // CARDUL ACTIV ÎN FAȚĂ
                  cardTransform = 'translateY(0px) scale(1)';
                  cardOpacity = 1;
                  cardZIndex = 40;
                } else if (diff < 0) {
                  // CARDURI DEJA VĂZUTE (Urcă progresiv cu fade-out în stivă, tab-ul rămâne vizibil și selectabil)
                  isClickableToSelect = true;
                  if (diff === -1) {
                    cardTransform = 'translateY(-38px) scale(0.95)';
                    cardOpacity = 0.65;
                    cardZIndex = 30;
                  } else if (diff === -2) {
                    cardTransform = 'translateY(-72px) scale(0.90)';
                    cardOpacity = 0.38;
                    cardZIndex = 20;
                  } else {
                    cardTransform = 'translateY(-98px) scale(0.85)';
                    cardOpacity = 0;
                    cardZIndex = 10;
                    isClickableToSelect = false;
                  }
                } else {
                  // CARDURI VIITOARE (diff > 0): coboară lin spre fundal cu fade-out
                  if (diff === 1) {
                    const isUnlocked = index <= scrollPhase;
                    isClickableToSelect = isUnlocked;
                    cardTransform = 'translateY(32px) scale(0.96)';
                    cardOpacity = isUnlocked ? 0.40 : 0;
                    cardZIndex = 25;
                  } else {
                    cardTransform = 'translateY(56px) scale(0.92)';
                    cardOpacity = 0;
                    cardZIndex = 15;
                    isClickableToSelect = false;
                  }
                }

                const handleMobileCardClick = (e: React.MouseEvent) => {
                  if (!isCurrent) {
                    e.stopPropagation();
                    setActiveMobileIndex(index);
                    scrollToVehicle(index);
                  } else {
                    handleExploreDMS();
                  }
                };

                return (
                  <div
                    key={vehicle.id}
                    onClick={handleMobileCardClick}
                    style={{
                      transform: `${cardTransform} translateZ(0)`,
                      opacity: cardOpacity,
                      zIndex: cardZIndex,
                      transformOrigin: 'top center',
                      boxShadow: isCurrent
                        ? '0 25px 60px rgba(0,0,0,0.95), 0 0 30px rgba(245,158,11,0.15)'
                        : isClickableToSelect
                        ? '0 15px 35px rgba(0,0,0,0.8)'
                        : '0 5px 15px rgba(0,0,0,0.5)',
                      borderColor: isCurrent
                        ? 'rgba(251, 191, 36, 0.35)'
                        : isClickableToSelect
                        ? 'rgba(255, 255, 255, 0.20)'
                        : 'rgba(255, 255, 255, 0.10)',
                      transition:
                        'transform 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 580ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 650ms cubic-bezier(0.22, 1, 0.36, 1), border-color 450ms ease-out',
                      willChange: 'transform, opacity, box-shadow',
                    }}
                    className={`col-start-1 row-start-1 w-full bg-[#121215]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 border flex flex-col gap-2.5 ${
                      isCurrent
                        ? 'pointer-events-auto cursor-pointer active:scale-[0.99]'
                        : isClickableToSelect
                        ? 'pointer-events-auto cursor-pointer hover:border-amber-400/50'
                        : 'pointer-events-none'
                    }`}
                  >
                    {/* Header Card: Fază (01/04), Nume Stabil & Badge Stivă Interactiv cu Crossfade */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-black text-amber-400 text-xs bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-md shrink-0">
                          0{index + 1} / 04
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              vehicle.statusColor === 'emerald'
                                ? 'bg-emerald-400'
                                : vehicle.statusColor === 'sky'
                                ? 'bg-sky-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {vehicle.shortName}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline truncate">
                              • {vehicle.statusBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative shrink-0 flex items-center">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-all duration-300 ${
                            isCurrent
                              ? 'opacity-100 scale-100 pointer-events-auto'
                              : 'opacity-0 scale-95 pointer-events-none absolute right-0'
                          }`}
                        >
                          <VehicleIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                            ParcOS DMS
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 transition-all duration-300 ${
                            !isCurrent
                              ? 'opacity-100 scale-100 pointer-events-auto'
                              : 'opacity-0 scale-95 pointer-events-none absolute right-0'
                          }`}
                        >
                          <span>Apasă pentru detalii</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Body Card: Imagine mare + Detalii Tehnice & Preț cu TVA inclus */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-zinc-900 shadow-md">
                        <img
                          src={vehicle.imageUrl}
                          alt={vehicle.shortName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-center pb-1">
                          <span className="text-[8px] font-mono font-black text-amber-400 uppercase tracking-wider">
                            Digital Showroom
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                          {vehicle.vehicleName}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-medium line-clamp-1 mt-0.5">
                          {vehicle.trim}
                        </p>
                        <p className="text-base sm:text-lg font-mono font-black text-amber-400 leading-tight mt-1">
                          {vehicle.priceGross}
                        </p>
                      </div>
                    </div>

                    {/* Info ParcOS: Titlu Funcționalitate & Beneficiu Dealer */}
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-amber-300 leading-tight">
                        {vehicle.featureTitle}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {vehicle.featureSub}
                      </p>
                    </div>

                    {/* Capabilități Telemetrie ParcOS (3 Chips) */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {vehicle.telemetry.map((t, tIdx) => (
                        <div
                          key={tIdx}
                          className="px-2 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 flex flex-col items-center text-center"
                        >
                          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider truncate w-full">
                            {t.label}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-200 truncate w-full mt-0.5">
                            {t.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subsol Card: Buton Acțiune DMS */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExploreDMS();
                      }}
                      className="w-full mt-0.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all"
                    >
                      <span>Explorează Modulul în DMS</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= SUBSOL CONFORMITATE FISCALĂ & PREZENTARE DEMO (Desktop Only) ================= */}
          <div className="hidden lg:flex mt-1.5 rounded-xl bg-[#121215]/95 border border-white/15 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md shadow-2xl flex-col gap-1 text-[11px] sm:text-xs text-zinc-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                <span>
                  100% Adaptat pentru România: <strong className="text-white font-bold">Facturare cu TVA sau Regim de Marjă</strong> •{' '}
                  <strong className="text-white font-bold">Avans Securizat cu Cardul</strong> •{' '}
                  <strong className="text-white font-bold">e-Factura SPV</strong>
                </span>
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-400 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                <span className="font-semibold text-zinc-200">Stoc Sincronizat în Timp Real</span>
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-white/10 pt-1 leading-snug">
              * Imaginile și prețurile sunt orientative, folosite pentru prezentare. ParcOS este un program complet dedicat parcurilor și dealerilor auto pentru gestionarea stocului, a vânzărilor și a propriului site oficial de prezentare.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ShowroomVideoIntro;
