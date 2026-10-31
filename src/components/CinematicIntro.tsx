import React, { useEffect, useState, useRef } from 'react';
import { DealerProfile } from '../db/types';

interface CinematicIntroProps {
  onSplit?: () => void;
  onComplete?: () => void;
  forceReplay?: boolean;
  tenant?: DealerProfile;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ 
  onSplit, 
  onComplete, 
  forceReplay = false,
  tenant
}) => {
  const isMpi = tenant?.slug === 'mpi_auto' || (typeof window !== 'undefined' && window.location.hostname.includes('mpiauto'));
  const storageKey = isMpi ? 'mpi_intro_seen' : 'rxm_intro_seen';

  const [phase, setPhase] = useState<'loading' | 'split' | 'sliding_up' | 'done'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isForcedUrl = urlParams.get('intro') === 'true' || urlParams.get('intro') === '1' || window.location.hash === '#intro';
      if (isForcedUrl || forceReplay) {
        return 'loading';
      }
      
      // În modul de dezvoltare (DEV) ignorăm cheia permanentă din localStorage pentru a permite testarea la F5
      if (import.meta.env.DEV) {
        if (sessionStorage.getItem(storageKey)) {
          return 'done';
        }
        return 'loading';
      }

      if (sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)) {
        return 'done';
      }
    }
    return 'loading';
  });

  const [progressRatio, setProgressRatio] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const [isLogoIlluminated, setIsLogoIlluminated] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ══════════════════════════════════════════════════════════════
  // 1. LIFECYCLE PENTRU MPI AUTO (Video Background + Slide-Up Fade-Out)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isMpi) return;
    if (phase === 'done') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
      return;
    }

    // Watchdog de siguranță: dacă videoclipul se blochează, deblochează ecranul după 10s
    const watchdogTimer = setTimeout(() => {
      handleMpiExit();
    }, 10000);

    return () => {
      clearTimeout(watchdogTimer);
    };
  }, [isMpi, phase]);

  const handleMpiExit = () => {
    if (phase === 'sliding_up' || phase === 'done') return;
    
    // Marchează sesiunea ca văzută
    try {
      sessionStorage.setItem(storageKey, 'true');
      if (!import.meta.env.DEV) {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {
      // Ignore storage errors
    }

    setPhase('sliding_up');
    if (onSplit) onSplit();

    // După terminarea tranziției de glisare în sus (950ms), marchează complet
    setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 950);
  };

  const handleMpiTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;

    const ratio = Math.min(1, Math.max(0, vid.currentTime / vid.duration));
    setProgressRatio(ratio);
    setDisplayPct(Math.min(100, Math.round(ratio * 100)));

    // ⚡ EXACT când se sting farurile mașinii (t = 3.9s):
    if (vid.currentTime >= 3.9 && !isLogoIlluminated) {
      setIsLogoIlluminated(true);
    }

    // 🚀 La t = 7.0s (după 3.1s de expunere a neonului aprins):
    if (vid.currentTime >= 7.0) {
      handleMpiExit();
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 2. LIFECYCLE PENTRU RXM (Split Shutter / Laser Seam)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isMpi) return;
    if (phase === 'done') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
      return;
    }

    // Watchdog setat la 3800ms
    const watchdogTimer = setTimeout(() => {
      handleRxmSkip();
    }, 3800);

    const startTime = performance.now();
    const duration = 1800; // 1.8 secunde

    let animFrame: number;
    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const linearRatio = Math.min(1, Math.max(0, elapsed / duration));
      
      const ease = linearRatio < 0.5 
        ? 4 * linearRatio * linearRatio * linearRatio 
        : 1 - Math.pow(-2 * linearRatio + 2, 3) / 2;

      setProgressRatio(ease);
      setDisplayPct(Math.min(100, Math.round(ease * 100)));

      if (linearRatio < 1) {
        animFrame = requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setPhase('split');
          if (onSplit) onSplit();
          try {
            sessionStorage.setItem(storageKey, 'true');
            if (!import.meta.env.DEV) {
              localStorage.setItem(storageKey, 'true');
            }
          } catch {
            // Ignore storage errors
          }

          setTimeout(() => {
            setPhase('done');
            if (onComplete) onComplete();
          }, 800);
        }, 100);
      }
    };

    animFrame = requestAnimationFrame(updateProgress);

    return () => {
      clearTimeout(watchdogTimer);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isMpi, phase]);

  const handleRxmSkip = () => {
    try {
      sessionStorage.setItem(storageKey, 'true');
      if (!import.meta.env.DEV) {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {
      // Ignore storage errors
    }
    setPhase('done');
    if (onSplit) onSplit();
    if (onComplete) onComplete();
  };

  if (phase === 'done') return null;

  // ══════════════════════════════════════════════════════════════
  // RANDARE: MPI AUTO CINEMATIC INTRO (Fade-In Neon Logo + Slide Out Up)
  // ══════════════════════════════════════════════════════════════
  if (isMpi) {
    const isSlidingUp = phase === 'sliding_up';

    return (
      <div 
        className={`fixed inset-0 z-[100] bg-black overflow-hidden pointer-events-auto select-none no-print transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isSlidingUp ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        aria-hidden="true"
      >
        {/* 🎬 Video Background Fullscreen Responsiv */}
        <video
          ref={videoRef}
          src="/videos/mpi-showroom-intro.mp4"
          playsInline
          autoPlay
          muted
          loop
          onTimeUpdate={handleMpiTimeUpdate}
          onEnded={handleMpiExit}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* 🌌 Ambient Vignette & Contrast Overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/80 pointer-events-none" />

        {/* 🌟 Logo MPI Auto pe Perete: ASCUNS inițial, se aprinde spectaculos la t=3.9s când se sting farurile */}
        <div 
          className={`absolute top-[14%] sm:top-[17%] md:top-[19%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-[92%] max-w-md px-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            isLogoIlluminated 
              ? 'opacity-100 translate-y-0 scale-100 blur-0' 
              : 'opacity-0 translate-y-3 scale-90 blur-sm'
          }`}
        >
          {/* Ambient Radial Halo Glow */}
          <div 
            className={`absolute -inset-8 sm:-inset-12 rounded-full bg-gradient-to-r from-rose-600/40 via-red-500/25 to-white/10 blur-3xl pointer-events-none transition-all duration-1000 ${
              isLogoIlluminated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`} 
          />

          <img 
            src="/images/mpi-logo-white.png" 
            alt="MPI AUTO CLUJ" 
            className="h-14 sm:h-20 md:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(225,29,72,0.95)] drop-shadow-[0_0_45px_rgba(255,255,255,0.95)] relative z-10"
          />
          <span className="mt-2.5 sm:mt-3 text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.22em] sm:tracking-[0.35em] uppercase text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] text-center relative z-10">
            Centura Apahida • Showroom Rulate
          </span>
        </div>

        {/* ⏭️ Buton discret de „Sari intro” (protejat de Dynamic Island / Notch) */}
        <button
          onClick={handleMpiExit}
          className="fixed top-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] right-4 sm:right-6 z-40 px-3.5 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-zinc-300 hover:text-white text-[11px] font-semibold tracking-wider uppercase transition-all backdrop-blur-md cursor-pointer pointer-events-auto min-h-[36px] flex items-center justify-center touch-manipulation active:scale-95 shadow-lg shadow-black/50"
          title="Sari peste introducere"
        >
          Sari intro →
        </button>

        {/* ⏱️ Linie Subțire Progres la Bază */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-44 sm:w-64 h-[2px] bg-white/15 rounded-full overflow-hidden z-30 pointer-events-none">
          <div 
            className="h-full bg-gradient-to-r from-rose-600 via-rose-400 to-white transition-all duration-100 ease-linear shadow-[0_0_8px_#e11d48]"
            style={{ width: `${displayPct}%` }}
          />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RANDARE: RXM CINEMATIC INTRO (Split Shutter Curtains)
  // ══════════════════════════════════════════════════════════════
  const isSplit = phase === 'split';

  return (
    <div 
      className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden no-print"
      aria-hidden="true"
    >
      {/* 🎬 Panoul de Sus (Top Curtain) */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[50.1%] bg-[#08080a] border-b border-amber-500/20 transition-transform duration-1000 ease-[cubic-bezier(0.85,0,0.15,1)] will-change-transform z-10 ${
          isSplit ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* 🎬 Panoul de Jos (Bottom Curtain) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[50.1%] bg-[#08080a] border-t border-amber-500/20 transition-transform duration-1000 ease-[cubic-bezier(0.85,0,0.15,1)] will-change-transform z-10 ${
          isSplit ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* ⚡ Cusătura Orizontală Centrală (Laser Seam - GPU Accelerated) */}
      <div 
        className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] z-20 pointer-events-none transition-opacity duration-300 ${
          isSplit ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div 
          className="h-full w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_rgba(251,191,36,0.9)] origin-center will-change-transform mx-auto"
          style={{ transform: `scaleX(${Math.max(0.08, progressRatio)})` }}
        />
      </div>

      {/* 🌟 Conținutul Central Introductiv */}
      <div 
        className={`fixed inset-0 z-30 flex flex-col justify-center items-center px-6 transition-all duration-500 pointer-events-none ${
          isSplit ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          
          <div className="flex items-center gap-3 mb-6 animate-pulse">
            <img 
              src="/rxm/images/rxm-emblem.png" 
              alt="RXM" 
              className="w-8 h-8 object-contain filter invert brightness-150 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
            />
            <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400">
              RXM AUTO MOBILE <span className="text-amber-500">•</span> CLUJ-NAPOCA
            </span>
          </div>

          <h1 className="font-['Playfair_Display'] italic text-3xl sm:text-5xl md:text-6xl text-[#fef3c7] font-normal tracking-tight leading-[1.15] mb-8 max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            „Fiecare drum începe cu alegerea potrivită.”
          </h1>

          <div className="w-full max-w-md flex flex-col items-center gap-2">
            <div className="w-full h-[2.5px] bg-zinc-800/80 rounded-full overflow-hidden relative">
              <div 
                className="h-full w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 rounded-full origin-left will-change-transform shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                style={{ transform: `scaleX(${progressRatio})` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#fbbf24] pointer-events-none will-change-transform"
                style={{ 
                  left: `${progressRatio * 100}%`, 
                  opacity: progressRatio > 0.02 && progressRatio < 0.99 ? 1 : 0 
                }}
              />
            </div>
            
            <div className="w-full flex justify-between items-center text-[10px] tracking-widest text-zinc-500 uppercase font-mono mt-1">
              <span>Showroom Digital</span>
              <span className="text-amber-400 font-bold">{displayPct.toString().padStart(2, '0')}%</span>
              <span>Automobile Certificate</span>
            </div>
          </div>

        </div>
      </div>

      <button
        onClick={handleRxmSkip}
        className={`fixed top-[max(1.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] right-4 sm:right-6 z-40 px-3.5 py-1.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white text-[11px] font-medium tracking-wider uppercase transition-all backdrop-blur-md pointer-events-auto min-h-[36px] flex items-center justify-center touch-manipulation ${
          isSplit ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Sari peste introducere"
      >
        Sari intro →
      </button>

    </div>
  );
};
