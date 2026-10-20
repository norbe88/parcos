import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Zap,
  Users,
  Shield,
  Send,
  Lock,
  UserCheck,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Car,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Clock,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface ShowroomMailGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddAgent?: () => void;
  dealershipName?: string;
}

type GuideTab = 'overview' | 'agents' | 'collision' | 'offers' | 'reassign' | 'routine';

export const ShowroomMailGuideModal: React.FC<ShowroomMailGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAddAgent,
  dealershipName = 'RXM Automobile'
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f4f4f5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antet Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Ghid Operațional — ParcOS Mail Hub & Rutare Showroom
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  PMH-301 — PMH-304
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manual de utilizare pentru consilieri de vânzări și manageri ({dealershipName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Închide ghidul"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab-uri de Navigare Rapidă */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-black/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: '1. Rutare & Pool', icon: Zap },
            { id: 'agents', label: '2. Consilieri & +Agent', icon: Users },
            { id: 'collision', label: '3. Prevenire Coliziuni', icon: Lock },
            { id: 'offers', label: '4. Panou Vehicul & TVA 21%', icon: Car },
            { id: 'reassign', label: '5. Reatribuire & Plecare', icon: UserCheck },
            { id: 'routine', label: '6. Rutină Zilnică (1-6)', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as GuideTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Corpul Ghidului (Scrollabil) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* TAB 1: RUTARE & POOL */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                  <Zap className="w-4 h-4" />
                  <span>Concepte de Bază: Cum Funcționează Rutarea în Showroom</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  ParcOS Mail Hub rezolvă două probleme critice din parcurile auto:{' '}
                  <strong className="text-white">Speed-to-Lead (Viteza de Reacție)</strong> și{' '}
                  <strong className="text-white">Prevenirea Coliziunilor</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-[#18181b] border border-white/05 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Speed-to-Lead (Regula de Aur)</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Primul minut în care un client cere detalii despre un autoturism determină peste 70% din șansele
                    de finalizare a vânzării. Toate solicitările noi sosesc în{' '}
                    <strong className="text-amber-400">🔥 Pool Showroom</strong> și sunt vizibile întregii echipe.
                  </p>
                  <div className="text-[11px] bg-black/40 border-l-2 border-amber-400 p-2 text-zinc-400 rounded-r">
                    Consilierul care vede primul lead-ul apasă butonul auriu <strong>„⚡ Preia Leadul”</strong> și devine titular exclusiv.
                  </div>
                </div>

                <div className="bg-[#18181b] border border-white/05 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Folderul „Preluat de Mine”</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    După ce ai apăsat „Preia Leadul”, conversația dispare din Pool-ul general și se mută în folderul tău
                    personal <strong className="text-emerald-400">📥 Preluat de Mine</strong>.
                  </p>
                  <div className="text-[11px] bg-black/40 border-l-2 border-emerald-400 p-2 text-zinc-400 rounded-r">
                    Acolo găsești istoricul tuturor discuțiilor tale active, fără să fii deranjat de alte solicitări.
                  </div>
                </div>
              </div>

              {/* Diagramă Flux Simplu */}
              <div className="bg-white/[0.02] border border-white/08 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Fluxul unui Mesaj de la Client la Vânzare
                </h4>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="w-full sm:w-1/4 bg-[#18181b] border border-white/10 rounded-lg p-2.5 text-center">
                    <span className="text-zinc-400 block text-[10px] uppercase">Pasul 1</span>
                    <strong className="text-white">E-mail / Formular</strong>
                    <span className="block text-[11px] text-zinc-500">Intră în sistem</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />
                  <div className="w-full sm:w-1/4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-center">
                    <span className="text-amber-400 block text-[10px] uppercase font-bold">Pasul 2</span>
                    <strong className="text-amber-300">🔥 Pool Showroom</strong>
                    <span className="block text-[11px] text-zinc-400">Vizibil tuturor</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />
                  <div className="w-full sm:w-1/4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-center">
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">Pasul 3</span>
                    <strong className="text-emerald-300">⚡ 1-Click Claim</strong>
                    <span className="block text-[11px] text-zinc-400">Blocat pe agent</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />
                  <div className="w-full sm:w-1/4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 text-center">
                    <span className="text-blue-400 block text-[10px] uppercase font-bold">Pasul 4</span>
                    <strong className="text-blue-300">Ofertă & Rezervare</strong>
                    <span className="block text-[11px] text-zinc-400">TVA 21% / Marjă</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSILIERI & +AGENT */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/08 rounded-xl p-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Cum se Adaugă Agenți Showroom Noi</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Fiecare membru al echipei are un profil dedicat cu rol și permisiuni specifice conform responsabilităților sale.
                  </p>
                </div>

                {onOpenAddAgent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddAgent();
                    }}
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Adaugă Agent Acum</span>
                  </button>
                )}
              </div>

              {/* Tabel Roluri */}
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-[#18181b] p-2.5 border-b border-white/10 font-bold text-xs text-zinc-300">
                  Tabelul Rolurilor & Permisiunilor în Parc
                </div>
                <div className="divide-y divide-white/05 bg-[#121215]">
                  {[
                    {
                      role: 'ADMIN',
                      title: 'Director Parc / Administrator',
                      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      desc: 'Acces total: adaugă/șterge consilieri, poate reatribui orice lead și emite documente de garanție.'
                    },
                    {
                      role: 'SALES',
                      title: 'Consilier Vânzări (Closer)',
                      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      desc: 'Preia apeluri, compune oferte de preț, trimite e-mailuri și programează test-drive-uri.'
                    },
                    {
                      role: 'FINANCE',
                      title: 'Consilier Credite & Leasing',
                      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                      desc: 'Întocmește dosare de finanțare TBI Bank / BT Direct, calculează rate lunare cu TVA deductibil 21%.'
                    },
                    {
                      role: 'MECHANIC',
                      title: 'Inspecție Tehnică & Service',
                      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                      desc: 'Atașează fișele de verificare 100+ puncte, grosime vopsea și rapoarte diagnoză OBD-II.'
                    },
                    {
                      role: 'SUPPORT',
                      title: 'Relații Clienți & Triere',
                      badge: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
                      desc: 'Preluare solicitări generale, triere preliminară și rutare către colegul potrivit.'
                    }
                  ].map((r) => (
                    <div key={r.role} className="p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${r.badge}`}>
                          {r.role}
                        </span>
                        <div>
                          <strong className="text-white text-xs block">{r.title}</strong>
                          <span className="text-[11px] text-zinc-400">{r.desc}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pași de adăugare */}
              <div className="bg-[#18181b] border border-white/05 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                  Cum Adaugi un Coleg Nou în 3 Pași:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                  <li>
                    Apasă butonul <strong className="text-amber-400">+ Agent</strong> din coloana 1 (stânga, lângă „Consilieri Înregistrați”).
                  </li>
                  <li>
                    Completează <strong className="text-white">Numele și Prenumele</strong>,{' '}
                    <strong className="text-white">Adresa de e-mail showroom</strong> și selectează rolul corespunzător.
                  </li>
                  <li>
                    Apasă <strong className="text-amber-400">„Salvează Agentul”</strong>. Colegul apare instant în selectorul din stânga sus și în lista de reasignare!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: PREVENIRE COLIZIUNI */}
          {activeTab === 'collision' && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-1">
                  <Lock className="w-4 h-4" />
                  <span>Sistemul Anti-Coliziune: Sfârșitul Apelurilor Paralele</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Cea mai mare greșeală într-un parc auto este când doi consilieri sună același client în aceeași zi,
                  oferind eventual prețuri sau reduceri diferite. ParcOS Mail Hub blochează matematic această eroare.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-[#18181b] border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      Perspectiva Ta (Când ai preluat tu)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      TU
                    </span>
                  </div>
                  <div className="bg-black/50 border border-emerald-500/20 rounded-lg p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-white font-semibold">✅ Preluat de tine</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Ai acces total la compunerea ofertelor, atașarea de vehicule din stoc și trimiterea de mesaje directe pe e-mail sau WhatsApp.
                  </p>
                </div>

                <div className="bg-[#18181b] border border-amber-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Perspectiva Colegilor (Blocat)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                      BLOCAT
                    </span>
                  </div>
                  <div className="bg-black/50 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300 font-semibold">🔒 Preluat de: [Nume Consilier] (SALES)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Colegii văd exact cine se ocupă de client și nu pot trimite oferte paralele. Dacă titularul lipsește,
                    un administrator poate reatribui manual firul.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PANOU VEHICUL & TVA 21% */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                  <Car className="w-4 h-4" />
                  <span>Panoul Contextual Vehicul (Slide-Over Drawer Dreapta)</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Când deschizi un fir de discuție legat de un autoturism, apasă butonul{' '}
                  <strong className="text-white">„Panou Vehicul”</strong> din colțul dreapta-sus.
                </p>
              </div>

              <div className="bg-[#18181b] border border-white/05 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                  Invariante Fiscale & Comerciale Respectate Automat:
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/05">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Regim Fiscal Dual (TVA Deductibil vs. Marjă):</strong>
                      <span className="text-zinc-400">
                        Sistemul calculează automat: dacă mașina are TVA deductibil, aplică strict{' '}
                        <strong className="text-emerald-400">VAT_RATE = 0.21 (21% TVA)</strong>. Dacă este vândută în regim de
                        marjă (Art. 312 Cod Fiscal — specific auto rulate), menționează că TVA-ul este inclus în preț și nu se deduce.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/05">
                    <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Garanție de Rezervare (Banca Transilvania):</strong>
                      <span className="text-zinc-400">
                        Terminologie strictă:{' '}
                        <strong className="text-white">„Garanție de Rezervare”</strong> sau{' '}
                        <strong className="text-white">„Cont de Garanție”</strong>. Include contul IBAN oficial al parcului de
                        la Banca Transilvania pentru blocarea mașinii timp de 5 zile lucrătoare (avans standard 500 € / 1.000 €).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/05">
                    <Send className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Generator Ofertă 1-Click (VehicleOfferComposer):</strong>
                      <span className="text-zinc-400">
                        Apasă pe „Compune Ofertă”. Se precompletează automat datele clientului, galeria foto și link-ul securizat
                        din showroom. O transmiți clientului printr-un singur click prin infrastructura AWS SES.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REATRIBUIRE & PLECARE AGENT */}
          {activeTab === 'reassign' && (
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                  <UserCheck className="w-4 h-4" />
                  <span>Transfer de Lead-uri, Concedii & Plecare Consilier</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Fluxurile dinamice de lucru când un coleg este ocupat, intră în concediu de odihnă sau părăsește echipa de vânzări.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#18181b] border border-white/05 rounded-xl p-4">
                  <h4 className="font-bold text-white text-xs mb-1.5 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cazul 1: Clientul solicită Finanțare / Leasing (Transfer de dosar)</span>
                  </h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Dacă un client solicită calcul de rate, simulare de credit sau dosar de leasing:
                  </p>
                  <div className="mt-2 bg-black/40 border border-white/05 rounded-lg p-2.5 text-xs text-zinc-300">
                    Deschizi conversația ➔ în colțul dreapta-sus, la selectorul <strong className="text-white">„Reatribuie Consilier”</strong>,
                    alegi consilierul responsabil de <strong className="text-amber-400">Finanțare & Leasing (FINANCE)</strong>. Conversația se transferă instant în căsuța dedicată!
                  </div>
                </div>

                <div className="bg-[#18181b] border border-white/05 rounded-xl p-4">
                  <h4 className="font-bold text-white text-xs mb-1.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cazul 2: Ieșire din Tură sau Concediu de Odihnă</span>
                  </h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Înainte de a pleca din showroom, consilierul poate reatribui lead-urile nefinalizate înapoi în{' '}
                    <strong className="text-amber-400">⚡ Pool Showroom</strong> sau direct către colegul care îi ține locul pe tură.
                  </p>
                </div>

                <div className="bg-[#18181b] border border-red-500/20 rounded-xl p-4">
                  <h4 className="font-bold text-red-300 text-xs mb-1.5 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Cazul 3: Plecarea Definitivă a unui Consilier din Firmă</span>
                  </h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Administratorul apasă pe pictograma de coș de gunoi din dreptul consilierului. Sistemul solicită confirmarea
                    și <strong className="text-white">reasignează automat toate lead-urile active către Directorul de Parc (ADMIN)</strong>,
                    garantând că niciun client nu rămâne fără răspuns!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RUTINĂ ZILNICĂ */}
          {activeTab === 'routine' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Checklist Zilnic pentru Consilieri (Rutina de Showroom)</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Urmează acești 6 pași în fiecare dimineață când deschizi laptopul sau tableta în curte:
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    step: 'Pasul 1',
                    title: 'Selectează Identitatea Ta',
                    desc: 'În stânga sus, la „Agent Showroom”, selectează profilul tău de consilier. Ofertele și semnăturile vor purta datele tale oficiale.'
                  },
                  {
                    step: 'Pasul 2',
                    title: 'Verifică Folderul „Pool Showroom”',
                    desc: 'Urmărește badge-ul auriu pulsant. Dacă sunt lead-uri noi de peste noapte, deschide-le imediat.'
                  },
                  {
                    step: 'Pasul 3',
                    title: '1-Click Claim („⚡ Preia Leadul”)',
                    desc: 'Apasă butonul auriu pe fiecare mesaj pe care îl preiei. Colegii vor vedea că ești pe el și nu vor suna peste tine.'
                  },
                  {
                    step: 'Pasul 4',
                    title: 'Verifică Mașina în Panoul Lateral',
                    desc: 'Apasă „Panou Vehicul”. Verifică dacă mașina e în stoc, kilometrii, prețul net și dacă are TVA deductibil sau marjă.'
                  },
                  {
                    step: 'Pasul 5',
                    title: 'Trimite Oferta de Preț',
                    desc: 'Apasă „Compune Ofertă”. Selectează opțiunea de garanție de rezervare (500 € la BT) și trimite e-mailul clientului.'
                  },
                  {
                    step: 'Pasul 6',
                    title: 'Actualizează Stadiul Lead-ului',
                    desc: 'Marchează mesajul ca „Ofertă Trimisă” sau „Rezervat”. Când clientul plătește, se emite proforma din Acte PDF.'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#18181b] border border-white/05 rounded-xl p-3 flex items-start gap-3 hover:border-amber-500/20 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">{item.title}</div>
                      <p className="text-zinc-400 text-xs mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Taste & Comenzi Rapide */}
              <div className="bg-white/[0.02] border border-white/08 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Comenzi & Unelte Rapide:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="bg-black/30 p-2 rounded border border-white/05 flex items-center justify-between">
                    <span>Reîmprospătare Inbox:</span>
                    <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[11px] font-mono text-amber-400">Click 🔄</kbd>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-white/05 flex items-center justify-between">
                    <span>Căutare după VIN sau Model:</span>
                    <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[11px] font-mono text-amber-400">Bara de Căutare</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subsol Modal */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>{dealershipName} • ParcOS Mail Hub v2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all cursor-pointer"
          >
            Am înțeles, închide ghidul
          </button>
        </div>
      </div>
    </div>
  );
};
