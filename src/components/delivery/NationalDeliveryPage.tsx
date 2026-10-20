import React, { useState, useEffect } from 'react';
import { 
  Truck, ShieldCheck, Video, FileCheck, CreditCard, 
  MapPin, Clock, ArrowLeft, ArrowRight, CheckCircle2, 
  Phone, MessageCircle, ChevronDown, ChevronUp, AlertCircle, 
  HelpCircle, Car, Sparkles, Star
} from 'lucide-react';
import { DealerProfile, VehicleItem } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';
import { formatMileage } from '../../utils/helpers';

interface NationalDeliveryPageProps {
  dealer?: DealerProfile;
  cars?: VehicleItem[];
  onBackToShowroom: () => void;
  onSelectCar?: (car: VehicleItem) => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

const DELIVERY_FAQS: FaqItem[] = [
  {
    question: "Livrati mașina chiar până la domiciliul meu?",
    answer: "Da. Livrăm în absolut orice localitate din România — de la marile orașe (București, Timișoara, Iași, Brașov, Constanța, Craiova) până la sate și comune. Autovehiculul este transportat pe platformă auto specializată, asigurată complet CMR, sau prin șofer propriu delegat."
  },
  {
    question: "Pot cumpăra mașina fără să mă deplasez deloc la Cluj-Napoca?",
    answer: "Categoric da! Peste 40% dintre clienții noștri cumpără la distanță. Vă trimitem pe WhatsApp o video-prezentare detaliată (pornire motor la rece, compartiment motor, caroserie, interior, eventuale urme de uzură fără filtre ascunse), raportul istoric de kilometraj carVertical/autoDNA și toate documentele autoturismului."
  },
  {
    question: "Ce se întâmplă dacă mașina nu este conformă cu prezentarea video?",
    answer: "La sosirea platformei, inspectați mașina împreună cu conducătorul auto. În situația rară în care autovehiculul nu corespunde prezentării video transmise sau prezintă defecte nedeclarate, aveți dreptul de a refuza preluarea, iar suma achitată ca rezervare vă este returnată integral."
  },
  {
    question: "Garanția comercială de până la 36 de luni este valabilă și în orașul meu?",
    answer: "Da. Garanția comercială scrisă emisă de RXM AUTO MOBILE (12 luni standard inclus, cu posibilitate de extindere până la 36 de luni) este valabilă pe întreg teritoriul României și poate fi accesată în orice service auto autorizat R.A.R. din județul dumneavoastră, fără a fi nevoie să reveniți la Cluj-Napoca, conform certificatului de garanție eliberat la predare."
  },
  {
    question: "Pot obține finanțare în rate sau leasing de la distanță?",
    answer: "Da. Întreaga procedură de finanțare se desfășoară online prin partenerii noștri autorizați (TBI Bank, Banca Transilvania / BT Direct, UniCredit Consumer Financing, CreditFix). Dosarul se aprobă în aproximativ 15–30 de minute doar cu buletinul, iar contractul se semnează electronic la distanță."
  },
  {
    question: "Cât durează livrarea și cum procedez cu numerele de înmatriculare?",
    answer: "Livrarea se efectuează în termen de 24 până la 72 de ore de la perfectarea actelor, în funcție de distanța față de Cluj-Napoca. Odată cu mașina, primiți dosarul complet pentru înmatriculare definitivă și, dacă este necesar, numere provizorii (roșii) valabile cu RCA activ, astfel încât să puteți circula imediat."
  }
];

interface DestinationCity {
  city: string;
  distanceKm: number;
  timeframe: string;
  region: string;
}

const DESTINATION_CITIES: DestinationCity[] = [
  { city: "București & Ilfov", distanceKm: 450, timeframe: "24 – 48 ore", region: "Muntenia" },
  { city: "Timișoara & Arad", distanceKm: 310, timeframe: "24 – 36 ore", region: "Banat" },
  { city: "Brașov & Sibiu", distanceKm: 270, timeframe: "24 – 36 ore", region: "Transilvania / Centru" },
  { city: "Oradea & Bihor", distanceKm: 155, timeframe: "12 – 24 ore", region: "Crișana" },
  { city: "Iași & Bacău", distanceKm: 390, timeframe: "24 – 48 ore", region: "Moldova" },
  { city: "Constanța & Dobrogea", distanceKm: 680, timeframe: "48 – 72 ore", region: "Dobrogea" },
  { city: "Craiova & Oltenia", distanceKm: 390, timeframe: "24 – 48 ore", region: "Oltenia" },
  { city: "Suceava & Neamț", distanceKm: 320, timeframe: "24 – 48 ore", region: "Bucovina / Moldova" }
];

export const NationalDeliveryPage: React.FC<NationalDeliveryPageProps> = ({
  dealer = SEED_DEALER,
  cars = [],
  onBackToShowroom,
  onSelectCar
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `Livrăm în toată România — Mașini Rulate la Cheie | ${dealer.name}`;
    return () => {
      document.title = `${dealer.name} — Dealer Automobile Rulate Cluj-Napoca`;
    };
  }, [dealer.name]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  };

