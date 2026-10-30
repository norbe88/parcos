import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Printer, Gauge, Calculator, Play, Calendar, 
  Phone, MessageCircle, Mail, Tag, Copy, DollarSign, Building2, Clock, Edit3
} from 'lucide-react';
import { VehicleItem, SEED_DEALER, VehicleExpenseItem } from '../../db/seed';
import { 
  calculateRate, 
  getStockNumber, 
  getWhatsAppCarInquiryUrl, 
  getWhatsAppTestDriveUrl,
  isTikTokVideoUrl 
} from '../../utils/helpers';

// Subcomponente Tab-uri Modal
import { DetailGallery } from './vehicle-detail/DetailGallery';
import { DetailSpecsTab } from './vehicle-detail/DetailSpecsTab';
import { DetailFinanceTab } from './vehicle-detail/DetailFinanceTab';
import { DetailVideoTab } from './vehicle-detail/DetailVideoTab';
import { DetailTestDriveTab } from './vehicle-detail/DetailTestDriveTab';
import { DetailExpensesTab } from './vehicle-detail/DetailExpensesTab';
import { DetailDeadlinesTab } from './vehicle-detail/DetailDeadlinesTab';
import { SocialShareButtons } from '../common/SocialShareButtons';
import { IntellectualPropertyDisclaimer } from '../common/IntellectualPropertyDisclaimer';
import { recordIncomingLead } from '../../services/leadService';
import { sendVehicleViewBeacon } from '../../services/telemetryService';
import { useAntiScreenCapture } from '../../hooks/useAntiScreenCapture';

interface VehicleDetailModalProps {
  selectedCar: VehicleItem | null;
  initialTab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines';
  initialVideoFormat?: 'tiktok' | 'youtube';
  onClose: () => void;
  onPrint: () => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
  viewMode?: 'showroom' | 'admin';
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  onDeleteExpense?: (carId: string, expenseId: string) => void;
  onUpdatePurchasePrice?: (carId: string, purchasePriceEur: number) => void;
  onUpdateSaleInfo?: (carId: string, soldPriceEur: number, soldAt?: string) => void;
  onUpdateVehicleDeadlines?: (
    carId: string, 
    deadlines: {
      hasRedPlates?: boolean;
      redPlatesExpiresAt?: string;
      itpExpiresAt?: string;
      rarAppointmentDate?: string;
    }
  ) => void;
  onToggleVatDeductible?: (carId: string) => void;
  onUpdateDescription?: (carId: string, description: string) => void;
  onEditCar?: (car: VehicleItem) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  selectedCar,
  initialTab = 'specs',
  initialVideoFormat = 'tiktok',
  onClose,
  onPrint,
  showToast,
  dealer = SEED_DEALER,
  viewMode = 'showroom',
  onAddExpense,
  onDeleteExpense,
  onUpdatePurchasePrice,
  onUpdateSaleInfo,
  onUpdateVehicleDeadlines,
  onToggleVatDeductible,
  onUpdateDescription,
  onEditCar
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines'>(initialTab);
  const [videoFormat, setVideoFormat] = useState<'tiktok' | 'youtube'>(initialVideoFormat);

  // Stare Calculator Finanțare Modal Mașină
  const [advancePercent, setAdvancePercent] = useState<number>(15);
  const [periodMonths, setPeriodMonths] = useState<number>(48);

