import React, { useMemo } from 'react';
import { 
  MapPin, Shield, Truck, FileText, Gift, Calculator, 
  ArrowRight, Phone, MessageCircle, CheckCircle2, Sparkles, Car, ChevronRight
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { resolveDealerContact, calculateRate as defaultCalcRate, formatMileage, normalizeCarImageUrl } from '../../utils/helpers';

interface MpiRetailHeroProps {
  tenant: DealerProfile;
  landingConfig?: DealerLandingConfig;
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem) => void;
  isRevealed?: boolean;
}

export const MpiRetailHero: React.FC<MpiRetailHeroProps> = ({
  tenant,
  landingConfig,
  cars,
  onSelectCar,
  isRevealed = true,
}) => {
  const contact = resolveDealerContact(tenant);
  const salesPhone = tenant.phonePrimary || '0759 757 858';
  const financeWa = contact.financeWhatsApp || contact.salesWhatsApp || '40749691302';

  // Statistici rapide pentru selectorul de buget
  const stats = useMemo(() => {
    const total = cars.length;
    const under10k = cars.filter(c => c.priceEur <= 10000).length;
    const between10kAnd15k = cars.filter(c => c.priceEur > 10000 && c.priceEur <= 15000).length;
    const suvCount = cars.filter(c => c.bodyType === 'SUV' || c.drivetrain === '4x4 / AWD').length;
    const autoCount = cars.filter(c => c.transmission === 'Automată').length;
    return { total, under10k, between10kAnd15k, suvCount, autoCount };
  }, [cars]);

  // Top 3 oferte reprezentative din stocul real MPI (Duster, Hyundai, Seat/Audi)
  const spotlightDeals = useMemo(() => {
    if (!cars || cars.length === 0) return [];
    const pinned = cars.filter(c => c.isDealOfWeek || c.isPinnedToTop);
    const pool = pinned.length >= 3 ? pinned : [...pinned, ...cars.filter(c => !c.isDealOfWeek && !c.isPinnedToTop)];
    return pool.slice(0, 3);
  }, [cars]);

  const scrollToCatalog = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById('stoc');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-8 border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#09090b] transition-colors duration-300">
      {/* Glow ambiental discret */}
      <div 
        className={`absolute top-0 right-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-1000 ${
          isRevealed ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
        }`} 
      />

      <div className="max-w-7xl mx-auto">
        {/* 1. Header Badges: Locație & Trust */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Centura Apahida • Cluj-Napoca • Deschis 7/7</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Livrare Gratuită la Domiciliu în Toată România</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{stats.total} Autoturisme Verificate pe Stoc</span>
          </span>
        </div>

        {/* 2. Titlu Comercial & Subtitlu */}
        <div className="max-w-4xl mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-4">
            Parc Auto Rulate Cluj • <br className="hidden sm:inline" />
            <span className="text-[var(--color-accent)] underline decoration-[var(--color-accent)]/30 decoration-wavy">
              Rate Doar cu Buletinul
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
            Peste {stats.total} de mașini verificate mecanic pe Centura Apahida. Aprobare credit online în 30 de minute (avans de la 0%), revizie gratuită ulei + filtre la predare și garanție contractuală extinsă până la 36 de luni.
          </p>
        </div>

        {/* 3. Selector Rapid de Căutare după Buget (Quick Finder) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Găsește Rapid Mașina în Bugetul Tău:</span>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            <a
              href="#stoc"
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <Car className="w-3.5 h-3.5 text-blue-500" />
              <span>Toate Mașinile ({stats.total})</span>
            </a>

            <a
              href="#stoc"
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>💶 Sub 10.000 € ({stats.under10k})</span>
            </a>

            <a
              href="#stoc"
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>💎 10.000 € – 15.000 € ({stats.between10kAnd15k})</span>
            </a>

            <a
              href="#stoc"
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>🚙 SUV & 4x4 ({stats.suvCount})</span>
            </a>

            <a
              href="#stoc"
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>⚙️ Cutie Automată ({stats.autoCount})</span>
            </a>

            <a
              href={`https://wa.me/${financeWa}?text=${encodeURIComponent('Bună ziua! Aș dori simulare pentru rate de la 150 EUR/lună doar cu buletinul din parcul MPI Auto.')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-all shadow-xs flex items-center gap-1.5 ml-auto"
            >
              <span>📋 Rate de la 120 €/lună →</span>
            </a>
          </div>
        </div>

        {/* 4. Butoane Primare de Acțiune (WhatsApp & Explorează Stocul) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
          <a
            href="#stoc"
            onClick={scrollToCatalog}
            className="px-8 py-4 rounded-2xl font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 text-center text-sm sm:text-base flex items-center justify-center gap-2 group"
          >
            <span>Explorează Stocul ({stats.total} Autoturisme)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href={`https://wa.me/${financeWa}?text=${encodeURIComponent('Bună ziua! Aș dori informații despre aprobarea unui credit doar cu buletinul pentru mașinile MPI Auto.')}`}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-4 rounded-2xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 transition-all text-center text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>Consultant Finanțare pe WhatsApp</span>
          </a>

          <a
            href={`tel:${salesPhone.replace(/\s+/g, '')}`}
            className="px-6 py-4 rounded-2xl font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-all text-center text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-blue-500" />
            <span>Vânzări: {salesPhone}</span>
          </a>
        </div>

        {/* 5. Banda de Încredere cu cele 6 Atuuri MPI Auto (Centura Apahida) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
              <Car className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">80+ Mașini pe Stoc</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Disponibile fizic în Cluj</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Doar cu Buletinul</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Avans 0%, aprobare 30 min</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
              <Truck className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Livrare Gratuită</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">La domiciliu în toată țara</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
              <Gift className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Revizie Cadou</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Ulei + filtre noi la predare</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Garanție 12–36 Luni</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Fără limită de kilometri</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Numere Roșii 30 Zile</div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Dosar complet pe loc</p>
          </div>
        </div>

        {/* 6. Mini-Showcase cu 3 Oferte Reale din Stocul MPI */}
        {spotlightDeals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Oferte Recomandate din Showroom MPI Auto
                </h2>
              </div>
              <a
                href="#stoc"
                onClick={scrollToCatalog}
                className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1"
              >
                <span>Vezi tot stocul ({stats.total})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotlightDeals.map((car) => {
                const estRate = defaultCalcRate(car.priceEur, 0.15, 60);
                return (
                  <div
                    key={car.id}
                    onClick={() => onSelectCar(car)}
                    className="group cursor-pointer rounded-2xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] hover:border-[var(--color-accent)]/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/10] bg-zinc-800 overflow-hidden">
                      {car.images && car.images[0] ? (
                        <img
                          src={normalizeCarImageUrl(car.images[0])}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <Car className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                          {car.dealBadgeText || 'Ofertă Specială MPI'}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/20">
                          {car.year} • {formatMileage(car.mileageKm)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                          {car.brand} {car.model}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {car.versionTrim || `${car.fuelType} • ${car.transmission}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-end justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                            Preț Showroom
                          </div>
                          <div className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
                            {car.priceEur.toLocaleString('ro-RO')} €
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                            Rată Estimată
                          </div>
                          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">
                            de la ~{estRate} €/lună
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
