import React, { useState } from 'react';
import { Truck, CheckCircle2, Shield, SlidersHorizontal, FileCheck, MessageCircle } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { recordIncomingLead } from '../../services/leadService';
import { resolveDealerContact } from '../../utils/helpers';

interface CustomOrderSectionProps {
  dealer?: typeof SEED_DEALER;
  showToast: (msg: string) => void;
}

export const CustomOrderSection: React.FC<CustomOrderSectionProps> = ({
  dealer = SEED_DEALER,
  showToast
}) => {
  const contact = resolveDealerContact(dealer);
  // Stare Formular Mașini la Comandă (#comanda)
  const [cmdBrand, setCmdBrand] = useState('Volkswagen');
  const [cmdModel, setCmdModel] = useState('');
  const [cmdYear, setCmdYear] = useState('2018');
  const [cmdBudget, setCmdBudget] = useState('16000');
  const [cmdFuel, setCmdFuel] = useState('Diesel');
  const [cmdTransmission, setCmdTransmission] = useState('Automată');
  const [cmdName, setCmdName] = useState('');
  const [cmdPhone, setCmdPhone] = useState('');
  const [cmdNotes, setCmdNotes] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  // Handler Cerere Mașină la Comandă
  const handleOrderOnDemandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdBrand || !cmdPhone) {
      showToast('⚠️ Vă rugăm să specificați cel puțin Marca dorită și un număr de telefon.');
      return;
    }
    if (!gdprConsent) {
      showToast('⚠️ Vă rugăm să bifați acordul privind prelucrarea datelor cu caracter personal.');
      return;
    }

    // Salvare automată a oportunității în CRM persistent
    recordIncomingLead({
      clientName: cmdName || 'Client Comandă',
      clientPhone: cmdPhone,
      dealType: 'cash',
      source: 'showroom_web',
      carTitle: `${cmdBrand} ${cmdModel || ''} (Buget ${cmdBudget} €)`,
      carPriceEur: Number(cmdBudget) || undefined,
      notes: `Mașină la Comandă: ${cmdBrand} ${cmdModel || ''} (Min. ${cmdYear}, ${cmdFuel}, ${cmdTransmission}). Buget: ${cmdBudget} €. Mențiuni: ${cmdNotes || 'Fără'}`,
    });

    const text = `Bună ziua! Doresc o mașină la comandă prin ${encodeURIComponent(dealer.name)}:%0A` +
      `🚗 Marcă & Model: ${encodeURIComponent(cmdBrand + (cmdModel ? ' ' + cmdModel : ''))}%0A` +
      `📅 An fabricație minim: ${encodeURIComponent(cmdYear)} | 💰 Buget estimat: ${encodeURIComponent(cmdBudget)} €%0A` +
      `⛽ Combustibil: ${encodeURIComponent(cmdFuel)} | ⚙️ Transmisie: ${encodeURIComponent(cmdTransmission)}%0A` +
      `👤 Solicitant: ${encodeURIComponent(cmdName || 'Client')}, Tel: ${encodeURIComponent(cmdPhone)}%0A` +
      `📝 Cerințe specifice: ${encodeURIComponent(cmdNotes || 'Fără preferințe speciale')}`;

    window.open(`https://wa.me/${contact.salesWhatsApp}?text=${text}`, '_blank');
    showToast(`🚀 Solicitarea pentru mașină la comandă a fost salvată și transmisă pe WhatsApp!`);
  };

  return (
    <section id="comanda" className="border-t border-white/[0.08] bg-[#0c0c0e] py-16 px-4 sm:px-8 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
              <Truck className="w-3.5 h-3.5 text-amber-400" /> Serviciu Premium la Comandă
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
              Aducem Orice Mașină la Comandă din Europa
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              Nu ai găsit exact mașina dorită în stocul nostru actual? Echipa <strong>{dealer.name}</strong> găsește, verifică tehnic și transportă autovehiculul dorit din Germania și rețeaua europeană în <strong>5-7 zile lucrătoare</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Transport Asigurat CMR
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Garanție până la 36 Luni
            </span>
          </div>
        </div>

        {/* 4 Pași Proces Import la Comandă */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
            <svg className="w-14 h-9 absolute top-3 right-4 pointer-events-none select-none text-amber-500/20" aria-hidden="true" viewBox="0 0 40 28">
              <text x="38" y="24" textAnchor="end" fill="currentColor" fontFamily="monospace" fontSize="28" fontWeight="900">01</text>
            </svg>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-1.5 leading-snug">
              Consiliere & <span className="text-amber-400 italic">Buget</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Definim împreună specificațiile dorite: marcă, an, kilometraj maxim, nivel de echipare și bugetul țintă.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
            <svg className="w-14 h-9 absolute top-3 right-4 pointer-events-none select-none text-amber-500/20" aria-hidden="true" viewBox="0 0 40 28">
              <text x="38" y="24" textAnchor="end" fill="currentColor" fontFamily="monospace" fontSize="28" fontWeight="900">02</text>
            </svg>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-1.5 leading-snug">
              Verificare <span className="text-amber-400 italic">Tehnică</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Verificăm istoricul complet carVertical, baza de date service oficială și starea optică înainte de tranzacție.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
            <svg className="w-14 h-9 absolute top-3 right-4 pointer-events-none select-none text-amber-500/20" aria-hidden="true" viewBox="0 0 40 28">
              <text x="38" y="24" textAnchor="end" fill="currentColor" fontFamily="monospace" fontSize="28" fontWeight="900">03</text>
            </svg>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-1.5 leading-snug">
              Transport <span className="text-amber-400 italic">Asigurat</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Vehiculul este încărcat pe platformă autorizată cu asigurare CMR și adus direct la showroom-ul nostru din Cluj.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
            <svg className="w-14 h-9 absolute top-3 right-4 pointer-events-none select-none text-amber-500/20" aria-hidden="true" viewBox="0 0 40 28">
              <text x="38" y="24" textAnchor="end" fill="currentColor" fontFamily="monospace" fontSize="28" fontWeight="900">04</text>
            </svg>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-1.5 leading-snug">
              Predare & <span className="text-amber-400 italic">Numere Roșii</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              Efectuăm revizia la predare, eliberăm numere roșii provizorii pe loc, garanție scrisă și asistență dosar RAR.
            </p>
          </div>
        </div>

        {/* Formular Interactiv Cerere Mașină la Comandă */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="font-serif text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Completează Criteriile Mașinii Dorite
          </div>

          <form onSubmit={handleOrderOnDemandSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cmd-brand" className="block text-zinc-400 mb-1 font-medium">Marca Dorită *</label>
                <input 
                  id="cmd-brand"
                  aria-label="Marca dorită la comandă"
                  type="text" 
                  required
                  placeholder="Ex: BMW, Audi, VW, Skoda" 
                  value={cmdBrand}
                  onChange={e => setCmdBrand(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="cmd-model" className="block text-zinc-400 mb-1 font-medium">Modelul / Caroseria</label>
                <input 
                  id="cmd-model"
                  aria-label="Modelul sau caroseria mașinii dorite"
                  type="text" 
                  placeholder="Ex: Seria 3 Touring / Passat B8" 
                  value={cmdModel}
                  onChange={e => setCmdModel(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="cmd-year" className="block text-zinc-400 mb-1 font-medium">An Fabricație Minim</label>
                <select 
                  id="cmd-year"
                  aria-label="An fabricație minim dorit"
                  value={cmdYear}
                  onChange={e => setCmdYear(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                >
                  <option value="2016+">2016 sau mai nou</option>
                  <option value="2018+">2018 sau mai nou</option>
                  <option value="2020+">2020 sau mai nou</option>
                  <option value="2022+">2022 sau mai nou</option>
                  <option value="Orice An">Orice an</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cmd-budget" className="block text-zinc-400 mb-1 font-medium">Buget Estimativ (EUR)</label>
                <input 
                  id="cmd-budget"
                  aria-label="Buget estimat în euro"
                  type="number" 
                  placeholder="Ex: 15000" 
                  value={cmdBudget}
                  onChange={e => setCmdBudget(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-mono touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="cmd-fuel" className="block text-zinc-400 mb-1 font-medium">Combustibil</label>
                <select 
                  id="cmd-fuel"
                  aria-label="Combustibil preferat"
                  value={cmdFuel}
                  onChange={e => setCmdFuel(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Benzină">Benzină</option>
                  <option value="Hibrid">Hibrid / Plug-in</option>
                  <option value="Electric">Electric</option>
                  <option value="Indiferent">Indiferent</option>
                </select>
              </div>

              <div>
                <label htmlFor="cmd-transmission" className="block text-zinc-400 mb-1 font-medium">Cutie de Viteze</label>
                <select 
                  id="cmd-transmission"
                  aria-label="Cutie de viteze preferată"
                  value={cmdTransmission}
                  onChange={e => setCmdTransmission(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                >
                  <option value="Automată">Automată</option>
                  <option value="Manuală">Manuală</option>
                  <option value="Indiferent">Indiferent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.08]">
              <div>
                <label htmlFor="cmd-name" className="block text-zinc-400 mb-1 font-medium">Nume & Prenume *</label>
                <input 
                  id="cmd-name"
                  aria-label="Numele și prenumele solicitantului"
                  type="text" 
                  required
                  placeholder="Ex: Dan Popescu" 
                  value={cmdName}
                  onChange={e => setCmdName(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
                />
              </div>

              <div>
                <label htmlFor="cmd-phone" className="block text-zinc-400 mb-1 font-medium">Număr de Telefon (WhatsApp) *</label>
                <input 
                  id="cmd-phone"
                  aria-label="Număr de telefon WhatsApp pentru contact"
                  type="tel" 
                  required
                  placeholder="Ex: 0740 123 456" 
                  value={cmdPhone}
                  onChange={e => setCmdPhone(e.target.value)}
                  className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 font-mono touch-manipulation"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cmd-notes" className="block text-zinc-400 mb-1 font-medium">Dotări Preferate / Detalii Suplimentare</label>
              <textarea 
                id="cmd-notes"
                aria-label="Cerințe și dotări preferate pentru mașina la comandă"
                rows={2} 
                placeholder="Ex: Pachet M sau S-Line, trapă panoramică, sub 160.000 km, fără accidente..." 
                value={cmdNotes}
                onChange={e => setCmdNotes(e.target.value)}
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
                  Am citit și sunt de acord cu prelucrarea datelor cu caracter personal în scopul procesării acestei cereri, conform{' '}
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
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Răspundem cu primele selecții verificate în maximum 24h.
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-11 px-6 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Trimite Solicitarea la Comandă pe WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
