import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car,
  ShieldCheck,
  Zap,
  Sparkles,
  FileText,
  MessageSquare,
  X,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export interface ShowroomGarageGateProps {
  /** Callback apelat la apăsarea butonului principal CTA [ Explorează Sistemul DMS ] */
  onExploreClick?: () => void;
  /** Callback opțional apelat când utilizatorul apasă pe [ Reia Animația ] */
  onReplay?: () => void;
  /** Timpul în milisecunde până la deschiderea automată a porții (default: 1500ms) */
  autoOpenDelayMs?: number;
  /** Dacă este true, ignoră sessionStorage la montare și afișează mereu secvența de intro */
  forceShowIntro?: boolean;
}

interface ShowroomVehicle {
  id: string;
  brand: string;
  model: string;
  trim: string;
  price: string;
  badgeText: string;
  statusTag: string;
  accentColor: 'amber' | 'emerald';
  PrimaryIcon: React.ElementType;
  SecondaryIcon: React.ElementType;
  telemetry: {
    label: string;
    value: string;
  }[];
  svgProfile: 'bmw-g60' | 'audi-a6' | 'mercedes-w206';
}

const SHOWROOM_VEHICLES: ShowroomVehicle[] = [
  {
    id: 'bmw-seria-5',
    brand: 'BMW',
    model: 'Seria 5',
    trim: '520d xDrive M-Sport • 2024 • 18.400 km',
    price: '54.900 €',
    badgeText: 'CIV Scanat cu AI (1.8s) • e-Factura Pregătită',
    statusTag: 'OCR + ANAF SPV Activ',
    accentColor: 'amber',
    PrimaryIcon: FileText,
    SecondaryIcon: Sparkles,
    telemetry: [
      { label: 'Serie Șasiu (VIN)', value: 'WBA51FJ090CP89214 (Verificat RAR)' },
      { label: 'Extracție Cărți (CIV)', value: '19/19 câmpuri • Acuitate 99.8%' },
      { label: 'XML ANAF e-Factura', value: 'Validat • Gata de transmitere' },
    ],
    svgProfile: 'bmw-g60',
  },
  {
    id: 'audi-a6',
    brand: 'Audi',
    model: 'A6',
    trim: '45 TFSI quattro S-Line • 2023 • 31.200 km',
    price: '48.500 €',
    badgeText: 'Ofertă WhatsApp Trimisă • Garanție Rezervare Încasată (Card/Stripe)',
    statusTag: 'Avans 500 € Încasat',
    accentColor: 'emerald',
    PrimaryIcon: MessageSquare,
    SecondaryIcon: ShieldCheck,
    telemetry: [
      { label: 'Link Plată Stripe', value: 'Achitat prin Apple Pay (500 €)' },
      { label: 'Dosar PDF WhatsApp', value: 'Deschis de client acum 4 min' },
      { label: 'Contract Rezervare', value: 'Generat & Semnat Digital' },
    ],
    svgProfile: 'audi-a6',
  },
  {
    id: 'mercedes-clasa-c',
    brand: 'Mercedes-Benz',
    model: 'Clasa C',
    trim: 'C 300de AMG Line • 2024 • 12.900 km',
    price: '51.200 €',
    badgeText: 'Sincronizat Automat pe OLX & Autovit • Status: Rezervat',
    statusTag: 'Status: Rezervat',
    accentColor: 'emerald',
    PrimaryIcon: Zap,
    SecondaryIcon: CheckCircle2,
    telemetry: [
      { label: 'Canale Sincronizate', value: 'Autovit.ro, OLX, Website Propriu' },
      { label: 'Protecție Dublă Vânzare', value: 'Anunțuri marcate automat REZERVAT' },
      { label: 'Timp Sincronizare API', value: '0.42 secunde' },
    ],
    svgProfile: 'mercedes-w206',
  },
];

const SESSION_STORAGE_KEY = 'parcos_gate_seen';
const SLAT_COUNT = 7;

