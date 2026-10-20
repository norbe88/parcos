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
  Lock,
  Unlock,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ShowroomDoubleDoorIntroProps {
  /** Callback apelat la apăsarea butonului principal CTA [ Explorează Sistemul DMS ] */
  onExploreClick?: () => void;
  /** Callback opțional apelat când utilizatorul apasă pe [ Reia Animația ] */
  onReplay?: () => void;
  /** Timpul în milisecunde până la deschiderea automată a ușilor duble (default: 1800ms) */
  autoOpenDelayMs?: number;
  /** Dacă este true, ignoră sessionStorage la montare și rulează mereu animația */
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
  flank: 'left' | 'right';
  accentColor: 'amber' | 'emerald' | 'blue';
  telemetry: {
    label: string;
    value: string;
  }[];
  drlColor: string;
}

const SHOWROOM_VEHICLES: ShowroomVehicle[] = [
  {
    id: 'bmw-seria-5',
    brand: 'BMW',
    model: 'Seria 5',
    trim: '520d xDrive M-Sport • 2024 • 18.400 km',
    price: '54.900 €',
    badgeText: 'CIV Scanat cu AI (1.8s) • e-Factura Pregătită',
    statusTag: 'OCR + ANAF SPV Validat',
    flank: 'left',
    accentColor: 'amber',
    drlColor: '#60a5fa',
    telemetry: [
      { label: 'Serie Șasiu (VIN)', value: 'WBA51FJ090CP89214 (Verificat RAR)' },
      { label: 'Extracție Cărți (CIV)', value: '19/19 câmpuri • Acuitate 99.8%' },
      { label: 'XML ANAF e-Factura', value: 'Validat • Gata de transmitere SPV' },
    ],
  },
  {
    id: 'audi-a6',
    brand: 'Audi',
    model: 'A6',
    trim: '45 TFSI quattro S-Line • 2023 • 31.200 km',
    price: '48.500 €',
    badgeText: 'Ofertă WhatsApp Trimisă • Garanție Rezervare Încasată',
    statusTag: 'Avans 500 € Încasat (Stripe)',
    flank: 'left',
    accentColor: 'emerald',
    drlColor: '#f8fafc',
    telemetry: [
      { label: 'Link Plată Stripe', value: 'Achitat prin Apple Pay (500 €)' },
      { label: 'Contract Rezervare', value: 'Generat & Semnat Digital' },
      { label: 'Dosar PDF WhatsApp', value: 'Deschis de client acum 3 min' },
    ],
  },
  {
    id: 'mercedes-clasa-c',
    brand: 'Mercedes-Benz',
    model: 'Clasa C',
    trim: 'C 300de AMG Line • 2024 • 12.900 km',
    price: '51.200 €',
    badgeText: 'Sincronizat Automat pe OLX & Autovit în 0.42s',
    statusTag: 'Status: Rezervat în Rețea',
    flank: 'right',
    accentColor: 'emerald',
    drlColor: '#38bdf8',
    telemetry: [
      { label: 'Canale Sincronizate', value: 'Autovit.ro, OLX, Showroom Propriu' },
      { label: 'Protecție Dublă Vânzare', value: 'Anunțuri marcate automat REZERVAT' },
      { label: 'Viteză Replicare API', value: '0.42 secunde' },
    ],
  },
  {
    id: 'porsche-taycan',
    brand: 'Porsche',
    model: 'Taycan',
    trim: '4S Performance Plus • 2024 • 9.800 km',
    price: '79.900 €',
    badgeText: 'Dosar Digital Complet • Fișă Parbriz QR Generată',
    statusTag: 'Showroom VIP • Gata de Livrare',
    flank: 'right',
    accentColor: 'amber',
    drlColor: '#cbd5e1',
    telemetry: [
      { label: 'Fișă Parbriz QR', value: 'Scanare instantă pentru vizitatori' },
      { label: 'Calcul Rată / Leasing', value: 'Aprobat prin partener bancar' },
      { label: 'Garanție Tehnică', value: 'Certificat 24 luni inclus' },
    ],
  },
];

