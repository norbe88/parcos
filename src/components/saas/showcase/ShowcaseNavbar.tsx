import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Lock, 
  ArrowRight, 
  Menu, 
  X, 
  Globe, 
  ExternalLink,
  Sparkles,
  Layers,
  FileSearch,
  Calculator,
  Scale,
  Palette,
  MessageSquare
} from 'lucide-react';

export interface ShowcaseNavbarProps {
  onSwitchToDealer?: (slug: string) => void;
  onOpenSuperAdmin?: () => void;
  activeLanguage?: 'RO' | 'EN' | 'HU';
  onLanguageChange?: (lang: 'RO' | 'EN' | 'HU') => void;
}

export const ShowcaseNavbar: React.FC<ShowcaseNavbarProps> = ({
  onSwitchToDealer,
  onOpenSuperAdmin,
  activeLanguage = 'RO',
  onLanguageChange
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'RO' | 'EN' | 'HU'>(activeLanguage);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLangSelect = (lang: 'RO' | 'EN' | 'HU') => {
    setCurrentLang(lang);
    onLanguageChange?.(lang);
  };

  const navLinks = [
    { href: '#module', label: 'Module DMS', icon: Layers },
    { href: '#demo-ocr', label: 'Simulator OCR', icon: FileSearch },
    { href: '#teme', label: 'Showroom Tematic', icon: Palette },
    { href: '#oferte-whatsapp', label: 'Oferte WhatsApp', icon: MessageSquare },
    { href: '#calculator-roi', label: 'Calculator ROI', icon: Calculator },
    { href: '#comparatie', label: 'ParcOS vs Piață', icon: Scale },
    { href: '#onboard', label: 'Înscriere Parc', icon: Sparkles },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update hash in URL without jumping
      window.history.pushState(null, '', href);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled 
          ? 'bg-[#09090b]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40' 
          : 'bg-[#09090b]/80 backdrop-blur-md border-b border-white/[0.05]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Brand Logo & Telemetry Pill */}
        <div className="flex items-center gap-3">
          <a 
            href="#hero" 
            onClick={(e) => handleNavClick(e, '#hero')}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1 -m-1"
            aria-label="ParcOS Home"
          >
            {/* Sculptural Hex-Automotive Emblem */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[1px] shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/35 transition-all">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Car className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-extrabold text-lg tracking-tight text-white">
                  Parc<span className="text-amber-400">OS</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-telemetry font-semibold bg-zinc-900 border border-white/10 text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  v2.4 Production
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase leading-tight sm:block hidden">
                Dealership OS • Netcup VPS
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Fluid Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Navigație Principală">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions: Language Selector + SuperAdmin + Showroom + CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Quick Language Switcher */}
          <div className="hidden sm:flex items-center bg-zinc-900/90 border border-white/10 rounded-lg p-0.5 text-[11px] font-mono font-semibold" role="group" aria-label="Selector Limbă">
            {(['RO', 'EN', 'HU'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLangSelect(lang)}
                className={`px-2 py-1 rounded transition-colors touch-manipulation ${
                  currentLang === lang 
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Schimbă limba în ${lang}`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* SuperAdmin Access Button */}
          {onOpenSuperAdmin && (
            <button
              onClick={onOpenSuperAdmin}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 hover:border-amber-400/40 transition-all touch-manipulation min-h-[36px]"
              title="Acces Panou SuperAdmin Multi-Tenant"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>SuperAdmin</span>
            </button>
          )}

          {/* Showroom Demo Live Button (RXM Official Site) */}
          <a
            href="https://rxmautomobile.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-amber-400/30 hover:border-amber-400/70 transition-all touch-manipulation min-h-[36px] shadow-sm shadow-amber-500/10"
            title="Deschide site-ul oficial RXM Automobile dezvoltat pe ParcOS"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Showroom Live (rxmautomobile.ro)</span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 ml-0.5">LIVE</span>
          </a>

          {/* Primary Action Button */}
          <a
            href="#onboard"
            onClick={(e) => handleNavClick(e, '#onboard')}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 transition-all touch-manipulation min-h-[36px] active:scale-[0.98]"
          >
            <span>Înscrie Parcul</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile Hamburger Menu Toggle Button (Min 44x44px Touch Target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-white/10 flex items-center justify-center touch-manipulation transition-colors"
            aria-label={mobileMenuOpen ? 'Închide Meniul' : 'Deschide Meniul'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/[0.08] bg-[#09090b]/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors min-h-[44px] touch-manipulation"
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          {/* Mobile Controls Divider & Language Switcher */}
          <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                Limbă Interfață
              </span>
              <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-xs font-mono font-semibold">
                {(['RO', 'EN', 'HU'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLangSelect(lang)}
                    className={`min-w-[40px] min-h-[34px] px-2 py-1 rounded transition-colors touch-manipulation ${
                      currentLang === lang 
                        ? 'bg-amber-400 text-zinc-950 font-bold' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Direct Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href="https://rxmautomobile.ro"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold bg-zinc-900 text-amber-300 border border-amber-400/30 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Showroom Live (rxmautomobile.ro)</span>
              </a>

              {onOpenSuperAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSuperAdmin();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-white/10 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Panou SuperAdmin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
