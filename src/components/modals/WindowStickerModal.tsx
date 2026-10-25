import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Printer, QrCode, FileText, Download, Loader2, 
  Eye, EyeOff, Sliders, Check, RotateCcw, ShieldCheck, 
  Scale, Car, Sparkles, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { WindowStickerConfig } from '../../db/types';
import { PrintableWindowSticker } from '../print/PrintableWindowSticker';
import { 
  getStandardDocumentFileName, 
  printWithDocumentTitle, 
  downloadElementAsPdf 
} from '../../utils/pdfGenerator';
import { 
  getWindowStickerConfig, 
  saveWindowStickerConfig, 
  resetWindowStickerConfig,
  formatEngineDisplay 
} from '../../utils/windowStickerConfig';

interface WindowStickerModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
}

export const WindowStickerModal: React.FC<WindowStickerModalProps> = ({
  isOpen,
  car,
  onClose,
  showToast,
  dealer = SEED_DEALER
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Stare configurare fișă parbriz
  const [config, setConfig] = useState<WindowStickerConfig>(() => getWindowStickerConfig(dealer));

  // Actualizare locală a unei opțiuni din fișă
  const updateConfig = <K extends keyof WindowStickerConfig>(key: K, value: WindowStickerConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAsDefault = () => {
    saveWindowStickerConfig(config);
    showToast('✓ Preferințele de parbriz au fost salvate ca implicite pentru tot parcul auto!');
  };

  const handleResetDefaults = () => {
    const fresh = resetWindowStickerConfig();
    setConfig(fresh);
    showToast('↺ Setările fișei au fost resetate la valorile din fabrică.');
  };

  const paperRef = useRef<HTMLDivElement>(null);

  // 🔒 Lock background scroll pe body când modalul este deschis și activează clasele dedicate de print
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-window-sticker-open');
    if (orientation === 'landscape') {
      document.body.classList.add('print-landscape');
    } else {
      document.body.classList.remove('print-landscape');
    }

    return () => {
      document.body.style.overflow = orig;
      document.body.classList.remove('has-window-sticker-open', 'print-landscape');
    };
  }, [isOpen, orientation]);

  if (!isOpen || !car) return null;

  // Nomenclatură standardizată oficială (respectă VIN toggle)
  const currentFileName = getStandardDocumentFileName({
    docType: 'window_sticker',
    brand: car.brand,
    model: car.model,
    stockNumber: car.stockNumber,
    vin: config.showVin ? car.vin : undefined
  });

  const handlePrint = () => {
    printWithDocumentTitle(currentFileName);
    showToast(`Pregătit pentru print / Salvare PDF: "${currentFileName}.pdf"`);
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setIsDownloading(true);
    showToast(`Se generează fișa de parbriz "${currentFileName}.pdf"...`);
    try {
      await downloadElementAsPdf(paperRef.current, currentFileName, { orientation });
      showToast(`Fișa "${currentFileName}.pdf" a fost descărcată cu succes!`);
    } catch (err) {
      console.error('Download sticker PDF error:', err);
      showToast('Eroare descărcare directă. Deschidem dialogul de salvare ca PDF.');
      printWithDocumentTitle(currentFileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const enginePreview = formatEngineDisplay(car, config);

  const modalContent = (
    <div className="window-sticker-modal-container fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92dvh] sm:max-h-[94vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-3.5 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row gap-3 md:items-center justify-between sticky top-0 bg-[#121215]/95 backdrop-blur-md z-20 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Generator Fișă Parbriz A4 cu QR Code
              </h3>
              <p className="text-xs text-zinc-400">
                Fișă expunere showroom • <span className="text-amber-300 font-semibold">{car.brand} {car.model}</span>
                {car.engineCc ? <span className="text-zinc-500 font-mono ml-1.5">({car.engineCc} cm³ • {car.powerHp} CP)</span> : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buton Deschidere / Închidere Panou Personalizare */}
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(prev => !prev)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all touch-manipulation cursor-pointer ${
                isCustomizerOpen
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Personalizează elementele vizibile pe fișa de parbriz"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Personalizare Fișă</span>
              {isCustomizerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Comutator Orientare */}
            <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-black/40">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold transition-all touch-manipulation cursor-pointer ${
                  orientation === 'portrait' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Portret (A4)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold transition-all touch-manipulation cursor-pointer ${
                  orientation === 'landscape' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Peisaj (Orizontal)
              </button>
            </div>

            {/* Buton Descărcare PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="min-h-[44px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer disabled:opacity-60"
              title={`Descarcă fișa de parbriz (${currentFileName}.pdf)`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Se generează...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descarcă PDF</span>
                </>
              )}
            </button>

            {/* Buton Tipărire */}
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
              title={`Tipărește fișa (${currentFileName}.pdf)`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Tipărește</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Închide fișa"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors touch-manipulation active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🎛️ Panou Extensibil de Personalizare Dealer (HUD Toggles) */}
        {isCustomizerOpen && (
          <div className="no-print bg-[#16161b] border-b border-amber-500/30 p-4 sm:p-5 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Personalizare Configurație Fișă Parbriz (Preferințe Dealer)
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Selectează ce informații să fie afișate pe parbriz. Previzualizarea se actualizează în timp real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDefault}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  title="Salvează opțiunile curente ca implicite pentru toate vehiculele din parcul auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvează ca Implicit</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border border-white/10"
                  title="Resetează toate opțiunile la valorile din fabrică"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              {/* Coloana 1: 🚗 Motorizare & Detalii Tehnice */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Car className="w-3.5 h-3.5" /> Motorizare & Specificații
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showEngineCc}
                    onChange={(e) => updateConfig('showEngineCc', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-400"
                  />
                  <div className="flex-1">
                    <span className="text-zinc-200 font-semibold block leading-tight">Motorizare (cm³)</span>
                    <span className="text-[10px] text-amber-300/80 font-mono">
                      {car.engineCc ? `${car.engineCc.toLocaleString('ro-RO')} cm³` : 'Fără cm³ (ex. Electric)'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showPowerHp}
                    onChange={(e) => updateConfig('showPowerHp', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Putere ({car.powerHp} CP)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showFuelType}
                    onChange={(e) => updateConfig('showFuelType', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Combustibil ({car.fuelType})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showTransmission}
                    onChange={(e) => updateConfig('showTransmission', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Cutie de viteze ({car.transmission})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                  <input
                    type="checkbox"
                    checked={config.showVin}
                    onChange={(e) => updateConfig('showVin', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <div>
                    <span className="text-zinc-300 font-medium">Serie Șasiu (VIN)</span>
                    <span className="text-[10px] text-zinc-500 block font-mono truncate max-w-[170px]">{car.vin}</span>
                  </div>
                </label>
              </div>

              {/* Coloana 2: ⚖️ Conformitate Legală ANPC & Curs BNR */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Scale className="w-3.5 h-3.5" /> Conformitate Legală ANPC
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showExchangeRateDisclaimer}
                    onChange={(e) => updateConfig('showExchangeRateDisclaimer', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <div className="flex-1">
                    <span className="text-zinc-200 font-semibold block leading-tight">Clauză Curs BNR + 2%</span>
                    <span className="text-[10px] text-emerald-400 block">Standard ANPC (Preț Euro)</span>
                  </div>
                </label>

                {config.showExchangeRateDisclaimer && (
                  <div className="pt-1">
                    <span className="text-[10px] text-zinc-400 block mb-1">Text mențiune legală:</span>
                    <input
                      type="text"
                      value={config.exchangeRateDisclaimerText}
                      onChange={(e) => updateConfig('exchangeRateDisclaimerText', e.target.value)}
                      placeholder="Plata în LEI la curs BNR + 2%..."
                      className="w-full bg-[#1e1e24] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:border-amber-400 outline-none"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                  <input
                    type="checkbox"
                    checked={config.showVatDetails}
                    onChange={(e) => updateConfig('showVatDetails', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <div>
                    <span className="text-zinc-300 font-medium">Regim Fiscal TVA 21%</span>
                    <span className="text-[10px] text-zinc-500 block">TVA Deductibil / Marjă Profit</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showMonthlyRate}
                    onChange={(e) => updateConfig('showMonthlyRate', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Cutie Rate Lunare (BT / TBI)</span>
                </label>
              </div>

              {/* Coloana 3: 🏢 Branding & Logo Dealer */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Building2 className="w-3.5 h-3.5" /> Identitate & Logo Dealer
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showLogo}
                    onChange={(e) => updateConfig('showLogo', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <div>
                    <span className="text-zinc-200 font-semibold block leading-tight">Afișează Siglă / Logo</span>
                    <span className="text-[10px] text-zinc-400 block">Logo-ul parcului auto în antet</span>
                  </div>
                </label>

                {config.showLogo && (
                  <div className="pt-1">
                    <span className="text-[10px] text-zinc-400 block mb-1">Poziție logo în antet:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateConfig('logoPosition', 'header_left')}
                        className={`py-1 px-2 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          config.logoPosition === 'header_left'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Colț Stânga
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('logoPosition', 'header_right')}
                        className={`py-1 px-2 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          config.logoPosition === 'header_right'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Colț Dreapta
                      </button>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                  <input
                    type="checkbox"
                    checked={config.showWarrantyBadge}
                    onChange={(e) => updateConfig('showWarrantyBadge', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Garanție Dealer ({car.warrantyMonths || 12} Luni)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showQrCode}
                    onChange={(e) => updateConfig('showQrCode', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Cod QR Video TikTok / Galerie</span>
                </label>
              </div>

              {/* Coloana 4: ⭐ Notă Specială / Badge Colț */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Badge / Mențiune Colț
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Text insignă specială (opțional):</span>
                  <input
                    type="text"
                    value={config.customBadgeText || ''}
                    onChange={(e) => updateConfig('customBadgeText', e.target.value)}
                    placeholder="Ex: Revizie gratuită inclusă..."
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-zinc-500 block">Sugestii rapide la 1-click:</span>
                  <div className="flex flex-wrap gap-1">
                    {['Revizie Gratuită', 'Prim Proprietar', 'Carte Service', 'Anvelope Iarnă'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateConfig('customBadgeText', preset)}
                        className="text-[9.5px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10 cursor-pointer transition-colors"
                      >
                        +{preset}
                      </button>
                    ))}
                    {config.customBadgeText && (
                      <button
                        type="button"
                        onClick={() => updateConfig('customBadgeText', '')}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer"
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                  <input
                    type="checkbox"
                    checked={config.showTopFeatures}
                    onChange={(e) => updateConfig('showTopFeatures', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-300">Top 8 Dotări & Echipamente</span>
                </label>
              </div>

            </div>
          </div>
        )}

        {/* Bară Informare Denumire Fișier Standard & Rezumat Opțiuni */}
        <div className="no-print bg-black/60 border-b border-white/[0.08] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-[11px]">Denumire fișier standard:</span>
            <span className="font-mono text-amber-300 font-bold truncate max-w-sm sm:max-w-md">
              {currentFileName}.pdf
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/30 text-amber-300">
              Motorizare: {config.showEngineCc ? (car.engineCc ? `${car.engineCc} cm³` : 'Activ') : 'Ascuns'}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              config.showExchangeRateDisclaimer
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              Curs BNR+2%: {config.showExchangeRateDisclaimer ? 'Activ' : 'Oprit'}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              config.showLogo 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              Logo: {config.showLogo ? config.logoPosition === 'header_left' ? 'Stânga' : 'Dreapta' : 'Oprit'}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              config.showVin 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              VIN: {config.showVin ? 'Afișat' : 'Ascuns'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
              A4 {orientation === 'portrait' ? 'Portret' : 'Peisaj'}
            </span>
          </div>
        </div>

        {/* Zona de previzualizare foaie A4 cu suport touch gesture */}
        <div className="p-3 sm:p-6 bg-zinc-300 flex justify-center items-start overflow-y-auto overflow-x-auto touch-manipulation">
          <div ref={paperRef} className="window-sticker-paper-preview">
            <PrintableWindowSticker 
              car={car} 
              dealer={dealer} 
              orientation={orientation} 
              config={config}
              showVin={config.showVin}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
