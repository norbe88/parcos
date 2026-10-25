import React, { useState } from 'react';
import { 
  QrCode, Printer, Search, Car, CheckCircle2, 
  ExternalLink, Sparkles, Building2, Eye, EyeOff,
  Sliders, Check, RotateCcw, Scale, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { VehicleItem, DealerProfile, SEED_DEALER } from '../../db/seed';
import { WindowStickerConfig } from '../../db/types';
import { getStockNumber, calculateRate, formatMileage } from '../../utils/helpers';
import { 
  getWindowStickerConfig, 
  saveWindowStickerConfig, 
  resetWindowStickerConfig,
  formatEngineDisplay 
} from '../../utils/windowStickerConfig';

interface WindowStickersHubViewProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
  onOpenWindowSticker: (car: VehicleItem) => void;
  showToast: (msg: string) => void;
}

export const WindowStickersHubView: React.FC<WindowStickersHubViewProps> = ({
  cars,
  dealer = SEED_DEALER,
  onOpenWindowSticker,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStockOnly, setFilterStockOnly] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Stare configurare globală fișe de parbriz
  const [config, setConfig] = useState<WindowStickerConfig>(() => getWindowStickerConfig(dealer));

  const updateConfig = <K extends keyof WindowStickerConfig>(key: K, value: WindowStickerConfig[K]) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      saveWindowStickerConfig(updated);
      return updated;
    });
  };

  const handleToggleVin = () => {
    const next = !config.showVin;
    updateConfig('showVin', next);
    showToast(next ? '✓ Seria de șasiu (VIN) va fi afișată pe fișele de parbriz.' : '✓ Seria de șasiu (VIN) este ascunsă implicit pe fișele de parbriz.');
  };

  const handleToggleExchangeRate = () => {
    const next = !config.showExchangeRateDisclaimer;
    updateConfig('showExchangeRateDisclaimer', next);
    showToast(next ? '✓ Clauza obligatorie ANPC (Curs BNR + 2%) este activată.' : '⚠️ Clauza de curs BNR a fost dezactivată.');
  };

  const handleResetDefaults = () => {
    const fresh = resetWindowStickerConfig();
    setConfig(fresh);
    showToast('↺ Setările fișelor au fost resetate la valorile implicite din fabrică.');
  };

  const filteredCars = cars.filter(c => {
    if (filterStockOnly && c.status !== 'in_stock') return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const sn = getStockNumber(c).toLowerCase();
    return (
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.vin.toLowerCase().includes(q) ||
      sn.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <QrCode className="w-3.5 h-3.5" /> Fișe Parbriz A4 Tipăribile cu Cod QR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Fișe de Parbriz Showroom (A4 & QR)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Generează fișe oficiale elegante de parbriz gata de afișat în parcul auto. Include motorizarea completă (cm³ + CP), clauza legală ANPC (Curs BNR + 2%), logo-ul dealerului și cod QR scanabil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Căutare rapidă */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută în stoc..."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
            />
          </div>

          {/* Comutator Deschidere Configurare Preferințe Fișe */}
          <button
            type="button"
            onClick={() => setIsConfigPanelOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isConfigPanelOpen
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
            title="Configurează ce elemente să apară pe fișele de parbriz pentru tot parcul"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurare Fișe</span>
            {isConfigPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Comutator Afișare / Ascundere Serie Șasiu (VIN) pe Fișele de Parbriz */}
          <button
            type="button"
            onClick={handleToggleVin}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              config.showVin
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title={config.showVin ? 'Seriile de șasiu sunt afișate pe fișe. Click pentru a le ascunde.' : 'Seriile de șasiu sunt ascunse implicit pe fișe. Click pentru a le activa.'}
          >
            {config.showVin ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>VIN: Afișat</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>VIN: Ascuns</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterStockOnly(!filterStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterStockOnly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {filterStockOnly ? 'Doar În Stoc' : 'Toate Mașinile'}
          </button>
        </div>
      </div>

      {/* 🎛️ Panou Global de Personalizare Fișe Parbriz */}
      {isConfigPanelOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#151518] border border-amber-500/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Setări Globale Fișe Parbriz Showroom
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Setările salvate aici se aplică automat la generarea și printarea oricărei fișe de parbriz.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetează Implicite</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Secțiune 1: Motorizare */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Car className="w-3.5 h-3.5" /> Motorizare & Specificații
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showEngineCc}
                  onChange={(e) => updateConfig('showEngineCc', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <div>
                  <span className="text-zinc-200 font-semibold block leading-tight">Cilindree (cm³)</span>
                  <span className="text-[10px] text-amber-300/80">ex: 1.998 cm³</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showPowerHp}
                  onChange={(e) => updateConfig('showPowerHp', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Cai Putere (CP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showFuelType}
                  onChange={(e) => updateConfig('showFuelType', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Tip Combustibil</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showTransmission}
                  onChange={(e) => updateConfig('showTransmission', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Cutie Transmisie</span>
              </label>
            </div>

            {/* Secțiune 2: Legalitate ANPC */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
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
                <div>
                  <span className="text-zinc-200 font-semibold block leading-tight">Clauză Curs BNR + 2%</span>
                  <span className="text-[10px] text-emerald-400">Protecție amenzi ANPC</span>
                </div>
              </label>

              {config.showExchangeRateDisclaimer && (
                <input
                  type="text"
                  value={config.exchangeRateDisclaimerText}
                  onChange={(e) => updateConfig('exchangeRateDisclaimerText', e.target.value)}
                  placeholder="Plata în LEI la curs BNR + 2%..."
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:border-amber-400 outline-none"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                <input
                  type="checkbox"
                  checked={config.showVatDetails}
                  onChange={(e) => updateConfig('showVatDetails', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Mențiune TVA 21% / Marjă</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showMonthlyRate}
                  onChange={(e) => updateConfig('showMonthlyRate', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Rate Fixe Lunare (BT/TBI)</span>
              </label>
            </div>

            {/* Secțiune 3: Logo & Antet */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Building2 className="w-3.5 h-3.5" /> Identitate Dealer & Logo
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showLogo}
                  onChange={(e) => updateConfig('showLogo', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-200 font-semibold">Afișează Logo Dealer</span>
              </label>

              {config.showLogo && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateConfig('logoPosition', 'header_left')}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold border ${
                      config.logoPosition === 'header_left' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Stânga
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig('logoPosition', 'header_right')}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold border ${
                      config.logoPosition === 'header_right' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Dreapta
                  </button>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                <input
                  type="checkbox"
                  checked={config.showWarrantyBadge}
                  onChange={(e) => updateConfig('showWarrantyBadge', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Garanție Dealer Scrisă</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showQrCode}
                  onChange={(e) => updateConfig('showQrCode', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Cod QR Video TikTok</span>
              </label>
            </div>

            {/* Secțiune 4: Dotări & Badge Special */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Insignă / Badge Colț
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Text insignă specială:</span>
                <input
                  type="text"
                  value={config.customBadgeText || ''}
                  onChange={(e) => updateConfig('customBadgeText', e.target.value)}
                  placeholder="Ex: Revizie gratuită inclusă..."
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:border-amber-400 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
                <input
                  type="checkbox"
                  checked={config.showTopFeatures}
                  onChange={(e) => updateConfig('showTopFeatures', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-300">Top 8 Dotări Echipamente</span>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* Grid Mașini cu Fișe Parbriz */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCars.map(c => {
          const sn = getStockNumber(c);
          const estRate = calculateRate(c.priceEur, 0.20, 60);
          const engine = formatEngineDisplay(c, config);

          return (
            <div 
              key={c.id}
              className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] hover:border-amber-500/35 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                    #{sn}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {c.engineCc && c.engineCc > 0 && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25">
                        {c.engineCc} cm³
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      c.status === 'in_stock' 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {c.status === 'in_stock' ? 'În Stoc' : c.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img 
                    src={c.images[0]} 
                    alt={c.model} 
                    className="w-16 h-12 rounded-xl object-cover bg-zinc-800 border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {c.brand} {c.model}
                    </h3>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {c.year} &bull; {formatMileage(c.mileageKm)}
                    </div>
                    <div className="text-xs font-black text-amber-300 font-mono mt-1">
                      {c.priceEur.toLocaleString('ro-RO')} € 
                      <span className="text-[10.5px] font-normal text-zinc-400 ml-1.5">
                        (~{estRate} €/lună)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Motorizare & Dotări de Parbriz */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[10.5px] text-zinc-400 space-y-1">
                  <div className="truncate text-zinc-300 font-medium">
                    &bull; <strong className="text-amber-400">{engine.title}</strong> &bull; Cutie {c.transmission}
                  </div>
                  <div className="truncate flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>&bull; Garanție {c.warrantyMonths || 12} luni</span>
                    {config.showExchangeRateDisclaimer && (
                      <span className="text-emerald-400/90">&bull; Curs BNR+2% Inclus</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Buton Deschidere Fișă */}
              <button
                type="button"
                onClick={() => onOpenWindowSticker(c)}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-amber-500 cursor-pointer shadow-sm group-hover:bg-amber-500/10 group-hover:border-amber-500/40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Deschide & Tipărește Fișa Parbriz</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
