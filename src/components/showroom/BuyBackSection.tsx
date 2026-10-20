import React, { useState } from 'react';
import { ArrowLeftRight, Car, CheckCircle2, MessageCircle } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { recordIncomingLead } from '../../services/leadService';

interface BuyBackSectionProps {
  cars: VehicleItem[];
  dealer?: typeof SEED_DEALER;
  showToast: (msg: string) => void;
}

export const BuyBackSection: React.FC<BuyBackSectionProps> = ({
  cars,
  dealer = SEED_DEALER,
  showToast
}) => {
  // Stare Formular Buy-Back (#buyback) - Exclusiv Trade-In
  const [bbBrand, setBbBrand] = useState('');
  const [bbModel, setBbModel] = useState('');
  const [bbYear, setBbYear] = useState('2016');
  const [bbMileage, setBbMileage] = useState('');
  const [bbFuel, setBbFuel] = useState('Diesel');
  const [bbTransmission, setBbTransmission] = useState('Automată');
  const [bbTargetCarId, setBbTargetCarId] = useState('');
  const [bbDesiredPrice, setBbDesiredPrice] = useState('');
  const [bbName, setBbName] = useState('');
  const [bbPhone, setBbPhone] = useState('');
  const [bbNotes, setBbNotes] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  // Handler Cerere Buy-Back (Trade-In Exclusiv cu Mașină din Parc)
  const handleBuybackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bbBrand || !bbModel || !bbPhone || !bbTargetCarId) {
      showToast('⚠️ Vă rugăm să selectați autoturismul dorit din stocul nostru și să completați datele mașinii și telefonul.');
      return;
    }
    if (!gdprConsent) {
      showToast('⚠️ Vă rugăm să bifați acordul privind prelucrarea datelor cu caracter personal.');
      return;
    }
    const targetCar = cars.find(c => c.id === bbTargetCarId);
    const targetCarText = targetCar 
      ? `${targetCar.brand} ${targetCar.model} (${targetCar.priceEur.toLocaleString('ro-RO')} €)` 
      : 'Autoturism din stocul RXM';

    // Salvare automată a oportunității în Registrul Persistent Lead-uri CRM
    recordIncomingLead({
      clientName: bbName || 'Client Trade-In',
      clientPhone: bbPhone,
      dealType: 'buyback',
      source: 'showroom_web',
      carId: targetCar?.id,
      carTitle: targetCar ? `${targetCar.brand} ${targetCar.model}` : undefined,
      carPriceEur: targetCar?.priceEur,
      notes: `Trade-In: Mașina veche: ${bbBrand} ${bbModel} (An ${bbYear}, ${bbMileage || 'N/A'} km, ${bbFuel}, ${bbTransmission}). Preț dorit: ${bbDesiredPrice ? bbDesiredPrice + ' €' : 'Nespecificat'}. Notițe: ${bbNotes || 'Fără'}`,
    });

    const text = `Bună ziua! Solicit evaluare Trade-In (Schimb Auto) la RXM Automobile Cluj:%0A` +
      `🚗 Mașina mea la schimb: ${encodeURIComponent(bbBrand + ' ' + bbModel)} (An ${bbYear}, ${bbMileage ? bbMileage + ' km' : 'km nespecificați'}, ${bbFuel}, ${bbTransmission})%0A` +
      `💰 Preț dorit pentru mașina mea: ${encodeURIComponent(bbDesiredPrice ? bbDesiredPrice + ' €' : 'Aștept evaluarea consilierului')}%0A` +
      `🎯 Schimb cu mașina din stocul RXM: ${encodeURIComponent(targetCarText)}%0A` +
      `👤 Nume: ${encodeURIComponent(bbName || 'Client')}, Tel: ${encodeURIComponent(bbPhone)}%0A` +
      `📝 Detalii: ${encodeURIComponent(bbNotes || 'Fără mențiuni speciale')}`;

    window.open(`https://wa.me/${dealer.whatsappNumber}?text=${text}`, '_blank');
    showToast(`✅ Cererea de Trade-In pentru ${bbBrand} ${bbModel} a fost salvată și deschisă pe WhatsApp!`);
  };

  return (
    <section id="buyback" className="border-t border-white/[0.08] bg-[#0c0c0e] py-16 px-4 sm:px-8 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Serviciu Gratuit Trade-In
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
            Buy-Back Auto — Dă Mașina Veche la Schimb
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
            Evaluează autovehiculul tău la prețul real al pieței. Valoarea mașinii vechi devine avans pentru orice autoturism din stocul RXM Automobile sau îți virăm contravaloarea prin transfer bancar!
          </p>
        </div>

        {/* 3 Pași Simpli */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-xs">
          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">01</div>
            <h3 className="font-serif text-xl font-bold text-white mb-2 leading-snug">
              Completezi <span className="text-amber-400 italic">Formularul</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Introduci datele mașinii tale actuale (marcă, an, kilometraj, stare) în simulatorul de mai jos.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">02</div>
            <h3 className="font-serif text-xl font-bold text-white mb-2 leading-snug">
              Evaluare în <span className="text-amber-400 italic">Max. 24 Ore</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Specialiștii RXM analizează istoricul și cotația de piață și revin cu o ofertă fermă și transparentă.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">03</div>
            <h3 className="font-serif text-xl font-bold text-white mb-2 leading-snug">
              Schimb Auto & <span className="text-amber-400 italic">Trade-In Avantajos</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Valoarea mașinii tale vechi este scăzută direct din prețul noului autoturism ales din stocul nostru. Pleci la volanul noii mașini în aceeași zi.
            </p>
          </div>
        </div>

        {/* Formular Buy-Back */}
        <div className="max-w-3xl mx-auto bg-[#121215] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Car className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-xl font-bold text-white">Solicită Evaluarea Gratuită a Autoturismului Tău</h3>
          </div>

          <form onSubmit={handleBuybackSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bb-brand" className="block text-zinc-400 mb-1 font-medium">Marcă Autoturism Actual *</label>
                <input 
                  id="bb-brand"
                  aria-label="Marcă autoturism actual"
                  type="text" 
                  required
                  placeholder="Ex: Volkswagen, BMW, Audi..." 
                  value={bbBrand}
                  onChange={e => setBbBrand(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-semibold touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="bb-model" className="block text-zinc-400 mb-1 font-medium">Model & Versiune *</label>
                <input 
                  id="bb-model"
                  aria-label="Model și versiune autoturism"
                  type="text" 
                  required
                  placeholder="Ex: Passat B8 2.0 TDI" 
                  value={bbModel}
                  onChange={e => setBbModel(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-semibold touch-manipulation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label htmlFor="bb-year" className="block text-zinc-400 mb-1 font-medium">An Fabricație</label>
                <input 
                  id="bb-year"
                  aria-label="An fabricație autoturism"
                  type="number" 
                  min="2000"
                  max="2026"
                  value={bbYear}
                  onChange={e => setBbYear(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="bb-mileage" className="block text-zinc-400 mb-1 font-medium">Kilometri Reali</label>
                <input 
                  id="bb-mileage"
                  aria-label="Kilometri reali autoturism"
                  type="number" 
                  placeholder="Ex: 185000" 
                  value={bbMileage}
                  onChange={e => setBbMileage(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="bb-fuel" className="block text-zinc-400 mb-1 font-medium">Combustibil</label>
                <select 
                  id="bb-fuel"
                  aria-label="Combustibil autoturism"
                  value={bbFuel}
                  onChange={e => setBbFuel(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Benzină">Benzină</option>
                  <option value="Hibrid">Hibrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <label htmlFor="bb-transmission" className="block text-zinc-400 mb-1 font-medium">Transmisie</label>
                <select 
                  id="bb-transmission"
                  aria-label="Cutie viteze autoturism"
                  value={bbTransmission}
                  onChange={e => setBbTransmission(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                >
                  <option value="Automată">Automată</option>
                  <option value="Manuală">Manuală</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bb-desired-price" className="block text-zinc-400 mb-1 font-medium">Preț Estimat / Dorit de Tine (EUR)</label>
                <input 
                  id="bb-desired-price"
                  aria-label="Preț estimat sau dorit în euro"
                  type="number" 
                  placeholder="Ex: 9500" 
                  value={bbDesiredPrice}
                  onChange={e => setBbDesiredPrice(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-mono touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="bb-target-car" className="block text-zinc-400 mb-1 font-medium">Alege mașina dorită din stocul nostru la schimb *</label>
                <select 
                  id="bb-target-car"
                  aria-label="Opțiune schimb mașină din stoc"
                  required
                  value={bbTargetCarId}
                  onChange={e => setBbTargetCarId(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-semibold touch-manipulation"
                >
                  <option value="">-- Alege autoturismul din stocul RXM --</option>
                  {cars.filter(c => c.status !== 'sold').map(c => (
                    <option key={c.id} value={c.id}>
                      Schimb cu: {c.brand} {c.model} ({c.priceEur.toLocaleString('ro-RO')} €)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.08]">
              <div>
                <label htmlFor="bb-name" className="block text-zinc-400 mb-1 font-medium">Nume & Prenume *</label>
                <input 
                  id="bb-name"
                  aria-label="Nume și prenume solicitant"
                  type="text" 
                  required
                  placeholder="Numele tău complet" 
                  value={bbName}
                  onChange={e => setBbName(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="bb-phone" className="block text-zinc-400 mb-1 font-medium">Număr de Telefon (WhatsApp) *</label>
                <input 
                  id="bb-phone"
                  aria-label="Număr de telefon WhatsApp"
                  type="tel" 
                  required
                  placeholder="Ex: 0740 123 456" 
                  value={bbPhone}
                  onChange={e => setBbPhone(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-semibold touch-manipulation"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bb-notes" className="block text-zinc-400 mb-1 font-medium">Detalii Tehnice / Stare / Istoric Daune (Opțional)</label>
              <textarea 
                id="bb-notes"
                aria-label="Detalii tehnice, stare sau istoric autoturism"
                rows={2}
                placeholder="Menționează opțiuni speciale, stare anvelope, revizii sau mici imperfecțiuni optice..." 
                value={bbNotes}
                onChange={e => setBbNotes(e.target.value)}
                className="w-full min-h-[72px] bg-[#18181b] border border-white/10 rounded-xl p-3 text-base sm:text-xs text-white outline-none focus:border-amber-400 resize-none touch-manipulation"
              />
            </div>

            {/* 🛡️ Bifă Obligatorie Consimțământ GDPR (ANSPDCP / Regulamentul UE 2016/679) */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  required
                  checked={gdprConsent}
                  onChange={e => setGdprConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#18181b] text-amber-500 focus:ring-amber-400/30 focus:ring-offset-0 focus:ring-2 cursor-pointer shrink-0 accent-amber-500"
                />
                <span className="text-[11.5px] text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                  Am citit și sunt de acord cu prelucrarea datelor mele cu caracter personal în scopul evaluării autoturismului și transmiterii ofertei de schimb, conform{' '}
                  <a 
                    href="/termeni-si-conditii#date-personale" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', '/termeni-si-conditii#date-personale');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }} 
                    className="text-amber-400 hover:underline font-medium"
                  >
                    Politicii de Confidențialitate
                  </a>.
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Datele sunt trimise confidențial către consilierii RXM.
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold h-11 px-6 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Trimite Solicitarea de Buy-Back pe WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
