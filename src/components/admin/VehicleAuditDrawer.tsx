import React, { useState, useEffect } from 'react';
import { 
  X, Clock, FileText, CheckCircle2, AlertTriangle, ArrowRight, 
  DollarSign, Sparkles, Tag, Shield, Calendar, Save, User
} from 'lucide-react';
import { VehicleItem, VehicleAuditEntry, VehicleAuditAction } from '../../db/types';
import { getStockNumber, formatAuditDate } from '../../utils/helpers';

interface VehicleAuditDrawerProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSaveNotes?: (carId: string, notes: string) => void;
  showToast?: (msg: string) => void;
}

export const VehicleAuditDrawer: React.FC<VehicleAuditDrawerProps> = ({
  isOpen,
  car,
  onClose,
  onSaveNotes,
  showToast
}) => {
  const [internalNotes, setInternalNotes] = useState('');
  const [isNotesDirty, setIsNotesDirty] = useState(false);

  useEffect(() => {
    if (car) {
      setInternalNotes(car.internalNotes || '');
      setIsNotesDirty(false);
    }
  }, [car]);

  // Închidere la tasta Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !car) return null;

  const stockNumber = getStockNumber(car);
  const auditEntries = car.auditLog || [];

  const handleSaveNotesClick = () => {
    if (onSaveNotes) {
      onSaveNotes(car.id, internalNotes.trim());
      setIsNotesDirty(false);
      showToast?.('✓ Nota administrativă a fost salvată cu succes.');
    }
  };

  const getActionBadge = (action: VehicleAuditAction) => {
    switch (action) {
      case 'created':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'Înrolat în Parc'
        };
      case 'status_changed':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'Schimbare Status'
        };
      case 'price_updated':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400',
          label: 'Preț Modificat'
        };
      case 'deal_updated':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-400',
          label: 'Ofertă Specială'
        };
      case 'vat_toggled':
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400',
          label: 'Regim TVA'
        };
      case 'expenses_added':
        return {
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          dot: 'bg-teal-400',
          label: 'Cheltuială Service'
        };
      case 'red_plates_updated':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          label: 'Numere Roșii / Termen'
        };
      case 'note_added':
        return {
          bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
          dot: 'bg-zinc-400',
          label: 'Notă Operator'
        };
      case 'specs_updated':
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400',
          label: 'Descriere / Specificații'
        };
      default:
        return {
          bg: 'bg-white/10 text-zinc-300 border-white/20',
          dot: 'bg-zinc-400',
          label: 'Eveniment'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#0e0e11] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Header Drawer */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#121215] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg text-white truncate">
                    Jurnal Evenimente & Audit
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                    #{stockNumber}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {car.brand} {car.model} ({car.year}) • VIN: {car.vin}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Închide jurnalul (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corp Scrollabil */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
            
            {/* Secțiunea 1: Note Administrative Interne Operator (Ticket 04) */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Note Administrative Interne (Confidențiale Dealer)</span>
                </div>
                <span className="text-[10px] text-zinc-500">Exclusiv Operator</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Aceste note sunt vizibile strict în consola de gestiune admin și nu sunt expuse niciodată în showroom-ul public.
              </p>
              <textarea
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  setIsNotesDirty(true);
                }}
                placeholder="Ex: Avans 500 € primit de la dl. Popescu; clientul dorește numere negre definitive până pe 20..."
                rows={3}
                className="w-full bg-[#18181c] border border-white/10 focus:border-amber-400/60 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none transition-all resize-none font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotesClick}
                  disabled={!isNotesDirty}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isNotesDirty
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 active:scale-95'
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/05'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvează Nota</span>
                </button>
              </div>
            </div>

            {/* Secțiunea 2: Timeline Istoric Cronologic Invers (Ticket 03) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Cronologie Activitate ({auditEntries.length})
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">Cel mai recent primul</span>
              </div>

              {auditEntries.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-zinc-300 font-bold text-xs">Niciun eveniment înregistrat</div>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Evenimentele de gestiune (modificări de preț, status, TVA, cheltuieli) vor fi înregistrate automat aici.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-zinc-800 ml-3.5 pl-6 space-y-6 pt-2 pb-2">
                  {auditEntries.map((entry) => {
                    const badge = getActionBadge(entry.action);
                    return (
                      <div key={entry.id} className="relative group">
                        {/* Punct pe linie */}
                        <div 
                          className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#0e0e11] ${badge.dot} shadow-md`}
                        />

                        {/* Card Eveniment */}
                        <div className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {formatAuditDate(entry.timestamp)}
                            </span>
                          </div>

                          <div className="font-bold text-white text-xs leading-snug">
                            {entry.title}
                          </div>

                          <div className="text-[11px] text-zinc-300 leading-relaxed">
                            {entry.details}
                          </div>

                          {/* Comparativ vechi -> nou */}
                          {entry.oldValue !== undefined && entry.newValue !== undefined && (
                            <div className="p-2 rounded-lg bg-black/50 border border-white/05 flex items-center gap-2 text-[11px] font-mono">
                              <span className="text-rose-400 line-through truncate max-w-[140px]">
                                {String(entry.oldValue)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="text-emerald-400 font-bold truncate max-w-[140px]">
                                {String(entry.newValue)}
                              </span>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/[0.04]">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-500" />
                              {entry.author || 'Echipa RXM / Admin'}
                            </span>
                            <span className="font-mono text-zinc-600">ID: {entry.id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer Drawer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#121215] flex items-center justify-between text-xs text-zinc-400 shrink-0">
            <span className="text-[11px] text-zinc-500">
              Registru Audit Intern RXM • Jurnal Securizat
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Închide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
