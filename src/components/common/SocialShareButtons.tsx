import React, { useState } from 'react';
import { Share2, Facebook, Instagram, Copy, Check, MessageCircle } from 'lucide-react';
import { VehicleItem } from '../../db/types';
import { getStockNumber } from '../../utils/helpers';
import { generateInstagramCaption } from '../../utils/socialCopyGenerator';

interface SocialShareButtonsProps {
  car: VehicleItem;
  className?: string;
  showToast?: (msg: string) => void;
  variant?: 'compact' | 'full';
}

// 🛡️ Helper copiere în clipboard cu dublu fallback (Modern API + execCommand)
const copyToClipboard = async (text: string): Promise<boolean> => {
  // 1. Încercare cu API-ul modern navigator.clipboard dacă este disponibil
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('Clipboard writeText failed, using fallback:', e);
    }
  }

  // 2. Fallback robust pentru HTTP / iframe / browsere mobile
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback execCommand copy error:', err);
    return false;
  }
};

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  car,
  className = '',
  showToast,
  variant = 'compact'
}) => {
  const [copied, setCopied] = useState(false);

  const stockRef = getStockNumber(car);
  const shareTitle = `${car.brand} ${car.model} (${car.year}) • RXM Automobile Cluj`;
  const shareText = `Descoperă acest ${car.brand} ${car.model} la RXM Automobile Cluj-Napoca (Ref: ${stockRef}, Preț: ${car.priceEur.toLocaleString('ro-RO')} €).`;

  // URL de partajare securizat
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rxmautomobile.ro';
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const publicShareUrl = isLocal 
    ? `https://rxmautomobile.ro/#catalog?car=${car.id}`
    : `${origin}/#catalog?car=${car.id}`;

  // URL oficial Facebook Sharer
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicShareUrl)}`;

  // URL universal WhatsApp Click-to-Chat (api.whatsapp.com/send funcționează direct pe mobil și web fără eroare de număr lipsă)
  const waShareText = `🚗 *${shareTitle}*\n💰 Preț: ${car.priceEur.toLocaleString('ro-RO')} € (Ref: ${stockRef})\n\n👉 Vezi galeria completă și detalii:\n${publicShareUrl}`;
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    await copyToClipboard(publicShareUrl);
    setCopied(true);
    if (showToast) {
      showToast('🔗 Link-ul mașinii a fost copiat în clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareInstagram = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const captionData = generateInstagramCaption(car);
    const instaText = captionData.fullCaption;
    await copyToClipboard(instaText);
    setCopied(true);
    if (showToast) {
      showToast('📸 Descrierea optimizată și hashtag-urile au fost copiate! Se deschide Instagram...');
    }
    setTimeout(() => setCopied(false), 2500);
    // Deschide Instagram într-o filă nouă
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: publicShareUrl,
        });
        return;
      } catch (err) {
        // Ignoră anularea utilizatorului
      }
    }
    await handleCopyLink();
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <a
          href={fbShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Distribuie pe Facebook"
          className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 hover:text-white transition-all touch-manipulation active:scale-95 inline-flex items-center justify-center"
          aria-label="Distribuie pe Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={handleShareInstagram}
          title="Copiază descrierea și deschide Instagram"
          className="p-1.5 rounded-lg bg-pink-600/10 hover:bg-pink-600/25 border border-pink-500/20 text-pink-400 hover:text-white transition-all touch-manipulation active:scale-95 inline-flex items-center justify-center"
          aria-label="Copiază pentru Instagram"
        >
          <Instagram className="w-3.5 h-3.5" />
        </button>

        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Trimite pe WhatsApp"
          className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 hover:text-white transition-all touch-manipulation active:scale-95 inline-flex items-center justify-center"
          aria-label="Trimite pe WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={handleNativeShare}
          title="Partajează sau copiază link"
          className={`p-1.5 rounded-lg border transition-all touch-manipulation active:scale-95 flex items-center gap-1 text-[11px] ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-amber-300'
          }`}
          aria-label="Partajează mașina"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl bg-black/40 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-amber-400" /> Distribuie acest autoturism:
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Ref: {stockRef}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <a
          href={fbShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Distribuie pe Facebook"
          className="py-2 px-2.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer"
        >
          <Facebook className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px]">Facebook</span>
        </a>

        <button
          type="button"
          onClick={handleShareInstagram}
          title="Copiază link-ul și deschide Instagram"
          className="py-2 px-2.5 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/30 text-pink-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer"
        >
          <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px]">Instagram</span>
        </button>

        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Trimite pe WhatsApp"
          className="py-2 px-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px]">WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={handleCopyLink}
          title="Copiază link-ul direct al mașinii"
          className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer ${
            copied 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="text-[11px]">{copied ? 'Copiat!' : 'Link'}</span>
        </button>
      </div>
    </div>
  );
};
