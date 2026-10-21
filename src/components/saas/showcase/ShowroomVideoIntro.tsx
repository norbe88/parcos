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
 * Cele 4 vehicule reprezentate în showroom:
 * - Card 0: BMW X1 (Flanc Stâng / Top-Left)
 * - Card 1: Mercedes-Benz C-Class (Flanc Drept / Top-Right)
 * - Card 2: Audi A6 Matrix (Flanc Stâng / Bottom-Left)
 * - Card 3: Audi A4 Cockpit (Flanc Drept / Bottom-Right)
 *
 * Dispunere:
 * - Pe Desktop: 4 cadrane distincte (2x2 grid fără suprapunere).
 * - Pe Mobil: Card 3 se suprapune peste Card 1 în Slot A; Card 4 se suprapune peste Card 2 în Slot B.
 *   Ambele sloturi rămân fixe pe ecran la scroll, cu micro-selector tactil dedicat.
 */
const VEHICLES: ShowroomVehicle[] = [
  {
    id: 'bmw-x1-01',
    shortName: 'BMW X1',
    vehicleName: 'BMW X1 xDrive Sport-Line',
    trim: 'Panoramic • 2.0d • 2015 • 179.000 km',
    priceGross: '15.990 € (TVA 21% inclus)',
    statusBadge: 'În Stoc • Livrare Imediată',
    statusColor: 'sky',
    imageUrl:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
    anchorX: '28%',
    anchorY: '60%',
    featureTitle: 'CIV Scanat cu AI (1.8s) • e-Factura SPV',
    featureSub: '19/19 câmpuri RAR extrase instant în sistem',
    Icon: Scan,
    telemetry: [
      { label: 'CIV RAR', value: '19/19 Validate' },
      { label: 'ANAF e-Factura', value: 'XML SPV' },
      { label: 'Garanție Rezervare', value: '500 €' },
    ],
  },
  {
    id: 'merc-c220-02',
    shortName: 'Mercedes C-Class',
    vehicleName: 'Mercedes-Benz C 220d AMG Line',
    trim: 'Plafon Panoramic • Full LED • 2016 • 168.000 km',
    priceGross: '19.490 € (TVA 21% inclus)',
    statusBadge: 'Rezervare Online • WhatsApp',
    statusColor: 'emerald',
    imageUrl:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
    anchorX: '72%',
    anchorY: '60%',
    featureTitle: 'Ofertă Trimisă • Plată Stripe Link',
    featureSub: 'Garanție de Rezervare confirmată prin Apple Pay (Stripe)',
    Icon: MessageSquare,
    telemetry: [
      { label: 'Plată Stripe', value: '750 € Încasat' },
      { label: 'Dosar WhatsApp', value: 'PDF Auto' },
      { label: 'Status Rezervare', value: 'Blocat 48h' },
    ],
  },
  {
    id: 'audi-a6-03',
    shortName: 'Audi A6 Matrix',
    vehicleName: 'Audi A6 3.0 TDI S-Line Matrix',
    trim: 'Jante R20 • Geamuri Duble • 2017 • 142.000 km',
    priceGross: '21.900 € (TVA 21% inclus)',
    statusBadge: 'Verificat Tehnic • Raport RAR',
    statusColor: 'amber',
    imageUrl:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80',
    anchorX: '34%',
    anchorY: '68%',
    featureTitle: 'Contract Vânzare & Înstrăinare DRPCIV',
    featureSub: 'Fișă înstrăinare DRPCIV + Proces Verbal predare',
    Icon: FileText,
    telemetry: [
      { label: 'Contract Vânzare', value: 'PDF Auto' },
      { label: 'Înstrăinare DRPCIV', value: 'Anexa 2' },
      { label: 'TVA Deductibil', value: '21% Reversibil' },
    ],
  },
  {
    id: 'audi-a4-04',
    shortName: 'Audi A4 Cockpit',
    vehicleName: 'Audi A4 2.0 TDI Virtual Cockpit',
    trim: 'Matrix • Jante R19 • 2018 • 154.000 km',
    priceGross: '18.750 € (TVA 21% inclus)',
    statusBadge: 'Sincronizat Live • Multi-Canal',
    statusColor: 'emerald',
    imageUrl:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80',
    anchorX: '66%',
    anchorY: '68%',
    featureTitle: 'Sincronizat pe OLX & Autovit în 0.42s',
    featureSub: 'Protecție activă împotriva dublei vânzări',
    Icon: Zap,
    telemetry: [
      { label: 'Sincronizare', value: 'Autovit, OLX' },
      { label: 'Timp Replicare', value: '0.42s' },
      { label: 'Alertă Stoc', value: 'Activă 24/7' },
    ],
  },
];

