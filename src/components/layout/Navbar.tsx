import React, { useState } from 'react';
import { 
  Truck, Calculator, ArrowLeftRight, Play, 
  LayoutDashboard, MessageCircle, Menu, X, Car, Shield, Phone, MapPin
} from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { NavigationModal } from '../modals/NavigationModal';
import { useScrollDirection } from '../../hooks/useScrollDirection';

interface NavbarProps {
  totalCarsCount: number;
  viewMode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin';
  setViewMode: (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin') => void;
  dealer?: typeof SEED_DEALER;
  isRevealed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCarsCount,
  viewMode,
  setViewMode,
  dealer = SEED_DEALER,
  isRevealed = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  // Hook reactiv Headroom (60 FPS, passive listener, anti-jitter)
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 15, topOffset: 60 });

  // Reguli dinamice de afișare/ascundere:
  // 1. Meniul mobil deschis forțează navbar-ul să rămână vizibil permanent
  // 2. La scroll în jos, dincolo de Hero, navbar-ul se retrage lin (-translate-y-full)
  // 3. La cel mai mic impuls în sus, navbar-ul reapare instant cu umbră profundă de lux
  const isHidden = isRevealed && !isAtTop && scrollDirection === 'down' && !mobileMenuOpen;
  const isElevated = !isAtTop && scrollDirection === 'up';

  // Navigare fluidă la secțiunile din Showroom cu calcul precis de offset
  const navigateToSection = (sectionId: string) => {
    setMobileMenuOpen(false);

    const performScroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 90;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    };

    if (viewMode !== 'showroom') {
      setViewMode('showroom');
      setTimeout(performScroll, 120);
    } else {
      setTimeout(performScroll, 60);
    }
  };

  // Navigare către paginile dedicate (Livrare, Termeni, Cookies, Showroom)
  const navigateToView = (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies') => {
    setMobileMenuOpen(false);
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Click pe Logo: 1-Tap Return-to-Top fluid fără reîncărcare
  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    if (viewMode !== 'showroom') {
      setViewMode('showroom');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl no-print transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
      !isRevealed 
        ? 'opacity-0 -translate-y-4 pointer-events-none bg-[#09090b]/95 border-b border-white/[0.08]' 
        : isHidden
          ? 'opacity-100 -translate-y-full shadow-none bg-[#09090b]/95 border-b border-white/[0.08]'
          : isElevated
            ? 'opacity-100 translate-y-0 shadow-2xl bg-[#09090b]/95 border-b border-white/[0.12]'
            : 'opacity-100 translate-y-0 shadow-none bg-[#09090b]/95 border-b border-white/[0.08]'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Monogram — 1-Tap Return to Top */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 group touch-manipulation" 
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogoClick();
            }
          }}
          title="RXM Automobile — Înapoi la începutul paginii"
          aria-label="RXM Automobile — Dealer Auto Rulate Cluj — Revenire la începutul paginii showroom"
        >
          <img 
            src="/images/rxm-emblem.png" 
            alt="RXM Emblem" 
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain filter invert brightness-150 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)] shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col min-w-0">
            <img 
              src="/images/rxm-logo.png" 
              alt="RXM Automobile" 
              width={112}
              height={28}
              className="h-5 sm:h-7 w-auto object-contain filter invert brightness-200 group-hover:brightness-125 transition-all"
            />
            <p className="text-[7.5px] sm:text-[9px] text-amber-400 font-medium uppercase tracking-[0.12em] sm:tracking-[0.2em] -mt-0.5 truncate">Dealer Auto Rulate • Cluj</p>
          </div>
        </div>

        {/* Desktop Navigation (>= lg) — Editorial, curat, fără iconițe redundante înghesuite */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13.5px] xl:text-sm font-medium text-zinc-300">
          <button 
            type="button"
            onClick={() => navigateToSection('catalog')} 
            className={`transition-colors font-semibold flex items-center gap-2 cursor-pointer ${
              viewMode === 'showroom' ? 'text-amber-400' : 'hover:text-white'
            }`}
          >
            <span>Stoc Auto</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm">
              {totalCarsCount}
            </span>
          </button>
          
          <button 
            type="button"
            onClick={() => navigateToSection('garantie')} 
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            Garanție
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('comanda')} 
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            La Comandă
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('finantare')} 
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            Finanțare
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('buyback')} 
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            Buy-Back
          </button>

          <button 
            type="button"
            onClick={() => navigateToView('delivery')} 
            className={`transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'delivery' ? 'text-amber-400 font-bold' : 'hover:text-amber-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Livrare Națională</span>
          </button>

          {viewMode === 'admin' && (
            <button 
              type="button"
              onClick={() => navigateToView('showroom')} 
              className="text-amber-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>← Showroom</span>
            </button>
          )}

          {(viewMode === 'terms' || viewMode === 'delivery' || viewMode === 'cookies') && (
            <button 
              type="button"
              onClick={() => navigateToView('showroom')} 
              className="text-amber-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>← Înapoi la Stoc</span>
            </button>
          )}
        </nav>

        {/* Right Actions: TikTok Badge + WhatsApp Showroom + Mobile Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* TikTok Badge discret Luxury */}
          <a 
            href={dealer.tiktokUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 hover:bg-[#fe2c55]/20 border border-white/10 hover:border-[#fe2c55]/40 text-zinc-300 hover:text-white transition-all shadow-sm group touch-manipulation"
            title="Urmărește clipurile TikTok @rxm.automobile"
            aria-label="Canal Oficial TikTok RXM Automobile"
          >
            <Play className="w-3.5 h-3.5 fill-[#fe2c55] text-[#fe2c55] group-hover:scale-110 transition-transform" />
          </a>

          {/* Buton WhatsApp Showroom — Design Dark Luxury Compact & Ergonomic */}
          <a 
            href={`https://wa.me/${dealer.whatsappNumber}?text=Bună%20ziua!%20Sunt%20interesat%20de%20mașinile%20din%20stocul%20RXM%20Automobile.`} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="WhatsApp Showroom - Contactează RXM Automobile"
            className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-[13px] h-9 sm:h-10 px-2.5 sm:px-4 rounded-xl shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all touch-manipulation shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>WhatsApp Showroom</span>
          </a>

          {/* Mobile Menu Hamburger Button (Garantat vizibil, min-w 44px touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Închide meniul principal" : "Deschide meniul principal"}
            className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-zinc-300 hover:text-white transition-all touch-manipulation shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Slide-Down Menu (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0c0c0e]/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top-4 duration-200 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => navigateToSection('catalog')}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between min-h-[44px] touch-manipulation cursor-pointer ${
                viewMode === 'showroom' ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-amber-400" />
                <span>Mașini în stoc</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-black font-mono font-bold">
                {totalCarsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('garantie')}
              className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-200 hover:bg-white/5 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Garanție până la 36 Luni</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('comanda')}
              className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-200 hover:bg-white/5 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Mașini la Comandă</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('finantare')}
              className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-200 hover:bg-white/5 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Finanțare Rate (0% Avans)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('buyback')}
              className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-200 hover:bg-white/5 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
              <span>Buy-Back & Schimb Auto</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToView('delivery')}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-h-[44px] touch-manipulation cursor-pointer ${
                viewMode === 'delivery' ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Livrare în toată România</span>
            </button>

            <a
              href={dealer.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-200 hover:bg-white/5 min-h-[44px] touch-manipulation"
            >
              <Play className="w-4 h-4 fill-[#fe2c55] text-[#fe2c55]" />
              <span>TikTok Prezentări HD</span>
            </a>

            {viewMode === 'admin' && (
              <button
                type="button"
                onClick={() => navigateToView('showroom')}
                className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-h-[44px] touch-manipulation bg-amber-500 text-black font-bold cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>← Înapoi în Showroom</span>
              </button>
            )}

            {(viewMode === 'terms' || viewMode === 'delivery' || viewMode === 'cookies') ? (
              <button
                type="button"
                onClick={() => navigateToView('showroom')}
                className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 min-h-[44px] touch-manipulation bg-amber-500 text-black font-bold cursor-pointer"
              >
                <Car className="w-4 h-4" />
                <span>← Înapoi în Showroom</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateToView('terms')}
                className="w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-2.5 text-zinc-300 hover:bg-white/5 min-h-[44px] touch-manipulation text-xs cursor-pointer"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Termeni & Condiții / GDPR</span>
              </button>
            )}
          </div>

          {/* Quick Call & Location Row inside Mobile Menu */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsNavModalOpen(true);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white text-xs flex items-center justify-center gap-2 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Locație (GPS)</span>
            </button>
            <a
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-center gap-2 min-h-[44px] touch-manipulation font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Sună: {dealer.phonePrimary}</span>
            </a>
          </div>
        </div>
      )}

      {/* Modal Navigație GPS (Google Maps vs Waze) */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        dealer={dealer}
      />
    </header>
  );
};
