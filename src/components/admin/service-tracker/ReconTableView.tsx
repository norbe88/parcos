import React from 'react';
import { Clock } from 'lucide-react';
import { VehicleItem } from '../../../db/types';
import { RECON_COLUMNS, getCarHoldingCostMetrics } from './reconHelpers';

interface ReconTableViewProps {
  cars: VehicleItem[];
  onSelectCar: (carId: string) => void;
}

export const ReconTableView: React.FC<ReconTableViewProps> = ({
  cars,
  onSelectCar
}) => {
  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-black/50 text-zinc-400 border-b border-white/[0.06] text-[11px] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Vehicul</th>
              <th className="p-3.5">VIN</th>
              <th className="p-3.5">Status Recon</th>
              <th className="p-3.5">Preț Achiziție</th>
              <th className="p-3.5">Cheltuieli Service</th>
              <th className="p-3.5">Total Investit</th>
              <th className="p-3.5">Preț Vânzare</th>
              <th className="p-3.5">Marjă Est.</th>
              <th className="p-3.5">Zile / Holding</th>
              <th className="p-3.5 text-right">Acțiune</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {cars.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-zinc-500">
                  Niciun vehicul găsit conform filtrelor aplicate.
                </td>
              </tr>
            ) : (
              cars.map(car => {
                const purchase = car.purchasePriceEur || 0;
                const totalExp = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
                const totalInvested = purchase + totalExp;
                const margin = car.priceEur - totalInvested;
                const col = RECON_COLUMNS.find(c => c.id === car.reconStatus);
                const holdingMetrics = getCarHoldingCostMetrics(car);

                return (
                  <tr 
                    key={car.id}
                    onClick={() => onSelectCar(car.id)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-white">{car.brand} {car.model}</div>
                      <div className="text-[10px] text-zinc-500">{car.year} • {car.fuelType}</div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                      {car.vin || '—'}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${col?.badgeBg} ${col?.badgeText}`}>
                        {col?.shortLabel || '—'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-zinc-300">
                      {purchase > 0 ? `${purchase.toLocaleString('ro-RO')} €` : '—'}
                    </td>

                    <td className="p-3.5 font-mono text-amber-400 font-medium">
                      {totalExp > 0 ? `${totalExp.toLocaleString('ro-RO')} €` : '0 €'}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-white">
                      {totalInvested > 0 ? `${totalInvested.toLocaleString('ro-RO')} €` : '—'}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      {car.priceEur.toLocaleString('ro-RO')} €
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className={margin >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {margin.toLocaleString('ro-RO')} €
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      {car.reconStatus !== 'ready_for_sale' ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          holdingMetrics.isOverdue ? 'text-rose-400' : 'text-zinc-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {holdingMetrics.daysInPrep}z
                          {holdingMetrics.costEur > 0 && ` (~${holdingMetrics.costEur} €)`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">Gata Showroom</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCar(car.id);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium transition-colors"
                      >
                        Deschide Fișa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
