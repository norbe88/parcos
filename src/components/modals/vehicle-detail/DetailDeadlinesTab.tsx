import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, AlertTriangle, CheckCircle2, ShieldAlert, 
  FileCheck2, Car, Sparkles, Save, RotateCcw, Lock
} from 'lucide-react';
import { VehicleItem } from '../../../db/types';

interface DetailDeadlinesTabProps {
  car: VehicleItem;
  onUpdateVehicleDeadlines?: (
    carId: string, 
    deadlines: {
      hasRedPlates?: boolean;
      redPlatesExpiresAt?: string;
      itpExpiresAt?: string;
      rarAppointmentDate?: string;
    }
  ) => void;
  showToast?: (msg: string) => void;
}

export const DetailDeadlinesTab: React.FC<DetailDeadlinesTabProps> = ({
  car,
  onUpdateVehicleDeadlines,
  showToast
}) => {
  const [hasRedPlates, setHasRedPlates] = useState<boolean>(
    car.hasRedPlates ?? !!car.redPlatesExpiresAt
  );
  const [redPlatesExpiresAt, setRedPlatesExpiresAt] = useState<string>(
    car.redPlatesExpiresAt || ''
  );
  const [itpExpiresAt, setItpExpiresAt] = useState<string>(
    car.itpExpiresAt || ''
  );
  const [rarAppointmentDate, setRarAppointmentDate] = useState<string>(
    car.rarAppointmentDate || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sincronizare la schimbarea mașinii
  useEffect(() => {
    setHasRedPlates(car.hasRedPlates ?? !!car.redPlatesExpiresAt);
    setRedPlatesExpiresAt(car.redPlatesExpiresAt || '');
    setItpExpiresAt(car.itpExpiresAt || '');
    setRarAppointmentDate(car.rarAppointmentDate || '');
    setIsSaved(false);
  }, [car.id, car.hasRedPlates, car.redPlatesExpiresAt, car.itpExpiresAt, car.rarAppointmentDate]);

  const today = new Date();

  // Helper calcul zile rămase
  const getDiffDays = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const redPlatesDiff = getDiffDays(redPlatesExpiresAt);
  const itpDiff = getDiffDays(itpExpiresAt);
  const rarDiff = getDiffDays(rarAppointmentDate);

  // Setare preseturi zile de la azi
  const setDaysFromToday = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setRedPlatesExpiresAt(d.toISOString().split('T')[0]);
    setHasRedPlates(true);
  };

  // Setare preseturi ani pentru ITP (1 sau 2 ani)
  const setYearsFromTodayItp = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    setItpExpiresAt(d.toISOString().split('T')[0]);
  };

  const handleSave = () => {
    if (onUpdateVehicleDeadlines) {
      onUpdateVehicleDeadlines(car.id, {
        hasRedPlates,
        redPlatesExpiresAt: hasRedPlates ? redPlatesExpiresAt : undefined,
        itpExpiresAt: itpExpiresAt || undefined,
        rarAppointmentDate: rarAppointmentDate || undefined
      });
    }
    setIsSaved(true);
    showToast?.(`Termenele pentru ${car.brand} ${car.model} au fost salvate cu succes!`);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setHasRedPlates(car.hasRedPlates ?? !!car.redPlatesExpiresAt);
    setRedPlatesExpiresAt(car.redPlatesExpiresAt || '');
    setItpExpiresAt(car.itpExpiresAt || '');
    setRarAppointmentDate(car.rarAppointmentDate || '');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 🔒 Banner Confidențialitate Dealer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-300">
            Panou Intern Gestiune Flotă — Exclusiv Dealer Autorizat
          </div>
          <p className="text-zinc-300 text-[11.5px] mt-0.5 leading-relaxed">
            Aceste termene administrative (numere roșii provizorii, valabilitate ITP și programare RAR) sunt strict interne pentru operarea parcului auto și <strong>nu sunt vizibile clienților în showroom</strong>.
          </p>
        </div>
      </div>

      {/* 📊 Carduri Indicatori Status Curent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Numere Roșii */}
        <div className={`p-3.5 rounded-xl border ${
          !hasRedPlates
            ? 'bg-black/30 border-white/10 text-zinc-400'
            : redPlatesDiff !== null && redPlatesDiff <= 5
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            : redPlatesDiff !== null && redPlatesDiff <= 15
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Numere Roșii</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-bold text-white font-mono">
            {!hasRedPlates 
              ? 'Fără Numere Roșii' 
              : redPlatesDiff !== null && redPlatesDiff <= 0 
              ? 'Expirate!' 
              : redPlatesDiff !== null 
              ? `${redPlatesDiff} Zile Rămase` 
              : 'Dată Nesetată'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {hasRedPlates && redPlatesExpiresAt ? `Expiră la: ${redPlatesExpiresAt}` : 'Mașina e înmatriculată sau pe platformă'}
          </div>
        </div>

        {/* ITP */}
        <div className={`p-3.5 rounded-xl border ${
          !itpExpiresAt
            ? 'bg-black/30 border-white/10 text-zinc-400'
            : itpDiff !== null && itpDiff <= 10
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            : itpDiff !== null && itpDiff <= 30
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Inspecție ITP</span>
            <FileCheck2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-bold text-white font-mono">
            {!itpExpiresAt 
              ? 'ITP Nesetat' 
              : itpDiff !== null && itpDiff <= 0 
              ? 'ITP Expirat!' 
              : itpDiff !== null 
              ? `${itpDiff} Zile Rămase` 
              : itpExpiresAt}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {itpExpiresAt ? `Valabil până la: ${itpExpiresAt}` : 'Fără dată înregistrată'}
          </div>
        </div>

        {/* Programare RAR */}
        <div className={`p-3.5 rounded-xl border ${
          !rarAppointmentDate
            ? 'bg-black/30 border-white/10 text-zinc-400'
            : 'bg-blue-500/10 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Programare RAR</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-bold text-white font-mono">
            {rarAppointmentDate 
              ? (rarDiff !== null && rarDiff >= 0 ? `Peste ${rarDiff} Zile` : 'Programare Trecută')
              : 'Fără Programare'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {rarAppointmentDate ? `Data: ${rarAppointmentDate}` : 'Certificat / Carte CIV deja emisă'}
          </div>
        </div>
      </div>

      {/* 📝 Formular Editare Termene */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141417] border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Configurare Date Administrative & Autorizații</span>
        </h4>

        {/* Secțiune 1: Numere Roșii */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hasRedPlates}
                  onChange={e => {
                    const checked = e.target.checked;
                    setHasRedPlates(checked);
                    if (checked && !redPlatesExpiresAt) {
                      setDaysFromToday(30);
                    }
                  }}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>Are Numere Roșii Provizorii Eliberate</span>
              </label>
              <p className="text-[10.5px] text-zinc-400 mt-0.5 ml-6">
                Activează monitorizarea termenului de 30/60/90 zile în panoul administrativ
              </p>
            </div>

            {hasRedPlates && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Activ în flotă
              </span>
            )}
          </div>

          {hasRedPlates && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
              <label className="block text-zinc-300 text-xs font-medium">
                Data Expirării Numerelor Roșii:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="date"
                  value={redPlatesExpiresAt}
                  onChange={e => setRedPlatesExpiresAt(e.target.value)}
                  className="bg-[#1c1c21] border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 font-mono flex-1 min-h-[42px]"
                />
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDaysFromToday(30)}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-xs font-semibold text-zinc-300 transition-all"
                  >
                    +30 Zile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysFromToday(60)}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-xs font-semibold text-zinc-300 transition-all"
                  >
                    +60 Zile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysFromToday(90)}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-xs font-semibold text-zinc-300 transition-all"
                  >
                    +90 Zile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secțiune 2: Termen ITP & Programare RAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* ITP */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
            <label className="block text-zinc-300 text-xs font-medium">
              Data Expirare ITP (Inspecție Tehnică):
            </label>
            <div className="space-y-2">
              <input 
                type="date"
                value={itpExpiresAt}
                onChange={e => setItpExpiresAt(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 font-mono min-h-[42px]"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setYearsFromTodayItp(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-300 transition-all"
                >
                  +1 An ITP
                </button>
                <button
                  type="button"
                  onClick={() => setYearsFromTodayItp(2)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-300 transition-all"
                >
                  +2 Ani ITP
                </button>
                {itpExpiresAt && (
                  <button
                    type="button"
                    onClick={() => setItpExpiresAt('')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[11px] font-semibold text-red-300 transition-all ml-auto"
                  >
                    Șterge
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Programare RAR */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
            <label className="block text-zinc-300 text-xs font-medium">
              Data Programare RAR (Omologare / CIV):
            </label>
            <div className="space-y-2">
              <input 
                type="date"
                value={rarAppointmentDate}
                onChange={e => setRarAppointmentDate(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 font-mono min-h-[42px]"
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Notificare automată în bord înainte de termen</span>
                {rarAppointmentDate && (
                  <button
                    type="button"
                    onClick={() => setRarAppointmentDate('')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 font-semibold text-red-300 transition-all"
                  >
                    Șterge
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Butoane Salvare & Reset */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetează</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`min-h-[42px] px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
              isSaved 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvat cu Succes!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvează Modificările</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
