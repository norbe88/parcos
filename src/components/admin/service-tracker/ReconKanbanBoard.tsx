import React from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle2, Receipt, 
  ChevronLeft, ChevronRight, Clock 
} from 'lucide-react';
import { VehicleItem, VehicleReconStatus } from '../../../db/types';
import { RECON_COLUMNS, getCarHoldingCostMetrics } from './reconHelpers';

interface ReconKanbanBoardProps {
  cars: VehicleItem[];
  onSelectCar: (carId: string) => void;
  onMoveStatus: (carId: string, nextStatus: VehicleReconStatus) => void;
}

export const ReconKanbanBoard: React.FC<ReconKanbanBoardProps> = ({
  cars,
  onSelectCar,
  onMoveStatus
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
      {RECON_COLUMNS.map((column, colIdx) => {
        const colCars = cars.filter(c => c.reconStatus === column.id);

        return (
          <div 
            key={column.id}
            className="bg-[#121215]/80 border border-white/[0.07] rounded-2xl p-3 flex flex-col min-h-[600px] shadow-sm"
          >
            {/* Antet Coloană */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-base">{column.icon}</span>
                <h3 className="font-semibold text-xs text-white">
                  {column.title}
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${column.badgeBg} ${column.badgeText} border ${column.borderColor}`}>
                {colCars.length}
              </span>
            </div>

            {/* Listă Carduri Vehicul */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
              {colCars.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-xs border border-dashed border-white/[0.04] rounded-xl">
                  Nicio mașină în acest stadiu
                </div>
              ) : (
                colCars.map(car => {
                  const totalExpenses = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
                  const openDefects = (car.reconDefects || []).filter(d => !d.resolved).length;
                  const receiptCount = 
                    (car.expenses || []).reduce((s, e) => s + (e.receipts?.length || 0), 0) + 
                    (car.technicalDocuments?.length || 0);
                  
                  const holdingMetrics = getCarHoldingCostMetrics(car);

                  return (
                    <div
                      key={car.id}
                      onClick={() => onSelectCar(car.id)}
                      className="bg-[#18181c] hover:bg-[#1e1e24] border border-white/[0.06] hover:border-amber-500/40 rounded-xl p-3 cursor-pointer transition-all group shadow-sm flex flex-col gap-2.5"
                    >
                      {/* Imagine & Titlu */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 relative">
                          {car.images?.[0] ? (
                            <img 
                              src={car.images[0]} 
                              alt={`${car.brand} ${car.model}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">
                              Fără foto
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                            {car.brand} {car.model}
                          </h4>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <span>{car.year}</span>
                            <span>•</span>
                            <span>{car.mileageKm.toLocaleString('ro-RO')} km</span>
                          </div>
                          <div className="text-[9px] font-mono text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                            <span>VIN:</span>
                            <span>{car.vin?.slice(0, 11) || '—'}...</span>
                          </div>
                        </div>
                      </div>

                      {/* Indicatori & Badge-uri Status */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.04]">
                        {/* Cost Service */}
                        {totalExpenses > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {totalExpenses.toLocaleString('ro-RO')} €
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                            Fără costuri
                          </span>
                        )}

                        {/* Defecțiuni */}
                        {openDefects > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {openDefects} def.
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ok
                          </span>
                        )}

                        {/* Bonuri & Acte */}
                        {receiptCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-medium flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            {receiptCount}
                          </span>
                        )}

                        {/* Holding Cost & Zile în stadiu */}
                        {column.id !== 'ready_for_sale' && (
                          <span 
                            title={
                              holdingMetrics.isOverdue 
                                ? `Atenție: Peste 5 zile în atelier! Cost imobilizat estimat: ${holdingMetrics.costEur} € (35 €/zi)` 
                                : `Zile în atelier: ${holdingMetrics.daysInPrep}`
                            }
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                              holdingMetrics.isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {holdingMetrics.daysInPrep}z
                            {holdingMetrics.costEur > 0 && ` (${holdingMetrics.costEur}€)`}
                          </span>
                        )}
                      </div>

                      {/* Butoane Navigare Rapidă Coloane */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                        {colIdx > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStatus(car.id, RECON_COLUMNS[colIdx - 1].id);
                            }}
                            title={`Mută înapoi în ${RECON_COLUMNS[colIdx - 1].shortLabel}`}
                            className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : <span />}

                        <span className="text-[9px] text-zinc-500">Apasă pentru fișă</span>

                        {colIdx < RECON_COLUMNS.length - 1 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStatus(car.id, RECON_COLUMNS[colIdx + 1].id);
                            }}
                            title={`Avancează în ${RECON_COLUMNS[colIdx + 1].shortLabel}`}
                            className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : <span />}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