export const ShowroomGarageGate: React.FC<ShowroomGarageGateProps> = ({
  onExploreClick,
  onReplay,
  autoOpenDelayMs = 1500,
  forceShowIntro = false,
}) => {
  const [gatePhase, setGatePhase] = useState<'closed' | 'opening' | 'open'>('closed');
  const [lightsIgnited, setLightsIgnited] = useState<boolean>(false);
  const [initProgress, setInitProgress] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('audi-a6');
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const triggerGateOpen = useCallback(() => {
    clearAllTimers();
    setInitProgress(100);
    setGatePhase((current) => {
      if (current === 'open' || current === 'opening') return current;
      return 'opening';
    });

    // Aprinderea secvențială a reflectoarelor din tavan
    const lightTimer = window.setTimeout(() => {
      setLightsIgnited(true);
    }, 120);

    // Finalizarea cursei ușii motorizate (1300ms)
    const openDoneTimer = window.setTimeout(() => {
      setGatePhase('open');
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {
        // Ignoră erorile de stocare în modurile private restricționate
      }
    }, 1300);

    timersRef.current.push(lightTimer, openDoneTimer);
  }, [clearAllTimers]);

  const handleSkipIntro = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllTimers();
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {
        // Fallback silențios
      }
      setInitProgress(100);
      setLightsIgnited(true);
      setGatePhase('open');
    },
    [clearAllTimers]
  );

  const handleReplay = useCallback(() => {
    clearAllTimers();
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Fallback silențios
    }

    setLightsIgnited(false);
    setInitProgress(0);
    setGatePhase('closed');
    onReplay?.();

    // Simulare progres LED în timpul celor 1.5s
    const step1 = window.setTimeout(() => setInitProgress(38), 250);
    const step2 = window.setTimeout(() => setInitProgress(76), 750);
    const step3 = window.setTimeout(() => setInitProgress(100), 1200);
    const openTimer = window.setTimeout(() => {
      triggerGateOpen();
    }, autoOpenDelayMs);

    timersRef.current.push(step1, step2, step3, openTimer);
  }, [autoOpenDelayMs, clearAllTimers, onReplay, triggerGateOpen]);

  useEffect(() => {
    let alreadySeen = false;
    if (!forceShowIntro) {
      try {
        alreadySeen = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
      } catch {
        alreadySeen = false;
      }
    }

    if (alreadySeen) {
      setInitProgress(100);
      setLightsIgnited(true);
      setGatePhase('open');
      return;
    }

    const step1 = window.setTimeout(() => setInitProgress(35), 200);
    const step2 = window.setTimeout(() => setInitProgress(72), 680);
    const step3 = window.setTimeout(() => setInitProgress(96), 1150);
    const autoTimer = window.setTimeout(() => {
      triggerGateOpen();
    }, autoOpenDelayMs);

    timersRef.current.push(step1, step2, step3, autoTimer);

    return () => clearAllTimers();
  }, [autoOpenDelayMs, clearAllTimers, forceShowIntro, triggerGateOpen]);

  const isGateRetracted = gatePhase === 'opening' || gatePhase === 'open';

  return (
    <section
      aria-label="ParcOS Digital Showroom Intro"
      className="relative min-h-screen w-full overflow-hidden bg-[#09090b] text-zinc-100 select-none font-sans flex flex-col justify-between"
    >
      {/* Keyframes native pentru efectele de lumină și scanare la 60 FPS */}
      <style>{`
        @keyframes parcosSpotlightPulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes parcosLaserScan {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.75; }
          80% { opacity: 0.75; }
          100% { transform: translateY(220%); opacity: 0; }
        }
        @keyframes parcosFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* =====================================================================
          BUTON DISCRET [ SARI INTRO ] (Colțul Dreapta-Sus)
         ===================================================================== */}
      {gatePhase !== 'open' && (
        <div className="fixed top-5 right-5 z-50">
          <button
            type="button"
            onClick={handleSkipIntro}
            className="group flex items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs font-medium tracking-wider uppercase text-zinc-300 border border-white/10 backdrop-blur-md transition-all duration-200 hover:border-amber-400/50 hover:text-white hover:bg-zinc-800/90 shadow-lg"
          >
            <span>[ Sari Intro ]</span>
            <X className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:rotate-90 group-hover:text-amber-400" />
          </button>
        </div>
      )}

      {/* =====================================================================
          FAZA 1 & 2: POARTA INDUSTRIALĂ DIN STICLĂ SECURIZATĂ FUMURIE
         ===================================================================== */}
      <div
        role="button"
        tabIndex={gatePhase === 'closed' ? 0 : -1}
        aria-hidden={isGateRetracted}
        onClick={() => gatePhase === 'closed' && triggerGateOpen()}
        onKeyDown={(e) => {
          if (gatePhase === 'closed' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            triggerGateOpen();
          }
        }}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`fixed inset-0 z-40 flex flex-col justify-between cursor-pointer transition-transform duration-[1300ms] will-change-transform ${
          isGateRetracted ? '-translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
      >
        {/* Șine laterale din aluminiu antracit */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-6 bg-gradient-to-r from-[#09090b] via-[#18181b] to-zinc-800/40 border-r border-white/10 z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-6 bg-gradient-to-l from-[#09090b] via-[#18181b] to-zinc-800/40 border-l border-white/10 z-20" />

        {/* Lamelele orizontale de sticlă securizată fumurie */}
        <div className="relative flex-1 flex flex-col w-full h-full">
          {Array.from({ length: SLAT_COUNT }).map((_, index) => (
            <div
              key={index}
              className="relative flex-1 w-full bg-[#09090b]/85 backdrop-blur-xl border-b-2 border-[#18181b] overflow-hidden flex items-center"
            >
              {/* Profil superior din aluminiu antracit pe fiecare lamelă */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-b from-[#18181b] to-transparent opacity-90" />

              {/* Reflexie diagonală subtilă pe sticla fumurie */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
                style={{
                  transform: `translateX(${(index - 3) * 12}%) skewX(-24deg)`,
                }}
              />

              {/* Marcaje tehnice industriale discrete pe lamele */}
              <div className="w-full px-6 sm:px-12 flex justify-between items-center text-[10px] font-mono tracking-widest text-zinc-600/70 uppercase">
                <span>SEC-PANEL // 0{index + 1}</span>
                <span className="hidden sm:inline">TEMPERED GLASS • ISO-9001 • ANTHRACITE AL-6063</span>
                <span>PARCOS-GATE</span>
              </div>

              {/* Profil inferior de îmbinare mecanică */}
              <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[#18181b] border-t border-white/10" />
            </div>
          ))}
        </div>

        {/* Garnitura inferioară a porții cu bandă LED de semnalizare chihlimbar */}
        <div className="relative z-20 h-5 w-full bg-[#18181b] border-t border-white/15 flex items-center justify-between px-6 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-12 rounded-full bg-amber-500/80 animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400/80">
              Senzor Optic Activ
            </span>
          </div>
          <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-1/2 bg-amber-400/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/80">
              Traction Lock: OK
            </span>
            <span className="h-1.5 w-12 rounded-full bg-emerald-400/80" />
          </div>
        </div>

        {/* PANOU DIGITAL LED CENTRAL (Pe poartă) */}
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-xl w-full rounded-2xl bg-zinc-900/95 border border-white/15 p-6 sm:p-8 shadow-[0_0_80px_-10px_rgba(245,158,11,0.28)] backdrop-blur-2xl">
            {/* Colțuri metalice decorative HUD */}
            <div className="absolute -top-px -left-px h-4 w-4 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
            <div className="absolute -top-px -right-px h-4 w-4 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
            <div className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
            <div className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400 font-semibold">
                  Secvență Automatizată Dealership OS
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                {initProgress}%
              </span>
            </div>

            {/* Textul LED cerut */}
            <div className="py-2 text-center">
              <p className="font-mono text-sm sm:text-base md:text-lg font-bold tracking-wide text-white animate-pulse">
                <span className="text-amber-400">[ PARCOS ]</span> Showroom Autonom v2.4{' '}
                <span className="text-zinc-500">•</span>{' '}
                <span className="text-emerald-400">Inițializare Sistem...</span>
              </p>
            </div>

            {/* Bară de progres motorizare */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-[#09090b] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300 ease-out"
                style={{ width: `${initProgress}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                ANAF e-Factura & RAR Sync
              </span>
              <span className="text-zinc-300 underline decoration-amber-400/50 underline-offset-4">
                Apasă oriunde pentru deschidere instantanee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FAZA 2 & 3: ILUMINARE REFLECTOARE LED DIN TAVAN (#f59e0b & Alb Cald)
         ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Rampa arhitecturală de lumini din tavan */}
        <div className="absolute top-0 inset-x-0 h-2 bg-[#18181b] border-b border-white/10 flex justify-around items-center px-12">
          {[0, 1, 2].map((lamp) => (
            <div key={lamp} className="relative flex flex-col items-center">
              <div
                className={`h-1.5 w-28 sm:w-44 rounded-b-full transition-all duration-700 ${
                  lightsIgnited
                    ? 'bg-amber-100 shadow-[0_0_35px_8px_rgba(245,158,11,0.85)]'
                    : 'bg-zinc-800 shadow-none'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Glow radial cald de chihlimbar (#f59e0b) și alb cald la aprinderea reflectoarelor */}
        <div
          style={{
            animation: lightsIgnited ? 'parcosSpotlightPulse 6s ease-in-out infinite' : 'none',
          }}
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full transition-opacity duration-1000 ${
            lightsIgnited ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center top, rgba(254, 243, 199, 0.22) 0%, rgba(245, 158, 11, 0.16) 38%, rgba(9, 9, 11, 0) 72%)',
            }}
          />
        </div>

        {/* Conuri individuale de lumină pentru cele 3 boxe din showroom */}
        <div
          className={`absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 transition-opacity duration-1000 delay-150 ${
            lightsIgnited ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {[0, 1, 2].map((col) => (
            <div
              key={col}
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.11) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 75%)',
              }}
            />
          ))}
        </div>

        {/* Podeaua showroom-ului din rășină epoxidică lucioasă cu grilă de perspectivă */}
        <div
          className="absolute bottom-0 inset-x-0 h-[42vh] border-t border-white/10"
          style={{
            background:
              'linear-gradient(to bottom, rgba(24, 24, 27, 0.35) 0%, rgba(9, 9, 11, 0.98) 100%)',
          }}
        >
          <div
            className="w-full h-full opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(245,158,11,0.12) 1px, transparent 1px)
              `,
              backgroundSize: '4rem 3rem',
              transform: 'perspective(500px) rotateX(60deg) scale(1.25)',
              transformOrigin: 'top center',
            }}
          />
        </div>
      </div>

      {/* =====================================================================
          FAZA 4: MESAJUL DE IMPACT COMERCIAL (Header / Banner)
         ===================================================================== */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6">
        <div
          className={`flex flex-col items-center text-center transition-all duration-1000 ease-out ${
            lightsIgnited
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Top Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/90 border border-white/10 px-4 py-1.5 mb-5 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              ParcOS Dealership OS • România
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Showroom Activ
            </span>
          </div>

          {/* Mesajul de Impact Comercial exact conform specificației */}
          <h1 className="max-w-4xl text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            „Nu mai pierde clienți în mesaje de pe OLX.{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Transformă-ți parcul într-un showroom digital autonom.”
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            De la scanarea cărții de identitate (CIV) în 1.8 secunde și emiterea automată a
            e-Facturii în SPV, până la încasarea avansului de rezervare prin Stripe direct pe
            WhatsApp.
          </p>

          {/* Butoanele de acțiune: [ Explorează Sistemul DMS ] și [ Reia Animația ] */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onExploreClick}
              className="group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-7 py-3.5 text-sm sm:text-base font-bold text-[#09090b] shadow-[0_0_35px_-5px_rgba(245,158,11,0.55)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_45px_0px_rgba(245,158,11,0.8)] active:scale-[0.99] cursor-pointer"
            >
              <Car className="h-5 w-5 text-[#09090b] transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>[ Explorează Sistemul DMS ]</span>
              <Zap className="h-4 w-4 text-[#09090b] fill-current" />
            </button>

            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white border border-white/10 hover:border-amber-400/40 px-4 py-3.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-amber-400" />
              <span>[ Reia Animația ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FAZA 3: INTERIORUL SHOWROOM-ULUI (3 Vehicule de Lux + HUD Cards)
         ===================================================================== */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 pt-2 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {SHOWROOM_VEHICLES.map((vehicle, index) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const PrimaryIcon = vehicle.PrimaryIcon;
            const SecondaryIcon = vehicle.SecondaryIcon;

            return (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
                className={`group relative flex flex-col justify-between rounded-2xl bg-zinc-900/90 border p-5 sm:p-6 backdrop-blur-xl transition-all duration-700 cursor-pointer ${
                  lightsIgnited
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                } ${
                  isSelected
                    ? 'border-amber-400/60 shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)] -translate-y-1'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                {/* Glow superior de reflector pe card */}
                <div
                  className={`pointer-events-none absolute -top-px inset-x-8 h-[2px] bg-gradient-to-r from-transparent ${
                    vehicle.accentColor === 'amber'
                      ? 'via-amber-400'
                      : 'via-emerald-400'
                  } to-transparent transition-opacity duration-500 ${
                    lightsIgnited ? 'opacity-90' : 'opacity-0'
                  }`}
                />

                {/* SECȚIUNEA 1: HUD BADGE FLOTANT INTERACTIV */}
                <div
                  style={{
                    animation: lightsIgnited
                      ? `parcosFloat ${3.8 + index * 0.4}s ease-in-out infinite`
                      : 'none',
                  }}
                  className="relative z-10 mb-4 rounded-xl bg-[#09090b]/95 border border-white/10 p-3.5 shadow-lg transition-colors group-hover:border-amber-400/40"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          vehicle.accentColor === 'amber'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      HUD LIVE TELEMETRY // 0{index + 1}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                        vehicle.accentColor === 'amber'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                      }`}
                    >
                      <SecondaryIcon className="h-3 w-3" />
                      {vehicle.statusTag}
                    </span>
                  </div>

                  {/* Textul Exact al Badge-ului Cerut */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        vehicle.accentColor === 'amber'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      <PrimaryIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {vehicle.badgeText}
                    </p>
                  </div>
                </div>

                {/* SECȚIUNEA 2: VIZUALIZARE SILUETĂ VEHICUL ÎN BOXA DE SHOWROOM */}
                <div className="relative my-3 py-6 px-2 rounded-xl bg-gradient-to-b from-[#18181b]/70 to-[#09090b] border border-white/5 overflow-hidden flex flex-col items-center justify-center">
                  {/* Fascicul laser AI de scanare pe primul vehicul (CIV Scanat cu AI) */}
                  {vehicle.id === 'bmw-seria-5' && lightsIgnited && (
                    <div
                      style={{
                        animation: 'parcosLaserScan 3.2s linear infinite',
                      }}
                      className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-amber-400/20 to-amber-400/5 border-b border-amber-400/50 z-10"
                    />
                  )}

                  {/* Silueta Arhitecturală SVG cu faruri LED care se aprind */}
                  <div className="relative w-full max-w-[280px] h-24 flex items-center justify-center">
                    <LuxuryVehicleSvg
                      profile={vehicle.svgProfile}
                      lightsOn={lightsIgnited}
                      accentColor={vehicle.accentColor}
                    />
                  </div>

                  {/* Reflexie caldă pe podeaua showroom-ului sub mașină */}
                  <div
                    className={`mt-2 h-2 w-4/5 rounded-full blur-md transition-opacity duration-1000 ${
                      lightsIgnited ? 'opacity-90' : 'opacity-0'
                    } ${
                      vehicle.accentColor === 'amber'
                        ? 'bg-amber-400/40'
                        : 'bg-emerald-400/40'
                    }`}
                  />

                  {/* Specificații Vehicul */}
                  <div className="mt-3 w-full flex items-baseline justify-between px-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Car className="h-4 w-4 text-amber-400" />
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {vehicle.brand}{' '}
                          <span className="text-amber-400">{vehicle.model}</span>
                        </h2>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{vehicle.trim}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold font-mono text-white">
                        {vehicle.price}
                      </span>
                      <span className="block text-[10px] font-mono text-emerald-400">
                        TVA Deductibil
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECȚIUNEA 3: TELEMETRIE AUTOMATIZARE PARCOS */}
                <div className="mt-2 space-y-2 border-t border-white/10 pt-3.5">
                  {vehicle.telemetry.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-400">{item.label}:</span>
                      <span className="font-mono text-zinc-200 font-medium text-right">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subsol Tehnic de Status Dealership */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-zinc-900/60 border border-white/10 px-5 py-3 text-xs text-zinc-400 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              Conformitate nativă România:{' '}
              <strong className="text-zinc-200">
                ANAF e-Factura, RAR Auto-Pass, Procese Verbale & Contracte Înstrăinare DRPCIV
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              Timp mediu listare: 45 sec
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Stripe & WhatsApp Business API: Conectat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SUB-COMPONENTĂ INTERNĂ: Siluete Vectoriale Executive cu Faruri LED Active
   ============================================================================ */
interface LuxuryVehicleSvgProps {
  profile: 'bmw-g60' | 'audi-a6' | 'mercedes-w206';
  lightsOn: boolean;
  accentColor: 'amber' | 'emerald';
}

const LuxuryVehicleSvg: React.FC<LuxuryVehicleSvgProps> = ({
  profile,
  lightsOn,
  accentColor,
}) => {
  const strokeMain = accentColor === 'amber' ? '#f59e0b' : '#34d399';

  return (
    <svg
      viewBox="0 0 320 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full overflow-visible"
    >
      <defs>
        <linearGradient id={`bodyGrad-${profile}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#18181b" />
          <stop offset="50%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <radialGradient id={`headlightGlow-${profile}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
          <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Umbra de contact sub șasiu */}
      <ellipse cx="160" cy="94" rx="132" ry="6" fill="#000000" opacity="0.85" />

      {/* Caroseria specifică fiecărui model german */}
      {profile === 'bmw-g60' && (
        <path
          d="M24 74 L32 54 L88 46 L132 24 L218 24 L264 46 L296 54 L300 76 L282 82 L38 82 Z"
          fill={`url(#bodyGrad-${profile})`}
          stroke={lightsOn ? strokeMain : '#3f3f46'}
          strokeWidth="1.6"
        />
      )}

      {profile === 'audi-a6' && (
        <path
          d="M20 75 L30 52 L92 44 L140 23 L228 25 L276 47 L298 56 L302 77 L284 82 L34 82 Z"
          fill={`url(#bodyGrad-${profile})`}
          stroke={lightsOn ? strokeMain : '#3f3f46'}
          strokeWidth="1.6"
        />
      )}

      {profile === 'mercedes-w206' && (
        <path
          d="M22 76 L34 53 L95 45 L138 25 L215 25 L262 46 L296 55 L300 76 L282 82 L36 82 Z"
          fill={`url(#bodyGrad-${profile})`}
          stroke={lightsOn ? strokeMain : '#3f3f46'}
          strokeWidth="1.6"
        />
      )}

      {/* Geamuri laterale fumurii + contur cromat */}
      <path
        d="M98 45 L136 28 L212 28 L250 45 Z"
        fill="#09090b"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.2"
      />
      <line x1="174" y1="28" x2="170" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

      {/* Linii dinamice de caracter pe portiere */}
      <path
        d="M46 62 L274 60"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
        strokeDasharray="180 8"
      />

      {/* Roata Față (Stânga) */}
      <g>
        <circle cx="74" cy="80" r="20" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle
          cx="74"
          cy="80"
          r="13"
          fill="#18181b"
          stroke={lightsOn ? strokeMain : '#52525b'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <circle cx="74" cy="80" r="4" fill={lightsOn ? '#f59e0b' : '#71717a'} />
      </g>

      {/* Roata Spate (Dreapta) */}
      <g>
        <circle cx="248" cy="80" r="20" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle
          cx="248"
          cy="80"
          r="13"
          fill="#18181b"
          stroke={lightsOn ? strokeMain : '#52525b'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <circle cx="248" cy="80" r="4" fill={lightsOn ? '#f59e0b' : '#71717a'} />
      </g>

      {/* Faruri LED DRL (Față - Stânga) & Stopuri LED (Spate - Dreapta) */}
      {lightsOn && (
        <>
          {/* Fascicul și halou far față */}
          <circle cx="30" cy="60" r="22" fill={`url(#headlightGlow-${profile})`} />
          <polygon
            points="28,57 -18,44 -18,74 28,63"
            fill="url(#headlightGlow-bmw-g60)"
            opacity="0.45"
          />
          {/* Semnătura DRL Alb-Cald / Chihlimbar */}
          <path
            d="M27 57 L42 55 L39 61 L26 61 Z"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth="1"
          />

          {/* Semnătura Stop LED Spate */}
          <path
            d="M288 55 L299 57 L299 63 L286 61 Z"
            fill="#ef4444"
            stroke="#fca5a5"
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  );
};

export default ShowroomGarageGate;