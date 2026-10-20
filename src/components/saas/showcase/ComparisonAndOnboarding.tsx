import React, { useState } from 'react';
import { 
  Scale, 
  Check, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Quote, 
  Star, 
  ShieldCheck, 
  Globe, 
  Car,
  Lock,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';

interface ComparisonRow {
  feature: string;
  parcos: string;
  parcosStatus: 'good';
  carmatik: string;
  carmatikStatus: 'warning' | 'bad';
  traditionalDms: string;
  traditionalStatus: 'bad' | 'warning';
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: 'Suveranitate Brand & Domeniu Propriu',
    parcos: '✅ Showroom 100% dedicat pe domeniul tău (fără concurență)',
    parcosStatus: 'good',
    carmatik: '❌ Marketplace comun (clienții văd mașinile concurenților)',
    carmatikStatus: 'bad',
    traditionalDms: '❌ Doar software intern, fără site web inclus',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Design & Teme Vizuale Showroom',
    parcos: '✅ Dark Luxury & Light Modern 60fps (Obsidian, White, Navy)',
    parcosStatus: 'good',
    carmatik: '❌ Șablon alb comun, fără personalizare profundă',
    carmatikStatus: 'bad',
    traditionalDms: '❌ Interfețe grafice învechite (anii 2005-2010)',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Scaner Acte Inteligent (AI OCR)',
    parcos: '✅ Extragere în <1.8s (Talon RO, CIV RAR & Brief Germania)',
    parcosStatus: 'good',
    carmatik: '⚠️ Doar talon auto de România',
    carmatikStatus: 'warning',
    traditionalDms: '❌ Introducere manuală 100% caracter cu caracter',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Garanție Rezervare la Distanță',
    parcos: '✅ Garanție de Rezervare securizată (Stripe / Card / Transfer Instant)',
    parcosStatus: 'good',
    carmatik: '❌ Fără plată online sau link de garanție integrat',
    carmatikStatus: 'bad',
    traditionalDms: '❌ Transfer bancar manual fără confirmare pe site',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Format Video & Media Modern',
    parcos: '✅ Player video nativ 9:16 (TikTok & Instagram Reels)',
    parcosStatus: 'good',
    carmatik: '❌ Doar galerie foto statică standard',
    carmatikStatus: 'bad',
    traditionalDms: '❌ Doar fotografii cu rezoluție redusă',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Sincronizare Delta Stoc OLX',
    parcos: '✅ Notificări live discrepanțe preț și mașini vândute',
    parcosStatus: 'good',
    carmatik: '⚠️ Export de bază către portaluri',
    carmatikStatus: 'warning',
    traditionalDms: '❌ Export manual prin fișiere Excel',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Studio Plăcuțe & Watermark',
    parcos: '✅ Eliminare automată numere & aplicare logo în browser',
    parcosStatus: 'good',
    carmatik: '❌ Necesită editare manuală în Photoshop',
    carmatikStatus: 'bad',
    traditionalDms: '❌ Funcționalitate inexistentă',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Conformitate & Matematică Fiscală',
    parcos: '✅ TVA deductibil + Regim Marjă Art. 312 calculat automat',
    parcosStatus: 'good',
    carmatik: '⚠️ Câmp informativ simplu',
    carmatikStatus: 'warning',
    traditionalDms: '⚠️ Modul contabil greoi și rigid',
    traditionalStatus: 'warning'
  }
];

