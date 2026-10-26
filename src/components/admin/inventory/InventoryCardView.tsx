import React from 'react';
import { 
  Clock, AlertTriangle, Images, Flame, Star, Building2, Gavel, 
  FileText, QrCode, Tag, ExternalLink, Share2, Trash2, Gauge, Fuel, Cog, 
  Check, Copy, CheckCircle2, RefreshCw, GitBranch, Edit3, DollarSign,
  MoreVertical, Sparkles, BarChart3, Cloud, Eye, MessageSquare, MoreHorizontal
} from 'lucide-react';
import { VehicleItem } from '../../../db/seed';
import { 
  computeOlxDiscrepancy, 
  calculateVehicleFinancials, 
  getStockNumber, 
  formatMileage, 
  normalizeCarImageUrl 
} from '../../../utils/helpers';
import { formatPriceWithCurrency, WorkspaceSettings } from '../../../context/WorkspaceContext';

export interface InventoryCardViewProps {
  activeCars: VehicleItem[];
  pendingSale: {
    carId: string;
    previousStatus: VehicleItem['status'];
    countdown: number;
    soldPriceEur?: number;
    soldAt?: string;
  } | null;
  openMenuCarId: string | null;
  setOpenMenuCarId: (id: string | null) => void;
  syncingCarId: string | null;
  workspaceSettings: WorkspaceSettings;
  copiedVin: string | null;
  handleCancelPendingSale: () => void;
  handleConfirmPendingSaleNow: () => void;
  handleStatusClick: (car: VehicleItem, nextStatus: 'in_stock' | 'reserved' | 'sold' | 'preparing') => void;
  handlePublishToCloud: (car: VehicleItem) => void;
  handleOpenDealModal: (e: React.MouseEvent, car: VehicleItem) => void;
  handleOpenPriceModal: (e: React.MouseEvent, car: VehicleItem) => void;
  handleCopyVin: (e: React.MouseEvent, vin: string) => void;
  renderAgingBadge: (c: VehicleItem) => React.ReactNode;
  renderSyncBadge: (car: VehicleItem) => React.ReactNode;
  resolveVehicleSyncOrigin: (vehicle: VehicleItem) => 'cloud' | 'local' | 'seed';
  onSelectCar: (car: VehicleItem, tab?: any) => void;
  onTogglePinHero: (carId: string) => void;
  onToggleVatDeductible?: (carId: string) => void;
  onDeleteCar: (carId: string) => void;
  onOpenSalesDocs: (car: VehicleItem) => void;
  onOpenWindowSticker: (car: VehicleItem) => void;
  onOpenGallery?: (car: VehicleItem) => void;
  onOpenPlateStudio?: (car: VehicleItem) => void;
  onOpenAutolicit?: (car: VehicleItem) => void;
  onOpenOlxExport?: (car: VehicleItem) => void;
  onOpenSocialPost?: (car: VehicleItem) => void;
  onOpenSeedExporter?: (car: VehicleItem) => void;
  onOpenComparator: (car: VehicleItem) => void;
  onOpenBranding: (car: VehicleItem) => void;
  setAuditDrawerCar: (car: VehicleItem | null) => void;
  showToast: (msg: string) => void;
  handleShareCarWhatsApp: (car: VehicleItem) => void;
  onEditCar?: (car: VehicleItem) => void;
  setPriceEditCar: (car: VehicleItem | null) => void;
  setIsPriceEditModalOpen: (open: boolean) => void;
}

