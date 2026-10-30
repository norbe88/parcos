import { useState, useEffect, useCallback } from 'react';

export interface AntiScreenCaptureOptions {
  /** Dacă scutul de protecție este activ (ex: doar când galeria / modalul e deschis) */
  enabled?: boolean;
  /** Mesaj sau callback la interceptarea unei tentative de screenshot / copiere */
  onCaptureAttempt?: (message: string) => void;
  /** Activează blur-ul la pierderea focusului ferestrei (Snipping Tool defense) */
  blurOnFocusLoss?: boolean;
  /** Denumirea oficială a dealerului pentru personalizarea notificării de copyright */
  dealerName?: string;
}

export interface AntiScreenCaptureResult {
  /** True dacă fereastra a pierdut focusul și trebuie aplicat blur de protecție */
  isShieldActive: boolean;
  /** Golire forțată clipboard la nevoie */
  clearClipboard: () => void;
  /** Textul legal de protecție a drepturilor de autor */
  copyrightNotice: string;
}

export function getCopyrightLegalNotice(dealerName = 'RXM AUTO MOBILE SRL'): string {
  return `Fotografiile și conținutul tehnic sunt protejate de drepturi de autor ${dealerName} conform Legii nr. 8/1996. Preluarea sau multiplicarea este interzisă.`;
}

export const RXM_COPYRIGHT_LEGAL_NOTICE = getCopyrightLegalNotice('RXM AUTO MOBILE SRL');

export function useAntiScreenCapture(options: AntiScreenCaptureOptions = {}): AntiScreenCaptureResult {
  const {
    enabled = true,
    onCaptureAttempt,
    blurOnFocusLoss = true,
    dealerName = 'RXM AUTO MOBILE SRL'
  } = options;

  const copyrightNotice = getCopyrightLegalNotice(dealerName);

  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);

  const clearClipboard = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {
        // Ignoră erorile silențioase de permisiune clipboard
      });
    }
  }, []);

  // 1. Interceptare tastă PrintScreen & scurtături de captură ecran (cu bypass în Admin / Print)
  useEffect(() => {
    if (!enabled) return;

    // Bypass complet dacă suntem în Admin sau mod Documente Oficiale
    const isAdminOrDoc = 
      typeof window !== 'undefined' && 
      (window.location.hash.includes('admin') || 
       (window as any).__RXM_ALLOW_SAVE__ === true);

    if (isAdminOrDoc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Interceptare tastă PrintScreen (Windows/Linux)
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        clearClipboard();
        setIsShieldActive(true);
        if (onCaptureAttempt) {
          onCaptureAttempt(copyrightNotice);
        }
        return;
      }

      // Blocare combinatii uzuale de salvare/tipărire neautorizată
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (onCaptureAttempt) {
          onCaptureAttempt('Salvarea directă a fotografiilor este restricționată. Consultați fișa tehnică oficială PDF.');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        clearClipboard();
        // După 1 secundă de la PrintScreen, se poate relaxa scutul dacă focusul s-a menținut
        setTimeout(() => {
          if (document.hasFocus()) {
            setIsShieldActive(false);
          }
        }, 1200);
      }
    };

    const handleBeforePrint = () => {
      setIsShieldActive(false);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleBeforePrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleBeforePrint);
    };
  }, [enabled, clearClipboard, onCaptureAttempt]);

  // 2. Focus-Loss Shield (Treapta 3: Snipping Tool / ShareX defense)
  useEffect(() => {
    if (!enabled || !blurOnFocusLoss) return;

    const isAdminOrDoc = 
      typeof window !== 'undefined' && 
      (window.location.hash.includes('admin') || 
       (window as any).__RXM_ALLOW_SAVE__ === true);

    if (isAdminOrDoc) return;

    const handleBlur = () => {
      // Când fereastra browserului pierde focusul (ex: utilizatorul deschide Snipping Tool sau altă fereastră)
      setIsShieldActive(true);
    };

    const handleFocus = () => {
      // Când utilizatorul revine cu focusul în pagină
      setIsShieldActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsShieldActive(true);
      } else {
        setIsShieldActive(false);
      }
    };

    const handleBeforePrint = () => {
      setIsShieldActive(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleBeforePrint);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleBeforePrint);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, blurOnFocusLoss]);

  return {
    isShieldActive,
    clearClipboard,
    copyrightNotice
  };
}