const TESTIMONIALS = [
  {
    name: 'Echipa Vânzări',
    park: 'RXM Automobile (Showroom Pilot)',
    city: 'Cluj-Napoca',
    carsInStock: '32 autoturisme',
    quote: 'Ofertele pe WhatsApp cu link securizat de Garanție de Rezervare (plată card Stripe sau transfer) ne-au salvat zeci de ore. Cumpărătorii din toată țara trimit garanția de 500 € cu încredere deplină, iar vehiculul se rezervă automat în showroom.',
    avatar: 'RXM'
  },
  {
    name: 'Paul M.',
    park: 'MPI Auto Cluj',
    city: 'Cluj-Napoca',
    carsInStock: '45 autoturisme',
    quote: 'Tema Clean White se încarcă instant pe telefoanele clienților. De când folosim ParcOS, clienții vin deja informați cu raportul tehnic parcurs, iar timpul de negociere s-a redus la jumătate.',
    avatar: 'MPI'
  },
  {
    name: 'Echipa Vânzări',
    park: 'Top Auto Transilvania',
    city: 'Transilvania',
    carsInStock: '60 autoturisme',
    quote: 'Pentru noi, scanarea brief-urilor germane în sub 2 secunde este revoluționară. Introducem un lot de 10 mașini sosite de pe platformă în mai puțin de 20 de minute, cu VIN-ul și puterea în kW calculate impecabil.',
    avatar: 'TAT'
  }
];

