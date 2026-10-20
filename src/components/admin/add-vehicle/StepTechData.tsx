import React from 'react';
import { ArrowRight, ShieldCheck, Eye, EyeOff, Calculator, Globe, Lock } from 'lucide-react';
import { maskVin } from '../../../utils/helpers';
import { normalizeBrand, CANONICAL_BRAND_NAMES } from '../../../utils/brandNormalizer';

interface StepTechDataProps {
  newBrand: string;
  setNewBrand: (val: string) => void;
  newModel: string;
  setNewModel: (val: string) => void;
  newVersionTrim: string;
  setNewVersionTrim: (val: string) => void;
  newYear: number;
  setNewYear: (val: number) => void;
  newMileage: string;
  setNewMileage: (val: string) => void;
  newPowerHp: number;
  setNewPowerHp: (val: number) => void;
  powerKw?: number;
  setPowerKw?: (val: number) => void;
  newEngineCc: number;
  setNewEngineCc: (val: number) => void;
  newFuel: 'Diesel' | 'Benzină' | 'Hibrid' | 'Electric';
  setNewFuel: (val: 'Diesel' | 'Benzină' | 'Hibrid' | 'Electric') => void;
  newTransmission: 'Automată' | 'Manuală';
  setNewTransmission: (val: 'Automată' | 'Manuală') => void;
  newDrivetrain: '4x4 / AWD' | 'Față' | 'Spate';
  setNewDrivetrain: (val: '4x4 / AWD' | 'Față' | 'Spate') => void;
  newBodyType: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback';
  setNewBodyType: (val: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback') => void;
  newVin: string;
  setNewVin: (val: string) => void;
  newCivNumber: string;
  setNewCivNumber: (val: string) => void;
  docOriginCountry?: 'DE' | 'AT' | 'FR' | 'IT' | 'RO' | 'NL' | 'BE' | 'US' | 'OTHER';
  setDocOriginCountry?: (val: 'DE' | 'AT' | 'FR' | 'IT' | 'RO' | 'NL' | 'BE' | 'US' | 'OTHER') => void;
  isVinPublic?: boolean;
  setIsVinPublic?: (val: boolean) => void;
  hasRedPlates?: boolean;
  setHasRedPlates?: (val: boolean) => void;
  redPlatesExpiresAt?: string;
  setRedPlatesExpiresAt?: (val: string) => void;
  itpExpiresAt?: string;
  setItpExpiresAt?: (val: string) => void;
  rarAppointmentDate?: string;
  setRarAppointmentDate?: (val: string) => void;
  onNext: () => void;
}

export const StepTechData: React.FC<StepTechDataProps> = ({
  newBrand,
  setNewBrand,
  newModel,
  setNewModel,
  newVersionTrim,
  setNewVersionTrim,
  newYear,
  setNewYear,
  newMileage,
  setNewMileage,
  newPowerHp,
  setNewPowerHp,
  powerKw = 0,
  setPowerKw,
  newEngineCc,
  setNewEngineCc,
  newFuel,
  setNewFuel,
  newTransmission,
  setNewTransmission,
  newDrivetrain,
  setNewDrivetrain,
  newBodyType,
  setNewBodyType,
  newVin,
  setNewVin,
  newCivNumber,
  setNewCivNumber,
  docOriginCountry = 'DE',
  setDocOriginCountry,
  isVinPublic = false,
  setIsVinPublic,
  hasRedPlates = false,
  setHasRedPlates,
  redPlatesExpiresAt = '',
  setRedPlatesExpiresAt,
  itpExpiresAt = '',
  setItpExpiresAt,
  rarAppointmentDate = '',
  setRarAppointmentDate,
  onNext
}) => {
  const handleKwChange = (kw: number) => {
    if (setPowerKw) setPowerKw(kw);
    // Directiva 1999/37/CE: 1 kW = 1.35962 CP (rotunjit)
    const hp = kw > 0 ? Math.round(kw * 1.35962) : 0;
    setNewPowerHp(hp);
  };

  const [showExtraTech, setShowExtraTech] = React.useState(false);
  const [showInternalDealer, setShowInternalDealer] = React.useState(false);

  // Rezumat compact detalii tehnice secundare (fără badge-uri goale)
  const extraTechSummaryParts = [
    newPowerHp > 0 ? `${newPowerHp} CP` : null,
    newEngineCc > 0 ? `${newEngineCc} cm³` : null,
    newCivNumber ? `CIV RAR: ${newCivNumber}` : null,
  ].filter(Boolean);
  const extraTechSummary = extraTechSummaryParts.join(' • ');

  return (
    <div className="space-y-2.5 animate-in fade-in">
      
      {/* 🚀 CÂMPURI PRINCIPALE (VIZIBILE DIRECT) */}

      {/* Rând 1: Marcă, Model, Echipare */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium flex items-center justify-between">
            <span>Marcă</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Auto-ajustare canonică</span>
          </label>
          <input 
            type="text" 
            required
            list="rxm-canonical-brands"
            placeholder="Ex: BMW, Audi, Renault"
            value={newBrand}
            onChange={e => setNewBrand(e.target.value)}
            onBlur={() => {
              if (newBrand.trim()) {
                const corrected = normalizeBrand(newBrand);
                if (corrected !== newBrand) {
                  setNewBrand(corrected);
                }
              }
            }}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 font-semibold text-xs transition-colors"
          />
          <datalist id="rxm-canonical-brands">
            {CANONICAL_BRAND_NAMES.map(brand => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">Model</label>
          <input 
            type="text" 
            required
            placeholder="Ex: Seria 5"
            value={newModel}
            onChange={e => setNewModel(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 font-semibold text-xs"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">Versiune / Nivel Echipare</label>
          <input 
            type="text" 
            placeholder="Ex: 520d Luxury Line LCI"
            value={newVersionTrim}
            onChange={e => setNewVersionTrim(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 text-xs"
          />
        </div>
      </div>

      {/* Rând 2: An, Kilometraj, Combustibil, Cutie */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">An Fabricație</label>
          <input 
            type="number" 
            required
            min="2005"
            max="2026"
            value={newYear || ''}
            onChange={e => setNewYear(Number(e.target.value))}
            placeholder="Ex: 2020"
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">Kilometraj (km)</label>
          <input 
            type="number" 
            required
            placeholder="Ex: 155000"
            value={newMileage}
            onChange={e => setNewMileage(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">Combustibil</label>
          <select 
            value={newFuel}
            onChange={e => setNewFuel(e.target.value as any)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 text-xs"
          >
            <option value="Diesel">Diesel</option>
            <option value="Benzină">Benzină</option>
            <option value="Hibrid">Hibrid</option>
            <option value="Electric">Electric</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 text-xs font-medium">Cutie de Viteze</label>
          <select 
            value={newTransmission}
            onChange={e => setNewTransmission(e.target.value as any)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 text-xs"
          >
            <option value="Automată">Automată</option>
            <option value="Manuală">Manuală</option>
          </select>
        </div>
      </div>

      {/* Rând 3: Serie Șasiu (VIN) & Mascare Privacy-First */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-zinc-400 text-xs font-medium">Serie Șasiu (VIN)</label>
            <span className="text-[10px] text-zinc-500 font-mono">17 caractere</span>
          </div>
          <input 
            type="text" 
            placeholder="Ex: WBA5D31080D741216"
            value={newVin}
            onChange={e => setNewVin(e.target.value.toUpperCase())}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-xs outline-none focus:border-amber-400"
          />
        </div>

        {/* Mascare Privacy VIN Preview & Toggle */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-zinc-400 text-[11px]">Afișaj pe site:</span>
            <span className="font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-xs">
              {newVin ? maskVin(newVin, isVinPublic) : 'WBA•••••••••••7412'}
            </span>
          </div>

          {setIsVinPublic && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-400 hover:text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={isVinPublic}
                onChange={e => setIsVinPublic(e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
              />
              <span>Afișează seria completă public</span>
            </label>
          )}
        </div>
      </div>

      {/* ➕ ACORDEON 1: DETALII TEHNICE EXTINSE & ACTE RAR */}
      <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowExtraTech(!showExtraTech)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">
              Detalii Tehnice Suplimentare & Acte RAR
            </span>
            {extraTechSummary ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                {extraTechSummary}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {showExtraTech ? 'Ascunde ▲' : 'Modifică / Detalii ▼'}
          </span>
        </button>

        {showExtraTech && (
          <div className="p-3 pt-1 border-t border-white/[0.06] space-y-2.5 animate-in fade-in duration-150">
            {/* Putere kW -> CP & Cilindree */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium flex items-center justify-between">
                  <span>Putere (kW / CP)</span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {newPowerHp > 0 ? `→ ${newPowerHp} CP` : ''}
                  </span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={powerKw || ''}
                    onChange={e => handleKwChange(Number(e.target.value))}
                    placeholder="Ex: 140"
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                    kW
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">Cilindree (cm³)</label>
                <input 
                  type="number" 
                  value={newEngineCc || ''}
                  onChange={e => setNewEngineCc(Number(e.target.value))}
                  placeholder="Ex: 1995"
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>
            </div>

            {/* Tracțiune, Caroserie, Serie CIV */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">Tracțiune</label>
                <select 
                  value={newDrivetrain}
                  onChange={e => setNewDrivetrain(e.target.value as any)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
                >
                  <option value="4x4 / AWD">4x4 / AWD</option>
                  <option value="Spate">Spate (RWD)</option>
                  <option value="Față">Față (FWD)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">Caroserie</label>
                <select 
                  value={newBodyType}
                  onChange={e => setNewBodyType(e.target.value as any)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Break">Break</option>
                  <option value="Hatchback">Hatchback</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">
                  Serie Carte CIV RAR
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: A12894109"
                  value={newCivNumber}
                  onChange={e => setNewCivNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Țară proveniență acte */}
            {setDocOriginCountry && (
              <div className="pt-1">
                <label className="block text-zinc-400 mb-1 text-xs font-medium">Țară Proveniență Acte</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(['DE', 'AT', 'FR', 'IT', 'RO', 'NL', 'BE', 'US', 'OTHER'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDocOriginCountry(c)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        docOriginCountry === c
                          ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {c === 'DE' ? '🇩🇪 DE' : c === 'AT' ? '🇦🇹 AT' : c === 'FR' ? '🇫🇷 FR' : c === 'IT' ? '🇮🇹 IT' : c === 'RO' ? '🇷🇴 RO' : c === 'NL' ? '🇳🇱 NL' : c === 'BE' ? '🇧🇪 BE' : c === 'US' ? '🇺🇸 SUA' : '🌍 Altă Țară'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔐 ACORDEON 2: GESTIUNE INTERNĂ DEALER (NUMERE ROȘII & ITP) */}
      <div className="rounded-xl border border-amber-500/25 bg-black/30 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowInternalDealer(!showInternalDealer)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">
              Gestiune Internă Dealer: Numere Roșii & ITP
            </span>
            {hasRedPlates && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                Numere Roșii Active
              </span>
            )}
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {showInternalDealer ? 'Ascunde ▲' : 'Configurează ▼'}
          </span>
        </button>

        {showInternalDealer && (
          <div className="p-3.5 pt-1 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-150">
            <p className="text-[11px] text-zinc-400 pt-1">
              Date confidențiale pentru monitorizarea flotei. <strong>Nu sunt vizibile clienților în showroom</strong>.
            </p>

            {/* Toggle Numere Roșii */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white font-medium select-none">
                <input 
                  type="checkbox"
                  checked={hasRedPlates}
                  onChange={e => {
                    const checked = e.target.checked;
                    setHasRedPlates?.(checked);
                    if (checked && !redPlatesExpiresAt && setRedPlatesExpiresAt) {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setRedPlatesExpiresAt(d.toISOString().split('T')[0]);
                    }
                  }}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>Mașina are eliberate Numere Roșii Provizorii (Autorizație Parc)</span>
              </label>
            </div>

            {hasRedPlates && (
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-2">
                <label className="block text-zinc-300 text-[11px] font-medium">
                  Data Expirării Numerelor Roșii:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="date"
                    value={redPlatesExpiresAt}
                    onChange={e => setRedPlatesExpiresAt?.(e.target.value)}
                    className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-xs outline-none focus:border-amber-400 flex-1 min-h-[38px]"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setRedPlatesExpiresAt?.(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-[11px] font-semibold text-zinc-300"
                    >
                      +30 Zile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 60);
                        setRedPlatesExpiresAt?.(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-[11px] font-semibold text-zinc-300"
                    >
                      +60 Zile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 90);
                        setRedPlatesExpiresAt?.(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-[11px] font-semibold text-zinc-300"
                    >
                      +90 Zile
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">
                  Data Expirare ITP (Opțional):
                </label>
                <input 
                  type="date"
                  value={itpExpiresAt}
                  onChange={e => setItpExpiresAt?.(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-xs outline-none focus:border-amber-400 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-xs font-medium">
                  Data Programare RAR (Opțional):
                </label>
                <input 
                  type="date"
                  value={rarAppointmentDate}
                  onChange={e => setRarAppointmentDate?.(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-xs outline-none focus:border-amber-400 min-h-[38px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08]">
        <div className="text-[11px] text-zinc-500 font-medium">
          Pasul 1 din 4 • Date Tehnice & Identificare
        </div>
        <button 
          type="button" 
          onClick={onNext}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <span>Pasul Următor: Preț & TVA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