  const availableCars = cars.filter(c => c.status === 'in_stock').slice(0, 4);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 🌟 HERO SECTION: Dark Luxury cu acoperire națională */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#121215] via-[#0c0c0e] to-[#09090b] py-12 sm:py-20 px-4 sm:px-8">
        <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          
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
              <span className="text-zinc-200 font-semibold">Livrare în toată România</span>
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-5">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Acoperire Națională • Transport pe Platformă Asigurată CMR</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 uppercase leading-[1.08]">
            Livrăm mașina <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">la cheie</span><br />
            în toată România
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl leading-relaxed mb-8">
            Nu trebuie să bați drumul până la Cluj-Napoca. Alegi mașina online, primești o{' '}
            <strong className="text-white">video-prezentare reală fără filtre pe WhatsApp</strong>, raportul de kilometraj verificat, iar noi ți-o aducem direct acasă — cu acte complete și{' '}
            <strong className="text-amber-300">garanție scrisă de până la 36 luni valabilă național</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <a
              href={`https://wa.me/${dealer.whatsappNumber}?text=Bună%20ziua!%20Sunt%20interesat%20de%20serviciul%20de%20livrare%20pe%20platformă%20în%20toată%20țara.%20Aș%20dori%20mai%20multe%20detalii.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 border border-emerald-500/30 touch-manipulation cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Solicită Video & Livrare pe WhatsApp</span>
            </a>

            <a
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-white/15 touch-manipulation cursor-pointer"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Sună: {dealer.phonePrimary}</span>
            </a>

            <button
              type="button"
              onClick={onBackToShowroom}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm transition-all border border-white/10 cursor-pointer"
            >
              <span>Vezi Stocul Disponibil</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transport Asigurat CMR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garanție până la 36 Luni</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Livrare în 24–72 Ore</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Retur dacă nu corespunde</span>
            </div>
          </div>

        </div>
      </section>

      {/* 🧭 SECȚIUNEA 1: CEI 6 PAȘI AI CUMPĂRĂRII LA DISTANȚĂ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 border-b border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">Procedură 100% Transparentă</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-2">
            Cum funcționează cumpărarea la distanță
          </h2>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Un proces simplu și sigur, utilizat săptămânal de zeci de cumpărători din întreaga țară.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pas 1 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  PASUL 01
                </span>
                <Car className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Alegi mașina din stoc</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Explorezi catalogul online actualizat zilnic, filtrezi după marcă, buget, cutie de viteze și analizezi fișa completă cu fotografii HD de detaliu.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <span>Catalog verificat în timp real</span>
            </div>
          </div>

          {/* Pas 2 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  PASUL 02
                </span>
                <Video className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Primești video-prezentare reală</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Filmăm mașina dedicat pentru tine: pornire la rece, sunet motor, caroserie, interior, anvelope și eventualele mici urme de uzură, fără filtre comerciale.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <span>Transmis pe WhatsApp în câteva minute</span>
            </div>
          </div>

          {/* Pas 3 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  PASUL 03
                </span>
                <FileCheck className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verifici istoricul & actele</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Îți punem la dispoziție seria de șasiu (VIN), raportul complet carVertical sau autoDNA, cartea service și documentele de proveniență înainte de orice plată.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <span>Kilometraj certificat garantat juridic</span>
            </div>
          </div>

          {/* Pas 4 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  PASUL 04
                </span>
                <ShieldCheck className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rezervi online în siguranță</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Blochezi mașina cu o sumă modică de rezervare, dedusă din prețul final. Dacă la livrare mașina diferă de prezentare, suma se returnează 100%.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <span>Zero risc financiar pentru cumpărător</span>
            </div>
          </div>

          {/* Pas 5 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  PASUL 05
                </span>
                <CreditCard className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Finanțare la distanță sau transfer</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Aprobăm dosarul de rate sau leasing online în doar 2 ore prin TBI Bank, BT Direct sau UniCredit. Alternativ, poți achita prin transfer bancar securizat.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <span>Posibilitate 0% avans, doar cu buletinul</span>
            </div>
          </div>

          {/* Pas 6 */}
          <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  PASUL 06
                </span>
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Livrare la poarta ta</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Platforma ajunge la adresa ta în 24–72h. Verifici mașina la predare, semnezi procesul-verbal și primești cheile, contractul și dosarul de înmatriculare.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span>Pleci direct la drum în siguranță</span>
            </div>
          </div>

        </div>
      </section>

      {/* 🛡️ SECȚIUNEA 2: CELE 3 GARANȚII LA CUMPĂRAREA DE LA DISTANȚĂ */}
      <section className="bg-[#0b0b0e] py-14 sm:py-20 border-b border-white/[0.08] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest">Protecție Totală</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-2">
              De ce cumperi în deplină siguranță
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Video-Prezentare Fără Secrete</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Nu ascundem nimic după unghiuri de catalog. Dacă mașina are o mică ciupitură pe capotă sau o uzură normală pe scaun, o punem în prim-plan la filmare. Ceea ce vezi pe ecran este exact ceea ce coboară de pe platformă.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Garanție Valabilă Național</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Garanția noastră comercială scrisă de până la 36 de luni (12 luni inclus standard) nu te obligă să aduci mașina înapoi la Cluj. În eventualitatea unei probleme tehnice acoperite conform certificatului de garanție, poți interveni la orice service autorizat R.A.R. din proximitatea ta.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121215] border border-white/[0.08] relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Garanția Returnării la Livrare</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Nu cumperi „cu ochii închiși”. La descărcare ai dreptul de a inspecta amănunțit autoturismul. Dacă mașina nu corespunde 1:1 descrierii și video-ului primit, nu o accepți și îți restituim suma de rezervare fără discuții.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 🗺️ SECȚIUNEA 3: TABEL ORAȘE & TERMENE DE LIVRARE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 border-b border-white/[0.08]">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">Rute Frecvente din Cluj-Napoca</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
              Termene orientative de livrare
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Livrăm cu platforme proprii și transportatori autorizați CMR în toate județele țării.
            </p>
          </div>
          <a
            href={`https://wa.me/${dealer.whatsappNumber}?text=Bună%20ziua!%20Aș%20dori%20să%20știu%20cât%20costă%20livrarea%20în%20localitatea...`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Întreabă de orașul tău pe WhatsApp</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DESTINATION_CITIES.map((dest, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#0e0e11] border border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2 font-mono">
                  <span>{dest.region}</span>
                  <span>~{dest.distanceKm} km</span>
                </div>
                <h4 className="text-base font-bold text-white">{dest.city}</h4>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-400">Termen estimat:</span>
                <span className="font-bold text-amber-400 font-mono">{dest.timeframe}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3 text-xs text-zinc-400">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Nu găsești orașul tău?</strong> Transportul se efectuează în orice sat, comună sau municipiu din România. Contactează-ne direct pentru calculul precis al kilometrilor și al termenului de sosire.
          </span>
        </div>
      </section>

      {/* 🚗 SECȚIUNEA 4: MAȘINI DISPONIBILE IMEDIAT PENTRU LIVRARE */}
      {availableCars.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest">Pregătite de Drum</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Disponibile acum pentru livrare
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToShowroom}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <span>Vezi toate cele {cars.length} mașini</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {availableCars.map((car) => (
              <div 
                key={car.id}
                onClick={() => onSelectCar ? onSelectCar(car) : onBackToShowroom()}
                className="group rounded-2xl bg-[#0e0e11] border border-white/[0.08] hover:border-amber-500/40 transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[16/10] bg-zinc-900 overflow-hidden">
                  <img 
                    src={car.images[0] || '/rxm/images/rxm-emblem.png'} 
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 border border-white/10">
                    {car.year} • {formatMileage(car.mileageKm)}
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-black text-[10px] font-black uppercase tracking-wider">
                    Garanție
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{car.versionTrim || car.bodyType}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-base font-black text-amber-400 font-mono">
                      {car.priceEur.toLocaleString('ro-RO')} €
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-amber-300 flex items-center gap-1">
                      <span>Detalii</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <button
              type="button"
              onClick={onBackToShowroom}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-400"
            >
              Vezi toate cele {cars.length} mașini din stoc
            </button>
          </div>
        </section>
      )}

      {/* ❓ SECȚIUNEA 5: FAQ ACORDEON ÎNTREBĂRI FRECVENTE */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 border-b border-white/[0.08]">
        <div className="text-center mb-10">
          <span className="text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">Răspunsuri Clare</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
            Întrebări frecvente despre livrare
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Tot ce vrei să știi înainte de a comanda un autovehicul la distanță.
          </p>
        </div>

        <div className="space-y-3">
          {DELIVERY_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                className="rounded-2xl bg-[#0e0e11] border border-white/[0.08] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-white text-sm sm:text-base">{faq.question}</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-0 text-sm text-zinc-300 leading-relaxed border-t border-white/[0.04]">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 💬 SECȚIUNEA 6: BANNER CONTACT RAPID WHATSAPP & TELEFON */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#18181b] to-emerald-500/15 border border-amber-500/30 p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Gata de drum în 24 de ore</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
              Ai găsit mașina dorită în showroom?
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed">
              Scrie-ne acum pe WhatsApp sau sună-ne direct. Îți trimitem filmarea completă a mașinii și stabilim detaliile pentru aducerea ei pe platformă la tine acasă.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href={`https://wa.me/${dealer.whatsappNumber}?text=Bună%20ziua!%20Doresc%20să%20comand%20o%20mașină%20cu%20livrare%20pe%20platformă.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5A] active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#25D366]/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Scrie-ne pe WhatsApp</span>
            </a>

            <a
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-sm border border-white/15 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{dealer.phonePrimary}</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
