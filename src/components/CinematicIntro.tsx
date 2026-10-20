import React, { useEffect, useState } from 'react';

interface CinematicIntroProps {
  onSplit?: () => void;
  onComplete?: () => void;
  forceReplay?: boolean;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onSplit, onComplete, forceReplay = false }) => {
  const [phase, setPhase] = useState<'loading' | 'split' | 'done'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isForcedUrl = urlParams.get('intro') === 'true' || urlParams.get('intro') === '1' || window.location.hash === '#intro';
      if (isForcedUrl || forceReplay) {
        return 'loading';
      }
      
      // În modul de dezvoltare (DEV) ignorăm cheia permanentă din localStorage pentru a permite testarea la F5
      if (import.meta.env.DEV) {
        if (sessionStorage.getItem('rxm_intro_seen')) {
          return 'done';
        }
        return 'loading';
      }

      if (sessionStorage.getItem('rxm_intro_seen') || localStorage.getItem('rxm_intro_seen')) {
        return 'done';
      }
    }
    return 'loading';
  });
  const [progressRatio, setProgressRatio] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    if (phase === 'done') {
      if (onSplit) onSplit();
      if (onComplete) onComplete();
      return;
    }

    // Siguranță absolută: watchdog timer care deblochează ecranul dacă requestAnimationFrame e întârziat/suspendat de browser
    // Durată totală timeline: 1800ms (progres) + 100ms (laser pulse) + 800ms (glisare cortină) = 2700ms
    // Watchdog setat la 3800ms (buffer de siguranță de 1.1s peste durata normală)
    const watchdogTimer = setTimeout(() => {
      handleSkip();
    }, 3800);

    // Animație contor fluid de precizie (0 -> 100%) cu curbă organică easeInOut
    const startTime = performance.now();
    const duration = 1800; // 1.8 secunde: ritm optim, evită senzația de blocaj sau ecran negru

    let animFrame: number;
    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const linearRatio = Math.min(1, Math.max(0, elapsed / duration));
      
      // Curbă organică continuă (start fin, croazieră elegantă, decelerare fluidă la 100%)
      const ease = linearRatio < 0.5 
        ? 4 * linearRatio * linearRatio * linearRatio 
        : 1 - Math.pow(-2 * linearRatio + 2, 3) / 2;

      setProgressRatio(ease);
      setDisplayPct(Math.min(100, Math.round(ease * 100)));

      if (linearRatio < 1) {
        animFrame = requestAnimationFrame(updateProgress);
      } else {
        // La 100%, o scurtă pulsație de laser de 100ms înainte de despicarea cortinei
        setTimeout(() => {
          setPhase('split');
          // Declanșează imediat apariția fluidă din spate a elementelor din scenă (fără așteptare abruptă)
          if (onSplit) onSplit();
          // Marchează sesiunea și dispozitivul ca vizualizat
          try {
            sessionStorage.setItem('rxm_intro_seen', 'true');
            if (!import.meta.env.DEV) {
              localStorage.setItem('rxm_intro_seen', 'true');
            }
          } catch {
            // Ignore storage access errors
          }

          // După glisarea panourilor (~800ms), finalizează complet
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
  }, []);

  const handleSkip = () => {
    try {
      sessionStorage.setItem('rxm_intro_seen', 'true');
      if (!import.meta.env.DEV) {
        localStorage.setItem('rxm_intro_seen', 'true');
      }
    } catch {
      // Ignore storage access errors
    }
    setPhase('done');
    if (onSplit) onSplit();
    if (onComplete) onComplete();
  };

  if (phase === 'done') return null;

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
        {/* Glow ambient auriu subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* 🎬 Panoul de Jos (Bottom Curtain) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[50.1%] bg-[#08080a] border-t border-amber-500/20 transition-transform duration-1000 ease-[cubic-bezier(0.85,0,0.15,1)] will-change-transform z-10 ${
          isSplit ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Glow ambient auriu subtil */}
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
          
          {/* Top Brand Tagline & Emblem */}
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

          {/* Sloganul Editorial de Impact */}
          <h1 className="font-['Playfair_Display'] italic text-3xl sm:text-5xl md:text-6xl text-[#fef3c7] font-normal tracking-tight leading-[1.15] mb-8 max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            „Fiecare drum începe cu alegerea potrivită.”
          </h1>

          {/* Bară Subțire de Precizie & Procentaj (120FPS GPU Accelerated) */}
          <div className="w-full max-w-md flex flex-col items-center gap-2">
            <div className="w-full h-[2.5px] bg-zinc-800/80 rounded-full overflow-hidden relative">
              <div 
                className="h-full w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 rounded-full origin-left will-change-transform shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                style={{ transform: `scaleX(${progressRatio})` }}
              />
              {/* Capăt luminos mobil (Laser Spark Head) */}
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

      {/* ⏭️ Buton discret de „Sari intro” (protejat de notch / Dynamic Island) */}
      <button
        onClick={handleSkip}
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