import React, { useEffect } from 'react';
import { 
  Cookie, ShieldCheck, Lock, Scale, Settings2, 
  ArrowLeft, CheckCircle2, Clock, Shield, AlertCircle, 
  ExternalLink, Phone, Mail, MapPin, Database, Eye, Globe
} from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';

interface CookiePolicyPageProps {
  dealer?: DealerProfile;
  onBackToShowroom: () => void;
  onOpenPreferences?: () => void;
  onOpenTerms?: () => void;
}

interface CookieItem {
  name: string;
  provider: string;
  type: string;
  duration: string;
  purpose: string;
  category: 'essential' | 'analytics' | 'marketing';
}

const COOKIE_INVENTORY: CookieItem[] = [
  {
    name: 'rxm_cookie_consent_v1',
    provider: 'RXM Automobile (First-party)',
    type: 'LocalStorage',
    duration: '12 luni',
    purpose: 'Memorează opțiunile și preferințele de confidențialitate ale utilizatorului (acceptare module esențiale, analitice sau media).',
    category: 'essential'
  },
  {
    name: 'rxm_intro_seen',
    provider: 'RXM Automobile (First-party)',
    type: 'LocalStorage / SessionStorage',
    duration: '30 zile',
    purpose: 'Reține dacă animația cinematică de deschidere a showroom-ului a fost deja vizualizată pentru a nu întrerupe navigarea ulterioară.',
    category: 'essential'
  },
  {
    name: 'rxm_cars_inventory',
    provider: 'RXM Automobile (First-party)',
    type: 'LocalStorage',
    duration: '7 zile (auto-refresh)',
    purpose: 'Stochează în memoria locală a dispozitivului catalogul de mașini rulate pentru a permite încărcarea instantanee (0ms) a stocului și navigarea offline.',
    category: 'essential'
  },
  {
    name: 'rxm_cars_version',
    provider: 'RXM Automobile (First-party)',
    type: 'LocalStorage',
    duration: '7 zile',
    purpose: 'Controlează versiunea catalogului pentru a asigura sincronizarea automată a prețurilor, disponibilității și Ofertelor Săptămânii.',
    category: 'essential'
  },
  {
    name: 'rxm_admin_authenticated',
    provider: 'RXM Automobile (First-party)',
    type: 'SessionStorage',
    duration: 'Durata sesiunii curente',
    purpose: 'Verifică autorizarea personalului administrativ autorizat în portalul de gestiune stoc.',
    category: 'essential'
  },
  {
    name: '_ga / _ga_*',
    provider: 'Google Analytics (Google LLC)',
    type: 'Cookie HTTP',
    duration: '24 luni / 24 ore',
    purpose: 'Colectează date statistice agregate și anonimizate despre modul în care vizitatorii utilizează platforma (fără identificare personală directă).',
    category: 'analytics'
  },
  {
    name: 'cwv_metrics',
    provider: 'RXM Automobile (First-party)',
    type: 'SessionStorage',
    duration: 'Durata sesiunii curente',
    purpose: 'Măsoară indicatorii de viteză Core Web Vitals (Largest Contentful Paint, Cumulative Layout Shift) pentru optimizarea performanței pe dispozitive mobile.',
    category: 'analytics'
  },
  {
    name: 'tt_csrf_token / msToken',
    provider: 'TikTok Pte. Ltd. (Third-party)',
    type: 'Cookie HTTP',
    duration: 'Sesiune / 6 luni',
    purpose: 'Permite redarea securizată și optimizată a recenziilor video și a prezentărilor de autoturisme găzduite pe canalul oficial TikTok @rxm.automobile.',
    category: 'marketing'
  },
  {
    name: 'NID / 1P_JAR',
    provider: 'Google LLC (Google Maps)',
    type: 'Cookie HTTP',
    duration: '6 luni',
    purpose: 'Facilitează afișarea hărții interactive a showroom-ului din Cluj-Napoca și calculul traseului de navigare GPS.',
    category: 'marketing'
  }
];

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({
  dealer = SEED_DEALER,
  onBackToShowroom,
  onOpenPreferences,
  onOpenTerms
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `Politica de Cookie-uri — ${dealer.name}`;
    return () => {
      document.title = `${dealer.name} — Dealer Automobile Rulate Cluj-Napoca`;
    };
  }, [dealer.name]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 🌟 HERO SECTION: Dark Luxury Banner cu Breadcrumbs */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#121215] via-[#0c0c0e] to-[#09090b] py-12 sm:py-16 px-4 sm:px-8">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* Breadcrumbs & Buton Înapoi */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400" aria-label="Breadcrumb">
              <button 
                type="button"
                onClick={onBackToShowroom}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <span>Acasă</span>
              </button>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-200 font-semibold">Politica de Cookie-uri</span>
            </nav>

            <button
              type="button"
              onClick={onBackToShowroom}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-all shadow-sm touch-manipulation cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>← Înapoi la Showroom</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Cookie className="w-3.5 h-3.5" />
            <span>Transparență & Protecția Datelor Online</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Politica privind Modulele Cookie <span className="text-amber-400">&</span> Stocarea Locală
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            Această politică descrie modul în care platforma digitală oficială <strong className="text-zinc-200">{dealer.name}</strong> utilizează 
            modulele cookie și tehnologiile similare de stocare web, în conformitate cu Directiva ePrivacy (2002/58/CE), 
            Legea nr. 506/2004 privind prelucrarea datelor în sectorul comunicațiilor electronice și Regulamentul General privind Protecția Datelor (GDPR - UE 2016/679).
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ultima actualizare: <strong>15 octombrie 2026</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conformitate ANSPDCP & ePrivacy</span>
            </span>
            <span>•</span>
            <span className="text-zinc-400">Operator: {dealer.name} (CUI: {dealer.cui})</span>
          </div>

          {/* Jump Pills / Navigare Rapidă prin Secțiuni */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'ce-sunt-cookie-urile', label: '1. Ce sunt cookie-urile?' },
              { id: 'baza-legala', label: '2. Baza Legală' },
              { id: 'categorii-cookie', label: '3. Categoriile Utilizate' },
              { id: 'inventar-cookie', label: '4. Tabelul Cookie-urilor' },
              { id: 'gestionare-preferinte', label: '5. Gestionare & Retragere' },
              { id: 'contact-dpo', label: '6. Drepturi & Contact' }
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 hover:text-amber-300 border border-white/10 text-xs font-medium text-zinc-300 transition-all touch-manipulation cursor-pointer"
              >
                {sec.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 📖 CONȚINUT DETALIAT DOCUMENT */}
      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-8 space-y-10">

        {/* BANNERE RAPIDE DE ACȚIUNE: PREFERINȚE COOKIE-URI */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Doriți să vă modificați preferințele chiar acum?</h2>
              <p className="text-xs text-zinc-300">Puteți activa sau dezactiva oricând modulele analitice și de redare media printr-un singur click.</p>
            </div>
          </div>
          {onOpenPreferences && (
            <button
              type="button"
              onClick={onOpenPreferences}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md active:scale-95 touch-manipulation shrink-0 cursor-pointer"
            >
              Deschide Panoul de Preferințe
            </button>
          )}
        </div>

        {/* SECȚIUNEA 1: CE SUNT COOKIE-URILE? */}
        <section id="ce-sunt-cookie-urile" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 01</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Ce sunt modulele cookie și la ce folosesc?</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Un <strong>„Internet Cookie”</strong> (termen cunoscut și ca „browser cookie” sau „HTTP cookie”) este un fișier de mici dimensiuni, format din litere și cifre, 
              care este stocat pe computerul, terminalul mobil sau alte echipamente ale unui utilizator de pe care se accesează internetul.
            </p>
            <p>
              Cookie-ul este instalat prin solicitarea emisă de către un web-server unui browser (ex: Chrome, Safari, Firefox, Edge) și este complet „pasiv”: 
              <strong> nu conține programe software, viruși sau spyware și nu poate accesa informațiile de pe hard-disk-ul utilizatorului</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block mb-1">Durata de viață a cookie-urilor</strong>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  • <strong>Cookie-uri de sesiune:</strong> stocate temporar în dosarul de cookie-uri al browserului, fiind șterse automat când închideți fereastra browserului.<br />
                  • <strong>Cookie-uri persistente:</strong> rămân stocate pe dispozitiv până la expirarea perioadei stabilite sau până când le ștergeți manual.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block mb-1">Tehnologii conexe (Web Storage)</strong>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Platforma noastră modernă utilizează și tehnologiile <strong>HTML5 LocalStorage</strong> și <strong>SessionStorage</strong> pentru a stoca în siguranță 
                  pe dispozitivul dumneavoastră catalogul de mașini, asigurând timpi de răspuns sub 50ms și independență față de fluctuațiile conexiunii la internet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECȚIUNEA 2: BAZA LEGALĂ */}
        <section id="baza-legala" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">Secțiunea 02</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Baza legală a prelucrării datelor prin cookie-uri</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Utilizarea modulelor cookie pe site-ul <strong>{dealer.name}</strong> se realizează în deplină concordanță cu legislația națională și europeană aplicabilă:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-zinc-300 text-xs sm:text-sm">
              <li>
                <strong>Pentru cookie-urile strict necesare (tehnice):</strong> Baza legală este <em>interesul legitim al operatorului</em> (art. 6 alin. 1 lit. f din GDPR) și excepția prevăzută la art. 4 alin. (5) lit. b) din <strong>Legea nr. 506/2004</strong>, nefiind necesar consimțământul prealabil deoarece aceste tehnologii sunt esențiale furnizării serviciului solicitat expres de vizitator (navigarea catalogului auto, securitate).
              </li>
              <li>
                <strong>Pentru cookie-urile analitice și conținut multimedia terț:</strong> Baza legală o reprezintă <em>consimțământul liber exprimat, informat și specific al utilizatorului</em> (art. 6 alin. 1 lit. a din GDPR și art. 4 alin. 5 din Legea 506/2004), colectat prin intermediul bannerului interactiv de consimțământ.
              </li>
            </ul>

            <div className="p-3.5 rounded-xl bg-blue-500/[0.05] border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Nu condiționăm accesul dumneavoastră la catalogul de mașini sau la datele de contact ale showroom-ului de acceptarea cookie-urilor opționale. Puteți refuza în orice moment modulele analitice sau media fără nicio repercusiune asupra vizualizării vehiculelor rulate.
              </span>
            </div>
          </div>
        </section>

        {/* SECȚIUNEA 3: CATEGORIILE DE COOKIE-URI */}
        <section id="categorii-cookie" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Secțiunea 03</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Categoriile de cookie-uri și module web utilizate</h2>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* 1. Strict Necesare */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-emerald-500/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  1. Module Strict Necesare (Tehnice & Stocare Locală)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  OBLIGATORIU
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Aceste tehnologii sunt indispensabile funcționării corecte a platformei. Ele permit memorarea mașinilor favorite, starea filtrelor aplicate (marcă, preț, tip combustibil, cutie de viteze), memorarea deciziei de consimțământ pentru a nu afișa bannerul la fiecare click, și optimizarea cache-ului local pentru încărcare ultra-rapidă. Acestea nu colectează date cu caracter personal în scopuri comerciale.
              </p>
            </div>

            {/* 2. Analitice */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-amber-500/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  2. Module de Analiză și Măsurare a Performanței
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  OPȚIONAL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Ne permit să contorizăm numărul de vizitatori unici și să măsurăm performanța tehnică a paginilor (de exemplu: viteza de redare a fotografiilor de înaltă rezoluție, stabilitatea vizuală pe mobil). Toate adresele IP sunt anonimizate înainte de procesare, astfel încât utilizatorii individuali nu pot fi identificați.
              </p>
            </div>

            {/* 3. Media & Social Terț */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-blue-500/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  3. Module de Conținut Multimedia & Servicii Terțe
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  OPȚIONAL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Pentru a vă oferi o transparență totală asupra stării tehnice a mașinilor rulate, integrăm scurte videoclipuri oficiale din contul nostru de TikTok (@rxm.automobile), hărți de navigare Waze și Google Maps pentru a ajunge la showroom, precum și butonul de consultanță directă prin WhatsApp. Acești furnizori pot plasa propriile module cookie în conformitate cu politicile lor independente de securitate.
              </p>
            </div>

          </div>
        </section>

        {/* SECȚIUNEA 4: TABELUL DETALIAT AL COOKIE-URILOR */}
        <section id="inventar-cookie" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 04</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Inventarul transparent al modulelor și cheilor de stocare</h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
            Mai jos regăsiți lista completă și actualizată a cheilor de memorie și cookie-urilor utilizate în platforma digitală {dealer.name}:
          </p>

          {/* Tabel cu Scroll Orizontal Protejat conform Invariantelor Mobile */}
          <div className="w-full overflow-x-auto touch-pan-x border border-white/[0.08] rounded-xl">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.04] text-zinc-200 border-b border-white/[0.08] font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Denumire / Cheie</th>
                  <th className="py-3 px-3.5">Furnizor</th>
                  <th className="py-3 px-3.5">Tip & Durată</th>
                  <th className="py-3 px-3.5">Scop Tehnic</th>
                  <th className="py-3 px-3.5">Categorie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {COOKIE_INVENTORY.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5 font-mono text-amber-300 font-semibold whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5 text-zinc-300 whitespace-nowrap">
                      {item.provider}
                    </td>
                    <td className="py-3 px-3.5 text-zinc-400 whitespace-nowrap">
                      <span className="block font-medium text-zinc-200">{item.type}</span>
                      <span className="text-[11px] text-zinc-400">{item.duration}</span>
                    </td>
                    <td className="py-3 px-3.5 text-zinc-300 text-xs leading-relaxed max-w-xs">
                      {item.purpose}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {item.category === 'essential' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Esențial
                        </span>
                      )}
                      {item.category === 'analytics' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Analitic
                        </span>
                      )}
                      {item.category === 'marketing' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          Media / Terț
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECȚIUNEA 5: CUM PUTEȚI CONTROLA COOKIE-URILE DIN BROWSER */}
        <section id="gestionare-preferinte" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold">Secțiunea 05</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gestionarea, blocarea și ștergerea cookie-urilor</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Aveți control deplin asupra modulelor cookie utilizate. Puteți alege să modificați opțiunile acordate pe acest site 
              sau să blocați / ștergeți cookie-urile direct din browserul dumneavoastră web.
            </p>

            {/* Buton declanșare panou intern */}
            {onOpenPreferences && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenPreferences}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black border border-white/15 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  <Settings2 className="w-4 h-4 text-amber-400 group-hover:text-black" />
                  <span>Modifică consimțământul acordat pe RXM Automobile</span>
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/[0.08]">
              <strong className="text-white text-sm block mb-2">Instrucțiuni oficiale pentru configurarea browserului:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-300 hover:text-amber-300 transition-colors touch-manipulation"
                >
                  <span className="font-semibold">Google Chrome (Desktop & Mobil)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <a
                  href="https://support.apple.com/ro-ro/105082"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-300 hover:text-amber-300 transition-colors touch-manipulation"
                >
                  <span className="font-semibold">Apple Safari (iOS & macOS)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <a
                  href="https://support.mozilla.org/ro/kb/sterge-cookie-urile-pentru-a-elimina-informatiile-stocate-pe-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-300 hover:text-amber-300 transition-colors touch-manipulation"
                >
                  <span className="font-semibold">Mozilla Firefox</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <a
                  href="https://support.microsoft.com/ro-ro/microsoft-edge/%C8%99tergerea-modulelor-cookie-%C3%AEn-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-300 hover:text-amber-300 transition-colors touch-manipulation"
                >
                  <span className="font-semibold">Microsoft Edge</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-2">
              <em>Notă:</em> Dezactivarea totală a modulelor cookie din setările browserului poate face ca anumite funcționalități avansate ale site-ului (precum stocarea preferințelor de sortare sau calculatoarele de rate lunare) să necesite reconfigurare la fiecare vizită.
            </p>
          </div>
        </section>

        {/* SECȚIUNEA 6: DREPTURILE PERSOANEI VIZATE ȘI CONTACT DPO */}
        <section id="contact-dpo" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 06</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Drepturile dumneavoastră conform GDPR & Contact</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              În conformitate cu Regulamentul (UE) 2016/679, aveți dreptul de acces la datele dumneavoastră, dreptul de a solicita rectificarea sau ștergerea acestora, 
              dreptul la restricționarea prelucrării, dreptul de opoziție și dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrare automată.
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <strong className="text-white text-sm block">Pentru orice solicitare privind confidențialitatea și modulele cookie:</strong>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Email DPO: <a href={`mailto:${dealer.email}`} className="text-amber-300 hover:underline">{dealer.email}</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Telefon: <a href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`} className="text-amber-300 hover:underline">{dealer.phonePrimary}</a></span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Sediu Social: {dealer.name}, {dealer.legalAddress} (CUI: {dealer.cui}, Reg. Com.: {dealer.regCom || 'J12/3012/13.07.2023'})</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onOpenTerms && (
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-all touch-manipulation cursor-pointer"
                >
                  <span>Consultați și Termenii & Condițiile Generale</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </button>
              )}

              <a
                href="https://www.dataprotection.ro/"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-all touch-manipulation"
              >
                <span>Autoritatea Națională de Supraveghere (ANSPDCP)</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* 🔝 Revenire Rapidă la Începutul Showroom-ului */}
      <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onBackToShowroom}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md active:scale-95 touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Înapoi în Showroom</span>
        </button>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs text-zinc-400 hover:text-amber-400 transition-colors py-2 touch-manipulation cursor-pointer"
        >
          Revenire la începutul paginii ↑
        </button>
      </div>

    </div>
  );
};
