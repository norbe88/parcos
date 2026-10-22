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
  traditionalDms: string;
  traditionalStatus: 'bad' | 'warning';
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: 'Site-ul Tău Propriu (ex: numeparc.ro)',
    parcos: '✅ Site dedicat 100% doar mașinilor tale, cu sigla ta',
    parcosStatus: 'good',
    traditionalDms: '❌ Ești amestecat cu mii de alte parcuri sau ai un site vechi',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Aspectul Mașinilor pe Telefon',
    parcos: '✅ Arată impecabil pe orice telefon, cu poze mari și filmări video',
    parcosStatus: 'good',
    traditionalDms: '❌ Site-uri vechi, încete, unde mașinile se văd înghesuit',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Completarea Datelor Mașinilor',
    parcos: '✅ Faci o poză la talon și datele se pun singure în 2 secunde',
    parcosStatus: 'good',
    traditionalDms: '❌ Bătăi de cap cu tastat manual seria de șasiu caracter cu caracter',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Încasarea Avansului la Distanță',
    parcos: '✅ Trimiți link pe WhatsApp, clientul plătește cu cardul pe loc',
    parcosStatus: 'good',
    traditionalDms: '❌ Risc de clienți neserioși sau cerut bani prin conturi nesigure',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Prezentare Video pe Telefon',
    parcos: '✅ Video vertical tip TikTok / Reels direct pe pagina mașinii',
    parcosStatus: 'good',
    traditionalDms: '❌ Doar poze statice, adesea neclare',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Evidența Mașinilor la Vânzare',
    parcos: '✅ Știi mereu ce mașini mai ai în parc și ce ai vândut',
    parcosStatus: 'good',
    traditionalDms: '⚠️ Uiți anunțuri vechi pe internet și plătești degeaba promovare',
    traditionalStatus: 'warning'
  },
  {
    feature: 'Poze cu Sigla Parcului Tău',
    parcos: '✅ Ascunzi automat numerele vechi și pui sigla ta pe poze',
    parcosStatus: 'good',
    traditionalDms: '❌ Poze needitate sau ore pierdute cu programe complicate',
    traditionalStatus: 'bad'
  },
  {
    feature: 'Calculul de TVA și Profit',
    parcos: '✅ Calculează automat mașini cu TVA deductibil sau la marjă',
    parcosStatus: 'good',
    traditionalDms: '⚠️ Calcule manuale complicate sau certuri la facturare',
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
    park: 'ALD Autoland',
    city: 'România',
    carsInStock: '60 autoturisme',
    quote: 'Pentru noi, scanarea brief-urilor germane în sub 2 secunde este revoluționară. Introducem un lot de 10 mașini sosite de pe platformă în mai puțin de 20 de minute, cu VIN-ul și puterea în kW calculate impecabil.',
    avatar: 'ALD'
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs text-blue-900 font-bold mb-3">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>DE CE SĂ ALEGI PARCOS ÎN LOC SĂ ȚII EVIDENȚA PE HÂRTIE SAU EXCEL</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight">
            Diferența dintre metodele vechi și un parc auto modern
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Nu îți dăm doar o pagină web simplă, ci un program complet care îți organizează tot parcul: 
            site-ul tău fără concurență, scanare de acte cu telefonul și încasarea avansului pe loc.
          </p>
        </div>

        {/* Responsive Table Wrapper with Horizontal Scroll & Touch Pan */}
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl overflow-hidden max-w-6xl mx-auto">
          <div className="overflow-x-auto touch-pan-x scrollbar-none">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-6 text-slate-700 font-bold uppercase tracking-wider text-[11px] w-2/5">
                    CE AI NEVOIE ÎN PARC
                  </th>
                  <th className="py-4 px-6 text-amber-800 font-black uppercase tracking-wider text-xs bg-amber-500/10 border-x border-amber-500/30 w-1/3">
                    👑 CU PARCOS
                  </th>
                  <th className="py-4 px-5 text-slate-700 font-bold uppercase tracking-wider text-[11px] w-1/3">
                    METODE VECHI (EXCEL, CAIET, SITE SIMPLU)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-950">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-800 bg-amber-500/5 border-x border-amber-500/20 font-mono-telemetry">
                      {row.parcos}
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-mono-telemetry text-xs">
                      {row.traditionalDms}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-600 text-center font-medium">
            ← Glisați pe mobil pentru a compara toate specificațiile →
          </div>
        </div>
      </section>

      {/* 2. Social Proof & Active Dealer Network */}
      <section className="border-t border-slate-200/80 pt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-mono-telemetry text-amber-900 font-bold mb-3">
            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>DEALERI ACTIVI ÎN PRODUCȚIE</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-slate-950 tracking-tight">
            Validat de Parcuri Auto Reale din România
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Iată ce spun fondatorii și consilierii de vânzări care folosesc ParcOS zi de zi în parcurile lor auto:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx}
              className="p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center font-black text-amber-800 text-xs font-mono">
                    {t.avatar}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>

                <Quote className="w-6 h-6 text-slate-300 mb-2" />
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  „{t.quote}”
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="font-bold text-sm text-slate-950">{t.name}</div>
                <div className="text-xs text-amber-700 font-bold">{t.park} • {t.city}</div>
                <div className="text-[10px] font-mono text-slate-600 mt-0.5">{t.carsInStock} gestionate</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Instant Onboarding Form with ANAF Autofill (#onboard) */}
      <section id="onboard" className="scroll-mt-20 border-t border-slate-200/80 pt-20">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 md:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 font-bold mb-3">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>ÎNCEARCĂ GRATUIT PENTRU PARCUL TĂU</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-slate-950 tracking-tight">
              Vezi cum arată mașinile tale pe propriul tău site
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Scrie CUI-ul firmei tale pentru a prelua automat datele oficiale. 
              Îți pregătim gratuit o demonstrație cu stocul tău de mașini în maxim 24 de ore.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-xl sm:text-2xl text-slate-950">
                Am primit solicitarea ta!
              </h3>
              <p className="text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
                Am înregistrat parcul <strong>{parkName}</strong>. Pregătim demonstrația pe domeniul{' '}
                <strong className="text-amber-700 font-mono">https://{subdomainSlug}.parcos.ro</strong>{' '}
                și te sunăm în cel mai scurt timp la numărul <strong>{phone}</strong> pentru a-ți arăta cum funcționează.
              </p>
              <div className="pt-4 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  Nr. Solicitare: PRX-{Math.floor(100000 + Math.random() * 900000)} • Răspuns în maxim 24h
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
              
              {/* CUI Input with Instant ANAF Lookup Button */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>CUI Firmă (pentru completare automată ANAF):</span>
                  {anafSuccess && (
                    <span className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Date preluate oficial din ANAF
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cuiInput}
                    onChange={(e) => setCuiInput(e.target.value)}
                    placeholder="Ex: RO47910283 sau 47910283"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-sm focus:border-amber-500 focus:bg-white focus:outline-none min-h-[46px] font-mono shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCuiLookup}
                    disabled={isQueryingAnaf}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-2 touch-manipulation disabled:opacity-50 transition-colors"
                  >
                    {isQueryingAnaf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    ) : (
                      <Search className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{isQueryingAnaf ? 'Se caută...' : 'Caută ANAF'}</span>
                  </button>
                </div>
              </div>

              {/* Park Name and Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Nume Parc Auto / Societate *</label>
                  <input
                    type="text"
                    required
                    value={parkName}
                    onChange={(e) => handleParkNameChange(e.target.value)}
                    placeholder="Ex: Auto Park Transilvania SRL"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-sm focus:border-amber-500 focus:bg-white focus:outline-none min-h-[46px] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Persoană de Contact *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Marius Pop"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-sm focus:border-amber-500 focus:bg-white focus:outline-none min-h-[46px] shadow-xs"
                  />
                </div>
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Număr de Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0740 000 000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-sm focus:border-amber-500 focus:bg-white focus:outline-none min-h-[46px] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Adresă Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@nume-parc.ro"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-sm focus:border-amber-500 focus:bg-white focus:outline-none min-h-[46px] shadow-xs"
                  />
                </div>
              </div>

              {/* Showroom URL Live Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  Domeniul viitorului tău showroom:
                </span>
                <span className="font-mono text-xs font-bold text-amber-800 px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">
                  https://{subdomainSlug}.parcos.ro
                </span>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 mt-4 touch-manipulation active:scale-[0.98] cursor-pointer"
              >
                <span>Vreau să văd parcul meu pe ParcOS (Gratuit)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-slate-600 font-medium">
                Fără obligații financiare • Fără contracte pe termen lung • Configurare rapidă
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
};
