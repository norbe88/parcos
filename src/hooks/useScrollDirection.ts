import { useState, useEffect, useRef } from 'react';

export interface UseScrollDirectionOptions {
  /** Pragul minim de deplasare în pixeli pentru declanșarea schimbării de direcție (anti-jitter / hysteresis) */
  threshold?: number;
  /** Distanța de la vârful paginii sub care header-ul este forțat să rămână vizibil */
  topOffset?: number;
  /** Activează sau dezactivează ascultarea */
  enabled?: boolean;
}

export interface ScrollDirectionResult {
  scrollDirection: 'up' | 'down';
  isAtTop: boolean;
  scrollY: number;
}

/**
 * Hook reactiv de înaltă performanță (Headroom pattern)
 * Detectează direcția de derulare a paginii cu requestAnimationFrame și passive listeners.
 * Garantează 60 FPS și previne flicker-ul pe ecrane tactile iOS/Android.
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirectionResult {
  const {
    threshold = 15,
    topOffset = 60,
    enabled = true
  } = options;

  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [scrollY, setScrollY] = useState<number>(0);

  const prevScrollY = useRef<number>(0);
  const ticking = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Inițializare poziție curentă
    const currentInitialY = window.pageYOffset || document.documentElement.scrollTop || 0;
    prevScrollY.current = currentInitialY;
    setScrollY(currentInitialY);
    setIsAtTop(currentInitialY <= topOffset);

    const updateScrollDirection = () => {
      // Dacă un modal a blocat scroll-ul pe body, îngheață starea pentru a preveni salturi
      if (document.body.style.overflow === 'hidden') {
        ticking.current = false;
        return;
      }

      const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
      setScrollY(currentY);

      // Prevenire bounce / rubber-banding pe iOS Safari (valori negative la scroll sus violent)
      if (currentY < 0) {
        ticking.current = false;
        return;
      }

      // Zona superioară (Hero / Topbar): Header-ul este întotdeauna vizibil
      if (currentY <= topOffset) {
        setIsAtTop(true);
        setScrollDirection('up');
        prevScrollY.current = currentY;
        ticking.current = false;
        return;
      }

      setIsAtTop(false);

      const diff = currentY - prevScrollY.current;

      // Schimbare de direcție doar dacă deplasarea depășește pragul (anti-tremurat)
      if (Math.abs(diff) >= threshold) {
        setScrollDirection(diff > 0 ? 'down' : 'up');
        prevScrollY.current = currentY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, threshold, topOffset]);

  return { scrollDirection, isAtTop, scrollY };
}