const SESSION_STORAGE_KEY = 'parcos_doubledoor_v1_seen';

export const ShowroomDoubleDoorIntro: React.FC<ShowroomDoubleDoorIntroProps> = ({
  onExploreClick,
  onReplay,
  autoOpenDelayMs = 1800,
  forceShowIntro = false,
}) => {
  const [doorPhase, setDoorPhase] = useState<'closed' | 'opening' | 'open'>('closed');
  const [lightsIgnited, setLightsIgnited] = useState<boolean>(false);
  const [initProgress, setInitProgress] = useState<number>(0);
  const [activeCarId, setActiveCarId] = useState<string>('bmw-seria-5');
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const triggerDoorOpen = useCallback(() => {
    clearAllTimers();
    setInitProgress(100);
    setDoorPhase((current) => {
      if (current === 'open' || current === 'opening') return current;
      return 'opening';
    });

    // Aprinderea reflectoarelor și tuburilor LED din hala luminoasă
    const lightTimer = window.setTimeout(() => {
      setLightsIgnited(true);
    }, 150);

    // Finalizarea cursei batante a ușilor duble (1400ms)
    const openDoneTimer = window.setTimeout(() => {
      setDoorPhase('open');
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {}
    }, 1400);

    timersRef.current.push(lightTimer, openDoneTimer);
  }, [clearAllTimers]);

  const handleSkipIntro = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllTimers();
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {}
      setInitProgress(100);
      setLightsIgnited(true);
      setDoorPhase('open');
    },
    [clearAllTimers]
  );

  const handleReplay = useCallback(() => {
    clearAllTimers();
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}

    setLightsIgnited(false);
    setInitProgress(0);
    setDoorPhase('closed');
    onReplay?.();

    const s1 = window.setTimeout(() => setInitProgress(30), 200);
    const s2 = window.setTimeout(() => setInitProgress(68), 650);
    const s3 = window.setTimeout(() => setInitProgress(100), 1200);
    const openTimer = window.setTimeout(() => {
      triggerDoorOpen();
    }, autoOpenDelayMs);

    timersRef.current.push(s1, s2, s3, openTimer);
  }, [autoOpenDelayMs, clearAllTimers, onReplay, triggerDoorOpen]);

  useEffect(() => {
    let alreadySeen = false;
    if (!forceShowIntro) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('gate') === 'true' || params.get('intro') === 'true' || params.get('replay') === 'true') {
          alreadySeen = false;
        } else {
          alreadySeen = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
        }
      } catch {
        alreadySeen = false;
      }
    }

    if (alreadySeen) {
      setInitProgress(100);
      setLightsIgnited(true);
      setDoorPhase('open');
      return;
    }

    const s1 = window.setTimeout(() => setInitProgress(32), 200);
    const s2 = window.setTimeout(() => setInitProgress(70), 700);
    const s3 = window.setTimeout(() => setInitProgress(100), 1250);
    const autoTimer = window.setTimeout(() => {
      triggerDoorOpen();
    }, autoOpenDelayMs);

    timersRef.current.push(s1, s2, s3, autoTimer);

    return () => clearAllTimers();
  }, [autoOpenDelayMs, clearAllTimers, forceShowIntro, triggerDoorOpen]);

  const isRetracted = doorPhase === 'opening' || doorPhase === 'open';

  return (
    <section
      aria-label="ParcOS Showroom Grand Portal"
      className="relative min-h-[95vh] lg:min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 select-none font-sans flex flex-col justify-between"
      style={{
        perspective: '1400px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Stiluri CSS pentru animații native 60fps & carouri de tavan */}
      <style>{`
        @keyframes hexCeilingPulse {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 15px rgba(255,255,255,0.4)); }
          50% { opacity: 1; filter: drop-shadow(0 0 25px rgba(245,158,11,0.5)); }
        }
        @keyframes floatHUD {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 🔘 BUTON DISCRET [ SARI INTRO ✕ ] (Colțul Dreapta-Sus)                    */}
      {/* ========================================================================= */}
      {doorPhase !== 'open' && (
        <div className="fixed top-5 right-5 z-50">
          <button
            type="button"
            onClick={handleSkipIntro}
            className="group flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold tracking-wider uppercase text-slate-200 border border-white/20 backdrop-blur-md transition-all duration-200 hover:border-amber-400/60 hover:text-white hover:bg-slate-800 shadow-2xl cursor-pointer"
          >
            <span>[ Sari Intro ]</span>
            <X className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-90 group-hover:text-amber-400" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚪 PORTALUL DUBLU: DOUĂ UȘI MARI DE STICLĂ CARE SE DESCHID SPRE INTERIOR */}
      {/* ========================================================================= */}
      <div 
        className={`fixed inset-0 z-40 pointer-events-none transition-opacity duration-700 ${
          doorPhase === 'open' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ perspective: '1400px' }}
      >
        {/* UȘA DIN STÂNGA (Pivotează spre interior pe marginea stângă: rotateY pozitiv) */}
        <div
          role="button"
          tabIndex={doorPhase === 'closed' ? 0 : -1}
          onClick={() => doorPhase === 'closed' && triggerDoorOpen()}
          style={{
            transformOrigin: 'left center',
            transform: isRetracted ? 'rotateY(88deg) translateZ(-40px)' : 'rotateY(0deg)',
            transition: 'transform 1400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease',
            pointerEvents: doorPhase === 'closed' ? 'auto' : 'none',
          }}
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-900/90 border-r-2 border-slate-700/80 shadow-[20px_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 cursor-pointer will-change-transform"
        >
          {/* Mâner vertical lung din inox periat (pe marginea interioară a ușii din stânga) */}
          <div className="absolute right-4 sm:right-8 top-1/4 bottom-1/4 w-3 sm:w-4 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400 shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white/60 flex items-center justify-center">
            <div className="w-1 h-3/4 rounded-full bg-slate-500/30" />
          </div>

          {/* Marcaj arhitectural colț stânga-sus */}
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>PORTAL-L // ARCHITECTURAL GLASS</span>
          </div>

          {/* Textura reflectorizantă diagonală */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

          {/* Semnătura discretă inferioară */}
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            ISO-9001 TEMPERED GLASS • ACOUSTIC SEAL
          </div>
        </div>

        {/* UȘA DIN DREAPTA (Pivotează spre interior pe marginea dreaptă: rotateY negativ) */}
        <div
          role="button"
          tabIndex={doorPhase === 'closed' ? 0 : -1}
          onClick={() => doorPhase === 'closed' && triggerDoorOpen()}
          style={{
            transformOrigin: 'right center',
            transform: isRetracted ? 'rotateY(-88deg) translateZ(-40px)' : 'rotateY(0deg)',
            transition: 'transform 1400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease',
            pointerEvents: doorPhase === 'closed' ? 'auto' : 'none',
          }}
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-slate-950 via-slate-900/95 to-slate-900/90 border-l-2 border-slate-700/80 shadow-[-20px_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 cursor-pointer will-change-transform"
        >
          {/* Mâner vertical lung din inox periat (pe marginea interioară a ușii din dreapta) */}
          <div className="absolute left-4 sm:left-8 top-1/4 bottom-1/4 w-3 sm:w-4 rounded-full bg-gradient-to-r from-slate-400 via-white to-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white/60 flex items-center justify-center">
            <div className="w-1 h-3/4 rounded-full bg-slate-500/30" />
          </div>

          {/* Marcaj arhitectural colț dreapta-sus */}
          <div className="flex items-center justify-end gap-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            <span>PARCOS FLAGSHIP SHOWROOM</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* Textura reflectorizantă diagonală */}
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/[0.04] to-transparent pointer-events-none" />

          {/* Semnătura discretă inferioară */}
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase text-right">
            SECURE ENTRY • TAP TO ENTER
          </div>
        </div>

        {/* MECANISMUL CENTRAL DIGITAL DE DEBLOCARE (Când ușile sunt închise) */}
        {!isRetracted && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <div className="max-w-md w-full rounded-2xl bg-slate-900/95 border border-white/20 p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.35)] backdrop-blur-2xl text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono uppercase tracking-widest mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Portal Inteligent Showroom
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Parc<span className="text-amber-400">OS</span> Pavilion Autonom
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Deschidere uși showroom... Inițializare telemetrie stoc & conexiune ANAF SPV.
              </p>

              {/* Bară de progres inițializare */}
              <div className="mt-5 h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300 ease-out"
                  style={{ width: `${initProgress}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Sistem Securizat
                </span>
                <span className="text-amber-400 font-bold">{initProgress}%</span>
              </div>

              <p className="mt-3 text-[11px] text-slate-400 italic">
                Apasă oriunde pentru intrare instantanee
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🏛️ INTERIORUL SHOWROOM-ULUI: HALĂ BINE LUMINATĂ CU MAȘINI STÂNGA/DREAPTA  */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
        
        {/* ILUMINARE ARHITECTURALĂ DE TAVAN: Carouri LED Albe (Studio 4500K) + Glow Cald */}
        <div className="absolute top-0 inset-x-0 h-44 pointer-events-none z-0 overflow-hidden">
          {/* Benzi LED liniare de studio */}
          <div className="max-w-6xl mx-auto h-full grid grid-cols-4 gap-4 px-6 opacity-70">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-2 rounded-b-xl transition-all duration-1000 ${
                  lightsIgnited
                    ? 'bg-white shadow-[0_0_35px_10px_rgba(255,255,255,0.8)]'
                    : 'bg-slate-800 shadow-none'
                }`}
              />
            ))}
          </div>

          {/* Proiecție difuză de lumină studio alb-caldă pe hală */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[360px] rounded-full transition-opacity duration-1000 ${
              lightsIgnited ? 'opacity-90' : 'opacity-0'
            }`}
            style={{
              background:
                'radial-gradient(ellipse at center top, rgba(255,255,255,0.28) 0%, rgba(245,158,11,0.18) 40%, rgba(15,23,42,0) 75%)',
            }}
          />
        </div>

        {/* PODEA EPOXIDICĂ LUCIOASĂ CU ALEE CENTRALĂ DE PERSPECTIVĂ (RUNWAY) */}
        <div className="absolute inset-x-0 bottom-0 h-[48vh] pointer-events-none z-0">
          <div
            className="w-full h-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(30,41,59,0.3) 0%, rgba(15,23,42,0.95) 100%)',
            }}
          >
            {/* Grila de reflexie în perspectivă */}
            <div
              className="w-full h-full opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(245,158,11,0.2) 1px, transparent 1px)
                `,
                backgroundSize: '5rem 3.5rem',
                transform: 'perspective(600px) rotateX(65deg) scale(1.3)',
                transformOrigin: 'top center',
              }}
            />
          </div>
        </div>

        {/* =====================================================================
            BANNER CENTRAL ARCHITECTURAL: MESAJUL DE IMPACT COMERCIAL
           ===================================================================== */}
        <div className="relative z-20 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 text-center">
          <div
            className={`transition-all duration-1000 ease-out ${
              lightsIgnited ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Pill statut activ */}
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 border border-white/15 px-4 py-1.5 mb-4 shadow-lg backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-semibold">
                ParcOS Pavilion • România
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Showroom Deschis & Activ
              </span>
            </div>

            {/* Titlul cerut */}
            <h1 className="max-w-4xl mx-auto text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-white leading-[1.15]">
              „Nu mai pierde clienți în mesaje de pe OLX.{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Transformă-ți parcul într-un showroom digital autonom.”
              </span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-300/90 font-normal leading-relaxed">
              De la scanarea cărții de identitate (CIV) în 1.8 secunde și emiterea automată a
              e-Facturii în SPV, până la încasarea garanției de rezervare prin Stripe direct pe WhatsApp.
            </p>

            {/* Butoane de acțiune */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExploreClick}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-7 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(245,158,11,0.8)] active:scale-[0.99] cursor-pointer"
              >
                <Car className="h-5 w-5 text-slate-950 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>[ Explorează Sistemul DMS ]</span>
                <Zap className="h-4 w-4 text-slate-950 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-white/15 px-4 py-3.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-md"
              >
                <RotateCcw className="h-4 w-4 text-amber-400" />
                <span>[ Reia Animația Ușilor ]</span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            PERSPECTIVA HALEI: MAȘINI PE STÂNGA ȘI MAȘINI PE DREAPTA
           ===================================================================== */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-end">
            
            {/* FLANCUL STÂNG (2 Vehicule cu profil orientat spre aleea centrală) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/60 border border-white/10 w-fit text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                <span>◀ FLANCUL STÂNG • ZONA EXECUTIVE SEDAN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SHOWROOM_VEHICLES.filter(v => v.flank === 'left').map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveCarId(v.id)}
                    className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer backdrop-blur-xl border ${
                      activeCarId === v.id
                        ? 'bg-slate-800/95 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]'
                        : 'bg-slate-900/80 border-white/15 hover:border-slate-400/50 hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Far DRL aprins pe mașină */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full shadow-[0_0_12px_3px] animate-pulse"
                          style={{ backgroundColor: v.drlColor, color: v.drlColor }}
                        />
                        <span className="text-xs font-bold text-white tracking-wide">
                          {v.brand} {v.model}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">{v.price}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-1 mb-3">{v.trim}</p>

                    {/* HUD Badge Tehnologic */}
                    <div className="rounded-lg bg-slate-950/70 border border-white/10 p-2.5 mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{v.statusTag}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{v.badgeText}</p>
                    </div>

                    {/* Detaliu telemetrie */}
                    <div className="space-y-1 border-t border-white/10 pt-2 text-[10px] font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{v.telemetry[0].label}:</span>
                        <span className="text-amber-300 font-semibold truncate max-w-[120px]">{v.telemetry[0].value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FLANCUL DREPT (2 Vehicule cu profil orientat spre aleea centrală) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-end gap-2 px-3 py-1 rounded-md bg-slate-800/60 border border-white/10 w-fit ml-auto text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                <span>FLANCUL DREPT • ZONA SPORT & PERFORMANCE ▶</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SHOWROOM_VEHICLES.filter(v => v.flank === 'right').map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveCarId(v.id)}
                    className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer backdrop-blur-xl border ${
                      activeCarId === v.id
                        ? 'bg-slate-800/95 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.25)] scale-[1.02]'
                        : 'bg-slate-900/80 border-white/15 hover:border-slate-400/50 hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Far DRL aprins pe mașină */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full shadow-[0_0_12px_3px] animate-pulse"
                          style={{ backgroundColor: v.drlColor, color: v.drlColor }}
                        />
                        <span className="text-xs font-bold text-white tracking-wide">
                          {v.brand} {v.model}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{v.price}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-1 mb-3">{v.trim}</p>

                    {/* HUD Badge Tehnologic */}
                    <div className="rounded-lg bg-slate-950/70 border border-white/10 p-2.5 mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-semibold">
                        <Zap className="h-3 w-3 fill-current" />
                        <span>{v.statusTag}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{v.badgeText}</p>
                    </div>

                    {/* Detaliu telemetrie */}
                    <div className="space-y-1 border-t border-white/10 pt-2 text-[10px] font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{v.telemetry[0].label}:</span>
                        <span className="text-emerald-300 font-semibold truncate max-w-[120px]">{v.telemetry[0].value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Notificare de jos: Navigație fluidă către modulele DMS */}
        <div className="relative z-20 w-full py-3 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <span>Derulează pentru a explora arhitectura completă a platformei ParcOS DMS</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default ShowroomDoubleDoorIntro;
