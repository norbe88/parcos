import React, { useState } from 'react';
import { 
  X, Gavel, Tag, CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowRight, Sparkles, Building2, Clock, Trash2, Loader2 
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { 
  buildAutolicitPayload, 
  pushListingToAutolicit, 
  delistFromAutolicit 
} from '../../services/autolicitSyncService';

interface AutolicitPushModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onConfirmSync: (carId: string, syncData: NonNullable<VehicleItem['autolicitSync']>) => void;
  onRemoveSync: (carId: string) => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
}

export const AutolicitPushModal: React.FC<AutolicitPushModalProps> = ({
  isOpen,
  car,
  onClose,
  onConfirmSync,
  onRemoveSync,
  showToast,
  dealer = SEED_DEALER
}) => {
  // Modul ales: 'direct_sale' (preț fix) sau 'auction' (licitație -20%)
  const [selectedMode, setSelectedMode] = useState<'direct_sale' | 'auction'>('direct_sale');
  const [startingBidEur, setStartingBidEur] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sincronizare stare la selectarea unei mașini
  React.useEffect(() => {
    if (car) {
      setSelectedMode(car.autolicitSync?.mode === 'auction' ? 'auction' : 'direct_sale');
      const defaultAuctionStartEur = Math.round(car.priceEur * 0.8);
      setStartingBidEur(car.autolicitSync?.startingBidEur || defaultAuctionStartEur);
    }
  }, [car]);

  if (!isOpen || !car) return null;

  const currentSync = car.autolicitSync;
  const isAlreadySynced = currentSync?.isSynced;
  const defaultAuctionStartEur = Math.round(car.priceEur * 0.8);

  const handlePublish = async () => {
    if (!car.vin || car.vin.trim().length < 11) {
      showToast('⚠️ Seria de șasiu (VIN) este invalidă sau lipsește. Completați VIN-ul mașinii înainte de publicare.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildAutolicitPayload(car, selectedMode, startingBidEur);
      const res = await pushListingToAutolicit(payload);

      if (!res.success) {
        showToast(`⚠️ Sincronizarea AutoLicit a eșuat: ${res.error || 'Eroare de conexiune'}. Verificați și reîncercați.`);
        return;
      }

      const syncPayload: NonNullable<VehicleItem['autolicitSync']> = {
        isSynced: true,
        mode: selectedMode,
        startingBidEur: selectedMode === 'auction' ? startingBidEur : undefined,
        syncedAt: new Date().toISOString()
      };

      onConfirmSync(car.id, syncPayload);

      // Feedback îmbogățit cu evaluare de preț (Deal Rating) din Desy
      if (res.priceAnalysis?.dealRating === 'GREAT_PRICE') {
        showToast(`✓ Publicat pe AutoLicit.ro! Evaluare: Preț Excelent (sub piață).`);
      } else if (res.priceAnalysis?.dealRating === 'FAIR_PRICE') {
        showToast(`✓ Publicat pe AutoLicit.ro! Evaluare: Preț Corect de Piață.`);
      } else {
        showToast(
          selectedMode === 'auction'
            ? `⚡ Mașina a fost trimisă la Licitație Live pe AutoLicit.ro (Pornire: ${startingBidEur.toLocaleString('ro-RO')} €)!`
            : `✓ Mașina a fost publicată în secțiunea Stoc Parcuri Partenere pe AutoLicit.ro!`
        );
      }
      onClose();
    } catch (err: any) {
      console.error('[AutolicitPushModal] Eroare neașteptată la publicare:', err);
      showToast(`⚠️ Eroare neașteptată la sincronizare: ${err?.message || 'Eroare necunoscută'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setIsSubmitting(true);
      const dealerSlug = car.dealerSlug || dealer?.slug || 'rxm';
      const res = await delistFromAutolicit(car.vin, dealerSlug);

      if (!res.success) {
        console.warn('[AutolicitPushModal] Avertisment delistare:', res.error);
      }

      onRemoveSync(car.id);
      showToast(`✓ Mașina a fost retrasă de pe AutoLicit.ro.`);
      onClose();
    } catch (err: any) {
      console.error('[AutolicitPushModal] Eroare neașteptată la retragere:', err);
      onRemoveSync(car.id);
      showToast(`✓ Mașina a fost retrasă local de pe AutoLicit.ro.`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#121215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Sindicare Automată pe AutoLicit.ro
                </h3>
                {isAlreadySynced && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Activ pe AutoLicit
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Lansează mașina în fața miilor de cumpărători verificați din toată România
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corp Modal */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Caseta Mașinii Selectate */}
          <div className="bg-white/[0.03] border border-white/08 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-zinc-400">{car.year} • {car.fuelType} • {car.transmission}</div>
              <div className="text-base font-extrabold text-white">
                {car.brand} {car.model} {car.versionTrim}
              </div>
              <div className="text-xs font-mono text-zinc-500 mt-0.5">VIN: {car.vin}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Preț Showroom:</span>
              <span className="text-lg font-black font-mono text-amber-400">
                {car.priceEur.toLocaleString('ro-RO')} €
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                {car.vatDeductible ? 'TVA Deductibil 21%' : 'Regim Marjă'}
              </span>
            </div>
          </div>

          {/* Selecție Canal AutoLicit */}
          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2.5">
              Alege Modul de Vânzare pe AutoLicit.ro:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opțiunea 1: Anunț Simplu la Preț Fix */}
              <div 
                onClick={() => setSelectedMode('direct_sale')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'direct_sale'
                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-white/[0.02] border-white/08 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className={`w-4 h-4 ${selectedMode === 'direct_sale' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-xs text-white">1. Anunț Simplu (Preț Fix)</span>
                  </div>
                  <input 
                    type="radio" 
                    name="syncMode" 
                    checked={selectedMode === 'direct_sale'} 
                    onChange={() => setSelectedMode('direct_sale')}
                    className="accent-amber-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Listare directă la prețul întreg de showroom (<strong>{car.priceEur.toLocaleString('ro-RO')} €</strong>). Cumpărătorul te sună direct sau trimite mesaj pe WhatsApp. Inclus în abonamentul de dealer.
                </p>
                <div className="mt-2.5 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Fără comision de licitație
                </div>
              </div>

              {/* Opțiunea 2: Licitație Live No Reserve */}
              <div 
                onClick={() => setSelectedMode('auction')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'auction'
                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-white/[0.02] border-white/08 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gavel className={`w-4 h-4 ${selectedMode === 'auction' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-xs text-white">2. Licitație Live (No Reserve)</span>
                  </div>
                  <input 
                    type="radio" 
                    name="syncMode" 
                    checked={selectedMode === 'auction'} 
                    onChange={() => setSelectedMode('auction')}
                    className="accent-amber-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Lichidare rapidă în 7 zile cu timer soft-close. Prețul pornește cu -20% sub piață pentru a genera competiție masivă între cumpărători.
                </p>
                <div className="mt-2.5 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Fonduri asigurate în Cont de Garanție BT
                </div>
              </div>
            </div>
          </div>

          {/* Configurare Preț Pornire Licitație (când e selectat 'auction') */}
          {selectedMode === 'auction' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-150">
              <label className="text-[11px] font-bold text-amber-300 block flex items-center justify-between">
                <span>Preț de Pornire Licitație (EUR):</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                  -20% Recomandat: {defaultAuctionStartEur.toLocaleString('ro-RO')} €
                </span>
              </label>
              
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={startingBidEur}
                  disabled={isSubmitting}
                  onChange={(e) => setStartingBidEur(Math.max(1000, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#18181b] border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-mono text-zinc-400">€</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Licitația va dura 7 zile cu protecție anti-sniping (+2 minute la orice ofertă depusă în ultimul minut).
              </p>
            </div>
          )}

          {/* Invariante Garanție & Siguranță */}
          <div className="p-3 bg-black/40 border border-white/06 rounded-xl text-[10.5px] text-zinc-400 space-y-1">
            <div className="text-zinc-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garanțiile Rețelei Partenere AutoLicit:</span>
            </div>
            <div>• Toți cumpărătorii au conturi verificate KYC prin buletin / CUI ANAF.</div>
            <div>• Garanția de participare se depune exclusiv în <strong>Contul de Garanție (Banca Transilvania)</strong>.</div>
            <div>• Mașina rămâne în parcul tău din {dealer.serviceLocation} până la achitarea integrală a facturii.</div>
          </div>
        </div>

        {/* Footer Butoane */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] flex items-center justify-between bg-black/40">
          {isAlreadySynced ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isSubmitting}
              className="py-2.5 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Retrage de pe AutoLicit</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anulează
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                  <span>Se sincronizează...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{isAlreadySynced ? 'Actualizează pe AutoLicit' : 'Publică Imediat pe AutoLicit'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