export const ComparisonAndOnboarding: React.FC = () => {
  // Onboarding Form State
  const [cuiInput, setCuiInput] = useState('');
  const [parkName, setParkName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [isQueryingAnaf, setIsQueryingAnaf] = useState(false);
  const [anafSuccess, setAnafSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subdomainSlug, setSubdomainSlug] = useState('parcul-tau');

  const handleCuiLookup = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const clean = cuiInput.trim().toUpperCase().replace(/[^0-9]/g, '');
    if (!clean) return;

    setIsQueryingAnaf(true);
    setAnafSuccess(false);

    try {
      const res = await fetch(`/api/anaf/${clean}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.name) {
          setParkName(json.name);
          setAnafSuccess(true);
          
          if (json.legalAddress) {
            setCity(json.legalAddress);
          }
          if (json.phone && !phone) {
            setPhone(json.phone);
          }

          const autoSlug = json.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 24);
          setSubdomainSlug(autoSlug || 'parcul-tau');
        } else {
          fallbackSlug(parkName || clean);
        }
      } else {
        fallbackSlug(parkName || clean);
      }
    } catch {
      fallbackSlug(parkName || clean);
    } finally {
      setIsQueryingAnaf(false);
    }
  };

  const fallbackSlug = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (slug) setSubdomainSlug(slug);
  };

  const handleParkNameChange = (val: string) => {
    setParkName(val);
    if (!anafSuccess) {
      fallbackSlug(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkName.trim() || !phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="w-full space-y-24">
      
      {/* 1. Comparison Matrix Section (#comparatie) */}
      <section id="comparatie" className="scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono-telemetry text-blue-300 font-semibold mb-3">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>BENCHMARKING FAPTIC // PARCOS VS COMPETIȚIE</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            De Ce Aleg Dealerii Suveranitatea ParcOS
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Nu oferim doar un șablon de site, ci un întreg sistem de operare pentru dealership: 
            showroom dedicat fără concurență, OCR cu inteligență artificială și garanții bancare sigure.
          </p>
        </div>

        {/* Responsive Table Wrapper with Horizontal Scroll & Touch Pan */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl overflow-hidden max-w-6xl mx-auto">
          <div className="overflow-x-auto touch-pan-x scrollbar-none">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-900/80 font-mono-telemetry">
                  <th className="py-4 px-6 text-zinc-400 font-bold uppercase tracking-wider text-[11px] w-2/5">
                    CRITERIU DE EVALUARE
                  </th>
                  <th className="py-4 px-6 text-amber-400 font-black uppercase tracking-wider text-xs bg-amber-400/5 border-x border-amber-400/20 w-1/3">
                    👑 PARCOS DMS v2.4
                  </th>
                  <th className="py-4 px-5 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] w-1/3">
                    CARMATIK.RO / DMS CLASIC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08] text-zinc-200">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 font-medium text-emerald-300 bg-amber-400/[0.02] border-x border-amber-400/20 font-mono-telemetry">
                      {row.parcos}
                    </td>
                    <td className="py-4 px-5 text-zinc-400 font-mono-telemetry text-xs">
                      {row.carmatik}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-zinc-900/60 border-t border-white/5 text-[11px] font-mono text-zinc-400 text-center">
            ← Glisați pe mobil pentru a compara toate specificațiile →
          </div>
        </div>
      </section>

      {/* 2. Social Proof & Active Dealer Network */}
      <section className="border-t border-white/[0.08] pt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-mono-telemetry text-amber-300 font-semibold mb-3">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>DEALERI ACTIVI ÎN PRODUCȚIE</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
            Validat de Parcuri Auto Reale din România
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-300">
            Iată ce spun fondatorii și consilierii de vânzări care folosesc ParcOS zi de zi pe Netcup VPS:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx}
              className="p-6 sm:p-7 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl flex flex-col justify-between hover:border-amber-400/40 transition-all shadow-xl group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center font-bold text-amber-400 text-xs font-mono">
                    {t.avatar}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <Quote className="w-6 h-6 text-zinc-600 mb-2" />
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                  „{t.quote}”
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="font-bold text-sm text-white">{t.name}</div>
                <div className="text-xs text-amber-400 font-medium">{t.park} • {t.city}</div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{t.carsInStock} gestionate</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Instant Onboarding Form with ANAF Autofill (#onboard) */}
      <section id="onboard" className="scroll-mt-20 border-t border-white/[0.08] pt-20">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 md:p-12 rounded-3xl bg-zinc-950/90 border border-white/15 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-mono-telemetry text-amber-300 font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>ONBOARDING INSTANT PRIN CUI ANAF v9</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
              Activează Showroom-ul Parcului Tău în 24 de Ore
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Introdu CUI-ul firmei pentru a prelua automat datele fiscale oficiale. 
              Echipa noastră configurează domeniul și importă stocul de autovehicule.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Cerere Recepționată cu Succes!
              </h3>
              <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                Am înregistrat parcul <strong>{parkName}</strong>. Showroom-ul tău dedicat pe domeniul{' '}
                <strong className="text-amber-400 font-mono">https://{subdomainSlug}.parcos.ro</strong>{' '}
                este în curs de inițializare pe Netcup VPS. Te vom contacta în scurt timp la telefon <strong>{phone}</strong>.
              </p>
              <div className="pt-4 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
                  Nr. Înregistrare: PRX-{Math.floor(100000 + Math.random() * 900000)} • SLA 24h
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
              
              {/* CUI Input with Instant ANAF Lookup Button */}
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                  <span>CUI Firmă (pentru completare automată ANAF):</span>
                  {anafSuccess && (
                    <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Date preluate oficial din ANAF
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cuiInput}
                    onChange={(e) => setCuiInput(e.target.value)}
                    placeholder="Ex: RO47910283 sau 47910283"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none min-h-[46px] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCuiLookup}
                    disabled={isQueryingAnaf}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-400/30 flex items-center gap-2 touch-manipulation disabled:opacity-50"
                  >
                    {isQueryingAnaf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Search className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{isQueryingAnaf ? 'Se caută...' : 'Caută ANAF'}</span>
                  </button>
                </div>
              </div>

              {/* Park Name and Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Nume Parc Auto / Societate *</label>
                  <input
                    type="text"
                    required
                    value={parkName}
                    onChange={(e) => handleParkNameChange(e.target.value)}
                    placeholder="Ex: Auto Park Transilvania SRL"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none min-h-[46px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Persoană de Contact *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Marius Pop"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Număr de Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0740 000 000"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none min-h-[46px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Adresă Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@nume-parc.ro"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-amber-400 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              {/* Showroom URL Live Preview */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Domeniul viitorului tău showroom:
                </span>
                <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  https://{subdomainSlug}.parcos.ro
                </span>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 mt-4 touch-manipulation active:scale-[0.98]"
              >
                <span>Solicită Activarea Showroom-ului (24h)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-zinc-400 font-mono">
                Activare garantată pe server dedicat Netcup VPS (152.53.158.65) • Fără contracte pe termen lung
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
};
