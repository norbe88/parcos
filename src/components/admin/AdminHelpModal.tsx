import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, FileText, Camera, Share2, Gavel, QrCode, 
  Users, DollarSign, CheckCircle2, Building2, Sparkles, ShieldCheck, 
  MessageSquare, Radio, BarChart3, Clock, AlertTriangle, ChevronRight,
  ExternalLink, Info, Mail, Zap, Lock, BookOpen, UserCheck, Car
} from 'lucide-react';
import { SEED_DEALER, DealerProfile } from '../../db/seed';

interface AdminHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealer?: DealerProfile;
  initialCategory?: HelpCategory;
}

type HelpCategory = 'all' | 'documents' | 'scanner' | 'feeds' | 'crm' | 'stock_actions' | 'financing' | 'mail_hub';

export const AdminHelpModal: React.FC<AdminHelpModalProps> = ({
  isOpen,
  onClose,
  dealer = SEED_DEALER,
  initialCategory = 'all'
}) => {
  const [activeCategory, setActiveCategory] = useState<HelpCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const HELP_SECTIONS = [
    {
      id: 'documents',
      category: 'documents' as HelpCategory,
      title: '1. Emitere Acte de Vânzare & Facturare (Butonul „Acte PDF”)',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      badge: 'Vânzări & Contabilitate',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Generează instant pe format oficial A4 toate documentele juridice și fiscale necesare predării mașinii:',
      items: [
        {
          name: 'Factură Proformă & Fiscală',
          desc: 'Permite comutarea între Avans Rezervare (implicit 500 €) sau Preț Integral. Se poate comuta între Regimul Marjei (Art. 312) sau TVA 21% Deductibil.',
          tip: 'Implicit este selectat Regimul Marjei, conform practicii standard pentru autoturisme rulate (TVA nu se evidențiază separat pe factură).'
        },
        {
          name: 'Certificat de Garanție (1 An / 10.000 KM)',
          desc: 'Certificat oficial conform Legii 449/2003 și O.U.G. 140/2021. Include clauza cheie care obligă cumpărătorul să efectueze revizia în maxim 7 zile lucrătoare la service RAR.',
          tip: 'Protejează dealerul împotriva daunelor cauzate de exploatare neconformă sau lipsă de întreținere.'
        },
        {
          name: 'Proces-Verbal de Predare-Primire Autovehicul',
          desc: 'Anexă juridică unde se consemnează numărul de chei (1 sau 2), kilometrajul atestat, nivelul de combustibil și accesoriile fizice (trusă, roată de rezervă, CIV original).',
          tip: 'Accesoriile debifate apar marcate cu [  ] (Lipsă) pentru protecție juridică totală la predare.'
        },
        {
          name: 'Notă de Calcul Marjă (Art. 312 Cod Fiscal)',
          desc: 'Document intern justificativ pentru contabilitate. Calculează automat Marja Brută (Preț Vânzare - Preț Achiziție), Baza Impozabilă și TVA colectat la buget (21%).',
          tip: 'Preia automat prețul negociat la vânzare (soldPriceEur).'
        },
        {
          name: 'Fișă Inspecție Tehnică Showroom (100+ Puncte)',
          desc: 'Raport tehnic complet: Diagnoză OBD-II, grosime strat vopsea (în micrometri µm), uzură plăcuțe de frână și adâncime profil anvelope.',
          tip: 'Poate fi partajată direct pe WhatsApp către clienții indeciși pentru a genera încredere masivă.'
        }
      ]
    },
    {
      id: 'scanner',
      category: 'scanner' as HelpCategory,
      title: '2. Scanare Automată AI cu Camera (Scanner Buletine & CIV)',
      icon: <Camera className="w-5 h-5 text-amber-400" />,
      badge: 'Zero Tastare Manuală',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Elimină tastarea manuală a datelor clienților și a specificațiilor mașinilor noi:',
      items: [
        {
          name: 'Scanner Buletine Clienți (OCR AI)',
          desc: 'Din fereastra de Acte Vânzare, apeși pe camera foto sau încarci poza buletinului clientului. Inteligența artificială extrage instant: Nume, CNP, Serie/Nr. CI, Adresă, Județ și Oraș.',
          tip: 'Include algoritmul matematic oficial de validare a cheii CNP-ului românesc. Conform GDPR: poza este procesată în memorie volatilă și NU este stocată pe disc/server.'
        },
        {
          name: 'Adăugare Mașină Nouă (Scanare CIV)',
          desc: 'Din butonul galben „+ Adaugă Mașină Nouă”, scanezi Cartea de Identitate a Vehiculului (CIV) cu telefonul. Se extrag automat: Marcă, Model, VIN, An, Motorizare (cm³ / CP), Combustibil și Serie CIV.',
          tip: 'Poți adăuga mașina chiar și fără poze în statusul „În Pregătire” pentru a-i printa fișa de parbriz înainte de detailing.'
        }
      ]
    },
    {
      id: 'feeds',
      category: 'feeds' as HelpCategory,
      title: '3. Distribuție Automată Multi-Platformă (Meta, OLX, AutoLicit)',
      icon: <Share2 className="w-5 h-5 text-blue-400" />,
      badge: 'Marketing & Vânzări Pilot Automat',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Sincronizează întregul stoc al showroom-ului pe canalele mari de vânzare:',
      items: [
        {
          name: 'Meta Catalog CSV (Facebook Marketplace & Instagram)',
          desc: 'Generează un fișier pe 23 de coloane conform standardului Meta Automotive. Permite rularea de reclame dinamice către utilizatorii care caută mașini similare în județul tău.',
          tip: 'Copiază link-ul public în Meta Commerce Manager la secțiunea Scheduled Fetch (la fiecare 6 sau 12 ore) pentru sincronizare automată fără efort.'
        },
        {
          name: 'Autovit / OLX XML Feed',
          desc: 'Format XML compatibil cu importul în bloc pentru conturile de dealer PRO de pe Autovit.ro și OLX.ro. Conține dotările tehnice, cota de 21% TVA și link-urile către fotografiile HD.',
          tip: 'Lipește link-ul feed-ului în contul tău de dealer OLX/Autovit pentru ca stocul să se actualizeze singur.'
        },
        {
          name: 'Pod Sindicare AutoLicit.ro (⚡ AutoLicit)',
          desc: 'Permite trimiterea mașinii în marketplace-ul central AutoLicit.ro cu 2 moduri: 1. Anunț Simplu la Preț Fix (fără comision) sau 2. Licitație Live No Reserve (-20% cu soft-close).',
          tip: 'Clienții de pe AutoLicit te contactează direct pe WhatsApp sau virează avansul de 500 € în Contul de Garanție (Banca Transilvania).'
        }
      ]
    },
    {
      id: 'crm',
      category: 'crm' as HelpCategory,
      title: '4. Conducta CRM Showroom (Tab-ul „Lead-uri & CRM”)',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      badge: 'Gestionare Clienți & Vânzări',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Urmărește fiecare cumpărător de la primul mesaj pe WhatsApp până la livrarea cheilor:',
      items: [
        {
          name: 'Cele 5 Stadii ale Conductei',
          desc: '1. Contact Nou ➔ 2. Test-Drive Programat ➔ 3. Dosar Finanțare Trimis ➔ 4. Proformă Avans Emisă ➔ 5. Vândut & Livrat.',
          tip: 'Fiecare card afișează poza mașinii din stoc, prețul agreat și sursa lead-ului (WhatsApp, Olx, Showroom Web).'
        },
        {
          name: 'Sincronizare Automată de Stoc la Rezervare',
          desc: 'Când muți un lead în stadiul „Proformă Avans Emisă”, panoul îți propune să marchezi mașina ca „Rezervat” în stoc dintr-un singur click.',
          tip: 'Când muți la „Vândut & Livrat”, mașina este marcată ca vândută și scoasă automat din catalogul public.'
        },
        {
          name: 'Butoane Rapide pe Cardul de Lead',
          desc: 'Fiecare client are butoane de 1-Click: „Acte” (deschide proforma gata precompletată cu datele clientului) și „WhatsApp” (deschide chat-ul cu mesaj personalizat).',
          tip: 'Nu mai cauți numărul în agendă sau mașina în stoc — totul este legat bidirecțional.'
        }
      ]
    },
    {
      id: 'stock_actions',
      category: 'stock_actions' as HelpCategory,
      title: '5. Butoanele de Acțiune pe Fiecare Mașină din Inventar',
      icon: <Building2 className="w-5 h-5 text-emerald-400" />,
      badge: 'Unelte Operative Showroom',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Ghidul rapid pentru cele două rânduri de butoane de pe cardul fiecărei mașini:',
      items: [
        {
          name: '👁️ Detalii (Buton Galben Mare)',
          desc: 'Deschide fișa completă a vehiculului: specificații motor, transmisie, VIN, galerie foto, istoric de daune carVertical și simulator de rate.',
          tip: 'Poți edita orice specificație sau adăuga dotări opționale.'
        },
        {
          name: '📄 Acte PDF (Cyan)',
          desc: 'Lansează generatorul oficial de documente pentru această mașină (Proformă, Garanție, Proces-Verbal, Notă de Marjă).',
          tip: 'Dacă mașina are deja cumpărător asociat, preia automat prețul de vânzare negociat.'
        },
        {
          name: '💬 WA (Verde WhatsApp)',
          desc: 'Generează instant un mesaj WhatsApp către client cu titlul mașinii, prețul în euro, kilometrii atestați și link-ul direct către showroom.',
          tip: 'Deschide WhatsApp Web pe calculator sau aplicația WhatsApp pe telefonul de vânzări.'
        },
        {
          name: '📊 Preț (Comparator Piață)',
          desc: 'Deschide căutarea 1-click pe OLX România, Autovit.ro și Mobile.de pentru a vedea cu cât se vând modele identice în piață.',
          tip: 'Îți arată dacă mașina este listată sub sau peste media pieței.'
        },
        {
          name: '📷 Foto & Studio Branding',
          desc: 'Permite reordonarea pozelor prin drag & drop, rotirea, ștergerea imaginilor neclare și aplicarea automată a plăcuțelor personalizate cu sigla dealerului.',
          tip: 'Pozele cu plăcuțe personalizate cresc încrederea și opresc furtul de poze pe alte site-uri.'
        },
        {
          name: '💰 Profit & Cheltuieli',
          desc: 'Registru dedicat de cheltuieli pentru fiecare mașină: cost achiziție, transport platformă, taxe RAR, reparații mecanică, detailing și calcul profit net.',
          tip: 'Vizibil doar pentru administratori; clienții publici nu văd aceste date.'
        },
        {
          name: '🪟 Parbriz (Fișă A4 QR Code)',
          desc: 'Generează și tipărește fișa elegantă A4 pentru parbrizul mașinii parcate în curte (Portrait sau Landscape).',
          tip: 'Conține un QR Code mare — clienții îl scanează cu telefonul duminica și văd toate dotările și opțiunile de finanțare.'
        },
        {
          name: '🕒 Audit (Jurnal Evenimente)',
          desc: 'Înregistrează fiecare modificare făcută pe mașină: când a intrat în stoc, când s-a schimbat prețul, ce discount s-a oferit și cine a modificat.',
          tip: 'Asigură transparență totală în echipa de vânzări.'
        }
      ]
    },
    {
      id: 'financing',
      category: 'financing' as HelpCategory,
      title: '6. Finanțare, Curs Valutar & Termene Parc',
      icon: <DollarSign className="w-5 h-5 text-amber-400" />,
      badge: 'Credite & Conformitate',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Instrumente de calcul financiar și monitorizare a documentelor parcului:',
      items: [
        {
          name: 'Curs BT & Creditori (Tab Finanțare)',
          desc: 'Afișează cursul oficial BNR / Banca Transilvania utilizat pentru calcularea prețurilor în LEI și configurarea partenerilor de credit (TBI Bank, BT Direct, Mogo).',
          tip: 'Calculează automat ratele lunare pe 12-60 de luni cu sau fără avans.'
        },
        {
          name: 'Widget Numere Roșii & Termene Parc',
          desc: 'Monitorizează scadența autorizațiilor provizorii (30/60/90 zile), programările la RAR și valabilitatea ITP-ului.',
          tip: 'Alertează cu roșu dacă o mașină are numerele roșii care expiră în mai puțin de 5 zile.'
        }
      ]
    },
    {
      id: 'mail_hub',
      category: 'mail_hub' as HelpCategory,
      title: '7. ParcOS Mail Hub & Showroom Pool (Ghid Operativ Consilieri)',
      icon: <Mail className="w-5 h-5 text-amber-400" />,
      badge: 'Speed-to-Lead & Anti-Coliziune',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Ghidul complet pentru gestionarea solicitărilor clienților, preluarea rapidă a lead-urilor și colaborarea consilierilor din showroom:',
      items: [
        {
          name: '1. Speed-to-Lead Pool & Preluare 1-Click („⚡ Preia Leadul”)',
          desc: 'Toate cererile sosesc în folderul „🔥 Pool Showroom”. Primul minut determină 70% din șansele de închidere. Consilierul deschide discuția și apasă „⚡ Preia Leadul” pentru a deveni titular.',
          tip: 'Conversația se mută automat în folderul personal „📥 Preluat de Mine”, iar butonul devine „✅ Preluat de tine”.'
        },
        {
          name: '2. Prevenire Coliziuni în Echipă („🔒 Preluat de: [Agent]”)',
          desc: 'Dacă un coleg a preluat deja un lead, butonul de acțiune se blochează automat pentru toți ceilalți colegi din showroom, afișând titularul (ex: „🔒 Preluat de: [Nume Consilier] (SALES)”).',
          tip: 'Elimină complet situația jenantă în care mai mulți consilieri contactează același client în paralel.'
        },
        {
          name: '3. Adăugare Consilieri Noi (Butonul „+ Agent” din Coloana 1)',
          desc: 'Apasă butonul „+ Agent” din coloana din stânga a Mail Hub-ului. Completează numele complet, e-mailul showroom și selectează rolul (SALES, ADMIN, FINANCE, MECHANIC, SUPPORT). Noul coleg apare instant în consolă.',
          tip: 'Permite configurarea tuturor consilierilor din parcul auto, cu roluri dedicate și adrese profesionale de e-mail.'
        },
        {
          name: '4. Reatribuire Lead-uri & Plecare Consilier din Firmă',
          desc: 'Din dropdown-ul „Reatribuie Consilier” din firul de discuție, poți trimite clientul instant către departamentul de finanțare/leasing sau înapoi în Pool Showroom.',
          tip: 'La ștergerea unui agent din sistem (coș de gunoi), toate conversațiile sale active sunt transferate automat la Directorul de Parc (ADMIN).'
        },
        {
          name: '5. Panou Contextual Vehicul & Ofertare cu Strict 21% TVA / Marjă',
          desc: 'Sertarul lateral din dreapta oferă acces la galeria foto a mașinii, kilometri atestați, serie VIN, preț net și defalcare automată cu strict 21% TVA deductibil sau regim de marjă (Art. 312).',
          tip: 'Include direct Acordul de Garanție de Rezervare (500 € / 1.000 € în contul oficial IBAN de la Banca Transilvania).'
        }
      ]
    }
  ];

  const filteredSections = HELP_SECTIONS.filter(section => {
    const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.items.some(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Centru de Asistență & Ghid Operațional Showroom
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Dealer OS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Explicarea fiecărui buton, flux comercial și instrument din panoul {dealer.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Închide ghidul de asistență"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bară de Căutare & Filtre Rapide */}
        <div className="p-3 sm:p-4 border-b border-white/[0.06] bg-black/40 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Caută o funcție sau un buton (ex: proformă, buletin, OLX, garanție, rate)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Toate' },
              { id: 'mail_hub', label: 'ParcOS Mail & Pool' },
              { id: 'documents', label: 'Acte PDF' },
              { id: 'scanner', label: 'Scanner AI' },
              { id: 'feeds', label: 'Feed-uri & OLX' },
              { id: 'crm', label: 'CRM Leads' },
              { id: 'stock_actions', label: 'Butoane Mașină' },
              { id: 'financing', label: 'Finanțare' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as HelpCategory)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conținut Ghid (Scrollabil) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="font-semibold">Nu am găsit nicio secțiune pentru termenul căutat.</p>
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-2 text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Resetează filtrele
              </button>
            </div>
          ) : (
            filteredSections.map((section) => (
              <div 
                key={section.id} 
                className="bg-white/[0.02] border border-white/08 rounded-xl p-4 sm:p-5 hover:border-white/15 transition-all space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2.5">
                    {section.icon}
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {section.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${section.badgeColor}`}>
                    {section.badge}
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  {section.description}
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {section.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#18181b]/70 border border-white/[0.05] rounded-xl p-3 space-y-1 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <p className="text-zinc-300 text-xs pl-5 leading-snug">
                        {item.desc}
                      </p>
                      {item.tip && (
                        <div className="mt-1.5 ml-5 text-[11px] bg-amber-500/10 border-l-2 border-amber-400 px-2 py-1 text-zinc-300 rounded-r font-medium">
                          <strong className="text-amber-400 font-semibold">Sfat practic: </strong>
                          {item.tip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Card Suport Tehnic Dedicat */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Asistență Tehnică & Dezvoltare Dedicată — Carvana S.R.L.</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pentru întrebări sau adăugarea de noi șabloane de documente, contactează direct inginerul de suport.
              </p>
            </div>

            <a
              href="https://wa.me/40758511040?text=Buna%20ziua,%20am%20o%20intrebare%20despre%20panoul%20de%20gestiune%20Dealer%20OS."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Suport (0758 511 040)</span>
            </a>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>{dealer.name} • Dealer OS Suite v2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all cursor-pointer"
          >
            Am înțeles, închide
          </button>
        </div>
      </div>
    </div>
  );
};
