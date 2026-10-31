import React from 'react';
import { Car, CheckCircle2 } from 'lucide-react';
import { VehicleItem } from '../../../db/seed';
import { BuyerData } from '../../print/types';

interface VehicleDataSidebarSectionProps {
  editableCar: VehicleItem;
  setEditableCar: React.Dispatch<React.SetStateAction<VehicleItem>>;
  cars: VehicleItem[];
  setBuyerData: React.Dispatch<React.SetStateAction<BuyerData>>;
  showToast: (msg: string) => void;
  dealerPrefix?: string;
}

export const VehicleDataSidebarSection: React.FC<VehicleDataSidebarSectionProps> = ({
  editableCar,
  setEditableCar,
  cars,
  setBuyerData,
  showToast,
  dealerPrefix = 'FT'
}) => {
  return (
    <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
      <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-amber-400" />
          <span>Date Autovehicul & Serie Șasiu (VIN)</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          {editableCar.vin ? `${editableCar.vin.trim().length}/17 car.` : 'Fără VIN'}
        </span>
      </div>

      {/* Selector Mașină din Parc sau Manual */}
      {cars.length > 0 && (
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Alege din stoc sau editează liber:</label>
          <select
            value={cars.some(c => c.id === editableCar.id) ? editableCar.id : 'custom'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') {
                // Rămâne pe editare liberă
              } else {
                const selected = cars.find(c => c.id === val);
                if (selected) {
                  setEditableCar({ ...selected });
                  setBuyerData(prev => ({
                    ...prev,
                    agreedPriceEur: selected.priceEur,
                    agreedPriceRon: Math.round(selected.priceEur * prev.exchangeRate),
                    deliveryMileageKm: selected.mileageKm,
                    invoiceNumber: `${dealerPrefix}-FT-${new Date().getFullYear()}-${selected.stockNumber || selected.vin.slice(-4).toUpperCase()}`
                  }));
                  showToast(`S-a încărcat vehiculul: ${selected.brand} ${selected.model} (VIN: ${selected.vin})`);
                }
              }
            }}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
          >
            <option value="custom">✏️ Editare Manuală / Vehicul Personalizat</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.year}) — VIN: {c.vin}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Serie Șasiu (VIN) — Câmp principal modificabil de dealer */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
            <span>Serie Șasiu (VIN)</span>
            <span className="text-[10px] text-zinc-400 font-normal">• Obligatoriu DITL/RAR</span>
          </label>
          {editableCar.vin.trim().length === 17 ? (
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> 17/17 caractere
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-medium">
              {editableCar.vin.trim().length}/17 car.
            </span>
          )}
        </div>
        <input 
          type="text"
          value={editableCar.vin}
          onChange={(e) => {
            const cleanVin = e.target.value.toUpperCase().replace(/\s+/g, '');
            setEditableCar(prev => ({ ...prev, vin: cleanVin }));
          }}
          className="w-full bg-[#18181b] border-2 border-amber-500/50 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-amber-300 tracking-wider mt-1 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
          placeholder="Ex: VF1... sau WBA... (17 caractere)"
          maxLength={17}
        />
      </div>

      {/* Marcă & Model */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Marcă</label>
          <input 
            type="text"
            value={editableCar.brand}
            onChange={(e) => setEditableCar(prev => ({ ...prev, brand: e.target.value }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="Ex: Audi, BMW, Renault"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Model</label>
          <input 
            type="text"
            value={editableCar.model}
            onChange={(e) => setEditableCar(prev => ({ ...prev, model: e.target.value }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="Ex: A6, 320d, Megane"
          />
        </div>
      </div>

      {/* Versiune / Echipare */}
      <div>
        <label className="text-[11px] text-zinc-400 font-medium">Versiune / Motorizare</label>
        <input 
          type="text"
          value={editableCar.versionTrim || ''}
          onChange={(e) => setEditableCar(prev => ({ ...prev, versionTrim: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
          placeholder="Ex: 2.0 TDI S-Line, 1.5 dCi Energy"
        />
      </div>

      {/* An, Rulaj, Cilindree, Putere */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">An Fabricație</label>
          <input 
            type="number"
            value={editableCar.year || ''}
            onChange={(e) => setEditableCar(prev => ({ ...prev, year: Number(e.target.value) || new Date().getFullYear() }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="2018"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Rulaj (Km)</label>
          <input 
            type="number"
            value={editableCar.mileageKm || ''}
            onChange={(e) => {
              const km = Number(e.target.value) || 0;
              setEditableCar(prev => ({ ...prev, mileageKm: km }));
              setBuyerData(prev => ({ ...prev, deliveryMileageKm: km }));
            }}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="145000"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Cilindree (cmc)</label>
          <input 
            type="number"
            value={editableCar.engineCc || ''}
            onChange={(e) => setEditableCar(prev => ({ ...prev, engineCc: Number(e.target.value) || 0 }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="1995"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Putere (CP)</label>
          <input 
            type="number"
            value={editableCar.powerHp || ''}
            onChange={(e) => setEditableCar(prev => ({ ...prev, powerHp: Number(e.target.value) || 0 }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="150"
          />
        </div>
      </div>

      {/* Combustibil, Serie CIV, Număr Înmatriculare */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Combustibil</label>
          <select
            value={editableCar.fuelType}
            onChange={(e) => setEditableCar(prev => ({ ...prev, fuelType: e.target.value as any }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
          >
            <option value="Diesel">Diesel</option>
            <option value="Benzină">Benzină</option>
            <option value="Hibrid">Hibrid</option>
            <option value="Electric">Electric</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Serie CIV</label>
          <input 
            type="text"
            value={editableCar.civSeries || ''}
            onChange={(e) => setEditableCar(prev => ({ ...prev, civSeries: e.target.value.toUpperCase() }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="X123456"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Nr. Înmatr./Roșu</label>
          <input 
            type="text"
            value={editableCar.licensePlate || ''}
            onChange={(e) => setEditableCar(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="CJ 01 ABC"
          />
        </div>
      </div>
    </div>
  );
};
