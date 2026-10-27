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

export interface InventoryTableViewProps {
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

export const InventoryTableView: React.FC<InventoryTableViewProps> = ({
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
        <>
          {/* 💻 VEDERE TABEL DESKTOP (MD+) */}
          <div className="hidden md:block bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto touch-manipulation scrollbar-thin min-h-[280px]">
            <table className="w-full min-w-[1050px] text-left text-xs text-zinc-300">
              <thead className="bg-white/[0.03] border-b border-white/[0.08] text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  {workspaceSettings.visibleColumns.specs && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[26%] min-w-[230px]`}>
                      Vehicul & Specificații
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.pricing && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[15%] min-w-[125px]`}>
                      Preț & Marjă Profit
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.status && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[15%] min-w-[140px]`}>
                      Status Showroom
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.olx && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[12%] min-w-[100px]`}>
                      Conexiune OLX
                    </th>
                  )}
                  <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[32%] min-w-[360px] text-right sticky right-0 bg-[#16161a] z-10 border-l border-white/10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.6)]`}>
                    Centru Acțiuni Directe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {activeCars.map((c, index) => {
                  const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
                  const financials = calculateVehicleFinancials(c);
                  const stockNum = getStockNumber(c);

                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors group/row ${
                        pendingSale?.carId === c.id 
                          ? 'bg-amber-500/15 border-l-4 border-amber-400' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      
                      {/* Coloana 1: Vehicul, Versiune, Cod Stoc & Specificații Comasate */}
                      {workspaceSettings.visibleColumns.specs && (
                        <td className={workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'}>
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0 group/thumb">
                              {c.images && c.images.length > 0 ? (
                                <img 
                                  src={normalizeCarImageUrl(c.images[0])} 
                                  alt={c.model} 
                                  onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                                  className={`${workspaceSettings.density === 'compact' ? 'w-11 h-8 rounded-lg' : 'w-14 h-10 rounded-xl'} object-cover bg-zinc-800 border border-white/10 group-hover/row:scale-105 transition-transform cursor-pointer shrink-0`} 
                                  title="Deschide galeria foto & editorul de plăcuță RXM"
                                  loading="lazy"
                                />
                              ) : (
                                <div 
                                  onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                                  className={`${workspaceSettings.density === 'compact' ? 'w-11 h-8 rounded-lg' : 'w-14 h-10 rounded-xl'} bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer shrink-0 text-amber-400 group-hover/row:scale-105 transition-transform`}
                                  title="Fără fotografii · Apasă pentru a adăuga poze"
                                >
                                  <Clock className="w-4 h-4 animate-pulse" />
                                </div>
                              )}
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8.5px] font-bold text-zinc-300 pointer-events-none">
                                {c.images.length}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div 
                                onClick={() => onSelectCar(c, 'specs')}
                                className="font-bold text-white text-sm group-hover/row:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 flex-wrap"
                              >
                                <span>{c.brand} {c.model}</span>
                                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded font-bold">
                                  #{stockNum}
                                </span>
                                {renderSyncBadge(c)}
                                <span className="text-zinc-400 font-normal text-xs">• {c.year}</span>
                              </div>
                              <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {c.versionTrim} • {formatMileage(c.mileageKm)} • {c.fuelType} {c.transmission}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-zinc-400">
                                <span>VIN: {c.vin}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyVin(e, c.vin)}
                                  className="text-zinc-500 hover:text-amber-300 p-0.5 cursor-pointer"
                                  title="Copiază serie șasiu"
                                >
                                  {copiedVin === c.vin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              {/* Badge Vechime Stoc Showroom & Dată Înrolare (Ticket 02) */}
                              <div className="mt-1">
                                {renderAgingBadge(c)}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Coloana 2: Preț Vânzare & Marjă Netă */}
                      {workspaceSettings.visibleColumns.pricing && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPriceModal(e, c)}
                              className="group/tblprice inline-flex items-center gap-1 hover:underline cursor-pointer"
                              title="Modifică prețul de vânzare al mașinii / TVA 21%"
                            >
                              <span className={`font-bold text-sm ${c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur) ? 'text-amber-400 font-mono' : 'text-white group-hover/tblprice:text-amber-400'}`}>
                                {formatPriceWithCurrency(c.priceEur, workspaceSettings.currency)}
                              </span>
                              <Tag className="w-3 h-3 text-zinc-500 group-hover/tblprice:text-amber-400" />
                            </button>
                            {workspaceSettings.currency === 'RON' && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({c.priceEur.toLocaleString('ro-RO')} €)
                              </span>
                            )}
                            {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                              <>
                                <span className="text-[11px] text-zinc-400 line-through font-mono">
                                  {formatPriceWithCurrency(c.oldPriceEur, workspaceSettings.currency)}
                                </span>
                                <span className="text-[9.5px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.5 rounded font-mono">
                                  -{formatPriceWithCurrency(c.oldPriceEur - c.priceEur, workspaceSettings.currency)}
                                </span>
                              </>
                            )}
                          </div>
                          {c.purchasePriceEur ? (
                            <button
                              type="button"
                              onClick={() => onSelectCar(c, 'expenses')}
                              className={`text-[10.5px] font-bold mt-0.5 inline-flex items-center gap-1 hover:underline cursor-pointer ${
                                financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                              title="Deschide registrul de cheltuieli"
                            >
                              <span>Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} € ({financials.profitMarginPct.toFixed(1)}%)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectCar(c, 'expenses')}
                              className="text-[10.5px] text-amber-400/90 hover:text-amber-300 transition-colors mt-0.5 block font-semibold cursor-pointer"
                              title="Adaugă preț achiziție și cheltuieli"
                            >
                              + Calculează Profit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleVatDeductible ? onToggleVatDeductible(c.id) : null}
                            className={`mt-1 px-2 py-0.5 rounded text-[9.5px] font-bold border transition-all inline-flex items-center gap-1 cursor-pointer touch-manipulation active:scale-95 ${
                              c.vatDeductible
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                                : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
                            }`}
                            title={c.vatDeductible ? "Apasă pentru a comuta în Regim Marjă (TVA Nedeductibil)" : "Apasă pentru a activa TVA Deductibil (21%)"}
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{c.vatDeductible ? '✓ TVA Deductibil (21%)' : 'Regim Marjă (Nedeductibil)'}</span>
                          </button>
                        </td>
                      )}

                      {/* Coloana 3: Status Showroom Selector */}
                      {workspaceSettings.visibleColumns.status && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          {pendingSale?.carId === c.id ? (
                            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                              <span className="font-bold text-[10px] font-mono">
                                Vândut {pendingSale.soldPriceEur ? `${pendingSale.soldPriceEur.toLocaleString('ro-RO')} € ` : ''}({pendingSale.countdown}s)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCancelPendingSale(); }}
                                className="px-2 py-0.5 rounded-lg bg-black/70 hover:bg-black text-white text-[9.5px] font-extrabold border border-white/20 transition-all cursor-pointer shadow-sm"
                                title="Anulează marcarea ca vândut"
                              >
                                Undo
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleConfirmPendingSaleNow(); }}
                                className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[9.5px] font-black transition-all cursor-pointer shadow-sm"
                                title="Confirmă acum"
                              >
                                Confirmă
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex rounded-xl border border-white/10 p-0.5 bg-black/50">
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'preparing')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'preparing' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                                title="În Pregătire (fără poze, ascunsă din site)"
                              >
                                Pregătire
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'in_stock')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'in_stock' ? 'bg-emerald-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                În Stoc
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'reserved')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'reserved' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Rezervat
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'sold')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'sold' ? 'bg-red-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Vândut
                              </button>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Coloana 4: Conexiune OLX */}
                      {workspaceSettings.visibleColumns.olx && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          {discrepancy === 'sold_but_active_on_olx' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Activ OLX (Vândută!)</span>
                            </span>
                          ) : discrepancy === 'in_stock_but_gone_on_olx' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Inactiv pe OLX</span>
                            </span>
                          ) : c.olxStatus === 'active' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>OLX Activ</span>
                              </span>
                              {c.olxUrl && (
                                <a
                                  href={c.olxUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                  title="Deschide anunțul pe OLX"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Fără Link OLX</span>
                          )}
                        </td>
                      )}

                      {/* Coloana 5: Centru Acțiuni Directe (STICKY RIGHT - Dual-Tier Ergonomic & Zero Scroll) */}
                      <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5'} text-right whitespace-nowrap sticky right-0 bg-[#121215] group-hover/row:bg-[#18181d] transition-colors ${openMenuCarId === c.id ? 'z-30' : 'z-10'} border-l border-white/10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.6)]`}>
                        <div className="flex flex-col gap-1.5 items-end justify-center">
                          
                          {/* Rândul 1 (Tier 1): Workflow Principal Tranzacțional & Client (Highlight, Fișă Detalii, Acte PDF, WhatsApp) */}
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Buton Ofertă Săptămânii */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDealModal(e, c)}
                              className={`min-h-[28px] min-w-[28px] p-1 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                                c.isDealOfWeek
                                  ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                                  : 'bg-white/5 text-zinc-400 hover:text-amber-300 border-white/10'
                              }`}
                              title={c.isDealOfWeek ? 'Oferta Săptămânii activă (apasă pentru setare prețuri & detalii)' : 'Configurează ca Ofertă a Săptămânii'}
                            >
                              <Flame className={`w-3.5 h-3.5 ${c.isDealOfWeek ? 'fill-black' : ''}`} />
                            </button>

                            {/* Buton Pin Hero Spotlight */}
                            <button
                              type="button"
                              onClick={() => onTogglePinHero(c.id)}
                              className={`min-h-[28px] min-w-[28px] p-1 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                                c.isHeroPinned
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                                  : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                              }`}
                              title={c.isHeroPinned ? 'Fixat în Hero Spotlight (Apasă pentru anulare)' : 'Fixează în Hero Spotlight (Pin)'}
                            >
                              <Star className={`w-3.5 h-3.5 ${c.isHeroPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                            </button>

                            {/* Buton Principal Detalii (CTA Amber de impact) */}
                            <button 
                              type="button"
                              onClick={() => onSelectCar(c, 'specs')}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                              title="Deschide fișa completă a mașinii"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Detalii</span>
                            </button>

                            {/* Buton Documente Vânzare & Garanție (PDF) */}
                            <button
                              type="button"
                              onClick={() => onOpenSalesDocs(c)}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Acte Vânzare, Garanție & Proces-Verbal (Export PDF / Print)"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>Acte PDF</span>
                            </button>

                            {/* Buton Partajare WhatsApp Stoc */}
                            <button
                              type="button"
                              onClick={() => handleShareCarWhatsApp(c)}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Trimite fișa mașinii pe WhatsApp către client"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                              <span>WA</span>
                            </button>
                          </div>

                          {/* Rândul 2 (Tier 2): Instrumente Operaționale & Meniu Extins (Compară, Foto, Parbriz, Opțiuni •••) */}
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Buton Compară Preț */}
                            <button 
                              type="button"
                              onClick={() => onOpenComparator(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Compară prețul cu piața auto"
                            >
                              <BarChart3 className="w-3 h-3 text-blue-400 shrink-0" />
                              <span>Compară</span>
                            </button>

                            {/* Buton Studio Editare Foto */}
                            <button
                              type="button"
                              onClick={() => onOpenGallery?.(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Studio Editare Foto (Crop, Ștergere, Plăcuță RXM, Rotire)"
                            >
                              <Images className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>Foto</span>
                            </button>

                            {/* Buton Fișă Parbriz A4 (QR Code) */}
                            <button
                              type="button"
                              onClick={() => onOpenWindowSticker(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Fișă Parbriz A4 (QR Code)"
                            >
                              <QrCode className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>Parbriz</span>
                            </button>

                            {/* Buton Editare Anunț */}
                            <button 
                              type="button"
                              onClick={() => onEditCar?.(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Editează anunțul complet (marcă, km, versiune, preț, etc.)"
                            >
                              <Edit3 className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Edit</span>
                            </button>

                            {/* Buton Opțiuni Extinse (•••) */}
                            <div className="relative admin-options-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuCarId(openMenuCarId === c.id ? null : c.id);
                                }}
                                className={`min-h-[26px] px-2 py-0.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                  openMenuCarId === c.id
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/20'
                                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
                                }`}
                                title="Alte instrumente și opțiuni operaționale"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
                                <span>Opțiuni</span>
                              </button>

                              {/* Popover Meniu Opțiuni (Deschidere contextuală sus sau jos în funcție de poziția în tabel) */}
                              {openMenuCarId === c.id && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 ${
                                    index < 2 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                  } w-56 bg-[#18181c] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl text-left`}
                                >
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] mb-1">
                                    Instrumente Vehicul #{stockNum}
                                  </div>

                                  {/* Editează Anunț Complet */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onEditCar?.(c);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left border border-amber-500/30 mb-1"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <span>Jurnal Audit & Evenimente</span>
                                        {((c.auditLog && c.auditLog.length > 0) || c.internalNotes) && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        )}
                                      </div>
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/olx"
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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/social"
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

                                  {/* ☁️ Publică în Showroom Live pe Serverul Netcup */}
                                  {resolveVehicleSyncOrigin(c) === 'local' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuCarId(null);
                                        handlePublishToCloud(c);
                                      }}
                                      disabled={syncingCarId === c.id}
                                      className="w-full px-2.5 py-1.5 rounded-xl hover:bg-sky-500/10 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/cloud"
                                    >
                                      {syncingCarId === c.id ? (
                                        <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 animate-spin" />
                                      ) : (
                                        <Cloud className="w-4 h-4 text-sky-400 shrink-0 group-hover/cloud:scale-110 transition-transform" />
                                      )}
                                      <div className="flex flex-col">
                                        <span className="flex items-center gap-1.5">
                                          <span>Publică în Showroom</span>
                                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">Live Sync</span>
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-normal">Sincronizează datele și pozele în baza de date</span>
                                      </div>
                                    </button>
                                  )}

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
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span>Arhivează din Stoc</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 VEDERE TABULARĂ COMPACTĂ MOBIL (SUB MD) */}
        <div className="block md:hidden space-y-2.5">
          {activeCars.map((c) => {
            const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
            const financials = calculateVehicleFinancials(c);
            const stockNum = getStockNumber(c);

            return (
              <div 
                key={`mobile-row-${c.id}`}
                className={`relative bg-[#121215] border rounded-2xl p-3 shadow-lg transition-all flex flex-col gap-2.5 group ${
                  pendingSale?.carId === c.id 
                    ? 'border-amber-400 shadow-amber-500/20 ring-2 ring-amber-400/40 bg-amber-500/05' 
                    : 'border-white/[0.08] hover:border-amber-400/30'
                }`}
              >
                {/* ⏱ Overlay Perioadă de Grație 10s (Pending Sale & Undo) */}
                {pendingSale?.carId === c.id && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm rounded-2xl border border-amber-500/80 p-3 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="text-white font-bold text-xs truncate">
                          Marcat Vândut {pendingSale.soldPriceEur ? `${pendingSale.soldPriceEur.toLocaleString('ro-RO')} €` : ''}
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          Finalizare în {pendingSale.countdown}s
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCancelPendingSale()}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer touch-manipulation active:scale-95"
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmPendingSaleNow()}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer touch-manipulation active:scale-95"
                      >
                        Confirmă
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Secțiune Principală: Thumbnail + Denumire + An/Km + Preț */}
                <div className="flex items-start gap-2.5">
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    {c.images && c.images.length > 0 ? (
                      <img 
                        src={normalizeCarImageUrl(c.images[0])} 
                        alt={c.model} 
                        onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                        className="w-16 h-12 rounded-xl object-cover bg-zinc-800 border border-white/10 cursor-pointer shrink-0" 
                        title="Deschide galeria foto"
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                        className="w-16 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer shrink-0 text-amber-400"
                      >
                        <Clock className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8.5px] font-bold text-zinc-300 pointer-events-none">
                      {c.images.length}
                    </span>
                  </div>

                  {/* Detalii Autoturism */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div 
                        onClick={() => onSelectCar(c, 'specs')}
                        className="font-bold text-white text-xs truncate cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5"
                      >
                        <span className="truncate">{c.brand} {c.model}</span>
                        <span className="text-[9.5px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1 py-0.2 rounded font-bold shrink-0">
                          #{stockNum}
                        </span>
                      </div>
                      {/* Preț */}
                      <div className="text-right shrink-0">
                        <span className={`font-black text-xs sm:text-sm font-mono ${c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur) ? 'text-amber-400' : 'text-white'}`}>
                          {c.priceEur.toLocaleString('ro-RO')} €
                        </span>
                        {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                          <div className="text-[9px] text-zinc-400 line-through font-mono">
                            {c.oldPriceEur.toLocaleString('ro-RO')} €
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specificații */}
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {c.year} • {formatMileage(c.mileageKm)} • {c.fuelType} • {c.transmission}
                    </div>

                    {/* VIN cu Copiere & Marjă */}
                    <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-zinc-400">
                        <span>VIN: {c.vin.slice(0, 10)}...</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyVin(e, c.vin)}
                          className="text-zinc-500 hover:text-amber-300 p-0.5 cursor-pointer touch-manipulation"
                          title="Copiază VIN"
                        >
                          {copiedVin === c.vin ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {c.purchasePriceEur ? (
                          <button
                            type="button"
                            onClick={() => onSelectCar(c, 'expenses')}
                            className={`text-[9.5px] font-bold hover:underline cursor-pointer ${
                              financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectCar(c, 'expenses')}
                            className="text-[9.5px] text-amber-400 hover:underline cursor-pointer font-semibold"
                          >
                            + Marjă
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleVatDeductible ? onToggleVatDeductible(c.id) : null}
                          className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border transition-all cursor-pointer ${
                            c.vatDeductible
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.04] text-zinc-400 border-white/10'
                          }`}
                        >
                          {c.vatDeductible ? 'TVA 21%' : 'Marjă'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Rândul de Status Showroom & OLX */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06] flex-wrap">
                  {/* Selector Status */}
                  <div className="inline-flex rounded-xl border border-white/10 p-0.5 bg-black/40">
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'preparing')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'preparing' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pregătire
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'in_stock')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'in_stock' ? 'bg-emerald-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      În Stoc
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'reserved')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'reserved' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Rezervat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'sold')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'sold' ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Vândut
                    </button>
                  </div>

                  {/* Vechime Stoc & OLX */}
                  <div className="flex items-center gap-1.5">
                    {renderAgingBadge(c)}
                    {discrepancy === 'sold_but_active_on_olx' ? (
                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md">
                        Activ OLX (Vândută!)
                      </span>
                    ) : discrepancy === 'in_stock_but_gone_on_olx' ? (
                      <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-md">
                        Inactiv OLX
                      </span>
                    ) : c.olxStatus === 'active' ? (
                      <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> OLX
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 3. Bară de Acțiuni Ergonomică pentru Mobil */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06]">
                  {/* Toggles rapide (Deal + Pin Hero) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenDealModal(e, c)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                        c.isDealOfWeek
                          ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-amber-300 border-white/10'
                      }`}
                      title={c.isDealOfWeek ? 'Oferta Săptămânii activă' : 'Setează Ofertă a Săptămânii'}
                    >
                      <Flame className={`w-3.5 h-3.5 ${c.isDealOfWeek ? 'fill-black' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePinHero(c.id)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                        c.isHeroPinned
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                      }`}
                      title={c.isHeroPinned ? 'Fixat în Hero Spotlight' : 'Fixează în Hero Spotlight'}
                    >
                      <Star className={`w-3.5 h-3.5 ${c.isHeroPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Acțiuni Primare: Detalii, Acte, WA, Opțiuni ••• */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectCar(c, 'specs')}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                      title="Deschide fișa completă a mașinii"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Detalii</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSalesDocs(c)}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Acte Vânzare & Garanție PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Acte</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareCarWhatsApp(c)}
                      className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 inline-flex items-center justify-center touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Trimite pe WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    </button>

                    {/* Dropdown Meniu Extins (•••) */}
                    <div className="relative admin-options-menu-container">
                      <button
                        type="button"
                        onClick={() => setOpenMenuCarId(openMenuCarId === `m-opt-${c.id}` ? null : `m-opt-${c.id}`)}
                        className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border inline-flex items-center justify-center touch-manipulation active:scale-95 transition-all cursor-pointer ${
                          openMenuCarId === `m-opt-${c.id}`
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                        }`}
                        title="Mai multe instrumente"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openMenuCarId === `m-opt-${c.id}` && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-2xl bg-[#16161a] border border-white/15 shadow-2xl p-1.5 z-50 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/[0.08]">
                            Instrumente Avansate
                          </div>

                          {/* Compară Preț */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenComparator(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Comparator Preț Piață</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Analiză preț mediu</span>
                            </div>
                          </button>

                          {/* Studio Foto */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (onOpenGallery) onOpenGallery(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Images className="w-4 h-4 text-purple-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Studio Foto & Galerie</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Crop, Plăcuță RXM, Rotire</span>
                            </div>
                          </button>

                          {/* Studio Plăcuțe RXM */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (onOpenPlateStudio) onOpenPlateStudio(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Studio Plăcuțe & Logo</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Aplică numere negre RXM</span>
                            </div>
                          </button>

                          {/* Fișă Parbriz A4 */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenWindowSticker(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Fișă Parbriz QR A4</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Flyer prezentare pentru geam</span>
                            </div>
                          </button>

                          {/* Deschide pe OLX */}
                          {c.olxUrl && (
                            <a
                              href={c.olxUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuCarId(null)}
                              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                              <div className="flex flex-col">
                                <span>Deschide Anunț OLX</span>
                                <span className="text-[10px] text-zinc-400 font-normal">Vezi pagina publică</span>
                              </div>
                            </a>
                          )}

                          {/* Sindicare AutoLicit */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenAutolicit ? onOpenAutolicit(c) : null;
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/10 text-zinc-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Sindicare Pod AutoLicit</span>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {c.autolicitSync?.isSynced ? 'Activ / Configurat' : 'Publică la licitație'}
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
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Exportă pe OLX</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pre-completare 1-click</span>
                            </div>
                          </button>

                          {/* Postare Social Media */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenSocialPost ? onOpenSocialPost(c) : null;
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Share2 className="w-4 h-4 text-pink-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Postare Social Media</span>
                                <span className="text-[9px] bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded border border-pink-500/30">FB + IG</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pachet foto & descriere</span>
                            </div>
                          </button>

                          {/* Export Permanent Git */}
                          {onOpenSeedExporter && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuCarId(null);
                                onOpenSeedExporter(c);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/10 text-zinc-200 hover:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                            >
                              <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="flex flex-col">
                                <span>Export Permanent Git</span>
                                <span className="text-[10px] text-zinc-400 font-normal">WebP HD & Seed TypeScript</span>
                              </div>
                            </button>
                          )}

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
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
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
      </>
  );
};
