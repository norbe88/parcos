import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { BuyerData } from '../../print/types';

interface InspectionSidebarSectionProps {
  buyerData: BuyerData;
  setBuyerData: React.Dispatch<React.SetStateAction<BuyerData>>;
}

export const InspectionSidebarSection: React.FC<InspectionSidebarSectionProps> = ({
  buyerData,
  setBuyerData
}) => {
  return (
    <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Parametri Inspecție Tehnică</span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
          100+ PUNCTE
        </span>
      </div>

      <div>
        <label className="text-[11px] text-zinc-400 font-medium">Inspector Tehnic Acreditat</label>
        <input
          type="text"
          value={buyerData.inspectorName || ''}
          onChange={(e) => setBuyerData(prev => ({ ...prev, inspectorName: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
          placeholder="Ex: Ing. Mihai Radu (Inspector Tehnic Auto)"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Data Inspecției</label>
          <input
            type="date"
            value={buyerData.inspectionDate || buyerData.contractDate}
            onChange={(e) => setBuyerData(prev => ({ ...prev, inspectionDate: e.target.value }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Grosime Vopsea (μm)</label>
          <input
            type="number"
            value={buyerData.paintThicknessMicronsAvg ?? 118}
            onChange={(e) => setBuyerData(prev => ({ ...prev, paintThicknessMicronsAvg: parseInt(e.target.value) || 110 }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="118"
          />
        </div>
      </div>

      {/* Rating Calitate Generală */}
      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
          Verdict / Calificativ General Showroom:
        </label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'exceptional', label: 'Excepțională' },
            { key: 'foarte_buna', label: 'Foarte Bună (Std)' },
            { key: 'buna', label: 'Bună' }
          ].map(rating => (
            <button
              key={rating.key}
              type="button"
              onClick={() => setBuyerData(prev => ({ ...prev, generalConditionRating: rating.key as any }))}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                (buyerData.generalConditionRating || 'foarte_buna') === rating.key
                  ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {rating.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnoză OBD */}
      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
          Rezultat Scanare Tester OBD-II:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setBuyerData(prev => ({ ...prev, obdScanResult: 'clean' }))}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
              (buyerData.obdScanResult || 'clean') === 'clean'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            ✓ Zero Erori Active (Curat)
          </button>
          <button
            type="button"
            onClick={() => setBuyerData(prev => ({ ...prev, obdScanResult: 'minor' }))}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
              buyerData.obdScanResult === 'minor'
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Erori Istorice Șterse
          </button>
        </div>
      </div>

      {/* Profil Anvelope & Plăcuțe */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
        <div>
          <label className="text-[10px] text-zinc-400 font-medium">Profil Anvelope (Față / Spate mm)</label>
          <div className="flex gap-1 mt-0.5">
            <input
              type="number"
              step="0.1"
              value={buyerData.tireTreadFrontMm ?? 6.5}
              onChange={(e) => setBuyerData(prev => ({ ...prev, tireTreadFrontMm: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              placeholder="F: 6.5"
            />
            <input
              type="number"
              step="0.1"
              value={buyerData.tireTreadRearMm ?? 6.2}
              onChange={(e) => setBuyerData(prev => ({ ...prev, tireTreadRearMm: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              placeholder="S: 6.2"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-400 font-medium">Uzură Plăcuțe (Față / Spate %)</label>
          <div className="flex gap-1 mt-0.5">
            <input
              type="number"
              value={buyerData.brakePadsFrontPct ?? 25}
              onChange={(e) => setBuyerData(prev => ({ ...prev, brakePadsFrontPct: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              placeholder="F: 25%"
            />
            <input
              type="number"
              value={buyerData.brakePadsRearPct ?? 20}
              onChange={(e) => setBuyerData(prev => ({ ...prev, brakePadsRearPct: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              placeholder="S: 20%"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium">Observații Inspector Showroom:</label>
        <input
          type="text"
          value={buyerData.inspectionNotes || ''}
          onChange={(e) => setBuyerData(prev => ({ ...prev, inspectionNotes: e.target.value }))}
          className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
          placeholder="Ex: Fără urme de accident structural. Geometrie verificată..."
        />
      </div>
    </div>
  );
};
