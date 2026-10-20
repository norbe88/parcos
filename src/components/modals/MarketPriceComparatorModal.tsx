import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, TrendingUp, TrendingDown, 
  ExternalLink, Sparkles, RefreshCw, Smartphone, BarChart3, 
  Info, ShieldCheck, BookmarkPlus, RotateCcw, Compass,
  SlidersHorizontal, Calendar, Gauge, Filter
} from 'lucide-react';
import { VehicleItem, MarketPriceEvaluation, DealerMarketBenchmark } from '../../db/types';
import { 
  evaluateMarketPrice, 
  saveEvaluationToCache, 
  getDealerBenchmark,
  saveDealerBenchmark,
  clearDealerBenchmark,
  fetchSamiMarketSnapshot,
  fetchLiveMarketListings,
  SamiMarketCompetitorsSnapshot,
  MarketSearchFilterOverrides,
  buildMarketSearchUrl
} from '../../utils/marketPriceEngine';
import { getStockNumber, formatMileage } from '../../utils/helpers';

interface MarketPriceComparatorModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSaveEvaluation?: (carId: string, evaluation: MarketPriceEvaluation) => void;
  onApplyPrice?: (priceEur: number) => void;
  showToast?: (msg: string) => void;
}

export const MarketPriceComparatorModal: React.FC<MarketPriceComparatorModalProps> = ({
  isOpen,
  car,
  onClose,
  onSaveEvaluation,
  onApplyPrice,
  showToast
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [samiSnapshot, setSamiSnapshot] = useState<SamiMarketCompetitorsSnapshot | null>(null);
  const [evaluation, setEvaluation] = useState<MarketPriceEvaluation | null>(() => car ? evaluateMarketPrice(car) : null);

  // Valori implicite calculate inteligent din datele mașinii
  const defaultYearFrom = car ? Math.max(1990, (car.year || 2015) - 1) : 2014;
  const defaultYearTo = car ? (car.year || 2015) + 1 : 2016;
  const defaultMaxKm = car?.mileageKm ? Math.round(car.mileageKm + 30000) : 260000;

  // Stări pentru filtrele manuale personalizate
  const [filterYearFrom, setFilterYearFrom] = useState<number>(defaultYearFrom);
  const [filterYearTo, setFilterYearTo] = useState<number>(defaultYearTo);
  const [filterMaxKm, setFilterMaxKm] = useState<number>(defaultMaxKm);

  // Stări pentru introducerea benchmark-ului manual de către dealer
  const [benchMin, setBenchMin] = useState<string>('');
  const [benchAvg, setBenchAvg] = useState<string>('');
  const [benchMax, setBenchMax] = useState<string>('');
  const [benchNotes, setBenchNotes] = useState<string>('');
  const [isBenchmarkSaved, setIsBenchmarkSaved] = useState<boolean>(false);

  // Sincronizare inițială când se deschide modalul sau se schimbă mașina
  useEffect(() => {
    if (!isOpen || !car) return;

    let isMounted = true;
    setIsScanning(true);

    const initialDefYearFrom = Math.max(1990, (car.year || 2015) - 1);
    const initialDefYearTo = (car.year || 2015) + 1;
    const initialDefMaxKm = car.mileageKm ? Math.round(car.mileageKm + 30000) : 260000;
    setFilterYearFrom(initialDefYearFrom);
    setFilterYearTo(initialDefYearTo);
    setFilterMaxKm(initialDefMaxKm);

    const initialFilters: MarketSearchFilterOverrides = {
      yearFrom: initialDefYearFrom,
      yearTo: initialDefYearTo,
      maxKm: initialDefMaxKm
    };

    const isDraft = !car.id || car.id.startsWith('draft-') || car.id.startsWith('car-rxm-');
    const initialEval = evaluateMarketPrice(car, samiSnapshot, undefined, isDraft, initialFilters);
    setEvaluation(initialEval);

    // 1. Încercare preluare live din piață (Autovit API live) cu filtrele implicite
    fetchLiveMarketListings(car, initialFilters)
      .then((liveAds) => {
        if (!isMounted) return;
        setIsScanning(false);
        if (liveAds && liveAds.length > 0) {
          const fresh = evaluateMarketPrice(car, liveAds, undefined, true, initialFilters);
          setEvaluation(fresh);
          saveEvaluationToCache(car.id, fresh);
          onSaveEvaluation?.(car.id, fresh);
        } else {
          // Fallback la snapshot-ul local
          fetchSamiMarketSnapshot().then((snap) => {
            if (!isMounted) return;
            if (snap) {
              setSamiSnapshot(snap);
              const fresh = evaluateMarketPrice(car, snap, undefined, isDraft, initialFilters);
              setEvaluation(fresh);
            }
          });
        }
      })
      .catch(() => {
        if (isMounted) setIsScanning(false);
      });

    const savedBench = getDealerBenchmark(car.id) || car.marketEvaluation?.dealerBenchmark;
    if (savedBench) {
      setBenchMin(savedBench.minPriceEur ? savedBench.minPriceEur.toString() : '');
      setBenchAvg(savedBench.avgPriceEur ? savedBench.avgPriceEur.toString() : '');
      setBenchMax(savedBench.maxPriceEur ? savedBench.maxPriceEur.toString() : '');
      setBenchNotes(savedBench.notes || '');
      setIsBenchmarkSaved(true);
    } else {
      setBenchMin('');
      setBenchAvg('');
      setBenchMax('');
      setBenchNotes('');
      setIsBenchmarkSaved(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, car?.id, car?.brand, car?.model, car?.year, car?.mileageKm]);

  // 🔒 Lock background scroll pe body când modalul este deschis (previne rubber-banding pe iOS)
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !car || !evaluation) return null;

  const isFilterCustomized = 
    filterYearFrom !== defaultYearFrom || 
    filterYearTo !== defaultYearTo || 
    filterMaxKm !== defaultMaxKm;

  const handleApplyCustomFilters = async () => {
    if (!car) return;
    setIsScanning(true);
    try {
      const activeFilters: MarketSearchFilterOverrides = {
        yearFrom: filterYearFrom,
        yearTo: filterYearTo,
        maxKm: filterMaxKm
      };
      const liveAds = await fetchLiveMarketListings(car, activeFilters);
      let fresh: MarketPriceEvaluation;
      if (liveAds && liveAds.length > 0) {
        fresh = evaluateMarketPrice(car, liveAds, undefined, true, activeFilters);
        showToast?.(`Filtre aplicate: ${liveAds.length} oferte reale active conform noilor criterii!`);
      } else {
        const snap = await fetchSamiMarketSnapshot();
        if (snap) setSamiSnapshot(snap);
        fresh = evaluateMarketPrice(car, snap || samiSnapshot, undefined, true, activeFilters);
        showToast?.('Nu s-au găsit anunțuri live pentru aceste filtre stricte. Puteți deschide căutarea 1-click pe platforme.');
      }
      setEvaluation(fresh);
      onSaveEvaluation?.(car.id, fresh);
    } catch (e) {
      showToast?.('Eroare la scanarea cu filtre personalizate.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetFilters = async () => {
    if (!car) return;
    setFilterYearFrom(defaultYearFrom);
    setFilterYearTo(defaultYearTo);
    setFilterMaxKm(defaultMaxKm);

    setIsScanning(true);
    try {
      const defaultFilters: MarketSearchFilterOverrides = {
        yearFrom: defaultYearFrom,
        yearTo: defaultYearTo,
        maxKm: defaultMaxKm
      };
      const liveAds = await fetchLiveMarketListings(car, defaultFilters);
      let fresh: MarketPriceEvaluation;
      if (liveAds && liveAds.length > 0) {
        fresh = evaluateMarketPrice(car, liveAds, undefined, true, defaultFilters);
        saveEvaluationToCache(car.id, fresh);
        showToast?.('Filtrele au fost resetate la valorile recomandate.');
      } else {
        const snap = await fetchSamiMarketSnapshot();
        fresh = evaluateMarketPrice(car, snap || samiSnapshot, undefined, true, defaultFilters);
        showToast?.('Filtre resetate.');
      }
      setEvaluation(fresh);
      onSaveEvaluation?.(car.id, fresh);
    } catch (e) {
      showToast?.('Eroare la resetarea filtrelor.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReScan = async () => {
    setIsScanning(true);
    try {
      const activeFilters: MarketSearchFilterOverrides = {
        yearFrom: filterYearFrom,
        yearTo: filterYearTo,
        maxKm: filterMaxKm
      };
      const liveAds = await fetchLiveMarketListings(car, activeFilters);
      let fresh: MarketPriceEvaluation;
      if (liveAds && liveAds.length > 0) {
        fresh = evaluateMarketPrice(car, liveAds, undefined, true, activeFilters);
        showToast?.(`Au fost identificate ${liveAds.length} oferte reale active în piață!`);
      } else {
        const snap = await fetchSamiMarketSnapshot();
        if (snap) setSamiSnapshot(snap);
        fresh = evaluateMarketPrice(car, snap || samiSnapshot, undefined, true, activeFilters);
        showToast?.('Nu s-au găsit anunțuri automate noi. Puteți introduce observațiile manual.');
      }
      setEvaluation(fresh);
      saveEvaluationToCache(car.id, fresh);
      onSaveEvaluation?.(car.id, fresh);
    } catch (e) {
      showToast?.('Eroare la actualizarea ofertelor din piață.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveBenchmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;

    const minNum = parseInt(benchMin, 10);
    const avgNum = parseInt(benchAvg, 10);
    const maxNum = parseInt(benchMax, 10);

    if (isNaN(avgNum) || avgNum <= 0) {
      showToast?.('Vă rugăm să introduceți cel puțin prețul mediu observat în piață.');
      return;
    }

    const benchmark: DealerMarketBenchmark = {
      minPriceEur: !isNaN(minNum) && minNum > 0 ? minNum : Math.round(avgNum * 0.93),
      avgPriceEur: avgNum,
      maxPriceEur: !isNaN(maxNum) && maxNum > 0 ? maxNum : Math.round(avgNum * 1.07),
      notes: benchNotes.trim(),
      savedAt: new Date().toISOString()
    };

    const activeFilters: MarketSearchFilterOverrides = {
      yearFrom: filterYearFrom,
      yearTo: filterYearTo,
      maxKm: filterMaxKm
    };

    saveDealerBenchmark(car.id, benchmark);
    setIsBenchmarkSaved(true);

    const fresh = evaluateMarketPrice(car, samiSnapshot, undefined, true, activeFilters);
    setEvaluation(fresh);
    saveEvaluationToCache(car.id, fresh);
    onSaveEvaluation?.(car.id, fresh);
    showToast?.('Benchmark-ul a fost salvat și recomandările au fost recalibrate pe datele observate!');
  };

  const handleResetBenchmark = () => {
    if (!car) return;
    clearDealerBenchmark(car.id);
    setBenchMin('');
    setBenchAvg('');
    setBenchMax('');
    setBenchNotes('');
    setIsBenchmarkSaved(false);

    const activeFilters: MarketSearchFilterOverrides = {
      yearFrom: filterYearFrom,
      yearTo: filterYearTo,
      maxKm: filterMaxKm
    };
    const fresh = evaluateMarketPrice(car, samiSnapshot, undefined, true, activeFilters);
    setEvaluation(fresh);
    saveEvaluationToCache(car.id, fresh);
    onSaveEvaluation?.(car.id, fresh);
    showToast?.('S-a revenit la calculul automat din piață.');
  };

  const stockRef = getStockNumber(car);
  const activeFiltersObj: MarketSearchFilterOverrides = {
    yearFrom: filterYearFrom,
    yearTo: filterYearTo,
    maxKm: filterMaxKm
  };

  const dynamicOlxUrl = car ? buildMarketSearchUrl('OLX RO', car, activeFiltersObj) : '';
  const dynamicAutovitUrl = car ? buildMarketSearchUrl('Autovit', car, activeFiltersObj) : '';
  const dynamicMobileDeUrl = car ? buildMarketSearchUrl('Mobile.de', car, activeFiltersObj) : '';
  const activeYearRangeDisplay = filterYearFrom === filterYearTo ? `${filterYearFrom} (An exact)` : `${filterYearFrom} – ${filterYearTo}`;
  const activeMaxKmFormatted = formatMileage(filterMaxKm);

  // Curățare titlu pentru a preveni dublarea numelui modelului (ex: "RENAULT KOLEOS KOLEOS 173 CP" -> "RENAULT KOLEOS 173 CP")
  const cleanTrim = car.versionTrim
    ? car.versionTrim.replace(new RegExp(`^${car.model}\\s*`, 'i'), '').trim()
    : '';
  const carTitleDisplay = `${car.brand} ${car.model}${cleanTrim ? ` ${cleanTrim}` : ''}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-5 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f0f12] border border-white/[0.12] rounded-3xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="market-modal-title"
      >
        {/* Antet Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                  #{stockRef}
                </span>
                <h3 id="market-modal-title" className="font-serif font-bold text-base sm:text-lg text-white">
                  Comparator Preț &amp; Analiză Piață Auto
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verificare automată: <strong className="text-zinc-200">{carTitleDisplay} ({car.year} • {formatMileage(car.mileageKm || 160000)})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReScan}
              disabled={isScanning}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
              title="Actualizează ofertele din piața auto"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isScanning ? 'Se actualizează...' : 'Actualizează Ofertele'}</span>
            </button>

            <button 
              onClick={onClose}
              aria-label="Închide fereastra de comparare preț"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors touch-manipulation active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corp Scrollabil */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          
          {/* Banner Proveniență Date (Transparență Totală) */}
          <div className={`border rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
            evaluation.dataSource === 'dealer_benchmark'
              ? 'bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border-emerald-500/30'
              : (evaluation.similarListings && evaluation.similarListings.length > 0)
              ? 'bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border-emerald-500/30'
              : 'bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-transparent border-blue-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                evaluation.dataSource === 'dealer_benchmark' 
                  ? 'bg-amber-400' 
                  : (evaluation.similarListings && evaluation.similarListings.length > 0)
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-zinc-400'
              }`} />
              {evaluation.dataSource === 'dealer_benchmark' ? (
                <BookmarkPlus className="w-4 h-4 shrink-0 text-amber-400" />
              ) : (
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span className="text-zinc-200">
                <strong>
                  {evaluation.dataSource === 'dealer_benchmark' 
                    ? 'Calibrare Manuală Dealer Activată:' 
                    : (evaluation.similarListings && evaluation.similarListings.length > 0)
                    ? 'Sincronizare Piață Auto Live (Autovit.ro):'
                    : 'Căutare Live Recomandată:'}
                </strong>{' '}
                {evaluation.dataSource === 'dealer_benchmark' ? (
                  <span>Recomandările sunt ajustate direct pe baza reperelor reale salvate de dealer.</span>
                ) : (evaluation.similarListings && evaluation.similarListings.length > 0) ? (
                  <span>
                    Identificate {evaluation.similarListings.length} oferte concurente reale active pe Autovit.ro.
                  </span>
                ) : (
                  <span>
                    Nu există anunțuri în cache pentru acest model. Deschideți căutările 1-click de mai jos pentru a consulta piața.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {evaluation.dataSource === 'dealer_benchmark' ? (
                <span className="text-[10px] font-bold font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
                  Observații Dealer Active
                </span>
              ) : (evaluation.similarListings && evaluation.similarListings.length > 0) ? (
                <span className="text-[10px] font-bold font-mono bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Oferte Autovit Reale
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono bg-zinc-500/20 border border-zinc-500/40 text-zinc-300 px-2 py-0.5 rounded-full">
                  Căutare Live Activă
                </span>
              )}
            </div>
          </div>

          {/* 📊 OFERTE CONCURENTE ACTIVE ÎN PIAȚĂ */}
          {evaluation.similarListings && evaluation.similarListings.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Oferte Concurente Active în Piață</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Anunțuri reale identificate în piață conform filtrelor de an (±1 an), kilometraj și specificații:
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    {evaluation.similarListings.length} oferte reale
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    Autovit.ro Live
                  </span>
                </div>
              </div>

              {/* Lista de oferte concurente */}
              <div className="bg-[#141418] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                {evaluation.similarListings.map((item, idx) => {
                  const currentPrice = car.priceEur;
                  const priceDiff = currentPrice > 0 ? item.priceEur - currentPrice : 0;
                  const sourceBadgeColor = 
                    item.source === 'OLX RO' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                      : item.source === 'Autovit'
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      : item.source === 'Mobile.de'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-purple-500/15 border-purple-500/30 text-purple-300';

                  return (
                    <div 
                      key={item.id || idx} 
                      className="p-3 sm:p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${sourceBadgeColor}`}>
                            {item.source}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {item.year} • {formatMileage(item.mileageKm)}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                            📍 {item.location}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400/90 font-mono">
                            {item.matchConfidencePct}% potrivire
                          </span>
                        </div>
                        <h5 className="font-semibold text-white text-xs sm:text-sm truncate">
                          {item.title}
                        </h5>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-white">
                            {item.priceEur.toLocaleString('ro-RO')} €
                          </div>
                          {currentPrice > 0 ? (
                            <div className={`text-[10px] font-mono font-semibold ${
                              priceDiff < 0 
                                ? 'text-emerald-400' 
                                : priceDiff > 0 
                                ? 'text-amber-400' 
                                : 'text-zinc-400'
                            }`}>
                              {priceDiff === 0 ? 'Același preț' : priceDiff > 0 ? `+${priceDiff.toLocaleString('ro-RO')} € vs RXM` : `${priceDiff.toLocaleString('ro-RO')} € vs RXM`}
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono text-zinc-400">
                              Ofertă piață
                            </div>
                          )}
                        </div>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors touch-manipulation active:scale-[0.98]"
                            title="Deschide anunțul direct pe platformă"
                          >
                            <span>Deschide</span>
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Card când nu există anunțuri în cache */
            <div className="bg-[#141418] border border-white/[0.08] rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Fără anunțuri automate în cache pentru acest model</h4>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Platforma nu inventează anunțuri fictive. Deschideți căutarea live 1-click de mai jos pe <strong>Autovit.ro</strong>, <strong>OLX</strong> sau <strong>Mobile.de</strong> pentru a verifica prețurile reale, apoi notați reperele observate în secțiunea de calibrare pentru recalibrare instantă.
              </p>
            </div>
          )}

          {/* 🎛️ FILTRE & CRITERII DE CĂUTARE ÎN PIAȚĂ (Ajustabile Manual de Dealer) */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Criterii &amp; Filtre Căutare Piață Auto</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ajustați manual intervalul de ani (sau anul exact) și plafonul de kilometri pentru a redefini căutarea live și comparația.
                </p>
              </div>

              {/* Badges de stare */}
              <div className="flex items-center gap-2">
                {isFilterCustomized ? (
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Filtre Ajustate Manual
                  </span>
                ) : (
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-zinc-700/40 border border-zinc-600/40 text-zinc-300">
                    Filtre Standard Recomandate
                  </span>
                )}
              </div>
            </div>

            {/* Rândul 1: Specificații Invariante ale Mașinii */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-mono">
                Marcă: <strong className="text-white">{car.brand}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-mono">
                Model: <strong className="text-white">{car.model}</strong>
              </span>
              {car.fuelType && (
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-mono">
                  Combustibil: <strong className="text-white">{car.fuelType}</strong>
                </span>
              )}
              {car.transmission && (
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-mono">
                  Transmisie: <strong className="text-white">{car.transmission}</strong>
                </span>
              )}
            </div>

            {/* Grilă Controale Interactive: An Fabricație & Plafon Kilometric */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
              
              {/* Coloana Stânga: An Fabricație */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>An Fabricație:</span>
                    <span className="text-amber-400 font-mono text-[11px] font-bold">
                      {activeYearRangeDisplay}
                    </span>
                  </label>
                </div>

                {/* Butoane Rapide pentru An */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterYearFrom(car.year);
                      setFilterYearTo(car.year);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterYearFrom === car.year && filterYearTo === car.year
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    Exact {car.year}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterYearFrom(Math.max(1990, car.year - 1));
                      setFilterYearTo(car.year + 1);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterYearFrom === Math.max(1990, car.year - 1) && filterYearTo === car.year + 1
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ±1 An ({Math.max(1990, car.year - 1)}–{car.year + 1})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterYearFrom(Math.max(1990, car.year - 2));
                      setFilterYearTo(car.year + 2);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterYearFrom === Math.max(1990, car.year - 2) && filterYearTo === car.year + 2
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ±2 Ani ({Math.max(1990, car.year - 2)}–{car.year + 2})
                  </button>
                </div>

                {/* Inputuri manuale pentru interval personalizat */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-400 block mb-1">De la anul:</span>
                    <input
                      type="number"
                      min="1990"
                      max={filterYearTo}
                      value={filterYearFrom}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setFilterYearFrom(Math.min(val, filterYearTo));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <span className="text-zinc-500 pt-5">—</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-400 block mb-1">Până la anul:</span>
                    <input
                      type="number"
                      min={filterYearFrom}
                      max="2027"
                      value={filterYearTo}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setFilterYearTo(Math.max(val, filterYearFrom));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Coloana Dreapta: Plafon Kilometraj */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>Plafon Kilometraj:</span>
                    <span className="text-amber-400 font-mono text-[11px] font-bold">
                      ≤ {activeMaxKmFormatted}
                    </span>
                  </label>
                </div>

                {/* Butoane Rapide pentru KM */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {car.mileageKm && (
                    <button
                      type="button"
                      onClick={() => setFilterMaxKm(car.mileageKm!)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        filterMaxKm === car.mileageKm
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                          : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      Rulaj mașină ({formatMileage(car.mileageKm)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setFilterMaxKm(((car.mileageKm || 160000) + 20000))}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterMaxKm === ((car.mileageKm || 160000) + 20000)
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    +20k km ({formatMileage((car.mileageKm || 160000) + 20000)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMaxKm(((car.mileageKm || 160000) + 30000))}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterMaxKm === ((car.mileageKm || 160000) + 30000)
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    +30k km ({formatMileage((car.mileageKm || 160000) + 30000)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMaxKm(150000)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterMaxKm === 150000
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ≤ 150.000 km
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMaxKm(200000)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterMaxKm === 200000
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ≤ 200.000 km
                  </button>
                </div>

                {/* Input manual pentru kilometraj */}
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Plafon kilometri personalizat:</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="5000"
                      min="10000"
                      max="500000"
                      value={filterMaxKm}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setFilterMaxKm(val);
                      }}
                      className="w-full px-3 py-1.5 pr-12 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Butoane de Acțiune: Aplică & Re-scanează și Resetează */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyCustomFilters}
                  disabled={isScanning}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 touch-manipulation active:scale-[0.98] cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Se scanează piața...' : 'Aplică Filtre & Re-scanează Autovit'}</span>
                </button>

                {isFilterCustomized && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={isScanning}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors touch-manipulation active:scale-[0.98] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Resetează la Recomandat</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-zinc-400 italic">
                Linkurile 1-click de mai jos se actualizează în timp real cu filtrele de mai sus.
              </span>
            </div>
          </div>

          {/* 🚀 CARDURI DE CĂUTARE DIRECTĂ LIVE (1-Click Launchers) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Verificare Live în Piață (Căutare 1-Click cu Filtre Exacte)</span>
              </h4>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Deschide în tab nou pe platforma dorită</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: OLX România Live */}
              <div className="bg-[#141418] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between transition-colors group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                      OLX România
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Național / Privați</span>
                  </div>
                  <h5 className="font-semibold text-white text-sm">
                    {car.brand} {car.model}
                  </h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    Filtru exact: An {activeYearRangeDisplay} • Rulaj până la {activeMaxKmFormatted}.
                  </p>
                </div>

                {dynamicOlxUrl && (
                  <a
                    href={dynamicOlxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 min-h-[44px] w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <span>Caută Live pe OLX</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Card 2: Autovit.ro Live */}
              <div className="bg-[#141418] border border-white/[0.08] hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between transition-colors group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px] font-bold">
                      Autovit.ro
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Dealeri Profesioniști</span>
                  </div>
                  <h5 className="font-semibold text-white text-sm">
                    {car.brand} {car.model}
                  </h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    Piața autorizată: An fabricație {activeYearRangeDisplay} • max {activeMaxKmFormatted}.
                  </p>
                </div>

                {dynamicAutovitUrl && (
                  <a
                    href={dynamicAutovitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 min-h-[44px] w-full py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <span>Caută Live pe Autovit</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Card 3: Mobile.de Live */}
              <div className="bg-[#141418] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between transition-colors group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                      Mobile.de
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Germania / UE</span>
                  </div>
                  <h5 className="font-semibold text-white text-sm">
                    {car.brand} {car.model}
                  </h5>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    Reper import UE: An {activeYearRangeDisplay} • max {activeMaxKmFormatted}.
                  </p>
                </div>

                {dynamicMobileDeUrl && (
                  <a
                    href={dynamicMobileDeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 min-h-[44px] w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <span>Caută Live pe Mobile.de</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 🎯 Panou Principal: Prețul Curent RXM vs Distribuția Pieței */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-400">Prețul Curent în Showroom RXM</span>
                <div className="flex items-baseline gap-3 mt-0.5">
                  {car.priceEur > 0 ? (
                    <>
                      <span className="text-3xl font-extrabold text-white font-mono">
                        {car.priceEur.toLocaleString('ro-RO')} €
                      </span>
                      
                      {evaluation.marketPosition === 'below_market' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Cu {Math.abs(evaluation.priceDifferenceEur).toLocaleString('ro-RO')} € sub media de referință</span>
                        </span>
                      ) : evaluation.marketPosition === 'above_market' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Cu {evaluation.priceDifferenceEur.toLocaleString('ro-RO')} € peste media de referință</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aliniat cu media pieței</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-zinc-400 italic">
                        Nesetat (în curs de adăugare)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Selectați un preț recomandat mai jos
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-zinc-400">Media Pieței de Referință</span>
                <div className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
                  {evaluation.avgPriceEur.toLocaleString('ro-RO')} €
                </div>
                <span className="text-[10px] text-zinc-500">
                  {evaluation.dataSource === 'dealer_benchmark' ? 'calibrat pe observații dealer' : 'pe baza modelului statistic de piață'}
                </span>
              </div>
            </div>

            {/* Scală Vizuală Distribuție Preț */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Minim: {evaluation.minPriceEur.toLocaleString('ro-RO')} €</span>
                <span className="text-amber-300 font-semibold">Medie: {evaluation.avgPriceEur.toLocaleString('ro-RO')} €</span>
                <span>Maxim: {evaluation.maxPriceEur.toLocaleString('ro-RO')} €</span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex relative">
                <div className="h-full bg-emerald-500/40 w-1/3" title="Zonă Vânzare Rapidă" />
                <div className="h-full bg-amber-500/40 w-1/3" title="Zonă Medie Piață" />
                <div className="h-full bg-purple-500/40 w-1/3" title="Zonă Preț Maxim / Echipare Top" />
              </div>
            </div>

            {/* Cele 3 Recomandări de Preț pentru Dealer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <span>⚡ Preț Vânzare Mai Rapidă</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {evaluation.recommendedQuickSalePriceEur.toLocaleString('ro-RO')} €
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Recomandat pentru rotație rapidă a stocului și eliberarea capitalului.</p>
                </div>
                {onApplyPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyPrice(evaluation.recommendedQuickSalePriceEur);
                      showToast?.(`Prețul de ${evaluation.recommendedQuickSalePriceEur.toLocaleString('ro-RO')} € a fost aplicat!`);
                      onClose();
                    }}
                    className="mt-2.5 min-h-[38px] w-full py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
                  >
                    🎯 Aplică acest preț
                  </button>
                )}
              </div>

              <div className="bg-black/40 border border-amber-500/40 rounded-xl p-3 shadow-lg shadow-amber-500/5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <span>⚖️ Preț Optim Recomandat</span>
                  </div>
                  <div className="text-lg font-bold text-amber-300 font-mono mt-1">
                    {evaluation.recommendedFairPriceEur.toLocaleString('ro-RO')} €
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Punctul ideal între marja de profit comercial și timpul de vânzare.</p>
                </div>
                {onApplyPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyPrice(evaluation.recommendedFairPriceEur);
                      showToast?.(`Prețul optim de ${evaluation.recommendedFairPriceEur.toLocaleString('ro-RO')} € a fost aplicat!`);
                      onClose();
                    }}
                    className="mt-2.5 min-h-[38px] w-full py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
                  >
                    🎯 Aplică acest preț
                  </button>
                )}
              </div>

              <div className="bg-black/40 border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                    <span>⭐ Preț Maxim Negociabil</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {evaluation.recommendedPremiumPriceEur.toLocaleString('ro-RO')} €
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Recomandat dacă vehiculul are dotări superioare și istoric certificat complet.</p>
                </div>
                {onApplyPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyPrice(evaluation.recommendedPremiumPriceEur);
                      showToast?.(`Prețul premium de ${evaluation.recommendedPremiumPriceEur.toLocaleString('ro-RO')} € a fost aplicat!`);
                      onClose();
                    }}
                    className="mt-2.5 min-h-[38px] w-full py-1.5 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold border border-purple-500/40 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
                  >
                    🎯 Aplică acest preț
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ✍️ PANOU DEALER: CALIBRARE MANUALĂ OPȚIONALĂ */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-amber-400" />
                  <span>Calibrare Manuală Dealer (Opțional — ajustare fină a mediei de piață)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Dacă doriți să ajustați sau să suprascrieți media calculată automat din piață, introduceți reperele observate manual:
                </p>
              </div>

              {isBenchmarkSaved && (
                <button
                  type="button"
                  onClick={handleResetBenchmark}
                  className="self-start sm:self-auto text-[11px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer touch-manipulation"
                  title="Revino la calculul automat din piață"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resetează la calculul automat din piață</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveBenchmark} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                    Preț Minim Văzut Live (€)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="200000"
                    step="50"
                    placeholder="ex: 12500"
                    value={benchMin}
                    onChange={(e) => setBenchMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-amber-300 uppercase mb-1">
                    Preț Mediu Observat (€) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="200000"
                    step="50"
                    placeholder="ex: 13900"
                    value={benchAvg}
                    onChange={(e) => setBenchAvg(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                    Preț Maxim Văzut Live (€)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="200000"
                    step="50"
                    placeholder="ex: 15200"
                    value={benchMax}
                    onChange={(e) => setBenchMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Observații / Notițe Dealer (opțional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Pe OLX sunt 6 mașini similare în Cluj și Bihor, 2 cu kilometraj peste 240.000 km."
                  value={benchNotes}
                  onChange={(e) => setBenchNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer touch-manipulation active:scale-[0.98]"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Salvează Observațiile din Piață</span>
                </button>
              </div>
            </form>
          </div>

          {/* 🧠 Sumar Executiv Transparent */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 
              <span>Raport Analitic de Poziționare în Piață</span>
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {evaluation.executiveSummary}
            </p>
          </div>

          {/* 🛡️ Notă de Integritate & Transparență Totală */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start sm:items-center gap-3 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-zinc-200">Garanția de transparență RXM:</strong> Platforma oferă acces direct la căutările live ale celor mai mari platforme auto (OLX, Autovit, Mobile.de) și nu generează date artificiale sau anunțuri simulate prezentate ca fiind reale.
            </span>
          </div>

        </div>

        {/* Subsol Modal */}
        <div className="p-4 border-t border-white/[0.08] flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/[0.02]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 text-center sm:text-left">
            <Info className="w-4 h-4 text-zinc-500 shrink-0" />
            Datele de benchmark și căutare rămân salvate automat pentru acest vehicul.
          </span>
          <button
            onClick={onClose}
            className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 touch-manipulation active:scale-[0.98] cursor-pointer"
          >
            Închide Raportul
          </button>
        </div>

      </div>
    </div>
  );
};
