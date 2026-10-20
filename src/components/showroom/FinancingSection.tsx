import React, { useState, useMemo } from 'react';
import { Calculator, SlidersHorizontal, Sparkles, Shield, MessageCircle, CheckCircle2, Phone } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { calculateRate, VAT_RATE } from '../../utils/helpers';
import { convertEurToRon, getExchangeRateDisclaimer } from '../../utils/currencyEngine';
import { FinancingRequirementsAccordion } from './FinancingRequirementsAccordion';

interface FinancingSectionProps {
  cars: VehicleItem[];
  dealer?: typeof SEED_DEALER;
}

export type CreditorPartnerId = 'tbi' | 'bt' | 'unicredit' | 'creditfix';

export const CREDITOR_PARTNERS: Record<CreditorPartnerId, { 
  name: string; 
  sublabel: string; 
  interestRate: number; 
  isPrimary?: boolean;
}> = {
  tbi: { 
    name: 'TBI Bank', 
    sublabel: 'Principal • 100% online', 
    interestRate: 7.9, 
    isPrimary: true 
  },
  bt: { 
    name: 'Banca Transilvania', 
    sublabel: 'BT Direct', 
    interestRate: 8.5 
  },
  unicredit: { 
    name: 'UniCredit', 
    sublabel: 'Consumer Financing', 
    interestRate: 8.9 
  },
  creditfix: { 
    name: 'CreditFix', 
    sublabel: 'Aprobare rapidă', 
    interestRate: 9.9 
  },
};

