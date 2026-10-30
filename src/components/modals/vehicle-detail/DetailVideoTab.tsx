import React, { useRef, useEffect } from 'react';
import { Play, Video, ExternalLink, MessageCircle } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../../db/seed';
import { parseTikTokUrl, isTikTokVideoUrl, getWhatsAppVideoUrl, initializeTikTokVolume } from '../../../utils/helpers';

interface DetailVideoTabProps {
  car: VehicleItem;
  videoFormat: 'tiktok' | 'youtube';
  setVideoFormat: (fmt: 'tiktok' | 'youtube') => void;
  dealer?: typeof SEED_DEALER;
}

export const DetailVideoTab: React.FC<DetailVideoTabProps> = ({
  car,
  videoFormat,
  setVideoFormat,
  dealer = SEED_DEALER
}) => {
  const tt = parseTikTokUrl(car.tiktokUrl);
  const hasTikTok = isTikTokVideoUrl(car.tiktokUrl);
  const hasYoutube = !!car.videoUrl && !car.videoUrl.includes('ysz5S6PUM-U');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inițializare automată volum 60% și activare audio la comutare pe TikTok
  useEffect(() => {
    if (hasTikTok && videoFormat === 'tiktok' && iframeRef.current) {
      const cleanup = initializeTikTokVolume(iframeRef.current, 60, true);
      return cleanup;
    }
  }, [car.id, videoFormat, hasTikTok]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Format Switcher (dacă mașina are și TikTok Reel 9:16 și YouTube 16:9) */}
      {hasTikTok && hasYoutube && (
        <div className="flex items-center justify-center gap-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setVideoFormat('tiktok')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              videoFormat === 'tiktok'
                ? 'bg-[#fe2c55] text-white shadow-md shadow-[#fe2c55]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Reel TikTok (9:16)</span>
          </button>
          <button
            type="button"
            onClick={() => setVideoFormat('youtube')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              videoFormat === 'youtube'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>YouTube HD (16:9)</span>
          </button>
        </div>
      )}

      {/* Video Player Frame */}
      {hasTikTok && videoFormat === 'tiktok' ? (
        <div className="relative py-2 flex flex-col items-center">
          {/* Ambient Glow TikTok (Neon Pink & Cyan) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 blur-2xl" 
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(254,44,85,0.25) 0%, rgba(37,244,238,0.12) 40%, transparent 70%)'
            }}
          />

          {/* 9:16 Vertical Video Frame */}
          <div className="w-full max-w-[340px] sm:max-w-[350px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/15 relative shadow-2xl shadow-[#fe2c55]/10 z-10">
            {tt.embedUrl ? (
              <iframe 
                ref={iframeRef}
                src={tt.embedUrl}
                title={`Prezentare TikTok ${car.brand} ${car.model}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                allowFullScreen 
                loading="lazy"
                onLoad={() => {
                  initializeTikTokVolume(iframeRef.current, 60, true);
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
                <div className="w-16 h-16 rounded-2xl bg-[#fe2c55]/20 border border-[#fe2c55]/40 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-[#fe2c55] fill-[#fe2c55]" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Prezentare Video TikTok</h4>
                <p className="text-zinc-400 text-xs mb-4">Vizualizează clipul complet realizat de {dealer.name} direct pe platforma oficială.</p>
                <a 
                  href={car.tiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-[#e0264b] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#fe2c55]/30"
                >
                  <span>Deschide Video pe TikTok</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Buton Acțiune Directă */}
          <div className="mt-4 flex items-center justify-center z-10">
            <a 
              href={car.tiktokUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#e0264b] hover:brightness-110 text-white font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 shadow-lg shadow-[#fe2c55]/25"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Deschide în aplicația TikTok</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : hasYoutube ? (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 relative shadow-xl">
          <iframe 
            src={car.videoUrl} 
            title={`Prezentare Video ${car.brand} ${car.model}`}
            className="w-full h-full border-0"
            allowFullScreen 
            loading="lazy"
          />
        </div>
      ) : (
        <div className="text-center py-10 px-4 bg-white/[0.02] rounded-2xl border border-white/08 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div className="font-bold text-white text-sm">Nu este încă atașat un clip video pentru această mașină</div>
          <p className="text-zinc-400 text-xs max-w-md mx-auto">
            Echipa {dealer.name} filmează periodic walkaround-uri. Solicită un video detaliat pe WhatsApp și consultantul nostru ți-l va trimite în câteva minute.
          </p>
          <a 
            href={getWhatsAppVideoUrl(car, dealer.whatsappNumber)}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Solicită Tur Video pe WhatsApp</span>
          </a>
        </div>
      )}

      {/* Card Canal Oficial TikTok */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-[#121215] to-black border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fe2c55]/20 border border-[#fe2c55]/40 flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-[#fe2c55] fill-[#fe2c55]" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Canal Oficial TikTok:</span>
              <span className="text-[#fe2c55] font-mono">{dealer.tiktokHandle}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Urmărește clipurile scurte și tururile video cu mașinile din stocul nostru.
            </p>
          </div>
        </div>

        <a 
          href={dealer.tiktokUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Vezi Tot Canalul</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
