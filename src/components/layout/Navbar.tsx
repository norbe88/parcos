import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageCircle, Menu, X, Sun, Moon, 
  Shield, Calculator, ArrowLeftRight, CheckCircle2, MapPin
} from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';
import { TenantBrandBadge } from '../common/TenantBrandBadge';
import { useTenantContext } from '../../context/TenantContext';

interface NavbarProps {
  totalCarsCount: number;
  viewMode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin' | 'ghid-auto';
  setViewMode: (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin' | 'ghid-auto') => void;
  dealer?: DealerProfile;
  isRevealed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCarsCount,
  viewMode,
  setViewMode,
  dealer = SEED_DEALER,
  isRevealed = true
}) => {
  const contact = resolveDealerContact(dealer);
  const { themeMode, toggleThemeMode } = useTenantContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevenire scroll pe body când meniul mobil este deschis
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navigateToSection = (sectionId: string) => {
    setMobileMenuOpen(false);

    const performScroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80;
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
      setTimeout(performScroll, 50);
    }
  };

  const navigateToView = (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'ghid-auto') => {
    setMobileMenuOpen(false);
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    if (viewMode !== 'showroom') {
      setViewMode('showroom');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 no-print will-change-transform ${
        !isRevealed ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      } ${
        isScrolled || mobileMenuOpen
          ? 'bg-[var(--surface,#131A24)]/90 backdrop-blur-md border-b border-[var(--line,rgba(255,255,255,0.08))] shadow-lg'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[60px] md:h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo & Nume */}
        <div className="flex items-center gap-3">
          <TenantBrandBadge 
            dealer={dealer} 
            variant="navbar"
            onClick={handleLogoClick}
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav 
          aria-label="Navigație Principală Showroom"
          className="hidden lg:flex items-center gap-7 text-[14px] font-montserrat font-medium text-[var(--text-muted,#A3ABB6)]"
        >
          <button 
            type="button"
            onClick={() => navigateToSection('catalog')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer flex items-center gap-2 group py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            <span className="font-semibold text-[var(--text,#F4F6F9)]">Stoc</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[var(--surface-2,#1B2431)] text-[var(--accent-text,#F04D4D)] border border-[var(--line,rgba(255,255,255,0.08))] tabular-nums">
              {totalCarsCount}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('finantare')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            Finanțare
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('cont-garantie')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            Cont de Garanție
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('garantie')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            Garanție
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('servicii')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            Servicii & Buy-Back
          </button>

          <button 
            type="button"
            onClick={() => navigateToSection('contact')} 
            className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[var(--accent,#D83333)]"
          >
            Contact
          </button>
        </nav>

        {/* Right Actions: Theme Toggle, Sună Acum, Hamburger */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Comutator Temă: Dark / Light */}
          <button
            type="button"
            onClick={toggleThemeMode}
            aria-label={`Comută tema pe modul ${themeMode === 'dark' ? 'luminos' : 'întunecat'}`}
            aria-pressed={themeMode === 'light'}
            title={`Tema curentă: ${themeMode === 'dark' ? 'Întunecat' : 'Luminos'}. Apasă pentru comutare.`}
            className="w-10 h-10 rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--metal,#C9CED6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Primary CTA Button: Sună Acum */}
          {contact.salesPhoneClean && (
            <a
              href={`tel:${contact.salesPhoneClean}`}
              className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[14px] shadow-[var(--shadow-cta)] transition-all touch-manipulation active:scale-[0.98] select-none"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>Sună acum</span>
            </a>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Închide meniul principal" : "Deschide meniul principal"}
            className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center transition-all touch-manipulation active:scale-95 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--accent-text,#F04D4D)]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen Mobile Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] md:top-[72px] bottom-0 bg-[var(--bg,#0B0F16)]/98 backdrop-blur-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigateToSection('catalog')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Mașini în stoc</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--accent,#D83333)] text-white tabular-nums">
                {totalCarsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('finantare')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Finanțare & Rate fixe</span>
              <span className="text-xs text-[var(--text-muted,#A3ABB6)]">Doar cu buletinul</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('cont-garantie')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Cont de Garanție</span>
              <span className="text-xs text-[var(--accent-text,#F04D4D)] font-semibold">Blocare 5 zile</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('garantie')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Garanție extinsă</span>
              <span className="text-xs text-[var(--text-muted,#A3ABB6)]">12–36 Luni</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('servicii')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Servicii & Buy-Back</span>
              <span className="text-xs text-[var(--text-muted,#A3ABB6)]">Livrare · Revizie</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('contact')}
              className="w-full h-14 px-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-left font-montserrat font-semibold text-[16px] text-[var(--text,#F4F6F9)] active:bg-[var(--surface-2,#1B2431)]"
            >
              <span>Contact Showroom</span>
              <span className="text-xs text-[var(--text-muted,#A3ABB6)]">{dealer.city || 'Cluj'}</span>
            </button>
          </div>

          {/* Quick Actions & Contact Footer în Drawer Mobil */}
          <div className="pt-6 border-t border-[var(--line,rgba(255,255,255,0.08))] space-y-3">
            {contact.salesPhoneClean && (
              <a
                href={`tel:${contact.salesPhoneClean}`}
                className="w-full h-14 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] text-white flex items-center justify-center gap-2 font-montserrat font-bold text-[16px] shadow-[var(--shadow-cta)]"
              >
                <Phone className="w-5 h-5" />
                <span>Sună Vânzări: {contact.salesPhone}</span>
              </a>
            )}

            {contact.salesWhatsApp && (
              <a
                href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc informații despre mașinile din stocul ${dealer.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 rounded-[var(--r-md,14px)] bg-[#25D366] text-[#0B0F16] flex items-center justify-center gap-2 font-montserrat font-bold text-[16px]"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>WhatsApp Showroom</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