  // Stare Programare Test Drive la Showroom
  const [tdDate, setTdDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [tdTimeSlot, setTdTimeSlot] = useState('11:00 - 12:30');
  const [tdName, setTdName] = useState('');
  const [tdPhone, setTdPhone] = useState('');
  const [tdGdprConsent, setTdGdprConsent] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resetare tab și index imagine la schimbarea autovehiculului sau a tabului inițial + telemetrie vizualizare
  const currentCarId = selectedCar?.id;
  useEffect(() => {
    if (currentCarId) {
      setActiveImageIdx(0);
      setActiveTab(initialTab);
      setVideoFormat(initialVideoFormat);
      setTdGdprConsent(false);

      // 📡 Telemetrie vizualizare showroom pasivă non-blocantă (Wave 2) — exclus modul admin
      if (viewMode !== 'admin') {
        sendVehicleViewBeacon(currentCarId, dealer?.slug || selectedCar?.dealerSlug);
      }
    }
  }, [currentCarId, initialTab, initialVideoFormat, viewMode, dealer?.slug, selectedCar?.dealerSlug]);

  // Scroll fluid la începutul conținutului la schimbarea tabului
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // 🔒 Lock background scroll pe body când modalul este deschis (previne rubber-banding pe iOS Safari)
  useEffect(() => {
    if (!selectedCar) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedCar]);

  // ⌨️ Închidere accesibilă la tasta Escape (Desktop / PC)
  useEffect(() => {
    if (!selectedCar) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [selectedCar, onClose]);

  // Scut de protecție anti-screenshot & curățare clipboard când modalul este deschis
  useAntiScreenCapture({
    enabled: !!selectedCar,
    onCaptureAttempt: (msg) => showToast(msg),
    blurOnFocusLoss: false // Gestionat granular pe componentele foto DetailGallery și PhotoLightboxModal
  });

  if (!selectedCar) return null;

  const stockRef = getStockNumber(selectedCar);
  const currentRate = calculateRate(selectedCar.priceEur, advancePercent, periodMonths);
  const netPriceEur = Math.round(selectedCar.priceEur / 1.21);
  const vatAmountEur = selectedCar.priceEur - netPriceEur;

  // Handler Programare Test Drive la Showroom
  const handleTestDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tdPhone) {
      showToast('⚠️ Vă rugăm să introduceți numărul de telefon pentru confirmare.');
      return;
    }
    if (!tdGdprConsent) {
      showToast('⚠️ Vă rugăm să bifați acordul privind prelucrarea datelor cu caracter personal.');
      return;
    }

    // Salvare automată a oportunității în CRM persistent pentru recontactare
    recordIncomingLead({
      clientName: tdName || 'Client Showroom',
      clientPhone: tdPhone,
      dealType: 'cash',
      source: 'showroom_web',
      carId: selectedCar.id,
      carTitle: `${selectedCar.brand} ${selectedCar.model}`,
      carPriceEur: selectedCar.priceEur,
      notes: `Test Drive solicitat pentru ${selectedCar.brand} ${selectedCar.model} [Ref: ${stockRef}]. Data: ${tdDate}, Slot: ${tdTimeSlot}.`,
      scheduledTestDriveAt: `${tdDate} ${tdTimeSlot}`,
    });

    const waUrl = getWhatsAppTestDriveUrl(
      selectedCar,
      dealer.whatsappNumber,
      tdDate,
      tdTimeSlot,
      tdName || 'Client Showroom',
      tdPhone
    );

    window.open(waUrl, '_blank');
    showToast(`✅ Programarea pentru Test Drive (${selectedCar.brand} ${selectedCar.model} - Ref: ${stockRef}) a fost salvată și deschisă pe WhatsApp!`);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-0 sm:p-4 md:p-6 flex sm:items-center sm:justify-center overflow-hidden no-print"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalii vehicul ${selectedCar.brand} ${selectedCar.model}`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121215] sm:border border-white/[0.12] text-white w-full max-w-4xl sm:rounded-2xl shadow-2xl relative flex flex-col h-full sm:h-auto max-h-[100vh] max-h-[100dvh] sm:max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        
        {/* Bară de tragere / Închidere rapidă pe mobil */}
        <div 
          onClick={onClose}
          className="sm:hidden pt-2 pb-1 flex justify-center items-center cursor-pointer touch-manipulation group bg-[#121215]"
          title="Apasă pentru a închide fereastra"
          aria-label="Închide fereastra detaliilor"
        >
          <div className="w-12 h-1 rounded-full bg-white/25 group-hover:bg-amber-400 group-active:scale-95 transition-all" />
        </div>

        {/* Header Sticky al Modalului — Optimizat Mobile-First & Safe Area */}
        <div className="sticky top-0 z-30 bg-[#121215]/95 backdrop-blur-md border-b border-white/[0.08] px-3.5 sm:px-6 pt-2 sm:pt-3.5 pb-2.5 sm:pb-3.5 flex-shrink-0">
          {/* Mobile Header Layout (< sm) */}
          <div className="sm:hidden space-y-2">
            {/* Rândul 1 Mobil: Tag & Ref în stânga, Butoane Acțiune în dreapta */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase truncate">
                  {selectedCar.brand} • {selectedCar.bodyType} • {selectedCar.year}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold shrink-0">
                  <Tag className="w-2.5 h-2.5 text-amber-400" />
                  {stockRef}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(stockRef);
                    showToast(`Codul ${stockRef} a fost copiat!`);
                  }}
                  className="text-[9px] text-zinc-400 hover:text-amber-300 inline-flex items-center gap-0.5 font-mono p-1 transition-colors cursor-pointer touch-manipulation"
                  title="Copiază codul de stoc"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  type="button"
                  onClick={onPrint}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-amber-300 flex items-center justify-center border border-white/10 touch-manipulation cursor-pointer"
                  title="Tipărește fișa PDF a mașinii"
                  aria-label="Tipărește fișa PDF a mașinii"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                </button>