export const InventoryCardView: React.FC<InventoryCardViewProps> = ({
  activeCars,
  pendingSale,
  openMenuCarId,
  setOpenMenuCarId,
  syncingCarId,
  workspaceSettings,
  copiedVin,
  handleCancelPendingSale,
  handleConfirmPendingSaleNow,
  handleStatusClick,
  handlePublishToCloud,
  handleOpenDealModal,
  handleOpenPriceModal,
  handleCopyVin,
  renderAgingBadge,
  renderSyncBadge,
  resolveVehicleSyncOrigin,
  onSelectCar,
  onTogglePinHero,
  onToggleVatDeductible,
  onDeleteCar,
  onOpenSalesDocs,
  onOpenWindowSticker,
  onOpenGallery,
  onOpenPlateStudio,
  onOpenAutolicit,
  onOpenOlxExport,
  onOpenSocialPost,
  onOpenSeedExporter,
  onOpenComparator,
  onOpenBranding,
  setAuditDrawerCar,
  showToast,
  handleShareCarWhatsApp,
  onEditCar,
  setPriceEditCar,
  setIsPriceEditModalOpen,
}) => {
  return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {activeCars.map((c) => {
            const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
            const financials = calculateVehicleFinancials(c);
            const stockNum = getStockNumber(c);

            return (
              <div 
                key={c.id}
                className={`relative bg-[#121215] border rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all flex flex-col justify-between group ${
                  pendingSale?.carId === c.id 
                    ? 'border-amber-400 shadow-amber-500/20 ring-2 ring-amber-400/40' 
                    : 'border-white/[0.08] hover:border-amber-400/40'
                }`}
              >
                {/* ⏱ Overlay Perioadă de Grație 10s (Pending Sale & Undo - Ticket 01) */}
                {pendingSale?.carId === c.id && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md rounded-2xl border-2 border-amber-500/80 p-5 flex flex-col justify-center items-center text-center space-y-3.5 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-white font-black text-base flex items-center justify-center gap-1.5 flex-wrap">
                        <span>Marcat ca Vândut</span>
                        {pendingSale.soldPriceEur && (
                          <span className="text-emerald-400 font-mono text-sm font-bold">
                            ({pendingSale.soldPriceEur.toLocaleString('ro-RO')} €)
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-300 text-xs mt-1">
                        Se mută în Arhivă în <span className="font-mono font-black text-amber-400 text-base">{pendingSale.countdown}s</span>
                      </div>
                    </div>
                    {/* Bara de progres pulsantă */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(pendingSale.countdown / 10) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2.5 w-full pt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCancelPendingSale(); }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-md"
                      >
                        ✕ Anulează (Undo)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleConfirmPendingSaleNow(); }}
                        className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all cursor-pointer shadow-md"
                      >
                        Confirmă Acum ➔
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 1. Header Media: Imagine 16:10 + Badge-uri HUD & Preț Neobstrucționat */}
                <div className="relative aspect-[16/10] bg-black/60 rounded-t-2xl overflow-hidden cursor-pointer" onClick={() => onSelectCar(c, 'specs')}>
                  {c.images && c.images.length > 0 ? (
                    <img 
                      src={normalizeCarImageUrl(c.images[0])} 
                      alt={c.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-[#0c0c0e] p-4 text-center">
                      <Clock className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">În Curs de Pregătire</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Fără fotografii · Ascuns din site</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/60" />

                  {/* Badge Stânga Sus: Cod Stoc, Țară & Indicator Foto */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-amber-300 font-mono font-bold text-[11px] shadow-md">
                      #{stockNum}
                    </span>
                    {c.docOriginCountry && (
                      <span className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-white font-mono text-[10px] shadow-md">
                        {c.docOriginCountry === 'DE' ? '🇩🇪 DE' : c.docOriginCountry === 'AT' ? '🇦🇹 AT' : c.docOriginCountry === 'FR' ? '🇫🇷 FR' : c.docOriginCountry === 'IT' ? '🇮🇹 IT' : c.docOriginCountry === 'NL' ? '🇳🇱 NL' : c.docOriginCountry === 'BE' ? '🇧🇪 BE' : c.docOriginCountry === 'US' ? '🇺🇸 SUA' : '🇷🇴 RO'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs');
                      }}
                      className={`px-2 py-1 rounded-lg backdrop-blur-md border font-mono text-[10px] shadow-md flex items-center gap-1 transition-all cursor-pointer ${
                        c.images.length === 0
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 hover:bg-amber-500/35 animate-pulse'
                          : 'bg-black/80 hover:bg-black/95 text-zinc-300 hover:text-white border-white/15 hover:border-amber-400'
                      }`}
                      title={c.images.length === 0 ? "Adaugă fotografii pentru această mașină" : "Deschide galeria foto & editorul de plăcuță RXM"}
                    >
                      <Images className="w-3 h-3 text-amber-400" />
                      <span>{c.images.length === 0 ? '+ Adaugă Poze' : `${c.images.length} foto`}</span>
                    </button>
                  </div>

                  {/* Badge-uri Dreapta Sus: Ofertă Săptămânii (Flame) & Pin Hero TikTok (Star) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => handleOpenDealModal(e, c)}
                      className={`min-h-[34px] min-w-[34px] p-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center justify-center touch-manipulation active:scale-90 shadow-md ${
                        c.isDealOfWeek
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-300 shadow-amber-500/40'
                          : 'bg-black/70 text-white/70 hover:text-amber-300 border-white/20 hover:bg-black/90 hover:border-amber-500/40'
                      }`}
                      title={c.isDealOfWeek ? 'Oferta Săptămânii activă (apasă pentru setare prețuri & detalii)' : 'Configurează ca Ofertă a Săptămânii'}
                    >
                      <Flame className={`w-4 h-4 ${c.isDealOfWeek ? 'fill-black text-black' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onTogglePinHero(c.id); }}
                      className={`min-h-[34px] min-w-[34px] p-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center justify-center touch-manipulation active:scale-90 shadow-md ${
                        c.isHeroPinned
                          ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/30'
                          : 'bg-black/70 text-white/70 hover:text-white border-white/20 hover:bg-black/90'
                      }`}
                      title={c.isHeroPinned ? 'Hero Pinned ✓: Fixat în Hero TikTok Reel (apasă pentru eliminare)' : 'Fixează în Hero TikTok Reel'}
                    >
                      <Star className={`w-4 h-4 ${c.isHeroPinned ? 'fill-black text-black' : ''}`} />
                    </button>
                  </div>

                  {/* Alertă Discrepanță OLX (dacă există) */}
                  {discrepancy !== 'none' && (
                    <div className="absolute top-12 left-3 right-3 z-10">
                      <div className="px-2.5 py-1 rounded-lg bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold border border-rose-400 flex items-center gap-1.5 shadow-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{discrepancy === 'sold_but_active_on_olx' ? 'Vândută în parc, dar activă pe OLX!' : 'Dispărută de pe OLX!'}</span>
                      </div>
                    </div>
                  )}

                  {/* Overlay Inferior Foto: Doar Regim Fiscal / TVA + Preț Mare Clar */}
                  <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 flex items-end justify-between gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                    {/* Stânga: TVA 21% / Regim Marjă Toggle + AutoLicit Sync Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleVatDeductible ? onToggleVatDeductible(c.id) : null; }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md ${
                          c.vatDeductible
                            ? 'bg-emerald-500/90 text-black border-emerald-400 shadow-emerald-500/20'
                            : 'bg-black/80 hover:bg-black/95 text-zinc-300 hover:text-white border-white/20'
                        }`}
                        title={c.vatDeductible ? "TVA Deductibil 21% (Apasă pentru Regimul Marjei Art. 312)" : "Regimul Marjei Art. 312 (Apasă pentru TVA Deductibil 21%)"}
                      >
                        <Building2 className={`w-3 h-3 ${c.vatDeductible ? 'text-black' : 'text-zinc-400'}`} />
                        <span>{c.vatDeductible ? 'TVA 21%' : 'Regim Marjă'}</span>
                      </button>

                      {c.autolicitSync?.isSynced && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenAutolicit ? onOpenAutolicit(c) : null; }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md ${
                            c.autolicitSync.mode === 'auction'
                              ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/30'
                              : 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/30'
                          }`}
                          title={c.autolicitSync.mode === 'auction' ? 'Licitație AutoLicit activă' : 'Sincronizat pe AutoLicit'}
                        >
                          <Gavel className="w-3 h-3 text-black" />
                          <span>{c.autolicitSync.mode === 'auction' ? '⚡ Licitație' : '⚡ AutoLicit'}</span>
                        </button>
                      )}

                      {/* ☁️ Cloud Sync Badge & 1-Click Publish (Ticket 05) */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {renderSyncBadge(c)}
                        {resolveVehicleSyncOrigin(c) === 'local' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handlePublishToCloud(c); }}
                            disabled={syncingCarId === c.id}
                            className="text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md bg-sky-500/80 hover:bg-sky-600 text-white border-sky-400 shadow-sky-500/20 disabled:opacity-50 disabled:cursor-wait"
                            title="Publică vehiculul și fotografiile în Showroom Live pe serverul Netcup"
                          >
                            {syncingCarId === c.id ? (
                              <RefreshCw className="w-3 h-3 text-white animate-spin" />
                            ) : (
                              <Cloud className="w-3 h-3 text-white" />
                            )}
                            <span>{syncingCarId === c.id ? 'Se publică...' : 'Publică în Showroom'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dreapta: Caseta de Preț Mare & Discount */}
                    <div className="shrink-0 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPriceModal(e, c)}
                        className="px-2.5 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 hover:border-amber-400/50 transition-all text-right shadow-xl cursor-pointer group/price block"
                        title="Apasă pentru modificare preț vânzare / TVA 21%"
                      >
                        {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                          <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <span className="text-[10.5px] text-zinc-400 line-through font-mono leading-none">
                              {formatPriceWithCurrency(c.oldPriceEur, workspaceSettings.currency)}
                            </span>
                            <span className="text-[9.5px] font-extrabold text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-1 py-0.2 rounded font-mono">
                              -{formatPriceWithCurrency(c.oldPriceEur - c.priceEur, workspaceSettings.currency)}
                            </span>
                          </div>
                        )}
                        <div className={`font-black font-mono leading-none text-base sm:text-lg flex items-center justify-end gap-1 ${
                          c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur)
                            ? 'text-amber-400 group-hover/price:text-amber-300'
                            : 'text-white group-hover/price:text-amber-400'
                        }`}>
                          <span>{formatPriceWithCurrency(c.priceEur, workspaceSettings.currency)}</span>
                          <Tag className="w-3 h-3 text-zinc-500 group-hover/price:text-amber-400" />
                        </div>
                        {workspaceSettings.currency === 'RON' && (
                          <div className="text-[9.5px] text-zinc-400 font-mono text-right mt-0.5">
                            {c.priceEur.toLocaleString('ro-RO')} €
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Corpul Cardului: Detalii Tehnice, Financiare & Comutator Status Showroom */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  
                  {/* Titlu Mașină, Versiune & Badge Vechime Stoc (Aging) */}
                  <div>
                    <div 
                      onClick={() => onSelectCar(c, 'specs')}
                      className="font-black text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{c.brand} {c.model}</span>
                      <span className="text-xs font-mono font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/05">
                        {c.year}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {c.versionTrim}
                    </div>
                    {/* Badge Vechime Stoc Showroom & Dată Înrolare */}
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      {renderAgingBadge(c)}
                      {c.internalNotes ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAuditDrawerCar(c); }}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 cursor-pointer italic bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"
                          title={`Notă internă: ${c.internalNotes} (Apasă pentru jurnal audit)`}
                        >
                          <FileText className="w-2.5 h-2.5 text-amber-400" />
                          <span className="truncate max-w-[120px]">{c.internalNotes}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAuditDrawerCar(c); }}
                          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          title="Deschide jurnal audit & note interne"
                        >
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Audit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid Telemetrie: 4 specificații esențiale */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Rulaj Real</span>
                      <strong className="font-mono text-white">{formatMileage(c.mileageKm)}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Motor</span>
                      <strong className="text-white">{c.fuelType}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Putere</span>
                      <strong className="text-white">{c.powerHp} CP</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Transmisie</span>
                      <strong className="text-white truncate block">{c.transmission}</strong>
                    </div>
                  </div>

                  {/* Rând Serie Șasiu (VIN) cu Buton Copiere 1-Click */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/06 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-mono text-[10px]">VIN:</span>
                      <span className="font-mono text-zinc-300 font-semibold text-[11px] select-all">
                        {c.vin}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleCopyVin(e, c.vin)}
                      className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copiază seria de șasiu"
                    >
                      {copiedVin === c.vin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Bilanț Financiar & Status OLX */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/05 to-transparent border border-white/05 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Rentabilitate Dealer:</span>
                      {c.purchasePriceEur ? (
                        <button
                          type="button"
                          onClick={() => onSelectCar(c, 'expenses')}
                          className={`font-bold inline-flex items-center gap-1 hover:underline text-xs cursor-pointer ${
                            financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <span>Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} € ({financials.profitMarginPct.toFixed(1)}%)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectCar(c, 'expenses')}
                          className="text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          + Configurează Cost Achiziție
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Sincronizare OLX:</span>
                      {c.olxStatus === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Activ OLX
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Nelinkat</span>
                      )}
                    </div>
                  </div>

                  {/* Comutatorul de Status Showroom pe TOATĂ Lățimea (Zero Coliziune, Touch Ergonomic >= 38px) */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>Status Showroom</span>
                        {renderSyncBadge(c)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {resolveVehicleSyncOrigin(c) === 'local' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishToCloud(c);
                            }}
                            disabled={syncingCarId === c.id}
                            title="Publică vehiculul în Showroom Live pe serverul Netcup"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-300 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {syncingCarId === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Cloud className="w-3 h-3" />
                            )}
                            <span>{syncingCarId === c.id ? 'Se publică...' : 'Publică în Showroom'}</span>
                          </button>
                        )}
                        <span className="text-[10px] text-zinc-500 font-normal">Apasă pentru actualizare</span>
                      </div>
                    </div>
                    <div className="w-full grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'preparing')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'preparing' 
                            ? 'bg-amber-500 text-black shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="În Pregătire (fără poze sau la service, ascunsă din showroom)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'preparing' ? 'bg-black animate-pulse' : 'bg-amber-400'}`} />
                        <span className="truncate">Pregătire</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'in_stock')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'in_stock' 
                            ? 'bg-emerald-500 text-black shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="În Stoc (activă în showroom)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'in_stock' ? 'bg-black animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="truncate">În Stoc</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'reserved')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'reserved' 
                            ? 'bg-amber-600 text-white shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Rezervat (blocată pentru client)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'reserved' ? 'bg-white' : 'bg-amber-400'}`} />
                        <span className="truncate">Rezervat</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'sold')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'sold' 
                            ? 'bg-red-500 text-white shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Vândut (finalizat, mută în arhivă)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'sold' ? 'bg-white' : 'bg-red-400'}`} />
                        <span className="truncate">Vândut</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* 3. Centrul de Comandă & Acțiuni Rapide (Zero Squishing, Ergonomie Mobile-First) */}
                <div className="p-3.5 pt-3 border-t border-white/[0.08] mt-2 flex flex-col gap-2 relative">
                  
                  {/* Rândul 1: Fluxurile de Bază Zilnice (3 Butoane Mari, 100% Lățime, min-h-[42px]) */}
                  <div className="flex items-center gap-2">
                    {/* Buton Principal Fișă Tehnică & Specificații */}
                    <button
                      type="button"
                      onClick={() => onSelectCar(c, 'specs')}
                      className="flex-[1.3] min-h-[42px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Deschide fișa tehnică detaliată a mașinii"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Detalii</span>
                    </button>

                    {/* Buton Documente Oficiale & Contracte Vânzare (PDF) */}
                    <button
                      type="button"
                      onClick={() => onOpenSalesDocs(c)}
                      className="flex-1 min-h-[42px] px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] touch-manipulation cursor-pointer whitespace-nowrap shadow-sm"
                      title="Acte Vânzare: Factură Fiscală (TVA 21% / Regim Marjă), Contract Vânzare, PV Predare și Certificat Garanție"
                    >
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Acte PDF</span>
                    </button>

                    {/* Buton Partajare Fişă WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareCarWhatsApp(c)}
                      className="flex-1 min-h-[42px] px-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] touch-manipulation cursor-pointer whitespace-nowrap shadow-sm"
                      title="Trimite fișa mașinii pe WhatsApp către client"
                    >
                      <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Rândul 2: Instrumente Operaționale & Meniu Extins (Grid 4 Coloane Simetric, min-h-[38px]) */}
                  <div className="grid grid-cols-5 gap-1 card-more-menu-container relative">
                    {/* Buton Comparator Preț Piață */}
                    <button
                      type="button"
                      onClick={() => onOpenComparator(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-blue-500/15 text-zinc-300 hover:text-blue-300 border border-white/[0.08] hover:border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Compară prețul cu piața auto din România"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">Piață</span>
                    </button>

                    {/* Buton Studio Editare Foto (Crop, Reordonare, Plăcuță RXM) */}
                    <button
                      type="button"
                      onClick={() => onOpenGallery?.(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-purple-500/15 text-zinc-300 hover:text-purple-300 border border-white/[0.08] hover:border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Studio Foto: decupare (crop), ștergere, reordonare și plăcuță RXM"
                    >
                      <Images className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Foto</span>
                    </button>

                    {/* Buton Fișă Parbriz A4 (QR) */}
                    <button
                      type="button"
                      onClick={() => onOpenWindowSticker(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Printează Fișa A4 de Parbriz cu cod QR pentru showroom"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Parbriz</span>
                    </button>

                    {/* Buton Editare Anunț Complet (Marcă, Km, Versiune, Preț, etc.) */}
                    <button
                      type="button"
                      onClick={() => onEditCar ? onEditCar(c) : null}
                      className="min-h-[38px] px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/25 hover:border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Editează anunțul: marcă, model, kilometri, versiune, preț, dotări etc."
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Edit</span>
                    </button>

                    {/* Buton Opțiuni Extinse (•••) */}
                    <div className="relative admin-options-menu-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuCarId(openMenuCarId === c.id ? null : c.id);
                        }}
                        className={`w-full min-h-[38px] px-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${
                          openMenuCarId === c.id
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                        }`}
                        title="Alte instrumente și opțiuni operaționale"
                      >
                        <MoreHorizontal className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Opțiuni</span>
                      </button>

                      {/* Popover Meniu Opțiuni (Deschidere deasupra butonului) */}
                      {openMenuCarId === c.id && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full right-0 mb-2 w-56 bg-[#18181c] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] mb-1">
                            Instrumente Vehicul #{stockNum}
                          </div>

                          {/* Editează Anunț Complet (Marcă, Km, Versiune, Preț) */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onEditCar?.(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left border border-amber-500/30 mb-1"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold">Editează Anunț</span>
                              <span className="text-[10px] text-amber-200/70 font-normal">Marcă, km, versiune, preț</span>
                            </div>
                          </button>

                          {/* Modifică Preț Vânzare & TVA 21% */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              setPriceEditCar(c);
                              setIsPriceEditModalOpen(true);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Modifică Preț Vânzare</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Ajustare preț listă & TVA 21%</span>
                            </div>
                          </button>

                          {/* Cheltuieli & Profit Net */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onSelectCar(c, 'expenses');
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Cheltuieli & Profit Net</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Registru costuri și marjă</span>
                            </div>
                          </button>

                          {/* Studio Watermark & Branding */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenBranding(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Watermark & Logo Studio</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Aplicate pe pozele mașinii</span>
                            </div>
                          </button>

                          {/* Jurnal Evenimente & Audit */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              setAuditDrawerCar(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Jurnal Audit & Evenimente</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Istoric modificări și note</span>
                            </div>
                          </button>

                          {/* Sindicare Pod AutoLicit.ro */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenAutolicit ? onOpenAutolicit(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Sindicare Pod AutoLicit</span>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {c.autolicitSync?.isSynced ? 'Activ / Configurat' : 'Publică la licitație sau stoc'}
                              </span>
                            </div>
                          </button>

                          {/* Export Automat pe OLX */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenOlxExport ? onOpenOlxExport(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/olx"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover/olx:scale-110 transition-transform shrink-0" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Exportă pe OLX</span>
                                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">Auto</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pre-completare 1-click & 8 poze</span>
                            </div>
                          </button>

                          {/* Postare Social Media (Meta FB / IG) */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenSocialPost ? onOpenSocialPost(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/social"
                          >
                            <Share2 className="w-4 h-4 text-pink-400 shrink-0 group-hover/social:scale-110 transition-transform" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Postare Social Media</span>
                                <span className="text-[9px] bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded border border-pink-500/30">FB + IG</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pachet foto HD & descriere generată</span>
                            </div>
                          </button>

                          {/* Divider */}
                          <div className="h-px bg-white/[0.08] my-1" />

                          {/* Arhivează Mașină */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (window.confirm(`Sigur dorești să arhivezi mașina ${c.brand} ${c.model}?`)) {
                                onDeleteCar(c.id);
                                showToast(`Mașina ${c.brand} ${c.model} a fost arhivată.`);
                              }
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Arhivează din Stoc</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
  );
};
