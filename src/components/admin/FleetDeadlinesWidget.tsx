import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, Calendar, CheckCircle2, 
  ChevronRight, Car, ShieldAlert, Sparkles, Plus, Edit2, 
  X, Check, FileCheck2, ArrowRight
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';

interface FleetDeadlinesWidgetProps {
  cars: VehicleItem[];
  onUpdatePlateExpiry?: (carId: string, newDate: string) => void;
  onUpdateVehicleDeadlines?: (
    carId: string, 
    deadlines: {
      hasRedPlates?: boolean;
      redPlatesExpiresAt?: string;
      itpExpiresAt?: string;
      rarAppointmentDate?: string;
    }
  ) => void;
  onSelectCar?: (car: VehicleItem) => void;
  showToast: (msg: string) => void;
}

export const FleetDeadlinesWidget: React.FC<FleetDeadlinesWidgetProps> = ({
  cars,
  onUpdatePlateExpiry,
  onUpdateVehicleDeadlines,
  onSelectCar,
  showToast
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedEnrollCarId, setSelectedEnrollCarId] = useState<string>('');
  const [enrollDays, setEnrollDays] = useState<number>(30);

  const today = new Date();

  // Calcul mașini cu numere roșii sau ITP active
  const monitoredCars = cars.filter(c => c.hasRedPlates || c.redPlatesExpiresAt || c.itpExpiresAt);
  const unmonitoredCars = cars.filter(c => !(c.hasRedPlates || c.redPlatesExpiresAt || c.itpExpiresAt));

  const stats = monitoredCars.reduce((acc, car) => {
    if (!car.redPlatesExpiresAt) return acc;
    const diffDays = Math.ceil((new Date(car.redPlatesExpiresAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 5) {
      acc.critical.push({ car, days: diffDays });
    } else if (diffDays <= 15) {
      acc.warning.push({ car, days: diffDays });
    } else {
      acc.ok.push({ car, days: diffDays });
    }
    return acc;
  }, { critical: [] as { car: VehicleItem; days: number }[], warning: [] as { car: VehicleItem; days: number }[], ok: [] as { car: VehicleItem; days: number }[] });

  const totalAlerts = stats.critical.length + stats.warning.length;

  const handleSaveQuickRenewal = (carId: string, daysToAdd: number = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split('T')[0];
    if (onUpdateVehicleDeadlines) {
      onUpdateVehicleDeadlines(carId, { hasRedPlates: true, redPlatesExpiresAt: dateStr });
    } else if (onUpdatePlateExpiry) {
      onUpdatePlateExpiry(carId, dateStr);
    }
    showToast(`Numerele roșii au fost prelungite cu ${daysToAdd} zile (până la ${dateStr})!`);
    setEditingCarId(null);
  };

  const handleStartEdit = (car: VehicleItem) => {
    setEditingCarId(car.id);
    setEditDate(car.redPlatesExpiresAt || new Date().toISOString().split('T')[0]);
  };

  const handleSaveCustomDate = (carId: string) => {
    if (!editDate) return;
    if (onUpdateVehicleDeadlines) {
      onUpdateVehicleDeadlines(carId, { hasRedPlates: true, redPlatesExpiresAt: editDate });
    } else if (onUpdatePlateExpiry) {
      onUpdatePlateExpiry(carId, editDate);
    }
    showToast(`Data expirării a fost actualizată la ${editDate}!`);
    setEditingCarId(null);
  };

  const handleEnrollCar = () => {
    if (!selectedEnrollCarId) {
      showToast('Selectați o mașină din parcul auto.');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + enrollDays);
    const dateStr = d.toISOString().split('T')[0];
    
    if (onUpdateVehicleDeadlines) {
      onUpdateVehicleDeadlines(selectedEnrollCarId, { hasRedPlates: true, redPlatesExpiresAt: dateStr });
    } else if (onUpdatePlateExpiry) {
      onUpdatePlateExpiry(selectedEnrollCarId, dateStr);
    }

    const enrolledCar = cars.find(c => c.id === selectedEnrollCarId);
    showToast(`✅ ${enrolledCar ? `${enrolledCar.brand} ${enrolledCar.model}` : 'Vehiculul'} a fost înrolat cu numere roșii până la ${dateStr}!`);
    setSelectedEnrollCarId('');
    setIsEnrollOpen(false);
  };

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Antet Widget cu Contoare */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            stats.critical.length > 0
              ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
              : stats.warning.length > 0
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Monitor Termene Parc & Numere Roșii
              </h2>
              {totalAlerts > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  {totalAlerts} {totalAlerts === 1 ? 'Atenționare' : 'Atenționări'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Toate în termen
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Urmărire autorizații provizorii (30/60/90 zile), programări RAR și inspecții tehnice
            </p>
          </div>
        </div>

        {/* Butoane Acțiuni Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsEnrollOpen(!isEnrollOpen);
              if (!isExpanded) setIsExpanded(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors min-h-[40px] touch-manipulation cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Înrolează Mașină</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-xs font-medium text-zinc-300 transition-colors min-h-[40px] touch-manipulation cursor-pointer"
          >
            <span>{isExpanded ? 'Restrânge Panoul' : `Vezi Detalii Flotă (${monitoredCars.length})`}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rând Indicatori Rapizi (1 coloană pe mobil, 3 pe desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-3 border-t border-white/[0.06] text-xs">
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          stats.critical.length > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-black/20 border-white/[0.06] text-zinc-400'
        }`}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider">Expiră în ≤ 5 Zile</div>
            <div className="font-mono font-bold text-lg text-white mt-0.5">{stats.critical.length} mașini</div>
          </div>
          <AlertTriangle className="w-5 h-5 opacity-80 text-rose-400" />
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          stats.warning.length > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-black/20 border-white/[0.06] text-zinc-400'
        }`}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider">Atenție (6 - 15 Zile)</div>
            <div className="font-mono font-bold text-lg text-white mt-0.5">{stats.warning.length} mașini</div>
          </div>
          <Clock className="w-5 h-5 opacity-80 text-amber-400" />
        </div>

        <div className="p-3 rounded-xl border bg-black/20 border-white/[0.06] text-zinc-400 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider">Valabile &gt; 15 Zile</div>
            <div className="font-mono font-bold text-lg text-emerald-400 mt-0.5">{stats.ok.length} mașini</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* ➕ Formular Rapid Înrolare Mașină Nouă în Monitorizare */}
      {isEnrollOpen && (
        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Înrolează o Mașină din Parc în Monitorizarea Numerelor Roșii</span>
            </div>
            <button 
              type="button" 
              onClick={() => setIsEnrollOpen(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-zinc-400 mb-1">Selectează Vehiculul din Stoc:</label>
              <select
                value={selectedEnrollCarId}
                onChange={e => setSelectedEnrollCarId(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 min-h-[40px]"
              >
                <option value="">-- Alege autovehiculul ({unmonitoredCars.length} disponibile) --</option>
                {unmonitoredCars.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} ({c.year}) — VIN: {c.vin ? c.vin.slice(-8) : 'Fără VIN'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Durată Autorizație:</label>
              <select
                value={enrollDays}
                onChange={e => setEnrollDays(Number(e.target.value))}
                className="w-full bg-[#1c1c21] border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 min-h-[40px]"
              >
                <option value={30}>30 Zile (1 lună)</option>
                <option value={60}>60 Zile (2 luni)</option>
                <option value={90}>90 Zile (3 luni max)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEnrollOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleEnrollCar}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmă Înrolarea</span>
            </button>
          </div>
        </div>
      )}

      {/* Secțiune Expandată: Lista mașinilor cu termene active */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2">
            <span>Mașini cu Termene de Circulație Înregistrate ({monitoredCars.length}):</span>
            <span className="text-[11px] text-zinc-500 font-normal">Click pe mașină pentru detalii complete</span>
          </div>
          
          <div className="divide-y divide-white/[0.04] bg-black/30 border border-white/06 rounded-xl overflow-hidden">
            {monitoredCars.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 italic space-y-2">
                <div>Nu există mașini cu numere roșii sau date de expirare setate.</div>
                <button
                  type="button"
                  onClick={() => setIsEnrollOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Înrolează prima mașină acum</span>
                </button>
              </div>
            ) : (
              monitoredCars.map(c => {
                const diff = c.redPlatesExpiresAt
                  ? Math.ceil((new Date(c.redPlatesExpiresAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                const isCritical = diff !== null && diff <= 5;
                const isWarning = diff !== null && diff > 5 && diff <= 15;
                const isEditing = editingCarId === c.id;

                return (
                  <div key={c.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div 
                      onClick={() => onSelectCar && onSelectCar(c)}
                      className="flex items-center gap-3 cursor-pointer group flex-1"
                    >
                      <img src={c.images[0]} alt="" className="w-12 h-9 rounded-lg object-cover bg-zinc-800 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                          <span>{c.brand} {c.model} ({c.year})</span>
                          <span className="text-[10px] text-zinc-500 font-normal">({c.stockNumber})</span>
                        </div>
                        <div className="text-[10.5px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>VIN: {c.vin ? c.vin.slice(-8) : 'N/A'}</span>
                          {c.itpExpiresAt && (
                            <span className="text-zinc-500">• ITP: {c.itpExpiresAt}</span>
                          )}
                          {c.rarAppointmentDate && (
                            <span className="text-blue-400">• RAR: {c.rarAppointmentDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-amber-500/30">
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="bg-[#1c1c21] border border-white/15 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCustomDate(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold"
                          >
                            Salvează
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCarId(null)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {c.redPlatesExpiresAt ? (
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                isCritical 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                  : isWarning 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                <span>Numere Roșii: {diff !== null && diff <= 0 ? 'Expirate!' : `${diff} zile rămase`}</span>
                              </span>
                              <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                                Expiră: {c.redPlatesExpiresAt}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">Fără dată setată</span>
                          )}

                          {/* Acțiuni rapide de prelungire & editare */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveQuickRenewal(c.id, 30)}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/30 text-xs text-amber-300 font-semibold transition-all touch-manipulation inline-flex items-center gap-1 cursor-pointer"
                              title="Prelungește autorizația cu 30 de zile"
                            >
                              <span>+30 Zile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(c)}
                              className="min-h-[36px] p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all touch-manipulation inline-flex items-center justify-center cursor-pointer"
                              title="Editează data manual"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
