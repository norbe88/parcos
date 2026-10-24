import React, { useEffect } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';
import { VehicleItem, DealerProfile } from '../../db/seed';

export interface MobileTikTokPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: VehicleItem | null;
  videoId: string | null;
  dealer: DealerProfile;
  onSelectCar: (car: VehicleItem) => void;
}

export const MobileTikTokPlayerModal: React.FC<MobileTikTokPlayerModalProps> = ({
  isOpen,
  onClose,
  car,
  videoId,
  dealer,
  onSelectCar,
}) => {
  // Închidere modal TikTok pe Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[92dvh] bg-[#121215] border border-white/15 rounded-3xl p-4 shadow-2xl shadow-black relative flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
        {/* Buton Închidere */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white min-w-[40px] min-h-[40px] flex items-center justify-center z-30 touch-manipulation cursor-pointer active:scale-95 transition-all"
          aria-label="Închide video TikTok"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Pop-out */}
        <div className="w-full flex items-center gap-2 mb-3 pr-10">
          <div className="w-7 h-7 rounded-full bg-[#fe2c55]/20 border border-[#fe2c55]/40 flex items-center justify-center shrink-0">
            <Play className="w-3.5 h-3.5 fill-[#fe2c55] text-[#fe2c55]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {car ? `${car.brand} ${car.model} (${car.year})` : `${dealer.name} Showroom`}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              {dealer.tiktokHandle} · Prezentare Video HD
            </p>
          </div>
        </div>

        {/* Frame Video 9:16 */}
        <div className="relative w-full aspect-[9/16] max-h-[62dvh] rounded-2xl overflow-hidden bg-black border border-white/10">
          {videoId ? (
            <iframe
              src={`https://www.tiktok.com/player/v1/${videoId}?embed_from=oembed&autoplay=1&music_info=1&description=1&volume_control=1`}
              title={`TikTok ${dealer.name} - ${car?.brand || ''} ${car?.model || ''}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <Play className="w-12 h-12 text-[#fe2c55] fill-[#fe2c55]/20 mb-3" />
              <p className="text-sm font-semibold text-white mb-1">Clipul se deschide în TikTok</p>
              <p className="text-xs text-zinc-400 mb-4">Urmărește prezentările complete ale parcului auto</p>
              <a
                href={dealer.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#fe2c55] text-white font-bold text-xs"
              >
                Deschide pe TikTok
              </a>
            </div>
          )}
        </div>

        {/* Butoane Acțiune Pop-out */}
        <div className="w-full mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/08">
          <a
            href={car?.tiktokUrl || dealer.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1 active:scale-95 transition-all"
          >
            <span>Deschide în App TikTok</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {car && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCar(car);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold active:scale-95 transition-all"
            >
              Vezi Mașina ({car.priceEur.toLocaleString('ro-RO')} €)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
