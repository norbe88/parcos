import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ListOrdered, 
  Coins, 
  HelpCircle, 
  ExternalLink, 
  ChevronRight, 
  Share2, 
  Check, 
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Search
} from 'lucide-react';
import { GhidArticle, getArticlesByCategory, getPopularArticles } from '../../data/ghidAutoData';

interface GhidAutoArticleViewProps {
  article: GhidArticle;
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onOpenCalculator?: () => void;
}

export const GhidAutoArticleView: React.FC<GhidAutoArticleViewProps> = ({
  article,
  onBack,
  onSelectArticle,
  onSelectCategory,
  onOpenCalculator
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('raspuns-rapid');

  // Ghiduri similare din aceeași categorie
  const relatedArticles = getArticlesByCategory(article.category.slug)
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  // Scroll spy pentru Cuprins
  useEffect(() => {
    const sectionIds = ['raspuns-rapid', 'acte-necesare', 'pasi-de-urmat', 'costuri', 'detalii-procedura', 'intrebari-frecvente', 'surse-oficiale'];
    
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 overflow-x-auto whitespace-nowrap">
            <button
              onClick={onBack}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ghid Auto</span>
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => onSelectCategory?.(article.category.slug)}
              className="hover:text-white transition-colors"
              style={{ color: article.category.color }}
            >
              {article.category.name}
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300 font-medium truncate max-w-[200px] sm:max-w-md">
              {article.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleCopyLink}
              title="Copiază linkul ghidului"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiat!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Partajează</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Article Body (col-span-8) */}
          <article className="lg:col-span-8 space-y-8">
            
            {/* Header Articol */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
                   style={{ 
                     backgroundColor: `${article.category.color}15`, 
                     borderColor: `${article.category.color}40`,
                     color: article.category.color
                   }}>
                <span>{article.category.icon}</span>
                <span>{article.category.name}</span>
              </div>

              <h1 className="text-2xl sm:text-3.5xl font-black text-white tracking-tight leading-snug font-display mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pb-6 border-b border-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {article.updateDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {article.readTime}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Informații Verificate Oficial 2026
                </span>
              </div>
            </div>

            {/* Caseta Pe scurt (Quick Answer) */}
            {article.quickAnswer && (
              <div 
                id="raspuns-rapid" 
                className="scroll-mt-24 p-5 sm:p-6 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 relative"
              >
                <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Pe scurt — Răspuns Rapid</span>
                </div>
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-sans">
                  {article.quickAnswer}
                </p>
              </div>
            )}

            {/* Checklist Acte Necesare */}
            {article.docs && article.docs.length > 0 && (
              <section id="acte-necesare" className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 font-display">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Acte Necesare</span>
                </h2>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
                  {article.docs.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {doc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Timeline Pași de urmat */}
            {article.steps && article.steps.length > 0 && (
              <section id="pasi-de-urmat" className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 font-display">
                  <ListOrdered className="w-5 h-5 text-amber-400" />
                  <span>Pași de Urmat</span>
                </h2>
                <div className="space-y-4">
                  {article.steps.map((st) => (
                    <div 
                      key={st.num}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shrink-0 text-sm font-mono shadow-sm">
                        {st.num}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                          {st.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabel Costuri */}
            {article.costs && article.costs.length > 0 && (
              <section id="costuri" className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 font-display">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Costuri & Taxe Oficiale</span>
                </h2>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <th className="py-3 px-4 font-semibold">Serviciu / Taxă</th>
                        <th className="py-3 px-4 font-semibold text-right">Cost Oficial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                      {article.costs.map((c, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-medium text-white block">{c.item}</span>
                            {c.note && (
                              <span className="text-[11px] text-zinc-500 block mt-0.5">{c.note}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                            {c.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Corpul de Detalii / Ghid Extins */}
            {article.proseHtml && (
              <section id="detalii-procedura" className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 font-display">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Informații & Proceduri Detaliate</span>
                </h2>
                <div 
                  className="prose prose-invert max-w-none text-zinc-300 text-sm sm:text-base leading-relaxed space-y-4 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-6 [&>h2]:mb-2 [&>p]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.proseHtml }}
                />
              </section>
            )}

            {/* Acordeon FAQ */}
            {article.faq && article.faq.length > 0 && (
              <section id="intrebari-frecvente" className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 font-display">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  <span>Întrebări Frecvente</span>
                </h2>
                <div className="space-y-3">
                  {article.faq.map((f, i) => (
                    <details 
                      key={i} 
                      className="group p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-center justify-between cursor-pointer font-semibold text-white text-sm sm:text-base select-none">
                        <span>{f.question}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-open:rotate-90 transition-transform shrink-0 ml-3" />
                      </summary>
                      <div className="mt-3 pt-3 border-t border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                        {f.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Surse Oficiale */}
            {article.officialLinks && article.officialLinks.length > 0 && (
              <section id="surse-oficiale" className="scroll-mt-24 space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                  Surse & Platforme Oficiale Verificate
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {article.officialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/60 flex items-center justify-between text-xs text-zinc-300 hover:text-white transition-all group"
                    >
                      <span className="font-medium truncate mr-2">{link.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ParcOS Platform Conversion Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white font-display">
                  Ești dealer sau cauți o mașină cu acte în regulă?
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Platforma ParcOS simplifică gestiunea parcurilor auto și verificarea documentelor oficiale. Mașini verificate, contracte automate și transparență totală.
                </p>
              </div>
              <button
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg shadow-amber-500/20"
              >
                Explorează ParcOS
              </button>
            </div>

          </article>

          {/* Sticky Sidebar (col-span-4) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-16">
            
            {/* Table of Contents (Cuprins) */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Cuprins Ghid
              </h3>
              <nav className="space-y-1 text-xs">
                {[
                  { id: 'raspuns-rapid', label: 'Pe scurt' },
                  { id: 'acte-necesare', label: 'Acte necesare' },
                  { id: 'pasi-de-urmat', label: 'Pași de urmat' },
                  { id: 'costuri', label: 'Costuri & taxe' },
                  { id: 'detalii-procedura', label: 'Procedură detaliată' },
                  { id: 'intrebari-frecvente', label: 'Întrebări frecvente' },
                  { id: 'surse-oficiale', label: 'Surse oficiale' }
                ].map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                      activeSection === sec.id 
                        ? 'bg-amber-500/15 text-amber-300 font-semibold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {activeSection === sec.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Calculator Banner */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                Calculator Impozit Auto 2026
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Calculează în 5 secunde impozitul auto datorat primăriei conform noii formule din Codul fiscal.
              </p>
              <button
                onClick={onOpenCalculator}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Deschide Calculatorul</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ghiduri Similare */}
            {relatedArticles.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Ghiduri din aceeași categorie
                </h3>
                <div className="space-y-2">
                  {relatedArticles.map(rel => (
                    <button
                      key={rel.slug}
                      onClick={() => onSelectArticle(rel.slug)}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700 transition-all group flex items-start justify-between"
                    >
                      <span className="text-xs text-zinc-300 group-hover:text-amber-400 transition-colors line-clamp-2 leading-relaxed">
                        {rel.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 shrink-0 mt-0.5 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </aside>

        </div>
      </div>
    </div>
  );
};