export const FinancingSection: React.FC<FinancingSectionProps> = ({
  cars,
  dealer = SEED_DEALER
}) => {
  // Stare Finanțare Secțiune Dedicată (TBI Bank selectat implicit)
  const [finCarId, setFinCarId] = useState<string>('custom');
  const [finCustomPrice, setFinCustomPrice] = useState<number>(16900);
  const [finAdvPct, setFinAdvPct] = useState<number>(15);
  const [finMonths, setFinMonths] = useState<number>(48);
  const [finPartner, setFinPartner] = useState<CreditorPartnerId>('tbi');

  const activeCreditor = CREDITOR_PARTNERS[finPartner];

  const activeFinCar = useMemo(() => {
    if (finCarId === 'custom') return null;
    return cars.find(c => c.id === finCarId) || null;
  }, [finCarId, cars]);

  // Calcul Finanțare Secțiune Dedicată
  const activeFinPrice = useMemo(() => {
    if (finCarId === 'custom') return finCustomPrice;
    return activeFinCar ? activeFinCar.priceEur : finCustomPrice;
  }, [finCarId, finCustomPrice, activeFinCar]);

  const finAdvanceEur = Math.round(activeFinPrice * (finAdvPct / 100));
  const finLoanEur = activeFinPrice - finAdvanceEur;
  const finMonthlyRate = calculateRate(activeFinPrice, finAdvPct, finMonths, activeCreditor.interestRate);

  // Invariantă Fiscală TVA 21% (VAT_RATE = 0.21; Net = Gross / 1.21)
  const finNetPriceEur = Math.round(activeFinPrice / (1 + VAT_RATE));
  const finVatAmountEur = activeFinPrice - finNetPriceEur;

  return (
    <section id="finantare" className="border-t border-white/[0.08] bg-[#09090b] py-16 px-4 sm:px-8 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
              <Calculator className="w-3.5 h-3.5" /> Soluții Financiare Personalizate • Dobândă de la 7.9%
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
              Finanțare Rapidă în Rate & Leasing Auto
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Parteneriate oficiale cu <strong>TBI Bank</strong> (principal), <strong>Banca Transilvania (BT Direct)</strong>, <strong>UniCredit Consumer Financing</strong> și <strong>CreditFix</strong>. Aprobare pe loc în 2 ore!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs text-zinc-400">Creditori agreați:</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-400" /> TBI Bank (Principal)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs">BT Direct</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs">UniCredit</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs">CreditFix</span>
            </div>
          </div>
        </div>

        {/* Calculator Interactiv Finanțare */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coloana Stânga: Formular Calculator + Ghid Documentație Tucked-In */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Formular Calculator */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-8 shadow-xl">
              <div className="font-bold text-white text-base mb-6 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Configurează Planul Tău de Finanțare
              </div>

            <div className="space-y-6 text-xs">
              {/* Selectare Vehicul din Stoc sau Sumă Personalizată */}
              <div>
                <label htmlFor="fin-car-select" className="block text-zinc-300 font-semibold mb-2">Alege mașina din stocul RXM sau introdu valoarea:</label>
                <select 
                  id="fin-car-select"
                  aria-label="Selectează mașina pentru finanțare"
                  value={finCarId}
                  onChange={e => setFinCarId(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400 text-base sm:text-sm font-semibold mb-3 touch-manipulation"
                >
                  <option value="custom">Valoare personalizată (simulator)</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year}) — {c.priceEur.toLocaleString('ro-RO')} € {c.vatDeductible ? '(TVA deductibil)' : ''}
                    </option>
                  ))}
                </select>

                {finCarId === 'custom' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    <label htmlFor="fin-custom-price" className="text-zinc-300 font-medium text-xs sm:text-sm whitespace-nowrap cursor-pointer">Valoare autoturism:</label>
                    <div className="relative w-full sm:w-52">
                      <input 
                        id="fin-custom-price"
                        aria-label="Valoare autoturism în euro"
                        type="number"
                        min="3000"
                        max="60000"
                        step="500"
                        value={finCustomPrice}
                        onChange={e => setFinCustomPrice(Number(e.target.value))}
                        className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-base outline-none focus:border-amber-400 pr-10 touch-manipulation"
                      />
                      <span className="absolute right-3 top-3 text-zinc-400 font-bold">€</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Slider Avans */}
              <div>
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-baseline gap-1 mb-2">
                  <span className="text-zinc-300 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    Avans inițial: <strong className="text-amber-400 text-sm">{finAdvPct}%</strong>
                  </span>
                  <span className="text-zinc-400 font-mono text-xs sm:text-sm whitespace-nowrap">
                    {finAdvanceEur.toLocaleString('ro-RO')} € <span className="text-zinc-400 text-[11px] font-normal">({convertEurToRon(finAdvanceEur).toLocaleString('ro-RO')} RON)</span>
                  </span>
                </div>
                <input 
                  id="fin-advance-slider"
                  aria-label="Procent avans inițial"
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={finAdvPct}
                  onChange={e => setFinAdvPct(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg accent-amber-500 cursor-pointer touch-manipulation"
                />
                <div className="flex justify-between text-[10px] sm:text-[11px] text-zinc-400 mt-1 font-mono">
                  <span>0% <span className="hidden sm:inline">(Fără avans)</span></span>
                  <span>15%</span>
                  <span>30%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Slider Perioadă */}
              <div>
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-baseline gap-1 mb-2">
                  <span className="text-zinc-300 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    Perioadă: <strong className="text-amber-400 text-sm">{finMonths} luni</strong> <span className="text-zinc-400 text-xs font-normal">({finMonths / 12} {finMonths === 12 ? 'an' : 'ani'})</span>
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-medium whitespace-nowrap">
                    Rată fixă LEI / EUR
                  </span>
                </div>
                <input 
                  id="fin-months-slider"
                  aria-label="Perioadă rambursare în luni"
                  type="range"
                  min="12"
                  max="60"
                  step="12"
                  value={finMonths}
                  onChange={e => setFinMonths(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg accent-amber-500 cursor-pointer touch-manipulation"
                />
                <div className="flex justify-between text-[10px] sm:text-[11px] text-zinc-400 mt-1 font-mono">
                  <span>12 luni <span className="hidden sm:inline">(1 an)</span></span>
                  <span>24 luni</span>
                  <span>36 luni</span>
                  <span>48 luni</span>
                  <span>60 luni <span className="hidden sm:inline">(5 ani)</span></span>
                </div>
              </div>

              {/* Selector Partener (4 Creditori în ordinea agreată) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-zinc-300 font-semibold text-xs sm:text-sm">Finanțator partener:</div>
                  <div className="text-[11px] text-amber-400 font-mono font-medium">Dobândă: {activeCreditor.interestRate}% / an</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {(Object.keys(CREDITOR_PARTNERS) as CreditorPartnerId[]).map(key => {
                    const cred = CREDITOR_PARTNERS[key];
                    const isSelected = finPartner === key;
                    return (
                      <button 
                        key={key}
                        type="button"
                        onClick={() => setFinPartner(key)}
                        className={`min-h-[46px] p-2.5 rounded-xl border text-center transition-all touch-manipulation active:scale-95 relative ${
                          isSelected 
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10' 
                            : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cred.isPrimary && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-wider">
                            Principal
                          </span>
                        )}
                        <div className="text-[11px] sm:text-xs font-bold leading-tight mt-0.5">{cred.name}</div>
                        <div className="text-[9.5px] text-zinc-400 mt-0.5">{cred.interestRate}% • {cred.sublabel.split('•')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Ghid Condiții & Documente Necesare (Expandabil / Tucked In, începe Collapsed) */}
          <FinancingRequirementsAccordion dealer={dealer} />
        </div>

          {/* Rezumat Rată & Aplicare Rapidă */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-b from-[#18181b] to-[#121215] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Rezultat Simulare Finanțare
              </div>
              
              <div className="mt-4 mb-6">
                <span className="text-xs text-zinc-400">Rată Lunară Estimată ({activeCreditor.name}):</span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono mt-1">
                  {finMonthlyRate} € <span className="text-base font-normal text-zinc-400">/ lună</span>
                </div>
                <div className="text-sm text-amber-300/90 font-mono mt-1.5 font-bold tracking-tight">
                  {convertEurToRon(finMonthlyRate).toLocaleString('ro-RO')} RON / lună
                </div>
                <div className="text-[10.5px] text-zinc-400 mt-1 font-mono">
                  {getExchangeRateDisclaimer()}
                </div>
              </div>

              <div className="space-y-2.5 border-t border-white/[0.08] pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Preț Vehicul:</span>
                  <strong className="text-white font-mono">{activeFinPrice.toLocaleString('ro-RO')} €</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Avans ({finAdvPct}%):</span>
                  <strong className="text-white font-mono">{finAdvanceEur.toLocaleString('ro-RO')} € ({convertEurToRon(finAdvanceEur).toLocaleString('ro-RO')} RON)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sumă Finanțată:</span>
                  <strong className="text-amber-300 font-mono">{finLoanEur.toLocaleString('ro-RO')} €</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Perioadă & Dobândă:</span>
                  <strong className="text-white">{finMonths} luni @ {activeCreditor.interestRate}%/an</strong>
                </div>
              </div>

              {/* Notă Strictă TVA 21% pentru Firme vs Regim Marjă */}
              <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] text-zinc-300 leading-relaxed">
                {activeFinCar ? (
                  activeFinCar.vatDeductible ? (
                    <>
                      <div className="font-semibold text-emerald-400 mb-0.5 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" /> Beneficiu Fiscal Firme (TVA Deductibil 21%):
                      </div>
                      Mașina beneficiază de factură fiscală cu <strong>21% TVA deductibil</strong> pentru persoane juridice (SRL / PFA). Valoare netă: <strong>{finNetPriceEur.toLocaleString('ro-RO')} €</strong> (TVA 21%: <strong>{finVatAmountEur.toLocaleString('ro-RO')} €</strong>).
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-amber-300 mb-0.5 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Regim Fiscal Firmă (Art. 312 Cod Fiscal):
                      </div>
                      Vehicul comercializat în <strong>Regim Special al Marjei</strong> (fără TVA deductibil la achiziție). Rata lunară de leasing/credit este deductibilă ca și cheltuială operațională în contabilitatea firmei.
                    </>
                  )
                ) : (
                  <>
                    <div className="font-semibold text-white mb-0.5 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Simulator Fiscal Firme (SRL / PFA):
                    </div>
                    Pentru vehiculele eligibile cu TVA deductibil (21%), valoarea fără TVA este <strong>{finNetPriceEur.toLocaleString('ro-RO')} €</strong> (TVA 21%: <strong>{finVatAmountEur.toLocaleString('ro-RO')} €</strong>). Pentru vehiculele în regim de marjă, prețul afișat este final.
                  </>
                )}
              </div>

              {/* Card Contact Consilier Finanțare Mădălina */}
              <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Consilier Credite & Leasing</div>
                  <div className="text-white font-bold text-sm">Consultanță Rate: <span className="font-mono text-amber-300">0758 042 979</span></div>
                  <div className="text-[10.5px] text-zinc-400 mt-0.5">Consultanță gratuită dosar • Aprobare rapidă 15–30 min</div>
                </div>
                <a 
                  href={`tel:${(dealer.phoneFinance || '0758042979').replace(/\s+/g, '')}`}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-white/10 shrink-0 touch-manipulation active:scale-95"
                  title="Apelează consilierul de credite"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sună</span>
                </a>
              </div>

              <a 
                href={`https://wa.me/${dealer.whatsappFinance || '40758042979'}?text=Bună%20ziua!%20Doresc%20să%20aplic%20pentru%20finanțare%20auto%20la%20RXM%20Automobile:%0A- Valoare:%20${activeFinPrice}€%0A- Avans:%20${finAdvPct}%20(${finAdvanceEur}€)%0A- Perioadă:%20${finMonths}%20luni%0A- Rată%20estimată:%20${finMonthlyRate}€/lună%20(${convertEurToRon(finMonthlyRate)}%20RON)%0A- Finanțator:%20${encodeURIComponent(activeCreditor.name)}%20(Dobândă%20${activeCreditor.interestRate}%)`}
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Aplică pe WhatsApp ({activeCreditor.name})</span>
              </a>

              {/* Disclaimer Legal OUG 50/2010 & ANPC */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10.5px] text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">Exemplu orientativ & Disclaimer OUG nr. 50/2010:</strong> Calculele prezentate în simulator au caracter strict informativ și nu reprezintă o ofertă contractuală de creditare sau leasing. DAE, dobânda finală și valoarea totală plătibilă sunt stabilite exclusiv de finanțatorul autorizat ({activeCreditor.name}) în baza analizei dosarului financiar.
              </div>
            </div>

            {/* 3 Beneficii Rapide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.08]">
                <div className="text-emerald-400 font-bold mb-1">✓ Aprobare 2h</div>
                <p className="text-[11px] text-zinc-400">Doar cu buletinul</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.08]">
                <div className="text-emerald-400 font-bold mb-1">✓ Avans 0%</div>
                <p className="text-[11px] text-zinc-400">Până la 60 de luni</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.08]">
                <div className="text-emerald-400 font-bold mb-1">✓ Venit Extern</div>
                <p className="text-[11px] text-zinc-400">Contracte din diaspora</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
