import React from 'react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';
import { Shield, CheckCircle2, Calculator, Truck } from 'lucide-react';

export const WhyChooseUs: React.FC<{ dealer?: DealerProfile }> = ({ dealer = SEED_DEALER }) => {
  const isMpi = dealer.slug === 'mpi_auto';

  return (
    <section id="garantie" className="border-t border-white/[0.08] bg-[#0c0c0e] py-16 px-4 sm:px-8 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
            {isMpi ? 'Beneficii & Garanție Extinsă MPI Auto' : 'Transparență Totală & Garanție Inclusă'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            {isMpi 
              ? 'Fiecare autovehicul din parcul MPI Auto de pe Centura Apahida este verificat tehnic, pregătit de drum și garantat contractual.' 
              : `Fiecare autovehicul din stocul ${dealer.name} este supus unei verificări riguroase înainte de vânzare.`
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Card 1: Garanție */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2.5 tracking-tight leading-snug">
              {isMpi ? 'Garanție MPI Car Protect ' : 'Garanție Scrisă '}
              <span className="text-amber-400 italic">până la 36 Luni</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              {isMpi
                ? 'Oferim garanție de 12 până la 36 de luni (Comfort, Advantage, Plus) pentru motor, cutie și componente esențiale, valabilă în orice service autorizat RAR din România + opțiune de mașină la schimb.'
                : 'Oferim certificat oficial de garanție scrisă de conformitate (12 luni standard inclus în preț, cu opțiune de extindere până la 36 de luni), cu asistență tehnică completă pe întreg teritoriul României.'
              }
            </p>
          </div>

          {/* Card 2: Rate */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2.5 tracking-tight leading-snug">
              Rate Doar cu Buletinul <span className="text-amber-400 italic">{isMpi ? 'fără avans' : 'pe loc'}</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              {isMpi
                ? 'Credit auto online rapid în 15-30 minute doar cu buletinul. Finanțare flexibilă prin Banca Transilvania, TBI Bank și parteneri. Acceptăm persoane cu istoric în Biroul de Credit sau venituri din diaspora.'
                : 'Parteneriate oficiale cu TBI Bank (principal), Banca Transilvania (BT Direct), UniCredit și CreditFix. Dobândă de la 7.9%, avans de la 0% și aprobare pe loc în 2 ore.'
              }
            </p>
          </div>

          {/* Card 3: Livrare Gratuită & Km Certificați */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              {isMpi ? <Truck className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2.5 tracking-tight leading-snug">
              {isMpi ? 'Livrare Gratuită ' : 'Kilometraj Certificat '}
              <span className="text-amber-400 italic">{isMpi ? 'la domiciliu' : 'pe Factură'}</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
              {isMpi
                ? 'Îți aducem mașina pe platformă oriunde în România fără costuri adiționale. Pleci la drum fără griji: beneficiezi de revizie gratuită (ulei + filtre noi) și numere roșii provizorii pe 30 de zile cu asigurare inclusă.'
                : 'Numărul de kilometri este înscris cu valoare juridică pe factura de achiziție și în contract. Verificăm istoricul service în rețeaua oficială a fiecărui producător.'
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
