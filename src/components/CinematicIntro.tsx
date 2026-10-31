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
  const introConfig = tenant?.landingConfig?.intro || {
    type: 'split_shutter' as const,
    duration: 1800,
    accentColor: '#f59e0b',
  };
  const introType = introConfig.type || 'split_shutter';

  const slug = tenant?.slug || 'showroom';
  const storageKey = `${slug}_intro_seen`;

  // 1. Mod 'none': Bypass instantaneu
  useEffect(() => {
    if (introType === 'none') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
    }
  }, [introType, onSplit, onComplete]);

  const [phase, setPhase] = useState<'loading' | 'split' | 'sliding_up' | 'done'>(() => {
    if (introType === 'none') return 'done';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isForcedUrl = urlParams.get('intro') === 'true' || urlParams.get('intro') === '1' || window.location.hash === '#intro';
      if (isForcedUrl || forceReplay) {
        return 'loading';
      }
      
      // În modul de dezvoltare (DEV) ignorăm cheia permanentă din localStorage pentru a permite testarea facilă la F5
      if (import.meta.env.DEV) {
        if (sessionStorage.getItem(storageKey)) {
          return 'done';
        }
        return 'loading';
      }

      if (
        sessionStorage.getItem(storageKey) ||
        localStorage.getItem(storageKey)
      ) {
        return 'done';
      }
    }
    return 'loading';
  });

  const [progressRatio, setProgressRatio] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const [isLogoIlluminated, setIsLogoIlluminated] = useState(false);
  const [isMaxGlow, setIsMaxGlow] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const markSeenInStorage = () => {
    try {
      sessionStorage.setItem(storageKey, 'true');
      if (!import.meta.env.DEV) {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {
      // Ignore storage errors
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 2. LIFECYCLE: CINEMATIC VIDEO (Curtains-Up Exit / Slide Up)
  // ══════════════════════════════════════════════════════════════
  const transitionDurationMs = introConfig.transitionDurationMs ?? 1500;
  const headlightOffTime = introConfig.headlightOffTime ?? 4.1;
  const maxGlowTime = introConfig.maxGlowTime ?? 6.0;
  const exitTime = introConfig.exitTime ?? 7.5;
  const videoAccentColor = introConfig.accentColor || '#e11d48';

  const handleVideoExit = () => {
    if (phase === 'sliding_up' || phase === 'done') return;
    markSeenInStorage();
    setPhase('sliding_up');
    if (onSplit) onSplit();

    setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, transitionDurationMs);
  };

  const handleVideoTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;

    const ratio = Math.min(1, Math.max(0, vid.currentTime / vid.duration));
    setProgressRatio(ratio);
    setDisplayPct(Math.min(100, Math.round(ratio * 100)));

    if (vid.currentTime >= headlightOffTime && !isLogoIlluminated) {
      setIsLogoIlluminated(true);
    }

    if (vid.currentTime >= maxGlowTime && !isMaxGlow) {
      setIsMaxGlow(true);
    }

    if (vid.currentTime >= exitTime) {
      handleVideoExit();
    }
  };

  useEffect(() => {
    if (introType !== 'cinematic_video') return;
    if (phase === 'done') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
      return;
    }

    const watchdogTimer = setTimeout(() => {
      handleVideoExit();
    }, 11000);

    return () => {
      clearTimeout(watchdogTimer);
    };
  }, [introType, phase]);

  // ══════════════════════════════════════════════════════════════
  // 3. LIFECYCLE: SPLIT SHUTTER (Horizontal Laser Seam)
  // ══════════════════════════════════════════════════════════════
  const shutterDuration = introConfig.duration ?? 1800;
  const shutterAccentColor = introConfig.accentColor || '#f59e0b';

  const handleShutterSkip = () => {
    markSeenInStorage();
    setPhase('done');
    if (onSplit) onSplit();
    if (onComplete) onComplete();
  };

  useEffect(() => {
    if (introType !== 'split_shutter') return;
    if (phase === 'done') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
      return;
    }

    const watchdogTimer = setTimeout(() => {
      handleShutterSkip();
    }, shutterDuration + 2000);

    const startTime = performance.now();
    let animFrame: number;

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const linearRatio = Math.min(1, Math.max(0, elapsed / shutterDuration));
      
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
          markSeenInStorage();

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
  }, [introType, phase, shutterDuration]);

  if (introType === 'none' || phase === 'done') return null;

  // ══════════════════════════════════════════════════════════════
  // RANDARE: CINEMATIC VIDEO MODE
  // ══════════════════════════════════════════════════════════════
  if (introType === 'cinematic_video') {
    const isSlidingUp = phase === 'sliding_up';
    const videoUrl = introConfig.videoUrl || '';
    const logoUrl = introConfig.logoUrl || tenant?.logoUrl || '';
    const tagline = introConfig.tagline || (tenant?.showroomAddress ? `${tenant.showroomAddress} • Showroom Rulate` : 'Showroom Rulate');

    return (
      <div 
        className={`fixed inset-0 z-[100] bg-black overflow-hidden pointer-events-auto select-none no-print transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${
          isSlidingUp 
            ? '-translate-y-full border-b-2 pointer-events-none' 
            : 'translate-y-0 opacity-100'
        }`}
        style={isSlidingUp ? {
          borderColor: `${videoAccentColor}cc`,
          boxShadow: `0 25px 60px ${videoAccentColor}99, 0 40px 100px rgba(0,0,0,0.95)`,
          transitionDuration: `${transitionDurationMs}ms`
        } : { transitionDuration: `${transitionDurationMs}ms` }}
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          autoPlay
          muted
          loop
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoExit}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85 pointer-events-none" />

        <div 
          className={`absolute top-[12%] sm:top-[14%] md:top-[16%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-[94%] max-w-xl px-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            isLogoIlluminated 
              ? 'opacity-100 translate-y-0 scale-100 blur-0' 
              : 'opacity-0 translate-y-4 scale-90 blur-sm'
          }`}
        >
          <div 
            className={`absolute -inset-10 sm:-inset-16 md:-inset-20 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
              isMaxGlow 
                ? 'opacity-90 scale-125' 
                : isLogoIlluminated 
                  ? 'opacity-70 scale-100' 
                  : 'opacity-0 scale-50'
            }`} 
            style={{
              background: `radial-gradient(circle, ${videoAccentColor}99 0%, ${videoAccentColor}40 50%, transparent 75%)`
            }}
          />

          <img 
            src={logoUrl} 
            alt={tenant?.name || 'Showroom'} 
            className={`h-20 sm:h-28 md:h-36 lg:h-40 w-auto object-contain relative z-10 transition-all duration-700 ${
              isMaxGlow ? 'brightness-110 scale-105' : ''
            }`}
            style={{
              filter: isMaxGlow
                ? `drop-shadow(0 0 35px ${videoAccentColor}) drop-shadow(0 0 75px #ffffff) drop-shadow(0 0 110px ${videoAccentColor}e6)`
                : isLogoIlluminated
                  ? `drop-shadow(0 0 25px ${videoAccentColor}f2) drop-shadow(0 0 55px rgba(255,255,255,0.95)) drop-shadow(0 0 80px ${videoAccentColor}b3)`
                  : undefined
            }}
          />
          <span className={`mt-3 sm:mt-4 text-[11px] sm:text-xs md:text-sm font-black tracking-[0.25em] sm:tracking-[0.38em] uppercase text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] text-center relative z-10 transition-all duration-700 ${
            isMaxGlow ? 'text-zinc-50' : 'text-zinc-200'
          }`}
          style={isMaxGlow ? { textShadow: `0 0 20px ${videoAccentColor}` } : undefined}
          >
            {tagline}
          </span>
        </div>

        <button
          onClick={handleVideoExit}
          className="fixed top-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] right-4 sm:right-6 z-40 px-4 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/20 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all backdrop-blur-md cursor-pointer pointer-events-auto min-h-[38px] flex items-center justify-center touch-manipulation active:scale-95 shadow-xl shadow-black/60"
          title="Sari peste introducere"
        >
          Sari intro →
        </button>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-44 sm:w-64 h-[2px] bg-white/15 rounded-full overflow-hidden z-30 pointer-events-none">
          <div 
            className="h-full transition-all duration-100 ease-linear"
            style={{ 
              width: `${displayPct}%`,
              background: `linear-gradient(to right, ${videoAccentColor}, ${videoAccentColor}cc, #ffffff)`,
              boxShadow: `0 0 8px ${videoAccentColor}`
            }}
          />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RANDARE: SPLIT SHUTTER MODE
  // ══════════════════════════════════════════════════════════════
  if (introType === 'split_shutter') {
    const isSplit = phase === 'split';
  const shutterLogo = introConfig.logoUrl || tenant?.logoUrl || '';
  const shutterTagline = introConfig.tagline || '„Fiecare drum începe cu alegerea potrivită.”';
  const dealerName = tenant?.name || 'SHOWROOM AUTOMOBILE';
  const dealerLocation = tenant?.serviceLocation || tenant?.showroomAddress || tenant?.address || 'ROMÂNIA';

  return (
    <div 
      className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden no-print"
      aria-hidden="true"
    >
      <div 
        className={`absolute top-0 left-0 right-0 h-[50.1%] bg-[#08080a] border-b transition-transform duration-1000 ease-[cubic-bezier(0.85,0,0.15,1)] will-change-transform z-10 ${
          isSplit ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ borderColor: `${shutterAccentColor}33` }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-b pointer-events-none" 
          style={{ backgroundImage: `linear-gradient(to bottom, ${shutterAccentColor}08, transparent)` }}
        />
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 h-[50.1%] bg-[#08080a] border-t transition-transform duration-1000 ease-[cubic-bezier(0.85,0,0.15,1)] will-change-transform z-10 ${
          isSplit ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{ borderColor: `${shutterAccentColor}33` }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-t pointer-events-none" 
          style={{ backgroundImage: `linear-gradient(to top, ${shutterAccentColor}08, transparent)` }}
        />
      </div>

      <div 
        className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] z-20 pointer-events-none transition-opacity duration-300 ${
          isSplit ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div 
          className="h-full w-full origin-center will-change-transform mx-auto"
          style={{ 
            transform: `scaleX(${Math.max(0.08, progressRatio)})`,
            background: `linear-gradient(to right, transparent, ${shutterAccentColor}, transparent)`,
            boxShadow: `0 0 14px ${shutterAccentColor}e6`
          }}
        />
      </div>

      <div 
        className={`fixed inset-0 z-30 flex flex-col justify-center items-center px-6 transition-all duration-500 pointer-events-none ${
          isSplit ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          
          <div className="flex items-center gap-3 mb-6 animate-pulse">
            {shutterLogo && (
              <img 
                src={shutterLogo} 
                alt={dealerName} 
                className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
              />
            )}
            <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400">
              {dealerName} <span style={{ color: shutterAccentColor }}>•</span> {dealerLocation}
            </span>
          </div>

          <h1 className="font-['Playfair_Display'] italic text-3xl sm:text-5xl md:text-6xl text-[#fef3c7] font-normal tracking-tight leading-[1.15] mb-8 max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            {shutterTagline}
          </h1>

          <div className="w-full max-w-md flex flex-col items-center gap-2">
            <div className="w-full h-[2.5px] bg-zinc-800/80 rounded-full overflow-hidden relative">
              <div 
                className="h-full w-full rounded-full origin-left will-change-transform"
                style={{ 
                  transform: `scaleX(${progressRatio})`,
                  background: `linear-gradient(to right, ${shutterAccentColor}99, ${shutterAccentColor}, #ffffff)`,
                  boxShadow: `0 0 10px ${shutterAccentColor}cc`
                }}
              />
              <div 
                className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-white rounded-full blur-[1px] pointer-events-none will-change-transform"
                style={{ 
                  left: `${progressRatio * 100}%`, 
                  opacity: progressRatio > 0.02 && progressRatio < 0.99 ? 1 : 0,
                  boxShadow: `0 0 8px ${shutterAccentColor}`
                }}
              />
            </div>
            
            <div className="w-full flex justify-between items-center text-[10px] tracking-widest text-zinc-500 uppercase font-mono mt-1">
              <span>Showroom Digital</span>
              <span className="font-bold" style={{ color: shutterAccentColor }}>{displayPct.toString().padStart(2, '0')}%</span>
              <span>Automobile Certificate</span>
            </div>
          </div>

        </div>
      </div>

      <button
        onClick={handleShutterSkip}
        className={`fixed top-[max(1.5rem,calc(env(safe-area-inset-top,0px)+0.75rem))] right-4 sm:right-6 z-40 px-3.5 py-1.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white text-[11px] font-medium tracking-wider uppercase transition-all backdrop-blur-md pointer-events-auto min-h-[36px] flex items-center justify-center touch-manipulation ${
          isSplit ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Sari peste introducere"
      >
        Sari intro →
      </button>

    </div>
    );
  }

  return null;
};
