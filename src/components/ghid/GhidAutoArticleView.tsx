import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Share2, 
  Check, 
  ExternalLink, 
  ListOrdered, 
  Coins, 
  HelpCircle, 
  BookOpen, 
  ChevronRight,
  Calculator,
  Printer,
  Sparkles,
  Copy,
  Info,
  Building2,
  FileCheck2
} from 'lucide-react';
import { GhidArticle } from '../../data/ghidAutoData';

interface GhidAutoArticleViewProps {
  article: GhidArticle;
  onBack: () => void;
  onSelectArticle?: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onOpenCalculator?: () => void;
  onExploreParcOS?: () => void;
}

export const GhidAutoArticleView: React.FC<GhidAutoArticleViewProps> = ({
  article,
  onBack,
  onSelectArticle,
  onSelectCategory,
  onOpenCalculator,
  onExploreParcOS
}) => {
  const [activeSection, setActiveSection] = useState<string>('sinteza');
  const [copied, setCopied] = useState<boolean>(false);
  const [checklistCopied, setChecklistCopied] = useState<boolean>(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  // 🏷️ Sincronizare titlu pagină cu numele articolului pentru SEO și tab-ul browserului
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${article.title} — Ghid Auto 2026 | ParcOS`;
    return () => {
      document.title = prevTitle;
    };
  }, [article.title]);

  // Secțiuni pentru Table of Contents (TOC)
  const sections = [
    { id: 'sinteza', label: 'Sinteză & Puncte Cheie' },
    ...(article.docs && article.docs.length > 0 ? [{ id: 'acte-necesare', label: 'Checklist Acte Necesare' }] : []),
    ...(article.steps && article.steps.length > 0 ? [{ id: 'pasi-de-urmat', label: 'Ghid Pas cu Pas' }] : []),
    ...(article.costs && article.costs.length > 0 ? [{ id: 'costuri', label: 'Taxe & Buget Estimativ' }] : []),
    ...(article.proseHtml ? [{ id: 'detalii-ghid', label: 'Baza Legală & Detalii' }] : []),
    ...(article.faq && article.faq.length > 0 ? [{ id: 'intrebari-frecvente', label: 'Întrebări Frecvente' }] : []),
    ...(article.officialLinks && article.officialLinks.length > 0 ? [{ id: 'surse-oficiale', label: 'Platforme Oficiale' }] : [])
  ];

  // Scroll spy pentru TOC
  useEffect(() => {
    const sectionIds = sections.map(s => s.id);
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
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
  }, [sections]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyChecklist = () => {
    if (article.docs && article.docs.length > 0) {
      const text = `Dosar Acte Necesare — ${article.title} (ParcOS.ro):\n` + 
        article.docs.map((d, i) => `[ ] ${i + 1}. ${d}`).join('\n');
      navigator.clipboard.writeText(text);
      setChecklistCopied(true);
      setTimeout(() => setChecklistCopied(false), 2500);
    }
  };

  const toggleDocCheck = (idx: number) => {
    setCheckedDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedDocsCount = Object.values(checkedDocs).filter(Boolean).length;
  const totalDocsCount = article.docs ? article.docs.length : 0;
  const docsProgressPercent = totalDocsCount > 0 ? Math.round((completedDocsCount / totalDocsCount) * 100) : 0;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500/20 selection:text-amber-800">
      
      {/* 🧭 Top Technical Header & Breadcrumbs */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs sm:text-sm">
          
          <div className="flex items-center gap-2 text-slate-500 overflow-x-auto whitespace-nowrap py-0.5">
            <button
              onClick={onBack}
              className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-semibold text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ghid Auto</span>
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => onSelectCategory?.(article.category.slug)}
              className="hover:text-slate-900 font-semibold transition-colors px-2 py-0.5 rounded-md hover:bg-slate-100"
              style={{ color: article.category.color }}
            >
              {article.category.name}
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-md">
              {article.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleCopyLink}
              title="Copiază linkul ghidului"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiat!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Partajează</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* 📄 Corp Principal Ghid (col-span-8)                       */}
          {/* ========================================================= */}
          <article className="lg:col-span-8 space-y-8">
            
            {/* Header Articol & Metadata */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
                   style={{ 
                     backgroundColor: `${article.category.color}15`, 
                     borderColor: `${article.category.color}35`,
                     color: article.category.color
                   }}>
                <span>{article.category.icon}</span>
                <span>{article.category.name}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-snug font-display">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-500 pb-5 border-b border-slate-200/80">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {article.updateDate}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readTime}
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verificat Oficial 2026
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 🌟 CARD 1: SINTEZĂ & PUNCTE CHEIE (Bento Overview)        */}
            {/* ========================================================= */}
            {article.quickAnswer && (
              <section 
                id="sinteza" 
                className="scroll-mt-24 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3 text-amber-800 text-xs font-bold uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Sinteză Rapidă — Ce Trebuie Să Știi</span>
                </div>
                
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans font-normal mb-5">
                  {article.quickAnswer}
                </p>

                {/* Micro-indicatori rapizi */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-amber-200/60 text-xs">
                  <div className="bg-white/80 border border-amber-200/60 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Termen Legal Recomandat</span>
                    <span className="font-bold text-slate-900 font-mono">30 – 90 zile</span>
                  </div>
                  <div className="bg-white/80 border border-amber-200/60 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Grad de Complexitate</span>
                    <span className="font-bold text-emerald-700">Procedură Standard</span>
                  </div>
                  <div className="bg-white/80 border border-amber-200/60 p-3 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Verificare Cadru</span>
                    <span className="font-bold text-slate-900">Codul Rutier & Fisc</span>
                  </div>
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 📋 CARD 2: CHECKLIST DOSAR ACTE NECESARE                  */}
            {/* ========================================================= */}
            {article.docs && article.docs.length > 0 && (
              <section id="acte-necesare" className="scroll-mt-24 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-display">
                        Dosar de Acte Necesare
                      </h2>
                      <p className="text-xs text-slate-500">Bifează documentele pe măsură ce le pregătești</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {completedDocsCount} / {totalDocsCount} pregătite
                    </span>
                    <button
                      onClick={handleCopyChecklist}
                      title="Copiază lista completă de acte"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg transition-colors shadow-2xs"
                    >
                      {checklistCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{checklistCopied ? 'Copiat!' : 'Copiază Acte'}</span>
                    </button>
                  </div>
                </div>

                {/* Bara de Progres */}
                {totalDocsCount > 0 && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 transition-all duration-300 rounded-full"
                      style={{ width: `${docsProgressPercent}%` }}
                    />
                  </div>
                )}

                {/* Lista Interactivă de Documente */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs">
                  {article.docs.map((doc, idx) => {
                    const isChecked = !!checkedDocs[idx];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleDocCheck(idx)}
                        className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-900' 
                            : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/70 text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${
                          isChecked ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}>
                          {doc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 🚶 CARD 3: GHID PAS CU PAS (Timeline Procedural)          */}
            {/* ========================================================= */}
            {article.steps && article.steps.length > 0 && (
              <section id="pasi-de-urmat" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      Procedura Pas cu Pas
                    </h2>
                    <p className="text-xs text-slate-500">Urmează etapele în ordinea corectă pentru a evita respingerea dosarului</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {article.steps.map((st) => (
                    <div 
                      key={st.num}
                      className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400/80 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs font-mono shadow-xs">
                          {st.num < 10 ? `0${st.num}` : st.num}
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-slate-950 font-display">
                            {st.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {st.description}
                          </p>

                          {/* Sfat contextual ParcOS pentru fiecare pas */}
                          <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50 flex items-start gap-2.5 text-xs text-amber-900">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">
                              <strong>Sfat ParcOS:</strong> Păstrează întotdeauna o copie digitală sau o fotografie a documentelor semnate înainte de a le depune la ghișeu.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 💰 CARD 4: TAXE OFICIALE & BUGET ESTIMATIV 2026           */}
            {/* ========================================================= */}
            {article.costs && article.costs.length > 0 && (
              <section id="costuri" className="scroll-mt-24 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-display">
                        Costuri & Taxe Oficiale 2026
                      </h2>
                      <p className="text-xs text-slate-500">Tarife de stat actualizate conform ultimelor ordine ministeriale</p>
                    </div>
                  </div>

                  {onOpenCalculator && (
                    <button
                      onClick={onOpenCalculator}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-600" />
                      <span>Calculator Impozit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {article.costs.map((c, i) => {
                    const isGratis = c.value.toLowerCase().includes('gratuit');
                    return (
                      <div 
                        key={i} 
                        className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 text-sm block">
                            {c.item}
                          </span>
                          {c.note && (
                            <span className="text-[11px] text-slate-500 block leading-relaxed">
                              {c.note}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {isGratis ? 'Fără taxă de stat' : 'Tarif Oficial'}
                          </span>
                          <span className={`font-mono font-extrabold text-sm sm:text-base px-2.5 py-1 rounded-lg ${
                            isGratis 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}>
                            {c.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 📖 CARD 5: BAZA LEGALĂ & DETALII APROFUNDATE               */}
            {/* ========================================================= */}
            {article.proseHtml && (
              <section id="detalii-ghid" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      Explicații Juridice & Detalii de Procedură
                    </h2>
                    <p className="text-xs text-slate-500">Cadrul legal detaliat și excepțiile prevăzute de legislație</p>
                  </div>
                </div>

                <div 
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs text-slate-700 leading-relaxed text-sm sm:text-base font-sans prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-amber-700 hover:prose-a:text-amber-800 prose-strong:text-slate-950 prose-li:text-slate-700"
                  dangerouslySetInnerHTML={{ __html: article.proseHtml }}
                />
              </section>
            )}

            {/* ========================================================= */}
            {/* ❓ CARD 6: ACORDEON ÎNTREBĂRI FRECVENTE (259 FAQ-uri)     */}
            {/* ========================================================= */}
            {article.faq && article.faq.length > 0 && (
              <section id="intrebari-frecvente" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      Întrebări Frecvente & Soluții
                    </h2>
                    <p className="text-xs text-slate-500">Răspunsuri rapide la cele mai întâlnite situații practice</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {article.faq.map((f, i) => (
                    <details 
                      key={i} 
                      className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 text-sm sm:text-base select-none">
                        <span>{f.question}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0 ml-3" />
                      </summary>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                        {f.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 🏛️ CARD 7: SURSE & PLATFORME OFICIALE VERIFICATE          */}
            {/* ========================================================= */}
            {article.officialLinks && article.officialLinks.length > 0 && (
              <section id="surse-oficiale" className="scroll-mt-24 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display">
                      Portaluri & Servicii Digitale Acreditate
                    </h2>
                    <p className="text-xs text-slate-500">Acces direct către formulare tipizate și platforme guvernamentale</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {article.officialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-xs flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 transition-all group"
                    >
                      <span className="font-semibold truncate mr-2">{link.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 🚀 CARD 8: PARCOS ECOSYSTEM CONVERSION CALLOUT             */}
            {/* ========================================================= */}
            <div className="p-7 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Soluția Digitală pentru Parcuri Auto</span>
                </div>
                <h3 className="text-lg font-black text-slate-950 font-display">
                  Ești dealer auto sau vrei să cumperi în siguranță totală?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  ParcOS automatizează complet documentele de vânzare, facturile proforma, contractele și verificarea seriilor de șasiu. Zero birocrație pentru dealer și cumpărător.
                </p>
              </div>
              <button
                onClick={onExploreParcOS || onBack}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-sm"
              >
                Explorează ParcOS
              </button>
            </div>

          </article>

          {/* ========================================================= */}
          {/* 📌 SIDEBAR DREAPTA: TABLE OF CONTENTS (col-span-4)         */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 sticky top-20 space-y-5 hidden lg:block">
            
            {/* Cuprins Navigare Rapidă */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Cuprins Ghid</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">Scroll Spy</span>
              </h3>
              
              <nav className="space-y-1.5">
                {sections.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/80 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </nav>

              {/* Acțiuni Rapide în Sidebar */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => window.print()}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tipărește / Salvează PDF</span>
                </button>

                {onOpenCalculator && (
                  <button
                    onClick={onOpenCalculator}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-amber-600" />
                    <span>Calculator Impozit 2026</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banner Suport ParcOS */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                Ecosistem ParcOS.ro
              </span>
              <h4 className="text-sm font-bold font-display">
                Gestionează parcul tău auto fără efort
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Site propriu pe domeniu dedicat, publicare 1-click pe OLX & Autovit și contracte gata completate.
              </p>
              <button
                onClick={onExploreParcOS || onBack}
                className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Află mai multe
              </button>
            </div>

          </aside>

        </div>
      </div>

    </div>
  );
};
