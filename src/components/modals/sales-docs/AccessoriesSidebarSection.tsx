import React from 'react';
import { PackageCheck, Key, Fuel } from 'lucide-react';
import { BuyerData } from '../../print/types';

interface AccessoriesSidebarSectionProps {
  buyerData: BuyerData;
  setBuyerData: React.Dispatch<React.SetStateAction<BuyerData>>;
  activeDocTab: string;
}

export const AccessoriesSidebarSection: React.FC<AccessoriesSidebarSectionProps> = ({
  buyerData,
  setBuyerData,
  activeDocTab
}) => {
  return (
    <div className={`bg-black/40 border p-4 rounded-xl space-y-3.5 transition-all ${
      activeDocTab === 'protocol'
        ? 'border-amber-500/40 ring-1 ring-amber-500/30 bg-black/60 shadow-lg'
        : 'border-white/[0.08]'
    }`}>
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Accesorii & Predare (Proces-Verbal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBuyerData(prev => ({
              ...prev,
              keysCount: 2,
              keysCustomText: '',
              hasRegistrationCertificate: true,
              hasCivOrOriginDocs: true,
              hasTaxInvoice: true,
              hasWarrantyCertificate: true,
              hasMedicalKitTriangles: true,
              hasSpareWheelOrKit: true,
              hasMountedTiresGoodCondition: true,
              hasUserManualServiceBook: true
            }))}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            title="Bifează toate accesoriile ca fiind predate conform standardului"
          >
            Toate bifate (Standard)
          </button>
          <span className="text-zinc-600 text-[10px]">•</span>
          <button
            type="button"
            onClick={() => setBuyerData(prev => ({
              ...prev,
              hasRegistrationCertificate: false,
              hasCivOrOriginDocs: false,
              hasTaxInvoice: false,
              hasWarrantyCertificate: false,
              hasMedicalKitTriangles: false,
              hasSpareWheelOrKit: false,
              hasMountedTiresGoodCondition: false,
              hasUserManualServiceBook: false
            }))}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 font-medium cursor-pointer"
            title="Debifează toate accesoriile"
          >
            Debifează
          </button>
        </div>
      </div>

      {/* Selector Chei Originale */}
      <div>
        <label className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3 text-amber-400" />
            Număr chei originale predate:
          </span>
          <span className="text-amber-300 font-mono font-bold text-[10.5px]">
            {buyerData.keysCount ?? 2} {buyerData.keysCount === 1 ? 'cheie' : 'chei'}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setBuyerData(prev => ({ ...prev, keysCount: num }))}
              className={`min-h-[32px] px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all touch-manipulation cursor-pointer border ${
                (buyerData.keysCount ?? 2) === num
                  ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-bold'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{num} {num === 1 ? 'Cheie' : num === 2 ? 'Chei (Standard)' : 'Chei'}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={buyerData.keysCustomText || ''}
          onChange={(e) => setBuyerData(prev => ({ ...prev, keysCustomText: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white mt-1.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
          placeholder="Opțional: text detaliat chei (ex: 1 cheie funcțională + 1 lamă de rezervă)"
        />
      </div>

      {/* Checkbox-uri Accesorii Predate */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10.5px] text-zinc-400 font-medium block">
          Elemente bifate în Procesul-Verbal:
        </span>

        {[
          { key: 'hasRegistrationCertificate', label: 'Certificat Înmatriculare (Talon) original / străin' },
          { key: 'hasCivOrOriginDocs', label: 'Carte de Identitate (CIV) / Proveniență' },
          { key: 'hasTaxInvoice', label: 'Factură Fiscală emisă de vânzător' },
          { key: 'hasWarrantyCertificate', label: 'Certificat de Garanție (12 luni / 10.000 km)' },
          { key: 'hasMedicalKitTriangles', label: 'Trusă medicală, triunghiuri, stingător' },
          { key: 'hasSpareWheelOrKit', label: 'Roată rezervă / Kit etanșare pană și cric' },
          { key: 'hasMountedTiresGoodCondition', label: 'Set anvelope montate (stare bună)' },
          { key: 'hasUserManualServiceBook', label: 'Manual utilizare / Carte service' },
        ].map(({ key, label }) => {
          const isChecked = buyerData[key as keyof BuyerData] !== false;
          return (
            <label
              key={key}
              className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                isChecked 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                  : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/5'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setBuyerData(prev => ({ ...prev, [key]: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 bg-[#18181b] border-white/20 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </label>
          );
        })}
      </div>

      {/* Nivel Carburant */}
      <div className="pt-1">
        <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
          <Fuel className="w-3 h-3 text-amber-400" />
          Carburant în rezervor la predare:
        </label>
        <select
          value={buyerData.fuelLevel || 'Minim 1/4 rezervor'}
          onChange={(e) => setBuyerData(prev => ({ ...prev, fuelLevel: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
        >
          <option value="Minim 1/4 rezervor">Minim 1/4 rezervor (Standard RXM)</option>
          <option value="Aproximativ 1/2 rezervor">Aproximativ 1/2 rezervor</option>
          <option value="Rezervor Plin (1/1)">Rezervor Plin (1/1)</option>
          <option value="Rezervă aprinsă (Minim combustibil)">Rezervă aprinsă (Minim combustibil)</option>
        </select>
      </div>

      {/* Mențiuni Suplimentare Predare */}
      <div>
        <label className="text-[11px] text-zinc-400 font-medium">Mențiuni predare / alte accesorii (opțional):</label>
        <input
          type="text"
          value={buyerData.deliveryNotes || ''}
          onChange={(e) => setBuyerData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
          placeholder="Ex: Predat al 2-lea set jante aliaj în portbagaj, 4 prezoane antifurt..."
        />
      </div>
    </div>
  );
};
