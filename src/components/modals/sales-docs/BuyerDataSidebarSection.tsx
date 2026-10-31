import React from 'react';
import { User, DollarSign, ShieldCheck } from 'lucide-react';
import { VehicleItem } from '../../../db/seed';
import { BuyerData } from '../../print/types';
import { DealerProfile } from '../../../db/types';
import { ClientIdOcrScanner } from '../ClientIdOcrScanner';
import { ParsedClientIdDocument } from '../../../utils/clientIdOcrEngine';

interface BuyerDataSidebarSectionProps {
  buyerData: BuyerData;
  setBuyerData: React.Dispatch<React.SetStateAction<BuyerData>>;
  car: VehicleItem | null;
  wasAutoFilled: boolean;
  onOcrSuccess: (parsed: ParsedClientIdDocument) => void;
  onPriceEurChange: (eur: number) => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile | null;
  dealerPrefix?: string;
}

export const BuyerDataSidebarSection: React.FC<BuyerDataSidebarSectionProps> = ({
  buyerData,
  setBuyerData,
  car,
  wasAutoFilled,
  onOcrSuccess,
  onPriceEurChange,
  showToast,
  dealer,
  dealerPrefix = 'FT'
}) => {
  return (
    <>
      {/* Scanner Agentic OCR Buletin / C.I. (GDPR Compliant) */}
      <ClientIdOcrScanner 
        onSuccess={onOcrSuccess}
        showToast={showToast}
      />

      <div className={`bg-black/40 border p-4 rounded-xl space-y-3 transition-all duration-500 ${
        wasAutoFilled 
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' 
          : 'border-white/[0.08]'
      }`}>
        <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Date Cumpărător (Persoană Fizică / Juridică)</span>
          </div>
          {wasAutoFilled && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
              Autocompletat din Buletin
            </span>
          )}
        </div>

        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Nume și Prenume / Companie</label>
          <input 
            type="text"
            value={buyerData.fullName}
            onChange={(e) => setBuyerData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder="Ex: Popescu Mihai"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">C.N.P. / C.U.I.</label>
            <input 
              type="text"
              value={buyerData.cnpOrCui}
              onChange={(e) => setBuyerData(prev => ({ ...prev, cnpOrCui: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
              placeholder="185..."
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Act Identitate (CI/Pașaport)</label>
            <div className="flex gap-1 mt-0.5">
              <input 
                type="text"
                value={buyerData.idSeries}
                onChange={(e) => setBuyerData(prev => ({ ...prev, idSeries: e.target.value.toUpperCase() }))}
                className="w-12 bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center uppercase focus:border-amber-400 focus:outline-none"
                placeholder="CJ"
              />
              <input 
                type="text"
                value={buyerData.idNumber}
                onChange={(e) => setBuyerData(prev => ({ ...prev, idNumber: e.target.value }))}
                className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                placeholder="123456"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-[11px] text-zinc-400 font-medium">Adresă Domiciliu / Sediu</label>
            <input 
              type="text"
              value={buyerData.address}
              onChange={(e) => setBuyerData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
              placeholder="Strada, Număr, Bloc..."
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Județ</label>
            <input 
              type="text"
              value={buyerData.county}
              onChange={(e) => setBuyerData(prev => ({ ...prev, county: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
              placeholder="Cluj"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Telefon Contact</label>
            <input 
              type="text"
              value={buyerData.phone}
              onChange={(e) => setBuyerData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
              placeholder="0744..."
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Data Contractului</label>
            <input 
              type="date"
              value={buyerData.contractDate}
              onChange={(e) => setBuyerData(prev => ({ ...prev, contractDate: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Setare Preț Vânzare & Curs */}
      <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
        <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          Preț Vânzare & Monedă
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Preț Final Negociat (EUR)</label>
            <input 
              type="number"
              value={buyerData.agreedPriceEur}
              onChange={(e) => onPriceEurChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold mt-0.5 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Echivalent Curs BNR (RON)</label>
            <div className="w-full bg-zinc-900 border border-white/06 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold mt-0.5">
              {buyerData.agreedPriceRon.toLocaleString('ro-RO')} lei
            </div>
          </div>
        </div>
      </div>

      {/* Date Specifice Garanție & Facturare */}
      <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
        <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Factură & Garanție {dealer?.name ? dealer.name.split(' ')[0] : 'Showroom'}</span>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold">
            1 An / 10.000 KM
          </span>
        </div>

        <div>
          <label className="text-[11px] text-zinc-400 font-medium">Factură Fiscală Nr.</label>
          <input 
            type="text"
            value={buyerData.invoiceNumber || ''}
            onChange={(e) => setBuyerData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-semibold mt-0.5 focus:border-amber-400 focus:outline-none"
            placeholder={`Ex: ${dealerPrefix}-FT-${new Date().getFullYear()}-089`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">KM la Livrare</label>
            <input 
              type="number"
              value={buyerData.deliveryMileageKm ?? (car ? car.mileageKm : 0)}
              onChange={(e) => setBuyerData(prev => ({ ...prev, deliveryMileageKm: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
              placeholder="145000"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-medium">Data Începerii Garanției</label>
            <input 
              type="date"
              value={buyerData.warrantyStartDate || buyerData.contractDate}
              onChange={(e) => setBuyerData(prev => ({ ...prev, warrantyStartDate: e.target.value }))}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
};