                {viewMode === 'admin' && onEditCar && (
                  <button 
                    type="button"
                    onClick={() => onEditCar(selectedCar)}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 flex items-center justify-center border border-amber-500/30 touch-manipulation cursor-pointer"
                    title="Editează acest anunț"
                    aria-label="Editează acest anunț"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                <button 
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-zinc-300 hover:text-white transition-all flex items-center justify-center touch-manipulation cursor-pointer border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  title="Închide fereastra detaliilor (Escape)"
                  aria-label="Închide fereastra detaliilor mașinii"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rândul 2 Mobil: Titlu mașină complet în stânga + Preț mare în dreapta */}
            <div className="flex items-start justify-between gap-3 pt-0.5">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-serif font-bold text-white tracking-tight leading-snug">
                  {selectedCar.brand} {selectedCar.model}
                </h2>
                {selectedCar.versionTrim && (
                  <p className="text-[11px] text-zinc-400 font-medium line-clamp-1 mt-0.5">
                    {selectedCar.versionTrim}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl font-black text-amber-400 font-mono leading-none">
                  {selectedCar.priceEur.toLocaleString('ro-RO')} €
                </div>
                <div className="text-[9.5px] text-zinc-400 mt-1 font-medium">
                  {selectedCar.vatDeductible ? (
                    <span className="text-emerald-400 font-bold">TVA Deductibil 21%</span>
                  ) : (
                    'Preț Final • Regim Marjă'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header Layout (>= sm) */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-amber-400 font-bold tracking-wider uppercase">
                  {selectedCar.brand} • {selectedCar.bodyType} • An {selectedCar.year}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                  <Tag className="w-2.5 h-2.5 text-amber-400" />
                  Ref: {stockRef}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(stockRef);
                    showToast(`Codul ${stockRef} a fost copiat în clipboard!`);
                  }}
                  className="text-[10px] text-zinc-400 hover:text-amber-300 inline-flex items-center gap-0.5 font-mono transition-colors cursor-pointer"
                  title="Copiază codul de stoc"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copiază</span>
                </button>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
                  {selectedCar.brand} {selectedCar.model}
                </h2>
                {selectedCar.versionTrim && (
                  <span className="text-xs text-zinc-400 font-medium">
                    {selectedCar.versionTrim}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-black text-white font-mono leading-none">
                  {selectedCar.priceEur.toLocaleString('ro-RO')} €
                </div>
                <div className="text-xs mt-0.5">
                  {selectedCar.vatDeductible ? (
                    <span className="text-emerald-400 font-bold">TVA Deductibil 21%</span>
                  ) : (
                    <span className="text-zinc-400">Preț Final (Regim Marjă - fără TVA adăugat)</span>
                  )}
                </div>
              </div>

              {viewMode === 'admin' && onEditCar && (
                <button 
                  type="button"
                  onClick={() => onEditCar(selectedCar)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all border border-amber-500/30 touch-manipulation cursor-pointer shadow-sm"
                  title="Editează anunțul complet (marcă, km, versiune, preț, dotări, etc.)"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editează Anunț</span>
                </button>
              )}

              <button 
                type="button"
                onClick={onPrint}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all border border-white/10 touch-manipulation cursor-pointer"
                title="Tipărește sau salvează fișa mașinii în format PDF"
                aria-label="Tipărește fișa PDF a mașinii"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">PDF</span>
              </button>

              <button 
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-zinc-300 hover:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400"
                title="Închide fereastra detaliilor (Escape)"
                aria-label="Închide fereastra detaliilor mașinii"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Corp Scrollabil Modal */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 flex-1 overscroll-contain pb-[calc(env(safe-area-inset-bottom,16px)+6rem)] sm:pb-[calc(env(safe-area-inset-bottom,16px)+2rem)]"
        >

          {/* Slider Foto Mare (ascuns în modul Video pentru ca playerul TikTok să fie imediat vizibil la deschidere) */}
          {activeTab !== 'video' && (
            <>
              <DetailGallery 
                images={selectedCar.images}
                model={`${selectedCar.brand} ${selectedCar.model}`}
                activeImageIdx={activeImageIdx}
                setActiveImageIdx={setActiveImageIdx}
                stockNumber={stockRef}
              />

              {/* 🏢 Banner Fiscal B2B Oportunitate Firmă vs Comutator Admin */}
              {selectedCar.vatDeductible ? (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-emerald-900/30 to-black/80 border border-emerald-500/30 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Oportunitate Firmă: Factură Fiscală cu TVA Deductibil (21%)
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-emerald-300/90 mt-0.5">
                          Deductibilitate fiscală pentru persoane juridice (SRL/SA/PFA) prin transfer bancar sau leasing financiar.
                        </p>
                      </div>
                    </div>
                    {viewMode === 'admin' && onToggleVatDeductible && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleVatDeductible(selectedCar.id);
                          showToast(`Regimul TVA pentru ${selectedCar.brand} ${selectedCar.model} a fost comutat!`);
                        }}
                        className="self-start sm:self-auto min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 shrink-0"
                        title="Comută regimul TVA pentru acest vehicul"
                      >
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Comută pe Marjă</span>
                      </button>
                    )}
                  </div>

                  {/* Grile de calcul Net / TVA 21% / Brut */}
                  <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-black/50 border border-white/5">
                      <span className="text-[9.5px] sm:text-[10.5px] text-zinc-400 uppercase tracking-wider block font-medium">Preț Net</span>
                      <strong className="text-xs sm:text-base font-mono text-zinc-100 font-bold">{netPriceEur.toLocaleString('ro-RO')} €</strong>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-black/50 border border-white/5">
                      <span className="text-[9.5px] sm:text-[10.5px] text-emerald-400 uppercase tracking-wider block font-medium">TVA 21%</span>
                      <strong className="text-xs sm:text-base font-mono text-emerald-300 font-bold">{vatAmountEur.toLocaleString('ro-RO')} €</strong>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-black/50 border border-white/5">
                      <span className="text-[9.5px] sm:text-[10.5px] text-amber-400 uppercase tracking-wider block font-medium">Preț Brut</span>
                      <strong className="text-xs sm:text-base font-mono text-amber-300 font-bold">{selectedCar.priceEur.toLocaleString('ro-RO')} €</strong>
                    </div>
                  </div>
                </div>
              ) : (
                viewMode === 'admin' && onToggleVatDeductible && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-zinc-400">Regim fiscal curent:</span>
                      <span className="font-semibold text-zinc-200">Regim Special de Marjă (Art. 312 Cod Fiscal - fără TVA adăugat)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleVatDeductible(selectedCar.id);
                        showToast(`TVA Deductibil (21%) a fost activat pentru ${selectedCar.brand} ${selectedCar.model}!`);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation active:scale-95 self-start sm:self-auto"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Activează TVA Deductibil (21%)</span>
                    </button>
                  </div>
                )
              )}
            </>
          )}

          {/* Taburi Modal: Specificații | Calculator Finanțare | Video TikTok | Test Drive (Dispunere Multi-Rând, Fără Scroll Orizontal) */}
          <div className="border-t border-white/[0.08] pt-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs font-semibold">
              <button 
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                  activeTab === 'specs' 
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 border-amber-400' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
              >
                <Gauge className={`w-4 h-4 shrink-0 ${activeTab === 'specs' ? 'text-black' : 'text-amber-400'}`} />
                <span>Specificații & Dotări</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setActiveTab('finance')}
                className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                  activeTab === 'finance' 
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 border-amber-400' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
              >
                <Calculator className={`w-4 h-4 shrink-0 ${activeTab === 'finance' ? 'text-black' : 'text-amber-400'}`} />
                <span>Calculator Rate</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setActiveTab('video');
                  if (isTikTokVideoUrl(selectedCar.tiktokUrl)) setVideoFormat('tiktok');
                  else if (selectedCar.videoUrl && !selectedCar.videoUrl.includes('ysz5S6PUM-U')) setVideoFormat('youtube');
                }}
                className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                  activeTab === 'video' 
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 border-amber-400' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
              >
                <Play className={`w-4 h-4 shrink-0 ${activeTab === 'video' ? 'fill-black text-black' : 'fill-[#fe2c55] text-[#fe2c55]'}`} />
                <span>Video TikTok</span>
                {selectedCar.tiktokViews && isTikTokVideoUrl(selectedCar.tiktokUrl) ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    activeTab === 'video' ? 'bg-black/20 text-black' : 'bg-[#fe2c55]/20 text-[#fe2c55]'
                  }`}>
                    {selectedCar.tiktokViews}
                  </span>
                ) : isTikTokVideoUrl(selectedCar.tiktokUrl) ? (
                  <span className={`w-2 h-2 rounded-full ${activeTab === 'video' ? 'bg-black' : 'bg-[#fe2c55]'} animate-pulse`} />
                ) : null}
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('testdrive')}
                className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                  activeTab === 'testdrive' 
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 border-amber-400' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'testdrive' ? 'text-black' : 'text-amber-400'}`} />
                <span>Test Drive Cluj</span>
              </button>

              {/* 🔐 Tab Dealer Exclusiv: Cheltuieli & Calcul Profit */}
              {viewMode === 'admin' && (
                <button 
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className={`col-span-2 sm:col-auto min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                    activeTab === 'expenses' 
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 border-emerald-400' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 hover:text-white border-emerald-500/25'
                  }`}
                >
                  <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'expenses' ? 'text-black' : 'text-emerald-400'}`} />
                  <span>Cheltuieli & Profit</span>
                  {selectedCar.expenses && selectedCar.expenses.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      activeTab === 'expenses' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedCar.expenses.length}
                    </span>
                  )}
                </button>
              )}

              {/* 🔐 Tab Dealer Exclusiv: Termene Parc & Numere Roșii */}
              {viewMode === 'admin' && (
                <button 
                  type="button"
                  onClick={() => setActiveTab('deadlines')}
                  className={`col-span-2 sm:col-auto min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center touch-manipulation active:scale-[0.98] border ${
                    activeTab === 'deadlines' 
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 border-amber-400' 
                      : 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 hover:text-white border-amber-500/25'
                  }`}
                >
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'deadlines' ? 'text-black' : 'text-amber-400'}`} />
                  <span>Termene Parc & Acte</span>
                  {selectedCar.hasRedPlates && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      activeTab === 'deadlines' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      Numere Roșii
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Conținut Tab Activ */}
            <div className="py-4 text-xs">
              {activeTab === 'specs' && (
                <DetailSpecsTab 
                  car={selectedCar} 
                  viewMode={viewMode}
                  onUpdateDescription={onUpdateDescription}
                />
              )}

              {activeTab === 'finance' && (
                <DetailFinanceTab 
                  car={selectedCar}
                  advancePercent={advancePercent}
                  setAdvancePercent={setAdvancePercent}
                  periodMonths={periodMonths}
                  setPeriodMonths={setPeriodMonths}
                  currentRate={currentRate}
                  dealer={dealer}
                />
              )}

              {activeTab === 'video' && (
                <DetailVideoTab 
                  car={selectedCar}
                  videoFormat={videoFormat}
                  setVideoFormat={setVideoFormat}
                  dealer={dealer}
                />
              )}

              {activeTab === 'testdrive' && (
                <DetailTestDriveTab 
                  car={selectedCar}
                  tdDate={tdDate}
                  setTdDate={setTdDate}
                  tdTimeSlot={tdTimeSlot}
                  setTdTimeSlot={setTdTimeSlot}
                  tdName={tdName}
                  setTdName={setTdName}
                  tdPhone={tdPhone}
                  setTdPhone={setTdPhone}
                  tdGdprConsent={tdGdprConsent}
                  setTdGdprConsent={setTdGdprConsent}
                  onSubmit={handleTestDriveSubmit}
                  dealer={dealer}
                />
              )}

              {activeTab === 'expenses' && viewMode === 'admin' && (
                <DetailExpensesTab 
                  car={selectedCar}
                  onAddExpense={onAddExpense}
                  onDeleteExpense={onDeleteExpense}
                  onUpdatePurchasePrice={onUpdatePurchasePrice}
                  onUpdateSaleInfo={onUpdateSaleInfo}
                  showToast={showToast}
                />
              )}

              {activeTab === 'deadlines' && viewMode === 'admin' && (
                <DetailDeadlinesTab 
                  car={selectedCar}
                  onUpdateVehicleDeadlines={onUpdateVehicleDeadlines}
                  showToast={showToast}
                />
              )}
            </div>
          </div>

          {/* 🔗 Social Share Banner (Facebook, Instagram, WhatsApp) */}
          <SocialShareButtons car={selectedCar} showToast={showToast} variant="full" className="mt-2" />

          {/* ⚖️ Clauză Legală de Eroare Materială & Caracter Informativ (ANPC) */}
          <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10.5px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300">Mențiune legală (caracter informativ):</strong> Descrierea autovehiculului, fotografiile și dotările afișate au caracter strict informativ și pot conține erori umane de redactare sau preluare automată a specificațiilor. Oferta fermă, echiparea completă și istoricul tehnic se confirmă contractual la sediul showroom-ului RXM Automobile în momentul tranzacției.
          </div>

          {/* Butoane Acțiune Finală în Modal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
            <button 
              onClick={() => setActiveTab('testdrive')}
              className="w-full inline-flex items-center justify-center gap-2 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold h-11 rounded-xl text-sm transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Programează Test Drive</span>
            </button>

            <button 
              onClick={onPrint}
              className="w-full inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white font-medium h-11 rounded-xl text-sm transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Tipărește Fișa Mașinii (PDF)</span>
            </button>

            <a 
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              className="w-full inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/5 text-white h-11 rounded-xl text-sm font-medium transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Sună Dealer: {dealer.phonePrimary}</span>
            </a>

            <a 
              href={getWhatsAppCarInquiryUrl(selectedCar, dealer.whatsappNumber)}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl text-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Discută Direct pe WhatsApp</span>
            </a>

            <a 
              href={`mailto:${dealer.email}?subject=Interes%20${encodeURIComponent(selectedCar.brand + ' ' + selectedCar.model + ' [Ref: ' + stockRef + ']')}%20(${selectedCar.priceEur}€)&body=Bună%20ziua,%0A%0ASunt%20interesat%20de%20mașina%20${encodeURIComponent(selectedCar.brand + ' ' + selectedCar.model)}%20(Ref:%20${encodeURIComponent(stockRef)},%20An%20${selectedCar.year},%20Preț:%20${selectedCar.priceEur}€).%0AVă%20rog%20să%20îmi%20comunicați%20disponibilitatea%20pentru%20vizionare.`}
              className="w-full inline-flex items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium h-11 rounded-xl text-sm transition-all sm:col-span-2"
            >
              <Mail className="w-4 h-4" />
              <span>Trimite Solicitare pe {dealer.email}</span>
            </a>

            {/* Buton Închidere la Bază — Accesibilitate Mobile & Desktop Scrolled */}
            <button 
              type="button"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-300 hover:text-white font-semibold h-11 rounded-xl text-sm transition-all touch-manipulation cursor-pointer sm:col-span-2"
              aria-label="Închide fereastra detaliilor mașinii"
            >
              <X className="w-4 h-4 text-zinc-400" />
              <span>Închide Fereastra Detaliilor</span>
            </button>
          </div>

          {/* 🛡️ Clauză Legală Proprietate Intelectuală & Drepturi de Autor (Legea nr. 8/1996) - Collapsed la Bază cu Spațiere Generoasă după Lead */}
          <div className="mt-8 pt-5 border-t border-white/[0.06]">
            <IntellectualPropertyDisclaimer dealer={dealer} />
          </div>

        </div>

        {/* ── Sticky Thumb Zone Bar — Mobile Only (sm:hidden) ───────────────── */}
        {/* Ancorată fix la baza ecranului, DEASUPRA gesture bar-ului iOS/Android */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#121215]/96 backdrop-blur-lg border-t border-white/10 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+12px)] flex items-center justify-between gap-3 shadow-2xl">
          {/* Preț compact în stânga */}
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-medium">Preț Vânzare</span>
            <span className="text-base font-black font-mono text-amber-400 leading-none">
              {selectedCar.priceEur.toLocaleString('ro-RO')} €
            </span>
            {selectedCar.vatDeductible && (
              <span className="text-[9px] text-emerald-400 font-semibold">+ TVA 21% Deductibil</span>
            )}
          </div>

          {/* Butoane contact în dreapta — thumb zone optimizat */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`}
              aria-label={`Sună direct la ${dealer.phonePrimary}`}
              className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/10 active:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 touch-manipulation transition-all"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Sună</span>
            </a>
            <a
              href={selectedCar.status === 'sold'
                ? `https://wa.me/${dealer.whatsappNumber}?text=${encodeURIComponent(`Bună ziua! Am văzut pe rxmautomobile.ro că ${selectedCar.brand} ${selectedCar.model} (${selectedCar.year}) a fost vândut. Aș dori un model similar. Mulțumesc!`)}`
                : getWhatsAppCarInquiryUrl(selectedCar, dealer.whatsappNumber)
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contactează pe WhatsApp despre ${selectedCar.brand} ${selectedCar.model}`}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 touch-manipulation transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{selectedCar.status === 'sold' ? 'Model Similar' : 'WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
