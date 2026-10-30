import React, { useState } from 'react';
import { 
  ChevronDown, 
  FileText, 
  Building2, 
  User, 
  Globe, 
  CheckCircle2, 
  Phone, 
  MessageCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';

interface FinancingRequirementsAccordionProps {
  dealer?: typeof SEED_DEALER;
  className?: string;
  defaultExpanded?: boolean;
}

type TabType = 'persoane-fizice' | 'persoane-juridice' | 'diaspora' | 'conditii-minime';

export const FinancingRequirementsAccordion: React.FC<FinancingRequirementsAccordionProps> = ({
  dealer = SEED_DEALER,
  className = '',
  defaultExpanded = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<TabType>('persoane-fizice');

  const phoneFinance = dealer.phoneFinance || '0758 042 979';
  const cleanPhoneFinance = phoneFinance.replace(/\s+/g, '');
  const whatsappFinance = dealer.whatsappFinance || '40758042979';

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isOpen 
        ? 'bg-[#121215] border-amber-500/35 shadow-2xl shadow-amber-500/5' 
        : 'bg-[#121215] hover:bg-[#151518] border-white/10 hover:border-amber-500/30 shadow-lg'
    } ${className}`}>
      {/* 🔘 Header Toggle Buton (Tucked-In / Collapsed by default) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="financing-requirements-content"
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors touch-manipulation group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
            isOpen 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-white/5 border-white/10 text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Condiții de Finanțare & Documente Necesare
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                Aprobare Rapidă
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              Persoane Fizice • Firme (SRL / PFA) • Români în Diaspora & Diurne
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-amber-400 hidden md:inline">
            {isOpen ? 'Ascunde detalii' : 'Vezi cerințele'}
          </span>
          <div className={`p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-300 group-hover:text-white transition-transform duration-300 ${
            isOpen ? 'rotate-180 bg-amber-500/15 border-amber-500/30 text-amber-300' : ''
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* 📂 Conținut Expandabil */}
      {isOpen && (
        <div id="financing-requirements-content" className="border-t border-white/[0.08] p-4 sm:p-6 space-y-6">
          
          {/* Sub-meniu Tab-uri */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('persoane-fizice')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                activeTab === 'persoane-fizice'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Persoane Fizice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('persoane-juridice')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                activeTab === 'persoane-juridice'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Firme & PFA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diaspora')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                activeTab === 'diaspora'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Diaspora & Diurne</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('conditii-minime')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
                activeTab === 'conditii-minime'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Criterii Minime</span>
            </button>
          </div>

          {/* TAB 1: PERSOANE FIZICE */}
          {activeTab === 'persoane-fizice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Documentația Necesară pentru Persoane Fizice:</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Pentru clienții persoane fizice, procesul este 100% simplificat și se realizează fără drumuri la bancă:
                </p>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Carte de Identitate (Buletin)</strong> — în original sau copie foto lizibilă pe WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Cerere de finanțare</strong> — formular standard furnizat și asistat de consilierul nostru.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Fără adeverință de venit</strong> — verificarea se face automat electronic prin baza de date ANAF în <strong>15–30 de minute</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2 text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                    <span><em>Pentru pensionari:</em> Decizie de pensionare sau ultimul cupon de pensie.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Beneficiu Direct Persoane Fizice:
                </div>
                Posibilitate de finanțare cu <strong>0% avans</strong>, rate fixe în LEI sau EUR, aprobare în aceeași zi și pleci direct la volanul mașinii cu numere roșii!
              </div>
            </div>
          )}

          {/* TAB 2: PERSOANE JURIDICE / FIRME (SRL, PFA) */}
          {activeTab === 'persoane-juridice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Documentația Necesară pentru Leasing Auto (Firme & PFA):</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Pentru persoane juridice, dosarul de leasing financiar este optimizat pentru o analiză financiară rapidă:
                </p>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Certificat de Înregistrare (CUI)</strong> emis de Registrul Comerțului.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Copie act de identitate</strong> al reprezentantului legal / administratorului firmei.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Ultimele două bilanțuri anuale depuse</strong> — însoțite de recipise și balanțele aferente lunii decembrie.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Cea mai recentă balanță contabilă lunară</strong> (vechime max. 2 luni) pentru reflectarea situației financiare curente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Cerere de leasing completată</strong> cu datele de contact și opțiunea de avans/perioadă dorită.</span>
                  </li>
                  <li className="flex items-start gap-2 text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                    <span><em>Pentru PFA / Întreprinderi Individuale:</em> Declarația Unică pe anul anterior + Registrul de Încasări și Plăți pe anul în curs.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-zinc-300 leading-relaxed">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5" /> Deducere Fiscală Integrală:
                </div>
                La achiziția prin leasing financiar, firmele beneficiază de <strong>deductibilitate TVA de 21%</strong>, amortizare contabilă și deducerea cheltuielilor de întreținere și combustibil.
              </div>
            </div>
          )}

          {/* TAB 3: DIASPORA & DIURNE */}
          {activeTab === 'diaspora' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Venituri Acceptate din Străinătate & Diurne Externe:</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  La {dealer.name} acceptăm contracte de muncă din Uniunea Europeană și diurne pentru șoferii de transport internațional:
                </p>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-amber-300 mb-1">1. Salariați în Diaspora (UE / UK):</div>
                    <ul className="space-y-1.5 text-zinc-300 list-disc list-inside">
                      <li>Contract de muncă în original + traducere autorizată în limba română;</li>
                      <li>Ultimele 3–6 extrase de cont bancare atestând virarea regulată a salariului;</li>
                      <li>Vechime minimă de 6 luni la actualul angajator;</li>
                      <li>Posibilitate adăugare codebitor cu venituri în România pentru dosare la limită.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-amber-300 mb-1">2. Șoferi Transport Internațional (TIR / Cursă Lungă):</div>
                    <ul className="space-y-1.5 text-zinc-300 list-disc list-inside">
                      <li>Vechime minim 6 luni la compania angajatoare;</li>
                      <li>Adeverință de diurne externe eliberată pe ultimele 6 luni;</li>
                      <li>Extrase de cont bancare pentru justificarea diurnelor încasate.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="font-bold text-amber-300 mb-1">3. Pensii din Străinătate:</div>
                    <p className="text-zinc-300">
                      Decizie de pensionare din țara emitentă + dovada încasării pensiei timp de minim 3 luni consecutive într-o bancă autorizată din România.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONDIȚII MINIME & CRITERII ELIGIBILITATE */}
          {activeTab === 'conditii-minime' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="font-bold text-amber-300 text-xs uppercase tracking-wider">Criterii Generale de Finanțare</div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="text-zinc-400">Sumă Finanțată:</span>
                      <strong className="text-white font-mono">1.000 € – 25.000 € (sau valoare integrală)</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="text-zinc-400">Vechime Minimă:</span>
                      <strong className="text-white font-mono">3 luni la actualul loc de muncă</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="text-zinc-400">Venit Minim Salariu:</span>
                      <strong className="text-white font-mono">1.651 LEI net / lună</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="text-zinc-400">Venit Minim Pensie:</span>
                      <strong className="text-white font-mono">1.281 LEI net / lună</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="text-zinc-400">Vârstă Solicitant:</span>
                      <strong className="text-white font-mono">18 – 75 ani (la finalul creditului)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Grad Maxim Îndatorare:</span>
                      <strong className="text-amber-400 font-mono">Până la 40% din venitul net (BNR)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Venituri Acceptate la Calcul</div>
                  <ul className="space-y-1.5 text-zinc-300 text-[11.5px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Salarii & Sporuri cu caracter permanent;</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Diurne șoferi transport extern (TIR);</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Pensii pentru limită de vârstă sau anticipate;</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Venituri PFA / Profesii Liberale / Drepturi autor;</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Venituri din dividende și chirii înregistrate;</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Indemnizație de creștere copil (maternitate);</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cadre militare și M.A.I. / M.A.P.N. / Navigație.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 📞 Contact Direct Asistență Dosar */}
          <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-500/5 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-2xl">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Ai întrebări despre dosarul tău? Discută direct cu <strong>Mădălina</strong> (Consilier Credite & Leasing).
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href={`tel:${cleanPhoneFinance}`}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all border border-white/15 touch-manipulation active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Sună: {phoneFinance}</span>
              </a>

              <a
                href={`https://wa.me/${whatsappFinance}?text=Bună%20ziua!%20Doresc%20mai%20multe%20detalii%20despre%20actele%20necesare%20și%20condițiile%20de%20finanțare%20la%20${encodeURIComponent(dealer.name)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-md touch-manipulation active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp Dosar</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
