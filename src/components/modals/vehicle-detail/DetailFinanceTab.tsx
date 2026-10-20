import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../../db/seed';
import { getWhatsAppFinanceUrl } from '../../../utils/helpers';
import { convertEurToRon, getExchangeRateDisclaimer } from '../../../utils/currencyEngine';

interface DetailFinanceTabProps {
  car: VehicleItem;
  advancePercent: number;
  setAdvancePercent: (val: number) => void;
  periodMonths: number;
  setPeriodMonths: (val: number) => void;
  currentRate: number;
  dealer?: typeof SEED_DEALER;
}

export const DetailFinanceTab: React.FC<DetailFinanceTabProps> = ({
  car,
  advancePercent,
  setAdvancePercent,
  periodMonths,
  setPeriodMonths,
  currentRate,
  dealer = SEED_DEALER
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
        <div className="text-xs text-amber-300 mb-0.5">Rată Lunară Estimată:</div>
        <div className="text-3xl font-black text-white font-mono">
          {currentRate} € <span className="text-sm font-normal text-zinc-400">/ lună</span>
        </div>
        <div className="text-xs font-mono font-bold text-amber-300 mt-1">
          {convertEurToRon(currentRate).toLocaleString('ro-RO')} RON / lună
        </div>
        <p className="text-[10.5px] text-zinc-400 mt-1.5 leading-snug">
          Dobândă de la <strong>7.9%</strong> pe an prin TBI Bank (principal), BT Direct sau UniCredit. {getExchangeRateDisclaimer()}
        </p>
      </div>
      <div>
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-baseline gap-1 text-xs mb-2">
          <label htmlFor="modal-advance-slider" className="text-zinc-300 cursor-pointer whitespace-nowrap">
            Avans inițial: <strong className="text-white">{advancePercent}%</strong>
          </label>
          <span className="text-zinc-400 whitespace-nowrap font-mono">
            {Math.round(car.priceEur * (advancePercent / 100)).toLocaleString('ro-RO')} €
          </span>
        </div>
        <input 
          id="modal-advance-slider"
          aria-label="Avans finanțare procentual"
          type="range" 
          min="0" 
          max="50" 
          step="5"
          value={advancePercent}
          onChange={e => setAdvancePercent(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer touch-manipulation"
        />
      </div>

      {/* Slider Perioadă */}
      <div>
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-baseline gap-1 text-xs mb-2">
          <label htmlFor="modal-months-slider" className="text-zinc-300 cursor-pointer whitespace-nowrap">
            Perioadă: <strong className="text-white">{periodMonths} luni</strong> <span className="text-zinc-400 text-[11px]">({periodMonths / 12} {periodMonths === 12 ? 'an' : 'ani'})</span>
          </label>
          <span className="text-zinc-400 text-[11px] whitespace-nowrap">Dobândă fixă LEI / EUR</span>
        </div>
        <input 
          id="modal-months-slider"
          aria-label="Perioadă finanțare în luni"
          type="range" 
          min="12" 
          max="60" 
          step="12"
          value={periodMonths}
          onChange={e => setPeriodMonths(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer touch-manipulation"
        />
      </div>

      {/* Contact Direct Consilier Finanțare Mădălina */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Consilier Credite & Leasing</div>
          <div className="text-white font-bold text-xs">Consultanță Rate: <span className="font-mono text-amber-300">0758 042 979</span></div>
        </div>
        <a 
          href={`tel:${(dealer.phoneFinance || '0758042979').replace(/\s+/g, '')}`}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors border border-white/10 shrink-0 touch-manipulation active:scale-95"
          title="Apelează consilierul de credite"
        >
          <Phone className="w-3 h-3 text-amber-400" />
          <span>Sună</span>
        </a>
      </div>

      <a 
        href={getWhatsAppFinanceUrl(car, dealer.whatsappFinance || '40758042979', advancePercent, periodMonths, 'TBI Bank', currentRate)}
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm h-11 rounded-xl transition-all shadow-lg shadow-amber-500/20 touch-manipulation active:scale-95"
      >
        <MessageCircle className="w-4 h-4 fill-black" />
        <span>Aplică pentru Finanțare pe WhatsApp</span>
      </a>
    </div>
  );
};
