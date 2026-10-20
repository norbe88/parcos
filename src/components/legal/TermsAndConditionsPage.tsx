import React, { useEffect } from 'react';
import { 
  ShieldCheck, FileText, Lock, Scale, Car, Calculator, 
  Cookie, AlertCircle, ExternalLink, ArrowLeft, CheckCircle2, 
  Phone, Mail, MapPin, Clock, HelpCircle, Shield
} from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';

interface TermsAndConditionsPageProps {
  dealer?: DealerProfile;
  onBackToShowroom: () => void;
  onOpenCookies?: () => void;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({
  dealer = SEED_DEALER,
  onBackToShowroom,
  onOpenCookies
}) => {
  // Asigură scroll la începutul paginii la deschidere
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `Termeni și Condiții & Confidențialitate — ${dealer.name}`;
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
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

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
              <span className="text-zinc-200 font-semibold">Termeni și Condiții & GDPR</span>
            </nav>

            <button
              type="button"
              onClick={onBackToShowroom}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-all shadow-sm touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>← Înapoi la Showroom</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Document Juridic Oficial & Conformitate GDPR</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Termeni și Condiții <span className="text-amber-400">&</span> Politica de Confidențialitate
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            Regulamentul complet de utilizare a platformei digitale oficiale a dealerului auto autorizat{' '}
            <strong className="text-zinc-200">{dealer.name}</strong>, normele de protecție a datelor cu caracter personal (Regulamentul UE 2016/679) și garanția comercială acordată autovehiculelor rulate.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ultima actualizare: <strong>11 octombrie 2026</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Versiunea 1.2 — Conformă GDPR & ANPC</span>
            </span>
            <span>•</span>
            <span className="text-zinc-400">Operator: CUI {dealer.cui}</span>
          </div>

          {/* Jump Pills / Navigare Rapidă prin Secțiuni */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'informatii-generale', label: '1. Informații Generale' },
              { id: 'date-personale', label: '2. Date Personale & GDPR' },
              { id: 'garantie-auto', label: '3. Garanție Autovehicule' },
              { id: 'finantare-rate', label: '4. Finanțare & Rate' },
              { id: 'cookies', label: '5. Politica Cookies' },
              { id: 'drepturi-utilizator', label: '6. Drepturile Dumneavoastră' },
              { id: 'preturi-tva', label: '7. Prețuri, Monedă & Eroare Materială' },
              { id: 'rezervare-garantie', label: '8. Rezervare & Cont de Garanție' },
              { id: 'litigii-anpc', label: '9. ANPC & Litigii (SAL/SOL)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:border-amber-500/30 border border-white/10 text-xs font-medium text-zinc-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 📄 CONTINUT ARTICOL & CLAUZE JURIDICE */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-12">
        
        {/* SECȚIUNEA 1: INFORMAȚII GENERALE & OPERATOR */}
        <section id="informatii-generale" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 01</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Informații generale și identificare operator</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Prezentul document denumit <strong>„Termeni și Condiții & Politica de Confidențialitate”</strong> stabilește regulile aplicabile accesării și utilizării site-ului oficial al dealerului auto, precum și modalitatea prin care datele cu caracter personal ale utilizatorilor sunt colectate, prelucrate și protejate.
            </p>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4.5 my-4 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Date de Identificare ale Operatorului:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-zinc-300 pt-1">
                <li><strong className="text-white">Denumire societate:</strong> {dealer.name}</li>
                <li><strong className="text-white">Cod Unic de Înregistrare (CUI):</strong> {dealer.cui}</li>
                <li><strong className="text-white">Nr. Înreg. Reg. Comerțului:</strong> {dealer.regCom || 'J12/3012/13.07.2023'}</li>
                <li><strong className="text-white">Capital social:</strong> {dealer.shareCapital || '200 RON'}</li>
                <li><strong className="text-white">Sediu social:</strong> {dealer.legalAddress || 'loc. Florești, jud. Cluj'}</li>
                <li><strong className="text-white">Showroom & Parc Auto:</strong> {dealer.showroomAddress || dealer.address}</li>
                <li><strong className="text-white">Departament Vânzări:</strong> {dealer.phonePrimary}</li>
                <li><strong className="text-white">Consultanță Finanțare:</strong> {dealer.phoneFinance || dealer.phoneSecondary}</li>
                <li><strong className="text-white">E-mail oficial DPO / Suport:</strong> {dealer.email}</li>
                <li><strong className="text-white">Program Showroom:</strong> {dealer.openingHours}</li>
              </ul>
            </div>

            <p>
              Respectăm dreptul fundamental la viață privată al fiecărei persoane care accesează showroom-ul nostru online și asigurăm conformitatea deplină cu prevederile <strong>Regulamentului (UE) 2016/679 (GDPR)</strong> privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind libera circulație a acestor date, precum și cu <strong>Legea nr. 190/2018</strong>.
            </p>
            <p>
              Continuarea navigării pe site, interacțiunea cu vehiculele din stoc, calcularea ratelor auto prin simulatoarele puse la dispoziție sau transmiterea unei solicitări prin formulare reprezintă acordul dumneavoastră expres cu privire la termenii și condițiile descrise în acest document.
            </p>
            <p>
              Pentru orice solicitare sau exercitare a drepturilor privind datele dumneavoastră personale, ne puteți contacta direct la adresa de e-mail{' '}
              <a href={`mailto:${dealer.email}?subject=GDPR%20Solicitare%20Date`} className="text-amber-400 hover:underline font-semibold">
                {dealer.email}
              </a>{' '}
              (menționând în subiect „<em>GDPR Solicitare</em>”) sau prin notificare scrisă transmisă la sediul din Cluj-Napoca.
            </p>
          </div>
        </section>

        {/* SECȚIUNEA 2: COLECTAREA ȘI PRELUCRAREA DATELOR CU CARACTER PERSONAL */}
        <section id="date-personale" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Secțiunea 02</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Colectarea și prelucrarea datelor cu caracter personal (GDPR)</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Colectăm exclusiv datele necesare desfășurării activității comerciale auto, soluționării solicitărilor clienților, facilitării dosarelor de finanțare și asigurării unei experiențe transparente de achiziție.
            </p>

            <h3 className="font-bold text-white text-base pt-2">Categorii de date prelucrate prin intermediul platformei:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h4 className="font-semibold text-amber-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Formulare de Contact & Programare Test-Drive
                </h4>
                <ul className="text-xs sm:text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Nume și prenume</li>
                  <li>Număr de telefon mobil (pentru confirmare directă)</li>
                  <li>Adresă de e-mail</li>
                  <li>Autovehiculul de interes din stoc</li>
                  <li>Data și intervalul orar dorit pentru vizionare</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h4 className="font-semibold text-emerald-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Formulare Buy-Back & Import la Comandă
                </h4>
                <ul className="text-xs sm:text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Date de contact (Nume, Telefon, E-mail)</li>
                  <li>Detalii vehicul client (Marcă, model, an, kilometraj, serie șasiu)</li>
                  <li>Preț estimativ sau buget alocat</li>
                  <li>Criterii căutare mașină la comandă din Europa</li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-white text-base pt-2">Scopurile prelucrării datelor:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
              <li>Preluarea, procesarea și soluționarea cererilor de ofertă, rezervare sau vizionare auto;</li>
              <li>Programarea și organizarea sesiunilor de test-drive la locația din Cluj-Napoca;</li>
              <li>Întocmirea documentației precontractuale și a dosarului de vânzare-cumpărare sau intermediere;</li>
              <li>Transmiterea datelor strict necesare către partenerii de finanțare aleși de client ({dealer.financingPartners.join(', ')});</li>
              <li>Comunicări operaționale punctuale legate de stadiul comenzii sau disponibilitatea mașinii dorite.</li>
            </ul>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300">Important privind securitatea și confidențialitatea:</strong> Nu vindem, nu închiriem și nu înstrăinăm datele dumneavoastră cu caracter personal către companii de publicitate terțe. Datele sunt păstrate în mediu securizat, criptat, cu acces restricționat exclusiv personalului autorizat.
            </div>

            <p className="text-xs text-zinc-400 pt-1">
              <strong>Protecția minorilor:</strong> Serviciile showroom-ului se adresează exclusiv persoanelor cu vârsta de peste 18 ani, având capacitate deplină de exercițiu pentru încheierea tranzacțiilor auto. Nu colectăm cu bună știință date ale minorilor.
            </p>
          </div>
        </section>

        {/* SECȚIUNEA 3: GARANȚIE AUTOVEHICULE ȘI STARE TEHNICĂ */}
        <section id="garantie-auto" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 03</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Garanția comercială a autovehiculelor și starea tehnică</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Toate autoturismele rulate comercializate din stocul propriu <strong className="text-white">{dealer.name}</strong> sunt verificate tehnic temeinic înainte de afișare și predare către client.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <div className="text-2xl font-black text-amber-400 font-mono mb-1">12 – 36 LUNI</div>
                <div className="text-xs font-semibold text-white">Garanție Comercială Scrisă</div>
                <p className="text-[11px] text-zinc-400 mt-1">Garanție tehnică și de conformitate (12L standard + opțiune extindere până la 36L).</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <div className="text-2xl font-black text-emerald-400 font-mono mb-1">100% CERTIFICAT</div>
                <div className="text-xs font-semibold text-white">Kilometraj Certificat Juridic</div>
                <p className="text-[11px] text-zinc-400 mt-1">Înscris oficial pe factura fiscală și contractul de vânzare-cumpărare.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <div className="text-2xl font-black text-sky-400 font-mono mb-1">RAPORT ISTORIC</div>
                <div className="text-xs font-semibold text-white">Verificare carVertical / Test</div>
                <p className="text-[11px] text-zinc-400 mt-1">Istoric curat de daune majore și transparență tehnică completă.</p>
              </div>
            </div>

            <h3 className="font-bold text-white text-base">Condițiile acordării garanției:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
              <li>Garanția se acordă în baza Certificatului de Garanție emis la data achiziției și este valabilă pentru o perioadă standard de 12 luni (cu posibilitate de extindere până la 24 sau 36 de luni), respectiv în limita kilometrilor specificați în contract;</li>
              <li>Acoperirea tehnică și componentele asigurate sunt specificate în mod detaliat în certificatul de garanție eliberat la predare și contractul de vânzare-cumpărare;</li>
              <li>Consumabilele supuse uzurii normale (plăcuțe și discuri de frână, anvelope, filtre, lichide de lucru, bucșe) nu fac obiectul garanției pentru ansamblu mecanic;</li>
              <li>Pentru autovehiculele intermediate sau aflate în regim de consignație (dacă există), statutul garanției este menționat în mod expres și transparent în descrierea vehiculului.</li>
            </ul>

            <p>
              <strong>Livrare la domiciliu:</strong> Asigurăm transport dedicat pe platformă auto în orice județ din România, cu predare personală și asistență completă la întocmirea dosarului de înmatriculare și eliberarea numerelor provizorii (roșii).
            </p>
          </div>
        </section>

        {/* SECȚIUNEA 4: FINANȚARE ȘI RATE AUTO */}
        <section id="finantare-rate" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Secțiunea 04</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Finanțare, simulator de rate și leasing auto</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              {dealer.name} colaborează cu instituții bancare și financiare de top din România pentru a oferi soluții flexibile de cumpărare în rate sau leasing:
            </p>

            <div className="flex flex-wrap gap-2.5 my-2">
              {dealer.financingPartners.map((partner, index) => (
                <div key={index} className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{partner}</span>
                </div>
              ))}
            </div>

            <h3 className="font-bold text-white text-base pt-2">Condiții generale și simulator de rate:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
              <li><strong>Simulatorul de rate afișat pe site are caracter orientativ și ilustrativ:</strong> Calculele prezentate sunt calculate pe baza unei rate indicative de dobândă (de ex. 8.5% anual) și a unei perioade de rambursare selectate;</li>
              <li><strong>Aprobarea efectivă a creditului:</strong> Condițiile financiare finale (dobândă, valoare rată lunară, DAE, comisioane) sunt stabilite exclusiv de finanțator în funcție de profilul financiar și scoringul individual al clientului;</li>
              <li><strong>Eligibilitate:</strong> Finanțarea poate fi accesată fără avans (0% avans), pe o durată cuprinsă între 6 și 60 de luni, atât de către persoane fizice (salariați, pensionari, persoane cu venituri din străinătate) cât și de persoane juridice (SRL, PFA, II);</li>
              <li>Compania noastră oferă consultanță gratuită și asistență la întocmirea dosarului, fără a percepe comisioane de intermediere de la client.</li>
            </ul>
          </div>
        </section>

        {/* SECȚIUNEA 5: POLITICA DE COOKIES */}
        <section id="cookies" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 05</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Politica privind modulele cookie și tehnologiile web</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Platforma utilizează module cookie tehnice și de performanță pentru a asigura o navigare rapidă, sigură și adaptată preferințelor dumneavoastră pe dispozitive mobile și desktop.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-white text-sm block mb-1">1. Cookie-uri strict necesare (tehnice)</strong>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Esențiale pentru rularea corectă a interfeței Dark Luxury, salvarea stării filtrelor din catalogul de mașini (marcă, preț, transmisie), memorarea vizualizării animației de intro și securizarea sesiunilor. Aceste cookie-uri nu pot fi dezactivate fără a afecta funcționarea site-ului.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-white text-sm block mb-1">2. Tehnologii de analiză și conținut multimedia integrat</strong>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Pot fi utilizate pentru a monitoriza timpul de încărcare, performanța Core Web Vitals și afișarea conținutului multimedia găzduit (de exemplu videoclipuri scurte de prezentare sau hărți interactive de localizare showroom).
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Puteți configura în orice moment preferințele privind cookie-urile prin setările browserului dumneavoastră (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge), având opțiunea de a bloca sau șterge modulele salvate.
            </p>

            {onOpenCookies && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenCookies}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-95"
                >
                  <Cookie className="w-4 h-4" />
                  <span>Consultă Politica Dedicată de Cookie-uri & Inventar Tehnologii →</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECȚIUNEA 6: DREPTURILE UTILIZATORILOR (GDPR) */}
        <section id="drepturi-utilizator" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Secțiunea 06</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Drepturile dumneavoastră conform Regulamentului GDPR</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              În calitate de persoană vizată, conform Regulamentului (UE) 2016/679, beneficiați de un set extins de drepturi pe care le puteți exercita în mod gratuit în relația cu {dealer.name}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">1. Dreptul de acces (art. 15)</strong>
                <p className="text-xs text-zinc-400 mt-1">Puteți solicita confirmarea dacă datele dumneavoastră sunt sau nu prelucrate de către noi și o copie a acestora.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">2. Dreptul la rectificare (art. 16)</strong>
                <p className="text-xs text-zinc-400 mt-1">Puteți cere corectarea datelor inexacte sau completarea celor incomplete.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">3. Dreptul la ștergere („dreptul de a fi uitat”, art. 17)</strong>
                <p className="text-xs text-zinc-400 mt-1">Puteți obține ștergerea datelor atunci când acestea nu mai sunt necesare pentru scopul inițial sau vă retrageți acordul.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">4. Dreptul la restricționarea prelucrării (art. 18)</strong>
                <p className="text-xs text-zinc-400 mt-1">Puteți limita prelucrarea în situațiile în care contestați exactitatea datelor sau legalitatea prelucrării.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">5. Dreptul la portabilitatea datelor (art. 20)</strong>
                <p className="text-xs text-zinc-400 mt-1">Puteți primi datele furnizate într-un format structurat, utilizat în mod curent și lizibil automat.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <strong className="text-amber-300 text-sm block">6. Dreptul la opoziție (art. 21)</strong>
                <p className="text-xs text-zinc-400 mt-1">Aveți dreptul de a vă opune în orice moment prelucrării datelor dumneavoastră în scopuri comerciale sau de marketing.</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <strong className="text-white text-sm block">Cum exercitați aceste drepturi?</strong>
                <span className="text-xs text-zinc-400">Trimiteți un e-mail către responsabilul nostru cu protecția datelor la:</span>
                <span className="text-xs font-mono text-amber-300 block mt-0.5">{dealer.email}</span>
              </div>
              <a
                href={`mailto:${dealer.email}?subject=GDPR%20Exercitare%20Drepturi`}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all whitespace-nowrap"
              >
                Transmite Solicitare GDPR
              </a>
            </div>

            <p className="text-xs text-zinc-400 pt-2">
              Dacă apreciați că drepturile dumneavoastră nu au fost respectate, aveți dreptul de a depune o plângere la autoritatea națională de supraveghere: <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (A.N.S.P.D.C.P.)</strong>, cu sediul în B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București, website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">www.dataprotection.ro</a>.
            </p>
          </div>
        </section>

        {/* SECȚIUNEA 7: PREȚURI, MONEDĂ ȘI CLAUZĂ DE EROARE MATERIALĂ */}
        <section id="preturi-tva" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Secțiunea 07</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Prețuri, monedă, curs de schimb și clauza de eroare materială</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Prețurile autovehiculelor din oferta <strong>{dealer.name}</strong> afișate pe platforma online sunt exprimate de regulă în <strong>Euro (€)</strong>, în concordanță cu uzanțele pieței auto europene.
            </p>

            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>
                <strong>Moneda și cursul de facturare:</strong> Plata se realizează prin virament bancar securizat. Conform reglementărilor monetare din România, facturarea către cumpărători rezidenți se face în RON (Lei) la cursul de referință al Băncii Naționale a României (BNR) din data emiterii facturii / contractului sau la cursul băncii agreat în mod expres în documentație.
              </li>
              <li>
                <strong>Regimul fiscal al TVA (Strict 21% sau Regimul Marjei):</strong>
                <ul className="list-circle list-inside pl-5 mt-1 space-y-1 text-xs sm:text-sm text-zinc-400">
                  <li><strong className="text-zinc-200">Vehicule cu TVA deductibil (21%):</strong> Pentru autoturismele achiziționate de la persoane juridice sau companii europene de leasing partenere, cota de TVA este de 21% și este evidențiată distinct pe factura fiscală conform Codului Fiscal.</li>
                  <li><strong className="text-zinc-200">Regimul special al marjei de profit:</strong> Pentru autovehiculele second-hand preluate de la persoane fizice sau entități neimpozabile, vânzarea se efectuează conform <em>art. 312 din Legea nr. 227/2015 privind Codul Fiscal</em> (TVA inclus în marjă, nedeductibil).</li>
                </ul>
              </li>
              <li>
                <strong>Simulatoare de credit / rate auto (O.U.G. nr. 50/2010):</strong> Ratele lunare estimate afișate în calculatoarele de pe site au caracter strict orientativ și ilustrativ, fără a constitui o ofertă contractuală fermă de finanțare. Aprobarea dosarului, DAE și condițiile efective de creditare depind exclusiv de analiza de risc a băncilor partenere ({dealer.financingPartners.join(', ')}).
              </li>
            </ul>

            {/* Clauză Expresă de Eroare Materială (Protecție ANPC / Comerț Electronic) */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4.5 my-3 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Clauză de exonerare pentru erori materiale în anunțuri (Legea 365/2002):</span>
              </div>
              <p>
                Descrierile tehnice, fotografiile, nivelul de echipare, lista de dotări opționale și kilometrajul afișate pe acest site au <strong>caracter strict informativ și de prezentare</strong>. Deși depunem eforturi continue pentru a asigura exactitatea fiecărei informații, pot interveni erori materiale neintenționate de redactare umană sau inadvertențe generate de sistemele automatizate de decodare a seriei de șasiu (VIN). Nicio descriere de pe acest site nu constituie o ofertă fermă și angajantă juridic. Oferta contractuală fermă, verificarea fizică a dotărilor reale și starea tehnică a fiecărui vehicul se validează exclusiv la sediul showroom-ului din Cluj-Napoca prin semnarea contractului formal de vânzare-cumpărare.
              </p>
            </div>
          </div>
        </section>

        {/* SECȚIUNEA 8: CONDIȚII DE REZERVARE ȘI CONTUL DE GARANȚIE */}
        <section id="rezervare-garantie" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Secțiunea 08</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Condiții de rezervare a autovehiculelor și Contul de Garanție</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Pentru a bloca un autovehicul disponibil în stocul fizic sau pentru inițierea procedurii de achiziție la comandă dintr-un parc european partener, potențialul cumpărător poate solicita emiterea unei <strong>Convenții de Rezervare</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h4 className="font-semibold text-emerald-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Depunerea în Contul de Garanție
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Blocarea autovehiculului se efectuează în baza unei <strong>Garanții de Rezervare</strong> virate prin transfer bancar direct în <strong>Contul de Garanție</strong> al societății <strong className="text-white">{dealer.name}</strong>. Valoarea garanției este menționată în mod transparent pe convenția scrisă (uzual între 300 € și 1.000 €, echivalent RON la curs BNR).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h4 className="font-semibold text-amber-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Perioada de Retragere din Promovare
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Autovehiculul este retras de la vizionări concurente pe durata convenită (standard 3 – 7 zile lucrătoare), timp în care clientul beneficiază de prioritate absolută pentru inspecție mecanică în service autorizat, test de drum sau perfectarea dosarului de finanțare.
                </p>
              </div>
            </div>

            <h3 className="font-bold text-white text-base pt-1">Regimul de restituire și deducere a Garanției de Rezervare:</h3>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>
                <strong>Finalizarea tranzacției:</strong> În momentul semnării contractului de vânzare-cumpărare, suma consemnată în Contul de Garanție se deduce integral și automat din prețul total de vânzare al autovehiculului.
              </li>
              <li>
                <strong>Restituire integrală pentru neconformități tehnice:</strong> Dacă în urma testării în service autorizat sau a inspecției fizice se identifică defecțiuni majore de siguranță, kilometraj neconform sau daune structurale majore care nu au fost aduse la cunoștința clientului înainte de rezervare, Garanția de Rezervare se restituie <strong>integral (100%)</strong> cumpărătorului în termen de maximum 2 (două) zile lucrătoare, fără nicio reținere sau penalitate.
              </li>
              <li>
                <strong>Renunțare nejustificată a clientului:</strong> În ipoteza în care autovehiculul corespunde în totalitate descrierii tehnice și raportului agreat, iar clientul renunță unilateral la cumpărare din motive exclusiv personale după expirarea perioadei de rezervare, societatea poate reține garanția pentru acoperirea costurilor de imobilizare a stocului și a cheltuielilor logistice ocazionate, conform termenilor convenției semnate.
              </li>
            </ul>
          </div>
        </section>

        {/* SECȚIUNEA 9: PROTECȚIA CONSUMATORULUI & SOLUȚIONAREA LITIGIILOR (ANPC / SAL / SOL) */}
        <section id="litigii-anpc" className="scroll-mt-24 rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">Secțiunea 09</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Protecția consumatorului și soluționarea alternativă a litigiilor (ANPC / SAL / SOL)</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-zinc-300">
            <p>
              Respectăm în totalitate prevederile <em>O.G. nr. 21/1992</em> privind protecția consumatorilor și <em>O.U.G. nr. 34/2014</em>. În cazul în care întâmpinați orice neclaritate sau nemulțumire, vă invităm să ne contactați direct pentru rezolvarea amiabilă și promptă a situației.
            </p>

            <p>
              Conform legislației naționale și europene, aveți dreptul de a apela la mecanismele de soluționare alternativă a litigiilor (SAL) sau la platforma europeană de soluționare online a litigiilor (SOL):
            </p>

            {/* Carduri Interactive Legături ANPC, SAL & SOL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
              
              {/* Card 1: ANPC Oficial */}
              <a
                href="https://anpc.ro/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Autoritate Națională</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">A.N.P.C.</h4>
                  <p className="text-xs text-zinc-400 mt-1">Autoritatea Națională pentru Protecția Consumatorilor</p>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono">Telefonul Consumatorului: 021 9551</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <span>Accesează anpc.ro</span>
                  <span>→</span>
                </div>
              </a>

              {/* Card 2: ANPC SAL */}
              <a
                href="https://anpc.ro/ce-este-sal/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Procedură Alternativă</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">ANPC — S.A.L.</h4>
                  <p className="text-xs text-zinc-400 mt-1">Soluționarea Alternativă a Litigiilor între consumatori și comercianți</p>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono">Direcția SAL — anpc.ro/ce-este-sal/</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Informații Procedură SAL</span>
                  <span>→</span>
                </div>
              </a>

              {/* Card 3: SOL Comisia Europeană */}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Uniunea Europeană</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-sky-300 transition-colors">S.O.L. / O.D.R.</h4>
                  <p className="text-xs text-zinc-400 mt-1">Platforma oficială de Soluționare Online a Litigiilor a Comisiei Europene</p>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono">ec.europa.eu/consumers/odr</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-semibold text-sky-400 flex items-center gap-1">
                  <span>Accesează Portalul SOL</span>
                  <span>→</span>
                </div>
              </a>

            </div>
          </div>
        </section>

        {/* CARD CONTACT DIRECT & REZOLVARE PROMPTĂ */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-emerald-500/10 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Ai întrebări despre termeni sau date personale?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Suntem aici să te ajutăm cu răspunsuri clare și transparente.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Echipa <strong className="text-white">{dealer.name}</strong> îți stă la dispoziție atât telefonic, cât și direct la showroom-ul nostru din Cluj-Napoca.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 touch-manipulation"
            >
              <Phone className="w-4 h-4" />
              <span>Sună: {dealer.phonePrimary}</span>
            </a>
            <button
              type="button"
              onClick={onBackToShowroom}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-all touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Înapoi în Showroom</span>
            </button>
          </div>
        </div>

      </main>

    </div>
  );
};
