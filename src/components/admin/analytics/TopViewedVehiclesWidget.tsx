import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, 
  Tag, Users, CheckCircle2, RefreshCw, BarChart2, Flame, Award
} from 'lucide-react';
import { VehicleItem, DealerLeadItem } from '../../../db/types';
import { getStockNumber, getVehicleAgingInfo, normalizeCarImageUrl } from '../../../utils/helpers';
import { fetchTopViewedVehicles, TopViewedCarItem } from '../../../services/telemetryService';
import { useTenant } from '../../../hooks/useTenant';

export type TopViewedTimeframe = 'today' | '7d' | '30d' | 'month' | 'year' | 'all';

interface TopViewedVehiclesWidgetProps {
  cars: VehicleItem[];
  dealerSlug?: string;
  activeTimeframe?: string;
  onSelectCar?: (car: VehicleItem) => void;
  onOpenDealModal?: (car: VehicleItem) => void;
  realLeads?: DealerLeadItem[];
  realInteractions?: Array<{ carId?: string; type: string; timestamp?: string }>;
  showToast?: (msg: string) => void;
}

export const TopViewedVehiclesWidget: React.FC<TopViewedVehiclesWidgetProps> = ({
  cars,
  dealerSlug: propDealerSlug,
  activeTimeframe = '30d',
  onSelectCar,
  onOpenDealModal,
  realLeads = [],
  realInteractions = [],
  showToast
}) => {
  const { tenant } = useTenant();
  const dealerSlug = propDealerSlug || tenant?.slug || 'rxm';

  // Mapare timeframe dashboard către formatul suportat de API-ul de telemetrie
  const initialApiTimeframe = useMemo<TopViewedTimeframe>(() => {
    if (activeTimeframe === 'today') return 'today';
    if (activeTimeframe === '7d') return '7d';
    if (activeTimeframe === 'year') return 'year';
    if (activeTimeframe === 'all' || activeTimeframe === 'custom') return 'all';
    return '30d';
  }, [activeTimeframe]);

  const [timeframe, setTimeframe] = useState<TopViewedTimeframe>(initialApiTimeframe);
  const [telemetryCars, setTelemetryCars] = useState<TopViewedCarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Sincronizare la schimbarea timeframe-ului din panoul părinte
  useEffect(() => {
    setTimeframe(initialApiTimeframe);
  }, [initialApiTimeframe]);

  // Preluare clasament din Micro-API de telemetrie
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchTopViewedVehicles(dealerSlug, timeframe, 10)
      .then((res) => {
        if (!cancelled) {
          if (res.success && Array.isArray(res.topCars) && res.topCars.length > 0) {
            setTelemetryCars(res.topCars);
          } else {
            // Dacă tabela este nouă sau fără date pentru perioada curentă,
            // folosim mașinile din catalog sortate după viewsCount sau 0
            setTelemetryCars([]);
          }
          setLastRefreshedAt(new Date());
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[TopViewedVehiclesWidget] Fallback local la datele de vizualizare:', err);
          setTelemetryCars([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dealerSlug, timeframe]);

  // Îmbinare date din telemetrie cu colecția bogată de mașini locale
  const mergedTopList = useMemo(() => {
    // Dicționar mașini locale după ID
    const carMap = new Map<string, VehicleItem>();
    cars.forEach(c => carMap.set(c.id, c));

    if (telemetryCars.length > 0) {
      return telemetryCars.map((tItem, index) => {
        const localCar = carMap.get(tItem.id);
        const effectiveCar: VehicleItem = localCar || {
          id: tItem.id,
          stockNumber: tItem.id.slice(0, 8),
          brand: tItem.brand,
          model: tItem.model,
          versionTrim: tItem.versionTrim || '',
          year: tItem.year,
          mileageKm: tItem.mileageKm,
          priceEur: tItem.priceEur,
          vatDeductible: true,
          fuelType: 'Diesel',
          transmission: 'Automată',
          powerHp: 150,
          engineCc: 1968,
          bodyType: 'SUV',
          drivetrain: 'Față',
          color: 'Negru',
          vin: 'RO000000000000000',
          warrantyMonths: 12,
          features: { safety: [], comfort: [], multimedia: [] },
          description: '',
          images: tItem.images || [],
          status: (tItem.status as any) || 'in_stock',
          viewsCount: tItem.allTimeViews
        };

        const carLeads = realLeads.filter(l => l.carId === tItem.id).length;
        const carInteractions = realInteractions.filter(i => i.carId === tItem.id).length;
        const totalInquiries = carLeads + carInteractions;

        const periodViews = Number(tItem.periodViews) || 0;
        const allTimeViews = Number(tItem.allTimeViews) || Number(effectiveCar.viewsCount) || 0;
        const conversionRatePct = periodViews > 0 
          ? Number(((totalInquiries / periodViews) * 100).toFixed(1)) 
          : (allTimeViews > 0 ? Number(((totalInquiries / allTimeViews) * 100).toFixed(1)) : 0);

        const daysInStock = getVehicleAgingInfo(effectiveCar).days;
        
        // Regula Detector „Interes Mare, Conversie Zero” (Overpriced Stock Risk):
        // Mașină în stoc cu multe vizualizări (>= 50 pe istoric sau >= 20 în perioadă), dar fără lead-uri și vechime >= 21 zile
        const isOverpricedRisk = effectiveCar.status === 'in_stock' &&
          (allTimeViews >= 50 || periodViews >= 20) &&
          totalInquiries === 0 &&
          daysInStock >= 21;

        return {
          rank: index + 1,
          car: effectiveCar,
          periodViews,
          allTimeViews,
          totalInquiries,
          conversionRatePct,
          daysInStock,
          isOverpricedRisk
        };
      });
    }

    // Fallback când backend-ul nu are încă evenimente time-series:
    // Sortăm mașinile locale după viewsCount descrescător
    const sorted = [...cars].sort((a, b) => {
      const vA = a.viewsCount || 0;
      const vB = b.viewsCount || 0;
      return vB - vA;
    }).slice(0, 5);

    return sorted.map((car, index) => {
      const carLeads = realLeads.filter(l => l.carId === car.id).length;
      const carInteractions = realInteractions.filter(i => i.carId === car.id).length;
      const totalInquiries = carLeads + carInteractions;

      const views = car.viewsCount || 0;
      const conversionRatePct = views > 0 ? Number(((totalInquiries / views) * 100).toFixed(1)) : 0;
      const daysInStock = getVehicleAgingInfo(car).days;

      const isOverpricedRisk = car.status === 'in_stock' &&
        views >= 50 &&
        totalInquiries === 0 &&
        daysInStock >= 21;

      return {
        rank: index + 1,
        car,
        periodViews: views,
        allTimeViews: views,
        totalInquiries,
        conversionRatePct,
        daysInStock,
        isOverpricedRisk
      };
    });
  }, [telemetryCars, cars, realLeads, realInteractions]);

  // Cel mai vizionat vehicul pentru calibrarea barei de progres relativ (100%)
  const topViewsLeader = useMemo(() => {
    if (mergedTopList.length === 0) return 1;
    return Math.max(...mergedTopList.map(item => Math.max(item.periodViews, item.allTimeViews, 1)), 1);
  }, [mergedTopList]);

  // Reîmprospătare manuală
  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchTopViewedVehicles(dealerSlug, timeframe, 10)
      .then((res) => {
        if (res.success && Array.isArray(res.topCars)) {
          setTelemetryCars(res.topCars);
        }
        setLastRefreshedAt(new Date());
        setIsLoading(false);
        showToast?.('Clasamentul vizualizărilor a fost actualizat din PostgreSQL.');
      })
      .catch(() => setIsLoading(false));
  };

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      {/* Antet Widget */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Top Mașini Cele Mai Căutate
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Telemetrie Reală Netcup
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Audiență colectată pasiv din showroom via PostgreSQL time-series
              </p>
            </div>
          </div>

          {/* Selector orizont & buton refresh */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
            {(['today', '7d', '30d', 'all'] as TopViewedTimeframe[]).map((tf) => {
              const labels: Record<string, string> = {
                today: 'Azi',
                '7d': '7z',
                '30d': '30z',
                all: 'Tot'
              };
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    isActive 
                      ? 'bg-amber-500 text-black font-bold shadow-sm' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {labels[tf]}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              title="Reîmprospătează datele"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Lista Mașinilor */}
        {mergedTopList.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Nu există date de vizualizare înregistrate pentru perioada selectată.
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {mergedTopList.map(({ rank, car, periodViews, allTimeViews, totalInquiries, conversionRatePct, daysInStock, isOverpricedRisk }) => {
              const progressPct = Math.min(100, Math.max(8, Math.round(((periodViews || allTimeViews) / topViewsLeader) * 100)));
              const displayViews = timeframe === 'all' ? allTimeViews : periodViews;

              return (
                <div 
                  key={car.id}
                  className={`p-3 rounded-xl border transition-all duration-200 group ${
                    isOverpricedRisk 
                      ? 'bg-rose-500/[0.03] border-rose-500/30 hover:border-rose-500/50' 
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Rank + Thumbnail + Info */}
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => onSelectCar?.(car)}
                    >
                      {/* Badge Poziție */}
                      <div className="w-6 flex items-center justify-center shrink-0">
                        {rank === 1 ? (
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shadow-sm">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-6 h-6 rounded-lg bg-zinc-300/20 border border-zinc-300/40 text-zinc-200 font-bold text-xs flex items-center justify-center">
                            #2
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-6 h-6 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-500 font-bold text-xs flex items-center justify-center">
                            #3
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-zinc-500 group-hover:text-zinc-300 font-bold">
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Imagine Thumbnail cu Status */}
                      <div className="relative shrink-0">
                        <img 
                          src={normalizeCarImageUrl(car.images[0])} 
                          alt={`${car.brand} ${car.model}`}
                          className="w-12 h-9 rounded-lg object-cover bg-zinc-900 border border-white/[0.08]"
                        />
                        {car.status === 'sold' && (
                          <span className="absolute bottom-0 right-0 bg-red-600/90 text-[9px] text-white px-1 font-bold rounded">
                            Vândut
                          </span>
                        )}
                        {car.status === 'reserved' && (
                          <span className="absolute bottom-0 right-0 bg-amber-600/90 text-[9px] text-white px-1 font-bold rounded">
                            Rezervat
                          </span>
                        )}
                      </div>

                      {/* Denumire & Detalii */}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate group-hover:text-amber-300 transition-colors">
                          {car.brand} {car.model} {car.versionTrim && <span className="font-normal text-zinc-400">({car.versionTrim})</span>}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                          <span>#{getStockNumber(car)}</span>
                          <span>•</span>
                          <span>{car.year}</span>
                          <span>•</span>
                          <span>{car.mileageKm?.toLocaleString('ro-RO')} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Preț & Metrici Vizualizări */}
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-white">
                        {car.priceEur?.toLocaleString('ro-RO')} €
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 font-semibold flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{displayViews.toLocaleString('ro-RO')} vizualizări</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {totalInquiries} lead-uri ({conversionRatePct}%)
                      </div>
                    </div>
                  </div>

                  {/* Bară de progres relativ la lider */}
                  <div className="mt-2.5 w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-300' 
                          : rank === 2 
                            ? 'bg-gradient-to-r from-zinc-300 to-zinc-100' 
                            : 'bg-gradient-to-r from-amber-600/70 to-amber-500/70'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Alertă Stoc Supraevaluat (High Views, Zero Leads) */}
                  {isOverpricedRisk && (
                    <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-rose-300 text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>
                          <strong>Interes fără conversie:</strong> {allTimeViews} vizualizări, 0 lead-uri în {daysInStock} zile
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDealModal ? onOpenDealModal(car) : onSelectCar?.(car)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-bold transition-all active:scale-[0.98]"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Ajustează Prețul (Deal Price)</span>
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subsol Informativ */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-zinc-400" />
          <span>Frecvență eșantionare: Debounce 30 min / sesiune SHA-256</span>
        </span>
        <span className="font-mono text-[10px]">
          Actualizat: {lastRefreshedAt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
