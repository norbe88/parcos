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

  // 🏷️ Asigură tema deschisă luminoasă 'parcos_light' conform paginii principale ParcOS
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'parcos_light');
    document.body.setAttribute('data-theme', 'parcos_light');
  }, []);

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
      window.location.hash = `#ghid-auto/${slug}`;
    }
  };

  const handleSelectCategory = (catSlug: string) => {
    if (selectedCategorySlug === catSlug) {
      setSelectedCategorySlug(null);
    } else {
      setSelectedCategorySlug(catSlug);
    }
    setActiveView('hub');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setActiveView('hub');
    setSelectedArticleSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      window.location.hash = '#ghid-auto';
    }
  };

  const handleOpenCalculator = () => {
    setActiveView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      window.location.hash = '#ghid-auto/calculator-impozit-auto';
    }
  };

  // Căutare live
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchArticles(searchQuery);
  }, [searchQuery]);

  // Articole filtrate pentru lista principală
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500/20 selection:text-amber-800">
      
      {/* 🧭 Navbar Tehnic Ghid Auto (Design Curat) */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMain}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Platforma ParcOS</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xl">📘</span>
              <span className="font-display font-black text-base sm:text-lg text-slate-950 tracking-tight">
                Ghid Auto <span className="text-amber-600">2026</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCalculator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold transition-all shadow-2xs"
            >
              <Calculator className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Calculator Impozit Auto 2026</span>
              <span className="sm:hidden">Calculator</span>
            </button>
          </div>

        </div>
      </header>

      {/* 🌟 Hero Spotlight (Design Curat & Luminos) */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-[#f8fafc]">
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Ghidul Oficial Auto & Transport România — Ediția Actualizată 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight font-display leading-[1.15] mb-6">
            Toate procedurile auto din România, explicate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700">clar și pas cu pas</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Înmatriculări, RAR, rovinietă, permis de conducere, radiere fiscală, contracte de vânzare și scutiri de impozit. 
            Dosarul complet de acte și costurile oficiale — fără drumuri inutile la ghișeu.
          </p>

          {/* Căutare Centrală */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ce procedură cauți? (ex: înmatriculare auto, numere roșii, impozit...)"
                className="w-full bg-white border border-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 rounded-2xl pl-12 pr-10 py-4 text-sm sm:text-base text-slate-900 placeholder-slate-400 font-medium shadow-md transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Rezultate Autocomplete Live Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 text-left">
                <div className="p-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{searchResults.length} rezultate găsite</span>
                  <span className="text-[10px] text-slate-400 font-normal">Apasă pentru detalii</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Nu am găsit niciun ghid pentru „{searchQuery}”. Încearcă un alt termen (ex: <button onClick={() => setSearchQuery('înmatriculare')} className="text-amber-600 underline font-semibold">înmatriculare</button> sau <button onClick={() => setSearchQuery('impozit')} className="text-amber-600 underline font-semibold">impozit</button>).
                  </div>
                ) : (
                  searchResults.map(art => (
                    <button
                      key={art.slug}
                      onClick={() => handleSelectArticle(art.slug)}
                      className="w-full p-4 hover:bg-amber-50/50 flex items-start justify-between gap-3 text-left transition-colors group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${art.category.color}15`, color: art.category.color }}>
                            {art.category.name}
                          </span>
                          <span className="text-xs text-slate-400">{art.readTime}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {art.metaDescription}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 shrink-0 mt-2 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Pill Filter Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="text-xs font-semibold text-slate-500">Filtre rapide:</span>
            {GHID_CATEGORIES.slice(0, 5).map(cat => (
              <button
                key={cat.slug}
                onClick={() => handleSelectCategory(cat.slug)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <span>{cat.icon} {cat.name}</span>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 🚀 Banner Interactiv Calculator Impozit 2026 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-white border border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>Instrument Fiscal 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
              Calculează noul impozit auto valabil în 2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Algoritm actualizat conform Legii 239/2025 și OUG 78/2025: noile tarife pe fracțiuni de 200 cmc, taxa fixă de 40 lei pentru electrice, tranșele semestriale și bonificația de 10%.
            </p>
          </div>

          <button
            onClick={handleOpenCalculator}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-md transition-all flex items-center gap-2 group"
          >
            <span>Deschide Calculatorul</span>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 🗂️ Categorii Principale (Bento 7 Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display tracking-tight">
              Categorii Ghid Auto
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Alege domeniul de interes pentru a naviga prin cele 76 de ghiduri</p>
          </div>
          {selectedCategorySlug && (
            <button
              onClick={() => setSelectedCategorySlug(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
            >
              <span>Resetează filtru categorie</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {GHID_CATEGORIES.map(cat => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <div
                key={cat.slug}
                onClick={() => handleSelectCategory(cat.slug)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200/90 hover:border-amber-400/80 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xs"
                      style={{ backgroundColor: `${cat.accentColor}15` }}
                    >
                      {cat.icon}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {cat.articlesCount} ghiduri
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors font-display mb-1.5">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold" style={{ color: cat.accentColor }}>
                  <span>{isSelected ? 'Filtru activ' : 'Explorează'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 📰 Lista Articolelor (Grid Principal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 font-display">
              {selectedCategorySlug 
                ? `Ghiduri în categoria: ${GHID_CATEGORIES.find(c => c.slug === selectedCategorySlug)?.name}`
                : (searchQuery ? `Rezultate căutare: „${searchQuery}”` : 'Toate Ghidurile Disponibile')}
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full ml-2">
              {displayedArticles.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedArticles.map(art => (
            <div
              key={art.slug}
              onClick={() => handleSelectArticle(art.slug)}
              className="bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md rounded-2xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span 
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-md truncate max-w-[180px]"
                    style={{ backgroundColor: `${art.category.color}15`, color: art.category.color }}
                  >
                    {art.category.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {art.readTime}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors font-display mb-2 leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                  {art.metaDescription || art.quickAnswer}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-medium">{art.updateDate}</span>
                <span className="font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1">
                  <span>Citește ghidul</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🧭 Footer Ghid Auto */}
      <footer className="border-t border-slate-200/80 bg-white py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-slate-900 text-sm">ParcOS.ro</span>
            <span>—</span>
            <span>Ghidul Auto & Legislație Rutieră România 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button onClick={handleOpenCalculator} className="hover:text-slate-900 transition-colors">
              Calculator Impozit Auto
            </button>
            <span>•</span>
            <button onClick={onBackToMain} className="hover:text-slate-900 transition-colors">
              Platforma Dealeri
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