export const ShowroomVideoIntro: React.FC<ShowroomVideoIntroProps> = ({
  videoSrc = '/videos/parcos-showroom-intro.mp4',
  posterSrc = '/images/parcos-showroom-hall.jpg',
  targetSectionId = 'demo-ocr',
  onExploreClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [isHeroBannerRevealed, setIsHeroBannerRevealed] = useState<boolean>(false);

  // Stare pentru selecția manuală a cardului activ pe mobil în cele 2 sloturi
  const [manualSlotA, setManualSlotA] = useState<0 | 2 | null>(null);
  const [manualSlotB, setManualSlotB] = useState<1 | 3 | null>(null);

  // Monitorizare scroll nativ prin requestAnimationFrame (60-120 FPS fluid)
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
            setScrollProgress(progress);
            if (progress > 0.04 && !isHeroBannerRevealed) {
              setIsHeroBannerRevealed(true);
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
  }, [isHeroBannerRevealed]);

  // Pornire automată a clipului video
  useEffect(() => {
    const vid = videoRef.current;
    if (vid && !videoLoadError) {
      vid.defaultMuted = true;
      vid.muted = true;
      vid.play().catch(() => {});
    }
  }, [videoLoadError]);

  // Apariția cardului de sus după câteva secunde (la ~2.6s când s-au deschis ușile și camera a pătruns în hală)
  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.currentTime >= 2.6 && !isHeroBannerRevealed) {
      setIsHeroBannerRevealed(true);
    }
  }, [isHeroBannerRevealed]);

  // Siguranță: dacă utilizatorul nu așteaptă sau video-ul nu emite timeupdate, revelăm bannerul după max 3s
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsHeroBannerRevealed(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  // =========================================================================
  // LOGICĂ SCROLLYTELLING: CALCULE DE PRIM-PLAN ȘI CAMERA PAN
  // =========================================================================
  const isHeroActive = scrollProgress < 0.08;

  let primPlanIndex = -1;
  let cameraPan = 'translate3d(0, 0, 0) scale(1)';

  if (scrollProgress >= 0.08 && scrollProgress < 0.28) {
    primPlanIndex = 0; // BMW X1 (Prim-plan)
    cameraPan = 'translate3d(2.5vw, -1vh, 0) scale(1.04)';
  } else if (scrollProgress >= 0.28 && scrollProgress < 0.50) {
    primPlanIndex = 1; // Mercedes-Benz (Prim-plan)
    cameraPan = 'translate3d(-2.5vw, -1vh, 0) scale(1.04)';
  } else if (scrollProgress >= 0.50 && scrollProgress < 0.72) {
    primPlanIndex = 2; // Audi A6 (Prim-plan)
    cameraPan = 'translate3d(2.5vw, 1.5vh, 0) scale(1.05)';
  } else if (scrollProgress >= 0.72) {
    primPlanIndex = 3; // Audi A4 (Prim-plan)
    cameraPan = 'translate3d(-2.5vw, 1.5vh, 0) scale(1.05)';
  }

  // Calcul mașină activă în Slot A (Card 1 / Card 3) și Slot B (Card 2 / Card 4) pe mobil
  const activeSlotACar: 0 | 2 = manualSlotA ?? (scrollProgress >= 0.50 ? 2 : 0);
  const activeSlotBCar: 1 | 3 = manualSlotB ?? (scrollProgress >= 0.72 ? 3 : 1);

  // Derulare lină către un vehicul specific
  const scrollToVehicle = (index: number) => {
    if (index === 0 || index === 2) setManualSlotA(index as 0 | 2);
    if (index === 1 || index === 3) setManualSlotB(index as 1 | 3);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const total = rect.height - window.innerHeight;
    const milestones = [0.18, 0.39, 0.61, 0.86];
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
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
  }, []);

  // Helper pentru randarea unui card în cadranul său dedicat (Desktop sau Mobil)
  const renderVehicleQuadrantCard = (
    vehicleIndex: number,
    quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    isMobileSlot = false
  ) => {
    const vehicle = VEHICLES[vehicleIndex];
    if (!vehicle) return null;

    // Pe desktop verificăm pragul de scroll individual
    // Pe mobil, afișajul e garantat de containerul slotului activ
    const visibilityThresholds = [0.08, 0.28, 0.50, 0.72];
    const isVisible = isMobileSlot ? true : scrollProgress >= visibilityThresholds[vehicleIndex];
    const isPrimPlan = primPlanIndex === vehicleIndex;

    const isLeft = quadrant.includes('left');
    const isBottom = quadrant.includes('bottom');

    return (
      <div
        key={vehicle.id}
        onClick={() => {
          if (!isPrimPlan) {
            scrollToVehicle(vehicleIndex);
          } else {
            handleExploreDMS();
          }
        }}
        style={{
          transition:
            'transform 650ms cubic-bezier(0.16, 1, 0.3, 1), opacity 550ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 450ms ease-out, border-color 350ms ease-out',
        }}
        className={`group relative rounded-2xl transition-all duration-500 cursor-pointer border shadow-lg ${
          isMobileSlot ? 'p-2.5 sm:p-3' : 'p-3 sm:p-3.5'
        } ${
          !isVisible
            ? `opacity-0 pointer-events-none scale-95 ${
                isLeft ? '-translate-x-10' : 'translate-x-10'
              } ${isBottom ? 'translate-y-5' : '-translate-y-4'}`
            : isPrimPlan
            ? vehicle.statusColor === 'emerald'
              ? 'opacity-100 translate-x-0 translate-y-0 scale-100 bg-white/95 backdrop-blur-2xl border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] z-30'
              : vehicle.statusColor === 'sky'
              ? 'opacity-100 translate-x-0 translate-y-0 scale-100 bg-white/95 backdrop-blur-2xl border-sky-500 ring-2 ring-sky-500/30 shadow-[0_20px_50px_-10px_rgba(14,165,233,0.3)] z-30'
              : 'opacity-100 translate-x-0 translate-y-0 scale-100 bg-white/95 backdrop-blur-2xl border-amber-500 ring-2 ring-amber-500/30 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.3)] z-30'
            : 'opacity-90 translate-x-0 translate-y-0 scale-[0.98] bg-white/90 backdrop-blur-xl border-slate-200/90 shadow-md z-20 hover:opacity-100 hover:scale-[0.99] hover:border-slate-300'
        }`}
      >
        {/* Header Card: Status & Preț */}
        <div className="flex items-center justify-between text-xs mb-2 pb-1 border-b border-slate-200/80">
          <span
            className={`flex items-center gap-1.5 font-bold ${
              isPrimPlan
                ? vehicle.statusColor === 'emerald'
                  ? 'text-emerald-700'
                  : vehicle.statusColor === 'sky'
                  ? 'text-sky-700'
                  : 'text-amber-700'
                : 'text-slate-600'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isPrimPlan
                  ? vehicle.statusColor === 'emerald'
                    ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
                    : vehicle.statusColor === 'sky'
                    ? 'bg-sky-500 animate-pulse shadow-[0_0_8px_#0ea5e9]'
                    : 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]'
                  : 'bg-slate-400'
              }`}
            />
            {vehicle.statusBadge}
          </span>
          <span className="text-slate-950 font-black text-xs sm:text-sm">
            {vehicle.priceGross}
          </span>
        </div>

        {/* Corp Card Orizontal: Fotografie + Detalii Funcționalitate */}
        <div className="flex flex-row gap-2.5 sm:gap-3 items-center">
          {/* Fotografie Mașină */}
          <div className="relative w-20 sm:w-24 aspect-[16/10] shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-amber-500/50 transition-colors">
            <img
              src={vehicle.imageUrl}
              alt={vehicle.vehicleName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
          </div>

          {/* Informații & Titlu Funcționalitate DMS */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-slate-950 truncate group-hover:text-amber-600 transition-colors">
              {vehicle.vehicleName}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate mb-1">
              {vehicle.trim}
            </div>

            <div className="p-1.5 rounded-lg bg-slate-50/90 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-700">
                {React.createElement(vehicle.Icon, {
                  className: 'h-3.5 w-3.5 text-amber-600 shrink-0',
                })}
                <span className="truncate">{vehicle.featureTitle}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-700 mt-0.5 truncate">
                {vehicle.featureSub}
              </div>
            </div>
          </div>
        </div>

        {/* Subsol Card: Telemetrie & Link DMS */}
        <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1">
          <div className="flex flex-wrap gap-1 text-[9px] sm:text-[10px] font-mono text-slate-700">
            {vehicle.telemetry.slice(0, isMobileSlot ? 2 : 3).map((t, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-1 shadow-2xs"
              >
                <span className="text-slate-600 font-bold text-[9px] sm:text-[10px]">{t.label}:</span>
                <span className="font-black text-slate-950">{t.value}</span>
              </span>
            ))}
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${
              isPrimPlan ? 'text-amber-700 group-hover:text-amber-800' : 'text-slate-700 hover:text-slate-950'
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
      aria-label="ParcOS Showroom Digital Autonom"
      className="relative w-full bg-slate-950 text-slate-900 select-none font-sans"
      style={{ height: '380vh' }}
    >
      {/* Cadrul STICKY care rămâne fixat pe ecran pe durata derulării */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        
        {/* =====================================================================
            LAYER 1: CLIPUL VIDEO 4K CU EFECT DE CAMERA PAN STANGA / DREAPTA
           ===================================================================== */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            transform: cameraPan,
            transition: 'transform 850ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {!videoLoadError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                const vid = videoRef.current;
                if (vid && vid.duration) {
                  vid.currentTime = Math.max(0, vid.duration - 0.05);
                  vid.pause();
                }
              }}
              onError={() => {
                setVideoLoadError(true);
                setIsHeroBannerRevealed(true);
              }}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="relative h-full w-full">
              {posterSrc && (
                <img
                  src={posterSrc}
                  alt="ParcOS Showroom Pavilion"
                  className="h-full w-full object-cover object-center"
                />
              )}
            </div>
          )}

          {/* Gradient atmosferic aerisit pentru lizibilitate optimă și reflexie daylight */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/30" />
        </div>

        {/* =====================================================================
            LAYER 1.5: FASCICULE HOLOGRAFICE DISCRETE PE CAROSERIA VEHICULELOR
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {VEHICLES.map((vehicle, index) => {
            const visibilityThresholds = [0.08, 0.28, 0.50, 0.72];
            const isVisibleOnScreen = scrollProgress >= visibilityThresholds[index];
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
            LAYER 2: HEADER (Cardul Hero Temporizat SAU Bara HUD Compactă)
           ===================================================================== */}
        <div className="relative z-30 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {isHeroActive ? (
            /* Mod 1: Hero Principal — apare doar după ~2.6s (deschiderea ușilor) */
            <div
              style={{
                opacity: isHeroBannerRevealed ? 1 : 0,
                transform: isHeroBannerRevealed ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.96)',
                transition:
                  'opacity 1000ms cubic-bezier(0.16, 1, 0.3, 1), transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="mx-auto rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] px-5 py-4 sm:px-10 sm:py-7 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/80 px-3.5 py-1 text-xs font-semibold text-slate-700 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Showroom Digital Autonom • ParcOS Cloud DMS</span>
              </div>

              <h1 className="text-lg sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                „Nu mai pierde clienți în mesaje de pe OLX.{' '}
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
                  Transformă-ți parcul într-un showroom digital autonom.”
                </span>
              </h1>

              <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                De la scanarea CIV în 1.8 secunde și e-Factura în SPV, până la contract generat
                și încasarea garanției de rezervare prin Stripe direct pe WhatsApp.
              </p>

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleExploreDMS}
                  className="group inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <Car className="h-4 w-4 text-slate-950" />
                  <span>Explorează Sistemul DMS</span>
                  <ArrowRight className="h-4 w-4 text-slate-950 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                  <span>Reia Animația</span>
                </button>
              </div>

              {/* Indicator discret de scroll */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 font-mono font-medium animate-bounce">
                <span>Derulează pentru a explora mașinile din showroom</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          ) : (
            /* Mod 2: Compact Top HUD Bar la scroll */
            <div className="mx-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-400">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700 truncate">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden md:inline text-slate-500">Showroom:</span>
                <span className="text-slate-950 font-extrabold truncate">{VEHICLES[primPlanIndex]?.vehicleName}</span>
              </div>

              {/* Selector direct între cele 4 vehicule */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {VEHICLES.map((v, idx) => {
                  const isCurrent = primPlanIndex === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => scrollToVehicle(idx)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {v.shortName}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExploreDMS}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-semibold transition-colors shrink-0"
              >
                <span>Sari la DMS</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* =====================================================================
            LAYER 3: RANDARE CARDURI VEHICULE
            - Desktop (lg:grid): 4 cadrane distincte în grilă 2x2 fără suprapunere.
            - Mobil (lg:hidden): 2 sloturi suprapuse (Slot A: Card 1 + 3; Slot B: Card 2 + 4)
              cu selector dedicat și poziționare fixă la scroll.
           ===================================================================== */}
        <div className="relative z-30 max-w-[1560px] mx-auto w-full px-3 sm:px-6 lg:px-8 pb-3 flex-1 flex flex-col justify-between">
          
          <div className="w-full flex-1 flex flex-col justify-center my-auto py-1 sm:py-2">
            {!isHeroActive && (
              <>
                {/* 🖥️ VARIANTA A: DESKTOP (lg:grid) — 4 CADRANE SEPARATE */}
                <div className="hidden lg:grid w-full grid-cols-2 gap-3.5 lg:gap-x-12 xl:gap-x-20 2xl:gap-x-28 lg:gap-y-3.5 items-center">
                  
                  {/* 1. Sus în Stânga: BMW X1 */}
                  <div className="col-start-1 row-start-1 w-full">
                    {renderVehicleQuadrantCard(0, 'top-left')}
                  </div>

                  {/* 2. Sus în Dreapta: Mercedes-Benz C-Class */}
                  <div className="col-start-2 row-start-1 w-full">
                    {renderVehicleQuadrantCard(1, 'top-right')}
                  </div>

                  {/* 3. Sub cel din stânga sus (Stânga Jos): Audi A6 Matrix */}
                  <div className="col-start-1 row-start-2 w-full">
                    {renderVehicleQuadrantCard(2, 'bottom-left')}
                  </div>

                  {/* 4. În Dreapta Jos: Audi A4 Virtual Cockpit */}
                  <div className="col-start-2 row-start-2 w-full">
                    {renderVehicleQuadrantCard(3, 'bottom-right')}
                  </div>

                </div>

                {/* 📱 VARIANTA B: MOBIL / TABLETĂ (< lg) — 2 SLOTURI SUPRAPUSE CU COMUTARE */}
                <div className="grid lg:hidden w-full grid-cols-1 gap-2.5">
                  
                  {/* SLOTUL A (Card 1: BMW X1 & Card 3: Audi A6 suprapuse în același loc) */}
                  <div
                    style={{
                      transition: 'opacity 500ms ease, transform 500ms ease',
                    }}
                    className={`w-full transition-all duration-500 ${
                      scrollProgress < 0.08
                        ? 'opacity-0 pointer-events-none translate-y-3'
                        : 'opacity-100 translate-y-0'
                    }`}
                  >
                    {/* Micro-Selector Slot A pe Mobil */}
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="text-[10px] font-mono text-slate-700 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-slate-200/90 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Flanc Stâng:</span>
                        <strong className="text-slate-950 font-black">{VEHICLES[activeSlotACar]?.shortName}</strong>
                      </span>
                      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200/90 p-0.5 rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualSlotA(0);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            activeSlotACar === 0
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          BMW X1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualSlotA(2);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            activeSlotACar === 2
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          Audi A6
                        </button>
                      </div>
                    </div>

                    {/* Randare Card Activ în Slotul A */}
                    {renderVehicleQuadrantCard(activeSlotACar, 'top-left', true)}
                  </div>

                  {/* SLOTUL B (Card 2: Mercedes & Card 4: Audi A4 suprapuse în același loc) */}
                  <div
                    style={{
                      transition: 'opacity 500ms ease, transform 500ms ease',
                    }}
                    className={`w-full transition-all duration-500 ${
                      scrollProgress < 0.28
                        ? 'opacity-0 pointer-events-none translate-y-3'
                        : 'opacity-100 translate-y-0'
                    }`}
                  >
                    {/* Micro-Selector Slot B pe Mobil */}
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="text-[10px] font-mono text-slate-700 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-slate-200/90 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Flanc Drept:</span>
                        <strong className="text-slate-950 font-black">{VEHICLES[activeSlotBCar]?.shortName}</strong>
                      </span>
                      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200/90 p-0.5 rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualSlotB(1);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            activeSlotBCar === 1
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          Mercedes
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualSlotB(3);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            activeSlotBCar === 3
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          Audi A4
                        </button>
                      </div>
                    </div>

                    {/* Randare Card Activ în Slotul B */}
                    {renderVehicleQuadrantCard(activeSlotBCar, 'top-right', true)}
                  </div>

                </div>
              </>
            )}
          </div>

          {/* ================= SUBSOL CONFORMITATE FISCALĂ ROMÂNIA ================= */}
          <div className="mt-2 rounded-xl bg-white/95 border border-slate-200/90 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-xs text-slate-700 shadow-md">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
              <span>
                Standard Fiscal România: <strong className="text-slate-900 font-bold">TVA 21% Deductibil</strong> •{' '}
                <strong className="text-slate-900 font-bold">Garanție de Rezervare Stripe</strong> •{' '}
                <strong className="text-slate-900 font-bold">ANAF e-Factura SPV</strong>
              </span>
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
              <span className="font-medium text-slate-700">4 Vehicule Active în Showroom</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ShowroomVideoIntro;
