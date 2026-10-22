import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Car, 
  ShieldCheck, 
  FileText, 
  Calculator, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Clock, 
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  GHID_CATEGORIES, 
  GHID_ARTICLES, 
  GhidArticle, 
  GhidCategory, 
  getArticleBySlug, 
  getArticlesByCategory, 
  getFeaturedArticles, 
  getPopularArticles, 
  searchArticles 
} from '../../data/ghidAutoData';
import { GhidAutoArticleView } from './GhidAutoArticleView';
import { CalculatorImpozitAuto } from './CalculatorImpozitAuto';

export interface GhidAutoHubProps {
  initialSlug?: string;
  initialCategory?: string;
  initialView?: 'hub' | 'article' | 'category' | 'calculator';
  onBackToMain?: () => void;
}

export const GhidAutoHub: React.FC<GhidAutoHubProps> = ({
  initialSlug,
  initialCategory,
  initialView = 'hub',
  onBackToMain
}) => {
  const [activeView, setActiveView] = useState<'hub' | 'article' | 'calculator'>(() => {
    if (initialView === 'calculator' || initialSlug === 'calculator-impozit-auto') return 'calculator';
    if (initialView === 'article' && initialSlug) return 'article';
    return 'hub';
  });

  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(initialSlug || null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(initialCategory || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizare cu hash-ul din URL pentru navigare directă și deep linking
  useEffect(() => {
    const parseHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace(/^#\/?/, '');
      const path = window.location.pathname.replace(/^\//, '');

      // Verifică hash sau pathname
      const target = hash.startsWith('ghid-auto') ? hash : (path.startsWith('ghid-auto') ? path : '');

      if (target.includes('calculator')) {
        setActiveView('calculator');
        setSelectedArticleSlug(null);
      } else if (target.includes('ghid-auto/')) {
        const parts = target.split('/');
        const slug = parts[1];
        if (slug) {
          if (slug.startsWith('categorie-') || slug.startsWith('cat-')) {
            const cat = slug.replace(/^(categorie-|cat-)/, '');
            setSelectedCategorySlug(cat);
            setActiveView('hub');
          } else {
            const art = getArticleBySlug(slug);
            if (art) {
              setSelectedArticleSlug(slug);
              setActiveView('article');
            }
          }
        }
      }
    };

    parseHash();
    window.addEventListener('popstate', parseHash);
    window.addEventListener('hashchange', parseHash);
    return () => {
      window.removeEventListener('popstate', parseHash);
      window.removeEventListener('hashchange', parseHash);
    };
  }, []);

  const handleSelectArticle = (slug: string) => {
    setSelectedArticleSlug(slug);
    setActiveView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#ghid-auto/${slug}`);
    }
  };

  const handleSelectCategory = (catSlug: string | null) => {
    setSelectedCategorySlug(catSlug);
    setActiveView('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      if (catSlug) {
        window.history.pushState(null, '', `#ghid-auto/cat-${catSlug}`);
      } else {
        window.history.pushState(null, '', `#ghid-auto`);
      }
    }
  };

  const handleOpenCalculator = () => {
    setActiveView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#ghid-auto/calculator-impozit-auto`);
    }
  };

  const handleBackToHub = () => {
    setActiveView('hub');
    setSelectedArticleSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#ghid-auto`);
    }
  };

  // Căutare live
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchArticles(searchQuery);
  }, [searchQuery]);

  // Articole filtrate în funcție de categorie
  const displayedArticles = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    if (selectedCategorySlug) {
      return getArticlesByCategory(selectedCategorySlug);
    }
    return GHID_ARTICLES;
  }, [searchQuery, searchResults, selectedCategorySlug]);

  const featuredArticles = useMemo(() => getFeaturedArticles(), []);
  const popularArticles = useMemo(() => getPopularArticles(), []);

  // Dacă este selectat Calculatorul
  if (activeView === 'calculator') {
    return (
      <CalculatorImpozitAuto 
        onBack={handleBackToHub}
        onSelectArticle={handleSelectArticle}
      />
    );
  }

  // Dacă este selectat un Articol
  if (activeView === 'article' && selectedArticleSlug) {
    const article = getArticleBySlug(selectedArticleSlug);
    if (article) {
      return (
        <GhidAutoArticleView 
          article={article}
          onBack={handleBackToHub}
          onSelectArticle={handleSelectArticle}
          onSelectCategory={handleSelectCategory}
          onOpenCalculator={handleOpenCalculator}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 🧭 Navbar Ghid Auto */}
      <header className="sticky top-0 z-40 w-full bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMain}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Platforma ParcOS</span>
            </button>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-lg">📘</span>
              <span className="font-display font-black text-base sm:text-lg text-white tracking-tight">
                Ghid Auto <span className="text-amber-400">2026</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCalculator}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition-all shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calculator Impozit Auto</span>
              <span className="sm:hidden">Calculator</span>
            </button>
          </div>

        </div>
      </header>

      {/* 🌟 Hero Spotlight */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-zinc-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ghidul Oficial Auto & Transport România — Ediția 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-display leading-[1.15] mb-6">
            Toate procedurile auto din România, explicate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">pas cu pas</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Înmatriculare, RCA, CASCO, permis de conducere, ITP, rovinietă, transcriere și fiscalizare. 
            Acte necesare, costuri exacte și pașii oficiali — fără drumuri inutile la ghișeu.
          </p>

          {/* Căutare Centrală */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ce procedură cauți? (ex: înmatriculare auto, permis pierdut, impozit...)"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 focus:border-amber-500 rounded-2xl py-3.5 pl-12 pr-10 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-2xl backdrop-blur-md transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-30 max-h-96 overflow-y-auto text-left">
                {searchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Niciun ghid găsit pentru "{searchQuery}". Încearcă alți termeni.
                  </div>
                ) : (
                  searchResults.slice(0, 8).map(art => (
                    <button
                      key={art.slug}
                      onClick={() => handleSelectArticle(art.slug)}
                      className="w-full text-left p-3 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {art.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {art.category.icon} {art.category.name}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 mt-8 text-xs font-medium text-zinc-400">
            <div><strong className="text-white font-mono text-sm sm:text-base">76</strong> proceduri</div>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <div><strong className="text-white font-mono text-sm sm:text-base">7</strong> categorii</div>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <div><strong className="text-amber-400 font-mono text-sm sm:text-base">2026</strong> informații la zi</div>
          </div>

        </div>
      </section>

      {/* 🏷️ Grilă Categorii */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Explorează pe Categorii
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Alege domeniul și găsește ghidul pas cu pas de care ai nevoie.
            </p>
          </div>
          {selectedCategorySlug && (
            <button
              onClick={() => handleSelectCategory(null)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Arată toate categoriile</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GHID_CATEGORIES.map(cat => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => handleSelectCategory(isSelected ? null : cat.slug)}
                className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  isSelected 
                    ? 'bg-zinc-800/90 border-amber-500 shadow-lg shadow-amber-500/10' 
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl p-2 rounded-xl bg-zinc-950 border border-zinc-800 inline-block">
                      {cat.icon}
                    </span>
                    <span 
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full font-mono"
                      style={{ 
                        backgroundColor: `${cat.accentColor}20`, 
                        color: cat.accentColor 
                      }}
                    >
                      {cat.articlesCount} ghiduri
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5 font-display">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-amber-400 transition-colors">
                  <span>{isSelected ? 'Filtru activ' : 'Vezi procedurile'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🧮 Banner Calculator Impozit 2026 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
              <Calculator className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instrument Gratuit</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                Calculator Impozit Auto 2026
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Află cât plătești la primărie după capacitatea cilindrică și norma Euro, conform modificărilor din noul Cod fiscal (Art. 470).
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCalculator}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Deschide Calculatorul</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 📚 Listă Ghiduri & Sidebar Popular */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main List (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
                <span>{selectedCategorySlug ? 'Proceduri din categorie' : (searchQuery ? `Rezultate căutare (${displayedArticles.length})` : 'Ghiduri Recomandate')}</span>
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                {displayedArticles.length} ghiduri disponibile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedArticles.map(art => (
                <button
                  key={art.slug}
                  onClick={() => handleSelectArticle(art.slug)}
                  className="text-left p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono"
                        style={{ 
                          backgroundColor: `${art.category.color}20`, 
                          color: art.category.color 
                        }}
                      >
                        {art.category.icon} {art.category.name}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-2 mb-2 font-display">
                      {art.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {art.quickAnswer || art.metaDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {art.readTime}
                    </span>
                    <span className="text-amber-400/90 group-hover:text-amber-300 font-medium flex items-center gap-0.5">
                      Citește ghidul
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Sidebar (col-span-4) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Populare Acum</span>
              </h3>
              
              <div className="space-y-3">
                {popularArticles.map((pop, idx) => (
                  <button
                    key={pop.slug}
                    onClick={() => handleSelectArticle(pop.slug)}
                    className="w-full text-left p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700 transition-all flex items-start gap-3 group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      {idx + 1}
                    </span>
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors line-clamp-2 leading-relaxed">
                        {pop.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 block">
                        {pop.category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Link către Showroom / Parcuri Auto */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Despre Platforma ParcOS
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ParcOS este sistemul de operare complet pentru parcurile și dealerii auto din România. Scanare talon CIV, contracte automate și transparență totală.
              </p>
              <button
                onClick={onBackToMain}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>Descoperă Funcționalitățile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

        </div>
      </section>

    </div>
  );
};
