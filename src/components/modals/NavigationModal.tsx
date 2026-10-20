import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Copy, Check, ExternalLink, Compass, Clock, Navigation } from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealer?: DealerProfile;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  dealer = SEED_DEALER
}) => {
  const [copied, setCopied] = useState(false);

  // Închidere la tasta Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevenire scroll de fundal când modalul este deschis pe mobil/desktop
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(dealer.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback dacă permisiunea clipboard e blocată
      const input = document.createElement('input');
      input.value = dealer.address;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Locație oficială Google Maps & GPS pentru Showroom RXM Automobile Cluj-Napoca
  const OFFICIAL_RXM_MAPS_URL = "https://www.google.com/maps/place/RXM+Automobile/@46.7987323,23.6716857,17z/data=!3m1!4b1!4m6!3m5!1s0x691a396c3c3458f3:0x9cec8cb127b27fff!8m2!3d46.7987287!4d23.6742606!16s%2Fg%2F11zfqg_ndk?hl=en-GB&entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D";
  const SHOWROOM_LAT = 46.7987287;
  const SHOWROOM_LNG = 23.6742606;

  const isRxm = !dealer.name || dealer.name.includes('RXM') || dealer.cui === 'RO48482214';
  const mapQuery = isRxm 
    ? 'RXM+Automobile+Cluj' 
    : encodeURIComponent(`${dealer.name} ${dealer.showroomAddress || dealer.address}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  const googleMapsUrl = isRxm
    ? (dealer.googleMapsUrl || OFFICIAL_RXM_MAPS_URL)
    : (dealer.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(dealer.address)}`);
  const wazeUrl = isRxm
    ? `https://waze.com/ul?ll=${SHOWROOM_LAT},${SHOWROOM_LNG}&q=RXM+Automobile+Cluj&navigate=yes`
    : (dealer.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(dealer.address)}&navigate=yes`);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nav-modal-title"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#121215] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/95 relative overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto"
      >
        {/* Glow discret amber de fundal */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/08 rounded-full blur-3xl pointer-events-none" />

        {/* Buton Închidere */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation z-20"
          aria-label="Închide fereastra de navigare"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Antet Modal */}
        <div className="flex items-start gap-3.5 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner shadow-amber-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10.5px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Locație Showroom • Cluj-Napoca
            </div>
            <h2 id="nav-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              Alege Aplicația de Navigare
            </h2>
          </div>
        </div>

        {/* 🗺️ Hartă Interactivă Showroom — Cluj-Napoca (Colonia Hodai F.N.) */}
        <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden border border-white/10 mb-4 bg-zinc-900 relative shadow-inner">
          <iframe
            title="Harta Locație Showroom RXM Automobile Cluj-Napoca"
            src={mapEmbedUrl}
            className="w-full h-full border-0 filter contrast-[1.08] brightness-[0.95]"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* Card Adresă cu buton de copiere */}
        <div className="mb-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/08 relative group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider block">Adresă Showroom & Vânzări</span>
                <p className="text-xs sm:text-sm font-medium text-white leading-snug mt-0.5 select-all">
                  {dealer.address}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer touch-manipulation ${
                copied 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title="Copiază adresa completă"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copiat!' : 'Copiază'}</span>
            </button>
          </div>
        </div>

        {/* Opțiuni Navigare: Google Maps & Waze */}
        <div className="space-y-2.5 mb-4">
          {/* Buton Google Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/05 to-transparent hover:from-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 active:scale-[0.99] transition-all flex items-center justify-between gap-3 group text-left touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5 fill-emerald-500/30 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span>Google Maps</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-normal">Recomandat</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Deschide traseul în aplicația Google Maps
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>

          {/* Buton Waze */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/05 to-transparent hover:from-sky-500/20 border border-sky-500/25 hover:border-sky-500/40 active:scale-[0.99] transition-all flex items-center justify-between gap-3 group text-left touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5 fill-sky-500/30 text-sky-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                  <span>Waze GPS</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-normal">Live Trafic</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Navigare pas cu pas cu alerte de trafic în Waze
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-sky-400/80 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>
        </div>

        {/* Footer Program Showroom */}
        <div className="pt-3 border-t border-white/06 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{dealer.openingHours}</span>
          </div>
        </div>

        {/* Buton Închide pe mobil */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-300 font-medium text-xs text-center border border-white/10 transition-all touch-manipulation sm:hidden cursor-pointer min-h-[44px]"
        >
          Închide
        </button>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
