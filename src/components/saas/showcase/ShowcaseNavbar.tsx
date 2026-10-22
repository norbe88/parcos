import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Menu, 
  X, 
  ExternalLink,
  Layers,
  FileSearch,
  Calculator,
  Scale,
  Palette,
  MessageSquare,
  BookOpen
} from 'lucide-react';

export interface ShowcaseNavbarProps {
  onSwitchToDealer?: (slug: string) => void;
  activeLanguage?: 'RO' | 'EN' | 'HU';
  onLanguageChange?: (lang: 'RO' | 'EN' | 'HU') => void;
  onOpenGhidAuto?: () => void;
}

export const ShowcaseNavbar: React.FC<ShowcaseNavbarProps> = ({
  onSwitchToDealer: _onSwitchToDealer,
  activeLanguage = 'RO',
  onLanguageChange,
  onOpenGhidAuto
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ParcOS deservește exclusiv piața din România (CIV, Talon, ANAF e-Factura SPV, TVA 21%, FGO, OLX)
  // Menținem callback-ul de limbă pentru compatibilitate
  useEffect(() => {
    if (activeLanguage !== 'RO') {
      onLanguageChange?.('RO');
    }
  }, [activeLanguage, onLanguageChange]);

  const navLinks = [
    { href: '#module', label: 'Ce Include', icon: Layers },
    { href: '#demo-ocr', label: 'Scanare Talon', icon: FileSearch },
    { href: '#teme', label: 'Site Propriu', icon: Palette },
    { href: '#oferte-whatsapp', label: 'Oferte WhatsApp', icon: MessageSquare },
    { href: '#calculator-roi', label: 'Calculator ROI', icon: Calculator },
    { href: '#comparatie', label: 'De Ce ParcOS', icon: Scale },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', href);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm' 
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        
        {/* Brand Logo & Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="#hero" 
            onClick={(e) => handleNavClick(e, '#hero')}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1 -m-1"
          >
            {/* Brand New ParcOS Emblem */}
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/35 border border-slate-900/10 transition-all shrink-0 bg-slate-950 flex items-center justify-center">
              <img 
                src="/brand/icon-64x64.png" 
                alt="ParcOS" 
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform" 
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-black text-lg tracking-tight text-slate-950">
                  Parc<span className="text-amber-700">OS</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pentru Parcuri Auto
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 leading-tight sm:block hidden whitespace-nowrap">
                Site Propriu & Gestiune Stoc
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Fluid Navigation Links (No wrapping, refined spacing) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-3" aria-label="Navigație Principală">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions: Ghid Auto 2026 + Showroom Live + Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Ghid Auto 2026 Button */}
          {onOpenGhidAuto && (
            <button
              type="button"
              onClick={onOpenGhidAuto}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 transition-all touch-manipulation min-h-[36px] whitespace-nowrap shrink-0 shadow-sm"
              title="Deschide Ghidul Auto Oficial 2026 cu 76 de ghiduri și calculator de impozit"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Ghid Auto 2026</span>
            </button>
          )}

          {/* Showroom Demo Live Button (RXM Official Site) */}
          <a
            href="https://rxmautomobile.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 transition-all touch-manipulation min-h-[36px] whitespace-nowrap shrink-0 shadow-sm"
            title="Vezi showroom-ul demonstrativ oficial RXM Automobile dezvoltat pe ParcOS (rxmautomobile.ro)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Showroom Live</span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">RXM</span>
          </a>

          {/* Primary Action Button */}
          <a
            href="#onboard"
            onClick={(e) => handleNavClick(e, '#onboard')}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all touch-manipulation min-h-[36px] whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <span>Încearcă Gratuit</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </a>

          {/* Mobile Hamburger Menu Toggle Button (Min 44x44px Touch Target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 flex items-center justify-center touch-manipulation transition-colors shrink-0"
            aria-label={mobileMenuOpen ? 'Închide Meniul' : 'Deschide Meniul'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors min-h-[44px] touch-manipulation active:scale-[0.98]"
                >
                  <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          {/* Mobile Direct Buttons */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onOpenGhidAuto && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGhidAuto();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-900 border border-amber-400/50 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                <span>📘 Ghid Auto 2026</span>
              </button>
            )}

            <a
              href="https://rxmautomobile.ro"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Showroom Live (RXM)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
